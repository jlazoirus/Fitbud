// REQ-376: píxel de Meta solo en la web pública (portada, /planes, /pago, /unete y /beta).
// La app (/app, /admin) y el service worker nunca cargan este archivo; lo comprueba
// scripts/validate-meta-pixel.mjs en el release gate.
//
// - Sin `metaPixelId` en /api/config no se carga nada ni se llama a Meta.
// - La consulta a /api/config y el script de Meta esperan al evento `load`: nunca
//   bloquean el render ni el checkout.
// - Los eventos solo llevan parámetros de la lista PARAMS: nunca correo, teléfono,
//   nombre ni datos de salud. El píxel se inicia sin datos de usuario.
// - Purchase usa el `eventId` que devuelve /api/culqi-charge, el mismo que envía la
//   API de conversiones desde el servidor, para que Meta no lo cuente dos veces.

const CONFIG_URL = "/api/config";
const SCRIPT_URL = "https://connect.facebook.net/en_US/fbevents.js";
const PIXEL_ID_RE = /^\d{5,20}$/;
const EVENT_ID_RE = /^[A-Za-z0-9_-]{1,100}$/;
const SAFE_TEXT_RE = /^[A-Za-z0-9_-]{1,60}$/;
const SENT_KEY = "evolv_meta_compras";

export const EVENTS = Object.freeze(["PageView", "ViewContent", "InitiateCheckout", "Purchase", "Lead"]);

// Única puerta de salida de datos hacia Meta: lo que no está aquí no se envía.
const PARAMS = {
  value: (v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 100000 ? Math.round(v * 100) / 100 : undefined),
  currency: (v) => (v === "PEN" ? v : undefined),
  content_type: (v) => (v === "product" ? v : undefined),
  content_ids: (v) => {
    if (!Array.isArray(v)) return undefined;
    const ids = v.filter((id) => typeof id === "string" && SAFE_TEXT_RE.test(id)).slice(0, 10);
    return ids.length ? ids : undefined;
  },
  num_items: (v) => (Number.isInteger(v) && v > 0 && v < 100 ? v : undefined),
};

export function cleanParams(params) {
  const out = {};
  if (!params || typeof params !== "object") return out;
  for (const [key, check] of Object.entries(PARAMS)) {
    if (!(key in params)) continue;
    const value = check(params[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function validPixelId(value) {
  const id = String(value == null ? "" : value).trim();
  return PIXEL_ID_RE.test(id) ? id : "";
}

// _fbp y _fbc los escribe el script de Meta; /pago los manda al servidor para la
// API de conversiones. Sin píxel no existen y no se manda nada.
export function metaCookies(cookieText) {
  const out = {};
  for (const part of String(cookieText || "").split(";")) {
    const [rawKey, ...rest] = part.split("=");
    const key = rawKey.trim();
    if (key !== "_fbp" && key !== "_fbc") continue;
    const value = rest.join("=").trim();
    if (/^fb\.[0-2]\.\d{10,16}\.[A-Za-z0-9_.-]{1,250}$/.test(value)) out[key.slice(1)] = value;
  }
  return out;
}

let fbq = null;
let state = "idle"; // idle → loading → on | off
const queue = [];
const sentPurchases = new Set();

function send(name, params, eventId) {
  const clean = cleanParams(params);
  if (eventId) fbq("track", name, clean, { eventID: eventId });
  else fbq("track", name, clean);
}

export function track(name, params, options) {
  if (!EVENTS.includes(name) || state === "off") return;
  const eventId = options && EVENT_ID_RE.test(String(options.eventId || "")) ? String(options.eventId) : "";
  if (name === "Purchase") {
    // Una sola vez por cargo confirmado, aunque se repita la llamada o se recargue.
    if (!eventId || sentPurchases.has(eventId) || purchaseSentBefore(eventId)) return;
    sentPurchases.add(eventId);
    rememberPurchase(eventId);
  }
  if (state === "on") send(name, params, eventId);
  else queue.push([name, params, eventId]);
}

function purchaseSentBefore(eventId) {
  try { return (JSON.parse(sessionStorage.getItem(SENT_KEY) || "[]") || []).includes(eventId); } catch (_) { return false; }
}

function rememberPurchase(eventId) {
  try {
    const list = JSON.parse(sessionStorage.getItem(SENT_KEY) || "[]") || [];
    sessionStorage.setItem(SENT_KEY, JSON.stringify([...list, eventId].slice(-10)));
  } catch (_) { /* sin almacenamiento: queda la protección en memoria */ }
}

function stop() {
  state = "off";
  queue.length = 0;
}

// Código base de Meta, sin datos de usuario ni configuración automática.
function install(pixelId) {
  const w = window;
  if (!w.fbq) {
    const n = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    w.fbq = n;
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const s = document.createElement("script");
    s.async = true;
    s.src = SCRIPT_URL;
    s.onerror = () => stop();
    document.head.appendChild(s);
  }
  fbq = (...args) => { try { w.fbq(...args); } catch (_) { /* el píxel nunca rompe la página */ } };
  // autoConfig apagado: el píxel no lee botones ni campos de la página por su cuenta.
  fbq("set", "autoConfig", false, pixelId);
  fbq("init", pixelId);
}

async function start() {
  try {
    const r = await fetch(CONFIG_URL, { credentials: "same-origin" });
    const data = r.ok ? await r.json().catch(() => ({})) : {};
    const pixelId = validPixelId(data && data.metaPixelId);
    if (!pixelId) { stop(); return; }
    install(pixelId);
    state = "on";
    for (const [name, params, eventId] of queue.splice(0)) send(name, params, eventId);
  } catch (_) {
    stop();
  }
}

function boot() {
  if (state !== "idle") return;
  state = "loading";
  const later = () => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => start(), { timeout: 2000 });
    else setTimeout(start, 0);
  };
  if (document.readyState === "complete") later();
  else window.addEventListener("load", later, { once: true });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  // Las páginas con <script> clásico (/unete, /beta) usan window.evolvPixel.
  window.evolvPixel = Object.freeze({ track, cookies: () => metaCookies(document.cookie) });
  track("PageView");
  boot();
}
