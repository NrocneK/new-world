const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:4173/kling-kit/04-editing/end-title.svg');
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:path.join(root,'04-editing/end-title.png')});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:1080});
  await page.goto('http://127.0.0.1:4173/kling-kit/index.html');
  await page.evaluate(async()=>{for(const im of document.images)im.loading='eager';await Promise.all([...document.images].map(im=>im.decode()));});
  assert.equal(await page.locator('.shot').count(),6);
  const prompts=JSON.parse(fs.readFileSync(path.join(root,'shot-plan.json'))).shots;
  for(const s of prompts)assert.equal(await page.locator('#prompt-'+s.id).inputValue(),s.prompt);
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await page.locator('[data-copy="prompt-S04"]').click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),prompts[3].prompt);
  await page.screenshot({path:'/tmp/kling-kit-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile horizontal overflow');
  assert.deepEqual(errors,[]);
  await page.setViewportSize({width:1440,height:1080});
  await page.evaluate(()=>{for(const a of document.querySelectorAll('a[href]')){const h=a.getAttribute('href');if(!/^(https?:|mailto:)/.test(h))a.href=new URL(h,'https://di-mon-demo.vercel.app/kling-kit/').href;}});
  await page.pdf({path:path.join(root,'HUONG-DAN-KLING.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<div></div>',footerTemplate:'<div style="font-size:8px;color:#536873;width:100%;text-align:center">DỊ MÔN · KLING AI KIT — <span class="pageNumber"></span> / <span class="totalPages"></span></div>'});
  console.log('PASS images, six complete prompts, copy button, mobile layout and PDF export');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
