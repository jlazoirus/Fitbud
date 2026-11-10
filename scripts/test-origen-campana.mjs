// REQ-370: origen de campaña de la web pública hasta la compra.
// Limpieza, primer contacto con vencimiento a 30 días, parseCompra y registro del cobro.
// Sin red: fetch simulado para Culqi/Supabase/Resend y localStorage en memoria.
import assert from "node:assert/strict";

const store = new Map();
let storageBroken = false;
globalThis.localStorage = {
  getItem(k) { if (storageBroken) throw new Error("bloqueado"); return store.has(k) ? store.get(k) : null; },
  setItem(k, v) { if (storageBroken) throw new Error("bloqueado"); store.set(k, String(v)); },
  removeItem(k) { if (storageBroken) throw new Error("bloqueado"); store.delete(k); },
};

const { CLAVES, VIGENCIA_MS, STORAGE_KEY, limpiarValor, limpiarCampana, campanaDeUrl, elegirOrigen, capturar, campanaActual } = await import("../web/origen.js");
const { parseCompra, chargeBody, metadataCampana } = await import("../api/_tienda/culqi-charge.js");
const { default: checkout } = await import("../api/checkout.js");

// ── Limpieza: solo [A-Za-z0-9_-], 1..120, solo las cinco claves ────────────────
assert.deepEqual(CLAVES, ["source", "utm_source", "utm_medium", "utm_campaign", "utm_content"]);
assert.equal(limpiarValor("ig-bio-s1"), "ig-bio-s1");
assert.equal(limpiarValor("Reel_02"), "Reel_02");
assert.equal(limpiarValor("a".repeat(120)), "a".repeat(120));
for (const malo of ["a".repeat(121), "", "ig bio", "ana@example.com", "<script>", "ñandú", "x/y", "1;2", " ig", 42, null, undefined, {}, ["ig"]]) {
  assert.equal(limpiarValor(malo), "", "debe descartar " + JSON.stringify(malo));
}
assert.deepEqual(limpiarCampana({ source: "ig-bio-s1", utm_medium: "bad value", email: "ana@example.com", nombre: "Ana", telefono: "999888777", peso: "80" }), { source: "ig-bio-s1" });
assert.equal(limpiarCampana({ utm_source: "con espacio" }), null);
assert.equal(limpiarCampana("ig-bio-s1"), null);
assert.equal(limpiarCampana(["ig"]), null);
assert.equal(limpiarCampana(null), null);
assert.deepEqual(campanaDeUrl("?source=ig-bio-s1"), { source: "ig-bio-s1" });
assert.deepEqual(
  campanaDeUrl("?utm_source=instagram&utm_medium=paid_social&utm_campaign=dic-2026&utm_content=reel_02&plan=monthly&email=ana%40example.com"),
  { utm_source: "instagram", utm_medium: "paid_social", utm_campaign: "dic-2026", utm_content: "reel_02" },
  "solo las claves de campaña; plan y correo nunca entran"
);
assert.equal(campanaDeUrl("?source=ig%20bio"), null, "un espacio invalida el valor");
assert.equal(campanaDeUrl(""), null);
assert.equal(campanaDeUrl("?plan=monthly"), null);

// ── Primer contacto durante 30 días; después se reemplaza ───────────────────────
const T0 = Date.UTC(2026, 10, 10);
const DIA = 86400000;
assert.equal(VIGENCIA_MS, 30 * DIA);
const primero = { campana: { source: "ig-bio-s1" }, at: T0 };
assert.deepEqual(elegirOrigen(null, { source: "tiktok" }, T0), { campana: { source: "tiktok" }, at: T0 });
assert.deepEqual(elegirOrigen(primero, { source: "tiktok" }, T0 + 29 * DIA), primero, "dentro de 30 días gana el primero");
assert.deepEqual(elegirOrigen(primero, { source: "tiktok" }, T0 + 30 * DIA), { campana: { source: "tiktok" }, at: T0 + 30 * DIA }, "a los 30 días se reemplaza");
assert.equal(elegirOrigen(primero, null, T0 + 31 * DIA), null, "vencido y sin origen nuevo no queda nada");
assert.deepEqual(elegirOrigen({ campana: { source: "x y" }, at: T0 }, { source: "tiktok" }, T0), { campana: { source: "tiktok" }, at: T0 }, "un guardado inválido no cuenta");
assert.deepEqual(elegirOrigen({ campana: { source: "ig" }, at: T0 + DIA }, { source: "tiktok" }, T0).campana, { source: "tiktok" }, "fecha futura no cuenta");
assert.deepEqual(elegirOrigen({ campana: { source: "ig" }, at: "ayer" }, null, T0), null);

// capturar/campanaActual con localStorage simulado.
assert.deepEqual(capturar("?source=ig-bio-s1", T0), { source: "ig-bio-s1" });
assert.deepEqual(JSON.parse(store.get(STORAGE_KEY)), { campana: { source: "ig-bio-s1" }, at: T0 });
assert.deepEqual(capturar("", T0 + DIA), { source: "ig-bio-s1" }, "/planes sin parámetros conserva el origen");
assert.deepEqual(capturar("?utm_source=tiktok", T0 + 2 * DIA), { source: "ig-bio-s1" }, "un segundo contacto no pisa al primero");
assert.deepEqual(campanaActual(T0 + 29 * DIA), { source: "ig-bio-s1" });
assert.equal(campanaActual(T0 + 30 * DIA), null, "vencido no se envía");
assert.deepEqual(capturar("?utm_source=tiktok", T0 + 31 * DIA), { utm_source: "tiktok" });
assert.equal(JSON.parse(store.get(STORAGE_KEY)).at, T0 + 31 * DIA);
assert.equal(capturar("", T0 + 70 * DIA), null);
assert.equal(store.has(STORAGE_KEY), false, "vencido se borra");
store.set(STORAGE_KEY, "{no es json");
assert.deepEqual(capturar("?source=ig-bio-s1", T0), { source: "ig-bio-s1" }, "un valor corrupto se reemplaza");
store.set(STORAGE_KEY, JSON.stringify({ campana: { source: "ig-bio-s1", email: "ana@example.com" }, at: T0 }));
assert.deepEqual(campanaActual(T0), { source: "ig-bio-s1" }, "lo guardado se limpia otra vez al leer");
// Sin almacenamiento (modo privado o bloqueado) nunca lanza.
store.clear();
storageBroken = true;
assert.doesNotThrow(() => capturar("?source=ig-bio-s1", T0));
assert.deepEqual(campanaActual(T0), { source: "ig-bio-s1" }, "queda el origen de esta página en memoria");
storageBroken = false;

// ── parseCompra revalida; nunca cambia precio, plan ni errores ──────────────────
const compra = { planId: "monthly", tokenId: "tkn_test_abc123", email: "ana@example.com", firstName: "Ana", lastName: "Pérez", phone: "999 888 777", deviceId: "dev-1", acceptTerms: true };
const sin = parseCompra(compra);
assert.deepEqual(sin.errors, []);
assert.equal(sin.data.campana, null);
assert.deepEqual(chargeBody(sin.data).metadata, { plan_id: "monthly", origen: "tienda_web" }, "sin origen la metadata queda igual");
const con = parseCompra({ ...compra, campana: { source: "ig-bio-s1", utm_campaign: "dic-2026", utm_medium: "<b>", email: "ana@example.com", planId: "semiannual" } });
assert.deepEqual(con.errors, []);
assert.deepEqual(con.data.campana, { source: "ig-bio-s1", utm_campaign: "dic-2026" });
const conBody = chargeBody(con.data);
assert.equal(conBody.amount, sin.data.plan.montoCentimos, "el origen no cambia el monto");
assert.equal(con.data.plan.id, "monthly", "el origen no cambia el plan");
assert.deepEqual(conBody.metadata, { plan_id: "monthly", origen: "tienda_web", campana_source: "ig-bio-s1", campana_utm_campaign: "dic-2026" });
for (const value of Object.values(conBody.metadata)) assert.equal(typeof value, "string", "la metadata de Culqi es texto plano");
for (const raro of ["ig-bio-s1", 123, ["ig"], { source: "a".repeat(121) }, { source: "x y" }, null]) {
  const p = parseCompra({ ...compra, campana: raro });
  assert.deepEqual(p.errors, [], "un origen inválido nunca bloquea la compra");
  assert.equal(p.data.campana, null);
}
assert.deepEqual(metadataCampana(null), {});
// Con un plan inválido sigue fallando por el plan, no por el origen.
assert.match(parseCompra({ ...compra, planId: "annual", campana: { source: "ig" } }).errors[0], /no existe/);

// ── Handler: campana en payload de billing_events y metadata de Culqi ────────────
process.env.SUPABASE_URL = "https://mock.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
process.env.CULQI_SECRET_KEY = "sk_test_mock";
delete process.env.RESEND_API_KEY;
delete process.env.META_PIXEL_ID;
delete process.env.META_CAPI_TOKEN;
const json = (status, obj) => ({ ok: status >= 200 && status < 300, status, json: async () => obj });
function mockFetch(sc = {}) {
  const calls = { culqi: [], billing: [] };
  globalThis.fetch = async (url, opts = {}) => {
    if (url === "https://api.culqi.com/v2/charges") { calls.culqi.push(JSON.parse(opts.body)); return json(201, { object: "charge", id: "chr_test_370" }); }
    if (url.includes("/rest/v1/profiles?email=eq.")) return json(200, [{ id: "user-1" }]);
    if (url.includes("/rest/v1/user_entitlements?payment_ref=")) return json(200, []);
    if (url.includes("/rest/v1/user_entitlements?user_id=")) return json(200, []);
    if (url.endsWith("/rest/v1/user_entitlements")) return sc.grantFails ? json(400, { message: "boom" }) : json(201, [{ id: "ent-1", expires_at: new Date(T0 + 30 * DIA).toISOString() }]);
    if (url.endsWith("/rest/v1/billing_events")) { calls.billing.push(JSON.parse(opts.body)); return json(201, {}); }
    throw new Error("fetch inesperado: " + url);
  };
  return calls;
}
const charge = async (body) => {
  const r = { statusCode: 0, payload: null, status(c) { this.statusCode = c; return this; }, json(o) { this.payload = o; return this; } };
  await checkout({ method: "POST", headers: {}, body: JSON.stringify(body), query: { op: "culqi" } }, r);
  return r;
};

let calls = mockFetch();
let r = await charge({ ...compra, campana: { source: "ig-bio-s1" } });
assert.deepEqual([r.statusCode, r.payload.ok], [200, true]);
assert.deepEqual(calls.billing[0].payload.campana, { source: "ig-bio-s1" });
assert.equal(calls.culqi[0].metadata.campana_source, "ig-bio-s1");
assert.equal(r.payload.campana, undefined, "la respuesta no cambia");

calls = mockFetch();
const rSin = await charge(compra);
assert.equal(rSin.statusCode, 200);
assert.equal("campana" in calls.billing[0].payload, false, "sin origen no se agrega el campo");
assert.deepEqual(calls.culqi[0].metadata, { plan_id: "monthly", origen: "tienda_web" });
assert.deepEqual(Object.keys(rSin.payload).sort(), Object.keys(r.payload).sort(), "con y sin origen, la misma respuesta");

calls = mockFetch();
r = await charge({ ...compra, campana: { source: "ana@example.com", utm_source: "x".repeat(500) } });
assert.equal(r.payload.ok, true, "un origen inválido no bloquea el pago");
assert.equal("campana" in calls.billing[0].payload, false);
assert.doesNotMatch(JSON.stringify(calls.culqi[0].metadata), /ana@example\.com/);

// Cobrado sin acceso: el registro "failed" también conserva el origen.
calls = mockFetch({ grantFails: true });
r = await charge({ ...compra, campana: { utm_source: "instagram", utm_campaign: "dic-2026" } });
assert.equal(r.payload.cuenta, "pendiente");
assert.equal(calls.billing[0].status, "failed");
assert.deepEqual(calls.billing[0].payload.campana, { utm_source: "instagram", utm_campaign: "dic-2026" });

console.log("  ✓ origen de campaña: limpieza, primer contacto 30 días, parseCompra, payload y metadata de Culqi");
