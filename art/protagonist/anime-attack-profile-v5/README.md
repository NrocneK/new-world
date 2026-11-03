# Attack review v5 — kneeling ground strike

Review `/attack-profile-v5?action=finisher&speed=0.25`.

Right = near / hand1. Left = far / hand2. Raise the uppercut peak above the hair by lifting the elbow/upper arm across the face. Ground frame4 (one-based) lowers the pelvis and bends the near/right knee further; frames5–9 progressively kneel onto the right knee. Front/far left foot bears weight. Right arm reaches the floor by lowering shoulder and torso; head inclines downward. Far left hand is chambered at waist and largely hidden. Recovery passes through the exact original guard and approved idle. No old straight-rear-leg lunge is used.

The v4 per-cel face-width normalization was removed. It could enlarge a pose when the face turned or became occluded and made limbs appear to change length. v5 uses a single uniform drawing scale for every cel of each source atlas; descent and recovery use the same 1.085 scale. Raised-peak registration uses hair rather than a partly hidden face (or a fist misidentified as a face). Whole-figure floor registration and recovery placement only translate poses, without limb deformation or per-cel scaling. The two straight punches preserve original v3 pixels with transparent padding; locomotion, game code and approved idle remain unchanged.

Art comes from image generation, not a measured skeletal deformation rig. Fixed-length skeleton guides and constant export scales reduce drift; they do not prove mathematically identical anatomy in the generated drawings. Visual review of all key poses remains necessary. `scale-audit.json` records fixed scales and read-only skin-width diagnostics; those diagnostics never resize a cel. The source pose guide uses constant torso/thigh/shin96 and upper-arm/forearm59 units.

Sources retained:

- `hook-source.png`: exec-85db0674-b386-404b-a98e-2db3c758d070, frames2–6 used; final peak replaced.
- `peak-source.png`: exec-41d6afb2-e6b9-4030-85d4-f8ec5610bcc0, higher peak at hook frame7, held and shared with ground frame1.
- `slam-source.png`: exec-11e8e944-251c-40e5-958f-0457537d307b, waist chamber through kneeling impact.
- `recovery-source.png`: exec-6915cdf8-74d6-4982-bd00-5e108e09565e, recovery intermediates. Exact guard and idle override the corresponding generated cels.

No programmatic limb edits, recoloring or mesh stretching. `pose-guides.cjs` renders reference diagrams, not final character art.

Export:40 cels,640×640,4columns×10rows. Actions1–3 have8 cels; action4 has16. Combo2170ms; hook→slam1670ms. PNGs are transparent actor-only; GIFs show a plain preview stage, no VFX, single play. Web completion continues the original idle breathing/blink loop. VFX source images remain unchanged; only placement follows new contact anchors. Source-over, no filters/bloom, disabled by default.

Rebuild from repo root, with an HTTP server serving repo root at port4173:

```sh
node art/protagonist/anime-attack-profile-v5/tools/pose-guides.cjs
python art/protagonist/anime-attack-profile-v5/tools/register.py
node art/protagonist/anime-attack-profile-v5/tools/pack.cjs
python art/protagonist/anime-attack-profile-v5/tools/analyse.py
python art/protagonist/anime-attack-profile-v5/tools/export.py
python art/protagonist/anime-attack-profile-v5/tools/validate.py
node art/protagonist/anime-attack-profile-v5/tools/browser-review.cjs
```

Validation: uncut cels, exact first-two-punch pixels, hook/slam seam, contact hold, original guard/idle transitions, GIF timings/counts, protected hashes, fixed export scales, fixed guide bones and knee descent, higher hook contact, browser controls/speeds/VFX/idle completion/mobile width. Anatomy was visually inspected in the generated source sheets and exported frame4–11 strip; automated checks cover the guides and export behavior, not invisible bone lengths inside clothing.
