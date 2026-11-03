# Attack review v8 — right/near front snap kick from user reference

Preview `/attack-profile-v8?action=kick1&speed=0.25`.

Only the anatomical right/near kick is changed. The user's attached side-view martial-arts drawing supplies the motion: lift knee high, keep shin folded downward, snap the lower leg diagonally up, then immediately refold to the same high-knee chamber. The left/far leg remains the planted support. The head–torso–pelvis–support-leg axis stays tall with a gentle lean; arms counterbalance, with one hand forward and the other back/down. No roundhouse or spin is introduced into this action.

Source: `kick1-source.png`, imagegen exec-6ecc45f6-8875-49ef-8f3d-5781b7475768. Generation used the user's inline monochrome pose diagram and the existing colored guard/identity as the two most recent image references. The diagram itself is not saved locally. It supplies pose mechanics, not character style. Hair/glasses/navy jacket/pants/sneakers and muted colors follow the existing character.

Eight cels,500ms: guard50,raise50,high-knee chamber90,partial extension35,high contact45,rechamber80,lower65,guard85. The recovery chamber is the exact same full cel as the loaded chamber (indices2 and5). This enforces the diagram's②→③→② shape; extension/contact lasts80ms instead of holding a straight leg out. First/last cels use the exact existing guard. Images, GIFs and metadata of the other5 actions are byte-identical to v7.

One uniform scale, calibrated once from the first standing source pose, applies to all8 generated poses. Registration rigidly translates whole figures to the left support shoe; no per-cel face normalization, limb stretching, mirroring, recoloring or digital repainting. Hidden bone lengths inside generated drawings are not mathematically measured; visual anatomy review remains necessary.

The review page opens on the right kick by default, with loaded/extended/rechambered pose cards. Existing spin cards/assets are preserved for the unchanged third kick. Full export remains56cels,768×640,4columns×14rows. PNGs are transparent, GIFs are single-play previews with normal and half speed, web also supports0.25×. Game code, approved locomotion/idle/adjust-glasses and VFX remain unchanged.

Rebuild from repository root with an HTTP server serving repository root at port4173:

```sh
python art/protagonist/anime-attack-profile-v8/tools/register.py
node art/protagonist/anime-attack-profile-v8/tools/pack.cjs
python art/protagonist/anime-attack-profile-v8/tools/analyse.py
python art/protagonist/anime-attack-profile-v8/tools/export.py
python art/protagonist/anime-attack-profile-v8/tools/validate.py
node art/protagonist/anime-attack-profile-v8/tools/browser-review.cjs
```

Validation checks unchanged other5 actions, atlas/cel bounds and coordinates, identical chamber/rechamber, guard seams, higher foot contact,80ms extension, fixed export scale, GIF counts/timing, protected assets/game hashes, variable8/16 controls, slow playback, deep links and mobile width. Public checks compare bytes and download attachment headers. Source atlas plus exported loaded/contact poses were visually inspected against the user's diagram.
