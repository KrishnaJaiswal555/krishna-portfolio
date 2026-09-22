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
| Add `netlify.toml` / `vercel.json` | Rejected. Both hosts serve a static root with no configuration; the files would be ceremony. |
| Pick a licence for the repository | **Not mine to choose.** Noted for Krishna. |

## What Worked
- `.nojekyll` at the repository root. GitHub Pages runs Jekyll by default and
  would otherwise process every Markdown file under `docs/` — a build step
  nobody asked for and a failure class nobody would expect.
- README deployment instructions per host (Pages, Netlify, Vercel, generic),
  including the subpath warning, the `.js` MIME requirement, and why fragment
  deep links need no SPA fallback configuration.

## Verification

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
- Actual: ✅ **18 files, 134.1 KB** uncompressed, before Google Fonts
  *(re-measured 2026-09-22)*

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
