"""Read-only asset, alignment, GIF and protected-file checks. Anatomy needs visual review."""
from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib

repo=Path(__file__).resolve().parents[4]
root=Path(__file__).resolve().parents[1]
meta=json.loads((root/'combat-sheet.json').read_text())
guard=np.array(Image.open(root/'guard.png'))
combined=np.array(Image.open(root/'combat-sheet.png'))
assert combined.shape==(4096,2048,4)
total=0
for action_index,key in enumerate(meta['combo']):
    action=meta['actions'][key]
    sheet=Image.open(root/action['image'])
    assert sheet.mode=='RGBA' and sheet.size==(2048,1024)
    data=np.array(sheet)
    registration=json.loads((root/(key+'-registration.json')).read_text())
    for cel in registration['frames']:
        contacts=cel['sourceShoeContactY']
        assert max(contacts)-min(contacts)<=3,(key,cel['index'],'floating foot')
    assert np.array_equal(data,combined[action_index*1024:(action_index+1)*1024])
    for i in range(8):
        f=action['frames'][i]
        cell=data[f['y']:f['y']+512,f['x']:f['x']+512]
        a=cell[:,:,3]
        assert (a<16).mean()>.55,(key,i,'transparency')
        ys,xs=np.where(a>180)
        assert xs.min()>0 and xs.max()<511 and ys.min()>0 and ys.max()<511,(key,i,'clipped silhouette')
        if i in [0,7]:assert np.array_equal(cell,guard),(key,i,'different shared guard')
    durations=[f['durationMs'] for f in action['frames']]
    assert sum(durations)==action['durationMs']
    total+=sum(durations)
    for suffix,factor in [('',1),('-slow',2)]:
        gif=Image.open(root/(key+'-preview'+suffix+'.gif'))
        assert gif.n_frames==8 and 'loop' not in gif.info,(key,suffix,'GIF should play once')
        for i,duration in enumerate(durations):
            gif.seek(i);assert gif.info['duration']==duration*factor
assert total==meta['durationMs']==1380
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
print('PASS: 32 complete transparent cels; aligned shoe contacts; identical guard endpoints; one-shot GIF timing; protected art/game files unchanged.')
