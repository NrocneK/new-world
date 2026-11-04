# Green kick slashes

Reference: the user's anime kick image, with its magenta motion streak changed to green. This effect is a luminous, textured sweep, independent of the punches' fire attribute. The existing character atlases and timing are preserved.

## Material and motion

`site/art/kick-vfx-v1/slash.png` is the transparent generated texture, copied without pixel edits from `generated_images/exec-ce54b330-2074-4cb3-9c6b-9f496a4b648a.png`. The source is 2172 × 724. Its emerald/lime brush streak is warped along each kick's foot trajectory with 48 textured quads. Two finer offset streaks and a small blurred glow soften the edge; the tail tapers instead of forming a solid wedge.

`effect.json` is mirrored into the public asset folder. Coordinates use the unmodified 768 × 640 combat cel. The column centerline follows the texture's luminous core, so the leading end of the trail meets the shoe. The two front kicks sweep from the lower foot/chamber into extension and contact. The spinning kick uses manually checked shoe positions; the old metadata's early spinning inspection points can select a white shirt/cuff and are deliberately not used here.

The leading end reaches these shoes (zero-based cel index):

| Action | Cel | X | Y |
| --- | --- | --- | --- |
| Right kick | 3 | 599 | 257.5 |
| Right kick | 4 | 624.5 | 195.5 |
| Left kick | 3 | 608.5 | 256 |
| Left kick | 4 | 633.5 | 187 |
| Spinning kick | 10 | 492.5 | 387 |
| Spinning kick | 11 | 615 | 248.5 |
| Spinning kick | 12 | 644 | 252 |

Trails fade in place as the foot refolds. Preparation and the final guard do not create new trails. Frame inspection keeps a stable selected pose. Mirroring the whole combat layer also mirrors the trail, without changing registration or moving the support foot.

The near/right stroke draws in front of the actor. The far/left stroke uses the actor alpha as an occluder with a feathered far-leg opening: it covers the striking far leg and shoe, while the torso and near support leg remain in front. The glow is included before that mask to avoid leaking over the body.

## Audio and integration

`tools/build-sfx.py` synthesizes three mono 44.1 kHz PCM WAVs using filtered air noise and a short low contact component. Their durations are 0.28 / 0.30 / 0.42 seconds. Playback begins at extension (cel 3 for front kicks, cel 10 for the spinning kick). The page's sound control enables them, independently of the fire attribute.

Canonical renderer: `character-lab/kick-effects.js`, composed by `fire-effects.js`. Build with `node tools/build-character-lab.mjs`; the cache-separated public bundle is `site/art/character-lab-v3/` and the page remains `/character-lab`.

`node tests/kick-vfx.spec.cjs` checks traced shoe anchors, green pixel output, VFX/fire controls, preparation/guard absence, mirrored facing, audio loading and the kick chain. The existing character-lab suite checks the ten actions, fast right-to-left transition, input controls and mobile layout.
