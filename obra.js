// Caramelópolis — OBRA (v3): mundo montado peça por peça a partir de obra_layout.json (gerado por obra_layout.py).
// Peças ordenadas por profundidade (pé), cachorros andam só pelas ruas (grafo), etiquetas por cima.
const $ = (s) => document.querySelector(s);
const world = $("#world"), view = $("#view");
const rnd = (i) => { let t = (i * 0x9e3779b1 + 0x7f4a7c15) >>> 0; t = Math.imul(t ^ (t >>> 15), 0x85ebca6b) >>> 0; t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35) >>> 0; return ((t ^ (t >>> 16)) >>> 0) / 4294967296; };
const lerp = (a, b, x) => a + (b - a) * x, clamp = (x, a, b) => Math.max(a, Math.min(b, x)), smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

// ---------- motor ----------
const loads = []; const missing = new Set();
function img(name) { const el = document.createElement("img"); el.src = `sprites/${name}.png`; el.draggable = false; loads.push(new Promise((r) => { el.onload = r; el.onerror = () => { missing.add(name); r(); }; })); return el; }
function tiles(name, x0, y0, x1, y1, sw, sh, z = 0) { const el = document.createElement("div"); el.className = "tile"; el.style.cssText = `left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px;background:url(sprites/${name}.png) 0 0/${sw}px ${sh}px repeat;z-index:${z}`; world.appendChild(el); return el; }
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
function painted(x, y, h, w = 90) { const el = document.createElement("div"); el.className = "hit"; el.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - h}px;width:${w}px;height:${h}px;z-index:${20000 + Math.round(y) + 1};cursor:pointer`; world.appendChild(el);
  const sp = { el, h, st: { x, y, s: 1 }, set: (st) => { sp.st = { ...sp.st, ...st }; el.style.transform = `translateY(${Math.round(-(sp.st.bob || 0))}px)`; } }; return sp; }

// ---------- mundo ----------
const L = await (await fetch("obra_layout.json?v=" + Date.now())).json();
const [BW, BH] = L.size;
tiles("obra2/grass", -3000, -1200, 4200, 2800, 112, 112, 0);
for (const [x0, x1, y] of L.roads_h) tiles("obra2/road_h", x0, y, x1, y + 28, 200, 28, 1);
for (const [x, y0, y1] of L.roads_v) tiles("obra2/road_v", x, y0, x + 32, y1, 32, 200, 1);
{ const [px, py, pw, ph] = L.plaza; tiles("obra2/road_h", px, py, px + pw, py + ph, 200, 28, 1).style.borderRadius = "50%"; }
for (const [x0, x1, y] of L.hedges_h) tiles("obra2/hedge_h", x0, y, x1, y + 22, 200, 22, 2);
for (const [x, y0, y1] of L.hedges_v) tiles("obra2/hedge_v", x, y0, x + 22, y1, 22, 200, 2);
const lampEls = [];
for (const p of L.pieces) { const el = document.createElement("img"); el.src = `sprites/obra2/${p.k}.png`; if (p.k === "lamp") lampEls.push(el); el.draggable = false; el.className = "tile"; el.style.cssText = `left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px;z-index:${20000 + Math.round(p.y + p.h - 6)};image-rendering:pixelated`; world.appendChild(el); loads.push(new Promise((r) => { el.onload = r; el.onerror = () => { missing.add(p.k); r(); }; })); }
const B = {}; const bTags = [];
for (const [k, b] of Object.entries(L.buildings)) { B[k] = painted(b.x, b.y, b.h, b.w); bTags.push(tag(b.label, B[k], 1, k === "mansao" ? "#ffe27a" : k === "delegacia" ? "#cfe6ff" : "#fff6d8")); }
const popTxt = wtext("POP. 0", 590, 1016, 4, "#ffd24a", 40001);
const lanterns = L.pieces.filter((p) => p.k === "lamp").map((p) => { const l = dot(16, 16, "rgba(255,200,90,0.35)"); l.pos = [p.x + 15, p.y + 22]; return l; });
const smokes = []; for (const [cx, cy] of [[640, 70], [420, 150], [310, 540], [1000, 405]]) for (let k = 0; k < 4; k++) smokes.push({ d: dot(3, 3, "#f4f1ea"), cx, cy, k });
const flies = []; for (let k = 0; k < 8; k++) flies.push({ d: dot(3, 3, ["#fff3a0", "#ffffff", "#ffb3d9"][k % 3]), k });
const spray = []; for (let k = 0; k < 10; k++) spray.push({ d: dot(2, 3, "#bfe9ff"), k });

// ---------- grafo das ruas (cachorros só andam aqui) ----------
const segs = [...L.roads_h.map(([a, b, y]) => ({ t: "h", c: y + 14, a: Math.min(a, b), b: Math.max(a, b), pts: new Set() })), ...L.roads_v.map(([x, a, b]) => ({ t: "v", c: x + 16, a: Math.min(a, b), b: Math.max(a, b), pts: new Set() }))];
for (const s of segs) { s.pts.add(s.a); s.pts.add(s.b); }
for (const h of segs) if (h.t === "h") for (const v of segs) if (v.t === "v") { if (v.c >= h.a && v.c <= h.b && h.c >= v.a && h.c <= v.b) { h.pts.add(v.c); v.pts.add(h.c); } }
const nodes = new Map(); const adj = new Map();
const nid = (x, y) => { const k = `${Math.round(x)},${Math.round(y)}`; if (!nodes.has(k)) { nodes.set(k, { x: Math.round(x), y: Math.round(y) }); adj.set(k, []); } return k; };
function snap(x, y) { let best = null; for (const s of segs) { let px, py; if (s.t === "h") { px = clamp(x, s.a, s.b); py = s.c; } else { px = s.c; py = clamp(y, s.a, s.b); } const dd = Math.hypot(px - x, py - y); if (!best || dd < best.d) best = { d: dd, s, px, py }; } return best; }
function addPoint(x, y) { const b = snap(x, y); b.s.pts.add(Math.round(b.s.t === "h" ? b.px : b.py)); return [Math.round(b.px), Math.round(b.py)]; }
const DATA = await (await fetch("moradores.json?v=" + Date.now())).json();
const M = DATA.moradores; const lots = L.lots.slice(); let li = 0; const plan = [];
for (const m of M) { let hs, door; if (m.casa === "mansao") { const b = L.buildings.mansao; hs = B.mansao; door = addPoint(b.x, b.y + 8); } else { const [x, y, h, w] = lots[li % lots.length]; li++; hs = painted(x, y, h, w); door = addPoint(x, y + 8); } plan.push({ m, hs, door }); }
const WORK = {}; for (const [k, [x, y]] of Object.entries(L.points)) WORK[k] = addPoint(x, y);
for (const s of segs) { const ps = [...s.pts].sort((a, b) => a - b); for (let i = 0; i + 1 < ps.length; i++) { const A = s.t === "h" ? nid(ps[i], s.c) : nid(s.c, ps[i]), Bk = s.t === "h" ? nid(ps[i + 1], s.c) : nid(s.c, ps[i + 1]); const d = ps[i + 1] - ps[i]; if (d <= 0) continue; adj.get(A).push([Bk, d]); adj.get(Bk).push([A, d]); } }
const keyOf = ([x, y]) => `${Math.round(x)},${Math.round(y)}`;
function path(from, to) { if (from === to) return [to]; const prev = new Map([[from, null]]); const q = [from]; while (q.length) { const k = q.shift(); if (k === to) break; for (const [n] of adj.get(k) || []) if (!prev.has(n)) { prev.set(n, k); q.push(n); } } if (!prev.has(to)) return null; const out = []; for (let k = to; k; k = prev.get(k)) out.push(k); return out.reverse(); }
const nodeKeys = [...nodes.keys()];

// ---------- moradores ----------
const dogs = [];
$("#nMor").textContent = M.length; popTxt.textContent = `POP. ${M.length}`;
$("#ctaEntrar").href = DATA.episodios[DATA.episodio_atual];
const u = DATA.urna; $("#urna").innerHTML = (u.aberta ? `URNA ABERTA · fecha ${u.fecha}<br>` : `URNA FECHADA · PREFEITA: <b>${u.prefeito}</b><br>`) + u.parcial.filter((p) => p[1] > 0).map((p) => `<b>${p[0]}</b> ${p[1]}`).join(" · "); if (u.prefeito) $("#nPref").textContent = u.prefeito;
const SZ = { dog_pinscher: 16, dog_salsicha2: 20, dog_salsicha_longo: 20, dog_pitbull: 26, dog_caramelo2: 26, dog_borzoi: 30, dog_husky_plain: 28, dog_pug2: 18, dog_yorkshire: 16, dog_shihtzu: 18, dog_spitz: 20, dog_poodle2: 24, dog_saobernardo: 34, dog_dogue: 34, dog_mastim: 32, dog_boerboel: 32, dog_kangal: 32, dog_canecorso: 30, dog_greyhound: 30, dog_doberman: 30, dog_bulldogfrances: 18, dog_bulldog: 22 };
plan.forEach(({ m, hs, door }, i) => {
  hs.el.classList.add("hit"); hs.el.dataset.id = m.id;
  const ht = tag(m.nome.toUpperCase(), hs, 1, m.casa === "mansao" ? "#ffe27a" : "#fff8e8");
  const sp = sprite(m.sprite, SZ[m.sprite] || 28, { x: door[0], y: door[1], shadow: true, fallback: "dog_caramelo2" }); sp.el.classList.add("hit"); sp.el.dataset.id = m.id;
  const wk = WORK[m.work] || WORK.praca;
  dogs.push({ m, sp, hs, ht, door, work: wk, tg: tag(m.nome.toUpperCase(), sp, 2, m.casa === "mansao" ? "#ffe27a" : "#fff8e8"), x: door[0], y: door[1], node: keyOf(door), route: [], state: "idle", wait: 1 + rnd(i * 3 + 1) * 5, speed: 16 + rnd(i + 77) * 10, flip: 0, ph: rnd(i + 5) * 6, bark: 0 });
});
const PLACES = ["praca", "mercado", "lago", "parque", "coreto", "biblioteca", "palanque"];
function pickTarget(d) { const r = Math.random(); let p; if (r < 0.3) p = d.work; else if (r < 0.55) p = d.door; else if (r < 0.8) p = WORK[PLACES[Math.floor(Math.random() * PLACES.length)]]; else { const n = nodes.get(nodeKeys[Math.floor(Math.random() * nodeKeys.length)]); p = [n.x, n.y]; } return keyOf(p); }

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
function clampCam() { cam.x = clamp(cam.x, -1500, 2700); cam.y = clamp(cam.y, -100, 1450); }
view.addEventListener("click", (e) => { if (moved > 8) return; const id = e.target.dataset && e.target.dataset.id; if (id) openCard(id); });
function flyTo(x, y, s = 2.6) { fly = { x0: cam.x, y0: cam.y, s0: cam.s, x1: x, y1: y, s1: s, t: 0 }; }
window.__fly = flyTo; window.__night = (on) => { $("#night").style.display = on ? "" : "none"; };

// ---------- card / busca / compartilhar ----------
const card = $("#card"); let current = null;
function openCard(id) { const d = dogs.find((k) => k.m.id === id); if (!d) return; current = d; $("#cPic").src = d.sp.el.src; $("#cNome").textContent = d.m.nome;
  $("#cSub").innerHTML = `<b>${d.m.raca}</b><br>${d.m.trabalho}<br>` + (d.m.video === false ? `comentou no episódio ${d.m.ep} · entra no vídeo no próximo` : `entrou no episódio ${d.m.ep}`) + (d.m.casa === "mansao" ? "<br>mora na mansão" : "");
  $("#cReel").href = DATA.episodios[d.m.ep] || DATA.episodios[DATA.episodio_atual]; card.classList.add("open"); document.body.classList.add("cardOpen"); d.bark = 1.2; flyTo(d.x, d.y, Math.max(cam.s, 2.4)); }
$("#cardClose").onclick = () => { card.classList.remove("open"); document.body.classList.remove("cardOpen"); };
$("#cCasa").onclick = () => { if (!current) return; flyTo(current.hs.st.x, current.hs.st.y - 30, 2.4); current.hs.bounce = 1; };
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
  const zoomedOut = cam.s < 0.8;
  const vx0 = cam.x - W / 2 / cam.s - 80, vx1 = cam.x + W / 2 / cam.s + 80, vy0 = cam.y - H / 2 / cam.s - 120, vy1 = cam.y + H / 2 / cam.s + 80;
  const vis = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
  bTags.forEach((tg) => tg.show(1));
  smokes.forEach((s) => { if (!vis(s.cx, s.cy)) { s.d.set({ vis: 0 }); return; } const ph = ((t * 0.5 + s.k * 0.25) % 1); s.d.set({ x: s.cx + Math.sin((t + s.k) * 2) * 3 + ph * 4, y: s.cy - ph * 26, w: 2 + ph * 4, h: 2 + ph * 4, alpha: (1 - ph) * 0.8, z: 21200 }); });
  spray.forEach((s) => { const k = ((t * 0.8 + s.k * 0.1) % 1); const a = (s.k / 10) * Math.PI * 2; s.d.set({ vis: vis(590, 470) ? 1 : 0, x: 590 + Math.cos(a) * k * 22, y: 440 - Math.sin(k * Math.PI) * 26 + k * 40, alpha: 1 - k * 0.7, z: 20530 }); });
  flies.forEach((f) => { const i = f.k; f.d.set({ x: cam.x + (Math.sin(t * 0.55 + i * 1.7) * 130 + Math.sin(t * 3.3 + i) * 7) / cam.s * 1.2, y: cam.y + (Math.cos(t * 0.42 + i * 2.3) * 220 + Math.sin(t * 4.1 + i * 0.5) * 6) / cam.s * 1.2, w: 3 / cam.s, h: (2 + Math.abs(Math.sin(t * 9 + i)) * 1.5) / cam.s, alpha: 0.95 }); });
  const hour = new Date().getHours(); const night = hour >= 18 || hour < 6; $("#night").style.opacity = night ? 0.45 : 0;
  if (window.__lampNight !== night) { window.__lampNight = night; lampEls.forEach((el) => (el.src = `sprites/obra2/${night ? "lamp" : "lamp_off"}.png`)); }
  lanterns.forEach((l) => l.set({ vis: night && vis(l.pos[0], l.pos[1]) ? 1 : 0, x: l.pos[0], y: l.pos[1] + 7, w: 16 + Math.sin(t * 7 + l.pos[0]) * 2, h: 16 + Math.sin(t * 7 + l.pos[0]) * 2, alpha: 0.6, z: 58000 }));
  for (const d of dogs) {
    if (d.state === "idle") { d.wait -= dt; if (d.wait <= 0) { const to = pickTarget(d); const r = path(d.node, to); if (r && r.length > 1) { d.route = r.slice(1); d.state = "walk"; } else d.wait = 2; } }
    else { const nk = d.route[0]; const n = nodes.get(nk); const dx = n.x - d.x, dy = n.y - d.y; const dist = Math.hypot(dx, dy); if (dist < 1.5) { d.x = n.x; d.y = n.y; d.node = nk; d.route.shift(); if (!d.route.length) { d.state = "idle"; d.wait = 1.5 + Math.random() * 6; } } else { const st = Math.min(dist, d.speed * dt); d.x += dx / dist * st; d.y += dy / dist * st; if (Math.abs(dx) > 1) d.flip = dx < 0 ? 1 : 0; } }
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
