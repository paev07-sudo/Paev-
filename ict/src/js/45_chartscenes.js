// Scenes 3-9: the chart. Cameras per shot, overlays keyed to the voiceover cues.
const S = i => SC[i - 1];            // S(3) = [start, end] of scene 3

// Stop-loss icons under the equal lows: level (price) and x. Ordered from the highest level,
// which is the order the falling wick sets them off in.
const STOPS = [[98.95, 4.95], [98.75, 8.65], [98.5, 3.15], [98.25, 6.75], [98.0, 7.7], [97.75, 4.0], [97.5, 5.85]];
const STOP_POP = (() => {           // pop order: left to right
  const order = STOPS.map((s, i) => [s[1], i]).sort((a, b) => a[0] - b[0]).map(v => v[1]);
  const t = []; order.forEach((idx, k) => { t[idx] = CU.stops_pop[k]; });
  return t;
})();
const BSL_ICONS = [[0.55, 137.2], [1.45, 137.9], [4.45, 137.4], [5.45, 138.0]];

// The sweep path passes each stop level exactly when that stop goes off (cue times).
(() => {
  const P = PATHS[10];
  const i = P.findIndex(k => k[0] === CU.sweep_cross);
  const keys = STOPS.map((s, k) => [CU.stops_explode[k], s[0], k === 0 ? easeOutCubic : smooth]);
  P.splice(i + 1, 1, ...keys, [CU.sweep_low, 96.5, easeInCubic]);
})();

function labelSize(cam) { return clamp(56 - cam.dist * 0.34, 36, 48); }
// Labels fade out when the camera puts them in the headline or caption bands.
function safeA(y, x = W / 2) {
  return smooth(invlerp(300, 360, y)) * smooth(invlerp(1420, 1350, y)) * smooth(invlerp(40, 130, x)) * smooth(invlerp(W - 40, W - 130, x));
}

// ---------------------------------------------------------------- cameras
function chartShots() {
  const sh = [];
  // A key that frames the price band [lo, hi] inside the safe area (288..1440 px) at candle x.
  const fr = (t, x, lo, hi, yaw, pitch, extra = {}) =>
    Object.assign({ t, target: [x, PY((lo + hi) / 2), 0], yaw, pitch, dist: 3044 * (hi - lo) * 0.45 / 1100 }, extra);
  // scene 3: wide reveal, then the equal lows and their stops, then the SSL label
  sh.push({ a: S(3)[0], b: CU.s3_cut1, keys: [fr(S(3)[0], 4.6, 95, 139, -14, 7), fr(CU.s3_cut1, 4.8, 96.5, 137.5, -9, 5)] });
  sh.push({ a: CU.s3_cut1, b: CU.s3_cut1b, keys: [fr(CU.s3_cut1, 5.9, 95.5, 114, 11, 9), fr(CU.s3_cut1b, 5.9, 96, 112.5, 6, 7)] });
  sh.push({ a: CU.s3_cut1b, b: CU.s3_cut2, keys: [fr(CU.s3_cut1b, 6.2, 95.8, 108.5, -9, 7), fr(CU.s3_cut2, 6.0, 96, 108, -6, 6)] });
  sh.push({ a: CU.s3_cut2, b: S(3)[1], keys: [fr(CU.s3_cut2, 6.0, 95, 119, -5, 5), fr(S(3)[1], 6.4, 94.5, 121, -12, 3)] });
  // scene 4: medium, punch-in as the wick hits the line, drift back on the snap
  sh.push({ a: S(4)[0], b: S(4)[1], shake: [CU.sweep_cross, 0.16], keys: [
    fr(S(4)[0], 8.8, 93.5, 115, 12, 6), fr(CU.sweep_cross - 0.27, 9.1, 94, 113, 6, 4),
    Object.assign(fr(CU.sweep_cross + 0.04, 10.0, 94.5, 104, 5, 3), { e: easeOutExpo }),
    fr(S(4)[1], 9.8, 93.0, 108.5, 1, 3)] });
  // scene 5: tilt up with the impulse, cut on the break to a low angle
  sh.push({ a: S(5)[0], b: CU.mss_break, keys: [fr(S(5)[0], 10.0, 95.5, 117, -11, 9), fr(CU.mss_break, 10.9, 97.5, 125, -6, 2)] });
  sh.push({ a: CU.mss_break, b: S(5)[1], shake: [CU.mss_break, 0.1], keys: [
    fr(CU.mss_break, 11.0, 98.5, 125.5, 13, -4, { roll: -3 }), fr(S(5)[1], 11.2, 98, 127.5, 8, 0, { roll: 0 })] });
  // scene 6: the three impulse candles with their numbers, the gap band from the other side, the box
  sh.push({ a: S(6)[0], b: CU.s6_cut1, keys: [fr(S(6)[0], 11.6, 97.5, 128.5, 9, 5), fr(CU.s6_cut1, 11.8, 98.5, 128, 6, 4)] });
  sh.push({ a: CU.s6_cut1, b: CU.s6_cut1b, keys: [fr(CU.s6_cut1, 12.0, 100, 129.5, -8, 5), fr(CU.s6_cut1b, 12.0, 101, 129, -5, 4)] });
  sh.push({ a: CU.s6_cut1b, b: CU.s6_cut2, keys: [fr(CU.s6_cut1b, 12.2, 103, 119, 12, 6), fr(CU.s6_cut2, 12.2, 104, 118, 9, 5)] });
  sh.push({ a: CU.s6_cut2, b: S(6)[1], keys: [fr(CU.s6_cut2, 11.9, 99.5, 128, 4, 3), fr(S(6)[1], 12.0, 100.5, 127, -2, 3)] });
  // scene 7: the box extends, price comes back into it
  sh.push({ a: S(7)[0], b: CU.s7_cut, keys: [fr(S(7)[0], 13.4, 103.5, 127, 9, 4), fr(CU.s7_cut, 13.6, 104, 126, 6, 4)] });
  sh.push({ a: CU.s7_cut, b: S(7)[1], keys: [fr(CU.s7_cut, 14.2, 104.5, 123.5, -7, 5), fr(S(7)[1], 14.4, 105, 121.5, -3, 3)] });
  // scene 8: pull back to the whole setup, then the full chart
  sh.push({ a: S(8)[0], b: CU.s8_cut, keys: [fr(S(8)[0], 13.6, 101, 120, 5, 4), fr(CU.s8_cut, 10.2, 92.5, 139, 0, 3)] });
  sh.push({ a: CU.s8_cut, b: CU.s8_cut2, keys: [fr(CU.s8_cut, 9.4, 91.5, 142, -5, 3), fr(CU.s8_cut2, 9.4, 92.5, 140.5, 1, 2)] });
  sh.push({ a: CU.s8_cut2, b: S(8)[1], keys: [fr(CU.s8_cut2, 4.6, 124, 146, 6, -2), fr(S(8)[1], 4.4, 125, 145, 3, -1)] });
  // scene 9: follow the rally, cut wide on the target hit
  sh.push({ a: S(9)[0], b: CU.tp_hit, keys: [fr(S(9)[0], 16.0, 103.5, 129, -9, 3),
    Object.assign(fr(CU.tp_hit, 16.8, 115, 141, -4, -2), { e: easeInCubic })] });
  sh.push({ a: CU.tp_hit, b: S(9)[1], shake: [CU.tp_hit, 0.3], keys: [fr(CU.tp_hit, 9.4, 91.5, 142, 6, 3), fr(S(9)[1], 9.4, 90.5, 143.5, 0, 4)] });
  return sh;
}
const SHOTS = chartShots();

function shotAt(tc) {
  for (const s of SHOTS) if (tc >= s.a && tc < s.b) return s;
  return tc < SHOTS[0].a ? SHOTS[0] : SHOTS[SHOTS.length - 1];
}

function chartCam(t, shot) {
  const tt = clamp(t, shot.a, shot.b - 1e-4);
  const keys = shot.keys.map(k => Object.assign({}, k));
  // gentle hand-held drift on every shot
  const drift = shakeOffset(t, 0.06, 3, 0.7);
  let shake = [0, 0, 0];
  if (shot.shake) {
    const [ts, amp] = shot.shake;
    const env = t >= ts ? Math.exp(-(t - ts) / 0.22) : 0;
    shake = [noise1(t * 13, 9) * amp * env * 2, noise1(t * 13, 13) * amp * env * 2, 0];
  }
  const cam = camAt(keys, tt);
  const tgt = cam.target.map((v, i) => v + drift[i] + shake[i]);
  // rebuild with the offset target (camAt already interpolated every parameter)
  return new Cam({ target: tgt, yaw: camParam(keys, tt, 'yaw'), pitch: camParam(keys, tt, 'pitch'),
                   dist: cam.dist, fov: 35, roll: camParam(keys, tt, 'roll'), cy: 864 });
}
function camParam(keys, t, name) {
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i].t && t <= keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; break; }
  const u = a === b ? 0 : (b.e || easeInOut)(invlerp(a.t, b.t, t));
  return lerp(a[name] || 0, b[name] || 0, u);
}

// ---------------------------------------------------------------- overlays
function fvgRight(t) { return lerp(13.45, 16.6, easeInOut(invlerp(S(7)[0] + 0.1, S(7)[0] + 1.0, t))); }

function chartOverlaysBack(ctx, cam, t) {
  // risk / reward zones (scene 8 on)
  const zr = easeOutCubic(invlerp(CU.risk_zone, CU.risk_zone + 0.5, t));
  const zg = easeOutCubic(invlerp(CU.reward_zone, CU.reward_zone + 0.5, t));
  const after = t > CU.tp_hit ? lerp(1, 0.55, invlerp(CU.tp_hit, CU.tp_hit + 0.8, t)) : 1;
  if (zr > 0) worldZone(ctx, cam, 14.55, lerp(14.55, 18.85, zr), LV.entry, LV.sl, COL.red, zr * after, { a0: 0.3, a1: 0.1 });
  if (zg > 0) worldZone(ctx, cam, 14.55, lerp(14.55, 18.85, zg), LV.entry, LV.tp, COL.green, zg * after, { a0: 0.26, a1: 0.07 });
  const fa = fvgAlpha(t);
  if (fa > 0) fvgBox(ctx, cam, 10.55, fvgRight(t), fa, 'back', fvgGlow(t));
}

function fvgAlpha(t) { return smooth(invlerp(CU.fvg_box, CU.fvg_box + 0.6, t)); }
function fvgGlow(t) {
  let g = 1 + 0.22 * Math.sin((t - CU.fvg_box) * Math.PI * 2 * 0.9);
  g += 1.6 * pulse(t, CU.fvg_contact, 0.35) + 0.5 * win(t, CU.fvg_contact, S(7)[1], 0.1, 0.3);
  return g;
}

function stopsState(t) {
  return STOPS.map(([lv, x], k) => {
    const tp = STOP_POP[k], te = CU.stops_explode[k];
    return { lv, x, k, scale: t < te ? spring(t, tp, 4.5, 0.38) : 0, te };
  });
}

function chartOverlaysFront(ctx, cam, t) {
  const pre8 = t < S(8)[0] ? 1 : lerp(1, 0.3, invlerp(S(8)[0], S(8)[0] + 0.5, t));
  const fa = fvgAlpha(t);
  if (fa > 0) fvgBox(ctx, cam, 10.55, fvgRight(t), fa, 'front', fvgGlow(t));
  // equal lows: markers on the two lows
  const eq = win(t, CU.ssl_draw[0] - 0.05, S(4)[0], 0.15, 0.4);
  if (eq > 0) {
    for (const [x, tw] of [[3, CU.ssl_draw[0]], [7, wordAt(2, 1).s]]) {
      const p = cam.project([x, PY(100), -0.4]);
      const pl = pulse(t, tw, 0.5);
      ctx.save();
      ctx.strokeStyle = rgba(COL.cyan, 0.9 * eq);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p[0], p[1], (0.2 + 0.28 * (1 - pl)) * p[3], 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      drawDot(ctx, p[0], p[1], 0.42 * p[3], COL.cyan, 0.5 * eq + 0.5 * pl);
    }
  }
  // sell-side liquidity line
  const sp = easeInOut(invlerp(CU.ssl_draw[0], CU.ssl_draw[1], t));
  const crossGlow = 1 + 2.5 * pulse(t, CU.sweep_cross, 0.4);
  worldLine(ctx, cam, 2.3, 11.1, LV.ssl, COL.cyan, { progress: sp, dash: [0.3, 0.17], width: 0.06, alpha: pre8 * (t < S(8)[0] ? 1 : 0.9), glow: crossGlow });
  // stop icons (pop in scene 3, go off in scene 4)
  for (const s of stopsState(t)) {
    const p = cam.project([s.x, PY(s.lv), -0.5]);
    stopIcon(ctx, p[0], p[1], 0.5 * p[3], COL.red, 1, s.scale);
    sparks(ctx, cam, [s.x, PY(s.lv), -0.5], t, s.te, 100 + s.k, { color: '#ff5a3c', n: 24, speed: 2.8, ring: 0.9 });
  }
  // the wick crossing the line: impact flash
  if (t >= CU.sweep_cross && t < CU.sweep_cross + 0.6) {
    const p = cam.project([10, PY(LV.ssl), -0.4]);
    const u = (t - CU.sweep_cross) / 0.6;
    drawDot(ctx, p[0], p[1], (0.8 + 3 * u) * p[3], COL.cyan, 0.9 * (1 - u));
    drawDot(ctx, p[0], p[1], 0.6 * p[3], '#ffffff', 1 - u);
  }
  // market structure shift line
  const mp = easeInOut(invlerp(CU.mss_line[0], CU.mss_line[1], t));
  const brk = pulse(t, CU.mss_break, 0.45);
  const mssA = t < S(6)[0] ? 1 : t < S(8)[0] ? lerp(1, 0.4, invlerp(S(6)[0], S(6)[0] + 0.4, t)) : lerp(0.4, 0.22, invlerp(S(8)[0], S(8)[0] + 0.5, t));
  worldLine(ctx, cam, 7.65, 12.9, LV.mss, '#ffffff', { progress: mp, width: 0.05, alpha: 0.92 * mssA, glow: 1 + 2 * brk });
  if (mp > 0 && t < CU.mss_line[1] + 0.8) {
    const p = cam.project([8, PY(111), -0.4]);
    drawDot(ctx, p[0], p[1], 0.5 * p[3], '#ffffff', 0.8 * win(t, CU.mss_line[0], CU.mss_line[1] + 0.8, 0.1, 0.5));
  }
  if (t >= CU.mss_break && t < CU.mss_break + 0.9) {
    const p = cam.project([12, PY(LV.mss), -0.5]);
    const u = (t - CU.mss_break) / 0.9;
    drawDot(ctx, p[0], p[1], (0.6 + 2.6 * easeOutCubic(u)) * p[3], '#ffffff', 0.85 * (1 - u));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba('#ffffff', 0.9 * (1 - u));
    ctx.lineWidth = 4 * (1 - u) + 1;
    ctx.beginPath(); ctx.arc(p[0], p[1], easeOutCubic(u) * 2.2 * p[3], 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  // scene 6: candle 1 high and candle 3 low
  const s6a = win(t, CU.high1 - 0.02, S(7)[0] + 0.3, 0.05, 0.3);
  if (s6a > 0) {
    worldLine(ctx, cam, 10.6, 13.45, LV.fvgLo, COL.gold, { progress: easeOutCubic(invlerp(CU.high1, CU.high1 + 0.4, t)), width: 0.04, dash: [0.16, 0.1], alpha: s6a });
    worldLine(ctx, cam, 13.45, 10.6, LV.fvgHi, COL.gold, { progress: easeOutCubic(invlerp(CU.low3, CU.low3 + 0.4, t)), width: 0.04, dash: [0.16, 0.1], alpha: s6a });
  }
  // the gap between them: a bracket that pulses on "don't overlap"
  const ov = win(t, CU.overlap[0], CU.fvg_box + 0.5, 0.1, 0.4);
  if (ov > 0) {
    const x = 13.85;
    const a = cam.project([x, PY(LV.fvgLo), -0.5]), b = cam.project([x, PY(LV.fvgHi), -0.5]);
    const w = 0.15 * a[3];
    ctx.save();
    ctx.strokeStyle = rgba(COL.gold, ov);
    ctx.lineWidth = 3.5;
    ctx.shadowColor = COL.gold; ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(a[0] - w, a[1]); ctx.lineTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0] - w, b[1]);
    ctx.stroke();
    ctx.restore();
    const pl = 0.5 + 0.5 * Math.sin((t - CU.overlap[0]) * 12);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const q = [[10.6, PY(LV.fvgLo), -0.45], [13.45, PY(LV.fvgLo), -0.45], [13.45, PY(LV.fvgHi), -0.45], [10.6, PY(LV.fvgHi), -0.45]].map(p => cam.project(p));
    facePath(ctx, q);
    ctx.fillStyle = rgba(COL.gold, 0.12 * ov * pl * (1 - fvgAlpha(t)));
    ctx.fill();
    ctx.restore();
  }
  // entry line inside the box
  const ep = easeOutCubic(invlerp(CU.fvg_contact, CU.fvg_contact + 0.45, t));
  const eFade = t > CU.tp_hit ? lerp(1, 0.4, invlerp(CU.tp_hit + 0.6, CU.tp_hit + 1.4, t)) : 1;
  worldLine(ctx, cam, 10.6, 16.6, LV.entry, '#ffffff', { progress: ep, width: 0.035, alpha: 0.95 * eFade, z: -0.62 });
  // stop loss and target lines
  const slp = easeOutCubic(invlerp(CU.sl_line, CU.sl_line + 0.45, t));
  worldLine(ctx, cam, 9.3, 18.85, LV.sl, COL.red, { progress: slp, width: 0.07 });
  const tpp = easeOutCubic(invlerp(CU.tp_line, CU.tp_line + 0.5, t));
  const hit = t >= CU.tp_hit;
  const tpCol = hit ? COL.gold : COL.green;
  const burst = pulse(t, CU.tp_hit, 0.5);
  worldLine(ctx, cam, 0.3, 18.85, LV.tp, tpCol, { progress: tpp, width: 0.07 * (1 + 1.5 * burst), glow: 1 + 3 * burst + (hit ? 0.8 : 0) });
  // equal highs pulse
  const eh = win(t, CU.eqh_pulse[0], CU.eqh_pulse[1] + 0.6, 0.1, 0.4);
  if (eh > 0) for (const x of [1, 5]) {
    const p = cam.project([x, PY(136), -0.4]);
    drawDot(ctx, p[0], p[1], 0.9 * p[3] * (1 + 0.3 * Math.sin(t * 14)), COL.green, 0.8 * eh);
  }
  // buy-side liquidity icons above the highs
  for (let k = 0; k < BSL_ICONS.length; k++) {
    const [x, lv] = BSL_ICONS[k];
    const te = CU.tp_hit + 0.03 + k * 0.05;
    const sc = t < te ? spring(t, CU.bsl_icons + k * 0.07, 4.5, 0.4) : 0;
    const p = cam.project([x, PY(lv), -0.5]);
    stopIcon(ctx, p[0], p[1], 0.62 * p[3], COL.cyan, 1, sc);
    sparks(ctx, cam, [x, PY(lv), -0.5], t, te, 300 + k, { color: COL.cyan, n: 20, speed: 3.5 });
  }
  // target hit: shockwave + gold sparks
  if (hit) {
    sparks(ctx, cam, [18, PY(LV.tp), -0.6], t, CU.tp_hit, 777, { color: COL.gold, n: 46, speed: 6.5, gravity: -4, ring: 2.4 });
    sparks(ctx, cam, [18, PY(LV.tp), -0.6], t, CU.tp_hit + 0.12, 778, { color: '#ffffff', n: 22, speed: 4.5, gravity: -4, ring: 1.4 });
  }
}

function chartLabels(ctx, cam, t) {
  const L = labelSize(cam);
  const at = (x, p, dx = 0, dy = 0) => { const v = cam.project([x, PY(p), -0.6]); return [v[0] + dx, v[1] + dy]; };
  const recap = i => (t >= CU.recap[i] ? win(t, CU.recap[i], S(9)[1], 0.08, 0.3) : 0);
  const label = (xy, text, col, a, sc, size = L) => glassLabel(ctx, xy[0], xy[1], text, col, size, a * safeA(xy[1], xy[0]), sc);
  const until = (b) => (t < b ? 1 : 1 - invlerp(b, b + 0.3, t));
  // SSL: above the line, between the two equal lows
  label(at(5.3, 101.7), 'SSL', COL.cyan, win(t, CU.ssl_label, 1e9, 0.12) * until(S(5)[0]), spring(t, CU.ssl_label, 4, 0.45));
  // SWEEP: under the wick tip
  {
    const a = Math.max(win(t, CU.sweep_label, 1e9, 0.1) * until(S(6)[0]), recap(0));
    const sc = t < S(9)[0] ? spring(t, CU.sweep_label, 4.5, 0.4) : spring(t, CU.recap[0], 4.5, 0.4);
    label(at(10, 96.5, 0, L * 1.45), 'SWEEP', COL.cyan, a, sc);
  }
  // MSS: above the broken swing high
  {
    const a = Math.max(win(t, CU.mss_break + 0.05, 1e9, 0.1) * until(S(6)[0]), recap(1));
    const sc = t < S(9)[0] ? spring(t, CU.mss_break + 0.05, 4.5, 0.4) : spring(t, CU.recap[1], 4.5, 0.4);
    label(at(9.6, LV.mss, 0, -L * 1.2), 'MSS', '#ffffff', a, sc);
  }
  // 1 2 3 above the impulse candles (and above the gap)
  const nA = win(t, CU.num1, S(7)[0] + 0.25, 0.05, 0.25);
  if (nA > 0) {
    for (const [i, tn] of [[11, CU.num1], [12, CU.num2], [13, CU.num3]]) {
      const st = candleAt(i, t);
      if (!st) continue;
      const [x, y] = at(i, Math.max(st.h, LV.fvgHi) + 1.6, 0, -L * 0.6);
      numberBubble(ctx, x, y, i - 10, L * 0.72, nA * safeA(y), spring(t, tn, 4.5, 0.4));
    }
  }
  // FVG
  {
    const a = Math.max(win(t, CU.fvg_label, 1e9, 0.12) * (t < CU.tp_hit ? 1 : 0), recap(2));
    const sc = t < S(9)[0] ? spring(t, CU.fvg_label, 4.5, 0.4) : spring(t, CU.recap[2], 4.5, 0.4);
    // under the box, in the empty space between candle 2's body and the retrace candles
    label(at(13.65, LV.fvgLo, 0, L * 1.05), 'FVG', COL.gold, a, sc);
  }
  // ENTRY: on the entry line, in the empty part of the box
  {
    const a = win(t, CU.entry, 1e9, 0.1) * (t < CU.tp_hit + 0.6 ? 1 : 1 - invlerp(CU.tp_hit + 0.6, CU.tp_hit + 1.0, t));
    label(at(14.0, LV.entry), 'ENTRY', '#ffffff', a, spring(t, CU.entry, 4.5, 0.4), L * 0.92);
  }
  // SL: above the stop line
  label(at(12.6, LV.sl, 0, -L * 1.0), 'SL', COL.red, win(t, CU.sl_line + 0.25, 1e9, 0.12), spring(t, CU.sl_line + 0.25, 4.5, 0.4));
  // TP / BSL: above the target line, right of the equal highs
  {
    const hit = t >= CU.tp_hit;
    const sc = spring(t, CU.tp_line + 0.3, 4.5, 0.4) * (1 + 0.25 * pulse(t, CU.tp_hit, 0.3));
    label(at(7.0, LV.tp, 0, -L * 1.15), 'TP / BSL', hit ? COL.gold : COL.green, win(t, CU.tp_line + 0.3, 1e9, 0.12), sc);
  }
}

// Hourglass icon (scene 7), screen space, top right of the safe area.
function hourglass(ctx, t) {
  const a = win(t, CU.hourglass - 0.05, S(8)[0], 0.12, 0.25);
  if (a <= 0) return;
  const sc = spring(t, CU.hourglass, 3.5, 0.4);
  const x = 905, y = 395, r = 64 * sc;
  drawDot(ctx, x, y, r * 2.3, COL.gold, 0.3 * a);
  glassPill(ctx, x, y, 2 * r, 2 * r, { r, tint: COL.gold, edge: COL.gold, alpha: a });
  const flip = easeInOut(invlerp(CU.hourglass, CU.hourglass + 0.45, t));
  const u = clamp((t - CU.hourglass - 0.45) / (S(7)[1] - CU.hourglass - 0.45));   // sand drained
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI * (1 - flip));
  ctx.globalAlpha = a;
  const hw = r * 0.42, hh = r * 0.62;
  const glass = () => {
    ctx.beginPath();
    ctx.moveTo(-hw, -hh); ctx.lineTo(hw, -hh);
    ctx.bezierCurveTo(hw, -hh * 0.3, hw * 0.12, -hh * 0.12, hw * 0.12, 0);
    ctx.bezierCurveTo(hw * 0.12, hh * 0.12, hw, hh * 0.3, hw, hh);
    ctx.lineTo(-hw, hh);
    ctx.bezierCurveTo(-hw, hh * 0.3, -hw * 0.12, hh * 0.12, -hw * 0.12, 0);
    ctx.bezierCurveTo(-hw * 0.12, -hh * 0.12, -hw, -hh * 0.3, -hw, -hh);
    ctx.closePath();
  };
  // sand: top bulb drains, bottom fills (only once it is upright)
  ctx.save();
  glass(); ctx.clip();
  const top = (1 - u) * 0.85, bot = u * 0.85;
  ctx.fillStyle = COL.gold;
  ctx.shadowColor = COL.gold; ctx.shadowBlur = 10;
  ctx.fillRect(-hw, -hh * top * 0.9 - 2, 2 * hw, hh * top * 0.9 + 2);
  ctx.fillRect(-hw, hh - hh * bot * 0.95, 2 * hw, hh * bot * 0.95);
  if (flip >= 1 && u < 1) ctx.fillRect(-1.5, -hh * 0.05, 3, hh * 0.95);
  ctx.restore();
  glass();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  ctx.shadowColor = COL.gold; ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-hw * 1.25, -hh - 5, hw * 2.5, 5);
  ctx.fillRect(-hw * 1.25, hh, hw * 2.5, 5);
  ctx.restore();
}

// Speed lines during the rally (scene 9): streaks falling past the camera.
function speedLines(ctx, t) {
  const a = win(t, CU.rally[0] + 0.1, CU.tp_hit + 0.15, 0.25, 0.15);
  if (a <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const x = hash(i * 3 + 1) * W;
    const sp = 2600 + hash(i * 3 + 2) * 2600;
    const len = 120 + hash(i * 7) * 380;
    const y = ((hash(i * 5) * (H + len) + t * sp) % (H + len)) - len;
    const g = ctx.createLinearGradient(x, y, x, y + len);
    const c = hash(i * 11) < 0.7 ? '#ffffff' : COL.green;
    g.addColorStop(0, rgba(c, 0));
    g.addColorStop(1, rgba(c, 0.5 * a));
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5 + hash(i * 13) * 2.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
  }
  ctx.restore();
}

// Gold celebration particles rising after the hit.
function celebrate(ctx, t) {
  const tau = t - CU.tp_hit;
  if (tau < 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) {
    const t0 = hash(i * 17) * 1.8, life = 1.2 + hash(i * 19) * 1.0;
    const age = tau - t0;
    if (age < 0 || age > life) continue;
    const x = hash(i * 23) * W + Math.sin(age * 3 + i) * 30;
    const y = H * (0.75 - hash(i * 29) * 0.3) - age * (260 + hash(i * 31) * 360);
    const f = 1 - age / life;
    drawDot(ctx, x, y, 7 + hash(i * 37) * 12, hash(i * 41) < 0.75 ? COL.gold : '#ffffff', f * 0.9, 0.4);
  }
  ctx.restore();
}

function chartScene(ctx, t, tc) {
  const shot = shotAt(tc);
  const cam = chartCam(t, shot);
  drawSpace(ctx, cam, t, { gridY: PY(86) });
  drawDust(ctx, cam, t, cam.dist, { alpha: 0.8 });
  chartOverlaysBack(ctx, cam, t);
  drawCandles(ctx, cam, t, {
    glowFn: (i, st) => 1 + (i === 10 ? 1.5 * pulse(t, CU.sweep_cross, 0.6) : 0) + (i === 12 ? 1.5 * pulse(t, CU.mss_break, 0.6) : 0)
      + (i === 18 ? 2 * pulse(t, CU.tp_hit, 0.6) : 0),
  });
  chartOverlaysFront(ctx, cam, t);
  speedLines(ctx, t);
  computeFrost(SCN);
  chartLabels(ctx, cam, t);
  hourglass(ctx, t);
  celebrate(ctx, t);
}
