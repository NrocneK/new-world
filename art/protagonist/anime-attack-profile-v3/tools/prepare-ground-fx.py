"""Register the hand-drawn ground effect and describe the revision; no pixel edits."""
from pathlib import Path
from PIL import Image
import numpy as np,json

root=Path(__file__).resolve().parents[1]
source=root/'ground-impact-source.png'
im=Image.open(source);assert im.mode=='RGBA' and im.size==(1536,1024)
alpha=np.array(im)[:,:,3]
assert float((alpha<16).mean())>.85
meta=json.loads((root/'combat-sheet.json').read_text())
meta['reviewRevision']=3
meta['actions']['attack2']['continuity']={
    'strikingHand':'far/left', 'guardHand':'near/right',
    'guardAtCheekFrames':[1,2,3,4,5],
    'description':'Both hands guard before the far hand drives forward and retracts; the near hand never chambers or extends.'}
meta['actions']['attack3']['strikingHand']='right/near'
meta['actions']['attack4']['strikingHand']='right/near'
meta['actions']['attack4']['pose']='braced low lunge, rear knee off floor, free arm swept back'
meta['actions']['attack4']['impact']['vfxScale']=1.2
meta['effectOverrides']={'attack4':{
    'image':'ground-impact-source.png','width':1536,'height':1024,
    'fps':25,'loop':False,'uniformSourceScale':1.2,'opacity':.65,
    'blendMode':'source-over','filter':'none','attachment':'ground',
    'frames':[{'order':i,'x':(i%4)*384,'y':(i//4)*512,'w':384,'h':512,
               'anchorX':192,'anchorY':422} for i in range(8)],
    'description':'Thin ground ring, vertical gusts and stone chips; open impact center.'}}
(root/'combat-sheet.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print('Registered custom ground VFX: 8 anchored cels, source-over opacity0.65; original VFX files untouched.')
