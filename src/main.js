// Boot and DOM rendering.
//
// Phase 3 scope: render every section from content.js as real, accessible DOM,
// wire the case-study overlay, and confirm the WebGL bootstrap either
// initialises or degrades cleanly. Scene animation arrives in Phase 4+; the
// canvases already exist in the markup so adding it changes no structure.
//
// Order: render content -> wire interaction -> reveal page. The page is held
// at opacity 0 by `html.is-booting` so a visitor never sees an empty shell
// with headings but no content.

import { profile, projects, timeline, skills, experience, certifications }
  from './data/content.js';
import { art, placeholder, probeFile } from './lib/assets.js';
import { initDialog, openProject } from './lib/dialog.js';
import { initHero } from './scenes/hero.js';
import { initAbout } from './scenes/about.js';
import { initJourney } from './scenes/journey.js';
import { reveal } from './lib/reveal.js';

const root = document.documentElement;
const $ = (id) => document.getElementById(id);

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const tags = (items) => {
  const wrap = el('div', 'pc__tech');
  for (const t of items) wrap.append(el('span', 'tag', t));
  return wrap;
};

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

function renderAbout() {
  const focus = $('focusList');
  for (const f of profile.focus) focus.append(el('li', null, f));

  const interest = $('interestList');
  for (const i of profile.interests) interest.append(el('li', null, i));
}

// ---------------------------------------------------------------------------
// Journey
// ---------------------------------------------------------------------------

function renderJourney() {
  const rail = $('journeyRail');

  for (const node of timeline) {
    const li = el('li');

    // NOT a <button>. Highlighting a milestone changes nothing and reveals
    // nothing — every entry is fully readable at all times — so an
    // interactive control here would be a control that does nothing, which
    // is worse for a screen-reader or keyboard user than plain text. The
    // scene reacts to hover and scroll; the information never depends on it.
    const row = el('div', 'jn');
    row.setAttribute('data-reveal', '');

    row.append(el('span', 'jn__year', node.year));

    const mid = el('span');
    mid.append(el('span', 'jn__label', node.label));
    const lines = el('span', 'jn__lines');
    for (const l of node.lines) lines.append(el('i', null, l));
    mid.append(lines);
    row.append(mid);

    row.append(el('span', 'jn__key', node.key));

    li.append(row);
    rail.append(li);
  }
}

// ---------------------------------------------------------------------------
// Project universe
// ---------------------------------------------------------------------------

async function renderUniverse() {
  const deck = $('universeDeck');

  for (const p of projects) {
    const card = el('button', 'pc');
    card.type = 'button';
    card.setAttribute('aria-label', `${p.title} — open case study`);
    card.dataset.id = p.id;

    const artWrap = el('span', 'pc__art');
    artWrap.append(el('span', 'pc__num', p.num));
    // Artwork resolves to a real image if one exists, or a generated
    // placeholder if not. Neither path can fail.
    art(p, `public/projects/${p.id}.png`).then((node) => artWrap.append(node));
    card.append(artWrap);

    const body = el('span', 'pc__body');
    body.append(el('span', 'pc__title', p.title));
    body.append(el('span', 'pc__sub', p.subtitle));
    body.append(el('p', 'pc__blurb', p.blurb));
    body.append(tags(p.tech.slice(0, 5)));
    body.append(el('span', 'pc__more', 'View case study →'));
    card.append(body);

    card.addEventListener('click', () => openProject(p.id));
    deck.append(card);
  }
}

// ---------------------------------------------------------------------------
// Case study — built fresh per project, from data only
// ---------------------------------------------------------------------------

function renderCase(p) {
  const out = [];

  out.push(el('p', 'cs__num', `Project ${p.num}`));
  const h = el('h2', 'cs__title', p.title);
  h.id = 'caseTitle';
  out.push(h);
  out.push(el('p', 'cs__sub', p.subtitle));

  const artWrap = el('div', 'cs__art');
  art(p, `public/projects/${p.id}.png`).then((n) => artWrap.append(n));
  out.push(artWrap);

  const section = (title, node) => {
    out.push(el('h3', 'cs__h', title));
    out.push(node);
  };

  section('Overview', el('p', 'cs__p', p.blurb));
  section('Problem', el('p', 'cs__p', p.problem));
  section('Solution', el('p', 'cs__p', p.solution));

  const feats = el('ul', 'cs__list');
  for (const f of p.features) feats.append(el('li', null, f));
  section('Key features', feats);

  if (p.workflow?.length) {
    const flow = el('ol', 'cs__flow');
    for (const step of p.workflow) flow.append(el('li', null, step));
    section('Workflow', flow);
  }

  // Metrics render ONLY when the project has measured figures. An empty
  // array produces no heading and no grid — the page cannot show a number
  // that was not deliberately recorded in content.js.
  if (p.metrics?.length) {
    const grid = el('div', 'cs__metrics');
    for (const m of p.metrics) {
      const card = el('div', 'mt');
      card.append(el('div', 'mt__v', m.value));
      card.append(el('div', 'mt__l', m.label));
      if (m.note) card.append(el('span', 'mt__n', m.note));
      grid.append(card);
    }
    section('Results', grid);
  }

  section('Technology', tags(p.tech));

  const meta = el('p', 'cs__p');
  meta.append(el('strong', null, 'Contribution: '));
  meta.append(document.createTextNode(p.contribution));
  meta.append(document.createElement('br'));
  meta.append(el('strong', null, 'Status: '));
  meta.append(document.createTextNode(p.status));
  section('Project detail', meta);

  if (p.disclaimer) {
    const note = el('p', 'cs__note');
    note.append(el('strong', null, 'Note: '));
    note.append(document.createTextNode(p.disclaimer));
    out.push(note);
  }

  // Links render only if present. No URL is ever guessed.
  const urls = Object.entries(p.links ?? {});
  if (urls.length) {
    const wrap = el('div', 'cs__links');
    const label = { repo: 'Source code', demo: 'Live demo', report: 'Report' };
    for (const [k, href] of urls) {
      const a = el('a', 'btn', label[k] ?? k);
      a.href = href;
      a.rel = 'noopener';
      a.target = '_blank';
      wrap.append(a);
    }
    out.push(wrap);
  } else {
    out.push(el('p', 'cs__pending', 'Links to be added'));
  }

  return out;
}

// ---------------------------------------------------------------------------
// Skills, experience, certifications
// ---------------------------------------------------------------------------

function renderSkills() {
  const grid = $('skillsGrid');
  for (const g of skills) {
    const col = el('div', 'sk');
    col.append(el('h3', 'about__h', g.group));
    const items = el('div', 'sk__items');
    for (const s of g.items) items.append(el('span', 'tag', s));
    col.append(items);
    grid.append(col);
  }

  const xp = $('experienceList');
  for (const e of experience) {
    const box = el('div', 'xp');
    box.append(el('div', 'xp__role', e.role));
    box.append(el('div', 'xp__org', `${e.org} · ${e.period}`));
    const pts = el('ul', 'xp__points');
    for (const p of e.points) pts.append(el('li', null, p));
    box.append(pts);
    xp.append(box);
  }

  const certs = $('certList');
  for (const c of certifications) {
    certs.append(el('li', null, `${c.name} — ${c.issuer}`));
  }
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

function renderContact() {
  const wrap = $('contactLinks');
  const { email, linkedin, github } = profile.contact;

  const link = (label, href, external) => {
    const a = el('a', 'btn', label);
    a.href = href;
    if (external) { a.rel = 'me noopener'; a.target = '_blank'; }
    return a;
  };

  wrap.append(link('Email', `mailto:${email}`, false));
  wrap.append(link('LinkedIn', linkedin, true));
  wrap.append(link('GitHub', github, true));
}

/** The résumé button appears only if the PDF is actually there. */
async function wireResume() {
  if (await probeFile(profile.resume)) {
    $('resumeLink').href = profile.resume;
    $('resumeWrap').hidden = false;
  }
}

// ---------------------------------------------------------------------------
// Chrome: header state, mobile menu
// ---------------------------------------------------------------------------

function wireChrome() {
  const burger = $('burger');
  const menu = $('menu');

  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    root.classList.toggle('is-menu', open);
    if (open) menu.hidden = false;
    else setTimeout(() => {
      if (!root.classList.contains('is-menu')) menu.hidden = true;
    }, 350);
  };

  burger.addEventListener('click',
    () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('is-menu')) setMenu(false);
  });

  // The header only appears once the hero is behind us, so the opening shot is
  // never sat behind a bar. Passive listener: this never calls preventDefault.
  const onScroll = () => {
    root.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * 0.6);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---------------------------------------------------------------------------
// Canvas scenes
//
// Started AFTER the DOM render above, and never awaited: the page is complete
// and interactive without them. A scene that cannot initialise returns null
// and the section keeps its plain, readable state.
// ---------------------------------------------------------------------------

function startScenes() {
  // Reveals first: they are pure DOM and must be armed before any scene has a
  // chance to throw, so the copy is never left hidden by a failed canvas.
  reveal(document);

  for (const [name, init] of [
    ['hero', initHero],
    ['about', initAbout],
    ['journey', initJourney],
  ]) {
    // Each scene is isolated: one failing must never take the others, or the
    // portfolio, down with it.
    init().catch((e) => {
      console.warn(`[portfolio] ${name} scene unavailable:`, e.message);
    });
  }
}

// ---------------------------------------------------------------------------

function main() {
  renderAbout();
  renderJourney();
  renderUniverse();
  renderSkills();
  renderContact();
  wireChrome();
  startScenes();

  initDialog({
    dialog: $('caseDialog'),
    body: $('caseBody'),
    close: $('caseClose'),
    projects,
    renderCase,
  });

  wireResume();

  root.classList.remove('is-booting');
}

main();
