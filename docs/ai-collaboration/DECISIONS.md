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
