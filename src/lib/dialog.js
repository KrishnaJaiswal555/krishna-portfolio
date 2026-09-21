// Case-study overlay, deep links, and navigation between projects.
//
// Built on native <dialog>.showModal(), which supplies focus trapping,
// Esc-to-close, background inertness and ::backdrop for free. What is added
// here is URL sync and stepping between projects, so a visitor who opens one
// case study can read the rest without returning to the deck each time.
//
// History is kept honest: opening pushes a state, closing goes back, and the
// browser's own back button closes the overlay rather than leaving the page.
// Stepping between projects REPLACES the history entry rather than pushing,
// so reading all five does not bury the deck under five back-presses.

let dialogEl;
let bodyEl;
let prevEl;
let nextEl;
let render;
let list = [];
let byId = new Map();
let openId = null;

export function initDialog({ dialog, body, close, prev, next, projects, renderCase }) {
  dialogEl = dialog;
  bodyEl = body;
  prevEl = prev;
  nextEl = next;
  render = renderCase;
  list = projects;
  byId = new Map(projects.map((p) => [p.id, p]));

  close.addEventListener('click', () => dialogEl.close());

  prevEl?.addEventListener('click', () => step(-1));
  nextEl?.addEventListener('click', () => step(1));

  // Arrow keys step between projects while the overlay is open. Ignored when
  // focus is in a text field, so this can never hijack typing.
  dialogEl.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  // Clicking the backdrop closes. The dialog element itself is the event
  // target when the click lands outside .case__in, so compare against bounds
  // rather than looking for a separate backdrop node (there isn't one).
  dialogEl.addEventListener('click', (e) => {
    if (e.target !== dialogEl) return;
    const r = dialogEl.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right
      && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialogEl.close();
  });

  dialogEl.addEventListener('close', () => {
    openId = null;
    // Only rewind if the hash still points at a project, otherwise a close
    // triggered BY a hashchange would pop a second entry.
    if (location.hash.startsWith('#project/')) history.back();
  });

  window.addEventListener('hashchange', syncFromHash);
  syncFromHash();
}

export function openProject(id, { push = true } = {}) {
  const p = byId.get(id);
  if (!p || openId === id) return;

  bodyEl.innerHTML = '';
  bodyEl.append(...render(p));
  bodyEl.scrollTop = 0;
  openId = id;
  updateNav();

  const url = `#project/${id}`;
  if (push) history.pushState({ project: id }, '', url);
  else if (location.hash !== url) history.replaceState({ project: id }, '', url);

  if (!dialogEl.open) dialogEl.showModal();
}

/**
 * Move `delta` projects along the deck order.
 * Deliberately does NOT wrap: at either end the control is disabled, so the
 * list has a felt beginning and end rather than looping silently.
 */
function step(delta) {
  if (openId == null) return;
  const i = list.findIndex((p) => p.id === openId);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return;

  openId = null;                       // let openProject re-render
  openProject(list[j].id, { push: false });
}

function updateNav() {
  if (!prevEl || !nextEl) return;
  const i = list.findIndex((p) => p.id === openId);

  const set = (el, target) => {
    const has = !!target;
    el.disabled = !has;
    // The title goes in the accessible name, not just the visible label, so a
    // screen-reader user hears where the control leads.
    el.setAttribute('aria-label', has
      ? `${el.dataset.dir === 'next' ? 'Next' : 'Previous'} project — ${target.title}`
      : `No ${el.dataset.dir === 'next' ? 'next' : 'previous'} project`);
    const label = el.querySelector('.case__navLabel');
    if (label) label.textContent = has ? target.title : '';
  };

  set(prevEl, list[i - 1]);
  set(nextEl, list[i + 1]);
}

function syncFromHash() {
  const m = location.hash.match(/^#project\/(.+)$/);
  if (m && byId.has(m[1])) {
    openProject(m[1], { push: false });
  } else if (dialogEl?.open) {
    openId = null;
    dialogEl.close();
  }
}
