# HANDOVER

Read at the start of every session. Keep it current, not complete.

## Project
- Name: krishna-portfolio
- Purpose: Cinematic personal portfolio for Krishna Jaiswal (AI / Data Science /
  Machine Learning). Vanilla ES modules + WebGL2, no framework, no build step,
  no runtime dependencies. Deployable to any static host.
- Version control: `git`, branch `main`, no remote configured, nothing pushed.
  Commit SHAs are **not** duplicated here — `git log` and ROLLBACK.md are the
  record. Copying them into this file is what made it go stale before.

## Done
- Phase 1 — reference analysis of `github.com/gireeshkumarreddy/cinematic-portofilo`.
  Confirmed **no licence** (no LICENSE file; GitHub API returns `license: null`
  and 404 on `/license`). All-rights-reserved: none of its code, styles or
  media may be reused. Techniques are ideas and were reimplemented from scratch.
- Phase 2 — architecture decided and approved (see DECISIONS.md).
- Phase 3 — scaffold: semantic markup, `content.js` as single source of truth,
  case-study `<dialog>`, CSS token system, WebGL bootstrap.
- Phase 4 — hero (FEATURE-001): field condensing into the wordmark.
- Phase 5 — About (FEATURE-002): field as a lattice, plus `lib/reveal.js`.
- Phase 6 — Journey (FEATURE-003): field as a spine, plus a timeline data
  correction (year axis did not fit the data; unconfirmed graduation removed).
- Phase 7 — Project Universe (FEATURE-004): field as a constellation between
  the cards, plus the deck's entrance, depth parallax and hover lift.
- Phase 8 — Project detail pages (FEATURE-005): `architecture` added to all
  five projects (the only genuine gap against the brief's §8 list), rendered
  as an ordered pipeline; prev/next stepping between case studies with arrow
  keys; a new content assertion, so the check now reports **8**, not 7.
- Phase 13 — Deployment preparation (FEATURE-010): `.nojekyll`, per-host
  README instructions, and a pre-deployment audit that came back **clean** —
  no root-relative references (which would 404 on a GitHub Pages *project*
  site while working perfectly on localhost), no secrets, no `localhost` in
  shipped files. **25 files, 1422.8 KB** (code 155.0 KB + media 1267.8 KB) —
  re-measured 2026-09-23 after `lib/backdrop.js` was added. The earlier figure of
  18 files / 134.1 KB counted no images at all, and understated the real
  payload roughly tenfold once they existed; `deploy-audit.mjs` now counts
  media. Re-measured also because the
  "shipped" set now excludes `tools/` and the site grew with the BUG-001 fix;
  see FEATURE-010. **Not deployed:** no remote is configured and nothing has
  been pushed.
- Phase 12 — Performance and accessibility (FEATURE-009): `--dimmer` raised
  from a measured ≈3.0:1 to ≈5.7:1 (it carried small secondary text and was
  below the 4.5:1 AA floor), with a **standing contrast assertion** that reads
  the real tokens out of `app.css` so it cannot regress. `role="list"` on all
  ten lists — `list-style: none` strips list semantics in Safari/VoiceOver.
  Heading order verified: exactly one `<h1>`. The content check reports **12**.
- Phase 11 — Responsive design (FEATURE-008): layout made overflow-safe **by
  construction** rather than by media query. `100vw` → `100%` on the case
  dialog (`vw` includes the scrollbar gutter); all `auto-fit` tracks given a
  `min(Npx, 100%)` floor; `pointer: coarse` tap targets keyed on input device
  rather than viewport width; a ≤400px refinement and a short-landscape guard.
- Phase 10 — Contact and footer (FEATURE-007): the last canvas wired. The
  finale **reuses** the hero's wordmark configuration as a closing bookend,
  gathering on scroll rather than on a clock. `sampleHeading()` extracted to
  `particles.js` and shared by both scenes. Copyright year set from the clock;
  back-to-top link added.
- Phase 9 — Skills and résumé (FEATURE-006): reveal hooks across the one
  section that had none; skill groups separated; the résumé given a titled
  block; `location` finally rendered on the experience line. Three further
  assertions added so every field a renderer prints is now asserted — the
  check reports **11**. No proficiency scores, bars or ranking: no verified
  data exists for any of it.

**The four particle configurations are complete and the set is closed:**
wordmark, lattice, spine, constellation. A fifth scene should reuse one rather
than invent another — the coherence of the set is the point.

## In Progress
- **Backdrop scroll parallax added (2026-09-23) — BUG-003.** Krishna reported
  the background static on desktop but moving on mobile Safari. **There was no
  parallax system at all**: `body::before` is `position: fixed` with no
  transform, so desktop was correctly immobile — and the mobile motion was an
  iOS artifact (the collapsing URL bar resizes the visual viewport, which
  re-centres a `cover` background), not a feature. `src/lib/backdrop.js` now
  publishes a damped, scroll-linked `--bg-y` that `body::before` translates by.
  Touch gets 4.5% of viewport height, mice 10%, because the iOS artifact still
  composes on top. The loop stops when settled. `tools/backdrop-motion.mjs`
  asserts it actually moves. **Awaiting browser confirmation.**
- **Two Journey milestones added (2026-09-23) — FEATURE-012.** Skin Lesion
  Classification (`December 2025`, inserted chronologically at index 1) and AI
  Career Copilot. A `content.js`-only change; the rail, its styling and its
  animations were not touched, and new rows pick up reveal, pin, hover and the
  spine automatically. **AI Career Copilot's date is unconfirmed** — nothing in
  the repo dates it, so it carries a bare `'2026'` rather than an invented
  month. Krishna needs to supply the real one.
- **Vercel deployment fixed (2026-09-22) — awaiting Krishna's redeploy.** The
  first real deploy failed: Vercel's framework auto-detection expected a
  `dist/` directory, which this project does not and should not produce. Added
  `vercel.json` with `"framework": null`, `"outputDirectory": "."` and
  `"buildCommand": "npm run build"`. **No site file was touched** — no HTML,
  CSS, JS, asset or content change. Verified first that no bundler is required:
  **zero bare module specifiers**, no dependencies, no lockfile, no bundler
  config. Dashboard settings, if any override remains: Framework Preset
  **Other**, Build Command `npm run build`, Output Directory `.` — note a
  dashboard override beats `vercel.json`. See FEATURE-010.
- **Background grid overlay removed (2026-09-22).** Two 96px
  `repeating-linear-gradient` grids existed — one in `body::before`, one in
  `.universe::before`. One was fixed to the viewport and the other anchored to
  its section, so their origins diverged on scroll and they beat against each
  other, reading as a moving pattern of transparent boxes over the artwork.
  Both removed, along with `.universe::before` entirely (a second background
  layer with an opaque wash) and the cyan pools. The wash was lightened
  `.88/.93` → `.38/.52`. **There is one decorative background: `body::before`.
  Sections do not get their own.** Awaiting browser confirmation.
- **BUG-002 — card artwork never painted.** Root cause: `art()` set
  `loading = 'lazy'` on a **detached** `Image`. Lazy loading applies to images
  connected to a document, so the fetch could be deferred forever: neither
  `onload` nor `onerror` fired, the promise never settled, nothing was
  appended, and **nothing was logged** because nothing failed. The frame sat
  empty. This also explains the "empty dark areas" reported *before* any image
  existed — the generated schematic was never appearing either.
  Fixed, plus a stall guard so the promise always settles, plus
  `tools/art-loader.mjs`, the loader test that was missing.
  **Awaiting browser confirmation.**
- **Post-phase fix round, awaiting browser confirmation.**
  - BUG-001 — the cyan milestone indicator was stuck. A regression I
    introduced in `4f2fa6e` (Phase 6): the `.jn:hover` CSS affordance was
    deleted, and the per-frame scroll branch undid every hover. Fixed with a
    pin > hover > scroll precedence, click-to-pin, and the indicator logic
    lifted out from behind the WebGL guard.
  - FEATURE-011 — per-project card schematics replacing the single shared
    constellation, plus a fixed CSS-gradient backdrop on the Work section
    (zero bytes, zero requests), scoped to `.universe` so it cannot reach the
    Journey indicator.
  - Work-section visuals (2026-09-22) — artwork paths wired to the supplied
    filenames, fixed site backdrop, spatial card hover, enlarged case-study
    visual with pointer parallax. **The six image files do not exist**, so
    cards and case studies still render generated schematics; the paths pick
    the images up with no code change once supplied.
- All thirteen development phases remain written and committed.

## Assets Krishna still needs to supply
**Delivered 2026-09-22** — all six supplied as `.jpeg`, not `.jpg`, and every
code reference was updated to match rather than duplicating the files:

- ✅ `public/assets/projects/product-search.jpeg` (167 KB)
- ✅ `public/assets/projects/career-copilot.jpeg` (185 KB)
- ✅ `public/assets/projects/retail-analytics.jpeg` (244 KB)
- ✅ `public/assets/projects/skin-lesion-cnn.jpeg` (293 KB)
- ✅ `public/assets/projects/upi-sentinel.jpeg` (178 KB)
- ✅ `public/assets/portfolio-background.jpeg` (232 KB)

All six verified over HTTP: `200`, `image/jpeg`, byte counts matching disk.
`check_content.mjs` now asserts each file **exists on disk**, so a rename or
typo fails loudly instead of degrading silently to the generated schematic.

Still outstanding:
- `public/resume/Krishna_Jaiswal_Resume.pdf`

The filename→project mapping lives in `content.js` as `art:`; it is **not**
derived from the id, and `check_content.mjs` asserts it.

## Broken / Blockers
- None known.
- **Open gap — no browser pass has ever been done, in any phase.** Every row
  in the Manual Checks tables of TEST_CHECKLIST.md is unverified across seven
  phases of visual work. Krishna has three times chosen to continue rather
  than pause for it; that is his call, but nothing on this site has been seen
  rendering, and the risk compounds with each scene.

## Avoid
- Reusing any code, CSS, shader or media from the reference repository — Why:
  it carries no licence, so default copyright applies.
- Adding a framework, bundler or animation library — Why: the architecture was
  chosen specifically to avoid them; see DECISIONS.md.
- Changing `overflow-x: clip` to `hidden` in `app.css` — Why: `hidden` promotes
  `<body>` to a scroll container and breaks every `position: sticky` pin.
- Removing `"type": "module"` from `package.json` — Why: Node then parses
  `content.js` as CommonJS and `check_content.mjs` fails on the first `export`.
- **Hiding anything in CSS by default.** Hero copy, `[data-reveal]` elements
  and the project deck all stay visible until JS proves it can reveal them
  (`is-gl`, `is-reveal-ready`, `is-deck-ready`). This is the #0003 defect class.
- **Letting CSS set or transition a property JS animates per frame.**
  `transform` on `.pc` and the deck belongs to `universe.js` alone.
- Sampling the wordmark before `document.fonts.ready` — Why: it bakes the
  fallback face's letterforms into the particle field.
- Re-randomising lattice jitter on resize — Why: the field visibly twitches.
- Measuring animated elements with `getBoundingClientRect()` — Why: a
  transform moves the rect but not layout, so the scene reads its own output.
  Use `offsetTop`/`offsetLeft`. This has now bitten three scenes.
- Restoring a "graduated" or "B.Tech completed" timeline milestone — Why:
  Krishna never confirmed it.
- Making timeline rows interactive again — Why: activating one does nothing,
  and a control that does nothing is worse than plain text for assistive tech.
- Writing any personal fact, metric or URL outside `src/data/content.js`.
- Lowering any colour token without re-running `check_content.mjs` — the
  contrast assertion reads the real values out of `app.css`, and `--dimmer`
  has already failed AA once.
- Creating a `<ul>`/`<ol>` in JS without going through `main.js → list()`,
  which sets the `role` that `list-style: none` otherwise strips.
- Adding a profile photograph — Why: Krishna has explicitly declined to supply
  one; the design deliberately needs none.

## Next Steps

Krishna has directed that all remaining development phases be completed
first, with a full browser verification on localhost afterwards. Phases are
being committed individually to preserve rollback granularity.

**The browser verification is the only thing left, and it is the whole
remaining risk.** Thirteen phases of visual work have been built and none of
it has ever been seen rendering. Everything verified so far is structural —
syntax, contracts, wiring, contrast arithmetic, path safety — and *none* of
that can tell you whether the particles align to the letterforms, whether the
scroll feels right, or whether anything is visibly broken.

To run it:

```bash
python tools/serve.py 5173      # then open http://localhost:5173
```

Fill in the Actual column of every Manual Checks table in TEST_CHECKLIST.md,
covering: desktop layout, mobile responsiveness, navigation and scrolling,
animations and particle effects, interactive elements, console errors, and
performance.

**No row may be marked done unless the site has actually been opened and
driven in a browser.** An automated check passing is not a substitute and must
never be recorded as one.

Likeliest first finding: `sampleHeading()`'s baseline factor (`fontSize *
0.78`). If the hero or finale particles sit offset from the letterforms, that
constant is why — and it is in one shared place for exactly this reason.

Add a ROLLBACK entry before any further change.

## Last Session Handoff
Rewrite these five lines at the end of every session.
- Date: 2026-09-23
- AI model: Claude Opus 5 (1M context)
- Did: Added the backdrop scroll parallax (BUG-003) after establishing there was
  never a parallax system to re-enable, and that the "working" mobile motion was
  an iOS viewport artifact. Added two Journey milestones (FEATURE-012) as a
  data-only edit. New contract test; full suite green.
- Left: **AI Career Copilot's Journey date** — a bare `'2026'` until Krishna
  supplies the month. Then the browser pass, still the whole remaining risk.
- Watch out for: **`inset: -7vh 0` on `body::before` is the slack the parallax
  translates within** — restoring `inset: 0` lets the layer's edge swing into
  view. **Do not create a `dist/` directory and do not convert this to
  Vite/React to satisfy a host** — the error text invites both and neither is
  warranted. Projects 04 and 05 were described from Krishna's brief and
  **not** inspected — their `source: 'provided'` flag and disclaimers must
  survive any edit. All `links: {}` are deliberately empty; do not populate
  them from local git remotes or guesses. Krishna has supplied no photograph
  and no screenshots; every asset path must stay optional, and the deck still
  shows generated placeholders for all five projects.
