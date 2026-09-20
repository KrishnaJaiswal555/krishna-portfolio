// The lifecycle contract every animated scene follows.
//
// A scene runs ONLY while it is on screen and the tab is visible. Off-screen
// animation is the main way a page like this wastes a laptop battery, so the
// gating is built into the contract rather than left to each scene.
//
// Usage:
//   const s = gate(sectionEl, { onFrame(t, dt) {…}, onResize(w, h) {…} });
// Returns { start, stop, destroy } — but start/stop are driven automatically.

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export function gate(section, { onFrame, onResize, threshold = 0.15 } = {}) {
  let running = false;
  let raf = 0;
  let last = 0;
  let started = 0;
  let visible = false;

  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    onFrame?.((now - started) / 1000, dt);
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running || !onFrame) return;
    running = true;
    last = performance.now();
    if (!started) started = last;
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  // Reduced motion: render one settled frame and never start a loop at all.
  if (reduced.matches) {
    onResize?.(section.clientWidth, section.clientHeight);
    onFrame?.(9999, 0.016);
    return { start() {}, stop() {}, destroy() {} };
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      visible = e.isIntersecting;
      if (visible) start(); else stop();
    }
  }, { threshold });
  io.observe(section);

  const onVis = () => {
    if (document.visibilityState === 'hidden') stop();
    else if (visible) start();
  };
  document.addEventListener('visibilitychange', onVis);

  let resizeId;
  const onWinResize = () => {
    clearTimeout(resizeId);
    resizeId = setTimeout(() => onResize?.(section.clientWidth, section.clientHeight), 140);
  };
  window.addEventListener('resize', onWinResize);
  onResize?.(section.clientWidth, section.clientHeight);

  return {
    start,
    stop,
    destroy() {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onWinResize);
    },
  };
}

export const prefersReduced = () => reduced.matches;
