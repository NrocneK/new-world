"""Register complete spin cels at one fixed drawing scale, around support foot."""
from pathlib import Path
import json,importlib.util
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('landmarks',root.parent/'anime-attack-profile-v4/tools/register.py');lm=importlib.util.module_from_spec(spec);spec.loader.exec_module(lm)
old=root.parent/'anime-attack-profile-v6';guard=np.array(Image.open(old/'guard.png'));yy,xx=np.where(guard[:,:,3]>180);height=int(yy.max()-yy.min()+1)
# Reorder the second source's front and front-right cels to keep turn direction.
order=[('spin-a-source.png',i) for i in range(8)]+[('spin-b-source.png',i) for i in [1,0,2,3,4,5,6,7]]
reg={'policy':'one fixed scale for all16cels; lock planted left support shoe; rigid full-pose placement only','sourceOrder':order,'frames':[]}
for i,(name,sourceIndex) in enumerate(order):
 im=np.array(Image.open(root/name));sw=im.shape[1]//4;sh=im.shape[0]//2;sx=max(0,sourceIndex%4*sw-24);sy=sourceIndex//4*sh;ex=min(im.shape[1],(sourceIndex%4+1)*sw+24);c=im[sy:sy+sh,sx:ex]
 parts=lm.components(c[:,:,3]>180,100);assert parts;b=max(parts,key=lambda p:p['area'])['bounds'];l,t,r,floor=b
 if i==0:scale=height/(floor-t+1)
 box=[max(0,l-2),max(0,t-2),min(c.shape[1],r+3),min(sh,floor+3)]
 rgb=c[:,:,:3].astype(float);mask=(c[:,:,3]>180)&(rgb.mean(2)>100)&(rgb.max(2)-rgb.min(2)<45);mask[:max(0,floor-32)]=False
 shoes=lm.components(mask,16);assert shoes,(i,'no support shoe')
 # Only the lowest shoe supports the body; while both feet are down choose the
 # front/left support shoe. Raised right shoe is outside this floor band.
 shoe=max(shoes,key=lambda p:p['area'] if 2<=i<=13 else p['center'][0]);pivot=shoe['center'][0]
 f={'index':i,'image':name,'sourceIndex':sourceIndex,'sx':sx+box[0],'sy':sy+box[1],'sw':box[2]-box[0],'sh':box[3]-box[1],'scale':scale,'dx':460.5+(box[0]-pivot)*scale,'dy':620-(floor-box[1])*scale,'supportShoe':shoe,'floor':floor}
 assert f['dx']>0 and f['dx']+f['sw']*scale<767 and f['dy']>0 and f['dy']+f['sh']*scale<639,(i,f)
 reg['frames'].append(f)
(root/'registration.json').write_text(json.dumps(reg,indent=2)+'\n');print('16 complete poses; fixed scale',round(scale,4),'support foot anchored at460.5,620')
