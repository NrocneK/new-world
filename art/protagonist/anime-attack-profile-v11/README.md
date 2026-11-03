# Attack review v11 — corresponding left/right poses and support registration

Review `/attack-profile-v11?action=kick2&frame=2#compare` for frame03 side-by-side; `/attack-profile-v11?action=pair&speed=0.25` for the support switch.

The left action is aligned by FRAME NUMBER to the accepted right action from03 through08: high-knee chamber, diagonal extension, contact, refold, lowered bent knee, guard. Those six cels have identical durations to their right equivalents. Right artwork, GIFs, standalone metadata and the other4 actions remain byte-identical to v10.

Only left art changes. Final `kick2-source.png`: imagegen exec-3fb410b6-4c31-4b6e-ad16-79a0ec39a055, using accepted right atlas as geometric template and existing left atlas for opposite arm/limb ownership. The near/right foreground arm guards and far/left arm trails; far left thigh emerges behind planted near/right support. There is no camera-facing sole reinterpretation. Source and exported chamber/extension pairs were visually compared. Initial source e7931c57-5750-41a9-8b31-8147dbe8952a was not used in the final export because its extension did not match the reference.

Final source indices `[6,2,2,3,4,2,6]` plus original guard. First two entry cels swap support immediately then raise the far knee; cels03–08 use corresponding right geometry. Chamber and refold are the same full cel. Timings20,20,90,35,45,80,65,85ms =440ms. Chained right07 remains20ms; pair810ms/15cels, full combo1710ms/31cels. Right standalone remains500ms with its original guard finish.

The previous placement error used `right.frames[6].inspectionPoint`, which located the raised attacking shoe. Registration now measures the planted shoe's actual opaque floor contact from the corresponding right cel. A SINGLE scale is calibrated from the shared coiled pose; complete left figures are rigidly translated to the reference support/floor. No per-pose resize, repaint, limb warping or image mirroring. Initial swap uses the right07 planted contact point, not the raised boot position. Source calibration uses one matched pose rather than changing scale per pose.

`pose-audit.json` records measured contact deltas, read-only hair-center diagnostics and automatic raised-shoe inspection markers. At native cel resolution, measured support deltas for03–07 are0–0.5px horizontally and0px vertically. Hair/shoe diagnostics are not anatomical landmarks and are not evidence of mathematically identical skeletons. Drawn limbs and opposite-side overlap still need visual review.

The page adds synchronized03–08 comparison canvases on the same grid/support guides. Selecting a comparison cel pauses the left preview at that frame and shows the corresponding right pose without changing either scale. This makes pose/order and position differences inspectable directly. Full atlas remains56cels,768×640,4columns×14rows. Game code, approved locomotion/idle and VFX remain unchanged.

Rebuild with repository served on port4173:

```sh
python art/protagonist/anime-attack-profile-v11/tools/register.py
node art/protagonist/anime-attack-profile-v11/tools/pack.cjs
python art/protagonist/anime-attack-profile-v11/tools/analyse.py
python art/protagonist/anime-attack-profile-v11/tools/audit.py
python art/protagonist/anime-attack-profile-v11/tools/export.py
python art/protagonist/anime-attack-profile-v11/tools/validate.py
node art/protagonist/anime-attack-profile-v11/tools/browser-review.cjs
```

Checks cover unchanged right/other4 assets and standalone data, corresponding03–08 timings, contact registration within1px including support switch, no duplicate/landing cels, exact chamber return, GIFs and clipped chain timing, bounds/coordinates, protected hashes, controls/mobile/deep links, comparison panel frame/guide synchronization and public file hashes/headers. Visual inspection covers pose matching; metadata tests do not prove perfect anatomy.
