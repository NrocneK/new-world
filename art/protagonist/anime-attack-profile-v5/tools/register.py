"""Rigid complete-cel registration. Scale is fixed per source atlas, never per pose."""
from pathlib import Path
import importlib.util,json
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1];repo=root.parents[2]
spec=importlib.util.spec_from_file_location('read_landmarks',repo/'art/protagonist/anime-attack-profile-v4/tools/register.py');old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
# Atlas scales are chosen once against the standing model. No face-width or
# crouched-height scaling per frame; the entire sequence retains its drawing unit.
config={'hook':('hook-source.png',4,2,1.02,0,335.5),'slam':('slam-source.png',4,2,1.085,0,335.5),'recovery':('recovery-source.png',4,2,1.085,4,335.5),'peak':('peak-source.png',1,1,.53,0,335.5)}
idle=np.array(Image.open(repo/'site/art/protagonist/anime-idle-profile-v1/idle-sheet.png'))[:512,:384];reg={'policy':'one fixed uniform scale per source atlas; no per-frame face/body normalization; full-pose translation only','idle':{'offsetX':round(335.5-old.face(idle)['center'][0]),'offsetY':120},'sources':{}}
report={}
for key,(file,cols,rows,scale,reference,target) in config.items():
 im=np.array(Image.open(root/file));assert im.shape[2]==4;sw=im.shape[1]//cols;sh=im.shape[0]//rows
 cells=[im[i//cols*sh:(i//cols+1)*sh,i%cols*sw:(i%cols+1)*sw] for i in range(rows*cols)]
 reference_face=old.face(cells[reference]);baseX=target-reference_face['center'][0]*scale;frames=[]
 if key=='peak':
  # Raised fist hides cheek and may be the largest skin island. Register the
  # head/hair rigidly instead of accidentally anchoring the fist as a face.
  h=old.hair(cells[0])['bounds'];baseX=330.5-(h[0]+h[2])/2*scale
 recoveryShift=0
 if key=='recovery':
  prior=reg['sources']['slam'][7];sheet=np.array(Image.open(root/'slam-source.png'));contact=sheet[512:1024,1152:1536]
  shoe=old.landmarks(contact)['shoes'][-1];goal=prior['dx']+(sum(shoe)/2-prior['sourceBounds'][0])*prior['scale']
  shoe=old.landmarks(cells[0])['shoes'][-1];recoveryShift=goal-(baseX+sum(shoe)/2*scale)
 for i,c in enumerate(cells):
  yy,xx=np.where(c[:,:,3]>180);box=[int(xx.min()),int(yy.min()),int(xx.max()),int(yy.max())];floor=box[3];l,t,r,b=box;f=old.face(c)
  shift=recoveryShift*[1,1,.66,.33,0,0,0,0][i] if key=='recovery' else 0
  frame={'index':i,'image':file,'sx':i%cols*sw+l,'sy':i//cols*sh+t,'sw':r-l+1,'sh':b-t+1,'dx':baseX+l*scale+shift,'dy':620-(floor-t)*scale,'scale':scale,'sourceBounds':box,'sourceFloor':floor,'face':f}
  assert frame['dx']>0 and frame['dx']+frame['sw']*scale<639 and frame['dy']>0 and frame['dy']+frame['sh']*scale<639,(key,i,frame)
  frames.append(frame)
 reg['sources'][key]=frames;report[key]={'scale':scale,'constantAcrossAllCels':len(set(f['scale'] for f in frames))==1,'faceWidthsDiagnosticOnly':[f['face']['bounds'][2]-f['face']['bounds'][0]+1 for f in frames]}
(root/'registration.json').write_text(json.dumps(reg,indent=2)+'\n');(root/'scale-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
