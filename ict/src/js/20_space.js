// Perspective camera and the "dark space" the charts float in.

class Cam {
  // target: [x, y, z]; yaw/pitch in degrees (pitch > 0 = camera above, looking down);
  // dist in world units; cx, cy = principal point (lens shift) in pixels.
  constructor({ target, yaw = 0, pitch = 0, dist = 30, fov = 35, roll = 0, cx = W / 2, cy = 864 }) {
    const yr = yaw * Math.PI / 180, pr = pitch * Math.PI / 180;
    this.target = target;
    this.pos = [
      target[0] + dist * Math.sin(yr) * Math.cos(pr),
      target[1] + dist * Math.sin(pr),
      target[2] - dist * Math.cos(yr) * Math.cos(pr),
    ];
    let f = [target[0] - this.pos[0], target[1] - this.pos[1], target[2] - this.pos[2]];
    const fl = Math.hypot(...f); f = f.map(v => v / fl);
    let r = [f[2], 0, -f[0]];                       // up x forward with up = (0,1,0)
    const rl = Math.hypot(...r); r = r.map(v => v / rl);
    let u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
    if (roll) {
      const a = roll * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      const r2 = r.map((v, i) => c * v + s * u[i]), u2 = u.map((v, i) => -s * r[i] + c * v);
      r = r2; u = u2;
    }
    this.f = f; this.r = r; this.u = u;
    this.F = (H / 2) / Math.tan(fov * Math.PI / 360);
    this.cx = cx; this.cy = cy;
    this.dist = dist;
  }
  // -> [sx, sy, depth, pixels per world unit at that depth]
  project(p) {
    const v0 = p[0] - this.pos[0], v1 = p[1] - this.pos[1], v2 = p[2] - this.pos[2];
    const z = v0 * this.f[0] + v1 * this.f[1] + v2 * this.f[2];
    const x = v0 * this.r[0] + v1 * this.r[1] + v2 * this.r[2];
    const y = v0 * this.u[0] + v1 * this.u[1] + v2 * this.u[2];
    const k = this.F / Math.max(z, 0.05);
    return [this.cx + x * k, this.cy - y * k, z, k];
  }
  // Does a face with outward normal n through point p face the camera?
  facing(n, p) {
    return n[0] * (this.pos[0] - p[0]) + n[1] * (this.pos[1] - p[1]) + n[2] * (this.pos[2] - p[2]) > 0;
  }
}

// Interpolate camera parameter sets: keys = [{t, target, yaw, pitch, dist, fov, roll}, ...]
function camAt(keys, t, ease = easeInOut, extra = {}) {
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].t && t <= keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; break; }
  }
  const u = a === b ? 0 : (b.e || ease)(invlerp(a.t, b.t, t));
  const L = (k, d) => lerp(a[k] !== undefined ? a[k] : d, b[k] !== undefined ? b[k] : d, u);
  return new Cam(Object.assign({
    target: [0, 1, 2].map(i => lerp(a.target[i], b.target[i], u)),
    yaw: L('yaw', 0), pitch: L('pitch', 0), dist: L('dist', 30), fov: L('fov', 35), roll: L('roll', 0),
    cy: L('cy', 864),
  }, extra));
}

// Hand-held drift + impact shakes, applied to a camera key before building it.
function shakeOffset(t, amp, seed = 1, freq = 1.3) {
  return [noise1(t * freq, seed) * amp, noise1(t * freq, seed + 5) * amp, 0];
}

// ---------------------------------------------------------------- background
const STARS = (() => {
  const r = rng(11), s = [];
  for (let i = 0; i < 260; i++) s.push([r() * 1.6 - 0.3, r() * 1.4 - 0.2, Math.pow(r(), 3) * 2.2 + 0.4, r(), r()]);
  return s;
})();
const DUST = (() => {
  const r = rng(23), d = [];
  for (let i = 0; i < 150; i++) {
    d.push({
      p: [r() * 40 - 10, r() * 36 - 18, r() * 34 - 12],
      size: 0.03 + Math.pow(r(), 2) * 0.09,
      color: r() < 0.72 ? COL.cyan : (r() < 0.6 ? COL.gold : '#9fb4ff'),
      tw: r() * 6.28, sp: 0.05 + r() * 0.15,
    });
  }
  return d;
})();

function drawSpace(ctx, cam, t, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#020309');
  g.addColorStop(0.42, '#050a19');
  g.addColorStop(0.75, '#03060f');
  g.addColorStop(1, '#010205');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // parallax for far layers from the camera direction
  const px = -cam.f[0] * 900, py = cam.f[1] * 900;
  // nebula glows
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const neb = [[0.25, 0.32, 0.55, '#0b2a5c', 0.55], [0.8, 0.6, 0.5, '#0a3e52', 0.38], [0.5, 0.9, 0.6, '#1a1050', 0.35],
               [0.62, 0.18, 0.35, '#3a2a08', 0.18]];
  for (const [nx, ny, nr, nc, na] of neb) {
    const x = nx * W + px * 0.25, y = ny * H + py * 0.25, R = nr * H;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, rgba(nc, na * (o.neb || 1)));
    gr.addColorStop(1, rgba(nc, 0));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }
  // stars
  for (const [sx, sy, sz, tw, hue] of STARS) {
    const x = ((sx * W + px * 0.1) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.3;
    const y = ((sy * H + py * 0.1) % (H * 1.4) + H * 1.4) % (H * 1.4) - H * 0.2;
    const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.1 + tw * 40));
    drawDot(ctx, x, y, sz * 1.6, hue < 0.8 ? '#b9d6ff' : COL.gold, a * 0.55 * (o.stars || 1), 0.3);
  }
  ctx.restore();
  if (o.grid !== false) drawGrid(ctx, cam, t, o.gridY !== undefined ? o.gridY : -13.5, o.gridAlpha || 1);
}

// Faint perspective grid far below the chart (a floor of light lines fading into the dark).
function drawGrid(ctx, cam, t, y0, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 1.2;
  const zs = [], xs = [];
  for (let z = -10; z <= 60; z += 2.5) zs.push(z);
  for (let x = -30; x <= 50; x += 2.5) xs.push(x);
  for (const z of zs) {
    const a = cam.project([-30, y0, z]), b = cam.project([50, y0, z]);
    if (a[2] < 0.5 || b[2] < 0.5) continue;
    const fade = clamp(1 - (z + 10) / 70) * 0.075 * alpha;
    ctx.strokeStyle = rgba(COL.cyan, fade);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  for (const x of xs) {
    const a = cam.project([x, y0, -10]), b = cam.project([x, y0, 60]);
    if (a[2] < 0.5) continue;
    const gr = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
    gr.addColorStop(0, rgba(COL.cyan, 0.07 * alpha));
    gr.addColorStop(1, rgba(COL.cyan, 0));
    ctx.strokeStyle = gr;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  ctx.restore();
}

// Floating light dust in world space: near specks become big soft bokeh discs.
function drawDust(ctx, cam, t, focusDist, o = {}) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const d of DUST) {
    const p = [d.p[0] + Math.sin(t * d.sp + d.tw) * 0.6, d.p[1] + ((t * d.sp * 0.8) % 36), d.p[2]];
    if (p[1] > 18) p[1] -= 36;
    const s = cam.project(p);
    if (s[2] < 0.6) continue;
    const r0 = d.size * s[3];
    const coc = Math.abs(s[2] - focusDist) / Math.max(s[2], 1) * 26;   // circle of confusion, px
    const r = Math.max(1.2, r0 + coc);
    const a = clamp(0.9 * (r0 + 1.5) / r) * (0.45 + 0.35 * Math.sin(t * 1.7 + d.tw)) * (o.alpha || 1);
    if (s[0] < -r || s[0] > W + r || s[1] < -r || s[1] > H + r) continue;
    drawDot(ctx, s[0], s[1], r, d.color, a, r > 6 ? 0.55 : 0.2);
  }
  ctx.restore();
}
