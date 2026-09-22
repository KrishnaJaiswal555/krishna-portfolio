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

## Other checks

```bash
node tools/journey-interaction.mjs   # timeline indicator state machine
node tools/art-smoke.mjs             # per-project card art (drawing)
node tools/art-loader.mjs            # artwork loader contract (~8s)
node tools/deploy-audit.mjs          # paths, secrets, payload
```

`art-loader` asserts one absolute property: **`art()` always settles**,
whatever the image does — loads, errors, or hangs. It exists because nothing
tested the loader, and that is where BUG-002 lived: `loading = 'lazy'` on a
*detached* `Image` meant neither `onload` nor `onerror` ever fired, so the
promise never settled, no artwork was appended, and the cards sat empty with
**no console error**. The hang case is why the run takes ~8 seconds.

There is also a browser diagnostic at `/tools/debug-art.html` — serve the site
and open it. It runs the real loader against the real content, races each call
against a timer, and reports what resolved, its `src`, and its computed
styles. A page of `TIMEOUT` rows is the signature of that deadlock returning.

`journey-interaction` drives the real `initJourney()` against a DOM stub whose
`getContext()` returns `null` — forcing the no-WebGL path — and fires genuine
click, pointerenter and pointerleave events. It exists because it caught a
defect that every static check had passed clean: an `aria-pressed` sync folded
in behind an early return that guarded a different piece of state.

`art-smoke` runs every project's generated card art against a stubbed 2D
context that rejects non-finite coordinates, and reports any project whose
motif is missing and has silently fallen back to the generic field.

`deploy-audit` looks for root-relative references, which work on localhost and
404 on a GitHub Pages project site, plus secrets and stray `localhost` URLs.

None of these is a browser test. They verify state and structure; they cannot
tell you whether anything renders.

## Adding your own assets

Every asset on this site is optional. Nothing breaks when a file is absent —
the page generates a placeholder instead. To fill them in:

| What | Where | Effect |
|---|---|---|
| Project artwork | `public/assets/projects/<filename>` | Shown on that card and its case study. The filename is **not** derived from the id — it is mapped explicitly by `art:` in `src/data/content.js`, and `check_content.mjs` asserts the file exists |
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
tools/journey-interaction.mjs  timeline indicator state machine (headless)
tools/art-smoke.mjs     per-project card art smoke test
tools/deploy-audit.mjs  pre-deployment path and secrets audit
docs/ai-collaboration/  project documentation
```

## Accessibility

WebGL is decoration only. Every informational element is real DOM — headings,
`<button>`, real links — so the portfolio stays complete and navigable when
WebGL is unavailable, when JavaScript fails, and under a screen reader.
`prefers-reduced-motion` is honoured by landing each scene on its settled
state with no animation at all.

## Deployment

Static hosting, no backend, **no build step**. There is nothing to compile and
no environment configuration, because the project has no API keys, tokens or
secrets of any kind.

### GitHub Pages

Settings → Pages → Deploy from a branch → `main` / root.

Two things matter here:

- **`.nojekyll` is in the repository root and must stay.** GitHub Pages runs
  Jekyll over the repo by default, which would try to process every Markdown
  file under `docs/`. The empty `.nojekyll` file turns that off.
- A **project** site is served from `https://<user>.github.io/<repo>/`, not
  from the domain root. Every reference in this project is relative for that
  reason, so it resolves correctly under a subpath. If you ever add a
  reference beginning with `/`, it will work on localhost and 404 on Pages.

### Netlify

Drag the folder onto the Netlify dashboard, or connect the repository. Publish
directory: the repository root. Build command: either leave it **empty**, or
use `npm run build` — that runs the content check and deploy audit and
produces no output, so the published files are the repository as-is.

### Vercel

Import the repository, framework preset **Other**, output directory the root.
Build command empty, or `npm run build` as above.

Both platforms may default to `npm run build` on detecting a `package.json`,
which is why that script exists — see "Before going live".

### Any other static host

Upload the repository contents as-is. The only requirement is that `.js` files
are served with a JavaScript MIME type — every browser refuses an ES module
served as `text/plain`, which presents as a blank page with a console error.

### Deep links

Project case studies are addressed with a URL fragment
(`…/#project/upi-sentinel-ai`), not a path. Fragments never reach the server,
so deep links work on any static host with no redirect rules or SPA fallback
configuration.

### Before going live

```bash
npm run build                        # content check + deploy audit, exits 0
node tools/check_content.mjs         # expects: 14 checks passed
node tools/deploy-audit.mjs          # expects: AUDIT CLEAN
node tools/journey-interaction.mjs   # expects: ALL INTERACTION CHECKS PASSED
node tools/art-smoke.mjs             # expects: SMOKE TEST CLEAN
node tools/art-loader.mjs            # expects: ART LOADER CONTRACT HOLDS (~8s)
```

There is **nothing to compile** — `npm run build` does not produce output. It
exists because Netlify and Vercel commonly default to running `npm run build`
when they detect a `package.json`, and a missing script can fail the deploy.
Pointing it at the checks means the command succeeds on a healthy repo and
**fails the deploy if content validation breaks**, which is the behaviour you
want from a build step that has nothing to build.

Then confirm in the browser that the résumé button appears (or is correctly
absent), and that no case study shows a link you did not intend to publish.

## Credits

Typefaces: Anton, Inter and JetBrains Mono, all under the SIL Open Font
License.

The cinematic direction of this portfolio — scroll-driven scenes, a WebGL
backdrop behind accessible DOM, and the practice of gating each scene to its
own visibility — was inspired by publicly visible work by Gireesh Kumar Reddy.
That project carries no licence, so none of its code, styles or media were
copied; this is an original implementation.
