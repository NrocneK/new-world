"""One shared pose scale; register each left pose to corresponding RIGHT support."""
from pathlib import Path
import json,importlib.util
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1];prior=root.parent/'anime-attack-profile-v10'
spec=importlib.util.spec_from_file_location('landmarks',root.parent/'anime-attack-profile-v4/tools/register.py');lm=importlib.util.module_from_spec(spec);spec.loader.exec_module(lm)
m=json.loads((prior/'combat-sheet.json').read_text());right=np.array(Image.open(prior/'kick1-sheet.png'))
def ref(i):
 f=m['actions']['kick1']['frames'][i];return right[f['y']:f['y']+640,f['x']:f['x']+768]
def bounds(c):
 cs=lm.components(c[:,:,3]>180,100);assert cs;return max(cs,key=lambda p:p['area'])['bounds']
def support(c,b):
 l,t,r,floor=b;mask=c[:,:,3]>180;ys,xs=np.where(mask[max(0,floor-2):floor+1,l:r+1]);assert len(xs);return l+(int(xs.min())+int(xs.max()))/2
im=np.array(Image.open(root/'kick2-source.png'));sw=im.shape[1]//4;sh=im.shape[0]//2;cells=[]
for i in range(8):
 sx=max(0,i%4*sw-24);sy=i//4*sh;ex=min(im.shape[1],(i%4+1)*sw+24);c=im[sy:sy+sh,sx:ex];cells.append((sx,sy,c,bounds(c)))
# A SINGLE scale calibrated using the same coiled pose, not a different stance.
rb=bounds(ref(2));sb=cells[2][3];scale=(rb[3]-rb[1]+1)/(sb[3]-sb[1]+1)
sourceOrder=[6,2,2,3,4,2,6];referenceOrder=[6,2,2,3,4,5,6]
reg={'policy':'one fixed scale; world support measured from corresponding right pose; never from raised attacking shoe','scale':scale,'sourceOrder':sourceOrder,'referenceOrder':referenceOrder,'frames':[],'referenceSupport':{}}
for j in range(2,8):
 b=bounds(ref(j));reg['referenceSupport'][str(j)]=[support(ref(j),b),b[3]]
for i,(src,ri) in enumerate(zip(sourceOrder,referenceOrder)):
 sx,sy,c,(l,t,r,floor)=cells[src];target=ref(ri);tb=bounds(target);contact=support(c,[l,t,r,floor]);targetX=support(target,tb)
 box=[max(0,l-2),max(0,t-2),min(c.shape[1],r+3),min(sh,floor+3)]
 f={'index':i,'sourceIndex':src,'referenceFrameIndex':ri,'image':'kick2-source.png','sx':sx+box[0],'sy':sy+box[1],'sw':box[2]-box[0],'sh':box[3]-box[1],'scale':scale,'dx':targetX+(box[0]-contact)*scale,'dy':tb[3]-(floor-box[1])*scale,'referenceSupport':[targetX,tb[3]]}
 assert f['dx']>0 and f['dx']+f['sw']*scale<767 and f['dy']>0 and f['dy']+f['sh']*scale<639,(i,f)
 reg['frames'].append(f)
(root/'registration.json').write_text(json.dumps(reg,indent=2)+'\n');print('Fixed scale',round(scale,4),'coiled pose matched; RIGHT support references',reg['referenceSupport'])
