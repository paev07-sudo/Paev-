// The chart: 19 candles, levels, and how each candle forms over time. Plus the 3D candle,
// line, zone, box, icon and spark renderers.
//
// Structure (prices):  equal highs 136 (c1, c5) = buy-side liquidity / target
//                      equal lows 100 (c3, c7)  = sell-side liquidity
//                      swing high 111 (c8)      = the level the shift breaks
//                      c10 sweeps to 96.5 and closes back at 102
//                      c11-c13 displace up; c12 closes 117 > 111 (MSS)
//                      FVG = c11 high 108 .. c13 low 112, entry at its midpoint 110
//                      c14-c15 retrace into it (low 109.5), c16-c18 rally through 136
const OHLC = [
  [114, 125, 113, 124], [124, 136, 123, 133], [133, 134, 117, 118], [118, 119, 100, 103],
  [103, 120, 102, 119], [119, 136, 118, 132], [132, 133, 108, 109], [109, 109.5, 100, 103],
  [103, 111, 102.5, 110], [110, 110.5, 104.5, 105.5], [105.5, 106, 96.5, 102], [102, 108, 101.5, 107.5],
  [107.5, 118, 107, 117], [117, 122.5, 112, 122], [122, 122.5, 115, 116], [116, 116.5, 109.5, 111],
  [111, 120.5, 110.5, 120], [120, 128.5, 119, 128], [128, 137.5, 127, 136.5],
];
const LV = { eqh: 136, eql: 100, ssl: 99.55, mss: 111, fvgLo: 108, fvgHi: 112, entry: 110, sl: 95.5, tp: 136 };
const PY = p => (p - 115) * 0.45;
const BODY = 0.62, WICK = 0.075;

// Price paths of the candles that form on screen: [time, price, easing into this key]
const PATHS = (() => {
  const P = {};
  const s4 = SC[3][0];
  P[10] = [[s4 + 0.18, 105.5], [s4 + 0.65, 106.0, easeOutCubic], [CU.sweep_dive, 105.2, smooth],
           [CU.sweep_cross, LV.ssl, easeInCubic], [CU.sweep_low, 96.5, easeOutCubic],
           [CU.sweep_snap[0], 96.7, smooth], [CU.sweep_snap[1], 102.6, easeOutExpo], [CU.sweep_snap[1] + 0.25, 102.0, smooth]];
  P[11] = [[CU.c11[0], 102], [CU.c11[0] + 0.07, 101.5, smooth], [CU.c11[1] - 0.08, 108, easeOutCubic], [CU.c11[1], 107.5, smooth]];
  P[12] = [[CU.c12[0], 107.5], [CU.c12[0] + 0.06, 107.0, smooth], [CU.mss_break, LV.mss, easeInCubic],
           [CU.mss_break + 0.15, 118, easeOutCubic], [CU.c12[1], 117, smooth]];
  const c13 = Math.max(CU.c13[0], CU.c12[1] + 0.03);
  P[13] = [[c13, 117], [c13 + 0.14, 112, easeOutCubic], [CU.c13[1] - 0.2, 122.5, easeInOut], [CU.c13[1], 122, smooth]];
  P[14] = [[CU.c14[0], 122], [CU.c14[0] + 0.07, 122.5, smooth], [CU.c14[1] - 0.05, 115, easeInOut], [CU.c14[1], 116, smooth]];
  P[15] = [[CU.c15[0], 116], [CU.c15[0] + 0.06, 116.5, smooth], [CU.fvg_contact, LV.fvgHi, easeInOut],
           [CU.fvg_contact + 0.09, 109.5, easeOutCubic], [CU.fvg_contact + 0.26, 111, smooth]];
  const r0 = CU.rally[0], hit = CU.tp_hit;
  P[16] = [[r0, 111], [r0 + 0.05, 110.5, smooth], [r0 + 0.32, 120.5, easeInOut], [r0 + 0.37, 120, smooth]];
  P[17] = [[r0 + 0.39, 120], [r0 + 0.43, 119, smooth], [r0 + 0.72, 128.5, easeInOut], [r0 + 0.77, 128, smooth]];
  P[18] = [[r0 + 0.79, 128], [r0 + 0.83, 127, smooth], [hit, LV.tp, easeInCubic], [hit + 0.1, 137.5, easeOutCubic], [hit + 0.36, 136.5, smooth]];
  return P;
})();
const SPAWN = Object.fromEntries(Object.entries(PATHS).map(([k, v]) => [k, v[0][0]]));

// State of candle i at time t: null if not born yet, else {o, h, l, c, age}
function candleAt(i, t) {
  if (!PATHS[i]) {
    // the first ten build in when the chart first appears (after the vault flash)
    const t0 = SC[2][0] + 0.05 + i * 0.045;
    if (t < t0) return null;
    const u = easeOutCubic((t - t0) / 0.45);
    const [o, h, l, c] = OHLC[i];
    const cc = lerp(o, c, u);
    return { o, c: cc, h: Math.max(Math.max(o, cc), lerp(Math.max(o, c), h, u)), l: Math.min(Math.min(o, cc), lerp(Math.min(o, c), l, u)), age: t - t0 };
  }
  const P = PATHS[i];
  if (t < P[0][0]) return null;
  let price = P[P.length - 1][1], hi = P[0][1], lo = P[0][1];
  for (let k = 1; k < P.length; k++) {
    const [ta, pa] = P[k - 1], [tb, pb, ez] = P[k];
    if (t >= tb) { hi = Math.max(hi, pb); lo = Math.min(lo, pb); continue; }
    price = lerp(pa, pb, (ez || smooth)(invlerp(ta, tb, t)));
    hi = Math.max(hi, price); lo = Math.min(lo, price);
    return { o: P[0][1], c: price, h: hi, l: lo, age: t - P[0][0] };
  }
  const [o, h, l, c] = OHLC[i];
  return { o, c, h: Math.max(h, hi), l: Math.min(l, lo), age: t - P[0][0] };
}

// ---------------------------------------------------------------- 3D boxes
function boxFaces(x0, x1, y0, y1, z0, z1) {
  return [
    { n: [0, 0, -1], k: 'front', p: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]] },
    { n: [0, 0, 1], k: 'back', p: [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]] },
    { n: [-1, 0, 0], k: 'side', p: [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]] },
    { n: [1, 0, 0], k: 'side', p: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]] },
    { n: [0, 1, 0], k: 'top', p: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] },
    { n: [0, -1, 0], k: 'bottom', p: [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]] },
  ];
}
function facePath(ctx, q) {
  ctx.beginPath();
  ctx.moveTo(q[0][0], q[0][1]);
  for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]);
  ctx.closePath();
}
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

// Glossy neon-glass material for one face.
function shadeFace(ctx, f, q, col, o) {
  const a = o.alpha;
  facePath(ctx, q);
  if (f.k === 'front') {
    const top = mid(q[3], q[2]), bot = mid(q[0], q[1]);
    const g = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    g.addColorStop(0, mix(col, '#ffffff', 0.5, a));
    g.addColorStop(0.06, mix(col, '#ffffff', 0.12, a));
    g.addColorStop(0.45, mix(col, '#000000', 0.12, a));
    g.addColorStop(1, mix(col, '#000000', 0.55, a));
    ctx.fillStyle = g; ctx.fill();
    const l = mid(q[0], q[3]), r = mid(q[1], q[2]);
    const s = ctx.createLinearGradient(l[0], l[1], r[0], r[1]);
    s.addColorStop(0, `rgba(0,0,0,${0.32 * a})`);
    s.addColorStop(0.12, 'rgba(255,255,255,0)');
    s.addColorStop(0.2, `rgba(255,255,255,${0.5 * a * o.spec})`);
    s.addColorStop(0.3, 'rgba(255,255,255,0)');
    s.addColorStop(0.82, 'rgba(0,0,0,0)');
    s.addColorStop(0.9, `rgba(255,255,255,${0.14 * a * o.spec})`);
    s.addColorStop(1, `rgba(0,0,0,${0.36 * a})`);
    ctx.fillStyle = s; ctx.fill();
  } else if (f.k === 'side') {
    const top = mid(q[3], q[2]), bot = mid(q[0], q[1]);
    const g = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    g.addColorStop(0, mix(col, '#ffffff', 0.15, a));
    g.addColorStop(0.1, mix(col, '#000000', 0.42, a));
    g.addColorStop(1, mix(col, '#000000', 0.72, a));
    ctx.fillStyle = g; ctx.fill();
  } else if (f.k === 'top') {
    ctx.fillStyle = mix(col, '#ffffff', 0.62, a * 0.95); ctx.fill();
  } else if (f.k === 'bottom') {
    ctx.fillStyle = mix(col, '#000000', 0.65, a); ctx.fill();
  } else {
    ctx.fillStyle = mix(col, '#000000', 0.6, a); ctx.fill();
  }
  if (o.edge > 0) {
    ctx.strokeStyle = mix(col, '#ffffff', 0.72, a * o.edge);
    ctx.lineWidth = o.lw;
    ctx.stroke();
  }
}

function drawBox3D(ctx, cam, x0, x1, y0, y1, z0, z1, col, o) {
  const faces = boxFaces(x0, x1, y0, y1, z0, z1);
  for (const f of faces) {
    if (!cam.facing(f.n, f.p[0])) continue;
    const q = f.p.map(p => cam.project(p));
    if (q.some(v => v[2] < 0.2)) continue;
    shadeFace(ctx, f, q, col, o);
  }
}

// One candlestick. glow: extra neon aura (0..1+), alpha: overall opacity.
function drawCandle(ctx, cam, i, st, o = {}) {
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  if (!st || alpha <= 0.01) return;
  const up = st.c >= st.o;
  const col = o.color || (up ? COL.green : COL.red);
  const x = i;
  const grow = clamp(st.age / 0.16);
  const bw = BODY * lerp(0.4, 1, easeOutCubic(grow)), ww = WICK;
  let yb = PY(Math.min(st.o, st.c)), yt = PY(Math.max(st.o, st.c));
  if (yt - yb < 0.05) { const m = (yt + yb) / 2; yb = m - 0.025; yt = m + 0.025; }
  const c = cam.project([x, (yb + yt) / 2, 0]);
  const lw = clamp(c[3] * 0.022, 0.7, 2.2);
  // neon aura behind the body
  const top = cam.project([x, PY(st.h), 0]), bot = cam.project([x, PY(st.l), 0]);
  const pw = bw * c[3];
  const glow = (o.glow === undefined ? 1 : o.glow) * alpha;
  if (glow > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.2 * glow;
    const ytop = cam.project([x, yt, 0])[1], ybot = cam.project([x, yb, 0])[1];
    ctx.drawImage(softDot(col), c[0] - pw * 1.6, ytop - pw * 1.1, pw * 3.2, (ybot - ytop) + pw * 2.2);
    ctx.globalAlpha = 0.1 * glow;
    ctx.drawImage(softDot(col), c[0] - pw * 0.9, top[1] - pw * 0.6, pw * 1.8, (bot[1] - top[1]) + pw * 1.2);
    ctx.restore();
  }
  const mat = { alpha, edge: 0.75, lw, spec: 1 };
  drawBox3D(ctx, cam, x - ww / 2, x + ww / 2, PY(st.l), PY(st.h), -ww / 2, ww / 2, mixHex(col, '#ffffff', 0.25),
    { alpha: alpha * 0.95, edge: 0, lw, spec: 0.6 });
  drawBox3D(ctx, cam, x - bw / 2, x + bw / 2, yb, yt, -bw / 2, bw / 2, col, mat);
}

function drawCandles(ctx, cam, t, o = {}) {
  const list = [];
  for (let i = 0; i < OHLC.length; i++) {
    const st = candleAt(i, t);
    if (!st) continue;
    const d = cam.project([i, 0, 0])[2];
    list.push([d, i, st]);
  }
  list.sort((a, b) => b[0] - a[0]);
  for (const [, i, st] of list) {
    const a = o.alphaFn ? o.alphaFn(i, st) : 1;
    drawCandle(ctx, cam, i, st, { alpha: a, glow: o.glowFn ? o.glowFn(i, st) : 1 });
  }
}

// ---------------------------------------------------------------- overlays
// Horizontal world line at `price` from x0 to x1 (draw-on progress 0..1).
function worldLine(ctx, cam, x0, x1, price, color, o = {}) {
  const prog = o.progress === undefined ? 1 : o.progress, alpha = o.alpha === undefined ? 1 : o.alpha;
  if (prog <= 0 || alpha <= 0.01) return null;
  const z = o.z || -0.45;
  const xe = lerp(x0, x1, prog);
  const a = cam.project([x0, PY(price), z]), b = cam.project([xe, PY(price), z]);
  const k = (a[3] + b[3]) / 2;
  const w = (o.width || 0.05) * k;
  ctx.save();
  ctx.lineCap = 'round';
  if (o.dash) ctx.setLineDash(o.dash.map(d => d * k));
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(color, 0.22 * alpha * (o.glow || 1));
  ctx.lineWidth = w * 4.5;
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = Math.max(1.5, w);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.strokeStyle = rgba('#ffffff', 0.55 * alpha);
  ctx.lineWidth = Math.max(0.8, w * 0.35);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.restore();
  // bright head while drawing
  if (prog < 1) drawDot(ctx, b[0], b[1], w * 5, color, alpha);
  return { a, b };
}

// Flat translucent zone in the chart plane, behind the candles.
function worldZone(ctx, cam, x0, x1, p0, p1, color, alpha, o = {}) {
  if (alpha <= 0.01) return;
  const z = 0.75;
  const q = [[x0, PY(p0), z], [x1, PY(p0), z], [x1, PY(p1), z], [x0, PY(p1), z]].map(p => cam.project(p));
  facePath(ctx, q);
  const g = ctx.createLinearGradient(0, q[0][1], 0, q[2][1]);
  g.addColorStop(0, rgba(color, (o.a0 || 0.28) * alpha));
  g.addColorStop(1, rgba(color, (o.a1 || 0.08) * alpha));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.35 * alpha);
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// Gold FVG volume; part = 'back' (before candles) or 'front' (after).
function fvgBox(ctx, cam, x0, x1, alpha, part, glow = 1) {
  if (alpha <= 0.01) return;
  const y0 = PY(LV.fvgLo), y1 = PY(LV.fvgHi), z0 = -0.6, z1 = 0.6;
  const faces = boxFaces(x0, x1, y0, y1, z0, z1);
  ctx.save();
  for (const f of faces) {
    const facing = cam.facing(f.n, f.p[0]);
    if ((part === 'front') !== facing) continue;
    const q = f.p.map(p => cam.project(p));
    if (q.some(v => v[2] < 0.2)) continue;
    facePath(ctx, q);
    const base = f.k === 'front' ? 0.075 : f.k === 'back' ? 0.06 : 0.11;
    const top = mid(q[3], q[2]), bot = mid(q[0], q[1]);
    const g = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    g.addColorStop(0, rgba(COL.gold, Math.min(0.5, base * alpha * glow * 1.4)));
    g.addColorStop(1, rgba('#ff9d00', Math.min(0.4, base * alpha * glow * 0.9)));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgba(COL.gold, Math.min(1, 0.75 * alpha * (0.8 + 0.2 * glow)));
    ctx.lineWidth = clamp(q[0][3] * 0.028, 1.2, 3);
    ctx.stroke();
  }
  ctx.restore();
}

// Stop-loss icon: glowing octagon with a bar, as a billboard in world space.
function stopIcon(ctx, x, y, size, color, alpha, scale = 1) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  const r = size * scale / 2;
  drawDot(ctx, x, y, r * 3.2, color, 0.45 * alpha);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = Math.PI / 8 + k * Math.PI / 4;
    ctx[k ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 0, 0, 0, r * 1.1);
  g.addColorStop(0, mix(color, '#ffffff', 0.45));
  g.addColorStop(0.55, color);
  g.addColorStop(1, mix(color, '#000000', 0.4));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(-r * 0.5, -r * 0.13, r, r * 0.26, r * 0.1); ctx.fill();
  ctx.restore();
}

// Burst of sparks at world point p0, t0 = explosion time.
function sparks(ctx, cam, p0, t, t0, seed, o = {}) {
  const tau = t - t0;
  if (tau < 0 || tau > 1.4) return;
  const n = o.n || 26, col = o.color || COL.red;
  const r = rng(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  // flash ring
  const c = cam.project(p0);
  const ring = easeOutCubic(tau / 0.35);
  if (tau < 0.4) {
    ctx.strokeStyle = rgba('#ffffff', 0.8 * (1 - ring));
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(c[0], c[1], ring * (o.ring || 1.1) * c[3], 0, Math.PI * 2); ctx.stroke();
    drawDot(ctx, c[0], c[1], (0.9 + 1.5 * ring) * c[3] * (o.ring || 1.1) * 0.5, col, 0.9 * (1 - ring));
    drawDot(ctx, c[0], c[1], 0.5 * c[3], '#ffffff', 1 - ring);
  }
  for (let i = 0; i < n; i++) {
    const ang = r() * Math.PI * 2, sp = (o.speed || 3.2) * (0.4 + r()), life = 0.45 + r() * 0.55;
    const vz = (r() - 0.5) * sp * 0.6;
    if (tau > life) { r(); continue; }
    const g = o.gravity === undefined ? -7 : o.gravity;
    const pos = s => [p0[0] + Math.cos(ang) * sp * s, p0[1] + Math.sin(ang) * sp * s + 0.5 * g * s * s, p0[2] + vz * s];
    const a = cam.project(pos(tau)), b = cam.project(pos(Math.max(0, tau - 0.05)));
    const fade = 1 - tau / life;
    ctx.strokeStyle = mix(r() < 0.5 ? '#ffffff' : col, col, 1 - fade, fade);
    ctx.lineWidth = Math.max(1.2, 0.06 * a[3]) * (0.6 + 0.6 * fade);
    ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(a[0], a[1]); ctx.stroke();
  }
  ctx.restore();
}

// Numbered glass bubble (the 1-2-3 above the impulse candles).
function numberBubble(ctx, x, y, n, size, alpha, scale) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  const r = size * scale;
  drawDot(ctx, x, y, r * 2.4, COL.gold, 0.35 * alpha);
  glassPill(ctx, x, y, 2 * r, 2 * r, { r, tint: COL.gold, edge: COL.gold, alpha });
  ctx.save();
  ctx.globalAlpha = alpha;
  setFont(ctx, r * 1.15, 800);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = rgba(COL.gold, 0.9); ctx.shadowBlur = 14;
  ctx.fillStyle = '#fff3cc';
  ctx.fillText(String(n), 0 + x, y + r * 0.06);
  ctx.restore();
}
