# Fire review08 — selective far-arm layering and free flame flow

`/fire-punch-v8` opens on the hook. This iteration covers the user's final corrections: far-arm fire coats the visible far punching arm, but the torso and near guarding arm occlude it; the flat red arm treatment is removed; and the drawn green marks are interpreted as sweep direction, not a solid silhouette to fill.

Far-arm fire is composited with a cached actor-alpha occluder. Visible far-arm regions are excluded from that occluder, with a feathered transition at the wrist/arm overlap. Normalizing the occluder's near-solid alpha prevents the approved sprite's253/254-alpha interiors from leaking fire over the body. Original character PNGs remain unchanged. Near-arm fire remains foreground. A low-opacity warm highlight replaces the earlier hard arm contour/red paint while retaining the existing sleeve details.

The hook now advects24 textured flame brushes along a cubic sweep from the ground upward, with independent tongue variations, growing thickness, a restrained warm flow core and free outer breakup. It does not use the rejected green-boundary wall illustration, an opaque banana-shaped fill or an enclosing silhouette mask. The optional **Hướng quét** control displays only the centerline. Brush size increases from18 at the lower root toward228 at the upper flow. The plane is clipped at world floor640. Flow geometry is in flow.json; the visible flame edges vary with the brush animation rather than being a registered fixed outline.

Brushes are imagegen exec-ac216fda-fb66-460c-a8f0-a31c53fe70fa. Straight-fire art/tail lengths and v3 combustion SFX are reused. The rejected fixed silhouette output exec-850a1725 remains preserved in generated_images but is not shipped in this review. Character sheets and their24 punch cels/timing are referenced from approved attack-profile-v12.

Validation: the browser check covers24 frame controls, three one-shot completions, sound audition, toggles, direction guide, mobile width and page errors. A rendered on/off pixel comparison checks that10,678 near-body/guard pixels remain identical while2,706 visible far-arm pixels change under fire. These are rendering/occlusion checks, not claims about art quality. Hook peak and left/right contact images were also inspected visually.

Run with repository root served on4173:

```sh
node art/vfx/fire-punch-v8/tools/browser-check.cjs
FIRE_ORIGIN=https://di-mon-demo.vercel.app node art/vfx/fire-punch-v8/tools/browser-check.cjs
```
