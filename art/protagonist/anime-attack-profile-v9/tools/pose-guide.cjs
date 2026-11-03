const fs=require('fs'),path=require('path'),{chromium}=require('playwright');const dir=path.resolve(__dirname,'..');
function knee(hip,ankle){const dx=ankle[0]-hip[0],dy=ankle[1]-hip[1],d=Math.hypot(dx,dy),h=Math.sqrt(96*96-d*d/4),mid=[(hip[0]+ankle[0])/2,(hip[1]+ankle[1])/2],a=[mid[0]-dy*h/d,mid[1]+dx*h/d],b=[mid[0]+dy*h/d,mid[1]-dx*h/d];return a[1]<b[1]?a:b;}
const feet=[[190,477],[235,425],[260,365],[298,240],[310,178],[260,365],[240,425],[225,477]];
const line=(p,c,w)=>`<polyline points="${p.map(v=>v.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"><rect width="1536" height="1024" fill="#f2f6f8"/>';
for(let i=0;i<8;i++){const hip=[180,310],farHip=[174,309],nearHip=[190,312],s=[175,207],head=[190,160],fa=feet[i],fk=knee(farHip,fa);const na=i===7?[125,477]:[250,477],nk=i===7?[157,403]:[230,390];
svg+=`<g transform="translate(${i%4*384} ${Math.floor(i/4)*512})"><path d="M8 490 H376" stroke="#bcced2"/>`;
svg+=line([farHip,fk,fa],'#238eb5',22)+line([[fa[0]-8,fa[1]+8],[fa[0]+26,fa[1]-3]],'#196581',11);
const farHand=i===0?[210,272]:[115,305],nearHand=i===0?[188,270]:[234,235];
svg+=line([[190,208],[143,268],farHand],'#238eb5',14);
svg+=line([hip,s],'#c1ced1',43)+`<ellipse cx="${head[0]}" cy="${head[1]}" rx="27" ry="37" fill="#dce6e8" stroke="#9aaeb3"/><path d="M213 154 l13 8 l-13 6" fill="#dce6e8" stroke="#9aaeb3"/>`;
svg+=line([nearHip,nk,na],'#dd7c30',25)+line([[na[0]-10,na[1]+8],[na[0]+28,na[1]+8]],'#a25b28',12)+line([[170,208],[172,265],nearHand],'#dd7c30',15);
svg+=`<text x="10" y="20" font-family="sans-serif" font-size="12">SOURCE${i+1}: LEFT/FAR leg blue strikes</text><text x="10" y="38" font-family="sans-serif" font-size="11" fill="#a45923">RIGHT/NEAR orange: support leg + FRONT hand</text><text x="10" y="55" font-family="sans-serif" font-size="11" fill="#1a6f90">LEFT/FAR blue: kicking leg + BACK hand</text></g>`;}
svg+='</svg>';fs.writeFileSync(dir+'/left-guide.svg',svg);
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await b.newPage({viewport:{width:1536,height:1024}});await p.setContent('<body style="margin:0">'+svg+'</body>');await p.screenshot({path:dir+'/left-guide.png'});}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
