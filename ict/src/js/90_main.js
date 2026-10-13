// Frame driver: seek(t) renders the frame at time t (seconds).
//   opts.sub     motion-blur sub-frames (1 = none)
//   opts.shutter fraction of the frame interval the sub-frames span (0.5 = 180 degrees)
//   opts.ui      false = no headline/captions (clean plates for the stills and scene clips)
function sceneIndex(t) {
  for (let i = 0; i < SC.length; i++) if (t < SC[i][1]) return i;
  return SC.length - 1;
}

const SCENE_FN = [scene1, scene2, chartScene, chartScene, chartScene, chartScene, chartScene, chartScene, chartScene, scene10];

// Shot boundaries (sub-frames never straddle a cut).
const CUTS = [...SC.map(s => s[0]), CU.s1_cut, CU.s2_cut, CU.s10_cut, ...SHOTS.map(s => s.a), CU.end].sort((a, b) => a - b)
  .filter((v, i, arr) => i === 0 || v - arr[i - 1] > 1e-6);
function shotBounds(tc) {
  let a = 0, b = CU.end;
  for (const c of CUTS) { if (c <= tc) a = c; else { b = c; break; } }
  return [a, b];
}

// Transitions at scene starts: type, flash strength.
const TRANS = [null, ['zoom', 0.75], ['flash', 0.85], ['flash', 0.8], ['flash', 0.8], ['flash', 0.8], ['whip', 0.0],
               ['pull', 0.35], ['punch', 0.3], ['zoomflash', 0.9]];

function xformFor(t, i) {
  // returns {s: scale, dx: x shift, zb: zoom blur amount, hb: horizontal blur px}
  const o = { s: 1, dx: 0, zb: 0, hb: 0 };
  const [a, b] = SC[i];
  const tin = TRANS[i], tout = TRANS[i + 1];
  if (tin) {
    const u = t - a;
    if (tin[0] === 'zoom' || tin[0] === 'zoomflash') {
      const k = easeOutExpo(u / 0.4);
      o.s *= lerp(1.7, 1, k); o.zb += 0.22 * (1 - k);
    } else if (tin[0] === 'flash' || tin[0] === 'punch') {
      o.s *= 1 + 0.1 * Math.exp(-Math.max(0, u) / 0.12);
    } else if (tin[0] === 'whip') {
      const k = easeOutCubic(u / 0.22);
      o.dx += lerp(W * 0.9, 0, k); o.hb += 220 * (1 - k);
    } else if (tin[0] === 'pull') {
      const k = easeOutCubic(u / 0.35);
      o.s *= lerp(1.25, 1, k); o.zb += 0.08 * (1 - k);
    }
  }
  if (tout) {
    const u = b - t;
    if (tout[0] === 'zoom' || tout[0] === 'zoomflash') {
      const k = easeInExpo(1 - u / 0.3);
      o.s *= lerp(1, 1.6, k); o.zb += 0.25 * k;
    } else if (tout[0] === 'whip') {
      const k = easeInCubic(1 - u / 0.18);
      o.dx -= W * 0.9 * k; o.hb += 220 * k;
    }
  }
  // inner cuts: a small punch-in
  for (const c of [CU.s1_cut, CU.s2_cut, CU.s10_cut, ...SHOTS.map(s => s.a)]) {
    if (SC.some(s => Math.abs(s[0] - c) < 1e-6)) continue;
    if (t >= c && t < c + 0.25) o.s *= 1 + 0.035 * Math.exp(-(t - c) / 0.08);
  }
  return o;
}

function flashAt(t) {
  let f = 0;
  for (let i = 1; i < SC.length; i++) {
    const tr = TRANS[i];
    if (!tr || !tr[1]) continue;
    const T = SC[i][0];
    if (t >= T - 0.06 && t < T) f = Math.max(f, tr[1] * Math.pow((t - T + 0.06) / 0.06, 2));
    else if (t >= T) f = Math.max(f, tr[1] * Math.exp(-(t - T) / 0.085));
  }
  // flashes on the big beats inside scenes
  f = Math.max(f, 0.32 * pulse(t, CU.mss_break, 0.07), 0.35 * pulse(t, CU.sweep_cross, 0.07), 0.6 * pulse(t, CU.tp_hit, 0.12));
  return f;
}

function compositeSub(k, o) {
  const plain = Math.abs(o.s - 1) < 1e-4 && Math.abs(o.dx) < 0.5 && o.zb < 1e-3 && o.hb < 0.5;
  let src = SCN;
  if (!plain) {
    tctx.save();
    tctx.fillStyle = '#000'; tctx.fillRect(0, 0, W, H);
    const n = (o.zb > 0.005 || o.hb > 2) ? 7 : 1;
    for (let j = 0; j < n; j++) {
      const u = n === 1 ? 0 : j / (n - 1);
      const s = o.s * (1 + o.zb * u);
      const dx = o.dx + (o.hb ? (u - 0.5) * o.hb : 0);
      tctx.globalAlpha = 1 / (j + 1);
      tctx.setTransform(s, 0, 0, s, W / 2 - s * W / 2 + dx, H * 0.46 - s * H * 0.46);
      tctx.drawImage(SCN, 0, 0);
      if (o.hb > 2) { tctx.drawImage(SCN, -W, 0); tctx.drawImage(SCN, W, 0); }   // whip: the pan wraps, no black gap
    }
    tctx.restore();
    src = TMP;
  }
  actx.save();
  actx.globalAlpha = 1 / (k + 1);
  actx.drawImage(src, 0, 0);
  actx.restore();
}

function resetCtx(c) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.filter = 'none';
  c.shadowBlur = 0;
  c.setLineDash([]);
}

window.seek = function (t, opts = {}) {
  const sub = opts.sub || 1, shutter = opts.shutter === undefined ? 0.5 : opts.shutter;
  const [a, b] = shotBounds(t);
  const i = sceneIndex(t);
  for (let k = 0; k < sub; k++) {
    const ts = sub === 1 ? t : clamp(t + (k - (sub - 1) / 2) * shutter / (FPS * sub), a, b - 1e-4);
    resetCtx(sctx);
    sctx.save();
    SCENE_FN[i](sctx, ts, t, i);
    sctx.restore();
    compositeSub(k, xformFor(ts, i));
  }
  resetCtx(octx);
  finishFrame(t, i === 1 ? 1.15 : 1);
  const f = flashAt(t);
  if (f > 0.002) {
    octx.save();
    octx.globalCompositeOperation = 'lighter';
    octx.fillStyle = `rgba(235,250,255,${f})`;
    octx.fillRect(0, 0, W, H);
    octx.restore();
  }
  if (opts.ui !== false) {
    headline(octx, t, i);
    captions(octx, t);
  }
  disclaimer(octx, t);
  return i;
};

window.READY = false;
document.fonts.load(`800 60px ${FONT}`).then(() => document.fonts.load(`600 30px ${FONT}`)).then(() => {
  // warm up emoji and text paths
  setFont(octx, 40); octx.fillText('ICT 💸🏦🎯⚡📈🟨⏳✅🔁', -2000, -2000);
  window.READY = true;
});
