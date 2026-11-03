"""Explicit public assets and self-contained download coordinates."""
from pathlib import Path
import shutil,json
root=Path(__file__).resolve().parents[1];repo=root.parents[2];public=repo/'site/art/protagonist/anime-attack-profile-v8';public.mkdir(parents=True,exist_ok=True)
m=json.loads((root/'combat-sheet.json').read_text());keys=m['allActions']
files=['combat-sheet.png','combat-sheet.json','guard.png','kick1-chamber.png','kick1-rechamber.png','turn-back.png','turn-left.png','turn-front.png','combo-preview.gif','combo-preview-slow.gif','punches-preview.gif','punches-preview-slow.gif']
for k in keys:files += [k+'-sheet.png',k+'-contact.png',k+'-preview.gif',k+'-preview-slow.gif']
for name in files:shutil.copyfile(root/name,public/name)
for v in range(1,8):shutil.copyfile(repo/'site/attack-profile-v8.html',repo/f'site/attack-profile-v{v}.html')
d=repo/'site/downloads'
for k in keys:
 shutil.copyfile(root/f'{k}-sheet.png',d/f'di-mon-{k}-profile-v8.png')
 shutil.copyfile(root/f'{k}-preview.gif',d/f'di-mon-{k}-profile-v8.gif')
for src,dst in [('combo-preview.gif','di-mon-kick-combo-v8.gif'),('combo-preview-slow.gif','di-mon-kick-combo-v8-slow.gif'),('combat-sheet.png','di-mon-attack-profile-v8.png')]:shutil.copyfile(root/src,d/dst)
m['image']='di-mon-attack-profile-v8.png';m.pop('guardImage',None)
for field in ['turnViews','nearKickViews']:
 for v in m.get(field,{}).values():v.pop('image',None)
for k,a in m['actions'].items():
 a['image']=m['image'];a['gif']=f'di-mon-{k}-profile-v8.gif'
 for f in a['frames']:f['y']+=a['atlasRowOffset']*640
(d/'di-mon-attack-profile-v8.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('Exported v8 assets, downloads and legacy review aliases')
