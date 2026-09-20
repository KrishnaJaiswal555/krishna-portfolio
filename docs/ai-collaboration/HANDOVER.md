# HANDOVER

Read at the start of every session. Keep it current, not complete.

## Project
- Name: krishna-portfolio
- Purpose: Cinematic personal portfolio for Krishna Jaiswal (AI / Data Science /
  Machine Learning). Vanilla ES modules + WebGL2, no framework, no build step,
  no runtime dependencies. Deployable to any static host.

## Done
- Phase 1 — reference analysis of `github.com/gireeshkumarreddy/cinematic-portofilo`.
  Confirmed **no licence** (no LICENSE file; GitHub API returns `license: null`
  and 404 on `/license`). All-rights-reserved: none of its code, styles or
  media may be reused. Techniques are ideas and were reimplemented from scratch.
- Phase 2 — architecture decided and approved (see DECISIONS.md).
- Phase 3 — scaffold complete, automated checks passing.
- Phase 4 — cinematic hero (see features/FEATURE-001.md):
  - `src/gl/particles.js` — reusable particle field; CPU simulation, one
    `drawArrays(POINTS)`; `sampleInk()` derives targets from the live `<h1>`
  - `src/scenes/hero.js` — beats, font-ready gating, pointer parallax,
    reduced-motion snap
  - `src/main.js` rewired: `probeWebGL()` → `startScenes()`
  - `src/styles/scenes.css` — staggered hero reveal, fail-visible by default
  - Verified 2026-09-20: 10/10 modules parse; `check_content.mjs` → 7 checks
    passed, exit 0; all modules serve as `text/javascript`

## In Progress
- Nothing. Phase 4 written and awaiting review.

## Broken / Blockers
- None known.
- **Open gap — no browser pass has ever been done.** Everything in the Manual
  Checks table of TEST_CHECKLIST.md is unverified: rendering, console
  cleanliness, WebGL init, the hero sequence itself, dialog behaviour,
  keyboard navigation, reduced motion, mobile layout. Do not report any of it
  as working until it has been looked at.
- **No version control.** ROLLBACK.md cannot cite a commit, and the Phase 4
  snapshot lives in a session scratchpad that is not durable. Ask Krishna
  about `git init` before the next risky change.

## Avoid
- Reusing any code, CSS, shader or media from the reference repository — Why:
  it carries no licence, so default copyright applies.
- Adding a framework, bundler or animation library — Why: the architecture was
  chosen specifically to avoid them; see DECISIONS.md.
- Changing `overflow-x: clip` to `hidden` in `app.css` — Why: `hidden` promotes
  `<body>` to a scroll container and silently breaks every `position: sticky`
  pin added in later phases.
- Removing `"type": "module"` from `package.json` — Why: Node then parses
  `content.js` as CommonJS and `check_content.mjs` fails on the first `export`.
- Making the hero copy hidden by default in CSS — Why: it is visible by
  default *on purpose*. `hero.js` adds `.is-gl` only after confirming a WebGL2
  context, so every failure path leaves the name on screen.
- Sampling the wordmark before `document.fonts.ready` — Why: it bakes the
  fallback face's letterforms into the particle field.
- Writing any personal fact, metric or URL outside `src/data/content.js`.
- Adding a profile photograph — Why: Krishna has explicitly declined to supply
  one; the design deliberately needs none.

## Next Steps
1. Browser pass: serve, open, and fill in the Manual Checks table in
   TEST_CHECKLIST.md — especially the hero sequence, which has never been seen.
2. Ask about `git init` so rollback stops depending on a scratchpad copy.
3. Phase 5 — About scene, then Phases 6–7 wire `#journeyStage`,
   `#universeStage` and `#finStage`, which are already in the markup and can
   reuse `createField()` with different targets.

## Last Session Handoff
Rewrite these five lines at the end of every session.
- Date: 2026-09-20
- AI model: Claude Opus 5 (1M context)
- Did: Phases 1–4. Reference analysed and found unlicensed; architecture
  approved; scaffold built; cinematic hero particle field implemented, with a
  reduced-motion bug caught and fixed before verification.
- Left: A browser pass (nothing visual has ever been observed), then Phase 5.
- Watch out for: Projects 04 and 05 were described from Krishna's brief and
  **not** inspected — their `source: 'provided'` flag and disclaimers must
  survive any edit. All `links: {}` are deliberately empty; do not populate
  them from local git remotes or guesses. Krishna has supplied no photograph
  and no screenshots; every asset path must stay optional.
