# Krishna Jaiswal — portfolio

A cinematic personal portfolio for Krishna Jaiswal — Computer Technology
engineer working in Data Science, AI and Machine Learning.

No framework, no build step, no runtime dependencies. Plain ES modules,
WebGL2 and CSS. Any static host can serve it.

## Run it

```bash
python tools/serve.py 5173
```

Then open <http://localhost:5173>.

A dev server is used rather than opening `index.html` directly because ES
modules are blocked under the `file://` protocol.

## Check content integrity

```bash
node tools/check_content.mjs
```

Fails loudly if a project is missing a field the renderer reads, if a metric is
malformed, or if a link looks guessed or placeholder-shaped.

## Adding your own assets

Every asset on this site is optional. Nothing breaks when a file is absent —
the page generates a placeholder instead. To fill them in:

| What | Where | Effect |
|---|---|---|
| Project screenshot | `public/projects/<project-id>.png` | Replaces the generated placeholder on that card and its case study |
| Résumé | `public/resume/Krishna_Jaiswal_Resume.pdf` | Reveals the download button, which is hidden while the file is missing |
| Project links | `links: {}` in `src/data/content.js` | Adds Source / Demo buttons to that case study |

Project ids, for screenshot filenames:

```
ai-product-search   ai-career-copilot   retail-sales-analytics
skin-lesion-cnn     upi-sentinel-ai
```

Link shape — omit any key you do not have:

```js
links: {
  repo: 'https://github.com/…',
  demo: 'https://…',
}
```

## Editing content

`src/data/content.js` is the single source of truth for every personal and
project fact on the site. Nothing else hardcodes a name, number or URL, so
adding a project, a timeline entry or a skill is a data edit, never a layout
change.

Two rules are enforced structurally rather than by discipline:

- `metrics: []` renders nothing — a project cannot display a figure that was
  not deliberately recorded.
- `links: {}` renders no buttons — no URL is guessed or inferred.

## Structure

```
index.html              all sections, semantic and crawlable
src/main.js             boot, DOM rendering, interaction wiring
src/data/content.js     ALL content — single source of truth
src/lib/ease.js         easing + frame-rate independent damping
src/lib/assets.js       optional-asset loader + generated placeholders
src/lib/scene.js        scene lifecycle: on-screen and visibility gating
src/lib/dialog.js       native <dialog> case study + #project/<id> deep links
src/gl/renderer.js      WebGL2 helpers and the degrade path
src/styles/             app (tokens, header) · scenes · project
tools/serve.py          dev server
tools/check_content.mjs content integrity check
docs/ai-collaboration/  project documentation
```

## Accessibility

WebGL is decoration only. Every informational element is real DOM — headings,
`<button>`, real links — so the portfolio stays complete and navigable when
WebGL is unavailable, when JavaScript fails, and under a screen reader.
`prefers-reduced-motion` is honoured by landing each scene on its settled
state with no animation at all.

## Deployment

Static hosting, no backend. Push the repository and point any of GitHub Pages,
Netlify or Vercel at the root — there is no build command and no environment
configuration. No API keys or secrets exist in this project.

## Credits

Typefaces: Anton, Inter and JetBrains Mono, all under the SIL Open Font
License.

The cinematic direction of this portfolio — scroll-driven scenes, a WebGL
backdrop behind accessible DOM, and the practice of gating each scene to its
own visibility — was inspired by publicly visible work by Gireesh Kumar Reddy.
That project carries no licence, so none of its code, styles or media were
copied; this is an original implementation.
