import assert from 'node:assert/strict';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('../character-lab/jump-motion.js',import.meta.url),'utf8');
const {createJumpMotion,jumpPreviewHeight}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const j=createJumpMotion();
assert(j.request());assert.equal(j.getState().count,1);assert.equal(j.getState().phase,'anticipation');assert(!j.request());
j.step(149);assert.equal(j.getState().height,0);assert.equal(j.getState().phase,'anticipation');
j.step(1);assert.equal(j.getState().phase,'flight');assert.equal(j.getState().velocity,600);
j.step(375);assert(Math.abs(j.getState().height-112.5)<1e-8);assert(Math.abs(j.getState().velocity)<1e-8);
const height=j.getState().height;assert(j.request());assert.equal(j.getState().action,'airJump');assert.equal(j.getState().height,height);assert.equal(j.getState().velocity,540);assert.equal(j.getState().count,2);assert(!j.request());
j.step(337.5);assert(Math.abs(j.getState().height-(112.5+91.125))<1e-8);
let landed=false;for(let t=0;t<2000;t+=4){const s=j.step(4);assert(s.height>=0);if(s.phase==='landing'){landed=true;assert.equal(s.height,0);assert.equal(s.count,0);}}
assert(landed);assert.equal(j.getState().active,false);assert(j.request());assert.equal(j.getState().count,1);
j.reset();assert.equal(j.getState().height,0);assert.equal(j.getState().velocity,0);assert.equal(j.getState().active,false);
assert.equal(jumpPreviewHeight('jump',149),0);assert.equal(jumpPreviewHeight('jump',525),112.5);assert.equal(jumpPreviewHeight('jump',1100),0);
assert.equal(jumpPreviewHeight('airJump',0),100);assert(Math.abs(jumpPreviewHeight('airJump',337.5)-191.125)<1e-8);
console.log('PASS jump physics: anticipation; ballistic apex; second impulse without teleport; two-jump limit; landing/reset; preview trajectory');
