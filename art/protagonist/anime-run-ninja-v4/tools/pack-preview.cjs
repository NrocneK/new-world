// Pack complete generated cels and render their actual sixteen-frame loop.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {spawnSync}=require('node:child_process');
const dir=path.resolve(__dirname,'..');
(async()=>{
 const meta=JSON.parse(fs.readFileSync(path.join(dir,'registration.json')));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:1536,height:1024}});
  await page.goto('http://127.0.0.1:4173/');
  const data=await page.evaluate(async meta=>{
   const sources=await Promise.all([1,2].map(async n=>{const im=new Image();im.src='/art/protagonist/anime-run-ninja-v4/run-source-'+n+'.png';await im.decode();return im;}));
   const atlas=document.createElement('canvas');atlas.width=meta.columns*meta.frameWidth;atlas.height=meta.rows*meta.frameHeight;
   const ctx=atlas.getContext('2d'),previews=[];
   for(let i=0;i<meta.frames.length;i++){
    const f=meta.frames[i],x=(i%4)*meta.frameWidth,y=Math.floor(i/4)*meta.frameHeight;
    ctx.save();ctx.beginPath();ctx.rect(x,y,meta.frameWidth,meta.frameHeight);ctx.clip();
    ctx.drawImage(sources[f.sourceIndex],f.sourceX,f.sourceY,f.sourceWidth,meta.frameHeight,x+f.offsetX,y+f.offsetY,f.sourceWidth,meta.frameHeight);ctx.restore();
    const stage=document.createElement('canvas');stage.width=512;stage.height=640;const p=stage.getContext('2d');
    p.fillStyle='#13252d';p.fillRect(0,0,512,640);
    p.strokeStyle='#486467';p.lineWidth=1;p.beginPath();p.moveTo(28,520.5);p.lineTo(484,520.5);p.stroke();
    p.drawImage(atlas,x,y,meta.frameWidth,meta.frameHeight,64,520-meta.groundY,meta.frameWidth,meta.frameHeight);
    p.fillStyle='#c3d9cd';p.font='13px sans-serif';p.fillText('RUN / NINJA 04',24,28);
    p.fillStyle='#9ab5af';p.font='13px monospace';p.fillText(String(i+1).padStart(2,'0')+' / 16',24,607);p.fillText('16 KHUNG',405,607);
    previews.push(stage.toDataURL('image/png').split(',')[1]);
   }
   return {atlas:atlas.toDataURL('image/png').split(',')[1],previews};
  },meta);
  fs.writeFileSync(path.join(dir,'run-sheet.png'),Buffer.from(data.atlas,'base64'));
  for(let i=0;i<data.previews.length;i++)fs.writeFileSync(path.join(dir,'frames','frame-'+String(i).padStart(2,'0')+'.png'),Buffer.from(data.previews[i],'base64'));
 }finally{await browser.close();}
 const out=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-framerate','24','-i',path.join(dir,'frames/frame-%02d.png'),'-filter_complex','split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a','-loop','0','-gifflags','-offsetting',path.join(dir,'run-preview.gif')],{encoding:'utf8'});
 if(out.status!==0)throw Error(out.stderr||'GIF encoding failed');
 const slow=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-framerate','12','-i',path.join(dir,'frames/frame-%02d.png'),'-filter_complex','split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a','-loop','0','-gifflags','-offsetting',path.join(dir,'run-preview-slow.gif')],{encoding:'utf8'});if(slow.status!==0)throw Error(slow.stderr);
 fs.writeFileSync(path.join(dir,'run-sheet.json'),JSON.stringify({image:'run-sheet.png',columns:4,rows:4,frameWidth:meta.frameWidth,frameHeight:meta.frameHeight,fps:24,groundY:meta.groundY,loop:true,direction:'right',view:'strict-side-profile',gait:'ninja-grounded',grounded:true,frames:meta.frames.map((f,i)=>({index:i,x:i%4*meta.frameWidth,y:Math.floor(i/4)*meta.frameHeight,w:meta.frameWidth,h:meta.frameHeight,supportLeg:i<8?'near':'far',phase:['contact','absorb','load','recover','pass','extend','push','transfer'][i%8]}))},null,2)+'\n');
 console.log('Packed sixteen cels and exported a looping GIF at 24 FPS.');
})().catch(e=>{console.error(e);process.exitCode=1;});
