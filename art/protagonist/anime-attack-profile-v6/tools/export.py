"""Explicit public assets and self-contained download coordinates."""
from pathlib import Path
import shutil,json
root=Path(__file__).resolve().parents[1];repo=root.parents[2];public=repo/'site/art/protagonist/anime-attack-profile-v6';public.mkdir(parents=True,exist_ok=True)
m=json.loads((root/'combat-sheet.json').read_text());keys=m['allActions']
files=['combat-sheet.png','combat-sheet.json','guard.png','combo-preview.gif','combo-preview-slow.gif','punches-preview.gif','punches-preview-slow.gif']
for k in keys:files += [k+'-sheet.png',k+'-contact.png',k+'-preview.gif',k+'-preview-slow.gif']
for name in files:shutil.copyfile(root/name,public/name)
for v in range(1,6):shutil.copyfile(repo/'site/attack-profile-v6.html',repo/f'site/attack-profile-v{v}.html')
d=repo/'site/downloads'
for k in keys:
 shutil.copyfile(root/f'{k}-sheet.png',d/f'di-mon-{k}-profile-v6.png')
 shutil.copyfile(root/f'{k}-preview.gif',d/f'di-mon-{k}-profile-v6.gif')
for src,dst in [('combo-preview.gif','di-mon-kick-combo-v6.gif'),('combo-preview-slow.gif','di-mon-kick-combo-v6-slow.gif'),('combat-sheet.png','di-mon-attack-profile-v6.png')]:shutil.copyfile(root/src,d/dst)
m['image']='di-mon-attack-profile-v6.png';m.pop('guardImage',None)
for k,a in m['actions'].items():
 a['image']=m['image'];a['gif']=f'di-mon-{k}-profile-v6.gif'
 for f in a['frames']:f['y']+=a['atlasRowOffset']*640
(d/'di-mon-attack-profile-v6.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('Exported v6 assets, downloads and legacy review aliases')
