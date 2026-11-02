/* Dị Môn: opening chapter. Whole-character artwork is shared with the lab. */
(() => {
  'use strict';
  const C = window.DI_MON_CHAPTER, $ = id => document.getElementById(id);
  const canvas = $('levelCanvas'), ctx = canvas.getContext('2d', { alpha:false });
  const W=1280, H=720, G=C.ground, HEAD=110, ART_SCALE=HEAD/132;
  const GRAVITY=1850, JUMP=-700, WALK=235, RUN=370, STEP=1/120;
  const SAVE_KEY='di-mon:chapter-one:v1';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const chain=['attack1','attack2','attack3','attack4'];
  const defs={idle:[4,true],walk:[10,true],run:[13,true],jump:[9,false],doubleJump:[12.5,false],fall:[7,true],land:[11,false],dodge:[12,false],attack1:[12,false],attack2:[12,false],attack3:[11,false],attack4:[9,false],airAttack:[10,false],fire:[8,false],wind:[8,false],hurt:[9,false],death:[6,false]};
  const attacks={
    attack1:{contact:1,damage:18,box:[30,-104,153,-29],fist:[54,-70]},
    attack2:{contact:1,damage:20,box:[29,-112,165,-25],fist:[53,-73]},
    attack3:{contact:2,damage:30,box:[15,-190,139,-18],fist:[47,-117]},
    attack4:{contact:2,damage:46,box:[-190,-108,250,8],fist:[48,-4]},
    airAttack:{contact:1,damage:25,box:[24,-121,151,-24],fist:[88,-57]}
  };
  const motions=Object.fromEntries(Object.entries(defs).map(([id,[fps,loop]])=>[id,{fps,loop,frames:[],blinks:[]}]));
  const held=new Set(), touch=new Set(), textures=new Map();
  const assets={}, s={ready:false,mode:'title',time:0,elapsed:0,camera:0,checkpoint:0,rescued:false,kills:0,xp:0,level:1,deaths:0,hitCount:0,combo:0,queue:0,lastAttack:-10,fireCd:0,windCd:0,toast:0,shake:0,noticeGap:false,noticeEnemy:false};
  const p={x:C.startX,y:G,vx:0,vy:0,facing:1,grounded:true,doubleJumpUsed:false,action:'idle',age:0,frame:0,stride:0,effectDone:false,hp:100,maxHp:100,invuln:0,coyote:0};
  let enemies=[], bursts=[], shots=[], effects=[], labels=[], npc={x:C.rescueX,y:G,frame:0,facing:1};
  let dialogue=null,last=0,accumulator=0,audio=null,soundEnabled=false,saved=null;
  let uiStamp='',inputStamp=0;

  function readSave(){
    try {
      const a=JSON.parse(localStorage.getItem(SAVE_KEY));
      if(!a||a.chapter!==C.id||![1,2].includes(a.checkpoint)||!Array.isArray(a.defeated))return null;
      const valid=new Set(C.encounters.map(e=>e.id));
      return{checkpoint:a.checkpoint,rescued:a.checkpoint===2,xp:clamp(Number(a.xp)||0,0,1000),elapsed:clamp(Number(a.elapsed)||0,0,86400),defeated:a.defeated.filter(id=>valid.has(id))};
    }catch{return null;}
  }
  function save(){
    if(!s.checkpoint)return;
    const value={chapter:C.id,checkpoint:s.checkpoint,rescued:s.rescued,xp:s.xp,elapsed:s.elapsed,defeated:enemies.filter(e=>e.hp<=0).map(e=>e.id)};
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(value));saved=readSave();$('saveStatus').textContent='ĐÃ LƯU ĐIỂM HỒI SINH';}
    catch{$('saveStatus').textContent='LƯU TẠM TRONG PHIÊN CHƠI';saved={...value};}
  }
  function tone(kind){
    if(!soundEnabled||!audio)return;
    const spec={hit:[130,65,.07],jump:[220,420,.12],hurt:[85,40,.18],spell:[390,125,.23],quest:[520,900,.27]}[kind]||[400,250,.1];
    const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;
    o.type=kind==='hurt'?'sawtooth':'triangle';o.frequency.setValueAtTime(spec[0],t);o.frequency.exponentialRampToValueAtTime(spec[1],t+spec[2]);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.04,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+spec[2]);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+spec[2]+.01);
  }
  function toast(message,duration=3){$('toast').textContent=message;$('toast').hidden=false;s.toast=duration;}
  function release(){held.clear();touch.clear();document.querySelectorAll('[data-key]').forEach(b=>b.classList.remove('is-held'));}
  function move(){return Number(held.has('right')||touch.has('right'))-Number(held.has('left')||touch.has('left'));}
  function running(){return held.has('run')||touch.has('run');}
  function busy(){return!['idle','walk','run','jump','doubleJump','fall','land'].includes(p.action);}
  function animate(id,force=false){
    if(p.action===id&&!force)return;
    if(!['walk','run'].includes(id)||!['walk','run'].includes(p.action))p.stride=0;
    p.action=id;p.age=0;p.frame=0;p.effectDone=false;
  }
  function showDialogue(lines,after){
    release();dialogue={lines,index:0,after};s.mode='dialogue';$('dialogue').hidden=false;renderDialogue();
  }
  function renderDialogue(){const [speaker,text]=dialogue.lines[dialogue.index];$('dialogueSpeaker').textContent=speaker;$('dialogueText').textContent=text;$('dialogueNext').focus({preventScroll:true});}
  function advanceDialogue(){
    if(!dialogue)return;
    if(++dialogue.index<dialogue.lines.length){renderDialogue();return;}
    const after=dialogue.after;dialogue=null;$('dialogue').hidden=true;s.mode='playing';canvas.focus({preventScroll:true});if(after)after();
  }
  function makeEnemies(defeated=[]){return C.encounters.map((e,i)=>({...e,maxHp:e.hp,hp:defeated.includes(e.id)?0:e.hp,y:G,phase:'patrol',age:0,cooldown:.6+i*.13,face:-1,attackHit:false,deadAge:defeated.includes(e.id)?10:0,flash:0}));}
  function start(continuing=false){
    if(!s.ready)return;
    const a=continuing?saved:null;
    Object.assign(s,{mode:'playing',time:0,elapsed:a?.elapsed||0,camera:0,checkpoint:a?.checkpoint||0,rescued:a?.rescued||false,kills:a?.defeated.length||0,xp:a?.xp||0,level:1,deaths:0,hitCount:0,combo:0,queue:0,lastAttack:-10,fireCd:0,windCd:0,shake:0,toast:0,noticeGap:false,noticeEnemy:false});
    s.level=s.xp>=80?2:1;
    Object.assign(p,{x:a?(a.checkpoint===2?3680:2840):C.startX,y:G,vx:0,vy:0,facing:1,grounded:true,doubleJumpUsed:false,hp:s.level===2?115:100,maxHp:s.level===2?115:100,invuln:0,coyote:0});
    animate('idle',true);enemies=makeEnemies(a?.defeated);bursts=[];shots=[];effects=[];labels=[];npc={x:a?.rescued?p.x-120:C.rescueX,y:G,frame:a?.rescued?1:0,facing:1};
    release();dialogue=null;$('dialogue').hidden=true;$('titleScreen').hidden=true;$('menuScreen').hidden=true;$('hud').hidden=false;$('spellbar').hidden=false;$('toast').hidden=true;
    s.camera=clamp(p.x-410,0,C.width-W);canvas.focus({preventScroll:true});updateUI(true);
    inputStamp=-10;
    if(!a)showDialogue(C.intro,()=>toast('A / D di chuyển · J đánh · Space nhảy',4));
    else toast('Đã trở lại điểm hồi sinh.');
  }
  function menu(kind){
    release();s.mode=kind;$('menuScreen').hidden=false;$('resumeButton').hidden=kind!=='paused';$('resultStats').hidden=kind!=='complete';$('retryButton').hidden=kind==='complete';
    $('menuLabel').textContent=kind==='complete'?'CHƯƠNG 01 / HOÀN THÀNH':kind==='dead'?'TÍN HIỆU BỊ GIÁN ĐOẠN':'TẠM DỪNG';
    $('menuTitle').textContent=kind==='complete'?'Bên kia cánh cửa.':kind==='dead'?'Đứng dậy lần nữa.':'Một nhịp thở.';
    $('menuText').textContent=kind==='complete'?'Anh đã cứu đồng nghiệp và thoát khỏi tầng 07. Bên ngoài, đêm xâm lấn mới chỉ bắt đầu.':kind==='dead'?'Tinh linh giữ lại ký ức tại điểm hồi sinh gần nhất.':'Hành trình vẫn đang chờ anh.';
    if(kind==='complete'){
      const stats=[[s.kills,'QUÁI HẠ GỤC'],[`${Math.floor(s.elapsed/60)}:${String(Math.floor(s.elapsed%60)).padStart(2,'0')}`,'THỜI GIAN'],['01','NGƯỜI ĐƯỢC CỨU']];
      $('resultStats').replaceChildren(...stats.map(([value,label])=>{const el=document.createElement('span'),n=document.createElement('strong');n.textContent=value;el.append(n,label);return el;}));
    }
    (kind==='paused'?$('resumeButton'):kind==='dead'?$('retryButton'):$('newGameButton')).focus({preventScroll:true});
  }
  function resume(){if(s.mode!=='paused')return;s.mode='playing';$('menuScreen').hidden=true;release();canvas.focus({preventScroll:true});}
  function retry(){
    if(!['dead','paused'].includes(s.mode))return;
    s.deaths++;s.mode='playing';p.x=s.checkpoint===2?3680:s.checkpoint===1?2840:C.startX;p.y=G;p.vx=0;p.vy=0;p.grounded=true;p.doubleJumpUsed=false;p.hp=p.maxHp;p.invuln=1.5;p.coyote=0;
    s.queue=0;s.lastAttack=-10;s.fireCd=0;s.windCd=0;animate('idle',true);
    for(const e of enemies)if(e.hp>0){const spec=C.encounters.find(a=>a.id===e.id);Object.assign(e,{x:spec.x,hp:spec.hp,phase:'patrol',age:0,cooldown:1,flash:0});}
    if(s.rescued){npc.x=p.x-120;npc.y=G;}bursts=[];effects=[];shots=[];labels=[];release();$('menuScreen').hidden=true;$('toast').hidden=true;s.camera=clamp(p.x-410,0,C.width-W);canvas.focus({preventScroll:true});toast('Điểm hồi sinh đã phục hồi.');updateUI(true);
  }
  function input(key){
    if(s.mode!=='playing')return;
    if(key==='jump'){
      if((p.grounded||p.coyote>0)&&!busy()){
        p.vy=JUMP;p.grounded=false;p.coyote=0;p.doubleJumpUsed=false;p.vx=move()*(running()?RUN:WALK);s.queue=0;s.lastAttack=-10;animate('jump',true);tone('jump');
      }else if(!p.grounded&&!p.doubleJumpUsed&&['jump','fall','airAttack'].includes(p.action)){
        p.vy=JUMP;p.doubleJumpUsed=true;s.queue=0;s.lastAttack=-10;animate('doubleJump',true);tone('jump');emit(p.x,p.y-8,'#b0dbd2',9);
      }
    }else if(key==='attack'){
      if(chain.includes(p.action)){if(s.queue<3-s.combo){s.queue++;s.lastAttack=s.time;}return;}
      if(busy())return;
      if(p.grounded){s.combo=s.time-s.lastAttack<=.42&&s.combo<3?s.combo+1:0;s.queue=0;s.lastAttack=s.time;animate(chain[s.combo],true);}else{animate('airAttack',true);s.queue=0;s.lastAttack=-10;}
      tone('hit');
    }else if(key==='dodge'&&p.grounded&&(!busy()||(chain.includes(p.action)&&p.effectDone))){
      if(move())p.facing=move();s.queue=0;s.lastAttack=-10;animate('dodge',true);p.invuln=Math.max(p.invuln,.32);tone('jump');
    }else if((key==='fire'||key==='wind')&&!busy()){
      if(!(key==='fire'?s.kills>0:s.rescued)){if(s.time-inputStamp>1){toast(key==='fire'?'Hỏa năng thức tỉnh sau khi hạ quái đầu tiên.':'Phong năng mở khóa khi cứu đồng nghiệp.');inputStamp=s.time;}return;}
      if(s[key+'Cd']>0)return;
      s[key+'Cd']=key==='fire'?2.8:4;s.queue=0;s.lastAttack=-10;animate(key,true);tone('spell');
    }
  }
  function emit(x,y,color,count){for(let i=0;i<count;i++){const a=i*2.399+s.time;bursts.push({x,y,vx:Math.cos(a)*(30+i*9),vy:Math.sin(a)*(35+i*8)-60,life:.25+i%4*.09,max:.55,color,size:i%3+1});}}
  function label(value,x,y,color='#c7e5c5'){labels.push({value,x,y,life:.9,color});}
  function hurt(damage,fromX){
    if(p.invuln>0||s.mode!=='playing')return;
    p.hp=Math.max(0,p.hp-damage);p.invuln=.95;s.queue=0;s.lastAttack=-10;animate(p.hp?'hurt':'death',true);tone('hurt');label('-'+damage,p.x,p.y-160,'#eab7ae');emit(p.x,p.y-75,'#b8d5d4',8);s.shake=reduced?0:5;
    if(!p.hp){s.mode='dying';release();}else if(p.grounded)p.x=clamp(p.x+Math.sign(p.x-fromX)*18,40,C.width-80);
  }
  function damageEnemy(e,damage,kind,face){
    if(e.hp<=0)return;
    e.hp=Math.max(0,e.hp-damage);e.flash=.12;e.phase='hurt';e.age=0;e.x=clamp(e.x+face*(kind==='attack4'?40:14),e.minX,e.maxX);label(String(damage),e.x,e.y-(e.elite?140:100));emit(e.x,e.y-45,'#9acbd3',8);tone('hit');s.hitCount++;s.shake=reduced?0:kind==='attack4'?4:1.5;
    if(e.hp===0){
      e.phase='dead';e.deadAge=0;s.kills++;const reward=e.elite?40:15;grantExperience(reward);label('+'+reward+' KN',e.x,e.y-125,'#d3dc9d');
      if(s.kills===1){toast('HỎA NĂNG THỨC TỈNH · U để thi triển',4);tone('quest');}
    }
  }
  function grantExperience(amount){
    s.xp+=amount;
    if(s.xp>=80&&s.level===1){s.level=2;p.maxHp=115;p.hp=Math.min(p.maxHp,p.hp+35);toast('CẤP 02 · Sinh lực được tăng cường',3.5);tone('quest');}
  }
  function attackBox(kind=p.action){
    const b=attacks[kind]?.box;if(!b)return null;
    return{x:p.x+(p.facing>0?b[0]:-b[2])*ART_SCALE,y:p.y+b[1]*ART_SCALE,w:(b[2]-b[0])*ART_SCALE,h:(b[3]-b[1])*ART_SCALE};
  }
  function enemyBox(e){const q=e.elite?1.35:1;return{x:e.x-44*q,y:e.y-78*q,w:91*q,h:74*q};}
  function strike(){
    if(p.effectDone)return;p.effectDone=true;
    const spec=attacks[p.action];
    if(spec){
      effects.push({kind:p.action,x:p.x,y:p.y,face:p.facing,age:.025,duration:8/assets.vfx.actions[p.action].fps});
      const box=attackBox();for(const e of enemies)if(e.hp>0&&overlaps(box,enemyBox(e)))damageEnemy(e,spec.damage+(s.level-1)*3,p.action,p.facing);
    }else if(p.action==='fire'||p.action==='wind'){
      shots.push({kind:p.action,x:p.x+p.facing*60,y:p.y-74,vx:p.facing*(p.action==='fire'?650:800),face:p.facing,age:0,life:p.action==='fire'?1.05:.7,hit:new Set()});
    }
  }
  function supports(x){return C.groundSections.some(([a,b])=>x>=a&&x<=b);}
  function updatePlayer(dt){
    p.age+=dt;p.invuln=Math.max(0,p.invuln-dt);p.coyote=Math.max(0,p.coyote-dt);
    const dir=move(),oldX=p.x,oldY=p.y;
    if(p.grounded&&p.action==='dodge')p.vx=p.facing*600*Math.max(.1,1-p.age/.45);
    else if(!busy()){if(dir)p.facing=dir;p.vx=dir*(running()?RUN:WALK);}
    else if(p.grounded)p.vx=0;
    else if(dir)p.vx=dir*(running()?RUN:WALK);
    p.x=clamp(p.x+p.vx*dt,45,C.width-100);
    // Solid obstacle sides, not merely decorative art.
    for(const b of C.platforms)if(p.y>b.y+3&&oldY-145<b.y+b.h&&p.x+21>b.x&&p.x-21<b.x+b.w){
      if(oldX+21<=b.x+.1)p.x=b.x-21;
      else if(oldX-21>=b.x+b.w-.1)p.x=b.x+b.w+21;
    }
    const standingPlatform=C.platforms.some(b=>p.x+14>b.x&&p.x-14<b.x+b.w&&Math.abs(p.y-b.y)<1);
    if(p.grounded&&!standingPlatform&&!supports(p.x)){p.grounded=false;p.coyote=.1;p.vy=0;animate('fall',true);}
    if(!p.grounded){
      p.vy+=GRAVITY*dt;p.y+=p.vy*dt;
      let floor=null;
      if(p.vy>=0){
        if(supports(p.x)&&oldY<=G+1&&p.y>=G)floor=G;
        for(const b of C.platforms)if(p.x+14>b.x&&p.x-14<b.x+b.w&&oldY<=b.y+1&&p.y>=b.y)floor=Math.min(floor??Infinity,b.y);
      }
      if(floor!==null){p.y=floor;p.vy=0;p.grounded=true;p.doubleJumpUsed=false;p.coyote=0;animate('land',true);emit(p.x,p.y-2,'#6f9995',5);}
      else if(p.vy>0&&p.action==='jump')animate('fall');
      if(p.y>H+180){p.hp=0;animate('death',true);s.mode='dying';p.y=H+180;release();return;}
    }
    const traveled=Math.abs(p.x-oldX),m=motions[p.action];
    if(['walk','run'].includes(p.action)){p.stride=(p.stride+traveled/(p.action==='run'?228:188))%1;p.frame=Math.floor(p.stride*m.frames.length);}
    else p.frame=m.loop?Math.floor(p.age*m.fps)%m.frames.length:Math.min(m.frames.length-1,Math.floor(p.age*m.fps));
    const contact=attacks[p.action]?.contact??2;
    if((attacks[p.action]||['fire','wind'].includes(p.action))&&p.age>=contact/m.fps)strike();
    if(!m.loop&&p.age>=m.frames.length/m.fps&&!['jump','death'].includes(p.action)){
      if(chain.includes(p.action)&&s.queue>0&&s.combo<3&&p.grounded){s.queue--;s.combo++;animate(chain[s.combo],true);tone('hit');}
      else{s.queue=0;animate(p.grounded?(dir?(running()?'run':'walk'):'idle'):'fall',true);}
    }
    if(p.grounded&&['idle','walk','run'].includes(p.action))animate(traveled>.01?(running()?'run':'walk'):'idle');
  }
  function updateEnemies(dt){
    for(const e of enemies){
      e.age+=dt;e.cooldown=Math.max(0,e.cooldown-dt);e.flash=Math.max(0,e.flash-dt);
      if(e.hp<=0){e.deadAge+=dt;continue;}
      const delta=p.x-e.x,near=Math.abs(delta)<420&&p.x>e.minX-180&&p.x<e.maxX+180;
      if(e.phase==='hurt'){if(e.age>.23){e.phase='patrol';e.age=0;e.cooldown=Math.max(e.cooldown,.3);}continue;}
      if(e.phase==='windup'){
        if(e.age>.62){e.phase='attack';e.age=0;e.attackHit=false;tone('hit');}continue;
      }
      if(e.phase==='attack'){
        if(e.age<.23)e.x=clamp(e.x+e.face*(e.elite?550:410)*dt,e.minX,e.maxX);
        const range={x:e.x+(e.face>0?15:-112),y:G-100,w:100,h:92};
        if(!e.attackHit&&e.age<.24&&overlaps(range,{x:p.x-20,y:p.y-125,w:40,h:125})){e.attackHit=true;hurt(e.elite?22:14,e.x);}
        if(e.age>.45){e.phase='patrol';e.age=0;e.cooldown=e.elite?1.1:1.25;}continue;
      }
      if(near){
        e.face=delta>=0?1:-1;
        if(Math.abs(delta)<145&&e.cooldown===0&&Math.abs(p.y-G)<145){e.phase='windup';e.age=0;}
        else if(Math.abs(delta)>94)e.x=clamp(e.x+e.face*(e.elite?85:76)*dt,e.minX,e.maxX);
      }else{
        e.x+=e.face*24*dt;if(e.x<=e.minX||e.x>=e.maxX){e.x=clamp(e.x,e.minX,e.maxX);e.face*=-1;}
      }
    }
  }
  function updateShots(dt){
    for(const b of shots){
      const old=b.x;b.x+=b.vx*dt;b.age+=dt;b.life-=dt;
      const box={x:Math.min(old,b.x)-13,y:b.y-24,w:Math.abs(b.x-old)+26,h:48};
      for(const e of enemies)if(e.hp>0&&!b.hit.has(e.id)&&overlaps(box,enemyBox(e))){b.hit.add(e.id);damageEnemy(e,b.kind==='fire'?34:24,b.kind,b.face);if(b.kind==='fire'){b.life=0;emit(b.x,b.y,'#f4b07b',12);break;}e.x=clamp(e.x+b.face*55,e.minX,e.maxX);}
    }
    shots=shots.filter(b=>b.life>0);
  }
  function events(dt){
    if(!s.noticeEnemy&&p.x>680){s.noticeEnemy=true;toast('J nối từng đòn · K né khi quái chớp báo hiệu',4);}
    if(!s.noticeGap&&p.x>2050){s.noticeGap=true;toast('SÀN BỊ ĐỨT · Chạy và nhảy, bấm Space lần hai trên không',5);}
    if(s.checkpoint<1&&p.x>C.checkpointX&&p.grounded){s.checkpoint=1;p.hp=p.maxHp;save();toast('ĐIỂM HỒI SINH · Sinh lực đã hồi đầy');tone('quest');}
    if(!s.rescued&&Math.abs(p.x-C.rescueX)<155&&p.grounded&&!enemies.some(e=>e.id.startsWith('guard')&&e.hp>0)){
      animate('idle',true);showDialogue(C.rescue,()=>{s.rescued=true;s.checkpoint=2;grantExperience(25);p.hp=p.maxHp;npc.frame=1;save();toast('ĐỒNG NGHIỆP ĐÃ ĐI CÙNG · Phong năng mở khóa',4);tone('quest');});return;
    }
    if(s.rescued){
      const target=p.x-p.facing*112,dist=target-npc.x;
      npc.facing=dist>=0?1:-1;
      if(Math.abs(dist)>20){npc.x+=Math.sign(dist)*Math.min(RUN*1.08*dt,Math.abs(dist));npc.frame=2+Math.floor(s.time*7)%2;}else npc.frame=1;
      // The rescued coworker follows the safe corridor; climbing rubble uses a clear hop.
      npc.y=G;for(const b of C.platforms)if(npc.x>b.x-20&&npc.x<b.x+b.w+20)npc.y=b.y;
    }
    const finalHostiles=enemies.some(e=>(e.id.startsWith('rift')||e.id==='warden')&&e.hp>0);
    if(p.x>6060&&(!s.rescued||finalHostiles)){p.x=6060;if(s.time-inputStamp>3){toast(!s.rescued?'Còn một người mắc kẹt phía sau.':'Hạ kẻ canh cổng để mở đường thoát.');inputStamp=s.time;}}
    if(p.x>C.exitX&&s.rescued&&!finalHostiles&&Math.abs(npc.x-p.x)<260&&p.grounded){
      animate('idle',true);showDialogue(C.ending,()=>{try{localStorage.removeItem(SAVE_KEY);}catch{}saved=null;menu('complete');tone('quest');});
    }
  }
  function update(dt){
    if(s.mode==='dying'){p.age+=dt;p.frame=Math.min(3,Math.floor(p.age*6));if(p.age>.9)menu('dead');return;}
    if(s.mode!=='playing')return;
    s.time+=dt;s.elapsed+=dt;s.fireCd=Math.max(0,s.fireCd-dt);s.windCd=Math.max(0,s.windCd-dt);s.shake=Math.max(0,s.shake-dt*22);
    if(s.toast>0){s.toast-=dt;if(s.toast<=0)$('toast').hidden=true;}
    updatePlayer(dt);if(s.mode!=='playing')return;updateEnemies(dt);updateShots(dt);events(dt);
    for(const e of effects)e.age+=dt;effects=effects.filter(e=>e.age<e.duration);
    for(const b of bursts){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=240*dt;b.life-=dt;}bursts=bursts.filter(b=>b.life>0);
    for(const l of labels){l.y-=28*dt;l.life-=dt;}labels=labels.filter(l=>l.life>0);
    const aim=clamp(p.x-410,0,C.width-W);s.camera+= (aim-s.camera)*(1-Math.exp(-dt*6));
  }
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
  function line(points,color,width=1){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function text(value,x,y,size=10,color='#a3c8bc',align='left'){ctx.font=size+'px Consolas,monospace';ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(value,x,y);}
  function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function shadow(x,y,w){ctx.fillStyle='#030c1388';ctx.beginPath();ctx.ellipse(x,y+3,w,6,0,0,Math.PI*2);ctx.fill();}
  function worldArt(name,frame,x,y,scale,face=1){
    const sheet=assets.world[name],f=sheet.frames[frame];ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(face,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(sheet.image,f.x,f.y,f.w,f.h,-f.anchorX*scale,-f.anchorY*scale,f.w*scale,f.h*scale);ctx.restore();
  }
  function hero(x=p.x,y=p.y){
    const m=motions[p.action],cycle=Math.floor(s.time*m.fps/m.frames.length);let f=m.frames[p.frame]||m.frames[0];
    if(m.blink&&cycle%m.blink.everyCycles===m.blink.cycleOffset&&m.blink.poses.includes(p.frame))f=m.blinks.find(a=>a.order===p.frame)||f;
    const scale=HEAD/f.headWidth;shadow(x,G,38);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(p.facing,1);ctx.imageSmoothingEnabled=false;
    if(p.invuln>0&&Math.floor(s.time*14)%2===0)ctx.globalAlpha=.55;
    ctx.drawImage(f.image,f.x,f.y,f.w,f.h,-f.anchorX*scale,-f.anchorY*scale,f.w*scale,f.h*scale);ctx.restore();
    const ox=x-p.facing*70,oy=y-145+(reduced?0:Math.sin(s.time*3)*5);glow(ox,oy,22,'#cde8b544');rect(ox-3,oy-3,6,6,'#dce9b1');rect(ox-1,oy-1,2,2,'#ffffe4');
  }
  function drawBackground(){
    rect(0,0,W,H,'#0b1820');ctx.imageSmoothingEnabled=false;
    // Art is the distant layer; architecture and collidable floor use world coordinates.
    const tileW=1600,offset=-(s.camera*.27)%tileW;
    for(let i=-1;i<2;i++)ctx.drawImage(assets.office,offset+i*tileW,-4,tileW,720);
    rect(0,0,W,H,'#05131b33');
    for(let i=0;i<24;i++){const x=((i*163+37-s.camera*.45)%W+W)%W,y=(i*79+s.time*(6+i%3))%550;rect(x,y,i%5===0?2:1,2,i%4?'#a2c5b329':'#cce7d066');}
  }
  function drawArchitecture(){
    for(const [a,b]of C.groundSections){
      rect(a,G,b-a,H-G,'#14232a');rect(a,G,b-a,5,'#6d8781');rect(a,G+5,b-a,3,'#21393f');
      for(let x=Math.floor(a/96)*96;x<b;x+=96){line([[x,G+9],[x-35,H]],'#30434a77');rect(x+15,G+44,35,1,'#68877922');}
      rect(a,H-22,b-a,22,'#0b181f');
    }
    // Deep cut in the floor; never a painted gap over a solid collider.
    rect(2320,G-20,300,H-G+20,'#050e18');
    for(let i=0;i<8;i++){line([[2320-i*2,G+5+i*10],[2340+i*5,G+17+i*13]],'#364c53',3);line([[2620+i*2,G+7+i*9],[2600-i*4,G+25+i*12]],'#273d4b',3);}
    glow(2470,690,120,'#4060a026');
    for(const b of C.platforms){
      rect(b.x,b.y,b.w,b.h,'#243b42');rect(b.x,b.y,b.w,4,'#718c87');rect(b.x+4,b.y+5,b.w-8,b.h-9,'#1c3039');
      for(let x=b.x+9;x<b.x+b.w-8;x+=31){rect(x,b.y+12,23,b.h-24,b.kind==='cabinet'?'#30434b':'#34434c');rect(x+8,b.y+20,9,2,'#72847c');}
      if(b.kind==='rubble')line([[b.x,b.y+30],[b.x+43,b.y+13],[b.x+72,b.y+52],[b.x+b.w,b.y+15]],'#78908a66',2);
    }
    // Identifiable places and small environmental storytelling.
    for(const x of [180,800,1900,2820,3650,4430,5670]){
      rect(x,123,127,31,'#0b1c25e8');rect(x,123,3,31,'#739b8a');
      text(x<2200?'KHU LÀM VIỆC':x<3800?'HÀNH LANG ĐÔNG':'LỐI THOÁT →',x+12,143,9,'#b6cec1');
    }
    for(let i=0;i<18;i++){const x=480+i*317;if(x>2290&&x<2670)continue;rect(x,G-5,17+i%4*6,5,'#34494b');rect(x+24,G-3,10,3,'#6c7f75');}
    // Checkpoint beacon.
    const bx=C.checkpointX+32;rect(bx-9,G-59,18,59,'#263f45');rect(bx-13,G-61,26,5,'#8cbcb2');glow(bx,G-50,30,'#a6dfba33');rect(bx-3,G-48,6,15,s.checkpoint?'#d5edb4':'#85c8c0');text('ĐIỂM HỒI SINH',bx,G-77,9,'#acd5c5','center');
    // Invasion portal and stairwell door are landmarks, not teleport mechanics.
    const px=4930;glow(px,340,250,'#55419138');
    for(let n=0;n<4;n++){ctx.strokeStyle=n%2?'#8dbde36b':'#8975bf7a';ctx.lineWidth=n===0?3:1;ctx.beginPath();ctx.ellipse(px,350,66+n*9+Math.sin(s.time+n)*2,177+n*4,0,0,Math.PI*2);ctx.stroke();}
    for(let i=0;i<10;i++){const a=s.time*.3+i*.63;rect(px+Math.cos(a)*(76+i%2*9),350+Math.sin(a)*180,3,9,'#b7b2e577');}
    const door=C.exitX;rect(door-75,246,152,G-246,'#0b1e25');rect(door-81,240,164,9,'#57746c');rect(door-81,249,8,G-249,'#3d5b57');rect(door+75,249,8,G-249,'#3d5b57');
    rect(door-66,258,132,G-258,s.rescued&&!enemies.some(e=>(e.id.startsWith('rift')||e.id==='warden')&&e.hp>0)?'#193f3b':'#122b30');
    for(let i=0;i<5;i++)rect(door-40+i*15,G-70-i*23,70-i*10,8,'#496861');
    rect(door-59,204,118,23,'#aac8a3');text('THOÁT HIỂM →',door,220,10,'#142e2a','center');glow(door,300,130,'#9bcb9b18');
  }
  function drawEnemy(e){
    if(e.hp<=0&&e.deadAge>1.5)return;
    const scale=e.elite?.58:.43;let frame=e.phase==='windup'?3:e.phase==='attack'?4:e.phase==='hurt'?5:e.hp<=0?(e.deadAge<.2?6:7):1+Math.floor(s.time*6)%2;
    shadow(e.x,G,e.elite?65:46);ctx.save();if(e.hp<=0)ctx.globalAlpha=clamp(1-(e.deadAge-.6)/.9,0,1);
    worldArt('void-crawler',frame,e.x,e.y,scale,-e.face);ctx.restore();
    if(e.hp>0){
      const w=e.elite?96:64,y=G-(e.elite?145:111);rect(e.x-w/2,y,w,3,'#263b46');rect(e.x-w/2,y,w*e.hp/e.maxHp,3,e.elite?'#b89ccc':'#89b8b3');
      if(e.elite)text('KẺ CANH CỔNG',e.x,y-12,9,'#c8b7dc','center');
      if(e.phase==='windup'){text('!',e.x,G-(e.elite?165:135),21,'#f0bb82','center');ctx.strokeStyle='#d9a97a99';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x+e.face*45,G-3,66,8,0,0,Math.PI*2);ctx.stroke();}
    }
  }
  function drawPressure(effect,front=false){
    const a=assets.vfx.actions[effect.kind],frame=a.frames[Math.min(7,Math.floor(effect.age*a.fps))];
    const fist=attacks[effect.kind].fist,root=a.effectRoot||fist;
    const ox=effect.x+effect.face*root[0]*ART_SCALE,oy=effect.y+root[1]*ART_SCALE,scale=a.uniformSourceScale*ART_SCALE;
    ctx.save();
    if(effect.kind==='attack4'){ctx.beginPath();ctx.rect(s.camera,front?oy:0,W,front?H-oy:oy);ctx.clip();}
    ctx.translate(ox,oy);ctx.scale(effect.face,1);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=a.opacity;ctx.filter='none';ctx.shadowBlur=0;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(textures.get(a.image),frame.x,frame.y,frame.w,frame.h,-frame.anchorX*scale,-frame.anchorY*scale,frame.w*scale,frame.h*scale);ctx.restore();
  }
  function drawShot(b){
    ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.face,1);
    if(b.kind==='fire'){
      glow(-5,0,29,'#ed9f5d33');
      for(let i=0;i<6;i++){const x=-i*10,y=Math.sin(b.age*28+i)*4;rect(x-8,y-7+i*.5,13,12-i,'#d77f4e');rect(x-6,y-4,9,6,'#e8bd77');}
      rect(0,-7,12,14,'#f2d59a');rect(10,-4,4,8,'#fae6ba');
    }else{
      for(let i=0;i<4;i++){ctx.strokeStyle=i%2?'#bfe5dcaa':'#6cafbf88';ctx.lineWidth=i%2?2:3;ctx.beginPath();ctx.ellipse(-i*13,0,12,22-i*2,0,-1.4,1.4);ctx.stroke();}line([[-65,-9],[-24,-6],[0,0]],'#b1d6cc66',2);
    }ctx.restore();
  }
  function draw(){
    if(!s.ready)return;
    ctx.setTransform(1,0,0,1,0,0);drawBackground();ctx.save();
    const shake=s.mode==='playing'&&!reduced?s.shake:0;
    ctx.translate(-Math.round(s.camera)+Math.sin(s.time*92)*shake,Math.cos(s.time*71)*shake*.5);drawArchitecture();
    if(s.mode==='title'){hero(860,G);text('CÔNG TY / TẦNG 07',850,G+38,9,'#aac4b2','center');}
    else{
      for(const e of enemies)if(e.x>s.camera-250&&e.x<s.camera+W+250)drawEnemy(e);
      shadow(npc.x,npc.y,35);worldArt('coworker',npc.frame,npc.x,npc.y,.29,npc.facing);
      if(!s.rescued){text('CÓ NGƯỜI CÒN SỐNG',npc.x,G-185,9,'#d9c3a0','center');text('◆',npc.x,G-203,12,'#ddc58d','center');}
      for(const e of effects)drawPressure(e);
      hero();for(const e of effects)if(e.kind==='attack4')drawPressure(e,true);
      for(const b of shots)drawShot(b);
      for(const b of bursts){ctx.globalAlpha=clamp(b.life/b.max,0,1);rect(b.x,b.y,b.size,b.size,b.color);}ctx.globalAlpha=1;
      for(const l of labels){ctx.globalAlpha=clamp(l.life*2,0,1);text(l.value,l.x,l.y,12,l.color,'center');}ctx.globalAlpha=1;
    }
    ctx.restore();
    const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#04111b55');shade.addColorStop(.25,'#04111b00');shade.addColorStop(.8,'#04111b00');shade.addColorStop(1,'#04111b77');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
    updateUI();
  }
  function updateUI(force=false){
    const stage=p.x<2200?0:p.x<3450?1:p.x<4250?2:3;
    const objective=s.rescued?'Cùng đồng nghiệp tới lối thoát':p.x>2730?'Cứu đồng nghiệp mắc kẹt':'Tìm người còn sống';
    const detail=s.rescued?'Dọn sạch quái quanh cổng. Cầu thang ở phía đông.':p.x>2730?'Hạ hai quái vật đang chặn hành lang.':p.x>2050?'Vượt sàn đứt bằng nhảy lần hai.':'Tiến về phía đông. Tinh linh sẽ dẫn đường.';
    const stamp=[p.hp,p.maxHp,s.xp,s.level,s.rescued,s.kills,stage,objective,detail,Math.ceil(s.fireCd*10),Math.ceil(s.windCd*10),p.doubleJumpUsed,p.grounded,Math.floor(p.x/10)].join(':');if(!force&&stamp===uiStamp)return;uiStamp=stamp;
    $('healthFill').style.width=p.hp/p.maxHp*100+'%';$('healthText').textContent=p.hp+' / '+p.maxHp;$('healthBar').setAttribute('aria-valuenow',p.hp);$('healthBar').setAttribute('aria-valuemax',p.maxHp);$('xpText').textContent=s.xp+' KN';$('levelNumber').textContent='LV. 0'+s.level;
    $('objectiveTitle').textContent=objective;$('objectiveDetail').textContent=detail;
    for(const kind of ['fire','wind']){const locked=kind==='fire'?s.kills===0:!s.rescued;const e=$(kind+'Cooldown');e.hidden=!locked&&s[kind+'Cd']===0;e.textContent=locked?'KHÓA':s[kind+'Cd'].toFixed(1)+'s';}
    $('jumpStatus').textContent=p.doubleJumpUsed?'↑ ĐÃ DÙNG NHẢY LẦN HAI':p.grounded?'↑ NHẢY LẦN HAI SẴN SÀNG':'↑ SPACE LẦN NỮA ĐỂ NHẢY';
    $('progressFill').style.width=clamp(p.x/C.exitX*100,0,100)+'%';$('locationLabel').textContent=['01 / KHU LÀM VIỆC','02 / SÀN ĐỔ VỠ','03 / ĐỒNG NGHIỆP','04 / LỐI THOÁT'][stage];$('progressText').textContent=s.rescued?'ĐỒNG NGHIỆP ĐI CÙNG →':'TÌM LỐI THOÁT →';
  }
  function bind(){
    $('startButton').onclick=()=>start(false);$('continueButton').onclick=()=>start(true);$('dialogueNext').onclick=advanceDialogue;$('pauseButton').onclick=()=>{if(s.mode==='playing')menu('paused');};$('resumeButton').onclick=resume;$('retryButton').onclick=retry;$('newGameButton').onclick=()=>start(false);
    $('soundButton').onclick=async()=>{soundEnabled=!soundEnabled;if(soundEnabled){const A=window.AudioContext||window.webkitAudioContext;if(A){audio||=new A();await audio.resume();tone('quest');}else soundEnabled=false;}$('soundButton').setAttribute('aria-pressed',soundEnabled);$('soundState').textContent=soundEnabled?'BẬT':'TẮT';};
    $('fullscreenButton').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('gameViewport').requestFullscreen();}catch{toast('Trình duyệt này chưa hỗ trợ chế độ toàn màn hình.');}};
    document.addEventListener('fullscreenchange',()=>{
      if(document.fullscreenElement===$('gameViewport'))$('gameViewport').append($('levelTouch'));
      else document.querySelector('main').append($('levelTouch'));
    });
    const keys={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',KeyJ:'attack',KeyK:'dodge',KeyU:'fire',KeyI:'wind',ShiftLeft:'run',ShiftRight:'run'};
    window.addEventListener('keydown',e=>{
      if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
      if(e.code==='Escape'){e.preventDefault();if(e.repeat)return;if(s.mode==='playing')menu('paused');else if(s.mode==='paused')resume();return;}
      if(s.mode==='dialogue'){if(e.code==='Enter'&&!e.repeat){e.preventDefault();advanceDialogue();}return;}
      if(e.code==='KeyR'&&!e.repeat&&['dead','paused'].includes(s.mode)){e.preventDefault();retry();return;}
      const key=keys[e.code];if(!key)return;
      if(e.target.tagName==='BUTTON'&&(e.code==='Space'||e.code==='Enter'))return;
      e.preventDefault();if(s.mode!=='playing')return;
      if(['left','right','run'].includes(key))held.add(key);else if(!e.repeat)input(key);
    });
    window.addEventListener('keyup',e=>{if(keys[e.code])held.delete(keys[e.code]);});
    window.addEventListener('blur',()=>{release();if(s.mode==='playing')menu('paused');});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){release();if(s.mode==='playing')menu('paused');}});
    for(const b of document.querySelectorAll('[data-key]')){
      let pointer=null;const key=b.dataset.key;
      b.addEventListener('pointerdown',e=>{e.preventDefault();if(pointer!==null||s.mode!=='playing')return;pointer=e.pointerId;b.setPointerCapture(pointer);b.classList.add('is-held');if(['left','right','run'].includes(key))touch.add(key);else input(key);});
      const up=e=>{if(pointer!==null&&e.pointerId!==undefined&&e.pointerId!==pointer)return;pointer=null;touch.delete(key);b.classList.remove('is-held');};
      b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);b.addEventListener('click',e=>{if(e.detail===0&&!['left','right','run'].includes(key))input(key);});
      b.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)&&['left','right','run'].includes(key)){e.preventDefault();if(s.mode==='playing'){touch.add(key);b.classList.add('is-held');}}});
      b.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code))up(e);});
    }
    canvas.onpointerdown=()=>canvas.focus({preventScroll:true});
  }
  async function json(path){const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw Error('Không tải được '+path);return r.json();}
  async function image(path){const im=new Image();im.src=path;await im.decode();return im;}
  async function load(){
    try{
      const embedded=window.DI_MON_LEVEL_ASSETS;
      const [manifest,vfx,world]=embedded?[embedded.hero,embedded.vfx,embedded.world]:await Promise.all([json('./sprite-manifest.json'),json('./art/vfx/air-pressure-v2/manifest.json'),json('./art/chapter-one/manifest.json')]);
      assets.vfx=vfx;assets.world=world;
      await Promise.all([
        ...manifest.pages.map(async page=>{const im=await image(page.src);for(const f of page.frames){const m=motions[f.action];if(!m)continue;if(page.fps)m.fps=page.fps;if(page.blink)m.blink=page.blink;(f.variant==='blink'?m.blinks:m.frames).push({...f,image:im});}}),
        ...Object.values(world).map(async a=>{a.image=await image(a.src);}),
        ...[...new Set(Object.values(vfx.actions).map(a=>a.image))].map(async name=>{
          const im=await image(embedded?embedded.vfxImages[name]:'./art/vfx/air-pressure-v2/'+name);
          if(name===vfx.actions.attack1.image){
            const material=document.createElement('canvas');material.width=im.width;material.height=im.height;const c=material.getContext('2d');c.drawImage(im,0,0);c.globalCompositeOperation='destination-out';
            for(let row=0;row<2;row++)for(let col=0;col<4;col++){const x=Math.floor(col*im.width/4),y=Math.floor(row*im.height/2),w=64,g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#000');g.addColorStop(.35,'#000b');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(x,y,w,Math.ceil(im.height/2));}textures.set(name,material);
          }else textures.set(name,im);
        }),
        image(embedded?embedded.office:'./art/chapter-one/office-night.png').then(im=>assets.office=im)
      ]);
      for(const m of Object.values(motions)){m.frames.sort((a,b)=>(a.order??a.row*4+a.col)-(b.order??b.row*4+b.col));if(!m.frames.length)throw Error('Thiếu hoạt ảnh nhân vật');}
      saved=readSave();$('continueButton').hidden=!saved;s.ready=true;$('startButton').disabled=false;$('loadingText').textContent='A / D DI CHUYỂN · J CHIẾN ĐẤU · SPACE NHẢY ×2';bind();requestAnimationFrame(loop);
      if(!embedded&&'serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./level-sw.js').catch(()=>{});
    }catch(e){console.error(e);$('loadingText').textContent='Không tải được màn chơi. Hãy tải lại trang.';}
  }
  function loop(now){
    const dt=last?clamp((now-last)/1000,0,.1):0;last=now;accumulator+=dt;
    while(accumulator>=STEP){update(STEP);accumulator-=STEP;}draw();requestAnimationFrame(loop);
  }
  window.diMonLevel=Object.freeze({getState:()=>({ready:s.ready,mode:s.mode,x:p.x,y:p.y,vx:p.vx,vy:p.vy,grounded:p.grounded,doubleJumpUsed:p.doubleJumpUsed,action:p.action,frame:p.frame,hp:p.hp,maxHp:p.maxHp,invulnerable:p.invuln>0,checkpoint:s.checkpoint,rescued:s.rescued,kills:s.kills,xp:s.xp,level:s.level,elapsed:s.elapsed,camera:s.camera,combo:s.combo+1,queuedStrikes:s.queue,hitCount:s.hitCount,fireCooldown:s.fireCd,windCooldown:s.windCd,npc:{...npc},enemies:enemies.map(e=>({id:e.id,x:e.x,hp:e.hp,phase:e.phase,age:e.age,face:e.face})),effects:effects.map(e=>({...e})),projectiles:shots.length,dialogueIndex:dialogue?.index??null,renderer:'whole-character-frames',headWidth:HEAD}),getAttackBox:attackBox});
  load();
})();
