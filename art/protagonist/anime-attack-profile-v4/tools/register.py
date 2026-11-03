"""Read-only landmarks plus uniform whole-figure registration; no pixel edits."""
from pathlib import Path
from collections import deque
from PIL import Image
import numpy as np,json,shutil

root=Path(__file__).resolve().parents[1];repo=root.parents[2]
W,H,GROUND=640,640,620

def components(mask,min_area=10):
 seen=np.zeros(mask.shape,bool);out=[]
 for y,x in zip(*np.where(mask)):
  if seen[y,x]:continue
  todo=[(int(y),int(x))];seen[y,x]=True;pts=[]
  while todo:
   yy,xx=todo.pop();pts.append((yy,xx))
   for a,b in [(yy-1,xx),(yy+1,xx),(yy,xx-1),(yy,xx+1)]:
    if 0<=a<mask.shape[0] and 0<=b<mask.shape[1] and mask[a,b] and not seen[a,b]:seen[a,b]=True;todo.append((a,b))
  if len(pts)>=min_area:
   p=np.array(pts);l,t,r,b=int(p[:,1].min()),int(p[:,0].min()),int(p[:,1].max()),int(p[:,0].max());out.append({'bounds':[l,t,r,b],'center':[(l+r)/2,(t+b)/2],'area':len(pts)})
 return out

def hair(a):
 rgb=a[:,:,:3].astype(float);m=(a[:,:,3]>180)&(rgb[:,:,0]>30)&(rgb[:,:,0]<185)&(rgb[:,:,0]>rgb[:,:,1]*1.12)&(rgb[:,:,1]>rgb[:,:,2]*1.05)&(rgb[:,:,2]<135)
 cs=components(m,24);assert cs,'hair not found'
 best=max(cs,key=lambda c:c['area']);l,t,r,b=best['bounds'];pad=max(5,int((r-l)*.12));l=max(0,l-pad);r=min(a.shape[1]-1,r+pad);t=max(0,t-pad);b=min(a.shape[0]-1,b+pad)
 ys,xs=np.where(m[t:b+1,l:r+1]);box=[l+int(xs.min()),t+int(ys.min()),l+int(xs.max()),t+int(ys.max())]
 width=box[2]-box[0]+1;height=box[3]-box[1]+1
 return {'bounds':box,'width':width,'height':height,'metric':float(np.sqrt(width*height))}

def face(a):
 rgb=a[:,:,:3].astype(float);m=(a[:,:,3]>180)&(rgb[:,:,0]>150)&(rgb[:,:,1]>85)&(rgb[:,:,0]>rgb[:,:,1]*1.12)&(rgb[:,:,1]>rgb[:,:,2]*1.12)
 cs=components(m,24);assert cs
 # The face is the largest skin island; hands are smaller separate islands.
 return max(cs,key=lambda c:c['area'])

def spans(mask):
 d=np.diff(np.r_[False,mask,False].astype(int));return list(zip(np.where(d==1)[0],np.where(d==-1)[0]))

def landmarks(a):
 mask=a[:,:,3]>180;ys,xs=np.where(mask);assert len(ys)
 l,t,r,b=int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())
 rgb=a[:,:,:3].astype(float);band=max(t,b-int((b-t)*.17))
 neutral=(rgb[band:b+1].max(2)>95)&((rgb[band:b+1].max(2)-rgb[band:b+1].min(2))<45)&mask[band:b+1]
 runs=[]
 for x0,x1 in spans(neutral.any(0)):
  if runs and x0-runs[-1][1]<=8:runs[-1][1]=int(x1)
  else:runs.append([int(x0),int(x1)])
 runs=[x for x in runs if x[1]-x[0]>=max(8,(r-l)*.025)]
 assert len(runs)>=1,('shoe contact not found',runs)
 shoes=[runs[0],runs[-1]];contacts=[]
 for x0,x1 in shoes:
  yy,xx=np.where(mask[band:b+1,max(l,x0-2):min(r+1,x1+2)]);contacts.append(band+int(yy.max()))
 return {'bounds':[l,t,r,b],'shoes':shoes,'shoeContacts':contacts,'floorY':max(contacts),'rearX':(shoes[0][0]+shoes[0][1]-1)/2,'hair':hair(a),'face':face(a)}

if __name__=='__main__':
 import sys
 config=json.loads((root/'sources.json').read_text())
 guard=np.array(Image.open(repo/'art/protagonist/anime-attack-profile-v3/guard.png'));target=hair(guard);guard_face=face(guard)
 idle=np.array(Image.open(repo/'site/art/protagonist/anime-idle-profile-v1/idle-sheet.png'))[:512,:384]
 idle_face=face(idle);guard_face['center'][0]+=128
 idle_dx=round(guard_face['center'][0]-idle_face['center'][0])
 report={'targetHead':target,'guardFace':guard_face,'idle':{'offsetX':idle_dx,'offsetY':120,'face':idle_face},'sources':{}}
 for key,source in config.items():
  src=Path(source['path']);src=src if src.is_absolute() else root/src;dst=root/source['file']
  if src.resolve()!=dst.resolve():shutil.copyfile(src,dst)
  image=np.array(Image.open(dst));assert image.shape[2]==4
  assert float((image[:,:,3]<16).mean())>.60,(key,'background not transparent')
  rows,cols=source['rows'],source['columns'];sw=image.shape[1]//cols;sh=image.shape[0]//rows;frames=[]
  for i in range(rows*cols):
   cell=image[i//cols*sh:(i//cols+1)*sh,i%cols*sw:(i%cols+1)*sw];lm=landmarks(cell)
   scale=(guard_face['bounds'][2]-guard_face['bounds'][0]+1)/(lm['face']['bounds'][2]-lm['face']['bounds'][0]+1);x0,y0,x1,y1=lm['bounds'];floor=lm['floorY']
   offsets={'hook':[0,-5,8,12,10,6,6,6],'retract':[6,12,38,38,38,60,90,100],'chamber':[38],'impact':[100],'downstroke':[75,100]}
   tx=guard_face['center'][0]+offsets.get(key,[0]*8)[i]
   ox=tx-(lm['face']['center'][0]-x0)*scale;oy=GROUND-(floor-y0)*scale
   if key=='recovery':
    start_face=source.get('startFaceX',guard_face['center'][0]+100);weights=[0,0,.25,.65,1,1,1,1];tx=start_face*(1-weights[i])+guard_face['center'][0]*weights[i];ox=tx-(lm['face']['center'][0]-x0)*scale
   assert (x1-x0+1)*scale+ox<W,(key,i,'horizontal clipping',scale,ox,lm)
   assert ox>=0 and (y1-y0+1)*scale+oy<=H and oy>=0,(key,i,'clipping',scale,ox,oy)
   frames.append({'index':i,'image':source['file'],'sx':i%cols*sw+x0,'sy':i//cols*sh+y0,'sw':x1-x0+1,'sh':y1-y0+1,'dx':ox,'dy':oy,'scale':scale,'landmarks':lm})
  report['sources'][key]=frames
 (root/'registration.json').write_text(json.dumps(report,indent=2)+'\n')
 for key,frames in report['sources'].items():print(key,[(round(f['scale'],3),f['landmarks']['hair']['width'],f['landmarks']['shoeContacts']) for f in frames])
