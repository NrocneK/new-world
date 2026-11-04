# Jump v2 — right takeoff, left-first landing

Sixteen cels, 4 × 4, transparent 1536 × 2560 PNG (384 × 640 per cel). The choreography now has a right/near-foot push and high left/far-knee drive, both arms lifting, progressive right-leg folding during ascent, left-leg extension after the apex, left-first contact, right-foot arrival, low compression and a staged return to idle.

| Zero-based cels | Motion |
| --- | --- |
| 0–1 | Idle, load right foot while lifting left knee |
| 2–3 | Right toe push; arms pull upward; right leg initially stays long |
| 4–6 | Right heel folds progressively; left thigh stays high; apex |
| 7–9 | Left leg opens and extends down during descent |
| 10 | Left sole first contact; right shoe remains airborne behind |
| 11–12 | Left knee brakes, right foot settles, both legs absorb into low stance |
| 13–15 | Rise gradually and return to the exact approved idle cel |

All newly drawn cels use one whole-figure source scale, 484/488. Registration uses rigid translation without limb warps. The right takeoff toe remains at X=222 during cels 1–2; the left landing toe stays at X=235 during cels 10–14. Cels 0/15 reuse approved idle v1. The virtual floor remains Y=620 and display scale 0.62. Airborne registration eases the head reference from the forward takeoff posture into descent. The source's far-shoe perspective is retained.

Generated art is preserved unchanged:

- `jump-ascent-source.png`: `exec-c4f0d7f6-11c5-4726-ae71-cf1cef1eaedf.png`.
- `jump-landing-source.png`: `exec-4d49ddb5-e397-4be0-a20f-6a0accc2e28f.png`.
- `jump-contact-correction.png`: `exec-d1d877e3-1112-403a-a0f0-b00039220356.png`; only its top-row third cel is used, correcting left support placement under the hip.

`pose-guide-1.png` / `pose-guide-2.png` are planning diagrams with fixed thigh/shin lengths and explicit near-right/far-left identity. The colored guide lines are not rendered in game.

Preview length is 1300ms: 150ms anticipation, 750ms flight and 400ms contact/compression/recovery. Interactive playback selects the same sixteen stages and uses the common landing after air jump. Normal/slow GIFs include the trajectory and camera follow. Packing retains complete cels and uses the existing v12 GIF-delay helper.

Rebuild from repository root with its local static server on port 4173:

```sh
python art/protagonist/anime-jump-profile-v2/tools/register.py
node art/protagonist/anime-jump-profile-v2/tools/pack.cjs
python art/protagonist/anime-jump-profile-v2/tools/audit.py
node tools/build-character-lab.mjs
```

The audit checks unclipped silhouettes, takeoff/landing toe anchors, progressive right-shoe elevation, left extension, right shoe above the floor at left-first contact, compression/recovery crown progression, exact GIF durations and unchanged air-jump artwork. Unit/browser tests cover the ordered sixteen stages, stronger second impulse, camera headroom, input controls and existing actions.
