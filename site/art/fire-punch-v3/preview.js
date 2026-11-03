const c=document.getElementById('preview'),g=c.getContext('2d'),status=document.getElementById('status'),root='./art/protagonist/anime-attack-profile-v12/';
const m=await (await fetch(root+'combat-sheet.json')).json();
async function image(src){const i=new Image();i.src=src;await i.decode();return i;}
const keys=['attack1','attack2','attack3'],actors=new Map(await Promise.all(keys.map(async k=>[k,await image(root+m.actions[k].image)]))),fire=await image('./art/fire-punch-v2/fire-source.png');
const anchors=[[366,263],[812,265],[1248,264],[1699,263],[371,704],[813,707],[1260,704],[1706,706]];
const cells=anchors.map((p,i)=>{const col=i%4,row=Math.floor(i/4),sx=Math.round(col*fire.width/4),sy=Math.round(row*fire.height/2),w=Math.round((col+1)*fire.width/4)-sx,h=Math.round((row+1)*fire.height/2)-sy,ax=p[0]-sx,ay=p[1]-sy;
 function layer(front){const v=document.createElement('canvas');v.width=w;v.height=h;const x=v.getContext('2d');x.drawImage(fire,sx,sy,w,h,0,0,w,h);x.globalCompositeOperation='destination-in';const fade=x.createLinearGradient(front?ax-100:0,0,front?ax-40:45,0);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,1)');x.fillStyle=fade;x.fillRect(0,0,w,h);return v;}
 return{back:layer(false),front:layer(true),ax,ay,w,h};});
let key='attack1',a=m.actions[key],points=a.frames.map(f=>f.inspectionPoint),start=performance.now(),mode='still',inspection=3,played=false,current=3,audio;
const rawSounds=new Map(await Promise.all(keys.map(async k=>{const r=await fetch('./art/fire-punch-v3/'+k+'.wav');if(!r.ok)throw Error('Audio '+r.status);return[k,await r.arrayBuffer()];}))),sounds=new Map();let sources=[];
async function unlock(){audio??=new AudioContext();await audio.resume();await Promise.all(keys.map(async k=>{if(!sounds.has(k))sounds.set(k,await audio.decodeAudioData(rawSounds.get(k).slice(0)));}));}
function stopSounds(){for(const s of sources){try{s.stop();}catch{}}sources=[];}
function fireSound(){if(!document.getElementById('sound-on').checked||!audio||audio.state!=='running'||!sounds.has(key))return;const s=audio.createBufferSource(),gain=audio.createGain();s.buffer=sounds.get(key);gain.gain.value=.85;s.connect(gain).connect(audio.destination);s.start();sources.push(s);}
function flame(i,x,y,opacity,angle,front,index){const v=cells[i],scale=key==='attack3'?(index>=4?1.3:1.02):.85;g.save();g.translate(x,y);g.rotate(angle);g.globalAlpha=opacity;g.drawImage(front?v.front:v.back,-v.ax*scale,-v.ay*scale,v.w*scale,v.h*scale);g.restore();c.dataset.fireScale=String(scale);}
function render(t){const elapsed=(t-start)*Number(document.getElementById('speed').value),post=elapsed-a.durationMs;let index=inspection,fx=3,opacity=1;
 if(mode==='play'){index=a.frames.findIndex(f=>elapsed<f.startMs+f.durationMs);if(index<0)index=7;fx=key==='attack3'?[0,1,1,2,2,3,3,4][index]:index;if(post>=0){fx=Math.min(7,5+Math.floor(post/65));opacity=Math.max(0,1-post/220);}if(elapsed>=a.frames[2].startMs&&!played){fireSound();played=true;}if(elapsed>=a.durationMs+800){if(document.getElementById('repeat').checked){start=t;played=false;}else mode='done';}
 }else{fx=key==='attack3'?[0,1,1,2,2,3,3,4][index]:index;opacity=mode==='done'?0:1;}
 current=index;const f=a.frames[index],p=points[index],trail=mode==='play'&&post>=0?points[key==='attack3'?6:4]:p;
 let angle=0;if(key==='attack3'&&index>=3){const prev=points[index-1];angle=index>=5?-Math.PI/2:Math.atan2(p[1]-prev[1],p[0]-prev[0]);}
 g.fillStyle='#13252d';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#486467';g.beginPath();g.moveTo(24,640.5);g.lineTo(872,640.5);g.stroke();const visible=document.getElementById('fire-on').checked;
 if(visible&&opacity>0)flame(fx,32+trail[0],20+trail[1],opacity,angle,false,index);
 g.drawImage(actors.get(key),f.x,f.y,f.w,f.h,32,20,f.w,f.h);
 if(visible&&opacity>0)flame(fx,32+trail[0],20+trail[1],opacity,angle,true,index);
 g.fillStyle='#a9c1b6';g.font='13px monospace';g.fillText(String(index+1).padStart(2,'0')+' / 08',24,710);g.fillText('HỎA QUYỀN / 03',700,710);
 Object.assign(c.dataset,{action:key,frame:String(index),effect:String(fx),mode});status.textContent=mode==='still'?'Xem từng khung · '+(index+1)+'/8':mode==='done'?'Đã phát xong':'Tụ lửa → Xuất quyền → Tàn lửa';
 for(const b of document.querySelectorAll('button[data-frame]'))b.setAttribute('aria-pressed',String(+b.dataset.frame===index));requestAnimationFrame(render);}
async function play(){await unlock();stopSounds();start=performance.now();mode='play';played=false;}
for(let i=0;i<8;i++){const b=document.createElement('button');b.textContent=String(i+1).padStart(2,'0');b.dataset.frame=i;b.onclick=()=>{stopSounds();inspection=i;mode='still';};document.getElementById('frames').append(b);}
for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>{stopSounds();key=b.dataset.action;a=m.actions[key];points=a.frames.map(f=>f.inspectionPoint);inspection=key==='attack3'?6:3;mode='still';for(const x of document.querySelectorAll('button[data-action]'))x.setAttribute('aria-pressed',String(x===b));document.getElementById('heading').textContent=key==='attack3'?'Đấm móc · Bùng lửa lớn':key==='attack2'?'Đấm trái · Lửa phủ quyền':'Đấm phải · Lửa phủ quyền';};
document.getElementById('play').disabled=false;document.getElementById('play').onclick=play;document.getElementById('speed').onchange=()=>{if(mode==='play')play();};document.getElementById('repeat').onchange=()=>{if(document.getElementById('repeat').checked)play();};document.getElementById('sound-on').onchange=()=>{if(!document.getElementById('sound-on').checked)stopSounds();};document.getElementById('listen').onclick=async()=>{await unlock();stopSounds();fireSound();};
requestAnimationFrame(render);
