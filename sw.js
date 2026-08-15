const CACHE = "puxarota-v8-role-routes";
const ASSETS = ["./", "./index.html", "./styles.css", "./routes.css", "./app.js", "./routes.js", "./rupi-mascot.png", "./rupi-next.png", "./rupi-hint.png", "./rupi-badge.png", "./rupi-pause.png", "./faro.png", "./carcara-scout.png", "./carcara-flight.png", "./vendor/retroix.js", "./manifest.json"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
