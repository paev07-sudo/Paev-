// Burned-in text: the scene headline in the top band and word-by-word captions in the lower
// third. Neither is touched by bloom or camera shake.
const HEADLINES = [
  '90% OF TRADERS LOSE 💸', 'WHERE IS THE MONEY? 🏦', 'EQUAL LOWS = LIQUIDITY 🎯', 'STEP 1: SWEEP ⚡',
  'STEP 2: STRUCTURE SHIFT 📈', 'STEP 3: FAIR VALUE GAP 🟨', 'WAIT FOR THE RETURN ⏳',
  'SL BELOW SWEEP • TP AT HIGHS 🎯', 'TARGET HIT ✅', 'SWEEP → SHIFT → GAP 🔁 SAVE THIS',
];
const EMOJI_RE = /(\p{Extended_Pictographic}|\u{1F7E8})️?/u;
const HEAD_Y = 214, CAP_Y = 1532, CAP_MAXW = 900;

function splitEmoji(s) {
  const m = s.match(EMOJI_RE);
  if (!m) return [s, '', ''];
  return [s.slice(0, m.index).trimEnd(), m[0], s.slice(m.index + m[0].length).trimStart()];
}

function headline(ctx, t, i) {
  const [a, b] = SC[i];
  const t0 = a + (i === 0 ? 0.08 : 0.04);
  const vis = win(t, t0, b, 0.12, 0.08);
  if (vis <= 0) return;
  const [text, emo, tail] = splitEmoji(HEADLINES[i]);
  let size = 46;
  setFont(ctx, size, 800, 2);
  const tailW = () => (tail ? ctx.measureText(' ' + tail).width : 0);
  const emoW = emo ? size * 1.25 : 0;
  let tw = ctx.measureText(text).width + emoW + tailW();
  const maxW = 940;
  if (tw + 72 > maxW) { size *= (maxW - 72) / (tw + 72); setFont(ctx, size, 800, 2); tw = ctx.measureText(text).width + (emo ? size * 1.25 : 0) + tailW(); }
  const w = tw + size * 1.6, h = size * 1.9;
  const sc = 0.82 + 0.18 * spring(t, t0, 4, 0.5);
  ctx.save();
  ctx.globalAlpha = vis;
  ctx.translate(W / 2, HEAD_Y);
  ctx.scale(sc, sc);
  ctx.translate(-W / 2, -HEAD_Y);
  // dark glass pill with a cyan-to-gold border
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
  ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, HEAD_Y - h / 2, w, h, h / 2);
  ctx.fillStyle = 'rgba(6,10,24,0.72)';
  ctx.fill();
  ctx.restore();
  const g = ctx.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0);
  g.addColorStop(0, rgba(COL.cyan, 0.9)); g.addColorStop(1, rgba(COL.gold, 0.9));
  ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 + 1.5, HEAD_Y - h / 2 + 1.5, w - 3, h - 3, h / 2);
  ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.stroke();
  const gl = ctx.createLinearGradient(0, HEAD_Y - h / 2, 0, HEAD_Y + h / 2);
  gl.addColorStop(0, 'rgba(255,255,255,0.16)'); gl.addColorStop(0.5, 'rgba(255,255,255,0.02)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl; ctx.fill();
  // shine sweep
  const sw = invlerp(t0 + 0.1, t0 + 0.7, t);
  if (sw > 0 && sw < 1) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, HEAD_Y - h / 2, w, h, h / 2); ctx.clip();
    const x = lerp(W / 2 - w / 2 - 120, W / 2 + w / 2 + 120, easeInOut(sw));
    const sg = ctx.createLinearGradient(x - 80, 0, x + 80, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.28)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(x - 80, HEAD_Y - h / 2, 160, h);
    ctx.restore();
  }
  // text: "STEP n:" in gold, the rest white
  setFont(ctx, size, 800, 2);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  let x = W / 2 - tw / 2;
  const m = text.match(/^(STEP \d:)(.*)$/);
  const parts = m ? [[m[1], COL.gold], [m[2], '#ffffff']] : [[text, '#ffffff']];
  for (const [p, c] of parts) {
    ctx.fillStyle = c;
    ctx.shadowColor = c === '#ffffff' ? 'rgba(0,229,255,0.45)' : rgba(COL.gold, 0.6);
    ctx.shadowBlur = 12;
    ctx.fillText(p, x, HEAD_Y + 2);
    x += ctx.measureText(p).width;
  }
  if (emo) {
    ctx.shadowBlur = 0;
    ctx.fillText(' ' + emo, x, HEAD_Y + 2);
    x += ctx.measureText(' ' + emo).width;
  }
  if (tail) {
    ctx.fillStyle = COL.gold;
    ctx.shadowColor = rgba(COL.gold, 0.6); ctx.shadowBlur = 12;
    ctx.fillText(' ' + tail, x, HEAD_Y + 2);
  }
  ctx.restore();
}

// Karaoke captions.
function captions(ctx, t) {
  const caps = TL.captions;
  let c = null;
  for (const k of caps) if (t >= k.s && t < k.e) { c = k; break; }
  if (!c) return;
  const size = 70, lh = 84;
  setFont(ctx, size, 800, 1);
  const space = ctx.measureText(' ').width;
  const toks = c.words.map(w => ({ ...w, w: ctx.measureText(w.t).width }));
  if (c.emoji) toks.push({ t: c.emoji, s: c.words[c.words.length - 1].s, e: c.e, w: size * 1.18, emoji: true });
  // wrap into lines
  const lines = [[]];
  let lw = 0;
  for (const tk of toks) {
    const add = (lines[lines.length - 1].length ? space : 0) + tk.w;
    if (lw + add > CAP_MAXW && lines[lines.length - 1].length) { lines.push([tk]); lw = tk.w; }
    else { lines[lines.length - 1].push(tk); lw += add; }
  }
  const age = t - c.s;
  const gIn = clamp(age / 0.09);
  const gOut = clamp((c.e - t) / 0.07);
  const gScale = lerp(0.72, 1, spring(t, c.s, 5, 0.5));
  const y0 = CAP_Y - (lines.length - 1) * lh / 2;
  ctx.save();
  ctx.globalAlpha = gIn * gOut;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  lines.forEach((ln, li) => {
    const total = ln.reduce((s, tk) => s + tk.w, 0) + space * (ln.length - 1);
    let x = W / 2 - total / 2;
    const y = y0 + li * lh;
    for (const tk of ln) {
      const cx = x + tk.w / 2;
      const active = !tk.emoji && t >= tk.s - 0.03 && t < tk.e + 0.05;
      const bump = tk.emoji ? spring(t, tk.s + 0.12, 4, 0.35) : 1 + 0.12 * Math.exp(-Math.max(0, t - tk.s) / 0.12) * (t >= tk.s - 0.03 ? 1 : 0);
      const s = gScale * (active ? Math.max(bump, 1.06) : bump);
      ctx.save();
      ctx.translate(cx, y);
      ctx.scale(s, s);
      if (tk.emoji) {
        ctx.font = `${size}px 'Noto Color Emoji'`;
        ctx.fillText(tk.t, 0, 2);
      } else {
        setFont(ctx, size, 800, 1);
        ctx.lineJoin = 'round';
        ctx.lineWidth = 13;
        ctx.strokeStyle = 'rgba(0,0,0,0.95)';
        ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
        ctx.strokeText(tk.t, 0, 2);
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        const col = active ? COL.gold : tk.key ? COL.cyan : '#ffffff';
        ctx.fillStyle = col;
        if (active) { ctx.shadowColor = rgba(COL.gold, 0.75); ctx.shadowBlur = 16; }
        ctx.fillText(tk.t, 0, 2);
      }
      ctx.restore();
      x += tk.w + space;
    }
  });
  ctx.restore();
}

function disclaimer(ctx, t) {
  const a = win(t, CU.disclaimer, 1e9, 0.3);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a * 0.78;
  setFont(ctx, 29, 600, 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8;
  ctx.fillStyle = '#e8eefc';
  ctx.fillText('Educational only. Not financial advice.', W / 2, 1668);
  ctx.restore();
}
