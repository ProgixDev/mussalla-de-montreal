# Fly-through — « Chaque don allume une lumière »

The home page opens as a walk down the mussalla's gallery at night. A camera advances
between two arcades of pointed arches. The pierced brass lanterns in the niches light
up pair by pair as it passes, throwing khatam stars onto the emerald niches. At the end
of the hall the grand mihrab ignites.

The website does not play a video. It **scrubs frames with the scroll**
(`src/features/flythrough`): a sticky canvas draws frame `n` for the scroll position and
cross-fades into `n+1` by the fractional part. The visitor's scroll IS the camera.

`flythrough.py` builds the whole scene procedurally (no downloaded assets) and renders
it with Cycles. Made with Blender 5.2; about 22 s per frame on a GTX 1660 Ti.

## Re-render

```bash
# one still to check a change (frame 60, ~30 s)
STILL=60 blender --background --factory-startup --python flythrough.py -- out/ still

# desktop set: 100 frames 1280×720 (~37 min)
FRAMES=100 SAMPLES=56 RES=1280,720 LENS=24 \
  blender --background --factory-startup --python flythrough.py -- out-wide/ anim

# phone set: 100 frames 720×1280 (~37 min)
FRAMES=100 SAMPLES=56 RES=720,1280 LENS=17 \
  blender --background --factory-startup --python flythrough.py -- out-tall/ anim
```

Then convert `f_0001.png … f_0100.png` to WebP (quality 62) as
`public/flythrough/{wide,tall}/f_001.webp … f_100.webp`. Each frame is about 20 KB,
so a whole walk is about 2 MB. If you change the frame count, update `FRAME_COUNT` in
`src/features/flythrough/flythrough.tsx`.

## Timeline

| Frames (of 100) | What happens |
| --- | --- |
| 1 | The first pair of lanterns is already burning. The rest of the hall is dark. |
| 2 – 82 | A steady walk. Each pair ignites 8 m before the camera reaches it: flare to 135 %, settle at 100 %. |
| 82 – 100 | A slower final approach. The mihrab lantern ignites around frame 86. |

The chapter text on the website is timed against this: see `CHAPTERS` in the
component. The last chapter, « Merci », sits on the lit mihrab.

## Knobs (environment variables)

`RES`, `LENS`, `SAMPLES`, `FRAMES`, `HAZE` (world volume, default 0.006), `STILL`
(the frame number for still mode). Geometry, timing and lights are constants at the
top of each section in the script.
