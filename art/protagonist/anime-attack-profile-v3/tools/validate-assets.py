"""Read-only asset, alignment, GIF and protected-file checks. Anatomy needs visual review."""
from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib

repo=Path(__file__).resolve().parents[4]
root=Path(__file__).resolve().parents[1]
meta=json.loads((root/'combat-sheet.json').read_text())
guard=np.array(Image.open(root/'guard.png'))
combined=np.array(Image.open(root/'combat-sheet.png'))
assert combined.shape==(5120,2048,4)
total=0
for action_index,key in enumerate(meta['combo']):
    action=meta['actions'][key]
    sheet=Image.open(root/action['image'])
    assert sheet.mode=='RGBA' and sheet.size==(2048,1280)
    data=np.array(sheet)
    registration=json.loads((root/(key+'-registration.json')).read_text())
    for cel in registration['frames']:
        contacts=cel['sourceShoeContactY']
        assert max(contacts)-min(contacts)<=3,(key,cel['index'],'floating foot')
    assert np.array_equal(data,combined[action_index*1280:(action_index+1)*1280])
    for i in range(8):
        f=action['frames'][i]
        cell=data[f['y']:f['y']+640,f['x']:f['x']+512]
        a=cell[:,:,3]
        assert (a<16).mean()>.55,(key,i,'transparency')
        ys,xs=np.where(a>180)
        assert xs.min()>0 and xs.max()<511 and ys.min()>0 and ys.max()<639,(key,i,'clipped silhouette')
        if (i==0 and key!='attack4') or (i==7 and key!='attack3'):assert np.array_equal(cell,guard),(key,i,'different shared guard')
    durations=[f['durationMs'] for f in action['frames']]
    assert sum(durations)==action['durationMs']
    total+=sum(durations)
    for suffix,factor in [('',1),('-slow',2)]:
        gif=Image.open(root/(key+'-preview'+suffix+'.gif'))
        assert gif.n_frames==8 and 'loop' not in gif.info,(key,suffix,'GIF should play once')
        for i,duration in enumerate(durations):
            gif.seek(i);assert gif.info['duration']==duration*factor
assert total==meta['durationMs']==1380
def cel(key,index):
    action=meta['actions'][key];frame=action['frames'][index]
    data=np.array(Image.open(root/action['image']))
    return data[frame['y']:frame['y']+640,frame['x']:frame['x']+512]
peak=np.array(Image.open(root/'uppercut-peak.png'))
assert np.array_equal(peak,cel('attack3',4))
assert np.array_equal(peak,cel('attack3',7))
assert np.array_equal(peak,cel('attack4',0)), 'uppercut-to-slam transition must reuse the full pose'
assert np.array_equal(peak,np.array(Image.open(root/'slam-start.png')))
assert meta['groundY']-meta['actions']['attack3']['impact']['fist'][1]>=500, 'uppercut must reach above the former 451px height'
assert meta['handConvention']=={'near':'right/hand1','far':'left/hand2'}
assert meta['actions']['attack3']['onComplete']=='uppercut-peak'

durations=[f['durationMs'] for key in meta['combo'] for f in meta['actions'][key]['frames']]
for suffix,factor in [('',1),('-slow',2)]:
    gif=Image.open(root/('combo-preview'+suffix+'.gif'))
    assert gif.n_frames==32 and 'loop' not in gif.info
    for i,duration in enumerate(durations):
        gif.seek(i);assert gif.info['duration']==duration*factor
for baseline_file in [root/'protected-baselines.json',repo/'movie/game-source-baseline.json']:
    baseline=json.loads(baseline_file.read_text())
    for name,expected in baseline.items():
        if isinstance(expected,dict):expected=expected['sha256']
        actual=hashlib.sha256((repo/name).read_bytes()).hexdigest()
        assert actual==expected,('protected file changed',name)
print('PASS: 32 complete transparent cels; aligned shoe contacts; identical uppercut/slam seam and correct guard endpoints; one-shot GIF timing; protected art/game files unchanged.')
