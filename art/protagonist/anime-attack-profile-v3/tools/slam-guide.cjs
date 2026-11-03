const fs=require('node:fs'),path=require('node:path');const {chromium}=require('playwright');const dir=path.resolve(__dirname,'..');
function ik(s,w,down=true){const dx=w[0]-s[0],dy=w[1]-s[1],d=Math.hypot(dx,dy),l=74,m=73;if(d>l+m)throw Error('arm unreachable '+d);const a=(l*l-m*m+d*d)/(2*d),h=Math.sqrt(Math.max(0,l*l-a*a)),p=[s[0]+dx*a/d,s[1]+dy*a/d];const A=[p[0]-dy*h/d,p[1]+dx*h/d],B=[p[0]+dy*h/d,p[1]-dx*h/d];return down?(A[1]>B[1]?A:B):(A[1]<B[1]?A:B);}
const poses=[
 {s:[170,200],hip:[160,300],head:[201,141],n:[235,60],nw:[230,74],f:[245,212],fw:[232,222],up:true},
 {s:[190,230],hip:[164,320],head:[221,171],n:[245,90],nw:[240,104],f:[245,245],fw:[232,255],up:true},
 {s:[233,280],hip:[170,335],head:[254,225],n:[250,430],nw:[250,415],f:[116,260],fw:[130,264]},
 {s:[240,321],hip:[170,340],head:[260,260],n:[250,478],nw:[250,464],f:[120,266],fw:[134,270]},
 {s:[240,321],hip:[170,340],head:[260,260],n:[250,478],nw:[250,464],f:[120,266],fw:[134,270]},
 {s:[240,321],hip:[170,340],head:[260,260],n:[250,478],nw:[250,464],f:[120,266],fw:[134,270]},
 {s:[222,255],hip:[165,318],head:[243,200],n:[265,380],nw:[265,365],f:[230,255],fw:[217,265]},
 {s:[170,200],hip:[160,300],head:[201,141],n:[218,221],nw:[207,234],f:[245,195],fw:[232,205]},
];
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"><rect width="1536" height="1024" fill="#f1f4f5"/>';
for(let i=0;i<8;i++){const p=poses[i],farS=[p.s[0]+18,p.s[1]-3],ne=ik(p.s,p.nw,!p.up),fe=ik(farS,p.fw,!(i>=2&&i<=5));p.nearElbow=ne;p.farShoulder=farS;p.farElbow=fe;
 const ln=(pts,c,w)=>'<polyline points="'+pts.map(x=>x.join(',')).join(' ')+'" fill="none" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/>';
 svg+='<g transform="translate('+i%4*384+','+Math.floor(i/4)*512+')"><path d="M24 490 H366" stroke="#b8cbd0"/>';
 const low=i>=2&&i<=5,rx=low?65:85,fx=low?299:235;
 svg+=ln([p.hip,[low?155:123,low?436:390],[rx,480]],'#9babaf',23)+ln([p.hip,[low?270:231,low?382:385],[fx,480]],'#899fa8',23);
 svg+='<path d="M'+(rx-8)+' 489 H'+(rx+40)+' M'+(fx-10)+' 489 H'+(fx+42)+'" stroke="#647b86" stroke-width="9" stroke-linecap="round"/>';
 svg+=ln([farS,fe,p.fw,p.f],'#1287ac',14);
 svg+=ln([p.hip,p.s],'#b8c7cc',37)+'<ellipse cx="'+p.head[0]+'" cy="'+p.head[1]+'" rx="28" ry="42" fill="#dce6e9" stroke="#8ca2aa"/><path d="M'+(p.head[0]+27)+' '+(p.head[1]-7)+' l11 10 l-12 5" fill="#dce6e9" stroke="#8ca2aa"/>';
 svg+=ln([p.s,ne,p.nw,p.n],'#df7a2f',18);
 for(const [h,c] of [[p.f,'#1287ac'],[p.n,'#df7a2f']])svg+='<circle cx="'+h[0]+'" cy="'+h[1]+'" r="11" fill="'+c+'"/>';
 svg+='<text x="12" y="20" font-family="sans-serif" font-size="12" fill="#a9551c">'+(i+1)+' RIGHT/NEAR raised then DOWN</text><text x="12" y="37" font-family="sans-serif" font-size="12" fill="#086680">LEFT/FAR free arm behind</text></g>';
}svg+='</svg>';fs.writeFileSync(dir+'/slam-anatomy-guide.svg',svg);fs.writeFileSync(dir+'/slam-anatomy-plan.json',JSON.stringify(poses,null,2)+'\n');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await b.newPage({viewport:{width:1536,height:1024}});await p.setContent('<body style="margin:0">'+svg+'</body>');await p.screenshot({path:dir+'/slam-anatomy-guide.png'});}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
