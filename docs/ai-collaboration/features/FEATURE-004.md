# FEATURE-004: Project Universe — constellation and deck choreography

- Status: In progress
- Next step: Browser pass. Nothing visual has been observed in any phase.

## Scope
- Goal: Give the Work section the weight Krishna identified as the most
  important on the site — depth, parallax, hover interaction and a coordinated
  entrance — without the two things the reference's version depends on and
  this project does not have: twelve screenshots and a photographed person.
- In scope: `src/scenes/universe.js`, registration in `main.js`, the Work
  heading hooks in `index.html`, deck layering / initial state / transform
  ownership in `scenes.css`.
- Out of scope: the finale canvas (`#finStage`). No new content; no project
  artwork — the deck still renders generated placeholders.

## What Was Tried

| Approach | Result (worked / didn't, why) |
|---|---|
| Port the reference's amphitheatre: twelve sprites arranged around the creator's matted figure | **Not portable.** It needs twelve project screenshots and a photograph, and Krishna has supplied neither and declined the photo. What ports is the *behaviour* — depth parallax, hover lift with siblings receding, one coordinated entrance — not the arrangement. |
| **Constellation strung between the card centres** | **Chosen.** The fourth and final particle configuration. A network is also the honest shape of the work: these projects share techniques rather than sitting in a list. |
| Particles on consecutive card links only | Rejected — a bare zig-zag path. Adding `i → i+2` edges turns it into something that reads as a network. Skipped automatically below three cards. |
| Distribute particles evenly per edge | Rejected — bunches them on the short links. Distribution now walks cumulative edge length, so density is even across the whole web. |
| Bail out of the scene when `createGL()` returns null, as every other scene does | **Rejected.** The deck's entrance, parallax and hover are pure DOM and owe nothing to WebGL. Bailing would discard working behaviour for an unrelated reason. Only the constellation is guarded. |
| Per-card time stagger on the entrance | **Rejected**, on the reference's own reasoning. Every card reads one `mat` scalar; what varies per card is how far it *travels*, never when it starts. A time stagger reads as a list loading; varied travel reads as choreography. |
| Keep the CSS hover `transform` from Phase 3 | **Rejected — this was a live bug.** Phase 7 writes a transform to every card every frame; a CSS transition on the same property fights it and resolves at random per frame. JS now owns `transform` outright; CSS keeps colour and shadow. |
| Measure card centres with `getBoundingClientRect()` | Rejected for the third time in this project. This module writes a transform to every card, so the rect would feed the scene its own output. `offsetLeft`/`offsetTop` read layout. |

## What Worked
- Implementation:
  - Card depth is derived from horizontal distance to the deck's centre
    column, so flanking cards move hardest and centre cards least — the
    reference's depth behaviour, solved from real layout rather than assigned
    by index, so it survives the responsive `auto-fit` grid reflowing.
  - The deck yaws as a whole (`rotateY`/`rotateX`) so the group reads as one
    object being looked around, with per-card offsets on top.
  - Hover lifts the hovered card and eases every sibling back; `focus` and
    `blur` are wired to the same state, or keyboard users would get a deck
    that never responds.
  - Counts: 420 / 820 / 1200 by viewport.
- Files / modules touched:
  - Added: `src/scenes/universe.js`
  - Modified: `src/main.js` (import + registry), `index.html`,
    `src/styles/scenes.css`

### Failure behaviour
Cards are visible by default; `universe.js` adds `is-deck-ready` only once it
is going to choreograph them back in. With no JavaScript the deck is plain,
complete and fully clickable. With no WebGL the deck still rises, parallaxes
and lifts — only the network between the cards is missing.

## Verification

### Automated — run 2026-09-21, all passing

- Check: `node --check` across all 14 modules
- Actual: ✅ 14/14 `ok`, `syntax_fail=0`

- Check: every `universe.js` import resolves
- Actual: ✅ `createGL`, `resizeCanvas`, `createField`, `gate`,
  `prefersReduced`, `damp`, `clamp`, `smoothstep` all resolve; `main.js:19`
  imports and `main.js:315` registers `initUniverse`

- Check: **transform ownership** — no CSS rule may set or transition
  `transform` on `.pc` or the deck, since JS writes it every frame
- Actual: ✅ single writer confirmed. The only CSS match is
  `transform-style: preserve-3d`, a different property. `.pc` cards carry zero
  `data-reveal` attributes, so the reveal rule's `translateY` cannot reach
  them either. JS writes at `universe.js:185` (deck) and `:204` (cards)

- Check: class-name contract for `is-deck-ready`
- Actual: ✅ set at `universe.js:62`, matched at `scenes.css:267` and `:270`

- Check: no values written but never read
- Actual: ✅ none — no `dataset` writes in this module

- Check: `.pc__*` contract, JS emits vs CSS styles
- Actual: ✅ all eight match (`art`, `blurb`, `body`, `more`, `num`, `sub`,
  `tech`, `title`)

- Check: `node tools/check_content.mjs`
- Actual: ✅ `7 checks passed`

### Manual — NOT yet performed
- The deck arrives as one coordinated event, not a queue of cards fading in
- Flanking cards move further than centre cards under the pointer
- Hovering lifts one card while its siblings ease back
- Tabbing to a card lifts it exactly as hover does
- The constellation reads as a network between the cards, not as scattered dots
- No stutter or fighting in the card motion (the transform-ownership fix)
- With JavaScript disabled the deck is plain, complete and clickable
- With WebGL unavailable the deck still animates; only the network is missing
- Reduced motion: cards settled and visible, no parallax, network drawn once
- Narrow viewport: deck becomes one column and the entrance still reads
