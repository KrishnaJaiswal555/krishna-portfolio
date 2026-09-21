# FEATURE-007: Contact, footer and the finale scene

- Status: In progress
- Next step: Browser pass. Nothing visual has been observed in any phase.

## Scope
- Goal: Wire the last canvas on the site and give the page a real ending
  rather than a contact list and a copyright line.
- In scope: `src/scenes/finale.js`, the shared `sampleHeading()` extraction,
  the closing wordmark, reveal hooks, a clock-driven copyright year, and a
  back-to-top link.
- Out of scope: new particle configurations — the set is closed at four.

## What Was Tried

| Approach | Result |
|---|---|
| Invent a fifth configuration for the finale | **Rejected on the project's own rule.** The set was declared closed at four in Phase 7, and a fifth would dilute a motif built over four scenes. |
| Reuse the *constellation* (nearest by mood) | Rejected. It means "these things connect", which says nothing at an ending. |
| **Reuse the hero's wordmark configuration as a bookend** | **Chosen.** The film closes on the shot it opened with. A bookend is the one place where repeating a configuration is the point rather than a shortcut. |
| Make the finale identical to the hero | Rejected — that reads as a bug, not a callback. It differs in *feel*, not mechanism: the hero condenses hard and settles; the finale gathers loosely and never stops drifting. An ending, not an arrival. |
| Drive the gather on a clock, as the hero does | Rejected. The visitor reaches the footer after a long scroll; tying the closing shot to their descent makes it feel earned rather than triggered. `pull` and alpha both follow scroll progress. |
| Duplicate the hero's heading-measurement block into `finale.js` | **Rejected.** ~15 lines of computed font, section-relative rects and the baseline offset `fillText` expects. Two copies means two places to correct the same subtle error — and with no browser pass yet, that correction is *likely*, not hypothetical. |
| **Extract `sampleHeading()` into `particles.js`** | **Chosen**, accepting that `hero.js` joins this phase's change set. |
| Leave the copyright year hardcoded | Rejected — it silently goes stale on 1 January. The markup keeps a value for no-JS visitors; JS corrects it from the clock. |

## What Worked
- `initFinale()` mirrors the hero's lifecycle: `createGL` → await
  `document.fonts.ready` → `sampleHeading()` → `scatter()` → `gate()`.
- The closing wordmark is `aria-hidden`: the page's `<h1>` already announces
  the name, and a screen reader should not read it twice. It exists so the
  finale has letterforms to gather into, set large and low-contrast so the
  field reads against it rather than competing with it.
- `.fin__end` puts the copyright and a back-to-top link on one rule-topped
  row, which gives the page a deliberate stop.

### Dead export created by the refactor — found and fixed
Extracting `sampleHeading()` absorbed `sampleInk()`'s only external caller.
`sampleInk` stayed `export`ed with no importer anywhere — a public surface
advertising a contract nobody held. Un-exported; it remains reachable
internally.

This is the **fourth** dead symbol the standing check has caught
(`unitQuad`, `progress`, `dataset.milestone`, `sampleInk`), and the first one
a refactor *created* rather than left behind. Logged as observation #0008.

## Verification

### Automated — run 2026-09-21, all passing

- Check: `node --check` across all 15 modules
- Actual: ✅ 15/15, `syntax_fail=0`

- Check: `node tools/check_content.mjs`
- Actual: ✅ `11 checks passed`

- Check: after un-exporting, does **any** module import `sampleInk`? This
  would fail at runtime and `node --check` cannot see it
- Actual: ✅ no importers. Still reachable internally at `particles.js:196`,
  defined at `:212`

- Check: `particles.js` public surface, and every export has a caller
- Actual: ✅ exactly `createField` (← about, finale, hero, journey, universe)
  and `sampleHeading` (← hero, finale)

- Check: `hero.js` retains no stale `sampleInk` reference after its import
  was swapped
- Actual: ✅ clean; calls the shared helper at `hero.js:88`

- Check: `finale.js` imports resolve
- Actual: ✅ `createGL`, `resizeCanvas`, `createField`, `sampleHeading`,
  `gate`, `prefersReduced`, `clamp`

- Check: footer element contract across markup, stylesheet and JS
- Actual: ✅ `fin__mark` 3/3/2, `fin__markLine` 2/2/1, `fin__end` 1/1,
  `fin__top` 1/2, `finYear` markup+JS, `finStage` markup+JS. `finYear` and
  `finStage` correctly show no CSS: they are ids used by JS, and the canvas is
  styled via its `.fin__stage` class

- Check: wiring
- Actual: ✅ `main.js:20` imports, `:336` registers, `:273` sets the year

- Check: reveal hooks
- Actual: ✅ 18 static `data-reveal` in markup, up from 15

- Check: no unread writes in `finale.js`
- Actual: ✅ none

### Manual — NOT yet performed
See TEST_CHECKLIST → "Finale and footer". The alignment row matters most: if
the gathered field sits offset from the letterforms, `sampleHeading()`'s
baseline factor needs correcting — now in **one** place, shared with the hero,
which is the entire reason for the extraction.
