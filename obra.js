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

// ---------- MUNDO: construído peça por peça (recortes da referência em sprites/obra2), nas posições da imagem ----------
const META = await (await fetch("sprites/obra2/meta.json?v=" + Date.now())).json();
const BW = 1176, BH = 1072;
tiles("obra2/grass", -2400, -600, 3600, 1800, 80, 0);
function piece(k, x, y, z = 3) { const m = META[k]; const el = document.createElement("img"); el.src = `sprites/obra2/${k}.png`; el.draggable = false; el.className = "tile"; el.style.cssText = `left:${x}px;top:${y}px;width:${m.w}px;height:${m.h}px;z-index:${z};image-rendering:pixelated`; world.appendChild(el); loads.push(new Promise((r) => { el.onload = r; el.onerror = r; })); return el; }
const roadH = (x0, x1, y) => tiles("obra2/road_h", x0, y, x1, y + 28, 200, 1).style.backgroundSize = "200px 28px";
const roadV = (x, y0, y1) => tiles("obra2/road_v", x, y0, x + 32, y1, 32, 1).style.backgroundSize = "32px 200px";
const hedgeH = (x0, x1, y) => tiles("obra2/hedge_h", x0, y, x1, y + 22, 200, 2).style.backgroundSize = "200px 22px";
const hedgeV = (x, y0, y1) => tiles("obra2/hedge_v", x, y0, x + 22, y1, 22, 2).style.backgroundSize = "22px 200px";
// ---- núcleo: ruas como na imagem
roadV(576, 150, BH + 400);                                   // avenida
for (const y of [288, 500, 690, 822, 985]) roadH(40, 1136, y);
for (const x of [335, 912, 45, 1130]) roadV(x, 288, 1000);
tiles("obra2/road_h", 490, 380, 690, 560, 200, 1).style.borderRadius = "50%";   // praça
// cercas vivas ao longo das ruas (com vãos nas esquinas)
for (const y of [288, 500, 690, 822]) { for (const [x0, x1] of [[70, 320], [372, 560], [620, 900], [950, 1115]]) { hedgeH(x0, x1, y - 22); hedgeH(x0, x1, y + 30); } }
for (const x of [335, 912]) for (const [y0, y1] of [[320, 480], [530, 670], [720, 800], [850, 965]]) { hedgeV(x - 22, y0, y1); hedgeV(x + 34, y0, y1); }
for (const [y0, y1] of [[180, 270], [320, 380], [560, 670], [720, 800], [850, 900]]) { hedgeV(554, y0, y1); hedgeV(608, y0, y1); }
hedgeH(0, BW, -2); hedgeV(0, 0, BH); hedgeV(BW - 22, 0, BH);
// ---- peças nas posições exatas da referência
for (const k of Object.keys(META)) { if (/^(tree|bush|flowerbed|lamp|wall|hedgeh|bench|cherry)/.test(k)) continue; const [x0, y0] = META[k].box; piece(k, x0, y0, 3); }
for (let x = 40; x < BW - 60; x += 100) { if (x > 480 && x < 680) continue; piece("wall", x, 935, 3); }
for (const [x, y] of [[0, 60], [1100, 150], [0, 460], [20, 860], [1100, 330], [1090, 820]]) piece(y > 400 ? "cherry2" : "cherry", x, y, 3);
const TREES = [[380, 470], [650, 400], [455, 540], [60, 160], [300, 300], [470, 60], [690, 60], [920, 300], [1060, 540], [660, 760], [250, 760], [560, 790], [700, 860], [960, 1010], [150, 1010], [400, 1010], [300, 220], [470, 230], [880, 230], [740, 310], [1000, 180], [40, 330], [1130, 420], [250, 470], [720, 540], [520, 630], [1100, 700], [200, 650], [380, 870], [1120, 920], [20, 560], [1130, 60], [640, 600], [500, 940], [690, 940], [870, 400], [110, 300], [1060, 300]];
TREES.forEach(([x, y], i) => piece(["tree1", "tree2", "tree3"][i % 3], x, y, 3));
for (const [x, y] of [[520, 300], [630, 300], [520, 420], [640, 420], [520, 560], [640, 560], [520, 700], [640, 700], [520, 835], [640, 835], [520, 900], [640, 900], [300, 350], [890, 350], [300, 640], [890, 640], [300, 930], [890, 930], [700, 960]]) piece("lamp", x, y, 4);
for (const [x, y] of [[420, 480], [640, 440], [520, 480], [560, 540], [620, 540], [740, 480], [240, 540], [330, 740], [980, 740], [120, 700], [1000, 400], [160, 490]]) piece("flowerbed", x, y, 3);
for (const [x, y] of [[455, 480], [560, 400], [625, 400], [455, 560], [700, 560], [140, 450], [930, 450], [260, 870], [700, 870], [860, 650], [1040, 850], [250, 690]]) piece("bush", x, y, 3);
piece("bench", 545, 520, 3);
// ---- bairros novos: mesmas casas (com jardim) em quarteirões de 3, ruas e cercas iguais
const HOUSES = ["h02", "h03", "h05", "h07", "h08", "h09", "h10", "h11", "h12", "h13", "h14", "h15", "h16", "h17", "h18", "h21"];
const LOTS = []; let hk = 0;
function lotPiece(x, y) { const k = HOUSES[hk++ % HOUSES.length]; const m = META[k]; piece(k, x, y, 3); LOTS.push([x + m.w / 2, y + m.h - 8, m.h]); return m; }
const RP = 150;                                              // passo das fileiras
function district(x0, x1, y0, y1) {
  for (let y = y0; y + 130 < y1; y += RP) { roadH(x0, x1, y - 28); hedgeH(x0, x1, y - 50); hedgeH(x0, x1, y + 2);
    let x = x0; let n = 0; while (x < x1 - 150) { if (n % 3 === 0) { roadV(x, y - 28, y + RP - 28); x += 32; hedgeV(x, y + 2, y + 128); x += 22; } const m = lotPiece(x, y + 8); x += m.w + 6; n++; if (n % 7 === 3 && x < x1 - 80) { piece(["tree1", "tree2", "tree3"][n % 3], x, y + 40, 3); x += 50; } } }
}
district(-1500, -60, 60, BH); district(1236, 2700, 60, BH); district(-1500, 2700, BH + 60, BH + 420);
roadV(-60, -10, BH + 420); roadV(1204, -10, BH + 420); roadH(-1500, 2700, BH + 2);
// "sprite" pintado: caixa de clique + posição pra etiqueta
function painted(x, y, h, w = 90) { const el = document.createElement("div"); el.className = "hit"; el.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - h}px;width:${w}px;height:${h}px;z-index:${20000 + Math.round(y)};cursor:pointer`; world.appendChild(el);
  const sp = { el, h, st: { x, y, s: 1 }, set: (st) => { sp.st = { ...sp.st, ...st }; el.style.transform = `translateY(${Math.round(-(sp.st.bob || 0))}px)`; } }; return sp; }
const BUILD = { prefeitura: ["prefeitura", "PREFEITURA", "#ffe27a"], delegacia: ["h06", "DELEGACIA", "#cfe6ff"], escola: ["h04", "ESCOLA", "#fff6d8"], oficina: ["h01", "OFICINA", "#e0e0e0"], padaria: ["h19", "PADARIA", "#fff6d8"], mansao: ["h20", "MANSÃO DO SPEED", "#ffe27a"], floricultura: ["h22", "FLORICULTURA", "#ffd6ea"], biblioteca: ["biblioteca", "BIBLIOTECA", "#fff6d8"], mercado: ["stalls", "FEIRA", "#fff6d8"], lago: ["pond", "LAGO", "#cfe6ff"], lago2: ["pond2", "LAGO DOS PATOS", "#cfe6ff"], parquinho: ["playground", "PARQUINHO", "#fff6d8"], moinho: ["windmill", "MOINHO", "#fff6d8"], estufa: ["greenhouse", "ESTUFA", "#d8ffd8"], coreto: ["gazebo", "CORETO", "#fff6d8"], chafariz: ["fountain", "CHAFARIZ", "#cfe6ff"] };
const B = {}; const bTags = [];
for (const [k, [pk, label, col]] of Object.entries(BUILD)) { const m = META[pk]; const [x0, y0] = m.box; B[k] = painted(x0 + m.w / 2, y0 + m.h - 6, m.h, m.w); bTags.push(tag(label, B[k], 1, col)); }
const CORE_LOTS = HOUSES.map((k) => { const m = META[k]; const [x0, y0] = m.box; return [x0 + m.w / 2, y0 + m.h - 8, m.h]; });
const POINTS = { padaria: [160, 935], escola: [785, 280], delegacia: [830, 170], oficina: [340, 165], floricultura: [1035, 970], prefeitura: [590, 165], palanque: [590, 560], mansao: [390, 940], praca: [590, 540], biblioteca: [770, 705], mercado: [430, 700], lago: [300, 330], parque: [1030, 170], coreto: [450, 450], moinho: [150, 160] };
const trees = [], flowers = [];
const lanterns = []; for (const [x, y] of [[536, 160], [644, 160], [532, 316], [642, 316], [532, 436], [652, 436], [532, 576], [652, 576], [532, 716], [652, 716], [532, 851], [652, 851], [532, 916], [652, 916], [312, 366], [902, 366], [312, 656], [902, 656], [312, 946], [902, 946]]) { const l = dot(16, 16, "rgba(255,200,90,0.35)"); l.pos = [x, y]; lanterns.push(l); }
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
  else { const [x, y, h] = ALL[lot % ALL.length]; lot++; hs = painted(x, y, h, 90); door = [x, y + 12]; }
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
  const zoomedOut = cam.s < 0.8;
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
