// Whole-cel packing, shared guard endpoints and character-only one-shot GIFs.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright');const {spawnSync}=require('node:child_process');
const {setGifDelays}=require('./gif-timing.cjs');
const dir=path.resolve(__dirname,'..'),keys=['attack1','attack2','attack3','attack4'];
const names=['Đấm thẳng · Tay 1','Đấm thẳng · Tay 2','Đấm móc','Đấm đất · Một tay'];
function writePng(file,b64){fs.writeFileSync(file,Buffer.from(b64,'base64'));}
function encode(input,out,durations){
 const temp=out+'.encoded.gif';
 const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-framerate','25','-i',input,'-filter_complex','split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a','-loop','-1','-gifflags','-offsetting',temp],{encoding:'utf8'});
 if(r.status!==0)throw Error(r.stderr);
 const raw=fs.readFileSync(temp);fs.writeFileSync(out,setGifDelays(raw,durations));
 fs.writeFileSync(out.replace('.gif','-slow.gif'),setGifDelays(raw,durations.map(t=>t*2)));fs.unlinkSync(temp);
}
(async()=>{
 const registrations=keys.map(key=>JSON.parse(fs.readFileSync(path.join(dir,key+'-registration.json'))));
 const plan=JSON.parse(fs.readFileSync(path.join(dir,'combat-plan.json')));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});let data;
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/');
  data=await page.evaluate(async({keys,registrations,names})=>{
   const sources=await Promise.all(keys.map(async key=>{const im=new Image();im.src='/art/protagonist/anime-attack-profile-v1/'+key+'-source.png';await im.decode();return im;}));
   const all=document.createElement('canvas');all.width=2048;all.height=4096;const out=all.getContext('2d');
   const guard=document.createElement('canvas');guard.width=512;guard.height=512;const g=guard.getContext('2d');
   const actions=[];
   for(let a=0;a<4;a++){
    const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=1024;const c=atlas.getContext('2d'),previews=[];
    for(let i=0;i<8;i++){
     const f=registrations[a].frames[i],x=i%4*512,y=Math.floor(i/4)*512;
     c.save();c.beginPath();c.rect(x,y,512,512);c.clip();
     if((a>0&&i===0)||i===7)c.drawImage(guard,x,y);
     else c.drawImage(sources[a],f.sourceX,f.sourceY,f.sourceWidth,512,x+f.offsetX,y+f.offsetY,f.sourceWidth*f.uniformScale,512*f.uniformScale);
     c.restore();
     if(a===0&&i===0)g.drawImage(atlas,0,0,512,512,0,0,512,512);
     const stage=document.createElement('canvas');stage.width=640;stage.height=720;const p=stage.getContext('2d');
     p.fillStyle='#13252d';p.fillRect(0,0,640,720);p.strokeStyle='#486467';p.beginPath();p.moveTo(24,520.5);p.lineTo(616,520.5);p.stroke();
     p.drawImage(atlas,x,y,512,512,32,20,512,512);
     p.fillStyle='#c3d9cd';p.font='13px sans-serif';p.fillText(names[a],24,25);
     p.fillStyle='#9ab5af';p.font='13px monospace';p.fillText(String(i+1).padStart(2,'0')+' / 08',24,689);p.fillText('CHARACTER / ONE SHOT',442,689);
     previews.push(stage.toDataURL('image/png').split(',')[1]);
    }
    out.drawImage(atlas,0,a*1024);actions.push({atlas:atlas.toDataURL('image/png').split(',')[1],previews});
   }
   return {actions,guard:guard.toDataURL('image/png').split(',')[1],atlas:all.toDataURL('image/png').split(',')[1]};
  },{keys,registrations,names});
 }finally{await browser.close();}
 writePng(path.join(dir,'combat-sheet.png'),data.atlas);writePng(path.join(dir,'guard.png'),data.guard);
 const comboDir=fs.mkdtempSync(path.join(os.tmpdir(),'di-mon-attack-combo-'));const comboDurations=[];
 try{
  for(let a=0;a<4;a++){
   const key=keys[a],frameDir=path.join(dir,key,'frames');fs.mkdirSync(frameDir,{recursive:true});writePng(path.join(dir,key+'-sheet.png'),data.actions[a].atlas);
   data.actions[a].previews.forEach((b64,i)=>{const name='frame-'+String(i).padStart(2,'0')+'.png';writePng(path.join(frameDir,name),b64);writePng(path.join(comboDir,'frame-'+String(a*8+i).padStart(2,'0')+'.png'),b64);});
   const durations=plan.actions[key].duration;comboDurations.push(...durations);
   encode(path.join(frameDir,'frame-%02d.png'),path.join(dir,key+'-preview.gif'),durations);
  }
  encode(path.join(comboDir,'frame-%02d.png'),path.join(dir,'combo-preview.gif'),comboDurations);
 }finally{fs.rmSync(comboDir,{recursive:true,force:true});}
 const actions=Object.fromEntries(keys.map((key,a)=>{
  const p=plan.actions[key];let time=0;
  const phases=key==='attack4'?['guard','load','raise-one-fist','downstroke','contact-ground','settle','recover','guard']:key==='attack3'?['guard','dip','chamber','drive-up','contact','follow-up','recover','guard']:['guard','load','drive','contact','follow-through','recoil','recover','guard'];
  const frames=p.duration.map((durationMs,i)=>{const f={index:i,x:i%4*512,y:Math.floor(i/4)*512,w:512,h:512,durationMs,startMs:time,phase:phases[i],source:i===0||i===7?'shared-guard':'generated'};time+=durationMs;return f;});
  return [key,{key,name:names[a],image:key+'-sheet.png',gif:key+'-preview.gif',loop:false,onComplete:'guard',durationMs:p.durationMs,impact:{frameIndex:p.impactFrame,timeMs:frames[p.impactFrame].startMs,fist:p.frames[p.impactFrame].nearFist,direction:key==='attack4'?'down':key==='attack3'?'up':'forward'},frames}];
 }));
 actions.attack2.impact.fist=plan.actions.attack2.frames[plan.actions.attack2.impactFrame].farFist;
 const manifest={version:1,image:'combat-sheet.png',columns:4,rows:8,frameWidth:512,frameHeight:512,groundY:500,loop:false,durationMs:comboDurations.reduce((s,t)=>s+t,0),view:'side-profile',direction:'right',combo:keys,guardImage:'guard.png',stage:{width:640,height:720,actorX:32,actorY:20,floorY:520},vfxManifest:'../../vfx/air-pressure-v2/manifest.json',actions};
 fs.writeFileSync(path.join(dir,'combat-sheet.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log('Packed32cels. Combo '+manifest.durationMs+'ms. PNG '+(fs.statSync(path.join(dir,'combat-sheet.png')).size/1024**2).toFixed(2)+'MiB.');
})().catch(e=>{console.error(e);process.exitCode=1;});
