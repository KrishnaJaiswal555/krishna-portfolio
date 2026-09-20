# FLOW

How execution actually travels between files, functions, and modules.

## Page boot

Trigger: browser parses `index.html` and reaches
`<script type="module" src="src/main.js">`.

1. `index.html` → `html` carries `is-booting`, which holds `body` at
   `opacity: 0` so no empty shell is ever visible.
2. `src/main.js` → imports `data/content.js`, `lib/assets.js`,
   `lib/dialog.js`, `lib/reveal.js`, `scenes/hero.js`, `scenes/about.js`.
3. `src/main.js` → `main()` runs immediately on module evaluation.
4. `main()` → `renderAbout()` — fills `#focusList`, `#interestList`.
5. `main()` → `renderJourney()` — builds one `<button class="jn">` per
   `timeline[]` entry into `#journeyRail`.
6. `main()` → `renderUniverse()` — builds one `<button class="pc">` per
   `projects[]` entry into `#universeDeck`; each calls
   `lib/assets.js → art()` for its artwork.
7. `main()` → `renderSkills()`, `renderContact()`, `wireChrome()`.
8. `main()` → `startScenes()`:
   - `lib/reveal.js → reveal(document)` **first**, before anything that can
     throw. A scene failing must never leave revealed copy hidden.
   - then a registry loop over `[['hero', initHero], ['about', initAbout]]`,
     each `.catch()`-ed individually so one failure cannot take the others —
     or the page — down.
9. `main()` → `lib/dialog.js → initDialog()` — binds close, backdrop click,
   `hashchange`, then calls `syncFromHash()` so a deep link opens immediately.
10. `main()` → `wireResume()` → `lib/assets.js → probeFile()` — HEAD request;
    the download button is revealed only on a 2xx.
11. `main()` → removes `is-booting`; the page fades in.

**Currently modifying:** none.

## Scroll reveals

Trigger: `startScenes() → reveal(document)`.

1. `lib/reveal.js` → collects `[data-reveal]`, sets `--ri` on each for CSS
   staggering.
2. → if `prefers-reduced-motion`, or if `IntersectionObserver` is missing:
   add `is-in` to everything and **return**. No hiding ever happens.
3. → otherwise add `is-reveal-ready` to `<html>`. This is the class that lets
   `scenes.css` hide the elements, so they are only hidden once something is
   definitely going to show them.
4. → observe each element; on intersection add `is-in` and **unobserve** it.
   One-shot by design.

**Currently modifying:** none.

## Hero scene (FEATURE-001)

Trigger: `startScenes()` registry → `scenes/hero.js → initHero()`.

1. `createGL(#heroStage)`. On null → `is-fallback` on the section, return
   null. The hero copy is visible by default, so nothing needs undoing.
2. → adds `is-gl` to the section — the class that hides the copy pending the
   reveal, added only once a context is confirmed.
3. → `await document.fonts.ready` — sampling earlier bakes the fallback face's
   letterforms into the field.
4. → `createField(gl, countFor(innerWidth))` — 1,200 / 2,400 / 3,600.
5. → `retarget()` → `resizeCanvas()` → reads each `.hero__line` rect and
   computed font → `gl/particles.js → sampleInk()` → targets in device px.
6. → `field.scatter()` — the pre-condense noise state.
7. → `lib/scene.js → gate(section, {onFrame, onResize})`.
8. Each frame → `field.update(dt, pull, t, drift)` → `field.draw()` uploads
   positions via `bufferSubData` and issues one `drawArrays(POINTS)`.
9. At `t ≥ 3.35s` → `showText()` adds `is-typed`; the copy transitions in,
   staggered, while the field is still tightening.

**Currently modifying:** none.

## About scene (FEATURE-002)

Trigger: `startScenes()` registry → `scenes/about.js → initAbout()`.

1. `createGL(#aboutStage)`. On null → `is-fallback` on the section, return
   null. This section's copy is always visible.
2. → `createField(gl, countFor(innerWidth))` — 360 / 700 / 1,050, far fewer
   than the hero: this is texture, not the subject.
3. → `lattice()` solves column count from the aspect ratio so cells stay
   roughly square, then jitters each target within its cell using the
   particle's **stable seed** — re-randomising per resize made the field
   visibly twitch.
4. → `field.scatter()`, then `gate(section, …)`.
5. Each frame → section scroll progress `sp` is computed from its rect →
   `field.update(dt, 1.4, t, drift)` — pull is constant, because this section
   is a state rather than an event, so the lattice never "arrives".
6. → alpha follows `sin(sp·π)^0.6`, so the grid fades in and back out instead
   of abutting neighbouring scenes with a hard edge.
7. → `offset` combines scroll drift with damped pointer sway.

**Currently modifying:** none.

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
3. → `src/main.js → renderCase(project)` returns nodes built purely from
   `content.js`. Metrics and links are emitted **only** if non-empty.
4. → `history.pushState({project: id}, '', '#project/<id>')`
5. → `dialog.showModal()` — the platform supplies focus trapping,
   Esc-to-close, background inertness and `::backdrop`.
6. Closing fires `close` → if the hash still names a project, `history.back()`
   rewinds it, so the browser back button closes the overlay rather than
   leaving the page.

**Currently modifying:** none.
