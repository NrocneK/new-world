# Air dash / adult side profile

Eight transparent 640×640 cels, four columns × two rows, 400ms one-shot. Common anchor (280,620), pelvis registered at (280,360), display scale 0.62. The airborne tuck pitches into a near-horizontal forward burst; hair and jacket trail behind, then the body returns to a fall-ready tuck.

`air-dash-source.png` is the new generated whole-figure source, retained unchanged. A wider 512×384 source cell accommodates the extended horizontal silhouette without shrinking it. It uses the same 484/450 whole-source scale as the ground dash and whole-cel translations only. Frame 0 copies the approved forward-knee jump-v3 apex cel without altering its pixels. Timing: [30,30,40,70,70,50,60,50]ms. Ground and air registration/packing/audit tools live in the sibling `anime-dash-profile-v1/tools/` directory.

The interactive burst travels up to 242 stage pixels, locks its starting direction and holds height for 400ms. Gravity resumes with zero vertical speed after recovery. It neither consumes nor restores the second jump. One air dash is allowed per flight, restored on landing; the normal ground dash recovery interval also applies. The “Nhảy → Air dash” button demonstrates the full takeoff/burst/fall/landing transition. Standalone card/GIF previews display the action at a fixed 140px height.

The lab offers PNG, normal GIF and half-speed GIF downloads, plus eight individually selectable poses. Source/registered art and prior approved actions remain separate.
