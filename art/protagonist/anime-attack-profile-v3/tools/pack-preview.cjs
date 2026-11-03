// Whole-cel packing; no articulated deformations or palette edits.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright'),{spawnSync}=require('node:child_process');
const {setGifDelays}=require('./gif-timing.cjs');
const dir=path.resolve(__dirname,'..'),keys=['attack1','attack2','attack3','attack4'];
const names=['Đấm thẳng · Tay phải / gần','Đấm thẳng · Tay trái / xa','Đấm móc · Tay phải','Đấm đất · Cùng tay phải'];
const W=512,H=640,stage={width:768,height:848,actorX:96,actorY:20,floorY:640};
const save=(file,b64)=>fs.writeFileSync(path.join(dir,file),Buffer.from(b64,'base64'));
function encode(input,out,durations){
 const temp=out+'.encoded.gif';
 const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-framerate','25','-i',input,'-filter_complex','split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a','-loop','-1','-gifflags','-offsetting',temp],{encoding:'utf8'});
 if(r.status!==0)throw Error(r.stderr);
 const raw=fs.readFileSync(temp);fs.writeFileSync(out,setGifDelays(raw,durations));
 fs.writeFileSync(out.replace('.gif','-slow.gif'),setGifDelays(raw,durations.map(t=>t*2)));fs.unlinkSync(temp);
}
(async()=>{
 const registrations=keys.map(k=>JSON.parse(fs.readFileSync(path.join(dir,k+'-registration.json'))));
 const plan=JSON.parse(fs.readFileSync(path.join(dir,'combat-plan.json')));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});let data;
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/');
  data=await page.evaluate(async({keys,registrations,names,W,H,stage})=>{
   const make=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
   const png=c=>c.toDataURL('image/png').split(',')[1];
   const sources=await Promise.all(keys.map(async k=>{const im=new Image();im.src='/art/protagonist/anime-attack-profile-v3/'+k+'-source.png';await im.decode();return im;}));
   const cells=keys.map((k,a)=>registrations[a].frames.map(f=>{
    const c=make(W,H),g=c.getContext('2d');g.drawImage(sources[a],f.sourceX,f.sourceY,f.sourceWidth,512,f.offsetX,f.offsetY,f.sourceWidth*f.uniformScale,512*f.uniformScale);return c;
   }));
   const guard=cells[0][0],peak=cells[2][4];
   cells[0][7]=guard;cells[1][0]=guard;cells[1][7]=guard;
   cells[2][0]=guard;cells[2][7]=peak;cells[3][0]=peak;cells[3][7]=guard;
   // Reverse the same reviewed in-between pose on recovery, including its
   // corrected left fist, instead of reintroducing the unused raw cel6 hand.
   cells[3][6]=cells[3][2];
   const all=make(W*4,H*8),combined=all.getContext('2d'),actions=[];
   for(let a=0;a<4;a++){
    const atlas=make(W*4,H*2),g=atlas.getContext('2d'),previews=[];
    for(let i=0;i<8;i++){
     g.drawImage(cells[a][i],i%4*W,Math.floor(i/4)*H);
     const c=make(stage.width,stage.height),p=c.getContext('2d');
     p.fillStyle='#13252d';p.fillRect(0,0,c.width,c.height);p.strokeStyle='#486467';p.beginPath();p.moveTo(24,stage.floorY+.5);p.lineTo(c.width-24,stage.floorY+.5);p.stroke();
     p.drawImage(cells[a][i],stage.actorX,stage.actorY);
     p.fillStyle='#c3d9cd';p.font='13px sans-serif';p.fillText(names[a],24,25);
     p.fillStyle='#9ab5af';p.font='13px monospace';p.fillText(String(i+1).padStart(2,'0')+' / 08',24,817);p.fillText('CHARACTER / ONE SHOT',c.width-198,817);previews.push(png(c));
    }
    combined.drawImage(atlas,0,a*H*2);actions.push({atlas:png(atlas),previews});
   }
   return {actions,guard:png(guard),peak:png(peak),slamStart:png(cells[3][0]),atlas:png(all)};
  },{keys,registrations,names,W,H,stage});
 }finally{await browser.close();}
 save('combat-sheet.png',data.atlas);save('guard.png',data.guard);save('uppercut-peak.png',data.peak);save('slam-start.png',data.slamStart);
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'di-mon-attack-v3-')),allDurations=[];
 try{
  for(let a=0;a<4;a++){
   const key=keys[a],frames=path.join(dir,key,'frames');fs.mkdirSync(frames,{recursive:true});save(key+'-sheet.png',data.actions[a].atlas);
   for(let i=0;i<8;i++){
    save(key+'/frames/frame-'+String(i).padStart(2,'0')+'.png',data.actions[a].previews[i]);
    fs.writeFileSync(path.join(temp,'frame-'+String(a*8+i).padStart(2,'0')+'.png'),Buffer.from(data.actions[a].previews[i],'base64'));
   }
   const durations=plan.actions[key].duration;allDurations.push(...durations);encode(path.join(frames,'frame-%02d.png'),path.join(dir,key+'-preview.gif'),durations);
  }
  encode(path.join(temp,'frame-%02d.png'),path.join(dir,'combo-preview.gif'),allDurations);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
 const actions=Object.fromEntries(keys.map((key,a)=>{
  const p=plan.actions[key];let time=0;
  const phases=key==='attack4'?['uppercut-peak','load-from-peak','downstroke','approach-ground','contact-ground','settle','recover','guard']:key==='attack3'?['guard','dip','chamber','drive-up','high-peak','hold-peak','hold-peak','uppercut-peak']:['guard','load','drive','contact','follow-through','recoil','recover','guard'];
  const frames=p.duration.map((durationMs,i)=>{
   const peak=(key==='attack4'&&i===0)||(key==='attack3'&&i===7),source=peak?'shared-uppercut-peak':key==='attack4'&&i===6?'reused-downstroke-pose':i===0||i===7?'shared-guard':'generated';
   const f={index:i,x:i%4*W,y:Math.floor(i/4)*H,w:W,h:H,durationMs,startMs:time,phase:phases[i],source};time+=durationMs;return f;
  });
  return [key,{key,name:names[a],image:key+'-sheet.png',gif:key+'-preview.gif',loop:false,onComplete:key==='attack3'?'uppercut-peak':'guard',durationMs:p.durationMs,impact:{frameIndex:p.impactFrame,timeMs:frames[p.impactFrame].startMs,fist:key==='attack3'?[250,75]:key==='attack4'?[300,600]:[350,260],direction:key==='attack4'?'down':key==='attack3'?'up':'forward'},frames}];
 }));
 const metadata={version:1,reviewRevision:3,image:'combat-sheet.png',columns:4,rows:8,frameWidth:W,frameHeight:H,groundY:620,loop:false,durationMs:allDurations.reduce((a,b)=>a+b,0),view:'side-profile',direction:'right',combo:keys,guardImage:'guard.png',peakImage:'uppercut-peak.png',stage,vfxManifest:'../../vfx/air-pressure-v2/manifest.json',handConvention:{near:'right/hand1',far:'left/hand2'},transitions:{attack3ToAttack4:{peak:{action:'attack3',frameIndex:4},from:{action:'attack3',frameIndex:7},to:{action:'attack4',frameIndex:0},kind:'identical full cel',strikingArm:'right/near'}},actions};
 fs.writeFileSync(path.join(dir,'combat-sheet.json'),JSON.stringify(metadata,null,2)+'\n');
 console.log('Packed32 full cels; exact uppercut->slam peak shared; PNG '+(fs.statSync(path.join(dir,'combat-sheet.png')).size/1024**2).toFixed(2)+'MiB.');
})().catch(e=>{console.error(e);process.exitCode=1;});
