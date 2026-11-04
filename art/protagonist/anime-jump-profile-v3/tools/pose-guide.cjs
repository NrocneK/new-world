const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const dir=path.resolve(__dirname,'..');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),p=await b.newPage();try{const data=await p.evaluate(()=>{
 const rad=a=>a*Math.PI/180,L1=94,L2=98;
 const leg=(h,t,s)=>{const k=[h[0]+L1*Math.sin(rad(t)),h[1]+L1*Math.cos(rad(t))];return[h,k,[k[0]+L2*Math.sin(rad(s)),k[1]+L2*Math.cos(rad(s))]];};
 const ik=(h,a)=>{const dx=a[0]-h[0],dy=a[1]-h[1],d=Math.hypot(dx,dy),along=(L1*L1-L2*L2+d*d)/(2*d),off=Math.sqrt(Math.max(0,L1*L1-along*along)),mx=h[0]+dx*along/d,my=h[1]+dy*along/d;return[h,[mx+dy*off/d,my-dx*off/d],a];};
 const poses=[
  {label:'04 RISE / RIGHT LEG STILL LONG',h:[180,270],r:[0,0],l:[90,0],arms:2},
  {label:'05 RIGHT KNEE LIFTS FORWARD 20deg',h:[180,270],r:[20,0],l:[90,0],arms:2},
  {label:'06 RIGHT KNEE LIFTS FORWARD 45deg',h:[180,270],r:[45,0],l:[90,0],arms:2},
  {label:'07 APEX / RIGHT THIGH FORWARD 65deg',h:[180,270],r:[65,-10],l:[90,0],arms:3},
  {label:'08 FALL START / RIGHT STAYS FORWARD',h:[180,270],r:[65,-10],l:[72,5],arms:3},
  {label:'09 LEFT OPENS DOWN / RIGHT FORWARD',h:[180,270],r:[55,-10],l:[42,0],arms:3},
  {label:'10 LEFT READY / RIGHT LOWERS AHEAD',h:[180,270],r:[35,-10],l:[10,0],arms:3},
  {label:'11 LEFT CONTACT / RIGHT STILL UP',h:[180,276],r:[20,-10],al:[188,468],arms:3},
 ];
 const images=[];for(let part=0;part<1;part++){const c=document.createElement('canvas');c.width=1536;c.height=1024;const g=c.getContext('2d');g.fillStyle='#17252d';g.fillRect(0,0,c.width,c.height);
 for(let j=0;j<8;j++){const i=part*8+j,o=poses[i],cx=j%4*384,cy=Math.floor(j/4)*512;g.save();g.translate(cx,cy);const near=o.ar?ik(o.h,o.ar):leg(o.h,...o.r),farHip=[o.h[0]+8,o.h[1]],far=o.al?ik(farHip,o.al):leg(farHip,...o.l);
 const chain=(pts,col,w)=>{g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(...pts[0]);for(const v of pts.slice(1))g.lineTo(...v);g.stroke();for(const v of pts){g.fillStyle='#101820';g.strokeStyle=col;g.lineWidth=3;g.beginPath();g.arc(...v,5,0,Math.PI*2);g.fill();g.stroke();}};
 chain(far,'#4ed4f0',15);chain([far[2],[far[2][0]+24,far[2][1]+3]],'#4ed4f0',12);
 const lean=0,shoulder=[o.h[0]+lean,o.h[1]-128],head=[shoulder[0]+8,shoulder[1]-52];chain([o.h,shoulder],'#c6d2d7',23);
 g.strokeStyle='#c6d2d7';g.lineWidth=3;g.beginPath();g.ellipse(...head,30,37,0,0,Math.PI*2);g.stroke();chain([[head[0]+24,head[1]],[head[0]+38,head[1]+6],[head[0]+23,head[1]+11]],'#c6d2d7',3);
 const a=o.arms,elbow=a===0?[shoulder[0]-5,shoulder[1]+64]:a===1?[shoulder[0]-35,shoulder[1]+50]:a===2?[shoulder[0]+55,shoulder[1]+35]:[shoulder[0]+55,shoulder[1]+58],hand=a===0?[shoulder[0]+3,shoulder[1]+128]:a===1?[shoulder[0]-68,shoulder[1]+105]:a===2?[shoulder[0]+64,shoulder[1]-30]:[shoulder[0]+100,shoulder[1]+25];
 chain([[shoulder[0]+8,shoulder[1]-4],[elbow[0]+7,elbow[1]-6],[hand[0]+8,hand[1]-6]],'#4ed4f0',10);chain(near,'#ff84a9',16);chain([near[2],[near[2][0]+24,near[2][1]+3]],'#ff84a9',12);chain([shoulder,elbow,hand],'#ff84a9',11);
 g.fillStyle='#ffffff';g.font='11px monospace';g.fillText(o.label,12,490);g.font='10px monospace';g.fillStyle='#ff84a9';g.fillText('PINK: RIGHT / NEAR',12,17);g.fillStyle='#4ed4f0';g.fillText('CYAN: LEFT / FAR',206,17);g.restore();
 }images.push(c.toDataURL().split(',')[1]);}return images;
});data.forEach((d,i)=>fs.writeFileSync(path.join(dir,'forward-knee-guide.png'),Buffer.from(d,'base64')));}finally{await b.close();}})();
