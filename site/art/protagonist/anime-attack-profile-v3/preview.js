import {sample,impactEvents} from './timeline.js';

const root='./art/protagonist/anime-attack-profile-v3/';
const canvas=document.getElementById('combat-preview'),ctx=canvas.getContext('2d');
const detail=document.getElementById('impact-detail'),zoom=detail.getContext('2d');
const footDetail=document.getElementById('foot-detail'),footZoom=footDetail.getContext('2d');
const freeReview=document.getElementById('free-hand-review'),freeDetail=document.getElementById('free-hand-detail'),freeZoom=freeDetail.getContext('2d');
const stateLabel=document.getElementById('state-label'),status=document.getElementById('frame-status');
const comboButton=document.getElementById('play-combo'),speed=document.getElementById('speed'),showFx=document.getElementById('show-vfx');
const finisherButton=document.getElementById('play-finisher');
const holder=document.getElementById('frame-controls'),sheet=document.getElementById('action-sheet');
const gifLink=document.getElementById('action-gif'),pngLink=document.getElementById('action-png');
const actionButtons=[...document.querySelectorAll('button[data-action]')];
const phaseNames={'uppercut-peak':'Đỉnh móc · khung nối','high-peak':'Móc cao nhất','hold-peak':'Giữ đỉnh móc','load-from-peak':'Hạ trọng tâm từ đỉnh móc','approach-ground':'Nắm đấm sắp chạm đất','guard':'Thế thủ','load':'Lấy đà','drive':'Ra đòn','contact':'Tiếp xúc','follow-through':'Theo đà','recoil':'Thu tay','recover':'Về thế thủ','dip':'Hạ trọng tâm','chamber':'Thu nắm đấm','drive-up':'Đấm móc đi lên','follow-up':'Theo đà đi lên','raise-one-fist':'Nâng một tay','downstroke':'Đấm xuống','contact-ground':'Nắm đấm chạm sàn','settle':'Ghì lực'};
let meta,vfx,images=new Map(),atlases=new Map(),frames=[];
let mode='loading',selection='combo',selected='attack1',started=0,rate=1,inspectIndex=0,lastDraw='';

async function image(src) {if(images.has(src))return images.get(src);const im=new Image();im.src=src;await im.decode();images.set(src,im);return im;}
function select(key) {
  if(selected!==key||!sheet.getAttribute('src')) {
    selected=key;sheet.src=root+meta.actions[key].image;sheet.alt='Tám khung '+meta.actions[key].name;
    gifLink.href='./downloads/di-mon-'+key+'-profile-v3.gif';pngLink.href='./downloads/di-mon-'+key+'-profile-v3.png';
    gifLink.textContent='Tải GIF · '+meta.actions[key].name;pngLink.textContent='Tải sheet · '+meta.actions[key].name;
  }
  for(const b of actionButtons)b.setAttribute('aria-pressed',String(b.dataset.action===key));
}
function start(which) {
  selection=which;mode='playing';rate=Number(speed.value);started=performance.now();lastDraw='';
  comboButton.setAttribute('aria-pressed',String(which==='combo'));
  finisherButton.setAttribute('aria-pressed',String(which==='finisher'));
  for(const b of frames)b.setAttribute('aria-pressed','false');
  if(which==='finisher')select('attack3');else if(which!=='combo')select(which);
}
function effectsFor(elapsed,key,index) {
  if(!showFx.checked)return [];
  if(mode==='inspect') {
    const a=meta.actions[key];return index>=a.impact.frameIndex&&index<=a.impact.frameIndex+1?[{key,ageMs:120}]:[];
  }
  return impactEvents(meta,selection).map(e=>({...e,ageMs:elapsed-e.timeMs})).filter(e=>e.ageMs>=0&&e.ageMs<vfx.actions[e.key].frames.length/vfx.actions[e.key].fps*1000);
}
function effect(e,pass) {
  const a=vfx.actions[e.key],f=a.frames[Math.min(a.frames.length-1,Math.floor(e.ageMs*a.fps/1000))];
  const action=meta.actions[e.key],hit=action.impact,stage=meta.stage;
  let rootPoint=hit.fist,scale=a.uniformSourceScale,rotation=0;
  if(e.key==='attack3') {
    rootPoint=hit.vfxRoot;scale=hit.vfxScale??((meta.groundY-hit.fist[1])/hit.vfxReferenceRise);rotation=hit.vfxRotationRad??0;
  }else if(e.key==='attack4') {rootPoint=hit.ground;scale=hit.vfxScale??1.1;}
  if(e.key!=='attack4'&&pass==='front')return;
  const x=stage.actorX+rootPoint[0],y=stage.actorY+rootPoint[1];
  ctx.save();
  if(e.key==='attack4') {ctx.beginPath();ctx.rect(0,pass==='front'?y:0,canvas.width,pass==='front'?canvas.height-y:y);ctx.clip();}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=a.opacity??vfx.opacity;ctx.filter='none';ctx.shadowBlur=0;
  ctx.translate(x,y);ctx.rotate(rotation);
  ctx.drawImage(images.get(a.resolvedImage),f.x,f.y,f.w,f.h,-f.anchorX*scale,-f.anchorY*scale,f.w*scale,f.h*scale);ctx.restore();
}
function render(key,index,effects,complete) {
  const a=meta.actions[key],f=a.frames[index];select(key);
  const signature=[key,index,mode,complete,showFx.checked,...effects.map(e=>e.key+':'+Math.floor(e.ageMs*vfx.actions[e.key].fps/1000))].join('|');
  if(lastDraw===signature)return;lastDraw=signature;
  ctx.fillStyle='#13252d';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#486467';ctx.beginPath();ctx.moveTo(24,meta.stage.floorY+.5);ctx.lineTo(canvas.width-24,meta.stage.floorY+.5);ctx.stroke();
  for(const e of effects)effect(e,'back');
  ctx.drawImage(atlases.get(key),f.x,f.y,f.w,f.h,meta.stage.actorX,meta.stage.actorY,f.w,f.h);
  for(const e of effects)effect(e,'front');
  ctx.fillStyle='#c3d9cd';ctx.font='13px sans-serif';ctx.fillText(a.name,24,25);
  ctx.fillStyle='#9ab5af';ctx.font='13px monospace';ctx.fillText(String(index+1).padStart(2,'0')+' / 08',24,817);ctx.fillText(showFx.checked?'VFX / SOURCE OVER':'CHARACTER ONLY',canvas.width-198,817);
  canvas.dataset.action=key;canvas.dataset.currentFrame=String(index);canvas.dataset.mode=mode;canvas.dataset.fx=effects.map(e=>e.key).join(',');
  const p=key==='attack4'?a.impact.ground:a.impact.fist;
  const x=meta.stage.actorX+p[0],y=meta.stage.actorY+p[1];
  const sx=Math.max(0,Math.min(canvas.width-140,x-70)),sy=Math.max(0,Math.min(canvas.height-140,y-70));
  zoom.clearRect(0,0,280,280);zoom.drawImage(canvas,sx,sy,140,140,0,0,280,280);
  footZoom.clearRect(0,0,560,180);footZoom.drawImage(canvas,24,meta.stage.floorY-100,canvas.width-48,(canvas.width-48)*180/560,0,0,560,180);
  freeReview.hidden=key!=='attack4'||!f.freeFist;
  if(!freeReview.hidden){
    const fx=meta.stage.actorX+f.freeFist[0],fy=meta.stage.actorY+f.freeFist[1];
    freeZoom.clearRect(0,0,280,280);freeZoom.drawImage(canvas,Math.max(0,Math.min(canvas.width-80,fx-40)),Math.max(0,Math.min(canvas.height-80,fy-40)),80,80,0,0,280,280);
  }
  stateLabel.textContent=mode==='inspect'?'XEM TỪNG KHUNG':complete?(a.onComplete==='uppercut-peak'?'GIỮ ĐỈNH MÓC · SẴN SÀNG ĐẤM XUỐNG':'ĐÃ PHÁT XONG · VỀ THẾ THỦ'):selection==='combo'?'COMBO · '+(meta.combo.indexOf(key)+1)+' / 4':selection==='finisher'?'MÓC → ĐẤM ĐẤT':'PHÁT RIÊNG · '+a.name;
  status.textContent=a.name+' · khung '+String(index+1).padStart(2,'0')+' / 08 · '+(phaseNames[f.phase]??f.phase)+(index===a.impact.frameIndex?' · ĐIỂM RA ĐÒN':'');
}
function animate(now) {
  if(mode!=='loading') {
    let s,elapsed=0;
    if(mode==='inspect')s={key:selected,index:inspectIndex,complete:false};
    else {elapsed=(now-started)*rate;s=sample(meta,selection,elapsed);if(s.complete)mode='completed';}
    render(s.key,s.index,effectsFor(elapsed,s.key,s.index),s.complete);
  }
  requestAnimationFrame(animate);
}
try {
  const response=await fetch(root+'combat-sheet.json');if(!response.ok)throw Error('Không tải được dữ liệu attack');meta=await response.json();
  const vfxUrl=new URL(meta.vfxManifest,new URL(root,location.href));const fxResponse=await fetch(vfxUrl);if(!fxResponse.ok)throw Error('Không tải được VFX');vfx=await fxResponse.json();
  await Promise.all(meta.combo.map(async key=>atlases.set(key,await image(root+meta.actions[key].image))));
  for(const key of meta.combo) {
    const override=meta.effectOverrides?.[key];
    if(override)vfx.actions[key]=override;
    const a=vfx.actions[key];
    a.resolvedImage=new URL(a.image,override?new URL(root,location.href):vfxUrl).href;
    await image(a.resolvedImage);
  }
  frames=Array.from({length:8},(_,i)=>{
    const b=document.createElement('button');b.type='button';b.dataset.frame=i;b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-pressed','false');
    b.addEventListener('click',()=>{mode='inspect';inspectIndex=i;selection=selected;lastDraw='';for(const f of frames)f.setAttribute('aria-pressed',String(f===b));comboButton.setAttribute('aria-pressed','false');finisherButton.setAttribute('aria-pressed','false');});holder.append(b);return b;
  });
  for(const b of actionButtons) {b.disabled=false;b.addEventListener('click',()=>start(b.dataset.action));}
  comboButton.disabled=false;finisherButton.disabled=false;speed.disabled=false;showFx.disabled=false;
  comboButton.addEventListener('click',()=>start('combo'));
  finisherButton.addEventListener('click',()=>start('finisher'));
  speed.addEventListener('change',()=>{if(mode!=='inspect')start(selection);});
  showFx.addEventListener('change',()=>{lastDraw='';if(mode==='completed')start(selection);});
  const query=new URLSearchParams(location.search);
  const requested=query.get('action'),initial=meta.combo.includes(requested)?requested:requested==='finisher'?'finisher':'combo';
  if(['1','0.5','0.25'].includes(query.get('speed')))speed.value=query.get('speed');
  showFx.checked=query.get('vfx')==='1';
  select(initial==='combo'?'attack1':initial==='finisher'?'attack3':initial);start(initial);
  const requestedFrame=Number(query.get('frame'));
  if(meta.combo.includes(initial)&&query.has('frame')&&Number.isInteger(requestedFrame)&&requestedFrame>=0&&requestedFrame<8){
    mode='inspect';inspectIndex=requestedFrame;frames[requestedFrame].setAttribute('aria-pressed','true');
    document.querySelector('details').open=true;
  }
  requestAnimationFrame(animate);
}catch(error) {stateLabel.textContent='Chưa tải được hoạt ảnh';status.textContent='Tải lại trang hoặc dùng các tệp tải bên dưới.';console.error(error);}
