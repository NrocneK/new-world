"""Geometric animation reference: 8 poses per step, delayed joint rotations.

This draws a pose diagram only. Final character artwork is generated separately.
"""
from pathlib import Path
import math,json

root=Path(__file__).resolve().parents[1]
root.mkdir(parents=True,exist_ok=True)
def point(p,length,degrees):
 t=math.radians(degrees)
 return [round(p[0]+length*math.cos(t),2),round(p[1]+length*math.sin(t),2)]
def ik(hip,ankle):
 dx,dy=ankle[0]-hip[0],ankle[1]-hip[1];d=math.hypot(dx,dy)
 upper,lower=124,124
 assert d<upper+lower
 along=(upper*upper-lower*lower+d*d)/(2*d)
 side=math.sqrt(upper*upper-along*along)
 return [hip[0]+along*dx/d+side*dy/d,hip[1]+along*dy/d-side*dx/d]
def line(points,color,width):
 return '<polyline points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in points)+f'" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>'
bob=[0,2,4,3,0,-2,-3,-2]
lean=[30,29,28,29,31,32,31,30]
upper_arm=[135,136,138,142,146,148,144,138]
forearm=[160,156,150,148,153,163,170,169]
hand=[175,170,160,153,151,155,168,177]
head_bob=[0,0,1,2,2,1,0,-1]
support_x=[274,242,210,178,146,114,82,49]
swing_ankles=[[70,466],[58,445],[76,414],[111,418],[158,434],[213,451],[254,464],[276,466]]
phase_names=['CONTACT','ABSORB','LOAD','RECOVER','PASS','EXTEND','PUSH','TRANSFER']
records=[]
for half in range(2):
 parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024"><rect width="1536" height="1024" fill="#f4f5f4"/>']
 for j in range(8):
  i=half*8+j;hip=[172,253+bob[j]]
  shoulder=point(hip,132,-90+lean[j]);head=[268,76+head_bob[j]]
  support_ankle=[support_x[j],466];swing=swing_ankles[j]
  support=[hip,ik(hip,support_ankle),support_ankle]
  swing_leg=[hip,ik(hip,swing),swing]
  near=support if half==0 else swing_leg;far=swing_leg if half==0 else support
  elbow=point(shoulder,76,upper_arm[j]);wrist=point(elbow,70,forearm[j]);fingers=point(wrist,29,hand[j])
  far_shoulder=[shoulder[0]-5,shoulder[1]-3]
  far_elbow=point(far_shoulder,76,upper_arm[(j-2)%8]-3)
  far_wrist=point(far_elbow,70,forearm[(j-2)%8]-3)
  far_fingers=point(far_wrist,29,hand[(j-2)%8]-3)
  parts.append(f'<g transform="translate({j%4*384},{j//4*512})">')
  parts.append('<path d="M12 480H372" stroke="#abb5b5"/>')
  def leg(points,color):
   parts.append(line(points,color,19))
   a=points[-1];parts.append(line([[a[0]-8,a[1]+6],[a[0]+25,a[1]+6]],color,14))
  leg(far,'#8c789a')
  parts.append(line([far_shoulder,far_elbow,far_wrist,far_fingers],'#84939b',13))
  parts.append(line([shoulder,hip],'#566673',42))
  neck=[head[0]-12,head[1]+28]
  parts.append(line([shoulder,neck],'#6d7f89',14))
  parts.append(f'<g transform="translate({head[0]},{head[1]})"><ellipse rx="27" ry="34" fill="#e3e7e8" stroke="#526975" stroke-width="2"/><path d="M24 -2L36 10L24 13" fill="#e3e7e8" stroke="#526975" stroke-width="2"/><circle cx="18" cy="-2" r="6" fill="none" stroke="#526975" stroke-width="2"/></g>')
  parts.append(line([shoulder,elbow,wrist,fingers],'#274e67',17))
  for p in [shoulder,elbow,wrist]:parts.append(f'<circle cx="{p[0]}" cy="{p[1]}" r="4" fill="#f0b852"/>')
  leg(near,'#38a0b5')
  parts.append(f'<text x="12" y="510" font-family="sans-serif" font-size="12" fill="#234355">{i+1:02} {phase_names[j]} / {"NEAR" if half==0 else "FAR"} SUPPORT</text></g>')
  records.append({'frame':i,'phase':phase_names[j].lower(),'supportLeg':'near' if half==0 else 'far','hip':hip,'shoulder':shoulder,'elbow':elbow,'wrist':wrist,'fingers':fingers,'headCenter':head,'upperArmAngle':upper_arm[j],'forearmAngle':forearm[j],'handAngle':hand[j],'nearLeg':near,'farLeg':far})
 parts.append('</svg>')
 (root/f'pose-guide-{half+1}.svg').write_text(''.join(parts))
(root/'gait-plan.json').write_text(json.dumps(records,indent=2)+'\n')
