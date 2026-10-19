'use strict';
// ======================= 场景 =======================
const canBuild = (cx, cy) => cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS && !pathCells.has(cx + ',' + cy) && !S.towers.some(t => t.cx === cx && t.cy === cy);
function drawAstrolabe(m) {
  m.save(); m.translate(W / 2, H / 2); m.strokeStyle = 'rgba(217,180,108,.11)'; m.lineWidth = 1;
  m.rotate(clock * 0.03); circ(m, 0, 0, 250); m.stroke();
  m.beginPath();
  for (let i = 0; i < 72; i++) { const a = i * Math.PI / 36, r1 = i % 6 ? 256 : 266; m.moveTo(Math.cos(a) * 250, Math.sin(a) * 250); m.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); }
  m.stroke();
  m.rotate(-clock * 0.08); m.setLineDash([3, 9]); circ(m, 0, 0, 205); m.stroke(); m.setLineDash([]);
  circ(m, 0, 0, 300); m.stroke();
  m.restore();
}
function drawPortals(m, f) {
  const s = { x: pathPts[0].x + T, y: pathPts[0].y };
  glow(f, s.x, s.y, 44, '#a05cff', 0.55);
  f.strokeStyle = '#c99bff'; f.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const a = clock * (2 - i * 0.5) + i; f.beginPath(); f.arc(s.x, s.y, 9 + i * 6, a, a + Math.PI * 1.2); f.stroke(); }
  const e = { x: pathPts.at(-1).x - T, y: pathPts.at(-1).y }, pulse = 0.6 + 0.4 * Math.sin(clock * 3);
  glow(f, e.x, e.y, 46, S.hurt > 0 ? '#ff3355' : '#ffd27a', 0.3 + 0.25 * pulse);
  if (S.shield > 0) {
    f.strokeStyle = '#8fe9ff'; f.lineWidth = 2;
    poly(f, e.x, e.y, 30, 6, clock * 0.5); f.stroke();
    for (let i = 0; i < S.shield; i++) { const a = clock * 1.5 + i * TAU / S.shield; glow(f, e.x + Math.cos(a) * 30, e.y + Math.sin(a) * 30, 8, '#8fe9ff'); }
  }
  m.save(); m.translate(e.x, e.y + Math.sin(clock * 2) * 3);
  m.beginPath(); m.moveTo(0, -18); m.lineTo(11, 0); m.lineTo(0, 18); m.lineTo(-11, 0); m.closePath();
  const g = m.createLinearGradient(0, -18, 0, 18); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d9a440');
  m.fillStyle = g; m.fill(); m.strokeStyle = '#fff'; m.lineWidth = 1; m.stroke();
  m.restore();
}

// ======================= 塔 =======================
function drawTower(m, f, tw) {
  const B = TOWERS[tw.type], c = B.col, st = towerStats(tw);
  if (tw === S.picked) {
    m.setLineDash([6, 6]); m.strokeStyle = c; m.globalAlpha = 0.7; m.lineWidth = 1.5;
    circ(m, tw.x, tw.y, st.range); m.stroke(); m.globalAlpha = 0.06; m.fillStyle = c; m.fill(); m.globalAlpha = 1; m.setLineDash([]);
  }
  if (tw.type === 'harmony') { // 光环范围常驻显示
    const r = st.range, pulse = (clock * 0.6) % 1;
    m.fillStyle = hexA(c, 0.05); circ(m, tw.x, tw.y, r); m.fill();
    f.strokeStyle = hexA(c, 0.35); f.lineWidth = 1.2; f.setLineDash([2, 10]);
    f.save(); f.translate(tw.x, tw.y); f.rotate(clock * 0.3); circ(f, 0, 0, r); f.stroke(); f.restore(); f.setLineDash([]);
    f.globalAlpha = (1 - pulse) * 0.5; f.strokeStyle = c; f.lineWidth = 2; circ(f, tw.x, tw.y, r * pulse); f.stroke(); f.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { // 环绕音符
      const a = clock * 1.4 + i * TAU / 3, rr = 26 + Math.sin(clock * 2 + i) * 4;
      drawNote(f, tw.x + Math.cos(a) * rr, tw.y + Math.sin(a) * rr, 5, c, 0.85);
    }
  }
  if (tw.buff > 0) { // 被同协增益
    f.strokeStyle = hexA(TOWERS.harmony.col, 0.7); f.lineWidth = 1.2;
    for (let i = 0; i < 2; i++) { const a = -clock * 2 + i * Math.PI; f.beginPath(); f.arc(tw.x, tw.y, 22, a, a + 1.2); f.stroke(); }
  }
  // 底座
  poly(m, tw.x, tw.y, 19, 6, Math.PI / 6); m.fillStyle = 'rgba(12,16,38,.94)'; m.fill();
  m.strokeStyle = hexA(c, .65); m.lineWidth = 1.5; m.stroke();
  poly(m, tw.x, tw.y, 15, 6, Math.PI / 6); m.strokeStyle = hexA(c, .25); m.lineWidth = 1; m.stroke();
  glow(f, tw.x, tw.y, 20 + tw.flash * 16, c, 0.28 + tw.flash * 0.45);
  // 旋转符文环
  f.save(); f.translate(tw.x, tw.y); f.rotate(clock * (tw.type === 'preserve' ? -1 : 1) * (0.6 + tw.lvl * 0.15));
  f.strokeStyle = c; f.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) { f.beginPath(); f.arc(0, 0, 16.5, i * 2.094, i * 2.094 + 1.3); f.stroke(); }
  f.restore();
  // 朝向指示
  if (tw.type !== 'harmony') {
    f.save(); f.translate(tw.x, tw.y); f.rotate(tw.angle); f.fillStyle = c;
    f.beginPath(); f.moveTo(25 - tw.flash * 3, 0); f.lineTo(20, -3.5); f.lineTo(20, 3.5); f.closePath(); f.fill(); f.restore();
  }
  // 命途徽记
  const sc = 1 + tw.flash * 0.15;
  drawEmblem(f, tw.type, tw.x, tw.y, 9.5 * sc, '#ffffff', tw.type === 'erudite' ? clock * 0.8 : 0, 1.6);
  drawEmblem(f, tw.type, tw.x, tw.y, 9.5 * sc, c, tw.type === 'erudite' ? clock * 0.8 : 0, 3.2);
  m.fillStyle = c;
  for (let i = 0; i < tw.lvl; i++) { star4(m, tw.x - (tw.lvl - 1) * 4 + i * 8, tw.y + 16, 3.2, 1.1); m.fill(); }
}
function drawNote(g, x, y, s, col, a = 1) {
  g.globalAlpha = a; g.fillStyle = col; g.strokeStyle = col; g.lineWidth = s * 0.28;
  g.beginPath(); g.ellipse(x, y, s * 0.55, s * 0.4, -0.4, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(x + s * 0.5, y - s * 0.1); g.lineTo(x + s * 0.5, y - s * 1.5); g.quadraticCurveTo(x + s * 1.1, y - s * 1.2, x + s * 1.0, y - s * 0.7); g.stroke();
  g.globalAlpha = 1;
}

// ======================= 敌人 =======================
function drawEnemy(m, f, e) {
  const E = ETYPES[e.type], broken = e.brokenT > 0;
  const col = e.frozen > 0 ? '#9eeaff' : e.imprisonT > 0 ? '#ffe066' : e.slowT > 0 ? '#9eeaff' : E.color;
  glow(f, e.x, e.y, e.r * 2.4, col, e.type === 'boss' ? 0.4 : 0.22);
  if (e.vulnT > 0) { // 虚无侵蚀：紫色雾气
    glow(f, e.x, e.y, e.r * 2.2, '#7b3dff', 0.4 + 0.15 * Math.sin(clock * 6));
    if (Math.random() < 0.15) part({ x: e.x + rnd(-e.r, e.r), y: e.y, vx: rnd(-10, 10), vy: rnd(-40, -20), col: '#b98bff', size: 2, life: 0.6, drag: 0.95 });
  }
  m.save(); m.translate(e.x, e.y);
  if (broken) m.translate(Math.sin(clock * 40) * 1.2, 0);
  if (e.type === 'boss') {
    m.fillStyle = col;
    for (let i = 0; i < 8; i++) {
      const a = -e.rot * 1.5 + i * Math.PI / 4; m.beginPath();
      m.moveTo(Math.cos(a) * e.r * 1.15, Math.sin(a) * e.r * 1.15);
      m.lineTo(Math.cos(a + 0.15) * e.r * 1.6, Math.sin(a + 0.15) * e.r * 1.6);
      m.lineTo(Math.cos(a + 0.3) * e.r * 1.15, Math.sin(a + 0.3) * e.r * 1.15); m.fill();
    }
  }
  m.rotate(e.rot);
  poly(m, 0, 0, e.r, E.sides); m.fillStyle = e.flash > 0 ? '#ffffff' : '#0d0f1c'; m.fill();
  m.strokeStyle = col; m.lineWidth = 2.5; m.stroke();
  if (broken) { // 裂纹
    m.strokeStyle = '#ffffff'; m.lineWidth = 1.2; m.beginPath();
    m.moveTo(-e.r * 0.8, -e.r * 0.2); m.lineTo(-e.r * 0.1, e.r * 0.1); m.lineTo(e.r * 0.3, -e.r * 0.6);
    m.moveTo(-e.r * 0.1, e.r * 0.1); m.lineTo(e.r * 0.2, e.r * 0.8); m.stroke();
  }
  poly(m, 0, 0, e.r * 0.45, E.sides, Math.PI / E.sides); m.fillStyle = col; m.fill();
  m.restore();
  if (e.frozen > 0) {
    poly(m, e.x, e.y, e.r + 8, 6); m.fillStyle = 'rgba(160,230,255,.35)'; m.fill();
    m.strokeStyle = 'rgba(235,252,255,.9)'; m.lineWidth = 1.5; m.stroke();
  } else if (e.slowT > 0) {
    f.strokeStyle = 'rgba(190,240,255,.8)'; f.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { const a = clock * 2 + i * Math.PI / 2; f.beginPath(); f.arc(e.x, e.y, e.r + 5, a, a + 0.6); f.stroke(); }
  }
  if (e.imprisonT > 0) { // 禁锢：金色锁环
    f.strokeStyle = '#ffe066'; f.lineWidth = 1.5;
    f.beginPath(); f.ellipse(e.x, e.y, e.r + 7, (e.r + 7) * 0.35, clock, 0, TAU); f.stroke();
    f.beginPath(); f.ellipse(e.x, e.y, e.r + 7, (e.r + 7) * 0.35, -clock, 0, TAU); f.stroke();
  }
  if (broken && e.stun > 0) { // 眩晕星
    for (let i = 0; i < 3; i++) { const a = clock * 4 + i * TAU / 3; f.fillStyle = '#ffe066'; star4(f, e.x + Math.cos(a) * (e.r + 4), e.y - e.r - 6 + Math.sin(a) * 3, 3.5, 1); f.fill(); }
  }
  if (e.dots.burn && Math.random() < 0.4) part({ x: e.x + rnd(-e.r, e.r), y: e.y, vx: rnd(-10, 10), vy: rnd(-70, -40), col: pick(['#ff7a2e', '#ffb05a']), size: 2.5, life: 0.4, drag: 0.95 });
  if (e.dots.shock && Math.random() < 0.25) S.bolts.push({ pts: jagged([{ x: e.x - e.r, y: e.y - e.r }, { x: e.x + e.r, y: e.y + e.r }], 5), life: 0.1, max: 0.1, col: '#c77dff', w: 1.2, raw: true });
  if (e.dots.wind && Math.random() < 0.3) part({ x: e.x, y: e.y, vx: rnd(-60, 60), vy: rnd(-60, 60), col: '#5fffc0', size: 1.6, life: 0.4, tail: 0.08 });
  if (e.dots.bleed && Math.random() < 0.3) part({ x: e.x, y: e.y, vx: rnd(-30, 30), vy: rnd(10, 40), col: '#ff4d6d', size: 2, life: 0.4 });
  // 血条 + 韧性条
  const bw = e.r * 2 + 8, bx = e.x - bw / 2, by = e.y - e.r - 12, k = Math.max(0, e.hp / e.maxHp);
  m.fillStyle = 'rgba(0,0,0,.65)'; m.fillRect(bx, by, bw, 4); m.fillRect(bx, by + 5, bw, 2.5);
  m.fillStyle = k > 0.5 ? '#7dffb0' : k > 0.25 ? '#ffd84d' : '#ff4d6d'; m.fillRect(bx, by, bw * k, 4);
  if (broken) { m.fillStyle = hexA('#ffffff', 0.25 + 0.2 * Math.sin(clock * 10)); m.fillRect(bx, by + 5, bw, 2.5); }
  else { m.fillStyle = e.toughFlash > 0 ? '#ffe066' : '#f2f4ff'; m.fillRect(bx, by + 5, bw * Math.max(0, e.tough / e.maxTough), 2.5); }
  // 弱点
  e.weak.forEach((el, i) => elemDiamond(m, e.x + (i - (e.weak.length - 1) / 2) * 9, by - 6, 3.6, el));
}

// ======================= 场地物件 =======================
function drawMines(m, f) {
  for (const mn of S.mines) {
    if (mn.t < mn.fly) { // 抛物线飞行中
      const k = clamp01(mn.t / mn.fly), x = mn.sx + (mn.x - mn.sx) * k, y = mn.sy + (mn.y - mn.sy) * k - Math.sin(Math.PI * k) * 50;
      if (mn.t < 0) continue;
      drawJokeBox(m, f, x, y, mn, k * 10);
      continue;
    }
    drawJokeBox(m, f, mn.x, mn.y, mn, 0);
  }
}
function drawJokeBox(m, f, x, y, mn, spin) {
  const bob = Math.sin(clock * 4 + mn.seed) * 1.5, s = mn.golden ? 9 : 7.5;
  const c1 = mn.golden ? '#ffe066' : '#ff8ad8', c2 = mn.golden ? '#fff6c0' : '#7fe3ff';
  glow(f, x, y + bob, 18, c1, 0.4 + 0.2 * Math.sin(clock * 6 + mn.seed));
  m.save(); m.translate(x, y + bob); m.rotate(spin + Math.sin(clock * 3 + mn.seed) * 0.12);
  m.fillStyle = c1; m.fillRect(-s, -s, s * 2, s * 2);
  m.fillStyle = c2; m.fillRect(-s, -s * 0.2, s * 2, s * 0.4); m.fillRect(-s * 0.2, -s, s * 0.4, s * 2);
  m.strokeStyle = '#2a0f2a'; m.lineWidth = 1; m.strokeRect(-s, -s, s * 2, s * 2);
  m.fillStyle = c2; m.beginPath(); m.ellipse(-s * 0.4, -s - 2, 3.5, 2, -0.5, 0, TAU); m.fill(); m.beginPath(); m.ellipse(s * 0.4, -s - 2, 3.5, 2, 0.5, 0, TAU); m.fill();
  m.fillStyle = '#2a0f2a'; m.font = `bold ${s}px sans-serif`; m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillText('?', s * 0.5, s * 0.5);
  m.restore();
}
function drawPops(m, f) {
  for (const p of S.pops) { // 弹簧小丑脸弹出
    const k = 1 - p.life / p.max, h = Math.sin(Math.min(1, k * 2.2) * Math.PI * 0.5) * 34 * (1 - Math.max(0, k - 0.6) * 2.5), a = Math.min(1, p.life / 0.25);
    m.save(); m.globalAlpha = a; m.translate(p.x, p.y);
    m.strokeStyle = '#ffe066'; m.lineWidth = 2; m.beginPath();
    for (let i = 0; i <= 12; i++) m.lineTo(Math.sin(i * 1.6) * 5, -i * h / 12);
    m.stroke();
    const fr = p.sup ? 13 : 10, fy = -h - fr * 0.6;
    m.fillStyle = p.sup ? '#ffe066' : '#fff0fa'; circ(m, 0, fy, fr); m.fill(); m.strokeStyle = '#ff8ad8'; m.lineWidth = 1.5; m.stroke();
    m.fillStyle = '#ff4d6d'; circ(m, 0, fy + 1, fr * 0.22); m.fill();
    m.fillStyle = '#2a0f2a'; star4(m, -fr * 0.38, fy - fr * 0.25, fr * 0.22, fr * 0.07); m.fill(); star4(m, fr * 0.38, fy - fr * 0.25, fr * 0.22, fr * 0.07); m.fill();
    m.strokeStyle = '#2a0f2a'; m.lineWidth = 1.4; m.beginPath(); m.arc(0, fy + fr * 0.15, fr * 0.5, 0.3, Math.PI - 0.3); m.stroke();
    m.fillStyle = '#7fe3ff'; m.beginPath(); m.moveTo(-fr * 0.7, fy - fr * 0.7); m.lineTo(0, fy - fr * 1.9); m.lineTo(fr * 0.7, fy - fr * 0.7); m.closePath(); m.fill();
    m.restore();
  }
}

// ======================= 投射物与特效 =======================
function drawBullets(m, f) {
  for (const b of S.bullets) {
    if (b.kind === 'arrow') { // 星矢：金色光羽箭
      f.lineCap = 'round'; f.strokeStyle = b.col; f.lineWidth = 3; f.globalAlpha = 0.55;
      f.beginPath(); b.trail.forEach((p, i) => i ? f.lineTo(p.x, p.y) : f.moveTo(p.x, p.y)); f.lineTo(b.x, b.y); f.stroke(); f.globalAlpha = 1;
      f.save(); f.translate(b.x, b.y); f.rotate(b.rot);
      f.fillStyle = '#ffffff'; f.beginPath(); f.moveTo(9, 0); f.lineTo(-4, -3); f.lineTo(-2, 0); f.lineTo(-4, 3); f.closePath(); f.fill();
      f.fillStyle = b.col; f.beginPath(); f.moveTo(-3, 0); f.lineTo(-11, -5); f.lineTo(-8, 0); f.lineTo(-11, 5); f.closePath(); f.fill();
      f.restore();
      glow(f, b.x, b.y, b.crit ? 16 : 10, b.col, 0.9);
      if (b.crit) { f.fillStyle = '#fff'; star4(f, b.x, b.y, 7, 1.5, clock * 8); f.fill(); }
    } else if (b.kind === 'comet') { // 炎彗：拖尾火球
      glow(f, b.x, b.y, 22, '#ff7a2e', 0.9); glow(f, b.x, b.y, 9, '#fff0c0', 1);
      f.save(); f.translate(b.x, b.y); f.rotate(b.rot + Math.PI);
      f.fillStyle = hexA('#ff8a3d', 0.7); f.beginPath(); f.moveTo(0, -6); f.quadraticCurveTo(18, 0, 32, 0); f.quadraticCurveTo(18, 0, 0, 6); f.closePath(); f.fill();
      f.restore();
    } else if (b.kind === 'shard') { // 冰棱：旋转冰晶
      glow(f, b.x, b.y, 12, '#8fe9ff', 0.7);
      m.save(); m.translate(b.x, b.y); m.rotate(Math.atan2(b.vy, b.vx));
      m.beginPath(); m.moveTo(9, 0); m.lineTo(0, -3.5); m.lineTo(-7, 0); m.lineTo(0, 3.5); m.closePath();
      const g = m.createLinearGradient(-7, 0, 9, 0); g.addColorStop(0, '#5fb8ff'); g.addColorStop(1, '#ffffff');
      m.fillStyle = g; m.fill(); m.strokeStyle = '#e8fdff'; m.lineWidth = 0.8; m.stroke();
      m.restore();
    } else if (b.kind === 'blade') { // 月刃：旋转弧光
      const r = 13;
      f.save(); f.translate(b.x, b.y); f.rotate(clock * 18);
      for (let i = 0; i < 2; i++) {
        f.rotate(Math.PI);
        f.fillStyle = i ? '#ffffff' : hexA('#c9d4ff', 0.9);
        f.beginPath(); f.arc(0, 0, r, -0.2, 1.6); f.arc(r * 0.35, -r * 0.1, r * 0.75, 1.6, -0.2, true); f.closePath(); f.fill();
      }
      f.restore();
      glow(f, b.x, b.y, 18, '#c9d4ff', 0.6);
    }
  }
}
function drawBolt(f, pts, col, w, a) {
  f.lineJoin = 'round'; f.lineCap = 'round';
  f.globalAlpha = a; f.strokeStyle = col; f.lineWidth = w * 2.5;
  f.beginPath(); pts.forEach((p, i) => i ? f.lineTo(p.x, p.y) : f.moveTo(p.x, p.y)); f.stroke();
  f.strokeStyle = '#ffffff'; f.lineWidth = w * 0.7; f.stroke();
  f.globalAlpha = 1;
}
function drawFx(m, f) {
  drawBullets(m, f);
  for (const mt of S.meteors) {
    const k = Math.pow(mt.t / mt.dur, 1.6), x = mt.x0 + (mt.tx - mt.x0) * k, y = mt.y0 + (mt.ty - mt.y0) * k;
    const dx = mt.tx - mt.x0, dy = mt.ty - mt.y0, d = Math.hypot(dx, dy);
    f.lineCap = 'round'; f.strokeStyle = '#ff7a2e'; f.lineWidth = 10; f.globalAlpha = 0.6;
    f.beginPath(); f.moveTo(x - dx / d * 120, y - dy / d * 120); f.lineTo(x, y); f.stroke();
    f.strokeStyle = '#fff0c0'; f.lineWidth = 3; f.globalAlpha = 1; f.stroke();
    glow(f, x, y, 34, '#ff8a3d'); glow(f, x, y, 14, '#ffffff');
  }
  for (const bm of S.beams) {
    const a = bm.life / bm.max; f.globalAlpha = a; f.lineCap = 'round';
    f.beginPath(); f.moveTo(bm.x1, bm.y1);
    if (bm.wisp) { const k = 1 - a; f.quadraticCurveTo(bm.cx, bm.cy, bm.x2, bm.y2); f.setLineDash([6 + k * 30, 8]); f.lineDashOffset = -clock * 120; }
    else f.lineTo(bm.x2, bm.y2);
    f.strokeStyle = bm.col; f.lineWidth = bm.w * a + 1; f.stroke();
    f.strokeStyle = '#ffffff'; f.lineWidth = 1.5 * a + 0.4; f.stroke(); f.setLineDash([]);
    if (bm.arrow && a > 0.6) glow(f, bm.x2, bm.y2, 14, '#fff3c4', 1);
  }
  f.globalAlpha = 1;
  for (const bo of S.bolts) {
    const a = bo.life / bo.max;
    if (!bo.cache || Math.random() < 0.5) bo.cache = bo.raw ? bo.pts : jagged(bo.pts, 9);
    drawBolt(f, bo.cache, bo.col, bo.w, a);
    if (!bo.raw) for (const p of bo.pts.slice(1)) glow(f, p.x, p.y, 20, bo.col, a);
  }
  for (const th of S.thorns) { // 虚棘：从地面刺出的紫色晶刺
    const k = 1 - th.life / th.max, grow = ease3(k / 0.25), a = th.life < 0.25 ? th.life / 0.25 : 1;
    f.globalAlpha = a;
    for (let i = 0; i < th.n; i++) {
      const ang = th.seed + i * TAU / th.n, L = (12 + (i % 2) * 7) * grow;
      const bx = th.x + Math.cos(ang) * 5, by = th.y + Math.sin(ang) * 5;
      f.fillStyle = i % 2 ? th.col : '#e2d0ff';
      f.beginPath(); f.moveTo(bx + Math.cos(ang + 1.57) * 3, by + Math.sin(ang + 1.57) * 3);
      f.lineTo(th.x + Math.cos(ang) * (5 + L), th.y + Math.sin(ang) * (5 + L));
      f.lineTo(bx + Math.cos(ang - 1.57) * 3, by + Math.sin(ang - 1.57) * 3); f.closePath(); f.fill();
    }
    f.globalAlpha = 1; glow(f, th.x, th.y, 18, th.col, a * 0.6);
  }
  for (const sl of S.slashes) { // 斩击弧光
    const a = sl.life / sl.max, k = 1 - a;
    for (const ang of sl.cross ? [sl.a, sl.a + Math.PI / 2] : [sl.a]) {
      f.save(); f.translate(sl.x, sl.y); f.rotate(ang); f.globalAlpha = a;
      const L = sl.len * (0.6 + 0.4 * ease3(k * 3)), th = 4 * a + 0.5;
      f.fillStyle = sl.col; f.beginPath(); f.moveTo(-L, 0); f.quadraticCurveTo(0, -th * 2, L, 0); f.quadraticCurveTo(0, th, -L, 0); f.fill();
      f.restore();
    }
  }
  f.globalAlpha = 1;
  for (const p of S.parts) if (!p.main) drawPart(f, p);
  for (const r of S.rings) {
    const a = r.life / r.max, rr = r.r * (1 - Math.pow(a, 3));
    f.globalAlpha = a; f.strokeStyle = r.col; f.lineWidth = r.w * a + 0.5;
    circ(f, r.x, r.y, rr); f.stroke();
  }
  for (const fl of S.flashes) glow(f, fl.x, fl.y, fl.r, fl.col, fl.life / fl.max);
  f.globalAlpha = 1;
}
function drawPart(g, p) {
  const a = p.life / p.max; g.globalAlpha = Math.min(1, a * 1.5);
  switch (p.shape) {
    case 'star': g.fillStyle = p.col; star4(g, p.x, p.y, p.size * 1.4, p.size * 0.35, p.rot); g.fill(); break;
    case 'shard':
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.col;
      g.beginPath(); g.moveTo(p.size * 1.6, 0); g.lineTo(0, -p.size * 0.6); g.lineTo(-p.size, 0); g.lineTo(0, p.size * 0.6); g.closePath(); g.fill(); g.restore(); break;
    case 'confetti':
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.cos(p.rot * 1.7)); g.fillStyle = p.col;
      g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); g.restore(); break;
    case 'smoke': g.globalAlpha = a * 0.5; g.fillStyle = p.col; circ(g, p.x, p.y, p.size * (1.6 - a * 0.6)); g.fill(); break;
    case 'note': drawNote(g, p.x, p.y, p.size * 1.4, p.col, Math.min(1, a * 1.5)); break;
    case 'flake':
      g.strokeStyle = p.col; g.lineWidth = 0.8;
      g.beginPath(); for (let i = 0; i < 3; i++) { const an = p.rot + i * Math.PI / 3; g.moveTo(p.x - Math.cos(an) * p.size * 1.5, p.y - Math.sin(an) * p.size * 1.5); g.lineTo(p.x + Math.cos(an) * p.size * 1.5, p.y + Math.sin(an) * p.size * 1.5); }
      g.stroke(); break;
    default:
      g.strokeStyle = p.col; g.lineWidth = p.size * a + 0.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * p.tail, p.y - p.vy * p.tail); g.stroke();
  }
  g.globalAlpha = 1;
}

// ======================= 终结技场景 =======================
function drawUltScenes(m, f) {
  if (S.hole) {
    const h = S.hole, k = ease3(h.t / 0.4), r = 46 * k * (1 + 0.08 * Math.sin(clock * 20));
    glow(f, h.x, h.y, 200 * k, '#7b3dff', 0.6);
    f.strokeStyle = '#d4b8ff'; f.lineWidth = 3;
    for (let i = 0; i < 5; i++) { const a = -clock * 6 + i * 1.256; f.beginPath(); f.ellipse(h.x, h.y, r * 1.9, r * 0.7, 0.4, a, a + 0.9); f.stroke(); }
    const g = m.createRadialGradient(h.x, h.y, 0, h.x, h.y, r * 1.3);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.7, 'rgba(10,0,25,.95)'); g.addColorStop(1, 'rgba(60,20,120,0)');
    m.fillStyle = g; circ(m, h.x, h.y, r * 1.3); m.fill();
  }
  if (S.constel) { // 巡猎：星座连线
    const c = S.constel, k = clamp01(c.t / 0.35), a = c.t > c.dur - 0.4 ? (c.dur - c.t) / 0.4 : 1, n = Math.ceil(c.pts.length * k);
    f.globalAlpha = a * 0.8; f.strokeStyle = '#ffe08a'; f.lineWidth = 1.5; f.setLineDash([4, 5]);
    f.beginPath(); c.pts.slice(0, n).forEach((p, i) => i ? f.lineTo(p.x, p.y) : f.moveTo(p.x, p.y)); f.stroke(); f.setLineDash([]);
    for (const p of c.pts.slice(0, n)) { f.fillStyle = '#fff6d0'; star4(f, p.x, p.y, 10, 2, clock); f.fill(); glow(f, p.x, p.y, 22, '#ffd27a', a); }
    f.globalAlpha = 1;
  }
  if (S.circle) { // 智识：全屏雷霆法阵
    const c = S.circle, k = ease3(c.t / 0.3), a = c.t > c.dur - 0.4 ? (c.dur - c.t) / 0.4 : 1, R = 230 * k;
    f.save(); f.translate(W / 2, H / 2); f.globalAlpha = a * 0.7; f.strokeStyle = '#c77dff'; f.lineWidth = 2;
    f.rotate(clock * 0.8); circ(f, 0, 0, R); f.stroke(); circ(f, 0, 0, R * 0.82); f.stroke();
    for (let i = 0; i < 2; i++) { f.rotate(Math.PI / 6); poly(f, 0, 0, R * 0.82, 3, -Math.PI / 2); f.stroke(); }
    f.rotate(-clock * 2); f.setLineDash([3, 8]); circ(f, 0, 0, R * 0.5); f.stroke(); f.setLineDash([]);
    for (let i = 0; i < 12; i++) { const an = i * TAU / 12; f.fillStyle = '#ecd6ff'; star4(f, Math.cos(an) * R * 0.91, Math.sin(an) * R * 0.91, 5, 1.2); f.fill(); }
    f.restore(); f.globalAlpha = 1;
  }
  if (S.staff) { // 同协：五线谱飘过全场
    const c = S.staff, k = c.t / c.dur, a = Math.min(1, c.t / 0.2) * Math.min(1, (c.dur - c.t) / 0.4);
    f.globalAlpha = a * 0.6; f.strokeStyle = '#7dffd0'; f.lineWidth = 1.2;
    for (let l = 0; l < 5; l++) {
      f.beginPath();
      for (let x = 0; x <= W; x += 20) f.lineTo(x, H / 2 - 40 + l * 14 + Math.sin(x * 0.012 + clock * 3) * 40);
      f.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const x = ((i * 70 + k * 900) % (W + 60)) - 30, y = H / 2 - 30 + (i % 5) * 14 + Math.sin(x * 0.012 + clock * 3) * 40;
      drawNote(f, x, y, 7, i % 3 ? '#7dffd0' : '#ffffff', a);
    }
    f.globalAlpha = 1;
  }
  if (S.crystal) { // 存护：冰晶穹顶
    const c = S.crystal, k = ease3(c.t / 0.35), a = c.t > c.dur - 0.5 ? (c.dur - c.t) / 0.5 : 1;
    f.globalAlpha = a * 0.6; f.strokeStyle = '#bff4ff'; f.lineWidth = 1.2;
    const cx = W / 2, cy = H / 2;
    for (let i = 0; i < 6; i++) {
      const an = i * TAU / 6 + 0.2;
      f.beginPath(); f.moveTo(cx, cy);
      let x = cx, y = cy;
      for (let j = 1; j <= 6; j++) { x = cx + Math.cos(an) * j * 70 * k; y = cy + Math.sin(an) * j * 70 * k; f.lineTo(x, y); }
      f.stroke();
      for (let j = 1; j <= 4; j++) {
        const bx = cx + Math.cos(an) * j * 80 * k, by = cy + Math.sin(an) * j * 80 * k;
        for (const s of [-1, 1]) { f.beginPath(); f.moveTo(bx, by); f.lineTo(bx + Math.cos(an + s * 0.7) * 30 * k, by + Math.sin(an + s * 0.7) * 30 * k); f.stroke(); }
      }
    }
    f.globalAlpha = 1;
  }
  if (S.bigSlash) { // 击破：一道贯穿全屏的斩痕
    const c = S.bigSlash, k = ease3(c.t / 0.12), a = Math.min(1, (c.life - c.t) / 0.5);
    f.save(); f.translate(W / 2, H / 2); f.rotate(c.a); f.globalAlpha = a;
    const L = 620 * k, th = 14 * a;
    f.fillStyle = '#ffffff'; f.beginPath(); f.moveTo(-L, 0); f.quadraticCurveTo(0, -th, L, 0); f.quadraticCurveTo(0, th, -L, 0); f.fill();
    f.fillStyle = hexA('#c9d4ff', 0.6); f.fillRect(-L, -th * 2.5, L * 2, th * 0.4); f.fillRect(-L, th * 2.2, L * 2, th * 0.3);
    f.restore(); f.globalAlpha = 1;
  }
}
function drawTexts(m) {
  m.textAlign = 'center'; m.textBaseline = 'middle';
  for (const t of S.texts) {
    const p = 1 - t.life / t.max, sc = p < 0.15 ? 1.6 - p * 4 : 1;
    m.globalAlpha = Math.min(1, (t.life / t.max) * 2);
    m.font = t.tag ? `bold ${t.size * sc}px "Songti SC", "STSong", serif` : `italic bold ${t.size * sc}px "Avenir Next", sans-serif`;
    m.lineWidth = 3; m.strokeStyle = 'rgba(0,0,0,.75)'; m.strokeText(t.text, t.x, t.y);
    m.fillStyle = t.col; m.fillText(t.text, t.x, t.y);
    if (t.crit) { m.font = `bold ${10 * sc}px sans-serif`; m.fillText('暴击', t.x, t.y - t.size * 0.8); }
  }
  m.globalAlpha = 1;
}
function drawBanner(m) {
  const b = S.banner; if (!b) return;
  const p = 1 - b.life / b.max, e = ease3(p / 0.15), y = H / 2 - 40, h = 80;
  m.save(); m.globalAlpha = b.life < 0.3 ? b.life / 0.3 : 1; m.translate((1 - e) * -W, 0);
  m.beginPath(); m.moveTo(-20, y + 6); m.lineTo(W + 20, y - 6); m.lineTo(W + 20, y + h - 6); m.lineTo(-20, y + h + 6); m.closePath();
  m.fillStyle = 'rgba(6,8,26,.82)'; m.fill();
  m.strokeStyle = b.col; m.lineWidth = 2;
  m.beginPath(); m.moveTo(-20, y + 6); m.lineTo(W + 20, y - 6); m.moveTo(-20, y + h + 6); m.lineTo(W + 20, y + h - 6); m.stroke();
  m.globalCompositeOperation = 'lighter'; glow(m, W / 2 + (p - 0.5) * 600, y + h / 2, 130, b.col, 0.25);
  m.globalCompositeOperation = 'source-over';
  m.textAlign = 'center'; m.textBaseline = 'middle';
  const g = m.createLinearGradient(0, y + 10, 0, y + 55); g.addColorStop(0, '#ffffff'); g.addColorStop(1, b.col);
  m.font = 'bold 38px "Songti SC", "STSong", serif'; m.fillStyle = g; m.fillText(b.title, W / 2, y + 34);
  m.font = '12px "Avenir Next", sans-serif'; m.fillStyle = b.col; m.fillText(b.sub.split('').join(' '), W / 2, y + 64);
  m.restore();
}
// 终结技过场：命途徽记 + 星轨万花筒 + 碎裂玻璃（无立绘）
function drawCutin(m) {
  const u = S.ult; if (!u || u.t > 1.3) return;
  const t = u.t, B = TOWERS[u.id], col = B.col;
  const a = Math.min(1, t / 0.12) * (t > 1.0 ? Math.max(0, 1 - (t - 1.0) / 0.3) : 1);
  const e1 = ease3(t / 0.28), e2 = ease3((t - 0.08) / 0.35);
  const cx = W * 0.64, cy = H / 2 - 20;
  m.save();
  m.globalAlpha = a * 0.85; m.fillStyle = '#03040c'; m.fillRect(0, 0, W, H);
  m.globalAlpha = a;
  // 斜向色带
  m.save(); m.translate((1 - e1) * -W * 1.2, 0);
  const gr = m.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, hexA(col, .04)); gr.addColorStop(.65, hexA(col, .35)); gr.addColorStop(1, hexA(col, .1));
  m.fillStyle = gr; m.beginPath(); m.moveTo(-50, 150); m.lineTo(W + 50, 60); m.lineTo(W + 50, 450); m.lineTo(-50, 520); m.closePath(); m.fill();
  m.fillStyle = col; m.beginPath(); m.moveTo(-50, 141); m.lineTo(W + 50, 51); m.lineTo(W + 50, 57); m.lineTo(-50, 147); m.fill();
  m.fillStyle = '#ffffff'; m.beginPath(); m.moveTo(-50, 525); m.lineTo(W + 50, 455); m.lineTo(W + 50, 459); m.lineTo(-50, 529); m.fill();
  m.restore();
  m.globalCompositeOperation = 'lighter';
  // 速度线
  for (let i = 0; i < 36; i++) {
    const yy = (i * 67) % H, sp = 1400 + (i % 4) * 500, x = W + 200 - ((t * sp + i * 211) % (W + 600));
    m.globalAlpha = a * 0.4; m.strokeStyle = i % 3 ? col : '#fff'; m.lineWidth = 1 + i % 3;
    m.beginPath(); m.moveTo(x, yy); m.lineTo(x + 140 + (i % 5) * 40, yy - 18); m.stroke();
  }
  // 旋转星轨万花筒
  m.save(); m.translate(cx, cy); m.globalAlpha = a;
  glow(m, 0, 0, 280 * e2, col, 0.55);
  for (let ring_ = 0; ring_ < 3; ring_++) {
    const R = (70 + ring_ * 55) * e2, n = 6 + ring_ * 6;
    m.save(); m.rotate((ring_ % 2 ? -1 : 1) * t * (1.2 - ring_ * 0.3));
    m.strokeStyle = hexA(col, 0.7 - ring_ * 0.15); m.lineWidth = 1.5;
    circ(m, 0, 0, R); m.stroke();
    for (let i = 0; i < n; i++) {
      const an = i * TAU / n;
      m.fillStyle = i % 2 ? '#ffffff' : col;
      star4(m, Math.cos(an) * R, Math.sin(an) * R, 5 + (2 - ring_) * 2, 1.2, an); m.fill();
    }
    m.beginPath();
    for (let i = 0; i <= n; i++) { const an = i * TAU / n * 2.5; m.lineTo(Math.cos(an) * R, Math.sin(an) * R); }
    m.globalAlpha = a * 0.25; m.stroke(); m.globalAlpha = a;
    m.restore();
  }
  // 中心命途徽记
  const er = 64 * (1.4 - 0.4 * e2);
  glow(m, 0, 0, er * 1.6, '#ffffff', 0.35 * a);
  drawEmblem(m, u.id, 0, 0, er, col, Math.sin(t * 3) * 0.05, 9);
  drawEmblem(m, u.id, 0, 0, er, '#ffffff', Math.sin(t * 3) * 0.05, 3);
  m.restore();
  // 环绕的属性粒子
  for (let i = 0; i < 24; i++) {
    const an = i * TAU / 24 + t * 2, R = 120 + Math.sin(i * 3.1 + t * 4) * 60 + (1 - e2) * 200;
    glow(m, cx + Math.cos(an) * R, cy + Math.sin(an) * R * 0.75, 6 + (i % 3) * 3, i % 2 ? col : '#ffffff', a * 0.8);
  }
  m.globalCompositeOperation = 'source-over'; m.globalAlpha = a;
  // 文字
  const tx = 40 - (1 - e2) * 320;
  m.textAlign = 'left'; m.textBaseline = 'alphabetic';
  m.font = 'bold 13px "Avenir Next", sans-serif'; m.fillStyle = col; m.fillText('U L T I M A T E', tx, 352);
  m.font = 'bold 19px "Songti SC", "STSong", serif'; m.fillStyle = '#fff'; m.fillText(`「${B.path}」${B.name}`, tx, 382);
  const sg = m.createLinearGradient(0, 398, 0, 456); sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, col);
  m.font = 'bold 56px "Songti SC", "STSong", serif'; m.lineWidth = 6; m.strokeStyle = 'rgba(0,0,0,.6)';
  m.strokeText(B.skill, tx, 446); m.fillStyle = sg; m.fillText(B.skill, tx, 446);
  m.font = 'italic 15px "Songti SC", serif'; m.fillStyle = 'rgba(255,255,255,.88)'; m.fillText(B.quote, tx + 4, 478);
  const bar = 46 * e1; m.fillStyle = '#000'; m.fillRect(0, 0, W, bar); m.fillRect(0, H - bar, W, bar);
  // 结尾：画面碎裂成玻璃片
  if (t > 0.88) {
    const k = clamp01((t - 0.88) / 0.4);
    m.globalAlpha = Math.max(0, 1 - k) * 0.9;
    m.strokeStyle = '#ffffff'; m.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const an = i * TAU / 14 + 0.3;
      m.beginPath(); m.moveTo(cx, cy);
      let x = cx, y = cy;
      for (let j = 1; j <= 4; j++) { x = cx + Math.cos(an + Math.sin(i * 7 + j) * 0.2) * j * 140 * ease3(k * 3); y = cy + Math.sin(an + Math.sin(i * 5 + j) * 0.2) * j * 140 * ease3(k * 3); m.lineTo(x, y); }
      m.stroke();
    }
    if (t < 1.06) { m.globalAlpha = Math.max(0, 1 - Math.abs(t - 0.97) / 0.1); m.fillStyle = '#fffaf0'; m.fillRect(0, 0, W, H); }
  }
  m.restore();
}
function overlay(m, title, sub, col) {
  m.fillStyle = 'rgba(3,4,14,.72)'; m.fillRect(0, 0, W, H);
  m.textAlign = 'center'; m.textBaseline = 'middle';
  m.globalCompositeOperation = 'lighter'; glow(m, W / 2, H / 2 - 20, 200, col, 0.3); m.globalCompositeOperation = 'source-over';
  m.font = 'bold 46px "Songti SC", "STSong", serif'; m.fillStyle = col; m.fillText(title, W / 2, H / 2 - 20);
  m.font = '16px sans-serif'; m.fillStyle = '#e8e6f5'; m.fillText(sub, W / 2, H / 2 + 28);
}

// ======================= 帧合成 =======================
function draw() {
  const m = mctx, f = fctx;
  m.setTransform(DPR, 0, 0, DPR, 0, 0); m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1;
  m.drawImage(BG, 0, 0, W, H);
  f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, FX.width, FX.height); f.setTransform(DPR, 0, 0, DPR, 0, 0);
  f.globalCompositeOperation = 'lighter';
  const sx = S.shake > 0.3 ? (Math.random() - 0.5) * S.shake : 0, sy = S.shake > 0.3 ? (Math.random() - 0.5) * S.shake : 0;
  m.save(); f.save(); m.translate(sx, sy); f.translate(sx, sy);
  drawAstrolabe(m);
  for (const s of STARS) glow(f, s.x, s.y, s.r, '#9fc4ff', 0.1 + 0.3 * Math.abs(Math.sin(clock * s.s + s.p)));
  for (const mo of MOTES) glow(f, mo.x, mo.y, 3.5, '#ffd27a', 0.25 + 0.2 * Math.sin(clock * 2 + mo.p));
  for (const fl of FLOWS) { const p = posAt(fl.d); glow(f, p.x, p.y, 8, '#5fd4ff', 0.45); }
  drawPortals(m, f);
  if (S.mouse && S.sel && !S.picked && !S.over) {
    const cx = Math.floor(S.mouse.x / T), cy = Math.floor(S.mouse.y / T), B = TOWERS[S.sel];
    const ok = canBuild(cx, cy) && S.gold >= B.cost;
    m.fillStyle = ok ? hexA(B.col, .2) : 'rgba(255,60,90,.25)'; m.fillRect(cx * T + 3, cy * T + 3, T - 6, T - 6);
    if (ok) {
      m.setLineDash([5, 7]); m.strokeStyle = B.col; m.lineWidth = 1.5; m.globalAlpha = 0.7;
      circ(m, cx * T + T / 2, cy * T + T / 2, B.range); m.stroke(); m.setLineDash([]); m.globalAlpha = 1;
      drawEmblem(f, S.sel, cx * T + T / 2, cy * T + T / 2, 10, hexA(B.col, 0.7), 0, 2);
    }
  }
  drawMines(m, f);
  for (const tw of S.towers) drawTower(m, f, tw);
  for (const e of S.enemies) drawEnemy(m, f, e);
  drawPops(m, f);
  for (const p of S.parts) if (p.main) drawPart(m, p);
  drawUltScenes(m, f);
  drawFx(m, f);
  m.restore(); f.restore();
  // 合成特效层 + 泛光
  for (let i = 0; i < BL.length; i++) {
    const src = i ? BL[i - 1] : FX, c = BL[i], x = BLX[i];
    x.clearRect(0, 0, c.width, c.height); x.drawImage(src, 0, 0, c.width, c.height);
  }
  m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'lighter';
  m.drawImage(FX, 0, 0);
  m.globalAlpha = 0.45; m.drawImage(BL[1], 0, 0, cv.width, cv.height);
  m.globalAlpha = 0.5; m.drawImage(BL[2], 0, 0, cv.width, cv.height);
  m.globalAlpha = 0.45; m.drawImage(BL[3], 0, 0, cv.width, cv.height);
  m.globalAlpha = 1; m.globalCompositeOperation = 'source-over';
  m.setTransform(DPR, 0, 0, DPR, 0, 0);
  m.save(); m.translate(sx, sy); drawTexts(m); m.restore();
  const vig = (r, g, b, a, inner) => {
    const gg = m.createRadialGradient(W / 2, H / 2, H * inner, W / 2, H / 2, H * 0.9);
    gg.addColorStop(0, `rgba(${r},${g},${b},0)`); gg.addColorStop(1, `rgba(${r},${g},${b},${a})`);
    m.fillStyle = gg; m.fillRect(0, 0, W, H);
  };
  if (S.frost > 0) vig(170, 235, 255, S.frost * 0.45, 0.3);
  if (S.buffT > 0) vig(125, 255, 208, Math.min(1, S.buffT) * 0.18, 0.4);
  if (S.hurt > 0) vig(255, 0, 40, S.hurt * 0.5, 0.35);
  drawBanner(m);
  drawCutin(m);
  if (S.whiteFlash > 0) { m.fillStyle = `rgba(255,250,235,${S.whiteFlash})`; m.fillRect(0, 0, W, H); }
  if (!S.wave && !S.waveActive && !S.banner) {
    m.textAlign = 'center'; m.textBaseline = 'middle'; m.font = '15px sans-serif'; m.fillStyle = 'rgba(232,230,245,.85)';
    m.fillText('部署命途角色，然后点击「开始下一波」', W / 2, 22);
  }
  if (S.paused && !S.over) overlay(m, '暂 停', '按 P 或点击「继续」', '#7fe3ff');
  if (S.over) overlay(m, '战 斗 失 败', `坚持到第 ${S.wave} 波 · 分数 ${S.score} · 点击画面重新开始`, '#ff4d6d');
}
