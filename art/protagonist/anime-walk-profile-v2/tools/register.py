"""Measure silhouettes and choose rigid cel origins. Does not edit artwork."""
from pathlib import Path
from PIL import Image
import json, numpy as np, sys, shutil

root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1])
im=Image.open(source)
assert im.mode=='RGBA'
w,h=im.size;assert w%4==0 and h%2==0
alpha=np.array(im.getchannel('A'))
assert float((alpha<16).mean())>.75,'The generated sheet still has visible background haze.'
fw,fh=w//4,h//2
frames=[]
for i in range(8):
 x=i%4*fw;y=i//4*fh;mask=alpha[y:y+fh,x:x+fw]
 yy,xx=np.where(mask>180)
 assert len(xx)>1000
 top,bottom=int(yy.min()),int(yy.max())
 head=mask[top:top+round((bottom-top)*.17)]
 hy,hx=np.where(head>180)
 head_x=round((int(hx.min())+int(hx.max()))/2)
 dx=round(fw*.535)-head_x;dy=round(fh*.9375)-bottom
 assert int(xx.min())+dx>0 and int(xx.max())+dx<fw-1
 assert top+dy>0 and bottom+dy<fh-1
 frames.append({'index':i,'sourceX':x,'sourceY':y,'offsetX':dx,'offsetY':dy,'headAnchorX':head_x,'footBaselineY':bottom})
shutil.copyfile(source,root/'walk-source.png')
(root/'registration.json').write_text(json.dumps({'columns':4,'rows':2,'frameWidth':fw,'frameHeight':fh,'frames':frames},indent=2)+'\n')
print('Measured 8 complete cels with transparent background:',im.size)
print('Registration offsets:',[(f['offsetX'],f['offsetY']) for f in frames])
