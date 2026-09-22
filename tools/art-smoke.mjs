// Smoke test for the per-project card art.
//
//     node tools/art-smoke.mjs
//
// The motifs in src/lib/assets.js are ~150 lines of canvas drawing that only
// ever run in a browser. `node --check` parses them; it cannot tell you
// whether a motif throws on its first call, or whether a project id has
// quietly lost its motif and is falling back to the generic field.
//
// This stubs a 2D context, runs placeholder() for every project, and reports
// which calls landed on a real motif versus the fallback. The stub also
// rejects non-finite coordinates, so a NaN reaching the canvas fails loudly
// here instead of silently drawing nothing in the browser.

const calls = { total: 0 };
const track = (name) => { calls[name] = (calls[name] || 0) + 1; calls.total++; };

function stubContext() {
  const noop = (name) => (...args) => {
    track(name);
    for (const a of args) {
      if (typeof a === 'number' && !Number.isFinite(a)) {
        throw new Error(`${name}() received a non-finite number: ${a}`);
      }
    }
  };
  return {
    fillRect: noop('fillRect'),
    strokeRect: noop('strokeRect'),
    beginPath: noop('beginPath'),
    moveTo: noop('moveTo'),
    lineTo: noop('lineTo'),
    arc: noop('arc'),
    rect: noop('rect'),
    bezierCurveTo: noop('bezierCurveTo'),
    fill: noop('fill'),
    stroke: noop('stroke'),
    fillText: noop('fillText'),
    createRadialGradient: () => {
      track('createRadialGradient');
      return { addColorStop: noop('addColorStop') };
    },
    set fillStyle(v) { track('fillStyle'); }, get fillStyle() { return ''; },
    set strokeStyle(v) { track('strokeStyle'); }, get strokeStyle() { return ''; },
    set lineWidth(v) { track('lineWidth'); }, get lineWidth() { return 1; },
    set font(v) { track('font'); }, get font() { return ''; },
    set textAlign(v) { track('textAlign'); }, get textAlign() { return ''; },
  };
}

globalThis.document = {
  createElement(tag) {
    if (tag !== 'canvas') throw new Error(`unexpected createElement('${tag}')`);
    return { width: 0, height: 0, getContext: () => stubContext() };
  },
};

const { placeholder } = await import('../src/lib/assets.js');
const { projects } = await import('../src/data/content.js');

// The generic fallback draws exactly 30 arcs and no strokes. Every motif
// draws strokes, or a different number of arcs, so the call profile separates
// them without needing MOTIFS to be exported.
let failures = 0;
let fallbacks = 0;

for (const p of projects) {
  for (const k of Object.keys(calls)) delete calls[k];
  calls.total = 0;
  try {
    placeholder(p, 800, 500);
    const strokes = calls.stroke || 0;
    const arcs = calls.arc || 0;
    const generic = strokes === 0 && arcs === 30;
    if (generic) fallbacks++;
    console.log(
      `  ${generic ? 'FALLBACK' : 'motif   '}  ${p.id.padEnd(24)}`
      + ` ops:${String(calls.total).padStart(5)}  arcs:${String(arcs).padStart(3)}`
      + `  strokes:${String(strokes).padStart(4)}`,
    );
  } catch (e) {
    failures++;
    console.log(`  THREW     ${p.id.padEnd(24)} ${e.message}`);
  }
}

console.log(`\n  ${projects.length} projects, ${failures} threw, `
  + `${fallbacks} fell back to the generic field`);
console.log(failures === 0 && fallbacks === 0
  ? '  SMOKE TEST CLEAN — every project has a motif and every motif runs'
  : '  ATTENTION NEEDED');
process.exit(failures === 0 && fallbacks === 0 ? 0 : 1);
