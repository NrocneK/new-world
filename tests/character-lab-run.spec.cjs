const {chromium,request}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const origin=process.env.LAB_ORIGIN||'http://127.0.0.1:4173/site',remote=origin.startsWith('https:'),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),api=remote?await request.newContext({proxy:{server:process.env.HTTPS_PROXY}}):null;
 const page=await browser.newPage({viewport:{width:1440,height:1000},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 if(remote)await page.route(origin+'/**',async r=>r.fulfill({response:await api.get(r.request().url(),{timeout:60000})}));
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
 const advance=ms=>page.evaluate(ms=>{demo.advance(ms);return demo.getState();},ms);
 const turn=async(from,to)=>{await page.keyboard.down(to);await advance(16);await page.keyboard.up(from);};
 try{
  await page.goto(origin+'/character-lab'+(remote?'':'.html')+'?motion=run&frame=8');await page.waitForFunction(()=>window.demo?.ready,null,{polling:100});
  let s=await advance(0);assert.equal(s.action,'run');assert.equal(s.frame,7);assert(s.paused);
  assert.equal(await page.locator('[data-control="run"]').count(),0);assert(!/shift/i.test(await page.locator('body').innerText()));
  assert((await page.locator('#sheetDownload').getAttribute('href')).includes('anime-run-approved-v2'));
  for(let i=0;i<8;i++){await page.locator('[data-frame="'+i+'"]').click();s=await advance(0);assert.equal(s.frame,i);}
  await page.locator('#gameCanvas').screenshot({path:'/tmp/approved-run-demo-frame8.png'});
  await page.evaluate(()=>demo.reset());await page.keyboard.down('KeyD');s=await advance(1000);assert.equal(s.action,'walk');assert.equal(s.walkElapsed,1000);
  await turn('KeyD','KeyA');s=await advance(999);assert.equal(s.action,'walk');assert.equal(s.walkElapsed,1999);assert.equal(s.facing,-1);
  s=await advance(1);assert.equal(s.action,'run');assert.equal(s.walkElapsed,2000);
  await turn('KeyA','KeyD');s=await advance(100);assert.equal(s.action,'run');assert.equal(s.walkElapsed,2000);assert.equal(s.facing,1);
  await page.keyboard.up('KeyD');s=await advance(16);assert.equal(s.action,'idle');assert.equal(s.walkElapsed,0);
  await page.keyboard.down('Shift');await page.keyboard.down('KeyD');s=await advance(100);assert.equal(s.action,'walk');await page.keyboard.up('Shift');
  await page.keyboard.press('KeyJ');assert.equal((await advance(0)).walkElapsed,0);await advance(450);s=await advance(50);assert.equal(s.action,'walk');assert(s.walkElapsed<2000);
  await page.keyboard.up('KeyD');await page.evaluate(()=>demo.reset());await page.keyboard.down('KeyD');await advance(1000);await page.locator('#playPause').click();s=await advance(3000);assert.equal(s.walkElapsed,1000);await page.locator('#playPause').click();s=await advance(1000);assert.equal(s.action,'run');
  await page.keyboard.press('Space');s=await advance(200);assert.equal(s.vx,290);assert.equal(s.walkElapsed,0);await page.keyboard.up('KeyD');
  await page.evaluate(()=>demo.reset());await page.keyboard.down('KeyD');await advance(1000);await page.keyboard.press('KeyL');assert.equal((await advance(0)).walkElapsed,0);await advance(240);s=await advance(50);assert.equal(s.action,'walk');await page.keyboard.up('KeyD');
  await page.evaluate(()=>demo.reset());await page.setViewportSize({width:390,height:844});
  const left=page.locator('[data-control="left"]'),right=page.locator('[data-control="right"]');
  await right.scrollIntoViewIfNeeded();const rb=await right.boundingBox(),lb=await left.boundingBox(),cdp=await page.context().newCDPSession(page);
  const rp={x:rb.x+rb.width/2,y:rb.y+rb.height/2,id:1},lp={x:lb.x+lb.width/2,y:lb.y+lb.height/2,id:2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[rp]});s=await advance(1100);assert.equal(s.action,'walk');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[lp]});s=await advance(900);assert.equal(s.action,'run');assert.equal(s.facing,-1);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});s=await advance(16);assert.equal(s.walkElapsed,0);assert.equal(s.action,'idle');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  console.log('PASS approved run: exact selected atlas; automatic 2000ms threshold; keyboard/touch direction changes preserve timer; stopping/actions/reset restart timer; Shift removed; pause; running jump momentum; mobile layout');
 }finally{await browser.close();await api?.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
