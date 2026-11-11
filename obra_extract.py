#!/usr/bin/env python3
"""Extrai cada objeto da referência (casa por casa) como sprite com alfa: recorta a caixa e apaga a grama por flood fill a partir das bordas."""
import json, sys
from PIL import Image
import numpy as np
from collections import deque
SRC='/Users/bielz1n/Projetos/Biel/raca-do-dia/caramelopolis-pixel/ref/obra-base-clean.png'
im=Image.open(SRC).convert('RGB')
OBJ={
 # casas (x0,y0,x1,y1)
 'h01':(300,60,385,152),'h02':(165,170,295,282),'h03':(355,140,470,272),'h04':(700,160,870,270),'h05':(895,180,1030,282),'h06':(765,55,900,160),
 'h07':(815,290,930,392),'h08':(60,390,170,495),'h09':(235,385,350,495),'h10':(995,410,1130,510),'h11':(850,425,955,515),'h12':(55,535,170,650),
 'h13':(205,530,350,650),'h14':(55,690,180,810),'h15':(345,690,480,820),'h16':(695,710,830,825),'h17':(860,715,975,820),'h18':(1005,715,1120,810),
 'h19':(95,795,230,925),'h20':(305,825,480,930),'h21':(795,840,925,950),'h22':(975,840,1095,960),
 # especiais
 'prefeitura':(505,20,680,160),'windmill':(105,20,195,150),'crops':(195,80,300,172),'pond':(120,290,300,410),'gazebo':(395,300,505,440),'fountain':(545,405,635,520),
 'oak':(760,400,890,520),'biblioteca':(700,575,845,700),'stalls':(330,590,520,690),'pond2':(960,560,1090,680),'greenhouse':(1040,290,1140,400),'playground':(955,80,1110,160),
 'arch':(505,900,675,1010),'cherry':(0,60,80,160),'cherry2':(1100,150,1176,250),'tree1':(380,470,440,545),'tree2':(650,400,705,470),'tree3':(455,540,510,600),
 'lamp':(518,295,548,372),'wall':(660,935,760,1000),'hedgeh':(40,1035,200,1072),'bush':(455,480,500,520),'flowerbed':(640,440,700,475),'bench':(545,520,640,545),
}
def grassish(p):
    r,g,b=p; return g>r+10 and g>b+15 and g>60 and r<150
def key(box):
    c=np.asarray(im.crop(box)).astype(int); H,W,_=c.shape; a=np.full((H,W),255,np.uint8); seen=np.zeros((H,W),bool); q=deque()
    for x in range(W):
        for y in (0,H-1):
            if grassish(c[y,x]): seen[y,x]=1; q.append((y,x))
    for y in range(H):
        for x in (0,W-1):
            if grassish(c[y,x]) and not seen[y,x]: seen[y,x]=1; q.append((y,x))
    while q:
        y,x=q.popleft(); a[y,x]=0
        for ny,nx in ((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
            if 0<=ny<H and 0<=nx<W and not seen[ny,nx] and grassish(c[ny,nx]): seen[ny,nx]=1; q.append((ny,nx))
    out=Image.fromarray(np.dstack([c.astype(np.uint8),a])); return out
meta={}
for k,box in OBJ.items():
    o=key(box); o.save(f'sprites/obra2/{k}.png'); meta[k]={'w':o.size[0],'h':o.size[1],'box':box}
json.dump(meta,open('sprites/obra2/meta.json','w'))
# folha de contato
ks=list(OBJ); cols=9; rows=(len(ks)+cols-1)//cols; sh=Image.new('RGB',(cols*150,rows*150),(90,140,70))
for i,k in enumerate(ks):
    o=Image.open(f'sprites/obra2/{k}.png'); o.thumbnail((140,140)); sh.paste(o,((i%cols)*150+5,(i//cols)*150+5),o)
sh.save('/Users/bielz1n/Projetos/Biel/raca-do-dia/caramelopolis-04/pv/sheet_obra2.png'); print(len(ks),'objetos')
