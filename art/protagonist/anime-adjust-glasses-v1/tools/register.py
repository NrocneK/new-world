"""Measure whole gesture cels; register planted feet without deforming artwork."""
from pathlib import Path
from PIL import Image
import json,numpy as np,sys,shutil

root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]);im=Image.open(source)
assert im.mode=='RGBA' and im.size==(1536,1024)
a=np.array(im.getchannel('A'));assert float((a<16).mean())>.65
fw,fh,ground=384,512,500
def spans(mask):
 d=np.diff(np.r_[False,mask,False].astype(int))
 return list(zip(np.where(d==1)[0].tolist(),np.where(d==-1)[0].tolist()))
timings=[100,140,140,160,240,160,180,240]
phases=['rest','lift','approach','touch-rim','adjust','release','lower','rest']
eyes=['open']*8
frames=[]
for row in range(2):
 mask=a[row*fh:(row+1)*fh]>180;runs=spans(np.any(mask,axis=0))
 assert len(runs)==4,'Need four separate whole figures per source row.'
 for left,right in runs:
  yy,xx=np.where(mask[:,left:right]);top,bottom=int(yy.min()),int(yy.max())
  sy,sx=np.where(mask[max(top,bottom-16):bottom+1,left:right])
  foot_width=int(sx.max()-sx.min()+1)
  sx0=left-3;width=right-left+6
  # Anchor the integer left edge of the foot span, avoiding half-pixel rounding
  # that can move an otherwise identical even-width shoe pair by one pixel.
  dx=(fw-foot_width)//2-(left+int(sx.min())-sx0);dy=ground-bottom
  assert left-sx0+dx>0 and right-1-sx0+dx<fw-1
  assert top+dy>0 and bottom+dy<fh-1
  i=len(frames)
  frames.append({'index':i,'sourceX':sx0,'sourceY':row*fh,'sourceWidth':width,
   'offsetX':dx,'offsetY':dy,'registeredHeadTopY':top+dy,
   'footSpanWidth':foot_width,'durationMs':timings[i],
   'phase':phases[i],'eyes':eyes[i]})
shutil.copyfile(source,root/'gesture-source.png')
(root/'registration.json').write_text(json.dumps({'columns':4,'rows':2,
 'frameWidth':fw,'frameHeight':fh,'groundY':ground,'durationMs':sum(timings),'loop':False,
 'registration':'planted-foot-center-and-floor','frames':frames},indent=2)+'\n')
print('8 separate gesture cels registered. Foot widths:',[f['footSpanWidth'] for f in frames])
print('Head top y:',[f['registeredHeadTopY'] for f in frames])
