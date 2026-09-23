// REAL browser verification, driven through the Chrome DevTools Protocol.
//
//     python tools/serve.py 5173        # in another shell
//     node tools/browser-verify.mjs
//
// Every other harness in this project stubs the DOM. This one does not: it
// launches the installed Chrome, loads the actual page over HTTP, and reads
// computed styles out of the live cascade. It exists because BUG-003 round two
// proved the limit of the stubs — `backdrop-motion.mjs` measured a number the
// module computed, which says nothing about whether any pixel moved.
//
// What makes this authoritative for the backdrop: `body::before` is a
// pseudo-element, so the only way to know whether it consumes `--bg-y` is to
// ask the engine for its resolved `transform` matrix. A stub cannot answer
// that, because resolving a custom property through inheritance into a
// pseudo-element IS the thing under test.
//
// Zero dependencies: Node 22+ ships a global WebSocket and fetch, which is all
// CDP needs.

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ORIGIN = process.env.VERIFY_URL || 'http://localhost:5173';
const OUT = process.env.VERIFY_OUT || join(tmpdir(), 'portfolio-shots');
const PORT = 9333;

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p));

if (!CHROME) {
  console.error('No Chrome or Edge binary found — cannot do browser verification.');
  process.exit(2);
}

let failures = 0;
const check = (label, cond, detail = '') => {
  if (cond) console.log(`  ok    ${label}`);
  else { failures++; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- launch ----------------------------------------------------------------

const profile = mkdtempSync(join(tmpdir(), 'cdp-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-background-networking',
  '--force-device-scale-factor=1',
  '--window-size=1440,900',
  'about:blank',
], { stdio: 'ignore' });

process.on('exit', () => chrome.kill());

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('Chrome never exposed its debugging endpoint');
}

// --- minimal CDP client ----------------------------------------------------

function connect(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  let id = 0;
  const events = new Map();

  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    } else if (m.method && events.has(m.method)) {
      events.get(m.method).forEach((fn) => fn(m.params));
    }
  });

  const ready = new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', () => rej(new Error('CDP socket failed')));
  });

  return {
    ready,
    on(method, fn) { (events.get(method) ?? events.set(method, []).get(method)).push(fn); },
    send(method, params = {}, sessionId) {
      const msg = { id: ++id, method, params };
      if (sessionId) msg.sessionId = sessionId;
      return new Promise((resolve, reject) => {
        pending.set(msg.id, { resolve, reject });
        ws.send(JSON.stringify(msg));
      });
    },
    close: () => ws.close(),
  };
}

const browser = connect(await endpoint());
await browser.ready;

const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
const send = (m, p = {}) => browser.send(m, p, sessionId);

await send('Page.enable');
await send('Runtime.enable');

/** Evaluate an expression in the page and return its JSON value. */
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description ?? 'evaluate threw');
  }
  return r.result.value;
}

async function goto(url) {
  await send('Page.navigate', { url });
  // Modules + fonts + the boot sequence. Poll for the class main.js removes.
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try {
      const done = await evaluate(
        'document.readyState === "complete" && '
        + '!document.documentElement.classList.contains("is-booting")');
      if (done) { await sleep(600); return true; }
    } catch { /* navigating */ }
  }
  return false;
}

/** The resolved transform matrix of the backdrop pseudo-element. */
const BACKDROP_TRANSFORM =
  'getComputedStyle(document.body, "::before").transform';

/** translateY out of a `matrix(a,b,c,d,tx,ty)` / `matrix3d(...)` string. */
function translateY(matrix) {
  if (!matrix || matrix === 'none') return null;
  const n = matrix.slice(matrix.indexOf('(') + 1, -1).split(',').map((s) => parseFloat(s));
  return n.length === 6 ? n[5] : n.length === 16 ? n[13] : null;
}

async function shoot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const path = join(OUT, name);
  writeFileSync(path, Buffer.from(data, 'base64'));
  return path;
}

async function settleAt(y) {
  await evaluate(`window.scrollTo(0, ${y})`);
  await sleep(900);                       // damping converges well inside this
  return translateY(await evaluate(BACKDROP_TRANSFORM));
}

// --- run -------------------------------------------------------------------

import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

console.log(`\nBrowser: ${CHROME}`);
console.log(`Target : ${ORIGIN}`);
console.log(`Shots  : ${OUT}\n`);

await send('Emulation.setDeviceMetricsOverride', {
  width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
});

// MUST be explicit. Headless Chrome reports `prefers-reduced-motion: reduce`
// by default, and app.css disables the parallax under exactly that with an
// `!important` rule. Without this line the harness measures the accessibility
// path while believing it is measuring the default one — every result comes
// back "static", which is indistinguishable from the bug being tested for.
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
});

console.log('=== page loads ===');
const loaded = await goto(ORIGIN);
check('page reached readyState complete and finished booting', loaded);

const title = await evaluate('document.title');
check(`document.title is present ("${title}")`, !!title);

const consoleErrors = await evaluate(
  '(window.__errs || []).length');
check('no uncaught page errors recorded', consoleErrors === 0 || consoleErrors === undefined,
  `${consoleErrors} error(s)`);

console.log('\n=== the backdrop element exists and is painted ===');
const box = await evaluate(`(() => {
  const s = getComputedStyle(document.body, '::before');
  return { content: s.content, position: s.position, zIndex: s.zIndex,
           hasUrl: s.backgroundImage.includes('url('),
           layers: s.backgroundImage.split(/,(?![^(]*\\))/).length,
           height: s.height, transform: s.transform };
})()`);
check('body::before is generated (content is not "none")', box.content !== 'none', box.content);
check('  position: fixed', box.position === 'fixed', box.position);
check('  carries the background image (url layer present)', box.hasUrl,
  `${box.layers} layer(s), no url() found`);

// The discriminator. If reduced-motion is in force, "transform: none" is the
// CORRECT answer and says nothing about the bug; if it is not, "none" means
// the declaration itself is failing to resolve.
const diag = await evaluate(`(() => ({
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  computed: getComputedStyle(document.documentElement).getPropertyValue('--bg-y'),
  inline: document.documentElement.style.getPropertyValue('--bg-y'),
  transform: getComputedStyle(document.body, '::before').transform,
}))()`);
console.log(`  prefers-reduced-motion : ${diag.reduced}`);
console.log(`  --bg-y computed        : "${diag.computed.trim()}"`);
console.log(`  --bg-y inline on <html>: "${diag.inline}"`);
console.log(`  ::before transform     : ${diag.transform}`);
check('reduced-motion is NOT in force for this measurement', diag.reduced === false,
  'headless defaults to reduce — the parallax is disabled by design here, so '
  + 'every movement result below would be meaningless');
check('  backdrop.js is writing --bg-y', diag.inline !== '',
  'nothing on <html> — initBackdrop() did not run or returned early');

console.log('\n=== DOES IT ACTUALLY MOVE? (the acceptance criterion) ===');
const vh = await evaluate('window.innerHeight');
const maxScroll = await evaluate('document.documentElement.scrollHeight - window.innerHeight');
console.log(`  viewport ${vh}px, scrollable ${maxScroll}px`);

const atTop = await settleAt(0);
const shotTop = await shoot('desktop-top.png');
check('transform resolves to a real matrix at scroll 0', atTop !== null,
  'transform is "none" — the element is NOT consuming --bg-y');

const oneScreen = await settleAt(vh);
const shotOne = await shoot('desktop-one-screen.png');
const perScreen = (atTop !== null && oneScreen !== null) ? Math.abs(atTop - oneScreen) : 0;

check(`ONE SCREENFUL of scrolling moves the backdrop ${perScreen.toFixed(1)}px`,
  perScreen >= 25,
  'this is what the user sees; under ~25px reads as a static background');

const atBottom = await settleAt(maxScroll);
const shotBottom = await shoot('desktop-bottom.png');
const total = (atTop !== null && atBottom !== null) ? Math.abs(atTop - atBottom) : 0;
check(`full-page travel is ${total.toFixed(1)}px`, total > 50);
check('  direction is upward as the page descends', atTop > atBottom,
  `top=${atTop} bottom=${atBottom}`);

console.log('\n=== it does not detach, blank or clip ===');
const cover = await evaluate(`(() => {
  const s = getComputedStyle(document.body, '::before');
  const vh = window.innerHeight;
  const h = parseFloat(s.height);
  return { h, vh, enough: h >= vh * 1.3 };
})()`);
check(`layer is ${cover.h.toFixed(0)}px tall against a ${cover.vh}px viewport`,
  cover.enough, 'not enough slack to cover the translate');
check('  slack exceeds the travel, so no edge can be exposed',
  (cover.h - cover.vh) / 2 > total / 2,
  `slack ${((cover.h - cover.vh) / 2).toFixed(0)}px vs peak ${(total / 2).toFixed(0)}px`);

console.log('\n=== Journey content ===');
const years = await evaluate(
  'JSON.stringify([...document.querySelectorAll(".jn__year")].map(e => e.textContent))');
const list = JSON.parse(years);
console.log(`  ${list.join(' · ')}`);
check('seven milestones render', list.length === 7, `got ${list.length}`);
check('  row 2 reads "Dec 2025"', list[1] === 'Dec 2025', `got "${list[1]}"`);
check('  no full month name anywhere',
  !list.some((y) => /January|February|March|April|May\w|June\w|July|August|September|October|November|December/.test(y)),
  list.join(' | '));
check('  the rail still scrolls with the page (not fixed)',
  await evaluate('getComputedStyle(document.getElementById("journeyRail")).position') !== 'fixed');

console.log('\n=== mobile / responsive ===');
await send('Emulation.setDeviceMetricsOverride', {
  width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
});
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
});
await goto(ORIGIN);
const mvh = await evaluate('window.innerHeight');
const mTop = await settleAt(0);
const mOne = await settleAt(mvh);
const mPer = (mTop !== null && mOne !== null) ? Math.abs(mTop - mOne) : 0;
await shoot('mobile-top.png');
check(`mobile still moves (${mPer.toFixed(1)}px per screenful)`, mPer > 3,
  'mobile must not lose the effect');
const noHScroll = await evaluate(
  'document.documentElement.scrollWidth <= window.innerWidth + 1');
check('  no horizontal scrollbar at 390px', noHScroll);

console.log('\n=== prefers-reduced-motion ===');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
});
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});
await goto(ORIGIN);
const rTop = await settleAt(0);
const rOne = await settleAt(await evaluate('window.innerHeight'));
check('backdrop does NOT move under reduced motion',
  rTop === null || Math.abs(rTop - rOne) < 1,
  `moved ${Math.abs(rTop - rOne)}px — the accommodation is broken`);
const rContent = await evaluate(
  '[...document.querySelectorAll(".jn__year")].length');
check('  the page is still fully rendered and readable', rContent === 7,
  `${rContent} milestones`);
await send('Emulation.setEmulatedMedia', { features: [] });

console.log(`\nScreenshots: ${shotTop}\n             ${shotOne}\n             ${shotBottom}`);
console.log(`\n${failures === 0
  ? '  BROWSER VERIFICATION PASSED (real Chrome, real rendering)'
  : `  ${failures} FAILURE(S)`}`);

browser.close();
chrome.kill();
process.exit(failures === 0 ? 0 : 1);
