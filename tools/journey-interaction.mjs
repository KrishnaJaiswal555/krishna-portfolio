// Headless behavioural test of the Journey timeline indicator (BUG-001).
//
//     node tools/journey-interaction.mjs
//
// This is NOT a browser test and does not substitute for one. What it does is
// execute the real initJourney() against a DOM stub and drive the actual
// click path, so "clicking a row moves the indicator, for every row" is
// demonstrated rather than inferred.
//
// It earns its place: it caught a defect that every static check passed
// clean. `setActive()` opened with an early return on an unchanged index, and
// the aria-pressed sync had been folded in behind it — so clicking an
// already-active row (i.e. hovering then clicking, the ordinary mouse
// gesture) flipped the pin without ever announcing it. Syntax, contract and
// dead-code checks all reported green; only execution found it.
//
// getContext() deliberately returns null. That forces the no-WebGL branch,
// which is exactly the path that used to `return null` before wiring any
// listeners — so this tests the fix AND the degraded path, without stubbing
// WebGL at all.

const ROWS = 5;
let failures = 0;
const check = (label, cond, detail = '') => {
  if (cond) console.log(`  ok    ${label}`);
  else { failures++; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`); }
};

function makeEl(cls = '') {
  const classes = new Set(cls ? cls.split(' ') : []);
  const attrs = {};
  const handlers = {};
  return {
    className: cls,
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
    setAttribute: (k, v) => { attrs[k] = String(v); },
    getAttribute: (k) => attrs[k],
    addEventListener: (type, fn) => { (handlers[type] ||= []).push(fn); },
    fire: (type, ev = {}) => (handlers[type] || []).forEach((fn) => fn(ev)),
    hasHandler: (type) => !!(handlers[type] && handlers[type].length),
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 1000, height: 2000 }),
    offsetTop: 0, offsetLeft: 0, offsetWidth: 1000, offsetHeight: 100,
    clientWidth: 1000, clientHeight: 2000,
  };
}

const rows = Array.from({ length: ROWS }, () => makeEl('jn'));

const rail = makeEl('journey__rail');
rail.querySelectorAll = (sel) => (sel === '.jn' ? rows : []);

const section = makeEl('journey');
const canvas = makeEl('journey__stage');
canvas.getContext = () => null;          // the whole point: no WebGL

const byId = { journey: section, journeyStage: canvas, journeyRail: rail };

globalThis.window = {
  innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1, addEventListener() {},
};
globalThis.document = {
  getElementById: (id) => byId[id] ?? null,
  addEventListener() {},
  documentElement: makeEl(''),
  createElement: () => makeEl(''),
};
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
globalThis.IntersectionObserver = class { observe() {} disconnect() {} };

const { initJourney } = await import('../src/scenes/journey.js');

console.log('=== init (no WebGL context available) ===');
let api;
try {
  api = await initJourney();
  check('initJourney() did not throw', true);
} catch (e) {
  check('initJourney() did not throw', false, e.message);
  console.log(`\n  ${failures} failure(s)`);
  process.exit(1);
}

check('returned a usable object rather than null (partial success)', !!api,
  'a null return would mean the whole scene reported failure');
check('section marked is-fallback', section.classList.contains('is-fallback'));

console.log('\n=== listeners attached WITHOUT a canvas (the original bug) ===');
check('every row has a click handler', rows.every((r) => r.hasHandler('click')));
check('every row has a pointerenter handler', rows.every((r) => r.hasHandler('pointerenter')));
check('every row has a focus handler', rows.every((r) => r.hasHandler('focus')));
check('rail has a pointerleave handler', rail.hasHandler('pointerleave'));

const activeIndex = () => rows.findIndex((r) => r.classList.contains('is-active'));
const activeCount = () => rows.filter((r) => r.classList.contains('is-active')).length;

console.log('\n=== initial state ===');
check('exactly one row is active on load', activeCount() === 1, `count=${activeCount()}`);
check('it is the first row', activeIndex() === 0, `index=${activeIndex()}`);

console.log('\n=== clicking EVERY row moves the indicator ===');
for (let i = 0; i < ROWS; i++) {
  rows[i].fire('click');
  const idx = activeIndex();
  check(`click row ${i} -> indicator on row ${i}`, idx === i, `landed on ${idx}`);
  check('  exactly one row active', activeCount() === 1, `count=${activeCount()}`);
  check(`  row ${i} reports aria-pressed="true"`,
    rows[i].getAttribute('aria-pressed') === 'true',
    `got ${rows[i].getAttribute('aria-pressed')}`);
  const others = rows.filter((_, k) => k !== i)
    .every((r) => r.getAttribute('aria-pressed') === 'false');
  check('  every other row reports aria-pressed="false"', others);
}

// Each block below resets to a known pin state first, so no check depends on
// leftover state from the previous block.
const clearPin = () => {
  const p = rows.findIndex((r) => r.getAttribute('aria-pressed') === 'true');
  if (p >= 0) rows[p].fire('click');
};

console.log('\n=== hover then click: the ordinary mouse path ===');
clearPin();
rows[2].fire('pointerenter');
check('hover makes row 2 active', activeIndex() === 2, `index=${activeIndex()}`);
check('  hover alone does NOT pin it',
  rows[2].getAttribute('aria-pressed') === 'false',
  `got ${rows[2].getAttribute('aria-pressed')}`);
rows[2].fire('click');
check('clicking an already-active row still pins it',
  rows[2].getAttribute('aria-pressed') === 'true',
  'setActive() early-returns when the index is unchanged, so the aria sync '
  + 'must not live inside it');
check('  and it remains active', activeIndex() === 2, `index=${activeIndex()}`);

console.log('\n=== click again releases the pin ===');
rows[2].fire('click');
check('pin released', rows[2].getAttribute('aria-pressed') === 'false',
  `got ${rows[2].getAttribute('aria-pressed')}`);
check('  no row is pinned',
  rows.every((r) => r.getAttribute('aria-pressed') === 'false'));
rows[1].fire('pointerenter');
check('  hover can still move the indicator', activeIndex() === 1,
  `index=${activeIndex()}`);

console.log('\n=== a pin survives pointerleave (the frozen-indicator bug) ===');
clearPin();
rows[3].fire('click');
rows[0].fire('pointerenter');
check('hover previews over a pin', activeIndex() === 0, `index=${activeIndex()}`);
rail.fire('pointerleave');
check('indicator returns to the pinned row, not a scroll-derived one',
  activeIndex() === 3, `index=${activeIndex()}`);
check('  pinned row still reports aria-pressed="true"',
  rows[3].getAttribute('aria-pressed') === 'true');

console.log(`\n${failures === 0
  ? '  ALL INTERACTION CHECKS PASSED (headless; not a browser)'
  : `  ${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
