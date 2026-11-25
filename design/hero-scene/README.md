# Hero scene — « la galerie des lanternes »

The home-page hero (`public/hero-galerie-wide.jpg`, `public/hero-galerie-tall.jpg`) is an
original 3D render, not a stock photo. An arcade of pointed arches at night: cream
plaster, gold rims, emerald niches. Pierced brass lanterns throw 8-point (khatam) stars
onto the niches, and the zellige floor reflects them.

`scene.py` builds the whole scene procedurally (no assets to download) and renders it
with Cycles. It was made with Blender 5.2; a GTX 1660 Ti takes about 6 minutes for the
wide frame and 3 minutes for the tall one.

## Re-render

```bash
# preview (960×540, ~10 s) — iterate on this
blender --background --factory-startup --python scene.py -- preview out.png

# wide hero (2560×1440) — desktop
HAZE=0.01 LANTERN_W=100 FILL=200 \
  blender --background --factory-startup --python scene.py -- final hero-wide.png

# tall hero (1080×1920) — phones
HAZE=0.01 LANTERN_W=100 FILL=200 RES=1080,1920 LENS=22 \
  CAM=-3.1,-1.6,1.15 TGT=0.2,6.0,2.35 \
  blender --background --factory-startup --python scene.py -- final hero-tall.png
```

Then compress to JPG (quality 80, mozjpeg) into `public/` under the same file names.
Next.js serves AVIF/WebP at the right width from there.

## Knobs (environment variables)

| Var | Default | Effect |
| --- | --- | --- |
| `LANTERN_W` | 70 | Lantern power in watts (the scene was shot at 100) |
| `LANTERN_X` | 0.2 | Lantern depth. Positive hangs it in the niche mouth; negative hangs it in front of the wall from the ceiling (dramatic diamonds on the facade) |
| `FILL` | 260 | Warm off-frame fill that reveals the cream plaster (shot at 200) |
| `HAZE` | 0 | World volume density, which gives lamp halos (shot at 0.01) |
| `MIH_X` | -2.0 | X position of the lit mihrab at the end of the gallery |
| `CAM` / `TGT` | see script | Camera position and look-at point |
| `LENS` | 28 | Focal length in mm |
| `RES` | — | Override the resolution, e.g. `1080,1920` |

Keep the wide frame's left third calm: the headline sits there.
