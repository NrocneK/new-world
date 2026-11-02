"""Verify and package the handoff without resizing or altering any artwork."""
from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
import csv, hashlib, json, re, shutil, subprocess, zipfile

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parent
plan=json.loads((ROOT/'shot-plan.json').read_text())
pdf=subprocess.check_output(['pdftotext','-layout',str(ROOT/'HUONG-DAN-KLING.pdf'),'-']).decode()
pdf=re.sub(r'\s+','',pdf)
for shot in plan['shots']:
 assert re.sub(r'\s+','',shot['prompt']) in pdf,shot['id']+' prompt incomplete in PDF'
 assert (ROOT/'03-prompts'/f"{shot['id']}.txt").read_text().strip()==shot['prompt']
rows=list(csv.DictReader((ROOT/'04-editing/timeline.csv').open()))
assert sum(int(row['used_seconds']) for row in rows)==30
assets=[]
for p in sorted(ROOT.rglob('*.png')):
 im=Image.open(p);w,h=im.size;im.verify()
 assets.append({'file':p.relative_to(ROOT).as_posix(),'width':w,'height':h,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
assert len(assets)==12
(ROOT/'asset-manifest.json').write_text(json.dumps({'date':'2026-11-03','assets':assets},indent=2)+'\n')

class Links(HTMLParser):
 def __init__(self):super().__init__();self.local=[]
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ['href','src'] and v and not v.startswith(('http:','https:','#','data:','mailto:')):self.local.append(v)
links=Links();links.feed((ROOT/'index.html').read_text())
assert all((ROOT/p).is_file() for p in links.local)
files=[p for p in sorted(ROOT.rglob('*')) if p.is_file() and 'tools' not in p.relative_to(ROOT).parts and p.name!='SHA256SUMS.txt']
(ROOT/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(ROOT).as_posix()+'\n' for p in files))
files.append(ROOT/'SHA256SUMS.txt')
dest=REPO/'site/kling-kit';dest.mkdir(exist_ok=True)
for p in files:
 q=dest/p.relative_to(ROOT);q.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,q)
archive=REPO/'site/downloads/di-mon-kling-kit-v1.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,Path('di-mon-kling-kit')/p.relative_to(ROOT))
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print('PASS 12 PNGs; six complete prompts in PDF; all local links; 30s timeline; ZIP integrity')
print('ZIP files:',len(files),'bytes:',archive.stat().st_size,'SHA256:',hashlib.sha256(archive.read_bytes()).hexdigest())
