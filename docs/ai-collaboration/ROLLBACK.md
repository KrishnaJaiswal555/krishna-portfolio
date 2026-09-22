# ROLLBACK

Add an entry before any large or risky change.

> **Version control initialised 2026-09-20**, with Krishna's approval. Rollback
> is now `git` rather than a scratchpad copy. Branch: `main`. No remote is
> configured and nothing has been pushed.
>
> Baseline commit — the full Phase 1–4 state, verified green:
> **`d626ed5c157b5d3e228a02fbf1d7673302bc76fc`**
> *"Portfolio scaffold and cinematic hero (Phases 1-4)"* — 28 files.

## 2026-09-22 — Work section visuals: artwork wiring, fixed backdrop, spatial hover

- Revert to commit: **`e333853`**.
- Files modified:
  - `src/data/content.js` — `art:` filename per project
  - `src/lib/assets.js` — `artSources()`; `art()` takes an ordered candidate list
  - `src/main.js` — card and case-study art resolved through `artSources()`
  - `src/lib/dialog.js` — pointer parallax on the case-study visual
  - `src/scenes/universe.js` — sibling cards dim while one is hovered
  - `src/styles/app.css` — fixed site backdrop (`body::before`)
  - `src/styles/scenes.css` — card artwork treatment; `.flow` background removed
  - `src/styles/project.css` — enlarged case-study frame
  - `tools/check_content.mjs` — asserts every project names its artwork
- **The images do not exist yet.** `public/assets/projects/` is empty, so every
  card and case study currently renders the generated schematic. The paths are
  wired and will pick up the JPGs the moment they are added — no code change.
- **Two things this change corrected, which a revert would reintroduce:**
  - `.flow` carried `background: var(--bg)` at z-index 2, inherited from an
    architecture where the hero was `position: fixed`. It is not, so the fill
    was vestigial — and it hid any fixed backdrop for four of six sections.
  - A `.stage-wrap` rule was added and removed; that class belongs to the
    reference implementation and does not exist in this markup.
- **Property ownership:** `transform` and `opacity` on `.pc` are written by
  `universe.js` every frame. Card rise and sibling dimming therefore live in
  JS, never CSS. Image scale is CSS because it targets the `<img>` inside the
  card — a different element, so no writer conflict.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: **12** checks (not 13)
  - `node tools/journey-interaction.mjs` → expected: all pass

## 2026-09-21 — Fix: timeline indicator regression + project overview visuals

- Revert to commit: **`f7e3a1c`** — the Phase 13 state.
- Files modified:
  - `src/scenes/journey.js` — indicator logic lifted out from behind the
    WebGL guard; click-to-pin added; scroll no longer overrides hover/pin
  - `src/main.js` — `renderJourney()` emits `<button>` again
  - `src/styles/scenes.css` — hover affordance restored, transition conflict
    fixed, fixed background on the Work section
  - `src/lib/assets.js` — per-project generated card art
- **Regression being fixed:** commit `4f2fa6e` (Phase 6) deleted `.jn:hover`
  from the active rule and changed the rows from `<button>` to `<div>`. Before
  that, the highlight followed the pointer through pure CSS with no JS
  involved. Reverting *this* fix reinstates that regression.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: `12 checks passed`
  - The indicator will again be stuck, and absent entirely without WebGL2

## 2026-09-21 — Phase 13: Deployment preparation

- Revert to commit: **`ff6e981`** — the Phase 12 state, verified green.
- Files added by Phase 13:
  - `.nojekyll`
  - `docs/ai-collaboration/features/FEATURE-010.md`
- Files modified by Phase 13:
  - `README.md` — deployment instructions per host
- **Lowest-risk phase in the project.** Nothing here affects what the site
  does; it affects only how a host serves it. Reverting cannot break the
  running page.
- One thing the rollback *would* reintroduce: without `.nojekyll`, GitHub
  Pages runs Jekyll over the repository and attempts to process every `.md`
  under `docs/`. Harmless in the usual case, but it is a build step nobody
  asked for and a class of failure nobody would expect.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: `12 checks passed`
  - Serve and load `/` → expected: entirely unchanged

## 2026-09-21 — Phase 12: Performance and accessibility

- Revert to commit: **`b2564a9`** — the Phase 11 state, verified green.
- Files added by Phase 12: `docs/ai-collaboration/features/FEATURE-009.md`
- Files modified by Phase 12:
  - `src/styles/app.css` — `--dimmer` raised to meet AA contrast
  - `index.html` — `role="list"` on lists, heading-order correction
  - `src/main.js` — `role="list"` on JS-built lists
- **Accessibility regression warning:** reverting this phase restores a
  `--dimmer` value measured at ≈3.0:1 against the page background, which is
  below the 4.5:1 AA minimum for the small supporting text that uses it, and
  removes list semantics that Safari VoiceOver needs. Do not revert this phase
  for a visual preference — change the token instead.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: `11 checks passed`
  - Serve and load `/` → expected: site renders identically apart from
    slightly dimmer secondary text

## 2026-09-21 — Phase 11: Responsive design

- Revert to commit: **`1d613f4`** — the Phase 10 state, verified green.
- Files added by Phase 11: `docs/ai-collaboration/features/FEATURE-008.md`
- Files modified by Phase 11:
  - `src/styles/app.css` — coarse-pointer tap targets
  - `src/styles/scenes.css` — overflow-safe grid tracks, a ≤400px refinement,
    and a short-landscape guard for the hero
  - `src/styles/project.css` — `100vw` → `100%`, coarse-pointer nav buttons
- **CSS-only phase.** No JavaScript, no scene, no scheduler changed. The
  rollback risk is visual regression only; nothing can break at runtime.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: `11 checks passed`
  - Serve and load `/` at 320px → expected: layout still usable, but the
    project deck again relies on the 620px media query rather than being
    overflow-safe by construction

## 2026-09-21 — Phase 10: Contact and footer (finale scene)

- Revert to commit: **`c9eb66d`** — the Phase 9 state, verified green.
- Files added by Phase 10:
  - `src/scenes/finale.js`
  - `docs/ai-collaboration/features/FEATURE-007.md`
- Files modified by Phase 10:
  - `src/gl/particles.js` — **`sampleHeading()` extracted** from hero.js
  - `src/scenes/hero.js` — now calls the shared `sampleHeading()`
  - `index.html` — closing wordmark, reveal hooks, `#finYear`, back-to-top
  - `src/main.js` — finale registered; copyright year set from the clock
  - `src/styles/scenes.css` — wordmark and footer-end treatment
- **Shared-code warning:** this phase moved heading measurement out of
  `hero.js` into `particles.js`. Deleting `finale.js` alone leaves `hero.js`
  importing `sampleHeading` — which still exists, so the hero keeps working —
  but reverting `particles.js` alone breaks `hero.js`'s import. Revert the
  commit as a unit, never file by file.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: `11 checks passed`, exit 0
  - `node --check src/scenes/hero.js` → expected: silent, exit 0
  - Serve and load `/` → expected: hero sequence intact, footer present and
    readable without a closing wordmark, no console errors

## 2026-09-21 — Phase 9: Skills and résumé

- Revert to commit: **`e21f075`** — the Phase 8 state, verified green.
- Files added by Phase 9: `docs/ai-collaboration/features/FEATURE-006.md`
- Files modified by Phase 9:
  - `index.html` — reveal hooks on the Skills section; the résumé block
    restructured from a bare `<p>` + button into a titled block
  - `src/main.js` — `renderSkills()` marks generated blocks `data-reveal`
  - `src/styles/scenes.css` — skills group and résumé block treatment
- **No behavioural risk:** this phase adds no new scene, no canvas and no
  scheduler. Everything added is markup, CSS, and reveal hooks that the
  existing `lib/reveal.js` already handles.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: `8 checks passed`, exit 0
  - Serve and load `/` → expected: Skills section present and readable,
    simply without staggered reveals

## 2026-09-21 — Phase 8: Project detail pages (architecture + case-study navigation)

- Revert to commit: **`8c49d97`** — the Phase 7 state, verified green.
- Files added by Phase 8: `docs/ai-collaboration/features/FEATURE-005.md`
- Files modified by Phase 8:
  - `src/data/content.js` — an `architecture` array added to all five projects
  - `src/lib/dialog.js` — prev/next stepping, arrow keys, nav state
  - `src/main.js` — architecture section in `renderCase()`, nav elements passed
  - `index.html` — nav controls inside the `<dialog>`
  - `src/styles/project.css` — nav bar, and taller bottom padding so the last
    line of a case study is not trapped under it
  - `tools/check_content.mjs` — asserts every project has an architecture
- **Check-coupling note:** the new assertion means reverting `content.js`
  alone, without also reverting `check_content.mjs`, leaves the content check
  failing. Revert the commit as a unit.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: `7 checks passed` (not 8)
  - Serve and load `/#project/ai-product-search` → expected: overlay opens,
    no nav bar, no console errors

## 2026-09-21 — Phase 7: Project Universe scene (constellation + deck choreography)

- Revert to commit: **`4f2fa6e`** — the Phase 6 state, verified green.
  `git reset --hard 4f2fa6e` undoes Phase 7 completely.
- Files added by Phase 7 (removed by the reset):
  - `src/scenes/universe.js`
  - `docs/ai-collaboration/features/FEATURE-004.md`
- Files modified by Phase 7 (restored by the reset):
  - `src/main.js` — universe registered in `startScenes()`
  - `index.html` — `data-reveal` on the Work heading
  - `src/styles/scenes.css` — universe layering, `is-deck-ready` initial
    state, and **`transform` removed from the `.pc` transition**
  - `docs/ai-collaboration/` — ARCHITECTURE, FLOW, HANDOVER, DECISIONS,
    TEST_CHECKLIST
- **Interaction warning on this rollback:** `universe.js` owns the card
  `transform` outright, which is why CSS no longer transitions or sets it on
  hover. Deleting the scene file without restoring the CSS hover transform
  leaves the cards with no hover motion at all. Revert the commit rather than
  deleting files piecemeal.
- Re-check after rollback:
  - `node --check` across the remaining 13 modules → expected: silent, exit 0
  - `node tools/check_content.mjs` → expected: `7 checks passed`, exit 0
  - Serve and load `/` → expected: earlier scenes intact, project deck static
    but fully readable and clickable, no console errors

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

- Revert to commit: **`d626ed5`** — *"Portfolio scaffold and cinematic hero
  (Phases 1-4)"*, which is the Phase 4 state.
- **Corrected 2026-09-22.** This entry was written before `git init` and read
  *"Revert to commit: none — no repository exists"*, pointing instead at a
  file snapshot in a session scratch directory. Both statements stopped being
  true the moment version control was initialised, and the scratch path is now
  gone. The snapshot is superseded by the commit above; the sha256 list below
  is kept only as a record of what the change touched.
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
