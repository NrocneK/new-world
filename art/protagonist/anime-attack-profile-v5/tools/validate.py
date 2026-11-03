from pathlib import Path
from PIL import Image
import json,hashlib
import numpy as np
r=Path(__file__).resolve().parents[4];a=r/'art/protagonist/anime-attack-profile-v5';p=r/'site/art/protagonist/anime-attack-profile-v5'
m=json.loads((a/'combat-sheet.json').read_text())
def cel(key,i,root=a):
 f=m['actions'][key]['frames'][i];return Image.open(root/m['actions'][key]['image']).crop((f['x'],f['y'],f['x']+640,f['y']+640))
def eq(x,y):assert np.array_equal(np.array(x),np.array(y))
for key,action in m['actions'].items():
 for f in action['frames']:
  x=cel(key,f['index']);alpha=np.array(x)[:,:,3];yy,xx=np.where(alpha>180);assert xx.min()>0 and xx.max()<639 and yy.min()>0 and yy.max()<639
  if key in ['attack1','attack2']:
   old=Image.open(r/'art/protagonist/anime-attack-profile-v3'/action['image']);i=f['index'];eq(x.crop((128,0,640,640)),old.crop((i%4*512,i//4*640,i%4*512+512,i//4*640+640)))
 for suffix,mult in [('',1),('-slow',2)]:
  g=Image.open(a/f'{key}-preview{suffix}.gif');assert g.n_frames==len(action['frames']);assert 'loop' not in g.info
  elapsed=0;actual=0
  for i,f in enumerate(action['frames']):
   g.seek(i);elapsed+=f['durationMs']*mult;actual+=g.info['duration'];assert abs(actual-elapsed)<=5
for x in [cel('attack3',7),cel('attack4',0),Image.open(a/'hook-peak.png')]:eq(cel('attack3',6),x)
eq(cel('attack4',7),cel('attack4',8));eq(cel('attack4',12),cel('attack1',0))
original=Image.open(r/'site/art/protagonist/anime-idle-profile-v1/idle-sheet.png');idle=Image.new('RGBA',(640,640));idle.paste(original.crop((0,0,384,512)),(m['idle']['offsetX'],120));eq(idle,cel('attack4',15));eq(idle,Image.open(a/'idle-first.png'))
assert (p/'idle-sheet.png').read_bytes()==(r/'site/art/protagonist/anime-idle-profile-v1/idle-sheet.png').read_bytes()
for f in [a/'protected-baselines.json',r/'movie/game-source-baseline.json']:
 for path,h in json.loads(f.read_text()).items():assert hashlib.sha256((r/path).read_bytes()).hexdigest()==h,path
for filename,count,duration in [('combo-preview.gif',40,2170),('finisher-preview.gif',24,1670)]:
 g=Image.open(a/filename);assert g.n_frames==count;total=0
 for i in range(count):g.seek(i);total+=g.info['duration']
 assert total==duration,(filename,total)
for f in list(p.iterdir())+[f for f in (r/'site/downloads').glob('*v5*') if f.name.startswith(('di-mon-attack','di-mon-finisher','di-mon-ground-impact'))]:assert f.stat().st_size<8*1024**2,f
print('PASS: 40 cels; original straight-punch art; exact hook/guard/idle transitions; one-shot GIFs/timing; protected game/locomotion/VFX hashes; upload sizes')

# Fixed drawing units in the descent/recovery, and fixed-length guide bones.
reg=json.loads((a/'registration.json').read_text())
for key,frames in reg['sources'].items():assert len(set(f['scale'] for f in frames))==1,key
assert reg['sources']['slam'][0]['scale']==reg['sources']['recovery'][0]['scale']
plan=json.loads((a/'pose-plan.json').read_text())
import math
for f in plan['hook']+plan['slam']:
 for p1,p2,L in [('hip','s',96),('hip','nearKnee',96),('nearKnee','nearAnkle',96),('hip','farKnee',96),('farKnee','farAnkle',96),('s','nearElbow',59),('nearElbow','w',59)]:assert abs(math.dist(f[p1],f[p2])-L)<.01
assert plan['slam'][3]['hip'][1]>plan['slam'][2]['hip'][1]
assert all(plan['slam'][i+1]['nearKnee'][1]>=plan['slam'][i]['nearKnee'][1] for i in range(3,7))
assert plan['slam'][7]['nearKnee'][1]>480
old=json.loads((r/'art/protagonist/anime-attack-profile-v4/combat-sheet.json').read_text())
assert m['actions']['attack3']['impact']['fist'][1]<old['actions']['attack3']['impact']['fist'][1]-50
print('PASS: fixed scale per atlas; same descent/recovery scale; guide bone lengths; progressive knee descent; higher hook peak')
