const assert=require('node:assert/strict'),V=require('../site/level-view.js');
const v=V.create({worldWidth:7600,worldHeight:820,ground:584,zoom:.72,groundLine:540,lockY:true});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
near(v.width,1280/.72);assert.ok(v.width/1280>1.38);
for(const x of [0,220,1280,2660,2840,5160,5320,7600]){
 const camera=v.target({x,y:584,vy:0});near(v.project(x,584,camera).y,540);assert.ok(camera.x>=0&&camera.x<=v.maxX);
 const rect={x:100,y:514,w:200,h:70};const a=v.project(rect.x,rect.y,camera),b=v.project(rect.x+rect.w,rect.y+rect.h,camera);near(b.x-a.x,144);near(b.y-a.y,50.4);
}
console.log('PASS wider view uniformly scales artwork and collision space; ground stays at a stable screen baseline');
const layout=cameraX=>V.panorama(v,{imageWidth:2172,imageHeight:724,ground:584,cameraX});
for(const x of [0,2000,4699.99,4700,4700.01,v.maxX]){
 const b=layout(x);assert.ok(b.x<=0&&b.x+b.width>=v.width);assert.ok(b.y<=v.baseY);near(b.width/b.height,3);
 const n=layout(x+.01);near(n.x-b.x,-b.parallax*.01);near(n.y,b.y);near(n.width,b.width);
}
for(const left of [2660,2840,5160,5320]){const a=layout(left-1),b=layout(left+1);near(b.x-a.x,-a.parallax*2);}
console.log('PASS one panorama covers both ends, keeps aspect ratio and scrolls continuously through pits and the old image-switch threshold');
const old=V.create({worldWidth:2000,worldHeight:5400,ground:584});assert.equal(old.zoom,1);assert.equal(old.width,1280);assert.deepEqual(old.target({x:1000,y:1884,vy:300}),{x:360,y:1474});
console.log('PASS default chapter-one camera preserves its original size, bounds and falling lookahead');
