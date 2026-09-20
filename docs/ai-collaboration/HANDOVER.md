# HANDOVER

Read at the start of every session. Keep it current, not complete.

## Project
- Name: krishna-portfolio
- Purpose: Cinematic personal portfolio for Krishna Jaiswal (AI / Data Science /
  Machine Learning). Vanilla ES modules + WebGL2, no framework, no build step,
  no runtime dependencies. Deployable to any static host.
- Version control: `git`, branch `main`, no remote configured, nothing pushed.

## Done
- Phase 1 — reference analysis of `github.com/gireeshkumarreddy/cinematic-portofilo`.
  Confirmed **no licence** (no LICENSE file; GitHub API returns `license: null`
  and 404 on `/license`). All-rights-reserved: none of its code, styles or
  media may be reused. Techniques are ideas and were reimplemented from scratch.
- Phase 2 — architecture decided and approved (see DECISIONS.md).
- Phase 3 — scaffold: semantic markup, `content.js` as single source of truth,
  case-study `<dialog>`, CSS token system, WebGL bootstrap.
- Phase 4 — cinematic hero (features/FEATURE-001.md): particle field
  condensing into the wordmark, targets sampled from the live `<h1>`.
  **Committed as `d626ed5`** — the clean Phase 1–4 restore point.
- Phase 5 — About scene (features/FEATURE-002.md): the same field in a
  lattice configuration, plus the reusable `lib/reveal.js` scroll-reveal
  mechanism the remaining scenes will share.
- Verified 2026-09-20: 12/12 modules parse; import graph resolves;
  class-name contract matches between JS and CSS; `check_content.mjs` → 7
  checks passed; all modules serve as `text/javascript`.

## In Progress
- Phase 5 written and verified; **not yet committed**.

## Broken / Blockers
- None known.
- **Open gap — no browser pass has ever been done, in any phase.** Everything
  in the Manual Checks tables of TEST_CHECKLIST.md is unverified: rendering,
  console cleanliness, both canvas scenes, reveals, dialog behaviour, keyboard
  navigation, reduced motion, mobile layout. Do not report any of it as
  working until it has been looked at.

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
- **Hiding anything in CSS by default.** The hero copy and every
  `[data-reveal]` element are visible until JS proves it can reveal them
  (`is-gl`, `is-reveal-ready`). This is the #0003 defect class; see
  DECISIONS.md 2026-09-20.
- Sampling the wordmark before `document.fonts.ready` — Why: it bakes the
  fallback face's letterforms into the particle field.
- Re-randomising lattice jitter on resize — Why: the field visibly twitches.
  Jitter derives from each particle's stable seed.
- Writing any personal fact, metric or URL outside `src/data/content.js`.
- Adding a profile photograph — Why: Krishna has explicitly declined to supply
  one; the design deliberately needs none.

## Next Steps
1. Commit Phase 5.
2. Browser pass — the single largest gap in the project. Fill in the Manual
   Checks tables in TEST_CHECKLIST.md.
3. Phase 6 — Journey scene. `#journeyStage` is already in the markup, the rail
   renders from `content.js`, and adding the scene is one entry in the
   `startScenes()` registry plus a third `createField` configuration.

## Last Session Handoff
Rewrite these five lines at the end of every session.
- Date: 2026-09-20
- AI model: Claude Opus 5 (1M context)
- Did: Phases 1–5. Reference found unlicensed; architecture approved; scaffold,
  cinematic hero and About lattice built; git initialised with a clean Phase
  1–4 baseline commit.
- Left: Commit Phase 5, then a browser pass, then Phase 6 (Journey).
- Watch out for: Projects 04 and 05 were described from Krishna's brief and
  **not** inspected — their `source: 'provided'` flag and disclaimers must
  survive any edit. All `links: {}` are deliberately empty; do not populate
  them from local git remotes or guesses. Krishna has supplied no photograph
  and no screenshots; every asset path must stay optional.
