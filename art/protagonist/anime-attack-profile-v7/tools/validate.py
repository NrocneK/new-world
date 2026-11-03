from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
root=Path(__file__).resolve().parents[1];repo=root.parents[2];prior=root.parent/'anime-attack-profile-v6';public=repo/'site/art/protagonist/anime-attack-profile-v7';m=json.loads((root/'combat-sheet.json').read_text());old=json.loads((prior/'combat-sheet.json').read_text())
assert m['combo']==['kick1','kick2','kick3'] and 'attack4' not in m['actions']
assert Image.open(root/'combat-sheet.png').size==(3072,8960)
def cel(k,i):
 f=m['actions'][k]['frames'][i];return Image.open(root/m['actions'][k]['image']).crop((f['x'],f['y'],f['x']+768,f['y']+640))
def eq(a,b):assert np.array_equal(np.array(a),np.array(b))
combined=Image.open(root/'combat-sheet.png')
for k,a in m['actions'].items():
 assert len(a['frames'])==(16 if k=='kick3' else 8)
 for f in a['frames']:
  c=cel(k,f['index']);ys,xs=np.where(np.array(c)[:,:,3]>180);assert xs.min()>0 and xs.max()<767 and ys.min()>0 and ys.max()<639,(k,f['index'])
  eq(c,combined.crop((f['x'],f['y']+a['atlasRowOffset']*640,f['x']+768,f['y']+a['atlasRowOffset']*640+640)))
 if k!='kick3':
  assert a==old['actions'][k],k
  for suffix in ['-sheet.png','-contact.png','-preview.gif','-preview-slow.gif']:assert (root/(k+suffix)).read_bytes()==(prior/(k+suffix)).read_bytes()
 for suffix,mult in [('',1),('-slow',2)]:
  g=Image.open(root/f'{k}-preview{suffix}.gif');assert g.n_frames==len(a['frames']) and 'loop' not in g.info;total=0;target=0
  for i,f in enumerate(a['frames']):g.seek(i);total+=g.info['duration'];target+=f['durationMs']*mult;assert abs(total-target)<=5
 if k.startswith('kick'):
  for i in [0,len(a['frames'])-1]:eq(cel(k,i),Image.open(root/'guard.png'))
for name,seq in [('combo',m['combo']),('punches',m['punchCombo'])]:
 for suffix,mult in [('',1),('-slow',2)]:
  g=Image.open(root/f'{name}-preview{suffix}.gif');assert g.n_frames==sum(len(m['actions'][k]['frames']) for k in seq) and 'loop' not in g.info;total=0
  for i in range(g.n_frames):g.seek(i);total+=g.info['duration']
  assert total==sum(m['actions'][k]['durationMs'] for k in seq)*mult
reg=json.loads((root/'registration.json').read_text());assert len({f['scale'] for f in reg['frames']})==1
angles=[f['bodyYawDegrees'] for f in m['actions']['kick3']['frames']];assert angles[0]==0 and angles[-1]==360 and all(a<=b for a,b in zip(angles,angles[1:]))
for key,view in m['turnViews'].items():eq(cel('kick3',view['frameIndex']),Image.open(root/view['image']))
assert m['actions']['kick3']['impact']['footBounds'][1]<230
for baseline in [root/'protected-baselines.json',repo/'movie/game-source-baseline.json']:
 for p,h in json.loads(baseline.read_text()).items():assert hashlib.sha256((repo/p).read_bytes()).hexdigest()==h,p
for f in public.iterdir():assert f.stat().st_size<8*1024**2,f
print('PASS:56 uncut cels; first5 actions byte-identical;16-cel spin;32-cel kick combo1900ms; guard seams; fixed scale; full-turn intent and view cards; protected hashes; upload sizes')
