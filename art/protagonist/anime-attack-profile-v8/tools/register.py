"""One fixed scale, full-pose crop and left support-foot placement only."""
from pathlib import Path
import json,importlib.util
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('landmarks',root.parent/'anime-attack-profile-v4/tools/register.py');lm=importlib.util.module_from_spec(spec);spec.loader.exec_module(lm)
guard=np.array(Image.open(root.parent/'anime-attack-profile-v7/guard.png'));yy,xx=np.where(guard[:,:,3]>180);height=int(yy.max()-yy.min()+1)
im=np.array(Image.open(root/'kick1-source.png'));sw=im.shape[1]//4;sh=im.shape[0]//2
reg={'policy':'one fixed scale for all8 poses; planted left shoe anchored; no limb deformation or per-frame zoom','frames':[]}
for i in range(8):
 sx=max(0,i%4*sw-24);sy=i//4*sh;ex=min(im.shape[1],(i%4+1)*sw+24);c=im[sy:sy+sh,sx:ex]
 parts=lm.components(c[:,:,3]>180,100);assert parts;l,t,r,floor=max(parts,key=lambda p:p['area'])['bounds']
 if i==0:scale=height/(floor-t+1)
 box=[max(0,l-2),max(0,t-2),min(c.shape[1],r+3),min(sh,floor+3)]
 rgb=c[:,:,:3].astype(float);mask=(c[:,:,3]>180)&(rgb.mean(2)>100)&(rgb.max(2)-rgb.min(2)<45);mask[:max(0,floor-32)]=False
 shoes=lm.components(mask,16);assert shoes
 shoe=max(shoes,key=lambda p:p['center'][0] if i in [0,7] else p['area']);pivot=shoe['center'][0]
 f={'index':i,'image':'kick1-source.png','sx':sx+box[0],'sy':sy+box[1],'sw':box[2]-box[0],'sh':box[3]-box[1],'scale':scale,'dx':460.5+(box[0]-pivot)*scale,'dy':620-(floor-box[1])*scale,'supportShoe':shoe,'sourceFloor':floor}
 assert f['dx']>0 and f['dx']+f['sw']*scale<767 and f['dy']>0 and f['dy']+f['sh']*scale<639,(i,f)
 reg['frames'].append(f)
(root/'registration.json').write_text(json.dumps(reg,indent=2)+'\n');print('8 complete front-kick poses; fixed scale',round(scale,4))
