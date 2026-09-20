# FEATURE-001: Cinematic hero — particle field condensing into the wordmark

- Status: In progress
- Next step: Browser pass. Nothing below marked "Actual" has been observed in
  a browser yet.

## Scope
- Goal: Open the portfolio with a cinematic sequence in which a particle field
  surfaces out of black, condenses into the shape of "KRISHNA JAISWAL", and
  hands over to the real DOM heading as it settles.
- In scope: `src/gl/particles.js` (reusable field), `src/scenes/hero.js`
  (beats, sampling, pointer), the hero reveal states in `scenes.css`, and
  wiring in `main.js`.
- Out of scope: the journey, universe and finale canvases — their elements
  exist in the markup but stay dark until Phases 5–7. No photograph, no video,
  no external asset of any kind.

## What Was Tried

| Approach | Result (worked / didn't, why) |
|---|---|
| Glyph atlas: render the wordmark to a texture and derive letter UVs, as the reference does | Rejected. That technique exists to clip *video* inside letterforms, which this design does not do. It would add a texture, a shader path and metric-solving code for no gain here. |
| Canvas-only wordmark, with the `<h1>` hidden as `sr-only` | Rejected. Makes the name unselectable and untranslatable, and any misalignment reads as broken rather than atmospheric. |
| **Sample the ink of the live `<h1>` into particle targets** | **Chosen.** One offscreen 2D canvas, `fillText`, `getImageData`, collect opaque pixels. Targets track the real fluid type at any viewport, and re-sampling on resize is one function call. |
| GPU simulation via transform feedback | Rejected for now. At 1,200–3,600 particles a CPU update plus one `bufferSubData` is negligible and far more readable. Marked with a `ponytail:` comment naming ~20k as the point to revisit. |
| Uniform stiffness for every particle | Rejected. The whole field arrived on the same frame and read as one object snapping. Stiffness now varies per particle by seed. |

## What Worked
- Implementation:
  - `createField(gl, count)` — positions/targets/seeds, `scatter()`,
    `update(dt, pull, time, drift)`, `draw({…})`, `dispose()`. Points are
    discarded outside a 0.5 radius so they render as soft dots, and colour
    ramps cold→hot by seed.
  - `sampleInk(lines, w, h, count, dpr)` — samples at half resolution,
    collects all inked pixels *then* picks from them (picking while scanning
    biases the field toward the top of the image), and jitters within the cell
    so repeated picks do not stack.
  - `initHero()` — awaits `document.fonts.ready` before sampling, since
    sampling early bakes the fallback face's letterforms into the field.
    Beats: fade 0.25s, condense 1.10s, formed 3.10s, text 3.35s, settled 4.30s.
    Pointer parallax scales by particle seed for depth and only wakes after
    the composition settles.
  - Particle count scales with viewport: 1,200 / 2,400 / 3,600.
- Files / modules touched:
  - Added: `src/gl/particles.js`, `src/scenes/hero.js`
  - Modified: `src/main.js` (import + `startScenes()`),
    `src/styles/scenes.css` (hero reveal states)
  - Unchanged: `index.html` — the hero markup and `#heroStage` were already in
    place from Phase 3.

### Failure behaviour
The hero copy is visible **by default**. `hero.js` adds `.is-gl` only after a
WebGL2 context is confirmed, and that class is what hides the copy pending the
reveal. So no JavaScript, no WebGL2, or a scene that throws all leave the name
on screen. `startScenes()` catches any rejection and adds `is-fallback` rather
than letting a scene failure take the page down.

## Verification

### Automated — run 2026-09-20, all passing

- Check: `node --check` across all 10 modules
- Expected output: prints nothing, exit 0 for each
- Actual output: ✅ 10/10 `ok`, `syntax_fail=0`

- Check: `node tools/check_content.mjs`
- Expected output: `7 checks passed`, exit 0 (unaffected by this change)
- Actual output: ✅ `7 checks passed`, exit 0

- Check: every named import resolves to a real export (`node --check` cannot
  see this — a mistyped export name parses fine and fails only in the browser)
- Expected output: each import in `main.js`, `hero.js`, `particles.js` and
  `scene.js` matches an `export` in its source module
- Actual output: ✅ all resolve. `renderer.js` exports `createGL`, `program`,
  `resizeCanvas`; `particles.js` exports `createField`, `sampleInk`;
  `scene.js` exports `gate`, `prefersReduced`; `ease.js` exports all four
  functions `hero.js` imports.

- Check: modules serve with a JavaScript MIME type
- Expected output: `200 text/javascript`
- Actual output: ✅ `particles.js`, `hero.js`, `renderer.js`, `scene.js`,
  `main.js` all `200 text/javascript`

### Dead-code cleanup (same session)
`unitQuad()` in `renderer.js` and `progress()` in `scene.js` were exported but
had no callers — speculative scaffolding of exactly the kind CONSTRAINTS
forbids. Both removed, along with the `clamp` import in `scene.js` that existed
only to serve `progress()`. Re-verified afterwards: no stale references, no
remaining `clamp` reference in `scene.js`, syntax clean, content check still
passing, all modules still serving.

### Manual — NOT yet performed

- Check: serve and load `/` in a browser
- Expected output: black → particles surface → condense into the name → copy
  fades in staggered → settles with drift and pointer parallax; console clean
- Actual output: **not yet observed**

- Check: OS "reduce motion" enabled, reload
- Expected output: no animation; one settled frame; copy visible immediately
- Actual output: **not yet observed**

- Check: resize the window across the 620px and 1100px breakpoints
- Expected output: field re-samples and re-forms against the new type size;
  particle count steps without visual corruption
- Actual output: **not yet observed**
