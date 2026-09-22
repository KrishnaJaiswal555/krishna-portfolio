// Scene 3 — Journey.
//
// The particle field's third configuration: a vertical SPINE running beside
// the milestone rail, which bulges outward where the reader's attention is.
// Hero = a name assembling. About = structured data. Here = a thread being
// followed. One simulation, three meanings.
//
// The active milestone is driven by whichever signal spoke last — pointer
// hover, or otherwise the node nearest the middle of the viewport as you
// scroll. There is no clock and nothing auto-advances: the reader sets the
// pace, so the scene can never move text out from under someone reading it.
//
// Positions are measured with offsetTop, NOT getBoundingClientRect. The rows
// carry `data-reveal`, which applies a transform before they arrive, and a
// transform moves the rect while leaving layout untouched. offsetTop reads
// layout, so it is immune to both the reveal transform and to scroll position.

import { createGL, resizeCanvas } from '../gl/renderer.js';
import { createField } from '../gl/particles.js';
import { gate, prefersReduced } from '../lib/scene.js';
import { damp, clamp } from '../lib/ease.js';

const COLD = new Float32Array([0.14, 0.42, 0.51]);
const HOT = new Float32Array([0.44, 0.88, 0.95]);

function countFor(w) {
  if (w < 620) return 500;
  if (w < 1100) return 900;
  return 1300;
}

export async function initJourney() {
  const section = document.getElementById('journey');
  const canvas = document.getElementById('journeyStage');
  const rail = document.getElementById('journeyRail');
  if (!section || !canvas || !rail) return null;

  // -------------------------------------------------------------------------
  // The active-milestone indicator.
  //
  // This block runs BEFORE the WebGL context is requested, and must stay that
  // way. It used to live below the `if (!gl) return null` guard, which meant a
  // machine without WebGL2 got no indicator at all — the highlight is plain
  // CSS on `.jn.is-active` and owes nothing to the canvas.
  //
  // Precedence is pin > hover > scroll. Scroll is the weakest signal because
  // it is always present: before this, the per-frame scroll branch reclaimed
  // the active row the instant the pointer left, and with a stationary
  // viewport it resolved to the same row every frame — the indicator looked
  // frozen.
  // -------------------------------------------------------------------------

  const rows = [...rail.querySelectorAll('.jn')];
  let active = -1;
  let pinned = -1;        // set by click/Enter; survives pointer and scroll
  let hovering = -1;

  /**
   * Publish the pinned state to assistive technology.
   *
   * Deliberately NOT part of setActive(). This depends on `pinned`, while
   * setActive() guards on `active` — two different pieces of state. Folding
   * them together meant that clicking an already-active row (which is what
   * hovering then clicking always produces) flipped `pinned` and then hit
   * setActive's `i === active` early return, so the pin was painted but never
   * announced. A guard may only protect the concern it is about.
   */
  function syncPinned() {
    rows.forEach((r, k) => r.setAttribute('aria-pressed', String(k === pinned)));
  }

  function setActive(i) {
    if (i === active || i < 0 || i >= rows.length) return;
    rows[active]?.classList.remove('is-active');
    active = i;
    rows[active]?.classList.add('is-active');
  }

  const coarse = matchMedia('(pointer: coarse)');

  rows.forEach((row, i) => {
    // Click toggles a pin. Clicking the pinned row again releases it back to
    // scroll-following, so the control is never a one-way trap.
    row.addEventListener('click', () => {
      pinned = pinned === i ? -1 : i;
      // syncPinned() runs here, where `pinned` actually changes — not inside
      // setActive(), which may legitimately do nothing on this call.
      syncPinned();
      setActive(i);
    });
    // Keyboard parity comes free from <button>, but focus should preview the
    // row the same way hover does.
    row.addEventListener('focus', () => setActive(i));
    row.addEventListener('pointerenter', () => {
      if (coarse.matches) return;
      hovering = i;
      setActive(i);
    });
  });

  rail.addEventListener('pointerleave', () => {
    hovering = -1;
    if (pinned >= 0) setActive(pinned);
  });

  setActive(0);
  syncPinned();

  // -------------------------------------------------------------------------
  // The spine. Everything below is decoration and may legitimately be absent.
  // -------------------------------------------------------------------------

  const gl = createGL(canvas);
  if (!gl) {
    section.classList.add('is-fallback');
    // The indicator above is already live, so this is a partial success, not
    // a failure. Returning null would read as "nothing works here".
    return { section, setActive };
  }

  let field = createField(gl, countFor(window.innerWidth));
  let size = { w: 1, h: 1, dpr: 1 };

  // Base spine positions, held separately so the per-frame bulge can be
  // recomputed from them without accumulating drift.
  let baseX = new Float32Array(0);
  let baseY = new Float32Array(0);

  let centres = [];       // their vertical centres, device px, layout-based
  let focusY = 0;         // damped y the bulge actually tracks

  function measure() {
    size = resizeCanvas(gl, canvas);

    const need = countFor(window.innerWidth);
    if (need !== field.count) {
      field.dispose();
      field = createField(gl, need);
      field.scatter(size.w, size.h);
    }
    if (baseX.length !== field.count) {
      baseX = new Float32Array(field.count);
      baseY = new Float32Array(field.count);
    }

    // offsetTop is relative to the nearest positioned ancestor. .jn sits
    // inside <li> inside the positioned rail, so the rail's own offset within
    // the section has to be added back. `rows` is collected once, above —
    // re-querying here would drop the listeners' element identity.
    centres = rows.map((el) => (rail.offsetTop + el.offsetTop + el.offsetHeight / 2) * size.dpr);

    // The spine sits just outside the rail's left edge, clamped so it can
    // never fall off-canvas on a narrow screen.
    const spineX = clamp(
      (rail.offsetLeft - 22) * size.dpr,
      10 * size.dpr,
      size.w - 10 * size.dpr,
    );

    const top = centres.length ? centres[0] : 0;
    const bot = centres.length ? centres[centres.length - 1] : size.h;

    for (let i = 0; i < field.count; i++) {
      const t = field.count > 1 ? i / (field.count - 1) : 0;
      const s = field.seed[i];
      baseX[i] = spineX + (s - 0.5) * 7 * size.dpr;
      // Extend a little past both ends so the thread runs off the top and
      // bottom rather than terminating in two visible dots.
      baseY[i] = top - 40 * size.dpr
        + t * ((bot - top) + 80 * size.dpr)
        + (((s * 13.7) % 1) - 0.5) * 9 * size.dpr;
    }

    if (active < 0 && centres.length) active = 0;
    if (centres.length) focusY = centres[clamp(active, 0, centres.length - 1)];

    if (prefersReduced()) {
      applyBulge(0);
      field.pos.set(field.tgt);
    }
  }

  /** Rewrite targets from the base spine, bulging around focusY. */
  function applyBulge(amount) {
    const sigma = 95 * size.dpr;
    const two = 2 * sigma * sigma;
    for (let i = 0; i < field.count; i++) {
      const dy = baseY[i] - focusY;
      const g = Math.exp(-(dy * dy) / two);
      field.tgt[i * 2] = baseX[i] + g * amount * (0.35 + field.seed[i]);
      field.tgt[i * 2 + 1] = baseY[i];
    }
  }

  measure();
  field.scatter(size.w, size.h);

  const control = gate(section, {
    threshold: 0,

    onResize() {
      measure();
    },

    onFrame(t, dt) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Scroll is the WEAKEST signal: it only drives the active milestone
      // when nothing is pinned and nothing is hovered. Without the `pinned`
      // term this branch ran every frame and silently undid every click.
      if (pinned < 0 && hovering < 0 && centres.length) {
        const secTop = section.getBoundingClientRect().top;
        const mid = (window.innerHeight / 2 - secTop) * size.dpr;
        let best = 0;
        let bestD = Infinity;
        for (let i = 0; i < centres.length; i++) {
          const d = Math.abs(centres[i] - mid);
          if (d < bestD) { bestD = d; best = i; }
        }
        setActive(best);
      }

      if (centres.length) {
        focusY = damp(focusY, centres[active] ?? focusY, 5.5, dt);
      }

      applyBulge(58 * size.dpr);
      field.update(dt, 1.5, t, 1.4 * size.dpr);

      // Fade with the section's travel so the thread never butts hard against
      // the neighbouring scenes.
      const r = section.getBoundingClientRect();
      const room = r.height + window.innerHeight;
      const sp = clamp((window.innerHeight - r.top) / room);

      field.draw({
        w: size.w,
        h: size.h,
        alpha: Math.sin(clamp(sp) * Math.PI) ** 0.5 * 0.62,
        size: 1.7 * size.dpr,
        color: COLD,
        color2: HOT,
        offset: [0, 0],
        depth: 0,
      });
    },
  });

  return { control, measure, section };
}
