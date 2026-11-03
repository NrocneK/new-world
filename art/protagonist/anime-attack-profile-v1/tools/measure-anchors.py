"""Read-only color components locate candidate fist anchors for visual review."""
from pathlib import Path
from PIL import Image
from collections import deque
import numpy as np,json,math

root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'combat-sheet.json').read_text());report={}
def components(mask):
 seen=np.zeros(mask.shape,dtype=bool);out=[]
 for y,x in zip(*np.where(mask)):
  if seen[y,x]:continue
  todo=deque([(int(y),int(x))]);seen[y,x]=True;points=[]
  while todo:
   a,b=todo.pop();points.append((a,b))
   for yy,xx in [(a-1,b),(a+1,b),(a,b-1),(a,b+1)]:
    if 0<=yy<mask.shape[0] and 0<=xx<mask.shape[1] and mask[yy,xx] and not seen[yy,xx]:seen[yy,xx]=True;todo.append((yy,xx))
  if len(points)>=24:
   p=np.array(points);l,t,r,b=int(p[:,1].min()),int(p[:,0].min()),int(p[:,1].max()),int(p[:,0].max())
   if r-l<=80 and b-t<=85:out.append({'bounds':[l,t,r,b],'center':[(l+r)/2,(t+b)/2],'area':len(points)})
 return out
for key,action in manifest['actions'].items():
 a=np.array(Image.open(root/action['image']));i=action['impact']['frameIndex'];f=a[i//4*512:(i//4+1)*512,i%4*512:(i%4+1)*512];rgb=f[:,:,:3].astype(float)
 mask=(f[:,:,3]>180)&(rgb[:,:,0]>150)&(rgb[:,:,1]>85)&(rgb[:,:,0]>rgb[:,:,1]*1.12)&(rgb[:,:,1]>rgb[:,:,2]*1.12)
 if key=='attack4':mask[:390]=False
 else:
  tx,ty=action['impact']['fist'];Y,X=np.indices(mask.shape);mask&=(abs(X-tx)<115)&(abs(Y-ty)<105)
 choices=components(mask);assert choices,(key,'no hand candidate')
 if key=='attack4':pick=max(choices,key=lambda c:c['bounds'][3])
 else:
  tx,ty=action['impact']['fist'];pick=min(choices,key=lambda c:(c['center'][0]-tx)**2+(c['center'][1]-ty)**2)
 action['impact']['fist']=pick['center'];action['impact']['anchorMethod']='skin component, manually checked'
 if key=='attack4':action['impact']['ground']=[pick['center'][0],500];action['impact']['radialDegrees']=360
 if key=='attack3':action['impact']['vfxRoot']=[105,500]
 report[key]=pick

vfx_root=Path('site/art/vfx/air-pressure-v2');vfx=json.loads((vfx_root/'manifest.json').read_text());a=vfx['actions']['attack3'];f=a['frames'][3]
im=np.array(Image.open(vfx_root/a['image']));alpha=im[f['y']:f['y']+f['h'],f['x']:f['x']+f['w'],3];ys,xs=np.where(alpha>64)
top=int(ys.min());top_x=float(np.median(xs[ys<=top+8]));hit=manifest['actions']['attack3']['impact']
hit['vfxReferenceRise']=f['anchorY']-top;hit['vfxReferenceTopY']=top
sv=[top_x-f['anchorX'],top-f['anchorY']];tv=[hit['fist'][0]-105,hit['fist'][1]-500]
hit['vfxScale']=math.hypot(*tv)/math.hypot(*sv)
hit['vfxRotationRad']=math.atan2(tv[1],tv[0])-math.atan2(sv[1],sv[0])
hit['vfxSourceVector']=sv;hit['vfxTargetVector']=tv
manifest['actions']['attack4']['impact']['vfxScale']=1.1
(root/'combat-sheet.json').write_text(json.dumps(manifest,indent=2)+'\n')
(root/'anchor-inspection.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report));print('Uppercut visible source rise:',f['anchorY']-top)
