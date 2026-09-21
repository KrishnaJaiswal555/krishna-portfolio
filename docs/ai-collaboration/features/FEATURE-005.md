# FEATURE-005: Project detail pages — architecture and case-study navigation

- Status: In progress
- Next step: Browser pass. Nothing visual has been observed in any phase.

## Scope
- Goal: Close the last gap between the case study and the brief's §8
  requirements, and make five projects readable as a set rather than as five
  dead ends behind a modal.
- In scope: `architecture` for every project in `content.js`, its rendering in
  `renderCase()`, prev/next navigation in `dialog.js`, the nav controls in
  `index.html` and `project.css`, and a new content assertion.
- Out of scope: project screenshots (Krishna supplies those), real links
  (still deliberately empty), the finale canvas (Phase 10).

## Audit against the brief's §8 list

| # | Requirement | Before Phase 8 |
|---|---|---|
| 1 | Project name | ✅ already rendered |
| 2 | Short description | ✅ `blurb` |
| 3 | Problem statement | ✅ `problem` |
| 4 | Solution | ✅ `solution` |
| 5 | Technologies | ✅ `tech` |
| 6 | Main features | ✅ `features` |
| 7 | **Architecture** | ❌ **missing — no field, no section** |
| 8 | My contribution | ✅ `contribution` |
| 9 | Results | ✅ `metrics`, empty where unverified |
| 10 | Screenshots | ✅ placeholder until supplied |
| 11 | GitHub link | ✅ slot exists, deliberately empty |
| 12 | Live demo link | ✅ slot exists, deliberately empty |

Item 7 was the only genuine omission, and it was invisible: a project with no
`architecture` rendered no section at all, exactly like a project with no
metrics. That is the intended behaviour for *unknown* data and the wrong
behaviour for *missing required* data — so the new assertion in
`check_content.mjs` distinguishes them.

## What Was Tried

| Approach | Result |
|---|---|
| Write architecture as prose paragraphs | Rejected. All five are data-flow systems; a numbered path is how they actually work and how a reader scans them. |
| **Render as an ordered pipeline, reusing `.cs__flow`** | **Chosen.** The class already existed for UPI Sentinel's workflow, so Architecture cost no new CSS. |
| Let architecture be optional, like metrics | Rejected. Empty metrics correctly mean "no verified figures"; empty architecture would just mean "nobody wrote it". Different meanings need different handling, so architecture is asserted and metrics are not. |
| Wrap long sections in `<details>` for progressive disclosure | Rejected. The dialog *is* the disclosure layer — the deck shows a one-line blurb and the case study shows everything. Nesting a second layer inside it would hide content a reader has already chosen to see. |
| Wrap-around prev/next | Rejected. Looping silently from project 5 back to 1 hides the size of the set. The controls disable at each end so the list has a felt beginning and end. |
| Push history on every step | Rejected. Reading all five would bury the deck under five back-presses. Stepping uses `replaceState`; only the initial open pushes. |

## What Worked
- `architecture` added to all five projects. The three inspected during Phase 1
  (product search, career copilot, retail analytics) are described from their
  own README and source; the two Krishna supplied are described from his brief
  and carry the existing `source: 'provided'` flag and disclaimer.
- Prev/next stepping, plus ArrowLeft/ArrowRight while the overlay is open.
  The key handler ignores events from `input`, `textarea` and `select`, so it
  can never hijack typing.
- Nav labels carry the destination project's title, and the accessible name
  reads "Next project — <title>", so a screen-reader user hears where the
  control leads rather than just "Next".
- `.case__in` bottom padding raised to clear the fixed nav bar, so the last
  line of a case study is not trapped underneath it.

## Verification

### Automated — run 2026-09-21, all passing

- Check: `node tools/check_content.mjs` — must report **8** checks, not 7
- Expected: the new architecture assertion runs and passes for all five
- Actual: ✅ `8 checks passed`, including
  `ok every project documents its architecture`. A grep confirms 5 of 5
  `architecture: [` blocks

- Check: `node --check` across all 14 modules
- Actual: ✅ 14/14 `ok`, `syntax_fail=0`

- Check: element contract between `index.html` and `dialog.js` — a mismatch
  here yields buttons that are silently dead
- Actual: ✅ HTML provides `casePrev`, `caseNext`, `data-dir="prev"`,
  `data-dir="next"` and two `case__navLabel` spans; `dialog.js` consumes
  `dataset.dir` and `case__navLabel`; `main.js:348–349` passes both elements

- Check: `dialog.js` exports vs `main.js` imports after the rewrite
- Actual: ✅ exports `initDialog`, `openProject`; both imported

- Check: CSS contract for the new nav classes
- Actual: ✅ `case__nav`, `case__navBtn`, `case__navLabel` all present in both
  markup and stylesheet

- Check: `.cs__flow` is styled, since Architecture reuses it
- Actual: ✅ `project.css:159–160`; used by `main.js:148` (workflow) and
  `main.js:171` (architecture)

### Manual — NOT yet performed
- Architecture renders as a numbered pipeline in all five case studies
- Prev is disabled on project 01, Next is disabled on project 05
- Arrow keys step between projects while the overlay is open
- Stepping does not pile up history: one Back press returns to the deck
- The nav bar never covers the last line of a case study
- Nav labels show the destination project's title
