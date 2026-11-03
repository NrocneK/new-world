"""A geometric guide for an independent one-shot glasses-adjust gesture."""
from pathlib import Path
import math,json

root=Path(__file__).resolve().parents[1]
root.mkdir(parents=True,exist_ok=True)
def ik(a,b):
 dx,dy=b[0]-a[0],b[1]-a[1];d=math.hypot(dx,dy);u,l=75,70
 assert abs(u-l)<d<u+l
 s=(u*u-l*l+d*d)/(2*d);q=math.sqrt(u*u-s*s)
 return [a[0]+s*dx/d-q*dy/d,a[1]+s*dy/d+q*dx/d]
def line(points,color,width):
 return '<polyline points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in points)+f'" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>'
wrists=[[183,278],[228,221],[236,127],[234,91],[234,89],[239,135],[220,226],[183,278]]
tips=[[190,305],[248,207],[229,102],[226,64],[226,62],[235,110],[234,249],[190,305]]
phases=['REST','LIFT','APPROACH','TOUCH RIM','GENTLE PUSH','RELEASE','LOWER','REST']
durations=[100,140,140,160,240,160,180,240]
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024"><rect width="1536" height="1024" fill="#f3f5f4"/>']
records=[]
for i,(w,t) in enumerate(zip(wrists,tips)):
 shoulder=[180,140];elbow=ik(shoulder,w)
 parts.append(f'<g transform="translate({i%4*384},{i//4*512})">')
 parts.append('<path d="M110 500H290" stroke="#9caeae"/>')
 parts.append(line([[193,270],[205,380],[210,481]],'#8a8998',24));parts.append(line([[168,270],[171,380],[175,486]],'#567182',27))
 parts.append(line([[197,490],[239,490]],'#8a8998',18));parts.append(line([[162,491],[217,491]],'#567182',18))
 parts.append(line([[185,140],[204,214],[205,280]],'#9ca9af',14))
 parts.append(line([[186,135],[183,268]],'#637b87',51))
 parts.append(line([[192,134],[200,105]],'#8b9da5',17))
 parts.append('<ellipse cx="204" cy="70" rx="30" ry="42" fill="#e1e6e6" stroke="#536f7c" stroke-width="2"/><path d="M230 65L240 80L231 85" fill="#e1e6e6" stroke="#536f7c" stroke-width="2"/><circle cx="220" cy="66" r="11" stroke="#334f60" stroke-width="2" fill="none"/><path d="M210 61H188" stroke="#334f60" stroke-width="2"/>')
 parts.append(line([shoulder,elbow,w],'#2e7799',17));parts.append(line([w,t],'#3c93ac',10))
 for p in [shoulder,elbow,w]:parts.append(f'<circle cx="{p[0]}" cy="{p[1]}" r="4" fill="#e6b858"/>')
 if i in [3,4]:parts.append('<circle cx="226" cy="63" r="6" stroke="#ce8656" stroke-width="2" fill="none"/>')
 parts.append(f'<text x="15" y="509" font-family="sans-serif" font-size="12" fill="#214958">{i+1:02} {phases[i]} / {durations[i]}ms</text></g>')
 records.append({'index':i,'phase':phases[i].lower(),'shoulder':shoulder,'elbow':elbow,'wrist':w,'fingertips':t,'durationMs':durations[i]})
parts.append('</svg>')
(root/'pose-guide.svg').write_text(''.join(parts))
(root/'gesture-plan.json').write_text(json.dumps({'loop':False,'durationMs':sum(durations),'frames':records},indent=2)+'\n')
