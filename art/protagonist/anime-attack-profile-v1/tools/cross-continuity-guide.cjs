const fs=require('node:fs');const {chromium}=require('playwright');
const dir=require('node:path').resolve(__dirname,'..');
const near=[[212,145],[214,118],[214,118],[214,118],[214,118],[214,118],[213,132],[212,145]];
const far=[[237,120],[228,135],[294,143],[343,138],[345,138],[283,150],[237,123],[237,120]];
const elbows=[[198,202],[179,200],[244,174],[266,138],[267,138],[238,177],[200,200],[198,202]];
let s='<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"><rect width="1536" height="1024" fill="#f3f5f5"/>';
for(let i=0;i<8;i++){
 const x=i%4*384,y=Math.floor(i/4)*512;
 const poly=(a,c)=>'<polyline points="'+a.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="'+c+'" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>';
 s+='<g transform="translate('+x+','+y+')"><path d="M28 494 H365" stroke="#adbfc1"/>';
 s+=poly([[167,280],[126,390],[100,488]],'#93a2a6')+poly([[167,280],[242,365],[257,488]],'#93a2a6');
 s+=poly([[190,140],elbows[i],far[i]],'#087fa5');
 s+='<path d="M145 139 Q168 118 190 140 L181 275 L148 282 Z" fill="#bec9cc"/><ellipse cx="198" cy="73" rx="32" ry="48" fill="#dce5e7" stroke="#82959b" stroke-width="2"/><path d="M228 67 L241 76 L228 79" fill="#dce5e7" stroke="#82959b" stroke-width="2"/>';
 s+=poly([[171,139],[180,202],near[i]],'#df7629');
 s+='<circle cx="'+far[i][0]+'" cy="'+far[i][1]+'" r="13" fill="#087fa5"/><circle cx="'+near[i][0]+'" cy="'+near[i][1]+'" r="13" fill="#df7629"/>';
 s+='<text x="12" y="24" font-family="sans-serif" font-size="12" fill="#087fa5">'+(i+1)+' — FAR BLUE HAND 2 punches</text><text x="12" y="41" font-family="sans-serif" font-size="12" fill="#c46724">NEAR ORANGE HAND 1 only guards</text></g>';
}
s+='</svg>';fs.writeFileSync(dir+'/attack2-continuity-guide.svg',s);
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const p=await b.newPage({viewport:{width:1536,height:1024},deviceScaleFactor:1});await p.setContent('<body style="margin:0">'+s+'</body>');await p.screenshot({path:dir+'/attack2-continuity-guide.png'});await b.close();})();
