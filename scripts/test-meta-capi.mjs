// REQ-376: Purchase por la API de conversiones de Meta desde /api/culqi-charge.
// Sin red ni producción: fetch simulado para Culqi, Supabase, Resend y Meta.
import assert from "node:assert/strict";
import { planPorId } from "../tienda/planes.js";
import {
  metaEnv, capiEnabled, compraEventId, compraMedicion, metaIds, clientInfo,
  purchaseEvent, purchaseRequest, sendPurchase,
} from "../api/_tienda/meta-capi.js";
import checkout from "../api/checkout.js";
import config from "../api/config.js";

const PII = ["ana@example.com", "Ana", "Pérez", "999888777", "999 888 777"];
const USER_DATA_KEYS = ["client_ip_address", "client_user_agent", "fbp", "fbc"];
const FBP = "fb.1.1700000000000.1234567890";
const FBC = "fb.1.1700000000000.IwAR0abc_DEF-123";
const quiet = console.error;

// ── Configuración ────────────────────────────────────────────────────────────
assert.deepEqual(metaEnv({}), { pixelId: "", token: "", testCode: "" });
assert.equal(capiEnabled(metaEnv({ META_PIXEL_ID: "123456789012345" })), false, "sin token no se envía");
assert.equal(capiEnabled(metaEnv({ META_CAPI_TOKEN: "tok" })), false, "sin píxel no se envía");
assert.equal(capiEnabled(metaEnv({ META_PIXEL_ID: "abc", META_CAPI_TOKEN: "tok" })), false, "un ID inválido no se usa");
const env = metaEnv({ META_PIXEL_ID: " 123456789012345 ", META_CAPI_TOKEN: "tok_secreto" });
assert.equal(capiEnabled(env), true);

// ── event_id compartido y valor del servidor ──────────────────────────────────
const plan = planPorId("quarterly");
assert.equal(compraEventId("chr_test_99"), "compra-chr_test_99");
assert.equal(compraEventId("chr<x>"), "compra-chrx", "solo caracteres seguros");
assert.deepEqual(compraMedicion("chr_test_99", plan), { eventId: "compra-chr_test_99", value: 79.9, currency: "PEN" });

// ── Identificadores permitidos: solo fbp/fbc válidos, IP y user agent ────────
assert.deepEqual(metaIds({ fbp: FBP, fbc: FBC, email: "ana@example.com" }), { fbp: FBP, fbc: FBC });
assert.deepEqual(metaIds({ fbp: "ana@example.com", fbc: "javascript:alert(1)" }), {});
assert.deepEqual(metaIds(null), {});
assert.deepEqual(clientInfo({ headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1", "user-agent": "Mozilla/5.0 Test" } }), { ip: "203.0.113.7", userAgent: "Mozilla/5.0 Test" });
assert.deepEqual(clientInfo({ headers: { "x-real-ip": "2001:db8::1" } }), { ip: "2001:db8::1", userAgent: "" });
assert.equal(clientInfo({ headers: { "x-forwarded-for": "<script>" } }).ip, "");

// ── Armado del evento ─────────────────────────────────────────────────────────
const event = purchaseEvent({
  eventId: "compra-chr_test_99", plan, ids: { fbp: FBP, fbc: FBC },
  client: { ip: "203.0.113.7", userAgent: "Mozilla/5.0 Test" }, sourceUrl: "https://evolvapp.club/pago", now: 1_765_000_000_000,
});
assert.deepEqual(event, {
  event_name: "Purchase",
  event_time: 1_765_000_000,
  event_id: "compra-chr_test_99",
  action_source: "website",
  event_source_url: "https://evolvapp.club/pago",
  user_data: { client_ip_address: "203.0.113.7", client_user_agent: "Mozilla/5.0 Test", fbp: FBP, fbc: FBC },
  custom_data: { value: 79.9, currency: "PEN", content_type: "product", content_ids: ["quarterly"], num_items: 1 },
});
assert.deepEqual(Object.keys(purchaseEvent({ eventId: "e", plan, ids: {}, client: {}, sourceUrl: "x" }).user_data), [], "sin cookies ni IP no inventa datos");
const request = purchaseRequest({ ...env, testCode: "TEST123" }, event);
assert.equal(request.url, "https://graph.facebook.com/v24.0/123456789012345/events");
assert.ok(!request.url.includes("tok_secreto"), "el token va en el cuerpo, no en la URL (no queda en logs)");
const sentBody = JSON.parse(request.init.body);
assert.deepEqual(Object.keys(sentBody), ["data", "access_token", "test_event_code"]);
assert.equal(sentBody.access_token, "tok_secreto");
assert.equal(JSON.parse(purchaseRequest(env, event).init.body).test_event_code, undefined);

// ── Envío: nunca lanza, nunca demora más del límite ──────────────────────────
console.error = () => {};
let seen = [];
let out = await sendPurchase(env, event, { fetchImpl: async (url, init) => { seen.push({ url, init }); return { ok: true, status: 200, json: async () => ({ events_received: 1 }) }; } });
assert.deepEqual(out, { sent: true, status: 200 });
assert.equal(seen.length, 1);
assert.equal(seen[0].init.method, "POST");
out = await sendPurchase(metaEnv({}), event, { fetchImpl: async () => { throw new Error("no debería llamarse"); } });
assert.deepEqual(out, { sent: false, reason: "not_configured" });
out = await sendPurchase(env, event, { fetchImpl: async () => { throw new TypeError("fetch failed"); } });
assert.equal(out.sent, false);
assert.equal(out.reason, "network_error");
out = await sendPurchase(env, event, { fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: { message: "Invalid parameter" } }) }) });
assert.deepEqual([out.sent, out.reason, out.status], [false, "http_error", 400]);
const t0 = Date.now();
out = await sendPurchase(env, event, { timeoutMs: 50, fetchImpl: () => new Promise(() => {}) });
assert.deepEqual([out.sent, out.reason], [false, "timeout"]);
assert.ok(Date.now() - t0 < 1000, "un Meta colgado no retiene el pago");
console.error = quiet;

// ── /api/config: ID público solo si es válido; el token nunca sale ──────────
function res() {
  return { statusCode: 0, payload: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; }, json(o) { this.payload = o; return this; } };
}
delete process.env.META_PIXEL_ID;
let r = res();
config({}, r);
assert.equal(r.payload.metaPixelId, "", "sin META_PIXEL_ID no hay píxel");
process.env.META_PIXEL_ID = "123456789012345";
process.env.META_CAPI_TOKEN = "tok_secreto";
r = res();
config({}, r);
assert.equal(r.payload.metaPixelId, "123456789012345");
assert.ok(!JSON.stringify(r.payload).includes("tok_secreto"), "el token no llega al navegador");
process.env.META_PIXEL_ID = "123<x>";
r = res();
config({}, r);
assert.equal(r.payload.metaPixelId, "");

// ── /api/culqi-charge con fetch simulado ─────────────────────────────────────
const json = (status, obj) => ({ ok: status >= 200 && status < 300, status, json: async () => obj });
process.env.SUPABASE_URL = "https://mock.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
process.env.CULQI_SECRET_KEY = "sk_test_mock";
process.env.RESEND_API_KEY = "re_mock";
const charge = (rq, rs) => checkout({ ...rq, query: { op: "culqi" } }, rs);
const compra = { planId: "quarterly", tokenId: "tkn_test_abc123", email: "ana@example.com", firstName: "Ana", lastName: "Pérez", phone: "999 888 777", deviceId: "dev-1", acceptTerms: true, fbp: FBP, fbc: FBC };
const req = (body) => ({ method: "POST", headers: { "x-forwarded-for": "203.0.113.7", "user-agent": "Mozilla/5.0 Test" }, body: JSON.stringify(body) });

function mockFetch(sc = {}) {
  const calls = { culqi: [], meta: [], billing: [] };
  globalThis.fetch = async (url, opts = {}) => {
    if (url === "https://api.culqi.com/v2/charges") {
      calls.culqi.push(JSON.parse(opts.body));
      if (sc.culqi === "declined") return json(402, { object: "error", user_message: "Tarjeta rechazada." });
      if (sc.culqi === "3ds") return json(200, { action_code: "REVIEW" });
      return json(201, { object: "charge", id: "chr_test_99" });
    }
    if (url.startsWith("https://graph.facebook.com/")) {
      calls.meta.push({ url, body: JSON.parse(opts.body) });
      if (sc.meta === "throws") throw new TypeError("fetch failed");
      if (sc.meta === "500") return json(500, { error: { message: "boom" } });
      if (sc.meta === "hang") return new Promise(() => {});
      return json(200, { events_received: 1 });
    }
    if (url.includes("/rest/v1/profiles?email=eq.")) return json(200, [{ id: "user-1" }]);
    if (url.includes("/rest/v1/user_entitlements?payment_ref=")) return json(200, []);
    if (url.includes("/rest/v1/user_entitlements?user_id=")) return json(200, []);
    if (url.endsWith("/rest/v1/user_entitlements")) return sc.grantFails ? json(400, { message: "boom" }) : json(201, [{ id: "ent-1", expires_at: "2027-02-01T00:00:00Z" }]);
    if (url.endsWith("/rest/v1/billing_events")) { calls.billing.push(JSON.parse(opts.body)); return json(201, {}); }
    if (url === "https://api.resend.com/emails") return json(200, {});
    throw new Error("fetch inesperado: " + url);
  };
  return calls;
}

// Con píxel y token: el servidor manda Purchase con el mismo eventId que recibe /pago.
process.env.META_PIXEL_ID = "123456789012345";
let calls = mockFetch();
r = res();
await charge(req(compra), r);
assert.equal(r.statusCode, 200);
assert.deepEqual(r.payload.compra, { eventId: "compra-chr_test_99", value: 79.9, currency: "PEN" });
assert.equal(calls.meta.length, 1, "un Purchase por cargo confirmado");
const capiEvent = calls.meta[0].body.data[0];
assert.equal(capiEvent.event_id, r.payload.compra.eventId, "mismo event_id que el navegador (deduplicación)");
assert.equal(capiEvent.custom_data.value, r.payload.compra.value);
assert.equal(capiEvent.custom_data.currency, "PEN");
assert.equal(capiEvent.event_source_url, "https://evolvapp.club/pago");
assert.deepEqual(Object.keys(capiEvent.user_data).sort(), [...USER_DATA_KEYS].sort());
assert.deepEqual(capiEvent.user_data, { client_ip_address: "203.0.113.7", client_user_agent: "Mozilla/5.0 Test", fbp: FBP, fbc: FBC });
const metaText = JSON.stringify(calls.meta);
for (const value of PII) assert.ok(!metaText.includes(value), "Meta no recibe " + value);
assert.ok(!JSON.stringify(calls.culqi).includes(FBP), "Culqi no recibe las cookies de Meta");

// Meta falla, se cuelga o responde error: el pago responde igual y queda registrado.
console.error = () => {};
for (const meta of ["throws", "500", "hang"]) {
  calls = mockFetch({ meta });
  r = res();
  const started = Date.now();
  await charge(req(compra), r);
  assert.deepEqual([r.statusCode, r.payload.ok, r.payload.cuenta, r.payload.operacion], [200, true, "existente", "chr_test_99"], "Meta " + meta + " no afecta el pago");
  assert.equal(calls.billing[0].status, "processed");
  assert.ok(Date.now() - started < 5000, "Meta " + meta + " no retiene la respuesta");
}
// Cobrado pero sin poder dar acceso: igual se mide la compra con el mismo id.
calls = mockFetch({ grantFails: true });
r = res();
await charge(req(compra), r);
assert.deepEqual([r.payload.ok, r.payload.cuenta, r.payload.compra.eventId], [true, "pendiente", "compra-chr_test_99"]);
assert.equal(calls.meta[0].body.data[0].event_id, "compra-chr_test_99");
console.error = quiet;

// Sin cobro no hay Purchase.
for (const culqi of ["declined", "3ds"]) {
  calls = mockFetch({ culqi });
  r = res();
  await charge(req(compra), r);
  assert.equal(r.payload.compra, undefined);
  assert.equal(calls.meta.length, 0, culqi + ": sin cargo confirmado no se mide la compra");
}

// Sin token (o sin píxel): ninguna llamada a Meta y el pago igual.
for (const missing of ["META_CAPI_TOKEN", "META_PIXEL_ID"]) {
  const saved = process.env[missing];
  delete process.env[missing];
  calls = mockFetch();
  r = res();
  await charge(req(compra), r);
  assert.equal(r.payload.ok, true);
  assert.equal(calls.meta.length, 0, "sin " + missing + " no se llama a Meta");
  process.env[missing] = saved;
}

console.log("test-meta-capi: OK (event_id compartido, valor del servidor, sin datos personales, Meta nunca afecta el pago)");
