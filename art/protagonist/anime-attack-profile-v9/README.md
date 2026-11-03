# Attack review v9 — right-frame07 to left kick, with arm switch

Preview `/attack-profile-v9?action=pair&speed=0.25`.

The left/far kick starts with the exact full cel from right/near kick frame07 (one-based, index6). It lands the right foot, raises the left knee and snaps the far left leg diagonally upward. Arms reverse roles: right/near hand moves forward/up guarding, left/far hand trails back/down. The front sleeve is drawn across the torso, far sleeve behind, with no image mirroring. Left knee rechambers into the exact same loaded cel after contact.

New left action10cels500ms: exact right07(20),right landing/arm switch(30),left knee rising(35),full chamber(70),extension(35),contact(45),rechamber(80),lower(60),settle(45),guard(80). Right07 is read directly from the accepted v8 atlas; source art supplies8 intervening poses; the existing guard supplies the final cel.

Source `kick2-source.png`: imagegen exec-1a61c37a-be65-4e99-9493-b9b0202f2662, referenced exact right07 plus colored arm/leg-ownership guide. Guide orange=right support and front hand; blue=left strike and rear hand. Source art was visually reviewed for the foreground right guard arm, trailing left arm and planted right leg. Metadata arm roles express intent, not an anatomy proof.

All source cels share one uniform scale calibrated to the final standing source pose, never the bent landing pose. Rigid placement locks the right support shoe while the left leg is raised; after the left foot returns, the figure settles toward the original guard. No limb warping/repainting, recoloring, per-frame zoom or horizontal mirroring.

Chained playback ends the right action at frame07 and immediately starts left frame01, which has identical body pixels. Right frame08 (guard) remains available for standalone right playback but is skipped in the pair/full combo. This is encoded in `playbackSequences`, and shared by web timing and GIF export. Pair17cels915ms; full kick combo33cels1815ms. Standalone right remains its original8cels500ms. Left10cels500ms. Spin16cels900ms unchanged. GIF durations round cumulatively to centiseconds (915ms becomes920ms).

Full export58 actual cels in4columns×15rows,768×640cells; left uses3rows with2 empty cells. Other5 action images/GIFs are byte-identical to v8; the spin's combined-atlas row offset moves from10 to11. Game logic, existing locomotion/idle/adjust-glasses and VFX remain unchanged.

Rebuild from repo root with repo served at port4173:

```sh
node art/protagonist/anime-attack-profile-v9/tools/pose-guide.cjs
python art/protagonist/anime-attack-profile-v9/tools/register.py
node art/protagonist/anime-attack-profile-v9/tools/pack.cjs
python art/protagonist/anime-attack-profile-v9/tools/analyse.py
python art/protagonist/anime-attack-profile-v9/tools/export.py
python art/protagonist/anime-attack-profile-v9/tools/validate.py
node art/protagonist/anime-attack-profile-v9/tools/browser-review.cjs
```

Validation covers exact right07/left01 pixels and rendered body seam; knee chamber/rechamber equality; unchanged other5 art/actions apart from combined row offset; uncut atlas cells; GIF counts/timing; clipped pair/full timelines; original standalone right guard;8/10/16 selectors; arm-role metadata; slow playback; deep link/mobile width; protected hashes; and public file/download hashes/headers. Source sheet and exported switch/contact poses were visually inspected. Automated metadata checks do not establish hidden bone lengths or hand anatomy.
