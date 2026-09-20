// Case-study overlay + deep links.
//
// Built on native <dialog>.showModal(), which supplies focus trapping,
// Esc-to-close, background inertness and ::backdrop for free. The only thing
// added here is URL sync, so a single project can be linked to directly:
//
//     …/index.html#project/upi-sentinel-ai
//
// History is kept honest: opening pushes a state, closing goes back, and the
// browser's own back button closes the overlay rather than leaving the page.

let dialogEl;
let bodyEl;
let render;
let byId = new Map();
let openId = null;

export function initDialog({ dialog, body, close, projects, renderCase }) {
  dialogEl = dialog;
  bodyEl = body;
  render = renderCase;
  byId = new Map(projects.map((p) => [p.id, p]));

  close.addEventListener('click', () => dialogEl.close());

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
  if (push) history.pushState({ project: id }, '', `#project/${id}`);
  if (!dialogEl.open) dialogEl.showModal();
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
