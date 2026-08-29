const VERSION='1.4.0';
const CACHE=`purchase-guardian-v${VERSION}`;
const CORE=['./','./index.html','./manifest.json','./styles.css','./barcode.css','./receipt-engine.js','./app.js','./barcode-scanner.js','./icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('purchase-guardian-v')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok) await cache.put(request,response.clone());
    return response;
  }catch(error){
    const cached=await cache.match(request);
    if(cached) return cached;
    if(request.mode==='navigate') return cache.match('./index.html');
    throw error;
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request);
  const fresh=fetch(request).then(response=>{
    if(response&&response.ok) cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  return cached||fresh;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);

  if(url.origin!==self.location.origin){
    event.respondWith(fetch(event.request).then(async response=>{
      if(response&&response.ok){const cache=await caches.open(CACHE);cache.put(event.request,response.clone()).catch(()=>{})}
      return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }

  const destination=event.request.destination;
  const isAppCode=event.request.mode==='navigate'||['document','script','style','worker'].includes(destination);
  event.respondWith(isAppCode?networkFirst(event.request):staleWhileRevalidate(event.request));
});