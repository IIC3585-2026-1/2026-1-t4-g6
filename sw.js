let cacheName = "banglent";

let filesToCache = [
  "/",
  "./index.html",
  "./css/main.css",
  "./js/app.js",
  "./js/controller/MainController.js",
  "./js/models/NoteModel.js",
  "./js/utils/storage.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(filesToCache);
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cName) => {
          if (cName !== cacheName) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  )
})

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    }),
  );
});
