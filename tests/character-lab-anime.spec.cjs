const{chromium,request}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const origin=process.env.LAB_ORIGIN||'http://127.0.0.1:4173/site',remote=origin.startsWith('https:'),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}),api=remote?await request.newContext({proxy:{server:process.env.HTTPS_PROXY}}):null,page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],urls=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{urls.push(r.url());if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 if(remote)await page.route(origin+'/**',async route=>route.fulfill({response:await api.get(route.request().url(),{timeout:60000})}));
 try{
 await page.goto(origin+'/character-lab'+(remote?'':'.html'));
 await page.waitForFunction(()=>window.demo?.ready,{timeout:30000});
 assert.equal(await page.locator('[data-motion]').count(),10);assert.equal(await page.evaluate(()=>demo.manifest.totalFrames),88);
 assert(!urls.some(u=>u.includes('sprite-manifest.json')||u.includes('design-v2/01_locomotion')));
 for(const [key,count] of [['idle',8],['walk',8],['run',8],['glasses',8],['attack1',8],['attack2',8],['attack3',8],['kick1',8],['kick2',8],['kick3',16]]){
  await page.locator('[data-motion="'+key+'"]').click();assert.equal(await page.locator('#frameStrip button').count(),count);
  for(let i=0;i<count;i++){await page.locator('#frameStrip [data-frame="'+i+'"]').click();await page.waitForFunction(({key,i})=>document.getElementById('gameCanvas').dataset.action===key&&document.getElementById('gameCanvas').dataset.frame===String(i),{key,i});}
 }
 await page.locator('[data-motion="attack3"]').click();await page.locator('#frameStrip [data-frame="6"]').click();await page.locator('#gameCanvas').screenshot({path:'/tmp/lab-anime-hook.png'});
 await page.locator('[data-motion="idle"]').click();await page.evaluate(()=>demo.reset());
 await page.keyboard.down('KeyD');await page.waitForTimeout(180);await page.waitForFunction(()=>demo.getState().action==='walk');const x=await page.evaluate(()=>demo.getState().x);assert(x>490);
 await page.keyboard.down('Shift');await page.waitForFunction(()=>demo.getState().action==='run');await page.keyboard.up('Shift');await page.keyboard.up('KeyD');await page.waitForFunction(()=>demo.getState().action==='idle');
 await page.keyboard.down('KeyA');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>demo.getState().facing),-1);await page.keyboard.up('KeyA');
 await page.evaluate(()=>{demo.reset();demo.advance(8050);});assert.equal(await page.evaluate(()=>demo.getState().action),'glasses');await page.evaluate(()=>demo.advance(1400));assert.equal(await page.evaluate(()=>demo.getState().action),'idle');assert.equal(await page.evaluate(()=>demo.getState().idleArmed),false);await page.evaluate(()=>demo.advance(9000));assert.equal(await page.evaluate(()=>demo.getState().action),'idle');
 await page.evaluate(()=>{demo.reset();demo.advance(8050);});await page.keyboard.down('KeyD');await page.waitForFunction(()=>demo.getState().action==='walk');await page.keyboard.up('KeyD');
 await page.evaluate(()=>{demo.reset();demo.playCombo('punch');demo.advance(1100);});assert.deepEqual(await page.evaluate(()=>demo.getState().history),['attack1','attack2','attack3']);assert.equal(await page.evaluate(()=>demo.getState().action),'idle');
 await page.evaluate(()=>{demo.reset();demo.playCombo('kick');demo.advance(380);});assert.equal(await page.evaluate(()=>demo.getState().action),'kick2');await page.evaluate(()=>demo.advance(1500));assert.deepEqual(await page.evaluate(()=>demo.getState().history),['kick1','kick2','kick3']);assert.equal(await page.evaluate(()=>demo.getState().action),'idle');
 await page.evaluate(()=>demo.reset());await page.locator('#gameCanvas').focus();await page.keyboard.down('KeyD');await page.evaluate(()=>demo.advance(2200));await page.keyboard.up('KeyD');await page.waitForFunction(()=>demo.getState().action==='idle');await page.keyboard.press('KeyJ');await page.evaluate(()=>demo.advance(500));assert.equal(await page.evaluate(()=>demo.getState().hitCount),1);
 await page.evaluate(()=>demo.reset());await page.locator('#gameCanvas').focus();await page.keyboard.press('KeyJ');await page.keyboard.press('KeyJ');await page.keyboard.press('KeyJ');await page.evaluate(()=>demo.advance(1000));assert.deepEqual(await page.evaluate(()=>demo.getState().history),['attack1','attack2','attack3']);await page.evaluate(()=>demo.reset());await page.keyboard.press('KeyK');await page.keyboard.press('KeyK');await page.keyboard.press('KeyK');await page.evaluate(()=>demo.advance(1800));assert.deepEqual(await page.evaluate(()=>demo.getState().history),['kick1','kick2','kick3']);
 await page.locator('#fireToggle').click();assert.equal(await page.evaluate(()=>demo.getState().fire),false);await page.locator('#effectsToggle').click();assert.equal(await page.evaluate(()=>demo.getState().effectsEnabled),false);await page.locator('#effectsToggle').click();await page.locator('#fireToggle').click();await page.locator('#soundToggle').click();await page.waitForFunction(()=>demo.getState().sound);assert.equal(await page.evaluate(()=>demo.getState().sound),true);
 await page.locator('#speedControl').fill('0.25');assert.equal(await page.evaluate(()=>demo.getState().speed),.25);await page.locator('#speedControl').fill('1');
 await page.locator('#motionTabs [data-group="combat"]').click();assert.equal(await page.locator('[data-motion]:visible').count(),6);await page.locator('#motionTabs [data-group="all"]').click();
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('[data-control="right"]').dispatchEvent('pointerdown',{pointerId:1});await page.waitForTimeout(80);await page.locator('[data-control="right"]').dispatchEvent('pointerup',{pointerId:1});
 await page.locator('[data-motion="idle"]').click();await page.evaluate(()=>document.activeElement?.blur());await page.screenshot({path:'/tmp/lab-anime-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS anime lab: 10 actions / 88 frames; keyboard walk/run/mirror; idle glasses once/cancel; punch/kick chains including fast support switch; training-target hit; audio/VFX/fire; filters; mobile; no chibi assets or page errors');
 }finally{await browser.close();await api?.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
