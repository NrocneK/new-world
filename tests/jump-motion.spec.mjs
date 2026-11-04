import assert from 'node:assert/strict';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('../character-lab/jump-motion.js',import.meta.url),'utf8');
const {createJumpMotion,jumpPreviewHeight,jumpCameraOffset}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const j=createJumpMotion();
assert(j.request());assert.equal(j.getState().count,1);assert.equal(j.getState().phase,'anticipation');assert(!j.request());
j.step(149);assert.equal(j.getState().height,0);assert.equal(j.getState().phase,'anticipation');
j.step(1);assert.equal(j.getState().phase,'flight');assert.equal(j.getState().velocity,600);
j.step(375);assert(Math.abs(j.getState().height-112.5)<1e-8);assert(Math.abs(j.getState().velocity)<1e-8);
const height=j.getState().height;assert(j.request());assert.equal(j.getState().action,'airJump');assert.equal(j.getState().height,height);assert.equal(j.getState().velocity,720);assert.equal(j.getState().count,2);assert(!j.request());
j.step(450);assert(Math.abs(j.getState().height-(112.5+162))<1e-8);
let landed=false;for(let t=0;t<2000;t+=4){const s=j.step(4);assert(s.height>=0);if(s.phase==='landing'){landed=true;assert.equal(s.height,0);assert.equal(s.count,0);}}
assert(landed);assert.equal(j.getState().active,false);assert(j.request());assert.equal(j.getState().count,1);
j.reset();assert.equal(j.getState().height,0);assert.equal(j.getState().velocity,0);assert.equal(j.getState().active,false);
assert.equal(jumpPreviewHeight('jump',149),0);assert.equal(jumpPreviewHeight('jump',525),112.5);assert.equal(jumpPreviewHeight('jump',1100),0);
assert.equal(jumpPreviewHeight('airJump',0),100);assert(Math.abs(jumpPreviewHeight('airJump',450)-262)<1e-8);
const single=createJumpMotion();single.request();const order=[];for(let ms=0;ms<1320;ms+=4){const frame=single.getState().frame;if(order.at(-1)!==frame)order.push(frame);single.step(4);}assert.deepEqual(order.slice(0,16),Array.from({length:16},(_,i)=>i));
for(const zoom of [1,1.35]){const camera=jumpCameraOffset(274.5,zoom);assert(camera>0);assert(Math.abs(558+zoom*(-274.5+camera-300)-35)<1e-8);}
for(const boosted of [false,true]){
 const flight=createJumpMotion();flight.request();flight.step(270);if(boosted)flight.request();flight.step(80);
 const before=flight.getState();flight.settleAfterAirDash();const after=flight.getState();
 assert.equal(after.height,before.height);assert.equal(after.count,before.count);assert.equal(after.velocity,0);assert.equal(after.action,before.action);assert.equal(after.frame,boosted?4:6);
 assert(flight.step(16).height<before.height);
 assert.equal(flight.request(),!boosted); // Air dash does not consume or restore the second jump.
}
console.log('PASS jump physics: 16 ordered stages; higher air impulse; camera headroom; anticipation; ballistic apex; second impulse without teleport; two-jump limit; landing/reset; preview trajectory');
