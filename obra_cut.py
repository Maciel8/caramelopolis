#!/usr/bin/env python3
"""Corta a referência (caramelopolis-pixel/ref/obra-base.png) em: base.png (núcleo), quarteirões reaproveitáveis (bairros novos), ruas em tile.
Também escreve obra_layout.json com casas/prédios do núcleo e os lotes de cada quarteirão (coords = px da imagem base)."""
import json
from PIL import Image
SRC='/Users/bielz1n/Projetos/Biel/raca-do-dia/caramelopolis-pixel/ref/obra-base.png'
im=Image.open(SRC).convert('RGB').crop((0,0,1176,1072))
im.save('sprites/obra/base.png')
# quarteirões: (x0,y0,x1,y1), lotes [(x_pé, y_pé, altura_casa)]
BLOCKS={
 'ra':((40,520,350,662),[(110,645,100),(270,645,100)]),
 'rb':((40,688,500,832),[(110,805,100),(410,815,110)]),
 'rc':((690,700,1130,832),[(760,820,100),(920,815,95),(1070,805,85)]),
 'rf':((40,385,360,502),[(110,490,90),(290,490,95)]),
 'rg':((840,405,1130,522),[(1060,505,85),(900,510,80)]),
 'rh':((150,160,480,290),[(230,275,95),(410,265,115)]),
}
out={'base':[1176,1072],'blocks':{}}
for k,(box,lots) in BLOCKS.items():
    x0,y0,x1,y1=box; im.crop(box).save(f'sprites/obra/{k}.png')
    out['blocks'][k]={'w':x1-x0,'h':y1-y0,'lots':[[x-x0,y-y0,h] for x,y,h in lots]}
# ruas em tile (faixa horizontal e vertical da própria imagem)
im.crop((300,688,500,718)).save('sprites/obra/road_h.png')     # 200x30
im.crop((574,180,610,380)).save('sprites/obra/road_v.png')     # 36x200
im.crop((40,1040,440,1070)).save('sprites/obra/hedge_b.png')   # borda inferior (cerca viva) 400x30
im.crop((0,300,30,600)).save('sprites/obra/hedge_l.png')       # borda esquerda 30x300
# núcleo: casas de moradores (x_pé, y_pé, altura) e prédios (tag)
out['core_lots']=[[230,275,95],[410,265,115],[960,275,85],[870,390,90],[110,490,90],[290,490,95],[1060,505,85],[900,510,80],[110,645,100],[270,645,100],[110,805,100],[410,815,110],[760,820,100],[920,815,95],[1070,805,85],[860,945,95]]
out['buildings']={'prefeitura':[590,150,130,'PREFEITURA'],'delegacia':[830,152,95,'DELEGACIA'],'escola':[760,262,100,'ESCOLA'],'oficina':[330,150,80,'OFICINA'],'padaria':[160,920,115,'PADARIA'],'mansao':[390,925,95,'MANSÃO DO SPEED'],'floricultura':[1035,955,100,'FLORICULTURA'],'biblioteca':[770,690,110,'BIBLIOTECA'],'mercado':[430,668,60,'FEIRA'],'lago':[210,370,70,'LAGO'],'lago2':[1020,650,60,'LAGO DOS PATOS'],'parquinho':[1030,150,70,'PARQUINHO'],'moinho':[150,135,120,'MOINHO'],'estufa':[1090,385,100,'ESTUFA'],'coreto':[450,395,110,'CORETO'],'chafariz':[590,500,90,'CHAFARIZ']}
out['points']={'padaria':[160,935],'escola':[700,275],'delegacia':[830,165],'oficina':[330,165],'floricultura':[1035,970],'prefeitura':[590,165],'palanque':[590,560],'mansao':[390,940],'praca':[590,540],'biblioteca':[770,705],'mercado':[430,690],'lago':[300,330],'parque':[1030,170],'coreto':[450,420],'moinho':[150,160]}
out['roads']={'h':[[40,700,1130]],'v':[[592,150,1000]]}
json.dump(out,open('obra_layout.json','w'),ensure_ascii=False,indent=1); print('ok', {k:v['w'] for k,v in out['blocks'].items()})
