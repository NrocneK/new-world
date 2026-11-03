# Fire review09 — soft golden emission and taller golden wall

`/fire-punch-v9` opens on the hook. The hand/forearm emit gold like the latest user reference, blending through orange back into the existing jacket. The treatment is a separate runtime layer using original sprite alpha and luminance. A cubic heat profile along the arm and a blurred region mask feather the transition rather than painting a hard red/yellow boundary. A separate hand luminance mapping retains knuckle lines. Original character PNGs and poses remain unchanged.

The new gold-wall source is imagegen exec-ee84cf0a-2250-4142-a42f-74642284a2e2, using the user's golden arm and large wall references. Its connected golden sheets, orange fissures, pointed tongues and flowing ribbons replace the earlier stack of small flame brushes. Soft growth reveal, slight shimmer and rising embers animate the image. It stays detached from the fist; its image registration is stored in wall-registration.json. The opaque upper/ground bounds are measured from the source, with small wisps/antialiasing outside those thresholds. A floor clip prevents source glow leaking below ground.

The user then requested more height: the wall is767 world pixels tall,30% taller than its initial590px setup. Its base stays at world640. The preview adds160px of headroom (920px canvas height), preserving the character's scale and displaying the entire upper flame. Wall horizontal fitting leaves an upper-arm gap and a right margin; actor positions/timing are unchanged in scene space. Labels and all three action previews share the same camera offset.

The two straight punch effects, long wakes, v3 combustion WAVs and selective far-arm occlusion are retained. Rendering tests verify10,678 body/near-arm pixels remain unchanged while2,706 far-arm pixels are coated. Golden heat tests compare VFX on/off: the hand gains green/yellow and loses blue, the forearm becomes luminous, and the cool shoulder remains nearly unchanged. An additional pixel check finds no effect below the floor. Browser checks cover all24 cels,3 one-shot completions, sound audition, toggles, direction display and mobile width. Hook peak and straight contacts are also visually inspected; these checks support rendering correctness rather than proving subjective art quality.

Run with repository root served on4173:

```sh
node art/vfx/fire-punch-v9/tools/browser-check.cjs
FIRE_ORIGIN=https://di-mon-demo.vercel.app node art/vfx/fire-punch-v9/tools/browser-check.cjs
```
