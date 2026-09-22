// Pre-deployment audit.
//
//     node tools/deploy-audit.mjs
//
// The question that matters: a local dev server always serves from the domain
// root, but GitHub Pages PROJECT sites serve from /<repo-name>/. Any reference
// beginning with "/" therefore resolves against the domain root and 404s in
// production while working perfectly on localhost. No amount of local testing
// reveals it — it has to be audited by reading the references themselves.
//
// The project root is derived from this file's own location. It was previously
// hardcoded to an absolute path, which worked on exactly one machine.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');
// "Shipped" means what a visitor's browser actually downloads. `docs/` and
// `tools/` are excluded: both live in the repository but neither is ever
// requested by the page. Including tools/ inflated the payload figure by the
// size of the test harnesses, and made this script scan its own source — so
// section 4 dutifully reported the word "localhost" from its own comments and
// its own check. An instrument that measures itself reports noise.
const shipped = files.filter(
  (p) => /\.(html|js|css|mjs)$/.test(p)
    && !rel(p).startsWith('docs/')
    && !rel(p).startsWith('tools/'),
);

let problems = 0;
const flag = (msg) => { problems++; console.log(`  PROBLEM  ${msg}`); };

console.log('=== 1. root-relative references (break on a Pages project site) ===');

const attrRootRel = /\b(?:src|href)\s*=\s*"\/(?!\/)/g;
const jsRootRel = /(['"`])\/(?:src|public|assets|tools)\//g;

for (const p of shipped) {
  const text = readFileSync(p, 'utf8');
  const name = rel(p);
  text.split('\n').forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
    if (name.endsWith('.html') && attrRootRel.test(line)) {
      flag(`${name}:${i + 1} root-relative attribute: ${t}`);
    }
    if (jsRootRel.test(line)) flag(`${name}:${i + 1} root-relative literal: ${t}`);
    attrRootRel.lastIndex = 0;
    jsRootRel.lastIndex = 0;
  });
}
if (!problems) {
  console.log('  ok — every reference is relative, so a subpath deploy resolves');
}

console.log('\n=== 2. every runtime asset reference ===');
const refs = new Set();
for (const p of shipped) {
  const text = readFileSync(p, 'utf8');
  for (const m of text.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)) refs.add(m[1]);
  for (const m of text.matchAll(/(['"`])(public\/[^'"`]+)\1/g)) refs.add(m[2]);
  for (const m of text.matchAll(/`(public\/[^`]+)`/g)) refs.add(m[1]);
}
[...refs].sort().forEach((a) => {
  const kind = a.startsWith('http') ? 'external'
    : a.startsWith('#') || a.startsWith('mailto:') ? 'in-page'
      : a.startsWith('/') ? 'ROOT-RELATIVE' : 'relative';
  console.log(`  ${kind.padEnd(14)} ${a}`);
});

console.log('\n=== 3. secrets sweep ===');
const secret = /(api[_-]?key|client[_-]?secret|access[_-]?token|password\s*[:=]|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY)/i;
let secrets = 0;
for (const p of shipped.concat(files.filter((f) => /\.json$/.test(f)))) {
  readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
    if (secret.test(line)) {
      secrets++;
      console.log(`  PROBLEM  ${rel(p)}:${i + 1} ${line.trim().slice(0, 80)}`);
    }
  });
}
if (!secrets) console.log('  ok — no credentials, keys or tokens in any shipped file');

console.log('\n=== 4. localhost references in shipped files ===');
let local = 0;
for (const p of shipped) {
  readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
    if (line.includes('localhost')) {
      local++;
      console.log(`  ${rel(p)}:${i + 1} ${line.trim().slice(0, 80)}`);
    }
  });
}
if (!local) console.log('  ok — none');

console.log('\n=== 5. shipped payload ===');
let bytes = 0;
for (const p of shipped) bytes += statSync(p).size;
console.log(`  ${shipped.length} files, ${(bytes / 1024).toFixed(1)} KB uncompressed`);

const total = problems + secrets;
console.log(`\n${total === 0 ? 'AUDIT CLEAN' : `AUDIT FOUND ${total} PROBLEM(S)`}`);
process.exit(total === 0 ? 0 : 1);
