# TEST CHECKLIST

What to run and check before any change counts as done. A change is done only when every row matches its expected output.

> **Automated checks: executed 2026-09-20, all passing.**
> **Manual browser checks: NOT yet executed** — no browser was driven in that
> session. Every row in the manual table is unverified and must not be
> reported as working until someone has actually looked at it.

## Commands

| Check | Command | Expected output | Last run |
|---|---|---|---|
| Content integrity | `node tools/check_content.mjs` | 7 named checks print `ok`, then `7 checks passed`; exit 0 | ✅ 2026-09-20 — matched |
| Module syntax | `node --check <each module under src/ and tools/>` | Prints nothing, exit 0, for all **10** modules | ✅ 2026-09-20 — matched |
| Import graph | `grep` every `^import` binding against the `^export`s of its source module | Every named import resolves | ✅ 2026-09-20 — matched. **Do not skip this:** `node --check` parses each file in isolation, so a mistyped export name passes syntax and fails only in the browser |
| No dead exports | `grep -rn "<exportName>" src/ tools/` for each export | Every export has at least one caller | ✅ 2026-09-20 — `unitQuad` and `progress` found unused and removed |
| Server syntax | `python -m py_compile tools/serve.py` | Prints nothing, exit 0 | ✅ 2026-09-20 — matched |
| Dev server | `python tools/serve.py 5173` | Serves the root; see MIME table below | ✅ 2026-09-20 — matched |
| Tests | — | No test framework. `check_content.mjs` is the whole suite, by design. | n/a |
| Type check | — | Not applicable; plain JavaScript, no types. | n/a |
| Lint | — | No linter configured. | n/a |
| Build | — | No build step. Deliberate; see DECISIONS.md. | n/a |

### Server responses — verified 2026-09-20

A wrong MIME type on `.js` would break every `import` in the browser while
looking perfectly fine on disk, so this is checked explicitly.

| Path | Expected | Actual |
|---|---|---|
| `/` | `200 text/html` | ✅ `200 text/html` |
| `/src/main.js` | `200 text/javascript` | ✅ `200 text/javascript` |
| `/src/data/content.js` | `200 text/javascript` | ✅ `200 text/javascript` |
| `/src/styles/app.css` | `200 text/css` | ✅ `200 text/css` |
| `/public/resume/…pdf` (absent) | `404` | ✅ `404` — the state that hides the résumé button |
| `/public/projects/…png` (absent) | `404` | ✅ `404` — the state that triggers the generated placeholder |
| Response header | `Cache-Control: no-store, must-revalidate` | ✅ present |

## Manual Checks

**None of these have been performed.** Run `python tools/serve.py 5173`, open
<http://localhost:5173>, and fill in the Actual column.

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Page renders | Open the site | All six sections visible; no empty shell; body fades in | — |
| Console clean | DevTools console on load | No errors. An `[portfolio] WebGL2 unavailable` **info** line is acceptable on hardware without WebGL2 | — |
| WebGL init | Console on a WebGL2-capable machine | No fallback message; `html` does **not** carry `is-fallback` | — |
| Projects render | Scroll to Work | Five cards, 01–05, each showing a generated "VISUAL PENDING" placeholder | — |
| No invented links | Open each case study | Every project shows "Links to be added" — never a guessed repository URL | — |
| Metrics honesty | Open case study 01 | Precision@5 `0.80` with note "12-query evaluation set"; `0.67` without reranking; no latency figure anywhere | — |
| Disclaimers present | Open case studies 04 and 05 | Both show a Note covering the academic / synthetic-data limits | — |
| Case study opens | Click any project card | Overlay slides in; URL becomes `#project/<id>` | — |
| Deep link | Load `/#project/upi-sentinel-ai` directly | Overlay already open on that project | — |
| Back button | Open a case study, press Back | Overlay closes; page stays put | — |
| Esc closes | Open a case study, press Escape | Overlay closes (native `<dialog>`) | — |
| Backdrop click | Click outside the panel | Overlay closes | — |
| Keyboard only | Tab from the top of the page | Skip link first; every card and timeline node reachable with a visible focus ring | — |
| Résumé button | With no PDF present | Button hidden, not broken. Add the PDF, reload → button appears | — |
| Reduced motion | Enable OS "reduce motion", reload | No animation; page lands settled and fully readable | — |
| Mobile layout | Narrow to 380px | Journey rail stacks vertically; deck becomes one column; burger menu opens and closes | — |
| No photograph | Inspect the rendered page and `public/` | No image of Krishna anywhere | — |
