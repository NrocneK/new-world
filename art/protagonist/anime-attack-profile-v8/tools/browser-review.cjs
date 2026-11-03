const {chromium,request}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{createHash}=require('crypto');
const repo=path.resolve(__dirname,'../../../..'),origin=process.env.ATTACK_REVIEW_ORIGIN||'http://127.0.0.1:4173/site',remote=origin.startsWith('https:');
const meta=JSON.parse(fs.readFileSync(path.join(__dirname,'../combat-sheet.json')));
const digest=b=>createHash('sha256').update(b).digest('hex');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const api=remote?await request.newContext({proxy:{server:process.env.HTTPS_PROXY||process.env.HTTP_PROXY},ignoreHTTPSErrors:false}):null;
 const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 if(remote)await page.route(origin+'/**',async route=>{const response=await api.get(route.request().url(),{timeout:90000});await route.fulfill({response});});
 try{
  await page.clock.install();await page.goto(origin+'/attack-profile-v8'+(remote?'':'.html'));
  await page.waitForFunction(()=>document.querySelectorAll('#frame-controls button').length===8);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+2000));
  const canvas=page.locator('#combat-preview'),data=()=>canvas.evaluate(c=>({...c.dataset}));
  const click=selector=>page.locator(selector).dispatchEvent('click'),tick=()=>page.clock.runFor(32);
  assert.equal(await page.locator('button[data-action]').count(),6);assert.equal(await page.locator('button[data-action="attack4"]').count(),0);
  for(const key of meta.allActions){
   await click('button[data-action="'+key+'"]');await tick();
   for(let i=0;i<meta.actions[key].frames.length;i++){await click('[data-frame="'+i+'"]');await tick();assert.equal((await data()).action,key);assert.equal(+(await data()).currentFrame,i);assert.equal((await data()).mode,'inspect');}
   if(key.startsWith('kick')){await click('[data-frame="'+meta.actions[key].impact.frameIndex+'"]');await tick();const d=await data();assert.equal(d.strikingLeg,meta.actions[key].strikingLeg);assert.equal(d.supportLeg,meta.actions[key].supportLeg);await canvas.screenshot({path:'/tmp/di-mon-v8-'+key+'.png'});}
   await click('button[data-action="'+key+'"]');await page.clock.runFor(meta.actions[key].durationMs+40);assert.equal((await data()).mode,'completed');const held=digest(await canvas.screenshot());await page.clock.runFor(1000);assert.equal(digest(await canvas.screenshot()),held);
  }
  await click('button[data-action="kick3"]');await tick();assert.equal(await page.locator('[data-frame]').count(),16);for(const i of [3,6,8,11]){await click('[data-frame="'+i+'"]');await tick();assert.equal(+(await data()).currentFrame,i);await canvas.screenshot({path:'/tmp/di-mon-v8-turn-'+i+'.png'});}
  await click('button[data-action="kick1"]');await tick();assert.equal(await page.locator('[data-frame]').count(),8);for(const i of [2,4,5]){await click('[data-frame="'+i+'"]');await tick();await canvas.screenshot({path:'/tmp/di-mon-v8-near-'+i+'.png'});}
  await click('#play-combo');await page.clock.runFor(520);assert.equal((await data()).action,'kick2');await page.clock.runFor(500);assert.equal((await data()).action,'kick3');await page.clock.runFor(1000);assert.equal((await data()).mode,'completed');
  await page.locator('#speed').selectOption('0.25');await click('#play-combo');await page.clock.runFor(1800);assert.equal((await data()).action,'kick1');await page.clock.runFor(300);assert.equal((await data()).action,'kick2');await page.clock.runFor(2000);assert.equal((await data()).action,'kick3');await page.clock.runFor(3600);assert.equal((await data()).mode,'completed');
  await page.locator('#speed').selectOption('0.5');await click('#play-punches');await page.clock.runFor(1100);assert.equal((await data()).action,'attack3');await page.clock.runFor(800);assert.equal((await data()).mode,'completed');
  await page.setViewportSize({width:390,height:844});await tick();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.goto(origin+'/attack-profile-v8'+(remote?'':'.html')+'?action=kick1&frame=2&speed=0.25');await page.waitForFunction(()=>document.querySelectorAll('#frame-controls button').length===8);await tick();assert.equal((await data()).mode,'inspect');assert.equal((await data()).currentFrame,'2');await page.screenshot({path:'/tmp/di-mon-v8-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
  const t=await import(path.join(repo,'site/art/protagonist/anime-attack-profile-v8/timeline.js'));
  assert.deepEqual(t.impactEvents(meta,'combo').map(e=>e.timeMs),[225,710,1550]);
  for(const [ms,key,index]of [[499,'kick1',7],[500,'kick2',0],[999,'kick2',7],[1000,'kick3',0],[1900,'kick3',15]]){const s=t.sample(meta,'combo',ms);assert.equal(s.key,key);assert.equal(s.index,index);}
  console.log('PASS browser:6 actions,56 selectable frames; kick order and both speeds; punch review; one-shot guard holds; deep link; mobile width; no JS/network errors; timeline boundaries');
  if(remote){
   const paths=JSON.parse(fs.readFileSync('/workspace/deploy/di-mon-attack-v8-paths.json')).filter(p=>p.startsWith('site/'));let checked=0;
   for(let i=0;i<paths.length;i+=4)await Promise.all(paths.slice(i,i+4).map(async p=>{const r=await api.get(origin+'/'+p.slice(5),{timeout:90000});assert.equal(r.status(),200,p);assert.equal(digest(await r.body()),digest(fs.readFileSync(path.join(repo,p))),p);if(p.startsWith('site/downloads/')){assert.match(r.headers()['content-disposition'],/attachment/);assert.equal(r.headers()['x-content-type-options'],'nosniff');}checked++;}));
   console.log('PASS public:'+checked+' HTML/modules/assets/downloads match local bytes; download attachment headers verified');
  }
 }finally{await browser.close();if(api)await api.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
