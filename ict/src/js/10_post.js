// Offscreen buffers and the film look: bloom on bright parts, frosted backdrop for glass
// labels, vignette, grain, and a contrast/saturation grade.
const OUT = document.getElementById('c');
const octx = ctx2d(OUT);
const SCN = makeCanvas(W, H), sctx = ctx2d(SCN);          // one scene render (a sub-frame)
const ACC = makeCanvas(W, H), actx = ctx2d(ACC);          // motion-blur accumulation
const TMP = makeCanvas(W, H), tctx = ctx2d(TMP);          // scratch for layers (blurred layers, rim lights)
const Q = makeCanvas(W / 4, H / 4), qctx = Q.getContext('2d', { willReadFrequently: true });
const QB = makeCanvas(W / 4, H / 4), qbctx = ctx2d(QB);
const E = makeCanvas(W / 8, H / 8), ectx = ctx2d(E);
const EB = makeCanvas(W / 8, H / 8), ebctx = ctx2d(EB);
const FROST = makeCanvas(W / 4, H / 4), fctx = ctx2d(FROST);

// Blurred quarter-res copy of what is drawn so far: the backdrop for glassmorphism labels.
function computeFrost(src) {
  fctx.save();
  fctx.filter = 'blur(4px)';
  fctx.clearRect(0, 0, W / 4, H / 4);
  fctx.drawImage(src, 0, 0, W / 4, H / 4);
  fctx.restore();
}

// Bloom: quarter- and eighth-res copies, soft-thresholded so only highlights glow.
function bloom(dst, src, strength = 1) {
  qctx.clearRect(0, 0, W / 4, H / 4);
  qctx.drawImage(src, 0, 0, W / 4, H / 4);
  const im = qctx.getImageData(0, 0, W / 4, H / 4), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    let k = (l - 0.3) / 0.55;
    k = k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
    d[i] *= k; d[i + 1] *= k; d[i + 2] *= k;
  }
  qctx.putImageData(im, 0, 0);
  qbctx.save(); qbctx.filter = 'blur(5px)'; qbctx.clearRect(0, 0, W / 4, H / 4); qbctx.drawImage(Q, 0, 0); qbctx.restore();
  ectx.clearRect(0, 0, W / 8, H / 8);
  ectx.drawImage(Q, 0, 0, W / 8, H / 8);
  ebctx.save(); ebctx.filter = 'blur(9px)'; ebctx.clearRect(0, 0, W / 8, H / 8); ebctx.drawImage(E, 0, 0); ebctx.restore();
  dst.save();
  dst.globalCompositeOperation = 'screen';
  dst.globalAlpha = 0.5 * strength;
  dst.drawImage(QB, 0, 0, W, H);
  dst.globalAlpha = 0.7 * strength;
  dst.drawImage(EB, 0, 0, W, H);
  dst.restore();
}

const VIGNETTE = (() => {
  const c = makeCanvas(W, H), g = ctx2d(c);
  const gr = g.createRadialGradient(W / 2, H * 0.46, H * 0.18, W / 2, H * 0.46, H * 0.72);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(0.6, 'rgba(0,0,0,0.18)');
  gr.addColorStop(1, 'rgba(0,0,0,0.62)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  return c;
})();

const GRAIN = (() => {
  const c = makeCanvas(512, 512), g = ctx2d(c);
  const im = g.createImageData(512, 512), r = rng(77);
  for (let i = 0; i < im.data.length; i += 4) {
    const v = 128 + (r() + r() + r() - 1.5) * 70;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
    im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return c;
})();

function grain(ctx, t, amount = 0.075) {
  const f = Math.floor(t * FPS * 2 + 0.5);
  const ox = Math.floor(hash(f) * 512), oy = Math.floor(hash(f + 999) * 512);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = amount;
  for (let y = -oy; y < H; y += 512)
    for (let x = -ox; x < W; x += 512) ctx.drawImage(GRAIN, x, y);
  ctx.restore();
}

// Final look: grade, bloom, vignette, grain.
function finishFrame(t, bloomStrength = 1) {
  octx.save();
  octx.filter = 'contrast(1.07) saturate(1.12)';
  octx.drawImage(ACC, 0, 0);
  octx.restore();
  bloom(octx, ACC, bloomStrength);
  octx.drawImage(VIGNETTE, 0, 0);
  grain(octx, t);
}

// Glassmorphism pill: frosted backdrop, light fill, gradient border.
function glassPill(ctx, x, y, w, h, opt = {}) {
  const r = opt.r !== undefined ? opt.r : h / 2;
  const tint = opt.tint || '#ffffff';
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, r); ctx.clip();
  if (opt.frost !== false) {
    ctx.globalAlpha = opt.alpha === undefined ? 1 : opt.alpha;
    ctx.drawImage(FROST, (x - w / 2) / 4, (y - h / 2) / 4, w / 4, h / 4, x - w / 2, y - h / 2, w, h);
  }
  ctx.globalAlpha = (opt.alpha === undefined ? 1 : opt.alpha);
  ctx.fillStyle = opt.fill || 'rgba(14,20,40,0.42)';
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, rgba(tint, 0.22));
  g.addColorStop(0.45, rgba(tint, 0.05));
  g.addColorStop(1, rgba(tint, 0.0));
  ctx.fillStyle = g;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = opt.alpha === undefined ? 1 : opt.alpha;
  ctx.beginPath(); ctx.roundRect(x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2, Math.max(0, r - 1));
  const b = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  b.addColorStop(0, 'rgba(255,255,255,0.55)');
  b.addColorStop(1, rgba(opt.edge || tint, 0.22));
  ctx.strokeStyle = b;
  ctx.lineWidth = opt.lw || 2;
  ctx.stroke();
  ctx.restore();
}

// Short glowing label in a glass pill, centred on (x, y).
function glassLabel(ctx, x, y, text, color, size = 38, alpha = 1, scale = 1) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  setFont(ctx, size, 800, 3);
  const tw = ctx.measureText(text).width;
  const w = tw + size * 1.05, h = size * 1.62;
  // the frost lookup needs absolute coordinates, so draw the pill untransformed when scale ~ 1
  ctx.restore();
  ctx.save();
  const sw = w * scale, sh = h * scale;
  glassPill(ctx, x, y, sw, sh, { tint: color, edge: color, alpha });
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  setFont(ctx, size, 800, 3);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = rgba(color, 0.9);
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.fillText(text, 1.5, 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = mix(color, '#ffffff', 0.35);
  ctx.fillText(text, 1.5, 2);
  ctx.restore();
  return { w: sw, h: sh };
}
