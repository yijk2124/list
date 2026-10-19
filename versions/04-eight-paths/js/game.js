'use strict';
// ======================= 数值 =======================
function towerStats(tw) {
  const B = TOWERS[tw.type], L = tw.lvl - 1, bf = tw.buff || 0, ub = S.buffT > 0 ? 1 : 0;
  return {
    range: B.range * (1 + 0.1 * L),
    rate: B.rate / ((1 + 0.15 * L) * (1 + bf * 0.6 + ub * 0.35)),
    dmg: B.dmg * (1 + 0.4 * L) * (1 + bf + ub * 0.5),
    tough: (B.tough || 0) * (1 + 0.15 * L),
    splash: B.splash ? B.splash * (1 + 0.08 * L) : 0,
  };
}
const upCost = tw => Math.round(TOWERS[tw.type].cost * 0.8 * tw.lvl);
const sellVal = tw => Math.round(tw.spent * 0.6);
const towersOf = id => S.towers.filter(t => t.type === id);
const maxLvl = id => towersOf(id).reduce((a, t) => Math.max(a, t.lvl), 0);
const harmonyAmt = h => 0.15 + 0.05 * (h.lvl - 1);
function canUlt(id) {
  return S.en[id] >= 100 && !S.ult && !S.over && towersOf(id).length > 0 && (id !== 'harmony' || maxLvl('harmony') >= 3);
}
function gainEn(id, v) { S.en[id] = Math.min(100, S.en[id] + v); }

// ======================= 波次 =======================
function startWave() {
  if (S.waveActive || S.over || S.ult) return;
  S.wave++; S.waveActive = true;
  const n = 8 + S.wave * 2;
  for (let i = 0; i < n; i++) {
    let type = 'normal';
    if (S.wave >= 3 && i % 4 === 3) type = 'fast';
    if (S.wave >= 5 && i % 6 === 5) type = 'tank';
    S.spawnQueue.push(type);
  }
  const boss = S.wave % 5 === 0;
  if (boss) S.spawnQueue.push('boss');
  S.waveHp = 30 * Math.pow(1.22, S.wave - 1); S.waveTough = 1 + 0.08 * (S.wave - 1); S.spawnTimer = 0;
  boss ? setBanner('强 敌 来 袭', `WAVE ${S.wave} · BOSS INCOMING`, '#ff4d6d', 2.2)
       : setBanner(`第 ${S.wave} 波`, `WAVE ${S.wave} · ENEMY INCOMING`, '#ffd27a');
}
function spawn(type) {
  const E = ETYPES[type], hp = S.waveHp * E.hp, tough = E.tough * S.waveTough;
  const weak = [...ELEM_IDS].sort(() => Math.random() - 0.5).slice(0, E.weak);
  const p = posAt(0);
  S.enemies.push({ type, dist: 0, x: p.x, y: p.y, hp, maxHp: hp, spd: E.spd, r: E.r, gold: E.gold, weak, tough, maxTough: tough,
                   slowT: 0, frozen: 0, stun: 0, imprisonT: 0, vulnT: 0, vuln: 0, brokenT: 0, dots: {}, flash: 0, toughFlash: 0,
                   rot: Math.random() * 6 });
  ring(pathPts[0].x + T, pathPts[0].y, 32, '#b98bff', 0.4, 2);
}

// ======================= 伤害 / 韧性 / 击破 =======================
function damage(e, amt, o = {}) {
  if (e.dead) return 0;
  const d = amt * (1 + (e.vulnT > 0 ? e.vuln : 0) + (e.brokenT > 0 ? 0.15 : 0));
  e.hp -= d;
  if (!o.dot) e.flash = 0.07;
  if (!o.silent) addText(e.x, e.y, Math.round(d), o);
  if (o.src && !o.dot) gainEn(o.src.type, GAIN[o.src.type]);
  if (e.hp <= 0) kill(e, o.src);
  return d;
}
function strike(e, shot, mult = 1) {
  damage(e, shot.dmg * mult, { src: shot.tower, crit: shot.crit, elem: shot.elem, big: shot.big });
  toughHit(e, shot.elem, shot.tough * mult, shot.tower, shot.force);
}
function toughHit(e, elem, amt, src, force) {
  if (e.dead || e.brokenT > 0 || !(amt > 0)) return;
  const any = force || (src && TOWERS[src.type].breakAny);
  if (!any && !e.weak.includes(elem)) return;
  e.tough -= amt * S.breakMul; e.toughFlash = 0.15;
  if (e.tough <= 0) doBreak(e, elem, src);
}
function addDot(e, key, dps, t, src, col) {
  const d = e.dots[key];
  if (d) { d.dps = Math.max(d.dps, dps); d.t = Math.max(d.t, t); d.src = src || d.src; }
  else e.dots[key] = { dps, t, tick: 0, acc: 0, src, col };
}
function doBreak(e, elem, src) {
  const boss = e.type === 'boss', EL = ELEM[elem] || ELEM.phys;
  e.tough = 0; e.brokenT = 4.5; e.stun = boss ? 1 : 1.6;
  // 击破特效：属性色碎片四散 + 冲击环
  burst(e.x, e.y, EL.col, boss ? 40 : 22, boss ? 380 : 280, 4, 0.8, 'shard');
  burst(e.x, e.y, '#ffffff', 10, 200, 2, 0.4);
  ring(e.x, e.y, e.r * 4.5, '#ffffff', 0.5, 4); ring(e.x, e.y, e.r * 3, EL.col, 0.4, 3); flash(e.x, e.y, e.r * 5, EL.col, 0.35);
  S.texts.push({ x: e.x, y: e.y - e.r - 24, text: `击破·${EL.brk}`, life: 1.2, max: 1.2, col: EL.col, size: 15, tag: true });
  S.shake += boss ? 10 : 3;
  if (boss) setBanner('弱 点 击 破', `WEAKNESS BREAK · ${EL.brk}`, EL.col, 1.4);
  damage(e, S.waveHp * (boss ? 1.2 : 0.5) * S.breakMul, { src, big: true, elem });
  if (e.dead) return;
  const w = S.waveHp;
  switch (elem) {
    case 'phys':    addDot(e, 'bleed', e.maxHp * (boss ? 0.02 : 0.07), 3, src, EL.col); break;
    case 'fire':    addDot(e, 'burn', w * 0.35, 3, src, EL.col); break;
    case 'thunder': addDot(e, 'shock', w * 0.4, 3, src, EL.col); break;
    case 'wind':    addDot(e, 'wind', w * 0.3, 4, src, EL.col); break;
    case 'ice':     e.frozen = Math.max(e.frozen, 2.2); break;
    case 'quantum': e.dist = Math.max(0, e.dist - 55); damage(e, w * 0.3, { src, elem }); break;
    case 'imag':    e.imprisonT = 4; break;
  }
}
function kill(e, src) {
  e.dead = true; S.gold += e.gold; S.score += e.gold * 10; rbFlag = true;
  if (src) { src.kills++; gainEn(src.type, 4); }
  const E = ETYPES[e.type], boss = e.type === 'boss';
  burst(e.x, e.y, E.color, boss ? 70 : 18, boss ? 400 : 230, 3, 0.7);
  burst(e.x, e.y, '#ffffff', 6, 120, 2, 0.4);
  ring(e.x, e.y, e.r * 2.6, E.color, 0.45, 3); flash(e.x, e.y, e.r * 3, E.color);
  S.texts.push({ x: e.x, y: e.y - e.r - 8, text: '+' + e.gold, life: 0.8, max: 0.8, col: '#ffd27a', size: 13 });
  if (boss) { S.shake += 12; S.whiteFlash = 0.5; }
}

// ======================= 主更新 =======================
function update(dt) {
  if (S.spawnQueue.length) {
    S.spawnTimer -= dt;
    if (S.spawnTimer <= 0) { spawn(S.spawnQueue.shift()); S.spawnTimer = 0.75; }
  }
  S.buffT = Math.max(0, S.buffT - dt);
  S.breakMul = Math.min(3, 1 + 0.25 * towersOf('breaker').reduce((a, t) => a + t.lvl, 0));
  updateEnemies(dt);
  updateTowers(dt);
  updateBullets(dt);
  updateMines(dt);
  S.bullets = S.bullets.filter(b => !b.dead);
  S.mines = S.mines.filter(m => !m.dead);
  S.enemies = S.enemies.filter(e => !e.dead);
  if (S.lives <= 0) { S.lives = 0; S.over = true; }
  if (S.waveActive && !S.spawnQueue.length && !S.enemies.length && !S.over) {
    S.waveActive = false; const bonus = 20 + S.wave * 5; S.gold += bonus;
    setBanner('战 斗 胜 利', `VICTORY · 奖励 +${bonus} 信用点`, '#7fe3ff');
  }
}
function updateEnemies(dt) {
  for (const e of S.enemies) {
    const sp = e.frozen > 0 || e.stun > 0 ? 0 : e.imprisonT > 0 ? 0.35 : e.slowT > 0 ? 0.55 : 1;
    e.frozen -= dt; e.stun -= dt; e.imprisonT -= dt; e.slowT -= dt; e.flash -= dt; e.toughFlash -= dt;
    if (e.vulnT > 0 && (e.vulnT -= dt) <= 0) e.vuln = 0;
    if (e.brokenT > 0 && (e.brokenT -= dt) <= 0) { e.tough = e.maxTough; ring(e.x, e.y, e.r * 2, '#ffffff', 0.3, 2); }
    e.rot += ETYPES[e.type].spin * dt * sp;
    e.dist += e.spd * sp * dt;
    const p = posAt(e.dist); e.x = p.x; e.y = p.y;
    for (const k in e.dots) {
      const d = e.dots[k], v = d.dps * dt;
      damage(e, v, { dot: true, silent: true, src: d.src });
      d.acc += v; d.tick += dt; d.t -= dt;
      if (d.tick >= 0.5) { d.tick = 0; addText(e.x, e.y - 6, Math.round(d.acc), { dot: true, col: d.col }); d.acc = 0; }
      if (d.t <= 0) delete e.dots[k];
      if (e.dead) break;
    }
    if (!e.dead && e.dist >= pathLen) {
      e.dead = true;
      const ex = pathPts.at(-1).x - T, ey = pathPts.at(-1).y;
      if (S.shield > 0) {
        S.shield--; ring(ex, ey, 50, '#8fe9ff', 0.5, 4); burst(ex, ey, '#bff4ff', 20, 220, 3, 0.6, 'shard');
      } else {
        S.lives -= e.type === 'boss' ? 5 : 1; S.hurt = 1; S.shake += 6;
        burst(ex, ey, '#ff4d6d', 24, 220, 3, 0.6);
      }
    }
  }
}
function updateTowers(dt) {
  const harm = towersOf('harmony');
  for (const tw of S.towers) {
    tw.buff = 0;
    for (const h of harm) if (h !== tw && dist(h, tw) <= towerStats(h).range) tw.buff = Math.max(tw.buff, harmonyAmt(h));
  }
  if (S.waveActive && harm.length) gainEn('harmony', dt * (2 + harm.length));
  for (const tw of S.towers) {
    tw.cd -= dt; tw.flash = Math.max(0, tw.flash - dt * 4);
    const st = towerStats(tw), B = TOWERS[tw.type];
    if (tw.type === 'harmony') {
      if (tw.cd <= 0) { tw.cd = 1.6; tw.flash = 1; ring(tw.x, tw.y, st.range, hexA(B.col, .55), 1.0, 2); }
      continue;
    }
    if (tw.type === 'elation') {
      if (tw.cd > 0) continue;
      tw.cd = 0.3;
      if (S.mines.filter(m => m.tower === tw).length >= 2 + tw.lvl) continue;
      const spots = PATH_SAMPLES.filter(p => dist(p, tw) <= st.range && !S.mines.some(m => dist(m, p) < 24));
      if (!spots.length) continue;
      const p = pick(spots); tw.cd = st.rate; tw.flash = 1; tw.angle = Math.atan2(p.y - tw.y, p.x - tw.x);
      S.mines.push({ x: p.x, y: p.y, sx: tw.x, sy: tw.y, t: 0, fly: 0.5, tower: tw, dmg: st.dmg, tough: st.tough, splash: st.splash, seed: Math.random() * 6 });
      continue;
    }
    let target = null;
    for (const e of S.enemies) if (!e.dead && dist(e, tw) <= st.range && (!target || e.dist > target.dist)) target = e;
    if (!target) continue;
    tw.angle = Math.atan2(target.y - tw.y, target.x - tw.x);
    if (tw.cd > 0) continue;
    tw.cd = st.rate; tw.flash = 1;
    attack(tw, target, st);
  }
}
function attack(tw, target, st) {
  const B = TOWERS[tw.type], L = tw.lvl - 1, col = B.col;
  const crit = !!B.crit && Math.random() < B.crit + 0.03 * L;
  const shot = { tower: tw, dmg: st.dmg * (crit ? 2 : 1), crit, elem: B.elem, tough: st.tough, col };
  const tx = tw.x + Math.cos(tw.angle) * 20, ty = tw.y + Math.sin(tw.angle) * 20;
  switch (tw.type) {
    case 'hunt':
      S.bullets.push({ kind: 'arrow', x: tx, y: ty, target, spd: 620, ...shot, trail: [] });
      burst(tx, ty, col, 4, 120, 1.5, 0.25, 'star'); break;
    case 'destroy': {
      const d = dist(target, tw);
      S.bullets.push({ kind: 'comet', sx: tx, sy: ty, x: tx, y: ty, tx: target.x, ty: target.y, target, t: 0, dur: 0.3 + d / 380, h: 30 + d * 0.3, splash: st.splash, ...shot });
      burst(tx, ty, '#ffb05a', 8, 160, 2.5, 0.35); flash(tx, ty, 24, col, 0.2); break;
    }
    case 'preserve': {
      const n = 3 + Math.floor(L / 2);
      for (let i = 0; i < n; i++) {
        const a = tw.angle + (i - (n - 1) / 2) * 0.55;
        S.bullets.push({ kind: 'shard', x: tx, y: ty, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, target, life: 2, spin: rnd(-8, 8), rot: a, ...shot });
      }
      burst(tx, ty, '#e8fdff', 6, 120, 2, 0.3, 'shard'); break;
    }
    case 'erudite': {
      const n = 3 + Math.floor(L / 2), hit = [target]; let cur = target;
      while (hit.length < n) {
        let best = null, bd = 115;
        for (const e of S.enemies) if (!e.dead && !hit.includes(e)) { const d = dist(e, cur); if (d < bd) { bd = d; best = e; } }
        if (!best) break; hit.push(best); cur = best;
      }
      S.bolts.push({ pts: [{ x: tx, y: ty }, ...hit.map(e => ({ x: e.x, y: e.y }))], life: 0.3, max: 0.3, col, w: 2.5 });
      hit.forEach((e, i) => { burst(e.x, e.y, '#ecd6ff', 6, 200, 1.5, 0.3); flash(e.x, e.y, 24, col, 0.2); strike(e, shot, Math.pow(0.85, i)); });
      flash(tx, ty, 26, col, 0.2); break;
    }
    case 'nihil': {
      const tg = [target], extra = L >= 2 ? 2 : 1;
      for (const e of S.enemies) if (tg.length <= extra && e !== target && !e.dead && dist(e, target) < 75) tg.push(e);
      for (const e of tg) {
        S.beams.push({ x1: tx, y1: ty, x2: e.x, y2: e.y, cx: (tx + e.x) / 2 + rnd(-50, 50), cy: (ty + e.y) / 2 - rnd(30, 70), life: 0.4, max: 0.4, col, w: 3, wisp: true });
        S.thorns.push({ x: e.x, y: e.y, life: 0.6, max: 0.6, n: 6, seed: Math.random() * 6, col });
        e.vulnT = 4; e.vuln = Math.max(e.vuln, 0.2 + 0.05 * L);
        addDot(e, 'erode', st.dmg * 0.45, 4, tw, ELEM.quantum.col);
        strike(e, shot);
      }
      break;
    }
    case 'breaker':
      S.bullets.push({ kind: 'blade', x: tx, y: ty, vx: Math.cos(tw.angle) * 470, vy: Math.sin(tw.angle) * 470, travel: 0, maxTravel: st.range * 1.5,
                       hit: new Set(), rot: tw.angle, ...shot });
      S.slashes.push({ x: tx, y: ty, a: tw.angle + Math.PI / 2, len: 26, life: 0.18, max: 0.18, col }); break;
  }
}
function updateBullets(dt) {
  for (const b of S.bullets) {
    if (b.kind === 'arrow') {
      const t = b.target; if (t.dead) { b.dead = true; burst(b.x, b.y, b.col, 4, 80, 1.5, 0.3, 'star'); continue; }
      b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 10) b.trail.shift();
      const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy), step = b.spd * dt;
      b.rot = Math.atan2(dy, dx);
      if (Math.random() < 0.5) part({ x: b.x, y: b.y, vx: rnd(-30, 30), vy: rnd(-30, 30), col: '#fff3c4', size: rnd(1.5, 3), life: 0.4, shape: 'star', drag: 0.92 });
      if (d <= step) {
        b.dead = true; strike(t, b);
        flash(t.x, t.y, b.crit ? 40 : 24, b.col, 0.22); burst(t.x, t.y, '#fff3c4', b.crit ? 10 : 5, 200, 2.5, 0.35, 'star');
        if (b.crit) S.slashes.push({ x: t.x, y: t.y, a: 0.78, len: 34, life: 0.25, max: 0.25, col: '#fff3c4', cross: true });
      } else { b.x += dx / d * step; b.y += dy / d * step; }
    } else if (b.kind === 'comet') {
      if (!b.target.dead) { b.tx = b.target.x; b.ty = b.target.y; }
      b.t += dt; const k = Math.min(1, b.t / b.dur);
      const px = b.x, py = b.y;
      b.x = b.sx + (b.tx - b.sx) * k; b.y = b.sy + (b.ty - b.sy) * k - Math.sin(Math.PI * k) * b.h;
      b.rot = Math.atan2(b.y - py, b.x - px);
      for (let i = 0; i < 2; i++) part({ x: b.x + rnd(-3, 3), y: b.y + rnd(-3, 3), vx: rnd(-40, 40), vy: rnd(-60, 10), col: pick(['#ff7a2e', '#ffb05a', '#ffe08a']), size: rnd(2, 4), life: rnd(0.25, 0.5), drag: 0.9, tail: 0.02 });
      if (k >= 1) { b.dead = true; explode(b.tx, b.ty, b); }
    } else if (b.kind === 'shard') {
      b.life -= dt; b.rot += b.spin * dt;
      if (b.target.dead) {
        let best = null, bd = 160;
        for (const e of S.enemies) if (!e.dead) { const d = dist(e, b); if (d < bd) { bd = d; best = e; } }
        if (best) b.target = best;
      }
      const t = b.target;
      if (!t.dead) {
        const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy), sp = 520, k = Math.min(1, 7 * dt);
        b.vx += (dx / d * sp - b.vx) * k; b.vy += (dy / d * sp - b.vy) * k;
        if (d < t.r + 5) {
          b.dead = true; strike(t, b); t.slowT = Math.max(t.slowT, 1.5 + 0.2 * (b.tower.lvl - 1));
          burst(t.x, t.y, '#e8fdff', 5, 160, 2.5, 0.4, 'shard'); ring(t.x, t.y, 20, '#bff4ff', 0.3, 2);
          continue;
        }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.life <= 0) { b.dead = true; burst(b.x, b.y, '#e8fdff', 3, 60, 2, 0.3, 'shard'); }
    } else if (b.kind === 'blade') {
      const step = Math.hypot(b.vx, b.vy) * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.travel += step;
      if (Math.random() < 0.6) part({ x: b.x, y: b.y, vx: -b.vx * 0.1 + rnd(-20, 20), vy: -b.vy * 0.1 + rnd(-20, 20), col: '#dfe6ff', size: 1.6, life: 0.3 });
      for (const e of S.enemies) if (!e.dead && !b.hit.has(e) && dist(e, b) < e.r + 12) {
        b.hit.add(e); strike(e, b);
        S.slashes.push({ x: e.x, y: e.y, a: b.rot + Math.PI / 2 + rnd(-0.3, 0.3), len: 30, life: 0.22, max: 0.22, col: '#ffffff' });
        burst(e.x, e.y, '#ffffff', 5, 220, 1.8, 0.3);
      }
      if (b.travel > b.maxTravel || b.x < -30 || b.x > W + 30 || b.y < -30 || b.y > H + 30) b.dead = true;
    }
  }
}
function explode(x, y, b) {
  const big = !!b.big;
  ring(x, y, b.splash, '#ff8a3d', 0.45, big ? 7 : 5); ring(x, y, b.splash * 0.6, '#ffd27a', 0.3, 3);
  flash(x, y, b.splash * 1.4, '#ff7a2e', 0.3);
  burst(x, y, '#ff9a3d', big ? 30 : 18, big ? 360 : 260, 3, 0.55); burst(x, y, '#ffe08a', 8, 140, 2, 0.4);
  for (let i = 0; i < 6; i++) part({ x, y, vx: rnd(-60, 60), vy: rnd(-80, -20), col: 'rgba(120,90,110,.5)', size: rnd(8, 14), life: rnd(0.5, 0.9), shape: 'smoke', drag: 0.95, main: true });
  S.shake += big ? 5 : 3;
  for (const e of S.enemies) if (!e.dead && dist(e, { x, y }) <= b.splash) strike(e, b);
}
function updateMines(dt) {
  for (const m of S.mines) {
    m.t += dt;
    if (m.t < m.fly) continue;
    if (!m.landed) { m.landed = true; ring(m.x, m.y, 18, '#ff8ad8', 0.3, 2); confetti(m.x, m.y, 5, 120); }
    for (const e of S.enemies) if (!e.dead && dist(e, m) < e.r + 14) { popMine(m); break; }
  }
}
function popMine(m) {
  m.dead = true;
  const sup = Math.random() < 0.25;
  S.pops.push({ x: m.x, y: m.y, life: 0.8, max: 0.8, sup });
  confetti(m.x, m.y, sup ? 40 : 22, sup ? 340 : 260);
  ring(m.x, m.y, m.splash, '#ff8ad8', 0.4, 4); ring(m.x, m.y, m.splash * 0.55, '#ffe066', 0.3, 2); flash(m.x, m.y, m.splash * 1.3, '#ff8ad8', 0.3);
  S.texts.push({ x: m.x, y: m.y - 30, text: sup ? '哈哈哈！' : '砰！', life: 0.9, max: 0.9, col: sup ? '#ffe066' : '#ff8ad8', size: sup ? 22 : 17, tag: true });
  S.shake += sup ? 4 : 2;
  const shot = { tower: m.tower, dmg: m.dmg * (sup ? 2 : 1), crit: sup, elem: 'imag', tough: m.tough, col: '#ff8ad8', big: m.big };
  for (const e of S.enemies) if (!e.dead && dist(e, m) <= m.splash) strike(e, shot);
}

// ======================= 终结技 =======================
function castUlt(id) {
  if (!canUlt(id) || S.paused) return;
  S.en[id] = 0; S.ult = { id, t: 0, fired: false };
}
function fireUlt(id) {
  const tws = towersOf(id), lv = tws.reduce((a, t) => a + t.lvl, 0), src = tws[0] || null;
  const dmg = S.waveHp * (2.2 + 0.35 * lv), col = TOWERS[id].col, el = TOWERS[id].elem;
  const shot = (d, o = {}) => ({ tower: src, dmg: d, crit: true, big: true, elem: el, tough: 40, col, ...o });
  S.whiteFlash = 0.6; S.shake += 12;
  ring(W / 2, H / 2, 650, col, 0.9, 8);
  const live = () => S.enemies.filter(e => !e.dead);
  switch (id) {
    case 'hunt': {
      const es = live().sort((a, b) => a.dist - b.dist);
      S.constel = { pts: es.map(e => ({ x: e.x, y: e.y })), t: 0, dur: 1.4 };
      for (const e of es) for (let k = 0; k < 4; k++) after(0.25 + k * 0.1 + Math.random() * 0.12, () => {
        if (e.dead) return;
        S.beams.push({ x1: e.x - 170, y1: -30, x2: e.x, y2: e.y, life: 0.3, max: 0.3, col: '#ffe08a', w: 6, arrow: true });
        flash(e.x, e.y, 34, col, 0.22); burst(e.x, e.y, '#fff3c4', 8, 240, 2.5, 0.4, 'star'); strike(e, shot(dmg / 4));
      });
      for (let i = 0; i < 46; i++) after(0.2 + Math.random() * 0.8, () => {
        const x = Math.random() * W, y = Math.random() * H;
        S.beams.push({ x1: x - 170, y1: -30, x2: x, y2: y, life: 0.25, max: 0.25, col: '#ffd27a', w: 2.5, arrow: true });
        burst(x, y, '#ffd27a', 4, 140, 2, 0.3, 'star');
      });
      break;
    }
    case 'destroy': {
      const tg = live().map(e => [e.x, e.y]);
      for (let i = 0; i < 6; i++) tg.push([rnd(80, W - 80), rnd(80, H - 80)]);
      tg.forEach(([tx, ty], i) => after(i * 0.05, () => S.meteors.push({ x0: tx + 280, y0: -80, tx, ty, t: 0, dur: 0.42, dmg: dmg * 0.6 })));
      break;
    }
    case 'preserve':
      S.crystal = { t: 0, dur: 1.6 }; S.frost = 1; S.shield += 3;
      for (const e of live()) {
        e.frozen = Math.max(e.frozen, 4); e.slowT = 6;
        ring(e.x, e.y, 54, '#bff4ff', 0.6, 4); burst(e.x, e.y, '#e8fdff', 14, 280, 3, 0.7, 'shard');
        strike(e, shot(dmg * 0.8));
      }
      break;
    case 'erudite':
      S.circle = { t: 0, dur: 1.4 };
      for (const e of live()) for (let k = 0; k < 3; k++) after(0.15 + k * 0.25 + Math.random() * 0.1, () => {
        if (e.dead) return;
        const pts = [{ x: e.x + rnd(-40, 40), y: -20 }, { x: e.x, y: e.y }];
        let cur = e;
        for (let j = 0; j < 2; j++) {
          let best = null, bd = 140;
          for (const o of S.enemies) if (!o.dead && o !== cur && !pts.some(p => p.x === o.x && p.y === o.y)) { const d = dist(o, cur); if (d < bd) { bd = d; best = o; } }
          if (!best) break; pts.push({ x: best.x, y: best.y }); cur = best;
        }
        S.bolts.push({ pts, life: 0.35, max: 0.35, col, w: 5 });
        flash(e.x, e.y, 50, col, 0.3); ring(e.x, e.y, 40, '#ecd6ff', 0.3, 3); burst(e.x, e.y, '#ecd6ff', 10, 260, 2, 0.4);
        strike(e, shot(dmg / 3)); S.shake += 2;
      });
      break;
    case 'harmony': {
      S.staff = { t: 0, dur: 2.2 };
      const lost = S.maxLives - S.lives, heal = Math.min(lost, Math.max(lost > 0 ? 2 : 0, Math.ceil(lost * 0.5)));
      S.lives += heal; S.buffT = 8;
      for (const t of S.towers) { t.cd = 0; ring(t.x, t.y, 30, col, 0.6, 3); }
      for (const k of IDS) if (k !== 'harmony') gainEn(k, 20);
      const ex = pathPts.at(-1).x - T, ey = pathPts.at(-1).y;
      for (let i = 0; i < 40; i++) {
        const sx = rnd(0, W), sy = rnd(0, H), l = rnd(0.6, 1.1);
        part({ x: sx, y: sy, vx: (ex - sx) / l, vy: (ey - sy) / l, col: pick(['#7dffd0', '#ffffff', '#bfffe8']), size: rnd(3, 5), life: l, drag: 1, shape: 'note', tail: 0, main: true });
      }
      if (heal > 0) after(0.9, () => { S.texts.push({ x: ex - 30, y: ey - 40, text: `+${heal} 生命`, life: 1.4, max: 1.4, col: '#7dffd0', size: 20, tag: true }); ring(ex, ey, 70, col, 0.7, 5); });
      break;
    }
    case 'nihil': {
      const es = live(); let cx = W / 2, cy = H / 2;
      if (es.length) { cx = es.reduce((a, e) => a + e.x, 0) / es.length; cy = es.reduce((a, e) => a + e.y, 0) / es.length; }
      for (const e of es) { e.vulnT = 6; e.vuln = Math.max(e.vuln, 0.5); addDot(e, 'erode', S.waveHp * 0.4, 6, src, ELEM.quantum.col); }
      S.hole = { x: cx, y: cy, t: 0, dur: 1.15, dmg, src };
      break;
    }
    case 'elation': {
      const es = live().slice(0, 24);
      const tg = es.map(e => ({ e })); for (let i = 0; i < 6; i++) tg.push({ x: rnd(80, W - 80), y: rnd(60, H - 140) });
      tg.forEach((o, i) => after(i * 0.06, () => {
        const tx = o.e ? (o.e.dead ? o.e.x : o.e.x) : o.x, ty = o.e ? o.e.y : o.y;
        S.rockets.push({ x0: tx + rnd(-60, 60), y0: H + 10, tx, ty, t: 0, dur: 0.5, dmg: dmg * 0.7, e: o.e });
      }));
      const st = src ? towerStats(src) : { dmg: 40, tough: 10, splash: 45 };
      for (let i = 0; i < 6; i++) {
        const p = pick(PATH_SAMPLES);
        S.mines.push({ x: p.x, y: p.y, sx: W / 2, sy: -20, t: -i * 0.08, fly: 0.6, tower: src, dmg: st.dmg * 2, tough: st.tough, splash: 55, seed: Math.random() * 6, big: true, golden: true });
      }
      break;
    }
    case 'breaker': {
      const a = -0.5;
      S.bigSlash = { t: 0, life: 0.8, a };
      after(0.1, () => {
        S.whiteFlash = 0.5; S.shake += 10;
        for (const e of live()) {
          S.slashes.push({ x: e.x, y: e.y, a: a + rnd(-0.4, 0.4), len: 50, life: 0.35, max: 0.35, col: '#ffffff' });
          strike(e, shot(dmg * 0.7, { elem: 'phys', tough: 9999, force: true }));
        }
      });
      break;
    }
  }
}

// ======================= 特效更新 =======================
function jagged(pts, amp) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], n = Math.max(2, Math.floor(dist(a, b) / 14));
    const nx = -(b.y - a.y), ny = b.x - a.x, l = Math.hypot(nx, ny) || 1;
    for (let k = 1; k < n; k++) { const o = rnd(-amp, amp); out.push({ x: a.x + (b.x - a.x) * k / n + nx / l * o, y: a.y + (b.y - a.y) * k / n + ny / l * o }); }
    out.push(b);
  }
  return out;
}
function fxUpdate(dt) {
  for (const p of S.parts) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt;
    const k = Math.pow(p.drag, dt * 60); p.vx *= k; p.vy *= k; p.rot += p.vr * dt; p.life -= dt;
  }
  for (const arr of [S.rings, S.texts, S.beams, S.flashes, S.bolts, S.thorns, S.slashes, S.pops]) for (const o of arr) o.life -= dt;
  for (const t of S.texts) t.y -= (t.tag ? 18 : 30) * dt;
  S.parts = S.parts.filter(o => o.life > 0); S.rings = S.rings.filter(o => o.life > 0);
  S.texts = S.texts.filter(o => o.life > 0); S.beams = S.beams.filter(o => o.life > 0);
  S.flashes = S.flashes.filter(o => o.life > 0); S.bolts = S.bolts.filter(o => o.life > 0);
  S.thorns = S.thorns.filter(o => o.life > 0); S.slashes = S.slashes.filter(o => o.life > 0); S.pops = S.pops.filter(o => o.life > 0);
  const due = []; S.timers = S.timers.filter(tm => (tm.t -= dt) > 0 || (due.push(tm), false)); due.forEach(tm => tm.fn());
  // 陨石
  const landed = []; S.meteors = S.meteors.filter(m => (m.t += dt) < m.dur || (landed.push(m), false));
  for (const m of landed) {
    explode(m.tx, m.ty, { splash: 85, dmg: m.dmg, crit: true, big: true, elem: 'fire', tough: 30, col: '#ff7a45', tower: towersOf('destroy')[0] || null });
    flash(m.tx, m.ty, 140, '#ff6a3d', 0.4); ring(m.tx, m.ty, 130, '#ffd27a', 0.6, 6);
  }
  // 烟花
  const boom = []; S.rockets = S.rockets.filter(r => (r.t += dt) < r.dur || (boom.push(r), false));
  for (const r of S.rockets) {
    if (r.e && !r.e.dead) { r.tx = r.e.x; r.ty = r.e.y; }
    const k = ease3(r.t / r.dur), x = r.x0 + (r.tx - r.x0) * k, y = r.y0 + (r.ty - r.y0) * k;
    part({ x, y, vx: rnd(-20, 20), vy: rnd(20, 60), col: pick(['#ffe066', '#ffffff']), size: 2, life: 0.35, shape: 'star' });
  }
  for (const r of boom) {
    const cols = [pick(CONFETTI), pick(CONFETTI)];
    for (let i = 0; i < 32; i++) {
      const a = i * TAU / 32, s = rnd(200, 260);
      part({ x: r.tx, y: r.ty, vx: Math.cos(a) * s, vy: Math.sin(a) * s, col: cols[i % 2], size: 2.5, life: 0.9, drag: 0.92, g: 160, tail: 0.05 });
    }
    confetti(r.tx, r.ty, 10, 200); flash(r.tx, r.ty, 70, cols[0], 0.35); ring(r.tx, r.ty, 70, cols[1], 0.5, 3);
    const shot = { tower: towersOf('elation')[0] || null, dmg: r.dmg, crit: true, big: true, elem: 'imag', tough: 30, col: '#ff8ad8' };
    for (const e of S.enemies) if (!e.dead && dist(e, { x: r.tx, y: r.ty }) < 60) strike(e, shot);
    S.shake += 1.5;
  }
  // 黑洞
  if (S.hole) {
    const h = S.hole; h.t += dt;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * TAU, r = rnd(140, 280), l = 0.5;
      part({ x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r, vx: -Math.cos(a) * r / l, vy: -Math.sin(a) * r / l,
             col: Math.random() < 0.3 ? '#ffffff' : '#b98bff', size: 2.2, life: l, drag: 1, tail: 0.03 });
    }
    for (const e of S.enemies) e.slowT = Math.max(e.slowT, 0.3);
    if (h.t >= h.dur) {
      for (const e of [...S.enemies]) strike(e, { tower: h.src, dmg: h.dmg, crit: true, big: true, elem: 'quantum', tough: 40, col: '#b98bff' });
      ring(h.x, h.y, 260, '#b98bff', 0.8, 9); ring(h.x, h.y, 160, '#ffffff', 0.5, 4);
      flash(h.x, h.y, 260, '#b98bff', 0.5); burst(h.x, h.y, '#d9bfff', 80, 520, 3, 0.9);
      S.whiteFlash = 0.8; S.shake += 18; S.hole = null;
    }
  }
  for (const k of ['constel', 'circle', 'staff', 'crystal', 'bigSlash']) {
    const o = S[k]; if (o && (o.t += dt) >= (o.dur || o.life)) S[k] = null;
  }
  if (S.frost > 0) {
    S.frost = Math.max(0, S.frost - dt / 3.5);
    for (let i = 0; i < 2; i++) part({ x: Math.random() * W, y: -5, vx: rnd(-20, 20), vy: rnd(70, 130), col: '#e8fdff', size: 2, life: 3, drag: 1, tail: 0.02, shape: 'flake', vr: rnd(-2, 2) });
  }
  if (Math.random() < dt * 0.35) part({ x: 300 + Math.random() * W, y: -10, vx: -520, vy: 260, col: '#cfe0ff', size: 1.8, life: 1.4, drag: 1, tail: 0.12 });
  for (const m of MOTES) { m.y -= m.v * dt; m.x += Math.sin(clock + m.p) * 6 * dt; if (m.y < -5) { m.y = H + 5; m.x = Math.random() * W; } }
  if (S.banner && (S.banner.life -= dt) <= 0) S.banner = null;
  for (const f of FLOWS) f.d = (f.d + f.s * dt) % pathLen;
  S.shake = Math.min(22, Math.max(0, S.shake * Math.pow(0.02, dt) - 0.1));
  S.whiteFlash = Math.max(0, S.whiteFlash - dt * 1.6); S.hurt = Math.max(0, S.hurt - dt * 1.5);
}
