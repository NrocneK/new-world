"""Measure complete generated cels. Packing uses one scale for both actions."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

base=Path(__file__).resolve().parents[2]
scale=484/472  # approved idle crown-to-sole distance / generated standing distance
for action,folder,source,times,phases in [
 ('jump','anime-jump-profile-v1','jump-source.png',[60,90,100,200,150,300,100,100],
  ['ready','anticipation','takeoff','rise','apex','fall','landing','recovery']),
 ('airJump','anime-air-jump-profile-v1','air-jump-source.png',[50,50,90,160,120,150,150,130],
  ['air-tuck','air-coil','air-push','second-rise','second-apex','second-fall','fall','prepare-landing']),
]:
 root=base/folder;im=np.array(Image.open(root/source).convert('RGBA'));assert im.shape==(1024,1536,4)
 assert (im[:,:,3]<16).mean()>.75
 frames=[]
 for i in range(8):
  c=im[i//4*512:(i//4+1)*512,i%4*384:(i%4+1)*384];rgb=c[:,:,:3].astype(int)
  y,x=np.where(c[:,:,3]>180);left,top,right,bottom=map(int,[x.min(),y.min(),x.max(),y.max()])
  yy,xx=np.indices(c.shape[:2]);hair=(c[:,:,3]>180)&(yy<top+72)&(rgb[:,:,0]>45)&(rgb[:,:,0]<180)&(rgb[:,:,0]>rgb[:,:,1]+9)&(rgb[:,:,1]>rgb[:,:,2]+3)
  lab,n=label(hair);parts=[]
  for j,s in enumerate(find_objects(lab)):
   size=np.count_nonzero(lab[s]==j+1)
   if size>100:parts.append((size,s))
  _,(hy,hx)=max(parts,key=lambda p:p[0]);head_x=(hx.start+hx.stop-1)/2
  if action=='jump' and i in [1,6]:
   fy,fx=np.where(c[bottom-4:bottom+1,:,3]>180);foot_x=(int(fx.min())+int(fx.max()))/2
   dx=192-foot_x*scale;dy=620-bottom*scale;anchor='planted-foot-center'
  else:dx=192-head_x*scale;dy=136-top*scale;anchor='airborne-head-reference'
  frames.append(dict(index=i,sourceX=i%4*384,sourceY=i//4*512,sourceWidth=384,sourceHeight=512,
   scale=scale,dx=dx,dy=dy,bounds=[left,top,right,bottom],headX=head_x,anchor=anchor,
   durationMs=times[i],phase=phases[i]))
 data=dict(action=action,source=source,frameWidth=384,frameHeight=640,columns=4,rows=2,
  anchorX=192,groundY=620,contentTopY=136,uniformScale=scale,frames=frames,
  policy='complete cels only; one uniform scale shared by all 16 drawings; no body-part warps; idle endpoints reused; airJump starts with jump apex')
 (root/'registration.json').write_text(json.dumps(data,indent=2)+'\n')
 print(action,'shared scale',scale,'duration',sum(times))
