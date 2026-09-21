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
- Nothing. Phase 10 complete. **Every canvas on the site is now wired.**

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
- Adding a profile photograph — Why: Krishna has explicitly declined to supply
  one; the design deliberately needs none.

## Next Steps

Krishna has directed that all remaining development phases be completed
first, with a full browser verification on localhost afterwards. Phases are
being committed individually to preserve rollback granularity.

1. Phase 11 — Responsive design audit across every scene.
2. Phase 12 — Performance and accessibility audit.
3. Phase 13 — deployment files, then the browser verification: desktop
   layout, mobile responsiveness, navigation and scrolling, animations and
   particle effects, interactive elements, console errors, and performance.
   **No row in the Manual Checks tables may be marked done unless the site
   has actually been opened and driven in a browser.**

Add a ROLLBACK entry before starting each phase.

## Last Session Handoff
Rewrite these five lines at the end of every session.
- Date: 2026-09-21
- AI model: Claude Opus 5 (1M context)
- Did: Phases 1–7. Reference found unlicensed; architecture approved; scaffold,
  hero, About lattice, Journey spine and Project Universe constellation built.
  Caught and fixed a live CSS/JS transform race in the deck.
- Left: A browser pass, then Phase 8 (project detail pages).
- Watch out for: Projects 04 and 05 were described from Krishna's brief and
  **not** inspected — their `source: 'provided'` flag and disclaimers must
  survive any edit. All `links: {}` are deliberately empty; do not populate
  them from local git remotes or guesses. Krishna has supplied no photograph
  and no screenshots; every asset path must stay optional, and the deck still
  shows generated placeholders for all five projects.
