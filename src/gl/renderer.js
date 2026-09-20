// Minimal WebGL2 helpers, plus the degrade path.
//
// Every caller must handle `createGL()` returning null. WebGL is decoration on
// this site — when it is unavailable the page stays fully readable and
// navigable, so a missing context is a normal outcome, not an error.

export function createGL(canvas, opts = {}) {
  try {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      ...opts,
    });
    if (!gl) return null;
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    // Shaders output premultiplied colour.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return gl;
  } catch {
    return null;
  }
}

function compile(gl, type, src, label) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(`${label}: ${gl.getShaderInfoLog(s)}`);
  }
  return s;
}

export function program(gl, vert, frag, label = 'program') {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vert, `${label} vert`));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag, `${label} frag`));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(`${label} link: ${gl.getProgramInfoLog(p)}`);
  }

  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    u[info.name] = gl.getUniformLocation(p, info.name);
    // An array uniform is reported ONCE as "uThing[0]" with size = length.
    // Locations for the remaining elements must be requested individually or
    // every index past the first silently writes nowhere.
    if (info.size > 1 && info.name.endsWith('[0]')) {
      const base = info.name.slice(0, -3);
      u[base] = u[info.name];
      for (let k = 1; k < info.size; k++) {
        u[`${base}[${k}]`] = gl.getUniformLocation(p, `${base}[${k}]`);
      }
    }
  }
  return { p, u };
}

/**
 * Size the drawing buffer to the element, capping DPR at 2.
 * Beyond 2 the pixel cost roughly doubles again for no visible gain on the
 * kind of soft, low-contrast field this site draws.
 */
export function resizeCanvas(gl, canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, w, h);
  return { w, h, dpr };
}
