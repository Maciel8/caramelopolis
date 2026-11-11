#!/usr/bin/env python3
"""Layout da cidade nova (obra), compartilhado pelo site (obra.js) e pelo vídeo de transição.
Gera obra_layout.json: grama, ruas (segmentos), cercas, peças (sprites/obra2) ordenadas por profundidade, lotes, prédios, pontos de trabalho.
Coordenadas = px da referência (1176×1072), y pra baixo."""
import json
META = json.load(open("sprites/obra2/meta.json"))
BW, BH = 1176, 1072
L = {"size": [BW, BH], "roads_h": [], "roads_v": [], "hedges_h": [], "hedges_v": [], "pieces": [], "lots": [], "buildings": {}, "plaza": [490, 380, 200, 180]}
def road_h(x0, x1, y): L["roads_h"].append([x0, x1, y])
def road_v(x, y0, y1): L["roads_v"].append([x, y0, y1])
def hedge_h(x0, x1, y): L["hedges_h"].append([x0, x1, y])
def hedge_v(x, y0, y1): L["hedges_v"].append([x, y0, y1])
def piece(k, x, y, kind="decor"): m = META[k]; L["pieces"].append({"k": k, "x": x, "y": y, "w": m["w"], "h": m["h"], "kind": kind}); return m
# ---- núcleo (posições da imagem)
road_v(576, 150, BH + 420)
for y in [288, 500, 690, 822, 985]: road_h(40, 1136, y)
for x in [335, 912, 45, 1130]: road_v(x, 288, 1000)
for y in [288, 500, 690, 822]:
    for x0, x1 in [[70, 320], [372, 560], [620, 900], [950, 1115]]: hedge_h(x0, x1, y - 22); hedge_h(x0, x1, y + 30)
for x in [335, 912]:
    for y0, y1 in [[320, 480], [530, 670], [720, 800], [850, 965]]: hedge_v(x - 22, y0, y1); hedge_v(x + 34, y0, y1)
for y0, y1 in [[180, 270], [320, 380], [560, 670], [720, 800], [850, 900]]: hedge_v(554, y0, y1); hedge_v(608, y0, y1)
hedge_h(0, BW, -2); hedge_v(0, 0, BH); hedge_v(BW - 22, 0, BH)
HOUSES = ["h02", "h03", "h05", "h07", "h08", "h09", "h12", "h13", "h14", "h15", "h16", "h17", "h18", "h21"]   # h10/h11 saem: vira o lote da mansão
BUILD = {"prefeitura": ("prefeitura", "PREFEITURA"), "delegacia": ("h06", "DELEGACIA"), "escola": ("h04", "ESCOLA"), "oficina": ("h01", "OFICINA"), "padaria": ("h19", "PADARIA"), "floricultura": ("h22", "FLORICULTURA"),
         "biblioteca": ("biblioteca", "BIBLIOTECA"), "mercado": ("stalls", "FEIRA"), "lago": ("pond", "LAGO"), "lago2": ("pond2", "LAGO DOS PATOS"), "parquinho": ("playground", "PARQUINHO"), "moinho": ("windmill", "MOINHO"),
         "estufa": ("greenhouse", "ESTUFA"), "coreto": ("gazebo", "CORETO"), "chafariz": ("fountain", "CHAFARIZ"), "horta": ("crops", "HORTA")}
for k in HOUSES:
    m = META[k]; x0, y0 = m["box"][0], m["box"][1]; piece(k, x0, y0, "house"); L["lots"].append([x0 + m["w"] / 2, y0 + m["h"] - 8, m["h"], m["w"]])
for key, (pk, label) in BUILD.items():
    m = META[pk]; x0, y0 = m["box"][0], m["box"][1]; piece(pk, x0, y0, "building"); L["buildings"][key] = {"x": x0 + m["w"] / 2, "y": y0 + m["h"] - 6, "h": m["h"], "w": m["w"], "label": label}
# mansão do Speed no lugar das casas h10/h11 (direita da praça, ao lado do carvalho)
MM = META["mansao2"]; L["buildings"]["mansao"] = {"x": 955 + MM["w"] / 2, "y": 395 + MM["h"] - 6, "h": MM["h"], "w": MM["w"], "label": "MANSÃO DO SPEED"}
L["pieces"].append({"k": "mansao2", "x": 955, "y": 395, "w": MM["w"], "h": MM["h"], "kind": "building"})
piece("arch", 505, 900, "building"); piece("wall_l", 40, 928); piece("wall_r", 675, 928)
for x, y in [[0, 60], [1100, 150], [0, 460], [20, 860], [1100, 330], [1090, 820]]: piece("cherry2" if y > 400 else "cherry", x, y)
TREES = [[380, 470], [650, 400], [455, 540], [60, 160], [300, 300], [470, 60], [690, 60], [920, 300], [660, 760], [250, 760], [560, 790], [700, 860], [960, 1010], [150, 1010], [400, 1010], [300, 220], [470, 230], [880, 230], [740, 310], [1000, 180], [40, 330], [250, 470], [720, 540], [520, 630], [1100, 700], [200, 650], [380, 870], [1120, 920], [20, 560], [1130, 60], [640, 600], [500, 940], [690, 940], [870, 400], [110, 300], [1060, 300], [1130, 420], [1060, 540]]
for i, (x, y) in enumerate(TREES): piece("tree", x - 10, y - 10)
for x, y in [[520, 300], [630, 300], [520, 560], [640, 560], [520, 700], [640, 700], [520, 835], [640, 835], [300, 350], [890, 350], [300, 640], [890, 640], [300, 930], [890, 930]]: piece("lamp", x, y, "lamp")
for x, y in [[420, 480], [640, 440], [520, 480], [560, 540], [620, 540], [740, 480], [240, 540], [330, 740], [980, 740], [120, 700], [1000, 400], [160, 490]]: piece("flowerbed", x, y)
for x, y in [[455, 480], [560, 400], [625, 400], [455, 560], [700, 560], [140, 450], [930, 450], [260, 870], [700, 870], [860, 650], [1040, 850], [250, 690]]: piece("bush2", x, y)
piece("bench", 545, 520)
# ---- bairros: mesmas casas (com jardim), quarteirões de 3, rua e cerca viva, lago/parquinho a cada tanto
RP = 150; hk = 0
def district(x0, x1, y0, y1):
    global hk
    y = y0
    while y + 130 < y1:
        road_h(x0, x1, y - 28); hedge_h(x0, x1, y - 50); hedge_h(x0, x1, y + 2)
        x = x0; n = 0
        while x < x1 - 150:
            if n % 3 == 0: road_v(x, y - 28, y + RP - 28); x += 32; hedge_v(x, y + 2, y + 128); x += 22
            k = HOUSES[hk % len(HOUSES)]; hk += 1; m = META[k]
            if hk % 11 == 5 and x < x1 - 200: m2 = piece("pond2" if hk % 22 == 5 else "playground", x, y + 20); x += m2["w"] + 10; continue
            piece(k, x, y + 8, "house"); L["lots"].append([x + m["w"] / 2, y + 8 + m["h"] - 8, m["h"], m["w"]]); x += m["w"] + 6; n += 1
            if n % 7 == 3 and x < x1 - 80: piece("tree", x, y + 40); x += 60
        y += RP
district(-1500, -60, 60, BH); district(1236, 2700, 60, BH); district(-1500, 2700, BH + 60, BH + 420)
road_v(-60, -10, BH + 420); road_v(1204, -10, BH + 420); road_h(-1500, 2700, BH + 2)
L["points"] = {"padaria": [160, 990], "escola": [785, 290], "delegacia": [830, 290], "oficina": [340, 290], "floricultura": [1035, 990], "prefeitura": [590, 170], "palanque": [590, 560], "mansao": [1040, 505], "praca": [590, 560], "biblioteca": [770, 695], "mercado": [430, 695], "lago": [300, 295], "parque": [1030, 290], "coreto": [450, 505], "moinho": [150, 290]}
# profundidade: peças ordenadas pelo pé
L["pieces"].sort(key=lambda p: p["y"] + p["h"])
json.dump(L, open("obra_layout.json", "w"), ensure_ascii=False)
print(len(L["pieces"]), "peças,", len(L["lots"]), "lotes")
