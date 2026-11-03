from pathlib import Path
import shutil,json
r=Path(__file__).resolve().parents[4];art=r/'art/protagonist/anime-attack-profile-v5';pub=r/'site/art/protagonist/anime-attack-profile-v5';pub.mkdir(parents=True,exist_ok=True)
for name in ['combat-sheet.png','attack1-sheet.png','attack2-sheet.png','attack3-sheet.png','attack4-sheet.png','guard.png','hook-peak.png','chamber.png','impact.png','idle-first.png','slam-start.png','return-guard.png','ground-impact-source.png']:
 shutil.copyfile(art/name,pub/name)
for p in art.glob('*preview*.gif'):shutil.copyfile(p,pub/p.name)
shutil.copyfile(art/'combat-sheet.json',pub/'combat-sheet.json')
shutil.copyfile(r/'site/art/protagonist/anime-idle-profile-v1/idle-sheet.png',pub/'idle-sheet.png')
(pub/'package.json').write_text('{"type":"module","private":true}\n')
# The viewer modules and HTML are authored separately; refresh legacy aliases.
for v in range(1,5):shutil.copyfile(r/'site/attack-profile-v5.html',r/f'site/attack-profile-v{v}.html')
# Explicit downloadable assets.
d=r/'site/downloads'
for key in ['attack1','attack2','attack3','attack4']:
 shutil.copyfile(art/f'{key}-sheet.png',d/f'di-mon-{key}-profile-v5.png')
 shutil.copyfile(art/f'{key}-preview.gif',d/f'di-mon-{key}-profile-v5.gif')
for src,dst in [('combat-sheet.png','di-mon-attack-profile-v5.png'),('combo-preview.gif','di-mon-attack-profile-v5.gif'),('combo-preview-slow.gif','di-mon-attack-profile-v5-slow.gif'),('finisher-preview.gif','di-mon-finisher-profile-v5.gif'),('finisher-preview-slow.gif','di-mon-finisher-profile-v5-slow.gif'),('ground-impact-source.png','di-mon-ground-impact-v5.png')]:shutil.copyfile(art/src,d/dst)
m=json.loads((art/'combat-sheet.json').read_text());m['image']='di-mon-attack-profile-v5.png'
for k,a in m['actions'].items():
 a['image']=m['image'];a['gif']=f'di-mon-{k}-profile-v5.gif'
 for f in a['frames']:f['y']+=a['atlasRowOffset']*640
for k in ['vfxManifest','effectOverrides','guardImage','peakImage','idleImage','idle']:m.pop(k,None)
m['idlePose']={'action':'attack4','frameIndex':15,'note':'Final cel; use the approved idle clip for breathing in-game.'}
(d/'di-mon-attack-profile-v5.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
fx=json.loads((art/'combat-sheet.json').read_text())['effectOverrides']['attack4'];fx['image']='di-mon-ground-impact-v5.png';(d/'di-mon-ground-impact-v5.json').write_text(json.dumps(fx,indent=2)+'\n')
print('Exported v5 public viewer, aliases and downloads')
