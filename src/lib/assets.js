// Asset loading that treats every file as optional.
//
// The site must be complete and deployable with `public/assets/projects/`
// entirely empty. Nothing here ever throws on a missing file: a failed image
// becomes a generated schematic, and a missing document simply hides its own
// button. Dropping real artwork in later needs no code change.

/**
 * Draw a placeholder card for a project with no artwork yet.
 * Deterministic: the same id always produces the same field, so the deck does
 * not reshuffle its look between reloads.
 */
// Per-project schematics.
//
// Each project gets a diagram of what it actually DOES, rather than the one
// generic constellation every card used to share. These are drawn from the
// project's own id, so they stay deterministic and cost nothing: no image
// files, no requests, no decode.
//
// They are schematics, not screenshots, and the card says so. Replacing one
// with a real screenshot still needs no code change — drop the PNG in.
const MOTIFS = {
  // Query and catalogue embedded in one space; the nearest neighbours join.
  'ai-product-search': (g, w, h, ink) => {
    const cx = w * 0.5;
    const cy = h * 0.5;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2 + (i % 5) * 0.3;
      const r = h * (0.16 + ((i * 37) % 100) / 100 * 0.3);
      const x = cx + Math.cos(a) * r * 1.7;
      const y = cy + Math.sin(a) * r;
      const near = r < h * 0.28;
      if (near) {
        g.strokeStyle = ink(0.16);
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
      }
      g.fillStyle = ink(near ? 0.55 : 0.2);
      g.beginPath(); g.arc(x, y, near ? 2.6 : 1.8, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = ink(0.9);
    g.beginPath(); g.arc(cx, cy, 5, 0, Math.PI * 2); g.fill();
  },

  // Five agents in sequence, with the quality guard's revision loop.
  'ai-career-copilot': (g, w, h, ink) => {
    const n = 5;
    const y = h * 0.5;
    const pad = w * 0.13;
    const step = (w - pad * 2) / (n - 1);
    for (let i = 0; i < n; i++) {
      const x = pad + i * step;
      if (i < n - 1) {
        g.strokeStyle = ink(0.3);
        g.beginPath(); g.moveTo(x + 13, y); g.lineTo(x + step - 13, y); g.stroke();
      }
      g.strokeStyle = ink(0.55);
      g.fillStyle = 'rgba(10,14,20,0.9)';
      g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill(); g.stroke();
    }
    // revision loop, last stage back to the fourth
    g.strokeStyle = ink(0.35);
    g.beginPath();
    g.moveTo(pad + 4 * step, y + 12);
    g.bezierCurveTo(pad + 4 * step, y + 58, pad + 3 * step, y + 58, pad + 3 * step, y + 12);
    g.stroke();
  },

  // A dashboard: KPI row over a bar series.
  'retail-sales-analytics': (g, w, h, ink) => {
    const bars = [0.42, 0.68, 0.35, 0.86, 0.54, 0.73, 0.47, 0.62];
    const bw = w * 0.055;
    const gap = w * 0.028;
    const total = bars.length * bw + (bars.length - 1) * gap;
    const x0 = (w - total) / 2;
    const base = h * 0.78;
    bars.forEach((v, i) => {
      const bh = v * h * 0.4;
      g.fillStyle = ink(0.16 + v * 0.3);
      g.fillRect(x0 + i * (bw + gap), base - bh, bw, bh);
    });
    g.strokeStyle = ink(0.25);
    g.beginPath(); g.moveTo(w * 0.1, base + 0.5); g.lineTo(w * 0.9, base + 0.5); g.stroke();
    for (let i = 0; i < 3; i++) {
      const kx = w * 0.14 + i * w * 0.26;
      g.strokeStyle = ink(0.22);
      g.strokeRect(kx, h * 0.14, w * 0.2, h * 0.14);
    }
  },

  // A convolutional stack: wide and shallow narrowing to deep and small.
  'skin-lesion-cnn': (g, w, h, ink) => {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const lw = w * (0.13 - t * 0.075);
      const lh = h * (0.52 - t * 0.3);
      const x = w * 0.14 + t * w * 0.62;
      g.strokeStyle = ink(0.2 + t * 0.35);
      g.fillStyle = `rgba(79,209,224,${0.03 + t * 0.05})`;
      g.beginPath();
      g.rect(x, (h - lh) / 2, lw, lh);
      g.fill(); g.stroke();
      if (i < n - 1) {
        g.strokeStyle = ink(0.18);
        g.beginPath();
        g.moveTo(x + lw, h / 2);
        g.lineTo(w * 0.14 + ((i + 1) / (n - 1)) * w * 0.62, h / 2);
        g.stroke();
      }
    }
  },

  // A transaction graph with one flagged node.
  'upi-sentinel-ai': (g, w, h, ink) => {
    const nodes = [];
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      nodes.push([w / 2 + Math.cos(a) * w * 0.26, h / 2 + Math.sin(a) * h * 0.32]);
    }
    g.strokeStyle = ink(0.16);
    for (let i = 0; i < nodes.length; i++) {
      for (const j of [i + 3, i + 5]) {
        const b = nodes[j % nodes.length];
        g.beginPath(); g.moveTo(nodes[i][0], nodes[i][1]); g.lineTo(b[0], b[1]); g.stroke();
      }
    }
    nodes.forEach(([x, y], i) => {
      const flagged = i === 4;
      g.fillStyle = flagged ? 'rgba(224,163,79,0.85)' : ink(0.45);
      g.beginPath(); g.arc(x, y, flagged ? 6 : 3.4, 0, Math.PI * 2); g.fill();
      if (flagged) {
        g.strokeStyle = 'rgba(224,163,79,0.4)';
        g.beginPath(); g.arc(x, y, 13, 0, Math.PI * 2); g.stroke();
      }
    });
  },
};

/**
 * Draw a placeholder card for a project with no artwork yet.
 * Deterministic: the same id always produces the same image, so the deck does
 * not reshuffle its look between reloads.
 */
export function placeholder(project, w = 800, h = 500) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const ink = (a) => `rgba(79, 209, 224, ${a})`;

  g.fillStyle = '#080b10';
  g.fillRect(0, 0, w, h);

  // Faint blueprint grid, matching the section backdrop behind the deck.
  g.strokeStyle = 'rgba(124, 138, 152, 0.06)';
  g.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke();
  }

  g.lineWidth = 1.4;
  const motif = MOTIFS[project.id];
  if (motif) {
    motif(g, w, h, ink);
  } else {
    // Unknown project: fall back to the generic field rather than nothing.
    for (let i = 0; i < 30; i++) {
      const x = ((i * 137) % 100) / 100 * w;
      const y = ((i * 83) % 100) / 100 * h;
      g.fillStyle = ink(0.3);
      g.beginPath(); g.arc(x, y, 2, 0, Math.PI * 2); g.fill();
    }
  }

  // Vignette, so the label always sits on a dark enough field to be legible.
  const grd = g.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h);
  grd.addColorStop(0, 'rgba(8,11,16,0)');
  grd.addColorStop(1, 'rgba(5,7,10,0.9)');
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);

  // Honest labelling: this is a diagram of the project, not a screenshot of
  // it, and the card must not imply otherwise.
  g.fillStyle = 'rgba(125, 137, 150, 0.95)';
  g.font = '400 12px "JetBrains Mono", monospace';
  g.textAlign = 'center';
  g.fillText('SCHEMATIC — VISUAL PENDING', w / 2, h - 26);

  return c;
}

/**
 * Resolve a project's artwork.
 * Resolves to an <img> if the file exists, or a placeholder <canvas> if not.
 * Never rejects — a missing screenshot is an expected state, not an error.
 */
/**
 * Where a project's artwork may live, in preference order.
 *
 * The supplied filenames do not match the project ids (`product-search.jpeg`
 * vs `ai-product-search`), so the path cannot be derived — `content.js`
 * carries the mapping explicitly and `check_content.mjs` asserts it.
 *
 * The second entry is a same-directory fallback under the project id, so a
 * PNG can be dropped in beside the JPEGs without editing `content.js`.
 *
 * It previously pointed into the old top-level projects directory, which was
 * (path deliberately not written out here: tools/deploy-audit.mjs inventories
 * asset references by scanning source text, and a path-shaped string in a
 * comment is reported as though it were a live reference.) That directory was
 * renamed to `public/assets/projects/` when the artwork arrived, which left
 * the fallback aimed at a path that no longer exists — harmless only because
 * the first candidate now always succeeds.
 */
export function artSources(project) {
  return [
    project.art ? `public/assets/projects/${project.art}` : null,
    `public/assets/projects/${project.id}.png`,
  ].filter(Boolean);
}

/**
 * Resolve a project's artwork from an ordered list of candidates.
 *
 * Tries each in turn and resolves with the first that loads; if none do,
 * resolves with a generated schematic. Never rejects — a missing screenshot
 * is an expected state, and the visual area must never end up empty.
 */
/**
 * How long a single candidate may hang before it is treated as failed.
 *
 * This is a stall guard, not a load budget: a real image that is merely slow
 * still fires `onload` and wins the race. It exists so that a candidate which
 * neither loads nor errors — the state a detached lazy image can reach —
 * cannot leave the frame empty and silent forever.
 */
const STALL_MS = 8000;

export function art(project, sources) {
  const list = (Array.isArray(sources) ? sources : [sources]).filter(Boolean);
  return new Promise((resolve) => {
    let i = 0;
    let settled = false;
    const tryNext = () => {
      if (i >= list.length) {
        // Warn only once every candidate has failed. Warning on each attempt
        // would fire for the intermediate fallback, which is expected to miss
        // and would train the reader to ignore this message.
        if (settled) return;
        settled = true;
        console.warn(
          `[portfolio] no artwork loaded for "${project.id}" — tried: ${list.join(', ')}.`
          + ' Falling back to the generated schematic.',
        );
        resolve(placeholder(project));
        return;
      }
      const img = new Image();
      img.decoding = 'async';
      img.alt = '';

      // `loading = 'lazy'` is deliberately NOT set here, and must not be
      // re-added. Lazy loading is defined for images CONNECTED to a document.
      // This image is detached — it is only appended once it resolves — so a
      // lazy hint can defer the fetch indefinitely: neither onload nor onerror
      // fires, the promise never settles, nothing is ever appended, and the
      // frame sits empty showing only its background. No error is logged,
      // because nothing failed; it simply never finished.
      //
      // A deadlock that produces silence is worse than one that throws, so the
      // timeout below guarantees this promise always settles regardless.
      // `timer` is declared before `done` so that `done` closes over a binding
      // that is already initialised by the time anything can call it.
      let timer = 0;

      const done = (node) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(node);
      };

      const attempted = list[i];
      timer = setTimeout(() => {
        console.warn(
          `[portfolio] artwork for "${project.id}" neither loaded nor failed within `
          + `${STALL_MS}ms (${attempted}). Falling back to the generated schematic.`,
        );
        done(placeholder(project));
      }, STALL_MS);

      img.onload = () => done(img);
      img.onerror = () => {
        if (settled) return;
        clearTimeout(timer);
        i += 1;
        tryNext();
      };
      img.src = attempted;
    };
    tryNext();
  });
}

/**
 * True if a file is actually present. Used for the résumé button, which must
 * not appear as a broken download when the PDF has not been added yet.
 * HEAD avoids pulling the whole file just to learn it exists.
 */
export async function probeFile(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok;
  } catch {
    // file:// and some static servers reject HEAD; treat as absent rather
    // than surfacing a link that may 404 for a visitor.
    return false;
  }
}
