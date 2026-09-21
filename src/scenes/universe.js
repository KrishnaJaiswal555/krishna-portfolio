// Scene 4 — the Project Universe.
//
// The particle field's fourth and last configuration: a CONSTELLATION strung
// between the project cards. Hero was a name assembling, About was structured
// data, Journey was a thread being followed; this is a network — which is
// also the honest shape of the work, since the projects share techniques
// rather than sitting in a list.
//
// Two things this scene does differently from the others:
//
// 1. WebGL is OPTIONAL here, not merely degradable. The deck choreography —
//    entrance, depth parallax, hover lift — is pure DOM, and it runs whether
//    or not a context exists. Only the constellation needs the canvas. Tying
//    the card motion to WebGL would have thrown away working behaviour for an
//    unrelated reason.
//
// 2. The cards arrive as ONE event, not a queue. Every card reads the same
//    `mat` scalar; what varies per card is how far it TRAVELS, never when it
//    starts. A per-card time stagger reads as a list loading. Varying the
//    journey instead reads as choreography.
//
// This module owns the card `transform` outright. CSS must not transition or
// set it, or the two fight every frame and the last writer wins at random.

import { createGL, resizeCanvas } from '../gl/renderer.js';
import { createField } from '../gl/particles.js';
import { gate, prefersReduced } from '../lib/scene.js';
import { damp, clamp, smoothstep } from '../lib/ease.js';

const COLD = new Float32Array([0.12, 0.38, 0.48]);
const HOT = new Float32Array([0.47, 0.90, 0.96]);

const T = {
  rise: 0.20,   // the deck begins to surface
  formed: 1.85, // every card is home
  live: 2.20,   // pointer parallax and hover take over
};

function countFor(w) {
  if (w < 620) return 420;
  if (w < 1100) return 820;
  return 1200;
}

export async function initUniverse() {
  const section = document.getElementById('work');
  const deck = document.getElementById('universeDeck');
  const canvas = document.getElementById('universeStage');
  if (!section || !deck) return null;

  const cards = [...deck.querySelectorAll('.pc')];
  if (!cards.length) return null;

  const gl = canvas ? createGL(canvas) : null;
  if (!gl) section.classList.add('is-fallback');

  let field = gl ? createField(gl, countFor(window.innerWidth)) : null;
  let size = { w: 1, h: 1, dpr: 1 };

  // Only now may CSS hide the cards: this class is the promise that something
  // is going to bring them back. No JS and they simply stay visible.
  section.classList.add('is-deck-ready');

  let depths = [];        // 0 at the deck's centre column, 1 at its edges
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, inside: false };
  let hover = -1;

  /**
   * Measure card geometry and rebuild the constellation.
   *
   * offsetLeft/offsetTop again, not getBoundingClientRect: this module writes
   * a transform to every card every frame, and a transform moves the rect
   * while leaving layout untouched. Measuring the rect here would feed the
   * scene its own output.
   */
  function measure() {
    if (gl) size = resizeCanvas(gl, canvas);

    const halfW = (deck.offsetWidth || 1) / 2;
    depths = cards.map((el) => {
      const cx = el.offsetLeft + el.offsetWidth / 2;
      return clamp(Math.abs(cx - halfW) / halfW);
    });

    if (!gl || !field) return;

    const need = countFor(window.innerWidth);
    if (need !== field.count) {
      field.dispose();
      field = createField(gl, need);
      field.scatter(size.w, size.h);
    }

    // Card centres in section coordinates, device px. The deck is positioned,
    // so a card's offset is relative to it; the deck's own offset within the
    // section has to be added back.
    const pts = cards.map((el) => [
      (deck.offsetLeft + el.offsetLeft + el.offsetWidth / 2) * size.dpr,
      (deck.offsetTop + el.offsetTop + el.offsetHeight / 2) * size.dpr,
    ]);

    // Edges: each card to the next, plus each to the one after that. The
    // second pass is what turns a zig-zag path into something that reads as a
    // network. With fewer than three cards it contributes nothing and is
    // simply skipped.
    const edges = [];
    for (let i = 0; i < pts.length - 1; i++) edges.push([pts[i], pts[i + 1]]);
    for (let i = 0; i < pts.length - 2; i++) edges.push([pts[i], pts[i + 2]]);
    if (!edges.length) edges.push([pts[0], pts[0]]);

    // Walk the edges by cumulative length so particles spread evenly over the
    // whole web rather than bunching on the short links.
    const lens = edges.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]) || 1);
    const total = lens.reduce((s, v) => s + v, 0);

    let e = 0;
    let acc = lens[0];
    for (let i = 0; i < field.count; i++) {
      const want = (i / field.count) * total;
      while (want > acc && e < edges.length - 1) { e++; acc += lens[e]; }
      const [a, b] = edges[e];
      const u = clamp((want - (acc - lens[e])) / lens[e]);
      const s = field.seed[i];
      field.tgt[i * 2] = a[0] + (b[0] - a[0]) * u + (s - 0.5) * 16 * size.dpr;
      field.tgt[i * 2 + 1] = a[1] + (b[1] - a[1]) * u
        + (((s * 9.1) % 1) - 0.5) * 16 * size.dpr;
    }

    if (prefersReduced()) field.pos.set(field.tgt);
  }

  measure();
  if (field) field.scatter(size.w, size.h);

  if (!prefersReduced() && !matchMedia('(pointer: coarse)').matches) {
    section.addEventListener('pointermove', (e) => {
      const r = section.getBoundingClientRect();
      ptr.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      ptr.inside = true;
    }, { passive: true });
    section.addEventListener('pointerleave', () => {
      ptr.inside = false;
      ptr.tx = 0;
      ptr.ty = 0;
    });

    deck.addEventListener('pointerover', (e) => {
      const card = e.target.closest('.pc');
      hover = card ? cards.indexOf(card) : -1;
    });
    deck.addEventListener('pointerout', (e) => {
      if (!e.relatedTarget || !e.relatedTarget.closest('.pc')) hover = -1;
    });
  }

  // Keyboard parity: the cards are real buttons, so focus must lift a card
  // exactly as hover does, or keyboard users get a deck that never responds.
  for (const [i, el] of cards.entries()) {
    el.addEventListener('focus', () => { hover = i; });
    el.addEventListener('blur', () => { if (hover === i) hover = -1; });
  }

  const control = gate(section, {
    threshold: 0.12,

    onResize() {
      measure();
    },

    onFrame(t, dt) {
      // ---- the deck (runs with or without WebGL) -------------------------
      const mat = smoothstep(0, 1, clamp((t - T.rise) / (T.formed - T.rise)));
      const live = smoothstep(0, 1, clamp((t - T.live) / 0.9));

      ptr.x = damp(ptr.x, ptr.inside ? ptr.tx : 0, 2.6, dt);
      ptr.y = damp(ptr.y, ptr.inside ? ptr.ty : 0, 2.6, dt);

      const r = section.getBoundingClientRect();
      const room = r.height + window.innerHeight;
      const sp = clamp((window.innerHeight - r.top) / room);

      // A whole-deck yaw, so the group reads as one object being looked
      // around rather than as cards sliding independently.
      deck.style.transform =
        `rotateY(${(ptr.x * 1.8 * live).toFixed(3)}deg) `
        + `rotateX(${(-ptr.y * 1.2 * live).toFixed(3)}deg) `
        + `scale(${(1 + sp * 0.02).toFixed(4)})`;

      for (let i = 0; i < cards.length; i++) {
        const el = cards[i];
        const d = depths[i] ?? 0.5;

        // One event: identical `mat` everywhere. Only the distance travelled
        // differs, and edge cards travel furthest.
        const travel = (1 - mat) * (54 + d * 86);
        const tilt = (1 - mat) * (i % 2 ? 7 : -7);

        const str = (7 + d * 24) * live;
        const hot = i === hover;
        const lift = hot ? -12 : (hover >= 0 ? 4 : 0);
        const hs = hot ? 1.022 : (hover >= 0 ? 0.986 : 1);

        el.style.transform =
          `translate3d(${(ptr.x * str).toFixed(2)}px, `
          + `${(ptr.y * str * 0.5 + travel + lift * live).toFixed(2)}px, 0) `
          + `rotateX(${((1 - mat) * -18).toFixed(2)}deg) `
          + `rotateZ(${tilt.toFixed(2)}deg) `
          + `scale(${((0.9 + mat * 0.1) * hs).toFixed(4)})`;

        el.style.opacity = Math.min(1, mat * 1.6).toFixed(3);
      }

      // ---- the constellation (canvas only) -------------------------------
      if (!gl || !field) return;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      field.update(dt, 0.3 + mat * 1.4, t, 2.6 * size.dpr);

      field.draw({
        w: size.w,
        h: size.h,
        alpha: Math.sin(clamp(sp) * Math.PI) ** 0.5 * 0.46 * mat,
        size: 1.6 * size.dpr,
        color: COLD,
        color2: HOT,
        offset: [ptr.x * 12 * size.dpr * live, ptr.y * 7 * size.dpr * live],
        depth: 1,
      });
    },
  });

  return { control, measure, section };
}
