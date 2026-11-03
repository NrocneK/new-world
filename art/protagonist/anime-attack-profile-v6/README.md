# Attack review v6 — alternating kicks and spinning high roundhouse

Preview `/attack-profile-v6?action=combo&speed=0.25`.

Active kick sequence: anatomical RIGHT/NEAR front kick (LEFT/FAR support) → LEFT/FAR front kick (RIGHT/NEAR support) → RIGHT spinning high roundhouse at head height (LEFT pivot support). The turn includes rear three-quarter and back poses, with head/shoulder/hip rotation, before the high extension and recovery. Ground punch is removed from the active review and timeline. Existing three punch drawings are retained exactly with transparent horizontal padding.

This remains a character animation review. Game logic, approved idle/walk/run/adjust-glasses assets, hitboxes and legacy VFX are unchanged. No new kick VFX is included; the page/GIFs show the character without effects.

48 cels total, 768×640, four columns × twelve rows. Every action has eight cels. The three kicks form the default combo (24 cels,1640ms). Punches are a separate selectable sequence. All kicks begin/end on the same original guard cel, allowing exact seams between actions. PNGs have transparency; GIFs use a plain preview stage, play once and stop at guard. Half-speed GIFs use cumulative centisecond rounding. The web viewer supports1×,0.5×,0.25× and per-cel inspection.

Art provenance:

- `kick1-source.png`: imagegen exec-f708df4d-0c7e-413c-b2e9-52cb0d91ab17.
- `kick2-source.png`: imagegen exec-9d3cc9f0-38cf-404d-a5ad-a5c4dfce4aee.
- `kick3-source.png`: imagegen exec-cb3bbcbd-3c6c-412f-bca7-692ac60c9f65.

Sources use the existing guard/identity and colored joint-ownership diagrams as references. Diagrams are guides, not final art. Export crops complete connected figures and uniformly scales each source atlas once against its first standing guard; that same scale is fixed for every cel. Only rigid placement is applied afterward. Transparent gutters preserve a long foot crossing a source grid boundary. No limb repainting, recoloring, per-frame face normalization, joint warping, or horizontal mirroring to fake the far-leg kick. Generated art still needs visual anatomy review; fixed guide/export dimensions do not prove mathematically exact hidden bone lengths.

Rebuild from repository root with an HTTP server serving repository root on port4173:

```sh
node art/protagonist/anime-attack-profile-v6/tools/pose-guides.cjs
python art/protagonist/anime-attack-profile-v6/tools/register.py
node art/protagonist/anime-attack-profile-v6/tools/pack.cjs
python art/protagonist/anime-attack-profile-v6/tools/analyse.py
python art/protagonist/anime-attack-profile-v6/tools/export.py
python art/protagonist/anime-attack-profile-v6/tools/validate.py
node art/protagonist/anime-attack-profile-v6/tools/browser-review.cjs
```

Validation covers exact retained punch pixels, full/cel atlas coordinates, bounds, guard seams, single-play GIF counts/timing, fixed source-atlas scales, constant guide leg lengths, high-kick contact position, protected game/locomotion/VFX hashes, all48 frame selectors, playback order/speeds, completion holds, mobile width and clean browser requests. Contact art and source turn/leg-ownership poses were visually inspected. Public verification checks HTTP200, matching file hashes and download attachment headers.
