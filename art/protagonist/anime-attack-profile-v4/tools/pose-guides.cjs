const fs=require('node:fs'),path=require('node:path');const {chromium}=require('playwright');const dir=path.resolve(__dirname,'..');
function ik(s,w,down=true){const dx=w[0]-s[0],dy=w[1]-s[1],d=Math.hypot(dx,dy),a=(74*74-73*73+d*d)/(2*d),h=Math.sqrt(Math.max(0,74*74-a*a));if(d>147)throw Error('unreachable arm '+d);const p=[s[0]+dx*a/d,s[1]+dy*a/d],A=[p[0]-dy*h/d,p[1]+dx*h/d],B=[p[0]+dy*h/d,p[1]-dx*h/d];return down?(A[1]>B[1]?A:B):(A[1]<B[1]?A:B);}
const hookHands=[[218,221],[208,302],[275,295],[319,253],[318,170],[250,96],[250,96],[250,96]];
const hookWrists=[[207,234],[195,303],[261,297],[304,259],[305,181],[245,112],[245,112],[245,112]];
const hook=hookHands.map((h,i)=>({s:[170,200+(i===1?20:i===2?12:0)],hip:[160,300+(i===1?22:i===2?12:0)],head:[201,141+(i===1?20:i===2?12:0)],near:h,nw:hookWrists[i],far:[245,215],fw:[232,225],rightAnkle:[85,480],leftKnee:[231,385],leftAnkle:[235,480]}));
const peak={...hook[5]};
const load={s:[205,260],hip:[170,340],head:[228,201],near:[184,312],nw:[170,304],far:[240,319],fw:[229,324],rightAnkle:[70,480],leftKnee:[267,398],leftAnkle:[270,480],chamber:true};
const hit={s:[220,330],hip:[200,420],head:[245,271],near:[220,488],nw:[220,474],far:[209,409],fw:[198,412],rightAnkle:[25,485],leftKnee:[300,400],leftAnkle:[260,480],straightRear:true,hiddenFar:true};
const slam=[peak,{s:[190,225],hip:[165,320],head:[213,166],near:[225,254],nw:[212,248],far:[240,285],fw:[228,294],rightAnkle:[80,480],leftKnee:[245,390],leftAnkle:[250,480]},load,{...load,head:[228,205]},{...load,head:[228,205]}, {...hit,s:[215,285],hip:[190,380],head:[238,226],near:[204,396],nw:[204,382],far:[208,372],fw:[197,380],leftKnee:[300,386],straightRear:false,hiddenFar:true}, {...hit,near:[220,455],nw:[220,441]},hit];
const reports={hook,slam};
function make(key,poses){let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"><rect width="1536" height="1024" fill="#f1f4f5"/>';
const line=(p,c,w)=>'<polyline points="'+p.map(x=>x.join(',')).join(' ')+'" fill="none" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/>';
for(let i=0;i<8;i++){const p=poses[i],farS=[p.s[0]+18,p.s[1]-4];p.ne=ik(p.s,p.nw,!p.chamber);p.fe=ik(farS,p.fw,true);p.farShoulder=farS;
svg+='<g transform="translate('+i%4*384+','+Math.floor(i/4)*512+')"><path d="M12 500 H375" stroke="#b9cbd0"/>';
svg+=line([p.hip,p.leftKnee,p.leftAnkle],'#8ea5ae',23)+'<path d="M'+(p.leftAnkle[0]-12)+' 498 h67" stroke="#607c8b" stroke-width="9" stroke-linecap="round"/>';
const rk=p.straightRear?[(p.hip[0]+p.rightAnkle[0])/2,(p.hip[1]+p.rightAnkle[1])/2]:[p.hip[0]-37,Math.min(445,p.hip[1]+95)];
svg+=line([p.hip,rk,p.rightAnkle],'#ac9a8f',25);
if(p.straightRear)svg+='<ellipse cx="'+(p.rightAnkle[0]+16)+'" cy="487" rx="25" ry="12" fill="#94745f" stroke="#5a473c"/><path d="M'+(p.rightAnkle[0]+16)+' 478 v17" stroke="#ede2d7" stroke-width="3"/>';
else svg+='<path d="M'+(p.rightAnkle[0]-10)+' 498 h50" stroke="#86654b" stroke-width="9" stroke-linecap="round"/>';
svg+=line([farS,p.fe,p.fw,p.far],'#1287ac',14)+'<circle cx="'+p.far[0]+'" cy="'+p.far[1]+'" r="11" fill="#1287ac"/>';
svg+=line([p.hip,p.s],'#bcc9cd',42)+'<ellipse cx="'+p.head[0]+'" cy="'+p.head[1]+'" rx="28" ry="42" fill="#dce6e9" stroke="#8ca2aa"/><path d="M'+(p.head[0]+27)+' '+(p.head[1]-7)+' l11 10 l-12 5" fill="#dce6e9" stroke="#8ca2aa"/>';
svg+=line([p.s,p.ne,p.nw,p.near],'#df7a2f',18)+'<circle cx="'+p.near[0]+'" cy="'+p.near[1]+'" r="11" fill="#df7a2f"/>';
svg+='<text x="12" y="20" font-family="sans-serif" font-size="12" fill="#a9551c">'+(i+1)+' RIGHT/NEAR orange</text><text x="12" y="37" font-family="sans-serif" font-size="12" fill="#086680">LEFT/FAR blue; far leg blue-gray</text>';
if(key==='hook'&&i===5)svg+='<path d="M264 92 h65 l-9 -5 m9 5 l-9 5" stroke="#b45626" fill="none"/><text x="258" y="72" font-family="sans-serif" font-size="10" fill="#9c4a21">BACK OF FIST OUT →</text>';
if(key==='slam'&&p.chamber)svg+='<text x="18" y="475" font-family="sans-serif" font-size="12" fill="#a9551c">RIGHT fist at WAIST; LEFT at abdomen</text>';
if(key==='slam'&&p.straightRear)svg+='<text x="70" y="465" font-family="sans-serif" font-size="11" fill="#73543a">RIGHT leg straight back; toe toward camera</text>';
svg+='</g>';
}svg+='</svg>';fs.writeFileSync(dir+'/'+key+'-pose-guide.svg',svg);return svg;}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await b.newPage({viewport:{width:1536,height:1024}});for(const [key,poses] of Object.entries(reports)){await p.setContent('<body style="margin:0">'+make(key,poses)+'</body>');await p.screenshot({path:dir+'/'+key+'-pose-guide.png'});}fs.writeFileSync(dir+'/pose-plan.json',JSON.stringify(reports,null,2)+'\n');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
