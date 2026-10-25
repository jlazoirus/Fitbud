const CACHE_NAME = "fitbud-pwa-v144";
const APP_SHELL = [
  "./",
  "./index.html",
  "./js/nutrition-pure.js",
  "./js/nutrition-domain.js",
  "./js/meal-log.js",
  "./exercise-catalog.js",
  "./workout-player.js",
  "./training-plan.js",
  "./domain-contracts.js",
  "./sync-conflicts.js",
  "./manifest.webmanifest",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/exercise-media/pike-push-up.svg",
  "./assets/exercise-media/band-row.svg",
  "./assets/exercise-media/shoulder-tap-plank.svg",
  "./assets/exercise-media/archer-push-up.svg",
  "./assets/exercise-media/slider-leg-curl.svg",
  "./assets/exercise-media/single-leg-rdl.svg",
  "./assets/exercise-media/step-up.svg",
  "./assets/exercise-media/standing-calf-raise.svg",
  "./assets/exercise-media/bulgarian-split-squat.svg",
  "./assets/exercise-media/walking-lunge.svg",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    // REQ-201: solo la app (/ e /index.html) sale del cache. Las otras
    // páginas del sitio (la postulación a la beta) no son parte del shell:
    // antes recibían index.html y el visitante con la PWA instalada nunca
    // llegaba al formulario. Red primero; sin red, la app.
    if (url.origin === self.location.origin && url.pathname !== "/" && !url.pathname.endsWith("/index.html")) {
      event.respondWith(fetch(request).catch(() => caches.match("./index.html")));
      return;
    }
    // REQ-150: servir la navegación desde la MISMA generación de cache que
    // los .js (cacheFirst), no de la red directa — networkFirst podía traer
    // un index.html recién desplegado mientras los .js seguían saliendo del
    // cache de la versión anterior (mezcla de versiones). La versión nueva
    // llega completa (HTML+JS) recién cuando este SW se instala y activa.
    event.respondWith(cacheFirst(request, "./index.html"));
    return;
  }

  if (url.origin === self.location.origin) {
    // Nunca cachear las funciones serverless: siempre a la red.
    if (url.pathname.startsWith("/api/")) {
      event.respondWith(fetch(request));
      return;
    }
    if (url.pathname.endsWith("/config.js")) {
      event.respondWith(networkFirst(request));
      return;
    }
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.hostname === "cdn.jsdelivr.net") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Media de ejercicios alojada en Supabase Storage: cache-first para uso offline (REQ-15).
  if (url.pathname.includes("/storage/v1/object/")) {
    event.respondWith(cacheFirst(request));
  }
});

// REQ-159: fetch() solo rechaza ante fallo de red, no ante 4xx/5xx — sin este
// check, un error transitorio (deploy en curso, hiccup del edge, URL de
// Storage vencida) queda cacheado como si fuera bueno y se re-sirve hasta el
// próximo bump de CACHE_NAME. Las respuestas opacas (cross-origin sin CORS,
// p. ej. el CDN) siempre tienen status 0 y ok:false aunque el recurso se haya
// servido bien — no hay forma de distinguir éxito de error ahí, así que se
// mantienen cacheables como ya lo eran; esto solo bloquea errores verificables.
function isCacheableResponse(response) {
  if (!response) return false;
  if (response.type === "opaque") return true;
  return response.ok;
}

async function cacheFirst(request, fallbackUrl) {
  const cached = await caches.match(request) || (fallbackUrl && await caches.match(fallbackUrl));
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (!isCacheableResponse(response)) {
      // La red respondió pero con error: no sobrescribir el cache bueno.
      // Preferir la copia válida ya cacheada; si no hay ninguna, no queda
      // más remedio que devolver el error (no hay nada mejor que servir).
      const cachedGood = (await caches.match(request)) || (fallbackUrl && await caches.match(fallbackUrl));
      return cachedGood || response;
    }
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await caches.match(request)) || (fallbackUrl ? caches.match(fallbackUrl) : Promise.reject(error));
  }
}

// ── Web Push handlers (REQ-38) ────────────────────────────────────────────────

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || "Evolv";
  const body  = data.body  || "Tienes actividad pendiente.";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "./assets/icon-192.png",
      badge: "./assets/icon-192.png",
      tag: data.tag || "fitbros-reminder",
      data: { url: data.url || "/" },
      requireInteraction: false,
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await caches.match(request);
  const fresh = fetch(request)
    .then(response => {
      if (isCacheableResponse(response)) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fresh;
}
