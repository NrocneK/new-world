"""Register eight replacement whole cels; retain v2 takeoff and grounded cels."""
from pathlib import Path
import json,numpy as np
from PIL import Image
from scipy.ndimage import label,find_objects

root=Path(__file__).resolve().parents[1];prior=root.parent/'anime-jump-profile-v2'
a=np.array(Image.open(root/'forward-knee-source.png').convert('RGBA'));assert a.shape==(1024,1536,4)
assert (a[:,:,3]<16).mean()>.75
old=json.loads((prior/'registration.json').read_text());meta=json.loads((prior/'jump-sheet.json').read_text())
first=a[:512,:384];y,x=np.where(first[:,:,3]>180);source_height=int(y.max())-int(y.min())
reference=np.array(Image.open(prior/'jump-sheet.png').convert('RGBA'))[:640,1152:1536];y,x=np.where(reference[:,:,3]>180)
scale=(int(y.max())-int(y.min()))/source_height
phases={3:'right-leg-long-rising',4:'right-knee-forward-early',5:'right-knee-forward-more',6:'apex-right-knee-forward-left-high',7:'left-opens-right-knee-forward',8:'left-extends-right-lowers-forward',9:'left-ready-right-lowers-forward',10:'left-contact-right-forward-off-floor'}
frames=[]
for i,previous in enumerate(meta['frames']):
 f=dict(previous)
 if not 3<=i<=10:
  f['copyFromAtlas']='../anime-jump-profile-v2/jump-sheet.png';frames.append(f);continue
 k=i-3;c=a[k//4*512:(k//4+1)*512,k%4*384:(k%4+1)*384];rgb=c[:,:,:3].astype(int)
 y,x=np.where(c[:,:,3]>180);l,t,r,b=map(int,[x.min(),y.min(),x.max(),y.max()]);iy,ix=np.indices(c.shape[:2])
 hair=(c[:,:,3]>180)&(iy<t+72)&(rgb[:,:,0]>45)&(rgb[:,:,0]<180)&(rgb[:,:,0]>rgb[:,:,1]+9)&(rgb[:,:,1]>rgb[:,:,2]+3)
 lab,n=label(hair);parts=[]
 for j,s in enumerate(find_objects(lab)):
  size=np.count_nonzero(lab[s]==j+1)
  if size>100:parts.append((size,s))
 _,(hy,hx)=max(parts,key=lambda p:p[0]);head=(hx.start+hx.stop-1)/2
 if i==10:
  fy,fx=np.where(c[b-30:b+1,:,3]>180);toe=int(fx.max());dx=235-toe*scale;dy=620-b*scale;anchor='left-toe'
 else:
  target=old['frames'][i]['headX']*old['frames'][i]['scale']+old['frames'][i]['dx'];dx=target-head*scale;dy=136-t*scale;toe=None;anchor='air-head-reference'
 f.update(source='forward-knee-source.png',sourceX=k%4*384,sourceY=k//4*512,scale=scale,dx=dx,dy=dy,bounds=[l,t,r,b],headX=head,anchor=anchor,sourceToeX=toe,phase=phases[i]);frames.append(f)
reg=dict(action='jump',sources=['forward-knee-source.png'],frameWidth=384,frameHeight=640,columns=4,rows=4,anchorX=192,groundY=620,contentTopY=136,uniformScale=scale,frames=frames,changedFrameIndices=list(range(3,11)),policy='redraw whole cels3-10 for forward near-right knee lift; preserve all other cels from v2 byte-for-byte; single scale for the eight new drawings')
(root/'registration.json').write_text(json.dumps(reg,indent=2)+'\n')
print('Registered eight forward-knee cels; common new-source scale',scale)
