"""Read-only cel/scale/anchor/GIF checks for both new dash actions."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

base=Path(__file__).resolve().parents[2]
report={}
for folder,name in [('anime-dash-profile-v1','dash'),('anime-air-dash-profile-v1','air-dash')]:
 root=base/folder
 meta=json.loads((root/(name+'-sheet.json')).read_text())
 reg=json.loads((root/'registration.json').read_text())
 atlas=np.array(Image.open(root/(name+'-sheet.png')).convert('RGBA'))
 assert atlas.shape==(1280,2560,4)
 assert meta['durationMs']==sum(f['durationMs'] for f in reg['frames'])==400
 assert len(meta['frames'])==8
 assert {f['scale'] for f in reg['frames']}=={484/450}
 cels=[]
 for f,r in zip(meta['frames'],reg['frames']):
  cel=atlas[f['y']:f['y']+640,f['x']:f['x']+640]
  y,x=np.where(cel[:,:,3]>180);bounds=list(map(int,[x.min(),y.min(),x.max(),y.max()]))
  assert bounds[0]>1 and bounds[1]>1 and bounds[2]<638 and bounds[3]<639,(name,f['index'],bounds)
  assert np.array_equal(cel,np.array(Image.open(root/('cels/frame-%02d.png'%f['index'])).convert('RGBA')))
  if name=='dash':assert abs(bounds[3]-620)<=1,(f['index'],bounds)
  if r.get('copyFromAtlas'):
   original=np.array(Image.open(root/r['copyFromAtlas']).convert('RGBA'));sx,sy,w,h=r['copyCell'];dx,dy=r['copyOffset']
   assert np.array_equal(cel[dy:dy+h,dx:dx+w],original[sy:sy+h,sx:sx+w]),f['index']
  cels.append(dict(index=f['index'],phase=f['phase'],bounds=bounds))
 # Air burst must visibly flatten/extend relative to the upright entry.
 if name=='air-dash':
  entry=cels[0]['bounds'];burst=cels[3]['bounds']
  assert (burst[2]-burst[0])/(burst[3]-burst[1])>1.5
  assert (burst[2]-burst[0])>2*(entry[2]-entry[0])
 gifs=[]
 for suffix,multiple in [('preview',1),('preview-slow',2)]:
  image=Image.open(root/(name+'-'+suffix+'.gif'));duration=0
  for i in range(image.n_frames):image.seek(i);duration+=image.info.get('duration',0)
  assert duration==400*multiple
  gifs.append(dict(file=name+'-'+suffix+'.gif',durationMs=duration))
 report[name]=dict(uniformScale=reg['uniformScale'],cels=cels,gifs=gifs)
(base/'anime-dash-profile-v1/pose-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS dash art: 16 unclipped cels; shared whole-figure scale; grounded soles; pixel-identical idle/air entry; horizontal air silhouette; exact 400/800ms GIFs')
