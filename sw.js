/* 홈 화면에 추가(설치)와 오프라인 실행을 위한 서비스 워커.
   앱 껍데기(index.html, 아이콘, 매니페스트)만 캐시하고, 온라인 방 연결(PeerJS)은 건드리지 않습니다.
   index.html은 네트워크 우선이라 새 버전을 올리면 다음 접속에 바로 반영됩니다. */
const CACHE='president-shell-v2';
const SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;   // CDN·PeerJS 등 바깥 요청은 그대로
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
});
