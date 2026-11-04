# Unified character lab — approved anime identity

Public route: `/character-lab` (the original character motion test page). It keeps the original office/playground layout and contains12 anime actions and104 cels:

| Actions | Approved source |
| --- | --- |
| Idle | anime-idle-profile-v1;3360ms breathing/blink loop |
| Walk | anime-walk-profile-v2;8cels/8FPS |
| Ninja run | anime-run-naruto-ref-v5;8cels/16FPS |
| Adjust glasses | anime-adjust-glasses-v1;1360ms independent one-shot |
| Jump / air jump | anime-jump-profile-v1 and anime-air-jump-profile-v1;8cels each, independent actions |
| Three punches + three kicks | anime-attack-profile-v12; approved per-frame timing |
| Fire punch VFX/SFX | fire-punch-v9 renderer, gold emission module and v3 combustion WAVs |
| Green kick VFX/SFX | kick-vfx-v2 continuous spinning toe trail; v1 texture and air-cut WAVs |

The original10 PNG atlases remain unchanged. All12 actions use one display scale0.62. Whole-cel anchors use registered canvas positions: idle/glasses192,500;walk192,480;run224,500;combat381.5,620;jump/airJump192,620. The new jump cels use one shared whole-figure source scale with no limb warps. The walk source's actual480px floor is accounted for, instead of using500 for every locomotion sheet. Every action exposes its PNG through the selected-sheet panel; the new jump actions also expose normal/slow GIFs.

Controls: A/D or left/right arrows walk; Shift runs; Space/W/↑ jumps and a second airborne press air-jumps; J queues three punches; K queues right/left/spinning kicks; G adjusts glasses; U toggles the fire attribute; R resets. Touch controls provide the same actions, including a jump button that accepts both presses. The page also has single-action previews, frame inspection, pause/replay,0.25–1.5x playback, combat/movement filters, zoom, VFX and sound toggles, automatic punch/kick/jump-pair playback and a training target.

Jump physics is separate from pose selection (`jump-motion.js`). Ground takeoff has150ms anticipation, then600px/s upward speed under1600px/s² gravity (112.5px apex). Air jump preserves current height/horizontal momentum and replaces vertical speed with540px/s. It allows exactly two jumps before landing. Near the apex, the automatic pair triggers the second boost. Interactive flight selects appropriate rising/apex/falling cels and uses jump's landing/recovery after floor contact. Frame inspection cancels simulation and shows the selected pose at its preview height. Runtime scales never change with height.

Eight seconds of uninterrupted idle trigger glasses once. Moving or attacking interrupts the gesture. The completed automatic gesture returns to idle without rearming; another activity starts a fresh idle session. Standalone combat previews play once and hold the final cel while VFX dissipate. Interactive attacks return to idle. Chained right→left kicks use the approved370ms clipped right action, preserving the fast support change without an added guard/landing cel; standalone right kick remains500ms.

All three kicks create green luminous sweeps. The spinning kick emits from its first turning cel, traces the toe through the full 360° rotation and continues into the high kick. Its far half passes behind the actor and its near half passes in front. A moving tail lets older strokes dissipate. The two front kicks retain their original extension/contact effects. The left/far kick effect covers its striking limb while the torso and near support leg occlude it. The near/right kick draws in front. The global VFX button controls these trails; the fire attribute only controls punch fire. Kick sounds load with the page's sound button and begin at extension. See `art/vfx/kick-vfx-v1/README.md` for material provenance and `art/vfx/kick-vfx-v2/README.md` for the continuous spinning path.

The lab-specific module/manifest is isolated from app.js and the chapter engines. Fire compositing is extracted from the existing v9 preview into a transparent renderer and projected/mirrored with the character. It retains selective far-arm occlusion, the golden arm gradient and the taller767px flame wall at the same relative scale. The original game engine/sprite manifest is not migrated by this lab change.

Canonical sources: character-lab.html and character-lab/. `node tools/build-character-lab.mjs` writes site/character-lab.html and site/art/character-lab-v5/. Previous bundles are preserved for cached pages. The existing full-site builder in the workspace calls the same function. For an independent static preview, serve the repository root and open `/site/character-lab.html`; the deployed route remains `/character-lab`.

Validation: `node tests/character-lab-anime.spec.cjs` checks all12 actions/104 frame selections, keyboard walk/run/facing, the once-per-idle glasses trigger and interruption, automatic and manually queued punch/kick chains, the fast right→left switch, training-target contact, filters, sound/fire/VFX controls, mobile width and touch events. Network assertions reject loading the old chibi sprite manifest. Existing protected-source checks confirm8 game-source hashes and33 approved-art hashes remain unchanged. Visual inspection covers the hook/fire integration and the mobile layout. The route is also checked publicly after deployment.

`node tests/jump-motion.spec.mjs` checks takeoff, ballistic apex, the second impulse, two-jump limit and landing reset. `node tests/character-lab-jump.spec.cjs` covers keyboard/touch double jumping, running momentum, the automatic pair, pause/reset, facing, both new sheet selectors and mobile layout. The jump asset audit checks sixteen unclipped cels, shared scales/cels, grounded soles and exact GIF durations.

`node tests/kick-vfx.spec.cjs` additionally checks traced shoe/toe anchors, all twelve active spinning cels, green output during the turn and each kick, independent fire/VFX controls, inactive preparation/guard, facing mirroring, sound loading and the complete kick chain. Pixel comparisons use the character region so portal animation and ambient particles do not distort the color check.
