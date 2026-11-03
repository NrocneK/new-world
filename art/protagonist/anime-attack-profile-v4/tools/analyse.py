"""Read-only art inspection anchors and unchanged VFX fitting."""
from pathlib import Path
import json,math
from PIL import Image
import numpy as np
from register import components
root=Path(__file__).resolve().parents[1];repo=root.parents[2];meta=json.loads((root/'combat-sheet.json').read_text());reg=json.loads((root/'registration.json').read_text());report={}
for key,a in meta['actions'].items():
 image=np.array(Image.open(root/a['image']))
 for f in a['frames']:
  cell=image[f['y']:f['y']+640,f['x']:f['x']+640];rgb=cell[:,:,:3].astype(float)
  skin=(cell[:,:,3]>180)&(rgb[:,:,0]>150)&(rgb[:,:,1]>85)&(rgb[:,:,0]>rgb[:,:,1]*1.12)&(rgb[:,:,1]>rgb[:,:,2]*1.12)
  cs=[c for c in components(skin,24) if c['bounds'][2]-c['bounds'][0]<95 and c['bounds'][3]-c['bounds'][1]<100];assert cs,(key,f['index'])
  i=f['index'];rightmost=(key=='attack2') or (key=='attack1' and 2<=i<=5) or (key=='attack3' and i>=2) or (key=='attack4' and i<=1)
  hand=max(cs,key=lambda c:c['center'][0] if rightmost else c['center'][1]);f['inspectionFist']=hand['center']
  if i==a['impact']['frameIndex']:
   a['impact']['fist']=hand['center'];a['impact']['handBounds']=hand['bounds'];report[key]=hand
hit=meta['actions']['attack4']['impact'];hit['ground']=[hit['fist'][0],620];hit['radialDegrees']=360;hit['vfxScale']=1.2
h=meta['actions']['attack3']['impact'];pose=reg['sources']['hook'][5];lm=pose['landmarks'];rx=pose['dx']+(lm['rearX']-lm['bounds'][0])*pose['scale'];h['vfxRoot']=[rx,620]
fxroot=repo/'site/art/vfx/air-pressure-v2';fx=json.loads((fxroot/'manifest.json').read_text());src=fx['actions']['attack3'];f=src['frames'][3];data=np.array(Image.open(fxroot/src['image']));al=data[f['y']:f['y']+f['h'],f['x']:f['x']+f['w'],3];yy,xx=np.where(al>64);top=int(yy.min());tx=float(np.median(xx[yy<=top+8]));sv=[tx-f['anchorX'],top-f['anchorY']];tv=[h['fist'][0]-rx,h['fist'][1]-620];h['vfxScale']=math.hypot(*tv)/math.hypot(*sv);h['vfxRotationRad']=math.atan2(tv[1],tv[0])-math.atan2(sv[1],sv[0]);h['vfxSourceVector']=sv;h['vfxTargetVector']=tv
meta['effectOverrides']={'attack4':{'image':'ground-impact-source.png','width':1536,'height':1024,'fps':25,'loop':False,'uniformSourceScale':1.2,'opacity':.65,'blendMode':'source-over','filter':'none','attachment':'ground','frames':[{'order':i,'x':i%4*384,'y':i//4*512,'w':384,'h':512,'anchorX':192,'anchorY':422} for i in range(8)]}}
(root/'combat-sheet.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');(root/'inspection.json').write_text(json.dumps(report,indent=2)+'\n');print('Fist anchors:',json.dumps({k:v['center'] for k,v in report.items()}))
