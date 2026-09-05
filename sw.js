/* 드레이프 미러 — service worker
   앱 껍데기(index, manifest, 아이콘)는 캐시에서 먼저 열고,
   새 버전이 올라오면 다음 실행 때 자동으로 바뀝니다. */
var VERSION = "drape-v1";
var SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var isShell = url.origin === location.origin;
  if (isShell) {
    // 캐시 먼저, 그 사이 네트워크로 갱신
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
      var refresh = fetch(req).then(function (res) {
        if (res && res.ok) caches.open(VERSION).then(function (c) { c.put(req, res.clone()); });
        return res;
      }).catch(function () { return hit; });
      return hit || refresh;
    }));
  } else {
    // 폰트 등 외부 자원: 네트워크 먼저, 실패하면 캐시
    e.respondWith(fetch(req).then(function (res) {
      if (res && res.ok) caches.open(VERSION).then(function (c) { c.put(req, res.clone()); });
      return res;
    }).catch(function () { return caches.match(req); }));
  }
});
