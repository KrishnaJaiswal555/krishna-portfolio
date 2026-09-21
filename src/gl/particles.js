// The particle field — this site's recurring visual subject, standing in for
// the human figure a conventional cinematic portfolio would use.
//
// One field, reused by every scene with different targets: the hero condenses
// it into the wordmark, later scenes will trail it along the journey rail and
// lattice it between project cards.
//
// Simulation runs on the CPU and the position buffer is re-uploaded each
// frame. At the counts this site uses (1,200–3,600) that is a few tens of
// microseconds and keeps the whole thing readable.
// ponytail: CPU update + bufferSubData per frame. Move to transform feedback
// only if a scene ever needs more than ~20k particles.

import { program } from './renderer.js';

const VERT = `#version 300 es
in vec2 aPos;
in float aSeed;

uniform vec2  uRes;      // drawing-buffer size, px
uniform vec2  uOffset;   // pointer parallax, px
uniform float uSize;     // base point size, px
uniform float uDepth;    // how much parallax varies by seed

out float vSeed;

void main() {
  // Nearer particles (high seed) move further with the pointer, which is what
  // reads as depth rather than as the whole field sliding.
  vec2 p = aPos + uOffset * mix(0.35, 1.0, aSeed) * uDepth;

  vec2 clip = (p / uRes) * 2.0 - 1.0;
  clip.y = -clip.y;                       // canvas y is down, clip y is up

  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = uSize * mix(0.55, 1.45, aSeed);
  vSeed = aSeed;
}`;

const FRAG = `#version 300 es
precision mediump float;

in float vSeed;

uniform float uAlpha;
uniform vec3  uColor;
uniform vec3  uColor2;

out vec4 frag;

void main() {
  // Round the square point into a soft dot. discard beyond the radius so the
  // quad corners never show as a grid of boxes.
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  if (r > 0.5) discard;

  float a = smoothstep(0.5, 0.05, r) * uAlpha * mix(0.4, 1.0, vSeed);
  vec3 c = mix(uColor, uColor2, vSeed);

  // Premultiplied: the context blends with ONE, ONE_MINUS_SRC_ALPHA.
  frag = vec4(c * a, a);
}`;

export function createField(gl, count) {
  const prog = program(gl, VERT, FRAG, 'particles');

  // Two parallel arrays rather than one interleaved buffer: positions are
  // rewritten every frame, seeds never are, so they want different usage hints.
  const pos = new Float32Array(count * 2);   // current, px
  const tgt = new Float32Array(count * 2);   // where it is heading, px
  const seed = new Float32Array(count);

  for (let i = 0; i < count; i++) seed[i] = Math.random();

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const seedBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
  gl.bufferData(gl.ARRAY_BUFFER, seed, gl.STATIC_DRAW);
  const seedLoc = gl.getAttribLocation(prog.p, 'aSeed');
  gl.enableVertexAttribArray(seedLoc);
  gl.vertexAttribPointer(seedLoc, 1, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);

  return {
    count,
    pos,
    tgt,
    seed,

    /** Scatter every particle across the buffer — the pre-condense state. */
    scatter(w, h) {
      for (let i = 0; i < count; i++) {
        pos[i * 2] = Math.random() * w;
        pos[i * 2 + 1] = Math.random() * h;
      }
    },

    /**
     * Step the simulation.
     * @param dt     seconds since last frame
     * @param pull   0..1 — how strongly particles seek their target
     * @param time   seconds, for the ambient drift
     * @param drift  px amplitude of the idle wander once settled
     */
    update(dt, pull, time, drift = 0) {
      for (let i = 0; i < count; i++) {
        const s = seed[i];
        const ix = i * 2;
        const iy = ix + 1;

        // Per-particle stiffness: identical k makes the whole field arrive on
        // the same frame, which reads as a single object snapping into place.
        const k = (1.1 + s * 3.4) * pull;

        let tx = tgt[ix];
        let ty = tgt[iy];

        if (drift > 0) {
          // Incommensurate frequencies so the wander never visibly repeats.
          const ph = s * 6.283;
          tx += Math.sin(time * 0.37 + ph) * drift * (0.5 + s);
          ty += Math.cos(time * 0.29 + ph * 1.7) * drift * (0.5 + s);
        }

        pos[ix] += (tx - pos[ix]) * (1 - Math.exp(-k * dt));
        pos[iy] += (ty - pos[iy]) * (1 - Math.exp(-k * dt));
      }
    },

    draw({ w, h, alpha, size, color, color2, offset = [0, 0], depth = 1 }) {
      if (alpha <= 0.001) return;

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);

      gl.useProgram(prog.p);
      gl.bindVertexArray(vao);

      gl.uniform2f(prog.u.uRes, w, h);
      gl.uniform2f(prog.u.uOffset, offset[0], offset[1]);
      gl.uniform1f(prog.u.uSize, size);
      gl.uniform1f(prog.u.uDepth, depth);
      gl.uniform1f(prog.u.uAlpha, alpha);
      gl.uniform3fv(prog.u.uColor, color);
      gl.uniform3fv(prog.u.uColor2, color2);

      gl.drawArrays(gl.POINTS, 0, count);
      gl.bindVertexArray(null);
    },

    dispose() {
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(seedBuf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog.p);
    },
  };
}

/**
 * Measure a heading as it is actually painted, and sample its ink.
 *
 * Shared by the hero and the finale, which both condense particles into a
 * wordmark. The measurement is fiddly — computed font, element rects relative
 * to the section, and the baseline offset fillText expects — and getting it
 * subtly wrong shifts the whole field off the letterforms. One copy means one
 * place to correct it.
 *
 * @param section   the positioned ancestor both canvas and heading sit in
 * @param lineEls   the per-line elements of the heading, in order
 */
export function sampleHeading(section, lineEls, canvas, count, dpr) {
  const secRect = section.getBoundingClientRect();
  const lines = [...lineEls].map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      text: el.textContent.trim(),
      font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
      x: r.left - secRect.left,
      // fillText draws from the alphabetic baseline; the element's box top
      // plus its ascent is where that baseline sits.
      y: r.top - secRect.top + parseFloat(cs.fontSize) * 0.78,
    };
  });
  return sampleInk(lines, canvas.clientWidth, canvas.clientHeight, count, dpr);
}

/**
 * Sample the ink of rendered text into particle target positions.
 *
 * Rather than building a glyph atlas, the lines are drawn into an offscreen
 * 2D canvas at the same place and size the real <h1> occupies, and the opaque
 * pixels become targets. That keeps the particle silhouette aligned with the
 * live DOM text at any viewport size or font fallback, and re-sampling on
 * resize is just calling this again.
 *
 * @param lines [{ text, font, x, y }] — x/y are the text's left/alphabetic
 *              baseline origin in CSS px, relative to the canvas.
 * @returns Float32Array of length count*2, in device px
 */
function sampleInk(lines, w, h, count, dpr) {
  // Sample at half resolution: we need a few thousand points, not every pixel,
  // and this quarters the getImageData cost on a large hero.
  const SCALE = 0.5;
  const cw = Math.max(1, Math.round(w * SCALE));
  const ch = Math.max(1, Math.round(h * SCALE));

  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const g = c.getContext('2d', { willReadFrequently: true });

  g.scale(SCALE, SCALE);
  g.fillStyle = '#fff';
  g.textBaseline = 'alphabetic';
  for (const l of lines) {
    g.font = l.font;
    g.fillText(l.text, l.x, l.y);
  }

  const data = g.getImageData(0, 0, cw, ch).data;

  // Collect every inked pixel, then pick from it. Collecting first and
  // choosing second gives an even spread; picking while scanning biases the
  // field toward the top of the image.
  const ink = [];
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (data[(y * cw + x) * 4 + 3] > 130) ink.push(x, y);
    }
  }

  const out = new Float32Array(count * 2);
  const n = ink.length / 2;

  if (n === 0) {
    // No ink: fonts not ready, or the text is not laid out yet. Spread the
    // field across the canvas rather than collapsing it to the origin.
    for (let i = 0; i < count; i++) {
      out[i * 2] = Math.random() * w * dpr;
      out[i * 2 + 1] = Math.random() * h * dpr;
    }
    return out;
  }

  for (let i = 0; i < count; i++) {
    const j = Math.floor(Math.random() * n) * 2;
    // Jitter within the sampled cell so repeated picks of the same pixel do
    // not stack particles into a hard dot.
    const jx = (Math.random() - 0.5) / SCALE;
    const jy = (Math.random() - 0.5) / SCALE;
    out[i * 2] = (ink[j] / SCALE + jx) * dpr;
    out[i * 2 + 1] = (ink[j + 1] / SCALE + jy) * dpr;
  }
  return out;
}
