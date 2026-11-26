/* Service worker — offline app-shell cache (GitHub Pages safe, relative paths) */
const VERSION = 'v14';
const CACHE = 'app-shell-' + VERSION;

const SHELL = [
  './',
  'index.html',
  'main.css',
  'fonts.css',
  'boot.js',
  'app.js',
  'extras.js',
  'tradelog.js',
  'ui-fx.js',
  'manifest.webmanifest',
  'favicon.ico',
  'favicon-32.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      // ဖိုင်တစ်ခု မရှိလည်း install မပျက်အောင် တစ်ခုချင်း add
      Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // cross-origin ကို မထိ

  // Page navigation: network-first, offline ဆိုရင် cached index.html
  // index.html (app root) ကိုပဲ cache ထဲ index.html အဖြစ်သိမ်းမယ် — clear-cache.html လို တခြားစာမျက်နှာတွေက မထိအောင်
  if (req.mode === 'navigate') {
    const root = new URL('./', self.registration.scope).pathname;
    const isApp = url.pathname === root || url.pathname === root + 'index.html';
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (isApp && res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('index.html', copy));
          }
          return res;
        })
        .catch(() =>
          (isApp ? Promise.resolve(null) : caches.match(req))
            .then((r) => r || caches.match('index.html'))
            .then((r) => r || caches.match('./'))
        )
    );
    return;
  }

  // Code ဖိုင်တွေ (js + main.css): network-first — index.html နဲ့ JS version မကိုက်တာမျိုး မဖြစ်အောင်
  // net က 4 စက္ကန့်အတွင်း မဖြေရင် (သို့) offline ဆိုရင် cache ကိုသုံး
  const isCode = /\.js$/.test(url.pathname) || /\/main\.css$/.test(url.pathname);
  if (isCode) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const net = fetch(req, { cache: 'no-cache' }).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }
          return cached || res; // 404 စတဲ့ error ဖြစ်ရင် cache ရှိသလောက်ကို ဆက်သုံး
        });
        if (!cached) return net;
        const slow = new Promise((resolve) => setTimeout(() => resolve(cached), 4000));
        return Promise.race([net, slow]).catch(() => cached);
      })
    );
    return;
  }

  // တခြား static ဖိုင်တွေ (fonts.css, icons): stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});
