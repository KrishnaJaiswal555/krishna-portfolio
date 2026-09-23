# FEATURE-010: Deployment preparation

- Status: In progress
- Next step: The browser verification. **Nothing in this project has been seen
  rendering.**

## Scope
- Goal: Make the site deployable to a static host without surprises, and
  document how per host.
- In scope: `.nojekyll`, the README deployment section, a pre-deployment audit.
- Out of scope: actually deploying. No remote is configured and nothing has
  been pushed — that is Krishna's decision, not mine.

## The finding that justified the audit

A local dev server always serves from the domain root. **GitHub Pages project
sites do not** — they serve from `https://<user>.github.io/<repo>/`. Any
reference beginning with `/` therefore resolves against the domain root and
404s in production while working perfectly on localhost.

This is invisible to every check in this project and to any amount of local
testing. It had to be audited by reading the references themselves.

## What Was Tried

| Approach | Result |
|---|---|
| Grep for root-relative paths from the shell | **Failed three times.** Regex escaping was destroyed by the shell before `node` saw it, and the fallback matched every quote character in `content.js` — 35KB of noise that read like a finding. This is observation #0009 in action, which I had logged an hour earlier and then repeated. |
| **Write the audit as a file and run it** | **Chosen.** Same fix that worked for the contrast probe. No quoting layer between author and interpreter. |
| Add a `404.html` | Rejected as speculative. The site is one page with fragment-based deep links, so a 404 only fires on a mistyped path. |
| Add `netlify.toml` / `vercel.json` | Rejected **at the time**, on the reasoning that both hosts serve a static root with no configuration. **Reversed for Vercel on 2026-09-22** when the first real deploy failed — see "The rejected option that turned out to be required" below. `netlify.toml` remains unnecessary and unwritten. |
| Pick a licence for the repository | **Not mine to choose.** Noted for Krishna. |

## What Worked
- `.nojekyll` at the repository root. GitHub Pages runs Jekyll by default and
  would otherwise process every Markdown file under `docs/` — a build step
  nobody asked for and a failure class nobody would expect.
- README deployment instructions per host (Pages, Netlify, Vercel, generic),
  including the subpath warning, the `.js` MIME requirement, and why fragment
  deep links need no SPA fallback configuration.

## The rejected option that turned out to be required

Krishna deployed to Vercel and it failed: Vercel expected a `dist/` output
directory that `npm run build` does not produce, because `npm run build` runs
validation and emits no files.

The table above had rejected `vercel.json` as ceremony. That reasoning was
sound **given its precondition** — "both hosts serve a static root with no
configuration" — and the precondition was simply wrong about Vercel. Vercel
does not serve a static root by default; it *auto-detects a framework* and
serves what that framework is expected to emit. Detection is the whole
mechanism, and a project with a `package.json` and a `build` script looks
enough like a bundled app to trip it.

Worth noting how the error arrived: not as "this config is missing" but as
"`dist/` not found", which invites creating a `dist/` directory — the one fix
that would have been pure fabrication. Krishna pre-empted exactly that.

**What was inspected before changing anything** (the diagnosis, not a guess):

| Question | Finding |
|---|---|
| Is a bundler actually required? | **No.** Zero bare module specifiers anywhere in `src/` — every import is `./` or `../`, which browsers resolve natively |
| Are there dependencies to install? | **No.** `package.json` declares no `dependencies` and no `devDependencies`, and there is no lockfile |
| Is there a bundler config? | **No.** No Vite, Webpack, Rollup or Parcel config |
| Does a `dist/` exist or ever get written? | **No.** No `dist/`, `build/`, `out/`, `.next/` or `.output/` anywhere |
| Was the `dist/` expectation committed? | **No.** No `vercel.json`, `.vercelignore` or `netlify.toml` in the repo — so it came from Vercel's dashboard auto-detection |

Conclusion: a plain static site, and the fix belongs in configuration, not in
the project's architecture.

**The fix** — `vercel.json`, four lines:

| Key | Why |
|---|---|
| `"framework": null` | Stops auto-detection, which is the actual source of the `dist/` expectation |
| `"outputDirectory": "."` | The published site *is* the repository root; `index.html` sits there and loads `src/` and `public/` relatively |
| `"buildCommand": "npm run build"` | Kept deliberately. It emits nothing, but it makes Vercel **fail the deploy if content validation breaks** |

Committing it rather than setting it in the dashboard means the setting is
reproducible and reviewable. One caveat recorded for whoever hits this next:
**a dashboard override beats `vercel.json`**, so if the deploy still seeks
`dist/`, the override is why.

**Deliberately not added: `.vercelignore`.** Excluding `tools/` would break
`buildCommand`, since the validation scripts live there. So `docs/` and
`tools/` are published. They are harmless — static Markdown and Node scripts
that a browser never requests and that Vercel will not execute — but
`tools/debug-art.html` is a reachable diagnostic page. Flagged for Krishna
rather than acted on, since he asked for no unrelated changes.

## Verification

### The Vercel fix — run 2026-09-22, all green

The full "Before going live" suite, run after adding `vercel.json`:

| Command | Expected | Actual |
|---|---|---|
| `node -e` JSON parse of `vercel.json` | parses; `framework === null` | ✅ both |
| `npm run build` | exit 0 | ✅ `14 checks passed` + `AUDIT CLEAN` |
| `node tools/journey-interaction.mjs` | all pass | ✅ `ALL INTERACTION CHECKS PASSED` |
| `node tools/art-smoke.mjs` | clean | ✅ `SMOKE TEST CLEAN`, 5 projects, 0 fell back |
| `node tools/art-loader.mjs` | contract holds | ✅ `ART LOADER CONTRACT HOLDS`, 8005ms |
| `deploy-audit` payload | unchanged by this commit | ✅ 24 files, 1414.5 KB |

**Not verified: the deploy itself.** These checks confirm the configuration is
syntactically valid and that nothing regressed. Only Krishna redeploying on
Vercel can confirm the `dist/` error is gone, and that must not be recorded as
done here until he reports it.

### Automated — run 2026-09-21, audit clean

- Check: root-relative references in markup and in JS string literals
- Actual: ✅ **none.** Every reference is relative, so a subpath deploy
  resolves correctly

- Check: full inventory of runtime asset references
- Actual: ✅ relative — `src/main.js`, the three stylesheets,
  `public/projects/${p.id}.png`, `public/resume/…pdf`. External — Google
  Fonts, LinkedIn, GitHub. In-page — the section fragments and `mailto:`

- Check: secrets sweep across every shipped file
- Actual: ✅ no keys, tokens, credentials or private-key blocks

- Check: `localhost` references in shipped files
- Actual: ✅ none (the dev-server URL lives only in docs)

- Check: shipped payload
- Actual: ✅ **25 files, 1422.8 KB** uncompressed, before Google Fonts
  *(re-measured 2026-09-23, after `src/lib/backdrop.js` was added)*

  | | files | size |
  |---|---|---|
  | code (html/js/css) | 19 | 155.0 KB |
  | media (jpeg) | 6 | 1267.8 KB |
  | **total** | **25** | **1422.8 KB** |

  **The audit previously excluded images entirely**, reporting 134.1 KB — a
  figure that described only what the *text* files weigh while claiming to
  describe what a visitor downloads. Once real artwork arrived that
  understated the payload roughly tenfold. `deploy-audit.mjs` now counts media
  in the total and enumerates it, while still text-scanning only code (reading
  a JPEG as utf8 produces noise that can trip the secrets regex).

  Mitigations already in place: project images carry `loading="lazy"` and
  `decoding="async"`, and `.pc__art` reserves its box via `aspect-ratio`, so
  they neither block first paint nor cause layout shift. The background
  (226 KB) is a CSS `url()` and is **not** lazy — it is the one image fetched
  eagerly.

  This originally read `19 files, 129.6 KB`. Both halves changed, for
  different reasons, and neither was a defect:

  - **19 → 18 files.** "Shipped" now excludes `tools/` as well as `docs/`,
    because a visitor's browser never requests either. The old count included
    `tools/check_content.mjs`, and once the test harnesses moved into `tools/`
    the figure would have grown by their size while claiming to describe what
    users download. The audit was also scanning its own source, and dutifully
    reporting the word "localhost" out of its own comments.
  - **129.6 → 134.1 KB.** The site genuinely grew, by the BUG-001 fix and the
    per-project card art.

### Manual — NOT performed
Deployment itself has not been done and must not be reported as done. No
remote is configured, nothing has been pushed, and the site has never been
opened in a browser.
