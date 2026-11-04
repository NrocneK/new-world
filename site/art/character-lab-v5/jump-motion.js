const GRAVITY=1600,GROUND_SPEED=600,AIR_SPEED=540,ANTICIPATION_MS=150,LANDING_MS=200;

export function createJumpMotion(){
 const s={phase:'ground',height:0,velocity:0,count:0,action:'jump',elapsed:0,phaseElapsed:0};
 const active=()=>s.phase!=='ground';
 function reset(){Object.assign(s,{phase:'ground',height:0,velocity:0,count:0,action:'jump',elapsed:0,phaseElapsed:0});}
 function request(){
  if(s.phase==='ground'||s.phase==='landing'){
   Object.assign(s,{phase:'anticipation',height:0,velocity:0,count:1,action:'jump',elapsed:0,phaseElapsed:0});return true;
  }
  if(s.phase==='flight'&&s.count===1){Object.assign(s,{count:2,action:'airJump',elapsed:0,velocity:AIR_SPEED});return true;}
  return false;
 }
 function step(ms){
  // Small analytic steps keep the floor crossing and double-jump limit stable.
  for(let left=ms;left>0&&active();){
   const boundary=s.phase==='anticipation'?ANTICIPATION_MS-s.phaseElapsed:s.phase==='landing'?LANDING_MS-s.phaseElapsed:Infinity;
   const dt=Math.min(8,left,boundary);left-=dt;s.elapsed+=dt;s.phaseElapsed+=dt;
   if(s.phase==='anticipation'){
    if(s.phaseElapsed>=ANTICIPATION_MS){s.phase='flight';s.phaseElapsed=0;s.velocity=GROUND_SPEED;}
   }else if(s.phase==='flight'){
    const seconds=dt/1000;s.height+=s.velocity*seconds-GRAVITY*seconds*seconds/2;s.velocity-=GRAVITY*seconds;
    if(s.height<=0&&s.velocity<0){Object.assign(s,{height:0,velocity:0,count:0,phase:'landing',phaseElapsed:0,action:'jump',elapsed:900});}
   }else if(s.phaseElapsed>=LANDING_MS){reset();}
  }
  return {...s,active:active(),frame:frame()};
 }
 function frame(){
  if(s.phase==='anticipation')return s.phaseElapsed<60?0:1;
  if(s.phase==='landing')return s.phaseElapsed<100?6:7;
  if(s.phase!=='flight')return 7;
  if(s.action==='jump')return s.phaseElapsed<100?2:s.velocity>100?3:s.velocity>=-140?4:5;
  if(s.elapsed<50)return 0;if(s.elapsed<100)return 1;if(s.elapsed<190)return 2;
  return s.velocity>100?3:s.velocity>=-120?4:s.velocity>-330&&s.height>50?5:s.height>35?6:7;
 }
 return {request,step,reset,getState:()=>({...s,active:active(),frame:frame()})};
}

export function jumpPreviewHeight(id,ms){
 const t=id==='jump'?(ms-ANTICIPATION_MS)/1000:ms/1000;
 if(t<0)return 0;
 return Math.max(0,(id==='airJump'?100:0)+(id==='airJump'?AIR_SPEED:GROUND_SPEED)*t-GRAVITY*t*t/2);
}
