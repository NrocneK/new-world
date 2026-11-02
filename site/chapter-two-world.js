/* Street-specific encounters and objectives use the shared character engine. */
window.DiMonStreet=Object.freeze({create(api){
  const {C,P,ctx,W,H,s,p,assets,clamp,overlaps,rect,line,text,glow,shadow,worldArt,toast,showDialogue,animate,save,grantExperience,hurt,emit,tone}=api;
  const $=id=>document.getElementById(id),G=C.ground;
  const geometry=[...C.groundSections.map(([a,b])=>({x:a,y:G,w:b-a,h:48,floor:0,kind:'road'})),...C.platforms];
  const world={delivered:false,bossSeen:false,notified:[],hostiles:[],wave:0,breather:0,cleared:false,barrel:0,blast:0,stats:{}};let uiStamp='';
  const enemies=()=>api.enemies(),npc=()=>api.npc();
  const anchors=()=>enemies().filter(e=>e.kind==='nest');
  const anchorsDown=()=>anchors().filter(e=>e.hp<=0).length;
  const initialStats=()=>({reflections:0,reflectedHits:0,guardBreaks:0,coverBlocks:0,barrelHits:0});
  function prepareWaves(){
    world.wave=world.delivered?3:enemies().some(e=>e.wave===1&&e.hp>0)?0:enemies().some(e=>e.wave===2&&e.hp>0)?1:3;
    world.cleared=world.wave===3;world.breather=world.wave===1?2:0;
    for(const e of enemies()){e.dormant=Boolean(e.wave&&e.hp>0);e.guard=e.armour||0;e.resistStagger=e.guard>0;e.burn=0;e.burnTick=0;e.guardStun=0;}
  }
  function reset(saved){
    world.delivered=Boolean(saved?.delivered);world.bossSeen=Boolean(saved?.bossSeen);world.notified=anchors().filter(e=>e.hp<=0).map(e=>e.id);world.hostiles=[];world.barrel=0;world.blast=0;world.stats=initialStats();uiStamp='';
    if(C.sample){const first=enemies().find(e=>e.id==='street-hound');first.hp=0;first.deadAge=10;}
    prepareWaves();if(enemies().find(e=>e.kind==='barrel')?.hp<=0)world.barrel=-1;if(world.delivered)api.setNpc(api.makeNpc(0,C.medicalX,true));
    if($('sampleDebrief'))$('sampleDebrief').hidden=true;
  }
  function afterRetry(){world.hostiles=[];world.barrel=enemies().find(e=>e.kind==='barrel')?.hp<=0?-1:0;world.blast=0;prepareWaves();if(world.delivered)api.setNpc(api.makeNpc(0,C.medicalX,true));}
  function bullet(e,vy=0){
    let vx=e.face*(e.boss?440:330);
    if(!e.boss&&e.aim){const dx=e.aim.x-(e.x+e.face*40),dy=e.aim.y-(e.y-63),length=Math.hypot(dx,dy)||1;vx=dx/length*330;vy=dy/length*330;}
    world.hostiles.push({x:e.x+e.face*(e.boss?75:40),y:e.y-(e.boss?105:63),vx,vy,life:2.8,age:0,damage:e.boss?18:11,source:e.x,friendly:false});
  }
  function beforeDamage(e,damage,kind){
    const protectedByArmour=e.guard>0;
    if(protectedByArmour){
      const power={attack1:7,attack2:9,attack3:30,attack4:48,wind:25,fire:5,reflected:24,explosion:48}[kind]||0;
      e.guard=Math.max(0,e.guard-power);
      if(e.guard===0){e.guardStun=.85;world.stats.guardBreaks++;api.label('VỠ GIÁP',e.x,e.y-140,'#e8cd8b');emit(e.x,e.y-45,'#dfc28a',16);tone('quest');}
    }
    // Burning ticks never interrupt attacks; armour resists the first light blows.
    e.resistStagger=kind==='burn'||e.guard>0;
    return protectedByArmour&&['attack1','attack2','fire','burn'].includes(kind)?Math.max(1,Math.round(damage*.55)):damage;
  }
  function afterDamage(e,kind){
    if(kind==='fire'&&e.kind!=='barrel'&&e.kind!=='nest'){e.burn=2.4;e.burnTick=.6;}
    if(e.kind==='barrel'&&e.hp===0&&world.barrel===0){world.barrel=.55;toast('THÙNG DẦU SẮP NỔ · LÙI LẠI!',1.2);}
  }
  function reflect(box,face){
    for(const b of world.hostiles)if(b.life>0&&!b.friendly&&overlaps(box,{x:b.x-14,y:b.y-14,w:28,h:28})){
      b.friendly=true;b.vx=face*Math.max(440,Math.abs(b.vx)*1.35);b.vy=-b.vy;b.life=1.5;b.source=p.x;world.stats.reflections++;
      emit(b.x,b.y,'#acdcca',6);api.label('PHẢN ĐẠN',b.x,b.y-20,'#c9edcc');tone('quest');
    }
  }
  function director(dt){
    if(world.wave===0&&p.x>1370){world.wave=1;for(const e of enemies())if(e.wave===1){e.dormant=false;e.cooldown=.7;}toast('NGÃ TƯ · ĐỢT 1 / 2 — TRÊN CAO VÀ GIÁP',3.5);}
    if(world.wave===1&&!enemies().some(e=>e.wave===1&&e.hp>0)){
      world.breather+=dt;
      if(world.breather<dt*2)toast('ĐỢT 1 ĐÃ DỌN · CẨN THẬN PHÍA SAU',2);
      if(world.breather>=2){world.wave=2;for(const e of enemies())if(e.wave===2){e.dormant=false;e.cooldown=.9;}toast('NGÃ TƯ · ĐỢT 2 / 2 — KẸP HAI PHÍA',3);}
    }
    if(world.wave===2&&!enemies().some(e=>e.wave===2&&e.hp>0)){world.wave=3;world.cleared=true;save();toast('NGÃ TƯ AN TOÀN · ĐƯA ĐỒNG NGHIỆP TỚI LỀU',3);tone('quest');}
  }
  function updateEnemy(e,dt){
    if(e.burn>0){e.burn-=dt;e.burnTick-=dt;if(e.burnTick<=0){e.burnTick+=.6;api.damageEnemy(e,4,'burn',0);}if(e.hp<=0)return true;}
    if(e.guardStun>0){e.guardStun=Math.max(0,e.guardStun-dt);e.phase='hurt';e.age=0;if(e.guardStun===0)e.cooldown=.55;return true;}
    e.resistStagger=e.guard>0;
    if(e.kind==='nest'||e.kind==='barrel')return true;
    if(e.kind!=='spitter'&&e.kind!=='hunter')return false;
    const distance=p.x-e.x;if(e.phase!=='windup'&&e.phase!=='attack')e.face=distance>=0?1:-1;
    if(e.kind==='spitter'){
      if(e.phase==='hurt'){if(e.age>.22){e.phase='patrol';e.age=0;e.cooldown=.45;}return true;}
      if(e.phase==='windup'){if(e.age>.8){e.phase='attack';e.age=0;bullet(e);}return true;}
      if(e.phase==='attack'){if(e.age>.35){e.phase='patrol';e.age=0;e.cooldown=1.6;}return true;}
      if(Math.abs(distance)<630&&Math.abs(p.y-e.y)<250&&e.cooldown===0){e.phase='windup';e.age=0;e.aim={x:p.x,y:p.y-72};}return true;
    }
    if(!world.bossSeen)return true;
    const rage=e.hp<e.maxHp*.5;
    if(e.phase==='hurt'){if(e.age>.14){e.phase='patrol';e.age=0;e.cooldown=.3;}return true;}
    if(e.phase==='windup'){
      if(e.age>(rage?.62:.85)){
        e.phase='attack';e.age=0;e.attackHit=false;
        if(e.attackType==='pounce'){e.startX=e.x;e.targetX=clamp(p.x,e.minX,e.maxX);e.vy=-620;e.leapVx=(e.targetX-e.x)/.67;}
        else for(const vy of [-95,0,95])bullet(e,vy);
      }return true;
    }
    if(e.phase==='attack'){
      if(e.attackType==='pounce'&&!e.landed){
        e.x=clamp(e.x+e.leapVx*dt,e.minX,e.maxX);e.vy+=1850*dt;e.y+=e.vy*dt;
        if(!e.attackHit&&overlaps({x:e.x-65,y:e.y-115,w:130,h:110},{x:p.x-20,y:p.y-125,w:40,h:125})){e.attackHit=true;hurt(rage?23:19,e.x);}
        if(e.y>=G&&e.vy>0){e.y=G;e.landed=true;emit(e.x,G-4,'#b2c6bd',14);if(!e.attackHit&&Math.abs(p.x-e.x)<145&&Math.abs(p.y-G)<28){e.attackHit=true;hurt(20,e.x);}}
      }
      if(e.age>.95){e.y=G;e.phase='patrol';e.age=0;e.cooldown=rage?.65:1.05;}return true;
    }
    if(e.cooldown===0&&Math.abs(distance)<650){e.attackType=e.attackCount++%2?'volley':'pounce';e.landed=false;e.phase='windup';e.age=0;}
    else if(Math.abs(distance)>170)e.x=clamp(e.x+e.face*(rage?130:90)*dt,e.minX,e.maxX);
    return true;
  }
  function update(dt){
    director(dt);world.blast=Math.max(0,world.blast-dt);
    if(world.barrel>0){
      world.barrel-=dt;
      if(world.barrel<=0){
        const drum=enemies().find(e=>e.kind==='barrel');world.barrel=-1;world.blast=.4;emit(drum.x,G-24,'#d7a86d',28);tone('hurt');
        for(const e of enemies())if(!e.environmental&&!e.dormant&&e.hp>0&&Math.abs(e.x-drum.x)<175&&Math.abs(e.y-G)<180){api.damageEnemy(e,60,'explosion',Math.sign(e.x-drum.x));world.stats.barrelHits++;}
        if(Math.abs(p.x-drum.x)<135&&Math.abs(p.y-G)<100)hurt(12,drum.x);
      }
    }
    for(const b of world.hostiles){
      const x=b.x,y=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;b.age+=dt;
      const swept={x:Math.min(x,b.x)-6,y:Math.min(y,b.y)-6,w:Math.abs(b.x-x)+12,h:Math.abs(b.y-y)+12};
      if(geometry.some(o=>overlaps(swept,o))){b.life=0;world.stats.coverBlocks++;emit(b.x,b.y,'#8fada9',4);continue;}
      if(b.friendly){
        const target=enemies().find(e=>!e.dormant&&!e.environmental&&e.hp>0&&overlaps(swept,api.enemyBox(e)));
        if(target){api.damageEnemy(target,38,'reflected',Math.sign(b.vx));world.stats.reflectedHits++;b.life=0;}
      }else if(overlaps(swept,{x:p.x-19,y:p.y-125,w:38,h:125})){hurt(b.damage,b.source);b.life=0;}
    }
    world.hostiles=world.hostiles.filter(b=>b.life>0);
  }
  function follow(dt){
    const n=npc();
    if(world.delivered){n.vx=0;n.frame=1;return;}
    const target=p.x-p.facing*105,d=target-n.x;n.facing=Math.abs(d)>25?(d>=0?1:-1):p.facing;n.vx=Math.abs(d)>25?Math.sign(d)*390:0;
    if(n.grounded&&n.vx&&C.platforms.some(b=>n.vx>0?b.x>n.x&&b.x-n.x<80:b.x+b.w<n.x&&b.x+b.w-n.x>-80)){n.grounded=false;n.vy=-620;}
    P.step(n,dt,geometry,{width:C.width});n.frame=!n.grounded?2:n.vx?2+Math.floor(s.time*7)%2:1;
  }
  function events(dt){
    follow(dt);
    for(const cp of C.checkpoints)if(cp.id>s.checkpoint&&p.x>=cp.x&&p.grounded&&(cp.id!==2||world.delivered)){s.checkpoint=cp.id;p.hp=p.maxHp;save();toast('ĐIỂM HỒI SINH · '+(cp.id===2?'TRẠM CỨU THƯƠNG':cp.id===4?'KHU SƠ TÁN':'ĐẠI LỘ'));}
    if(!world.delivered&&p.x>2260&&Math.abs(npc().x-p.x)<200&&world.cleared&&p.grounded){
      animate('idle',true);showDialogue(C.delivery,()=>{world.delivered=true;api.setNpc(api.makeNpc(0,C.medicalX,true));grantExperience(25);p.hp=p.maxHp;s.checkpoint=Math.max(2,s.checkpoint);save();toast('ĐỒNG NGHIỆP ĐÃ AN TOÀN · Phá 2 ổ dị giới',4);tone('quest');if(C.sample)debrief();});return;
    }
    if(!world.delivered&&p.x>2530){p.x=2530;if(!world.notified.includes('escort')){world.notified.push('escort');toast('Đưa đồng nghiệp tới trạm cứu thương trước.');}}
    for(const e of anchors())if(e.hp<=0&&!world.notified.includes(e.id)){world.notified.push(e.id);p.hp=Math.min(p.maxHp,p.hp+20);save();toast('Ổ DỊ GIỚI ĐÃ PHÁ · '+anchorsDown()+' / 2',3);tone('quest');}
    if(p.x>6150&&anchorsDown()<2){p.x=6150;if(!world.notified.includes('barrier')){world.notified.push('barrier');toast('Màn chắn chỉ tan khi phá đủ 2 ổ dị giới.');}}
    if(p.x>6250&&anchorsDown()===2&&!world.bossSeen){world.bossSeen=true;s.bossSeen=true;animate('idle',true);showDialogue(C.bossIntro);return;}
    const boss=enemies().find(e=>e.boss);
    if(p.x>7190&&boss.hp>0)p.x=7190;
    if(p.x>C.exitX&&boss.hp<=0&&anchorsDown()===2&&world.delivered&&p.grounded){animate('idle',true);showDialogue(C.ending,api.complete);}
  }
  function drawBackground(){
    rect(0,0,W,H,'#17233e');ctx.imageSmoothingEnabled=false;
    const im=assets.office,b=backgroundLayout();
    ctx.save();ctx.scale(api.view.zoom,api.view.zoom);ctx.translate(0,-s.cameraY);ctx.drawImage(im,b.x,b.y,b.width,b.height);ctx.restore();
    rect(0,0,W,H,'#101d3010');
    for(let i=0;i<20;i++){const x=((i*173-s.camera*.5)%W+W)%W,y=(i*73+s.time*100)%H;line([[x,y],[x-3,y+9]],'#b3c1d41a',1);}
  }
  function backgroundLayout(){
    if(!api.view||!assets.office)return null;
    return window.DiMonView.panorama(api.view,{imageWidth:assets.office.width,imageHeight:assets.office.height,ground:G,cameraX:s.camera});
  }
  function drawArchitecture(){
    for(const [a,b]of C.groundSections){
      rect(a,G,b-a,4,'#57627d');rect(a,G+4,b-a,35,'#303b55');rect(a,G+39,b-a,5,'#111c30');rect(a,G+44,b-a,H,'#111c30');
      for(let x=a+30;x<b;x+=170){line([[x,G+9],[x+65,G+9],[x+83,G+31]],'#19243d',3);line([[x+105,G+24],[x+138,G+24]],'#45516d',2);}
    }
    // These buses are parked on the rear curb, not shrunk into the walking lane.
    for(const prop of C.scenery||[]){
      const f=assets.world['street-props'].frames[0],scale=prop.height/f.h;
      shadow(prop.x,prop.y,f.w*scale*.43);worldArt('street-props',0,prop.x,prop.y,scale,prop.face||1);
    }
    for(const [left,right]of [[2660,2840],[5160,5320]]){rect(left,G-7,right-left,100,'#07101c');for(let i=0;i<5;i++){line([[left,G+i*7],[left+15+i*5,G+20+i*12]],'#4a6269',2);line([[right,G+i*7],[right-15-i*5,G+20+i*12]],'#3b515e',2);}text('SÀN ĐƯỜNG ĐỨT',left+(right-left)/2,G-38,9,'#b1c9bc','center');}
    for(const b of C.platforms){
      // A flat concrete top matches the physical support exactly; coarse outlined
      // blocks read as debris, rather than miniature windows/tires of a bus.
      rect(b.x,b.y,b.w,b.h,'#444d68');rect(b.x,b.y,b.w,7,'#a1a4b5');
      line([[b.x,b.y+b.h],[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h]],'#121b30',3);
      for(let i=0;i<3;i++){const x=b.x+b.w*(i+.22)/3;line([[x,b.y+8],[x+9,b.y+b.h*.44],[x-6,b.y+b.h*.73],[x+4,b.y+b.h]],'#232e48',3);}
      line([[b.x+5,b.y+8],[b.x+b.w-5,b.y+8]],'#c3c0cb',2);line([[b.x+8,b.y+b.h*.63],[b.x+b.w*.42,b.y+b.h*.63],[b.x+b.w*.5,b.y+b.h*.72],[b.x+b.w-4,b.y+b.h*.72]],'#626c85',3);
    }
    for(const x of[400,1150,2230,3250,4490,5680,6940]){rect(x,G-360,5,360,'#35464a');rect(x-17,G-365,68,6,'#7d8980');glow(x+25,G-344,75,'#e1ba6c18');rect(x+17,G-358,24,3,'#cfbf8e');}
    // The clinic is the handoff point; the coworker stays safely here afterwards.
    const mx=C.medicalX;
    if(assets.world['street-props'])worldArt('street-props',1,mx,G-8,310/assets.world['street-props'].frames[1].h);
    else{rect(mx-120,G-160,240,160,'#203c3c');ctx.fillStyle='#526f69';ctx.beginPath();ctx.moveTo(mx-146,G-160);ctx.lineTo(mx,G-230);ctx.lineTo(mx+146,G-160);ctx.closePath();ctx.fill();rect(mx-42,G-155,84,155,'#10272d');rect(mx-15,G-206,30,8,'#c6dec3');rect(mx-4,G-217,8,30,'#c6dec3');}
    text('TRẠM CỨU THƯƠNG',mx,G-332,11,'#c3d9c0','center');
    for(const cp of C.checkpoints.filter(c=>c.id>0&&c.id!==2)){rect(cp.x-8,G-50,16,50,'#2e464a');rect(cp.x-4,G-44,8,16,s.checkpoint>=cp.id?'#c8e9b9':'#7fb7bb');text('HỒI SINH',cp.x,G-69,8,'#b1c7bb','center');}
    const open=anchorsDown()===2;
    if(!open){for(let i=0;i<7;i++)line([[6170+i%2*4,G-265+i*39],[6150-i%2*9,G-235+i*39]],'#9a8ac3bb',4);text('MÀN CHẮN DỊ GIỚI',6155,G-292,10,'#c9bbdf','center');}
    else text('TUYẾN SƠ TÁN →',6155,G-292,10,'#b7d6bd','center');
    rect(7240,G-275,220,11,'#739488');rect(7240,G-264,10,264,'#4f706b');rect(7450,G-264,10,264,'#4f706b');rect(7260,G-326,180,31,'#b5d1a4');text('ĐIỂM SƠ TÁN →',7350,G-305,12,'#203a32','center');
    if(enemies().find(e=>e.boss)?.hp>0)for(let x=7250;x<7450;x+=30)rect(x,G-260,6,260,'#697f7a');
  }
  function drawEnemy(e){
    if(e.kind==='barrel'){
      if(world.barrel<0)return true;
      if(assets.world['street-props'])worldArt('street-props',2,e.x,G,74/assets.world['street-props'].frames[2].h);
      else{rect(e.x-19,G-72,38,72,'#405460');for(const y of [G-68,G-46,G-8])rect(e.x-21,y,42,4,'#9b947e');text('♨',e.x,G-25,19,'#d2a46c','center');}
      if(world.barrel>0){text('!',e.x,G-92,24,'#f2bd7f','center');ctx.strokeStyle='#dbb081aa';ctx.beginPath();ctx.ellipse(e.x,G-3,175,13,0,0,Math.PI*2);ctx.stroke();}
      return true;
    }
    if(e.armour&&e.hp>0){
      const y=e.y-125;rect(e.x-32,y,64,4,'#4b4540');if(e.guard>0)rect(e.x-32,y,64*e.guard/e.armour,4,'#dec68c');text(e.guard>0?'GIÁP':'VỠ GIÁP',e.x,y-9,9,e.guard>0?'#dec68c':'#a9d7bd','center');
    }
    if(e.burn>0&&e.hp>0)for(let i=0;i<4;i++){const y=e.y-20-i*13;line([[e.x-22+i*13,y],[e.x-17+i*13,y-12-(s.time*17+i*3)%10]],'#db955dbb',3);}
    if(!['spitter','nest','hunter'].includes(e.kind))return false;
    if(e.hp<=0&&e.deadAge>1.5&&e.kind!=='nest')return true;
    const name=e.kind==='spitter'?'spore-spitter':e.kind==='nest'?'rift-nest':'rift-hunter';
    const frame=e.kind==='nest'?(e.hp<=0?3:e.flash>0?2:Math.floor(s.time*2)%2):e.hp<=0?(e.deadAge<.25?6:7):e.phase==='windup'?3:e.phase==='attack'?(e.kind==='hunter'?(e.attackType==='volley'?0:e.landed?3:4):4):e.phase==='hurt'?5:1+Math.floor(s.time*5)%2;
    shadow(e.x,e.y,e.boss?86:e.kind==='nest'?62:40);ctx.save();if(e.hp<=0&&e.kind!=='nest')ctx.globalAlpha=clamp(1-(e.deadAge-.6)/.9,0,1);worldArt(name,frame,e.x,e.y,e.boss?.60:e.kind==='nest'?.31:.36,-e.face);ctx.restore();
    if(e.hp>0&&!e.boss){const w=e.kind==='nest'?92:58,y=e.y-(e.kind==='nest'?150:125);rect(e.x-w/2,y,w,3,'#273e4b');rect(e.x-w/2,y,w*e.hp/e.maxHp,3,e.kind==='nest'?'#b094c6':'#b1bd91');if(e.kind==='nest')text('Ổ DỊ GIỚI',e.x,y-13,10,'#c8b6d8','center');}
    if(e.kind==='spitter'&&e.phase==='windup'&&e.aim)line([[e.x+e.face*40,e.y-63],[e.aim.x,e.aim.y]],e.age>.5?'#dab08288':'#dab08233',1);
    if(e.phase==='windup'&&e.hp>0){text(e.boss?(e.attackType==='pounce'?'CẨN THẬN CÚ VỒ!':'LOẠT GAI!'):'!',e.x,e.y-(e.boss?230:132),e.boss?11:19,'#e5b282','center');if(e.boss&&e.attackType==='pounce'){ctx.strokeStyle='#d6ab7c99';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(clamp(p.x,e.minX,e.maxX),G-3,110,9,0,0,Math.PI*2);ctx.stroke();}}
    if(e.boss&&e.phase==='attack'&&e.landed){ctx.strokeStyle='#9fb9c299';ctx.beginPath();ctx.ellipse(e.x,G-3,Math.min(145,e.age*230),9,0,0,Math.PI*2);ctx.stroke();}
    return true;
  }
  function drawExtra(){
    for(const b of world.hostiles){ctx.strokeStyle=b.friendly?'#b8e4be':'#c6b4df';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(b.x,b.y,8,7,0,0,Math.PI*2);ctx.stroke();rect(b.x-3,b.y-3,6,6,b.friendly?'#b8e4be':'#9eb7d2');line([[b.x-b.vx*.035,b.y-b.vy*.035],[b.x-b.vx*.015,b.y-b.vy*.015]],b.friendly?'#b8e4be99':'#9daec977',2);}
    if(world.blast>0){const drum=enemies().find(e=>e.kind==='barrel'),r=(1-world.blast/.4)*175;ctx.strokeStyle='#dcac77'+Math.round(world.blast/.4*200).toString(16).padStart(2,'0');ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(drum.x,G-12,r,r*.38,0,0,Math.PI*2);ctx.stroke();}
    if(!world.cleared&&world.wave>0){const remaining=enemies().filter(e=>e.wave===world.wave&&e.hp>0&&!e.dormant);if(remaining.length&&remaining.every(e=>e.x<p.x-270))text('← CÒN QUÁI Ở NGÃ TƯ',p.x-80,p.y-200,11,'#e0c294','center');}
  }
  function updateUI(force=false){
    const count=anchorsDown(),boss=enemies().find(e=>e.boss),sector=p.x<2600?0:p.x<4900?1:p.x<6250?2:3;
    const fighting=world.wave>0&&world.wave<3;
    const objective=!world.delivered?(fighting?'Dọn ngã tư · Đợt '+world.wave+' / 2':'Đưa đồng nghiệp tới trạm cứu thương'):count<2?'Phá các ổ dị giới · '+count+' / 2':boss?.hp>0?'Hạ Kẻ Truy Sát':'Tới khu sơ tán';
    const remaining=enemies().filter(e=>e.wave===world.wave&&e.hp>0).length;
    const detail=!world.delivered?(world.wave===1?'Lên khối bê tông hoặc phản đạn bằng gió. Móc/kết thúc phá giáp.':world.wave===2?'Còn '+remaining+' quái · Kiểm tra phía sau trước khi tới trạm.':world.cleared?'Đường đã thông. Tới gần lều để bàn giao đồng nghiệp.':'Tiến qua đống bê tông. Dùng gió phản đạn hoặc đánh trên cao.'):count<2?'Đòn đánh, lửa và gió đều phá được các lõi phát sáng.':boss?.hp>0?'Né cú vồ. Nhảy hoặc né để tránh loạt gai.':'Cổng phía đông đã mở. Tiếp tục sang phải.';
    const stamp=[objective,remaining,p.hp,p.maxHp,s.level,s.xp,Math.floor(p.x/12),Math.ceil(s.fireCd*10),Math.ceil(s.windCd*10),p.doubleJumpUsed,boss?.hp].join(':');if(!force&&stamp===uiStamp)return;uiStamp=stamp;
    $('healthFill').style.width=p.hp/p.maxHp*100+'%';$('healthText').textContent=p.hp+' / '+p.maxHp;$('healthBar').setAttribute('aria-valuenow',p.hp);$('healthBar').setAttribute('aria-valuemax',p.maxHp);$('xpText').textContent=s.xp+' KN';$('levelNumber').textContent='LV. 0'+s.level;$('objectiveTitle').textContent=objective;$('objectiveDetail').textContent=detail;
    for(const kind of ['fire','wind']){$(kind+'Cooldown').hidden=s[kind+'Cd']===0;$(kind+'Cooldown').textContent=s[kind+'Cd'].toFixed(1)+'s';}
    $('jumpStatus').textContent=p.doubleJumpUsed?'↑ ĐÃ DÙNG NHẢY LẦN HAI':'↑ SPACE ×2 · VƯỢT SÀN ĐƯỜNG ĐỨT';$('progressFill').style.width=clamp(p.x/C.exitX*100,0,100)+'%';$('locationLabel').textContent=['01 / TRẠM CỨU THƯƠNG','02 / Ổ DỊ GIỚI PHÍA TÂY','03 / ĐƯỜNG PHONG TỎA','04 / TUYẾN SƠ TÁN'][sector];$('floorCoordinate').textContent=$('locationLabel').textContent;$('progressText').textContent='KHU SƠ TÁN →';
    const rows=document.querySelectorAll('[data-floor]');rows.forEach((row,i)=>{row.classList.toggle('is-current',i===sector);row.classList.toggle('is-passed',i<sector);});
    $('bossBar').hidden=!world.bossSeen||!boss||boss.hp<=0;if(boss){$('bossHealth').style.width=boss.hp/boss.maxHp*100+'%';$('bossHp').textContent=boss.hp+' / '+boss.maxHp;$('bossPhase').textContent=boss.hp<boss.maxHp*.5?'KẺ TRUY SÁT · CUỒNG NỘ':'KẺ TRUY SÁT';}
  }
  function debrief(){
    api.release();s.mode='sampleComplete';$('sampleDebrief').hidden=false;
    $('sampleStats').textContent='Phá giáp: '+world.stats.guardBreaks+' · Phản đạn: '+world.stats.reflections+' · Đạn phản trúng: '+world.stats.reflectedHits+' · Đạn bị vật chắn chặn: '+world.stats.coverBlocks+' · Quái trúng nổ: '+world.stats.barrelHits;
    $('sampleContinue').focus({preventScroll:true});
  }
  function bind(){
    for(const [i,label]of ['PHỐ','Ổ 01','Ổ 02','CỔNG'].entries()){const row=document.createElement('span');row.dataset.floor=i;row.textContent=label;$('floorTower').append(row);}
    $('sampleContinue').onclick=()=>{$('sampleDebrief').hidden=true;s.mode='playing';api.release();api.focus();};
    $('sampleReplay').onclick=()=>$('startButton').click();
    if(C.sample){$('titleScreen').classList.add('sample-title');$('titleScreen').querySelector('h1').innerHTML='Ngã tư.<br/>Một <em>đường sống.</em>';$('titleScreen').querySelector('.title-copy>p').textContent='Hai đợt giao tranh trước trạm cứu thương. Phá giáp, phản đạn và dùng địa hình mở đường.';$('startButton').firstChild.textContent='CHƠI ĐOẠN MẪU ';}
  }
  return Object.freeze({solids:()=>geometry,reset,afterRetry,beforeDamage,afterDamage,reflect,serialize:()=>({delivered:world.delivered,bossSeen:world.bossSeen}),sanitizeSave:d=>({delivered:Boolean(d?.delivered),bossSeen:Boolean(d?.bossSeen)}),updateEnemy,update,events,drawBackground,drawArchitecture,drawEnemy,drawExtra,updateUI,bind,getState:()=>({sample:Boolean(C.sample),delivered:world.delivered,anchorsDown:anchorsDown(),bossSeen:world.bossSeen,wave:world.wave,cleared:world.cleared,breather:world.breather,barrel:world.barrel,stats:{...world.stats},artStyle:'outlined-cel-shading',background:{src:C.backgrounds.panorama,...backgroundLayout()},scenery:(C.scenery||[]).map(prop=>({...prop,renderedWidth:assets.world?.['street-props']?prop.height*assets.world['street-props'].frames[0].w/assets.world['street-props'].frames[0].h:0,collidable:false})),hostileProjectiles:world.hostiles.length,bullets:world.hostiles.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,friendly:b.friendly}))})});
}});
