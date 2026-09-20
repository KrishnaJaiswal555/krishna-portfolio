# FEATURE-002: About scene — particle lattice and scroll reveals

- Status: In progress
- Next step: Verification sweep, then a browser pass. Nothing visual has been
  observed.

## Scope
- Goal: Give the About section cinematic weight without repeating the hero,
  and introduce the reusable scroll-reveal mechanism the remaining scenes
  will share.
- In scope: `src/scenes/about.js`, `src/lib/reveal.js`, the About canvas and
  `data-reveal` hooks in `index.html`, reveal + layering rules in
  `scenes.css`, scene registration in `main.js`.
- Out of scope: Journey, Universe and Finale canvases (Phases 6–7). No new
  content — every word in this section already existed in `content.js` or the
  Phase 3 markup.

## What Was Tried

| Approach | Result (worked / didn't, why) |
|---|---|
| No canvas at all — typography and reveals only | Tempting and cheapest, but the section carries the weight the reference gave to a full-screen film. Rejected as under-delivering on "cinematic". |
| Repeat the hero's wordmark condensation | Rejected. Two spectacles in a row flatten each other, and the motif would stop meaning anything. |
| **Same field, second configuration: a jittered lattice** | **Chosen.** Delivers the architecture's "one system, several force targets" promise, and a grid reads as structured data where the hero read as a name assembling — different meaning from the same twenty lines of simulation. |
| Perfect grid, no jitter | Rejected — reads as a printed texture rather than a live field. Jitter is applied *within* each cell so the structure stays legible. |
| Jitter re-randomised per resize | Rejected. The field visibly twitched on every resize. Jitter is now derived from each particle's own stable seed. |
| Per-scene reveal code | Rejected. Four sections need the same behaviour; one `reveal.js` with a `data-reveal` opt-in serves all of them. |

## What Worked
- Implementation:
  - `src/lib/reveal.js` — one `IntersectionObserver` for all `[data-reveal]`
    elements. **One-shot**: each element is unobserved on arrival, because
    re-animating on every scroll-by reads as restlessness and makes text
    unreadable for anyone scrolling back. Sets `--ri` so CSS can stagger
    siblings without knowing the count.
  - `src/scenes/about.js` — `lattice()` solves column count from the aspect
    ratio so cells stay roughly square at any viewport, and jitters within the
    cell from the particle's stable seed. Alpha follows a
    `sin(progress·π)` curve so the grid fades in and back out rather than
    abutting neighbouring scenes with a hard edge. Scroll drives vertical
    drift; the pointer adds lateral sway.
  - Counts are far lower than the hero (360 / 700 / 1050 vs 1200 / 2400 /
    3600) and alpha is halved — this is texture, not the subject.
- Files / modules touched:
  - Added: `src/lib/reveal.js`, `src/scenes/about.js`
  - Modified: `index.html` (About canvas + `data-reveal` hooks),
    `src/styles/scenes.css` (canvas layering, reveal states),
    `src/main.js` (scene registry loop + `reveal()`)

### Failure behaviour — the #0003 lesson applied forward
Hiding `[data-reveal]` in CSS by default would have made the entire About
section invisible whenever JavaScript failed. That is the same defect class
logged as observation #0003 during Phase 4, so the same fix was applied
*before* it could ship: elements are visible by default, and `reveal.js` adds
`is-reveal-ready` to `<html>` only after confirming both that it will run and
that `IntersectionObserver` exists. `reveal()` is also called *before* any
scene initialises, so a throwing canvas can never leave the copy hidden.

`startScenes()` now iterates a scene registry and catches per scene, so one
failing scene cannot take the others down. It no longer sets `is-fallback`
globally — that flag described a whole-page state and is wrong once scenes
fail independently.

## Verification

### Automated — run 2026-09-20, all passing

- Check: `node --check` across all 12 modules
- Expected output: prints nothing, exit 0 for each
- Actual output: ✅ 12/12 `ok`, `syntax_fail=0`

- Check: every named import resolves to a real export
- Expected output: `initAbout`, `reveal` resolve for `main.js`;
  `prefersReduced` for `reveal.js`; `createGL`, `resizeCanvas`, `createField`,
  `gate`, `prefersReduced`, `damp`, `clamp` for `about.js`
- Actual output: ✅ all resolve — `reveal.js` exports `reveal`, `about.js`
  exports `initAbout`, and every import above matches an export in its source

- Check: the class names JS *sets* are the ones CSS *matches*. A typo here
  fails silently — no error, just content that never appears.
- Expected output: `is-reveal-ready`, `is-in` and `--ri` each present on both
  sides
- Actual output: ✅ `is-reveal-ready` set at `reveal.js:40`, matched at
  `scenes.css:132` and `:144`; `is-in` set at `reveal.js:25,32,45`, matched in
  both CSS rules; `--ri` set at `reveal.js:19`, consumed at `scenes.css:140`

- Check: markup hooks exist
- Expected output: `data-reveal` on the About elements, one `#aboutStage`
- Actual output: ✅ 6 `data-reveal` hooks, 1 `#aboutStage` canvas

- Check: `node tools/check_content.mjs`
- Expected output: `7 checks passed`, exit 0 (unaffected by this change)
- Actual output: ✅ `7 checks passed`

- Check: new modules serve with a JavaScript MIME type
- Expected output: `200 text/javascript`
- Actual output: ✅ `reveal.js` and `about.js` both `200 text/javascript`

### Manual — NOT yet performed
- About copy reveals staggered as the section enters view
- The lattice is visible but subordinate — body copy never loses contrast
- Text remains selectable over the canvas
- With JavaScript disabled, the About copy is fully visible
- Reduced motion: no animation, copy visible, lattice drawn once and still
- Resize across 620px and 1100px: grid re-solves without twitching
