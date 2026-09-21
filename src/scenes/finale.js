// Scene 6 — the finale.
//
// The closing shot deliberately REUSES the hero's configuration rather than
// inventing a fifth: the name assembles one last time as the page ends, so
// the film closes on the shot it opened with. The particle set is closed at
// four, and a bookend is the one place where repeating a configuration is the
// point rather than a shortcut.
//
// It differs from the hero in feel, not in mechanism. The hero condenses hard
// and settles; this gathers loosely and keeps breathing, never fully tight —
// an ending rather than an arrival.

import { createGL, resizeCanvas } from '../gl/renderer.js';
import { createField, sampleHeading } from '../gl/particles.js';
import { gate, prefersReduced } from '../lib/scene.js';
import { clamp } from '../lib/ease.js';

const COLD = new Float32Array([0.13, 0.40, 0.49]);
const HOT = new Float32Array([0.45, 0.88, 0.94]);

function countFor(w) {
  if (w < 620) return 900;
  if (w < 1100) return 1800;
  return 2600;
}

export async function initFinale() {
  const section = document.getElementById('contact');
  const canvas = document.getElementById('finStage');
  const mark = section?.querySelector('.fin__mark');
  if (!section || !canvas || !mark) return null;

  const gl = createGL(canvas);
  if (!gl) {
    section.classList.add('is-fallback');
    return null;
  }

  // Same reason as the hero: sampling before the webfont is in use bakes the
  // fallback face's letterforms into the field.
  try { await document.fonts.ready; } catch { /* no Font Loading API */ }

  let field = createField(gl, countFor(window.innerWidth));
  let size = { w: 1, h: 1, dpr: 1 };

  function retarget() {
    size = resizeCanvas(gl, canvas);

    const need = countFor(window.innerWidth);
    if (need !== field.count) {
      field.dispose();
      field = createField(gl, need);
      field.scatter(size.w, size.h);
    }

    field.tgt.set(sampleHeading(
      section, mark.querySelectorAll('.fin__markLine'), canvas, field.count, size.dpr,
    ));

    if (prefersReduced()) field.pos.set(field.tgt);
  }

  retarget();
  field.scatter(size.w, size.h);

  const control = gate(section, {
    threshold: 0,

    onResize() {
      retarget();
    },

    onFrame(t, dt) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Scroll progress of the footer through the viewport. The gather is
      // driven by SCROLL, not a clock: the visitor arrives here at the end of
      // a long page, and tying the closing shot to their descent makes the
      // ending feel earned rather than triggered.
      const r = section.getBoundingClientRect();
      const room = r.height + window.innerHeight;
      const sp = clamp((window.innerHeight - r.top) / room);

      // Never reaches the hero's tightness, and the drift never stops, so the
      // name stays a little unresolved. That is the intended reading.
      const pull = 0.25 + sp * 1.15;
      field.update(dt, pull, t, 3.4 * size.dpr);

      field.draw({
        w: size.w,
        h: size.h,
        alpha: clamp(sp * 1.5) * 0.6,
        size: 1.7 * size.dpr,
        color: COLD,
        color2: HOT,
        offset: [0, 0],
        depth: 0,
      });
    },
  });

  return { control, retarget, section };
}
