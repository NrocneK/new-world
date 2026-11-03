// Pack complete cels; encode GIF pixels with FFmpeg and set container delays.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');const {spawnSync}=require('node:child_process');
const dir=path.resolve(__dirname,'..');
function setGifDelays(input,durations){
 const out=Buffer.from(input);if(!/^GIF8[79]a$/.test(out.toString('ascii',0,6)))throw Error('Not GIF');
 let i=13+((out[10]&128)?3*(1<<((out[10]&7)+1)):0),frame=0,images=0;
 function skipBlocks(j){while(out[j])j+=1+out[j];return j+1;}
 while(i<out.length){
  if(out[i]===0x3b)break;
  if(out[i]===0x21){
   if(out[i+1]===0xf9){if(out[i+2]!==4||frame>=durations.length)throw Error('Unexpected GCE');out.writeUInt16LE(Math.round(durations[frame++]/10),i+4);i+=8;}
   else i=skipBlocks(i+2);
  }else if(out[i]===0x2c){const p=out[i+9];i+=10+((p&128)?3*(1<<((p&7)+1)):0);i=skipBlocks(i+1);images++;}
  else throw Error('Unexpected GIF block at '+i);
 }
 if(frame!==durations.length||images!==durations.length)throw Error('Frame count differs');
 return out;
}
(async()=>{
 const meta=JSON.parse(fs.readFileSync(path.join(dir,'registration.json')));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:1536,height:1024}});await page.goto('http://127.0.0.1:4173/');
  const data=await page.evaluate(async meta=>{
   const im=new Image();im.src='/art/protagonist/anime-adjust-glasses-v1/gesture-source.png';
   const idle=new Image();idle.src='/art/protagonist/anime-idle-profile-v1/idle-sheet.png';
   await Promise.all([im.decode(),idle.decode()]);
   const atlas=document.createElement('canvas');atlas.width=meta.frameWidth*4;atlas.height=meta.frameHeight*2;
   const c=atlas.getContext('2d'),previews=[];
   for(const f of meta.frames){
    const x=f.index%4*meta.frameWidth,y=Math.floor(f.index/4)*meta.frameHeight;
    c.save();c.beginPath();c.rect(x,y,meta.frameWidth,meta.frameHeight);c.clip();
    if(f.index===0||f.index===7)c.drawImage(idle,0,0,384,512,x,y,384,512);
    else c.drawImage(im,f.sourceX,f.sourceY,f.sourceWidth,meta.frameHeight,x+f.offsetX,y+f.offsetY,f.sourceWidth,meta.frameHeight);
    c.restore();
    const stage=document.createElement('canvas');stage.width=512;stage.height=640;const p=stage.getContext('2d');
    p.fillStyle='#13252d';p.fillRect(0,0,512,640);p.strokeStyle='#486467';p.beginPath();p.moveTo(28,520.5);p.lineTo(484,520.5);p.stroke();
    p.drawImage(atlas,x,y,meta.frameWidth,meta.frameHeight,64,520-meta.groundY,meta.frameWidth,meta.frameHeight);
    p.fillStyle='#c3d9cd';p.font='13px sans-serif';p.fillText('GLASSES ADJUST / 01',24,28);
    p.fillStyle='#9ab5af';p.font='13px monospace';p.fillText(String(f.index+1).padStart(2,'0')+' / 08',24,607);p.fillText('ONE SHOT',405,607);
    previews.push(stage.toDataURL('image/png').split(',')[1]);
   }
   return {atlas:atlas.toDataURL('image/png').split(',')[1],previews};
  },meta);
  fs.writeFileSync(path.join(dir,'glasses-sheet.png'),Buffer.from(data.atlas,'base64'));
  fs.mkdirSync(path.join(dir,'frames'),{recursive:true});
  data.previews.forEach((v,i)=>fs.writeFileSync(path.join(dir,'frames/frame-'+String(i).padStart(2,'0')+'.png'),Buffer.from(v,'base64')));
 }finally{await browser.close();}
 const temp=path.join(dir,'glasses-preview-encoded.gif');
 const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-framerate','10','-i',path.join(dir,'frames/frame-%02d.png'),'-filter_complex','split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a','-loop','-1','-gifflags','-offsetting',temp],{encoding:'utf8'});
 if(r.status!==0)throw Error(r.stderr);
 const original=fs.readFileSync(temp),durations=meta.frames.map(f=>f.durationMs);
 fs.writeFileSync(path.join(dir,'glasses-preview.gif'),setGifDelays(original,durations));
 fs.writeFileSync(path.join(dir,'glasses-preview-slow.gif'),setGifDelays(original,durations.map(t=>t*2)));fs.unlinkSync(temp);
 const out={image:'glasses-sheet.png',downloadImage:'di-mon-adjust-glasses-v1.png',animation:'adjust-glasses',columns:4,rows:2,frameWidth:meta.frameWidth,frameHeight:meta.frameHeight,groundY:meta.groundY,loop:false,durationMs:meta.durationMs,onComplete:'idle',view:'strict-side-profile',direction:'right',timing:'per-frame-duration',trigger:{from:'idle',afterMs:8000,oncePerIdleSession:true,cancelOn:['walk','run','attack','jump']},canonicalIdle:{image:'../anime-idle-profile-v1/idle-sheet.png',frameIndex:0},frames:meta.frames.map((f,i)=>({index:i,x:i%4*meta.frameWidth,y:Math.floor(i/4)*meta.frameHeight,w:meta.frameWidth,h:meta.frameHeight,durationMs:f.durationMs,phase:f.phase,source:i===0||i===7?'canonical-idle':'generated-gesture'}))};
 fs.writeFileSync(path.join(dir,'glasses-sheet.json'),JSON.stringify(out,null,2)+'\n');
 console.log('Separate8-cel action. '+meta.durationMs+'ms, no GIF loop; canonical idle endpoints.');
})().catch(e=>{console.error(e);process.exitCode=1;});
