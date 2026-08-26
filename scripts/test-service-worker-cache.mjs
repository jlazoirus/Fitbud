// REQ-150: la navegación de la PWA debe servirse desde la MISMA generación de
// cache que los .js (cacheFirst), no de la red directa (networkFirst) — así
// nunca se combina un index.html recién desplegado con JS de la versión
// anterior en una misma carga. Ejecuta service-worker.js real en un contexto
// vm con caches/fetch simulados (0 llamadas pagadas, sin navegador).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(HERE, "..", "service-worker.js"), "utf8");

const BASE = "https://fitbud.test/";
function normalizeUrl(u) {
  return new URL(u, BASE).href;
}
function fakeResponse(body, opts) {
  const ok = opts && opts.ok !== undefined ? opts.ok : true;
  const status = opts && opts.status !== undefined ? opts.status : 200;
  const type = opts && opts.type !== undefined ? opts.type : "basic";
  return {
    _body: body,
    ok, status, type,
    clone() { return fakeResponse(this._body, { ok: this.ok, status: this.status, type: this.type }); },
    async text() { return this._body; },
  };
}

function createFakeCaches() {
  const stores = new Map(); // cacheName -> Map(url -> response)
  function makeCache(store) {
    return {
      async match(request) {
        const url = typeof request === "string" ? request : request.url;
        return store.get(normalizeUrl(url));
      },
      async put(request, response) {
        const url = typeof request === "string" ? request : request.url;
        store.set(normalizeUrl(url), response);
      },
      async addAll(urls) {
        for (const u of urls) store.set(normalizeUrl(u), fakeResponse("addAll:" + u));
      },
    };
  }
  return {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      return makeCache(stores.get(name));
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async match(request) {
      const url = typeof request === "string" ? request : request.url;
      for (const store of stores.values()) {
        const hit = store.get(normalizeUrl(url));
        if (hit) return hit;
      }
      return undefined;
    },
    _stores: stores,
  };
}

function loadServiceWorker({ fetchImpl }) {
  const listeners = {};
  const self = {
    location: { origin: "https://fitbud.test" },
    addEventListener(type, handler) { listeners[type] = handler; },
    registration: { showNotification() {} },
    clients: { matchAll: async () => [] },
    skipWaiting() {},
  };
  const caches = createFakeCaches();
  const context = vm.createContext({ self, caches, fetch: fetchImpl, console, URL, Promise });
  vm.runInContext(source, context, { filename: "service-worker.js" });
  return { listeners, caches, CACHE_NAME_MATCH: source.match(/CACHE_NAME\s*=\s*"([^"]+)"/)[1] };
}

function fakeFetchEvent(request) {
  let responded = null;
  return {
    request,
    respondWith(promiseOrValue) { responded = Promise.resolve(promiseOrValue); },
    waitUntil() {},
    async getResponse() { return responded; },
  };
}

// ── Escenario: cache de la generación ACTUAL tiene index.html y un .js
// "viejos"; la red (si se le preguntara) devolvería contenido "nuevo" recién
// desplegado. Una navegación NO debe traer el índice nuevo mientras el .js
// sigue viejo: ambos deben salir de la MISMA cache (la actual).
{
  let networkCalls = 0;
  const fetchImpl = async (request) => {
    networkCalls++;
    const url = typeof request === "string" ? request : request.url;
    return fakeResponse("RED-FRESCA:" + url);
  };
  const { listeners, caches, CACHE_NAME_MATCH } = loadServiceWorker({ fetchImpl });
  const cache = await caches.open(CACHE_NAME_MATCH);
  await cache.put("./index.html", fakeResponse("HTML-VIEJO"));
  await cache.put("./training-plan.js", fakeResponse("JS-VIEJO"));

  const fetchHandler = listeners.fetch;
  assert(typeof fetchHandler === "function", "El SW debe registrar un listener de 'fetch'.");

  const navEvent = fakeFetchEvent({ method: "GET", mode: "navigate", url: "https://fitbud.test/" });
  fetchHandler(navEvent);
  const navResponse = await navEvent.getResponse();
  assert(navResponse && (await navResponse.text()) === "HTML-VIEJO",
    "La navegación debe servirse desde el cache actual (misma generación que el JS), no traer HTML fresco de la red.");
  assert(networkCalls === 0, "cacheFirst no debe golpear la red cuando ya hay una entrada en cache.");

  const jsEvent = fakeFetchEvent({ method: "GET", mode: "no-cors", url: "https://fitbud.test/training-plan.js" });
  fetchHandler(jsEvent);
  const jsResponse = await jsEvent.getResponse();
  assert(jsResponse && (await jsResponse.text()) === "JS-VIEJO", "El .js debe seguir sirviéndose desde el mismo cache (cacheFirst).");

  console.log("  Test 1 pasado: navegación y .js salen de la MISMA generación de cache (sin mezcla HTML nuevo / JS viejo)");
}

// ── Sin nada en cache (primera carga real): cacheFirst debe caer a red y
// cachear la respuesta, para no dejar la PWA sin contenido. ──
{
  let networkCalls = 0;
  const fetchImpl = async (request) => {
    networkCalls++;
    const url = typeof request === "string" ? request : request.url;
    return fakeResponse("RED:" + url);
  };
  const { listeners, caches, CACHE_NAME_MATCH } = loadServiceWorker({ fetchImpl });
  const fetchHandler = listeners.fetch;

  const navEvent = fakeFetchEvent({ method: "GET", mode: "navigate", url: "https://fitbud.test/" });
  fetchHandler(navEvent);
  const navResponse = await navEvent.getResponse();
  assert(navResponse && (await navResponse.text()) === "RED:https://fitbud.test/",
    "Sin cache previo, la navegación debe caer a la red (offline-first no puede dejar la app en blanco).");
  assert(networkCalls === 1, "Debe haber ido a la red exactamente una vez.");
  const cache = await caches.open(CACHE_NAME_MATCH);
  const cached = await cache.match("https://fitbud.test/");
  assert(cached && (await cached.text()) === "RED:https://fitbud.test/", "La respuesta de red debe quedar cacheada para la próxima carga.");

  console.log("  Test 2 pasado: sin cache previo, la navegación cae a red y cachea el resultado");
}

// ── REQ-159: cacheFirst NUNCA debe cachear un 404/500 — fetch() solo rechaza
// ante fallo de red, no ante status de error, así que sin el check un error
// transitorio quedaría "cacheado como bueno" y se re-serviría para siempre. ──
{
  let networkCalls = 0;
  let networkStatus = 404;
  const fetchImpl = async (request) => {
    networkCalls++;
    const url = typeof request === "string" ? request : request.url;
    return networkStatus === 404
      ? fakeResponse("NOT-FOUND", { ok: false, status: 404 })
      : fakeResponse("OK-TRAS-RECUPERARSE:" + url, { ok: true, status: 200 });
  };
  const { listeners, caches, CACHE_NAME_MATCH } = loadServiceWorker({ fetchImpl });
  const fetchHandler = listeners.fetch;

  const errEvent = fakeFetchEvent({ method: "GET", mode: "no-cors", url: "https://fitbud.test/roto.js" });
  fetchHandler(errEvent);
  const errResponse = await errEvent.getResponse();
  assert(errResponse.status === 404, "Debe devolver el 404 real (no hay nada mejor que servir la primera vez).");
  const cache = await caches.open(CACHE_NAME_MATCH);
  assert(!(await cache.match("https://fitbud.test/roto.js")), "Un 404 NUNCA debe quedar guardado en el cache.");

  // El servidor "se recupera": la misma URL ahora responde 200 OK.
  networkStatus = 200;
  const okEvent = fakeFetchEvent({ method: "GET", mode: "no-cors", url: "https://fitbud.test/roto.js" });
  fetchHandler(okEvent);
  const okResponse = await okEvent.getResponse();
  assert(okResponse.status === 200 && (await okResponse.text()).startsWith("OK-TRAS-RECUPERARSE"),
    "Tras recuperarse el servidor, debe volver a pedirlo a la red (el 404 no debía haber quedado cacheado) y servir el 200.");
  assert(networkCalls === 2, "Debe haber ido a la red las dos veces (el 404 no se sirvió de cache la segunda vez).");

  console.log("  Test 3 pasado: cacheFirst nunca cachea un 404; tras recuperarse el servidor, sirve el 200 real");
}

// ── REQ-159: networkFirst no debe dejar que un 500 sobrescriba un shell bueno
// ya cacheado — debe preferir la copia válida en vez del error transitorio. ──
{
  const fetchImpl = async () => fakeResponse("ERROR-500-TRANSITORIO", { ok: false, status: 500 });
  const { listeners, caches, CACHE_NAME_MATCH } = loadServiceWorker({ fetchImpl });
  const cache = await caches.open(CACHE_NAME_MATCH);
  await cache.put("https://fitbud.test/config.js", fakeResponse("CONFIG-BUENO"));

  const fetchHandler = listeners.fetch;
  const event = fakeFetchEvent({ method: "GET", mode: "no-cors", url: "https://fitbud.test/config.js" });
  fetchHandler(event);
  const res = await event.getResponse();
  assert((await res.text()) === "CONFIG-BUENO",
    "Un 500 de la red no debe sobrescribir/reemplazar el shell bueno ya cacheado — debe servirse el válido.");
  const stillCached = await cache.match("https://fitbud.test/config.js");
  assert((await stillCached.text()) === "CONFIG-BUENO", "El cache no debe quedar envenenado con el 500.");

  console.log("  Test 4 pasado: networkFirst no deja que un 500 sobrescriba el shell bueno ya cacheado");
}

console.log("Service worker (REQ-150/REQ-159): misma generación de cache y sin envenenar el cache con errores. Verificado con vm + mocks.");
