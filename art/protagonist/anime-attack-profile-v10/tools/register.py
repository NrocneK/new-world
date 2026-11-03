"""One atlas scale; rigid whole-pose placement around planted right shoe."""
from pathlib import Path
import json,importlib.util
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1];prior=root.parent/'anime-attack-profile-v9'
spec=importlib.util.spec_from_file_location('landmarks',root.parent/'anime-attack-profile-v4/tools/register.py');lm=importlib.util.module_from_spec(spec);spec.loader.exec_module(lm)
guard=np.array(Image.open(prior/'guard.png'));yy,xx=np.where(guard[:,:,3]>180);height=int(yy.max()-yy.min()+1)
im=np.array(Image.open(root/'kick2-source.png'));sw=im.shape[1]//4;sh=im.shape[0]//2;cells=[]
for i in range(8):
 sx=max(0,i%4*sw-24);sy=i//4*sh;ex=min(im.shape[1],(i%4+1)*sw+24);c=im[sy:sy+sh,sx:ex];parts=lm.components(c[:,:,3]>180,100);assert parts;bounds=max(parts,key=lambda p:p['area'])['bounds'];cells.append((sx,sy,c,bounds))
# Calibrate to the final standing source, not to the bent landing posture.
_,_,reference,bounds=cells[7];scale=height/(bounds[3]-bounds[1]+1)
m=json.loads((prior/'combat-sheet.json').read_text());supportX=m['actions']['kick1']['frames'][6]['inspectionPoint'][0]
reg={'policy':'one atlas scale calibrated to standing pose; rigid full-cel placement; right support fixed until left lands','supportX':supportX,'usedSourceFrames':[1,2,3,4,2,6,7],'frames':[]}
for i,(sx,sy,c,(l,t,r,floor)) in enumerate(cells):
 box=[max(0,l-2),max(0,t-2),min(c.shape[1],r+3),min(sh,floor+3)]
 rgb=c[:,:,:3].astype(float);mask=(c[:,:,3]>180)&(rgb.mean(2)>100)&(rgb.max(2)-rgb.min(2)<45);mask[:max(0,floor-32)]=False
 shoes=lm.components(mask,16);assert shoes;shoe=max(shoes,key=lambda p:p['center'][0] if i in [0,7] else p['area'])
 dx=supportX+(box[0]-shoe['center'][0])*scale
 if i==7:dx=399.5+(box[0]-lm.face(c)['center'][0])*scale
 f={'index':i,'image':'kick2-source.png','sx':sx+box[0],'sy':sy+box[1],'sw':box[2]-box[0],'sh':box[3]-box[1],'scale':scale,'dx':dx,'dy':620-(floor-box[1])*scale,'supportShoe':shoe}
 assert f['dx']>0 and f['dx']+f['sw']*scale<767 and f['dy']>0 and f['dy']+f['sh']*scale<639,(i,f)
 reg['frames'].append(f)
(root/'registration.json').write_text(json.dumps(reg,indent=2)+'\n');print('8 source poses at fixed scale',round(scale,4),'right support',supportX)
