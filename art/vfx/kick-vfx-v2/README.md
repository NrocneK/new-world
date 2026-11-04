# Continuous spinning-kick trail

The spinning kick emits a green trail from the first turning cel, follows the shoe toe through the complete body rotation, and continues into the high kick. Previously it emitted only during the last extension/contact cels.

`effect.json` keeps the first two kicks unchanged. It reuses the original transparent `kick-vfx-v1/slash.png` texture; there are no character-atlas or audio changes. Its thirteen spinning path points were checked against the actual shoe/toe in the approved v12 atlas. The old early spinning `inspectionPoint` fields identify cuffs/shirt in some cels and are not used.

| Cel (zero-based) | Body turn | Toe X | Toe Y |
| --- | --- | --- | --- |
| 0 | 0° | 499 | 608 |
| 1 | 30° | 491 | 601 |
| 2 | 60° | 533 | 520 |
| 3 | 90° | 534 | 495 |
| 4 | 120° | 386 | 474 |
| 5 | 150° | 368 | 481 |
| 6 | 180° | 353 | 487 |
| 7 | 240° | 351 | 489 |
| 8 | 270° | 416 | 469 |
| 9 | 285° | 479 | 478 |
| 10 | 310° | 535 | 372 |
| 11 | 335° | 643 | 219 |
| 12 | 360° | 655 | 229 |

Cel 0 remains preparation. Emission begins at cel 1, stays active through cels 2–12, fades in place during cel 13 and disappears before final guard. Centripetal Catmull–Rom interpolation limits overshoot around clustered toe positions. A moving five-cel tail lets older strokes dissipate while the head follows the rotating foot; it does not leave a static ring behind the actor.

Depth is derived from the unwrapped body turn: the far half is composited behind the current actor alpha, and the near half passes in front. A small feathered opening at the live toe lets the glow surround the striking shoe. Both the stroke and its glow use the same occlusion. The entire result mirrors with facing.

Canonical code: `character-lab/kick-effects.js`; generated public bundle: `site/art/character-lab-v4/`. Build with `node tools/build-character-lab.mjs`. The previous v3 bundle and v1 material/config remain intact for cached pages.

Validation: `tests/kick-vfx.spec.cjs` traces all twelve active turning cels, checks green output before the high kick, verifies the full turn, controls, mirroring and existing audio. `tests/character-lab-anime.spec.cjs` covers the ten actions, transition timing, keyboard/touch controls and mobile layout. Pixel inspection checks back/near occlusion during the spin. Protected game/approved character/fire asset hashes are compared before publishing.
