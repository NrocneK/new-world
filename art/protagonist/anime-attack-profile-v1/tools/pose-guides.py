"""Draw reference diagrams for the retained three strikes and new finisher."""
from pathlib import Path
import math,json

root=Path(__file__).resolve().parents[1];root.mkdir(parents=True,exist_ok=True)
def limb(a,b,u=75,l=75,leg=False):
 dx,dy=b[0]-a[0],b[1]-a[1];d=math.hypot(dx,dy)
 assert abs(u-l)<d<u+l,(a,b,d)
 along=(u*u-l*l+d*d)/(2*d);side=math.sqrt(u*u-along*along)
 if leg:return [a[0]+along*dx/d+side*dy/d,a[1]+along*dy/d-side*dx/d]
 sign=-1 if dx<0 else 1
 return [a[0]+along*dx/d-sign*side*dy/d,a[1]+along*dy/d+sign*side*dx/d]
def line(points,color,width):
 return '<polyline points="'+' '.join(f'{x:.1f},{y:.1f}' for x,y in points)+f'" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>'
plans={
 'attack1':{'name':'STRAIGHT 1 / NEAR HAND','duration':[30,20,20,40,30,30,30,50],'impactFrame':3,
  'hip':[[166,285],[164,287],[170,285],[172,284],[172,284],[168,285],[166,286],[166,285]],
  'shoulder':[[180,150],[177,152],[185,150],[187,150],[188,150],[183,150],[180,151],[180,150]],
  'head':[[202,92],[200,94],[207,92],[209,91],[209,91],[205,92],[202,93],[202,92]],
  'near':[[228,172],[222,180],[290,165],[336,150],[337,151],[278,170],[232,174],[228,172]]},
 'attack2':{'name':'STRAIGHT 2 / FAR HAND','duration':[30,20,20,40,30,30,30,50],'impactFrame':3,
  'hip':[[166,285],[163,288],[173,286],[177,285],[177,285],[171,286],[167,286],[166,285]],
  'shoulder':[[180,150],[177,153],[192,151],[200,150],[201,150],[188,151],[181,151],[180,150]],
  'head':[[202,92],[200,95],[212,93],[215,92],[215,92],[208,93],[203,93],[202,92]],
  'near':[[228,172],[224,155],[224,142],[224,139],[224,139],[224,150],[227,164],[228,172]],
  'far':[[205,195],[199,200],[282,164],[338,150],[339,150],[282,168],[213,187],[205,195]]},
 'attack3':{'name':'RISING UPPERCUT / NEAR HAND','duration':[40,40,30,50,50,40,50,60],'impactFrame':4,
  'hip':[[166,285],[166,315],[166,330],[170,300],[172,280],[170,285],[166,285],[166,285]],
  'shoulder':[[180,150],[180,180],[185,195],[190,165],[200,145],[190,150],[180,150],[180,150]],
  'head':[[202,92],[202,122],[207,137],[212,107],[220,85],[212,90],[202,92],[202,92]],
  'near':[[228,172],[198,270],[190,315],[254,180],[256,53],[255,70],[235,155],[228,172]]},
 'attack4':{'name':'ONE HAND / VERTICAL GROUND PUNCH','duration':[50,60,60,50,90,60,70,80],'impactFrame':4,
  'hip':[[166,285],[166,305],[166,318],[190,350],[200,365],[200,365],[170,325],[166,285]],
  'shoulder':[[180,150],[187,170],[194,185],[310,300],[330,339],[330,339],[205,210],[180,150]],
  'head':[[202,92],[207,112],[212,128],[270,225],[285,260],[285,260],[222,152],[202,92]],
  'near':[[228,172],[210,105],[215,50],[310,430],[330,488],[330,488],[245,280],[228,172]],
  'far':[[205,195],[210,215],[210,230],[253,280],[275,310],[275,310],[230,255],[205,195]]}
}
for key,a in plans.items():
 parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024"><rect width="1536" height="1024" fill="#f4f5f3"/>'];records=[]
 for i in range(8):
  hip=a['hip'][i];sh=a['shoulder'][i];head=a['head'][i];near=a['near'][i]
  far_sh=[sh[0]-10,sh[1]+1];far=a.get('far',[[205,195]]*8)[i]
  if key=='attack3':far=[205+(sh[0]-180)*.3,195+(sh[1]-150)]
  near_elbow=[330,414] if key=='attack4' and i in [4,5] else limb(sh,near)
  far_elbow=limb(far_sh,far)
  rear=[105,482];front=[245,482]
  rear_knee=limb(hip,rear,112,112,True);front_knee=limb(hip,front,112,112,True)
  parts.append(f'<g transform="translate({i%4*384},{i//4*512})">')
  parts.append('<path d="M20 500H365" stroke="#a3b1b0"/>')
  parts.append(line([hip,rear_knee,rear],'#8d7d99',23));parts.append(line([[90,491],[125,491]],'#8d7d99',18))
  parts.append(line([far_sh,far_elbow,far],'#81939d',17));parts.append(f'<circle cx="{far[0]}" cy="{far[1]}" r="12" fill="#81939d"/>')
  parts.append(line([sh,hip],'#5d7382',47))
  parts.append(line([hip,front_knee,front],'#4696aa',25));parts.append(line([[228,491],[272,491]],'#4696aa',18))
  neck=[head[0]-8,head[1]+32];parts.append(line([sh,neck],'#8b9da5',15))
  rotation=15 if key=='attack4' and i in [3,4,5] else 0
  parts.append(f'<g transform="translate({head[0]},{head[1]}) rotate({rotation})"><ellipse rx="29" ry="38" fill="#dfe5e5" stroke="#4f6977" stroke-width="2"/><path d="M26 -1L37 10L26 14" fill="#dfe5e5" stroke="#4f6977" stroke-width="2"/><circle cx="19" cy="-2" r="9" fill="none" stroke="#304d5f" stroke-width="2"/></g>')
  parts.append(line([sh,near_elbow,near],'#297898',18));parts.append(f'<circle cx="{near[0]}" cy="{near[1]}" r="12" fill="#297898"/>')
  if key=='attack4' and i in [4,5]:parts.append('<path d="M330 337V500" stroke="#d28c43" stroke-width="2" stroke-dasharray="5 4"/>')
  for p in [sh,near_elbow]:parts.append(f'<circle cx="{p[0]}" cy="{p[1]}" r="4" fill="#dfb85a"/>')
  parts.append(f'<text x="12" y="510" font-family="sans-serif" font-size="11" fill="#284956">{i+1:02} {a["name"]}{" / HIT" if i==a["impactFrame"] else ""}</text></g>')
  records.append({'index':i,'hip':hip,'shoulder':sh,'nearFist':near,'farFist':far,'nearElbow':near_elbow,'durationMs':a['duration'][i]})
 parts.append('</svg>');(root/(key+'-guide.svg')).write_text(''.join(parts))
 a['frames']=records;a['durationMs']=sum(a['duration'])
(root/'combat-plan.json').write_text(json.dumps({'combo':list(plans),'actions':plans},indent=2)+'\n')
