// Scene 1: a trader from behind in a dark room, three glowing monitors, the city at night.
// 2.5D: every layer is a plane at a depth Z (meters) and is projected by a camera that dollies
// in, cuts to an over-the-shoulder shot, then zooms through the centre screen.
const ROOM = {
  F: (H / 2) / Math.tan(25 * Math.PI / 180),            // 50 degree vertical field of view
  wallZ: 4.6, monZ: 3.3, personZ: 2.0,
  head: [-0.03, 1.22],
  win: { x0: -2.0, x1: 2.0, y0: 0.9, y1: 2.85 },
};
const PXM = 1400;          // pixels per meter in the pre-rendered person / chair layers

function roomCam(t) {
  const c1 = CU.s1_cut, end = SC[0][1];
  if (t < c1) {
    const u = easeOutQuart(t / c1);
    return { x: lerp(0.02, 0.06, u), y: lerp(1.68, 1.57, u), z: lerp(-0.75, 0.42, u), cy: 760 };
  }
  const zt = end - 0.34;
  const u = easeInOut(invlerp(c1, zt, t));
  let cam = { x: lerp(0.31, 0.27, u), y: lerp(1.47, 1.43, u), z: lerp(0.98, 1.4, u), cy: 820 };
  if (t > zt) {
    const k = easeInExpo(invlerp(zt, end, t));
    cam = { x: lerp(cam.x, 0.0, k), y: lerp(cam.y, 1.32, k), z: lerp(cam.z, 3.12, k), cy: lerp(820, 960, k) };
  }
  return cam;
}
function rp(cam, X, Y, Z) {
  const s = ROOM.F / Math.max(0.03, Z - cam.z);
  return [W / 2 + s * (X - cam.x), cam.cy - s * (Y - cam.y), s];
}

// ---------------------------------------------------------------- pre-rendered layers
const SKYLINE = (() => {
  const w = 2600, h = 1300, c = makeCanvas(w, h), g = ctx2d(c), r = rng(5);
  const hz = 760;                                       // horizon row
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#02040d'); sky.addColorStop(0.35, '#07102a'); sky.addColorStop(0.55, '#1a1440');
  sky.addColorStop(0.6, '#3b2347'); sky.addColorStop(0.66, '#120f26'); sky.addColorStop(1, '#05060d');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  // faint stars and a soft moon haze
  for (let i = 0; i < 160; i++) drawDot(g, r() * w, r() * hz * 0.6, 0.8 + r() * 1.5, '#cfe0ff', 0.25 + r() * 0.4, 0.4);
  drawDot(g, w * 0.72, hz * 0.18, 70, '#9fb7ff', 0.25, 0.1);
  drawDot(g, w * 0.72, hz * 0.18, 16, '#e8f0ff', 0.9, 0.6);
  // three rows of buildings, far to near
  const rows = [[0.55, '#0c1330', '#1a2a55', 0.35, 0.5], [0.85, '#080c1e', '#16234a', 0.6, 0.75], [1.15, '#04060f', '#0c1430', 0.9, 1]];
  for (const [scale, col, edge, lit, a] of rows) {
    let x = -40;
    while (x < w + 40) {
      const bw = (40 + r() * 120) * scale;
      let bh = (60 + Math.pow(r(), 2.2) * 380) * scale;
      if (r() < 0.08) bh *= 1.7;
      const top = hz + 30 * scale - bh;
      g.fillStyle = col;
      g.fillRect(x, top, bw, h - top);
      g.fillStyle = edge;
      g.fillRect(x, top, bw, 2);
      if (bh > 300 * scale && r() < 0.5) {                  // spire with a light
        g.fillStyle = col; g.fillRect(x + bw / 2 - 2, top - 40 * scale, 4, 40 * scale);
      }
      // windows
      const cw = 5 * scale + 2, ch = 7 * scale + 2;
      for (let yy = top + 8; yy < hz + 140; yy += ch + 4 * scale) {
        for (let xx = x + 5; xx < x + bw - 6; xx += cw + 4 * scale) {
          if (r() > lit * 0.42) continue;
          const warm = r() < 0.7;
          g.fillStyle = warm ? `rgba(255,${190 + (r() * 50) | 0},110,${0.5 + r() * 0.5})` : `rgba(110,225,255,${0.4 + r() * 0.5})`;
          g.fillRect(xx, yy, cw * 0.7, ch * 0.6);
        }
      }
      x += bw + r() * 14 * scale;
    }
  }
  // street-light glow under the horizon and a haze band
  const haze = g.createLinearGradient(0, hz - 120, 0, hz + 220);
  haze.addColorStop(0, 'rgba(120,80,160,0)'); haze.addColorStop(0.45, 'rgba(255,150,90,0.18)'); haze.addColorStop(1, 'rgba(255,150,90,0)');
  g.fillStyle = haze; g.fillRect(0, hz - 120, w, 340);
  for (let i = 0; i < 500; i++) drawDot(g, r() * w, hz + 40 + r() * 400, 1 + r() * 3, r() < 0.8 ? '#ffc070' : '#7fe8ff', 0.3 + r() * 0.5, 0.5);
  // defocus: the city is far behind the focus plane
  const b = makeCanvas(w, h), bg = ctx2d(b);
  bg.filter = 'blur(2.5px)'; bg.drawImage(c, 0, 0);
  return { img: b, hz };
})();

// Person seen from behind (y down, meters, origin at the head centre) and the chair in front.
function personPath(g) {
  g.beginPath();
  g.ellipse(0, 0, 0.093, 0.114, 0, 0, Math.PI * 2);
  for (let k = 0; k < 15; k++) {                          // tousled hair along the top
    const a = Math.PI * (1.08 + 0.84 * k / 14), rr = 0.011 + 0.007 * hash(k * 7);
    g.moveTo(Math.cos(a) * 0.088 + rr, Math.sin(a) * 0.108);
    g.arc(Math.cos(a) * 0.088, Math.sin(a) * 0.108 - 0.004, rr, 0, Math.PI * 2);
  }
  g.moveTo(0.106, 0.012); g.ellipse(0.09, 0.012, 0.017, 0.031, 0, 0, Math.PI * 2);
  g.moveTo(-0.074, 0.012); g.ellipse(-0.09, 0.012, 0.017, 0.031, 0, 0, Math.PI * 2);
  g.rect(-0.052, 0.06, 0.104, 0.11);
  g.moveTo(0.13, 0.17); g.ellipse(0, 0.17, 0.13, 0.072, 0, 0, Math.PI * 2);   // bunched hood
  // body, clockwise like the ellipses so the non-zero fill has no holes
  g.moveTo(0.062, 0.135);
  g.bezierCurveTo(0.11, 0.14, 0.17, 0.152, 0.207, 0.182);
  g.bezierCurveTo(0.243, 0.207, 0.263, 0.248, 0.27, 0.3);
  g.bezierCurveTo(0.277, 0.36, 0.292, 0.42, 0.305, 0.48);
  g.lineTo(0.31, 1.1); g.lineTo(-0.31, 1.1); g.lineTo(-0.305, 0.48);
  g.bezierCurveTo(-0.292, 0.42, -0.277, 0.36, -0.27, 0.3);
  g.bezierCurveTo(-0.263, 0.248, -0.243, 0.207, -0.207, 0.182);
  g.bezierCurveTo(-0.17, 0.152, -0.11, 0.14, -0.062, 0.135);
  g.closePath();
}
function chairPath(g) {
  g.beginPath();
  g.moveTo(-0.27, 1.1);
  g.lineTo(-0.275, 0.47);
  g.bezierCurveTo(-0.278, 0.4, -0.25, 0.37, -0.19, 0.362);
  g.bezierCurveTo(-0.08, 0.352, 0.08, 0.352, 0.19, 0.362);
  g.bezierCurveTo(0.25, 0.37, 0.278, 0.4, 0.275, 0.47);
  g.lineTo(0.27, 1.1);
  g.closePath();
}
const BLUR_LEVELS = [0, 3, 6, 10, 16];             // in layer pixels
function bakeLayer(pathFn, fill, rims) {
  const w = Math.round(0.8 * PXM), h = Math.round(1.28 * PXM), ox = w / 2, oy = 0.16 * PXM;
  const make = () => { const c = makeCanvas(w, h), g = ctx2d(c); g.translate(ox, oy); g.scale(PXM, PXM); return [c, g]; };
  const [base, bg] = make();
  pathFn(bg); bg.fillStyle = fill; bg.fill('nonzero');
  // all rim lights in one layer: shape minus a shifted copy leaves a band on the lit side
  const rim = makeCanvas(w, h), rg = ctx2d(rim);
  rg.globalCompositeOperation = 'lighter';
  for (const [dx, dy, col, blur, a] of rims) {
    const [c, g] = make();
    pathFn(g); g.fillStyle = col; g.fill('nonzero');
    g.globalCompositeOperation = 'destination-out';
    g.translate(dx, dy); pathFn(g); g.fillStyle = '#000'; g.fill('nonzero');
    rg.filter = `blur(${blur}px)`;
    rg.globalAlpha = a;
    rg.drawImage(c, 0, 0);
  }
  const levels = BLUR_LEVELS.map(b => {
    if (!b) return { b, base, rim };
    const bb = makeCanvas(w, h), rb = makeCanvas(w, h);
    const g1 = ctx2d(bb); g1.filter = `blur(${b}px)`; g1.drawImage(base, 0, 0);
    const g2 = ctx2d(rb); g2.filter = `blur(${b}px)`; g2.drawImage(rim, 0, 0);
    return { b, base: bb, rim: rb };
  });
  return { levels, ox, oy };
}
const PERSON = bakeLayer(personPath, '#04060c', [[0.006, 0.0, COL.cyan, 2.5, 0.95], [-0.006, 0.0, COL.gold, 2.5, 0.85], [0, 0.007, '#c8f7ff', 3, 0.7]]);
const CHAIR = bakeLayer(chairPath, '#080b14', [[0.004, 0, COL.cyan, 2, 0.5], [-0.004, 0, COL.gold, 2, 0.45], [0, 0.005, '#9fdcff', 2, 0.35]]);

// ---------------------------------------------------------------- screens
const SCREEN = { w: 640, h: 370 };
const SCR = [0, 1, 2].map(() => { const c = makeCanvas(SCREEN.w, SCREEN.h); return { c, g: ctx2d(c) }; });
const SCR_SERIES = (() => {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const r = rng(40 + k), s = [];
    let p = 100;
    for (let i = 0; i < 64; i++) {
      const o = p;
      p += (r() - 0.48) * 5;
      // the centre screen hides a sweep -> shift -> gap near the end
      if (k === 1 && i === 44) p = o - 9;
      if (k === 1 && i > 44 && i < 49) p = o + 5.5;
      const hi = Math.max(o, p) + r() * 2.5, lo = Math.min(o, p) - r() * 2.5;
      s.push([o, hi, lo, p]);
    }
    out.push(s);
  }
  return out;
})();

function drawScreen(k, t, flick) {
  const { g } = SCR[k], w = SCREEN.w, h = SCREEN.h;
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#04122a'); bg.addColorStop(1, '#020611');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(0,229,255,0.10)'; g.lineWidth = 1;
  for (let x = 0; x < w; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y < h; y += 37) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  // header strip of abstract UI blocks (no text)
  g.fillStyle = 'rgba(0,229,255,0.22)'; g.fillRect(14, 12, 90, 10);
  g.fillStyle = 'rgba(255,195,0,0.35)'; g.fillRect(112, 12, 40, 10);
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(w - 120, 12, 100, 10);
  const ser = SCR_SERIES[k];
  const shift = (t * 1.6) % 1;
  const n = k === 1 ? 46 : 40, x0 = 18, x1 = k === 1 ? w - 18 : w - 140;
  const vis = ser.slice(ser.length - n - 1);
  let lo = Infinity, hi = -Infinity;
  for (const c of vis) { lo = Math.min(lo, c[2]); hi = Math.max(hi, c[1]); }
  const yv = p => 44 + (hi - p) / (hi - lo) * (h - 100);
  const cw = (x1 - x0) / n;
  if (k === 0) {
    // area chart
    g.beginPath();
    vis.forEach((c, i) => { const x = x0 + i * cw; i ? g.lineTo(x, yv(c[3])) : g.moveTo(x, yv(c[3])); });
    const lastX = x0 + (vis.length - 1) * cw;
    g.strokeStyle = COL.cyan; g.lineWidth = 3; g.stroke();
    g.lineTo(lastX, h - 40); g.lineTo(x0, h - 40); g.closePath();
    const ag = g.createLinearGradient(0, 40, 0, h - 40);
    ag.addColorStop(0, 'rgba(0,229,255,0.35)'); ag.addColorStop(1, 'rgba(0,229,255,0)');
    g.fillStyle = ag; g.fill();
  } else {
    vis.forEach((c, i) => {
      const live = i === vis.length - 1;
      let [o, hh, ll, cl] = c;
      if (live) cl = o + Math.sin(t * 7 + k) * 2.2;
      const x = x0 + i * cw + cw / 2;
      const up = cl >= o;
      const col = up ? COL.cyan : COL.gold;
      g.strokeStyle = col; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x, yv(hh)); g.lineTo(x, yv(ll)); g.stroke();
      g.fillStyle = col;
      const yt = yv(Math.max(o, cl)), yb = yv(Math.min(o, cl));
      g.fillRect(x - cw * 0.32, yt, cw * 0.64, Math.max(2, yb - yt));
    });
    if (k === 1) {
      // dashed liquidity line and a small gold zone, like the setup to come
      g.setLineDash([8, 6]); g.strokeStyle = 'rgba(0,229,255,0.8)'; g.lineWidth = 2;
      const ly = yv(Math.min(...vis.slice(20, 38).map(c => c[2])) - 0.3);
      g.beginPath(); g.moveTo(x0 + 18 * cw, ly); g.lineTo(x1, ly); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,195,0,0.22)';
      g.fillRect(x0 + 40 * cw, yv(vis[44][1]) - 2, 6 * cw, 14);
    }
  }
  // volume bars
  vis.forEach((c, i) => {
    const x = x0 + i * cw, v = 6 + hash(i * 13 + k) * 26;
    g.fillStyle = c[3] >= c[0] ? 'rgba(0,229,255,0.35)' : 'rgba(255,195,0,0.35)';
    g.fillRect(x + 1, h - 12 - v, cw - 2, v);
  });
  if (k !== 1) {
    // side panel: depth bars
    for (let i = 0; i < 12; i++) {
      const y = 50 + i * 24, v = 20 + hash(i * 7 + k * 3 + Math.floor(t * 4)) * 90;
      g.fillStyle = i < 6 ? 'rgba(255,59,92,0.35)' : 'rgba(0,255,136,0.35)';
      g.fillRect(w - 128 + (110 - v), y, v, 16);
    }
  }
  // scanline sheen
  const sh = g.createLinearGradient(0, 0, w, h);
  sh.addColorStop(0, 'rgba(255,255,255,0.06)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,0.03)');
  g.fillStyle = sh; g.fillRect(0, 0, w, h);
  if (flick < 1) { g.fillStyle = `rgba(0,0,0,${1 - flick})`; g.fillRect(0, 0, w, h); }
}

// Monitor k: 0 left, 1 centre, 2 right. Returns its four projected corners.
function monitorQuad(k) {
  const z = ROOM.monZ, y0 = 1.13, y1 = 1.51;
  if (k === 1) return [[-0.33, y0, z], [0.33, y0, z], [0.33, y1, z], [-0.33, y1, z]];
  const s = k === 0 ? -1 : 1, a = 28 * Math.PI / 180, w = 0.62;
  const xi = s * 0.36, xo = s * (0.36 + w * Math.cos(a)), zo = z - w * Math.sin(a);
  return k === 0 ? [[xo, y0, zo], [xi, y0, z], [xi, y1, z], [xo, y1, zo]] : [[xi, y0, z], [xo, y0, zo], [xo, y1, zo], [xi, y1, z]];
}

function drawMonitor(ctx, cam, k, flick) {
  const q = monitorQuad(k);
  const bez = 0.014;
  // bezel: slightly larger quad behind
  const P = q.map(p => rp(cam, p[0], p[1], p[2]));
  const grow = (pts, d) => {
    const c = pts.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4], [0, 0]);
    return pts.map(p => [c[0] + (p[0] - c[0]) * (1 + d), c[1] + (p[1] - c[1]) * (1 + d)]);
  };
  const B = grow(P, bez * 2.6);
  ctx.beginPath(); B.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
  ctx.fillStyle = '#05070c'; ctx.fill();
  ctx.strokeStyle = 'rgba(160,220,255,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();
  // screen image, warped strip by strip (exact for a plane rotated about the vertical axis)
  const src = SCR[k].c, n = k === 1 ? 1 : 28;
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n;
    const L = (u, row) => { const a = q[row === 0 ? 0 : 3], b = q[row === 0 ? 1 : 2]; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; };
    const b0 = rp(cam, ...L(u0, 0)), t0 = rp(cam, ...L(u0, 1)), b1 = rp(cam, ...L(u1, 0)), t1 = rp(cam, ...L(u1, 1));
    const x = Math.min(b0[0], t0[0]), xw = Math.max(b1[0], t1[0]) - x;
    const y = (t0[1] + t1[1]) / 2, yh = (b0[1] + b1[1]) / 2 - y;
    if (xw <= 0) continue;
    ctx.drawImage(src, u0 * SCREEN.w, 0, (u1 - u0) * SCREEN.w + 0.6, SCREEN.h, x, y, xw + 0.6, yh);
  }
  // glass sheen
  ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
  const g = ctx.createLinearGradient(P[3][0], P[3][1], P[1][0], P[1][1]);
  g.addColorStop(0, `rgba(255,255,255,${0.07 * flick})`); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = g; ctx.fill();
  return P;
}

// ---------------------------------------------------------------- the scene
function scene1(ctx, t) {
  const cam = roomCam(t);
  // screens power on with the opening hit, then a light flicker
  const on = t < 0.02 ? 0.08 : clamp(0.08 + 0.92 * easeOutCubic((t - 0.02) / 0.22) + 0.25 * pulse(t, 0.06, 0.05), 0, 1.25);
  const flick = on * clamp(0.93 + 0.07 * noise1(t * 11, 4) - 0.32 * pulse(t, 1.12, 0.05) - 0.22 * pulse(t, 3.38, 0.05) - 0.15 * pulse(t, 0.42, 0.04), 0.5, 1.05);
  // sky + city through the window (horizon at eye level; tiny parallax)
  const sk = SKYLINE, sScale = 1.0 + 0.04 * (cam.z + 0.75);
  ctx.fillStyle = '#02030a'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2 - cam.x * 30, cam.cy + 40 - (cam.y - 1.6) * 60);
  ctx.scale(sScale, sScale);
  ctx.drawImage(sk.img, -sk.img.width / 2, -sk.hz);
  ctx.restore();
  // blinking aircraft lights on the towers
  for (let i = 0; i < 6; i++) {
    const on = Math.sin(t * 5 + i * 2.1) > 0.6;
    if (!on) continue;
    const x = W / 2 + (hash(i * 3) - 0.5) * 900 * sScale, y = cam.cy - 80 - hash(i * 5) * 260;
    drawDot(ctx, x, y, 7, COL.red, 0.9, 0.5);
  }
  // back wall with the window opening
  const wz = ROOM.wallZ, wn = ROOM.win;
  const a = rp(cam, wn.x0, wn.y1, wz), b = rp(cam, wn.x1, wn.y0, wz);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.rect(b[0], a[1], a[0] - b[0], b[1] - a[1]);             // reversed winding = hole
  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, '#020308'); wall.addColorStop(0.5, '#04060d'); wall.addColorStop(1, '#010205');
  ctx.fillStyle = wall;
  ctx.fill('evenodd');
  ctx.restore();
  // window frame: mullions and transom
  ctx.fillStyle = '#05070e';
  for (const mx of [-0.67, 0.67]) {
    const m0 = rp(cam, mx - 0.03, wn.y1, wz), m1 = rp(cam, mx + 0.03, wn.y0, wz);
    ctx.fillRect(m0[0], m0[1], m1[0] - m0[0], m1[1] - m0[1]);
  }
  const tr0 = rp(cam, wn.x0, 2.08, wz), tr1 = rp(cam, wn.x1, 2.03, wz);
  ctx.fillRect(tr0[0], tr0[1], tr1[0] - tr0[0], tr1[1] - tr0[1]);
  ctx.strokeStyle = 'rgba(120,200,255,0.16)'; ctx.lineWidth = 2;
  ctx.strokeRect(b[0] - 1, a[1] - 1, a[0] - b[0] + 2, b[1] - a[1] + 2);
  // glass reflections
  ctx.save();
  ctx.beginPath(); ctx.rect(b[0], a[1], a[0] - b[0], b[1] - a[1]); ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const x = lerp(b[0], a[0], 0.15 + i * 0.32);
    const g = ctx.createLinearGradient(x - 120, 0, x + 120, 0);
    g.addColorStop(0, 'rgba(160,200,255,0)'); g.addColorStop(0.5, 'rgba(160,200,255,0.05)'); g.addColorStop(1, 'rgba(160,200,255,0)');
    ctx.fillStyle = g;
    ctx.save(); ctx.translate(x, (a[1] + b[1]) / 2); ctx.rotate(0.35); ctx.fillRect(-120, -900, 240, 1800); ctx.restore();
  }
  ctx.restore();
  // light spill from the screens on wall and window
  for (const [k, col, X] of [[0, COL.cyan, -0.7], [1, '#7fdcff', 0], [2, COL.gold, 0.7]]) {
    const p = rp(cam, X, 1.35, wz - 0.2);
    drawDot(ctx, p[0], p[1], 1.25 * p[2], col, 0.32 * flick);
  }
  // desk: dark lacquer catching the screens' light
  {
    const d0 = 2.45, d1 = 3.62;
    const q = [rp(cam, -1.5, 0.74, d0), rp(cam, 1.5, 0.74, d0), rp(cam, 1.5, 0.74, d1), rp(cam, -1.5, 0.74, d1)];
    ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    const g = ctx.createLinearGradient(0, q[2][1], 0, q[0][1]);
    g.addColorStop(0, '#0a1122'); g.addColorStop(1, '#020307');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (const [X, col] of [[-0.62, COL.cyan], [0, '#7fd8ff'], [0.62, COL.gold]]) {   // soft reflections under each screen
      const r0 = rp(cam, X, 0.74, 3.2), r1 = rp(cam, X, 0.74, 2.7);
      const cxr = (r0[0] + r1[0]) / 2, cyr = (r0[1] + r1[1]) / 2;
      ctx.save();
      ctx.translate(cxr, cyr);
      ctx.scale(1, Math.max(0.15, (r1[1] - r0[1]) / (0.6 * r0[2])));
      drawDot(ctx, 0, 0, 0.32 * r0[2], col, 0.2 * flick);
      ctx.restore();
    }
    ctx.restore();
    const e0 = rp(cam, -1.5, 0.74, d0), e1 = rp(cam, 1.5, 0.74, d0), e2 = rp(cam, -1.5, 0.70, d0);
    ctx.fillStyle = '#010205'; ctx.fillRect(e0[0], e0[1], e1[0] - e0[0], Math.max(3, e2[1] - e0[1]));
    ctx.fillStyle = rgba(COL.cyan, 0.4 * flick);                       // LED strip under the edge
    ctx.fillRect(e0[0], e2[1] - 2, e1[0] - e0[0], 2.5);
  }
  // monitors and stands
  for (const k of [0, 1, 2]) drawScreen(k, t, flick);
  for (const [X, Z] of [[-0.62, 3.2], [0, 3.36], [0.62, 3.2]]) {
    const s0 = rp(cam, X - 0.025, 1.13, Z), s1 = rp(cam, X + 0.025, 0.74, Z);
    ctx.fillStyle = '#06080f'; ctx.fillRect(s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1]);
    const f0 = rp(cam, X - 0.13, 0.745, Z - 0.05), f1 = rp(cam, X + 0.13, 0.735, Z + 0.08);
    ctx.fillRect(f0[0], f1[1], f1[0] - f0[0], Math.max(3, f0[1] - f1[1]));
  }
  for (const k of [0, 2, 1]) drawMonitor(ctx, cam, k, flick);
  // screen glow around the monitors
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [X, col] of [[-0.62, COL.cyan], [0, '#9fe8ff'], [0.62, COL.gold]]) {
    const p = rp(cam, X, 1.32, ROOM.monZ - 0.1);
    drawDot(ctx, p[0], p[1], 0.75 * p[2], col, 0.28 * flick);
  }
  // volumetric haze from the screens toward the room
  const c = rp(cam, 0, 1.32, ROOM.monZ);
  const hz = ctx.createRadialGradient(c[0], c[1], 10, c[0], c[1], 1.6 * c[2]);
  hz.addColorStop(0, `rgba(120,220,255,${0.12 * flick})`); hz.addColorStop(1, 'rgba(120,220,255,0)');
  ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // dust in the light
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) {
    const X = (hash(i * 3) - 0.5) * 2.6, Z = 1.0 + hash(i * 5) * 2.2;
    const Y = 0.8 + ((hash(i * 7) * 1.3 + t * 0.04 * (0.5 + hash(i))) % 1.3);
    const p = rp(cam, X + Math.sin(t * 0.7 + i) * 0.03, Y, Z);
    if (Z - cam.z < 0.2) continue;
    const near = clamp(1 - Math.abs(Y - 1.3) / 0.6) * clamp(1 - Math.abs(X) / 1.4);
    drawDot(ctx, p[0], p[1], Math.max(1.2, 0.004 * p[2]), '#bfefff', 0.6 * near * flick, 0.4);
  }
  ctx.restore();
  // the trader: rim-lit silhouette, then the chair in front of them
  drawPersonLayer(ctx, cam, t, flick);
}

function drawPersonLayer(ctx, cam, t, flick) {
  const Z = ROOM.personZ;
  const [hx, hy] = ROOM.head;
  const blur = clamp((1.25 - (Z - cam.z)) * 12, 0, 12);  // the head defocuses when the camera gets close
  const draw = (layer, z) => {
    const pc = rp(cam, hx, hy, z), s = pc[2] / PXM;
    const want = blur / s;                                 // blur in layer pixels
    let lv = layer.levels[0];
    for (const l of layer.levels) if (Math.abs(l.b - want) < Math.abs(lv.b - want)) lv = l;
    const x = pc[0] - layer.ox * s, y = pc[1] - layer.oy * s;
    ctx.drawImage(lv.base, x, y, lv.base.width * s, lv.base.height * s);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = clamp(flick, 0, 1.2);
    ctx.drawImage(lv.rim, x, y, lv.rim.width * s, lv.rim.height * s);
    ctx.restore();
  };
  draw(PERSON, Z);
  draw(CHAIR, Z - 0.12);
}
