"""Analyze complete cels between clear gutters; retain drawn upper-body bob.

No pixel editing or deformation. The editor shifted some complete figures across
nominal source columns, so do not clip at those fixed column boundaries.
"""
from pathlib import Path
from PIL import Image
import json, numpy as np, sys, shutil

root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]);im=Image.open(source)
assert im.mode=='RGBA'
w,h=im.size;assert w%4==0 and h%2==0
a=np.array(im.getchannel('A'))
assert float((a<16).mean())>.65,'Visible background haze remains.'
fw,fh=448,h//2;ground=round(fh*.9765625)
body_anchors=json.loads((root/'body-anchors.json').read_text())['sourceX']
assert len(body_anchors)==8
def spans(mask):
 d=np.diff(np.r_[False,mask,False].astype(int))
 return list(zip(np.where(d==1)[0].tolist(),np.where(d==-1)[0].tolist()))

measure=[]
for row in range(2):
 mask=a[row*fh:(row+1)*fh]>180
 runs=spans(np.any(mask,axis=0))
 assert len(runs)==4,'Expected four silhouettes separated by clear gutters.'
 for left,right in runs:
  yy,xx=np.where(mask[:,left:right]);top,bottom=int(yy.min()),int(yy.max())
  # Read the pelvis center from the inspected source, so raised knees do not
  # become accidental registration anchors. Preserve the drawn shoulder/head.
  body_x=body_anchors[len(measure)]
  hx=np.where(mask[top:top+round((bottom-top)*.20),left:right])[1]
  measure.append({'sourceX':left-2,'sourceY':row*fh,'sourceWidth':right-left+4,
   'top':top,'bottom':bottom,'left':left,'right':right-1,
   'bodyOriginX':body_x,'headFrontX':left+int(hx.max())})

lower=max(3+m['bodyOriginX']-m['left'] for m in measure)
upper=min(fw-4+m['bodyOriginX']-m['right'] for m in measure)
assert lower<=upper,'Complete figures do not fit the target cells.'
anchor=max(int(np.ceil(lower)),min(200,int(np.floor(upper))))
frames=[]
for i,m in enumerate(measure):
 dx=round(anchor-(m['bodyOriginX']-m['sourceX']))
 dy=ground-m['bottom']
 assert m['left']-m['sourceX']+dx>0 and m['right']-m['sourceX']+dx<fw-1
 assert m['top']+dy>0 and m['bottom']+dy<fh-1
 frames.append({'index':i,'sourceX':m['sourceX'],'sourceY':m['sourceY'],
  'sourceWidth':m['sourceWidth'],'offsetX':dx,'offsetY':dy,'flight':False,'floorGap':0,
  'bodyOriginX':m['bodyOriginX']-m['sourceX'],
  'registeredHeadFrontX':m['headFrontX']-m['sourceX']+dx,
  'registeredHeadTopY':m['top']+dy})
shutil.copyfile(source,root/'run-source.png')
(root/'registration.json').write_text(json.dumps({'columns':4,'rows':2,
 'frameWidth':fw,'frameHeight':fh,'groundY':ground,'fps':16,
 'preserveUpperBodyMotion':True,'origin':'manual-pelvis-and-floor','frames':frames},indent=2)+'\n')
print('Registered eight complete figures without source-column clipping.')
print('Head top y:',[f['registeredHeadTopY'] for f in frames])
print('Floor gaps:',[f['floorGap'] for f in frames])
