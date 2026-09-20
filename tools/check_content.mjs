// Content integrity check.
//
//     node tools/check_content.mjs
//
// Guards the two rules the project cannot afford to break silently: no
// fabricated links, and no malformed metrics reaching the page. Deliberately
// tiny and dependency-free -- it exists to fail loudly, not to be a framework.

import assert from 'node:assert/strict';
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
