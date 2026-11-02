"""Measure complete grounded ninja cels and choose stable packing origins."""
from pathlib import Path
from PIL import Image
import json, numpy as np, sys, shutil

root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]);im=Image.open(source)
assert im.mode=='RGBA'
w,h=im.size;assert w%4==0 and h%2==0
a=np.array(im.getchannel('A'))
assert float((a<16).mean())>.65,'Visible background haze remains.'
fw,fh=w//4,h//2;ground=round(fh*.9375)
measure=[]
for i in range(8):
 x=i%4*fw;y=i//4*fh;mask=a[y:y+fh,x:x+fw]
 yy,xx=np.where(mask>180);assert len(xx)>1000
 top,bottom=int(yy.min()),int(yy.max())
 head=mask[top:top+round((bottom-top)*.20)]
 hy,hx=np.where(head>180)
 measure.append({'sourceX':x,'sourceY':y,'top':top,'bottom':bottom,'left':int(xx.min()),'right':int(xx.max()),'headFrontX':int(hx.max())})
lower=max(m['headFrontX']-m['left']+3 for m in measure)
upper=min(m['headFrontX']+fw-4-m['right'] for m in measure)
assert lower<=upper,'No common horizontal anchor fits all full cels.'
anchor=max(lower,min(round(fw*.75),upper))
print('Shared head anchor:',anchor)
frames=[]
for i,m in enumerate(measure):
 flight=False
 dx=anchor-m['headFrontX']
 dy=ground-m['bottom']
 assert m['left']+dx>0 and m['right']+dx<fw-1
 assert m['top']+dy>0 and m['bottom']+dy<fh-1
 gap=ground-(m['bottom']+dy)
 frames.append({'index':i,'sourceX':m['sourceX'],'sourceY':m['sourceY'],'offsetX':dx,'offsetY':dy,'flight':flight,'floorGap':gap,'headFrontX':m['headFrontX']})
shutil.copyfile(source,root/'run-source.png')
(root/'registration.json').write_text(json.dumps({'columns':4,'rows':2,'frameWidth':fw,'frameHeight':fh,'groundY':ground,'fps':12,'frames':frames},indent=2)+'\n')
print('Registered eight run cels:',im.size)
print('Support clearances:',[f['floorGap'] for f in frames])
print('Offsets:',[(f['offsetX'],f['offsetY']) for f in frames])
