// REQ-376: Purchase por la API de conversiones de Meta, desde /api/culqi-charge.
// No es una función de Vercel (vive en api/_tienda/), así que no cuenta para el
// tope de 12 funciones.
//
// - Solo se envía si existen META_PIXEL_ID y META_CAPI_TOKEN (el token es secreto
//   y vive solo en Vercel). META_CAPI_TEST_CODE (opcional) manda los eventos a
//   "Probar eventos" del Administrador de eventos, para verificar sin ensuciar datos.
// - event_id = compraEventId(cargo): el mismo que /pago usa en el Purchase del
//   navegador (viene en la respuesta), así Meta no cuenta la compra dos veces.
// - Datos de usuario: solo fbp, fbc, IP y user agent. Nunca correo, teléfono ni
//   nombre, ni siquiera cifrados.
// - Nunca lanza: un error de Meta se registra y el pago sigue igual.

import { MONEDA } from "../../tienda/planes.js";

const GRAPH_URL = "https://graph.facebook.com/v24.0/";
const TIMEOUT_MS = 3000;
const PIXEL_ID_RE = /^\d{5,20}$/;
const FB_COOKIE_RE = /^fb\.[0-2]\.\d{10,16}\.[A-Za-z0-9_.-]{1,250}$/;
const IP_RE = /^[0-9A-Fa-f:.]{3,45}$/;

export function metaEnv(source = process.env) {
  const pixelId = String(source.META_PIXEL_ID || "").trim();
  const token = String(source.META_CAPI_TOKEN || "").trim();
  return {
    pixelId: PIXEL_ID_RE.test(pixelId) ? pixelId : "",
    token,
    testCode: String(source.META_CAPI_TEST_CODE || "").trim().slice(0, 40),
  };
}

export function capiEnabled(env) {
  return !!(env && env.pixelId && env.token);
}

// Id compartido navegador/servidor: sale del cargo de Culqi, único por compra.
export function compraEventId(chargeId) {
  return ("compra-" + String(chargeId || "")).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 100);
}

// REQ-381: el monto y la moneda realmente cobrados; sin `cobro`, el precio en soles.
function cobroDe(plan, cobro) {
  return cobro && Number.isInteger(cobro.monto) && cobro.moneda ? cobro : { monto: plan.montoCentimos, moneda: MONEDA };
}

// Lo que /pago necesita para el Purchase del navegador: valor del servidor, no del navegador.
export function compraMedicion(chargeId, plan, cobro) {
  const c = cobroDe(plan, cobro);
  return { eventId: compraEventId(chargeId), value: c.monto / 100, currency: c.moneda };
}

// Identificadores de Meta que manda /pago (cookies _fbp y _fbc). Lo demás se descarta.
export function metaIds(body) {
  const b = body && typeof body === "object" ? body : {};
  const out = {};
  for (const key of ["fbp", "fbc"]) {
    const value = String(b[key] == null ? "" : b[key]).trim();
    if (FB_COOKIE_RE.test(value)) out[key] = value;
  }
  return out;
}

function header(req, name) {
  const h = (req && req.headers) || {};
  const value = h[name] != null ? h[name] : h[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value == null ? "" : String(value);
}

export function clientInfo(req) {
  const forwarded = header(req, "x-forwarded-for").split(",")[0].trim();
  const ip = forwarded || header(req, "x-real-ip").trim();
  return {
    ip: IP_RE.test(ip) ? ip : "",
    userAgent: header(req, "user-agent").replace(/[\u0000-\u001f]/g, "").slice(0, 400),
  };
}

export function purchaseEvent({ eventId, plan, cobro, ids, client, sourceUrl, now }) {
  const c = cobroDe(plan, cobro);
  const userData = {};
  if (client && client.ip) userData.client_ip_address = client.ip;
  if (client && client.userAgent) userData.client_user_agent = client.userAgent;
  if (ids && ids.fbp) userData.fbp = ids.fbp;
  if (ids && ids.fbc) userData.fbc = ids.fbc;
  return {
    event_name: "Purchase",
    event_time: Math.floor((now || Date.now()) / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: sourceUrl,
    user_data: userData,
    custom_data: {
      value: c.monto / 100,
      currency: c.moneda,
      content_type: "product",
      content_ids: [plan.id],
      num_items: 1,
    },
  };
}

export function purchaseRequest(env, event) {
  const body = { data: [event], access_token: env.token };
  if (env.testCode) body.test_event_code = env.testCode;
  return {
    url: GRAPH_URL + env.pixelId + "/events",
    init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  };
}

// Devuelve { sent, reason?, status? }. Nunca rechaza y nunca tarda más de timeoutMs.
export async function sendPurchase(env, event, { timeoutMs = TIMEOUT_MS, fetchImpl } = {}) {
  if (!capiEnabled(env)) return { sent: false, reason: "not_configured" };
  const doFetch = fetchImpl || globalThis.fetch;
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  let timer = null;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => {
      if (controller) controller.abort();
      resolve({ sent: false, reason: "timeout" });
    }, timeoutMs);
  });
  const attempt = (async () => {
    const { url, init } = purchaseRequest(env, event);
    const r = await doFetch(url, controller ? { ...init, signal: controller.signal } : init);
    if (r && r.ok) return { sent: true, status: r.status };
    let detail = "";
    try { const out = await r.json(); detail = (out && out.error && (out.error.message || out.error.type)) || ""; } catch (_) { /* sin cuerpo */ }
    return { sent: false, reason: "http_error", status: r && r.status, detail: String(detail).slice(0, 200) };
  })().catch((err) => ({ sent: false, reason: "network_error", detail: String((err && err.name) || err).slice(0, 200) }));
  try {
    const out = await Promise.race([attempt, timeout]);
    if (!out.sent) console.error("meta-capi: Purchase sin enviar", event && event.event_id, out.reason, out.status || "", out.detail || "");
    return out;
  } catch (_) {
    return { sent: false, reason: "error" };
  } finally {
    clearTimeout(timer);
  }
}
