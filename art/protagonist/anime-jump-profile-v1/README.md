# Jump — anime side profile v1

Eight cels, 4 × 2, 384 × 640 per cel, transparent PNG. The neutral crown-to-sole distance matches the approved idle (484 px). The display scale remains 0.62 in the character lab. The sheet has preparation, anticipation, takeoff, rise, apex, descent, landing compression and recovery. Hair and jacket folds have small follow-through during rise/fall.

Generated source: `jump-source.png`, copied unchanged from `generated_images/exec-6c7f37b2-91ed-4953-9985-1274294cd1a3.png`, using approved anime walk v2 and idle v1 references. Packing only applies a single whole-figure scale of 484/472, shared by both jump actions, plus rigid translation. It does not resize limbs or deform the torso. Cels 0 and 7 reuse the approved idle cel to keep the start/end transition exact. The grounded crouch and landing are registered to the foot center and floor; airborne cels share a head reference so knee tucking does not move the character's root downwards.

The sheet's virtual floor is Y=620, horizontal anchor X=192, resting crown Y=136. Atlas blank headroom is intentional. Runtime height is handled separately from the cel. The 1100 ms preview includes 150 ms preparation, 750 ms ballistic flight and 200 ms landing/recovery. GIFs show the same stage scale and trajectory, with exact normal/2× slower container delays. Individual cels and stills are included for review.

Rebuild from the repository root with the local static server on port 4173:

```sh
python art/protagonist/anime-jump-profile-v1/tools/register.py
node art/protagonist/anime-jump-profile-v1/tools/pack.cjs
python art/protagonist/anime-jump-profile-v1/tools/audit.py
node tools/build-character-lab.mjs
```

Registration uses Pillow, NumPy and SciPy for read-only measurements; packing uses Playwright/Chromium Canvas and FFmpeg. GIF delay packing uses the existing v12 combat helper. Both original generated PNGs are preserved.

Interactive Space/W/↑ or the touch jump button starts a jump. A second press while airborne triggers the separate air-jump action, preserves horizontal velocity and adds an upward impulse. A third airborne jump is blocked. Landing resets the allowance and uses this sheet's cels 6–7 before returning to idle. `Nhảy → Air jump` demonstrates the complete pair. Frame inspection, slow playback, PNG/GIF download and left-facing mirroring are available in `/character-lab`.

Validation: `tests/jump-motion.spec.mjs`, `tests/character-lab-jump.spec.cjs`, the general anime-lab suite and the kick-VFX regression suite. `pose-audit.json` records unclipped bounds, floor registration, shared cels and exact GIF durations. Existing approved character, punch/kick effects and game-source hashes remain protected.
