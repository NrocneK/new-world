/* Street-specific encounters and objectives use the shared character engine. */
window.DiMonStreet=Object.freeze({create(api){
  const {C,P,ctx,W,H,s,p,assets,clamp,overlaps,rect,line,text,glow,shadow,worldArt,toast,showDialogue,animate,save,grantExperience,hurt,emit,tone}=api;
  const $=id=>document.getElementById(id),G=C.ground;
  const geometry=[...C.groundSections.map(([a,b])=>({x:a,y:G,w:b-a,h:48,floor:0,kind:'road'})),...C.platforms];
  const world={delivered:false,bossSeen:false,notified:[],hostiles:[]};let uiStamp='';
  const enemies=()=>api.enemies(),npc=()=>api.npc();
  const anchors=()=>enemies().filter(e=>e.kind==='nest');
  const anchorsDown=()=>anchors().filter(e=>e.hp<=0).length;
  function reset(saved){world.delivered=Boolean(saved?.delivered);world.bossSeen=Boolean(saved?.bossSeen);world.notified=anchors().filter(e=>e.hp<=0).map(e=>e.id);world.hostiles=[];uiStamp='';if(world.delivered)api.setNpc(api.makeNpc(0,C.medicalX,true));}
  function afterRetry(){world.hostiles=[];if(world.delivered)api.setNpc(api.makeNpc(0,C.medicalX,true));}
  function bullet(e,vy=0){world.hostiles.push({x:e.x+e.face*(e.boss?75:40),y:e.y-(e.boss?105:63),vx:e.face*(e.boss?440:330),vy,life:2.8,age:0,damage:e.boss?18:11,source:e.x});}
  function updateEnemy(e,dt){
    if(e.kind==='nest')return true;
    if(e.kind!=='spitter'&&e.kind!=='hunter')return false;
    const distance=p.x-e.x;e.face=distance>=0?1:-1;
    if(e.kind==='spitter'){
      if(e.phase==='hurt'){if(e.age>.22){e.phase='patrol';e.age=0;e.cooldown=.45;}return true;}
      if(e.phase==='windup'){if(e.age>.8){e.phase='attack';e.age=0;bullet(e);}return true;}
      if(e.phase==='attack'){if(e.age>.35){e.phase='patrol';e.age=0;e.cooldown=1.6;}return true;}
      if(Math.abs(distance)<630&&Math.abs(p.y-G)<180&&e.cooldown===0){e.phase='windup';e.age=0;}return true;
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
    for(const b of world.hostiles){
      const x=b.x,y=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;b.age+=dt;
      if(overlaps({x:Math.min(x,b.x)-8,y:Math.min(y,b.y)-8,w:Math.abs(b.x-x)+16,h:Math.abs(b.y-y)+16},{x:p.x-19,y:p.y-125,w:38,h:125})){hurt(b.damage,b.source);b.life=0;}
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
    for(const cp of C.checkpoints)if(cp.id>s.checkpoint&&p.x>=cp.x&&p.grounded){s.checkpoint=cp.id;p.hp=p.maxHp;save();toast('ĐIỂM HỒI SINH · '+(cp.id===2?'TRẠM CỨU THƯƠNG':cp.id===4?'KHU SƠ TÁN':'ĐẠI LỘ'));}
    if(!world.delivered&&p.x>2260&&Math.abs(npc().x-p.x)<200&&!enemies().some(e=>e.id.startsWith('clinic-')&&e.hp>0)&&p.grounded){
      animate('idle',true);showDialogue(C.delivery,()=>{world.delivered=true;api.setNpc(api.makeNpc(0,C.medicalX,true));grantExperience(25);p.hp=p.maxHp;s.checkpoint=Math.max(2,s.checkpoint);save();toast('ĐỒNG NGHIỆP ĐÃ AN TOÀN · Phá 2 ổ dị giới',4);tone('quest');});return;
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
    rect(0,0,W,H,'#0a1621');ctx.imageSmoothingEnabled=false;
    const im=s.camera>4700?assets.lobby:assets.office,offset=-(s.camera*.32)%1600;
    for(let i=-1;i<2;i++)ctx.drawImage(im,offset+i*1600,-5-s.cameraY,1600,720);
    rect(0,0,W,H,'#05121b22');
    for(let i=0;i<34;i++){const x=((i*109-s.camera*.5)%W+W)%W,y=(i*73+s.time*120)%H;line([[x,y],[x-3,y+10]],'#a9c9d322',1);}
  }
  function drawArchitecture(){
    for(const [a,b]of C.groundSections){rect(a,G,b-a,5,'#7b8d87');rect(a,G+5,b-a,48,'#223740');rect(a,G+53,b-a,H,'#0a1821');for(let x=a+30;x<b;x+=105){rect(x,G+15,50,2,'#3b535b');rect(x+20,G+37,30,2,'#132b35');}}
    for(const [left,right]of [[2660,2840],[5160,5320]]){rect(left,G-7,right-left,100,'#07101c');for(let i=0;i<5;i++){line([[left,G+i*7],[left+15+i*5,G+20+i*12]],'#4a6269',2);line([[right,G+i*7],[right-15-i*5,G+20+i*12]],'#3b515e',2);}text('SÀN ĐƯỜNG ĐỨT',left+(right-left)/2,G-38,9,'#b1c9bc','center');}
    for(const b of C.platforms){
      rect(b.x,b.y,b.w,b.h,'#2a4148');rect(b.x,b.y,b.w,5,'#83968b');rect(b.x+10,b.y+12,b.w-20,b.h-22,'#1c303c');
      for(let x=b.x+15;x<b.x+b.w-20;x+=41)rect(x,b.y+14,32,b.h-35,'#557079');
      rect(b.x-7,b.y+b.h-17,28,17,'#15242d');rect(b.x+b.w-21,b.y+b.h-17,28,17,'#15242d');line([[b.x+5,b.y+7],[b.x+b.w-10,b.y+20]],'#9b918b66',2);
    }
    for(const x of[400,1150,2230,3250,4490,5680,6940]){rect(x,G-360,5,360,'#35464a');rect(x-17,G-365,68,6,'#7d8980');glow(x+25,G-344,75,'#e1ba6c18');rect(x+17,G-358,24,3,'#cfbf8e');}
    // The clinic is the handoff point; the coworker stays safely here afterwards.
    const mx=C.medicalX;rect(mx-120,G-160,240,160,'#203c3c');ctx.fillStyle='#526f69';ctx.beginPath();ctx.moveTo(mx-146,G-160);ctx.lineTo(mx,G-230);ctx.lineTo(mx+146,G-160);ctx.closePath();ctx.fill();
    rect(mx-42,G-155,84,155,'#10272d');rect(mx-15,G-206,30,8,'#c6dec3');rect(mx-4,G-217,8,30,'#c6dec3');text('TRẠM CỨU THƯƠNG',mx,G-242,11,'#c3d9c0','center');
    for(const cp of C.checkpoints.filter(c=>c.id>0&&c.id!==2)){rect(cp.x-8,G-50,16,50,'#2e464a');rect(cp.x-4,G-44,8,16,s.checkpoint>=cp.id?'#c8e9b9':'#7fb7bb');text('HỒI SINH',cp.x,G-69,8,'#b1c7bb','center');}
    const open=anchorsDown()===2;
    if(!open){for(let i=0;i<7;i++)line([[6170+i%2*4,G-265+i*39],[6150-i%2*9,G-235+i*39]],'#9a8ac3bb',4);text('MÀN CHẮN DỊ GIỚI',6155,G-292,10,'#c9bbdf','center');}
    else text('TUYẾN SƠ TÁN →',6155,G-292,10,'#b7d6bd','center');
    rect(7240,G-275,220,11,'#739488');rect(7240,G-264,10,264,'#4f706b');rect(7450,G-264,10,264,'#4f706b');rect(7260,G-326,180,31,'#b5d1a4');text('ĐIỂM SƠ TÁN →',7350,G-305,12,'#203a32','center');
    if(enemies().find(e=>e.boss)?.hp>0)for(let x=7250;x<7450;x+=30)rect(x,G-260,6,260,'#697f7a');
  }
  function drawEnemy(e){
    if(!['spitter','nest','hunter'].includes(e.kind))return false;
    if(e.hp<=0&&e.deadAge>1.5&&e.kind!=='nest')return true;
    const name=e.kind==='spitter'?'spore-spitter':e.kind==='nest'?'rift-nest':'rift-hunter';
    const frame=e.kind==='nest'?(e.hp<=0?3:e.flash>0?2:Math.floor(s.time*2)%2):e.hp<=0?(e.deadAge<.25?6:7):e.phase==='windup'?3:e.phase==='attack'?4:e.phase==='hurt'?5:1+Math.floor(s.time*5)%2;
    shadow(e.x,G,e.boss?86:e.kind==='nest'?62:40);ctx.save();if(e.hp<=0&&e.kind!=='nest')ctx.globalAlpha=clamp(1-(e.deadAge-.6)/.9,0,1);worldArt(name,frame,e.x,e.y,e.boss?.60:e.kind==='nest'?.31:.36,-e.face);ctx.restore();
    if(e.hp>0&&!e.boss){const w=e.kind==='nest'?92:58,y=G-(e.kind==='nest'?150:110);rect(e.x-w/2,y,w,3,'#273e4b');rect(e.x-w/2,y,w*e.hp/e.maxHp,3,e.kind==='nest'?'#b094c6':'#b1bd91');if(e.kind==='nest')text('Ổ DỊ GIỚI',e.x,y-13,10,'#c8b6d8','center');}
    if(e.phase==='windup'&&e.hp>0){text(e.boss?(e.attackType==='pounce'?'CẨN THẬN CÚ VỒ!':'LOẠT GAI!'):'!',e.x,e.y-(e.boss?230:132),e.boss?11:19,'#e5b282','center');if(e.boss&&e.attackType==='pounce'){ctx.strokeStyle='#d6ab7c99';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(clamp(p.x,e.minX,e.maxX),G-3,110,9,0,0,Math.PI*2);ctx.stroke();}}
    if(e.boss&&e.phase==='attack'&&e.landed){ctx.strokeStyle='#9fb9c299';ctx.beginPath();ctx.ellipse(e.x,G-3,Math.min(145,e.age*230),9,0,0,Math.PI*2);ctx.stroke();}
    return true;
  }
  function drawExtra(){
    for(const b of world.hostiles){glow(b.x,b.y,16,'#9ab7d51c');ctx.strokeStyle='#c6b4df';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(b.x,b.y,8,7,0,0,Math.PI*2);ctx.stroke();rect(b.x-3,b.y-3,6,6,'#9eb7d2');line([[b.x-b.vx*.035,b.y-b.vy*.035],[b.x-b.vx*.015,b.y-b.vy*.015]],'#9daec977',2);}
  }
  function updateUI(force=false){
    const count=anchorsDown(),boss=enemies().find(e=>e.boss),sector=p.x<2600?0:p.x<4900?1:p.x<6250?2:3;
    const objective=!world.delivered?'Đưa đồng nghiệp tới trạm cứu thương':count<2?'Phá các ổ dị giới · '+count+' / 2':boss?.hp>0?'Hạ Kẻ Truy Sát':'Tới khu sơ tán';
    const detail=!world.delivered?'Dọn quái trước trạm. Đưa đồng nghiệp tới gần lều cứu hộ.':count<2?'Đòn đánh, lửa và gió đều phá được các lõi phát sáng.':boss?.hp>0?'Né cú vồ. Nhảy hoặc né để tránh loạt gai.':'Cổng phía đông đã mở. Tiếp tục sang phải.';
    const stamp=[objective,p.hp,p.maxHp,s.level,s.xp,Math.floor(p.x/12),Math.ceil(s.fireCd*10),Math.ceil(s.windCd*10),p.doubleJumpUsed,boss?.hp].join(':');if(!force&&stamp===uiStamp)return;uiStamp=stamp;
    $('healthFill').style.width=p.hp/p.maxHp*100+'%';$('healthText').textContent=p.hp+' / '+p.maxHp;$('healthBar').setAttribute('aria-valuenow',p.hp);$('healthBar').setAttribute('aria-valuemax',p.maxHp);$('xpText').textContent=s.xp+' KN';$('levelNumber').textContent='LV. 0'+s.level;$('objectiveTitle').textContent=objective;$('objectiveDetail').textContent=detail;
    for(const kind of ['fire','wind']){$(kind+'Cooldown').hidden=s[kind+'Cd']===0;$(kind+'Cooldown').textContent=s[kind+'Cd'].toFixed(1)+'s';}
    $('jumpStatus').textContent=p.doubleJumpUsed?'↑ ĐÃ DÙNG NHẢY LẦN HAI':'↑ SPACE ×2 · VƯỢT SÀN ĐƯỜNG ĐỨT';$('progressFill').style.width=clamp(p.x/C.exitX*100,0,100)+'%';$('locationLabel').textContent=['01 / TRẠM CỨU THƯƠNG','02 / Ổ DỊ GIỚI PHÍA TÂY','03 / ĐƯỜNG PHONG TỎA','04 / TUYẾN SƠ TÁN'][sector];$('floorCoordinate').textContent=$('locationLabel').textContent;$('progressText').textContent='KHU SƠ TÁN →';
    const rows=document.querySelectorAll('[data-floor]');rows.forEach((row,i)=>{row.classList.toggle('is-current',i===sector);row.classList.toggle('is-passed',i<sector);});
    $('bossBar').hidden=!world.bossSeen||!boss||boss.hp<=0;if(boss){$('bossHealth').style.width=boss.hp/boss.maxHp*100+'%';$('bossHp').textContent=boss.hp+' / '+boss.maxHp;$('bossPhase').textContent=boss.hp<boss.maxHp*.5?'KẺ TRUY SÁT · CUỒNG NỘ':'KẺ TRUY SÁT';}
  }
  function bind(){for(const [i,label]of ['PHỐ','Ổ 01','Ổ 02','CỔNG'].entries()){const row=document.createElement('span');row.dataset.floor=i;row.textContent=label;$('floorTower').append(row);}}
  return Object.freeze({solids:()=>geometry,reset,afterRetry,serialize:()=>({delivered:world.delivered,bossSeen:world.bossSeen}),sanitizeSave:d=>({delivered:Boolean(d?.delivered),bossSeen:Boolean(d?.bossSeen)}),updateEnemy,update,events,drawBackground,drawArchitecture,drawEnemy,drawExtra,updateUI,bind,getState:()=>({delivered:world.delivered,anchorsDown:anchorsDown(),bossSeen:world.bossSeen,hostileProjectiles:world.hostiles.length})});
}});
