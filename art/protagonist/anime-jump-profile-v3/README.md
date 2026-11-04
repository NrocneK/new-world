# Jump v3 — right knee lifts forward

This revision corrects the right/near leg during flight. Its knee moves progressively ahead of the hip and rises in front of the body; the heel no longer curls behind the body at the apex. The left/far knee remains the higher drive knee before its leg extends into left-first contact.

Only zero-based cels3–10 are replaced. Takeoff cels0–2 and grounded compression/recovery cels11–15 are copied byte-for-byte from v2 into the new PNG atlas. The16-cel layout,1300ms timeline, anchors, uniform display scale, right-toe takeoff and left-first landing remain. Air-jump artwork, raised impulse and camera are unchanged.

`forward-knee-source.png` is the unchanged generated source from `exec-10d9d166-d405-4a79-9847-d8af44e9ebe4.png`. It used the approved walk identity, the first long-leg rising cel and the new `forward-knee-guide.png`. The diagram identifies the foreground right leg and places its knee ahead of the hip throughout the tuck. One scale is applied to all eight replacement complete drawings. There are no limb warps or separately assembled body parts.

Rebuild from repository root with its local static server on port4173:

```sh
python art/protagonist/anime-jump-profile-v3/tools/register.py
node art/protagonist/anime-jump-profile-v3/tools/pack.cjs
python art/protagonist/anime-jump-profile-v3/tools/audit.py
node tools/build-character-lab.mjs
```

Packing uses Canvas/FFmpeg for previews and PNG row copies for exact preservation of unaffected cels. The audit checks the forward-tuck silhouette (the old rear-heel region is empty), both apex shoes ahead of the body, left-first contact, unclipped bounds, exact normal/slow GIF timing and pixel-identical preserved cels. Browser review covers the mirrored left-facing apex as well as the normal orientation. `/character-lab` uses the cache-separated v7 bundle and exposes PNG and normal/slow GIF downloads.
