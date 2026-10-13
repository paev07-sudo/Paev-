// Scene 2: a giant vault door made of candlesticks and data streams. Bolts retract, the wheel
// spins, the door swings open toward us and light pours out; tiny people stand in front.
const DOOR_R = 420, DOOR = makeCanvas(900, 900), dg = ctx2d(DOOR);
const VAULT_CANDLES = (() => {
  const r = rng(91), out = [];
  let p = 0;
  for (let i = 0; i < 72; i++) {
    const o = p; p += (r() - 0.47) * 1.6;
    out.push([o, p, Math.max(o, p) + r() * 0.8, Math.min(o, p) - r() * 0.8]);
  }
  return out;
})();
const HEX = (() => {
  const c = makeCanvas(1400, 2200), g = ctx2d(c);
  g.strokeStyle = 'rgba(0,229,255,0.06)'; g.lineWidth = 1.2;
  const s = 46, h = s * Math.sqrt(3) / 2;
  for (let y = 0; y < 2300; y += h * 2) for (let x = 0; x < 1500; x += s * 3) {
    for (const [ox, oy] of [[0, 0], [s * 1.5, h]]) {
      g.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k; g[k ? 'lineTo' : 'moveTo'](x + ox + s * Math.cos(a), y + oy + s * Math.sin(a)); }
      g.closePath(); g.stroke();
    }
  }
  return c;
})();

function vaultTimes() {
  const u0 = CU.vault_unlock;
  return { bolts: CU.vault_bolts, spin: CU.vault_spin, unlock: u0, open0: u0 + 0.32, open1: SC[1][1] + 0.1 };
}
function doorAngle(t) {
  const v = vaultTimes();
  if (t < v.unlock) return 0;
  const crack = 3 * easeOutCubic((t - v.unlock) / 0.3);
  return (crack + 72 * easeInOut(invlerp(v.open0, v.open1, t))) * Math.PI / 180;
}
function openness(t) { return clamp(doorAngle(t) / (40 * Math.PI / 180)); }

function steel(g, x0, y0, x1, y1, light = 1) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, `rgba(${(120 * light) | 0},${(150 * light) | 0},${(200 * light) | 0},1)`);
  gr.addColorStop(0.35, '#2a3656');
  gr.addColorStop(0.65, '#121a30');
  gr.addColorStop(1, '#05080f');
  return gr;
}

function renderDoor(t) {
  const g = dg, c = 450, R = DOOR_R, v = vaultTimes();
  g.clearRect(0, 0, 900, 900);
  g.save();
  g.translate(c, c);
  // locking bolts: chunky steel cylinders through the rim; each group of four slides in on its clunk
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2 + Math.PI / 16;
    const tb = v.bolts[i % 4];
    const k = easeOutCubic((t - tb) / 0.12);
    const r0 = lerp(R - 40, R - 78, k), r1 = lerp(R + 30, R - 8, k);
    g.save(); g.rotate(a);
    g.fillStyle = steel(g, 0, -14, 0, 14, 1.2);
    g.beginPath(); g.roundRect(r0, -14, r1 - r0, 28, 9); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(r0 + 6, -9, r1 - r0 - 12, 3);
    g.strokeStyle = rgba(COL.cyan, 0.35 + 0.65 * pulse(t, tb, 0.3)); g.lineWidth = 2; g.stroke();
    g.restore();
  }
  // outer bevel: lit from the top left
  g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2);
  g.fillStyle = steel(g, -R, -R, R, R, 1.25); g.fill();
  // recessed face
  const face = g.createRadialGradient(-R * 0.25, -R * 0.3, R * 0.05, 0, 0, R * 0.9);
  face.addColorStop(0, '#1c2846'); face.addColorStop(0.75, '#0c1326'); face.addColorStop(1, '#060a15');
  g.beginPath(); g.arc(0, 0, R - 44, 0, Math.PI * 2); g.fillStyle = face; g.fill();
  // brushed rings
  for (let r = 60; r < R - 50; r += 7) {
    g.strokeStyle = `rgba(150,180,230,${0.025 + 0.02 * hash(r)})`; g.lineWidth = 1;
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
  }
  const sheen = g.createConicGradient(-0.9 + t * 0.05, 0, 0);
  sheen.addColorStop(0, 'rgba(180,215,255,0.16)'); sheen.addColorStop(0.12, 'rgba(180,215,255,0)');
  sheen.addColorStop(0.5, 'rgba(180,215,255,0.07)'); sheen.addColorStop(0.62, 'rgba(180,215,255,0)'); sheen.addColorStop(1, 'rgba(180,215,255,0.16)');
  g.fillStyle = sheen; g.beginPath(); g.arc(0, 0, R - 44, 0, Math.PI * 2); g.fill();
  // bevel shading: inner shadow at the bottom right, highlight arc at the top left
  g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,0.55)';
  g.beginPath(); g.arc(0, 0, R - 46, -0.2, Math.PI * 0.9); g.stroke();
  g.lineWidth = 4; g.strokeStyle = 'rgba(200,230,255,0.55)';
  g.beginPath(); g.arc(0, 0, R - 3, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
  g.lineWidth = 3; g.strokeStyle = rgba(COL.cyan, 0.9);
  g.shadowColor = COL.cyan; g.shadowBlur = 16;
  g.beginPath(); g.arc(0, 0, R - 44, 0, Math.PI * 2); g.stroke();
  g.shadowBlur = 0;
  for (let i = 0; i < 32; i++) {
    const a = i / 32 * Math.PI * 2;
    const x = Math.cos(a) * (R - 22), y = Math.sin(a) * (R - 22);
    const rv = g.createRadialGradient(x - 2, y - 2, 0, x, y, 7);
    rv.addColorStop(0, '#e6efff'); rv.addColorStop(1, '#3a4a6c');
    g.fillStyle = rv; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
  }
  // ring of candlesticks, rotating
  const spinK = easeInOut(invlerp(v.spin[0], v.spin[1], t));
  const rotC = t * 0.12 + spinK * 1.2;
  g.save();
  for (let i = 0; i < VAULT_CANDLES.length; i++) {
    const [o, cl, hi, lo] = VAULT_CANDLES[i];
    const a = i / VAULT_CANDLES.length * Math.PI * 2 + rotC;
    const up = cl >= o, col = up ? COL.green : COL.red;
    const base = 300, k = 11;
    g.save(); g.rotate(a);
    g.strokeStyle = rgba(col, 0.95); g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(base + (lo + 4) * k, 0); g.lineTo(base + (hi + 4) * k, 0); g.stroke();
    const x0 = base + (Math.min(o, cl) + 4) * k, x1 = base + (Math.max(o, cl) + 4) * k;
    g.shadowColor = col; g.shadowBlur = 12;
    const cg = g.createLinearGradient(0, -7, 0, 7);
    cg.addColorStop(0, mix(col, '#ffffff', 0.4)); cg.addColorStop(1, mix(col, '#000000', 0.3));
    g.fillStyle = cg;
    g.fillRect(x0, -7, Math.max(4, x1 - x0), 14);
    g.restore();
  }
  g.restore();
  g.lineWidth = 2; g.strokeStyle = rgba(COL.cyan, 0.45);
  g.beginPath(); g.arc(0, 0, 286, 0, Math.PI * 2); g.stroke();
  // data ring: streaming digits, counter-rotating
  setFont(g, 21, 800, 0);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const rotD = -t * 0.35 - spinK * 2.0;
  for (let i = 0; i < 56; i++) {
    const a = i / 56 * Math.PI * 2 + rotD;
    const ch = String(Math.floor(hash(i * 31 + Math.floor(t * 9 + i)) * 10));
    g.save(); g.rotate(a); g.translate(256, 0); g.rotate(Math.PI / 2);
    g.shadowColor = COL.cyan; g.shadowBlur = 8;
    g.fillStyle = i % 7 === 0 ? COL.gold : rgba(COL.cyan, 0.95);
    g.fillText(ch, 0, 0);
    g.restore();
  }
  g.strokeStyle = rgba(COL.cyan, 0.35); g.lineWidth = 2;
  g.beginPath(); g.arc(0, 0, 234, 0, Math.PI * 2); g.stroke();
  // inner dial: ticks and glowing arc segments
  for (let i = 0; i < 120; i++) {
    const a = i / 120 * Math.PI * 2;
    const r0 = i % 10 === 0 ? 204 : 214;
    g.strokeStyle = i % 10 === 0 ? rgba(COL.gold, 0.95) : 'rgba(170,200,255,0.4)';
    g.lineWidth = i % 10 === 0 ? 3.5 : 1.5;
    g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * 224, Math.sin(a) * 224); g.stroke();
  }
  g.save();
  g.shadowColor = COL.cyan; g.shadowBlur = 14;
  for (let k = 0; k < 3; k++) {
    const a0 = t * (0.6 + k * 0.25) * (k % 2 ? -1 : 1) + k * 2;
    g.strokeStyle = rgba(COL.cyan, 0.95); g.lineWidth = 5;
    g.beginPath(); g.arc(0, 0, 188 - k * 16, a0, a0 + 0.9); g.stroke();
  }
  g.restore();
  // handle wheel: six spokes with metal shading, spins on the unlock
  const rotW = spinK * Math.PI * 2.2;
  g.save(); g.rotate(rotW);
  g.lineCap = 'round';
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 12; g.shadowOffsetX = 5; g.shadowOffsetY = 7;
  g.strokeStyle = '#8a6a1e'; g.lineWidth = 16;
  g.beginPath(); g.arc(0, 0, 150, 0, Math.PI * 2); g.stroke();
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2;
    g.beginPath(); g.moveTo(Math.cos(a) * 36, Math.sin(a) * 36); g.lineTo(Math.cos(a) * 172, Math.sin(a) * 172); g.stroke();
  }
  g.shadowColor = 'transparent';
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2;
    const ex = Math.cos(a) * 172, ey = Math.sin(a) * 172;
    const sg = g.createLinearGradient(-Math.sin(a) * 8, Math.cos(a) * 8, Math.sin(a) * 8, -Math.cos(a) * 8);
    sg.addColorStop(0, '#5a4210'); sg.addColorStop(0.5, '#ffe08a'); sg.addColorStop(1, '#6d5014');
    g.strokeStyle = sg; g.lineWidth = 13;
    g.beginPath(); g.moveTo(Math.cos(a) * 36, Math.sin(a) * 36); g.lineTo(ex, ey); g.stroke();
    const kg = g.createRadialGradient(ex - 5, ey - 5, 1, ex, ey, 18);
    kg.addColorStop(0, '#fff3c2'); kg.addColorStop(0.5, '#ffc933'); kg.addColorStop(1, '#7a5a12');
    g.fillStyle = kg; g.beginPath(); g.arc(ex, ey, 17, 0, Math.PI * 2); g.fill();
  }
  const rg = g.createLinearGradient(-150, -150, 150, 150);
  rg.addColorStop(0, '#fff0b0'); rg.addColorStop(0.5, '#d9a52a'); rg.addColorStop(1, '#5a4210');
  g.strokeStyle = rg; g.lineWidth = 10;
  g.beginPath(); g.arc(0, 0, 150, 0, Math.PI * 2); g.stroke();
  g.restore();
  // hub
  const hub = g.createRadialGradient(-10, -10, 2, 0, 0, 46);
  hub.addColorStop(0, '#ffffff'); hub.addColorStop(0.35, COL.cyan); hub.addColorStop(1, '#06304a');
  g.fillStyle = hub; g.beginPath(); g.arc(0, 0, 44, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.stroke();
  g.restore();
}

// Tiny person seen from behind, feet at (x, y), height h.
function tinyPerson(ctx, x, y, h, rim, seed) {
  const r = rng(seed);
  const lean = (r() - 0.5) * 0.04 * h;
  ctx.save();
  ctx.translate(x, y);
  const path = () => {
    ctx.beginPath();
    ctx.arc(lean, -h * 0.9, h * 0.068, 0, Math.PI * 2);
    ctx.moveTo(-h * 0.13 + lean, -h * 0.78);
    ctx.quadraticCurveTo(lean, -h * 0.82, h * 0.13 + lean, -h * 0.78);
    ctx.lineTo(h * 0.115 + lean * 0.5, -h * 0.44);
    ctx.lineTo(h * 0.075, -h * 0.44);
    ctx.lineTo(h * 0.07, 0);
    ctx.lineTo(h * 0.015, 0);
    ctx.lineTo(0, -h * 0.4);
    ctx.lineTo(-h * 0.015, 0);
    ctx.lineTo(-h * 0.07, 0);
    ctx.lineTo(-h * 0.075, -h * 0.44);
    ctx.lineTo(-h * 0.115 + lean * 0.5, -h * 0.44);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = '#020309';
  ctx.fill();
  if (rim > 0.01) {
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = rgba('#ffd98a', 0.85 * rim);
    ctx.lineWidth = Math.max(1.2, h * 0.018);
    ctx.shadowColor = COL.gold; ctx.shadowBlur = 6;
    path(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function scene2(ctx, t, tc) {
  const [a, b] = SC[1];
  const shotB = tc >= CU.s2_cut;
  const v = vaultTimes();
  const op = openness(t), th = doorAngle(t);
  // framing per shot: vault centre, hole radius, floor line, people
  let cx = 540, cy, R0, floorY, zoom;
  if (!shotB) {
    const u = easeInOut(invlerp(a, CU.s2_cut, t));
    zoom = lerp(1, 1.07, u);
    cx = 540; cy = lerp(872, 860, u); R0 = 318 * zoom; floorY = lerp(1312, 1318, u);
  } else {
    const u = easeOutCubic(invlerp(CU.s2_cut, b, t));
    zoom = lerp(1.3, 1.38, u);
    cx = 540; cy = lerp(770, 752, u); R0 = 318 * zoom; floorY = lerp(1196, 1188, u);
  }
  const shake = (pulse(t, v.unlock, 0.25) * 6 + v.bolts.reduce((s, tb) => s + pulse(t, tb, 0.12) * 2.5, 0));
  cx += noise1(t * 30, 2) * shake; cy += noise1(t * 30, 5) * shake;
  // wall
  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, '#03050c'); wall.addColorStop(0.5, '#071027'); wall.addColorStop(1, '#03050b');
  ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.drawImage(HEX, cx - 700 - (zoom - 1) * 200, cy - 1100 - (zoom - 1) * 300);
  ctx.restore();
  // data streams on the wall (digital rain of digits and tiny candles)
  ctx.save();
  setFont(ctx, 22, 700, 0);
  ctx.textAlign = 'center';
  for (let col = 0; col < 22; col++) {
    const x = (col + 0.5) / 22 * W + noise1(col, 3) * 10;
    if (Math.abs(x - cx) < R0 * 1.25 && hash(col) < 0.7) continue;
    const sp = 140 + hash(col * 3) * 220, len = 9 + Math.floor(hash(col * 5) * 10);
    const head = ((t * sp + hash(col * 7) * 2400) % 2600) - 300;
    for (let k = 0; k < len; k++) {
      const y = head - k * 30;
      if (y < -30 || y > floorY) continue;
      const f = 1 - k / len;
      const gold = hash(col * 11 + k) < 0.12;
      ctx.fillStyle = gold ? rgba(COL.gold, 0.5 * f) : rgba(COL.cyan, (k === 0 ? 0.75 : 0.32) * f);
      if (hash(col * 13 + k) < 0.25) ctx.fillRect(x - 2, y - 10, 4, 14);          // tiny candle
      else ctx.fillText(String(Math.floor(hash(col * 17 + k + Math.floor(t * 6)) * 10)), x, y);
    }
  }
  ctx.restore();
  // circuit lines on the wall carry pulses of data into the vault
  {
    const RFo = R0 * 1.24;
    ctx.save();
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const an = (i / 14) * Math.PI * 2 + 0.2;
      const x0 = cx + Math.cos(an) * RFo, y0 = cy + Math.sin(an) * RFo;
      const kx = cx + Math.cos(an) * (RFo + 90 + 60 * hash(i)), ky = cy + Math.sin(an) * (RFo + 90 + 60 * hash(i));
      const ex = kx + (Math.cos(an) > 0 ? 1 : -1) * 900, ey = ky;
      ctx.strokeStyle = 'rgba(0,229,255,0.10)';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(kx, ky); ctx.lineTo(ex, ey); ctx.stroke();
      const ph = ((t * (0.45 + 0.3 * hash(i * 3)) + hash(i * 7)) % 1);
      const L1 = Math.hypot(kx - x0, ky - y0), L2 = Math.abs(ex - kx);
      const d = (1 - ph) * (L1 + L2);
      const px = d > L1 ? kx + (ex - kx) * (d - L1) / L2 : x0 + (kx - x0) * d / L1;
      const py = d > L1 ? ky : y0 + (ky - y0) * d / L1;
      drawDot(ctx, px, py, 12, i % 4 === 0 ? COL.gold : COL.cyan, 0.9);
    }
    ctx.restore();
  }
  // frame ring set into the wall
  const RF = R0 * 1.24;
  drawDot(ctx, cx, cy, RF * 1.9, '#0b3a6a', 0.55);
  const fr = ctx.createRadialGradient(cx, cy, R0, cx, cy, RF);
  fr.addColorStop(0, '#1b2846'); fr.addColorStop(0.5, '#0d1428'); fr.addColorStop(1, '#060a16');
  ctx.beginPath(); ctx.arc(cx, cy, RF, 0, Math.PI * 2); ctx.arc(cx, cy, R0, 0, Math.PI * 2, true);
  ctx.fillStyle = fr; ctx.fill();
  ctx.save();
  ctx.shadowColor = COL.cyan; ctx.shadowBlur = 18;
  ctx.strokeStyle = rgba(COL.cyan, 0.85); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, RF, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = rgba(COL.gold, 0.6); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, R0 + 6, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 48; i++) {                                     // circuit ticks on the frame
    const an = i / 48 * Math.PI * 2;
    const l = i % 4 === 0 ? 0.16 : 0.08;
    ctx.strokeStyle = rgba(i % 4 === 0 ? COL.cyan : '#7fa6d9', i % 4 === 0 ? 0.7 : 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(an) * (R0 + (RF - R0) * 0.25), cy + Math.sin(an) * (R0 + (RF - R0) * 0.25));
    ctx.lineTo(cx + Math.cos(an) * (R0 + (RF - R0) * (0.25 + l * 2)), cy + Math.sin(an) * (R0 + (RF - R0) * (0.25 + l * 2)));
    ctx.stroke();
  }
  // the tunnel behind the door: a dark steel wall, lit as the door opens
  {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2); ctx.clip();
    const tg = ctx.createRadialGradient(cx, cy + R0 * 0.18, R0 * 0.55, cx, cy, R0);
    tg.addColorStop(0, '#0c1428'); tg.addColorStop(1, '#03050b');
    ctx.fillStyle = tg; ctx.fillRect(cx - R0, cy - R0, 2 * R0, 2 * R0);
    ctx.restore();
  }
  // light inside the hole
  if (op > 0) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2); ctx.clip();
    const lg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R0);
    lg.addColorStop(0, `rgba(255,255,255,${op})`); lg.addColorStop(0.3, `rgba(255,238,180,${op})`);
    lg.addColorStop(0.62, `rgba(255,176,50,${0.85 * op})`); lg.addColorStop(0.86, `rgba(110,60,12,${0.75 * op})`);
    lg.addColorStop(1, `rgba(20,14,8,${0.7 * op})`);
    ctx.fillStyle = lg; ctx.fillRect(cx - R0, cy - R0, 2 * R0, 2 * R0);
    ctx.globalCompositeOperation = 'lighter';                         // tunnel rings receding into the light
    for (let k = 1; k <= 5; k++) {
      ctx.strokeStyle = `rgba(255,220,150,${0.18 * op})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy + R0 * 0.05 * k / 5, R0 * (1 - k * 0.14), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  // the door, swung open about its left hinge (perspective strips)
  renderDoor(t);
  const k = R0 / DOOR_R, Dp = 2.4 * R0;
  const proj = (xl, z) => { const p = Dp / (Dp - z); return [cx + xl * p, p]; };
  const tdoor = R0 * 0.16;
  const ct = Math.cos(th), st = Math.sin(th);
  // back face (gives the door its thickness)
  if (th > 0.001) {
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const an = i / 48 * Math.PI * 2;
      const xl = Math.cos(an) * R0, yl = Math.sin(an) * R0;
      const X = -R0 + (xl + R0) * ct + tdoor * st, Z = (xl + R0) * st - tdoor * ct;
      const [sx, p] = proj(X, Z);
      i ? ctx.lineTo(sx, cy + yl * p) : ctx.moveTo(sx, cy + yl * p);
    }
    ctx.closePath();
    const eg = ctx.createLinearGradient(cx - R0, 0, cx + R0, 0);
    eg.addColorStop(0, '#0c1324'); eg.addColorStop(1, '#2a3a5e');
    ctx.fillStyle = eg; ctx.fill();
    ctx.strokeStyle = rgba(COL.gold, 0.5); ctx.lineWidth = 2; ctx.stroke();
  }
  const N = 72, half = 450 * k;                 // the strips cover the whole door canvas, bolts included
  for (let i = 0; i < N; i++) {
    const xa = -half + 2 * half * i / N, xb = -half + 2 * half * (i + 1) / N;
    const [s0, p0] = proj(-R0 + (xa + R0) * ct, (xa + R0) * st);
    const [s1, p1] = proj(-R0 + (xb + R0) * ct, (xb + R0) * st);
    const p = (p0 + p1) / 2;
    const sxSrc = 450 + xa / k, swSrc = (xb - xa) / k;
    ctx.drawImage(DOOR, sxSrc, 0, swSrc + 0.5, 900, s0, cy - 450 * k * p, Math.max(0.5, s1 - s0) + 0.6, 900 * k * p);
  }
  // seam light while the door cracks open
  if (op > 0 && op < 1) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,230,160,${0.8 * (1 - op)})`;
    ctx.lineWidth = 6 + 20 * op;
    ctx.shadowColor = '#ffd27a'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(cx, cy, R0 + 2, -Math.PI * 0.45, Math.PI * 0.45); ctx.stroke();
    ctx.restore();
  }
  // god rays and glow
  if (op > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    drawDot(ctx, cx, cy, R0 * 3.2, '#ffcf6b', 0.5 * op);
    drawDot(ctx, cx, cy, R0 * 1.4, '#ffffff', 0.55 * op);
    for (let i = 0; i < 30; i++) {
      const an = hash(i * 7) * Math.PI * 2 + t * 0.06 * (hash(i) - 0.5);
      const wd = (0.012 + hash(i * 3) * 0.035);
      const len = 1500;
      const g = ctx.createRadialGradient(cx, cy, R0 * 0.5, cx, cy, len);
      g.addColorStop(0, `rgba(255,236,180,${0.28 * op * (0.4 + hash(i * 5))})`);
      g.addColorStop(1, 'rgba(255,236,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(an - wd) * len, cy + Math.sin(an - wd) * len);
      ctx.lineTo(cx + Math.cos(an + wd) * len, cy + Math.sin(an + wd) * len);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // floor: dark, reflective, with a grid converging on the vault
  const fl = ctx.createLinearGradient(0, floorY, 0, H);
  fl.addColorStop(0, '#060b18'); fl.addColorStop(1, '#010206');
  ctx.fillStyle = fl; ctx.fillRect(0, floorY, W, H - floorY);
  ctx.save();
  ctx.strokeStyle = 'rgba(0,229,255,0.08)'; ctx.lineWidth = 1.5;
  for (let i = -12; i <= 12; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * 22, floorY); ctx.lineTo(cx + i * 260, H); ctx.stroke();
  }
  for (let j = 1; j < 12; j++) {
    const y = floorY + Math.pow(j / 12, 2) * (H - floorY);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'lighter';
  const refl = ctx.createLinearGradient(0, floorY, 0, H);
  refl.addColorStop(0, `rgba(255,210,120,${0.32 * op})`); refl.addColorStop(1, 'rgba(255,210,120,0)');
  ctx.fillStyle = refl;
  ctx.beginPath(); ctx.moveTo(cx - R0 * 0.9, floorY); ctx.lineTo(cx + R0 * 0.9, floorY); ctx.lineTo(cx + R0 * 2.4, H); ctx.lineTo(cx - R0 * 2.4, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(COL.cyan, 0.35); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(W, floorY); ctx.stroke();
  ctx.restore();
  // particles flying out of the vault toward the camera
  if (t > v.unlock + 0.15) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < 150; i++) {
      const t0 = v.unlock + 0.15 + hash(i * 3) * 2.4, life = 0.7 + hash(i * 5) * 0.9;
      const tau = (t - t0) / life;
      if (tau < 0 || tau > 1) continue;
      const an = hash(i * 7) * Math.PI * 2, r0 = Math.sqrt(hash(i * 11)) * R0 * 0.7;
      const z = (u) => 1 / (1 - 0.93 * u);
      const pos = u => [cx + Math.cos(an) * r0 * z(u) * (1 + u * 1.6), cy + Math.sin(an) * r0 * z(u) * (1 + u * 1.6) * 0.9];
      const p1 = pos(tau), p0 = pos(Math.max(0, tau - 0.06));
      const size = (1.5 + hash(i * 13) * 2.5) * z(tau);
      const col = hash(i * 17) < 0.6 ? '#ffd27a' : hash(i * 17) < 0.85 ? '#ffffff' : COL.cyan;
      const fade = Math.sin(Math.PI * tau);
      ctx.strokeStyle = rgba(col, 0.85 * fade);
      ctx.lineWidth = size;
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      if (size > 6) drawDot(ctx, p1[0], p1[1], size * 2, col, 0.35 * fade);
    }
    ctx.restore();
  }
  // people for scale, with shadows thrown toward us once the light is out
  const people = shotB ? [[300, 1400, 185, 3], [420, 1408, 196, 4], [655, 1402, 190, 5], [785, 1396, 178, 6]]
                       : [[402, floorY + 72, 78, 3], [452, floorY + 76, 82, 4], [612, floorY + 74, 80, 5], [668, floorY + 70, 76, 6]];
  for (const [x, y, h, seed] of people) {
    if (op > 0) {
      ctx.save();
      const sg = ctx.createLinearGradient(x, y, x + (x - cx) * 0.4, y + h * 2.2);
      sg.addColorStop(0, `rgba(0,0,0,${0.75 * op})`); sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(x - h * 0.08, y); ctx.lineTo(x + h * 0.08, y);
      ctx.lineTo(x + (x - cx) * 0.4 + h * 0.2, y + h * 2.2); ctx.lineTo(x + (x - cx) * 0.4 - h * 0.2, y + h * 2.2);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    tinyPerson(ctx, x, y, h, 0.15 + 0.85 * op, seed);
  }
}
