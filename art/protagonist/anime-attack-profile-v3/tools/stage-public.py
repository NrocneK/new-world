"""Copy only the reviewed animation outputs, without touching existing assets."""
from pathlib import Path
import shutil,json

root=Path(__file__).resolve().parents[1]
repo=Path(__file__).resolve().parents[4]
public=repo/'site/art/protagonist/anime-attack-profile-v3'
downloads=repo/'site/downloads'
public.mkdir(parents=True,exist_ok=True);downloads.mkdir(parents=True,exist_ok=True)
names=['combat-sheet.png','combat-sheet.json','guard.png','uppercut-peak.png','slam-start.png','combo-preview.gif','combo-preview-slow.gif','ground-impact-source.png']
for key in ['attack1','attack2','attack3','attack4']:
    names.extend([key+'-sheet.png',key+'-preview.gif',key+'-preview-slow.gif'])
for name in names:
    assert (root/name).stat().st_size<8*1024**2,name
    shutil.copyfile(root/name,public/name)
for source,dest in [('combat-sheet.png','di-mon-attack-profile-v3.png'),
                    ('combo-preview.gif','di-mon-attack-profile-v3.gif'),
                    ('combo-preview-slow.gif','di-mon-attack-profile-v3-slow.gif')]:
    shutil.copyfile(root/source,downloads/dest)
for key in ['attack1','attack2','attack3','attack4']:
    for ext,source in [('png',key+'-sheet.png'),('gif',key+'-preview.gif')]:
        shutil.copyfile(root/source,downloads/('di-mon-'+key+'-profile-v3.'+ext))
# A download must be self-contained with the single combined PNG beside it.
# Runtime metadata instead uses the four smaller individual action atlases.
meta=json.loads((root/'combat-sheet.json').read_text())
meta['image']='di-mon-attack-profile-v3.png'
meta.pop('guardImage');meta.pop('peakImage');meta.pop('vfxManifest');meta.pop('effectOverrides',None)
meta['guard']={'action':'attack1','frameIndex':0}
meta['export']='character-only, combined atlas coordinates'
for row,key in enumerate(meta['combo']):
    action=meta['actions'][key]
    action['image']=meta['image']
    action['gif']='di-mon-'+key+'-profile-v3.gif'
    for frame in action['frames']:frame['y']+=row*1280
(downloads/'di-mon-attack-profile-v3.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
shutil.copyfile(root/'ground-impact-source.png',downloads/'di-mon-ground-impact-v3.png')
effect=json.loads((root/'combat-sheet.json').read_text())['effectOverrides']['attack4']
effect['image']='di-mon-ground-impact-v3.png'
effect['trigger']='attack4 impact; align anchor to ground contact point'
(downloads/'di-mon-ground-impact-v3.json').write_text(json.dumps(effect,indent=2)+'\n')
print('Staged 4 action sheets/GIFs, combined atlas/GIFs, and standalone atlas JSON.')
