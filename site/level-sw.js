/* Offline opening chapter. Cache only public game files. */
const CACHE="di-mon-chapter-5294b00aea69",FILES=["./","./level.html","./level.css","./level.js","./level-config.js","./sprite-manifest.json","./art/vfx/air-pressure-v2/manifest.json","./art/chapter-one/manifest.json","./art/chapter-one/office-night.png","./art/protagonist/design-v2/01_locomotion.png","./art/protagonist/identity-v6/movement-v6.png","./art/protagonist/identity-v6/combat-v6.png","./art/protagonist/design-v2/04_elements_reactions.png","./art/protagonist/walk-hair-blink/walk-with-blink.png","./art/protagonist/run-consistent-blink/run-with-blink.png","./art/protagonist/double-jump/double-jump-spritesheet.png","./art/chapter-one/void-crawler.png","./art/chapter-one/coworker.png","./art/vfx/air-pressure-v2/sources/straight-clear.png","./art/vfx/air-pressure-v2/sources/uppercut.png","./art/vfx/air-pressure-v2/sources/shockwave.png","./art/vfx/air-pressure-v2/sources/air-kick.png"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('di-mon-chapter-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const known=FILES.some(p=>new URL(p,self.registration.scope).pathname===url.pathname);
 if(!known&&request.mode!=='navigate')return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(request,copy)));}return response;}).catch(()=>caches.match(request).then(r=>r||caches.match('./level.html'))));return;}
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(request).then(r=>r||fetch(request))));
});
