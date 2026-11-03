# Attack review v7 — complete body turn

Preview `/attack-profile-v7?action=kick3&speed=0.25`.

The third kick now uses16 cels: right profile → rear three-quarter → back → back-left → left profile → front-left → front → front-right → high sweep toward right → recoil → guard. The left leg is the ground pivot and anatomical right leg chambers and sweeps. Head visibility changes naturally with the turn. The first three punches and first two kicks retain their v6 images, GIFs and action metadata byte-for-byte. Ground punch remains absent from the active review.

Source art:

- `spin-a-source.png`: imagegen exec-08a386ad-2e41-4934-bd86-984e71f28f00, the first8 poses through back/left/front-left.
- `spin-b-source.png`: imagegen exec-eca86ca2-eb29-4a19-93ad-12bca96aabd1, front/right/sweep/recovery. Its first2 cels are ordered front then front-right for a continuous turn.

One scale, calibrated once to the source's first guard, applies to all16 complete figures. The left support shoe supplies a rigid placement anchor. No body-part repainting, limb warping, per-cel zoom, horizontal mirroring or programmed rotation of a flat character image is used. Directional views are newly drawn art. `bodyYawDegrees` documents intended turn order; it is not a measured 3D rig. Visual inspection of source sheets and a fixed-stage16-frame contact sheet confirms the back, left and front views; automated checks cannot prove anatomical correctness or an exact physical yaw angle.

The page exposes16 frame buttons for kick3,8 for other actions, plus back/left/front/sweep pose cards. Full export56cels,768×640,4columns×14rows. Kick combo32cels1900ms; third kick16cels900ms. GIFs are single-play normal/half-speed character previews. Web playback also supports quarter speed. All kicks start/end on the exact existing guard. No game scenes, gameplay code, approved locomotion/idle/adjust-glasses or old VFX were changed.

Rebuild from repository root, with an HTTP server serving the repository on port4173:

```sh
node art/protagonist/anime-attack-profile-v7/tools/turn-guide.cjs
python art/protagonist/anime-attack-profile-v7/tools/register.py
node art/protagonist/anime-attack-profile-v7/tools/pack.cjs
python art/protagonist/anime-attack-profile-v7/tools/analyse.py
python art/protagonist/anime-attack-profile-v7/tools/export.py
python art/protagonist/anime-attack-profile-v7/tools/validate.py
node art/protagonist/anime-attack-profile-v7/tools/browser-review.cjs
```

Checks cover unchanged first5 actions, atlas/cel coordinates, guard seams, bounds, GIF frame counts/durations/non-looping, fixed export scale, directional pose-card equality, monotonic intended turn order, protected asset/code hashes,8/16 frame controls, playback order/speeds, deep links, mobile width and browser errors. Public verification checks matching bytes and attachment headers for every published review asset/download.
