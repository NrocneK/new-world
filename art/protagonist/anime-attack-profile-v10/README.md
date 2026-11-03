# Attack review v10 — far-left perspective and immediate support switch

Preview left alone `/attack-profile-v10?action=kick2&speed=0.25`; pair `/attack-profile-v10?action=pair&speed=0.25`.

Only the left/far kick's art is updated. Right/near kick PNGs, GIFs, frames, standalone timing and metadata remain byte-identical to v9 (which retained the accepted v8 right kick). The other4 actions also keep their artwork and timing; spin combined-atlas row offset returns from11 to10.

Source `kick2-source.png`: imagegen exec-372dd6c2-686e-4fbe-b351-dffc54166fbd, an edit of the EXISTING v9 LEFT-kick source. Raised far-left shin/sneaker now foreshorten toward camera; extension/contact show the sole/tread in three-quarter frontal perspective. The far thigh still starts behind foreground right support. Existing foreground right guard arm and rear left arm are retained. Visual review of the source and rendered first/contact cels checks these cues. Metadata cannot establish anatomical correctness by itself.

The source's first landing cel is discarded. Final source order `[1,2,3,4,2,6,7]` plus the original neutral guard supplies8 cels: already-swapped right support/left knee up20ms, far chamber55, depth extension35, contact45, exact chamber return65, lower65, settle55, guard80. There is no duplicate of right07 and no slow right-foot landing pose at the start. Left duration420ms.

Pair/combo preserve right art but shorten its chained frame07 hold to20ms, then change support immediately. This override affects chained playback only. Right standalone still has its original8 cels500ms including frame08 guard. Shared `lastFrameDurationMs` handling keeps runtime and GIF timing consistent. Pair15cels790ms; full kick combo31cels1690ms. Left8cels420ms. Full atlas56cels,4columns×14rows,768×640 each.

One uniform source scale is calibrated against the standing source cel, then fixed for every drawn pose. Registration only crops/translates complete figures; no limb warping, per-frame zoom, recoloring or character mirroring. The depth is drawn art, not a rotation/resize of a flat existing sprite. Bone lengths hidden inside clothing are not mathematically measured.

Rebuild from repo root with repo served on port4173:

```sh
python art/protagonist/anime-attack-profile-v10/tools/register.py
node art/protagonist/anime-attack-profile-v10/tools/pack.cjs
python art/protagonist/anime-attack-profile-v10/tools/analyse.py
python art/protagonist/anime-attack-profile-v10/tools/export.py
python art/protagonist/anime-attack-profile-v10/tools/validate.py
node art/protagonist/anime-attack-profile-v10/tools/browser-review.cjs
```

Tests check right/other4 action artwork byte equality,8-cel left selection, absence of duplicate/landing phase, different right07/left01 pixels, exact knee chamber return,20ms chained right hold, pair/combo event boundaries and GIF counts/durations, uncut atlas bounds, protected game/locomotion/VFX hashes, playback controls, mobile/deep links, public bytes and attachment headers. Source plus exported first/contact poses were visually inspected for far-left strike and sole perspective. No game scenes, gameplay logic or approved locomotion were changed.
