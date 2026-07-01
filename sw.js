/* 筋トレメモ Service Worker
   役割：アプリ本体（HTML/アイコン）を端末にキャッシュし、
   電波がなくても（ジム等）起動できるようにする。
   外部サーバーへの通信は一切しない（同一オリジンのみ）。
   記録データには触れない（データは localStorage に各端末で保存）。 */
const CACHE = "kintore-v33";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // 同一オリジンのみ扱う（外部リンクはブラウザ任せ＝通信ゼロを維持）
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"))
    )
  );
});
