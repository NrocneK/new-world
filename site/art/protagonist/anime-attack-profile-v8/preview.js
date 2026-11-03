import {sample} from './timeline.js';
const root='./art/protagonist/anime-attack-profile-v8/';
const canvas=document.getElementById('combat-preview'),ctx=canvas.getContext('2d');
const zoom=document.getElementById('impact-detail').getContext('2d');
const holder=document.getElementById('frame-controls'),sheet=document.getElementById('action-sheet');
const speed=document.getElementById('speed'),label=document.getElementById('state-label'),status=document.getElementById('frame-status');
const actionButtons=[...document.querySelectorAll('[data-action]')];
const combo=document.getElementById('play-combo'),punches=document.getElementById('play-punches');
let meta,atlases=new Map(),selected='',selection='combo',mode='loading',started=0,rate=1,inspectIndex=0,last='';
const phaseNames={
  'front-knee-rise':'Nâng gối phải','front-knee-chamber':'Co gối cao · Gập cẳng chân','front-snap-up':'Bật cẳng chân chéo lên','front-high-contact':'Đá trước · Điểm ra đòn','front-refold':'Thu ngay về tư thế co gối','front-lower':'Hạ chân về thế','guard':'Thế thủ','weight-left':'Dồn lực lên chân trái','weight-right':'Dồn lực lên chân phải',
  'right-knee-up':'Nâng gối phải','left-knee-up':'Nâng gối trái','extend-right':'Xuất cước phải','extend-left':'Xuất cước trái',
  'right-kick-contact':'Chân phải · Điểm ra đòn','left-kick-contact':'Chân trái · Điểm ra đòn',
  'retract-right':'Thu chân phải','retract-left':'Thu chân trái','lower-right':'Đặt chân phải','lower-left':'Đặt chân trái',
  'pivot-left':'Xoay trên chân trái','turn-back':'Quay lưng · Co chân phải','high-chamber':'Xoay hông · Nâng gối cao',
  'high-roundhouse-contact':'Đá vòng cao ngang đầu','spin-follow-through':'Xoay theo đà','recover-stance':'Thu chân · Về thế',
  load:'Lấy đà',drive:'Ra đòn',contact:'Tiếp xúc','follow-through':'Theo đà',recoil:'Thu tay',recover:'Về thế thủ',
  'hook-chamber':'Thu tay lấy đà','hook-forward-low':'Cung đấm ra trước','hook-forward':'Vươn ra trước',
  'rear-right':'Xoay ra sau','near-back':'Xoay gần hướng lưng','back':'Quay lưng','back-left':'Xoay qua lưng trái','near-left':'Xoay gần hướng trái','left-profile':'Nghiêng trái','front-left':'Xoay qua trước trái','front':'Chính diện','front-right':'Xoay qua trước phải','front-right-extend':'Xoay hông · Mở chân','high-sweep':'Quét chân cao theo vòng xoay','high-follow-through':'Đá cao · Theo đà xoay','retract':'Thu chân','lower-foot':'Hạ chân','right-profile':'Thế ban đầu','hook-arc-up':'Móc vòng lên','hook-peak':'Đỉnh đấm móc'
};
function select(key) {
  if(key!==selected) {
    selected=key;const a=meta.actions[key];sheet.src=root+a.image;sheet.alt=a.name+' · '+a.frames.length+' khung';holder.replaceChildren();
    for(let i=0;i<a.frames.length;i++) {
      const b=document.createElement('button');b.type='button';b.dataset.frame=i;b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-pressed','false');
      b.addEventListener('click',()=>{
        mode='inspect';inspectIndex=i;last='';
        for(const x of holder.children)x.setAttribute('aria-pressed',String(x===b));
        combo.setAttribute('aria-pressed','false');punches.setAttribute('aria-pressed','false');
      });holder.append(b);
    }
    for(const ext of ['png','gif']) {
      const link=document.getElementById('action-'+ext);link.href='./downloads/di-mon-'+key+'-profile-v8.'+ext;
      link.textContent='Tải '+(ext==='png'?'sheet':'GIF')+' · '+a.name+' ↓';
    }
  }
  for(const b of actionButtons)b.setAttribute('aria-pressed',String(b.dataset.action===key));
}
function start(which) {
  selection=which==='finisher'?'combo':which;mode='playing';rate=Number(speed.value);started=performance.now();last='';
  combo.setAttribute('aria-pressed',String(selection==='combo'));punches.setAttribute('aria-pressed',String(selection==='punches'));
  for(const b of holder.children)b.setAttribute('aria-pressed','false');
}
function render(s) {
  select(s.key);const a=meta.actions[s.key],f=a.frames[s.index],signature=[s.key,s.index,mode,selection].join('|');
  if(signature===last)return;last=signature;
  ctx.fillStyle='#13252d';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#486467';ctx.beginPath();ctx.moveTo(24,meta.stage.floorY+.5);ctx.lineTo(canvas.width-24,meta.stage.floorY+.5);ctx.stroke();
  ctx.drawImage(atlases.get(s.key),f.x,f.y,f.w,f.h,meta.stage.actorX,meta.stage.actorY,f.w,f.h);
  ctx.fillStyle='#c3d9cd';ctx.font='13px sans-serif';ctx.fillText(a.name,24,25);
  ctx.fillStyle='#9ab5af';ctx.font='13px monospace';ctx.fillText(String(s.index+1).padStart(2,'0')+' / '+String(a.frames.length).padStart(2,'0'),24,817);ctx.fillText('CHARACTER ONLY',canvas.width-160,817);
  Object.assign(canvas.dataset,{action:s.key,currentFrame:String(s.index),mode,strikingLeg:a.strikingLeg||'',supportLeg:a.supportLeg||''});
  const p=f.inspectionPoint;
  zoom.clearRect(0,0,320,320);zoom.drawImage(canvas,
    Math.max(0,Math.min(canvas.width-160,meta.stage.actorX+p[0]-80)),
    Math.max(0,Math.min(canvas.height-160,meta.stage.actorY+p[1]-80)),160,160,0,0,320,320);
  label.textContent=mode==='inspect'?'XEM TỪNG KHUNG':s.complete?
    (a.onComplete==='hook-peak'?'GIỮ ĐỈNH MÓC':'ĐÃ PHÁT XONG · VỀ THẾ THỦ'):
    selection==='combo'?'PHẢI → TRÁI → XOAY NGƯỜI ĐÁ CAO':selection==='punches'?'COMBO BA ĐÒN ĐẤM':'PHÁT RIÊNG · '+a.name;
  status.textContent=a.name+' · '+String(s.index+1).padStart(2,'0')+'/'+String(a.frames.length).padStart(2,'0')+' · '+(phaseNames[f.phase]||f.phase);
}
function tick(now) {
  if(mode!=='loading') {
    const s=mode==='inspect'?{key:selected,index:inspectIndex,complete:false}:sample(meta,selection,(now-started)*rate);
    if(s.complete)mode='completed';render(s);
  }
  requestAnimationFrame(tick);
}
try {
  const response=await fetch(root+'combat-sheet.json');if(!response.ok)throw Error('metadata '+response.status);meta=await response.json();
  await Promise.all(meta.allActions.map(async key=>{const im=new Image();im.src=root+meta.actions[key].image;await im.decode();atlases.set(key,im);}));
  for(const b of actionButtons){b.disabled=false;b.addEventListener('click',()=>start(b.dataset.action));}
  combo.disabled=false;punches.disabled=false;speed.disabled=false;
  combo.addEventListener('click',()=>start('combo'));punches.addEventListener('click',()=>start('punches'));
  speed.addEventListener('change',()=>{if(mode!=='inspect')start(selection);});
  const q=new URLSearchParams(location.search),requested=q.get('action');
  const initial=meta.allActions.includes(requested)?requested:requested==='punches'?'punches':requested==='combo'||requested==='finisher'?'combo':'kick1';
  if(['1','0.5','0.25'].includes(q.get('speed')))speed.value=q.get('speed');
  start(initial);select(initial==='punches'?'attack1':initial==='combo'?'kick1':initial);
  const frame=Number(q.get('frame'));
  if(meta.allActions.includes(initial)&&q.has('frame')&&Number.isInteger(frame)&&frame>=0&&frame<meta.actions[initial].frames.length){mode='inspect';inspectIndex=frame;holder.children[frame].setAttribute('aria-pressed','true');}
  requestAnimationFrame(tick);
}catch(error){label.textContent='Chưa tải được hoạt ảnh';status.textContent='Tải lại trang hoặc dùng các tệp tải bên dưới.';console.error(error);}
