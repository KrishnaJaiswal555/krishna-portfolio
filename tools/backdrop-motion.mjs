// Headless behavioural test of the backdrop scroll parallax.
//
//     node tools/backdrop-motion.mjs
//
// This is NOT a browser test and does not substitute for one. It cannot tell
// you whether the artwork looks right. What it CAN do is execute the real
// initBackdrop() against a DOM stub and drive the actual scroll path, so the
// central claim — "scrolling on desktop moves the backdrop" — is demonstrated
// rather than asserted.
//
// It earns its place because the bug it guards is invisible by construction.
// The backdrop was static on desktop and nothing failed: no error, no warning,
// no broken layout. A `position: fixed` layer with no transform is doing
// exactly what it was told. Only measuring the offset across two scroll
// positions can distinguish "parallax working" from "parallax absent", and
// that distinction is precisely what was wrong before.
//
// requestAnimationFrame is replaced with a manual queue and performance.now()
// with a fake clock, so frames are pumped deterministically instead of raced
// against real time.

let failures = 0;
const check = (label, cond, detail = '') => {
  if (cond) console.log(`  ok    ${label}`);
  else { failures++; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`); }
};

// --- controllable environment ---------------------------------------------

const VH = 900;
const DOC = 8000;
const MAX = DOC - VH;            // 7100 — the real scrollable range

let reducedMatches = false;
let coarseMatches = false;

let clock = 0;
let queue = [];
let winHandlers = {};
let docHandlers = {};
let written = {};

globalThis.performance = { now: () => clock };
globalThis.requestAnimationFrame = (fn) => queue.push(fn);
globalThis.cancelAnimationFrame = () => { queue = []; };

// A live getter, not a snapshot: scene.js captures its MediaQueryList once at
// module scope, so the reduced-motion flag has to stay readable through it.
globalThis.matchMedia = (q) => ({
  get matches() {
    return q.includes('reduced-motion') ? reducedMatches : coarseMatches;
  },
  addEventListener() {},
});

globalThis.window = {
  innerHeight: VH,
  scrollY: 0,
  addEventListener: (t, fn) => { (winHandlers[t] ||= []).push(fn); },
};

globalThis.document = {
  visibilityState: 'visible',
  documentElement: {
    scrollHeight: DOC,
    style: { setProperty: (k, v) => { written[k] = v; } },
  },
  addEventListener: (t, fn) => { (docHandlers[t] ||= []).push(fn); },
};

/** Run up to `frames` animation frames against the fake clock. */
function pump(frames = 150, stepMs = 16.7) {
  for (let i = 0; i < frames; i++) {
    const batch = queue;
    queue = [];
    if (!batch.length) break;
    clock += stepMs;
    for (const fn of batch) fn(clock);
  }
}

const offset = () => parseFloat(written['--bg-y'] ?? 'NaN');
const fireScroll = () => (winHandlers.scroll || []).forEach((fn) => fn());

/** Fresh listener tables and a fresh queue, so tests cannot leak into each other. */
function reset() {
  queue = [];
  winHandlers = {};
  docHandlers = {};
  written = {};
  window.scrollY = 0;
}

const { initBackdrop } = await import('../src/lib/backdrop.js');

// --- 1. reduced motion ------------------------------------------------------

console.log('=== prefers-reduced-motion: no loop, no writes ===');
reset();
reducedMatches = true;
let api = initBackdrop();
check('initBackdrop() returns null', api === null, `got ${typeof api}`);
check('  no animation frame was ever requested', queue.length === 0,
  `${queue.length} queued`);
check('  --bg-y was never written', written['--bg-y'] === undefined,
  `wrote ${written['--bg-y']}`);
window.scrollY = MAX;
fireScroll();
pump();
check('  scrolling still writes nothing', written['--bg-y'] === undefined,
  'the CSS 0px fallback must be what positions the backdrop');

// --- 2. desktop actually moves ---------------------------------------------

console.log('\n=== desktop: scrolling moves the backdrop (the whole bug) ===');
reset();
reducedMatches = false;
coarseMatches = false;
api = initBackdrop();
pump();
const yTop = offset();
check('an offset is published at the top of the page', Number.isFinite(yTop),
  `got ${written['--bg-y']}`);

window.scrollY = MAX;
fireScroll();
pump();
const yBottom = offset();
check('an offset is published at the bottom', Number.isFinite(yBottom));

const travelled = Math.abs(yTop - yBottom);
check('the backdrop MOVED between top and bottom', travelled > 60,
  `travelled only ${travelled.toFixed(2)}px — a static backdrop is the bug`);

// THE ASSERTION THAT WAS MISSING, and the reason this file went green on a
// defect. Total travel says nothing about what a visitor perceives, because
// the budget is spent across the whole document: the original 0.10 satisfied
// "travelled > 60px" with 90px, while delivering ~11px per screenful — which
// is invisible. Perception tracks the RATE, so that is what gets asserted.
const perScreen = travelled * (VH / MAX);
check(`moves ${perScreen.toFixed(1)}px per screenful, which is perceptible`,
  perScreen > 25,
  'under ~25px per viewport of scrolling reads as a static background on a '
  + 'dark image — the effect is then working and invisible, which is worse '
  + 'than broken because nothing fails');
check('  it moves upward as the page descends', yTop > 0 && yBottom < 0,
  `top=${yTop.toFixed(2)} bottom=${yBottom.toFixed(2)}`);
check('  and is centred on zero, so neither edge is favoured',
  Math.abs(yTop + yBottom) < 1,
  `top=${yTop.toFixed(2)} bottom=${yBottom.toFixed(2)}`);

// --- 3. stays inside the slack app.css reserves -----------------------------

console.log('\n=== the translate never exposes an edge ===');
// app.css gives body::before `inset: -38vh 0`, so |offset| must stay under 38vh.
const SLACK = VH * 0.38;
let worst = 0;
for (const frac of [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1]) {
  window.scrollY = MAX * frac;
  fireScroll();
  pump();
  worst = Math.max(worst, Math.abs(offset()));
}
check(`peak offset ${worst.toFixed(2)}px stays inside the ${SLACK}px slack`,
  worst < SLACK,
  'raise `inset` in app.css before raising TRAVEL_* in backdrop.js');

// --- 4. the motion is damped, not a 1:1 jump --------------------------------

console.log('\n=== motion is eased, not stepped ===');
reset();
api = initBackdrop();
pump();
const settledTop = offset();
window.scrollY = MAX;
fireScroll();
pump(1);                       // exactly one frame after a full-page jump
const afterOne = offset();
check('one frame does not land on the final value',
  Math.abs(afterOne - settledTop) > 0.01 && afterOne > -40,
  `jumped straight to ${afterOne.toFixed(2)} — that is a step, not a parallax`);
pump();
// Half the desktop budget, negative: TRAVEL_FINE * VH / 2.
const settleTo = -(0.70 * VH) / 2;
check('  but it does converge', Math.abs(offset() - settleTo) < 1,
  `settled at ${offset().toFixed(2)}, expected ≈ ${settleTo}`);

// --- 5. the loop stops when nothing is moving -------------------------------

console.log('\n=== the rAF loop stops when settled (battery) ===');
check('no frame is queued once the value has settled', queue.length === 0,
  'a permanently running rAF is the main cost of an effect like this');
fireScroll();
check('  and a scroll restarts it', queue.length > 0);
pump();

// --- 6. touch gets a smaller budget than desktop ----------------------------

console.log('\n=== coarse pointer moves LESS than desktop ===');
reset();
coarseMatches = true;
api = initBackdrop();
pump();
const cTop = offset();
window.scrollY = MAX;
fireScroll();
pump();
const cTravel = Math.abs(cTop - offset());
check('coarse pointers still get real motion', cTravel > 20,
  `travelled ${cTravel.toFixed(2)}px`);
check('  but noticeably less than a mouse', cTravel < travelled * 0.6,
  `coarse=${cTravel.toFixed(2)}px vs fine=${travelled.toFixed(2)}px — iOS adds `
  + 'its own viewport movement on top, so this budget is deliberately smaller');

console.log(`\n${failures === 0
  ? '  BACKDROP PARALLAX CONTRACT HOLDS (headless; not a browser)'
  : `  ${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
