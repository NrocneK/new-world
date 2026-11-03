// Atlas export uses complete generated poses, rigid placement and uniform scale.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright'),{spawnSync}=require('node:child_process');
const {setGifDelays}=require('./gif-timing.cjs');
const dir=path.resolve(__dirname,'..'),repo=path.resolve(dir,'../../..');
const keys=['attack1','attack2','attack3','attack4'],W=640,H=640;
const stage={width:896,height:848,actorX:96,actorY:20,floorY:640};
const durations={attack1:[30,20,20,40,30,30,30,50],attack2:[30,20,20,40,30,30,30,50],attack3:[40,40,40,55,55,50,40,40],attack4:[50,60,70,80,100,45,35,75,65,70,80,90,110,110,120,150]};
const names=['Đấm thẳng · Tay phải / gần','Đấm thẳng · Tay trái / xa','Đấm móc theo cung','Tụ lực · Đấm đất · Thu quyền'];
const phases={attack1:['guard','load','drive','contact','follow-through','recoil','recover','guard'],attack2:['guard','load','drive','contact','follow-through','recoil','recover','guard'],attack3:['guard','hook-chamber','hook-forward-low','hook-forward','hook-arc-up','hook-arc-up','hook-peak','hook-peak'],attack4:['hook-peak','retract-to-waist','power-chamber','deep-chamber','bend-knee','downstroke','approach-ground','contact-ground','settle','lift-fist','recover-waist','rise-guard','guard','relax-guard','relax-arms','idle-pose']};
const put=(file,b64)=>fs.writeFileSync(path.join(dir,file),Buffer.from(b64,'base64'));
function gif(input,file,times){const tmp=file+'.encoded.gif';const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-framerate','25','-i',input,'-filter_complex','split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a','-loop','-1','-gifflags','-offsetting',tmp],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);const b=fs.readFileSync(tmp);fs.writeFileSync(file,setGifDelays(b,times));fs.writeFileSync(file.replace('.gif','-slow.gif'),setGifDelays(b,times.map(x=>x*2)));fs.unlinkSync(tmp);}
(async()=>{
const reg=JSON.parse(fs.readFileSync(path.join(dir,'registration.json')));
const old=JSON.parse(fs.readFileSync(path.join(repo,'art/protagonist/anime-attack-profile-v3/combat-sheet.json')));
const idle=JSON.parse(fs.readFileSync(path.join(repo,'site/art/protagonist/anime-idle-profile-v1/idle-sheet.json')));
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});let data;
try{const p=await b.newPage();await p.goto('http://127.0.0.1:4173/');data=await p.evaluate(async({reg,old,idle,W,H,stage,names})=>{
 const make=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});const png=c=>c.toDataURL('image/png').split(',')[1];
 const images=new Map();async function im(url){if(images.has(url))return images.get(url);const i=new Image();i.src=url;await i.decode();images.set(url,i);return i;}
 const root='/art/protagonist/anime-attack-profile-v5/';
 const draws={};for(const [key,frames] of Object.entries(reg.sources)){
  draws[key]=[];for(const f of frames){const c=make(W,H);c.getContext('2d').drawImage(await im(root+f.image),f.sx,f.sy,f.sw,f.sh,f.dx,f.dy,f.sw*f.scale,f.sh*f.scale);draws[key].push(c);}
 }
 const cells=[];for(const key of ['attack1','attack2']){const src=await im('/art/protagonist/anime-attack-profile-v3/'+old.actions[key].image);cells.push(old.actions[key].frames.map(f=>{const c=make(W,H);c.getContext('2d').drawImage(src,f.x,f.y,512,640,128,0,512,640);return c;}));}
 const guard=cells[0][0],hook=draws.hook.slice(),peak=draws.peak[0];hook[0]=guard;hook[6]=peak;hook[7]=peak;cells.push(hook);
 const idleAtlas=await im('/site/art/protagonist/anime-idle-profile-v1/idle-sheet.png'),idleFirst=make(W,H);idleFirst.getContext('2d').drawImage(idleAtlas,0,0,384,512,reg.idle.offsetX,120,384,512);
 const hit=draws.slam[7];const slam=[peak,draws.slam[1],draws.slam[2],draws.slam[3],draws.slam[4],draws.slam[5],draws.slam[6],hit,hit,draws.recovery[1],draws.recovery[2],draws.recovery[3],guard,draws.recovery[5],draws.recovery[6],idleFirst];cells.push(slam);
 const all=make(W*4,H*10),allctx=all.getContext('2d'),actions=[];let rowOffset=0;
 for(let a=0;a<4;a++){const count=cells[a].length,atlas=make(W*4,H*Math.ceil(count/4)),g=atlas.getContext('2d'),frames=[];
  for(let i=0;i<count;i++){g.drawImage(cells[a][i],i%4*W,Math.floor(i/4)*H);const c=make(stage.width,stage.height),x=c.getContext('2d');x.fillStyle='#13252d';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#486467';x.beginPath();x.moveTo(24,640.5);x.lineTo(c.width-24,640.5);x.stroke();x.drawImage(cells[a][i],96,20);x.fillStyle='#c3d9cd';x.font='13px sans-serif';x.fillText(names[a],24,25);x.fillStyle='#9ab5af';x.font='13px monospace';x.fillText(String(i+1).padStart(2,'0')+' / '+count,24,817);x.fillText('CHARACTER / ONE SHOT',c.width-198,817);frames.push(png(c));}
  allctx.drawImage(atlas,0,rowOffset*H);rowOffset+=Math.ceil(count/4);actions.push({atlas:png(atlas),frames});
 }
 return {actions,combined:png(all),guard:png(guard),peak:png(peak),chamber:png(slam[3]),hit:png(hit),idle:png(idleFirst),slamStart:png(slam[0]),returnGuard:png(slam[12])};
},{reg,old,idle,W,H,stage,names});}finally{await b.close();}
put('combat-sheet.png',data.combined);for(const [k,file] of Object.entries({guard:'guard.png',peak:'hook-peak.png',chamber:'chamber.png',hit:'impact.png',idle:'idle-first.png',slamStart:'slam-start.png',returnGuard:'return-guard.png'}))put(file,data[k]);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'di-mon-v5-')),fin=fs.mkdtempSync(path.join(os.tmpdir(),'di-mon-v5-fin-'));let n=0,m=0;const allTimes=[],finTimes=[];
try{for(let a=0;a<4;a++){const key=keys[a],fd=path.join(dir,key,'frames');fs.mkdirSync(fd,{recursive:true});put(key+'-sheet.png',data.actions[a].atlas);
 for(let i=0;i<data.actions[a].frames.length;i++){const bytes=Buffer.from(data.actions[a].frames[i],'base64');fs.writeFileSync(path.join(fd,'frame-'+String(i).padStart(2,'0')+'.png'),bytes);fs.writeFileSync(path.join(tmp,'frame-'+String(n++).padStart(2,'0')+'.png'),bytes);if(a>=2)fs.writeFileSync(path.join(fin,'frame-'+String(m++).padStart(2,'0')+'.png'),bytes);}
 gif(path.join(fd,'frame-%02d.png'),path.join(dir,key+'-preview.gif'),durations[key]);allTimes.push(...durations[key]);if(a>=2)finTimes.push(...durations[key]);}
 gif(path.join(tmp,'frame-%02d.png'),path.join(dir,'combo-preview.gif'),allTimes);gif(path.join(fin,'frame-%02d.png'),path.join(dir,'finisher-preview.gif'),finTimes);
}finally{fs.rmSync(tmp,{recursive:true,force:true});fs.rmSync(fin,{recursive:true,force:true});}
let idleTime=0;const idleFrames=idle.frames.map(f=>{const x={...f,startMs:idleTime};idleTime+=f.durationMs;return x;});
let atlasRow=0;const actions=Object.fromEntries(keys.map((key,a)=>{let t=0;const count=durations[key].length,frames=durations[key].map((durationMs,i)=>{const f={index:i,x:i%4*W,y:Math.floor(i/4)*H,w:W,h:H,startMs:t,durationMs,phase:phases[key][i]};t+=durationMs;return f;});const peak=key==='attack3'?6:key==='attack4'?7:3;const r={key,name:names[a],image:key+'-sheet.png',gif:key+'-preview.gif',columns:4,rows:Math.ceil(count/4),atlasRowOffset:atlasRow,loop:false,durationMs:t,onComplete:key==='attack4'?'idle':key==='attack3'?'hook-peak':'guard',impact:{frameIndex:peak,timeMs:frames[peak].startMs,fist:[430,key==='attack4'?600:220],direction:key==='attack4'?'down':key==='attack3'?'arc-forward-up':'forward'},frames};atlasRow+=r.rows;return [key,r];}));
const meta={version:1,reviewRevision:5,image:'combat-sheet.png',columns:4,rows:10,frameWidth:W,frameHeight:H,groundY:620,rootAnchorX:320,stage,loop:false,durationMs:allTimes.reduce((a,b)=>a+b,0),combo:keys,guardImage:'guard.png',peakImage:'hook-peak.png',idleImage:'idle-first.png',handConvention:{near:'right/hand1',far:'left/hand2'},idle:{image:'idle-sheet.png',offsetX:reg.idle.offsetX,offsetY:120,loopDurationMs:idleTime,frames:idleFrames},vfxManifest:'../../vfx/air-pressure-v2/manifest.json',actions,transitions:{hookToSlam:{from:{action:'attack3',frameIndex:7},peak:{action:'attack3',frameIndex:6},to:{action:'attack4',frameIndex:0},kind:'identical full cel'},returnGuard:{action:'attack4',frameIndex:12,reference:{action:'attack1',frameIndex:0}},returnIdle:{action:'attack4',frameIndex:15,source:'approved idle frame0'}},choreography:{hook:'right fist follows forward-then-up arc; higher peak above hair with raised elbow partly covering face; palm toward self, dorsum out toward opponent',slam:'retract near right fist to waist, far left fist abdomen; load lowered wide stance; near right fist down, far left chambered at waist mostly occluded; near right rear knee bends gradually to the floor in frames5–9, shin folded back; lower pelvis and shoulder to reach floor with normal arm length; far left leg stays as flat-foot support; head follows downstroke; recover through guard then idle'}};
fs.writeFileSync(path.join(dir,'combat-sheet.json'),JSON.stringify(meta,null,2)+'\n');console.log('Packed40 cels, 16-frame ground sequence, '+meta.durationMs+'ms; atlas '+(fs.statSync(path.join(dir,'combat-sheet.png')).size/1024**2).toFixed(2)+'MiB');
})().catch(e=>{console.error(e);process.exitCode=1;});
