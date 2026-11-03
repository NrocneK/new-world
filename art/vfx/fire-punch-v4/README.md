# Fire punch review 04

Review `/fire-punch-v4`. This iteration removes anatomical fire fists and preserves the real hand inside an open flame aura. Straight punches combine a long trailing wake behind the actor with a smaller, open flame layer around the actual fist. The source contains abstract fire with transparent centers, not painted hands.

The hook uses a separate fixed crescent wall, generated from a diagram of the actual approved fist coordinates: `(372,361)→(465,363)→(490,313)→(490,254)→(463,182)→(459,117)`. The generated image occupies the same world canvas as the actor. A cached soft reveal grows upward as the fist travels, preserving the lower swept arc, rather than moving/rotating a straight plume with the hand. At the peak the wall spans the full swept arc. A separate open aura remains centered on the real fist. The source canvas is uniformly fitted to768px width. The generated brush shapes approximate the guide; they are not mathematical proof of an exact trajectory.

Assets: `aura-trail.png` is imagegen exec-b29a29dd-9e6a-4659-947d-c1eadaecdff1. `hook-wall.png` is exec-7021d780-8534-4dfb-bf39-e0a29cb56320, generated against a technical point/path diagram. Earlier broad crescent atlas exec-9194be36 is not used because its geometry did not match the fist path well enough. Original generated files remain preserved.

The existing character PNGs, frame timings and v3 combustion WAVs are referenced without changes. Runtime alpha masks separate aura/wake and progressively reveal the wall. They do not repaint the character. SFX audition, mute, slow playback, repetition and frame inspection remain available.

Verification covers24 frame selections, three one-shot completions, audio controls, mobile width and browser errors. Straight contact and hook peak were inspected visually. The render caches reveal layers rather than creating large temporary canvases on every animation frame.
