const fs=require('fs'),path=require('path'),{chromium}=require('playwright');const dir=path.resolve(__dirname,'..');
const yaw=[0,30,60,90,120,150,180,210,240,270,300,330,360,360,360,360];
const views=['right-profile','rear-right-three-quarter','near-back','BACK','back-left-three-quarter','near-left-profile','LEFT-PROFILE','front-left-three-quarter','near-front','FRONT','front-right-three-quarter','high-sweep-front-right','high-sweep-right','retract-right','lower-foot-right','guard-right'];
const line=(pts,c,w)=>`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const point=(p,c,r)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${c}"/>`;
function cel(i){const rad=yaw[i]*Math.PI/180,s=Math.sin(rad),c=Math.cos(rad),hip=[185,314],sx=185-(i>=10&&i<=12?24:0),shoulder=[sx,205],head=[sx+15*c,157],ns=[sx+23*s,207],fs=[sx-23*s,205],nh=[185+14*s,314],fh=[185-14*s,314];let nk,na;
if(i<=1||i===15){nk=[158,405];na=[120,477];}
else if(i>=10&&i<=12){const extension=i===10?.55:1;nk=[nh[0]+68*c*extension,245];na=[nh[0]+155*c*extension,166];}
else if(i===14){nk=[187,402];na=[145,460];}
else{nk=[nh[0]+78*c,277];na=[nh[0]+48*c,374];}
const fa=[245,477],fk=[234,388];let svg='<g transform="translate('+i%4*384+' '+Math.floor(i%8/4)*512+')"><path d="M8 490 H376" stroke="#c0cdd0"/>';
svg+=line([fh,fk,fa],'#2a91b8',24)+line([[235,485],[265,485]],'#22647f',10);
const farArm=line([fs,[fs[0]-5*c,255],[fs[0]+40*c,232]],'#258bb5',14);
const nearArm=line([ns,[ns[0]-15*c,261],[ns[0]+35*c,235]],'#d97c35',15);
svg+=farArm+line([hip,shoulder],'#c3cccf',Math.max(36,45+14*Math.abs(s)))+line([nh,nk,na],'#dd8037',24)+line([[na[0]-10,na[1]+8],[na[0]+25*c,na[1]+8]],'#96562b',12);
svg+=`<ellipse cx="${head[0]}" cy="${head[1]}" rx="27" ry="37" fill="#dae4e6" stroke="#92a1a6"/>`;
if(Math.abs(c)>.35)svg+=`<path d="M${head[0]+c*24} ${head[1]-5} l${c*12} 9 l${-c*12} 5" fill="#dae4e6" stroke="#92a1a6"/>`;
if(s<-.35){svg+=`<circle cx="${head[0]-10}" cy="${head[1]-4}" r="8" fill="none" stroke="#64767b"/><circle cx="${head[0]+10}" cy="${head[1]-4}" r="8" fill="none" stroke="#64767b"/>`+line([[sx,220],[hip[0],302]],'#fff',3);}
svg+=nearArm+`<text x="10" y="20" font-family="sans-serif" font-size="12">${String(i+1).padStart(2,'0')} · ${yaw[i]}deg · ${views[i]}</text><text x="10" y="38" font-family="sans-serif" font-size="11" fill="#a95f27">RIGHT strikes / orange; LEFT pivot / blue</text></g>`;return svg;}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await b.newPage({viewport:{width:1536,height:1024}});for(let part=0;part<2;part++){let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"><rect width="1536" height="1024" fill="#f2f6f8"/>';for(let i=part*8;i<part*8+8;i++)svg+=cel(i);svg+='</svg>';fs.writeFileSync(dir+'/turn-'+part+'-guide.svg',svg);await p.setContent('<body style="margin:0">'+svg+'</body>');await p.screenshot({path:dir+'/turn-'+part+'-guide.png'});}fs.writeFileSync(dir+'/turn-plan.json',JSON.stringify({yawDegrees:yaw,views,strikingLeg:'right',supportLeg:'left'},null,2)+'\n');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
