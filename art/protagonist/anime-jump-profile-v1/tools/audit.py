"""Read-only pixel, timing and atlas checks for the two new jump sheets."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

base=Path(__file__).resolve().parents[2]
report={}
cells={}
for folder,name in [('anime-jump-profile-v1','jump'),('anime-air-jump-profile-v1','air-jump')]:
 root=base/folder;meta=json.loads((root/(name+'-sheet.json')).read_text());a=np.array(Image.open(root/meta['image']).convert('RGBA'))
 assert a.shape==(1280,1536,4)
 assert meta['uniformSourceScale']==484/472
 measures=[];cells[name]=[]
 for f in meta['frames']:
  c=a[f['y']:f['y']+640,f['x']:f['x']+384];cells[name].append(c)
  y,x=np.where(c[:,:,3]>180);b=list(map(int,[x.min(),y.min(),x.max(),y.max()]));assert b[0]>=2 and b[2]<382 and b[1]>=2 and b[3]<639,(name,f['index'],b)
  if name=='jump' and f['index'] in [0,1,6,7]:assert abs(b[3]-620)<=1,(f['index'],b)
  if f['index'] not in ([1,6] if name=='jump' else []):assert abs(b[1]-136)<=1,(name,f['index'],b)
  measures.append(dict(index=f['index'],visibleBounds=b,phase=f['phase']))
 durations=[]
 for suffix,multiplier in [('preview',1),('preview-slow',2)]:
  im=Image.open(root/(name+'-'+suffix+'.gif'));total=0
  for i in range(im.n_frames):im.seek(i);total+=im.info.get('duration',0)
  assert total==meta['durationMs']*multiplier,(name,suffix,total)
  durations.append(dict(file=name+'-'+suffix+'.gif',frames=im.n_frames,durationMs=total))
 report[name]=dict(sharedUniformScale=meta['uniformSourceScale'],cels=measures,gifs=durations)
assert np.array_equal(cells['jump'][0],cells['jump'][7])
def premult(c):return c[:,:,:3].astype(float)*c[:,:,3:4]/255
assert np.max(np.abs(premult(cells['air-jump'][0])-premult(cells['jump'][4])))<1.1
assert np.max(np.abs(premult(cells['air-jump'][2])-premult(cells['jump'][2])))<1.1
report['sharedCels']={'jump0=jump7':True,'airJump0=jump4':True,'airJump2=jump2':True}
(base/'anime-jump-profile-v1/pose-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS jump assets: 16 unclipped cels; shared scale; grounded soles; idle/air transition cels; exact GIF durations')
