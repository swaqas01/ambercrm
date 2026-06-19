// Amber Homes CRM service worker.
// SECURITY: caches ONLY the public static shell (HTML, hashed JS/CSS, icons, fonts).
// It NEVER caches API responses, Supabase data, auth tokens, lead data, or any private
// information — those are same-origin /api/* (bypassed) or cross-origin (bypassed).
const CACHE = "amber-crm-v14";
const STATIC = ["/", "/manifest.webmanifest", "/icon-192-v4.png", "/icon-512-v4.png", "/apple-touch-icon-v4.png", "/favicon-32-v4.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                       // never touch writes/auth
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // Supabase / Anthropic / fonts -> network only
  if (url.pathname.startsWith("/api/")) return;           // live data only, never cached
  if (req.mode === "navigate") {                          // HTML shell: network-first, offline -> cached shell
    e.respondWith(
      fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put("/", cp)).catch(() => {}); return r; })
        .catch(() => caches.match("/").then((m) => m || caches.match("/index.html")))
    );
    return;
  }
  if (url.pathname.startsWith("/assets/") || /\.(png|svg|ico|webmanifest|woff2?)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)).catch(() => {}); return r; })));
    return;
  }
  // everything else: straight to network (no caching)
});

// --- Web Push: show a notification when the server pushes (e.g. a lead assigned to this agent) ---
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { title: "Amber CRM", body: e.data ? e.data.text() : "" }; }
  const title = data.title || "Amber CRM";
  const opts = {
    body: data.body || "",
    icon: data.icon || "/icon-192-v4.png",
    badge: "/favicon-32-v4.png",
    tag: data.tag || undefined,        // same tag collapses duplicates
    renotify: !!data.tag,
    data: { url: data.url || "/" },
    requireInteraction: false,
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

// --- Tap the notification: focus an open CRM tab (or open one) and route to the lead if provided ---
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cl) => {
      for (const c of cl) {
        if ("focus" in c) {
          try { if (c.navigate && target !== "/") c.navigate(target); } catch (err) {}
          try { c.postMessage({ type: "amber-notif-click", url: target }); } catch (err) {}
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
