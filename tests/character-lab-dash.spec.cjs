const {chromium,request}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const origin=process.env.LAB_ORIGIN||'http://127.0.0.1:4173/site',remote=origin.startsWith('https:'),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}),api=remote?await request.newContext({proxy:{server:process.env.HTTPS_PROXY}}):null,page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 if(remote)await page.route(origin+'/**',async route=>route.fulfill({response:await api.get(route.request().url(),{timeout:60000})}));
 // Freeze browser animation only; advance the public controller deterministically.
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
 const state=()=>page.evaluate(()=>{demo.advance(0);return demo.getState();});
 const advance=ms=>page.evaluate(ms=>{demo.advance(ms);return demo.getState();},ms);
 try{
  await page.goto(origin+'/character-lab'+(remote?'':'.html'));await page.waitForFunction(()=>window.demo?.ready,null,{polling:100,timeout:30000});
  assert.equal(await page.locator('[data-motion]').count(),14);assert.equal(await page.evaluate(()=>demo.manifest.totalFrames),128);
  for(const key of ['dash','airDash']){
   await page.locator('[data-motion="'+key+'"]').click();assert.equal(await page.locator('#frameStrip button').count(),8);
   assert((await page.locator('#sheetDownload').getAttribute('href')).includes(key==='dash'?'anime-dash-profile-v1/dash-sheet.png':'anime-air-dash-profile-v1/air-dash-sheet.png'));
   for(const id of ['gifDownload','slowGifDownload']){const href=await page.locator('#'+id).getAttribute('href');const r=await (api||page.request).get(new URL(href,page.url()).href);assert(r.ok());assert((await r.body()).subarray(0,3).equals(Buffer.from('GIF')));}
   await page.locator('#frameStrip [data-frame="3"]').click();let s=await state();assert.equal(s.frame,3);assert.equal(s.mode,'inspect');assert.equal(s.dashActive,false);assert.equal(s.height,key==='airDash'?140:0);
   await page.locator('#gameCanvas').screenshot({path:'/tmp/lab-'+key+'-pose.png'});
  }
  await page.evaluate(()=>demo.reset());await page.locator('#gameCanvas').focus();await page.keyboard.down('KeyL');let s=await advance(180);assert.equal(s.action,'dash');assert.equal(s.frame,4);assert.equal(s.height,0);assert(s.x>590);
  const pausedX=s.x;await page.locator('#playPause').click();assert.equal((await advance(100)).x,pausedX);await page.locator('#playPause').click();
  await page.keyboard.down('KeyA');s=await advance(80);assert.equal(s.facing,1);await page.keyboard.up('KeyA');
  s=await advance(140);assert.equal(s.action,'idle');assert.equal(s.dashActive,false);assert(Math.abs(s.x-685)<1e-8);
  await page.keyboard.down('KeyL');assert.equal((await state()).dashActive,false);await page.keyboard.up('KeyL'); // Repeated keydown cannot auto-dash.
  await page.keyboard.press('KeyL');assert.equal((await state()).dashActive,false);await advance(120);await page.keyboard.press('KeyX');assert.equal((await state()).dashActive,true);await advance(400);
  await page.evaluate(()=>demo.reset());await page.keyboard.down('KeyA');await advance(20);await page.keyboard.up('KeyA');const leftStart=(await state()).x;await page.keyboard.press('KeyL');s=await advance(400);assert.equal(s.facing,-1);assert(Math.abs(s.x-(leftStart-195))<1e-8);
  // Air dash holds altitude, preserves the second jump and resumes falling.
  await page.evaluate(()=>demo.reset());await page.keyboard.press('Space');s=await advance(350);const height=s.height;assert.equal(s.jumpCount,1);await page.keyboard.press('KeyL');s=await advance(180);assert.equal(s.action,'airDash');assert.equal(s.jumpCount,1);assert.equal(s.height,height);assert.equal(s.velocityY,0);assert(s.airDashUsed);
  await page.keyboard.press('Space');assert.equal((await state()).jumpCount,1); // Input is locked during the burst.
  await page.locator('#gameCanvas').screenshot({path:'/tmp/lab-airDash-in-flight.png'});
  s=await advance(220);assert.equal(s.action,'jump');assert.equal(s.height,height);assert.equal(s.velocityY,0);assert.equal(s.jumpCount,1);s=await advance(16);assert(s.height<height);assert(s.velocityY<0);
  await page.keyboard.press('Space');s=await state();assert.equal(s.action,'airJump');assert.equal(s.jumpCount,2);assert.equal(s.velocityY,720);
  await advance(120);await page.keyboard.press('KeyL');assert.equal((await state()).dashActive,false); // Air jump does not refresh air dash.
  s=await advance(2000);assert.equal(s.action,'idle');assert.equal(s.height,0);assert.equal(s.airDashUsed,false);
  // It also works after the second jump; landing restores the air charge.
  await page.keyboard.press('Space');await advance(250);await page.keyboard.press('Space');await advance(150);await page.keyboard.press('KeyL');s=await advance(200);assert.equal(s.action,'airDash');assert.equal(s.jumpCount,2);s=await advance(200);assert.equal(s.action,'airJump');await page.keyboard.press('Space');assert.equal((await state()).jumpCount,2);await advance(2000);
  await page.locator('#airDashDemo').click();s=await advance(650);assert.equal(s.action,'airDash');assert.equal(s.jumpCount,1);s=await advance(1600);assert.equal(s.action,'idle');
  // Preview/frame selection and reset cancel both controllers.
  await page.evaluate(()=>{demo.playAirDash();demo.advance(650);demo.preview('dash');demo.advance(0);});s=await state();assert.equal(s.jumpActive,false);assert.equal(s.dashActive,false);assert.equal(s.height,0);s=await advance(400);assert.equal(s.completed,true);assert.equal(s.frame,7);
  await page.evaluate(()=>demo.reset());assert.equal((await state()).airDashUsed,false);
  for(const [key,side] of [['KeyD',1],['KeyA',-1]]){await page.evaluate(()=>demo.reset());await page.keyboard.down(key);await advance(10000);await page.keyboard.up(key);const before=(await state()).x;await page.keyboard.press('KeyL');s=await advance(400);assert.equal(s.x,before);assert.equal(s.facing,side);}
  await page.evaluate(()=>demo.reset());await page.setViewportSize({width:390,height:844});await page.locator('[data-control="dash"]').click();assert.equal((await state()).action,'dash');await advance(600);await page.locator('[data-control="jump"]').click();await advance(300);await page.locator('[data-control="dash"]').click();assert.equal((await state()).action,'airDash');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/lab-dash-mobile.png',fullPage:true});
  await page.setViewportSize({width:320,height:740});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log('PASS dash lab: 14/128; PNG/GIF selectors; ground displacement/cooldown/direction; air altitude hold and fall; independent jump/air charge; landing rearm; pause/reset/previews; bounds; keyboard/touch; 390/320px layout');
 }finally{await browser.close();await api?.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
