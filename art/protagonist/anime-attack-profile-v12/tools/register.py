"""Register one corrected lowered pose, reused at left01 and left07.

Only whole-figure uniform scale/rigid translation. Existing other cels are reused.
"""
from pathlib import Path
import json,importlib.util
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1];prior=root.parent/'anime-attack-profile-v11'
spec=importlib.util.spec_from_file_location('landmarks',root.parent/'anime-attack-profile-v4/tools/register.py');lm=importlib.util.module_from_spec(spec);spec.loader.exec_module(lm)
m=json.loads((prior/'combat-sheet.json').read_text())
def bounds(c):return max(lm.components(c[:,:,3]>180,100),key=lambda p:p['area'])['bounds']
def contact(c,b):
 l,t,r,floor=b;_,x=np.where(c[floor-2:floor+1,l:r+1,3]>180);return l+(int(x.min())+int(x.max()))/2
f=m['actions']['kick2']['frames'][6];old=np.array(Image.open(prior/'kick2-sheet.png'))[f['y']:f['y']+640,f['x']:f['x']+768]
a=np.array(Image.open(root/'kick2-lower-source.png'));l,t,r,floor=bounds(a);ob=bounds(old);scale=(ob[3]-ob[1]+1)/(floor-t+1);cx=contact(a,[l,t,r,floor]);tx=contact(old,ob)
box=[max(0,l-2),max(0,t-2),min(a.shape[1],r+3),min(a.shape[0],floor+3)]
f={'image':'kick2-lower-source.png','sx':box[0],'sy':box[1],'sw':box[2]-box[0],'sh':box[3]-box[1],'scale':scale,'dx':tx+(box[0]-cx)*scale,'dy':ob[3]-(floor-box[1])*scale,'referenceSupport':[tx,ob[3]]}
reg={'policy':'single corrected far-leg lowered pose; near right support occludes far left thigh; uniform whole-figure scale and rigid translation only','changedFrameIndices':[0,6],'frames':[f],'referenceSupport':m['matchedFrames']['supportPoints']}
(root/'registration.json').write_text(json.dumps(reg,indent=2)+'\n');print('Corrected lower pose registration',f)
