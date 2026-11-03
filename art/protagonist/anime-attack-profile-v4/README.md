# Attack review v4

Review page: `/attack-profile-v4?action=finisher&speed=0.25`. This is a character animation review; game scenes, combat logic, hitboxes, approved locomotion and the approved idle remain unchanged.

Right = near / hand1. Left = far / hand2. The far LEFT arm is chambered at the waist and mostly hidden during ground impact. The obsolete straight far-arm backswing is omitted; its old fist has not been retouched.

The hook uses a forward-then-up arc with a bent elbow at the peak. Ground sequence (zero-based): peak 0, retract 1, waist chamber 2–4, downstroke 5–6, impact 7–8, recover 9–11, original right-punch guard 12, relax 13–14, approved idle pose 15. After the sequence, the web viewer plays the original breathing/blink idle loop. GIFs are single-play actor-only exports and stop on the final pose.

40 cels, 640×640 each, 4 columns × 10 rows. Actions 1–3 use 8 cels each; action4 uses 16. First two attacks preserve v3 art pixels with 128 transparent pixels added on the left. Combo: 2170 ms. Hook→ground: 1670 ms. GIF centisecond rounding is cumulative, preserving total duration. Download JSON uses coordinates in the combined sheet; web JSON uses per-action atlases.

Art provenance: six image-generation outputs retained as `hook-source.png`, `retract-source.png`, `chamber-source.png`, `downstroke-source.png`, `impact-source.png`, `recovery-source.png`. Generation IDs are ccd518f6-ba43-4ddf-8140-d98b78328382, f93fa4b8-0a93-4ae6-94cf-613b8ae2efd1, 27626f3e-905e-47e4-be5f-f18eda728cf7, ec8e8911-cc14-4487-874f-0170db606897, e507b8ca-2937-480c-b57f-2addd18fd74b, f367ae5a-f370-47ca-9ea2-b565379eeabd. Pose diagrams supply motion/ownership references, not final art. Packing uses uniform scaling and translation of complete generated poses; no limb warping, repainting or palette replacement. Read-only skin landmarks are inspection aids, not an anatomical correctness test.

VFX bitmaps are unchanged: legacy air-pressure-v2 for attacks 1–3, v3 ground-impact source for attack4. Placement follows measured contact anchors. Default VFX off; source-over blending, no filters or white bloom.

Rebuild from repository root with an HTTP server serving the repository on port4173:

```sh
python art/protagonist/anime-attack-profile-v4/tools/register.py
node art/protagonist/anime-attack-profile-v4/tools/pack.cjs
python art/protagonist/anime-attack-profile-v4/tools/analyse.py
python art/protagonist/anime-attack-profile-v4/tools/export.py
python art/protagonist/anime-attack-profile-v4/tools/validate.py
node art/protagonist/anime-attack-profile-v4/tools/browser-review.cjs
```

Validation covers original first-two-punch pixels, unclipped cels, identical hook/slam and guard/idle transitions, GIF frame counts/timing, protected hashes, variable-count controls, playback speeds, VFX toggling, completion states and responsive width. Visual review checks the requested poses; exact angles and perfect anatomy are not asserted by automated tests.
