'use strict';
// ======================= 原创角色外观（程序绘制立绘） =======================
const LOOK = {
  hunt:     { hair:['#fff3cc','#eebd5e','#a06a22'], eye:['#fff0a8','#e08a2a','#4a1e06'], cloth:['#2c3778','#121738'], trim:'#f3cf7a', gem:'#ffd27a',
              style:'long', acc:'star', mouth:0, build:'弦已上满，随时可以出发。', wave:'目标出现——开始狩猎。' },
  destroy:  { hair:['#ffa184','#e23b2e','#6e1010'], eye:['#fff3a0','#ff9a1f','#5a1400'], cloth:['#43161b','#160608'], trim:'#ffb05a', gem:'#ff6a3d',
              style:'pony', acc:'flame', mouth:1, build:'放心，前面的东西我来炸平。', wave:'终于来了，热身开始！' },
  preserve: { hair:['#ffffff','#c4e6ff','#6c9ad4'], eye:['#effeff','#5fd0ff','#0b3f6e'], cloth:['#f2f8ff','#8cb4e4'], trim:'#7fe3ff', gem:'#a6f2ff',
              style:'twin', acc:'crown', mouth:0, build:'寒霜会守住这里。', wave:'别担心，有我在。' },
  erudite:  { hair:['#f0f4ff','#9aa8d8','#3e4778'], eye:['#f6e8ff','#b06bff','#2a0a55'], cloth:['#2a2350','#100c24'], trim:'#d6b3ff', gem:'#c77dff',
              style:'bob', acc:'orbit', mouth:2, glasses:true, build:'变量已录入，开始推演。', wave:'数据流入……很有趣。' },
  harmony:  { hair:['#e6fff6','#5fd8b0','#1f6d5a'], eye:['#f0fff8','#3fd6a8','#0b4a3a'], cloth:['#1d3f48','#0a1a20'], trim:'#9effdc', gem:'#7dffd0',
              style:'long', acc:'phones', mouth:1, build:'来，跟上我的节拍！', wave:'大家，一起唱出来吧！' },
  nihil:    { hair:['#b19bff','#4d3b92','#1b1240'], eye:['#f4e2ff','#b47bff','#26084f'], cloth:['#231a3c','#0a0714'], trim:'#c9a6ff', gem:'#c49bff',
              style:'bob', acc:'moon', mouth:2, sleepy:true, build:'……目标，已锁定。', wave:'……数量，确认。' },
  elation:  { hair:['#ffe0f4','#ff7ac8','#a0246e'], eye:['#fff6c0','#ffb02e','#5a2a00'], cloth:['#3a1440','#160618'], trim:'#ffe066', gem:'#ff8ad8',
              style:'buns', acc:'jester', mouth:1, build:'嘿嘿，路上的惊喜可别错过哦～', wave:'观众到齐了，表演开始！' },
  breaker:  { hair:['#e8ecff','#5a6078','#15182a'], eye:['#ffe0e0','#ff4d6d','#4a0010'], cloth:['#1c1f30','#08090f'], trim:'#eef2ff', gem:'#ff4d6d',
              style:'short', acc:'blades', mouth:2, build:'站位确认。破绽，交给我。', wave:'来吧，一刀两断。' },
};

function makePortrait(id) {
  const C = LOOK[id], aura = TOWERS[id].col, c = mkCanvas(800, 1040), g = c.getContext('2d'); g.scale(2, 2);
  const lg = (y0, y1, cols) => { const gr = g.createLinearGradient(0, y0, 0, y1); cols.forEach((s, i) => gr.addColorStop(i / (cols.length - 1), s)); return gr; };
  const fillP = (f, st, lw) => { g.fillStyle = f; g.fill(); if (st) { g.strokeStyle = st; g.lineWidth = lw || 1; g.stroke(); } };
  const SK = ['#fff4ec', '#f7d2c4'], L = { long: 500, twin: 330, pony: 300, bob: 300, buns: 300, short: 250 }[C.style];
  const hairG = lg(76, Math.max(L, 380), C.hair), edge = hexA(C.hair[2], .55);

  // ---- 背景：柔光 + 星盘 ----
  const rg = g.createRadialGradient(200, 220, 10, 200, 220, 270);
  rg.addColorStop(0, hexA(aura, .5)); rg.addColorStop(.5, hexA(aura, .14)); rg.addColorStop(1, hexA(aura, 0));
  g.fillStyle = rg; g.fillRect(0, 0, 400, 520);
  g.strokeStyle = hexA(aura, .5); g.lineWidth = 1.5;
  circ(g, 200, 200, 168); g.stroke();
  g.setLineDash([2, 7]); circ(g, 200, 200, 183); g.stroke(); g.setLineDash([]);
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12, r0 = i % 2 ? 162 : 152;
    g.beginPath(); g.moveTo(200 + Math.cos(a) * r0, 200 + Math.sin(a) * r0); g.lineTo(200 + Math.cos(a) * 174, 200 + Math.sin(a) * 174); g.stroke();
  }
  if (C.acc === 'moon') { crescent(g, 200, 190, 150, 58); fillP(lg(40, 340, ['rgba(255,255,255,.5)', hexA(aura, .3)]), hexA(C.trim, .9), 2); }
  if (C.acc === 'blades') for (const s of [-1, 1]) { // 身后交叉的双刃
    g.save(); g.translate(200, 250); g.rotate(s * 0.72);
    g.beginPath(); g.moveTo(0, -250); g.lineTo(10, -212); g.lineTo(10, 120); g.lineTo(-10, 120); g.lineTo(-10, -212); g.closePath();
    fillP(lg(-250, 120, ['#ffffff', '#c9d0e8', '#6a7090']), '#ffffff', 1);
    g.strokeStyle = 'rgba(255,77,109,.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -200); g.lineTo(0, 110); g.stroke();
    g.fillStyle = C.trim; g.fillRect(-28, 120, 56, 8); g.fillStyle = '#2a2d40'; g.fillRect(-5, 128, 10, 44);
    g.restore();
  }
  if (C.acc === 'orbit') { // 身后的推演星环
    g.strokeStyle = hexA(C.trim, .55); g.lineWidth = 1.2;
    for (const [rx, ry, rot] of [[175, 60, 0.35], [175, 60, -0.35]]) { g.beginPath(); g.ellipse(200, 210, rx, ry, rot, 0, TAU); g.stroke(); }
    for (const [x, y] of [[48, 160], [352, 262], [70, 290], [330, 140]]) { circ(g, x, y, 5); fillP(lg(y - 5, y + 5, ['#ffffff', C.gem])); }
  }

  // ---- 后发 / 马尾 / 双马尾 / 丸子 ----
  if (C.style === 'twin') for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(200 + sx * 92, 118);
    g.bezierCurveTo(200 + sx * 182, 130, 200 + sx * 198, 300, 200 + sx * 152, 505);
    g.bezierCurveTo(200 + sx * 146, 400, 200 + sx * 112, 250, 200 + sx * 78, 160); g.closePath(); fillP(hairG, edge, 1);
  }
  if (C.style === 'pony') {
    g.beginPath(); g.moveTo(230, 92); g.bezierCurveTo(330, 48, 394, 170, 368, 320);
    g.bezierCurveTo(358, 390, 378, 450, 398, 508); g.bezierCurveTo(330, 452, 318, 340, 326, 250);
    g.bezierCurveTo(332, 175, 300, 128, 248, 126); g.closePath(); fillP(hairG, edge, 1);
  }
  if (C.style === 'buns') for (const sx of [-1, 1]) {
    circ(g, 200 + sx * 66, 88, 30); fillP(hairG, edge, 1);
    g.strokeStyle = hexA(C.hair[2], .4); g.lineWidth = 1.2; g.beginPath(); g.arc(200 + sx * 66, 88, 20, 0.5, 2.8); g.stroke();
    g.beginPath(); g.moveTo(200 + sx * 84, 108); g.lineTo(200 + sx * 108, 128); g.lineTo(200 + sx * 92, 100); g.closePath(); fillP(C.trim);
  }
  g.beginPath(); g.moveTo(200, 76);
  g.bezierCurveTo(294, 74, 336, 160, 328, 250);
  g.bezierCurveTo(332, 320, 338, L - 70, 342, L);
  for (let i = 1; i <= 8; i++) g.lineTo(342 - i * 35.5, L - (i % 2 ? 26 : 0));
  g.bezierCurveTo(62, L - 70, 68, 320, 72, 250);
  g.bezierCurveTo(64, 160, 106, 74, 200, 76); g.closePath(); fillP(hairG, edge, 1);
  g.strokeStyle = hexA(C.hair[2], .3); g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(100 + i * 40, 110); g.quadraticCurveTo(80 + i * 48, Math.min(300, L - 40), 70 + i * 52, L - 20); g.stroke(); }

  // ---- 身体与服装 ----
  g.fillStyle = lg(250, 330, SK); g.fillRect(184, 255, 32, 75);
  g.beginPath(); g.ellipse(200, 284, 22, 12, 0, 0, TAU); g.fillStyle = 'rgba(170,90,90,.28)'; g.fill();
  g.beginPath(); g.moveTo(176, 318); g.bezierCurveTo(118, 322, 90, 346, 78, 392); g.lineTo(58, 520); g.lineTo(342, 520);
  g.lineTo(322, 392); g.bezierCurveTo(310, 346, 282, 322, 224, 318); g.closePath(); fillP(lg(310, 520, C.cloth), hexA(C.trim, .8), 2);
  g.beginPath(); g.moveTo(178, 318); g.lineTo(200, 362); g.lineTo(222, 318); g.closePath(); fillP(lg(310, 362, SK));
  for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(200 + sx * 22, 316); g.lineTo(200 + sx * 50, 326); g.lineTo(200, 406); g.lineTo(200 + sx * 3, 366); g.closePath();
    fillP('rgba(255,255,255,.14)', C.trim, 2);
    g.beginPath(); g.ellipse(200 + sx * 102, 372, 36, 22, sx * 0.45, 0, TAU);
    fillP(lg(350, 395, [hexA(C.trim, .55), C.cloth[1]]), C.trim, 1.5);
  }
  g.strokeStyle = C.trim; g.lineWidth = 3; g.beginPath(); g.moveTo(200, 412); g.lineTo(200, 520); g.stroke();
  g.lineWidth = 1.5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(180, 440 + i * 22); g.lineTo(200, 452 + i * 22); g.lineTo(220, 440 + i * 22); g.stroke(); }
  const gg = g.createRadialGradient(200, 398, 0, 200, 398, 30); gg.addColorStop(0, hexA(C.gem, .6)); gg.addColorStop(1, hexA(C.gem, 0));
  g.fillStyle = gg; g.fillRect(160, 360, 80, 80);
  g.beginPath(); g.moveTo(200, 382); g.lineTo(213, 399); g.lineTo(200, 418); g.lineTo(187, 399); g.closePath();
  fillP(lg(382, 418, ['#ffffff', C.gem, C.hair[2]]), '#fff', 1.2);

  // ---- 脸 ----
  const face = () => { g.beginPath(); g.moveTo(146, 172); g.bezierCurveTo(146, 236, 172, 274, 200, 288); g.bezierCurveTo(228, 274, 254, 236, 254, 172); g.bezierCurveTo(254, 112, 146, 112, 146, 172); g.closePath(); };
  face(); fillP(lg(140, 290, SK));
  g.save(); face(); g.clip(); g.fillStyle = lg(128, 206, ['rgba(150,70,90,.4)', 'rgba(150,70,90,0)']); g.fillRect(140, 120, 120, 90); g.restore();
  for (const sx of [-1, 1]) {
    g.beginPath(); g.ellipse(200 + sx * 36, 250, 13, 6, 0, 0, TAU); g.fillStyle = 'rgba(255,120,140,.3)'; g.fill();
    g.strokeStyle = 'rgba(230,100,120,.45)'; g.lineWidth = 1;
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(200 + sx * 36 + k * 5 - 2, 252); g.lineTo(200 + sx * 36 + k * 5 + 2, 247); g.stroke(); }
  }
  // 眼睛
  const ey = 222, rw = 17, rh = C.sleepy ? 11 : 14;
  for (const [ex, dir] of [[174, -1], [226, 1]]) {
    g.save(); g.beginPath(); g.ellipse(ex, ey, rw, rh, 0, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.clip();
    const ig = g.createLinearGradient(0, ey - 15, 0, ey + 15); ig.addColorStop(0, C.eye[2]); ig.addColorStop(.55, C.eye[1]); ig.addColorStop(1, C.eye[0]);
    g.beginPath(); g.ellipse(ex - dir * 1.5, ey + 1, 11.5, 15, 0, 0, TAU); g.fillStyle = ig; g.fill();
    g.strokeStyle = C.eye[2]; g.lineWidth = 1.2; g.stroke();
    g.beginPath(); g.ellipse(ex - dir * 1.5, ey + 1, 5, 7, 0, 0, TAU); g.fillStyle = C.eye[2]; g.fill();
    star4(g, ex - dir * 1.5, ey + 5, 4.5, 1.2); g.fillStyle = hexA(C.eye[0], .9); g.fill();
    g.fillStyle = 'rgba(60,20,40,.28)'; g.fillRect(ex - 20, ey - rh, 40, 6);
    g.restore();
    g.fillStyle = '#fff'; circ(g, ex - 4, ey - rh * 0.4, 3.6); g.fill(); circ(g, ex + 5, ey + 6, 1.6); g.fill();
    g.strokeStyle = '#2a1520'; g.lineCap = 'round'; g.lineWidth = 3.6;
    g.beginPath(); g.ellipse(ex, ey + 2, rw + 2, rh + 3, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.lineWidth = 2.6; g.beginPath(); g.moveTo(ex + dir * (rw + 1), ey - 4); g.lineTo(ex + dir * (rw + 7), ey - 9); g.stroke();
    g.lineWidth = 1; g.strokeStyle = 'rgba(60,20,40,.45)'; g.beginPath(); g.ellipse(ex, ey, rw - 2, rh + 1, 0, Math.PI * 0.3, Math.PI * 0.7); g.stroke();
    g.strokeStyle = C.hair[2]; g.lineWidth = 2.2; g.beginPath(); g.moveTo(ex - 14, ey - rh - 13); g.quadraticCurveTo(ex, ey - rh - 20, ex + 14, ey - rh - 14); g.stroke();
    if (C.glasses) { g.strokeStyle = C.trim; g.lineWidth = 1.6; g.beginPath(); g.ellipse(ex, ey + 1, rw + 5, rh + 6, 0, 0, TAU); g.stroke(); }
  }
  if (C.glasses) { g.strokeStyle = C.trim; g.lineWidth = 1.6; g.beginPath(); g.moveTo(196, 220); g.quadraticCurveTo(200, 216, 204, 220); g.stroke(); }
  if (C.acc === 'jester') { star4(g, 156, 244, 6, 1.6); fillP('#ffe066'); } // 眼下的星形彩绘
  g.strokeStyle = 'rgba(190,110,100,.6)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(201, 244); g.lineTo(199, 250); g.stroke();
  g.strokeStyle = '#c4626a'; g.lineWidth = 1.8; g.beginPath();
  if (C.mouth === 1) { g.moveTo(192, 262); g.quadraticCurveTo(201, 270, 210, 260); }
  else if (C.mouth === 2) { g.moveTo(195, 265); g.lineTo(205, 265); }
  else { g.moveTo(193, 263); g.quadraticCurveTo(200, 268, 207, 263); }
  g.stroke();

  // ---- 前发：发顶 + 刘海 + 鬓发 ----
  g.beginPath(); g.moveTo(138, 205); g.bezierCurveTo(124, 118, 164, 78, 200, 78); g.bezierCurveTo(236, 78, 276, 118, 262, 205);
  g.bezierCurveTo(252, 152, 230, 128, 200, 126); g.bezierCurveTo(170, 128, 148, 152, 138, 205); g.closePath(); fillP(hairG);
  const strands = [[140,176,148,234,-6],[158,200,174,214,-4],[178,214,190,238,-2],[194,228,205,206,2],[205,246,224,234,4],[224,262,244,214,6],[238,262,256,236,8]];
  for (let [b0, b1, tx, ty, bend] of strands) {
    ty = 132 + (ty - 132) * 0.6; // 刘海停在眉毛上方
    g.beginPath(); g.moveTo(b0, 132); g.quadraticCurveTo((b0 + tx) / 2 + bend, (132 + ty) / 2, tx, ty);
    g.quadraticCurveTo((b1 + tx) / 2 + bend, (132 + ty) / 2, b1, 126); g.closePath(); fillP(hairG, hexA(C.hair[2], .35), 1);
  }
  const lock = { bob: 300, long: 400, short: 270 }[C.style] || 345;
  for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(200 + sx * 54, 148); g.bezierCurveTo(200 + sx * 76, 210, 200 + sx * 80, lock - 60, 200 + sx * 70, lock);
    g.quadraticCurveTo(200 + sx * 56, lock - 50, 200 + sx * 48, 270); g.quadraticCurveTo(200 + sx * 40, 220, 200 + sx * 36, 168); g.closePath();
    fillP(hairG, edge, 1);
  }
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 5; g.lineCap = 'round'; g.setLineDash([22, 9]);
  g.beginPath(); g.moveTo(158, 112); g.quadraticCurveTo(200, 94, 242, 112); g.stroke(); g.setLineDash([]);

  // ---- 饰品 ----
  if (C.acc === 'star') {
    star4(g, 252, 128, 18, 5, 0.2); fillP(lg(110, 146, ['#ffffff', C.trim, '#b07a22']), '#fff', 1);
    star4(g, 234, 146, 8, 2.5, 0.2); fillP('#fff6d0');
  } else if (C.acc === 'flame') {
    for (const [x, y, s] of [[146, 120, 1], [136, 140, .7]]) {
      g.beginPath(); g.moveTo(x, y + 22 * s); g.bezierCurveTo(x - 16 * s, y + 6 * s, x - 6 * s, y - 10 * s, x + 2 * s, y - 26 * s);
      g.bezierCurveTo(x + 4 * s, y - 8 * s, x + 16 * s, y, x, y + 22 * s); g.closePath(); fillP(lg(y - 26 * s, y + 22 * s, ['#fff3a0', '#ff8a2a', '#c21e10']), '#fff0c0', 1);
    }
    g.beginPath(); g.moveTo(256, 118); g.lineTo(276, 84); g.lineTo(266, 124); g.closePath(); fillP(lg(84, 124, ['#ffe0a0', C.trim, '#7a2a10']), '#fff', 1);
  } else if (C.acc === 'crown') {
    for (let i = -2; i <= 2; i++) {
      const x = 200 + i * 22, h = 30 - Math.abs(i) * 7, y = 96 - (2 - Math.abs(i)) * 8;
      g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + 8, y); g.lineTo(x, y + 8); g.lineTo(x - 8, y); g.closePath();
      fillP(lg(y - h, y + 8, ['#ffffff', '#bff4ff', '#4fa8e0']), '#fff', 1);
    }
    g.strokeStyle = '#e8fdff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(148, 108); g.quadraticCurveTo(200, 84, 252, 108); g.stroke();
    for (const sx of [-1, 1]) { circ(g, 200 + sx * 92, 122, 7); fillP(lg(115, 129, ['#ffffff', C.gem]), '#fff', 1); }
  } else if (C.acc === 'moon') {
    crescent(g, 246, 120, 15, 7); fillP(lg(105, 135, ['#ffffff', C.trim]), '#fff', 1);
    circ(g, 233, 140, 3); fillP('#ffffff');
  } else if (C.acc === 'orbit') {
    g.strokeStyle = C.trim; g.lineWidth = 2; g.beginPath(); g.ellipse(200, 74, 70, 14, -0.12, 0, TAU); g.stroke();
    circ(g, 268, 66, 5); fillP(lg(61, 71, ['#ffffff', C.gem]));
    g.beginPath(); g.moveTo(252, 118); g.lineTo(262, 128); g.lineTo(252, 138); g.lineTo(242, 128); g.closePath(); fillP(lg(118, 138, ['#ffffff', C.gem]), '#fff', 1);
  } else if (C.acc === 'phones') {
    g.strokeStyle = C.trim; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.arc(200, 176, 94, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    for (const sx of [-1, 1]) {
      g.beginPath(); g.ellipse(200 + sx * 84, 180, 14, 26, 0, 0, TAU); fillP(lg(154, 206, [C.cloth[0], C.cloth[1]]), C.trim, 2);
      circ(g, 200 + sx * 84, 180, 6); fillP(lg(174, 186, ['#ffffff', C.gem]));
    }
    // 小音符
    g.fillStyle = C.trim; g.beginPath(); g.ellipse(300, 120, 6, 4.5, -0.4, 0, TAU); g.fill();
    g.strokeStyle = C.trim; g.lineWidth = 2; g.beginPath(); g.moveTo(305, 119); g.lineTo(305, 96); g.quadraticCurveTo(314, 100, 312, 108); g.stroke();
  } else if (C.acc === 'jester') {
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(200 + sx * 18, 94); g.quadraticCurveTo(200 + sx * 70, 26, 200 + sx * 114, 52);
      g.quadraticCurveTo(200 + sx * 82, 66, 200 + sx * 62, 108); g.closePath();
      fillP(lg(26, 108, sx < 0 ? ['#fff3a0', '#e0a020'] : ['#ffc0e8', '#c0307e']), '#fff', 1);
      circ(g, 200 + sx * 116, 54, 7); fillP(lg(47, 61, ['#ffffff', '#ffe066']), '#fff', 1);
    }
    g.fillStyle = C.trim; g.fillRect(150, 96, 100, 7);
  } else if (C.acc === 'blades') {
    g.beginPath(); g.moveTo(240, 108); g.lineTo(276, 92); g.lineTo(246, 118); g.closePath(); fillP(lg(92, 118, ['#ffffff', '#9aa0b8']), '#fff', 1);
    circ(g, 244, 114, 3.5); fillP(C.gem);
  }

  // ---- 整体光泽与底部渐隐 ----
  g.globalCompositeOperation = 'source-atop';
  const sh = g.createLinearGradient(0, 0, 400, 520); sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(.5, 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.fillRect(0, 0, 400, 520);
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = lg(440, 520, ['rgba(0,0,0,0)', 'rgba(0,0,0,1)']); g.fillRect(0, 440, 400, 80);
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * TAU, r = 120 + Math.random() * 90, s = 2 + Math.random() * 4;
    star4(g, 200 + Math.cos(a) * r, 200 + Math.sin(a) * r, s, s * 0.25); g.fillStyle = 'rgba(255,255,255,.7)'; g.fill();
  }
  return c;
}

const P = {};
for (const id of IDS) P[id] = makePortrait(id);
const iw = im => im.naturalWidth || im.width, ih = im => im.naturalHeight || im.height;
// 头像：裁切立绘头部
function drawHead(g, id, x, y, r) {
  const im = P[id], w = iw(im), h = ih(im), s = w * 0.4;
  g.save(); circ(g, x, y, r); g.fillStyle = '#0c1030'; g.fill(); g.clip();
  g.drawImage(im, w * 0.3, h * 0.205, s, s, x - r, y - r, r * 2, r * 2); g.restore();
}
// 可选：放入 portraits/<id>.png 替换为自定义立绘
if (typeof Image !== 'undefined') for (const id of IDS) {
  const im = new Image();
  im.onload = () => { if (iw(im)) { P[id] = im; if (typeof paintThumbs === 'function') paintThumbs(); if (typeof showInfo === 'function') showInfo(); } };
  im.src = 'portraits/' + id + '.png';
}
