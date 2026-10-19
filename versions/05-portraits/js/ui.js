'use strict';
// ======================= 面板 =======================
const towerBox = document.getElementById('towers'), ultBox = document.getElementById('ults'), ultEls = {};
function emblemCanvas(id, size) {
  const c = mkCanvas(size * 2, size * 2); c.style.width = c.style.height = size + 'px';
  const g = c.getContext('2d'); g.scale(2, 2);
  const col = TOWERS[id].col, h = size / 2;
  const bg = g.createRadialGradient(h, h, 0, h, h, h); bg.addColorStop(0, hexA(col, .35)); bg.addColorStop(1, 'rgba(10,12,32,.95)');
  g.fillStyle = bg; circ(g, h, h, h - 1); g.fill(); g.strokeStyle = col; g.lineWidth = 1.2; g.stroke();
  drawEmblem(g, id, h, h, h * 0.55, col, 0, 2);
  return c;
}
IDS.forEach((id, i) => {
  const B = TOWERS[id];
  const b = document.createElement('button'); b.className = 'tower-btn'; b.title = `${B.path}·${B.name}：${B.desc}`;
  b.appendChild(emblemCanvas(id, 30));
  const d = document.createElement('div');
  d.innerHTML = `<i style="color:${B.col}">${B.path}</i> · ${B.cost}<small>${B.desc}</small>`;
  b.appendChild(d);
  b.onclick = () => { S.sel = id; S.picked = null; renderButtons(); showInfo(); };
  towerBox.appendChild(b);

  const u = document.createElement('button'); u.className = 'ult'; u.title = `${B.path} · ${B.skill}`;
  u.appendChild(emblemCanvas(id, 28));
  const lab = document.createElement('span'); lab.textContent = `${ULT_KEYS[i].toUpperCase()} ${B.path}`; u.appendChild(lab);
  const bar = document.createElement('div'); bar.className = 'bar'; const fill = document.createElement('i'); bar.appendChild(fill); u.appendChild(bar);
  u.onclick = () => castUlt(id);
  ultBox.appendChild(u); ultEls[id] = { b: u, fill, lab };
});
function renderButtons() {
  IDS.forEach((id, i) => {
    const b = towerBox.children[i];
    b.className = 'tower-btn' + (S.sel === id ? ' sel' : '');
    b.disabled = S.gold < TOWERS[id].cost;
  });
}
function updateHud() {
  document.getElementById('lives').textContent = S.lives + (S.shield ? ` +${S.shield}🛡` : '');
  for (const k of ['gold', 'wave', 'score']) document.getElementById(k).textContent = S[k];
  document.getElementById('startBtn').disabled = S.waveActive || S.over || !!S.ult;
  for (const id of IDS) {
    const { b, fill, lab } = ultEls[id], ready = canUlt(id);
    fill.style.width = Math.floor(S.en[id]) + '%';
    b.disabled = !ready; b.classList.toggle('ready', ready);
    const locked = id === 'harmony' && maxLvl('harmony') < 3;
    lab.textContent = locked ? `${TOWERS[id].path}·Lv3` : `${ULT_KEYS[IDS.indexOf(id)].toUpperCase()} ${TOWERS[id].path}`;
  }
}
function towerExtra(tw) {
  const L = tw.lvl - 1;
  switch (tw.type) {
    case 'hunt': return `暴击率 ${Math.round((0.25 + 0.03 * L) * 100)}%`;
    case 'destroy': return `爆炸半径 ${Math.round(towerStats(tw).splash)}`;
    case 'preserve': return `冰棱 ${3 + Math.floor(L / 2)} 枚 · 减速`;
    case 'erudite': return `连锁 ${3 + Math.floor(L / 2)} 个目标`;
    case 'harmony': return `范围内队友伤害 +${Math.round(harmonyAmt(tw) * 100)}%、攻速提升<br>${tw.lvl >= 3 ? '已解锁终结技：恢复已损失生命' : '<span class="dim">Lv3 解锁终结技：恢复已损失生命</span>'}`;
    case 'nihil': return `易伤 +${Math.round((0.2 + 0.05 * L) * 100)}% · 侵蚀持续伤害${L >= 2 ? ' · 同时攻击 3 个' : ''}`;
    case 'elation': return `场上盒子上限 ${2 + tw.lvl} · 25% 惊喜双倍`;
    case 'breaker': return `全场击破效率 ×${S.breakMul ? S.breakMul.toFixed(2) : '1.00'} · 月刃穿透`;
  }
  return '';
}
function showInfo() {
  if (!S) return;
  const el = document.getElementById('info'), tw = S.picked;
  if (!tw) {
    el.innerHTML = S.sel ? `已选择 <b style="color:${TOWERS[S.sel].col}">${TOWERS[S.sel].path}·${TOWERS[S.sel].name}</b>（${ELEM[TOWERS[S.sel].elem].name}属性），点击空地部署。`
                         : '点击空地部署角色；点击已部署的角色可升级或撤离。';
    return;
  }
  const B = TOWERS[tw.type], st = towerStats(tw), uc = upCost(tw);
  el.innerHTML = `<b style="color:${B.col}">${B.path}·${B.name}</b> <span class="dim">${ELEM[B.elem].name}属性</span> Lv.${tw.lvl}/5<br>` +
    (tw.type === 'harmony' ? `光环范围 ${st.range.toFixed(0)}<br>` : `伤害 ${st.dmg.toFixed(0)} · 射程 ${st.range.toFixed(0)} · 击杀 ${tw.kills}${tw.buff ? ` · <span style="color:#7dffd0">同协 +${Math.round(tw.buff * 100)}%</span>` : ''}<br>`) +
    towerExtra(tw) + '<br>';
  if (tw.lvl < 5) {
    const u = document.createElement('button'); u.textContent = `升级 ${uc}`; u.disabled = S.gold < uc;
    u.onclick = () => {
      if (S.gold < uc) return;
      S.gold -= uc; tw.spent += uc; tw.lvl++;
      ring(tw.x, tw.y, 46, B.col, 0.55, 3); burst(tw.x, tw.y, B.col, 20, 180, 2, 0.6, 'star'); flash(tw.x, tw.y, 50, B.col, .35);
      if (tw.type === 'harmony' && tw.lvl === 3) setBanner('终 结 技 解 锁', 'HARMONY · 和弦·共鸣', B.col, 1.6);
      renderButtons(); showInfo(); updateHud();
    };
    el.appendChild(u);
  }
  const s = document.createElement('button'); s.textContent = `撤离 +${sellVal(tw)}`;
  s.onclick = () => {
    S.gold += sellVal(tw); S.towers = S.towers.filter(t => t !== tw); S.mines = S.mines.filter(m => m.tower !== tw); S.picked = null;
    burst(tw.x, tw.y, '#ffffff', 14, 120, 2, 0.5); renderButtons(); showInfo(); updateHud();
  };
  el.appendChild(s);
}
function uiReset() { renderButtons(); showInfo(); updateHud(); }

// ======================= 输入 =======================
cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); S.mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
cv.addEventListener('mouseleave', () => S.mouse = null);
cv.addEventListener('click', e => {
  if (S.over) { reset(); return; }
  if (S.ult) return;
  const r = cv.getBoundingClientRect(), cx = Math.floor((e.clientX - r.left) / T), cy = Math.floor((e.clientY - r.top) / T);
  const tw = S.towers.find(t => t.cx === cx && t.cy === cy);
  if (tw) { S.picked = tw; S.sel = null; renderButtons(); showInfo(); return; }
  S.picked = null;
  if (S.sel && canBuild(cx, cy) && S.gold >= TOWERS[S.sel].cost) {
    const id = S.sel, B = TOWERS[id]; S.gold -= B.cost;
    const x = cx * T + T / 2, y = cy * T + T / 2;
    S.towers.push({ type: id, cx, cy, x, y, lvl: 1, cd: 0, angle: -Math.PI / 2, spent: B.cost, kills: 0, flash: 1, buff: 0 });
    ring(x, y, 40, B.col, 0.5, 3); ring(x, y, 70, '#ffffff', 0.6, 1.5); burst(x, y, B.col, 18, 170, 2, 0.55, 'star'); flash(x, y, 46, B.col, 0.4);
    S.beams.push({ x1: x, y1: -20, x2: x, y2: y, life: 0.35, max: 0.35, col: B.col, w: 10 });
    if (S.gold < B.cost) S.sel = null;
    renderButtons(); updateHud();
  }
  showInfo();
});
document.getElementById('startBtn').onclick = () => startWave();
const speedBtn = document.getElementById('speedBtn'), pauseBtn = document.getElementById('pauseBtn');
speedBtn.onclick = () => { S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 3 : 1; speedBtn.textContent = `⏩ x${S.speed}`; };
function togglePause() { if (S.ult) return; S.paused = !S.paused; pauseBtn.textContent = S.paused ? '▶ 继续' : '⏸ 暂停'; }
pauseBtn.onclick = togglePause;
document.addEventListener('keydown', e => {
  const t = IDS.find(id => TOWERS[id].key === e.key), uk = ULT_KEYS.indexOf(e.key.toLowerCase());
  if (t) { S.sel = t; S.picked = null; renderButtons(); showInfo(); }
  else if (uk >= 0) castUlt(IDS[uk]);
  else if (e.code === 'Space') { e.preventDefault(); startWave(); }
  else if (e.key === 'p' || e.key === 'P') togglePause();
  else if (e.key === 'Escape') { S.sel = null; S.picked = null; renderButtons(); showInfo(); }
});

// ======================= 主循环 =======================
let last = performance.now(), lastGold = -1, infoKey = '', hudT = 0;
function tick(rdt) {
  if (!S.paused) {
    clock += rdt;
    if (!S.over) {
      if (S.ult) { // 终结技过场：慢动作 → 释放
        S.ult.t += rdt; update(rdt * 0.1);
        if (!S.ult.fired && S.ult.t >= 1.0) { S.ult.fired = true; fireUlt(S.ult.id); }
        if (S.ult.t > 1.3) S.ult = null;
      } else for (let i = 0; i < S.speed; i++) update(rdt);
    }
    fxUpdate(rdt);
  }
  if ((hudT -= rdt) <= 0) { hudT = 0.1; updateHud(); }
  if (rbFlag || S.gold !== lastGold) {
    rbFlag = false; lastGold = S.gold; renderButtons();
    if (S.picked) { const k = (S.gold >= upCost(S.picked)) + '|' + S.picked.kills + '|' + S.picked.buff; if (k !== infoKey) { infoKey = k; showInfo(); } }
  }
}
function loop(now) {
  const rdt = Math.min(0.05, (now - last) / 1000); last = now;
  tick(rdt); draw(); requestAnimationFrame(loop);
}
reset(); requestAnimationFrame(loop);
