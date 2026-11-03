"""Read-only shoe inspection anchors; never edits or rescales a character."""
from pathlib import Path
import importlib.util,json
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('landmarks',root.parent/'anime-attack-profile-v4/tools/register.py')
lm=importlib.util.module_from_spec(spec);spec.loader.exec_module(lm)
m=json.loads((root/'combat-sheet.json').read_text())
for key,a in m['actions'].items():
 if key.startswith('attack'):
  for f in a['frames']:f['inspectionPoint']=f.get('inspectionFist',a['impact']['fist'])
  a['impact']={k:v for k,v in a['impact'].items() if k in ['frameIndex','timeMs','fist','direction']}
  continue
 im=np.array(Image.open(root/a['image']))
 for f in a['frames']:
  c=im[f['y']:f['y']+640,f['x']:f['x']+768];rgb=c[:,:,:3].astype(float)
  mask=(c[:,:,3]>180)&(rgb.mean(2)>140)&(rgb.max(2)-rgb.min(2)<40);mask[:150]=False
  parts=lm.components(mask,18);assert parts
  p=max(parts,key=lambda p:p['center'][0]);f['inspectionPoint']=p['center']
  if f['index']==a['impact']['frameIndex']:
   a['impact']['foot']=p['center'];a['impact']['footBounds']=p['bounds']
(root/'combat-sheet.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('Kick shoe anchors:',{k:m['actions'][k]['impact']['foot'] for k in m['combo']})
