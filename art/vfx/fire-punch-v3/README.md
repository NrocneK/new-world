# Fire punch review 03

`/fire-punch-v3` reviews all three approved punches with separate VFX/SFX. Character atlases and their timing remain referenced from attack-profile-v12 without modification. The fire source is the existing imagegen atlas from fire-punch-v2.

Straight punches scale the effect uniformly from0.46 to0.85, a1.85x increase in both head size and wake length. Rendering puts the full wake behind the actor and a masked fiery head in front of the fist. The head mask fades near the wrist so the flames cover the whole fist while the face remains readable. A tail fade hides the original cell crop edge. These masks are runtime compositing, not modifications to the source artwork.

The hook grows to scale1.3 at frames05–08, 1.53x the straight-punch effect dimensions. Its flame rotates upward with the fist path. This is a rotated plume, not a new curved fire atlas. Character motion and contact anchors stay unchanged. After each action, residual flames decay over220ms in world space rather than following the returning hand.

New original WAVs are built by `python art/vfx/fire-punch-v3/tools/build-sfx.py`: warm broadband combustion roar, turbulent air, sparse filtered crackles and a low contact transient. There is no pitched sweep from the earlier synthesized effect. Three deterministic variants; hook has a longer tail and stronger low body. Per-file peaks remain below full scale. The page has a separate SFX audition button, mute, slow playback, one-shot, repeat and24 frame inspection buttons across three actions. Slow motion changes visual timing; audio plays at its original pitch and length.

Validation: all24 frame selections, three one-shot completions, larger hook scale, sound audition controls, mobile width and browser errors. Rendered straight contact and hook peak were inspected visually. Audio construction/levels and browser playback were checked; the user can judge timbre with the audition control.
