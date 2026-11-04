from pathlib import Path
from PIL import Image
import numpy as np,json,shutil,sys,hashlib
root=Path(__file__).resolve().parents[1];source=Path(sys.argv[1]);shutil.copyfile(source,root/'run-source.png');a=np.array(Image.open(source).convert('RGBA'));assert a.shape==(1024,1536,4);assert (a[:,:,3]<16).mean()>.7
# Fixed full-cel translation, preserving the drawn lift and body bob.
frames=[]
row_offsets=[]
for row in range(2):
 c=a[row*512:(row+1)*512,:1152];y,x=np.where(c[:,:,3]>180);row_offsets.append(500-int(y.max()))
for i in range(8):
 c=a[i//4*512:(i//4+1)*512,i%4*384:(i%4+1)*384];y,x=np.where(c[:,:,3]>180)
 assert x.min()>0 and x.max()<383 and y.min()>0 and y.max()<511,(i,[x.min(),y.min(),x.max(),y.max()])
 frames.append(dict(index=i,sourceX=i%4*384,sourceY=i//4*512,sourceWidth=384,offsetX=32,offsetY=row_offsets[i//4],flight=i%4==3,floorGap=int(500-y.max()-row_offsets[i//4])))
(root/'registration.json').write_text(json.dumps(dict(columns=4,rows=2,frameWidth=448,frameHeight=512,groundY=500,fps=16,preserveUpperBodyMotion=True,origin='fixed whole-cel grid; no per-frame resize or limb deformation',frames=frames),indent=2)+'\n')
(root/'reference-sources.json').write_text(json.dumps(dict(video='run-sample.mp4',videoSha256=hashlib.sha256(Path('/workspace/attachments/93eff5ab-046a-465d-a39d-d5e19f7baf38/run-sample.mp4').read_bytes()).hexdigest(),motion='alternating arm swing, moderate lean, compression/toe push/flight; user video',identity='anime-idle-profile-v1'),indent=2)+'\n')
