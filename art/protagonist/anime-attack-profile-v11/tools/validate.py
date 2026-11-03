from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
root=Path(__file__).resolve().parents[1];repo=root.parents[2];prior=root.parent/'anime-attack-profile-v10';public=repo/'site/art/protagonist/anime-attack-profile-v11';m=json.loads((root/'combat-sheet.json').read_text());old=json.loads((prior/'combat-sheet.json').read_text())
assert m['combo']==['kick1','kick2','kick3'] and 'attack4' not in m['actions'];assert Image.open(root/'combat-sheet.png').size==(3072,8960)
def cel(k,i):
 f=m['actions'][k]['frames'][i];return Image.open(root/m['actions'][k]['image']).crop((f['x'],f['y'],f['x']+768,f['y']+640))
def eq(a,b):assert np.array_equal(np.array(a),np.array(b))
combined=Image.open(root/'combat-sheet.png')
for k,a in m['actions'].items():
 assert len(a['frames'])==(16 if k=='kick3' else 8)
 for f in a['frames']:
  c=cel(k,f['index']);ys,xs=np.where(np.array(c)[:,:,3]>180);assert xs.min()>0 and xs.max()<767 and ys.min()>0 and ys.max()<639,(k,f['index'])
  eq(c,combined.crop((f['x'],f['y']+a['atlasRowOffset']*640,f['x']+768,f['y']+a['atlasRowOffset']*640+640)))
 if k!='kick2':
  for field in a:
   if field!='atlasRowOffset':assert a[field]==old['actions'][k][field],(k,field)
  for suffix in ['-sheet.png','-contact.png','-preview.gif','-preview-slow.gif']:assert (root/(k+suffix)).read_bytes()==(prior/(k+suffix)).read_bytes()
 for suffix,mult in [('',1),('-slow',2)]:
  g=Image.open(root/f'{k}-preview{suffix}.gif');assert g.n_frames==len(a['frames']) and 'loop' not in g.info;total=0;target=0
  for i,f in enumerate(a['frames']):g.seek(i);total+=g.info['duration'];target+=f['durationMs']*mult;assert abs(total-target)<=5
 if k.startswith('kick'):eq(cel(k,len(a['frames'])-1),Image.open(root/'guard.png'))
assert not np.array_equal(np.array(cel('kick1',6)),np.array(cel('kick2',0)))
eq(cel('kick2',2),cel('kick2',5))
assert m['actions']['kick2']['frames'][0]['phase']=='instant-right-support'
assert all(f['phase'] not in ['right-frame07','land-right-switch-hands'] for f in m['actions']['kick2']['frames'])
for field in ['turnViews','nearKickViews','leftKickViews']:
 for view in m[field].values():eq(cel(view['action'],view['frameIndex']),Image.open(root/view['image']))
for name,count,duration in [('combo',31,1710),('pair',15,810),('punches',24,860)]:
 for suffix,mult in [('',1),('-slow',2)]:
  g=Image.open(root/f'{name}-preview{suffix}.gif');assert g.n_frames==count and 'loop' not in g.info;total=0
  for i in range(count):g.seek(i);total+=g.info['duration']
  assert abs(total-duration*mult)<=5,(name,total,duration)
reg=json.loads((root/'registration.json').read_text());assert len({f['scale'] for f in reg['frames']})==1
assert m['actions']['kick2']['strikingLeg']=='left/far' and m['actions']['kick2']['supportLeg']=='right/near'
assert m['actions']['kick2']['armRoles']=={'frontGuard':'right/near','rearBalance':'left/far'}
assert m['playbackSequences']['pair'][0]=={'key':'kick1','endFrame':6,'lastFrameDurationMs':20}
for baseline in [root/'protected-baselines.json',repo/'movie/game-source-baseline.json']:
 for p,h in json.loads(baseline.read_text()).items():assert hashlib.sha256((repo/p).read_bytes()).hexdigest()==h,p
for f in public.iterdir():assert f.stat().st_size<8*1024**2,f
print('PASS:56 uncut cels; right kick and other4 actions unchanged; duplicate/landing removed;8-cel matched left kick;15-cel pair;31-cel combo; fixed scale; protected hashes; upload sizes')

# Same numbered phases/durations from03 onward; measured support pixels align.
for i in range(2,8):assert m['actions']['kick1']['frames'][i]['durationMs']==m['actions']['kick2']['frames'][i]['durationMs']
audit=json.loads((root/'pose-audit.json').read_text())
for row in audit:assert abs(row['supportDelta'][0])<=1 and row['supportDelta'][1]==0,row
# Initial swapped pose uses the SAME planted-foot coordinate as right07.
def ground(c):
 a=np.array(c);yy,xx=np.where(a[:,:,3]>180);y=int(yy.max());_,x=np.where(a[y-2:y+1,:,3]>180);return (int(x.min())+int(x.max()))/2,y
r,l=ground(cel('kick1',6)),ground(cel('kick2',0));assert abs(r[0]-l[0])<=1 and r[1]==l[1]
print('PASS: matched03–08 timings; support positions within1px including the switch; standalone RIGHT remains byte-identical')
