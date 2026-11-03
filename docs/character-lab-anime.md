# Unified character lab — approved anime identity

Public route: `/character-lab` (the original character motion test page). It keeps the original office/playground layout and replaces the old chibi motion set with the10 completed anime actions and88 cels:

| Actions | Approved source |
| --- | --- |
| Idle | anime-idle-profile-v1;3360ms breathing/blink loop |
| Walk | anime-walk-profile-v2;8cels/8FPS |
| Ninja run | anime-run-naruto-ref-v5;8cels/16FPS |
| Adjust glasses | anime-adjust-glasses-v1;1360ms independent one-shot |
| Three punches + three kicks | anime-attack-profile-v12; approved per-frame timing |
| Fire punch VFX/SFX | fire-punch-v9 renderer, gold emission module and v3 combustion WAVs |

The10 source PNG atlases are referenced without edits, limb transforms or per-frame resizing. There is a single uniform display scale0.62. Whole-cel anchors use the approved registered canvas positions: idle/glasses192,500;walk192,480;run224,500;combat381.5,620. The walk source's actual480px floor is accounted for, instead of using500 for every locomotion sheet. Every action exposes its original PNG through the selected-sheet panel.

Controls: A/D or arrows walk; Shift runs; J queues three punches; K queues right/left/spinning kicks; G adjusts glasses; U toggles the fire attribute; R resets. Touch controls provide movement, run, punch, kick, glasses and fire. The page also has single-action previews, frame inspection, pause/replay,0.25–1.5x playback, combat/movement filters, zoom, VFX and sound toggles, automatic punch/kick playback and a training target.

Eight seconds of uninterrupted idle trigger glasses once. Moving or attacking interrupts the gesture. The completed automatic gesture returns to idle without rearming; another activity starts a fresh idle session. Standalone combat previews play once and hold the final cel while VFX dissipate. Interactive attacks return to idle. Chained right→left kicks use the approved370ms clipped right action, preserving the fast support change without an added guard/landing cel; standalone right kick remains500ms. Kicks do not acquire new fire effects that have not been designed yet.

The lab-specific module/manifest is isolated from app.js and the chapter engines. Fire compositing is extracted from the existing v9 preview into a transparent renderer and projected/mirrored with the character. It retains selective far-arm occlusion, the golden arm gradient and the taller767px flame wall at the same relative scale. The original game engine/sprite manifest is not migrated by this lab change.

Canonical sources: character-lab.html and character-lab/. `node tools/build-character-lab.mjs` writes site/character-lab.html and site/art/character-lab-v2/. The existing full-site builder in the workspace calls the same function. For an independent static preview, serve the repository root and open `/site/character-lab.html`; the deployed route remains `/character-lab`.

Validation: `node tests/character-lab-anime.spec.cjs` checks all10 actions/88 frame selections, keyboard walk/run/facing, the once-per-idle glasses trigger and interruption, automatic and manually queued punch/kick chains, the fast right→left switch, training-target contact, filters, sound/fire/VFX controls, mobile width and touch events. Network assertions reject loading the old chibi sprite manifest. Existing protected-source checks confirm8 game-source hashes and33 approved-art hashes remain unchanged. Visual inspection covers the hook/fire integration and the mobile layout. The route is also checked publicly after deployment.
