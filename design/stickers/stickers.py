"""
Mussalla de Montréal — 3D reward stickers for the children's space.

Four toy-like badges a teacher can award (StickerKind): « etoile » (gold 8-point star),
« croissant » (turquoise crescent + little star), « livre » (open book, emerald cover,
coral ribbon), « lanterne » (violet lantern, glowing glass). No faces, no creatures —
the same motifs as the rest of the site.

Rendered with Cycles on a transparent background with a soft contact shadow.
Run:  blender --background --factory-startup --python stickers.py -- <out_dir> [size]
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = argv[0] if argv else "//stickers"
SIZE = int(argv[1]) if len(argv) > 1 else 512

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def mat(name, hexcol, rough=0.3, metal=0.0, coat=0.4, emit=None, emit_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*srgb(hexcol), 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = 0.08
    if emit:
        b.inputs["Emission Color"].default_value = (*srgb(emit), 1)
        b.inputs["Emission Strength"].default_value = emit_strength
    return m


GOLD = mat("gold", "#ffc22e", rough=0.16, metal=1.0, coat=0.3)
TURQ = mat("turquoise", "#22c3b5", rough=0.28, coat=0.6)
EMERALD = mat("emerald", "#16a374", rough=0.3, coat=0.5)
CREAM = mat("pages", "#fff4dc", rough=0.55, coat=0.0)
INK = mat("ink", "#2f8f6f", rough=0.6, coat=0.0)
CORAL = mat("coral", "#ff6f61", rough=0.32, coat=0.5)
VIOLET = mat("violet", "#7b3fe4", rough=0.26, coat=0.6)
GLASS = mat("glow", "#ffb347", rough=0.2, coat=0.3, emit="#ff9a1f", emit_strength=9.0)


def link(ob, coll):
    coll.objects.link(ob)
    return ob


def from_bm(name, bm, coll, material):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = link(bpy.data.objects.new(name, me), coll)
    ob.data.materials.append(material)
    return ob


def bevel(ob, width=0.06, segments=5):
    m = ob.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    for p in ob.data.polygons:
        p.use_smooth = True
    return m


def prism_from_outline(name, pts, depth, coll, material):
    """Extrude a 2D outline (XZ plane, facing the camera along -Y) by `depth` along Y."""
    bm = bmesh.new()
    front = [bm.verts.new((x, -depth / 2, z)) for (x, z) in pts]
    back = [bm.verts.new((x, depth / 2, z)) for (x, z) in pts]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((front[i], front[j], back[j], back[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return from_bm(name, bm, coll, material)


def star_pts(r_out=1.0, r_in=0.62, n=8, rot=math.pi / 8):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rot + i * math.pi / n
        pts.append((r * math.cos(a), r * math.sin(a)))
    return pts


def new_coll(name):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c


# ── 1. Étoile — chunky gold khatam star ───────────────────────────────────
c_star = new_coll("etoile")
star = prism_from_outline("star", star_pts(1.0, 0.66), 0.34, c_star, GOLD)
bevel(star, 0.09, 6)
inner = prism_from_outline("star_inner", star_pts(0.46, 0.3), 0.42, c_star, GOLD)
bevel(inner, 0.05, 4)

# ── 2. Croissant — turquoise crescent with a little gold star ─────────────
c_moon = new_coll("croissant")


def disc(name, radius, depth, material, coll, segments=96):
    """A cylinder facing the camera (axis along Y)."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segments, radius1=radius, radius2=radius, depth=depth)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=__import__("mathutils").Matrix.Rotation(math.radians(90), 3, "X"))
    return from_bm(name, bm, coll, material)


moon = disc("moon", 1.0, 0.36, TURQ, c_moon)
moon.location.x = -0.12
cutter = disc("moon_cut", 0.86, 1.2, TURQ, c_moon)
cutter.location = (0.36, 0, 0.2)
cutter.hide_render = True
cutter.display_type = "WIRE"
cut = moon.modifiers.new("cut", "BOOLEAN")
cut.operation = "DIFFERENCE"
cut.object = cutter
cut.solver = "EXACT"
bevel(moon, 0.07, 6)
mini = prism_from_outline("moon_star", [(x * 0.3 + 0.48, z * 0.3 + 0.02) for (x, z) in star_pts(1.0, 0.5, 5, math.pi / 2)], 0.26, c_moon, GOLD)
bevel(mini, 0.04, 4)

# ── 3. Livre — open book ──────────────────────────────────────────────────
c_book = new_coll("livre")


def slab(name, w, d, h, material, coll):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * w, v.co.y * d, v.co.z * h))
    return from_bm(name, bm, coll, material)


for side in (-1, 1):
    cover = slab(f"cover_{side}", 1.12, 0.12, 1.5, EMERALD, c_book)
    cover.location = (side * 0.56, 0.06, 0)
    cover.rotation_euler = (0, 0, side * math.radians(-16))
    bevel(cover, 0.04, 4)
    pages = slab(f"pages_{side}", 1.0, 0.16, 1.36, CREAM, c_book)
    pages.location = (side * 0.52, -0.08, 0)
    pages.rotation_euler = (0, 0, side * math.radians(-16))
    bevel(pages, 0.05, 4)
    # five lines of « writing » per page, so it reads as a book at sticker size
    for k, z in enumerate((0.42, 0.24, 0.06, -0.12, -0.3)):
        line = slab(f"line_{side}_{k}", 0.66 if k % 2 == 0 else 0.5, 0.012, 0.055, INK, c_book)
        line.parent = pages
        line.location = (side * (0.02 if k % 2 == 0 else -0.06), -0.086, z)
ribbon = slab("ribbon", 0.16, 0.05, 0.7, CORAL, c_book)
ribbon.location = (0.02, -0.2, -0.82)
bevel(ribbon, 0.02, 3)
for o in c_book.objects:
    o.location.z += 0.12

# ── 4. Lanterne — violet lantern with glowing glass ───────────────────────
c_lan = new_coll("lanterne")
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=8, radius1=0.5, radius2=0.5, depth=0.95)
glass = from_bm("glass", bm, c_lan, GLASS)
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=8, radius1=0.52, radius2=0.52, depth=0.97)
frame = from_bm("frame", bm, c_lan, VIOLET)
wf = frame.modifiers.new("wire", "WIREFRAME")
wf.thickness = 0.075
wf.use_even_offset = True
bevel(frame, 0.015, 2)
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=8, radius1=0.62, radius2=0.16, depth=0.42)
cap = from_bm("cap", bm, c_lan, VIOLET)
cap.location.z = 0.69
bevel(cap, 0.04, 3)
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=8, radius1=0.2, radius2=0.6, depth=0.18)
base = from_bm("base", bm, c_lan, GOLD)
base.location.z = -0.57
bevel(base, 0.03, 3)
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=0.11)
knob = from_bm("knob", bm, c_lan, GOLD)
knob.location.z = 0.98
for p in knob.data.polygons:
    p.use_smooth = True
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=32, radius1=0.17, radius2=0.17, depth=0.05)
ring = from_bm("ring", bm, c_lan, GOLD)
ring.location.z = 1.14
ring.rotation_euler = (math.radians(90), 0, 0)
sol = ring.modifiers.new("solid", "SOLIDIFY")
sol.thickness = 0.05
for o in c_lan.objects:
    o.scale = (1.05, 1.05, 1.05)
    o.location.z *= 1.05
    o.location.z -= 0.08
light = bpy.data.lights.new("lantern_light", "POINT")
light.energy = 18
light.color = (1.0, 0.7, 0.35)
lo = bpy.data.objects.new("lantern_light", light)
lo.location = (0, 0, -0.08)
c_lan.objects.link(lo)

# ── shared stage: tilt, shadow catcher, lights, camera ────────────────────
TILTS = {
    "etoile": (math.radians(14), 0, math.radians(-12)),
    "croissant": (math.radians(12), 0, math.radians(14)),
    "livre": (math.radians(24), 0, math.radians(-8)),
    "lanterne": (math.radians(6), 0, math.radians(18)),
}
for name, coll in (("etoile", c_star), ("croissant", c_moon), ("livre", c_book), ("lanterne", c_lan)):
    pivot = bpy.data.objects.new(f"pivot_{name}", None)
    coll.objects.link(pivot)
    for o in list(coll.objects):
        if o is not pivot and o.parent is None:
            o.parent = pivot
    pivot.rotation_euler = TILTS[name]

bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=6)
floor_me = bpy.data.meshes.new("catcher")
bm.to_mesh(floor_me)
bm.free()
catcher = bpy.data.objects.new("catcher", floor_me)
scene.collection.objects.link(catcher)
catcher.location = (0, 0, -1.25)
catcher.is_shadow_catcher = True

world = bpy.data.worlds.new("studio")
scene.world = world
world.use_nodes = True
bgn = world.node_tree.nodes["Background"]
bgn.inputs["Color"].default_value = (*srgb("#fff6ea"), 1)
bgn.inputs["Strength"].default_value = 0.55


def area(name, loc, energy, size, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, "AREA")
    l.energy = energy
    l.size = size
    l.color = color
    o = bpy.data.objects.new(name, l)
    scene.collection.objects.link(o)
    o.location = loc
    d = Vector((0, 0, 0)) - Vector(loc)
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


area("key", (-3.2, -4.0, 4.5), 420, 3.5, (1.0, 0.96, 0.9))
area("rim", (3.5, 3.0, 3.0), 380, 2.5, (0.85, 0.92, 1.0))
area("fill", (3.5, -4.5, 0.5), 110, 4.0)

cam = bpy.data.cameras.new("cam")
cam.type = "ORTHO"
cam.ortho_scale = 2.9
co = bpy.data.objects.new("cam", cam)
scene.collection.objects.link(co)
co.location = (0, -8, 0.6)
co.rotation_euler = (Vector((0, 0, -0.05)) - co.location).to_track_quat("-Z", "Y").to_euler()
scene.camera = co

scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
for t in ("CUDA", "OPTIX"):
    try:
        prefs.compute_device_type = t
        prefs.refresh_devices()
        if [d for d in prefs.devices if d.type == t]:
            for d in prefs.devices:
                d.use = d.type == t
            scene.cycles.device = "GPU"
            break
    except Exception:
        pass
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = SIZE
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
try:
    # Standard, not AgX: stickers for children want candy-bright, saturated colour.
    scene.view_settings.view_transform = "Standard"
except Exception:
    pass

ALL = {"etoile": c_star, "croissant": c_moon, "livre": c_book, "lanterne": c_lan}
os.makedirs(OUT, exist_ok=True)
for name in ALL:
    for other, coll in ALL.items():
        coll.hide_render = other != name
    scene.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("STICKER", name)
print("STICKERS_DONE")
