# ROLLBACK

Add an entry before any large or risky change.

> **This project is not under version control.** There is no commit to revert
> to, so "Revert to commit" cannot be filled in honestly. Until `git init` is
> run, rollback means restoring from the file snapshot recorded in each entry.
> Raising this with Krishna is the first item in HANDOVER.md → Next Steps.

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
