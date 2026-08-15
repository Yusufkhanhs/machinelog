const C='machinelog-v3';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request,u=req.url;
  if(req.method!=='GET'||u.includes('/exec')||u.includes('script.google'))return;

  /* The page itself is fetched from the network first, so an upload to GitHub
     reaches the phone on the next launch. Cache is only the offline fallback. */
  const isPage = req.mode==='navigate' || u.endsWith('/') || u.endsWith('index.html');
  if(isPage){
    e.respondWith(
      fetch(req).then(r=>{
        if(r&&r.ok){const cl=r.clone();caches.open(C).then(c=>c.put('./index.html',cl))}
        return r;
      }).catch(()=>caches.match('./index.html').then(x=>x||caches.match('./')))
    );
    return;
  }

  /* Icons and fonts rarely change: serve from cache, refresh quietly in the background. */
  e.respondWith(
    caches.match(req).then(hit=>{
      const net=fetch(req).then(r=>{
        if(r&&r.ok&&(u.startsWith(self.location.origin)||u.includes('fonts.'))){
          const cl=r.clone();caches.open(C).then(c=>c.put(req,cl));
        }
        return r;
      }).catch(()=>hit);
      return hit||net;
    })
  );
});
