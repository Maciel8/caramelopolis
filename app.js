// Caramelópolis — mapa vivo da cidade. Mesmo mundo dos episódios (px virtuais; rua principal em x=0, norte = y negativo).
const $ = (s) => document.querySelector(s);
const world = $("#world"), view = $("#view");
const rnd = (i) => { let t = (i * 0x9e3779b1 + 0x7f4a7c15) >>> 0; t = Math.imul(t ^ (t >>> 15), 0x85ebca6b) >>> 0; t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35) >>> 0; return ((t ^ (t >>> 16)) >>> 0) / 4294967296; };
const lerp = (a, b, x) => a + (b - a) * x, clamp = (x, a, b) => Math.max(a, Math.min(b, x)), smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const outBack = (x) => { x = clamp(x, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

// ---------- sprites ----------
const loads = []; const missing = new Set();
function img(name) { const el = document.createElement("img"); el.src = `sprites/${name}.png`; el.draggable = false; loads.push(new Promise((r) => { el.onload = r; el.onerror = () => { missing.add(name); r(); }; })); return el; }
function tiles(name, x0, y0, x1, y1, size = 128) { const el = document.createElement("div"); el.className = "tile"; el.style.cssText = `left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px;background:url(sprites/${name}.png) 0 0/${size}px ${size}px repeat;`; world.appendChild(el); return el; }
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

// ---------- mundo (igual ao dos episódios) ----------
const MY = -1990;   // mansão do Speed no fim da rua
const POINTS = { padaria: [-100, -268], escola: [125, -300], delegacia: [-100, -398], oficina: [-150, -176], floricultura: [125, -530], prefeitura: [-110, -536], palanque: [0, -190], mansao: [-30, MY + 10], praca: [0, -170] };
tiles("grass2", -1600, -3400, 1600, 1200);
tiles("path2", -34, -2100, 34, 1000);
tiles("path2", -130, -240, 130, -100);
for (const [x0, x1, y] of [[-150, -34, -292], [34, 150, -342], [-150, -34, -432], [34, 150, -442], [-150, -34, -568], [34, 150, -568], [-180, -34, -200]]) tiles("path2", x0, y - 8, x1, y + 8);
const HEDGE_GAPS = [[-240, -100], [-300, -284], [-350, -334], [-440, -424], [-450, -434], [-576, -560], [-2060, -1900]];
for (let y = -1950; y <= 60; y += 81) { if (HEDGE_GAPS.some(([a, b]) => y - 81 < b + 6 && y > a - 6)) continue; for (const x of [-44, 44]) sprite("hedge_v", 81, { x, y }); }
for (let x = -240; x <= 240; x += 60) { if (x > -70 && x < 70) continue; sprite("fence2", 16, { x, y: 70 }); }
const lanterns = [];
for (const [x, y] of [[-142, -232], [142, -232], [-142, -108], [142, -108], [-70, -60], [70, -60], [-60, -700], [60, -700], [-60, -1000], [60, -1000], [-60, -1300], [60, -1300], [-60, -1600], [60, -1600], [-110, -1960], [110, -1960]]) { sprite("lantern", 40, { x, y }); lanterns.push(dot(14, 14, "rgba(255,200,90,0.35)")); lanterns[lanterns.length - 1].pos = [x, y - 24]; }
const trees = [];
for (let i = 0; i < 150; i++) { const side = i % 2 ? 1 : -1; trees.push(sprite("tree2", 46 + rnd(i + 5) * 16, { x: side * (300 + rnd(i + 3) * 1000), y: -3200 + rnd(i + 4) * 4000 })); }
for (let i = 0; i < 14; i++) { const side = i % 2 ? 1 : -1; trees.push(sprite("tree2", 50 + rnd(i + 50) * 12, { x: side * (265 + rnd(i + 51) * 90), y: 110 + rnd(i + 52) * 500 })); }
for (let i = 0; i < 12; i++) { const side = i % 2 ? 1 : -1; trees.push(sprite("tree2", 50 + rnd(i + 90) * 12, { x: side * (120 + rnd(i + 91) * 160), y: -2120 - rnd(i + 92) * 300 })); }
const flowers = [];
for (let i = 0; i < 70; i++) { const side = i % 2 ? 1 : -1; const k = rnd(i + 70); const nm = k < 0.35 ? "flowers" : k < 0.6 ? "rock_small" : k < 0.8 ? "bush" : k < 0.9 ? "rock" : "stump"; const x = side * (60 + rnd(i + 71) * 220), y = -1900 + rnd(i + 72) * 2100; if (y > -640 && Math.abs(x) < 210) continue; const sp = sprite(nm, k < 0.35 ? 12 : k < 0.6 ? 10 : k < 0.8 ? 18 : k < 0.9 ? 18 : 16, { x, y }); if (nm === "flowers" || nm === "bush") flowers.push(sp); }
for (const [nm, x, y, h] of [["flowers", -160, -60, 12], ["flowers", 165, -70, 12], ["bush", -175, -120, 18], ["flowers", 180, -250, 12], ["rock_small", -175, -380, 10], ["flowers", 175, -400, 12], ["stump", -185, -500, 16], ["flowers", 180, -520, 12], ["bush", 185, -600, 18], ["flowers", -170, -620, 12], ["rock_small", 170, 20, 10], ["flowers", -120, 30, 12], ["flowers", -95, -1965, 12], ["flowers", 95, -1965, 12], ["bush", -120, -2010, 18], ["bush", 120, -2010, 18]]) { const sp = sprite(nm, h, { x, y }); if (nm !== "rock_small" && nm !== "stump") flowers.push(sp); }
sprite("well", 36, { x: 0, y: -640 }); sprite("bench", 16, { x: -90, y: -120 }); sprite("bench", 16, { x: 90, y: -120 }); sprite("cart", 36, { x: 190, y: -160 });
sprite("sign2", 46, { x: -80, y: -30 }); wtext("CARAMELÓPOLIS", -80, -74, 4, "#fff2cc", 40000); const popTxt = wtext("POP. 0", -80, -66, 5, "#ffd24a", 40000);
const bTags = [];
const B = {};
B.padaria = sprite("bakery2", 64, { x: -120, y: -292 }); bTags.push(tag("PADARIA", B.padaria, 1, "#fff6d8"));
B.escola = sprite("escola", 70, { x: 125, y: -342 }); bTags.push(tag("ESCOLA", B.escola, 1, "#fff6d8"));
B.delegacia = sprite("delegacia", 60, { x: -120, y: -432 }); bTags.push(tag("DELEGACIA", B.delegacia, 1, "#cfe6ff"));
B.prefeitura = sprite("prefeitura", 76, { x: -125, y: -568 }); bTags.push(tag("PREFEITURA", B.prefeitura, 1, "#ffe27a"));
B.floricultura = sprite("floricultura", 64, { x: 125, y: -568 }); bTags.push(tag("FLORICULTURA", B.floricultura, 1, "#ffd6ea"));
B.oficina = sprite("oficina", 58, { x: -185, y: -200 }); bTags.push(tag("OFICINA", B.oficina, 1, "#e0e0e0"));
B.palanque = sprite("palanque", 48, { x: 0, y: -215 }); wtext("ELEIÇÃO", 0, -252, 5, "#3b2a14", 40001); wtext("2026", 0, -244, 4, "#8a2a1a", 40001);
B.mansao = sprite("mansao", 120, { x: 0, y: MY });
const smokes = []; for (const [cx, cy] of [[-104, -352], [-110, -640], [136, -404], [-30, MY - 110], [30, MY - 110]]) for (let k = 0; k < 4; k++) smokes.push({ d: dot(3, 3, "#f4f1ea"), cx, cy, k });
const flies = []; for (let k = 0; k < 8; k++) flies.push({ d: dot(3, 3, ["#fff3a0", "#ffffff", "#ffb3d9"][k % 3]), k });
const HK = ["house_a", "house_b", "house_c"];
function lotPos(i) { if (i < 60) { const col = i % 4, row = Math.floor(i / 4); return [[-200, -110, 110, 200][col] + (rnd(i + 9) - 0.5) * 8, -700 - row * 84 + (rnd(i + 10) - 0.5) * 10]; }
  const j = i - 60; const col = j % 2, row = Math.floor(j / 2); return [[-290, 290][col] + (rnd(i + 9) - 0.5) * 8, -700 - row * 84 + (rnd(i + 10) - 0.5) * 10]; }

// ---------- moradores ----------
const DATA = await (await fetch("moradores.json?v=" + Date.now())).json();
const M = DATA.moradores; const dogs = [];
$("#nMor").textContent = M.length; popTxt.textContent = `POP. ${M.length}`;
$("#ctaEntrar").href = DATA.episodios[DATA.episodio_atual];
const u = DATA.urna; $("#urna").innerHTML = (u.aberta ? `URNA ABERTA · fecha ${u.fecha}<br>` : `URNA FECHADA<br>`) + u.parcial.filter((p) => p[1] > 0).map((p) => `<b>${p[0]}</b> ${p[1]}`).join(" · ") + ` · vota comentando no último episódio`;
const houseOf = {}; const enzoHouse = sprite("house_c", 66, { x: 125, y: -442 });
for (const m of M) {
  let hs, door;
  if (m.casa === "mansao") { hs = B.mansao; door = [-30, MY + 10]; }
  else if (m.casa === "rua") { hs = enzoHouse; door = [125, -430]; }
  else { const [x, y] = lotPos(m.casa); hs = sprite(HK[(m.casa * 7) % 3], 62, { x, y }); door = [x, y + 10]; }
  hs.el.classList.add("hit"); hs.el.dataset.id = m.id; houseOf[m.id] = hs;
  const ht = tag(m.nome.toUpperCase(), hs, 1, m.casa === "mansao" ? "#ffe27a" : "#fff8e8"); ht.home = true;
  const sz = { dog_pinscher: 16, dog_salsicha2: 20, dog_salsicha_longo: 20, dog_pitbull: 26, dog_caramelo2: 26, dog_borzoi: 30, dog_husky_plain: 28, dog_pug2: 18, dog_yorkshire: 16, dog_shihtzu: 18, dog_spitz: 20, dog_poodle2: 24, dog_saobernardo: 34, dog_dogue: 34, dog_mastim: 32, dog_boerboel: 32, dog_kangal: 32, dog_canecorso: 30, dog_greyhound: 30, dog_doberman: 30 }[m.sprite] || 28;
  const sp = sprite(m.sprite, sz, { x: door[0], y: door[1], shadow: true, fallback: "dog_caramelo2" }); sp.el.classList.add("hit"); sp.el.dataset.id = m.id;
  const wp = POINTS[m.work] || POINTS.praca;
  dogs.push({ m, sp, hs, ht, door, work: wp, tg: tag(m.nome.toUpperCase(), sp, 2, m.casa === "mansao" ? "#ffe27a" : "#fff8e8"), x: door[0], y: door[1], tx: door[0], ty: door[1], state: "idle", wait: 1 + rnd(m.casa * 3 + 1) * 4, speed: 16 + rnd(m.casa + 77) * 10, flip: 0, ph: rnd(m.casa + 5) * 6, bark: 0 });
}
function pickTarget(d) {
  const r = Math.random();
  if (r < 0.3) return [d.work[0] + (Math.random() - 0.5) * 50, d.work[1] + (Math.random() - 0.5) * 16];
  if (r < 0.5) return [d.door[0] + (Math.random() - 0.5) * 20, d.door[1] + 4 + Math.random() * 10];
  if (r < 0.7) return [(Math.random() - 0.5) * 220, -230 + Math.random() * 120];                      // praça
  if (r < 0.85) return [(Math.random() - 0.5) * 40, clamp(d.y + (Math.random() - 0.5) * 500, -2040, 40)];  // rua, perto de onde está
  return [(Math.random() - 0.5) * 40, -2040 + Math.random() * 2080];                                 // rua, longe
}

// ---------- câmera ----------
let W = innerWidth, H = innerHeight; const cam = { x: 0, y: -330, s: Math.max(1.2, Math.min(W / 440, 3)) };
let fly = null;
function applyCam() { world.style.transform = `translate(${Math.round(W / 2 - cam.x * cam.s)}px, ${Math.round(H / 2 - cam.y * cam.s)}px) scale(${cam.s})`; }
addEventListener("resize", () => { W = innerWidth; H = innerHeight; applyCam(); });
const ptrs = new Map(); let dragging = false, moved = 0, pinch0 = null;
view.addEventListener("pointerdown", (e) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragging = true; moved = 0; fly = null; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), s: cam.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, wx: cam.x, wy: cam.y }; } });
view.addEventListener("pointermove", (e) => { if (!ptrs.has(e.pointerId)) return; const p = ptrs.get(e.pointerId); const dx = e.clientX - p.x, dy = e.clientY - p.y; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const ns = clamp(pinch0.s * d / pinch0.d, 0.45, 5); const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    cam.x = pinch0.wx + (pinch0.cx - W / 2) / pinch0.s - (cx - W / 2) / ns; cam.y = pinch0.wy + (pinch0.cy - H / 2) / pinch0.s - (cy - H / 2) / ns; cam.s = ns; moved += 10; applyCam(); return; }
  if (dragging && ptrs.size === 1) { cam.x -= dx / cam.s; cam.y -= dy / cam.s; moved += Math.abs(dx) + Math.abs(dy); clampCam(); applyCam(); } });
const endPtr = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null; if (ptrs.size === 0) dragging = false; };
view.addEventListener("pointerup", endPtr); view.addEventListener("pointercancel", endPtr); view.addEventListener("pointerleave", endPtr);
view.addEventListener("wheel", (e) => { e.preventDefault(); const ns = clamp(cam.s * (e.deltaY < 0 ? 1.12 : 0.9), 0.45, 5); const mx = (e.clientX - W / 2) / cam.s, my = (e.clientY - H / 2) / cam.s; cam.x += mx - (e.clientX - W / 2) / ns; cam.y += my - (e.clientY - H / 2) / ns; cam.s = ns; clampCam(); applyCam(); }, { passive: false });
function clampCam() { cam.x = clamp(cam.x, -700, 700); cam.y = clamp(cam.y, -2300, 300); }
view.addEventListener("click", (e) => { if (moved > 8) return; const id = e.target.dataset && e.target.dataset.id; if (id) openCard(id); });
function flyTo(x, y, s = 2.6) { fly = { x0: cam.x, y0: cam.y, s0: cam.s, x1: x, y1: y, s1: s, t: 0 }; }

// ---------- card / busca / compartilhar ----------
const card = $("#card"); let current = null;
function openCard(id) { const d = dogs.find((k) => k.m.id === id); if (!d) return; current = d; $("#cPic").src = d.sp.el.src; $("#cNome").textContent = d.m.nome;
  $("#cSub").innerHTML = `<b>${d.m.raca}</b><br>${d.m.trabalho}<br>` + (d.m.video === false ? `comentou no episódio ${d.m.ep} · entra no vídeo no próximo` : `entrou no episódio ${d.m.ep}`) + (d.m.casa === "mansao" ? "<br>mora na mansão" : d.m.casa === "rua" ? "<br>mora na rua principal" : `<br>lote nº ${d.m.casa + 1}`);
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
  const zoomedOut = cam.s < 1.25;
  // visível? (culling simples)
  const vx0 = cam.x - W / 2 / cam.s - 80, vx1 = cam.x + W / 2 / cam.s + 80, vy0 = cam.y - H / 2 / cam.s - 120, vy1 = cam.y + H / 2 / cam.s + 80;
  const vis = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
  bTags.forEach((tg) => tg.show(1));
  trees.forEach((tr, i) => { if (vis(tr.st.x, tr.st.y)) tr.set({ rot: Math.sin(t * 1.1 + i * 0.7) * 1.6 }); });
  flowers.forEach((f, i) => { if (vis(f.st.x, f.st.y)) f.set({ rot: Math.sin(t * 2.2 + i) * 4 }); });
  smokes.forEach((s) => { if (!vis(s.cx, s.cy)) { s.d.set({ vis: 0 }); return; } const ph = ((t * 0.5 + s.k * 0.25) % 1); s.d.set({ x: s.cx + Math.sin((t + s.k) * 2) * 3 + ph * 4, y: s.cy - ph * 26, w: 2 + ph * 4, h: 2 + ph * 4, alpha: (1 - ph) * 0.8, z: 5000 }); });
  flies.forEach((f) => { const i = f.k; f.d.set({ x: cam.x + (Math.sin(t * 0.55 + i * 1.7) * 130 + Math.sin(t * 3.3 + i) * 7) / cam.s * 1.2, y: cam.y + (Math.cos(t * 0.42 + i * 2.3) * 220 + Math.sin(t * 4.1 + i * 0.5) * 6) / cam.s * 1.2, w: 3 / cam.s, h: (2 + Math.abs(Math.sin(t * 9 + i)) * 1.5) / cam.s, alpha: 0.95 }); });
  const hour = new Date().getHours(); const night = hour >= 18 || hour < 6; $("#night").style.opacity = night ? 0.5 : 0;
  lanterns.forEach((l) => l.set({ vis: night ? 1 : 0, x: l.pos[0], y: l.pos[1] + 7, w: 14 + Math.sin(t * 7 + l.pos[0]) * 2, h: 14 + Math.sin(t * 7 + l.pos[0]) * 2, alpha: 0.6, z: 58000 }));
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
Promise.all(loads).then(() => { applyCam(); $("#loading").style.display = "none"; requestAnimationFrame(frame); if (location.hash.length > 1) { const id = decodeURIComponent(location.hash.slice(1)); setTimeout(() => openCard(id), 300); } });
