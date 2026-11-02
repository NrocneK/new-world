# Validation — campaign outline and Chapter Two clinic slice

The campaign outline is a design proposal for ten main chapters, with a complete ending. Chapters 3–10 are not implemented. The playable change is limited to Chapter Two's clinic approach and shared engine hooks required for that encounter.

Verified locally:

- `node tests/clinic-combat.spec.cjs`: armour reduction/break recovery, dormant wave gating and two-second breather, real wreck collision, reflected projectile ownership and enemy damage, burning, delayed area explosion, retry cleanup.
- `node tests/clinic-sample.spec.cjs`: actual keyboard wind reflection, complete two-wave fight and escort, sample debrief/continue, separate save and campaign completion, checkpoint migration from Chapter Two v1, real multi-touch run/release, purely vertical double jump, wind/pause, portrait title and campaign table layout.
- `node tests/level-physics.spec.cjs`: walking off either cabinet edge and NPC support regression, floor holes, swept landing and side collision.
- `node tests/chapter-one.spec.cjs`: full seven-floor descent plus ground floor, rescue, checkpoint/respawn, two boss attacks, ending, actual chapter transition with earned XP, mobile completion button and standalone offline load.
- `node tests/chapter-two.spec.cjs`: full street route with new encounter, clinic handoff/reload, both anchors, boss pounce and volley, evacuation ending, standalone offline assets and XP handoff.
- `node tests/chapter-cache-upgrade.spec.cjs`: upgrade from the previously deployed legacy worker; both chapters available offline after refresh.
- ZIP CRC tests; full offline package contains the campaign design page.
- Approved whole-frame hero pages, hero manifest, VFX assets, Chapter One configuration and collision solver compared byte-for-byte with the preceding published revision.

Playtesting still determines whether the fight's pacing and difficulty feel right. Completion by the automated player is evidence of functionality, not a claim that every chapter now meets the finished-game quality bar.
