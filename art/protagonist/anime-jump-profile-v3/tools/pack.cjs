const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process'),{chromium}=require('playwright');
const base=path.resolve(__dirname,'../..'),project=path.resolve(base,'../../');
const {setGifDelays}=require(path.join(base,'anime-attack-profile-v12/tools/gif-timing.cjs'));
const sets=[['anime-jump-profile-v3','jump']];
const {PNG}=require('pngjs');
const makeGif=(frames,out,slow)=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'anime-jump-gif-'));
 try{
  const encoded=path.join(temp,'encoded.gif');
  const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-framerate','25','-i',path.join(path.dirname(frames[0].file),'%d.png'),'-filter_complex','split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a','-loop','0','-gifflags','-offsetting',encoded],{encoding:'utf8'});if(r.status)throw Error(r.stderr);
  fs.writeFileSync(out,setGifDelays(fs.readFileSync(encoded),frames.map(f=>f.ms*(slow?2:1))));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
};
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/');
  for(const [folder,name] of sets){
   const dir=path.join(base,folder),reg=JSON.parse(fs.readFileSync(path.join(dir,'registration.json')));
   const result=await page.evaluate(async({folder,name,reg})=>{
    const {jumpPreviewHeight,jumpCameraOffset}=await import('/character-lab/jump-motion.js');
    const make=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h}),png=c=>c.toDataURL().split(',')[1];
    const load=async src=>{const im=new Image();im.src=src;await im.decode();return im;};
    const images=new Map();for(const file of reg.sources||[]){images.set(file,await load('/art/protagonist/'+folder+'/'+file));}
    const prior=await load('/art/protagonist/anime-jump-profile-v2/jump-sheet.png');
    const atlas=make(1536,reg.rows*640),g=atlas.getContext('2d'),cels=[],stills=[],metadata=[];let time=0;
    for(const f of reg.frames){
     const c=make(384,640),x=c.getContext('2d');
     if(f.copyFromAtlas)x.drawImage(prior,f.x,f.y,384,640,0,0,384,640);
     else x.drawImage(images.get(f.source),f.sourceX,f.sourceY,384,512,f.dx,f.dy,384*f.scale,512*f.scale);
     const sx=f.index%4*384,sy=Math.floor(f.index/4)*640;g.drawImage(c,sx,sy);cels.push(png(c));
     const stage=make(640,760),p=stage.getContext('2d');p.fillStyle='#13252d';p.fillRect(0,0,640,760);p.strokeStyle='#486467';p.beginPath();p.moveTo(24,700.5);p.lineTo(616,700.5);p.stroke();
     p.drawImage(c,128,80);p.fillStyle='#c3d9cd';p.font='14px sans-serif';p.fillText(reg.action==='jump'?'JUMP / RIGHT KNEE FORWARD':'AIR JUMP / HIGHER BOOST',24,25);p.font='13px monospace';p.fillText(String(f.index+1).padStart(2,'0')+' / '+reg.frames.length+' · '+f.phase,24,739);stills.push(png(stage));
     metadata.push({index:f.index,x:sx,y:sy,w:384,h:640,startMs:time,durationMs:f.durationMs,phase:f.phase});time+=f.durationMs;
    }
    const movie=[];for(let ms=0;ms<time;ms+=40){const f=metadata.find(f=>ms<f.startMs+f.durationMs)||metadata.at(-1),stage=make(640,640),p=stage.getContext('2d'),height=jumpPreviewHeight(reg.action,ms);
     p.fillStyle='#13252d';p.fillRect(0,0,640,640);p.save();p.translate(0,jumpCameraOffset(height));p.strokeStyle='#486467';p.beginPath();p.moveTo(24,580.5);p.lineTo(616,580.5);p.stroke();p.drawImage(atlas,f.x,f.y,384,640,320-192*.62,580-620*.62-height,384*.62,640*.62);p.restore();
     p.fillStyle='#c3d9cd';p.font='14px sans-serif';p.fillText(reg.action==='jump'?'JUMP / SIDE PROFILE':'AIR JUMP / SIDE PROFILE',24,25);p.font='13px monospace';p.fillText(f.phase,24,619);movie.push({png:png(stage),ms:Math.min(40,time-ms)});
    }
    return {atlas:png(atlas),cels,stills,movie,meta:{image:name+'-sheet.png',animation:reg.action,columns:4,rows:reg.rows,frameWidth:384,frameHeight:640,anchorX:192,groundY:620,contentTopY:136,loop:false,durationMs:time,view:'strict-side-profile',direction:'right',uniformSourceScale:reg.uniformScale,changedFrameIndices:reg.changedFrameIndices,reusedCels:{'0-2':'v2','11-15':'v2'},rightKneeDirection:'forward',frames:metadata}};
   },{folder,name,reg});
   const put=(file,b64)=>fs.writeFileSync(path.join(dir,file),Buffer.from(b64,'base64'));
   const packed=PNG.sync.read(Buffer.from(result.atlas,'base64')),prior=PNG.sync.read(fs.readFileSync(path.join(base,'anime-jump-profile-v2/jump-sheet.png')));
   for(const f of reg.frames.filter(f=>f.copyFromAtlas))for(let y=0;y<640;y++){const offset=((f.y+y)*1536+f.x)*4;prior.data.copy(packed.data,offset,offset,offset+384*4);}
   fs.writeFileSync(path.join(dir,name+'-sheet.png'),PNG.sync.write(packed));fs.mkdirSync(path.join(dir,'cels'),{recursive:true});fs.mkdirSync(path.join(dir,'frames'),{recursive:true});
   reg.frames.forEach(f=>{const cell=new PNG({width:384,height:640});for(let y=0;y<640;y++){const offset=((f.y+y)*1536+f.x)*4;packed.data.copy(cell.data,y*384*4,offset,offset+384*4);}fs.writeFileSync(path.join(dir,'cels/frame-'+String(f.index).padStart(2,'0')+'.png'),PNG.sync.write(cell));});result.stills.forEach((v,i)=>put('frames/frame-'+String(i).padStart(2,'0')+'.png',v));
   fs.writeFileSync(path.join(dir,name+'-sheet.json'),JSON.stringify(result.meta,null,2)+'\n');
   const temp=fs.mkdtempSync(path.join(os.tmpdir(),'anime-jump-movie-'));
   try{const frames=result.movie.map((f,i)=>{const file=path.join(temp,i+'.png');fs.writeFileSync(file,Buffer.from(f.png,'base64'));return{file,ms:f.ms};});makeGif(frames,path.join(dir,name+'-preview.gif'),false);makeGif(frames,path.join(dir,name+'-preview-slow.gif'),true);}finally{fs.rmSync(temp,{recursive:true,force:true});}
   const publicDir=path.join(project,'site/art/protagonist',folder);fs.mkdirSync(publicDir,{recursive:true});for(const file of [name+'-sheet.png',name+'-sheet.json',name+'-preview.gif',name+'-preview-slow.gif'])fs.copyFileSync(path.join(dir,file),path.join(publicDir,file));
   console.log('Packed',reg.action,reg.frames.length+' cels /',result.meta.durationMs,'ms, shared scale',reg.uniformScale);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
