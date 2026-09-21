# FEATURE-011: Project overview visuals and fixed backdrop

- Status: In progress
- Next step: Browser pass — TEST_CHECKLIST → "Project overview visuals and
  backdrop". **Not yet performed.**

## Scope
- Goal: Remove the large empty dark areas in the Work section and give each
  project card a meaningful visual, without overpowering the text or adding
  dependencies.
- In scope: `src/lib/assets.js` (per-project card art), `src/styles/scenes.css`
  (fixed section backdrop).
- Out of scope: real screenshots — Krishna supplies those, and the art is
  explicitly labelled so it cannot be mistaken for one.

## What Was Tried

| Approach | Result |
|---|---|
| Keep the single shared constellation | Rejected — that *was* the problem. Five identical fields read as decoration, not as five different projects. |
| **A schematic per project, drawn from its id** | **Chosen.** Embedding space with nearest-neighbour rays, a five-agent chain with a revision loop, a KPI-and-bars dashboard, a narrowing CNN stack, a transaction graph with one flagged node. Each says what the project *does*. |
| Ship background images / SVGs | **Rejected on the brief's own terms** — "no unnecessary external dependencies", "optimize for performance". Files mean requests, decode cost, cache-busting and bytes. |
| **CSS gradients for the backdrop** | **Chosen.** Zero bytes, zero requests, nothing to optimise. A blueprint grid plus two dim pools over a charcoal wash. |
| `position: fixed` element for the backdrop | Rejected — it would cover the viewport and sit across other sections. A `::before` on `.universe` with `background-attachment: fixed` is immovable *and* confined. |
| Attach the backdrop to `body` or `main` | **Rejected specifically because of BUG-001.** Anything not scoped to `.universe` could paint behind the Journey rail and interfere with the cyan indicator. Scoping makes that structurally impossible. |
| Leave `background-attachment: fixed` on for reduced-motion users | Rejected — fixed backgrounds repaint on every scroll. Switched to `scroll` attachment under `prefers-reduced-motion`. |

## What Worked
- `MOTIFS` keyed by project id; deterministic, so cards never reshuffle.
- A faint blueprint grid inside each card, matching the section backdrop, so
  card and section read as one surface rather than a panel floating on black.
- The art keeps a dim `SCHEMATIC — VISUAL PENDING` label. It is a diagram, not
  a screenshot, and the card must not imply otherwise.
- The backdrop is masked top and bottom
  (`mask-image: linear-gradient(...)`) so it fades into the neighbouring
  sections instead of ending on a hard seam.
- `.universe > *:not(.universe__stage)` lifts real children to `z-index: 1`;
  `> *` matches elements only, never pseudo-elements, so `::before` stays at
  0 and behind every card and label without needing a negative index.

## Verification

### Automated — run 2026-09-21

- Check: every project id has a matching motif; a missing key silently falls
  back to the generic field
- Expected output: 5 ids, 5 motifs, exact 1:1
- Actual output: ✅ 5/5, identical spellings

- Check: ~150 lines of newly written canvas code had **never executed**.
  Smoke test under Node with a stubbed 2D context, which also throws on any
  non-finite coordinate
- Expected output: every motif runs, nothing throws, nothing falls back
- Actual output: ✅ `SMOKE TEST CLEAN — every project has a motif and every
  motif runs`. Distinct call profiles confirm five genuinely different
  drawings rather than five copies:

  | project | ops | arcs | strokes |
  |---|---|---|---|
  | ai-product-search | 390 | 41 | 49 |
  | ai-career-copilot | 201 | 5 | 43 |
  | retail-sales-analytics | 173 | 0 | 34 |
  | skin-lesion-cnn | 207 | 0 | 44 |
  | upi-sentinel-ai | 283 | 12 | 56 |

- Check: stylesheet brace balance after two large insertions
- Actual output: ✅ scenes.css 120/120, app.css 46/46, project.css 46/46

- Check: backdrop cannot reach the Journey section
- Actual output: ✅ `.universe::before` only; no `.journey::before` exists

### Not verified
Nothing visual has been confirmed. Whether the backdrop actually reads as
"subtle", whether the card art is legible at card size, and whether
`background-attachment: fixed` costs anything on a low-end machine are all
browser questions, and browser automation is unavailable in this session.
