"""Read whole figures; anchor the rear shoe and shoe soles, not the punch fist."""
from pathlib import Path
from PIL import Image
import numpy as np,json,sys,shutil

root=Path(__file__).resolve().parents[1]
key,source=sys.argv[1],Path(sys.argv[2]);plan=json.loads((root/'combat-plan.json').read_text())['actions'][key]
im=Image.open(source);assert im.mode=='RGBA' and im.size==(1536,1024)
A=np.array(im);alpha=A[:,:,3];assert float((alpha<16).mean())>.65
def spans(mask):
 d=np.diff(np.r_[False,mask,False].astype(int));return list(zip(np.where(d==1)[0].tolist(),np.where(d==-1)[0].tolist()))
def merge(runs,gap=10):
 out=[]
 for l,r in runs:
  if out and l-out[-1][1]<=gap:out[-1][1]=r
  else:out.append([l,r])
 return [p for p in out if p[1]-p[0]>=12]
frames=[]
# Uniformly normalize each complete action to the approved idle's 484px
# standing height. No articulated limb edits, rotations or palette processing.
first_mask=(alpha[512:,1152:]>180) if key=='attack4' else (alpha[:512,:384]>180)
first_ys=np.where(first_mask)[0]
uniform_scale=484/(int(first_ys.max())-int(first_ys.min())+1)
for row in range(2):
 rgb=A[row*512:(row+1)*512,:,:3].astype(int);mask=alpha[row*512:(row+1)*512]>180
 runs=spans(mask.any(axis=0));assert len(runs)==4,(key,row,runs)
 for left,right in runs:
  yy,xx=np.where(mask[:,left:right]);top,bottom=int(yy.min()),int(yy.max())
  band_start=max(top,bottom-38);colors=rgb[band_start:bottom+1,left:right]
  neutral=(colors.max(axis=2)>95)&(colors.max(axis=2)-colors.min(axis=2)<50)&mask[band_start:bottom+1,left:right]
  shoe_runs=merge(spans(neutral.any(axis=0)))
  assert len(shoe_runs)>=2,(key,len(frames),'cannot identify both shoes',shoe_runs)
  shoes=[[left+l,left+r] for l,r in [shoe_runs[0],shoe_runs[-1]]]
  rear_center=(shoes[0][0]+shoes[0][1]-1)/2
  bottoms=[]
  for l,r in shoes:
   yl,xl=np.where(mask[max(top,bottom-55):bottom+1,max(left,l-7):min(right,r+7)])
   bottoms.append(max(top,bottom-55)+int(yl.max()))
  shoe_floor=max(bottoms);sx0=left-3
  assert max(bottoms)-min(bottoms)<=3,(key,len(frames),'floating shoe',bottoms)
  dx=105-(rear_center-sx0)*uniform_scale;dy=620-shoe_floor*uniform_scale
  assert (left-sx0)*uniform_scale+dx>0 and (right-1-sx0)*uniform_scale+dx<511,(key,len(frames),'horizontal clipping')
  assert top*uniform_scale+dy>=0 and bottom*uniform_scale+dy<640,(key,len(frames),'vertical clipping',top,bottom,dy)
  i=len(frames);frames.append({'index':i,'sourceX':sx0,'sourceY':row*512,'sourceWidth':right-left+6,
    'offsetX':dx,'offsetY':dy,'uniformScale':uniform_scale,'registeredTopY':top*uniform_scale+dy,'registeredBottomY':bottom*uniform_scale+dy,
    'sourceShoes':shoes,'sourceShoeContactY':bottoms,'rearShoeCenterX':rear_center,'shoeFloorY':shoe_floor,
    'durationMs':plan['duration'][i]})
shutil.copyfile(source,root/(key+'-source.png')) if source.resolve()!=(root/(key+'-source.png')).resolve() else None
(root/(key+'-registration.json')).write_text(json.dumps({'action':key,'columns':4,'rows':2,
 'frameWidth':512,'frameHeight':640,'groundY':620,'rearFootX':105,'durationMs':plan['durationMs'],
 'impactFrame':plan['impactFrame'],'frames':frames},indent=2)+'\n')
print(key,'registered',[(f['rearShoeCenterX'],f['shoeFloorY']) for f in frames])
