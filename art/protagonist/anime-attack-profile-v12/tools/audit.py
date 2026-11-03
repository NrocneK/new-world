from pathlib import Path
from PIL import Image
import numpy as np,json,importlib.util
root=Path(__file__).resolve().parents[1];m=json.loads((root/'combat-sheet.json').read_text())
spec=importlib.util.spec_from_file_location('landmarks',root.parent/'anime-attack-profile-v4/tools/register.py');lm=importlib.util.module_from_spec(spec);spec.loader.exec_module(lm)
def cell(k,i):
 f=m['actions'][k]['frames'][i];a=np.array(Image.open(root/m['actions'][k]['image']));return a[f['y']:f['y']+640,f['x']:f['x']+768]
def contact(a):
 ys,xs=np.where(a[:,:,3]>180);floor=int(ys.max());yy,xx=np.where(a[floor-2:floor+1,:,3]>180);return [(int(xx.min())+int(xx.max()))/2,floor]
report=[]
for i in range(2,7):
 r=cell('kick1',i);l=cell('kick2',i);rb=lm.hair(r)['bounds'];lb=lm.hair(l)['bounds'];rp=contact(r);lp=contact(l);rf=m['actions']['kick1']['frames'][i]['inspectionPoint'];lf=m['actions']['kick2']['frames'][i]['inspectionPoint']
 report.append({'frame':i+1,'rightSupport':rp,'leftSupport':lp,'supportDelta':[lp[0]-rp[0],lp[1]-rp[1]],'hairCenterDelta':[(lb[0]+lb[2]-rb[0]-rb[2])/2,(lb[1]+lb[3]-rb[1]-rb[3])/2],'raisedFootDelta':[round(lf[0]-rf[0],2),round(lf[1]-rf[1],2)]})
(root/'pose-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
