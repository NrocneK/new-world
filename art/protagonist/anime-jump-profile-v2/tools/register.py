"""Register whole cels; distinguish right takeoff toe from left landing toe."""
from pathlib import Path
import json,numpy as np
from PIL import Image
from scipy.ndimage import label,find_objects
root=Path(__file__).resolve().parents[1]
sources=['jump-ascent-source.png','jump-landing-source.png','jump-contact-correction.png']
images={p:np.array(Image.open(root/p).convert('RGBA')) for p in sources}
a=images[sources[0]][:512,:384];y,x=np.where(a[:,:,3]>180);scale=484/(int(y.max())-int(y.min()))
times=[40,110,60,80,85,85,130,90,100,120,50,60,90,80,70,50]
phases=['ready','right-load-left-knee-rise','right-toe-push-arms-pull','right-leg-long-rising','right-knee-fold-early','right-knee-fold-more','apex-left-knee-high','left-leg-opens-down','left-leg-extends-down','left-ready-right-trails','left-first-contact','left-brakes-right-settles','both-low-compression','stand-up-half','stand-up-settle','idle']
air_head_x={3:234,4:224,5:214,6:205,7:198,8:192,9:185}
frames=[]
for i in range(16):
 source=sources[2] if i==10 else sources[i//8];k=i%8;c=images[source][k//4*512:(k//4+1)*512,k%4*384:(k%4+1)*384];rgb=c[:,:,:3].astype(int);y,x=np.where(c[:,:,3]>180);l,t,r,b=map(int,[x.min(),y.min(),x.max(),y.max()]);yy,xx=np.indices(c.shape[:2]);hair=(c[:,:,3]>180)&(yy<t+72)&(rgb[:,:,0]>45)&(rgb[:,:,0]<180)&(rgb[:,:,0]>rgb[:,:,1]+9)&(rgb[:,:,1]>rgb[:,:,2]+3)
 lab,n=label(hair);parts=[]
 for j,s in enumerate(find_objects(lab)):
  size=np.count_nonzero(lab[s]==j+1)
  if size>100:parts.append((size,s))
 _,(hy,hx)=max(parts,key=lambda p:p[0]);head=(hx.start+hx.stop-1)/2
 if i in [1,2] or 10<=i<=14:
  # A broad sole band includes the front/far shoe even when its sole is a few
  # pixels higher in the original perspective. Never anchor to the rear shoe.
  fy,fx=np.where(c[b-30:b+1,:,3]>180);toe=int(fx.max());target=222 if i<=2 else 235
  dx=target-toe*scale;dy=620-b*scale;anchor='right-toe' if i<=2 else 'left-toe'
 else:toe=None;target=None;dx=air_head_x.get(i,192)-head*scale;dy=136-t*scale;anchor='air-head-reference'
 frames.append(dict(index=i,source=source,sourceX=k%4*384,sourceY=k//4*512,sourceWidth=384,sourceHeight=512,scale=scale,dx=dx,dy=dy,bounds=[l,t,r,b],headX=head,anchor=anchor,sourceToeX=toe,targetToeX=target,durationMs=times[i],phase=phases[i]))
reg=dict(action='jump',sources=sources,frameWidth=384,frameHeight=640,columns=4,rows=4,anchorX=192,groundY=620,contentTopY=136,uniformScale=scale,frames=frames,policy='whole-figure one uniform scale for new cels; no limb warps; fixed right takeoff toe / left landing toe; approved idle endpoints')
(root/'registration.json').write_text(json.dumps(reg,indent=2)+'\n')
air=root.parent/'anime-air-jump-profile-v2';old=json.loads((root.parent/'anime-air-jump-profile-v1/air-jump-sheet.json').read_text());times=[50,50,110,180,160,180,170,200]
for i,f in enumerate(old['frames']):f['durationMs']=times[i]
old.update(action='airJump',sourceAtlas='../anime-air-jump-profile-v1/air-jump-sheet.png',uniformScale=old['uniformSourceScale'])
(air/'registration.json').write_text(json.dumps(old,indent=2)+'\n')
print('Registered16jump cels, shared scale',scale,'jump1300ms / air1100ms')
