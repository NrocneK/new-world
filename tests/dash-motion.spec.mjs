import assert from 'node:assert/strict';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('../character-lab/dash-motion.js',import.meta.url),'utf8');
const {createDashMotion,dashDistance}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
for(const [id,distance,windup,duration] of [['dash',195,40,240],['airDash',242,30,400]]){
 assert.equal(dashDistance(id,0),0);assert.equal(dashDistance(id,windup),0);assert.equal(dashDistance(id,400),distance);assert.equal(dashDistance(id,500),distance);
 for(const facing of [-1,1])for(const tick of [4,16,33,1000]){
  const d=createDashMotion();assert(d.request({airborne:id==='airDash',facing}));assert(!d.request({facing:-facing}));let x=0;
  for(let t=0;t<duration;t+=tick)x+=d.step(Math.min(tick,duration-t)).dx;
  assert(Math.abs(x-facing*distance)<1e-8);assert.equal(d.getState().active,false);assert.equal(d.getState().cooldown,120);assert.equal(d.getState().facing,facing);
  assert(!d.request());d.step(119);assert(!d.request());d.step(1);
  if(id==='airDash'){assert(!d.request({airborne:true}));d.step(0,{grounded:true});}
  assert(d.request({airborne:id==='airDash'}));d.reset();assert.equal(d.getState().active,false);assert.equal(d.getState().airUsed,false);assert.equal(d.getState().cooldown,0);
 }
}
const overshoot=createDashMotion();overshoot.request();assert(overshoot.step(290).completed);assert.equal(overshoot.getState().cooldown,70);overshoot.step(70);assert(overshoot.request());
console.log('PASS dash physics: frame-rate independent distance; windup/acceleration/braking; direction lock; cooldown; one air charge per flight; landing/reset');
