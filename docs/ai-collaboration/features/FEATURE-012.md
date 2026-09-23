# FEATURE-012: Two further Journey milestones

- Status: Complete
- Next step: Browser confirmation that both rows render with the existing
  styling and reveal stagger.

## Scope

- Goal: Add "Skin Lesion Classification using CNNs" and "AI Career Copilot" to
  the Journey rail.
- In scope: two entries in the `timeline` array in `src/data/content.js`.
- Out of scope: everything else. No change to the Journey component, its
  styling, its animations, its spacing or any existing entry.

## Why this was a one-file change

The Journey section is fully data-driven, so adding a milestone is a data edit
and nothing else. This is the architecture doing what it was built for, and it
is worth stating because "add two entries to the timeline" could otherwise
look like it needs component work:

- `main.js → renderJourney()` loops `timeline` and builds each row, setting
  `data-reveal` and `aria-label` on every one.
- `lib/reveal.js` is called on the whole document *after* rendering, so new
  rows are observed and staggered exactly like the existing ones.
- `scenes/journey.js` collects `.jn` rows after render, so the new rows get
  click-to-pin, hover, focus, `aria-pressed` and the scroll-driven indicator
  with no code change. `measure()` derives the particle spine from the real row
  positions, so the spine extends to cover them automatically.
- `tools/check_content.mjs` already asserts every timeline entry carries
  `year`, `key`, `label` and a non-empty `lines` array.

No second timeline was created and no existing entry was edited, moved or
reordered relative to any other.

## Formatting conventions followed

Read off the existing entries rather than invented:

| Field | Convention | Skin Lesion | Career Copilot |
|---|---|---|---|
| `year` | the milestone's REAL granularity, not a calendar year | `December 2025` | `Sep 2026` |
| `key` | one or two words, the milestone's category | `Deep learning` | `Generative AI` |
| `label` | the project or event name | as given | as given |
| `lines[0]` | technologies, `·` separated | `DenseNet201 · MobileNetV2 · TensorFlow` | `LangGraph · FastAPI · ChromaDB` |
| `lines[1]` | dataset / scale / result | `HAM10000 · 85.0% with Color Constancy + CLAHE` | `AI resume & career platform · 8,971 postings` |
| `source` | matches the project's own flag | `provided` | `verified` |

## Placement

**Skin Lesion — `December 2025`**, inserted at index 1. That date falls between
the 2021 B.Tech start and the Feb 2026 internship, so chronological order is
preserved by inserting there. No existing entry changed position relative to
any other.

**AI Career Copilot — `Sep 2026`**, appended. September follows August, so it
remains the most recent milestone and no entry moved.

The rail now reads: 2021 → December 2025 → Feb–Jun 2026 → May 2026 → Jun 2026
→ Aug 2026 → Sep 2026.

## Facts used, and where each came from

Every claim in both entries was already in `content.js`. Nothing new is
asserted:

- `85.0%` and the `Color Constancy + CLAHE` attribution are the existing
  `metrics` entries on the `skin-lesion-cnn` project, quoted unchanged. The
  `82.1%` baseline is recorded there too and was simply not needed for a
  two-line summary.
- `DenseNet201`, `MobileNetV2`, `TensorFlow`, `HAM10000` are all in that
  project's `tech` and `features`.
- `LangGraph`, `FastAPI`, `ChromaDB` are in the `ai-career-copilot` project's
  `tech`; `8,971` postings is its existing `metrics` entry.
- "AI resume & career platform" summarises that project's own `blurb` and
  `subtitle`, which describe an ATS score, a skill-gap report and a resume
  rewrite grounded in job-postings data.

The Skin Lesion entry carries `source: 'provided'` to match the project's own
flag — it was described from Krishna's brief, not read from source code — so
the authoring guard stays consistent across the file.

## The date that was held open, and why

**Resolved 2026-09-23: AI Career Copilot is `Sep 2026`**, confirmed by Krishna.

It is worth recording how it was handled before that, because the same
situation will recur. Nothing in this repository dated the project — no date in
`projects`, none on the resume-derived entries, and none supplied with the
request, which specified an exact date for the *other* project and none for
this one.

It therefore shipped as a bare `year: '2026'`: the least specific claim that
was still true, placing the project in the right year without inventing a
month. Guessing `Sep 2026` would have rendered identically in the rail and
would have happened to be correct — which is exactly why guessing was the wrong
move. A fabricated value that turns out right is indistinguishable from a
verified one, and nothing would have prompted anyone to check it.

Holding it open cost one comment in `content.js`, one line in HANDOVER and one
checklist row, and it turned an invisible invented fact into a question that
got answered. Confirming it was then a one-line edit, plus removing the flags.

## Verification

### Automated — run 2026-09-23

| Command | Expected | Actual |
|---|---|---|
| `node tools/check_content.mjs` | timeline assertion passes | ✅ `14 checks passed` |
| `node tools/journey-interaction.mjs` | indicator state machine intact | ✅ `ALL INTERACTION CHECKS PASSED` |
| grep `content.js` for the two entries | both present, dates exact | ✅ `December 2025` at line 120, `AI Career Copilot` at line 169 |

`journey-interaction.mjs` builds its own five-row DOM stub rather than reading
`content.js`, so it tests the mechanism independently of how many real
milestones exist. Adding entries cannot affect it, and it was left unchanged.

### Manual — NOT performed

Nobody has seen these rows render. The reveal stagger, the spine extending to
cover seven rows instead of five, and the rail's appearance at mobile width are
all unconfirmed.
