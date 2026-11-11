// Caramelópolis — OBRA: mapa novo baseado em ref/obra-ref.png (praça com chafariz, coreto, lagos, moinho, prefeitura no topo, portal).
// Mesmo motor do app.js; só o mundo muda. Rascunho: roda em localhost até o episódio da obra.
const $ = (s) => document.querySelector(s);
const world = $("#world"), view = $("#view");
const rnd = (i) => { let t = (i * 0x9e3779b1 + 0x7f4a7c15) >>> 0; t = Math.imul(t ^ (t >>> 15), 0x85ebca6b) >>> 0; t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35) >>> 0; return ((t ^ (t >>> 16)) >>> 0) / 4294967296; };
const lerp = (a, b, x) => a + (b - a) * x, clamp = (x, a, b) => Math.max(a, Math.min(b, x)), smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const outBack = (x) => { x = clamp(x, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

// ---------- motor de sprites ----------
const loads = []; const missing = new Set();
function img(name) { const el = document.createElement("img"); el.src = `sprites/${name}.png`; el.draggable = false; loads.push(new Promise((r) => { el.onload = r; el.onerror = () => { missing.add(name); r(); }; })); return el; }
function tiles(name, x0, y0, x1, y1, size = 128, z = 0) { const el = document.createElement("div"); el.className = "tile"; el.style.cssText = `left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px;background:url(sprites/${name}.png) 0 0/${size}px ${size}px repeat;z-index:${z}`; world.appendChild(el); return el; }
function circle(name, cx, cy, r, size = 128, z = 1) { const el = tiles(name, cx - r, cy - r, cx + r, cy + r, size, z); el.style.borderRadius = "50%"; el.style.backgroundPosition = `${-(cx - r)}px ${-(cy - r)}px`; return el; }
function sprite(name, h, o = {}) {
  const el = img(name); el.className = "spr"; el.style.height = `${h}px`; world.appendChild(el);
  const sp = { el, name, h, st: { x: 0, y: 0, s: 1, flip: 0, alpha: 1, vis: 1 }, w: h };
  el.addEventListener("load", () => { sp.w = el.naturalWidth * h / el.naturalHeight; el.style.width = `${sp.w}px`; sp.set({}); });
  el.addEventListener("error", () => { if (o.fallback && sp.name !== o.fallback) { sp.name = o.fallback; el.src = `sprites/${o.fallback}.png`; } });
  let shd = null; if (o.shadow) { shd = document.createElement("div"); shd.className = "shd"; world.appendChild(shd); }
  sp.set = (st) => { const s = { ...sp.st, ...st }; sp.st = s; const on = s.vis > 0.5; el.style.display = on ? "block" : "none"; if (shd) shd.style.display = on ? "block" : "none"; if (!on) return;
    el.style.left = `${Math.round(s.x - sp.w / 2)}px`; el.style.top = `${Math.round(s.y - h)}px`; el.style.opacity = s.alpha; el.style.zIndex = 20000 + Math.round(s.z ?? s.y);
    el.style.transform = `translateY(${Math.round(-(s.bob || 0))}px) rotate(${s.rot || 0}deg) scale(${(s.flip ? -1 : 1) * s.s}, ${s.s * (s.sy ?? 1)})`;
    if (shd) { const sw = Math.max(6, sp.w * 0.7 * s.s); shd.style.cssText = `left:${Math.round(s.x - sw / 2)}px;top:${Math.round(s.y - 2)}px;width:${Math.round(sw)}px;height:4px;border-radius:50%;background:rgba(20,40,10,${0.28 - Math.min(0.2, (s.bob || 0) * 0.015)});z-index:${20000 + Math.round(s.z ?? s.y) - 1}`; } };
  sp.set(o); return sp;
}
function tag(text, sp, dy = 4, bg = "#fff8e8") { const el = document.createElement("div"); el.className = "ptag"; el.textContent = text; el.style.background = bg; world.appendChild(el);
  return { el, show: (k) => { el.style.display = k > 0.01 && sp.el.style.display !== "none" ? "block" : "none"; if (k <= 0.01) return; el.style.left = `${Math.round(sp.st.x)}px`; el.style.top = `${Math.round(sp.st.y - sp.h * sp.st.s - dy - 2 - (sp.st.bob || 0))}px`; el.style.opacity = k; el.style.zIndex = 60000 + Math.round(sp.st.y); } }; }
function wtext(txt, x, y, size, color, z = 30000) { const el = document.createElement("div"); el.className = "wtext"; el.style.cssText = `left:${x}px;top:${y}px;font-size:${size}px;color:${color};z-index:${z};text-shadow:1px 1px 0 #3b2a14,-1px -1px 0 #3b2a14,1px -1px 0 #3b2a14,-1px 1px 0 #3b2a14`; el.textContent = txt; world.appendChild(el); return el; }
function dot(w, h, color) { const el = document.createElement("div"); el.style.cssText = `position:absolute;width:${w}px;height:${h}px;background:${color};border-radius:50%;pointer-events:none;display:none`; world.appendChild(el); return { set: (s) => { const on = (s.vis ?? 1) > 0.5; el.style.display = on ? "block" : "none"; if (!on) return; el.style.left = `${s.x - (s.w ?? w) / 2}px`; el.style.top = `${s.y - (s.h ?? h)}px`; el.style.width = `${s.w ?? w}px`; el.style.height = `${s.h ?? h}px`; el.style.opacity = s.alpha ?? 1; el.style.zIndex = s.z ?? 59000; } }; }

// ---------- MUNDO: a referência vira o núcleo; bairros novos são quarteirões copiados dela ----------
const L = await (await fetch("obra_layout.json?v=" + Date.now())).json();
const BW = L.base[0], BH = L.base[1];
tiles("obra/grass", -2200, -400, 3400, 1700, 64, 0);
function paintedImg(src, x, y, w, h, z = 1) { const el = document.createElement("img"); el.src = `sprites/obra/${src}.png`; el.draggable = false; el.className = "tile"; el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${z};image-rendering:pixelated`; world.appendChild(el); loads.push(new Promise((r) => { el.onload = r; el.onerror = r; })); return el; }
paintedImg("base", 0, 0, BW, BH, 2);
// ruas dos bairros
const roadH = (x0, x1, y) => tiles("obra/road_h", x0, y, x1, y + 30, 200, 1);
const roadV = (x, y0, y1) => { const el = tiles("obra/road_v", x, y0, x + 36, y1, 36, 1); el.style.backgroundSize = "36px 200px"; return el; };
const KINDS = ["rb", "rc", "ra", "rh", "rf", "rg"]; const LOTS = []; let bk = 0;
function block(x, y) { const k = KINDS[bk++ % KINDS.length]; const bl = L.blocks[k]; paintedImg(k, x, y, bl.w, bl.h, 3); for (const [lx, ly, h] of bl.lots) LOTS.push([x + lx, y + ly, h]); return bl.w; }
const RH = 144, RP = RH + 30;                                            // altura do quarteirão + rua
const ROWS = []; for (let y = 30; y < BH - 100; y += RP) ROWS.push(y);
for (const y of ROWS) { roadH(-1700, -40, y - 30); roadH(1180, 2900, y - 30);
  let x = -40; while (x > -1650) { const w = L.blocks[KINDS[bk % KINDS.length]].w; roadV(x - 36, y - 30, y + RH); block(x - 36 - w, y); x = x - 36 - w; }
  x = 1180; while (x < 2850) { roadV(x, y - 30, y + RH); const w = block(x + 36, y); x = x + 36 + w; } }
roadV(-40, 0, BH); roadV(1180, 0, BH);
for (let y = BH; y < BH + 2 * RP; y += RP) { roadH(-1700, 2900, y); let x = -1700; while (x < 2850) { roadV(x, y, y + RP); const w = block(x + 36, y + 30); x = x + 36 + w; } }
// "sprite" pintado: só caixa de clique + posição pra etiqueta
function painted(x, y, h, w = 90) { const el = document.createElement("div"); el.className = "hit"; el.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - h}px;width:${w}px;height:${h}px;z-index:${20000 + Math.round(y)};cursor:pointer`; world.appendChild(el);
  const sp = { el, h, st: { x, y, s: 1 }, set: (st) => { sp.st = { ...sp.st, ...st }; el.style.transform = `translateY(${Math.round(-(sp.st.bob || 0))}px)`; } }; return sp; }
const B = {}; const bTags = [];
for (const [k, [x, y, h, label]] of Object.entries(L.buildings)) { B[k] = painted(x, y, h, 100); bTags.push(tag(label, B[k], 1, k === "mansao" ? "#ffe27a" : k === "delegacia" ? "#cfe6ff" : "#fff6d8")); }
const CORE_LOTS = L.core_lots;
const POINTS = L.points;
const trees = [], flowers = [], decor = [];
const lanterns = []; for (const [x, y] of [[536, 160], [644, 160], [524, 300], [656, 300], [524, 420], [656, 420], [530, 700], [650, 700], [530, 830], [650, 830], [536, 960], [644, 960]]) { const l = dot(16, 16, "rgba(255,200,90,0.35)"); l.pos = [x, y]; lanterns.push(l); }
const smokes = []; for (const [cx, cy] of [[640, 70], [420, 150], [310, 540]]) for (let k = 0; k < 4; k++) smokes.push({ d: dot(3, 3, "#f4f1ea"), cx, cy, k });
const flies = []; for (let k = 0; k < 8; k++) flies.push({ d: dot(3, 3, ["#fff3a0", "#ffffff", "#ffb3d9"][k % 3]), k });
const spray = []; for (let k = 0; k < 10; k++) spray.push({ d: dot(2, 3, "#bfe9ff"), k });

// ---------- moradores ----------
const DATA = await (await fetch("moradores.json?v=" + Date.now())).json();
const M = DATA.moradores; const dogs = [];
$("#nMor").textContent = M.length; const popTxt = wtext(`POP. ${M.length}`, 590, 975, 5, "#ffd24a", 40001);
$("#ctaEntrar").href = DATA.episodios[DATA.episodio_atual];
const u = DATA.urna; $("#urna").innerHTML = (u.aberta ? `URNA ABERTA · fecha ${u.fecha}<br>` : `URNA FECHADA · PREFEITA: <b>${u.prefeito}</b><br>`) + u.parcial.filter((p) => p[1] > 0).map((p) => `<b>${p[0]}</b> ${p[1]}`).join(" · "); if (u.prefeito) $("#nPref").textContent = u.prefeito;
const houseOf = {}; let lot = 0;
for (const m of M) {
  let hs, door;
  const ALL = [...CORE_LOTS, ...LOTS];
  if (m.casa === "mansao") { hs = B.mansao; door = [390, 940]; }
  else { const [x, y, h] = ALL[lot % ALL.length]; lot++; hs = painted(x, y, h, 84); door = [x, y + 12]; }
  hs.el.classList.add("hit"); hs.el.dataset.id = m.id; houseOf[m.id] = hs;
  const ht = tag(m.nome.toUpperCase(), hs, 1, m.casa === "mansao" ? "#ffe27a" : "#fff8e8");
  const sz = { dog_pinscher: 16, dog_salsicha2: 20, dog_salsicha_longo: 20, dog_pitbull: 26, dog_caramelo2: 26, dog_borzoi: 30, dog_husky_plain: 28, dog_pug2: 18, dog_yorkshire: 16, dog_shihtzu: 18, dog_spitz: 20, dog_poodle2: 24, dog_saobernardo: 34, dog_dogue: 34, dog_mastim: 32, dog_boerboel: 32, dog_kangal: 32, dog_canecorso: 30, dog_greyhound: 30, dog_doberman: 30, dog_bulldogfrances: 18, dog_bulldog: 22 }[m.sprite] || 28;
  const sp = sprite(m.sprite, sz, { x: door[0], y: door[1], shadow: true, fallback: "dog_caramelo2" }); sp.el.classList.add("hit"); sp.el.dataset.id = m.id;
  const wp = POINTS[m.work] || POINTS.praca;
  dogs.push({ m, sp, hs, ht, door, work: wp, tg: tag(m.nome.toUpperCase(), sp, 2, m.casa === "mansao" ? "#ffe27a" : "#fff8e8"), x: door[0], y: door[1], tx: door[0], ty: door[1], state: "idle", wait: 1 + rnd(lot * 3 + 1) * 4, speed: 16 + rnd(lot + 77) * 10, flip: 0, ph: rnd(lot + 5) * 6, bark: 0 });
}
const PLACES = [[590, 540], [430, 690], [300, 330], [1030, 170], [1020, 660], [450, 420], [820, 500], [590, 990], [150, 160]];
function pickTarget(d) {
  const r = Math.random();
  if (r < 0.3) return [d.work[0] + (Math.random() - 0.5) * 50, d.work[1] + (Math.random() - 0.5) * 16];
  if (r < 0.5) return [d.door[0] + (Math.random() - 0.5) * 20, d.door[1] + 4 + Math.random() * 10];
  if (r < 0.75) { const p = PLACES[Math.floor(Math.random() * PLACES.length)]; return [p[0] + (Math.random() - 0.5) * 60, p[1] + (Math.random() - 0.5) * 30]; }
  if (r < 0.9) return [592 + (Math.random() - 0.5) * 24, 160 + Math.random() * 860];                        // avenida
  return [60 + Math.random() * 1060, 703 + (Math.random() - 0.5) * 16];                                 // rua transversal
}

// ---------- câmera ----------
let W = innerWidth, H = innerHeight; const cam = { x: 588, y: 540, s: Math.max(0.6, Math.min(W / 1200, 1.6)) };
let fly = null;
function applyCam() { world.style.transform = `translate(${Math.round(W / 2 - cam.x * cam.s)}px, ${Math.round(H / 2 - cam.y * cam.s)}px) scale(${cam.s})`; }
addEventListener("resize", () => { W = innerWidth; H = innerHeight; applyCam(); });
const ptrs = new Map(); let dragging = false, moved = 0, pinch0 = null;
view.addEventListener("pointerdown", (e) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragging = true; moved = 0; fly = null; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), s: cam.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, wx: cam.x, wy: cam.y }; } });
view.addEventListener("pointermove", (e) => { if (!ptrs.has(e.pointerId)) return; const p = ptrs.get(e.pointerId); const dx = e.clientX - p.x, dy = e.clientY - p.y; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const ns = clamp(pinch0.s * d / pinch0.d, 0.35, 5); const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2; cam.x = pinch0.wx + (pinch0.cx - W / 2) / pinch0.s - (cx - W / 2) / ns; cam.y = pinch0.wy + (pinch0.cy - H / 2) / pinch0.s - (cy - H / 2) / ns; cam.s = ns; moved += 10; applyCam(); return; }
  if (dragging && ptrs.size === 1) { cam.x -= dx / cam.s; cam.y -= dy / cam.s; moved += Math.abs(dx) + Math.abs(dy); clampCam(); applyCam(); } });
const endPtr = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null; if (ptrs.size === 0) dragging = false; };
view.addEventListener("pointerup", endPtr); view.addEventListener("pointercancel", endPtr); view.addEventListener("pointerleave", endPtr);
view.addEventListener("wheel", (e) => { e.preventDefault(); const ns = clamp(cam.s * (e.deltaY < 0 ? 1.12 : 0.9), 0.35, 5); const mx = (e.clientX - W / 2) / cam.s, my = (e.clientY - H / 2) / cam.s; cam.x += mx - (e.clientX - W / 2) / ns; cam.y += my - (e.clientY - H / 2) / ns; cam.s = ns; clampCam(); applyCam(); }, { passive: false });
function clampCam() { cam.x = clamp(cam.x, -1600, 2800); cam.y = clamp(cam.y, -200, 1500); }
view.addEventListener("click", (e) => { if (moved > 8) return; const id = e.target.dataset && e.target.dataset.id; if (id) openCard(id); });
function flyTo(x, y, s = 2.6) { fly = { x0: cam.x, y0: cam.y, s0: cam.s, x1: x, y1: y, s1: s, t: 0 }; }

// ---------- card / busca / compartilhar ----------
const card = $("#card"); let current = null;
function openCard(id) { const d = dogs.find((k) => k.m.id === id); if (!d) return; current = d; $("#cPic").src = d.sp.el.src; $("#cNome").textContent = d.m.nome;
  $("#cSub").innerHTML = `<b>${d.m.raca}</b><br>${d.m.trabalho}<br>` + (d.m.video === false ? `comentou no episódio ${d.m.ep} · entra no vídeo no próximo` : `entrou no episódio ${d.m.ep}`) + (d.m.casa === "mansao" ? "<br>mora na mansão" : "");
  $("#cReel").href = DATA.episodios[d.m.ep] || DATA.episodios[DATA.episodio_atual]; card.classList.add("open"); document.body.classList.add("cardOpen"); d.bark = 1.2; flyTo(d.x, d.y, Math.max(cam.s, 2.6)); }
$("#cardClose").onclick = () => { card.classList.remove("open"); document.body.classList.remove("cardOpen"); };
$("#cCasa").onclick = () => { if (!current) return; flyTo(current.hs.st.x, current.hs.st.y - 20, 2.6); current.hs.bounce = 1; };
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const hits = $("#hits"), search = $("#search");
search.addEventListener("input", () => { const q = norm(search.value.trim()); hits.innerHTML = ""; if (q.length < 2) { hits.style.display = "none"; return; }
  const r = dogs.filter((d) => norm(d.m.nome).includes(q) || norm(d.m.id).includes(q) || norm(d.m.raca).includes(q) || norm(d.m.trabalho).includes(q)).slice(0, 6);
  for (const d of r) { const b = document.createElement("button"); b.innerHTML = `${d.m.nome.toUpperCase()}<small>${d.m.raca} · ${d.m.trabalho}</small>`; b.onclick = () => { hits.style.display = "none"; search.value = ""; search.blur(); openCard(d.m.id); }; hits.appendChild(b); }
  if (!r.length) { const b = document.createElement("button"); b.innerHTML = `NINGUÉM COM ESSE NOME AINDA<small>comenta a raça no último episódio e amanhã você mora aqui</small>`; b.onclick = () => open(DATA.episodios[DATA.episodio_atual], "_blank"); hits.appendChild(b); }
  hits.style.display = "flex"; });
const toast = (t) => { const el = $("#toast"); el.innerHTML = t; el.style.opacity = 1; setTimeout(() => (el.style.opacity = 0), 2200); };
$("#btnShare").onclick = async () => { const data = { title: "Caramelópolis", text: "Acha a sua casa na cidade dos cachorros 🐕", url: location.href }; try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); toast("link copiado 🐾"); } } catch (e) {} };

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
  if (fly) { fly.t += dt / 0.9; const k = smooth(fly.t); cam.x = lerp(fly.x0, fly.x1, k); cam.y = lerp(fly.y0, fly.y1, k); cam.s = lerp(fly.s0, fly.s1, k); applyCam(); if (fly.t >= 1) fly = null; }
  const zoomedOut = cam.s < 0.9;
  const vx0 = cam.x - W / 2 / cam.s - 80, vx1 = cam.x + W / 2 / cam.s + 80, vy0 = cam.y - H / 2 / cam.s - 120, vy1 = cam.y + H / 2 / cam.s + 80;
  const vis = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
  bTags.forEach((tg) => tg.show(1));

  smokes.forEach((s) => { if (!vis(s.cx, s.cy)) { s.d.set({ vis: 0 }); return; } const ph = ((t * 0.5 + s.k * 0.25) % 1); s.d.set({ x: s.cx + Math.sin((t + s.k) * 2) * 3 + ph * 4, y: s.cy - ph * 26, w: 2 + ph * 4, h: 2 + ph * 4, alpha: (1 - ph) * 0.8, z: 5000 }); });
  spray.forEach((s) => { const k = ((t * 0.8 + s.k * 0.1) % 1); const a = (s.k / 10) * Math.PI * 2; s.d.set({ vis: vis(590, 470) ? 1 : 0, x: 590 + Math.cos(a) * k * 22, y: 440 - Math.sin(k * Math.PI) * 26 + k * 40, alpha: 1 - k * 0.7, z: 20600 }); });
  flies.forEach((f) => { const i = f.k; f.d.set({ x: cam.x + (Math.sin(t * 0.55 + i * 1.7) * 130 + Math.sin(t * 3.3 + i) * 7) / cam.s * 1.2, y: cam.y + (Math.cos(t * 0.42 + i * 2.3) * 220 + Math.sin(t * 4.1 + i * 0.5) * 6) / cam.s * 1.2, w: 3 / cam.s, h: (2 + Math.abs(Math.sin(t * 9 + i)) * 1.5) / cam.s, alpha: 0.95 }); });
  const hour = new Date().getHours(); const night = hour >= 18 || hour < 6; $("#night").style.opacity = night ? 0.5 : 0;
  lanterns.forEach((l) => l.set({ vis: night && vis(l.pos[0], l.pos[1]) ? 1 : 0, x: l.pos[0], y: l.pos[1] + 7, w: 14 + Math.sin(t * 7 + l.pos[0]) * 2, h: 14 + Math.sin(t * 7 + l.pos[0]) * 2, alpha: 0.6, z: 58000 }));
  for (const d of dogs) {
    if (d.state === "idle") { d.wait -= dt; if (d.wait <= 0) { [d.tx, d.ty] = pickTarget(d); d.state = "walk"; } }
    else { const dx = d.tx - d.x, dy = d.ty - d.y; const dist = Math.hypot(dx, dy); if (dist < 2) { d.state = "idle"; d.wait = 1.5 + Math.random() * 5; } else { const st = Math.min(dist, d.speed * dt); d.x += dx / dist * st; d.y += dy / dist * st; if (Math.abs(dx) > 1) d.flip = dx < 0 ? 1 : 0; } }
    if (d.bark > 0) d.bark -= dt;
    const hb = d.hs.bounce; if (hb > 0) { d.hs.bounce = Math.max(0, hb - dt / 1.2); d.hs.set({ bob: Math.abs(Math.sin(hb * Math.PI * 3)) * 10 }); } else if (d.hs.st.bob) d.hs.set({ bob: 0 });
    d.ht.show(!vis(d.hs.st.x, d.hs.st.y) ? 0 : zoomedOut ? (d.m.casa === "mansao" ? 1 : 0) : 1);
    const on = vis(d.x, d.y); if (!on) { d.sp.set({ vis: 0 }); d.tg.show(0); continue; }
    const walking = d.state === "walk"; const bark = d.bark > 0;
    d.sp.set({ vis: 1, x: d.x, y: d.y, flip: d.flip, bob: walking ? Math.abs(Math.sin(t * 14 + d.ph)) * 3 : bark ? Math.abs(Math.sin(t * 16)) * 4 : Math.abs(Math.sin(t * 2.2 + d.ph)) * 0.6, sy: bark ? 1 + Math.abs(Math.sin(t * 16)) * 0.1 : 1 + Math.sin(t * 3 + d.ph) * 0.04, rot: bark ? Math.sin(t * 22) * 5 : 0 });
    d.tg.show(zoomedOut ? 0 : 1);
  }
  requestAnimationFrame(frame);
}
Promise.all(loads).then(() => { applyCam(); $("#loading").style.display = "none"; if (missing.size) console.warn("sprites faltando:", [...missing].join(", ")); requestAnimationFrame(frame); if (location.hash.length > 1) { const id = decodeURIComponent(location.hash.slice(1)); setTimeout(() => openCard(id), 300); } });
