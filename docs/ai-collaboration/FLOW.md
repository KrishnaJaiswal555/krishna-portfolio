# FLOW

How execution actually travels between files, functions, and modules.

## Page boot

Trigger: browser parses `index.html` and reaches
`<script type="module" src="src/main.js">`.

1. `index.html` → `html` carries `is-booting`, which holds `body` at
   `opacity: 0` so no empty shell is ever visible.
2. `src/main.js` → imports `data/content.js`, `lib/assets.js`,
   `lib/dialog.js`, `lib/reveal.js`, and the three scene modules.
3. `src/main.js` → `main()` runs immediately on module evaluation.
4. `main()` → `renderAbout()` — fills `#focusList`, `#interestList`.
5. `main()` → `renderJourney()` — builds one **`<div class="jn">`** per
   `timeline[]` entry into `#journeyRail`, each carrying `data-reveal`.
   Deliberately not a `<button>`: highlighting a milestone changes nothing a
   reader needs, so an interactive control would be one that does nothing.
6. `main()` → `renderUniverse()` — builds one `<button class="pc">` per
   `projects[]` entry into `#universeDeck`; each calls
   `lib/assets.js → art()` for its artwork. These *are* buttons, because they
   open a case study.
7. `main()` → `renderSkills()`, `renderContact()`, `wireChrome()`.
8. `main()` → `startScenes()`:
   - `lib/reveal.js → reveal(document)` **first**, before anything that can
     throw. A scene failing must never leave revealed copy hidden.
   - then a registry loop over `[['hero', …], ['about', …], ['journey', …]]`,
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

## Hero scene (FEATURE-001)

Trigger: `startScenes()` registry → `scenes/hero.js → initHero()`.

1. `createGL(#heroStage)`. On null → `is-fallback` on the section, return
   null. The hero copy is visible by default, so nothing needs undoing.
2. → adds `is-gl` to the section — the class that hides the copy pending the
   reveal, added only once a context is confirmed.
3. → `await document.fonts.ready` — sampling earlier bakes the fallback face's
   letterforms into the field.
4. → `createField()` → `retarget()` → reads each `.hero__line` rect and
   computed font → `gl/particles.js → sampleInk()` → targets in device px.
5. → `field.scatter()`, then `lib/scene.js → gate(section, …)`.
6. Each frame → `field.update(dt, pull, t, drift)` → `field.draw()`.
7. At `t ≥ 3.35s` → `showText()` adds `is-typed`; the copy transitions in,
   staggered, while the field is still tightening.

## About scene (FEATURE-002)

Trigger: `startScenes()` registry → `scenes/about.js → initAbout()`.

1. `createGL(#aboutStage)`. On null → `is-fallback`, return null.
2. → `createField()` — 360 / 700 / 1,050, far fewer than the hero: this is
   texture, not the subject.
3. → `lattice()` solves column count from the aspect ratio, then jitters each
   target within its cell using the particle's **stable seed** —
   re-randomising per resize made the field visibly twitch.
4. Each frame → alpha follows `sin(sp·π)^0.6` so the grid fades in and back
   out; `offset` combines scroll drift with damped pointer sway. Pull is
   constant: this section is a state, not an event, so it never "arrives".

## Journey scene (FEATURE-003)

Trigger: `startScenes()` registry → `scenes/journey.js → initJourney()`.

1. `createGL(#journeyStage)`. On null → `is-fallback`, return null. The rail
   is plain readable content either way.
2. → `measure()`:
   - `resizeCanvas()`, then re-create the field if the viewport crossed a
     count breakpoint (500 / 900 / 1300).
   - collect `.jn` rows and their vertical centres using **`offsetTop`**, not
     `getBoundingClientRect()`. The rows carry `data-reveal`, whose
     `translateY` moves the rect but not layout; `offsetTop` is immune to
     that and to scroll position.
   - solve `spineX` just outside the rail's left edge, clamped inside the
     canvas so it cannot fall off-screen when narrow.
   - fill `baseX`/`baseY` along the spine, extending ~40dpr past both ends so
     the thread runs off-frame rather than ending in two dots.
3. → `field.scatter()`, then `gate(section, …)`.
4. Each frame:
   - if the pointer is not on the rail → pick the milestone nearest the
     viewport centre and `setActive()` it, so scrolling walks the thread.
   - `focusY` damps toward the active row's centre.
   - `applyBulge()` rewrites every target from `baseX`/`baseY` with a Gaussian
     bulge around `focusY` — recomputed from the base each frame rather than
     accumulated, so it cannot drift.
   - `field.update()` then `field.draw()`, alpha following the section's
     travel through the viewport.
5. `pointerover` on the rail sets the active milestone directly;
   `pointerleave` hands control back to scroll.

## Project Universe scene (FEATURE-004)

Trigger: `startScenes()` registry → `scenes/universe.js → initUniverse()`.

1. Collect `.pc` cards from the deck. No cards → return null.
2. `createGL(#universeStage)`. **A null context does not abort this scene** —
   it marks the section `is-fallback` and continues, because the deck's
   motion is pure DOM. Only the constellation is guarded behind `if (gl)`.
3. → adds `is-deck-ready` to the section, the class that lets CSS hide the
   cards pending their entrance. Added only once JS will bring them back.
4. → `measure()`:
   - card depth from horizontal distance to the deck's centre column, so
     flanking cards move hardest — solved from real layout, so it survives
     the `auto-fit` grid reflowing.
   - card centres via `offsetLeft`/`offsetTop`. This module writes a
     transform to every card, so a rect would feed the scene its own output.
   - build edges: each card to the next, **plus** each to the one after, then
     distribute particles by cumulative edge length so density is even rather
     than bunched on the short links.
5. → `gate(section, …)`, threshold 0.12.
6. Each frame:
   - `mat` is one scalar every card reads — the entrance is a single event.
     Per-card variation is in distance *travelled*, never in start time.
   - `live` ramps in after `mat` completes, so parallax and hover cannot
     fight the entrance.
   - the deck yaws as a whole; each card adds its own depth-scaled offset.
   - hover lifts one card and eases the siblings back; `focus`/`blur` feed the
     same `hover` index, so keyboard behaves as pointer does.
   - if a context exists: `field.update()` then `field.draw()`, alpha scaled
     by both the section's travel and `mat`.

**Currently modifying:** none.

## Artwork resolution

Trigger: `renderUniverse()` or `renderCase()` needs a project image.

1. `lib/assets.js` → `art(project, 'public/projects/<id>.png')`
2. Creates an `Image`; on `load` resolves with it.
3. On `error` → `placeholder(project)` draws a seeded constellation canvas.
4. Never rejects — a missing screenshot is an expected state, not a failure.

## Opening a case study

Trigger: click on a `.pc` card, or a `#project/<id>` URL.

1. `src/main.js` → card listener → `lib/dialog.js → openProject(id)`
2. → `src/main.js → renderCase(project)` returns nodes built purely from
   `content.js`. Metrics and links are emitted **only** if non-empty;
   Architecture renders as an ordered pipeline via `.cs__flow`.
3. → `updateNav()` sets each nav control's label, accessible name and
   disabled state from the project's position in the deck order.
4. → `history.pushState()` → `dialog.showModal()` — the platform supplies
   focus trapping, Esc-to-close, background inertness and `::backdrop`.
5. Closing fires `close` → if the hash still names a project, `history.back()`
   rewinds it, so the browser back button closes the overlay rather than
   leaving the page.

### Stepping between projects

Trigger: the prev/next controls, or ArrowLeft / ArrowRight while open.

1. `dialog.js → step(delta)` → finds the current index, bails at either end.
   **No wrap-around**: looping silently would hide the size of the set.
2. → `openProject(id, { push: false })` → re-renders the body and calls
   `history.replaceState()`. Only the *initial* open pushes, so reading all
   five projects does not bury the deck under five back-presses.
3. The arrow-key handler ignores events originating in `input`, `textarea` or
   `select`, so it can never hijack typing.

**Currently modifying:** none.
