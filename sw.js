/* 산소 팡팡! 광합성 타이쿤 — 오프라인 캐시
 *
 * 전략을 문서와 정적 파일로 나눈다.
 *  - HTML 문서: 네트워크 우선. 캐시 우선으로 두면 앱을 새로 배포해도
 *    브라우저가 옛 화면을 계속 보여줘 업데이트가 도달하지 않는다.
 *  - 아이콘·이미지 등 정적 파일: 캐시 우선. 잘 바뀌지 않고 용량이 크다.
 *
 * 앱을 고칠 때마다 CACHE 뒤 번호를 올리면 옛 캐시가 정리된다.
 */
const CACHE = 'photosynthesis-v7';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // 일부 파일이 없어도 설치가 실패하지 않도록 개별 처리
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Firebase 등 외부 요청은 서비스 워커가 건드리지 않는다
  if (new URL(req.url).origin !== location.origin) return;

  const isDoc = req.mode === 'navigate' ||
                (req.headers.get('accept') || '').includes('text/html');

  if (isDoc){
    /* 네트워크 우선 — 새 배포가 바로 반영된다. 끊기면 캐시로 되돌아간다.
       cache:'no-store' 를 붙이는 까닭: GitHub Pages 가 HTML 에
       Cache-Control: max-age=600 을 달아 보내므로, 그냥 fetch 하면 브라우저의
       HTTP 캐시가 최대 10분간 옛 문서를 대신 내준다. 수업 중에 앱을 고쳐
       올려도 학생 기기에는 옛 화면이 그대로 남는 것이 이 때문이었다. */
    e.respondWith(
      fetch(req, { cache:'no-store' })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // 정적 파일 — 캐시 우선, 없으면 받아서 채운다
  e.respondWith(
    caches.match(req).then(hit =>
      hit || fetch(req).then(res => {
        if (res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
