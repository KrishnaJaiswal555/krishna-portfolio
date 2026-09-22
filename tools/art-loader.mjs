// Contract test for assets.js -> art().
//
//     node tools/art-loader.mjs
//
// This is the test that was missing. art-smoke.mjs exercises placeholder()
// only; nothing ever tested the LOADER, which is exactly where BUG-002 lived:
// `loading = 'lazy'` on a detached Image meant neither onload nor onerror ever
// fired, so the promise never settled, nothing was appended, and the card
// artwork stayed empty with no console error.
//
// The contract being asserted is simple and absolute:
//
//     art() ALWAYS settles, whatever the image does.
//
// Case 4 below is the bug. It takes STALL_MS to run, by design — the whole
// point is that a hung image still resolves.

import assert from 'node:assert/strict';

let failures = 0;
const check = (label, cond, detail = '') => {
  if (cond) console.log(`  ok    ${label}`);
  else { failures++; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`); }
};

// ---- stubs ---------------------------------------------------------------
// `behaviour(src)` returns 'load' | 'error' | 'hang'.
let behaviour = () => 'load';

class FakeImage {
  constructor() { this.onload = null; this.onerror = null; this._src = ''; }
  get tagName() { return 'IMG'; }
  set src(v) {
    this._src = v;
    const action = behaviour(v);
    if (action === 'load') queueMicrotask(() => this.onload && this.onload());
    else if (action === 'error') queueMicrotask(() => this.onerror && this.onerror());
    // 'hang': fire nothing, ever — the state that caused the bug.
  }
  get src() { return this._src; }
  getAttribute(k) { return k === 'src' ? this._src : null; }
}
globalThis.Image = FakeImage;

const ctx = () => new Proxy({}, {
  get: (_, k) => (k === 'createRadialGradient'
    ? () => ({ addColorStop() {} })
    : () => {}),
  set: () => true,
});
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, tagName: 'CANVAS', getContext: ctx }),
};

const { art, artSources } = await import('../src/lib/assets.js');
const { projects } = await import('../src/data/content.js');

const project = projects[0];
const sources = artSources(project);
assert.ok(sources.length >= 2, 'expected at least two candidate sources');

const warnings = [];
const realWarn = console.warn;
console.warn = (...a) => { warnings.push(a.join(' ')); };

const started = Date.now();

// ---- case 1: first candidate loads ---------------------------------------
behaviour = () => 'load';
const first = await art(project, sources);
check('first candidate loads -> resolves with that image',
  first.tagName === 'IMG' && first.src === sources[0],
  `got ${first.tagName} ${first.src}`);

// ---- case 2: first errors, second loads ----------------------------------
behaviour = (src) => (src === sources[0] ? 'error' : 'load');
const second = await art(project, sources);
check('first errors -> falls through to the second candidate',
  second.tagName === 'IMG' && second.src === sources[1],
  `got ${second.tagName} ${second.src}`);

// ---- case 3: every candidate errors --------------------------------------
warnings.length = 0;
behaviour = () => 'error';
const exhausted = await art(project, sources);
check('all candidates error -> resolves with the generated schematic',
  exhausted.tagName === 'CANVAS', `got ${exhausted.tagName}`);
check('  and warns once, naming what it tried',
  warnings.length === 1 && warnings[0].includes(sources[0]),
  `warnings: ${warnings.length}`);

// ---- case 4: THE BUG — the image neither loads nor errors -----------------
console.warn = realWarn;
console.log(`\n  case 4 waits for the stall guard (~8s) — this is the bug case\n`);
console.warn = (...a) => { warnings.push(a.join(' ')); };

warnings.length = 0;
behaviour = () => 'hang';
const t0 = Date.now();
const hung = await art(project, sources);
const waited = Date.now() - t0;

console.warn = realWarn;

check('a hung image still settles (never deadlocks)',
  hung !== undefined, 'promise never resolved');
check('  and settles with the schematic, not undefined',
  hung.tagName === 'CANVAS', `got ${hung && hung.tagName}`);
check('  and warns that it neither loaded nor failed',
  warnings.some((w) => w.includes('neither loaded nor failed')),
  `warnings: ${JSON.stringify(warnings)}`);
check('  within a bounded time',
  waited < 30000, `waited ${waited}ms`);

console.log(`\n  total ${Date.now() - started}ms`);
console.log(failures === 0
  ? '  ART LOADER CONTRACT HOLDS — art() always settles'
  : `  ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
