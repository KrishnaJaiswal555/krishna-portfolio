# ROLLBACK

Add an entry before any large or risky change.

> **Version control initialised 2026-09-20**, with Krishna's approval. Rollback
> is now `git` rather than a scratchpad copy. Branch: `main`. No remote is
> configured and nothing has been pushed.
>
> Baseline commit — the full Phase 1–4 state, verified green:
> **`d626ed5c157b5d3e228a02fbf1d7673302bc76fc`**
> *"Portfolio scaffold and cinematic hero (Phases 1-4)"* — 28 files.

## 2026-09-24 (later) — Real browser verification; amplitude raised again

- Revert to commit: **`8a43f72`**.
- Files added: `tools/browser-verify.mjs` — real Chrome via DevTools Protocol
- Files modified:
  - `src/lib/backdrop.js` — `TRAVEL_FINE` 0.40 → **0.70**, `TRAVEL_COARSE`
    0.12 → **0.20**
  - `src/styles/app.css` — `inset: -24vh 0` → **`-38vh 0`**
  - `tools/backdrop-motion.mjs` — slack and settle constants follow
  - `package.json` — `test:browser` script
- **`browser-verify.mjs` is the only check in this project that can see.**
  Every other harness stubs the DOM. Do not delete it as redundant.
- **It must keep `Emulation.setEmulatedMedia` forcing
  `prefers-reduced-motion: no-preference`.** Headless Chrome defaults to
  `reduce`, and app.css disables the parallax under that with `!important`.
  Without the override the harness measures the accessibility path and reports
  a static backdrop — which is indistinguishable from the bug it exists to
  catch. This cost one full false diagnosis.
- **Reverting the amplitude gives back a measured 55.7px per screenful**, which
  Krishna reported as static. Nothing will fail; it will simply be too subtle
  again.
- **`TRAVEL_FINE`, `inset` and the framing move together.** A larger budget
  means a larger resting offset, which sits the photograph lower in the hero.
  Lowering the travel restores the original crop.
- Re-check after rollback:
  - `node tools/browser-verify.mjs` → expected: passes, but one screenful
    measures ~55px rather than ~97px
  - `node tools/backdrop-motion.mjs` → expected: fails the slack assertion
    unless `inset` is reverted in the same step

## 2026-09-24 — Raise the parallax amplitude; abbreviate one Journey date

- Revert to commit: **`4719704`**.
- Files modified:
  - `src/lib/backdrop.js` — `TRAVEL_FINE` 0.10 → **0.40**, `TRAVEL_COARSE`
    0.045 → **0.12**
  - `src/styles/app.css` — `inset: -7vh 0` → **`-24vh 0`**
  - `tools/backdrop-motion.mjs` — new per-screenful rate assertion; slack and
    settle constants updated to match
  - `src/data/content.js` — `'December 2025'` → `'Dec 2025'` (formatting only)
- **These two changes are unrelated** and can be reverted independently. The
  date is `content.js` alone; the amplitude is the other three files.
- **Reverting the amplitude restores a working-but-invisible effect**, not a
  broken one. Nothing will throw and no check will fail — the parallax simply
  drops to ~11px per screenful and reads as a static background again. That is
  the whole reason this round existed.
- **The three numbers move together.** `TRAVEL_FINE` (0.40) sets the budget,
  `inset` (24vh) must exceed half of it, and `backdrop-motion.mjs` asserts both
  the rate floor and the slack ceiling. Changing one alone will fail the test.
- **Do not revert the rate assertion on its own.** `travelled > 60px` passed
  against the defect; `perScreen > 25` is the check that catches it.
- Re-check after rollback:
  - `node tools/backdrop-motion.mjs` → expected: fails at
    "moves 11.4px per screenful, which is perceptible"
  - `node tools/check_content.mjs` → expected: **14** checks, unaffected
  - Scroll on desktop → expected: the background appears static again

## 2026-09-23 — Backdrop scroll parallax, and two more Journey milestones

- Revert to commit: **`93ca2d0`**.
- Files added:
  - `src/lib/backdrop.js` — the parallax module
  - `tools/backdrop-motion.mjs` — its headless contract test
- Files modified:
  - `src/styles/app.css` — `body::before` gains `inset: -7vh 0`, a
    `translate3d(0, var(--bg-y, 0px), 0)` and `will-change`; the reduced-motion
    block gains `body::before { transform: none !important; }`
  - `src/main.js` — imports and calls `initBackdrop()`
  - `src/data/content.js` — two `timeline` entries added
  - `package.json` — `test:backdrop` script
- **Two independent changes in one commit.** If only one needs undoing, revert
  the files rather than the commit: the parallax is `backdrop.js` + `app.css` +
  `main.js`, the Journey entries are `content.js` alone. They share nothing.
- **`inset: -7vh 0` is not cosmetic.** It is the slack the translate moves
  within. Restoring `inset: 0` while leaving the transform in place would let
  the layer's edge swing into view at the top and bottom of the page. If
  `TRAVEL_FINE` or `TRAVEL_COARSE` in `backdrop.js` is ever raised, raise the
  inset first — `backdrop-motion.mjs` asserts the relationship and will fail.
- **Do not "simplify" the custom property into an inline style.** The target is
  a pseudo-element; JS cannot set inline styles on `::before`. The property on
  `<html>` inheriting into it is the mechanism, not a detour.
- **Do not make the rAF loop unconditional.** It stops when the offset settles
  and restarts on scroll. This is the only frame loop in the project outside
  `lib/scene.js`, and the only one not gated by an IntersectionObserver.
- **Reverting restores the reported bug:** the backdrop becomes static on
  desktop again. It will still appear to move on iOS Safari — that motion is a
  viewport artifact of the collapsing URL bar and was never produced by this
  code.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: **14** checks; the timeline
    assertion passes either way, since it is count-independent
  - `node tools/backdrop-motion.mjs` → expected: fails at
    "the backdrop MOVED between top and bottom", travelling 0px
  - Scroll on desktop → expected: the background does not move at all

## 2026-09-22 — Add vercel.json so Vercel stops looking for dist/

- Revert to commit: **`f0c773e`**.
- Files added: `vercel.json`
- Files modified: `README.md` — the Vercel deployment section
- **Nothing in the site changed.** No HTML, CSS, JS, asset or content file was
  touched. This affects only how a host is told to serve the repository, so a
  revert cannot alter what the page does — it can only make the Vercel deploy
  fail again the same way.
- **What the failure was:** Vercel's framework auto-detection inferred a
  bundled project and looked for a `dist/` output directory. This project has
  no bundler and produces no output, so the deploy failed on a directory that
  was never going to exist. `"framework": null` is the line that stops the
  detection; `"outputDirectory": "."` states that the published site *is* the
  repository root.
- **Do not "fix" a recurrence by creating a `dist/` directory**, and do not
  convert the project to Vite or another bundler to satisfy the host. Verified
  at the time of this change: every import in `src/` is relative, there are
  **zero bare module specifiers**, and `package.json` declares no dependencies
  — so nothing here requires a build.
- **A dashboard setting overrides `vercel.json`.** If the deploy still looks
  for `dist/` after this commit, the Output Directory override in the Vercel
  project settings is the cause, not this file.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: `14 checks passed` (unchanged;
    this commit does not touch anything the content check reads)
  - Redeploy on Vercel → expected: the original failure returns

## 2026-09-22 — Remove the decorative grid overlay; one background only

- Revert to commit: **`6bebd51`**.
- Files modified: `src/styles/app.css`, `src/styles/scenes.css`
- Removed:
  - two `repeating-linear-gradient` grid layers from `body::before`
  - two cyan radial "pools" from `body::before` — the photograph supplies its
    own glow and constellation
  - **`.universe::before` in its entirety**, a second full-section background
    layer carrying its own 96px grid and an *opaque* charcoal wash at
    `opacity: .85`
  - the `prefers-reduced-motion` rule that existed only to serve it
- Changed: the backdrop wash from `.88/.93` to **`.38/.52`**, so the Earth and
  constellation in the photograph read through it.
- **Why two grids produced boxes:** both were 96px, but one was fixed to the
  viewport and the other anchored to its section, so their origins diverged on
  every scroll and they beat against each other continuously. A comment in
  app.css had asserted that equal pitch made a moiré impossible; equal pitch
  only prevents interference between grids that *share an origin*. That
  reasoning is kept in the comment so the idea is not reinvented.
- **Do not re-add a section-level background.** There is one decorative
  background on this site: `body::before`. Sections do not get their own.
- **Tuning knob:** the wash alphas in `body::before`. Raise to push the
  photograph back, lower to bring it forward.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: `14 checks passed`
  - Scroll the page → expected: the box/grid pattern returns over the artwork

## 2026-09-22 — BUG-002: card artwork never painted (detached lazy image)

- Revert to commit: **`83e01e1`**.
- Files modified:
  - `src/lib/assets.js` — removed `loading = 'lazy'` from the detached image;
    added a stall guard so the promise always settles
  - `src/styles/scenes.css` — explicit `position`/`z-index` on the artwork
    image, so its order against the overlay is stated rather than incidental
  - `tools/debug-art.html` — added; a diagnostic page, not part of the site
- **Do not re-add `loading = 'lazy'` in `art()`.** That is the bug. Lazy
  loading is defined for images connected to a document; the image there is
  detached until it resolves, so the hint can defer the fetch indefinitely —
  neither `onload` nor `onerror` fires, the promise never settles, nothing is
  appended, and the frame stays empty **with no console error**, because
  nothing failed. Lazy loading on the *rendered* `<img>` would be fine; it is
  the detached-plus-lazy combination that deadlocks.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: `14 checks passed`
  - Open `/tools/debug-art.html` → expected: section 2 shows **TIMEOUT** for
    every project, which is the signature of this bug

## 2026-09-22 — Asset integration: the six images, supplied as .jpeg

- Revert to commit: **`9a165a6`**.
- Files modified:
  - `src/data/content.js` — five `art:` values `.jpg` → `.jpeg`
  - `src/styles/app.css` — background url `.jpeg`; wash lightened .93/.965 → .88/.93
  - `src/styles/scenes.css` — `.pc__art` 16/10 → 3/2; `object-position: center`
  - `src/lib/assets.js` — console warning when every candidate fails; second
    candidate retargeted to `public/assets/projects/<id>.png`
  - `tools/check_content.mjs` — asserts each artwork **exists on disk** (14 checks)
  - `tools/deploy-audit.mjs` — counts media in the shipped payload
  - `public/assets/projects/.gitkeep` — rewritten; it carried stale filenames
  - README, HANDOVER, TEST_CHECKLIST, FEATURE-010, FEATURE-011
- Files added (untracked before this commit): `public/assets/` — six JPEGs,
  1267.8 KB total.
- File deleted: `public/projects/.gitkeep` — that directory was **renamed** to
  `public/assets/projects/` when the artwork arrived.
- **Reverting will break the artwork.** The images live at paths this commit
  introduced. A revert restores `.jpg` references against `.jpeg` files, so
  every card falls back to the generated schematic and logs the console
  warning. If you need to undo the *styling* only, change the CSS rather than
  reverting the commit.
- **Tuning knob, not a bug:** the backdrop wash alphas in `app.css`
  `body::before`. Raise them to push the photograph further back, lower them
  to bring it forward.
- Re-check after rollback:
  - `node tools/check_content.mjs` → expected: **13** checks, and the on-disk
    artwork assertion will be gone
  - Every project image request → expected: `404`

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
