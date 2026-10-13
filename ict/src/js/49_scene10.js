// Scene 10: SWEEP -> SHIFT -> GAP. Three glass tiles light up on the words, joined by cyan light.
const TILES = [222, 540, 858], TILE_Y = 850, TILE = 236;

function iconSweep(ctx, on, t) {
  // dashed liquidity line, a red candle whose long lower wick pierces it, sparks at the pierce
  ctx.save();
  ctx.lineCap = 'round';
  ctx.setLineDash([16, 11]);
  ctx.strokeStyle = rgba(COL.cyan, 0.35 + 0.65 * on); ctx.lineWidth = 6;
  ctx.shadowColor = COL.cyan; ctx.shadowBlur = 14 * on;
  ctx.beginPath(); ctx.moveTo(-86, 34); ctx.lineTo(86, 34); ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowColor = COL.red; ctx.shadowBlur = 18 * on;
  ctx.strokeStyle = mix(COL.red, '#ffffff', 0.25, 0.4 + 0.6 * on); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, -84); ctx.lineTo(0, 74); ctx.stroke();
  const g = ctx.createLinearGradient(0, -66, 0, -6);
  g.addColorStop(0, mix(COL.red, '#ffffff', 0.4, 0.4 + 0.6 * on)); g.addColorStop(1, mix(COL.red, '#000000', 0.3, 0.4 + 0.6 * on));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.roundRect(-19, -66, 38, 60, 5); ctx.fill();
  ctx.restore();
  if (on > 0.05) for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.15 + 0.7 * hash(i * 5)) + Math.PI, l = 18 + hash(i * 9) * 22;
    ctx.strokeStyle = rgba(i % 2 ? COL.gold : '#ffffff', 0.85 * on); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 10, 34 + Math.sin(a) * -10); ctx.lineTo(Math.cos(a) * l, 34 - Math.sin(a) * l); ctx.stroke();
  }
}

function iconShift(ctx, on, t) {
  // a broken white line and a green arrow driving up through the break
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba('#ffffff', 0.35 + 0.65 * on); ctx.lineWidth = 7;
  ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10 * on;
  ctx.beginPath(); ctx.moveTo(-86, -6); ctx.lineTo(-18, -6); ctx.moveTo(18, -6); ctx.lineTo(86, -6); ctx.stroke();
  ctx.strokeStyle = rgba(COL.green, 0.4 + 0.6 * on); ctx.lineWidth = 15;
  ctx.shadowColor = COL.green; ctx.shadowBlur = 22 * on;
  ctx.beginPath(); ctx.moveTo(-58, 76); ctx.lineTo(-18, 30); ctx.lineTo(4, 44); ctx.lineTo(44, -56); ctx.stroke();
  ctx.fillStyle = rgba(COL.green, 0.4 + 0.6 * on);
  ctx.beginPath(); ctx.moveTo(62, -88); ctx.lineTo(18, -62); ctx.lineTo(60, -40); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (on > 0.05) {
    drawDot(ctx, 4, -6, 34, '#ffffff', 0.7 * on);
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2 + 0.3;
      ctx.strokeStyle = rgba('#ffffff', 0.8 * on); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(4 + Math.cos(a) * 14, -6 + Math.sin(a) * 14); ctx.lineTo(4 + Math.cos(a) * 26, -6 + Math.sin(a) * 26); ctx.stroke();
    }
  }
}

function iconGap(ctx, on, t) {
  // candles 1-2-3 and the gold box between candle 1's high and candle 3's low
  const a = 0.4 + 0.6 * on;
  ctx.save();
  ctx.lineCap = 'round';
  const candle = (x, top, bot, wt, wb) => {
    ctx.strokeStyle = rgba(COL.green, a); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, wt); ctx.lineTo(x, wb); ctx.stroke();
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, mix(COL.green, '#ffffff', 0.35, a)); g.addColorStop(1, mix(COL.green, '#000000', 0.35, a));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x - 15, top, 30, bot - top, 4); ctx.fill();
  };
  candle(-56, 34, 70, 18, 80);
  candle(0, -52, 52, -60, 60);
  candle(56, -70, -34, -82, -18);
  ctx.shadowColor = COL.gold; ctx.shadowBlur = 26 * on;
  ctx.fillStyle = rgba(COL.gold, 0.18 + 0.22 * on * (0.8 + 0.2 * Math.sin(t * 6)));
  ctx.fillRect(-82, -18, 164, 36);
  ctx.strokeStyle = rgba(COL.gold, 0.5 + 0.5 * on); ctx.lineWidth = 4;
  ctx.strokeRect(-82, -18, 164, 36);
  ctx.restore();
}

function scene10(ctx, t, tc) {
  const [a, b] = SC[9];
  const u = easeInOut(invlerp(a, b, t));
  const cam = new Cam({ target: [9, 0, 0], dist: 40, yaw: lerp(-4, 3, u), pitch: 2, cy: 900 });
  drawSpace(ctx, cam, t, { grid: true, gridY: -12 });
  drawDust(ctx, cam, t, 40, { alpha: 0.7 });
  // spotlight behind the row
  drawDot(ctx, W / 2, TILE_Y, 720, '#0b3d6e', 0.55);
  const zoom = tc < CU.s10_cut ? lerp(1.0, 1.03, invlerp(a, CU.s10_cut, t)) : lerp(1.09, 1.12, invlerp(CU.s10_cut, b, t));
  ctx.save();
  ctx.translate(W / 2, TILE_Y);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2, -TILE_Y);
  const lit = CU.icons.map(ti => clamp((t - ti + 0.04) / 0.12));
  const save = pulse(t, CU.save, 0.45);
  // beams between tiles
  for (let i = 0; i < 2; i++) {
    const x0 = TILES[i] + TILE / 2 + 6, x1 = TILES[i + 1] - TILE / 2 - 6;
    const fill = easeOutCubic(clamp((t - (CU.icons[i + 1] - 0.22)) / 0.22));
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(COL.cyan, 0.16); ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x0, TILE_Y); ctx.lineTo(x1, TILE_Y); ctx.stroke();
    if (fill > 0) {
      const xe = lerp(x0, x1, fill);
      ctx.strokeStyle = rgba(COL.cyan, 0.95); ctx.lineWidth = 6;
      ctx.shadowColor = COL.cyan; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.moveTo(x0, TILE_Y); ctx.lineTo(xe, TILE_Y); ctx.stroke();
      ctx.fillStyle = COL.cyan;
      ctx.beginPath(); ctx.moveTo(xe + 4, TILE_Y); ctx.lineTo(xe - 12, TILE_Y - 13); ctx.lineTo(xe - 12, TILE_Y + 13); ctx.closePath(); ctx.fill();
      // pulses travelling along the beam
      for (let k = 0; k < 3; k++) {
        const ph = ((t * 1.6 + k / 3) % 1);
        if (fill >= 1) drawDot(ctx, lerp(x0, x1, ph), TILE_Y, 16, '#ffffff', 0.8 * Math.sin(Math.PI * ph));
      }
    }
    ctx.restore();
  }
  const icons = [iconSweep, iconShift, iconGap];
  const names = [['SWEEP', COL.cyan], ['MSS', '#ffffff'], ['FVG', COL.gold]];
  for (let i = 0; i < 3; i++) {
    const x = TILES[i], on = lit[i], burst = pulse(t, CU.icons[i], 0.35);
    const sc = 0.9 + 0.1 * spring(t, CU.icons[i] - 0.04, 4, 0.35) + 0.05 * save;
    drawDot(ctx, x, TILE_Y, TILE * (1.1 + 0.4 * burst), i === 2 ? COL.gold : COL.cyan, 0.25 * on + 0.35 * burst);
    ctx.save();
    ctx.translate(x, TILE_Y); ctx.scale(sc, sc); ctx.translate(-x, -TILE_Y);
    glassPill(ctx, x, TILE_Y, TILE, TILE, { r: 46, tint: i === 2 ? COL.gold : COL.cyan, edge: i === 2 ? COL.gold : COL.cyan,
                                         fill: `rgba(10,16,34,${0.55 + 0.15 * on})`, frost: false, lw: 2 + 2 * on });
    ctx.translate(x, TILE_Y);
    ctx.scale(1.05, 1.05);
    icons[i](ctx, on, t);
    ctx.restore();
    // burst ring
    if (burst > 0.01) {
      ctx.save();
      ctx.strokeStyle = rgba(i === 2 ? COL.gold : COL.cyan, 0.9 * burst);
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(x - TILE / 2 - 30 * (1 - burst), TILE_Y - TILE / 2 - 30 * (1 - burst), TILE + 60 * (1 - burst), TILE + 60 * (1 - burst), 52); ctx.stroke();
      ctx.restore();
    }
    // label under the tile
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * on;
    setFont(ctx, 44, 800, 3);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = rgba(names[i][1], 0.8); ctx.shadowBlur = 16 * on;
    ctx.fillStyle = names[i][1];
    ctx.fillText(names[i][0], x + 1.5, TILE_Y + TILE / 2 + 62);
    ctx.restore();
  }
  ctx.restore();
}
