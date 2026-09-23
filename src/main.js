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
import { art, artSources, probeFile } from './lib/assets.js';
import { initDialog, openProject } from './lib/dialog.js';
import { initHero } from './scenes/hero.js';
import { initAbout } from './scenes/about.js';
import { initJourney } from './scenes/journey.js';
import { initUniverse } from './scenes/universe.js';
import { initFinale } from './scenes/finale.js';
import { reveal } from './lib/reveal.js';
import { initBackdrop } from './lib/backdrop.js';

const root = document.documentElement;
const $ = (id) => document.getElementById(id);

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/**
 * A <ul>/<ol> that keeps its list semantics.
 * `list-style: none` is set globally in app.css, and Safari + VoiceOver drop
 * list semantics from an unmarkered list — so the count is never announced.
 * The explicit role restores it. Every generated list goes through here.
 */
const list = (tag, cls) => {
  const n = el(tag, cls);
  n.setAttribute('role', 'list');
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

    // A <button> again. Phase 6 made these plain <div>s on the reasoning that
    // a control which does nothing is worse than text for assistive tech —
    // which was correct AT THE TIME, because activating a row did nothing.
    // Rows now pin the active milestone (click to pin, click again to
    // release), so there is a real action and a real toggle state, and the
    // button is the honest element. `aria-pressed` is maintained by
    // journey.js so the pinned state is announced, not just painted.
    const row = el('button', 'jn');
    row.type = 'button';
    row.setAttribute('data-reveal', '');
    row.setAttribute('aria-pressed', 'false');
    row.setAttribute('aria-label', `${node.year} — ${node.label}. Pin this milestone.`);

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
    // Artwork tries the supplied asset, then the original convention, then a
    // generated schematic. Neither path can fail and the area is never empty.
    art(p, artSources(p)).then((node) => artWrap.append(node));
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

  // Same resolution as the card, so a project's case study and its card can
  // never disagree about which image belongs to it.
  const artWrap = el('div', 'cs__art');
  art(p, artSources(p)).then((n) => artWrap.append(n));
  out.push(artWrap);

  const section = (title, node) => {
    out.push(el('h3', 'cs__h', title));
    out.push(node);
  };

  section('Overview', el('p', 'cs__p', p.blurb));
  section('Problem', el('p', 'cs__p', p.problem));
  section('Solution', el('p', 'cs__p', p.solution));

  const feats = list('ul', 'cs__list');
  for (const f of p.features) feats.append(el('li', null, f));
  section('Key features', feats);

  if (p.workflow?.length) {
    const flow = list('ol', 'cs__flow');
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

  // Architecture reads as an ordered pipeline rather than prose: these are
  // all data-flow systems, and a numbered path is how they actually work.
  if (p.architecture?.length) {
    const flow = list('ol', 'cs__flow');
    for (const step of p.architecture) flow.append(el('li', null, step));
    section('Architecture', flow);
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
    // reveal() runs after every render function, so hooks added here are
    // picked up exactly as the ones written into index.html are.
    col.setAttribute('data-reveal', '');
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
    // Location is carried in content.js but was never rendered; it is part of
    // how an employment entry reads on a CV.
    box.append(el('div', 'xp__org', `${e.org} · ${e.location} · ${e.period}`));
    const pts = list('ul', 'xp__points');
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

  // A hardcoded copyright year silently goes stale on 1 January. The markup
  // carries a sensible value so a no-JS visitor still sees a year, and this
  // corrects it to whatever year it actually is.
  const year = $('finYear');
  if (year) year.textContent = String(new Date().getFullYear());
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
    ['universe', initUniverse],
    ['finale', initFinale],
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
  // Page chrome rather than a scene: it owns no canvas and belongs to no
  // section, so it is not part of the startScenes() registry. It returns null
  // and does nothing under reduced motion.
  initBackdrop();
  startScenes();

  initDialog({
    dialog: $('caseDialog'),
    body: $('caseBody'),
    close: $('caseClose'),
    prev: $('casePrev'),
    next: $('caseNext'),
    projects,
    renderCase,
  });

  wireResume();

  root.classList.remove('is-booting');
}

main();
