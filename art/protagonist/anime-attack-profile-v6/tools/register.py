"""One drawing scale per atlas; rigid whole-figure crop/translation only."""
from pathlib import Path
import json,importlib.util
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1];repo=root.parents[2]
spec=importlib.util.spec_from_file_location('landmarks',repo/'art/protagonist/anime-attack-profile-v4/tools/register.py');lm=importlib.util.module_from_spec(spec);spec.loader.exec_module(lm)
guard=np.array(Image.open(repo/'art/protagonist/anime-attack-profile-v5/guard.png'));yy,xx=np.where(guard[:,:,3]>180);target_height=int(yy.max()-yy.min()+1)
reg={'policy':'One atlas scale calibrated to reference guard, fixed for every pose; whole-figure crop and translation only','sources':{}}
for key in ['kick1','kick2','kick3']:
 a=np.array(Image.open(root/f'{key}-source.png'));sw=a.shape[1]//4;sh=a.shape[0]//2;frames=[]
 # Connected full figure bounds allow a long kick to use adjacent transparent
 # gutter without cutting off the toe at an artificial grid boundary.
 for i in range(8):
  sx=max(0,i%4*sw-24);sy=i//4*sh;ex=min(a.shape[1],(i%4+1)*sw+24);c=a[sy:sy+sh,sx:ex];parts=lm.components(c[:,:,3]>180,100);assert parts
  b=max(parts,key=lambda p:p['area'])['bounds'];l,t,r,bottom=b
  # Keep antialiasing around the main connected figure, without changing pixels.
  box=[max(0,l-2),max(0,t-2),min(c.shape[1],r+3),min(sh,bottom+3)]
  if i==0:
   scale=target_height/(bottom-t+1);face=lm.face(c);baseX=399.5-(sx-i%4*sw+face['center'][0])*scale
  localLeft=sx-i%4*sw+box[0];floor=bottom
  f={'index':i,'image':f'{key}-source.png','sx':sx+box[0],'sy':sy+box[1],'sw':box[2]-box[0],'sh':box[3]-box[1],'dx':baseX+localLeft*scale,'dy':620-(floor-box[1])*scale,'scale':scale,'sourceFloor':floor,'bounds':box,'cellOrigin':[i%4*sw,sy]}
  assert f['dx']>0 and f['dx']+f['sw']*scale<767 and f['dy']>0 and f['dy']+f['sh']*scale<639,(key,i,f)
  frames.append(f)
 reg['sources'][key]=frames;print(key,'fixed scale',round(scale,4),'canvas bounds valid for8 cels')
(root/'registration.json').write_text(json.dumps(reg,indent=2)+'\n')
