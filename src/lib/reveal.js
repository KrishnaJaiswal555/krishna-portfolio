// Scroll-triggered reveals.
//
// One observer pattern shared by every text-bearing section (About, Journey,
// Skills, Contact), so each scene does not grow its own copy. Elements opt in
// with `data-reveal`; CSS owns what the reveal looks like, this owns when.
//
// Deliberately ONE-SHOT: an element is unobserved the moment it arrives.
// Re-animating on every scroll-by reads as restlessness, and it makes text
// unreadable for anyone who scrolls back to re-read something.

import { prefersReduced } from './scene.js';

export function reveal(root = document, selector = '[data-reveal]') {
  const items = [...root.querySelectorAll(selector)];
  if (!items.length) return null;

  // Stagger index, so CSS can delay siblings without hardcoding a count.
  items.forEach((el, i) => {
    if (!el.style.getPropertyValue('--ri')) el.style.setProperty('--ri', String(i));
  });

  // Reduced motion: everything is already in place. Landing on the finished
  // state is the accommodation — a faster animation is not.
  if (prefersReduced()) {
    for (const el of items) el.classList.add('is-in');
    return null;
  }

  // No observer, no reveal — show everything rather than leaving the copy
  // hidden behind a mechanism that is never going to run.
  if (!('IntersectionObserver' in window)) {
    for (const el of items) el.classList.add('is-in');
    return null;
  }

  // Only NOW may CSS hide these elements. They are visible by default, and
  // this class is the signal that something is actually going to reveal them.
  // No JS, a module that throws, or a browser without IntersectionObserver
  // all leave the text on screen — the failure mode is the readable one.
  document.documentElement.classList.add('is-reveal-ready');

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, {
    threshold: 0.15,
    // Fire slightly before the element reaches the bottom edge, so it is
    // already settling by the time it is comfortably in view.
    rootMargin: '0px 0px -8% 0px',
  });

  for (const el of items) io.observe(el);
  return { disconnect: () => io.disconnect() };
}
