import {createCombatRenderer} from './fire-effects.js';
import {createScene} from './scene.js';
import {createJumpMotion,jumpPreviewHeight,jumpCameraOffset} from './jump-motion.js';
const $=id=>document.getElementById(id),canvas=$('gameCanvas'),ctx=canvas.getContext('2d');
const W=1280,H=720,GROUND=558,TARGET=930,START=490;
const manifest=await (await fetch(new URL('./manifest.json',import.meta.url))).json();
const motions=new Map(manifest.actions.map(a=>[a.id,a]));
const held=new Set(),touch=new Set(),cards=new Map();
const S={ready:false,action:'idle',elapsed:0,frame:0,x:START,facing:1,paused:false,speed:1,mode:'play',completed:false,time:0,zoom:1,sound:false,effectsEnabled:true,fire:true,hitCount:0,targetFlash:0,targetKick:0,idleElapsed:0,idleArmed:true,autoGlasses:false,combo:[],queued:0,fired:false,hit:false,history:[],height:0,velocityY:0,jumpCount:0,jumpActive:false,jumpPhase:'ground',vx:0,autoAirJump:false};
let images=new Map(),combat,renderer,audio,soundBuffers=new Map(),sources=[],touchRun=false,last=0,uiElapsed=0,fpsTime=0,fpsFrames=0;
const jumper=createJumpMotion();
const chains={punch:['attack1','attack2','attack3'],kick:['kick1','kick2','kick3']};
const direction=()=>Number(held.has('right')||touch.has('right'))-Number(held.has('left')||touch.has('left'));
const isCombat=id=>motions.get(id)?.group==='combat';
const busy=()=>isCombat(S.action)&&!S.completed;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const scene=createScene(ctx,{width:W,height:H,ground:GROUND,targetX:TARGET});
const icons={jump:'M5 18h14M12 16V3m-5 5 5-5 5 5',airJump:'M4 20h16M12 17V4m-5 5 5-5 5 5M7 14l5-5 5 5',idle:'M6 12h12',walk:'M3 12h18m-4-4 4 4-4 4',run:'m4 6 6 6-6 6m9-12 6 6-6 6',glasses:'M3 10h7v5H3zm11 0h7v5h-7M10 12h4',attack1:'M3 12h17m-5-5 5 5-5 5',attack2:'M3 12h17m-5-5 5 5-5 5',attack3:'M5 20V8h13m-5-5 5 5-5 5',kick1:'M3 20 10 12l10-7M10 12l1 8',kick2:'M3 20 10 12l10-7M10 12l1 8',kick3:'M5 6a9 9 0 1 1-2 9M2 3v6h6'};
function note(text){$('statusText').textContent=text;}
function frameAt(a,t){for(let i=0;i<a.frames.length;i++){const f=a.frames[i];if(t<f.startMs+f.durationMs)return i;}return a.frames.length-1;}
function nextKey(){if(S.combo.length)return S.combo[0];const chain=S.action.startsWith('attack')?chains.punch:chains.kick,index=chain.indexOf(S.action);return S.queued&&index>=0&&index<2?chain[index+1]:null;}
function duration(){if(S.action==='kick1'&&nextKey()==='kick2')return 370;return motions.get(S.action).durationMs;}
function setAction(id,{auto=false,preserveIdle=false}={}){
 if(!motions.has(id))return;
 S.action=id;S.elapsed=0;S.frame=0;S.completed=false;S.fired=false;S.hit=false;S.autoGlasses=auto;
 if(id==='idle'&&!preserveIdle){S.idleElapsed=0;S.idleArmed=true;}
 if(id!=='idle'&&id!=='glasses'){S.idleElapsed=0;S.idleArmed=true;}
 if(isCombat(id)){S.history.push(id);if(S.history.length>24)S.history.shift();}
 updateSelection();buildFrames();updateUI();
}
function preview(id){if(!S.ready)return;cancelJump();held.clear();touch.clear();touchRun=false;document.querySelector('[data-control="run"]').setAttribute('aria-pressed','false');document.querySelectorAll('.is-held').forEach(b=>b.classList.remove('is-held'));S.mode='preview';S.paused=false;S.combo=[];S.queued=0;S.x=START;stopSounds();setAction(id);note('Xem động tác · Dùng A/D để điều khiển');}
function beginCombo(kind){if(!S.ready)return;cancelJump();held.clear();touch.clear();S.mode='play';S.paused=false;S.combo=chains[kind].slice(1);S.queued=0;setAction(chains[kind][0]);note(kind==='punch'?'Ba đòn đấm':'Phải → Trái → Xoay người đá cao');}
function strike(kind){if(!S.ready||S.jumpActive)return;S.mode='play';S.paused=false;const chain=chains[kind];if(busy()){
 if(chain.includes(S.action)&&chain.indexOf(S.action)<2)S.queued=Math.min(2,S.queued+1);
 return;
 }S.combo=[];S.queued=0;setAction(chain[0]);}
function reset(){cancelJump();held.clear();touch.clear();touchRun=false;document.querySelector('[data-control="run"]').setAttribute('aria-pressed','false');document.querySelectorAll('.is-held').forEach(b=>b.classList.remove('is-held'));stopSounds();Object.assign(S,{action:'idle',elapsed:0,frame:0,x:START,facing:1,paused:false,mode:'play',completed:false,hitCount:0,targetFlash:0,targetKick:0,idleElapsed:0,idleArmed:true,autoGlasses:false,combo:[],queued:0,fired:false,hit:false,history:[]});setAction('idle');note('Sẵn sàng');}
function cancelJump(){jumper.reset();Object.assign(S,{height:0,velocityY:0,jumpCount:0,jumpActive:false,jumpPhase:'ground',vx:0,autoAirJump:false});}
function syncJump(j){Object.assign(S,{height:j.height,velocityY:j.velocity,jumpCount:j.count,jumpActive:j.active,jumpPhase:j.phase});}
function requestJump(){
 if(!S.ready||busy()&&!S.jumpActive)return false;
 const wasActive=S.jumpActive;if(!jumper.request())return false;
 if(!wasActive)S.vx=direction()*(held.has('run')||touchRun?290:150);
 S.mode='play';S.paused=false;S.combo=[];S.queued=0;S.completed=false;stopSounds();
 const j=jumper.getState();syncJump(j);setAction(j.action);note(j.count===2?'Air jump · Bật lần hai':'Nhảy');return true;
}
function beginJumpPair(){if(!S.ready)return;reset();requestJump();S.autoAirJump=true;note('Nhảy → Air jump');}
function toggleFire(){S.fire=!S.fire;updateFire();}
function updateFire(){const label='Thuộc tính lửa: '+(S.fire?'bật':'tắt');$('fireToggle').textContent=label;$('fireToggle').setAttribute('aria-pressed',String(S.fire));const b=document.querySelector('[data-control="fire"]');b.setAttribute('aria-pressed',String(S.fire));b.querySelector('span:not(.control-icon)').textContent='Lửa: '+(S.fire?'bật':'tắt');}
async function unlock(){audio??=new AudioContext();await audio.resume();await Promise.all(['attack1','attack2','attack3','kick1','kick2','kick3'].filter(k=>!soundBuffers.has(k)).map(async k=>{const r=await fetch('./art/'+(k.startsWith('kick')?'kick-vfx-v1':'fire-punch-v3')+'/'+k+'.wav');if(!r.ok)throw Error('Không tải được SFX');soundBuffers.set(k,await audio.decodeAudioData(await r.arrayBuffer()));}));}
function stopSounds(){for(const s of sources){try{s.stop();}catch{}}sources=[];}
function playSound(key){if(!S.sound||(key.startsWith('attack')&&!S.fire)||!audio||audio.state!=='running'||!soundBuffers.has(key))return;const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=soundBuffers.get(key);gain.gain.value=.85;source.connect(gain).connect(audio.destination);source.start();sources.push(source);source.onended=()=>{sources=sources.filter(x=>x!==source);};}
function control(name){if(!S.ready)return;if(name==='jump')requestJump();else if(name==='attack')strike('punch');else if(name==='kick')strike('kick');else if(name==='glasses'){if(S.jumpActive)return;S.mode='play';S.paused=false;S.combo=[];S.queued=0;setAction('glasses');}else if(name==='fire')toggleFire();else if(name==='run'){touchRun=!touchRun;document.querySelector('[data-control="run"]').setAttribute('aria-pressed',String(touchRun));}}
function buildFrames(){const a=motions.get(S.action);$('frameStrip').replaceChildren();$('frameStrip').classList.toggle('is-extended',a.frames.length>4);for(const f of a.frames){const button=document.createElement('button');button.type='button';button.dataset.frame=f.index;button.setAttribute('aria-label',a.label+' — khung '+(f.index+1));const thumb=document.createElement('canvas');thumb.width=52;thumb.height=40;const g=thumb.getContext('2d'),scale=36/(a.groundY-(a.contentTopY??(isCombat(a.id)?130:0)));g.drawImage(images.get(a.id),f.x,f.y,f.w,f.h,26-a.anchorX*scale,39-a.groundY*scale,f.w*scale,f.h*scale);button.append(thumb);button.onclick=()=>{cancelJump();S.paused=true;S.mode='inspect';S.combo=[];S.queued=0;S.elapsed=f.startMs;S.frame=f.index;S.completed=false;stopSounds();updateUI();note('Xem khung '+(f.index+1)+' / '+a.frames.length);};$('frameStrip').append(button);}
 $('gifLinks').hidden=!a.previewGif;if(a.previewGif){$('gifDownload').href='./'+a.previewGif;$('slowGifDownload').href='./'+a.slowGif;}$('sheetImage').src='./'+a.image;$('sheetDownload').href='./'+a.image;$('sheetDownload').download='di-mon-'+a.id+'.png';$('sheetInfo').textContent=a.label+' · '+a.frames.length+' khung · '+a.durationMs+' ms';
}
function updateSelection(){for(const [id,b] of cards)b.setAttribute('aria-pressed',String(id===S.action));}
function updateUI(){const a=motions.get(S.action);$('currentAction').textContent=a.label;$('currentFrame').textContent=String(S.frame+1).padStart(2,'0')+' / '+String(a.frames.length).padStart(2,'0');$('hitCount').textContent=String(S.hitCount);$('playPause').textContent=S.completed?'Phát lại':S.paused?'Tiếp tục':'Tạm dừng';$('playPause').setAttribute('aria-pressed',String(S.paused));for(const b of document.querySelectorAll('#frameStrip button'))b.setAttribute('aria-pressed',String(+b.dataset.frame===S.frame));}
function hitAt(frame){if(S.hit||S.mode!=='play')return;const a=motions.get(S.action),p=frame.inspectionPoint;if(!p)return;const x=S.x+S.facing*(p[0]-a.anchorX)*a.scale,y=GROUND+(p[1]-a.groundY)*a.scale;if(x>=TARGET-48&&x<=TARGET+48&&y>=GROUND-305&&y<=GROUND-75){S.hit=true;S.hitCount++;S.targetFlash=.22;S.targetKick=S.facing*7;}}
function step(ms){if(!S.ready||S.paused)return;const dt=ms*S.speed;S.time+=dt/1000;S.targetFlash=Math.max(0,S.targetFlash-dt/1000);S.targetKick*=Math.exp(-dt/70);
 const move=direction();
 if(S.jumpActive){
  if(move){S.facing=move;S.vx=move*(held.has('run')||touchRun?290:150);}
  if(S.jumpPhase==='landing')S.vx=0;
  S.x=clamp(S.x+S.vx*dt/1000,110,1170);
  let j=jumper.step(dt);
  if(S.autoAirJump&&j.phase==='flight'&&j.count===1&&j.velocity<=80){jumper.request();j=jumper.getState();S.autoAirJump=false;}
  if(j.active&&j.action!==S.action)setAction(j.action);
  syncJump(j);S.elapsed=j.elapsed;S.frame=j.frame;
  if(!j.active){S.autoAirJump=false;setAction('idle');}
  return;
 }
 if(move&&!busy()&&S.mode!=='preview'){
 const was=S.action;S.mode='play';S.completed=false;S.facing=move;const id=held.has('run')||touchRun?'run':'walk';const oldX=S.x;S.x=clamp(S.x+move*(id==='run'?290:150)*dt/1000,110,1170);if(Math.abs(S.x-oldX)>.001){if(was!==id)setAction(id);}else if(S.action!=='idle')setAction('idle');
 }else if(S.mode==='play'&&!busy()&&!move&&(S.action==='walk'||S.action==='run'))setAction('idle');
 const a=motions.get(S.action),previous=S.elapsed;S.elapsed+=dt;
 if(isCombat(S.action)){
 const soundAt=a.frames[S.action==='kick3'?10:S.action.startsWith('kick')?3:Math.min(2,a.frames.length-1)].startMs;if(!S.fired&&S.elapsed>=soundAt){S.fired=true;playSound(S.action);}
 const lo=S.action==='attack3'?2:Math.max(0,a.impactFrame-1),hi=Math.min(a.frames.length-1,a.impactFrame+1);
 for(let i=lo;i<=hi;i++){const f=a.frames[i];if(previous<f.startMs+f.durationMs&&S.elapsed>=f.startMs)hitAt(f);}
 }
 if(a.loop){S.elapsed%=a.durationMs;S.frame=frameAt(a,S.elapsed);
 if(S.action==='idle'){S.idleElapsed+=dt;if(S.idleArmed&&S.idleElapsed>=manifest.autoGlassesAfterMs){S.idleArmed=false;setAction('glasses',{auto:true});}}
 }else{
 S.frame=frameAt(a,S.elapsed);
 if(S.action==='kick1'&&nextKey()==='kick2'&&S.frame>6)S.frame=6;
 if(S.elapsed>=duration()){
 const next=nextKey();if(next){if(S.combo.length)S.combo.shift();else S.queued--;setAction(next);}
 else if(S.mode==='play'||S.autoGlasses){const preserve=S.autoGlasses;S.combo=[];S.queued=0;setAction('idle',{preserveIdle:preserve});}
 else{S.completed=true;S.frame=a.frames.length-1;}
 }
 }
}
function drawHero(){const a=motions.get(S.action),f=a.frames[S.frame];ctx.fillStyle='rgba(6,17,11,'+(.44-Math.min(.25,S.height/900))+')';ctx.beginPath();ctx.ellipse(S.x,GROUND+5,Math.max(22,44-S.height*.08),7,0,0,Math.PI*2);ctx.fill();ctx.save();ctx.translate(S.x,GROUND-S.height);ctx.scale(S.facing*a.scale,a.scale);ctx.imageSmoothingEnabled=true;
 if(isCombat(a.id)){const layer=renderer.draw(a.id,S.frame,S.elapsed,S.effectsEnabled&&(a.id.startsWith('kick')||S.fire),S.mode==='inspect');ctx.drawImage(layer,-(a.anchorX+32),-800);canvas.dataset.kickActive=layer.dataset.kickActive;canvas.dataset.kickTurnDegrees=layer.dataset.kickTurnDegrees;canvas.dataset.kickHeadX=layer.dataset.kickHeadX||'';canvas.dataset.kickHeadY=layer.dataset.kickHeadY||'';}
 else{ctx.drawImage(images.get(a.id),f.x,f.y,f.w,f.h,-a.anchorX,-a.groundY,f.w,f.h);canvas.dataset.kickActive='false';canvas.dataset.kickTurnDegrees='0';}
 ctx.restore();ctx.fillStyle='#c5d5a3';ctx.font='10px Consolas,monospace';ctx.textAlign='center';ctx.fillText('NHÂN VIÊN 01',S.x,GROUND+34);}
function render(){if(!S.jumpActive)S.height=S.action==='jump'||S.action==='airJump'?jumpPreviewHeight(S.action,S.elapsed):0;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#111a1b';ctx.fillRect(0,0,W,H);ctx.save();S.cameraY=jumpCameraOffset(S.height,S.zoom);if(S.zoom!==1){ctx.translate(W/2,GROUND);ctx.scale(S.zoom,S.zoom);ctx.translate(-S.x,-GROUND+S.cameraY);}else ctx.translate(0,S.cameraY);scene(S);drawHero();ctx.restore();Object.assign(canvas.dataset,{identity:manifest.identity,action:S.action,frame:String(S.frame),mode:S.mode,facing:String(S.facing),fire:String(S.fire),effects:String(S.effectsEnabled),completed:String(S.completed),idleArmed:String(S.idleArmed),height:String(S.height),jumpCount:String(S.jumpCount),jumpPhase:S.jumpPhase,cameraOffset:String(S.cameraY)});}
function frame(now){if(!last)last=now;const dt=Math.min(50,Math.max(0,now-last));last=now;step(dt);render();uiElapsed+=dt;fpsTime+=dt;fpsFrames++;if(uiElapsed>60){updateUI();uiElapsed=0;}if(fpsTime>700){$('fpsValue').textContent=String(Math.min(60,Math.round(fpsFrames*1000/fpsTime)));fpsTime=0;fpsFrames=0;}requestAnimationFrame(frame);}
function setup(){document.querySelector('.motion-count').textContent=String(motions.size);
 for(const a of motions.values()){const b=document.createElement('button');b.type='button';b.dataset.motion=a.id;b.dataset.group=a.group;b.setAttribute('aria-pressed','false');const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');const path=document.createElementNS(icon.namespaceURI,'path');path.setAttribute('d',icons[a.id]);icon.append(path);const label=document.createElement('span');label.className='motion-label';label.textContent=a.label;const key=document.createElement('small');key.textContent=({jump:'SPACE · 1',airJump:'SPACE · 2',walk:'A/D',run:'SHIFT',glasses:'G',attack1:'J · 1',attack2:'J · 2',attack3:'J · 3',kick1:'K · 1',kick2:'K · 2',kick3:'K · 3'})[a.id]||'—';b.append(icon,label,key);b.onclick=()=>preview(a.id);$('motionGrid').append(b);cards.set(a.id,b);}
 for(const b of document.querySelectorAll('#motionTabs button'))b.onclick=()=>{for(const x of document.querySelectorAll('#motionTabs button')){x.classList.toggle('is-active',x===b);x.setAttribute('aria-pressed',String(x===b));}for(const [id,x] of cards)x.hidden=b.dataset.group!=='all'&&motions.get(id).group!==b.dataset.group;};
 $('playPause').onclick=()=>{if(S.completed){S.paused=false;S.mode='preview';setAction(S.action);}else{S.paused=!S.paused;if(!S.paused&&S.mode==='inspect')S.mode='preview';}updateUI();};
 $('resetButton').onclick=reset;$('zoomToggle').onclick=()=>{S.zoom=S.zoom===1?1.35:1;$('zoomToggle').setAttribute('aria-pressed',String(S.zoom!==1));};
 $('effectsToggle').onclick=()=>{S.effectsEnabled=!S.effectsEnabled;$('effectsToggle').setAttribute('aria-pressed',String(S.effectsEnabled));};
 $('soundToggle').onclick=async()=>{$('soundToggle').disabled=true;try{await unlock();S.sound=!S.sound;$('soundToggle').setAttribute('aria-pressed',String(S.sound));$('soundToggle').setAttribute('aria-label',S.sound?'Tắt âm thanh':'Bật âm thanh');if(!S.sound)stopSounds();}catch(e){note(e.message);}finally{$('soundToggle').disabled=false;}};
 $('helpToggle').onclick=()=>{const open=$('helpPanel').hidden;$('helpPanel').hidden=!open;$('helpToggle').setAttribute('aria-expanded',String(open));};
 $('speedControl').oninput=e=>{S.speed=+e.target.value;$('speedValue').textContent=S.speed.toLocaleString('vi-VN')+'×';};
 $('jumpCombo').onclick=beginJumpPair;$('punchCombo').onclick=()=>beginCombo('punch');$('kickCombo').onclick=()=>beginCombo('kick');$('fireToggle').onclick=toggleFire;
 for(const b of document.querySelectorAll('[data-control]')){const id=b.dataset.control;if(id==='left'||id==='right'){
 b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch.add(id);b.classList.add('is-held');S.mode='play';S.paused=false;};const release=()=>{touch.delete(id);b.classList.remove('is-held');};b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;
 }else b.onclick=()=>control(id);}
 const map={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',ShiftLeft:'run',ShiftRight:'run'};
 window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;const d=map[e.code];if(d){e.preventDefault();held.add(d);if(d!=='run'){S.mode='play';S.paused=false;S.completed=false;}return;}const action=({Space:'jump',KeyW:'jump',ArrowUp:'jump',KeyJ:'attack',KeyK:'kick',KeyG:'glasses',KeyU:'fire'})[e.code];if(action){e.preventDefault();if(!e.repeat)control(action);}if(e.code==='KeyR'&&!e.repeat)reset();});
 window.addEventListener('keyup',e=>{if(map[e.code])held.delete(map[e.code]);});window.addEventListener('blur',()=>{held.clear();touch.clear();document.querySelectorAll('.is-held').forEach(b=>b.classList.remove('is-held'));});
 updateFire();
}
try{
 images=new Map(await Promise.all(manifest.actions.map(async a=>{const i=new Image();i.src='./'+a.image;await i.decode();return[a.id,i];})));
 combat=await (await fetch('./'+manifest.combatMeta)).json();renderer=await createCombatRenderer(combat,images);setup();S.ready=true;setAction('idle');$('loadingState').hidden=true;note('Sẵn sàng · '+manifest.count+' động tác / '+manifest.totalFrames+' khung');
 window.demo=Object.freeze({ready:true,motions:manifest.actions.map(a=>a.id),getState:()=>({...S,combo:[...S.combo],history:[...S.history]}),preview,control,reset,playCombo:beginCombo,playJumpPair:beginJumpPair,advance(ms){for(let t=0;t<ms;t+=16)step(Math.min(16,ms-t));render();updateUI();},manifest});
 requestAnimationFrame(frame);
}catch(e){$('loadingState').innerHTML='<strong>Không tải được thao trường.</strong><span>Hãy tải lại trang.</span>';note(e.message);console.error(e);}
