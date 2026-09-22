# DECISIONS

Record meaningful technical or product decisions.

## Decision Log

### 2026-09-20 — Reimplement rather than adapt the reference repository

**Decision:** Write an original implementation; copy nothing from
`github.com/gireeshkumarreddy/cinematic-portofilo`.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** The brief named that repository as the design and
technical source, and asked for its code and systems to be reused where the
licence permits.

**Options considered:**
- Reuse its code and media directly
- Fork and adapt
- Original implementation informed by observable behaviour

**Chosen approach:** Original implementation.

**Reasoning:** The repository has no licence. Verified two independent ways:
`git show HEAD:LICENSE` returns `fatal: path 'LICENSE' does not exist in
'HEAD'`, and the GitHub API reports `"license": null` with HTTP 404 on the
licence endpoint. With no licence, default copyright applies — public
visibility grants no reuse rights. Techniques and architecture are ideas and
are not copyrightable; only their expression is. So the mechanisms could be
studied and rebuilt, but not copied.

**Consequences / Trade-offs:**
- No legal exposure; the codebase is wholly original.
- Its media is doubly unusable: the footage is of its creator, and the project
  artwork belongs to his clients.
- More work than adapting, and exact visual parity is not achievable.
- Anton, Inter and JetBrains Mono are SIL OFL and used legitimately.

**Status:** Active

---

### 2026-09-20 — Vanilla ES modules + WebGL2; no framework, bundler or animation library

**Decision:** Zero runtime dependencies. No React, Vite, Three.js or GSAP.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** The brief asked that the architecture be justified and
that frameworks not be added by default.

**Options considered:**
- React + Vite + React Three Fiber
- Three.js + GSAP, no framework
- Plain ES modules + raw WebGL2

**Chosen approach:** Plain ES modules + raw WebGL2.

**Reasoning:** The content is six sections and five case studies — no routing
or state complexity that earns a framework. Three.js is roughly 600 KB for
effects that are a few hundred lines of GLSL here. Static deployment becomes a
file copy with no build command. The reference is the existence proof that the
cinematic result needs none of it.

**Consequences / Trade-offs:**
- Easing, damping and the render loop are hand-written (`src/lib/ease.js`).
- No hot reload; `tools/serve.py` sends `Cache-Control: no-store` instead.
- `package.json` exists solely to set `"type": "module"` so Node can run the
  content check. It declares no dependencies and no build step.

**Status:** Active

---

### 2026-09-20 — A particle field replaces the reference's human protagonist

**Decision:** The site's recurring visual subject is a particle field
representing embedding space, not a person.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** Every scene in the reference is anchored on video of a
person. Krishna has explicitly declined to provide a photograph, and the
reference's own footage is unusable.

**Options considered:**
- Licensed stock footage of a figure
- A generic silhouette illustration
- A procedural particle field

**Chosen approach:** One `ParticleField` module reused across scenes with
different force targets — condensing into the wordmark in the hero, trailing
the journey rail, forming a lattice between project cards, dispersing at the
finale.

**Reasoning:** It needs no footage and no licensing, costs less to run than
video, and is thematically apt for someone whose flagship project computes
embeddings. One system with four configurations, not four systems.

**Consequences / Trade-offs:**
- The portfolio is buildable and shippable with no photograph at all.
- Loses the emotional anchor a human figure provides.
- Exact visual parity with the reference is not attainable, by design.

**Status:** Active

---

### 2026-09-20 — Content is data; absent data renders nothing

**Decision:** All personal and project facts live in `src/data/content.js`.
`metrics: []` renders no metrics; `links: {}` renders no buttons.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** Krishna's standing instruction is that no metric, link,
deployment URL or achievement may be invented, and that unverified projects
must be clearly distinguished from inspected ones.

**Options considered:**
- Rely on care when writing markup
- Enforce it structurally in the data model

**Chosen approach:** Structural enforcement. The renderer loops arrays; an
empty array produces no markup, so the page cannot display a figure that was
not deliberately recorded. `tools/check_content.mjs` additionally rejects
placeholder-shaped URLs and requires a disclaimer on any project flagged
`source: 'provided'`.

**Reasoning:** A rule enforced by discipline fails quietly at the exact moment
it matters. A rule enforced by the data model cannot.

**Consequences / Trade-offs:**
- Adding a project or timeline entry is a data edit, never a layout change.
- Every `links: {}` ships empty until Krishna supplies real URLs; case studies
  show "Links to be added" rather than a guessed repository address.

**Status:** Active

---

### 2026-09-20 — Project 01's headline metric is qualified, not rounded up

**Decision:** Present Precision@5 as `0.80` with the note *"12-query evaluation
set"*, alongside `0.67` without reranking.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** The project's README headlines "Precision@5 = 0.800, up
from 0.673". Its own evaluation artifact (`artifacts/eval_results.json`) records
`mean_precision_at_k: 0.8` over **11 answerable queries out of 12**;
`mean_precision_at_k_all_queries` is `0.7333`; hard queries score `0.4667`; and
measured `mean_latency_ms` is `96.9`, while the README claims "~40 ms".

**Options considered:**
- Reproduce the README headline unchanged
- Qualify the figure with its sample size
- Omit metrics entirely

**Chosen approach:** Qualify it, and omit the latency claim.

**Reasoning:** The result is genuinely good and survives being stated
accurately. An unqualified figure collapses under one follow-up question from
a recruiter, which is a worse outcome than the smaller honest number.

**Consequences / Trade-offs:**
- The headline reads slightly less impressive and is defensible in interview.
- Latency is not shown at all rather than shown at a disputed value.

**Status:** Active

---

### 2026-09-20 — Hero particles sample the live `<h1>`, rather than a glyph atlas

**Decision:** Derive particle targets by rendering the actual heading text into
an offscreen 2D canvas and sampling its opaque pixels.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** The particle field has to form the shape of
"KRISHNA JAISWAL" at any viewport width, against type sized by a fluid
`clamp()` that has no fixed pixel value.

**Options considered:**
- Glyph atlas with solved per-letter metrics (the reference's approach)
- Canvas-drawn wordmark with the `<h1>` hidden as `sr-only`
- Sample the ink of the live `<h1>`

**Chosen approach:** Sample the live `<h1>`.

**Reasoning:** The glyph atlas exists in the reference to clip *video* inside
letterforms; this design does not do that, so it would buy nothing. Hiding the
heading would cost selectability and translation, and any misalignment would
read as broken. Sampling the real element keeps the particle silhouette
aligned with whatever the browser actually painted — including a fallback
face — and re-sampling on resize is a single call.

**Consequences / Trade-offs:**
- `document.fonts.ready` must be awaited before sampling, or the fallback
  face's shapes get baked into the field.
- Sampling runs at half resolution and costs one `getImageData` per resize.
- The heading stays real, crisp, selectable text throughout.

**Status:** Active

---

### 2026-09-20 — The hero copy is visible by default and hidden only on success

**Decision:** CSS shows the hero text unconditionally. `hero.js` adds `.is-gl`
after confirming a WebGL2 context, and only that class hides the copy pending
the reveal.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** A reveal animation normally starts from `opacity: 0`.
If the code that reveals it never runs, the content is invisible forever.

**Options considered:**
- Hide in CSS, reveal in JS (conventional)
- Show in CSS, hide only once JS proves it can reveal

**Chosen approach:** The second.

**Reasoning:** Every failure path — JavaScript disabled, WebGL2 unavailable,
the scene module throwing, a font never loading — then lands on the *readable*
state rather than a blank hero. `startScenes()` additionally catches any
rejection instead of letting one scene take the page down.

**Consequences / Trade-offs:**
- A visitor on a very slow connection may briefly see the copy before the
  sequence hides it. Acceptable: showing the name too early is a far better
  failure than never showing it.
- Reduced motion also required snapping particle positions onto their targets,
  since `gate()` draws exactly one frame and damping alone would have left the
  field as noise.

**Status:** Active

---

### 2026-09-20 — Scenes are isolated; reveals are armed before any of them run

**Decision:** `startScenes()` iterates a scene registry, calls `reveal()`
first, and catches per scene. It no longer sets a global `is-fallback`.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** With more than one canvas scene, a single failure was
able to mark the whole page as degraded, and the scroll-reveal mechanism ran
after the scenes — so a scene throwing could leave revealed copy permanently
hidden.

**Options considered:**
- Keep initialising scenes individually with a shared failure flag
- A registry loop with per-scene isolation, reveals armed first

**Chosen approach:** The registry loop.

**Reasoning:** `is-fallback` described a whole-page state, which stopped being
true the moment scenes could fail independently — the About canvas failing
says nothing about the hero. Ordering matters for the same reason the hero
copy is visible by default: the mechanism that *shows* text must be armed
before anything that can throw.

**Consequences / Trade-offs:**
- Adding Phases 6–7 is one array entry each.
- `is-fallback` now marks only the individual section that failed, which is
  what TEST_CHECKLIST asserts against.

**Status:** Active

---

### 2026-09-20 — Revealed content is visible by default, hidden only once JS proves it can reveal it

**Decision:** `[data-reveal]` elements are visible in CSS. `reveal.js` adds
`is-reveal-ready` to `<html>`, and only that class hides them pending arrival.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** The conventional pattern starts revealed elements at
`opacity: 0`. Here that would have hidden the entire About section whenever
JavaScript failed or `IntersectionObserver` was unavailable.

**Options considered:**
- Hide in CSS, reveal in JS (conventional)
- Show in CSS, hide only after JS confirms it will reveal

**Chosen approach:** The second — the same inversion already used for the hero
copy.

**Reasoning:** This is the defect class recorded as observation #0003 during
Phase 4: a mechanism that *approaches* the finished state leaves the
unfinished state behind when it does not run. Applying the fix before shipping
cost one class and one capability check.

**Consequences / Trade-offs:**
- Reveals are one-shot; elements are unobserved on arrival, because
  re-animating on every scroll-by makes text unreadable when scrolling back.
- A very slow load may show copy briefly before it is hidden — the same
  accepted trade-off as the hero.

**Status:** Active

---

### 2026-09-21 — The Journey axis is chronological sequence, not calendar years

**Decision:** The timeline rail is ordered by milestone with each entry's real
date granularity as its axis label. The unconfirmed "B.Tech completed"
milestone was removed.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** The reference's Scene 3 is a year scrubber — a clock
hand sweeping 2021→2026 with one node per year. Krishna's milestones are one
entry in 2021 and five in 2026.

**Options considered:**
- Port the year scrubber faithfully
- Invent intermediate milestones to fill 2022–2025
- Change the axis to milestone sequence with real dates

**Chosen approach:** The third.

**Reasoning:** A year axis over this data prints "2026" five times and reads
as a rendering bug — the reference's mechanic depends on one-node-per-year,
which this timeline is not. Filling the gap years was never an option: it
would mean inventing history. Labelling each milestone at its true precision
(`Feb – Jun 2026`, `May 2026`, `Aug 2026`) is both accurate and more
informative than a repeated year would have been.

Separately, "B.Tech completed" asserted a graduation Krishna has never
confirmed, and duplicated the "B.Tech begins" node. The About section states
the 2021–2026 range; the timeline now claims nothing beyond it.

**Consequences / Trade-offs:**
- Visual parity with the reference's clock mechanic is given up deliberately.
- Six timeline nodes became five.
- The shape of the rail now honestly reflects a final-year student's history:
  a long foundation, then a dense burst of work.

**Status:** Active

---

### 2026-09-21 — Timeline rows are not buttons; project cards are

**Decision:** `renderJourney()` emits `<div class="jn">`. Project cards remain
`<button>`.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** Phase 3 built timeline rows as `<button>` on the
reasoning that buttons are keyboard-reachable. Phase 6 gave them an active
state — and it became clear that activating one does nothing a reader needs.

**Options considered:**
- Keep them as buttons for keyboard reachability
- Make them non-interactive content

**Chosen approach:** Non-interactive.

**Reasoning:** Every row is fully readable at all times; the highlight is
decoration. A `<button>` that performs no action is announced to a screen
reader as an actionable control and does nothing when activated — worse than
plain text, not better. The distinction that matters is whether activation
*does* something: a project card opens a case study, so it stays a button.

**Consequences / Trade-offs:**
- Keyboard users no longer move the highlight. Acceptable: the highlight
  carries no information, and the scene still responds to scroll for everyone.
- The tab order is shorter and contains only controls that act.

**Status:** **Superseded 2026-09-21** — see "Timeline rows are buttons again"
below. The reasoning above was correct *given its precondition* (activating a
row did nothing). That precondition expired, and nothing reopened the
decision — which is how the regression in BUG-001 survived.

---

### 2026-09-21 — Timeline rows are buttons again, because they now do something

**Decision:** Reverse the decision above. `renderJourney()` emits
`<button type="button">` with `aria-pressed`, and clicking a row pins the
active milestone.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** Krishna reported the cyan indicator was stuck. Root
cause (BUG-001) was that Phase 6 removed the `.jn:hover` CSS affordance and
made the highlight depend solely on a class that only a per-frame scroll
calculation ever set — so any hover was undone immediately, and a stationary
viewport re-pinned the same row forever.

**Options considered:**
- Restore `.jn:hover` in CSS only, and leave the rows as `<div>`
- Give the rows a real action and make them buttons again

**Chosen approach:** Both, for different reasons. `.jn:hover` returns as a
no-JavaScript affordance; the rows become buttons because pinning is a genuine
action with a genuine toggle state.

**Reasoning:** The earlier decision was not wrong — it was *conditional*, and
the condition was "activating a row does nothing". Once clicking pins a
milestone, a `<button>` with `aria-pressed` is the honest element and the
`<div>` becomes the accessibility problem instead.

**Consequences / Trade-offs:**
- Precedence is now pin > hover > scroll, and the frame loop must respect
  `pinned`. Omitting that term is exactly what caused the bug.
- Indicator logic moved above the WebGL guard; it works with no canvas.
- Decision entries that rest on a precondition should say so, so a changed
  precondition reopens them rather than leaving a settled-looking record.

**Status:** Active

---

### 2026-09-21 — The project deck's choreography does not depend on WebGL

**Decision:** `initUniverse()` runs the card entrance, depth parallax and
hover lift whether or not a WebGL context exists. Only the constellation
requires the canvas.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** Every earlier scene returns `null` immediately when
`createGL()` fails, because in those scenes the canvas *is* the scene. In the
universe, the canvas is a constellation drawn behind cards whose motion is
pure DOM and owes nothing to WebGL.

**Options considered:**
- Bail on a null context, consistent with the other scenes
- Continue without the canvas, running the DOM choreography regardless

**Chosen approach:** Continue.

**Reasoning:** Bailing would have discarded fully working behaviour for an
unrelated reason. Consistency between scenes is worth less than each scene
degrading to the best state it can actually reach — and this is the section
Krishna identified as the most important on the site.

**Consequences / Trade-offs:**
- `initUniverse()` carries `if (gl)` guards that the other scenes do not.
- Without WebGL the deck still rises, parallaxes and lifts on hover; only the
  network between the cards is missing.

**Status:** Active

---

### 2026-09-21 — Where JS animates a property every frame, CSS must not touch it

**Decision:** `transform` was removed from the `.pc` transition and from its
hover rule. `scenes/universe.js` is the sole writer of `transform` on the
cards and the deck.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** Phase 3 gave `.pc` a hover `transform: translateY(-8px)`
and a `transform` transition. Phase 7 began writing a transform to every card
on every frame for entrance, parallax and hover lift.

**Options considered:**
- Leave the CSS hover and have JS avoid transform
- Give JS sole ownership and strip transform from CSS

**Chosen approach:** JS owns it.

**Reasoning:** Two writers on one animated property is not a style question,
it is a race: the per-frame inline write and the transition resolve against
each other differently depending on when each lands, producing stutter that is
maddening to diagnose because neither rule is wrong on its own. The hover lift
also has to compose with the entrance and the parallax offsets, which only the
JS side can see.

**Consequences / Trade-offs:**
- Hover motion now requires JavaScript; without it the cards still highlight
  via border and shadow, which CSS retains.
- Keyboard `focus`/`blur` had to be wired explicitly to the same hover state,
  or keyboard users would get a deck that never responds.
- Recorded in ARCHITECTURE.md as a general rule, since the finale scene will
  face the same question.

**Status:** Active

---

### 2026-09-22 — Commit a `vercel.json` that disables framework detection

**Decision:** Add `vercel.json` with `"framework": null`,
`"outputDirectory": "."` and `"buildCommand": "npm run build"`. This reverses
FEATURE-010's rejection of the same file.

**AI model / version:** Claude Opus 5 (1M context)

**Context / Problem:** Krishna's first real deploy to Vercel failed: it
expected a `dist/` directory. `npm run build` runs the content check and the
deploy audit and emits no files, so `dist/` never existed and never should.

**Options considered:**
- Create a `dist/` directory — **rejected as fabrication.** It would make the
  error disappear while making the repository lie about how it is built.
- Convert the project to Vite so `dist/` genuinely exists — rejected. It would
  add a bundler, a lockfile and a dependency tree to satisfy a host setting,
  reversing the project's founding architectural decision for no technical
  reason.
- Change the dashboard setting only — rejected. It works, but the fix lives in
  a web UI where it is invisible to the repository and to the next person.
- **Commit `vercel.json`** — chosen.

**Chosen approach:** `vercel.json`, verified first that no bundler is needed.

**Reasoning:** The decisive evidence is that `src/` contains **zero bare module
specifiers** — every import is `./` or `../`, which browsers resolve natively —
alongside no dependencies, no lockfile and no bundler config. So the `dist/`
expectation was never about this project's needs; it came from Vercel's
framework auto-detection, which sees a `package.json` with a `build` script and
infers a bundled app. `"framework": null` turns the inference off, which is the
actual root cause rather than the symptom.

`buildCommand` is kept pointed at the checks deliberately: it emits nothing,
but it makes Vercel fail the deploy if content validation breaks — real value
from a step that would otherwise be inert.

**Precondition — what would make this wrong:** this holds *while the project
has no bundler and no bare module specifiers*. If a dependency is ever added
that must be resolved at build time, `outputDirectory: "."` becomes wrong and
this entry must be reopened rather than worked around. Stated explicitly
because FEATURE-010's original rejection of this very file was a well-reasoned
conclusion whose precondition ("both hosts serve a static root with no
configuration") was false about Vercel and went unexamined — the failure mode
recorded as observation #0011.

**Consequences / Trade-offs:**
- Deployment configuration is now reproducible and reviewable in the repo.
- **A dashboard override still beats `vercel.json`** — if `dist/` is set there,
  this file will not save the deploy.
- `docs/` and `tools/` are published, since a `.vercelignore` excluding
  `tools/` would break `buildCommand`. Harmless, but `tools/debug-art.html` is
  a reachable diagnostic page; flagged to Krishna rather than silently changed.
- Netlify still needs no configuration file; this is a Vercel-specific fix.

**Status:** Active
