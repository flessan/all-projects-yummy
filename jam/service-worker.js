self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("jam-thio-v1").then(cache => {
      return cache.addAll([
        "/jam/",
        "/jam/index.html",
        "/jam/jam.css",
        "/jam/jam.js"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
