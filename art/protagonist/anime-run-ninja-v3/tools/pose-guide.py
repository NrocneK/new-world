"""Draw a geometric animation reference, not final character artwork."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
root.mkdir(parents=True,exist_ok=True)
# Four phases, then the same phases with near/far leg identities exchanged.
phases=[
 {'name':'CONTACT', 'support':[(240,387),(262,468)],'swing':[(123,390),(72,467)]},
 {'name':'LOAD', 'support':[(219,389),(221,468)],'swing':[(148,386),(67,406)]},
 {'name':'PASS', 'support':[(177,400),(172,468)],'swing':[(230,379),(161,438)]},
 {'name':'PUSH', 'support':[(125,390),(78,468)],'swing':[(235,378),(253,452)]},
]
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024"><rect width="1536" height="1024" fill="#f4f5f4"/>']
records=[]
for i in range(8):
 p=phases[i%4];near=p['support'] if i<4 else p['swing'];far=p['swing'] if i<4 else p['support']
 phase=i%4
 # Upper body compresses on loading and rises during the rear push.
 bob=[0,6,0,-6][phase]
 lean=[0,-3,0,2][phase]
 hand_spring=[0,7,3,-4][phase]
 parts.append(f'<g transform="translate({i%4*384},{i//4*512})">')
 parts.append('<path d="M20 480H364" stroke="#919a9c" stroke-width="1"/>')
 # The dashed construction axis continues through the pelvis and rear thigh.
 parts.append(f'<path d="M{252+lean} {161+bob}L175 {300+bob}L75 480" stroke="#dc9c36" stroke-width="2" stroke-dasharray="5 5"/>')
 def leg(points,color):
  knee,ankle=points
  parts.append(f'<path d="M175 {300+bob}L{knee[0]} {knee[1]}L{ankle[0]} {ankle[1]}" fill="none" stroke="{color}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>')
  parts.append(f'<path d="M{ankle[0]-7} {ankle[1]+5}L{ankle[0]+26} {ankle[1]+5}" fill="none" stroke="{color}" stroke-width="14" stroke-linecap="round"/>')
 leg(far,'#80728b')
 parts.append(f'<path d="M{239+lean} {185+bob}L175 {300+bob}" stroke="#55616b" stroke-width="47" stroke-linecap="round"/>')
 parts.append(f'<path d="M{235+lean} {192+bob}L{169+lean} {236+bob+hand_spring//2}L{106+hand_spring//2} {276+bob+hand_spring}" stroke="#6b7580" stroke-width="15" stroke-linecap="round" fill="none"/>')
 parts.append(f'<path d="M{245+lean} {198+bob}L{182+lean} {246+bob+hand_spring//2}L{118+hand_spring} {287+bob+hand_spring}" stroke="#425564" stroke-width="18" stroke-linecap="round" fill="none"/>')
 parts.append(f'<path d="M{243+lean} {184+bob}L{257+lean} {153+bob}" stroke="#667481" stroke-width="18"/>')
 parts.append(f'<g transform="translate({lean},{bob}) rotate({[0,2,0,-1][phase]},268,126)"><ellipse cx="268" cy="126" rx="29" ry="35" fill="#dae0e2" stroke="#50636d" stroke-width="3"/><path d="M294 123L307 138L293 141" fill="#dae0e2" stroke="#50636d" stroke-width="2"/><circle cx="288" cy="126" r="7" fill="none" stroke="#50636d" stroke-width="2"/></g>')
 leg(near,'#3294ac')
 parts.append(f'<text x="18" y="30" font-family="sans-serif" font-size="16" fill="#253d49">{i+1:02} {p["name"]} — {"NEAR" if i<4 else "FAR"} SUPPORT</text>')
 parts.append('<text x="18" y="507" font-family="sans-serif" font-size="10" fill="#68757b">cyan = near leg / purple = far leg / gold = continuous body axis</text></g>')
 records.append({'frame':i,'supportLeg':'near' if i<4 else 'far','phase':p['name'].lower(),'near':near,'far':far,'hip':[175,300+bob],'shoulder':[239+lean,185+bob],'upperBodyBob':bob,'wristFollowThrough':hand_spring})
parts.append('</svg>')
(root/'pose-guide.svg').write_text(''.join(parts))
(root/'gait-plan.json').write_text(json.dumps(records,indent=2)+'\n')
