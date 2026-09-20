# FLOW

How execution actually travels between files, functions, and modules.

## Page boot

Trigger: browser parses `index.html` and reaches
`<script type="module" src="src/main.js">`.

1. `index.html` → `html` carries `is-booting`, which holds `body` at
   `opacity: 0` so no empty shell is ever visible.
2. `src/main.js` → imports `data/content.js`, `lib/assets.js`,
   `lib/dialog.js`, `scenes/hero.js`.
3. `src/main.js` → `main()` runs immediately on module evaluation.
4. `main()` → `renderAbout()` — fills `#focusList`, `#interestList`.
5. `main()` → `renderJourney()` — builds one `<button class="jn">` per
   `timeline[]` entry into `#journeyRail`.
6. `main()` → `renderUniverse()` — builds one `<button class="pc">` per
   `projects[]` entry into `#universeDeck`; each calls
   `lib/assets.js → art()` for its artwork.
7. `main()` → `renderSkills()`, `renderContact()`, `wireChrome()`.
8. `main()` → `startScenes()` → `scenes/hero.js → initHero()`.
   **Not awaited** — the page is complete and interactive without it, and any
   rejection is caught into `html.is-fallback` rather than taking the page
   down.
9. `main()` → `lib/dialog.js → initDialog()` — binds close, backdrop click,
   `hashchange`, then calls `syncFromHash()` so a deep link opens immediately.
10. `main()` → `wireResume()` → `lib/assets.js → probeFile()` — HEAD request;
    the download button is revealed only on a 2xx.
11. `main()` → removes `is-booting`; the page fades in.

**Currently modifying:** none.

## Hero scene (Phase 4)

Trigger: `main() → startScenes() → initHero()`.

1. `scenes/hero.js` → `createGL(#heroStage)`. On null → `.is-fallback` on the
   section and **return null**. The hero copy is visible by default, so there
   is nothing to undo.
2. → adds `.is-gl` to the section. This is the class that *hides* the copy
   pending the reveal, so it is only ever added once a context is confirmed.
3. → `await document.fonts.ready` — sampling before the webfont is in use
   would bake the fallback face's letterforms into the field.
4. → `createField(gl, countFor(innerWidth))` — 1,200 / 2,400 / 3,600 by
   viewport.
5. → `retarget()` → `resizeCanvas()` → reads each `.hero__line` rect and
   computed font → `gl/particles.js → sampleInk()` → targets in device px.
6. → `field.scatter()` — the pre-condense noise state.
7. → `lib/scene.js → gate(section, {onFrame, onResize})`.
   - `prefers-reduced-motion`: `onResize` runs (which snaps `pos` onto `tgt`),
     `onFrame(9999)` draws one settled frame, no loop is ever started.
   - otherwise: `IntersectionObserver` drives the rAF loop;
     `visibilitychange` stops it; debounced `resize` calls `retarget()`.
8. Each frame → `field.update(dt, pull, t, drift)` on the CPU →
   `field.draw()` uploads positions via `bufferSubData` and issues one
   `drawArrays(POINTS)`.
9. At `t ≥ 3.35s` → `showText()` adds `.is-typed`; `scenes.css` transitions the
   copy in, staggered, while the field is still tightening.

**Currently modifying:** none — Phase 4 is written; browser verification
outstanding.

## Artwork resolution

Trigger: `renderUniverse()` or `renderCase()` needs a project image.

1. `lib/assets.js` → `art(project, 'public/projects/<id>.png')`
2. Creates an `Image`; on `load` resolves with it.
3. On `error` → `placeholder(project)` draws a seeded constellation canvas.
4. Never rejects — a missing screenshot is an expected state, not a failure.

**Currently modifying:** none.

## Opening a case study

Trigger: click on a `.pc` card, or a `#project/<id>` URL.

1. `src/main.js` → card listener → `lib/dialog.js → openProject(id)`
2. `openProject()` → looks the project up in `byId`, bails if already open.
3. → `src/main.js → renderCase(project)` returns an array of nodes built
   purely from `content.js`. Metrics and links sections are emitted **only**
   if their arrays/objects are non-empty.
4. → `history.pushState({project: id}, '', '#project/<id>')`
5. → `dialog.showModal()` — the platform supplies focus trapping,
   Esc-to-close, background inertness and `::backdrop`.
6. Closing fires the `close` event → if the hash still names a project,
   `history.back()` rewinds it, so the browser back button closes the overlay
   rather than leaving the page.

**Currently modifying:** none.
