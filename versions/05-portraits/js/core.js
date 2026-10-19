'use strict';
// ======================= 画布与工具 =======================
const cv = document.getElementById('c'), mctx = cv.getContext('2d');
const W = 800, H = 560, DPR = Math.min(2, window.devicePixelRatio || 1);
cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px';
const T = 40, COLS = 20, ROWS = 14, TAU = Math.PI * 2;
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
const clamp01 = x => Math.min(1, Math.max(0, x));
const ease3 = x => 1 - Math.pow(1 - clamp01(x), 3);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// 特效层（叠加发光）+ 多级缩放实现泛光
const FX = mkCanvas(W * DPR, H * DPR), fctx = FX.getContext('2d');
const BL = [2, 4, 8, 16].map(k => mkCanvas(W * DPR / k, H * DPR / k)), BLX = BL.map(c => c.getContext('2d'));

// ======================= 地图 =======================
const WP = [[-1,2],[5,2],[5,10],[11,10],[11,3],[16,3],[16,11],[20,11]];
const pathPts = WP.map(([x, y]) => ({ x: x * T + T / 2, y: y * T + T / 2 }));
const pathCells = new Set();
for (let i = 0; i < WP.length - 1; i++) {
  let [x1, y1] = WP[i]; const [x2, y2] = WP[i + 1];
  const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
  while (x1 !== x2 || y1 !== y2) { pathCells.add(x1 + ',' + y1); x1 += dx; y1 += dy; }
  pathCells.add(x2 + ',' + y2);
}
const segLen = []; let pathLen = 0;
for (let i = 0; i < pathPts.length - 1; i++) {
  const l = Math.hypot(pathPts[i + 1].x - pathPts[i].x, pathPts[i + 1].y - pathPts[i].y); segLen.push(l); pathLen += l;
}
function posAt(d) {
  for (let i = 0; i < segLen.length; i++) {
    if (d <= segLen[i]) { const a = pathPts[i], b = pathPts[i + 1], k = d / segLen[i]; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }
    d -= segLen[i];
  }
  return pathPts.at(-1);
}
// 路面采样点（欢愉放置笑话盒子用），去掉入口和终点附近
const PATH_SAMPLES = [];
for (let d = 70; d < pathLen - 70; d += 10) PATH_SAMPLES.push(posAt(d));

// ======================= 配置 =======================
const ELEM = {
  phys:    { name: '物理', col: '#e8e8ee', brk: '裂伤' },
  fire:    { name: '火',   col: '#ff6a3d', brk: '灼烧' },
  ice:     { name: '冰',   col: '#8fe9ff', brk: '冻结' },
  thunder: { name: '雷',   col: '#c77dff', brk: '触电' },
  wind:    { name: '风',   col: '#5fffc0', brk: '风化' },
  quantum: { name: '量子', col: '#7d86ff', brk: '纠缠' },
  imag:    { name: '虚数', col: '#ffe066', brk: '禁锢' },
};
const ELEM_IDS = Object.keys(ELEM);
const TOWERS = {
  hunt:     { path:'巡猎', name:'星弦', key:'1', cost:50,  col:'#ffd27a', elem:'wind',    range:125, rate:0.45, dmg:12, crit:0.25, tough:8,
              desc:'星矢·单体暴击', skill:'千星坠矢', quote:'星光所指之处，皆为猎场。' },
  destroy:  { path:'毁灭', name:'焰铠', key:'2', cost:100, col:'#ff7a45', elem:'fire',    range:115, rate:1.3,  dmg:28, splash:55, tough:12,
              desc:'炎彗·范围爆炸', skill:'焚天陨爆', quote:'全部——燃烧殆尽吧！' },
  preserve: { path:'存护', name:'霜华', key:'3', cost:80,  col:'#8fe9ff', elem:'ice',     range:105, rate:0.9,  dmg:6,  shards:3, tough:5,
              desc:'冰棱·减速', skill:'永冻冰华', quote:'此刻，万物皆归于静止。' },
  erudite:  { path:'智识', name:'雷枢', key:'4', cost:120, col:'#c77dff', elem:'thunder', range:130, rate:1.0,  dmg:22, chain:3, tough:6,
              desc:'连锁雷霆·群攻', skill:'万象雷霆', quote:'计算完毕，答案只有一个。' },
  harmony:  { path:'同协', name:'和音', key:'5', cost:110, col:'#7dffd0', elem:'imag',    range:110, rate:0,    dmg:0,
              desc:'旋律光环·增益', skill:'和弦·共鸣', quote:'让这旋律，传给每一个人。' },
  nihil:    { path:'虚无', name:'虚月', key:'6', cost:100, col:'#b98bff', elem:'quantum', range:140, rate:1.2,  dmg:10, tough:5,
              desc:'虚棘·易伤侵蚀', skill:'虚数终焉', quote:'归于虚无，便不再有痛苦。' },
  elation:  { path:'欢愉', name:'笑匣', key:'7', cost:90,  col:'#ff8ad8', elem:'imag',    range:100, rate:2.2,  dmg:40, splash:45, tough:10,
              desc:'路面笑话盒子', skill:'欢愉嘉年华', quote:'惊喜——要来点笑声吗？' },
  breaker:  { path:'击破', name:'裂锋', key:'8', cost:130, col:'#eef2ff', elem:'phys',    range:120, rate:0.9,  dmg:14, tough:18, breakAny:true,
              desc:'月刃·无视弱点削韧', skill:'裂界一闪', quote:'破绽，已经看见了。' },
};
const IDS = Object.keys(TOWERS), ULT_KEYS = 'qwertyui';
const GAIN = { hunt:1.2, destroy:1.0, preserve:0.6, erudite:0.7, harmony:0, nihil:1.5, elation:2, breaker:1.5 };
const ETYPES = {
  normal: { hp:1,   spd:55,  r:11, color:'#ff4d6d', gold:6,  sides:4, spin:1,   tough:30,  weak:2 },
  fast:   { hp:0.6, spd:105, r:9,  color:'#ffd84d', gold:7,  sides:3, spin:3,   tough:20,  weak:2 },
  tank:   { hp:3.5, spd:35,  r:15, color:'#c06bff', gold:15, sides:6, spin:0.5, tough:60,  weak:2 },
  boss:   { hp:18,  spd:30,  r:22, color:'#ff2e63', gold:80, sides:8, spin:0.4, tough:160, weak:3 },
};
const CONFETTI = ['#ff8ad8', '#ffe066', '#7fe3ff', '#7dffb0', '#ffffff', '#ff7a45'];

// ======================= 绘图基础 =======================
const glowCache = {};
function glowTex(col) {
  if (glowCache[col]) return glowCache[col];
  const c = mkCanvas(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return glowCache[col] = c;
}
function glow(g, x, y, r, col, a = 1) { if (a <= 0 || r <= 0) return; g.globalAlpha = Math.min(1, a); g.drawImage(glowTex(col), x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; }
function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); }
function poly(g, x, y, r, n, rot = 0) {
  g.beginPath();
  for (let i = 0; i < n; i++) { const a = rot + i * TAU / n; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  g.closePath();
}
function star4(g, x, y, R, r, rot = 0) {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath();
}
function crescent(g, cx, cy, R, d) {
  const R2 = Math.hypot(R, d);
  g.beginPath(); g.arc(cx, cy, R, Math.PI / 2, Math.PI * 1.5);
  g.arc(cx + d, cy, R2, Math.atan2(-R, -d), Math.atan2(R, -d), true); g.closePath();
}
// 命途徽记（塔、按钮、终结技过场共用）
function drawEmblem(g, id, x, y, r, col, rot = 0, lw = 2) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(r, r);
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw / r; g.lineCap = 'round'; g.lineJoin = 'round';
  const L = pts => { g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); };
  switch (id) {
    case 'hunt':
      star4(g, 0, 0, 0.55, 0.13); g.fill();
      L([[-0.82, 0.82], [0.82, -0.82]]); L([[0.42, -0.82], [0.82, -0.82], [0.82, -0.42]]);
      L([[-0.82, 0.5], [-0.82, 0.82], [-0.5, 0.82]]); break;
    case 'destroy':
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, 0.85, i * TAU / 3 + 0.28, (i + 1) * TAU / 3 - 0.28); g.stroke(); }
      g.beginPath(); g.moveTo(0, -0.58); g.bezierCurveTo(0.48, -0.05, 0.36, 0.5, 0, 0.5); g.bezierCurveTo(-0.36, 0.5, -0.48, -0.05, 0, -0.58); g.fill(); break;
    case 'preserve':
      poly(g, 0, 0, 0.88, 6, -Math.PI / 2); g.stroke(); poly(g, 0, 0, 0.5, 6, -Math.PI / 2); g.stroke();
      L([[0, -0.5], [0, 0.5]]); L([[-0.43, -0.25], [0.43, 0.25]]); L([[-0.43, 0.25], [0.43, -0.25]]); break;
    case 'erudite':
      g.beginPath(); g.ellipse(0, 0, 0.88, 0.3, 0.55, 0, TAU); g.stroke();
      g.beginPath(); g.ellipse(0, 0, 0.88, 0.3, -0.55, 0, TAU); g.stroke();
      circ(g, 0, 0, 0.2); g.fill(); g.beginPath(); g.arc(0, 0, 0.88, -2.6, -0.5); g.stroke(); break;
    case 'harmony':
      for (const rr of [0.32, 0.58, 0.84]) {
        g.beginPath(); g.arc(-0.26, 0, rr, -0.85, 0.85); g.stroke();
        g.beginPath(); g.arc(0.26, 0, rr, Math.PI - 0.85, Math.PI + 0.85); g.stroke();
      }
      circ(g, 0, 0, 0.13); g.fill(); break;
    case 'nihil':
      g.beginPath(); g.moveTo(-0.92, 0); g.quadraticCurveTo(0, -0.78, 0.92, 0); g.quadraticCurveTo(0, 0.78, -0.92, 0); g.stroke();
      crescent(g, 0.05, 0, 0.32, 0.16); g.fill(); break;
    case 'elation':
      circ(g, 0, 0, 0.86); g.stroke();
      star4(g, -0.32, -0.18, 0.22, 0.06); g.fill(); star4(g, 0.32, -0.18, 0.22, 0.06); g.fill();
      g.beginPath(); g.arc(0, 0.06, 0.46, 0.25, Math.PI - 0.25); g.stroke(); break;
    case 'breaker':
      g.beginPath(); g.arc(0.3, 0, 0.78, Math.PI * 0.62, Math.PI * 1.38); g.stroke();
      g.beginPath(); g.arc(-0.3, 0, 0.78, -Math.PI * 0.38, Math.PI * 0.38); g.stroke();
      L([[-0.55, -0.55], [0.55, 0.55]]); L([[0.55, -0.55], [-0.55, 0.55]]); break;
  }
  g.restore();
}
function elemDiamond(g, x, y, s, el) {
  g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.75, y); g.lineTo(x, y + s); g.lineTo(x - s * 0.75, y); g.closePath();
  g.fillStyle = ELEM[el].col; g.fill(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 0.8; g.stroke();
}

// ======================= 静态背景 =======================
function tracePath(g) { g.beginPath(); pathPts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); }
function buildBg() {
  const c = mkCanvas(W * DPR, H * DPR), g = c.getContext('2d'); g.scale(DPR, DPR);
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, '#0a0d26'); gr.addColorStop(0.55, '#150f3a'); gr.addColorStop(1, '#06182c');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (const [x, y, r, col] of [[160,120,300,'rgba(140,80,255,.24)'],[640,430,330,'rgba(0,170,255,.17)'],
                                [520,90,230,'rgba(255,110,190,.12)'],[300,470,220,'rgba(80,120,255,.13)'],[720,150,160,'rgba(255,200,120,.08)']]) {
    const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
  }
  for (let i = 0; i < 300; i++) {
    const s = Math.random() * 1.4; g.fillStyle = `rgba(255,255,255,${Math.random() * 0.6})`;
    g.fillRect(Math.random() * W, Math.random() * H, s, s);
  }
  for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) {
    if (pathCells.has(x + ',' + y)) continue;
    g.beginPath();
    g.roundRect ? g.roundRect(x * T + 3, y * T + 3, T - 6, T - 6, 6) : g.rect(x * T + 3, y * T + 3, T - 6, T - 6);
    g.fillStyle = 'rgba(120,150,255,.035)'; g.fill();
    g.strokeStyle = 'rgba(140,170,255,.10)'; g.lineWidth = 1; g.stroke();
  }
  g.lineJoin = 'round'; g.lineCap = 'round';
  tracePath(g); g.strokeStyle = 'rgba(80,190,255,.12)'; g.lineWidth = 50; g.stroke();
  tracePath(g); g.strokeStyle = 'rgba(120,210,255,.6)'; g.lineWidth = 36; g.stroke();
  tracePath(g); g.strokeStyle = '#0b1430'; g.lineWidth = 32; g.stroke();
  g.setLineDash([4, 12]); tracePath(g); g.strokeStyle = 'rgba(140,220,255,.25)'; g.lineWidth = 2; g.stroke(); g.setLineDash([]);
  return c;
}
const BG = buildBg();
const STARS = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, p: Math.random() * 6, s: 0.5 + Math.random() * 2, r: 2 + Math.random() * 4 }));
const FLOWS = Array.from({ length: 30 }, (_, i) => ({ d: i * pathLen / 30, s: 60 + Math.random() * 60 }));
const MOTES = Array.from({ length: 36 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 8 + Math.random() * 18, p: Math.random() * 6 }));

// ======================= 状态 =======================
let S, clock = 0, rbFlag = false;
function reset() {
  S = { gold: 200, lives: 20, maxLives: 20, wave: 0, score: 0, towers: [], enemies: [], bullets: [], mines: [],
        parts: [], rings: [], texts: [], beams: [], flashes: [], bolts: [], thorns: [], slashes: [], pops: [],
        meteors: [], rockets: [], timers: [], hole: null, constel: null, circle: null, staff: null, crystal: null,
        banner: null, ult: null, shield: 0, buffT: 0, frost: 0, invert: 0,
        spawnQueue: [], spawnTimer: 0, waveActive: false, waveHp: 30, waveTough: 1, sel: 'hunt', picked: null,
        breakMul: 1, speed: 1, paused: false, over: false, mouse: null, shake: 0, whiteFlash: 0, hurt: 0,
        en: Object.fromEntries(IDS.map(id => [id, 0])) };
  if (typeof uiReset === 'function') uiReset();
}

// ======================= 特效工具 =======================
const MAXP = 1600;
function part(o) {
  if (S.parts.length >= MAXP) return;
  o.max = o.life; o.drag ??= 0.9; o.tail ??= 0.04; o.rot ??= Math.random() * TAU; o.vr ??= 0; o.g ??= 0;
  S.parts.push(o);
}
function burst(x, y, col, n, spd, size = 2, life = 0.5, shape) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = spd * rnd(0.3, 1);
    part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, col, size: size * rnd(0.6, 1.4), life: life * rnd(0.6, 1.2), shape, vr: rnd(-10, 10) });
  }
}
function confetti(x, y, n, spd = 260) {
  for (let i = 0; i < n; i++) {
    const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), s = spd * rnd(0.4, 1);
    part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, col: pick(CONFETTI), size: rnd(3, 6), life: rnd(0.9, 1.6),
           shape: 'confetti', drag: 0.94, g: 420, vr: rnd(-14, 14), main: true });
  }
}
function ring(x, y, r, col, life = 0.4, w = 3) { S.rings.push({ x, y, r, col, life, max: life, w }); }
function flash(x, y, r, col, life = 0.25) { S.flashes.push({ x, y, r, col, life, max: life }); }
function after(t, fn) { S.timers.push({ t, fn }); }
function addText(x, y, v, o = {}) {
  const size = o.big ? 28 : o.crit ? 21 : o.dot ? 11 : 14;
  S.texts.push({ x: x + rnd(-8, 8), y: y - 10, text: String(v), crit: o.crit, label: o.label, life: 0.9, max: 0.9,
                 col: o.textCol || (o.big ? '#ffe08a' : o.crit ? '#ffd84d' : o.dot ? (o.col || '#ccc') : '#ffffff'), size });
}
function setBanner(title, sub, col, life = 1.8) { S.banner = { title, sub, col, life, max: life }; }
