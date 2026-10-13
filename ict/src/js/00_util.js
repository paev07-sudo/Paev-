'use strict';
// Frame, timeline and palette shared by every module. Everything a frame shows is a pure
// function of the time passed to seek(): no state survives from one frame to the next.
const W = 1080, H = 1920, FPS = 30;
const TL = DATA.timeline, CU = DATA.cues;
const SC = CU.scenes;                       // [[start, end], ...] for the 10 scenes
const COL = {
  cyan: '#00E5FF', gold: '#FFC300', green: '#00FF88', red: '#FF3B5C', white: '#FFFFFF',
  navy: '#060b1c', ink: '#02030a',
};
const FONT = 'Montserrat';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const invlerp = (a, b, x) => clamp((x - a) / (b - a));
const smooth = u => { u = clamp(u); return u * u * (3 - 2 * u); };
const smoother = u => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
const easeOutCubic = u => 1 - Math.pow(1 - clamp(u), 3);
const easeInCubic = u => Math.pow(clamp(u), 3);
const easeInOut = u => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const easeOutExpo = u => { u = clamp(u); return u >= 1 ? 1 : 1 - Math.pow(2, -10 * u); };
const easeInExpo = u => { u = clamp(u); return u <= 0 ? 0 : Math.pow(2, 10 * u - 10); };
const easeOutQuart = u => 1 - Math.pow(1 - clamp(u), 4);
const easeInQuad = u => clamp(u) * clamp(u);

// Damped spring from 0 to 1 starting at t0 (closed form, so it is a pure function of t).
function spring(t, t0, freq = 5, damp = 0.42) {
  const x = t - t0;
  if (x <= 0) return 0;
  const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * x) * (Math.cos(wd * x) + (damp * w / wd) * Math.sin(wd * x));
}
// Visibility window: fades in over fi after a, out over fo before b.
function win(t, a, b = 1e9, fi = 0.2, fo = 0.2) {
  if (t < a || t > b) return 0;
  return clamp(Math.min(fi > 0 ? (t - a) / fi : 1, fo > 0 ? (b - t) / fo : 1));
}
// Decaying pulse after t0.
const pulse = (t, t0, tau = 0.25) => (t < t0 ? 0 : Math.exp(-(t - t0) / tau));

// Deterministic randomness.
function hash(n) {
  n = (n | 0) ^ 0x9e3779b9;
  n = Math.imul(n ^ (n >>> 16), 0x85ebca6b);
  n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function rng(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 7919), hash(i + 1 + seed * 7919), u) * 2 - 1;
}

// Colors.
function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(h, a = 1) {
  const [r, g, b] = hexRgb(h);
  return `rgba(${r},${g},${b},${a})`;
}
function mix(h1, h2, u, a = 1) {
  const p = hexRgb(h1), q = hexRgb(h2);
  return `rgba(${Math.round(lerp(p[0], q[0], u))},${Math.round(lerp(p[1], q[1], u))},${Math.round(lerp(p[2], q[2], u))},${a})`;
}

function mixHex(h1, h2, u) {
  const p = hexRgb(h1), q = hexRgb(h2);
  return '#' + [0, 1, 2].map(i => Math.round(lerp(p[i], q[i], u)).toString(16).padStart(2, '0')).join('');
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function ctx2d(c) { return c.getContext('2d'); }

// Soft round sprite (white), tinted copies are cached by color.
const SPRITES = {};
function softDot(color = '#ffffff', hard = 0.0) {
  const key = color + hard;
  if (SPRITES[key]) return SPRITES[key];
  const c = makeCanvas(128, 128), g = ctx2d(c);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, rgba(color, 1));
  gr.addColorStop(clamp(hard), rgba(color, 0.85));
  gr.addColorStop(Math.min(1, 0.35 + hard * 0.5), rgba(color, 0.28));
  gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  SPRITES[key] = c;
  return c;
}
function drawDot(ctx, x, y, r, color, alpha = 1, hard = 0) {
  if (alpha <= 0.002 || r <= 0.2) return;
  ctx.globalAlpha = alpha;
  ctx.drawImage(softDot(color, hard), x - r, y - r, 2 * r, 2 * r);
  ctx.globalAlpha = 1;
}

function setFont(ctx, size, weight = 800, spacing = 0) {
  ctx.font = `${weight} ${size}px ${FONT}, 'Noto Color Emoji', sans-serif`;
  ctx.letterSpacing = `${spacing}px`;
}

// Words of a line (for word-synced cues inside a scene).
function wordAt(line, idx) { return TL.lines[line].words[idx]; }
