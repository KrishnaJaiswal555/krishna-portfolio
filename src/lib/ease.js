// Easing and damping. Kept deliberately tiny — this is the whole reason the
// project needs no animation library.

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

/** Normalised progress of `t` across [a, b], clamped to 0..1. */
export const span = (t, a, b) => clamp((t - a) / (b - a));

export const lerp = (a, b, p) => a + (b - a) * p;

export const smoothstep = (a, b, t) => {
  const p = clamp((t - a) / (b - a));
  return p * p * (3 - 2 * p);
};

export const easeOutCubic = (p) => 1 - (1 - p) ** 3;
export const easeOutExpo = (p) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p));
export const easeOutQuint = (p) => 1 - (1 - p) ** 5;

/**
 * Frame-rate independent approach toward a target.
 * Uses exp() rather than a fixed per-frame fraction so the result is identical
 * at 60Hz and 144Hz — a plain `v += (to - v) * 0.1` moves ~2.4x faster on a
 * high-refresh display, which is why pointer damping feels wrong there.
 */
export const damp = (v, to, k, dt) => v + (to - v) * (1 - Math.exp(-k * dt));
