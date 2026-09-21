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

  const gl = createGL(canvas);
  if (!gl) {
    // The rail is plain readable content; nothing needs undoing.
    section.classList.add('is-fallback');
    return null;
  }

  let field = createField(gl, countFor(window.innerWidth));
  let size = { w: 1, h: 1, dpr: 1 };

  // Base spine positions, held separately so the per-frame bulge can be
  // recomputed from them without accumulating drift.
  let baseX = new Float32Array(0);
  let baseY = new Float32Array(0);

  let rows = [];          // the .jn elements, in document order
  let centres = [];       // their vertical centres, device px, layout-based
  let active = -1;
  let hovering = -1;
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

    rows = [...rail.querySelectorAll('.jn')];
    // offsetTop is relative to the nearest positioned ancestor. .jn sits
    // inside <li> inside the positioned rail, so the rail's own offset within
    // the section has to be added back.
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

  function setActive(i) {
    if (i === active || i < 0 || i >= rows.length) return;
    rows[active]?.classList.remove('is-active');
    active = i;
    rows[active]?.classList.add('is-active');
  }

  measure();
  field.scatter(size.w, size.h);
  rows[active]?.classList.add('is-active');

  if (!prefersReduced() && !matchMedia('(pointer: coarse)').matches) {
    rail.addEventListener('pointerover', (e) => {
      const row = e.target.closest('.jn');
      if (!row) return;
      hovering = rows.indexOf(row);
      if (hovering >= 0) setActive(hovering);
    });
    rail.addEventListener('pointerleave', () => { hovering = -1; });
  }

  const control = gate(section, {
    threshold: 0,

    onResize() {
      measure();
    },

    onFrame(t, dt) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // With no pointer on the rail, the milestone nearest the middle of the
      // viewport takes over — so scrolling alone walks the thread.
      if (hovering < 0 && centres.length) {
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
