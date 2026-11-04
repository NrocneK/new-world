"""Measure full cels; one source scale shared by ground/air dash drawings."""
from pathlib import Path
import json,numpy as np
from PIL import Image

base=Path(__file__).resolve().parents[2]
ground=np.array(Image.open(base/'anime-dash-profile-v1/dash-source.png').convert('RGBA'))
y,x=np.where(ground[:512,:384,3]>180);scale=484/(int(y.max())-int(y.min()))
for action,folder,file,cols,rows,hips,times,phases in [
 ('dash','anime-dash-profile-v1','dash-source.png',4,2,
  [[185,270],[163,276],[191,264],[191,260],[207,270],[185,270],[170,265],[185,270]],
  [20,40,40,60,60,60,60,60],['ready','load','toe-push','burst','drive','brake','recover','idle']),
 ('airDash','anime-air-dash-profile-v1','air-dash-source.png',2,4,
  [[220,245],[224,230],[260,195],[270,188],[245,195],[246,195],[216,226],[206,233]],
  [30,30,40,70,70,50,60,50],['air-coil','pitch','air-push','horizontal-burst','horizontal-follow','decelerate','air-recover','fall-ready']),
]:
 root=base/folder;a=np.array(Image.open(root/file).convert('RGBA'));fw=a.shape[1]//cols;fh=a.shape[0]//rows
 assert (a[:,:,3]<16).mean()>.75
 frames=[]
 for i in range(8):
  c=a[i//cols*fh:(i//cols+1)*fh,i%cols*fw:(i%cols+1)*fw];y,x=np.where(c[:,:,3]>180);bounds=list(map(int,[x.min(),y.min(),x.max(),y.max()]))
  dx=280-hips[i][0]*scale
  dy=620-bounds[3]*scale if action=='dash' else 360-hips[i][1]*scale
  f=dict(index=i,source=file,sourceX=i%cols*fw,sourceY=i//cols*fh,sourceWidth=fw,sourceHeight=fh,dx=dx,dy=dy,scale=scale,sourceHip=hips[i],bounds=bounds,durationMs=times[i],phase=phases[i])
  if action=='dash' and i in [0,7]:f['copyFromAtlas']='../anime-idle-profile-v1/idle-sheet.png';f['copyCell']=[0,0,384,512];f['copyOffset']=[88,120]
  if action=='airDash' and i==0:f['copyFromAtlas']='../anime-jump-profile-v3/jump-sheet.png';f['copyCell']=[768,640,384,640];f['copyOffset']=[88,0]
  frames.append(f)
 reg=dict(action=action,source=file,frameWidth=640,frameHeight=640,columns=4,rows=2,anchorX=280,groundY=620,contentTopY=136,uniformScale=scale,frames=frames,policy='one whole-figure source scale; ground floor registration, air pelvis registration; no limb warps; approved idle and jump entry reuse')
 (root/'registration.json').write_text(json.dumps(reg,indent=2)+'\n')
 print('Registered',action,'shared scale',scale,'400ms')
