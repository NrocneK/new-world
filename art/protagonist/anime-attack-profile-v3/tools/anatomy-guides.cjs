const fs=require('node:fs'),path=require('node:path');const {chromium}=require('playwright');
const dir=path.resolve(__dirname,'..');
function elbow(s,w,upper=74,lower=73,down=true){const dx=w[0]-s[0],dy=w[1]-s[1],d=Math.hypot(dx,dy);if(d>upper+lower)throw Error('Unreachable arm');const along=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-along*along));const p=[s[0]+dx/d*along,s[1]+dy/d*along];const a=[p[0]-dy/d*h,p[1]+dx/d*h],b=[p[0]+dy/d*h,p[1]-dx/d*h];return down?(a[1]>b[1]?a:b):(a[0]<b[0]?a:b);}
const nearHands=[[218,221],[218,195],[218,195],[218,195],[218,195],[218,195],[218,207],[218,221]];
const farHands=[[245,195],[245,195],[298,213],[349,200],[349,200],[298,213],[245,195],[245,195]];
const upperHands=[[218,221],[208,314],[212,335],[234,165],[235,60],[235,60],[235,60],[235,60]];
const reports={};
function build(key){let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"><rect width="1536" height="1024" fill="#f1f4f5"/>';const frames=[];
for(let i=0;i<8;i++){
 const isUpper=key==='uppercut';let dy=isUpper?[0,25,40,5,0,0,0,0][i]:0;
 const nearS=[170,200+dy],farS=[193,200+dy];let nearH=isUpper?upperHands[i]:nearHands[i],farH=isUpper?[245,212+dy]:farHands[i];
 let nearW=isUpper&&i>=3?[nearH[0]-5,nearH[1]+14]:[nearH[0]-11,nearH[1]+13],farW=[farH[0]-13,farH[1]+(i===3||i===4?0:10)];
 if(isUpper&&i===0)nearW=[207,230];
 const nearE=elbow(nearS,nearW,74,73,isUpper&&i>=4?false:true),farE=elbow(farS,farW);
 frames.push({index:i,near:{side:'right',shoulder:nearS,elbow:nearE,wrist:nearW,fist:nearH},far:{side:'left',shoulder:farS,elbow:farE,wrist:farW,fist:farH},lengths:{upper:74,forearm:73}});
 const line=(p,c,w)=>'<polyline points="'+p.map(x=>x.join(',')).join(' ')+'" fill="none" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/>';
 svg+='<g transform="translate('+i%4*384+','+Math.floor(i/4)*512+')"><path d="M24 490 H365" stroke="#afc3c8"/>';
 svg+=line([[162,300+dy],[123,390+dy*.2],[85,480]],'#a5b2b6',23)+line([[168,300+dy],[231,385+dy*.2],[235,480]],'#8fa2a8',23);
 svg+='<path d="M76 489 H128 M225 489 H277" stroke="#677e88" stroke-width="9" stroke-linecap="round"/>';
 svg+=line([farS,farE,farW], '#1287ac',14);
 svg+='<path d="M147 '+(199+dy)+' Q169 '+(183+dy)+' 193 '+(200+dy)+' L179 '+(300+dy)+' L145 '+(302+dy)+' Z" fill="#b8c7cc"/><path d="M179 '+(195+dy)+' L183 '+(179+dy)+'" stroke="#9bafb6" stroke-width="12"/><ellipse cx="201" cy="'+(141+dy)+'" rx="28" ry="42" fill="#dce6e9" stroke="#8ca2aa"/><path d="M228 '+(133+dy)+' L239 '+(143+dy)+' L227 '+(148+dy)+'" fill="#dce6e9" stroke="#8ca2aa"/>';
 svg+=line([nearS,nearE,nearW],'#df7a2f',18);
 for(const [s,e,w,h,c] of [[farS,farE,farW,farH,'#1287ac'],[nearS,nearE,nearW,nearH,'#df7a2f']]){svg+=line([w,h],c,13)+'<circle cx="'+h[0]+'" cy="'+h[1]+'" r="11" fill="'+c+'"/>';for(const p of [s,e,w])svg+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="#fefefe"/>';}
 svg+='<text x="12" y="20" font-family="sans-serif" font-size="12" fill="#a9551c">'+(i+1)+' RIGHT / NEAR / hand1 orange</text><text x="12" y="37" font-family="sans-serif" font-size="12" fill="#086680">LEFT / FAR / hand2 blue</text></g>';
}
svg+='</svg>';fs.writeFileSync(path.join(dir,key+'-anatomy-guide.svg'),svg);reports[key]=frames;return svg;}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await b.newPage({viewport:{width:1536,height:1024}});for(const key of ['cross','uppercut']){await p.setContent('<body style="margin:0">'+build(key)+'</body>');await p.screenshot({path:path.join(dir,key+'-anatomy-guide.png')});}fs.writeFileSync(path.join(dir,'anatomy-plan.json'),JSON.stringify(reports,null,2)+'\n');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
