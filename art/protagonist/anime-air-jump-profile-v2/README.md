# Higher air jump v2

The eight-cel PNG is byte-identical to air-jump v1. This revision changes the upward impulse, playback timing and GIF trajectory; it does not redraw the approved air-jump poses.

Vertical launch speed increases from 540 to 720 stage px/s under unchanged 1600px/s² gravity. Extra height from the second impulse increases from 91.125 to 162px. The first jump remains 112.5px high. A second jump near that apex reaches about 274.5px above the original floor. Horizontal momentum and the two-jump limit are preserved.

Preview length is now1100ms, starting100px above the floor. The camera follows the higher part of the trajectory, keeping the character's crown inside the stage in normal and close-up views without resizing the sprite. Interactive floor contact uses jump v2's left-first landing, compression and recovery. Build/audit instructions are in `../anime-jump-profile-v2/README.md`.
