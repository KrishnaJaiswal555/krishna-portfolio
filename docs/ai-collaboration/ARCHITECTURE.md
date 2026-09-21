# ARCHITECTURE

High-level map: modules, services, and how data moves between them. Not implementation detail.

## Overview
- Purpose: A cinematic single-page portfolio for Krishna Jaiswal, presenting
  identity, journey, five projects, skills and contact.
- Shape: A static site. One HTML document, ES modules loaded natively by the
  browser, one data file feeding every rendered collection, and per-section
  WebGL canvases that are purely decorative. No server, no build step, no
  runtime dependencies.

Three structural properties define the system:

1. **Data is the single source of truth.** `src/data/content.js` holds every
   personal fact, figure and URL. Nothing else hardcodes any of them. Absent
   data renders no markup, so an un-recorded metric or link cannot appear.
2. **WebGL is decoration, DOM is the content.** Every informational element is
   real, semantic DOM. Losing WebGL costs visual atmosphere and nothing else.
   Anything that hides content is applied by JavaScript only *after* it has
   confirmed it can reveal it again.
3. **One particle field, many configurations.** A single simulation
   (`gl/particles.js`) is re-targeted per scene rather than reimplemented.
   That is what keeps the scenes coherent as a set and the code small.

## Modules / Services

| Name | Responsibility | Talks to |
|---|---|---|
| `index.html` | Semantic shell: six sections, identity copy, canvases, `<dialog>`, `<noscript>` | loads `src/main.js`, three stylesheets |
| `src/data/content.js` | Single source of truth for all content | `main.js`, `check_content.mjs` |
| `src/main.js` | Boot; renders collections into the shell; wires chrome, reveals, scenes and the overlay | `content.js`, `assets.js`, `dialog.js`, `reveal.js`, `scenes/*` |
| `src/lib/assets.js` | Optional-asset loading; generated placeholders; file probing | DOM, `fetch` |
| `src/lib/dialog.js` | Case-study overlay, `#project/<id>` deep links, and stepping between projects | `history`, `<dialog>`, `main.js → renderCase` |
| `src/lib/reveal.js` | Shared scroll reveals for `[data-reveal]`; one-shot | `IntersectionObserver`, `scene.js` |
| `src/lib/scene.js` | Scene lifecycle: visibility gating, reduced motion, resize | `IntersectionObserver` |
| `src/lib/ease.js` | Easing and frame-rate independent damping | none |
| `src/gl/renderer.js` | WebGL2 context, programs, resize; degrade path | canvas elements |
| `src/gl/particles.js` | The particle field: simulation, point rendering, `sampleInk()` | `renderer.js` |
| `src/scenes/hero.js` | Scene 1 — field condenses into the wordmark | `particles.js`, `scene.js`, `renderer.js`, `ease.js` |
| `src/scenes/about.js` | Scene 2 — field as a jittered lattice | same |
| `src/scenes/journey.js` | Scene 3 — field as a spine beside the milestone rail | same |
| `src/scenes/universe.js` | Scene 4 — field as a constellation between project cards; also owns the deck's entrance, parallax and hover | same, plus the `.pc` cards |
| `src/scenes/finale.js` | Scene 6 — reuses the wordmark configuration as a closing bookend; gather is driven by scroll, not a clock | same |
| `src/styles/*` | `app` tokens + header · `scenes` composition · `project` overlay | none |
| `tools/serve.py` | Dev server with caching disabled | filesystem |
| `tools/check_content.mjs` | Content integrity assertions | `content.js` |

**Every canvas on the site is now wired.** There are five scenes across four
particle configurations: wordmark (hero **and** finale), lattice (about),
spine (journey), constellation (universe).

The set is closed at four. The finale is the proof that closing it costs
nothing: it reuses the hero's configuration as a deliberate bookend — the film
ends on the shot it opened with — and differs in feel rather than mechanism.
It gathers loosely and never stops drifting, where the hero condenses hard and
settles. Any further scene should reuse a configuration in the same way.

Heading measurement is shared: `particles.js → sampleHeading()` is called by
both the hero and the finale. It is fiddly enough (computed font, rects
relative to the section, the baseline offset `fillText` expects) that two
copies would mean two places to correct the same subtle error. `sampleInk()`
sits behind it and is deliberately **not** exported — it has no caller outside
the module.

### Property ownership between CSS and JS
Where JS writes a style property every frame, CSS must not also set or
transition it. `scenes/universe.js` owns `transform` on `.pc` and on the deck,
so `scenes.css` deliberately omits `transform` from the `.pc` transition and
from its hover rule; CSS keeps colour and shadow. The two writing the same
property produces a fight that resolves at random per frame.

### The scene contract
Every scene module exports one `async init…()` that returns `null` if its
canvas or context is unavailable, and otherwise hands its frame loop to
`lib/scene.js → gate()`. `gate()` runs the loop only while the section is on
screen and the tab is visible, and under `prefers-reduced-motion` it renders
exactly one settled frame and never starts a loop at all. `startScenes()`
iterates the registry and catches per scene, so one failure cannot affect the
others or the page.

## How Data Moves
- `content.js` → `main.js`: profile, projects, timeline, skills, experience,
  certifications. One-way; nothing writes back.
- `main.js` → DOM: collections become `<div>`, `<button>`, `<li>` and `<a>`
  nodes. Project cards are buttons because they open a case study; timeline
  rows are **not**, because highlighting one changes nothing a reader needs.
- `content.js` → `renderCase()` → `<dialog>`: a full case study built per
  project on open. Metrics and links sections are emitted only when their
  arrays/objects are non-empty.
- `assets.js` → DOM: an `<img>` when the file exists, a generated `<canvas>`
  placeholder when it does not.
- DOM layout → scenes: `hero.js` samples the painted `<h1>`; `journey.js`
  measures rail rows via `offsetTop`. Both read layout rather than assuming
  it, so the canvases cannot drift from the text.
- URL hash ↔ `dialog.js`: `#project/<id>` opens the overlay; closing rewinds
  the history entry.
- `content.js` → `check_content.mjs`: assertions at authoring time.

## External Services & Storage
- **Google Fonts** — Anton, Inter, JetBrains Mono over CDN (all SIL OFL).
  The only external request the site makes. Candidate for self-hosting in the
  performance phase.
- **No backend, no database, no API, no analytics, no cookies, no local
  storage.** Nothing is collected and nothing is persisted.
- **No secrets.** The project has no keys, tokens or environment configuration.
- Deployment target: any static host (GitHub Pages, Netlify, Vercel).
