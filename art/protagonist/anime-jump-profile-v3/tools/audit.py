"""Check preservation, forward-tuck silhouette, landing and GIF timing."""
from pathlib import Path
import json,numpy as np
from PIL import Image
from scipy.ndimage import label,find_objects

root=Path(__file__).resolve().parents[1];m=json.loads((root/'jump-sheet.json').read_text())
a=np.array(Image.open(root/'jump-sheet.png').convert('RGBA'));old=np.array(Image.open(root.parent/'anime-jump-profile-v2/jump-sheet.png').convert('RGBA'))
assert a.shape==old.shape==(2560,1536,4)
report={'changedFrameIndices':list(range(3,11)),'preservedFrameIndices':[0,1,2,11,12,13,14,15],'cels':[]}
for f in m['frames']:
 i=f['index'];c=a[f['y']:f['y']+640,f['x']:f['x']+384];p=old[f['y']:f['y']+640,f['x']:f['x']+384]
 if i in report['preservedFrameIndices']:assert np.array_equal(c,p),i
 else:assert not np.array_equal(c,p),i
 y,x=np.where(c[:,:,3]>180);b=list(map(int,[x.min(),y.min(),x.max(),y.max()]));assert b[0]>=2 and b[2]<382 and b[1]>=2 and b[3]<639,(i,b)
 yy,xx=np.indices(c.shape[:2]);rear=int(((c[:,:,3]>180)&(yy>=420)&(xx<180)).sum())
 # These regions contain the old heel-back curl, but must be empty at the
 # forward-tuck apex and adjacent cels. This measures artwork, not labels.
 if i in [5,6,7,8]:assert rear==0,(i,rear)
 shoes=[];rgb=c[:,:,:3].astype(int);mask=(c[:,:,3]>180)&(rgb.max(2)-rgb.min(2)<45)&(rgb.max(2)>100)&(yy>350);lab,n=label(mask)
 for j,s in enumerate(find_objects(lab)):
  sy,sx=s;size=np.count_nonzero(lab[s]==j+1)
  if size>80 and sx.stop-sx.start>12 and sy.stop-sy.start>9:shoes.append((int(size),[sx.start,sy.start,sx.stop-1,sy.stop-1]))
 shoes.sort(reverse=True)
 if i==6:
  assert len(shoes)>=2
  assert all(v[1][0]>200 for v in shoes[:2]),shoes
 if i==10:
  assert abs(b[3]-620)<=1
  assert any(v[1][3]<590 and v[1][0]>190 for v in shoes),shoes
 report['cels'].append(dict(index=i,phase=f['phase'],bounds=b,rearPixelsBelow420=rear,grayComponents=shoes[:3]))
durations=[]
for suffix,mult in [('preview',1),('preview-slow',2)]:
 im=Image.open(root/('jump-'+suffix+'.gif'));total=0
 for i in range(im.n_frames):im.seek(i);total+=im.info.get('duration',0)
 assert total==m['durationMs']*mult
 durations.append(dict(file='jump-'+suffix+'.gif',durationMs=total))
report['gifs']=durations
(root/'pose-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS jump v3 art: forward-tuck silhouette; both apex shoes in front; left-first contact; eight original cels pixel-identical; bounds/GIF timing')
