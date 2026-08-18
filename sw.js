const CACHE = "puxarota-v10";
const ASSETS = ["./", "./index.html", "./styles.css", "./routes.css", "./app.js", "./routes.js", "./supabase-config.js", "./supabase-auth.js", "./jobs.json", "./rupi-mascot.png", "./rupi-next.png", "./rupi-hint.png", "./rupi-badge.png", "./rupi-pause.png", "./faro.png", "./carcara-scout.png", "./carcara-flight.png", "./vendor/retroix.js", "./manifest.json"];
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
self.addEventListener("push", event => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "PuxaRota";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "./logo-1.jpg",
    badge: payload.badge || "./logo-1.jpg",
    data: payload.data || {},
    actions: Array.isArray(payload.actions) ? payload.actions : []
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = event.action === "open" && event.notification.data?.button_url
    ? event.notification.data.button_url
    : (event.notification.data?.url || "./");
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients => {
    for (const client of windowClients) {
      if ("focus" in client) { client.navigate(target); return client.focus(); }
    }
    return clients.openWindow(target);
  }));
});
