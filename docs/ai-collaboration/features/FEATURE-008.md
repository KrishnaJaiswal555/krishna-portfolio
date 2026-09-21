# FEATURE-008: Responsive design

- Status: In progress
- Next step: Browser pass. This is the phase whose results are *least*
  verifiable without one — CSS regressions are invisible to every automated
  check this project has.

## Scope
- Goal: Make the layout safe at every width by construction, rather than
  safe because a media query happens to rescue it.
- In scope: `app.css`, `scenes.css`, `project.css`.
- Out of scope: JavaScript, scenes, schedulers. Nothing in this phase can
  break at runtime; the risk is purely visual.

## What the audit found

A read-only sweep before touching anything, rather than guessing:

| Finding | Why it mattered |
|---|---|
| `max-width: 100vw` on the case dialog | `vw` **includes the scrollbar gutter**, so on a platform with classic (non-overlay) scrollbars `100vw` is wider than the visible viewport. The single most common source of a stray horizontal scrollbar. |
| `minmax(300px, 1fr)` on the project deck | At 320px with gutters there is ≈284px available, so a 300px floor overflows. A `max-width: 620px` rule rescued it — meaning the layout *depended on a media query to avoid overflowing*. |
| No `pointer: coarse` sizing anywhere | `.btn` computes to ≈40px tall, under the 44px touch minimum. |
| No short-landscape handling | A phone in landscape has ~375px of height, and a `100svh` hero plus a fixed header leaves almost nothing for the name. |

## What Was Tried

| Approach | Result |
|---|---|
| Rationalise 620/720/860/900 into one token scale | **Rejected.** Four breakpoints that each exist for a specific layout failure is not disorder, and renaming them is churn with no visual benefit. They are documented instead. |
| Fix deck overflow with another media query | Rejected — that repeats the original mistake. `minmax(min(300px, 100%), 1fr)` makes the floor collapse to available width, so it is correct at every width with no breakpoint at all. |
| Size tap targets by viewport width | **Rejected, and this is the interesting one.** A narrow *desktop* window is still driven by a mouse, and a large tablet is still driven by a finger. Width is a proxy for input device, and a wrong one. Keyed on `pointer: coarse`. |
| Read `pointer: coarse` live in JS so convertibles re-evaluate on fold | Deferred, not done. The failure mode is graceful — a folded convertible simply loses hover parallax — and the scenes each read it once at init. Noted here so it is a known gap rather than an oversight. |

## What Worked
- All three `auto-fit` tracks converted to `minmax(min(Npx, 100%), 1fr)`.
- `100vw` → `100%` on the case dialog, in both the base rule and the 720px
  override.
- `pointer: coarse` blocks in `app.css` and `project.css` raising `.btn`, the
  burger, the dialog close and the case-nav controls to ≥44px.
- A ≤400px refinement: tighter gutter, and hero/closing wordmark switched from
  `clamp()` to a plain `vw` size, since at that width they were already
  pinned at the clamp floor.
- A `max-height: 520px and (orientation: landscape)` guard that releases the
  hero from `100svh`, hides the scroll cue and tightens section padding. Keyed
  on **height**, so it never fires on a short-but-wide desktop window.
- `.case__in` bottom padding at ≤720px raised from 70px to 112px — it was set
  before the nav bar existed and would have trapped the last line under it.

## Verification

### Automated — run 2026-09-21

A CSS-only phase is invisible to `node --check` and `check_content.mjs`, so
the checks had to be chosen for what *can* fail here.

- Check: **brace balance** per stylesheet. An unbalanced brace silently kills
  every rule after it and produces no error anywhere.
- Actual: ✅ `app.css` 46/46, `scenes.css` 115/115, `project.css` 46/46

- Check: no `100vw` survives in live CSS
- Actual: ✅ none. Two grep hits existed, and **both were proven to be comment
  lines** by re-running with comments stripped — not assumed to be comments

- Check: every `grid-template-columns` declaration, read verbatim
- Actual: ✅ all three `auto-fit` tracks use `minmax(min(…), 1fr)`. The three
  fixed tracks that remain (`132px 1fr auto`, `1.15fr 1fr`, `1.4fr 1fr`) are
  each overridden at ≤620px or ≤900px, which is intentional

- Check: the resulting breakpoint set is what was intended
- Actual: ✅ `400`, `620`, `720`, `860`, `900`, `max-height: 520 + landscape`,
  `pointer: coarse`, `prefers-reduced-motion`

- Check: every selector written in a new rule exists elsewhere in the project
  — a typo'd selector is silently inert, never an error
- Actual: ✅ all ten confirmed present

- Check: JS and content untouched by a CSS-only phase
- Actual: ✅ `main.js` parses, `11 checks passed`

### Manual — NOT yet performed
See TEST_CHECKLIST → "Responsive". The first row is the one that matters most:
**no horizontal scrollbar at any width**. Every finding in this phase was a
different route to producing one.
