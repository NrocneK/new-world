import {GlassesController,frameAtTime} from './glasses-controller.js';

const root='./art/protagonist/anime-adjust-glasses-v1/';
const idle='./art/protagonist/anime-idle-profile-v1/idle-preview.gif';
const walk='./art/protagonist/anime-walk-profile-v2/walk-preview.gif';
const preview=document.getElementById('animation-preview'),face=document.getElementById('face-preview');
const label=document.getElementById('state-label'),status=document.getElementById('frame-status');
const play=document.getElementById('play-action'),slow=document.getElementById('slow-action');
const wait=document.getElementById('wait-idle'),interrupt=document.getElementById('interrupt-walk');
const holder=document.getElementById('frame-controls');
const phases=['Nghỉ','Nâng tay','Đưa tay tới kính','Chạm gọng','Chỉnh nhẹ','Rời gọng','Hạ tay','Về tư thế nghỉ'];
let mode='loading',rate=1,started=0,walkUntil=0,gesture,controller,shown='',state='',frames=[],assets=[];
let session=0,idleImage=idle,walkImage=walk;

function active(button) {for(const b of [play,slow,wait,interrupt,...frames])b.setAttribute('aria-pressed',String(b===button));}
function display(src,newState,text,alt) {
  if(src!==shown) {shown=src;preview.src=src;face.src=src;}
  if(state!==newState) {state=newState;preview.dataset.state=newState;label.textContent=text;}
  preview.alt=alt;
}
function showFrame(index,newState='adjust-glasses',heading='CHỈNH KÍNH') {
  preview.dataset.currentFrame=String(index);
  display(assets[index],newState,heading,'Khung '+(index+1)+': '+phases[index]);
  status.textContent='Khung '+String(index+1).padStart(2,'0')+' / 08 · '+phases[index]+' · '+gesture.frames[index].durationMs+' ms';
}
function playOnce(speed,button) {mode='action';rate=speed;started=performance.now();active(button);}
function beginWaiting() {
  const now=performance.now();mode='scenario';rate=1;controller.enterIdle(now);
  idleImage=idle+'?session='+(++session);active(wait);
}
function startWalking() {
  const now=performance.now();mode='scenario';controller.interrupt('walk',now);walkUntil=now+1000;
  walkImage=walk+'?session='+(++session);active(interrupt);
}
function animate(now) {
  if(mode==='action') {
    const elapsed=(now-started)*rate;
    if(elapsed>=gesture.durationMs) {
      showFrame(7,'completed','CHỈNH KÍNH · ĐÃ XONG');
      status.textContent='Đã phát riêng một lần · bấm Phát chỉnh kính để xem lại';mode='completed';
    }else showFrame(frameAtTime(gesture.frames,elapsed));
  }else if(mode==='scenario') {
    if(controller.state==='walk'&&now>=walkUntil) {
      controller.enterIdle(now);idleImage=idle+'?session='+(++session);
    }
    const s=controller.update(now);
    if(s.state==='adjust-glasses') showFrame(frameAtTime(gesture.frames,s.actionElapsedMs));
    else if(s.state==='walk') {
      preview.dataset.currentFrame='';display(walkImage,'walk','WALK · ĐÃ NGẮT CHỜ','Đi bộ: hủy chờ hoặc ngắt chỉnh kính');
      status.textContent='Đang đi bộ · khi dừng sẽ bắt đầu chờ idle từ đầu';
    }else {
      if(state==='adjust-glasses')idleImage=idle+'?session='+(++session);
      preview.dataset.currentFrame='';display(idleImage,'idle','IDLE · THỞ VÀ CHỚP MẮT','Idle thở và chớp mắt riêng');
      const next=s.armed?'Đứng yên · '+(Math.min(s.idleElapsedMs,8000)/1000).toFixed(1)+' / 8 giây':'Đã chỉnh kính một lần · tiếp tục idle';
      if(status.textContent!==next)status.textContent=next;
    }
  }
  requestAnimationFrame(animate);
}

try {
  const response=await fetch(root+'glasses-sheet.json');if(!response.ok)throw Error('Không tải được dữ liệu hoạt ảnh');
  gesture=await response.json();controller=new GlassesController({delayMs:gesture.trigger.afterMs,durationMs:gesture.durationMs,now:performance.now()});
  assets=gesture.frames.map((_,i)=>root+'frames/frame-'+String(i).padStart(2,'0')+'.png');
  await Promise.all([...assets,idle,walk].map(async src=>{const im=new Image();im.src=src;await im.decode();}));
  frames=gesture.frames.map((_,i)=>{
    const b=document.createElement('button');b.type='button';b.dataset.frame=i;b.textContent=String(i+1).padStart(2,'0');
    b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Khung '+(i+1)+': '+phases[i]);
    b.addEventListener('click',()=>{mode='inspect';showFrame(i,'inspect','XEM TỪNG KHUNG');active(b);});holder.append(b);return b;
  });
  for(const b of [play,slow,wait,interrupt])b.disabled=false;
  play.addEventListener('click',()=>playOnce(1,play));slow.addEventListener('click',()=>playOnce(.5,slow));
  wait.addEventListener('click',beginWaiting);interrupt.addEventListener('click',startWalking);
  playOnce(1,play);requestAnimationFrame(animate);
}catch(error) {
  label.textContent='Chưa tải được hoạt ảnh';status.textContent='Tải lại trang hoặc dùng các tệp tải phía dưới.';
  console.error(error);
}
