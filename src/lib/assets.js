// Asset loading that treats every file as optional.
//
// The site must be complete and deployable with `public/projects/` entirely
// empty. Nothing here ever throws on a missing file: a failed image becomes a
// generated placeholder, and a missing document simply hides its own button.
// Dropping a real screenshot in later needs no code change.

/**
 * Draw a placeholder card for a project with no artwork yet.
 * Deterministic: the same id always produces the same field, so the deck does
 * not reshuffle its look between reloads.
 */
export function placeholder(project, w = 800, h = 500) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  g.fillStyle = '#0a0e14';
  g.fillRect(0, 0, w, h);

  // A seeded point field, echoing the site's particle motif. Seeded from the
  // id so it is stable across reloads rather than random noise each time.
  let seed = 0;
  for (let i = 0; i < project.id.length; i++) seed += project.id.charCodeAt(i) * (i + 7);
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const pts = [];
  for (let i = 0; i < 46; i++) pts.push([rnd() * w, rnd() * h]);

  // Link near neighbours — a constellation, not scattered dots.
  g.strokeStyle = 'rgba(79, 209, 224, 0.13)';
  g.lineWidth = 1;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i][0] - pts[j][0];
      const dy = pts[i][1] - pts[j][1];
      if (dx * dx + dy * dy < 150 * 150) {
        g.beginPath();
        g.moveTo(pts[i][0], pts[i][1]);
        g.lineTo(pts[j][0], pts[j][1]);
        g.stroke();
      }
    }
  }
  g.fillStyle = 'rgba(79, 209, 224, 0.5)';
  for (const [x, y] of pts) {
    g.beginPath();
    g.arc(x, y, 1.7, 0, Math.PI * 2);
    g.fill();
  }

  // Vignette, so the label always sits on a dark enough field to be legible.
  const grd = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h);
  grd.addColorStop(0, 'rgba(10,14,20,0)');
  grd.addColorStop(1, 'rgba(5,7,10,0.92)');
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);

  g.fillStyle = 'rgba(232, 237, 242, 0.9)';
  g.font = '500 30px Inter, system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText(project.num ?? '', w / 2, h / 2 - 14);

  g.fillStyle = 'rgba(85, 97, 110, 0.95)';
  g.font = '400 13px "JetBrains Mono", monospace';
  g.fillText('VISUAL PENDING', w / 2, h / 2 + 22);

  return c;
}

/**
 * Resolve a project's artwork.
 * Resolves to an <img> if the file exists, or a placeholder <canvas> if not.
 * Never rejects — a missing screenshot is an expected state, not an error.
 */
export function art(project, src) {
  return new Promise((resolve) => {
    if (!src) { resolve(placeholder(project)); return; }
    const img = new Image();
    img.decoding = 'async';
    img.loading = 'lazy';
    img.alt = '';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(placeholder(project));
    img.src = src;
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
