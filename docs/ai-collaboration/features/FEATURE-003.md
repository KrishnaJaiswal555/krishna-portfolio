# FEATURE-003: Journey scene — particle spine and milestone rail

- Status: In progress
- Next step: Browser pass. Nothing visual has been observed in any phase.

## Scope
- Goal: Give the Journey section a scene of its own, and correct the timeline
  data so its axis reflects the real shape of Krishna's milestones.
- In scope: `src/scenes/journey.js`, the timeline in `src/data/content.js`,
  `renderJourney()` in `main.js`, the Journey heading hooks in `index.html`,
  journey layering and active-state rules in `scenes.css`.
- Out of scope: the Universe and Finale canvases (Phase 7+). No new content —
  every fact added to the timeline already existed on the resume or in a
  project README verified during Phase 1.

## What Was Tried

| Approach | Result (worked / didn't, why) |
|---|---|
| Port the reference's year scrubber: a clock hand sweeping 2021→2026, one node per year | **Rejected on contact with the data.** Five of six milestones fall in 2026. A year axis would have printed "2026" five times over and read as a rendering bug. The reference's mechanic depends on one-node-per-year, which this timeline is not. |
| **Chronological sequence as the axis, with real date granularity** | **Chosen.** The axis label now carries each milestone's actual precision — `2021`, `Feb – Jun 2026`, `May 2026`, `Jun 2026`, `Aug 2026` — which is both accurate and legible. |
| Keep the "B.Tech completed / 2026" milestone | **Removed.** The programme runs 2021–2026 and completion was never confirmed by Krishna. The About section states the range; the timeline now claims nothing beyond it. It was also redundant against the "B.Tech begins" node. |
| Keep timeline rows as `<button>` (as Phase 3 built them) | **Rejected.** Highlighting a milestone changes nothing and reveals nothing — every row is fully readable at all times. That made them controls that do nothing, which is worse for keyboard and screen-reader users than plain text. |
| Measure row positions with `getBoundingClientRect()` | **Rejected.** The rows carry `data-reveal`, which applies a `translateY` before they arrive; a transform moves the rect while leaving layout untouched, so the spine would have aimed at pre-reveal positions. |
| **Measure with `offsetTop`** | **Chosen.** Reads layout, so it is immune to both the reveal transform and to scroll position. |
| Auto-advance the active milestone on a timer | **Rejected.** It would move emphasis out from under someone mid-read. The reader sets the pace: pointer hover, or otherwise the node nearest the viewport centre. |

## What Worked
- Implementation:
  - `initJourney()` builds a vertical **spine** of particles beside the rail,
    which bulges outward around the active milestone via a Gaussian falloff
    (`sigma = 95dpr`). Base positions are held in separate `baseX`/`baseY`
    arrays so the per-frame bulge is recomputed from them rather than
    accumulating drift into the targets.
  - The spine extends ~40dpr past both ends of the rail, so the thread runs
    off the top and bottom instead of terminating in two visible dots.
  - Active milestone: pointer hover wins while the pointer is on the rail;
    otherwise the node nearest the viewport centre, so scrolling alone walks
    the thread. `focusY` is damped, so the bulge glides between milestones.
  - Spine x is clamped inside the canvas, so it cannot fall off-screen on a
    narrow viewport.
  - Counts: 500 / 900 / 1300 by viewport.
- Files / modules touched:
  - Added: `src/scenes/journey.js`
  - Modified: `src/data/content.js` (timeline), `src/main.js`
    (`renderJourney()` + registry), `index.html`, `src/styles/scenes.css`

### Dead code removed
`section.dataset.milestone` was written on every active change and read by
nothing — no CSS rule, no test, no other module. Removed. This is the third
instance of the same pattern in this project (`unitQuad`, `progress`,
`dataset.milestone`), which is why "no dead exports / no unread writes" is now
a standing row in TEST_CHECKLIST rather than something noticed by luck.

## Verification

### Automated — run 2026-09-21, all passing

- Check: `node --check` across all 13 modules
- Expected output: prints nothing, exit 0 for each
- Actual output: ✅ 13/13 `ok`, `syntax_fail=0`

- Check: `node tools/check_content.mjs` — **matters this phase**, since
  `content.js` changed
- Expected output: `7 checks passed`, exit 0
- Actual output: ✅ `7 checks passed`

- Check: every `journey.js` import resolves to a real export
- Expected output: `createGL`, `resizeCanvas`, `createField`, `gate`,
  `prefersReduced`, `damp`, `clamp` all resolve; `main.js` imports and
  registers `initJourney`
- Actual output: ✅ all resolve; `main.js:18` imports it, `main.js:313`
  registers it

- Check: nothing still treats `.jn` as a `<button>` after the element changed
- Expected output: no `button.jn`, no `.type =` assignment
- Actual output: ✅ clean. `main.js:64` emits `el('div', 'jn')`;
  `journey.js:73` queries `.jn`

- Check: class-name contract, JS vs CSS
- Expected output: `is-active` and all four `jn__*` classes present on both
  sides
- Actual output: ✅ `is-active` set in `journey.js`, matched at
  `scenes.css:208` and `:213`; JS emits `jn__year`, `jn__label`, `jn__lines`,
  `jn__key` and CSS styles all four

- Check: no values written but never read
- Expected output: none
- Actual output: ⚠️ found `section.dataset.milestone` — **removed**

### Manual — NOT yet performed
- The spine reads as a thread beside the rail, not as a stray column of dots
- The bulge glides between milestones rather than jumping
- Scrolling with the pointer away from the rail walks the active milestone
- Hovering a row takes over immediately, and leaving returns control to scroll
- The five milestones read in correct chronological order with sensible dates
- Reduced motion: spine drawn once, settled, no movement; rail fully readable
- Narrow viewport: the spine stays on-canvas and the rail stacks
