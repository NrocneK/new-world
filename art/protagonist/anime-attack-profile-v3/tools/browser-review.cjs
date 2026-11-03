const {chromium,request}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const repo=path.resolve(__dirname,'../../../..');
const base=process.env.ATTACK_REVIEW_ORIGIN||'http://127.0.0.1:4173/site';
const remote=base.startsWith('https:');
const out='/tmp/di-mon-attack-v3-review';fs.mkdirSync(out,{recursive:true});
const meta=JSON.parse(fs.readFileSync(path.join(__dirname,'../combat-sheet.json')));
const digest=b=>createHash('sha256').update(b).digest('hex');

(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const api=remote?await request.newContext({proxy:{server:process.env.HTTPS_PROXY||process.env.HTTP_PROXY},ignoreHTTPSErrors:false}):null;
 const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 if(remote)await page.route(base+'/**',async route=>{const r=await api.get(route.request().url(),{timeout:90000});await route.fulfill({response:r});});
 try {
  await page.clock.install();
  const reviewUrl=base+'/attack-profile-v3'+(remote?'':'.html');
  await page.goto(reviewUrl);
  await page.waitForFunction(()=>document.querySelectorAll('#frame-controls button').length===8);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  const canvas=page.locator('#combat-preview');
  const data=()=>canvas.evaluate(c=>({...c.dataset}));
  const tick=()=>page.clock.runFor(32);
  const inspect=async(key,index)=>{
    await page.locator('button[data-action="'+key+'"]').dispatchEvent('click');
    await page.locator('button[data-frame="'+index+'"]').dispatchEvent('click');await tick();
    const d=await data();assert.equal(d.action,key);assert.equal(+d.currentFrame,index);assert.equal(d.mode,'inspect');
  };
  for(const key of meta.combo) {
   await inspect(key,meta.actions[key].impact.frameIndex);
   const bare=digest(await canvas.screenshot());
   await canvas.screenshot({path:path.join(out,key+'-contact.png')});
   if(key==='attack2'){
    await page.locator('details').first().evaluate(el=>el.open=true);
    const png=await page.locator('#impact-detail').evaluate(c=>c.toDataURL().split(',')[1]);
    fs.writeFileSync(path.join(out,'left-cross-fist.png'),Buffer.from(png,'base64'));
   }
   await page.locator('#show-vfx').evaluate(c=>{c.checked=true;c.dispatchEvent(new Event('change'));});await tick();
   assert.equal((await data()).fx,key);
   assert.notEqual(digest(await canvas.screenshot()),bare,'VFX should change pixels');
   await canvas.screenshot({path:path.join(out,key+'-vfx.png')});
   await page.locator('#show-vfx').evaluate(c=>{c.checked=false;c.dispatchEvent(new Event('change'));});
   for(let i=0;i<8;i++){await page.locator('button[data-frame="'+i+'"]').dispatchEvent('click');await tick();assert.equal(+(await data()).currentFrame,i);}
   await page.locator('button[data-action="'+key+'"]').dispatchEvent('click');
   await page.clock.runFor(meta.actions[key].durationMs+40);assert.equal((await data()).mode,'completed');
   const held=digest(await canvas.screenshot());await page.clock.runFor(2000);
   assert.equal(digest(await canvas.screenshot()),held,'one-shot must hold final guard');
  }
  await page.locator('#play-combo').dispatchEvent('click');await page.clock.runFor(270);assert.equal((await data()).action,'attack2');
  await page.clock.runFor(250);assert.equal((await data()).action,'attack3');
  await page.clock.runFor(360);assert.equal((await data()).action,'attack4');
  await page.clock.runFor(600);assert.equal((await data()).mode,'completed');
  await page.locator('#speed').selectOption('0.5');await page.clock.runFor(1500);assert.equal((await data()).action,'attack3');
  await page.clock.runFor(1400);assert.equal((await data()).mode,'completed');
  const poseHash=()=>canvas.evaluate(async c=>{
    const bytes=c.getContext('2d').getImageData(96,32,512,628).data;
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).join(',');
  });
  await inspect('attack3',4);const peakHash=await poseHash();
  await inspect('attack4',0);assert.equal(await poseHash(),peakHash,'slam first pose must be the uppercut peak');
  await page.locator('#speed').selectOption('1');
  await page.locator('#play-finisher').dispatchEvent('click');await page.clock.runFor(350);
  assert.equal((await data()).action,'attack3');const beforeSeam=await poseHash();
  await page.clock.runFor(32);assert.equal((await data()).action,'attack4');
  assert.equal(await poseHash(),beforeSeam,'rendered finisher seam must have no pose jump');
  await inspect('attack2',3);
  await page.locator('details').first().evaluate(el=>el.open=true);await tick();
  await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await tick();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');
  await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
  const visibleLinks=await page.locator('a[download]').evaluateAll(a=>a.map(x=>x.href));
  const links=[...new Set([...visibleLinks,...meta.combo.flatMap(key=>['gif','png'].map(ext=>base+'/downloads/di-mon-'+key+'-profile-v3.'+ext))])];
  const downloadMeta=JSON.parse(fs.readFileSync(path.join(repo,'site/downloads/di-mon-attack-profile-v3.json')));
  assert.equal(downloadMeta.image,'di-mon-attack-profile-v3.png');
  for(let a=0;a<4;a++)for(const f of downloadMeta.actions[meta.combo[a]].frames)assert.ok(f.y>=a*1280&&f.y<(a+1)*1280);
  if(remote) {
   for(const url of links) {
    const r=await api.get(url);assert.equal(r.status(),200,url);assert.match(r.headers()['content-disposition'],/attachment/);
    const local=path.join(repo,'site/downloads',new URL(url).pathname.split('/').pop());
    assert.equal(digest(await r.body()),digest(fs.readFileSync(local)),url+' bytes');
   }
  }
  await page.goto(reviewUrl+'?action=attack2&speed=0.25');
  await page.waitForFunction(()=>document.querySelectorAll('#frame-controls button').length===8);await tick();
  assert.equal((await data()).action,'attack2');assert.equal(await page.locator('#speed').inputValue(),'0.25');
  await page.clock.runFor(1200);assert.equal((await data()).mode,'completed');
  await page.goto(reviewUrl+'?action=attack4&speed=0.5&vfx=1');
  await page.waitForFunction(()=>document.querySelectorAll('#frame-controls button').length===8);await page.clock.runFor(550);
  assert.equal((await data()).action,'attack4');assert.equal((await data()).fx,'attack4');
  await page.goto(reviewUrl+'?action=attack4&frame=2');
  await page.waitForFunction(()=>document.querySelectorAll('#frame-controls button').length===8);await tick();
  assert.equal((await data()).mode,'inspect');assert.equal(+(await data()).currentFrame,2);
  assert.equal(await page.locator('#free-hand-review').evaluate(el=>el.hidden),false);
  const freePng=await page.locator('#free-hand-detail').evaluate(c=>c.toDataURL().split(',')[1]);
  fs.writeFileSync(path.join(out,'left-free-fist.png'),Buffer.from(freePng,'base64'));
  await canvas.screenshot({path:path.join(out,'slam-frame3.png')});
  assert.deepEqual(errors,[]);console.log('PASS: all 32 cels selectable; 4 one-shot actions + combo + slow mode; VFX toggles; mobile fit; no browser errors'+(remote?'; public downloads match.':'.'));
 }finally{await page.unrouteAll({behavior:'wait'});await browser.close();if(api)await api.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
