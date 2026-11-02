/* Dị Môn: opening chapter. Whole-character artwork is shared with the lab. */
(() => {
  'use strict';
  const C = window.DI_MON_CHAPTER, P = window.DiMonPhysics, $ = id => document.getElementById(id);
  const canvas = $('levelCanvas'), ctx = canvas.getContext('2d', { alpha:false });
  const W=1280, H=720, G=C.ground, HEAD=110, ART_SCALE=HEAD/132;
  const view=window.DiMonView.create({canvasWidth:W,canvasHeight:H,worldWidth:C.width,worldHeight:C.height,ground:G,zoom:C.cameraZoom||1,groundLine:C.cameraGroundLine||520,lockY:Boolean(C.cameraLockY)});
  const VIEW_W=view.width,VIEW_H=view.height;
  const GRAVITY=1850, JUMP=-700, WALK=235, RUN=370, STEP=1/120;
  const SAVE_KEY=(C.saveKey||'di-mon:chapter-one:descent-v2')+(C.sample?':sample':'');
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
  const assets={}, s={ready:false,mode:'title',time:0,elapsed:0,camera:0,cameraY:0,checkpoint:0,rescued:false,deepest:0,bossSeen:false,kills:0,xp:0,level:1,deaths:0,hitCount:0,combo:0,queue:0,lastAttack:-10,fireCd:0,windCd:0,toast:0,shake:0,noticeGap:false,noticeEnemy:false};
  const p={floor:0,x:C.startX,y:G,vx:0,vy:0,facing:1,grounded:true,doubleJumpUsed:false,action:'idle',age:0,frame:0,stride:0,effectDone:false,hp:100,maxHp:100,invuln:0,coyote:0};
  let enemies=[], bursts=[], shots=[], effects=[], labels=[], npc=makeNpc();
  let dialogue=null,last=0,accumulator=0,audio=null,soundEnabled=false,saved=null;
  let uiStamp='',inputStamp=0;


  const floorSolids=C.floors.flatMap(f=>{
    const spans=f.hole?[[0,f.hole[0]],[f.hole[1],C.width]]:[[0,C.width]];
    return spans.map(([a,b])=>({x:a,y:f.y,w:b-a,h:48,floor:f.index,kind:'slab'}));
  });
  const openSolids=[...floorSolids,...C.platforms];
  const rescueHole=C.floors[C.rescueFloor].hole;
  const rescueBridge=rescueHole?{x:rescueHole[0],y:C.floors[C.rescueFloor].y,w:380,h:48,floor:C.rescueFloor,kind:'rescue-bridge'}:null;
  const closedSolids=rescueBridge?[...openSolids,rescueBridge]:openSolids;
  const street=C.chapter===2?window.DiMonStreet.create({C,P,ctx,W,H,view,s,p,assets,clamp,overlaps,rect,line,text,glow,shadow,worldArt,toast,showDialogue,animate,save,grantExperience,hurt,emit,tone,label,damageEnemy,enemyBox,release,focus:()=>canvas.focus({preventScroll:true}),enemies:()=>enemies,npc:()=>npc,setNpc:value=>npc=value,makeNpc,complete:finishChapter}):null;
  const solids=()=>street?street.solids():s.rescued?openSolids:closedSolids;
  const floorName=i=>C.floors[i].number?'TẦNG '+String(C.floors[i].number).padStart(2,'0'):'TẦNG TRỆT';
  function makeNpc(floor=C.rescueFloor,x=C.rescueX,rescued=false){return{floor,x,y:C.floors[floor].y,vx:0,vy:0,grounded:true,bodyHalf:17,footHalf:11,bodyHeight:140,frame:rescued?1:0,facing:1};}
  function checkpoint(){return C.checkpoints.find(c=>c.id===s.checkpoint)||C.checkpoints[0];}

  function readSave(){
    try {
      const a=JSON.parse(localStorage.getItem(SAVE_KEY)||(!C.sample&&C.legacySaveKey?localStorage.getItem(C.legacySaveKey):null));
      if(!a||![C.id,...(!C.sample&&C.legacyChapterId?[C.legacyChapterId]:[])].includes(a.chapter)||!C.checkpoints.some(c=>c.id===a.checkpoint&&c.id>0)||!Array.isArray(a.defeated))return null;
      const valid=new Set(C.encounters.map(e=>e.id));
      const defeated=new Set(a.defeated.filter(id=>valid.has(id)));
      if(a.chapter===C.legacyChapterId&&a.street?.delivered)for(const e of C.encounters)if(e.wave)defeated.add(e.id);
      return{checkpoint:a.checkpoint,rescued:Boolean(a.rescued),xp:clamp(Number(a.xp)||0,0,1000),elapsed:clamp(Number(a.elapsed)||0,0,86400),defeated:[...defeated],street:street?.sanitizeSave(a.street)};
    }catch{return null;}
  }

  function save(){
    if(!s.checkpoint)return;
    const value={chapter:C.id,checkpoint:s.checkpoint,rescued:s.rescued,xp:s.xp,elapsed:s.elapsed,defeated:enemies.filter(e=>e.hp<=0).map(e=>e.id),street:street?.serialize()};
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
  function makeEnemies(defeated=[]){return C.encounters.map((e,i)=>({...e,maxHp:e.hp,hp:defeated.includes(e.id)?0:e.hp,phase:'patrol',age:0,cooldown:.6+i*.13,face:-1,attackCount:0,attackType:'charge',attackHit:false,deadAge:defeated.includes(e.id)?10:0,flash:0}));}
  function start(continuing=false){
    if(!s.ready)return;
    const a=continuing?saved:null;s.hitstop=0;
    Object.assign(s,{mode:'playing',time:0,elapsed:a?.elapsed||0,camera:0,cameraY:0,checkpoint:a?.checkpoint||0,deepest:0,bossSeen:false,rescued:a?.rescued||Boolean(C.startRescued),kills:a?.defeated.length||0,xp:a?.xp??window.DiMonCampaign?.entry(C.chapter||1,{xp:C.startXP||0}).xp??(C.startXP||0),level:1,deaths:0,hitCount:0,combo:0,queue:0,lastAttack:-10,fireCd:0,windCd:0,shake:0,toast:0,noticeGap:false,noticeEnemy:false});
    const rules=C.levelRules||[{xp:80,level:2,maxHp:115}],rank=rules.filter(r=>s.xp>=r.xp).at(-1);s.level=rank?.level||1;const maxHp=rank?.maxHp||100;
    if(C.sample&&!a)s.checkpoint=1;
    const cp=C.sample&&!a?{floor:0,x:C.sampleStartX}:checkpoint();
    Object.assign(p,{floor:cp.floor,x:cp.x,y:C.floors[cp.floor].y,vx:0,vy:0,facing:cp.floor%2?-1:1,grounded:true,doubleJumpUsed:false,hp:maxHp,maxHp,invuln:0,coyote:0});
    s.deepest=cp.floor;s.bossSeen=cp.floor===7;
    animate('idle',true);enemies=makeEnemies(a?.defeated);bursts=[];shots=[];effects=[];labels=[];npc=s.rescued?makeNpc(cp.floor,p.x+(C.chapter===2?-100:100),true):makeNpc();street?.reset(a?.street);if(street)s.kills=enemies.filter(e=>e.hp<=0&&!e.environmental&&!(C.sample&&e.id==='street-hound')).length;
    release();dialogue=null;$('dialogue').hidden=true;$('titleScreen').hidden=true;$('menuScreen').hidden=true;$('hud').hidden=false;$('spellbar').hidden=false;$('toast').hidden=true;
    document.body.classList.add('is-playing');
    const camera=view.target(p);s.camera=camera.x;s.cameraY=camera.y;canvas.focus({preventScroll:true});updateUI(true);
    inputStamp=-10;
    if(!a)showDialogue(C.sample?C.sampleIntro:C.intro,()=>toast(C.chapter===2?'Hộ tống tới trạm cứu thương · U / I dùng lửa / gió':'A / D di chuyển · J đánh · Space nhảy',4));
    else toast('Đã trở lại điểm hồi sinh.');
  }
  function finishChapter(){try{localStorage.removeItem(SAVE_KEY);if(!C.sample&&C.legacySaveKey)localStorage.removeItem(C.legacySaveKey);}catch{}saved=null;menu('complete');tone('quest');}
  function menu(kind){
    release();s.mode=kind;$('menuScreen').hidden=false;$('resumeButton').hidden=kind!=='paused';$('resultStats').hidden=kind!=='complete';$('retryButton').hidden=kind==='complete';
    $('menuLabel').textContent=kind==='complete'?'CHƯƠNG 01 / HOÀN THÀNH':kind==='dead'?'TÍN HIỆU BỊ GIÁN ĐOẠN':'TẠM DỪNG';
    $('menuTitle').textContent=kind==='complete'?'Bên kia cánh cửa.':kind==='dead'?'Đứng dậy lần nữa.':'Một nhịp thở.';
    $('menuText').textContent=kind==='complete'?'Anh đã đi từ tầng 7 xuống tầng trệt, cứu đồng nghiệp và hạ Kẻ Gác Cửa. Bên ngoài, đêm xâm lấn mới chỉ bắt đầu.':kind==='dead'?'Tinh linh giữ lại ký ức tại điểm hồi sinh gần nhất.':'Hành trình vẫn đang chờ anh.';
    if($('nextChapterButton')){$('nextChapterButton').hidden=kind!=='complete'||C.chapter===2;$('nextChapterButton').href='./chapter-two.html?from=chapter1&xp='+s.xp;}
    if(kind==='complete'){
      window.DiMonCampaign?.complete(C.chapter||1,{xp:s.xp});
      if(C.chapter===2){$('menuLabel').textContent='CHƯƠNG 02 / HOÀN THÀNH';$('menuTitle').textContent='Một con đường được mở.';$('menuText').textContent='Đồng nghiệp đã an toàn. Hai ổ dị giới đã bị phá, Kẻ Truy Sát đã gục và tuyến sơ tán được mở lại.';}
      const stats=[[s.kills,'QUÁI HẠ GỤC'],[`${Math.floor(s.elapsed/60)}:${String(Math.floor(s.elapsed%60)).padStart(2,'0')}`,'THỜI GIAN'],['01','NGƯỜI ĐƯỢC CỨU']];
      $('resultStats').replaceChildren(...stats.map(([value,label])=>{const el=document.createElement('span'),n=document.createElement('strong');n.textContent=value;el.append(n,label);return el;}));
    }
    (kind==='paused'?$('resumeButton'):kind==='dead'?$('retryButton'):$('newGameButton')).focus({preventScroll:true});
  }
  function resume(){if(s.mode!=='paused')return;s.mode='playing';$('menuScreen').hidden=true;release();canvas.focus({preventScroll:true});}
  function retry(){
    if(!['dead','paused'].includes(s.mode))return;
    const cp=checkpoint();s.deaths++;s.mode='playing';
    Object.assign(p,{floor:cp.floor,x:cp.x,y:C.floors[cp.floor].y,vx:0,vy:0,grounded:true,doubleJumpUsed:false,hp:p.maxHp,invuln:1.5,coyote:0});
    s.queue=0;s.lastAttack=-10;s.fireCd=0;s.windCd=0;s.hitstop=0;animate('idle',true);
    for(const e of enemies)if(e.hp>0){const spec=C.encounters.find(a=>a.id===e.id);Object.assign(e,{x:spec.x,y:spec.y,hp:spec.hp,phase:'patrol',age:0,cooldown:1,flash:0,attackHit:false});}
    if(s.rescued)npc=makeNpc(cp.floor,p.x+90,true);street?.afterRetry();
    bursts=[];effects=[];shots=[];labels=[];release();$('menuScreen').hidden=true;$('toast').hidden=true;
    const camera=view.target(p);s.camera=camera.x;s.cameraY=camera.y;canvas.focus({preventScroll:true});toast('Điểm hồi sinh đã phục hồi.');updateUI(true);
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
      if(!(key==='fire'?s.kills>0||C.startFire:s.rescued)){if(s.time-inputStamp>1){toast(key==='fire'?'Hỏa năng thức tỉnh sau khi hạ quái đầu tiên.':'Phong năng mở khóa khi cứu đồng nghiệp.');inputStamp=s.time;}return;}
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
    if(e.hp<=0||e.dormant)return;
    damage=street?.beforeDamage(e,damage,kind)??damage;
    e.hp=Math.max(0,e.hp-damage);e.flash=.12;if(!e.resistStagger&&(!e.boss||['attack3','attack4','wind'].includes(kind)&&e.phase!=='attack')){e.phase='hurt';e.age=0;}if(kind!=='burn')e.x=clamp(e.x+face*(kind==='attack4'?40:14),e.minX,e.maxX);label(String(damage),e.x,e.y-(e.elite?140:100));if(kind!=='burn'){emit(e.x,e.y-45,'#9acbd3',8);tone('hit');s.hitCount++;s.shake=reduced?0:kind==='attack4'?4:1.5;if(street)s.hitstop=Math.max(s.hitstop||0,kind==='attack4'?.065:.035);}
    street?.afterDamage(e,kind);
    if(e.hp===0){
      e.phase='dead';e.deadAge=0;if(!e.environmental)s.kills++;const reward=e.reward??(e.elite?40:15);grantExperience(reward);if(reward)label('+'+reward+' KN',e.x,e.y-125,'#d3dc9d');
      if(s.kills===1&&!C.startFire){toast('HỎA NĂNG THỨC TỈNH · U để thi triển',4);tone('quest');}
    }
  }
  function grantExperience(amount){
    s.xp+=amount;
    const rank=(C.levelRules||[{xp:80,level:2,maxHp:115}]).filter(r=>s.xp>=r.xp).at(-1);
    if(rank&&rank.level>s.level){s.level=rank.level;p.maxHp=rank.maxHp;p.hp=Math.min(p.maxHp,p.hp+35);toast('CẤP 0'+s.level+' · Sinh lực được tăng cường',3.5);tone('quest');}
  }
  function attackBox(kind=p.action){
    const b=attacks[kind]?.box;if(!b)return null;
    return{x:p.x+(p.facing>0?b[0]:-b[2])*ART_SCALE,y:p.y+b[1]*ART_SCALE,w:(b[2]-b[0])*ART_SCALE,h:(b[3]-b[1])*ART_SCALE};
  }
  function enemyBox(e){if(e.kind==='barrel')return{x:e.x-22,y:e.y-74,w:44,h:74};if(e.kind==='spitter')return{x:e.x-44,y:e.y-104,w:88,h:104};if(e.boss)return{x:e.x-80,y:e.y-(e.kind==='hunter'?145:220),w:160,h:e.kind==='hunter'?140:215};if(e.kind==='nest')return{x:e.x-72,y:e.y-130,w:144,h:130};const q=e.elite?1.35:1;return{x:e.x-44*q,y:e.y-78*q,w:91*q,h:74*q};}
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
  function updatePlayer(dt){
    p.age+=dt;p.invuln=Math.max(0,p.invuln-dt);p.coyote=Math.max(0,p.coyote-dt);
    const dir=move();
    if(p.grounded&&p.action==='dodge')p.vx=p.facing*600*Math.max(.1,1-p.age/.45);
    else if(!busy()){if(dir)p.facing=dir;p.vx=dir*(running()?RUN:WALK);}
    else if(p.grounded)p.vx=0;
    else if(dir)p.vx=dir*(running()?RUN:WALK);
    const result=P.step(p,dt,solids(),{width:C.width,gravity:GRAVITY});
    if(result.leftGround){p.coyote=.1;if(!busy())animate('fall',true);}
    if(result.landing){
      p.floor=result.landing.floor;p.doubleJumpUsed=false;p.coyote=0;animate('land',true);emit(p.x,p.y-2,'#6f9995',5);
    }else if(p.vy>0&&p.action==='jump')animate('fall');
    if(p.y>C.height+180){p.hp=0;animate('death',true);s.mode='dying';release();return;}
    const traveled=result.traveled,m=motions[p.action];
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
  function updateBoss(e,dt){
    if(p.floor!==e.floor||!s.bossSeen)return;
    const delta=p.x-e.x,enraged=e.hp<e.maxHp*.5;
    if(e.phase==='hurt'){if(e.age>.15){e.phase='patrol';e.age=0;e.cooldown=.25;}return;}
    if(e.phase==='windup'){
      if(e.age>(enraged?.65:.85)){e.phase='attack';e.age=0;e.attackHit=false;tone('hit');}return;
    }
    if(e.phase==='attack'){
      if(e.attackType==='charge'){
        if(e.age<.36)e.x=clamp(e.x+e.face*(enraged?720:600)*dt,e.minX,e.maxX);
        const box={x:e.x+(e.face>0?10:-140),y:e.y-150,w:130,h:145};
        if(!e.attackHit&&e.age<.38&&overlaps(box,{x:p.x-20,y:p.y-125,w:40,h:125})){e.attackHit=true;hurt(enraged?24:20,e.x);}
      }else{
        const radius=Math.min(380,e.age*700),distance=Math.abs(p.x-e.x);
        if(!e.attackHit&&distance<radius&&distance>radius-80&&Math.abs(p.y-e.y)<28){e.attackHit=true;hurt(enraged?24:20,e.x);}
      }
      if(e.age>.7){e.phase='patrol';e.age=0;e.cooldown=enraged?.8:1.2;}return;
    }
    e.face=delta>=0?1:-1;
    if(e.cooldown===0&&Math.abs(delta)<470){e.attackType=e.attackCount++%2?'slam':'charge';e.phase='windup';e.age=0;}
    else if(Math.abs(delta)>145)e.x=clamp(e.x+e.face*(enraged?105:75)*dt,e.minX,e.maxX);
  }

  function updateEnemies(dt){
    for(const e of enemies){
      if(e.dormant)continue;
      e.age+=dt;e.cooldown=Math.max(0,e.cooldown-dt);e.flash=Math.max(0,e.flash-dt);
      if(e.hp<=0){e.deadAge+=dt;continue;}
      if(street?.updateEnemy(e,dt))continue;
      if(e.boss){updateBoss(e,dt);continue;}
      const delta=p.x-e.x,near=p.floor===e.floor&&Math.abs(delta)<420&&p.x>e.minX-180&&p.x<e.maxX+180;
      if(e.phase==='hurt'){if(e.age>.23){e.phase='patrol';e.age=0;e.cooldown=Math.max(e.cooldown,.3);}continue;}
      if(e.phase==='windup'){
        if(e.age>.62){e.phase='attack';e.age=0;e.attackHit=false;tone('hit');}continue;
      }
      if(e.phase==='attack'){
        if(e.age<.23)e.x=clamp(e.x+e.face*(e.elite?550:410)*dt,e.minX,e.maxX);
        const range={x:e.x+(e.face>0?15:-112),y:e.y-100,w:100,h:92};
        if(!e.attackHit&&e.age<.24&&overlaps(range,{x:p.x-20,y:p.y-125,w:40,h:125})){e.attackHit=true;hurt(e.elite?22:14,e.x);}
        if(e.age>.45){e.phase='patrol';e.age=0;e.cooldown=e.elite?1.1:1.25;}continue;
      }
      if(near){
        e.face=delta>=0?1:-1;
        if(Math.abs(delta)<145&&e.cooldown===0&&Math.abs(p.y-e.y)<145){e.phase='windup';e.age=0;}
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
      if(b.kind==='wind')street?.reflect(box,b.face);
      for(const e of enemies)if(e.hp>0&&!e.dormant&&!b.hit.has(e.id)&&overlaps(box,enemyBox(e))){b.hit.add(e.id);damageEnemy(e,b.kind==='fire'?34:24,b.kind,b.face);if(b.kind==='fire'){b.life=0;emit(b.x,b.y,'#f4b07b',12);break;}e.x=clamp(e.x+b.face*55,e.minX,e.maxX);}
    }
    shots=shots.filter(b=>b.life>0);
  }
  function updateCoworker(dt){
    if(!s.rescued)return;
    const floor=C.floors[npc.floor],boss=enemies.find(e=>e.boss);
    let target;
    if(npc.floor<p.floor&&floor.hole)target=(floor.hole[0]+floor.hole[1])/2;
    else if(npc.floor===7&&boss.hp>0)target=1810;
    else target=p.x-p.facing*110;
    const delta=target-npc.x;npc.facing=delta>=0?1:-1;
    npc.vx=Math.abs(delta)>20?Math.sign(delta)*390:0;
    if(npc.grounded&&npc.vx&&C.platforms.some(b=>b.floor===npc.floor&&(npc.vx>0?b.x-npc.x<80&&b.x>npc.x:b.x+b.w-npc.x>-80&&b.x+b.w<npc.x))){npc.vy=-620;npc.grounded=false;}
    const result=P.step(npc,dt,solids(),{width:C.width});
    if(result.landing)npc.floor=result.landing.floor;
    npc.frame=!npc.grounded?2:Math.abs(npc.vx)>0?2+Math.floor(s.time*7)%2:1;
  }
  function events(dt){
    if(street){street.events(dt);return;}
    if(!s.noticeEnemy&&p.floor===0&&p.x>520){s.noticeEnemy=true;toast('J nối từng đòn · K né khi quái chớp báo hiệu',4);}
    const f=C.floors[p.floor];
    if(p.floor>s.deepest){s.deepest=p.floor;s.noticeGap=false;toast(floorName(p.floor)+' · '+f.name,2.2);}
    if(!s.noticeGap&&f.hole&&Math.abs(p.x-(f.hole[0]+f.hole[1])/2)<300){s.noticeGap=true;toast('SÀN ĐÃ SẬP · Đi qua mép vỡ để xuống tầng dưới',3.5);}
    for(const cp of C.checkpoints)if(cp.id>s.checkpoint&&cp.floor===p.floor&&p.grounded&&Math.abs(p.y-f.y)<1){s.checkpoint=cp.id;p.hp=p.maxHp;save();toast('ĐIỂM HỒI SINH · '+floorName(cp.floor),3);tone('quest');}
    if(!s.rescued&&p.floor===C.rescueFloor&&Math.abs(p.x-C.rescueX)<165&&p.grounded&&!enemies.some(e=>e.id.startsWith('guard')&&e.hp>0)){
      animate('idle',true);showDialogue(C.rescue,()=>{s.rescued=true;grantExperience(25);p.hp=p.maxHp;npc.frame=1;save();emit(230,f.y,'#9ab3a7',22);toast('ĐỒNG NGHIỆP ĐI CÙNG · Lối xuống tầng 3 đã mở',4);tone('quest');});return;
    }
    if(!s.rescued&&p.floor===C.rescueFloor&&p.x<520&&s.time-inputStamp>4){toast('Còn đồng nghiệp mắc kẹt trên tầng này.');inputStamp=s.time;}
    updateCoworker(dt);
    if(p.floor===7&&p.grounded&&!s.bossSeen&&p.x<1750){s.bossSeen=true;animate('idle',true);showDialogue(C.bossIntro);return;}
    const boss=enemies.find(e=>e.boss);
    if(p.floor===7&&p.x<310&&boss.hp>0){p.x=310;if(s.time-inputStamp>3){toast('Kẻ Gác Cửa đang khóa lối ra.');inputStamp=s.time;}}
    if(p.floor===7&&p.x<270&&boss.hp<=0&&s.rescued&&npc.floor===7&&Math.abs(npc.x-p.x)<190&&p.grounded){
      animate('idle',true);showDialogue(C.ending,finishChapter);
    }
  }

  function update(dt){
    if(s.mode==='dying'){p.age+=dt;p.frame=Math.min(3,Math.floor(p.age*6));if(p.age>.9)menu('dead');return;}
    if(s.mode!=='playing')return;
    if(s.hitstop>0){s.hitstop=Math.max(0,s.hitstop-dt);return;}
    s.time+=dt;s.elapsed+=dt;s.fireCd=Math.max(0,s.fireCd-dt);s.windCd=Math.max(0,s.windCd-dt);s.shake=Math.max(0,s.shake-dt*22);
    if(s.toast>0){s.toast-=dt;if(s.toast<=0)$('toast').hidden=true;}
    updatePlayer(dt);if(s.mode!=='playing')return;updateEnemies(dt);updateShots(dt);street?.update(dt);events(dt);
    for(const e of effects)e.age+=dt;effects=effects.filter(e=>e.age<e.duration);
    for(const b of bursts){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=240*dt;b.life-=dt;}bursts=bursts.filter(b=>b.life>0);
    for(const l of labels){l.y-=28*dt;l.life-=dt;}labels=labels.filter(l=>l.life>0);
    const follow=1-Math.exp(-dt*8),camera=view.target(p);s.camera+=(camera.x-s.camera)*follow;s.cameraY+=(camera.y-s.cameraY)*follow;
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
    const scale=HEAD/f.headWidth;const support=solids().filter(b=>b.y>=y-.5&&x>b.x&&x<b.x+b.w).sort((a,b)=>a.y-b.y)[0];if(support&&support.y-y<200)shadow(x,support.y,38);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(p.facing,1);ctx.imageSmoothingEnabled=false;
    if(p.invuln>0&&Math.floor(s.time*14)%2===0)ctx.globalAlpha=.55;
    ctx.drawImage(f.image,f.x,f.y,f.w,f.h,-f.anchorX*scale,-f.anchorY*scale,f.w*scale,f.h*scale);ctx.restore();
    const ox=x-p.facing*70,oy=y-145+(reduced?0:Math.sin(s.time*3)*5);glow(ox,oy,22,'#cde8b544');rect(ox-3,oy-3,6,6,'#dce9b1');rect(ox-1,oy-1,2,2,'#ffffe4');
  }
  function visibleFloors(){return C.floors.filter(f=>f.y+130>s.cameraY&&f.y-630<s.cameraY+H);}
  function drawBackground(){
    if(street){street.drawBackground();return;}
    rect(0,0,W,H,'#08131e');ctx.imageSmoothingEnabled=false;
    for(const f of visibleFloors()){
      const y=f.y-600-s.cameraY,im=f.index===7?assets.lobby:assets.office;
      ctx.drawImage(im,-s.camera*.65,y,C.width,720);
      rect(0,y,W,720,f.index%2?'#07172538':'#06121e22');
      for(let i=0;i<15;i++){const x=((i*163+37-s.camera*.45)%W+W)%W,py=f.y-580+(i*79+s.time*(9+i%3))%570-s.cameraY;rect(x,py,i%5===0?2:1,2,i%4?'#a2c5b329':'#cce7d066');}
    }
  }
  function drawArchitecture(){
    if(street){street.drawArchitecture();return;}
    const visible=visibleFloors();
    for(const f of visible){
      const y=f.y,parts=floorSolids.filter(b=>b.floor===f.index);
      for(const b of parts){
        rect(b.x,y,b.w,5,'#81978c');rect(b.x,y+5,b.w,39,'#293d43');rect(b.x,y+43,b.w,5,'#0a1820');
        for(let x=b.x+12;x<b.x+b.w-10;x+=59){rect(x,y+12,34,5,'#3f5557');rect(x+9,y+28,19,3,'#172d36');}
      }
      rect(0,y-610,C.width,12,'#0b1b25');
      text(floorName(f.index),75,y-493,22,'#c3d9c8');text(f.name,76,y-470,10,'#8ba8a5');
      for(let i=0;i<3;i++){const x=520+i*610+(f.index%2)*70;line([[x,y-600],[x+13,y-528],[x-8,y-490]],'#233c45',3);rect(x-30,y-544,70,5,'#526961');rect(x-25,y-539,50,2,'#b5ba9088');}
      for(let i=0;i<10;i++){const x=485+i*131;if(f.hole&&x>f.hole[0]-20&&x<f.hole[1]+20)continue;rect(x,y-5,13+i%4*5,5,'#4b6260');rect(x+21,y-3,8,3,'#819085');}
      if(f.hole){
        const [left,right]=f.hole;
        rect(left,y-4,right-left,75,'#07111ccc');
        for(const [edge,dir]of[[left,-1],[right,1]]){
          for(let n=0;n<5;n++){line([[edge+dir*3,y+7+n*7],[edge-dir*(16+n*4),y+18+n*10]],'#536970',2);rect(edge+dir*(8+n*15),y-10,12,5,n%2?'#99906d':'#243c43');}
        }
        if(f.index===C.rescueFloor&&!s.rescued){
          rect(left,y,right-left,16,'#5b5d4b');rect(left,y+16,right-left,32,'#2a4145');
          for(let x=left;x<right;x+=35)line([[x,y+5],[x+25,y+13]],'#c2b078',4);
          text('CÒN NGƯỜI MẮC KẸT',(left+right)/2,y-28,10,'#dcc99f','center');
        }else{
          const cx=(left+right)/2;line([[cx,y-70],[cx,y-35],[cx-7,y-43],[cx,y-35],[cx+7,y-43]],'#b7d1b5',2);text('XUỐNG '+floorName(f.index+1),cx,y-89,10,'#b7d1b5','center');
        }
      }
      for(const b of C.platforms.filter(b=>b.floor===f.index)){
        rect(b.x,b.y,b.w,b.h,'#263e46');rect(b.x,b.y,b.w,4,'#7b9188');rect(b.x+4,b.y+5,b.w-8,b.h-9,'#20353d');
        for(let x=b.x+9;x<b.x+b.w-8;x+=31){rect(x,b.y+12,23,b.h-24,b.kind==='cabinet'?'#374b50':'#3c4a50');rect(x+8,b.y+20,9,2,'#81918a');}
        if(b.kind==='rubble')line([[b.x,b.y+30],[b.x+43,b.y+13],[b.x+72,b.y+52],[b.x+b.w,b.y+15]],'#8aa09a66',2);
      }
      const cp=C.checkpoints.find(c=>c.floor===f.index&&c.id>0);
      if(cp){const x=cp.x;rect(x-8,y-58,16,58,'#29464b');rect(x-12,y-61,24,5,'#8cbcb2');glow(x,y-47,25,'#a6dfba33');rect(x-3,y-48,6,15,s.checkpoint>=cp.id?'#d5edb4':'#85c8c0');text('HỒI SINH',x,y-77,9,'#acd5c5','center');}
      if(f.index===7){
        const boss=enemies.find(e=>e.boss),open=boss?.hp<=0,door=C.exitX;
        rect(door-105,y-360,210,360,'#10232ba8');rect(door-110,y-366,220,8,'#728f81');rect(door-110,y-358,7,358,'#567567');rect(door+103,y-358,7,358,'#567567');
        for(let x=door-82;x<door+95;x+=82){rect(x,y-340,70,330,open?'#46745d55':'#142e35aa');line([[x+65,y-180],[x+65,y-140]],'#c8dec4',3);}
        rect(door-75,y-410,150,28,open?'#c9e6a8':'#8a9690');text(open?'← LỐI RA ĐÃ MỞ':'CỬA RA BỊ KHÓA',door,y-391,11,'#163329','center');
        if(!open)for(let i=0;i<5;i++)line([[door-95,y-325+i*66],[door+95,y-290+i*66]],'#8a70ad88',3);
      }
    }
  }
  function drawEnemy(e){
    if(e.dormant)return;
    if(street?.drawEnemy(e))return;
    if(e.hp<=0&&e.deadAge>1.5)return;
    const scale=e.boss?.60:e.elite?.58:.43;
    const frame=e.phase==='windup'?3:e.phase==='attack'?4:e.phase==='hurt'?5:e.hp<=0?(e.deadAge<.2?6:7):1+Math.floor(s.time*(e.boss?3:6))%2;
    shadow(e.x,e.y,e.boss?86:e.elite?65:46);ctx.save();if(e.hp<=0)ctx.globalAlpha=clamp(1-(e.deadAge-.6)/.9,0,1);
    worldArt(e.boss?'gatekeeper':'void-crawler',frame,e.x,e.y,scale,-e.face);ctx.restore();
    if(e.hp<=0)return;
    if(!e.boss){const w=64,y=e.y-111;rect(e.x-w/2,y,w,3,'#263b46');rect(e.x-w/2,y,w*e.hp/e.maxHp,3,'#89b8b3');}
    if(e.phase==='windup'){
      text(e.boss?(e.attackType==='slam'?'NHẢY!':'NÉ!'):'!',e.x,e.y-(e.boss?288:135),e.boss?12:21,'#f0bb82','center');
      ctx.strokeStyle='#d9a97a99';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x+(e.boss?0:e.face*45),e.y-3,e.boss?e.attackType==='slam'?260:105:66,8,0,0,Math.PI*2);ctx.stroke();
    }
    if(e.boss&&e.phase==='attack'&&e.attackType==='slam'){
      const r=Math.min(380,e.age*700);ctx.strokeStyle='#b1cde3aa';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(e.x,e.y-3,r,6+r*.035,0,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#8b84b655';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(e.x,e.y-3,Math.max(0,r-28),6+r*.025,0,0,Math.PI*2);ctx.stroke();
    }
  }

  function drawPressure(effect,front=false){
    const a=assets.vfx.actions[effect.kind],frame=a.frames[Math.min(7,Math.floor(effect.age*a.fps))];
    const fist=attacks[effect.kind].fist,root=a.effectRoot||fist;
    const ox=effect.x+effect.face*root[0]*ART_SCALE,oy=effect.y+root[1]*ART_SCALE,scale=a.uniformSourceScale*ART_SCALE;
    ctx.save();
    if(effect.kind==='attack4'){ctx.beginPath();ctx.rect(s.camera,front?oy:s.cameraY,VIEW_W,front?s.cameraY+VIEW_H-oy:oy-s.cameraY);ctx.clip();}
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
    ctx.translate(Math.sin(s.time*92)*shake,Math.cos(s.time*71)*shake*.5);ctx.scale(view.zoom,view.zoom);ctx.translate(-Math.round(s.camera),-Math.round(s.cameraY));drawArchitecture();
    if(s.mode==='title'){const x=street?VIEW_W*.7:860;hero(x,G);text(street?'ĐẠI LỘ / ĐÊM XÂM LẤN':'CÔNG TY / TẦNG 07',street?x:850,G+38,9,'#aac4b2','center');}
    else{
      for(const e of enemies)if(e.x>s.camera-300&&e.x<s.camera+VIEW_W+300&&e.y>s.cameraY-100&&e.y<s.cameraY+VIEW_H+300)drawEnemy(e);
      shadow(npc.x,npc.y,35);worldArt('coworker',npc.frame,npc.x,npc.y,.29,npc.facing);
      if(!s.rescued){text('CÓ NGƯỜI CÒN SỐNG',npc.x,npc.y-185,9,'#d9c3a0','center');text('◆',npc.x,npc.y-203,12,'#ddc58d','center');}
      for(const e of effects)drawPressure(e);
      hero();for(const e of effects)if(e.kind==='attack4')drawPressure(e,true);
      for(const b of shots)drawShot(b);street?.drawExtra();
      for(const b of bursts){ctx.globalAlpha=clamp(b.life/b.max,0,1);rect(b.x,b.y,b.size,b.size,b.color);}ctx.globalAlpha=1;
      for(const l of labels){ctx.globalAlpha=clamp(l.life*2,0,1);text(l.value,l.x,l.y,12,l.color,'center');}ctx.globalAlpha=1;
    }
    ctx.restore();
    const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#04111b55');shade.addColorStop(.25,'#04111b00');shade.addColorStop(.8,'#04111b00');shade.addColorStop(1,'#04111b77');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
    updateUI();
  }
  function updateUI(force=false){
    if(street){street.updateUI(force);return;}
    const f=C.floors[p.floor],boss=enemies.find(e=>e.boss),bossAlive=!boss||boss.hp>0;
    const objective=p.floor===7?(bossAlive?'Hạ Kẻ Gác Cửa':'Đưa đồng nghiệp ra ngoài'):!s.rescued?(p.floor===C.rescueFloor?'Cứu đồng nghiệp ở tầng 4':'Đi xuống tầng trệt'):'Dẫn đồng nghiệp xuống tầng trệt';
    const detail=p.floor===7?(bossAlive?'Né cú lao. Nhảy qua sóng đập sàn.':'Cửa phía trái đã mở. Chờ đồng nghiệp đi cùng.'):p.floor===C.rescueFloor&&!s.rescued?'Hạ hai quái chặn đường rồi tới gần đồng nghiệp.':'Tìm sàn vỡ ở '+(p.floor%2?'bên trái':'bên phải')+' để xuống '+floorName(p.floor+1)+'.';
    const stamp=[p.hp,p.maxHp,s.xp,s.level,s.rescued,s.kills,p.floor,objective,Math.ceil(s.fireCd*10),Math.ceil(s.windCd*10),p.doubleJumpUsed,p.grounded,Math.floor(p.y/10),boss?.hp].join(':');if(!force&&stamp===uiStamp)return;uiStamp=stamp;
    $('healthFill').style.width=p.hp/p.maxHp*100+'%';$('healthText').textContent=p.hp+' / '+p.maxHp;$('healthBar').setAttribute('aria-valuenow',p.hp);$('healthBar').setAttribute('aria-valuemax',p.maxHp);$('xpText').textContent=s.xp+' KN';$('levelNumber').textContent='LV. 0'+s.level;
    $('objectiveTitle').textContent=objective;$('objectiveDetail').textContent=detail;
    for(const kind of ['fire','wind']){const locked=kind==='fire'?s.kills===0:!s.rescued;const e=$(kind+'Cooldown');e.hidden=!locked&&s[kind+'Cd']===0;e.textContent=locked?'KHÓA':s[kind+'Cd'].toFixed(1)+'s';}
    $('jumpStatus').textContent=p.doubleJumpUsed?'↑ ĐÃ DÙNG NHẢY LẦN HAI':p.grounded?'↓ ĐI QUA SÀN VỠ ĐỂ XUỐNG DƯỚI':'↑ CÓ THỂ NHẢY LẦN HAI';
    $('progressFill').style.width=clamp((p.y-G)/(C.floors.at(-1).y-G)*100,0,100)+'%';$('locationLabel').textContent=floorName(p.floor)+' / '+f.name;$('progressText').textContent=p.floor===7?'← CỬA THOÁT HIỂM':'TẦNG TRỆT ↓';
    $('floorCoordinate').textContent=floorName(p.floor)+' / '+f.name;
    for(const row of document.querySelectorAll('[data-floor]')){const active=Number(row.dataset.floor)===p.floor;row.classList.toggle('is-current',active);row.classList.toggle('is-passed',Number(row.dataset.floor)<s.deepest);row.setAttribute('aria-current',active?'step':'false');}
    $('bossBar').hidden=p.floor!==7||!boss||boss.hp<=0;
    if(boss){$('bossHealth').style.width=boss.hp/boss.maxHp*100+'%';$('bossHp').textContent=boss.hp+' / '+boss.maxHp;$('bossPhase').textContent=boss.hp<boss.maxHp*.5?'CUỒNG NỘ':'KẺ GÁC CỬA';}
  }

  function bind(){
    if(street)street.bind();else for(const f of C.floors){const row=document.createElement('span');row.dataset.floor=f.index;row.textContent=f.number?'T'+f.number:'TRỆT';$('floorTower').append(row);}
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
  async function json(path){const r=await fetch(path+'?v='+encodeURIComponent(C.id),{cache:'no-cache'});if(!r.ok)throw Error('Không tải được '+path);return r.json();}
  async function image(path){const im=new Image();im.src=path;await im.decode();return im;}
  async function load(){
    try{
      const embedded=window.DI_MON_LEVEL_ASSETS;
      const [manifest,vfx,world]=embedded?[embedded.hero,embedded.vfx,embedded.world]:await Promise.all([json('./sprite-manifest.json'),json('./art/vfx/air-pressure-v2/manifest.json'),json('./'+(C.worldManifest||'art/chapter-one/manifest.json'))]);
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
        ...(C.backgrounds?.panorama?[
          image(embedded?embedded.office:'./'+C.backgrounds.panorama).then(im=>{assets.office=assets.lobby=im;})
        ]:[
          image(embedded?embedded.office:'./'+(C.backgrounds?.office||'art/chapter-one/office-night.png')).then(im=>assets.office=im),
          image(embedded?embedded.lobby:'./'+(C.backgrounds?.lobby||'art/chapter-one/lobby-night.png')).then(im=>assets.lobby=im)
        ])
      ]);
      for(const m of Object.values(motions)){m.frames.sort((a,b)=>(a.order??a.row*4+a.col)-(b.order??b.row*4+b.col));if(!m.frames.length)throw Error('Thiếu hoạt ảnh nhân vật');}
      if(street){const camera=view.target(p);s.camera=camera.x;s.cameraY=camera.y;}
      saved=readSave();$('continueButton').hidden=!saved;s.ready=true;$('startButton').disabled=false;$('loadingText').textContent='A / D DI CHUYỂN · J CHIẾN ĐẤU · SPACE NHẢY ×2';bind();requestAnimationFrame(loop);
      if(!embedded&&'serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./level-sw.js',{updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{});
    }catch(e){console.error(e);$('loadingText').textContent='Không tải được màn chơi. Hãy tải lại trang.';}
  }
  function loop(now){
    const dt=last?clamp((now-last)/1000,0,.1):0;last=now;accumulator+=dt;
    while(accumulator>=STEP){update(STEP);accumulator-=STEP;}draw();requestAnimationFrame(loop);
  }
  window.diMonLevel=Object.freeze({getState:()=>({chapter:C.chapter||1,street:street?.getState(),ready:s.ready,mode:s.mode,x:p.x,y:p.y,vx:p.vx,vy:p.vy,grounded:p.grounded,doubleJumpUsed:p.doubleJumpUsed,action:p.action,frame:p.frame,hp:p.hp,maxHp:p.maxHp,invulnerable:p.invuln>0,checkpoint:s.checkpoint,rescued:s.rescued,kills:s.kills,xp:s.xp,level:s.level,elapsed:s.elapsed,camera:s.camera,cameraY:s.cameraY,floor:p.floor,floorNumber:C.floors[p.floor].number,totalFloors:C.floors.length,support:P.support(p,solids())?.kind||null,combo:s.combo+1,queuedStrikes:s.queue,hitCount:s.hitCount,fireCooldown:s.fireCd,windCooldown:s.windCd,npc:{...npc},enemies:enemies.map(e=>({id:e.id,x:e.x,y:e.y,floor:e.floor,hp:e.hp,maxHp:e.maxHp,boss:Boolean(e.boss),kind:e.kind||'hound',attackType:e.attackType,phase:e.phase,age:e.age,face:e.face,dormant:Boolean(e.dormant),environmental:Boolean(e.environmental),guard:e.guard||0,burning:(e.burn||0)>0})),effects:effects.map(e=>({...e})),projectiles:shots.length,dialogueIndex:dialogue?.index??null,renderer:'whole-character-frames',headWidth:HEAD,renderedHeadWidth:HEAD*view.zoom,cameraZoom:view.zoom,viewWidth:VIEW_W,viewHeight:VIEW_H,playerScreen:view.project(p.x,p.y,{x:s.camera,y:s.cameraY})}),getAttackBox:attackBox});
  load();
})();
