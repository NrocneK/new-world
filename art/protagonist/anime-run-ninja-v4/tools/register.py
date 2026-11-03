"""Analyze two eight-cel source sheets; pack whole figures without warping."""
from pathlib import Path
from PIL import Image
import json,numpy as np,sys,shutil

root=Path(__file__).resolve().parents[1]
assert len(sys.argv)==3,'Pass the near-support and far-support source sheets.'
measure=[]
def spans(mask):
 d=np.diff(np.r_[False,mask,False].astype(int))
 return list(zip(np.where(d==1)[0].tolist(),np.where(d==-1)[0].tolist()))
for source_index,arg in enumerate(sys.argv[1:]):
 source=Path(arg);im=Image.open(source)
 assert im.mode=='RGBA' and im.size==(1536,1024)
 a=np.array(im.getchannel('A'))
 assert float((a<16).mean())>.65,'Visible background haze remains.'
 for row in range(2):
  mask=a[row*512:(row+1)*512]>180
  runs=spans(np.any(mask,axis=0))
  assert len(runs)==4,'Expected four separated complete figures per row.'
  for left,right in runs:
   yy,xx=np.where(mask[:,left:right]);top,bottom=int(yy.min()),int(yy.max())
   mid=round(top+(bottom-top)*.5)
   bl,br=spans(mask[mid,left:right])[-1]
   body_x=left+(bl+br-1)/2
   hx=np.where(mask[top:top+round((bottom-top)*.20),left:right])[1]
   measure.append({'sourceIndex':source_index,'sourceX':left-2,'sourceY':row*512,
    'sourceWidth':right-left+4,'top':top,'bottom':bottom,'left':left,'right':right-1,
    'bodyOriginX':body_x,'headFrontX':left+int(hx.max())})
 shutil.copyfile(source,root/f'run-source-{source_index+1}.png')

fw,fh,ground=400,512,500
lower=max(3+m['bodyOriginX']-m['left'] for m in measure)
upper=min(fw-4+m['bodyOriginX']-m['right'] for m in measure)
assert lower<=upper,'Complete figures do not fit cells with a common body origin.'
anchor=max(int(np.ceil(lower)),min(180,int(np.floor(upper))))
frames=[]
for i,m in enumerate(measure):
 dx=round(anchor-(m['bodyOriginX']-m['sourceX']));dy=ground-m['bottom']
 assert m['left']-m['sourceX']+dx>0 and m['right']-m['sourceX']+dx<fw-1
 assert m['top']+dy>0 and m['bottom']+dy<fh-1
 frames.append({'index':i,'sourceIndex':m['sourceIndex'],'sourceX':m['sourceX'],
  'sourceY':m['sourceY'],'sourceWidth':m['sourceWidth'],'offsetX':dx,'offsetY':dy,
  'flight':False,'floorGap':0,'registeredHeadTopY':m['top']+dy,
  'registeredHeadFrontX':m['headFrontX']-m['sourceX']+dx})
(root/'registration.json').write_text(json.dumps({'columns':4,'rows':4,
 'frameWidth':fw,'frameHeight':fh,'groundY':ground,'fps':24,
 'origin':'body-midline-and-floor','preserveUpperBodyMotion':True,'frames':frames},indent=2)+'\n')
print('16 complete cels registered; head top y:',[f['registeredHeadTopY'] for f in frames])
