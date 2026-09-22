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

## 2026-09-22 — artwork wiring, site backdrop, spatial hover

### The blocking fact
The brief specified `/public/assets/projects/*.jpg` and
`/public/assets/portfolio-background.jpg`. **None of them exist** —
`public/assets/` was absent and the repository contained zero image files of
any kind. Writing those paths without checking would have produced 404s, i.e.
precisely the empty rectangles the change was meant to remove.

So the work done was everything that does *not* depend on the files, with the
paths wired so the images drop in with no code change.

### Artwork resolution
The supplied filenames do not match the project ids (`product-search.jpg` vs
`ai-product-search`), so the path cannot be derived. `content.js` carries an
explicit `art:` per project, `assets.js → artSources()` builds the candidate
list, and `art()` now takes an ordered list and resolves with the first that
loads:

1. `public/assets/projects/<art>` — the supplied asset
2. `public/projects/<id>.png` — the original convention, so anything already
   dropped there is not orphaned
3. the generated schematic

`check_content.mjs` asserts every project names an artwork file and that no
two share one, so a missing mapping fails loudly instead of silently
degrading to the schematic — indistinguishable from "not supplied yet".

### The occlusion bug this uncovered
`scenes.css` declared `.flow { …; background: var(--bg); }` at z-index 2. That
fill was inherited from an architecture where the hero is a `position: fixed`
full-viewport layer the flow must scroll over and hide. **This hero is
`position: relative`** and scrolls away normally, so the fill was vestigial —
and it would have hidden the new fixed backdrop for About, Journey, Work and
Skills, i.e. four of six sections. A "site-wide" backdrop covering one
section. Removed; `html, body` still paints `--bg`.

A `.stage-wrap` rule was also written and then removed: that class belongs to
the reference implementation and does not exist in this markup, so it matched
nothing — silently inert, never an error.

### Property ownership, held to
`universe.js` writes `transform` **and** `opacity` to `.pc` every frame. So:
- **card rise** → JS (already present)
- **sibling dimming** → JS, added to the per-frame opacity, scaled by `live`
  so it cannot disturb the entrance
- **image scale 1.02** → CSS, because it targets the `<img>` *inside* the
  card. Different element, no writer conflict.

Putting either of the first two in CSS would have recreated the exact race
fixed earlier, where an inline per-frame write and a stylesheet rule resolve
against each other differently on each frame.

### Case-study parallax
`dialog.js` sets `--px`/`--py` on the `.cs__art` **frame**, not the image —
the `<img>` is appended asynchronously once it loads and may not exist when a
pointer event arrives. Custom properties inherit, so the image picks them up
whenever it appears, and the `0` defaults mean the visual is correct before
any pointer has moved. Skipped entirely for reduced-motion and coarse
pointers.

### Verification — 2026-09-22
- ✅ `13 checks passed` (up from 12; the new artwork-mapping assertion)
- ✅ 18/18 modules parse
- ✅ `--px`/`--py` contract matches: `dialog.js:77–78` ↔ `project.css:128`
- ✅ `hot` and `live` in scope at the rewritten opacity line
- ✅ `reducedMQ`/`coarseMQ` declared once and used — they were referenced
  before being declared when first written, which `node --check` cannot catch
- ✅ stylesheet braces balanced (47 / 49 / 124)
- ✅ `.stage-wrap` gone; `.flow` no longer opaque
- ✅ journey-interaction, art-smoke, deploy-audit all green

### Not verified
Nothing visual has been confirmed. Whether the backdrop reads as "almost
black", whether the card treatment looks integrated rather than pasted on,
whether the hover feels smooth, and whether the negative margin on the
case-study frame overflows at narrow widths are all browser questions, and
browser automation is unavailable in this session.
