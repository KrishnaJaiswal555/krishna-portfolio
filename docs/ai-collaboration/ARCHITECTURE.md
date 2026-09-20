# ARCHITECTURE

High-level map: modules, services, and how data moves between them. Not implementation detail.

## Overview
- Purpose: A cinematic single-page portfolio for Krishna Jaiswal, presenting
  identity, journey, five projects, skills and contact.
- Shape: A static site. One HTML document, ES modules loaded natively by the
  browser, one data file feeding every rendered collection, and per-section
  WebGL canvases that are purely decorative. No server, no build step, no
  runtime dependencies.

Two structural properties define the system:

1. **Data is the single source of truth.** `src/data/content.js` holds every
   personal fact, figure and URL. Nothing else hardcodes any of them. Absent
   data renders no markup, so an un-recorded metric or link cannot appear.
2. **WebGL is decoration, DOM is the content.** Every informational element is
   real, semantic, focusable DOM. Losing WebGL costs visual atmosphere and
   nothing else.

## Modules / Services

| Name | Responsibility | Talks to |
|---|---|---|
| `index.html` | Semantic shell: all six sections, identity copy, canvases, `<dialog>`, `<noscript>` | loads `src/main.js`, three stylesheets |
| `src/data/content.js` | Single source of truth for all content | imported by `main.js`, `check_content.mjs` |
| `src/main.js` | Boot; renders collections into the shell; wires chrome and the overlay | `content.js`, `assets.js`, `dialog.js`, `renderer.js` |
| `src/lib/assets.js` | Optional-asset loading; generated placeholders; file probing | DOM, `fetch` |
| `src/lib/dialog.js` | Case-study overlay and `#project/<id>` deep links | `history`, `<dialog>`, `main.js → renderCase` |
| `src/lib/scene.js` | Scene lifecycle: visibility gating, reduced motion, resize | `IntersectionObserver`, `ease.js` |
| `src/lib/ease.js` | Easing and frame-rate independent damping | none |
| `src/gl/renderer.js` | WebGL2 context, programs, quad, resize; degrade path | canvas elements |
| `src/styles/*` | `app` tokens + header · `scenes` composition · `project` overlay | none |
| `tools/serve.py` | Dev server with caching disabled | filesystem |
| `tools/check_content.mjs` | Content integrity assertions | `content.js` |

Scene modules (`src/scenes/*`) are **not yet created**. They arrive in
Phase 4+ and will consume `lib/scene.js` and `gl/renderer.js`. The canvases
they attach to already exist in the markup, so adding them changes no
structure.

## How Data Moves
- `content.js` → `main.js`: profile, projects, timeline, skills, experience,
  certifications. One-way; nothing writes back.
- `main.js` → DOM: collections become `<button>`, `<li>` and `<a>` nodes.
- `content.js` → `renderCase()` → `<dialog>`: a full case study built per
  project on open. Metrics and links sections are emitted only when their
  arrays/objects are non-empty.
- `assets.js` → DOM: an `<img>` when the file exists, a generated `<canvas>`
  placeholder when it does not.
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
