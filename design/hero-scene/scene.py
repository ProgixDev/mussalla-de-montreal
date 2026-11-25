"""
Mussalla de Montréal — hero scene « la galerie des lanternes ».
An arcade of pointed arches at night: cream plaster, gold rims, emerald niches,
pierced brass lanterns throwing 8-point-star light, glossy zellige floor.

Run:  blender --background --factory-startup --python scene.py -- <preview|final> <out.png> [blend_out]
"""
import bpy, bmesh, math, sys, time
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
MODE = argv[0] if argv else "preview"
OUT = argv[1] if len(argv) > 1 else "//render.png"
BLEND_OUT = argv[2] if len(argv) > 2 else None
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


def star_mask(nt, vec_socket, scale_u, scale_v, radius):
    """1 inside an 8-point khatam star tiled over the given UVs, else 0."""
    N = nt.nodes
    L = nt.links
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale_u, scale_v, 1)
    L.new(vec_socket, mp.inputs["Vector"])
    fr = N.new("ShaderNodeVectorMath"); fr.operation = "FRACTION"
    L.new(mp.outputs[0], fr.inputs[0])
    sub = N.new("ShaderNodeVectorMath"); sub.operation = "SUBTRACT"
    sub.inputs[1].default_value = (0.5, 0.5, 0)
    L.new(fr.outputs[0], sub.inputs[0])
    ab = N.new("ShaderNodeVectorMath"); ab.operation = "ABSOLUTE"
    L.new(sub.outputs[0], ab.inputs[0])
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(ab.outputs[0], sep.inputs[0])
    d1 = N.new("ShaderNodeMath"); d1.operation = "MAXIMUM"
    L.new(sep.outputs[0], d1.inputs[0]); L.new(sep.outputs[1], d1.inputs[1])
    s = N.new("ShaderNodeMath"); s.operation = "ADD"
    L.new(sep.outputs[0], s.inputs[0]); L.new(sep.outputs[1], s.inputs[1])
    d2 = N.new("ShaderNodeMath"); d2.operation = "MULTIPLY"
    d2.inputs[1].default_value = 0.70710678
    L.new(s.outputs[0], d2.inputs[0])
    mn = N.new("ShaderNodeMath"); mn.operation = "MINIMUM"
    L.new(d1.outputs[0], mn.inputs[0]); L.new(d2.outputs[0], mn.inputs[1])
    lt = N.new("ShaderNodeMath"); lt.operation = "LESS_THAN"
    lt.inputs[1].default_value = radius
    L.new(mn.outputs[0], lt.inputs[0])
    return lt.outputs[0]


def arch_profile(w, hs, c_ratio=0.2, seg=28, base=-0.1):
    """Pointed (two-centred) arch outline in (horizontal, vertical), closed CCW."""
    hw = w / 2
    c = w * c_ratio
    r = hw + c
    t_a = math.acos(-c / r)
    left = []
    for i in range(1, seg + 1):
        t = math.pi + (t_a - math.pi) * i / seg
        left.append((c + r * math.cos(t), hs + r * math.sin(t)))
    right = [(-x, z) for (x, z) in reversed(left[:-1])]
    pts = [(-hw, base), (-hw, hs)] + left + right + [(hw, hs), (hw, base)]
    apex = hs + r * math.sin(t_a)
    return pts, apex


def prism_yz(name, pts2d, x0, x1, yc, mat=None):
    """Extrude a (y,z) outline along X from x0 to x1."""
    bm = bmesh.new()
    a = [bm.verts.new((x0, yc + u, v)) for (u, v) in pts2d]
    b = [bm.verts.new((x1, yc + u, v)) for (u, v) in pts2d]
    n = len(pts2d)
    bm.faces.new(a)
    bm.faces.new(list(reversed(b)))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = mesh_from_bm(name, bm)
    if mat:
        ob.data.materials.append(mat)
    return ob


def box(name, x0, x1, y0, y1, z0, z1, mat=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((
            x0 + (v.co.x + 0.5) * (x1 - x0),
            y0 + (v.co.y + 0.5) * (y1 - y0),
            z0 + (v.co.z + 0.5) * (z1 - z0),
        ))
    ob = mesh_from_bm(name, bm)
    if mat:
        ob.data.materials.append(mat)
    return ob


# ── materials ────────────────────────────────────────────────────────────
# Cream plaster with a faint trowelled unevenness.
plaster, pb = principled("plaster", "#e6d8bd", rough=0.82)
nt = plaster.node_tree
noise = nt.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 9.0
noise.inputs["Detail"].default_value = 8.0
bump = nt.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.08
nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
nt.links.new(bump.outputs["Normal"], pb.inputs["Normal"])

# Emerald niche interior (the vault behind the lamp) with a faint gold khatam lattice.
niche, nb = principled("niche", "#0f4733", rough=0.55)
nt = niche.node_tree
tc = nt.nodes.new("ShaderNodeTexCoord")
sepn = nt.nodes.new("ShaderNodeSeparateXYZ")
nt.links.new(tc.outputs["Object"], sepn.inputs[0])
comb = nt.nodes.new("ShaderNodeCombineXYZ")  # (x+y, z): works on walls facing X or Y
addxy = nt.nodes.new("ShaderNodeMath"); addxy.operation = "ADD"
nt.links.new(sepn.outputs[0], addxy.inputs[0]); nt.links.new(sepn.outputs[1], addxy.inputs[1])
nt.links.new(addxy.outputs[0], comb.inputs[0])
nt.links.new(sepn.outputs[2], comb.inputs[1])
m = star_mask(nt, comb.outputs[0], 3.2, 3.2, 0.3)
mixc = nt.nodes.new("ShaderNodeMix"); mixc.data_type = "RGBA"
mixc.inputs[6].default_value = (*srgb("#0f4733"), 1)
mixc.inputs[7].default_value = (*srgb("#1d6649"), 1)
nt.links.new(m, mixc.inputs[0])
nt.links.new(mixc.outputs[2], nb.inputs["Base Color"])

gold, gb = principled("gold", "#c9a24b", rough=0.28, metal=1.0)

# Zellige floor: square glazed tiles, two greens + cream grout, glossy.
floor, fb = principled("zellige", "#0f5a40", rough=0.16)
nt = floor.node_tree
tcf = nt.nodes.new("ShaderNodeTexCoord")
brick = nt.nodes.new("ShaderNodeTexBrick")
brick.offset = 0.0
brick.inputs["Scale"].default_value = 1.0
brick.inputs["Brick Width"].default_value = 0.26
brick.inputs["Row Height"].default_value = 0.26
brick.inputs["Mortar Size"].default_value = 0.0035
brick.inputs["Bias"].default_value = 0.0
brick.inputs["Color1"].default_value = (*srgb("#0f5a40"), 1)
brick.inputs["Color2"].default_value = (*srgb("#0a3e2c"), 1)
brick.inputs["Mortar"].default_value = (*srgb("#33453a"), 1)
nt.links.new(tcf.outputs["Object"], brick.inputs["Vector"])
nt.links.new(brick.outputs["Color"], fb.inputs["Base Color"])
# Grout is matte; glaze is glossy.
rmap = nt.nodes.new("ShaderNodeMapRange")
rmap.inputs["To Min"].default_value = 0.12
rmap.inputs["To Max"].default_value = 0.75
nt.links.new(brick.outputs["Fac"], rmap.inputs["Value"])
nt.links.new(rmap.outputs["Result"], fb.inputs["Roughness"])
# Hand-made glaze undulation.
fn = nt.nodes.new("ShaderNodeTexNoise"); fn.inputs["Scale"].default_value = 14.0
fbump = nt.nodes.new("ShaderNodeBump"); fbump.inputs["Strength"].default_value = 0.05
nt.links.new(fn.outputs["Fac"], fbump.inputs["Height"])
nt.links.new(fbump.outputs["Normal"], fb.inputs["Normal"])

# Pierced brass: opaque metal, transparent where the star openings are.
brass = bpy.data.materials.new("brass_pierced")
brass.use_nodes = True
nt = brass.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
outp = nt.nodes.new("ShaderNodeOutputMaterial")
bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
bsdf.inputs["Base Color"].default_value = (*srgb("#b8893a"), 1)
bsdf.inputs["Metallic"].default_value = 1.0
bsdf.inputs["Roughness"].default_value = 0.34
tr = nt.nodes.new("ShaderNodeBsdfTransparent")
uv = nt.nodes.new("ShaderNodeUVMap")
holes = star_mask(nt, uv.outputs["UV"], 10.0, 3.0, 0.27)
mixs = nt.nodes.new("ShaderNodeMixShader")
nt.links.new(holes, mixs.inputs["Fac"])
nt.links.new(bsdf.outputs[0], mixs.inputs[1])
nt.links.new(tr.outputs[0], mixs.inputs[2])
nt.links.new(mixs.outputs[0], outp.inputs["Surface"])

brass_solid, _ = principled("brass", "#b8893a", rough=0.3, metal=1.0)

bulb = bpy.data.materials.new("bulb")
bulb.use_nodes = True
nt = bulb.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
em = nt.nodes.new("ShaderNodeEmission")
em.inputs["Color"].default_value = (1.0, 0.66, 0.34, 1)
em.inputs["Strength"].default_value = 18.0
o2 = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(em.outputs[0], o2.inputs["Surface"])

# ── architecture ─────────────────────────────────────────────────────────
WALL_T = 1.2          # wall thickness (x: 0 → 1.2, face at x=0 toward camera)
NICHE_D = 0.75        # niche depth
ARCH_W = 1.7
ARCH_HS = 2.35        # springing height
SPACING = 3.0
ARCH_YS = [0.0, 3.0, 6.0, 9.0, 12.0, 15.0]

wall = box("wall", 0.0, WALL_T, -8.0, 30.0, 0.0, 6.0, plaster)
wall.data.materials.append(gold)
wall.data.materials.append(niche)

cutters = bpy.data.collections.new("cutters")
scene.collection.children.link(cutters)

prof, apex = arch_profile(ARCH_W, ARCH_HS)
rim, _ = arch_profile(ARCH_W + 0.2, ARCH_HS, base=-0.1)
for i, y in enumerate(ARCH_YS):
    r = prism_yz(f"rim_cut_{i}", rim, -0.05, 0.035, y, gold)
    n = prism_yz(f"niche_cut_{i}", prof, -0.06, NICHE_D, y, niche)
    for ob in (r, n):
        scene.collection.objects.unlink(ob)
        cutters.objects.link(ob)
        ob.hide_render = True
        ob.display_type = "WIRE"

mod = wall.modifiers.new("arches", "BOOLEAN")
mod.operation = "DIFFERENCE"
mod.operand_type = "COLLECTION"
mod.collection = cutters
mod.solver = "EXACT"
try:
    mod.material_mode = "TRANSFER"
except Exception:
    pass

# A carved plaster cornice band above the arches.
cornice = box("cornice", -0.08, 0.0, -8.0, 30.0, 4.05, 4.22, gold)

# Ceiling
box("ceiling", -16.0, WALL_T, -8.0, 21.0, 6.0, 6.2, plaster)

# Floor
box("floor", -40.0, 0.0, -20.0, 40.0, -0.1, 0.0, floor)

# ── lanterns ─────────────────────────────────────────────────────────────
def lantern(name, x, y, z, s=1.0, power=55.0):
    R, H = 0.15 * s, 0.34 * s
    bm = bmesh.new()
    bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=40,
                          radius1=R, radius2=R, depth=H, calc_uvs=True)
    body = mesh_from_bm(name + "_body", bm)
    body.data.materials.append(brass)
    body.location = (x, y, z)
    for poly in body.data.polygons:
        poly.use_smooth = True

    # Dome (upper hemisphere, squashed) + finial + base dish.
    bm = bmesh.new()
    bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=20, radius=R * 1.04, calc_uvs=True)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -1e-4], context="VERTS")
    for v in bm.verts:
        v.co.z *= 0.8
    dome = mesh_from_bm(name + "_dome", bm)
    dome.data.materials.append(brass)
    dome.location = (x, y, z + H / 2)
    for poly in dome.data.polygons:
        poly.use_smooth = True

    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=24,
                          radius1=R * 1.05, radius2=R * 0.35, depth=0.08 * s, calc_uvs=False)
    dish = mesh_from_bm(name + "_dish", bm)
    dish.data.materials.append(brass_solid)
    dish.rotation_euler = (math.pi, 0, 0)
    dish.location = (x, y, z - H / 2 - 0.04 * s)

    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=16,
                          radius1=0.035 * s, radius2=0.0, depth=0.14 * s, calc_uvs=False)
    fin = mesh_from_bm(name + "_finial", bm)
    fin.data.materials.append(brass_solid)
    fin.location = (x, y, z + H / 2 + R * 0.8 + 0.06 * s)

    top = z + H / 2 + R * 0.8 + 0.13 * s
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=8,
                          radius1=0.006, radius2=0.006, depth=1.0, calc_uvs=False)
    chain = mesh_from_bm(name + "_chain", bm)
    chain.data.materials.append(brass_solid)
    anchor = 6.0 if x < 0 else apex - 0.05
    chain_len = max(0.2, anchor - top)
    chain.scale = (1, 1, chain_len)
    chain.location = (x, y, top + chain_len / 2)

    # The flame: a small glowing core + a point light, both inside the shell.
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=0.022 * s)
    core = mesh_from_bm(name + "_core", bm)
    core.data.materials.append(bulb)
    core.location = (x, y, z - 0.03 * s)
    core.visible_shadow = False

    ld = bpy.data.lights.new(name + "_light", "POINT")
    ld.energy = power
    ld.color = (1.0, 0.64, 0.33)
    ld.shadow_soft_size = 0.007
    lo = bpy.data.objects.new(name + "_light", ld)
    lo.location = (x, y, z - 0.03 * s)
    link(lo)


LANTERN_X = float(__import__('os').environ.get('LANTERN_X', '0.2'))
LANTERN_W = float(__import__('os').environ.get('LANTERN_W', '70'))
for i, y in enumerate(ARCH_YS):
    lantern(f"lantern_{i}", LANTERN_X, y, 1.95, s=1.0, power=LANTERN_W)

# ── end wall + mihrab ────────────────────────────────────────────────────
def prism_xz(name, pts2d, y0, y1, xc, mat=None):
    bm = bmesh.new()
    a = [bm.verts.new((xc + u, y0, v)) for (u, v) in pts2d]
    b = [bm.verts.new((xc + u, y1, v)) for (u, v) in pts2d]
    n = len(pts2d)
    bm.faces.new(a)
    bm.faces.new(list(reversed(b)))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = mesh_from_bm(name, bm)
    if mat:
        ob.data.materials.append(mat)
    return ob

END_Y = 19.0
MIH_X = float(__import__('os').environ.get('MIH_X', '-2.0'))
endwall = box("endwall", -16.0, WALL_T, END_Y, END_Y + 1.4, 0.0, 6.0, plaster)
endwall.data.materials.append(gold)
endwall.data.materials.append(niche)
endcut = bpy.data.collections.new("endcut")
scene.collection.children.link(endcut)
mprof, mapex = arch_profile(2.6, 3.0)
mrim, _ = arch_profile(2.9, 3.0)
for nm, pr, y1, mt in (("mih_rim", mrim, END_Y + 0.05, gold), ("mih_niche", mprof, END_Y + 1.0, niche)):
    c = prism_xz(nm, pr, END_Y - 0.06, y1, MIH_X, mt)
    scene.collection.objects.unlink(c)
    endcut.objects.link(c)
    c.hide_render = True
    c.display_type = "WIRE"
emod = endwall.modifiers.new("mihrab", "BOOLEAN")
emod.operation = "DIFFERENCE"
emod.operand_type = "COLLECTION"
emod.collection = endcut
emod.solver = "EXACT"
try:
    emod.material_mode = "TRANSFER"
except Exception:
    pass
apex_main = apex
apex = mapex  # lantern() sizes its chain to the current arch apex
lantern("lantern_mihrab", MIH_X, END_Y + 0.5, 2.45, s=1.5, power=140.0)
apex = apex_main

# ── world + fill light ───────────────────────────────────────────────────
world = bpy.data.worlds.new("night")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (*srgb("#1b2a22"), 1)
bg.inputs["Strength"].default_value = 0.5

HAZE = float(__import__('os').environ.get('HAZE', '0'))
if HAZE > 0:
    vol = world.node_tree.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = HAZE
    vol.inputs["Anisotropy"].default_value = 0.35
    vol.inputs["Color"].default_value = (1.0, 0.92, 0.8, 1)
    world.node_tree.links.new(vol.outputs[0], world.node_tree.nodes["World Output"].inputs["Volume"])
    scene.cycles.volume_bounces = 0

# Cool moonlight from high left, very soft: gives the plaster its shape.
moon = bpy.data.lights.new("moon", "AREA")
moon.energy = 90.0
moon.size = 6.0
moon.color = (0.80, 0.86, 0.95)
mo = bpy.data.objects.new("moon", moon)
mo.location = (-9.0, 2.0, 8.0)
mo.rotation_euler = (math.radians(-40), math.radians(-48), 0)
link(mo)

# Warm fill from off-frame left (lanterns we don't see): reveals the cream plaster
# and catches the gold rims without flattening the night.
FILL = float(__import__('os').environ.get('FILL', '260'))
if FILL > 0:
    fl = bpy.data.lights.new("warm_fill", "AREA")
    fl.energy = FILL
    fl.size = 5.0
    fl.color = (1.0, 0.74, 0.46)
    fo = bpy.data.objects.new("warm_fill", fl)
    fo.location = (-7.5, 5.0, 3.6)
    fo.rotation_euler = (0.0, math.radians(-75), 0.0)
    link(fo)

# ── camera ───────────────────────────────────────────────────────────────
cam = bpy.data.cameras.new("cam")
cam.lens = float(__import__('os').environ.get('LENS', '28'))
cam.dof.use_dof = True
cam.dof.aperture_fstop = 2.8
co = bpy.data.objects.new("cam", cam)
link(co)
import os as _os
co.location = Vector(tuple(float(v) for v in _os.environ.get('CAM', '-5.4,-3.2,1.3').split(',')))
target = Vector(tuple(float(v) for v in _os.environ.get('TGT', '-1.2,7.0,2.1').split(',')))
d = target - co.location
co.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
cam.dof.focus_distance = (Vector((0.4, 3.0, 1.95)) - co.location).length
scene.camera = co

# ── render settings ──────────────────────────────────────────────────────
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
chosen = "CPU"
for t in ("CUDA", "OPTIX"):
    try:
        prefs.compute_device_type = t
        prefs.refresh_devices()
        gpus = [dv for dv in prefs.devices if dv.type == t]
        if gpus:
            for dv in prefs.devices:
                dv.use = dv.type == t
            chosen = t
            break
    except Exception:
        pass
scene.cycles.device = "GPU" if chosen != "CPU" else "CPU"

cy = scene.cycles
cy.use_adaptive_sampling = True
cy.use_denoising = True
cy.caustics_reflective = False
cy.caustics_refractive = False
cy.sample_clamp_indirect = 8.0
cy.max_bounces = 8
cy.transparent_max_bounces = 12

_res = __import__('os').environ.get('RES')
if MODE == "final":
    scene.render.resolution_x, scene.render.resolution_y = 2560, 1440
    cy.samples = 384
    cy.adaptive_threshold = 0.008
else:
    scene.render.resolution_x, scene.render.resolution_y = 960, 540
    cy.samples = 48
    cy.adaptive_threshold = 0.05
if _res:
    scene.render.resolution_x, scene.render.resolution_y = (int(v) for v in _res.split(","))
scene.render.resolution_percentage = 100

vs = scene.view_settings
try:
    vs.view_transform = "AgX"
    vs.look = "AgX - Medium High Contrast"
except Exception:
    pass
vs.exposure = 0.0

scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_depth = "8"
scene.render.filepath = OUT

if BLEND_OUT:
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)

bpy.ops.render.render(write_still=True)
print(f"RENDER_DONE device={chosen} mode={MODE} secs={time.time() - t0:.1f} out={OUT}")
