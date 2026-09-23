// Scroll parallax for the site backdrop.
//
// WHY THIS EXISTS
//
// `body::before` (app.css) is `position: fixed`, which pins it to the viewport.
// On a desktop browser that makes it EXACTLY static while the page scrolls.
// There was never a parallax system here that was disabled or ineffective on
// desktop — there was no system at all, and "fixed" was doing precisely what
// it says.
//
// Mobile Safari appeared to already have the motion. It does not have it
// either: what moves there is the VIEWPORT. iOS collapses and expands the URL
// bar during a scroll, which changes the visual viewport height, and a
// `position: fixed; inset: 0` layer painted with `background-size: cover` is
// re-laid-out and re-centred as that happens. The artwork visibly shifts. That
// is a browser artifact, it is unavailable on desktop, and it cannot be
// "turned on" — so the only way to give desktop the same feel is to drive the
// motion ourselves.
//
// Which is also why coarse pointers get a SMALLER budget than desktop here:
// the viewport artifact is still happening on those devices, and the two
// compose. Matching desktop's amplitude on a phone would overshoot what is
// already working.
//
// The offset is published as a CSS custom property because the target is a
// pseudo-element — JS cannot set inline styles on `::before`, but custom
// properties set on <html> inherit into it.

import { clamp, damp } from './ease.js';
import { prefersReduced } from './scene.js';

// Fraction of viewport height the backdrop travels across the ENTIRE page.
//
// THESE ARE SPENT OVER THE WHOLE DOCUMENT, NOT PER SCREEN, and that is the
// trap. The budget is denominated in viewport height but paid out across the
// full scroll range, so what a visitor actually perceives is
//
//     movement per screenful  =  TRAVEL * vh * (vh / scrollRange)
//
// On this page — ~900px viewport, ~7100px of scroll — the original 0.10
// produced 90px of total excursion and about ELEVEN PIXELS per screenful,
// which is invisible on a dark photograph under a 38-52% wash. The effect
// shipped working and imperceptible, and it gets weaker as the page grows.
//
// For reference, the iOS artifact this is meant to match moves roughly 80px
// over a ~200px scroll: about thirty times the per-pixel rate.
//
// So these are sized from the RATE, not the total. 0.40 gives ~45px per
// screenful here — visible as depth, still not distracting. Both values stay
// inside the 24vh of vertical slack app.css reserves; raise that first if
// these ever go up, and backdrop-motion.mjs asserts the relationship.
const TRAVEL_FINE = 0.40;   // mouse / desktop
const TRAVEL_COARSE = 0.12; // touch — the iOS viewport artifact adds its own

export function initBackdrop() {
  const root = document.documentElement;

  // Reduced motion: start nothing and write nothing. `--bg-y` then falls back
  // to the 0px default declared in CSS, so the backdrop sits exactly where it
  // always did. Landing on the settled state is the accommodation.
  if (prefersReduced()) return null;

  const coarse = matchMedia('(pointer: coarse)');

  let y = 0;            // current offset, damped
  let target = 0;
  let raf = 0;
  let running = false;
  let last = 0;
  let settledFrames = 0;

  // Cached, because `scrollHeight` forces a layout calculation. Reading it on
  // every frame of a scroll is exactly the forced synchronous reflow this has
  // to avoid; it only changes on resize, so it is measured on resize.
  let max = 1;
  let travel = 0;

  function measure() {
    const vh = window.innerHeight || 1;
    max = Math.max(1, root.scrollHeight - vh);
    travel = vh * (coarse.matches ? TRAVEL_COARSE : TRAVEL_FINE);
  }

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;

    // `scrollY` is a cheap read and nothing above it in this frame has written
    // to the DOM, so it cannot trigger a reflow here.
    const p = clamp(window.scrollY / max);
    // Negative as the page descends: the backdrop drifts the same way as the
    // content but far slower, which is what reads as "behind".
    target = -(p - 0.5) * travel;

    // Damped rather than assigned, so the motion is continuous and eased
    // instead of stepping 1:1 with the scroll position. `damp` is frame-rate
    // independent, so this feels identical at 60Hz and 144Hz.
    y = damp(y, target, 6.5, dt);
    root.style.setProperty('--bg-y', `${y.toFixed(2)}px`);

    // Stop once the value has settled. A permanently running rAF on a page
    // that is not moving is the main way an effect like this costs battery for
    // nothing; the scroll listener starts it again. The few frames of grace
    // stop it from stopping and starting continuously during a slow drag.
    if (Math.abs(target - y) < 0.05) {
      if (++settledFrames > 6) { stop(); return; }
    } else {
      settledFrames = 0;
    }

    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running) return;
    running = true;
    settledFrames = 0;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  window.addEventListener('scroll', start, { passive: true });

  let resizeId;
  window.addEventListener('resize', () => {
    clearTimeout(resizeId);
    resizeId = setTimeout(() => { measure(); start(); }, 140);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stop();
    else start();
  });

  // A tablet that gains a mouse should get the desktop budget.
  coarse.addEventListener?.('change', () => { measure(); start(); });

  measure();
  // One run now, so a page restored mid-scroll lands on the right offset
  // rather than snapping once the visitor first moves.
  start();

  return { stop, measure };
}
