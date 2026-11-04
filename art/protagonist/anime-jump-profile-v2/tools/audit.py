"""Read-only bounds, contact and progression checks for the revised jump."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
from scipy.ndimage import label,find_objects

base=Path(__file__).resolve().parents[2];report={};cells={}
for folder,name in [('anime-jump-profile-v2','jump'),('anime-air-jump-profile-v2','air-jump')]:
 root=base/folder;m=json.loads((root/(name+'-sheet.json')).read_text());a=np.array(Image.open(root/m['image']).convert('RGBA'))
 assert a.shape==(m['rows']*640,1536,4)
 measures=[];cells[name]=[]
 for f in m['frames']:
  c=a[f['y']:f['y']+640,f['x']:f['x']+384];cells[name].append(c);y,x=np.where(c[:,:,3]>180);b=list(map(int,[x.min(),y.min(),x.max(),y.max()]));assert b[0]>=2 and b[2]<382 and b[1]>=2 and b[3]<639,(name,f['index'],b)
  near=[]
  if name=='jump':
   rgb=c[:,:,:3].astype(int);yy,xx=np.indices(c.shape[:2]);mask=(c[:,:,3]>180)&(rgb.max(2)-rgb.min(2)<45)&(rgb.max(2)>100)&(yy>350)&(xx<235);lab,n=label(mask)
   for j,s in enumerate(find_objects(lab)):
    sy,sx=s;size=np.count_nonzero(lab[s]==j+1)
    if size>60 and sx.stop-sx.start>12 and sy.stop-sy.start>9:near.append([sx.start,sy.start,sx.stop-1,sy.stop-1])
   if f['index'] in [0,1,2,10,11,12,13,14,15]:assert abs(b[3]-620)<=1,(f['index'],b)
   if f['index'] in [1,2,10,11,12,13,14]:
    fy,fx=np.where(c[b[3]-30:b[3]+1,:,3]>180);expected=222 if f['index']<=2 else 235;assert abs(int(fx.max())-expected)<=1,(f['index'],int(fx.max()))
  measures.append(dict(index=f['index'],phase=f['phase'],bounds=b,nearGrayComponents=near))
 durations=[]
 for suffix,multiplier in [('preview',1),('preview-slow',2)]:
  im=Image.open(root/(name+'-'+suffix+'.gif'));total=0
  for i in range(im.n_frames):im.seek(i);total+=im.info.get('duration',0)
  assert total==m['durationMs']*multiplier,(name,suffix,total)
  durations.append(dict(file=name+'-'+suffix+'.gif',durationMs=total,frames=im.n_frames))
 report[name]=dict(sourceScale=m['uniformSourceScale'],cels=measures,gifs=durations)
assert np.array_equal(cells['jump'][0],cells['jump'][15])
j=report['jump']['cels']
right_sole=[max(b[3] for b in j[i]['nearGrayComponents']) for i in [3,4,5,6]]
assert all(a>b for a,b in zip(right_sole,right_sole[1:])),right_sole
left_extension=[j[i]['bounds'][3] for i in [7,8,9,10]]
assert all(a<b for a,b in zip(left_extension,left_extension[1:])),left_extension
assert max(b[3] for b in j[10]['nearGrayComponents'] if b[2]<120)<600
assert j[10]['bounds'][1]<j[11]['bounds'][1]<j[12]['bounds'][1]
assert j[12]['bounds'][1]>j[13]['bounds'][1]>j[14]['bounds'][1]>j[15]['bounds'][1]
old=base/'anime-air-jump-profile-v1/air-jump-sheet.png';new=base/'anime-air-jump-profile-v2/air-jump-sheet.png';assert old.read_bytes()==new.read_bytes()
report['progression']={'rightSoleWhileRising':right_sole,'leftSoleWhileExtending':left_extension,'leftFirstContact':True,'lowThenStand':True,'airArtworkUnchangedSha256':hashlib.sha256(new.read_bytes()).hexdigest()}
(base/'anime-jump-profile-v2/pose-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS revised jump assets:24 unclipped cels; right toe / left toe anchors; right fold; left extension/contact; compression/recovery; unchanged air art; GIF timing')
