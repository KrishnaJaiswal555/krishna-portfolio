# TEST CHECKLIST

What to run and check before any change counts as done. A change is done only when every row matches its expected output.

> **Automated checks: executed 2026-09-21, all passing.**
> **Manual browser checks: NOT yet executed** — no browser has been driven in
> this project at any point, across six phases. Every row in the manual tables
> is unverified and must not be reported as working until someone has
> actually looked at it. This is the project's largest known gap.

## Commands

| Check | Command | Expected output | Last run |
|---|---|---|---|
| Content integrity | `node tools/check_content.mjs` | **11** named checks print `ok`, then `11 checks passed`; exit 0 | ✅ 2026-09-21 — matched |
| Rendered-field assertions | For every field a renderer prints, an assertion exists that it is present | A missing field must fail the check, not render `undefined` | ✅ 2026-09-21 — projects, experience, certifications and timeline all covered |
| Element contract | After adding markup a module reads by id / dataset, grep both sides | Every id, `data-*` and hook the JS consumes exists in the markup | ✅ 2026-09-21 — matched. A mismatch here yields controls that are silently dead, with no error |
| Module syntax | `node --check <each module under src/ and tools/>` | Prints nothing, exit 0, for all **14** modules | ✅ 2026-09-21 — matched |
| Property ownership | For each style property JS writes per frame, grep CSS for a rule setting or transitioning it | Exactly one writer. `transform` on `.pc` and the deck belongs to `universe.js`; CSS must not transition it | ✅ 2026-09-21 — single writer confirmed. Two writers on one animated property is a race that resolves differently per frame, and neither rule looks wrong on its own |
| Import graph | `grep` every `^import` binding against the `^export`s of its source module | Every named import resolves | ✅ 2026-09-21 — matched. **Do not skip:** `node --check` parses each file in isolation, so a mistyped export name passes syntax and fails only in the browser |
| Class-name contract | `grep` each class / custom property JS sets, confirm CSS matches | `is-gl`, `is-typed`, `is-reveal-ready`, `is-in`, `is-active`, `jn__*`, `--ri` present on both sides | ✅ 2026-09-21 — matched. A mismatch here produces no error at all, just content that never appears |
| No dead exports or unread writes | `grep -rn "<name>" src/ tools/` for each export and each written property | Every one has at least one reader | ✅ 2026-09-21 — `dataset.milestone` found unread and removed. Prior finds: `unitQuad`, `progress` |
| Element-contract drift | After changing an element's tag, grep for code that still assumes the old one | No `button.jn`, no `.type =` on a div | ✅ 2026-09-21 — matched |
| Server syntax | `python -m py_compile tools/serve.py` | Prints nothing, exit 0 | ✅ 2026-09-20 — matched |
| Dev server | `python tools/serve.py 5173` | Serves the root; see MIME table below | ✅ 2026-09-20 — matched |
| Tests | — | No test framework. `check_content.mjs` is the whole suite, by design. | n/a |
| Type check / Lint / Build | — | Not applicable; plain JavaScript, no types, no linter, no build step. | n/a |

### Server responses — verified 2026-09-20

A wrong MIME type on `.js` would break every `import` in the browser while
looking perfectly fine on disk, so this is checked explicitly.

| Path | Expected | Actual |
|---|---|---|
| `/` | `200 text/html` | ✅ |
| every module under `/src/` | `200 text/javascript` | ✅ |
| `/src/styles/*.css` | `200 text/css` | ✅ |
| `/public/resume/…pdf` (absent) | `404` | ✅ — the state that hides the résumé button |
| `/public/projects/…png` (absent) | `404` | ✅ — the state that triggers the generated placeholder |
| Response header | `Cache-Control: no-store, must-revalidate` | ✅ present |

## Manual Checks

**None of these have been performed.** Run `python tools/serve.py 5173`, open
<http://localhost:5173>, and fill in the Actual column.

### Page-wide

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Page renders | Open the site | All six sections visible; no empty shell; body fades in | — |
| Console clean | DevTools console on load | No errors and no warnings. `[portfolio] <name> scene unavailable:` appears **only** if a scene actually throws | — |
| Keyboard only | Tab from the top | Skip link first; every **project card** reachable with a visible focus ring. Timeline rows are content, not controls, and are correctly **not** in the tab order | — |
| No photograph | Inspect the rendered page and `public/` | No image of Krishna anywhere | — |
| JS disabled | Disable JavaScript, reload | Hero name and About copy readable, `<noscript>` contact details shown. **Nothing hidden.** Timeline and project cards will be absent — they are JS-rendered | — |
| Mobile layout | Narrow to 380px | Journey rail stacks; deck becomes one column; burger menu opens and closes | — |
| Reduced motion | Enable OS "reduce motion", reload | No animation anywhere; every scene lands settled and fully readable | — |

### Responsive (FEATURE-008)

Breakpoints in play: **400px**, **620px**, **720px**, **860px**, **900px**,
plus `max-height: 520px and (orientation: landscape)` and `pointer: coarse`.

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| No horizontal scrollbar | At 320, 360, 400, 768, 1024, 1440px | **Never** a horizontal scrollbar, on any section, at any width | — |
| Case dialog width | Open a case study on desktop with classic scrollbars | Dialog does not exceed the viewport. It was `100vw`, which includes the scrollbar gutter and is wider than the visible page | — |
| Deck overflow-safe by construction | At 320px, temporarily disable the 620px rule in devtools | Deck still does not overflow — the `min(300px, 100%)` floor handles it without needing the media query | — |
| Small-phone type | At 320–400px | Hero and closing wordmark each fit their line; section titles readable and not crowding the gutter | — |
| Short landscape | Phone rotated to landscape (~667×375) | Hero shrinks to fit instead of filling 100svh; scroll cue hidden; sections tighten | — |
| Tap targets | On a real touch device | Buttons, burger, dialog close and case-nav controls all comfortably tappable (≥44px) | — |
| Coarse vs narrow | Narrow a **desktop** window to 380px | Tap targets stay desktop-sized — the rule keys on input device, not viewport width | — |
| Case nav wrapping | Open a case study at 360px | Prev/next stack rather than squashing into unreadable slivers | — |
| Nav bar clearance (mobile) | Scroll to the bottom of a case study at 360px | The last line clears the nav bar | — |
| Portrait recomposition | At 380px portrait | Each section is recomposed, not merely a shrunken desktop layout | — |

### Hero (FEATURE-001)

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Sequence | Load and watch | Black → particles surface → condense into the name → copy fades in staggered → settles with drift | — |
| WebGL init | Console on a WebGL2-capable machine | The `.hero` section does **not** carry `is-fallback` | — |
| No WebGL | Force-disable WebGL, reload | Hero name visible immediately; no blank hero | — |
| Pointer parallax | Move the cursor after it settles | Field drifts by depth; subtle, not a toy | — |
| Resize | Drag across 620px and 1100px | Field re-samples against the new type size; count steps without corruption | — |
| Reduced motion | Reduce motion, reload | Particles drawn **already formed** into the name, held still | — |

### About (FEATURE-002)

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Reveals | Scroll into the section | Copy arrives staggered, once. Scrolling back does **not** replay it | — |
| Lattice subordinate | Read the body copy over the canvas | Grid visible but never costs the text contrast | — |
| Text selectable | Drag-select the intro paragraph | Selects normally; the canvas does not intercept | — |
| Fade at edges | Scroll through the section | Grid fades in and back out; no hard edge against neighbours | — |
| Resize stability | Resize repeatedly | Grid re-solves without the field twitching | — |

### Journey (FEATURE-003)

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Spine reads | Scroll into the section | A continuous thread beside the rail, running off both ends — not a stray column of dots | — |
| Bulge glides | Scroll slowly through | The bulge moves smoothly between milestones; never jumps | — |
| Scroll drives | Keep the pointer away from the rail | The active milestone follows the viewport centre | — |
| Hover overrides | Hover a row, then leave | Hover takes over immediately; leaving returns control to scroll | — |
| Dates correct | Read the rail | `2021`, `Feb – Jun 2026`, `May 2026`, `Jun 2026`, `Aug 2026` — in that order, no repeated bare "2026" | — |
| No graduation claim | Read the rail | No milestone asserts the degree was completed | — |
| Spine on-canvas | Narrow to 380px | The spine stays visible on the canvas; rail stacks | — |
| Reduced motion | Reduce motion, reload | Spine drawn once and still; rail fully readable | — |

### Timeline indicator — regression fix (BUG-001)

The indicator is a per-row `box-shadow`, not a separately positioned bar, so
it cannot drift out of alignment and has no hardcoded coordinates. Precedence
is **pin > hover > scroll**.

The *state machine* behind these rows is covered by an automated headless test:

```bash
node tools/journey-interaction.mjs
```

It drives the real `initJourney()` with `getContext()` stubbed to `null` and
fires genuine click / pointerenter / pointerleave events. It caught a defect
the static checks had passed clean. Rows marked **⚙** are verified by it; the
rest are browser-only, because no simulation can tell you whether something
actually *renders*.

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Click moves it ⚙ | Click each of the five rows in turn | The cyan bar and tint move to the clicked row **every time**. This is the reported bug | ⚙ state verified; appearance browser-only |
| All five work ⚙ | Test every row, including first and last | No row is dead; none is stuck | ⚙ all five verified |
| Hover then click ⚙ | Hover a row, then click that same row | It pins, and reports `aria-pressed="true"`. **This exact path was broken** and static checks missed it | ⚙ verified |
| Click again releases ⚙ | Click the pinned row a second time | Pin releases; the indicator resumes following scroll | ⚙ verified |
| Hover previews ⚙ | Hover across rows without clicking | Highlight follows the pointer; hovering alone does not pin | ⚙ verified |
| Pin survives pointer leave ⚙ | Pin a row, hover elsewhere, leave the rail | Indicator returns to the pinned row | ⚙ verified |
| Works without WebGL ⚙ | Force-disable WebGL, reload | **Indicator still works.** It used to sit behind the WebGL guard and vanished entirely | ⚙ verified — the harness stubs `getContext()` to null |
| Scroll cannot override a pin | Pin row 3, then scroll the section | Row 3 stays lit. Before the fix, the frame loop reset it every frame | — real scrolling is browser-only |
| Keyboard | Tab onto a row, press Enter/Space | Pins it, same as a click; focus ring visible | — |
| Announced state | Screen reader over a pinned row | Actually *spoken* as a pressed toggle button. The attribute value is automated; the announcement is not | — |
| Alignment | Compare bar to row at several widths | Bar spans exactly the selected row's height at every viewport | — |
| Responsive | Narrow below 620px | Rows stack; indicator still tracks the selected row | — |
| Reveal animation | Scroll the rail into view | Rows fade/slide in. A `transition` conflict was silently killing this | — |

### Project Universe (FEATURE-004)

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| One coordinated entrance | Scroll into Work | All five cards arrive as a single event. **Not** a queue of cards fading in one after another | — |
| Depth parallax | Move the pointer across the section | Flanking cards move further than centre cards; the deck yaws as one object | — |
| Hover lift | Hover one card | It lifts toward you; siblings ease back slightly | — |
| Keyboard parity | Tab onto a card | It lifts exactly as hover does, and drops on blur | — |
| No transform fight | Hover on and off repeatedly, quickly | Motion is smooth. Any stutter or snapping means CSS has regained a `transform` rule — see the Property ownership row above | — |
| Constellation | Look behind the cards | A network strung between card centres, not scattered dots or a bare zig-zag | — |
| Even density | Compare short and long links | Particles are evenly spread; not bunched on the short links | — |
| No WebGL | Force-disable WebGL, reload | Deck **still** rises, parallaxes and lifts on hover. Only the network is missing | — |
| JS disabled | Disable JavaScript, reload | Deck is plain, complete and every card clickable — not hidden | — |
| Reduced motion | Reduce motion, reload | Cards settled and visible, no parallax; network drawn once and still | — |
| Reflow | Resize across 620px and 1100px | Grid reflows, depths re-solve, the constellation re-strings to the new centres | — |

### Project overview visuals and backdrop (FEATURE-011)

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Per-project art | Look at all five cards | Each shows a *different* schematic of that project — embedding space, agent chain, dashboard bars, CNN stack, transaction graph. Not five identical constellations | — |
| Honest labelling | Read each card's art | "SCHEMATIC — VISUAL PENDING". These must not read as real screenshots | — |
| Text stays dominant | Read card titles and blurbs | Art is subordinate; text never loses contrast against it | — |
| Backdrop present | Look at the Work section background | A faint blueprint grid with two dim pools — charcoal, not black, and not bright | — |
| Backdrop is immovable | Scroll through the Work section | The backdrop stays put; it does **not** travel with the section | — |
| Backdrop ignores the cursor | Move the pointer around the section | The backdrop does not react at all. Only the cards and constellation respond | — |
| Backdrop does not reach the indicator | Scroll between Journey and Work | The cyan milestone indicator is unaffected — the backdrop is scoped to `.universe` | — |
| Readability | Read every label over the backdrop | Full contrast retained; the section-edge mask prevents a hard seam | — |
| No new requests | Network tab, hard reload | **Zero** new requests. The backdrop is CSS gradients; the card art is canvas | — |
| Responsive | 320px → 1440px | Backdrop and card art both scale without banding, overflow or seams | — |
| Reduced motion | Enable "reduce motion", reload | Backdrop switches to `scroll` attachment; no repaint cost on scroll | — |
| Performance | Profile while scrolling the Work section | No new long tasks. `background-attachment: fixed` repaints on scroll — if it stutters on a low-end machine, that is the suspect | — |

### Skills and résumé (FEATURE-006)

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Reveals | Scroll into Skills | Heading, skill groups, experience and certifications arrive staggered, once | — |
| Groups distinct | Look at the skills grid | Five categories separated by hairline rules — not one undifferentiated field of pills | — |
| No invented ratings | Read the skills | Skills are **listed only**. No bars, percentages, star ratings or implied ranking anywhere | — |
| Experience line | Read the Experience block | "Prism IT Solutions · Pune, Maharashtra · Feb – Jun 2026" — no `undefined` | — |
| Résumé absent | With no PDF in `public/resume/` | The entire résumé block is absent — not an empty heading with a dead button | — |
| Résumé present | Drop the PDF in, reload | Titled block appears with its description and a working download | — |

### Finale and footer (FEATURE-007)

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Closing bookend | Scroll to the very bottom | Particles gather into "KRISHNA JAISWAL", echoing the opening | — |
| Gather tracks scroll | Scroll down and back up slowly | The gather follows your scroll position; it is not on a timer | — |
| Never fully settles | Rest at the bottom | The field keeps drifting — looser than the hero, deliberately unresolved | — |
| Wordmark alignment | Look at the gathered field | Particles align to the actual letterforms, not offset from them. A shift here means `sampleHeading()`'s baseline offset needs correcting — **in one place, shared with the hero** | — |
| Not announced twice | Screen-reader pass over the footer | The closing wordmark is `aria-hidden`; the name is announced once, by the page `<h1>` | — |
| Copyright year | Read the footer | Shows the current year, set from the clock — not a frozen 2026 | — |
| No-JS year | Disable JavaScript | A sensible year still shows from the markup | — |
| Back to top | Click "Back to top" | Returns to the hero | — |
| Contact links | Click each | Email opens a mail client; LinkedIn and GitHub open in a new tab | — |
| No WebGL | Force-disable WebGL | Footer fully readable; wordmark visible as static type, no gathering | — |

### Accessibility and performance (FEATURE-009)

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Contrast | Inspect small secondary text (copyright, card subtitles, timeline keys, metric notes) | Comfortably readable. `--dimmer` was ≈3.0:1 and is now ≈5.7:1; `check_content.mjs` asserts every text token ≥4.5:1 | — |
| List semantics | VoiceOver / NVDA over the nav, Focus list, certifications, timeline, case-study features | Each is announced as a list **with its item count**. `list-style: none` strips this in Safari without the explicit `role` | — |
| Heading order | Run an accessibility inspector | Exactly one `<h1>` (the hero); `<h2>` per section; `<h3>` for subsections. No skipped levels | — |
| Skip link | Load the page, press Tab once | "Skip to content" appears and jumps past the header | — |
| Focus ring | Tab through every control | A visible accent ring on each — links, buttons, project cards, dialog controls | — |
| Canvas hidden from AT | Screen-reader pass | No canvas is announced; all five carry `aria-hidden="true"` | — |
| Name announced once | Screen-reader pass over the footer | The closing wordmark is not read — the `<h1>` already announced it | — |
| No ungated animation | Scroll past a scene, watch the CPU | Every `requestAnimationFrame` lives in `scene.js`; off-screen and hidden-tab scenes stop entirely | — |
| Frame cost | DevTools performance profile while scrolling | Smooth scrolling; no long tasks from particle updates | — |
| DPR cap | Load on a 3× display | Canvas buffers cap at 2× — sharp, without quadrupling fill cost | — |
| Payload | Network tab, hard reload | ~125KB of JS+CSS+HTML, plus Google Fonts. No other third-party request | — |

### Deployment (FEATURE-010)

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Content check before publishing | `node tools/check_content.mjs` | `12 checks passed`, exit 0 | ✅ automated |
| No root-relative paths | Pre-deployment audit script | None — all references relative, so a subpath deploy resolves | ✅ automated |
| No secrets | Pre-deployment audit script | No keys, tokens or credentials in any shipped file | ✅ automated |
| Subpath deploy | Publish to GitHub Pages as a **project** site, load `https://<user>.github.io/<repo>/` | Styles, modules and fonts all load. This is where a root-relative path would 404 while localhost looked fine | — |
| `.nojekyll` respected | Check the Pages build log | No Jekyll processing of `docs/` | — |
| JS MIME type | Network tab on the deployed site | `.js` served as JavaScript. Served as `text/plain`, every module is refused and the page is blank | — |
| Deep link on host | Open `…/#project/upi-sentinel-ai` directly on the deployed URL | Case study opens — fragments never reach the server, so no redirect rules are needed | — |
| No unintended links | Open all five case studies on the deployed site | Only links Krishna has explicitly added appear | — |

### Work-section artwork and backdrop (2026-09-22 round)

**The five project images and the background image do not exist yet.**
`public/assets/projects/` is empty, so every card and case study currently
renders the generated schematic, and the backdrop renders its CSS-gradient
layers with the photograph layer simply failing. The paths are wired; adding
the files requires no code change. Rows below marked **(needs assets)** cannot
be judged until they are supplied.

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| All five cards render | Scroll to Work | Five cards, numbered 01–05, none blank | — |
| Artwork present | Look at each card | A schematic fills the upper area edge to edge — no empty dark rectangle | — |
| Images load **(needs assets)** | Drop the five JPGs into `public/assets/projects/` and reload | Each card shows its own photograph instead of the schematic | — |
| Correct image per project **(needs assets)** | Open all five case studies | Each shows *its own* image — never the same one twice | — |
| Case-study visual is larger | Open any project | Substantially larger than the card image, with a dark frame and cyan edge | — |
| Case-study parallax | Move the pointer inside an open case study | The visual drifts a few px. No zoom, no jitter | — |
| Card hover | Hover one card | It rises, cyan edge strengthens, image scales ~1.02, siblings dim slightly, text stays readable | — |
| No hover stutter | Move on and off cards quickly | Smooth. Stutter means CSS has regained `transform` or `opacity` on `.pc` | — |
| Backdrop is fixed | Scroll the whole page | The grid and pools stay put; they do not travel with any section | — |
| Backdrop stays black | Look at every section | Still reads black/white/cyan. The backdrop must not brighten the page | — |
| Backdrop is visible past the hero | Scroll to About/Journey/Work | The backdrop shows through. `.flow` carried an opaque background that hid it | — |
| Backdrop never touches the indicator | Hover/click the Journey rail | Cyan indicator behaves exactly as before | — |
| Text readability | Read body copy in every section | Full contrast retained over the backdrop | — |
| No horizontal scrollbar | 320 → 1440px | Never. The case-study frame uses a negative margin — check it at 360px | — |
| Mobile layout | 380px | Single-column cards, artwork still correctly cropped | — |
| Console clean | DevTools on load and after opening a case study | No errors. 404s for the six missing images are expected until supplied | — |

### Case studies

| Check | Steps | Expected result | Actual |
|---|---|---|---|
| Projects render | Scroll to Work | Five cards, 01–05, each showing a generated "VISUAL PENDING" placeholder | — |
| No invented links | Open each case study | Every project shows "Links to be added" — never a guessed repository URL | — |
| Metrics honesty | Open case study 01 | Precision@5 `0.80` with note "12-query evaluation set"; `0.67` without reranking; no latency figure | — |
| Disclaimers present | Open case studies 04 and 05 | Both show a Note covering the academic / synthetic-data limits | — |
| Opens | Click any project card | Overlay slides in; URL becomes `#project/<id>` | — |
| Deep link | Load `/#project/upi-sentinel-ai` directly | Overlay already open on that project | — |
| Back button | Open a case study, press Back | Overlay closes; page stays put | — |
| Esc / backdrop | Press Escape, then click outside | Overlay closes both ways | — |
| Résumé button | With no PDF present | Button hidden, not broken. Add the PDF, reload → button appears | — |
| Architecture renders | Open each of the five case studies | Each shows an Architecture section as a numbered pipeline | — |
| Nav ends disable | Open project 01, then project 05 | Prev is disabled on 01; Next is disabled on 05. Neither wraps around | — |
| Arrow keys | With the overlay open, press ← and → | Steps between projects | — |
| History not buried | Open 01, step to 05, press Back once | Returns to the deck — not four steps back through the projects | — |
| Nav bar clearance | Scroll to the bottom of a long case study | The last line is fully readable, not trapped under the nav bar | — |
| Nav labels | Look at the prev/next controls | Each shows the destination project's title | — |
