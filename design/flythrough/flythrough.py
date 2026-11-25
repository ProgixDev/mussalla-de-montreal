"""
Mussalla de Montréal — « Chaque don allume une lumière ».

A camera flies down a gallery of pointed arches at night. The lanterns in the niches
light up one pair at a time as the camera passes, until the grand mihrab at the end
of the hall ignites. The website scrubs through these frames as the visitor scrolls.

Run (frames land in <out_dir>/f_0001.png …):
  blender --background --factory-startup --python flythrough.py -- <out_dir> [still|anim]

Environment knobs:
  RES=1280,720      output resolution (portrait: RES=720,1280 LENS=18)
  LENS=24           focal length (mm)
  SAMPLES=64        Cycles samples per frame
  FRAMES=120        animation length
  HAZE=0.006        world volume density (0 = off, faster)
  STILL=1           frame to render in "still" mode
"""
import bpy, bmesh, math, os, sys, time
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT_DIR = argv[0] if argv else "//frames"
MODE = argv[1] if len(argv) > 1 else "still"
env = os.environ.get
RES = tuple(int(v) for v in env("RES", "1280,720").split(","))
LENS = float(env("LENS", "24"))
SAMPLES = int(env("SAMPLES", "64"))
FRAMES = int(env("FRAMES", "120"))
HAZE = float(env("HAZE", "0.006"))
STILL = int(env("STILL", "1"))
t0 = time.time()

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


# ── helpers ──────────────────────────────────────────────────────────────
def srgb(hexstr):
    h = hexstr.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def link(ob):
    scene.collection.objects.link(ob)
    return ob


def mesh_from_bm(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me))


def principled(name, hexcol, rough=0.5, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*srgb(hexcol), 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m, b


def star_mask(nt, vec_socket, su, sv, radius):
    """1 inside a tiled 8-point khatam star, else 0."""
    N, L = nt.nodes, nt.links
    mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (su, sv, 1)
    L.new(vec_socket, mp.inputs["Vector"])
    fr = N.new("ShaderNodeVectorMath"); fr.operation = "FRACTION"; L.new(mp.outputs[0], fr.inputs[0])
    sub = N.new("ShaderNodeVectorMath"); sub.operation = "SUBTRACT"
    sub.inputs[1].default_value = (0.5, 0.5, 0); L.new(fr.outputs[0], sub.inputs[0])
    ab = N.new("ShaderNodeVectorMath"); ab.operation = "ABSOLUTE"; L.new(sub.outputs[0], ab.inputs[0])
    sep = N.new("ShaderNodeSeparateXYZ"); L.new(ab.outputs[0], sep.inputs[0])
    d1 = N.new("ShaderNodeMath"); d1.operation = "MAXIMUM"
    L.new(sep.outputs[0], d1.inputs[0]); L.new(sep.outputs[1], d1.inputs[1])
    s = N.new("ShaderNodeMath"); s.operation = "ADD"
    L.new(sep.outputs[0], s.inputs[0]); L.new(sep.outputs[1], s.inputs[1])
    d2 = N.new("ShaderNodeMath"); d2.operation = "MULTIPLY"; d2.inputs[1].default_value = 0.70710678
    L.new(s.outputs[0], d2.inputs[0])
    mn = N.new("ShaderNodeMath"); mn.operation = "MINIMUM"
    L.new(d1.outputs[0], mn.inputs[0]); L.new(d2.outputs[0], mn.inputs[1])
    lt = N.new("ShaderNodeMath"); lt.operation = "LESS_THAN"; lt.inputs[1].default_value = radius
    L.new(mn.outputs[0], lt.inputs[0])
    return lt.outputs[0]


def arch_profile(w, hs, c_ratio=0.2, seg=28, base=-0.1):
    hw, c = w / 2, w * c_ratio
    r = hw + c
    t_a = math.acos(-c / r)
    left = []
    for i in range(1, seg + 1):
        t = math.pi + (t_a - math.pi) * i / seg
        left.append((c + r * math.cos(t), hs + r * math.sin(t)))
    right = [(-x, z) for (x, z) in reversed(left[:-1])]
    return [(-hw, base), (-hw, hs)] + left + right + [(hw, hs), (hw, base)], hs + r * math.sin(t_a)


def prism(name, pts2d, axis, a0, a1, centre, mat):
    """Extrude a 2D outline (u = horizontal, v = height) along X (axis='x') or Y."""
    bm = bmesh.new()
    if axis == "x":
        A = [bm.verts.new((a0, centre + u, v)) for (u, v) in pts2d]
        B = [bm.verts.new((a1, centre + u, v)) for (u, v) in pts2d]
    else:
        A = [bm.verts.new((centre + u, a0, v)) for (u, v) in pts2d]
        B = [bm.verts.new((centre + u, a1, v)) for (u, v) in pts2d]
    n = len(pts2d)
    bm.faces.new(A); bm.faces.new(list(reversed(B)))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((A[i], A[j], B[j], B[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = mesh_from_bm(name, bm)
    ob.data.materials.append(mat)
    return ob


def box(name, x0, x1, y0, y1, z0, z1, mat=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((x0 + (v.co.x + 0.5) * (x1 - x0), y0 + (v.co.y + 0.5) * (y1 - y0),
                       z0 + (v.co.z + 0.5) * (z1 - z0)))
    ob = mesh_from_bm(name, bm)
    if mat:
        ob.data.materials.append(mat)
    return ob


def cut(target, cutters_coll, name):
    m = target.modifiers.new(name, "BOOLEAN")
    m.operation = "DIFFERENCE"; m.operand_type = "COLLECTION"; m.collection = cutters_coll
    m.solver = "EXACT"
    try:
        m.material_mode = "TRANSFER"
    except Exception:
        pass


def cutter_coll(name):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c


def as_cutter(ob, coll):
    scene.collection.objects.unlink(ob)
    coll.objects.link(ob)
    ob.hide_render = True
    ob.display_type = "WIRE"


# ── materials ────────────────────────────────────────────────────────────
plaster, pb = principled("plaster", "#e6d8bd", rough=0.82)
nt = plaster.node_tree
nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 9.0; nz.inputs["Detail"].default_value = 8.0
bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.08
nt.links.new(nz.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], pb.inputs["Normal"])

niche, nb = principled("niche", "#0f4733", rough=0.55)
nt = niche.node_tree
tc = nt.nodes.new("ShaderNodeTexCoord")
sp = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(tc.outputs["Object"], sp.inputs[0])
ad = nt.nodes.new("ShaderNodeMath"); ad.operation = "ADD"
nt.links.new(sp.outputs[0], ad.inputs[0]); nt.links.new(sp.outputs[1], ad.inputs[1])
cb = nt.nodes.new("ShaderNodeCombineXYZ"); nt.links.new(ad.outputs[0], cb.inputs[0]); nt.links.new(sp.outputs[2], cb.inputs[1])
mk = star_mask(nt, cb.outputs[0], 3.2, 3.2, 0.3)
mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"
mx.inputs[6].default_value = (*srgb("#0f4733"), 1); mx.inputs[7].default_value = (*srgb("#1d6649"), 1)
nt.links.new(mk, mx.inputs[0]); nt.links.new(mx.outputs[2], nb.inputs["Base Color"])

gold, _ = principled("gold", "#c9a24b", rough=0.28, metal=1.0)
wood, _ = principled("wood", "#3a2717", rough=0.6)

floor, fb = principled("zellige", "#0f5a40", rough=0.16)
nt = floor.node_tree
tcf = nt.nodes.new("ShaderNodeTexCoord")
br = nt.nodes.new("ShaderNodeTexBrick"); br.offset = 0.0
for k, v in (("Scale", 1.0), ("Brick Width", 0.26), ("Row Height", 0.26), ("Mortar Size", 0.0035), ("Bias", 0.0)):
    br.inputs[k].default_value = v
br.inputs["Color1"].default_value = (*srgb("#0f5a40"), 1)
br.inputs["Color2"].default_value = (*srgb("#0a3e2c"), 1)
br.inputs["Mortar"].default_value = (*srgb("#33453a"), 1)
nt.links.new(tcf.outputs["Object"], br.inputs["Vector"]); nt.links.new(br.outputs["Color"], fb.inputs["Base Color"])
rm = nt.nodes.new("ShaderNodeMapRange"); rm.inputs["To Min"].default_value = 0.12; rm.inputs["To Max"].default_value = 0.75
nt.links.new(br.outputs["Fac"], rm.inputs["Value"]); nt.links.new(rm.outputs["Result"], fb.inputs["Roughness"])

brass = bpy.data.materials.new("brass_pierced"); brass.use_nodes = True
nt = brass.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
o = nt.nodes.new("ShaderNodeOutputMaterial")
bs = nt.nodes.new("ShaderNodeBsdfPrincipled")
bs.inputs["Base Color"].default_value = (*srgb("#b8893a"), 1)
bs.inputs["Metallic"].default_value = 1.0; bs.inputs["Roughness"].default_value = 0.34
tr = nt.nodes.new("ShaderNodeBsdfTransparent")
uvn = nt.nodes.new("ShaderNodeUVMap")
holes = star_mask(nt, uvn.outputs["UV"], 10.0, 3.0, 0.27)
ms = nt.nodes.new("ShaderNodeMixShader")
nt.links.new(holes, ms.inputs["Fac"]); nt.links.new(bs.outputs[0], ms.inputs[1])
nt.links.new(tr.outputs[0], ms.inputs[2]); nt.links.new(ms.outputs[0], o.inputs["Surface"])

brass_solid, _ = principled("brass", "#b8893a", rough=0.3, metal=1.0)


def flame_material(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    t = m.node_tree
    for n in list(t.nodes):
        t.nodes.remove(n)
    e = t.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (1.0, 0.66, 0.34, 1)
    e.inputs["Strength"].default_value = 18.0
    out = t.nodes.new("ShaderNodeOutputMaterial")
    t.links.new(e.outputs[0], out.inputs["Surface"])
    return m, e.inputs["Strength"]


# ── lanterns ─────────────────────────────────────────────────────────────
LANTERNS = []  # (y, light_data, flame_strength_socket, power)


def lantern(name, x, y, z, anchor_z, s=1.0, power=100.0):
    R, H = 0.15 * s, 0.34 * s
    bm = bmesh.new(); bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=40, radius1=R, radius2=R, depth=H, calc_uvs=True)
    body = mesh_from_bm(name + "_body", bm); body.data.materials.append(brass); body.location = (x, y, z)
    for p in body.data.polygons:
        p.use_smooth = True
    bm = bmesh.new(); bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=20, radius=R * 1.04, calc_uvs=True)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -1e-4], context="VERTS")
    for v in bm.verts:
        v.co.z *= 0.8
    dome = mesh_from_bm(name + "_dome", bm); dome.data.materials.append(brass); dome.location = (x, y, z + H / 2)
    for p in dome.data.polygons:
        p.use_smooth = True
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=24, radius1=R * 1.05, radius2=R * 0.35, depth=0.08 * s)
    dish = mesh_from_bm(name + "_dish", bm); dish.data.materials.append(brass_solid)
    dish.rotation_euler = (math.pi, 0, 0); dish.location = (x, y, z - H / 2 - 0.04 * s)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=16, radius1=0.035 * s, radius2=0.0, depth=0.14 * s)
    fin = mesh_from_bm(name + "_finial", bm); fin.data.materials.append(brass_solid)
    fin.location = (x, y, z + H / 2 + R * 0.8 + 0.06 * s)
    top = z + H / 2 + R * 0.8 + 0.13 * s
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=8, radius1=0.006, radius2=0.006, depth=1.0)
    ch = mesh_from_bm(name + "_chain", bm); ch.data.materials.append(brass_solid)
    L = max(0.2, anchor_z - top); ch.scale = (1, 1, L); ch.location = (x, y, top + L / 2)

    fmat, strength = flame_material(name + "_flame")
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=0.022 * s)
    core = mesh_from_bm(name + "_core", bm); core.data.materials.append(fmat)
    core.location = (x, y, z - 0.03 * s); core.visible_shadow = False

    ld = bpy.data.lights.new(name + "_light", "POINT")
    ld.energy = power; ld.color = (1.0, 0.64, 0.33); ld.shadow_soft_size = 0.007
    lo = bpy.data.objects.new(name + "_light", ld); lo.location = (x, y, z - 0.03 * s); link(lo)
    LANTERNS.append((y, ld, strength, power))


# ── architecture: a gallery with an arcade on BOTH sides ─────────────────
W = 2.8           # half-width of the hall (faces at x = ±W)
T = 1.2           # wall thickness
ND = 0.75         # niche depth
ARCH_W, ARCH_HS = 1.7, 2.35
YS = [3.0 * i for i in range(8)]          # 0 … 21
END_Y = 25.0
CEIL = 5.4

prof, apex = arch_profile(ARCH_W, ARCH_HS)
rim, _ = arch_profile(ARCH_W + 0.2, ARCH_HS)

for side in (+1, -1):
    face = side * W
    wall = box(f"wall_{side}", min(face, face + side * T), max(face, face + side * T), -12, END_Y + 1, 0, CEIL + 0.3, plaster)
    wall.data.materials.append(gold); wall.data.materials.append(niche)
    cc = cutter_coll(f"cut_{side}")
    for i, y in enumerate(YS):
        r = prism(f"rim_{side}_{i}", rim, "x", face - side * 0.05, face + side * 0.035, y, gold)
        n = prism(f"niche_{side}_{i}", prof, "x", face - side * 0.06, face + side * ND, y, niche)
        as_cutter(r, cc); as_cutter(n, cc)
        lantern(f"lan_{side}_{i}", face + side * 0.2, y, 1.95, anchor_z=apex - 0.05)
    cut(wall, cc, "arches")
    # gold cornice above the arcade
    box(f"cornice_{side}", min(face, face - side * 0.08), max(face, face - side * 0.08), -12, END_Y, 4.05, 4.22, gold)

# End wall with the grand mihrab.
endw = box("endwall", -W - T, W + T, END_Y, END_Y + 1.4, 0, CEIL + 0.3, plaster)
endw.data.materials.append(gold); endw.data.materials.append(niche)
ce = cutter_coll("cut_end")
mprof, mapex = arch_profile(2.5, 3.0)
mrim, _ = arch_profile(2.85, 3.0)
as_cutter(prism("mih_rim", mrim, "y", END_Y - 0.06, END_Y + 0.05, 0.0, gold), ce)
as_cutter(prism("mih_niche", mprof, "y", END_Y - 0.06, END_Y + 1.0, 0.0, niche), ce)
cut(endw, ce, "mihrab")
lantern("lan_mihrab", 0.0, END_Y + 0.5, 2.45, anchor_z=mapex - 0.05, s=1.5, power=160.0)

# Ceiling + dark cedar beams every bay (depth rhythm for the fly-through).
box("ceiling", -W - T, W + T, -12, END_Y + 1, CEIL, CEIL + 0.2, plaster)
for i, y in enumerate([-3.0 + 3.0 * k for k in range(10)]):
    box(f"beam_{i}", -W, W, y + 1.38, y + 1.62, CEIL - 0.28, CEIL, wood)

box("floor", -W - T, W + T, -12, END_Y + 2, -0.1, 0.0, floor)

# ── world, haze, fill ────────────────────────────────────────────────────
world = bpy.data.worlds.new("night"); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (*srgb("#1b2a22"), 1); bg.inputs["Strength"].default_value = 0.35
if HAZE > 0:
    vol = world.node_tree.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = HAZE; vol.inputs["Anisotropy"].default_value = 0.35
    vol.inputs["Color"].default_value = (1.0, 0.92, 0.8, 1)
    world.node_tree.links.new(vol.outputs[0], world.node_tree.nodes["World Output"].inputs["Volume"])

# A faint cool moonlight so the unlit hall still reads as architecture at the start.
moon = bpy.data.lights.new("moon", "AREA"); moon.energy = 60.0; moon.size = 4.0; moon.color = (0.70, 0.80, 0.95)
mo = bpy.data.objects.new("moon", moon); mo.location = (0, 6, CEIL - 0.3); link(mo)

# ── camera path + ignition ───────────────────────────────────────────────
cam = bpy.data.cameras.new("cam"); cam.lens = LENS
co = bpy.data.objects.new("cam", cam); link(co); scene.camera = co
co.rotation_euler = (math.radians(87), 0, 0)  # looking down +Y, a breath upward

scene.frame_start, scene.frame_end = 1, FRAMES
F_MAIN = round(FRAMES * 0.82)   # steady walk …
Y0, Y1, Y2 = -5.5, 15.5, 17.6   # … then a slow final approach to the mihrab


def cam_y(f):
    if f <= F_MAIN:
        return Y0 + (Y1 - Y0) * (f - 1) / (F_MAIN - 1)
    return Y1 + (Y2 - Y1) * (f - F_MAIN) / max(1, FRAMES - F_MAIN)


for f in range(1, FRAMES + 1):
    co.location = (0.0, cam_y(f), 1.58 + 0.07 * (f - 1) / (FRAMES - 1))
    co.keyframe_insert("location", frame=f)

IGNITE_AHEAD = 8.0  # a pair lights when the camera is this far before it
for (y, ld, strength, power) in LANTERNS:
    if y > END_Y - 1:   # the mihrab: lights during the final approach
        f_on = F_MAIN + 4
    else:
        f_on = next((f for f in range(1, FRAMES + 1) if cam_y(f) >= y - IGNITE_AHEAD), 1)
    if f_on <= 2:  # already burning when the visitor arrives
        continue
    for frame, k in ((f_on - 1, 0.0), (f_on + 2, 1.35), (f_on + 5, 0.9), (f_on + 8, 1.0)):
        ld.energy = power * k; ld.keyframe_insert("energy", frame=max(1, frame))
        strength.default_value = 18.0 * k; strength.keyframe_insert("default_value", frame=max(1, frame))

# Linear timing everywhere: the visitor's scroll IS the easing.
for ob in [co] + [l for l in bpy.data.lights]:
    ad = ob.animation_data
    if ad and ad.action:
        try:
            for fc in ad.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"
        except AttributeError:
            pass

# ── render settings ──────────────────────────────────────────────────────
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
dev = "CPU"
for t in ("CUDA", "OPTIX"):
    try:
        prefs.compute_device_type = t; prefs.refresh_devices()
        if [d for d in prefs.devices if d.type == t]:
            for d in prefs.devices:
                d.use = d.type == t
            dev = t
            break
    except Exception:
        pass
scene.cycles.device = "GPU" if dev != "CPU" else "CPU"
cy = scene.cycles
cy.samples = SAMPLES; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.03
cy.use_denoising = True
cy.caustics_reflective = False; cy.caustics_refractive = False
cy.sample_clamp_indirect = 8.0; cy.max_bounces = 6; cy.transparent_max_bounces = 12
cy.volume_bounces = 0
cy.seed = 7; cy.use_animated_seed = False
scene.render.use_persistent_data = True
scene.render.resolution_x, scene.render.resolution_y = RES
scene.render.resolution_percentage = 100
vs = scene.view_settings
try:
    vs.view_transform = "AgX"; vs.look = "AgX - Medium High Contrast"
except Exception:
    pass
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_depth = "8"
scene.render.filepath = os.path.join(OUT_DIR, "f_####")

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, "flythrough.blend"))
if MODE == "anim":
    bpy.ops.render.render(animation=True)
else:
    scene.frame_set(STILL)
    scene.render.filepath = os.path.join(OUT_DIR, f"still_{STILL:04d}.png")
    bpy.ops.render.render(write_still=True)
print(f"FLY_DONE dev={dev} mode={MODE} lanterns={len(LANTERNS)} secs={time.time() - t0:.1f}")
