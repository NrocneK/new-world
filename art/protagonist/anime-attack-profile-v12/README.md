# Attack review v12 — keep left07 on the far leg

Review `/attack-profile-v12?action=kick2&frame=6` for the corrected seventh cel; `/attack-profile-v12?action=pair&speed=0.25` for the support switch.

The old lowered cel drew the lifted thigh in front of the support thigh, visually exchanging the kicking leg. The corrected artwork keeps the right/near planted hip and thigh continuous in the foreground, occluding the root of the lifted left/far thigh. The same lowered pose is shared by left01 and left07, so both uses are updated. All other left cels and all other five action images are unchanged. Durations, frame numbering, corresponding support anchors and pair/combo timing are unchanged.

`kick2-lower-source.png` is imagegen output exec-aef6b626-e8f7-4f2b-baaa-b6e6ad18b340, edited from the previous lower cel with the correct left03 layer order as reference. Original is preserved under `/workspace/generated_images/`. The previous full source is retained as provenance, not re-rendered. Registration applies one whole-figure uniform scale and a rigid translation to the previous support shoe/floor; The packer then measures the rasterized support-shoe contact and applies an integer whole-cel translation to keep floor and support aligned within1px. It does not paint, warp, mirror or move individual limbs.

The packer extracts the six untouched left cels from v11 and substitutes the corrected pose only at indices0 and6. Validation checks exact raster equality of untouched left cels, byte equality of other five actions, the shared01/07 cel, timing/GIF totals, atlas bounds, contact registration within1px, and protected locomotion/game assets. The browser check covers controls, synchronized comparison03–08, pair/combo, mobile, deep links and public asset bytes/headers. Metadata cannot validate anatomy; the exported07 was also inspected visually for hip overlap.

Rebuild with repository served on port4173:

```sh
python art/protagonist/anime-attack-profile-v12/tools/register.py
node art/protagonist/anime-attack-profile-v12/tools/pack.cjs
python art/protagonist/anime-attack-profile-v12/tools/analyse.py
python art/protagonist/anime-attack-profile-v12/tools/audit.py
python art/protagonist/anime-attack-profile-v12/tools/export.py
python art/protagonist/anime-attack-profile-v12/tools/validate.py
node art/protagonist/anime-attack-profile-v12/tools/browser-review.cjs
```
