// Scene 1 — the cinematic opening.
//
//   0.00  black
//   0.25  the field surfaces out of the dark as scattered noise
//   1.10  it begins to condense toward the letterforms
//   3.10  the name is legible in particles
//   3.35  the real DOM text surfaces over it, crisp and selectable
//   4.30  settled — ambient drift and pointer parallax take over
//
// The beats deliberately OVERLAP: the text arrives while the field is still
// tightening. That overlap is what separates a title sequence from a queue of
// fades.
//
// The particles form the wordmark's silhouette; they do not replace it. The
// <h1> stays real text throughout, so the page is selectable, translatable and
// screen-reader complete — the canvas is atmosphere behind it.

import { createGL, resizeCanvas } from '../gl/renderer.js';
import { createField, sampleHeading } from '../gl/particles.js';
import { gate, prefersReduced } from '../lib/scene.js';
import { span, smoothstep, damp, clamp } from '../lib/ease.js';

const T = {
  fade: 0.25,
  condense: 1.10,
  formed: 3.10,
  type: 3.35,
  settled: 4.30,
};

// Matches --accent / --accent-hot in app.css. Kept as literals because a
// shader wants floats, not a CSS string; if the tokens change, change these.
const COLD = new Float32Array([0.20, 0.62, 0.72]);
const HOT = new Float32Array([0.48, 0.91, 0.95]);

/** Particle count scaled to the viewport — a phone neither needs nor affords the full field. */
function countFor(w) {
  if (w < 620) return 1200;
  if (w < 1100) return 2400;
  return 3600;
}

export async function initHero() {
  const section = document.getElementById('top');
  const canvas = document.getElementById('heroStage');
  const h1 = section?.querySelector('.hero__name');
  if (!section || !canvas || !h1) return null;

  const gl = createGL(canvas);
  if (!gl) {
    // No WebGL: the hero copy is already visible by default, so there is
    // nothing to reveal and nothing to clean up.
    section.classList.add('is-fallback');
    return null;
  }

  // Tell CSS the canvas is live. Only now does the hero copy start hidden —
  // if this class is never added (no JS, no WebGL), the text simply shows.
  section.classList.add('is-gl');

  // Metrics are wrong until the webfont is the font actually in use, and a
  // wrong sample bakes the fallback face's letterforms into the field.
  try { await document.fonts.ready; } catch { /* no Font Loading API; carry on */ }

  let field = createField(gl, countFor(window.innerWidth));
  let size = { w: 1, h: 1, dpr: 1 };

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let typed = false;

  /**
   * Re-derive the particle targets from where the <h1> is actually painted.
   * Called on boot and on every resize, so the field tracks the fluid
   * clamp()-driven type size rather than assuming a layout.
   */
  function retarget() {
    size = resizeCanvas(gl, canvas);

    const need = countFor(window.innerWidth);
    if (need !== field.count) {
      field.dispose();
      field = createField(gl, need);
      field.scatter(size.w, size.h);
    }

    // Measurement lives in particles.js, shared with the finale — both
    // condense into a wordmark, and one copy means one place to correct it.
    field.tgt.set(sampleHeading(
      section, h1.querySelectorAll('.hero__line'), canvas, field.count, size.dpr,
    ));
  }

  retarget();
  field.scatter(size.w, size.h);

  if (!prefersReduced() && !matchMedia('(pointer: coarse)').matches) {
    section.addEventListener('pointermove', (e) => {
      const r = section.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    }, { passive: true });
    section.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });
  }

  const showText = () => {
    if (typed) return;
    typed = true;
    section.classList.add('is-typed');
  };

  const control = gate(section, {
    threshold: 0,

    onResize() {
      retarget();
      // Reduced motion renders exactly ONE frame, and update() only damps
      // toward the targets — a single step from a scattered start would leave
      // the field as noise. Snap it onto the letterforms so the one frame
      // drawn is the settled composition.
      if (prefersReduced()) field.pos.set(field.tgt);
    },

    onFrame(t, dt) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // pull ramps 0 -> 1 across the condense beat; before it the field drifts
      // almost freely, which is what makes the gathering feel like a decision
      // rather than a transition.
      const pull = smoothstep(0, 1, span(t, T.condense, T.formed));
      const settled = t >= T.settled;

      // Once settled the targets themselves wander slightly, so the name
      // breathes instead of freezing into a static image.
      const drift = settled ? 1.6 * size.dpr : 0;

      field.update(dt, 0.25 + pull * 1.75, t, drift);

      if (t >= T.type) showText();

      pointer.x = damp(pointer.x, pointer.tx, 3.0, dt);
      pointer.y = damp(pointer.y, pointer.ty, 3.0, dt);

      // Parallax only wakes up after the composition settles; moving during
      // the reveal fights the choreography.
      const par = clamp((t - T.settled + 0.8) / 1.2);
      const px = pointer.x * 16 * size.dpr * par;
      const py = pointer.y * 10 * size.dpr * par;

      // The field dims as the crisp text takes over — it is the name's
      // afterglow by the end, not a competing copy of it.
      const rise = span(t, T.fade, T.fade + 1.1);
      const handover = 1 - 0.45 * smoothstep(0, 1, span(t, T.type, T.settled));

      field.draw({
        w: size.w,
        h: size.h,
        alpha: rise * handover,
        size: (1.7 + (1 - pull) * 1.1) * size.dpr,
        color: COLD,
        color2: HOT,
        offset: [px, py],
        depth: 1,
      });
    },
  });

  // Reduced motion: gate() renders exactly one settled frame and never starts
  // a loop, so the text must be revealed here rather than by a beat.
  if (prefersReduced()) showText();

  return { control, retarget, section };
}
