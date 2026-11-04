const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process'),{chromium}=require('playwright');
const base=path.resolve(__dirname,'../..'),project=path.resolve(base,'../../');
const {setGifDelays}=require(path.join(base,'anime-attack-profile-v12/tools/gif-timing.cjs'));
const sets=[['anime-dash-profile-v1','dash'],['anime-air-dash-profile-v1','air-dash']];
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
    const {dashDistance}=await import('/character-lab/dash-motion.js');
    const make=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h}),png=c=>c.toDataURL().split(',')[1];
    const load=async src=>{const im=new Image();im.src=src;await im.decode();return im;};
    const source=await load('/art/protagonist/'+folder+'/'+reg.source),copies=new Map();
    for(const f of reg.frames.filter(f=>f.copyFromAtlas)){if(!copies.has(f.copyFromAtlas))copies.set(f.copyFromAtlas,await load('/art/protagonist/'+folder+'/'+f.copyFromAtlas));}
    const atlas=make(2560,1280),g=atlas.getContext('2d'),cels=[],stills=[],metadata=[];let time=0;
    for(const f of reg.frames){
     const c=make(640,640),x=c.getContext('2d');
     if(f.copyFromAtlas)x.drawImage(copies.get(f.copyFromAtlas),...f.copyCell,...f.copyOffset,f.copyCell[2],f.copyCell[3]);
     else x.drawImage(source,f.sourceX,f.sourceY,f.sourceWidth,f.sourceHeight,f.dx,f.dy,f.sourceWidth*f.scale,f.sourceHeight*f.scale);
     const sx=f.index%4*640,sy=Math.floor(f.index/4)*640;g.drawImage(c,sx,sy);cels.push(png(c));
     const stage=make(768,760),p=stage.getContext('2d');p.fillStyle='#13252d';p.fillRect(0,0,768,760);p.strokeStyle='#486467';p.beginPath();p.moveTo(24,700.5);p.lineTo(744,700.5);p.stroke();p.drawImage(c,104,80);
     p.fillStyle='#c3d9cd';p.font='14px sans-serif';p.fillText(reg.action==='dash'?'DASH / GROUND':'AIR DASH / HORIZONTAL',24,25);p.font='13px monospace';p.fillText(String(f.index+1).padStart(2,'0')+' / 08 · '+f.phase,24,739);stills.push(png(stage));
     metadata.push({index:f.index,x:sx,y:sy,w:640,h:640,startMs:time,durationMs:f.durationMs,phase:f.phase});time+=f.durationMs;
    }
    const movie=[];for(let ms=0;ms<time;ms+=20){const f=metadata.find(f=>ms<f.startMs+f.durationMs)||metadata.at(-1),stage=make(768,640),p=stage.getContext('2d'),height=reg.action==='airDash'?140:0,x=240+dashDistance(reg.action,ms);
     p.fillStyle='#13252d';p.fillRect(0,0,768,640);p.strokeStyle='#486467';p.beginPath();p.moveTo(24,580.5);p.lineTo(744,580.5);p.stroke();p.drawImage(atlas,f.x,f.y,640,640,x-280*.62,580-620*.62-height,640*.62,640*.62);
     p.fillStyle='#c3d9cd';p.font='14px sans-serif';p.fillText(reg.action==='dash'?'DASH / GROUND':'AIR DASH / HORIZONTAL',24,25);p.font='13px monospace';p.fillText(f.phase,24,619);movie.push({png:png(stage),ms:Math.min(20,time-ms)});
    }
    return {atlas:png(atlas),cels,stills,movie,meta:{image:name+'-sheet.png',animation:reg.action,columns:4,rows:2,frameWidth:640,frameHeight:640,anchorX:280,groundY:620,contentTopY:136,loop:false,durationMs:time,view:'strict-side-profile',direction:'right',uniformSourceScale:reg.uniformScale,reusedCels:reg.action==='dash'?{'0':'approved idle 0','7':'approved idle 0'}:{'0':'approved jump-v3 apex 6'},frames:metadata}};
   },{folder,name,reg});
   const put=(file,b64)=>fs.writeFileSync(path.join(dir,file),Buffer.from(b64,'base64'));
   const packed=PNG.sync.read(Buffer.from(result.atlas,'base64'));
   for(const f of reg.frames.filter(f=>f.copyFromAtlas)){const prior=PNG.sync.read(fs.readFileSync(path.resolve(dir,f.copyFromAtlas))),[sx,sy,w,h]=f.copyCell,[dx,dy]=f.copyOffset;for(let y=0;y<h;y++){const from=((sy+y)*prior.width+sx)*4,to=((Math.floor(f.index/4)*640+dy+y)*2560+f.index%4*640+dx)*4;prior.data.copy(packed.data,to,from,from+w*4);}}
   fs.writeFileSync(path.join(dir,name+'-sheet.png'),PNG.sync.write(packed));fs.mkdirSync(path.join(dir,'cels'),{recursive:true});fs.mkdirSync(path.join(dir,'frames'),{recursive:true});
   reg.frames.forEach(f=>{const cell=new PNG({width:640,height:640}),sx=f.index%4*640,sy=Math.floor(f.index/4)*640;for(let y=0;y<640;y++){const from=((sy+y)*2560+sx)*4;packed.data.copy(cell.data,y*640*4,from,from+640*4);}fs.writeFileSync(path.join(dir,'cels/frame-'+String(f.index).padStart(2,'0')+'.png'),PNG.sync.write(cell));});result.stills.forEach((v,i)=>put('frames/frame-'+String(i).padStart(2,'0')+'.png',v));
   fs.writeFileSync(path.join(dir,name+'-sheet.json'),JSON.stringify(result.meta,null,2)+'\n');
   const temp=fs.mkdtempSync(path.join(os.tmpdir(),'anime-jump-movie-'));
   try{const frames=result.movie.map((f,i)=>{const file=path.join(temp,i+'.png');fs.writeFileSync(file,Buffer.from(f.png,'base64'));return{file,ms:f.ms};});makeGif(frames,path.join(dir,name+'-preview.gif'),false);makeGif(frames,path.join(dir,name+'-preview-slow.gif'),true);}finally{fs.rmSync(temp,{recursive:true,force:true});}
   const publicDir=path.join(project,'site/art/protagonist',folder);fs.mkdirSync(publicDir,{recursive:true});for(const file of [name+'-sheet.png',name+'-sheet.json',name+'-preview.gif',name+'-preview-slow.gif'])fs.copyFileSync(path.join(dir,file),path.join(publicDir,file));
   console.log('Packed',reg.action,reg.frames.length+' cels /',result.meta.durationMs,'ms, shared scale',reg.uniformScale);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
