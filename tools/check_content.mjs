// Content integrity check.
//
//     node tools/check_content.mjs
//
// Guards the two rules the project cannot afford to break silently: no
// fabricated links, and no malformed metrics reaching the page. Deliberately
// tiny and dependency-free -- it exists to fail loudly, not to be a framework.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { profile, projects, timeline, skills, experience, certifications }
  from '../src/data/content.js';

let checks = 0;
const ok = (label, fn) => { fn(); checks++; console.log(`  ok  ${label}`); };

ok('every project has the fields the renderer reads', () => {
  for (const p of projects) {
    for (const f of ['id', 'num', 'title', 'subtitle', 'blurb', 'problem',
      'solution', 'tech', 'features', 'status', 'contribution', 'source']) {
      assert.ok(p[f] != null, `project ${p.id} is missing "${f}"`);
    }
    assert.ok(Array.isArray(p.tech) && p.tech.length, `${p.id}: empty tech`);
    assert.ok(Array.isArray(p.features) && p.features.length, `${p.id}: empty features`);
  }
});

ok('every project documents its architecture', () => {
  // Item 7 of the brief's case-study requirements. A project with no
  // architecture renders no section at all, which would fail silently.
  for (const p of projects) {
    assert.ok(Array.isArray(p.architecture) && p.architecture.length,
      `${p.id}: architecture must be a non-empty array`);
  }
});

ok('every project names its artwork file', () => {
  // The filenames do not match the ids, so the path cannot be derived. A
  // missing mapping would silently fall through to the generated schematic —
  // indistinguishable from "the image has not been supplied yet".
  const seen = new Set();
  for (const p of projects) {
    assert.ok(typeof p.art === 'string' && /\.(jpg|jpeg|png|webp|avif)$/i.test(p.art),
      `${p.id}: art must be a filename with an image extension`);
    assert.ok(!seen.has(p.art), `${p.art} is mapped to more than one project`);
    seen.add(p.art);
  }
});

ok('project ids are unique (they are used as URL fragments)', () => {
  const ids = projects.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate project id');
});

ok('metrics are well formed, and absent rather than empty when unknown', () => {
  for (const p of projects) {
    assert.ok(Array.isArray(p.metrics), `${p.id}: metrics must be an array`);
    for (const m of p.metrics) {
      assert.ok(m.label && m.value, `${p.id}: metric needs both label and value`);
      assert.equal(typeof m.value, 'string', `${p.id}: metric value must be a string`);
    }
  }
});

ok('no link is a placeholder, a guess, or a non-https URL', () => {
  for (const p of projects) {
    assert.ok(p.links && typeof p.links === 'object', `${p.id}: links must be an object`);
    for (const [k, v] of Object.entries(p.links)) {
      assert.match(v, /^https:\/\//, `${p.id}.${k}: must be an https URL`);
      assert.doesNotMatch(v, /example\.com|TODO|xxx|your-|<.*>/i,
        `${p.id}.${k}: looks like a placeholder URL`);
    }
  }
});

ok('projects described from the brief carry a disclaimer', () => {
  // A 'provided' project was not inspected, so anything it claims about
  // itself needs its limits stated on the page.
  for (const p of projects.filter((x) => x.source === 'provided')) {
    assert.ok(p.disclaimer, `${p.id}: provided-source project needs a disclaimer`);
  }
});

ok('experience entries carry every field the renderer prints', () => {
  // renderSkills() prints role, org, location and period into one line, and
  // iterates points. A missing field renders the literal string "undefined"
  // rather than failing -- the same silent-absence trap that hid the missing
  // project architecture until it was audited by hand.
  for (const e of experience) {
    for (const f of ['role', 'org', 'location', 'period']) {
      assert.ok(typeof e[f] === 'string' && e[f].length,
        `experience "${e.role ?? '?'}" is missing "${f}"`);
    }
    assert.ok(Array.isArray(e.points) && e.points.length,
      `experience "${e.role}" has no points`);
  }
});

ok('certifications carry the fields the renderer prints', () => {
  for (const c of certifications) {
    assert.ok(c.name && c.issuer, `certification "${c.name ?? '?'}" is incomplete`);
  }
});

ok('timeline entries carry the fields the rail prints', () => {
  for (const t of timeline) {
    for (const f of ['year', 'key', 'label']) {
      assert.ok(typeof t[f] === 'string' && t[f].length,
        `timeline "${t.label ?? '?'}" is missing "${f}"`);
    }
    assert.ok(Array.isArray(t.lines) && t.lines.length,
      `timeline "${t.label}" has no lines`);
  }
});

// --- WCAG contrast, computed from the real tokens in app.css --------------
// A one-off fix satisfies the brief; a check stops it regressing. The tokens
// are read from the stylesheet rather than duplicated here, so this can never
// drift from what the page actually renders.

const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');

const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})`));
  assert.ok(m, `app.css has no --${name} token`);
  return m[1];
};

const luminance = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const ch = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = ch.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

ok('text colours meet WCAG AA contrast against the page background', () => {
  const bg = token('bg');
  // Every token used for text. --dimmer was the one that failed at #55616e.
  for (const name of ['paper', 'dim', 'dimmer', 'accent', 'warn']) {
    const ratio = contrast(token(name), bg);
    assert.ok(ratio >= 4.5,
      `--${name} (${token(name)}) is ${ratio.toFixed(2)}:1 on --bg, below the 4.5:1 AA minimum`);
  }
});

ok('contact details are present and well formed', () => {
  assert.match(profile.contact.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  assert.match(profile.contact.linkedin, /^https:\/\//);
  assert.match(profile.contact.github, /^https:\/\//);
});

ok('collections the page iterates are non-empty', () => {
  for (const [name, arr] of Object.entries(
    { projects, timeline, skills, experience, certifications })) {
    assert.ok(Array.isArray(arr) && arr.length, `${name} is empty`);
  }
});

console.log(`\n  ${checks} checks passed\n`);
