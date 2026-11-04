# Compact dash — 4 sprite cels, no VFX

Pose source: the user-approved low dash sample in `sources/02-approved-dash.png`, copied unchanged from `dash-pose-review/dash-pose-candidate.png`. It is cel2. The other three generated whole-figure poses enter, sustain and begin recovering from that same silhouette. The right/near leg trails extended; the left/far leg stays folded. This is a one-shot dash, not a running stride cycle.

Timing: entry40ms → dash60ms → sustain80ms → recovery60ms, total240ms. The two main dash cels occupy140ms. `loop:false` in the engine metadata; preview GIFs loop for inspection. The slow GIF is480ms.

Transparent atlas:1280×896,2columns×2rows,640×448 cells. AnchorX320 and groundY420. A shared whole-source scale1/3 is used for every1536×1024 source. Only whole-cel translation registers the origin/floor; there are no limb warps, per-part scaling or drawn speed effects. Padding remains available around the figure; future VFX should be a separate layer.

Outputs: `dash-sheet.png`, `dash-sheet.json`, individual `cels/`, numbered review `frames/`, `dash-review.png`, normal and slow GIFs. `export-audit.json` checks4 cels, bounds, source hashes and GIF timing. Run `node tools/pack.cjs` with the repository served at localhost:4173 to rebuild. No active demo/controller/deployment has been modified.
