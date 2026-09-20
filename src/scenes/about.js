// Scene 2 — About.
//
// The same particle field as the hero, in its second configuration: a jittered
// LATTICE rather than a wordmark. That was the promise the architecture made —
// one system, several force targets — and it is also why this section does not
// simply repeat the opening. A grid reads as structured data; the hero read as
// a name assembling. Different meaning, same twenty lines of simulation.
//
// Deliberately quieter than the hero. After a title sequence, stillness is the
// contrast that makes the title sequence land; a second spectacle here would
// flatten both. Low count, low alpha, slow drift, and the whole field eases
// with scroll rather than animating on a clock.

import { createGL, resizeCanvas } from '../gl/renderer.js';
import { createField } from '../gl/particles.js';
import { gate, prefersReduced } from '../lib/scene.js';
import { damp, clamp } from '../lib/ease.js';

// Dimmer than the hero's ramp — this field sits behind body copy and must
// never compete with it for contrast.
const COLD = new Float32Array([0.13, 0.38, 0.45]);
const HOT = new Float32Array([0.28, 0.66, 0.74]);

/** Far fewer than the hero: this is texture, not the subject. */
function countFor(w) {
  if (w < 620) return 360;
  if (w < 1100) return 700;
  return 1050;
}

export async function initAbout() {
  const section = document.getElementById('about');
  const canvas = document.getElementById('aboutStage');
  if (!section || !canvas) return null;

  const gl = createGL(canvas);
  if (!gl) {
    // The copy is always visible in this section, so there is nothing to
    // reveal and nothing to undo.
    section.classList.add('is-fallback');
    return null;
  }

  let field = createField(gl, countFor(window.innerWidth));
  let size = { w: 1, h: 1, dpr: 1 };

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  /**
   * Lay the targets out as a jittered grid.
   * A perfect grid reads as a printed texture; jitter within each cell keeps
   * the structure legible while letting the field breathe. Columns are solved
   * from the aspect ratio so cells stay roughly square at any viewport.
   */
  function lattice() {
    size = resizeCanvas(gl, canvas);

    const need = countFor(window.innerWidth);
    if (need !== field.count) {
      field.dispose();
      field = createField(gl, need);
      field.scatter(size.w, size.h);
    }

    const aspect = size.w / Math.max(1, size.h);
    const cols = Math.max(2, Math.round(Math.sqrt(field.count * aspect)));
    const rows = Math.max(2, Math.ceil(field.count / cols));
    const cw = size.w / cols;
    const ch = size.h / rows;

    for (let i = 0; i < field.count; i++) {
      const cx = (i % cols) + 0.5;
      const cy = Math.floor(i / cols) + 0.5;
      // Seeded off the particle's own seed so the jitter is stable across
      // resizes — re-randomising every resize makes the field visibly twitch.
      const s = field.seed[i];
      field.tgt[i * 2] = (cx + (s - 0.5) * 0.7) * cw;
      field.tgt[i * 2 + 1] = (cy + ((s * 7.3) % 1 - 0.5) * 0.7) * ch;
    }

    if (prefersReduced()) field.pos.set(field.tgt);
  }

  lattice();
  field.scatter(size.w, size.h);

  if (!prefersReduced() && !matchMedia('(pointer: coarse)').matches) {
    section.addEventListener('pointermove', (e) => {
      const r = section.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    }, { passive: true });
    section.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });
  }

  const control = gate(section, {
    threshold: 0,

    onResize() {
      lattice();
    },

    onFrame(t, dt) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Scroll progress of the section through the viewport, 0..1.
      const r = section.getBoundingClientRect();
      const room = r.height + window.innerHeight;
      const sp = clamp((window.innerHeight - r.top) / room);

      // The lattice is always assembling — it never "arrives" the way the
      // hero does, because this section is a state, not an event.
      field.update(dt, 1.4, t, 2.2 * size.dpr);

      pointer.x = damp(pointer.x, pointer.tx, 2.4, dt);
      pointer.y = damp(pointer.y, pointer.ty, 2.4, dt);

      // Fade in across the section's entrance and back out as it leaves, so
      // the grid never abuts the neighbouring scenes with a hard edge.
      const alpha = Math.sin(clamp(sp) * Math.PI) ** 0.6;

      field.draw({
        w: size.w,
        h: size.h,
        alpha: alpha * 0.5,
        size: 1.5 * size.dpr,
        color: COLD,
        color2: HOT,
        // Vertical drift with scroll gives depth without a parallax library;
        // the pointer adds a little lateral sway on top.
        offset: [
          pointer.x * 10 * size.dpr,
          (sp - 0.5) * -34 * size.dpr + pointer.y * 6 * size.dpr,
        ],
        depth: 1,
      });
    },
  });

  return { control, lattice, section };
}
