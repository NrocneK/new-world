# Ground dash / adult side profile

Eight transparent 640×640 cels, four columns × two rows, 400ms one-shot. Native anchor (280,620), common display scale 0.62. Preparation, rear-toe push, low forward burst, braking and recovery are separate poses. The jacket and hair follow the acceleration/braking; the normal-height anime identity, glasses, navy outfit and gray shoes follow the existing idle and Naruto run references.

`dash-source.png` is the new generated whole-figure source, retained unchanged. Frames 1–6 use a single whole-source scale of 484/450; only whole-cel translations register the pelvis/floor. Frames 0 and 7 reuse the approved idle cel without changing its pixels. No body-part warps, separate limb assembly or per-frame resizing are used. The retained source and per-frame stills permit visual review.

Timing: [20,40,40,60,60,60,60,60]ms. The controller starts translation after 60ms, accelerates, travels 195 stage pixels and brakes before recovery. Facing is locked for the burst. At 400ms it returns to idle or the held movement direction, with a 120ms recovery interval before another dash. Stage bounds cap displacement without moving a character that is already outside the dash margin.

`tools/register.py` registers both ground and air sources. Run `node tools/pack.cjs` with the repository served at localhost:4173 to pack both sets and copy their public PNG/JSON/GIF files. The packer draws whole cels in browser Canvas, restores the reused atlas pixels directly and encodes normal/half-speed GIFs with exact delays. `python tools/audit.py` checks all sixteen dash/air-dash cels, scale, copied pixels, floor registration, silhouette and GIF timing. Review stills are under `frames/`; transparent individual cels are under `cels/`.

The character lab exposes a Dash card, per-frame inspection and PNG/normal GIF/slow GIF downloads. Use L or X, or the Lướt touch button. The ground and air dash controller is isolated in `character-lab/dash-motion.js`.
