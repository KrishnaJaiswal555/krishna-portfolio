# ROLLBACK

Add an entry before any large or risky change.

> **Version control initialised 2026-09-20**, with Krishna's approval. Rollback
> is now `git` rather than a scratchpad copy. Branch: `main`. No remote is
> configured and nothing has been pushed.
>
> Baseline commit — the full Phase 1–4 state, verified green:
> **`d626ed5c157b5d3e228a02fbf1d7673302bc76fc`**
> *"Portfolio scaffold and cinematic hero (Phases 1-4)"* — 28 files.

## 2026-09-21 — Phase 6: Journey scene (particle spine + milestone rail)

- Revert to commit: **`a2b89eb`** — the Phase 5 state, verified green.
  `git reset --hard a2b89eb` undoes Phase 6 completely.
- Files added by Phase 6 (removed by the reset):
  - `src/scenes/journey.js`
  - `docs/ai-collaboration/features/FEATURE-003.md`
- Files modified by Phase 6 (restored by the reset):
  - `src/data/content.js` — **timeline restructured**: six nodes to five, real
    date granularity instead of a repeated "2026", and the unconfirmed
    "B.Tech completed" milestone removed
  - `src/main.js` — `renderJourney()` emits a `<div class="jn">` instead of a
    `<button>`; journey registered in `startScenes()`
  - `index.html` — `data-reveal` on the Journey heading
  - `src/styles/scenes.css` — journey layering, wider year column, active
    milestone marker
  - `docs/ai-collaboration/` — ARCHITECTURE, FLOW, HANDOVER, DECISIONS,
    TEST_CHECKLIST
- **Content warning on this rollback:** reverting restores the old timeline,
  which prints "2026" as the axis label on five of six rows and reasserts
  "B.Tech completed" — a claim Krishna has never confirmed. If Phase 6 is
  rolled back for a rendering reason, re-apply the `content.js` timeline
  change on its own; it is independent of the scene.
- Re-check after rollback:
  - `node --check` across the remaining 12 modules → expected: silent, exit 0
  - `node tools/check_content.mjs` → expected: `7 checks passed`, exit 0
  - Serve and load `/` → expected: hero and About intact, Journey rail plain
    but fully readable, no console errors

## 2026-09-20 — Phase 5: About scene (lattice + scroll reveals)

- Revert to commit: **`d626ed5`** — the Phase 1–4 baseline, verified green.
  `git reset --hard d626ed5` undoes Phase 5 completely.
- Files added by Phase 5 (removed by the reset):
  - `src/lib/reveal.js`
  - `src/scenes/about.js`
  - `docs/ai-collaboration/features/FEATURE-002.md`
- Files modified by Phase 5 (restored by the reset):
  - `index.html` — About canvas + six `data-reveal` hooks
  - `src/styles/scenes.css` — canvas layering, reveal states
  - `src/main.js` — `reveal()` call + scene registry loop
  - `docs/ai-collaboration/` — HANDOVER, DECISIONS, FLOW, TEST_CHECKLIST
- Re-check after rollback:
  - `node --check` across the remaining 10 modules → expected: all silent, exit 0
  - `node tools/check_content.mjs` → expected: `7 checks passed`, exit 0
  - Serve and load `/` → expected: hero sequence intact, About section plain
    but fully readable, no console errors
- Partial rollback note: `reveal()` is called before any scene initialises, so
  removing `src/lib/reveal.js` without also removing its import and call in
  `main.js` breaks the whole page. Revert the commit rather than deleting
  files piecemeal.

## 2026-09-20 — Phase 4: cinematic hero particle field

- Revert to commit: **none — no repository exists.**
- Snapshot taken before the change:
  `C:\Users\rushv\AppData\Local\Temp\claude\C--Users-rushv\3047e710-d587-4e91-aa2f-ad626be96b42\scratchpad\phase4-snapshot\`
  **Note:** this is a session scratchpad and is not durable. Copy it somewhere
  permanent, or initialise git, before relying on it.
- Files to restore (sha256, first 16 chars, as they were before Phase 4):
  - `src/main.js` — `263d71fcf03741ff`
  - `src/styles/scenes.css` — `1b20be0b328d98be`
  - `index.html` — `bec2edfd71b0aee7` *(unchanged by Phase 4; snapshotted as a
    precaution because the hero markup was in scope)*
- Files to delete to undo the change (new in Phase 4, not in the snapshot):
  - `src/gl/particles.js`
  - `src/scenes/hero.js`
- Also changed after the snapshot was taken, by a dead-code cleanup rather
  than by the feature itself (both were verified to have no callers, so
  restoring them is not required for a rollback):
  - `src/gl/renderer.js` — removed the unused `unitQuad()` export
  - `src/lib/scene.js` — removed the unused `progress()` export and the
    `clamp` import that existed only to serve it
- Re-check after rollback:
  - `node --check src/main.js` → expected: prints nothing, exit 0
  - `node tools/check_content.mjs` → expected: `7 checks passed`, exit 0
  - Serve and load `/` → expected: hero copy visible immediately, no canvas
    animation, no console errors
