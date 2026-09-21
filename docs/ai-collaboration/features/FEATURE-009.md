# FEATURE-009: Performance and accessibility

- Status: In progress
- Next step: Browser pass — specifically a screen-reader pass, which is the
  only way to confirm the list-semantics fix actually took.

## Scope
- Goal: Audit what the brief's §12 and §13 ask for, fix what is genuinely
  broken, and leave standing checks where a fix could silently regress.
- In scope: colour tokens, list semantics, heading order, and a contrast
  assertion in `check_content.mjs`.
- Out of scope: self-hosting fonts (deferred, see below).

## What the audit found

| Finding | Severity |
|---|---|
| `--dimmer` at `#55616e` measured **3.19:1** against `--bg` — below the 4.5:1 AA floor — and carried small secondary text (`.fin__c`, `.pc__sub`, `.jn__key`, `.mt__n`, `.cs__pending`) | **Real failure** |
| Zero `role="list"` against a global `list-style: none`. Safari + VoiceOver drop list semantics from an unmarkered list, so item counts are never announced | **Real failure** |
| Apparent second `<h1>` | **False alarm** — an HTML comment containing the literal `<h1>` |
| Every `requestAnimationFrame` confined to `scene.js`; DPR capped at 2; 125KB total JS+CSS+HTML; one third-party origin (Google Fonts) | Healthy, no action |

## What Was Tried

| Approach | Result |
|---|---|
| Fix `--dimmer` by eye until it "looks readable" | Rejected. Perceived readability on one calibrated monitor is not a measurement, and it is exactly how the value got to 3.19:1. |
| **Compute the ratio and assert it** | **Chosen.** `check_content.mjs` now parses the real tokens out of `app.css` and asserts every text colour ≥4.5:1. The values are read from the stylesheet, never duplicated, so the check cannot drift from what renders. |
| Add `role="list"` only where it seemed to matter | Rejected — the rule is global, so the exception would be arbitrary. All ten lists get it: six in markup, four through a new `list()` helper in `main.js` so the reason is stated once. |
| Self-host Anton / Inter / JetBrains Mono | **Deferred, and recorded as deferred.** It would remove the only third-party origin, but requires committing binary font files, and `&display=swap` already prevents invisible text. Not pretending this is done. |
| Read `pointer: coarse` live so convertibles re-evaluate on fold | Deferred. The failure mode is graceful — a folded convertible loses hover parallax and nothing else. |

## What Worked
- `--dimmer` `#55616e` → `#7d8996`: **3.19:1 → 5.66:1**, still clearly dimmer
  than `--dim` at 6.86:1, so the visual hierarchy is intact.
- `role="list"` on all ten lists.
- Heading order confirmed correct rather than "fixed": exactly one `<h1>`.

## Verification

### Automated — run 2026-09-21, all passing

- Check: `node tools/check_content.mjs` — must now report **12**
- Actual: ✅ `12 checks passed`, including `text colours meet WCAG AA contrast
  against the page background`

- Check: the contrast assertion is **not vacuous** — the previous value must
  actually fail it
- Actual: ✅ measured ratios against `--bg #05070a`:

  | token | value | ratio | |
  |---|---|---|---|
  | `--paper` | `#e8edf2` | 17.12:1 | PASS |
  | `--dim` | `#8b98a7` | 6.86:1 | PASS |
  | `--dimmer` | `#7d8996` | **5.66:1** | PASS |
  | `--accent` | `#4fd1e0` | 11.07:1 | PASS |
  | `--warn` | `#e0a34f` | 9.14:1 | PASS |
  | *previous* `--dimmer` | `#55616e` | **3.19:1** | **FAIL** |

- Check: `role="list"` count, **HTML comments stripped**
- Actual: ✅ raw 7, real 6. The extra was the comment explaining the change

- Check: all JS-built lists go through `list()`
- Actual: ✅ 4 call sites, helper defined once, no stray `el('ul'`/`el('ol'`

- Check: heading order, comments stripped
- Actual: ✅ exactly one `<h1>`; `<h2>` per section; `<h3>` for subsections

- Check: `node --check` across all 15 modules; stylesheet brace balance
- Actual: ✅ `syntax_fail=0`; app 46/46, project 46/46, scenes 115/115

### A note on the checks themselves
Six times this phase and the last, a verification command returned a result
that read as a defect and was actually an artefact of the instrument — four
greps matched the explanatory comments written alongside the fix, and two
probes were destroyed by shell escaping before `node` saw the regex. Every one
was resolved by re-running the check differently (stripping comments, writing
the probe to a file) rather than by accepting the first reading. Logged
separately as a Task Observer observation.

### Manual — NOT yet performed
See TEST_CHECKLIST → "Accessibility and performance". The screen-reader row is
the one that matters: `role="list"` is invisible to every automated check this
project has, and only a real assistive-technology pass can confirm it works.
