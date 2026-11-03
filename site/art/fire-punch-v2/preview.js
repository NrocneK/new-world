import {fireSound,initSound} from '../fire-punch-v1/effects.js';
initSound();
const c=document.getElementById('preview'),g=c.getContext('2d'),status=document.getElementById('status'),root='./art/protagonist/anime-attack-profile-v12/';
const m=await (await fetch(root+'combat-sheet.json')).json(),a=m.actions.attack1;
async function image(src){const i=new Image();i.src=src;await i.decode();return i;}
const [actor,fire]=await Promise.all([image(root+a.image),image('./art/fire-punch-v2/fire-source.png')]);
const anchors=[[366,263],[812,265],[1248,264],[1699,263],[371,704],[813,707],[1260,704],[1706,706]];
let start=performance.now(),mode='still',inspection=3,played=false,current=3;
const points=a.frames.map(f=>f.inspectionPoint);
function flame(i,x,y,opacity=1){const col=i%4,row=Math.floor(i/4),sx=Math.round(col*fire.width/4),sy=Math.round(row*fire.height/2),ex=Math.round((col+1)*fire.width/4),ey=Math.round((row+1)*fire.height/2),scale=.46;
 g.save();g.globalAlpha=opacity;g.drawImage(fire,sx,sy,ex-sx,ey-sy,x-(anchors[i][0]-sx)*scale,y-(anchors[i][1]-sy)*scale,(ex-sx)*scale,(ey-sy)*scale);g.restore();}
function render(t){let elapsed=(t-start)*Number(document.getElementById('speed').value),index=inspection,fx=3,opacity=1;
 if(mode==='play'){index=a.frames.findIndex(f=>elapsed<f.startMs+f.durationMs);if(index<0)index=7;fx=elapsed<40?0:elapsed<70?1:elapsed<95?2:elapsed<125?3:elapsed<160?4:elapsed<205?5:elapsed<260?6:7;opacity=elapsed<300?1:Math.max(0,1-(elapsed-300)/100);if(elapsed>=50&&!played){fireSound('attack1');played=true;}if(elapsed>=1100&&document.getElementById('repeat').checked){start=t;played=false;}if(elapsed>1100&&!document.getElementById('repeat').checked)mode='done';
 }else{fx=[0,1,2,3,4,5,6,7][index];opacity=mode==='done'?0:1;}
 current=index;const f=a.frames[index],p=points[index],trail=mode==='play'&&elapsed>160?points[4]:p;
 g.fillStyle='#13252d';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#486467';g.beginPath();g.moveTo(24,640.5);g.lineTo(872,640.5);g.stroke();
 const visible=document.getElementById('fire-on').checked;
 if(visible&&opacity>0)flame(fx,32+trail[0],20+trail[1],opacity);
 g.drawImage(actor,f.x,f.y,f.w,f.h,32,20,f.w,f.h);
 // Keep the character's real fist readable; a faint outer tongue layer adds heat in front.
 if(visible&&opacity>0&&fx<5)flame(fx,32+trail[0],20+trail[1],opacity*.22);
 g.fillStyle='#a9c1b6';g.font='13px monospace';g.fillText(String(index+1).padStart(2,'0')+' / 08',24,710);g.fillText('HỎA QUYỀN / 02',700,710);
 c.dataset.frame=String(index);c.dataset.effect=String(fx);status.textContent=mode==='still'?'Xem từng khung · '+(index+1)+'/8':mode==='done'?'Đã phát xong':'Tụ lửa → Xuất quyền → Tàn lửa';
 for(const b of document.querySelectorAll('[data-frame]'))if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',String(+b.dataset.frame===index));requestAnimationFrame(render);}
function play(){start=performance.now();mode='play';played=false;}
for(let i=0;i<8;i++){const b=document.createElement('button');b.textContent=String(i+1).padStart(2,'0');b.dataset.frame=i;b.onclick=()=>{inspection=i;mode='still';};document.getElementById('frames').append(b);}
document.getElementById('play').disabled=false;document.getElementById('play').onclick=play;document.getElementById('speed').onchange=()=>{if(mode==='play')play();};document.getElementById('repeat').onchange=()=>{if(document.getElementById('repeat').checked)play();};
requestAnimationFrame(render);
