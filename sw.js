const C='machinelog-v2';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const u=e.request.url;
  if(e.request.method!=='GET'||u.includes('/exec')||u.includes('script.google'))return;
  e.respondWith(
    caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
      if(r.ok&&(u.startsWith(self.location.origin)||u.includes('fonts.'))){
        const cl=r.clone();caches.open(C).then(c=>c.put(e.request,cl));
      }
      return r;
    }).catch(()=>caches.match('./index.html')))
  );
});
