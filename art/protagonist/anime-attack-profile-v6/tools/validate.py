from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib,math
root=Path(__file__).resolve().parents[1];repo=root.parents[2];public=repo/'site/art/protagonist/anime-attack-profile-v6';m=json.loads((root/'combat-sheet.json').read_text());prior=repo/'art/protagonist/anime-attack-profile-v5';old=json.loads((prior/'combat-sheet.json').read_text())
assert m['combo']==['kick1','kick2','kick3'] and 'attack4' not in m['actions'] and len(m['actions'])==6
assert Image.open(root/'combat-sheet.png').size==(3072,7680)
def cel(k,i):
 f=m['actions'][k]['frames'][i];return Image.open(root/m['actions'][k]['image']).crop((f['x'],f['y'],f['x']+768,f['y']+640))
def equal(a,b):assert np.array_equal(np.array(a),np.array(b))
combined=Image.open(root/'combat-sheet.png')
for k,a in m['actions'].items():
 assert len(a['frames'])==8
 for f in a['frames']:
  c=cel(k,f['index']);ys,xs=np.where(np.array(c)[:,:,3]>180);assert xs.min()>0 and xs.max()<767 and ys.min()>0 and ys.max()<639,(k,f['index'])
  equal(c,combined.crop((f['x'],f['y']+a['atlasRowOffset']*640,f['x']+768,f['y']+a['atlasRowOffset']*640+640)))
  if k.startswith('attack'):
   o=old['actions'][k]['frames'][f['index']];im=Image.open(prior/old['actions'][k]['image']);equal(c.crop((64,0,704,640)),im.crop((o['x'],o['y'],o['x']+640,o['y']+640)))
 for suffix,mult in [('',1),('-slow',2)]:
  g=Image.open(root/f'{k}-preview{suffix}.gif');assert g.n_frames==8 and 'loop' not in g.info;total=0;target=0
  for i,f in enumerate(a['frames']):g.seek(i);total+=g.info['duration'];target+=f['durationMs']*mult;assert abs(total-target)<=5
 for i in [0,7] if k.startswith('kick') else []:equal(cel(k,i),Image.open(root/'guard.png'))
for name,seq in [('combo',m['combo']),('punches',m['punchCombo'])]:
 for suffix,mult in [('',1),('-slow',2)]:
  g=Image.open(root/f'{name}-preview{suffix}.gif');assert g.n_frames==24 and 'loop' not in g.info;total=0
  for i in range(24):g.seek(i);total+=g.info['duration']
  assert total==sum(m['actions'][k]['durationMs'] for k in seq)*mult
reg=json.loads((root/'registration.json').read_text())
for key,frames in reg['sources'].items():assert len({f['scale'] for f in frames})==1,key
assert m['actions']['kick3']['impact']['foot'][1]<220
assert m['actions']['kick1']['impact']['foot'][1]>300 and m['actions']['kick2']['impact']['foot'][1]>300
plan=json.loads((root/'pose-plan.json').read_text())
for k in m['combo']:
 for f in plan[k]:
  for a,b in [('hip','nearKnee'),('nearKnee','nearAnkle'),('hip','farKnee'),('farKnee','farAnkle')]:assert abs(math.dist(f[a],f[b])-96)<.01
for baseline in [root/'protected-baselines.json',repo/'movie/game-source-baseline.json']:
 for p,h in json.loads(baseline.read_text()).items():assert hashlib.sha256((repo/p).read_bytes()).hexdigest()==h,p
for f in public.iterdir():assert f.stat().st_size<8*1024**2,f
for f in (repo/'site/downloads').glob('*v6*'):
 if f.name.startswith(('di-mon-attack','di-mon-kick')):assert f.stat().st_size<8*1024**2,f
print('PASS:48 uncut cels; original3 punches; shared guard seams;24-cel kick GIF1640ms; no ground action; fixed atlas scales; high kick; protected hashes; upload sizes')
