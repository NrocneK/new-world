const DURATION=400,COOLDOWN=120;
const profiles={dash:{windup:60,acceleration:30,cruise:140,brake:80,speed:1000},airDash:{windup:30,acceleration:40,cruise:160,brake:80,speed:1100}};

export function dashDistance(id,ms){
 const p=profiles[id];if(!p)return 0;
 let t=Math.max(0,ms-p.windup),distance=0;
 const acceleration=Math.min(t,p.acceleration);distance+=p.speed*acceleration*acceleration/(2*p.acceleration*1000);t-=acceleration;
 const cruise=Math.min(t,p.cruise);distance+=p.speed*cruise/1000;t-=cruise;
 const brake=Math.min(t,p.brake);distance+=p.speed*(brake-brake*brake/(2*p.brake))/1000;
 return distance;
}

export function createDashMotion(){
 const s={active:false,kind:'dash',elapsed:0,facing:1,airUsed:false,cooldown:0};
 function reset(){Object.assign(s,{active:false,kind:'dash',elapsed:0,facing:1,airUsed:false,cooldown:0});}
 function request({airborne=false,facing=1}={}){
  if(s.active||s.cooldown>0||airborne&&s.airUsed)return false;
  Object.assign(s,{active:true,kind:airborne?'airDash':'dash',elapsed:0,facing:facing<0?-1:1});
  if(airborne)s.airUsed=true;
  return true;
 }
 function step(ms,{grounded=false}={}){
  if(grounded)s.airUsed=false;
  if(!s.active){s.cooldown=Math.max(0,s.cooldown-ms);return {...s,dx:0,completed:false};}
  const before=s.elapsed;s.elapsed=Math.min(DURATION,s.elapsed+ms);
  const dx=s.facing*(dashDistance(s.kind,s.elapsed)-dashDistance(s.kind,before));
  const completed=s.elapsed>=DURATION;
  if(completed){s.active=false;s.cooldown=Math.max(0,COOLDOWN-(ms-(s.elapsed-before)));}
  return {...s,dx,completed};
 }
 return {request,step,reset,getState:()=>({...s})};
}
