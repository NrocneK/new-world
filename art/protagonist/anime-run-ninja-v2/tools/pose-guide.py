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
 parts.append(f'<g transform="translate({i%4*384},{i//4*512})">')
 parts.append('<path d="M20 480H364" stroke="#919a9c" stroke-width="1"/>')
 # The dashed construction axis continues through the pelvis and rear thigh.
 parts.append('<path d="M252 161L175 300L75 480" stroke="#dc9c36" stroke-width="2" stroke-dasharray="5 5"/>')
 def leg(points,color):
  knee,ankle=points
  parts.append(f'<path d="M175 300L{knee[0]} {knee[1]}L{ankle[0]} {ankle[1]}" fill="none" stroke="{color}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>')
  parts.append(f'<path d="M{ankle[0]-7} {ankle[1]+5}L{ankle[0]+26} {ankle[1]+5}" fill="none" stroke="{color}" stroke-width="14" stroke-linecap="round"/>')
 leg(far,'#80728b')
 parts.append('<path d="M239 185L175 300" stroke="#55616b" stroke-width="47" stroke-linecap="round"/>')
 parts.append('<path d="M235 192L169 236L106 276" stroke="#6b7580" stroke-width="15" stroke-linecap="round" fill="none"/>')
 parts.append('<path d="M245 198L182 246L118 287" stroke="#425564" stroke-width="18" stroke-linecap="round" fill="none"/>')
 parts.append('<path d="M243 184L257 153" stroke="#667481" stroke-width="18"/>')
 parts.append('<ellipse cx="268" cy="126" rx="29" ry="35" fill="#dae0e2" stroke="#50636d" stroke-width="3"/><path d="M294 123L307 138L293 141" fill="#dae0e2" stroke="#50636d" stroke-width="2"/><circle cx="288" cy="126" r="7" fill="none" stroke="#50636d" stroke-width="2"/>')
 leg(near,'#3294ac')
 parts.append(f'<text x="18" y="30" font-family="sans-serif" font-size="16" fill="#253d49">{i+1:02} {p["name"]} — {"NEAR" if i<4 else "FAR"} SUPPORT</text>')
 parts.append('<text x="18" y="507" font-family="sans-serif" font-size="10" fill="#68757b">cyan = near leg / purple = far leg / gold = continuous body axis</text></g>')
 records.append({'frame':i,'supportLeg':'near' if i<4 else 'far','phase':p['name'].lower(),'near':near,'far':far,'hip':[175,300],'shoulder':[239,185]})
parts.append('</svg>')
(root/'pose-guide.svg').write_text(''.join(parts))
(root/'gait-plan.json').write_text(json.dumps(records,indent=2)+'\n')
