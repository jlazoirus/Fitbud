// REQ-355: motor de la suscripción mensual con Culqi. Sin red ni producción:
// Culqi y Supabase (PostgREST y Auth) simulados en memoria, y PGlite para el SQL.
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  env, parseInscripcion, customerBody, cardBody, subscriptionBody, estadoCulqi, fechaCulqi,
  tarjetaInfo, interpretCreacion, idsEnEvento, inscribir, webhook, cancelar, cancelarDeCuenta,
} from "../api/_tienda/suscripcion.js";
import checkout from "../api/checkout.js";
import { planesSuscripcion } from "./culqi-crear-planes.mjs";
import { SUSCRIPCION } from "../tienda/planes.js";

const ROOT = new URL("..", import.meta.url).pathname;
const read = (p) => fs.readFileSync(ROOT + p, "utf8");
const DAY = 86400000;

// ── Funciones puras ────────────────────────────────────────────────────────────────
const ok = { tokenId: "tkn_test_abc123", email: " Ana@Example.com ", firstName: "Ana", lastName: "Pérez", phone: "+51 999 888 777", address: "Av. Arequipa 123", city: "Lima", acceptTerms: true, acceptRenewal: true };
let p = parseInscripcion(ok);
assert.deepEqual(p.errors, []);
assert.equal(p.data.email, "ana@example.com");
assert.equal(p.data.phone, "51999888777", "Culqi recibe solo dígitos");
assert.match(parseInscripcion({ ...ok, acceptRenewal: false }).errors[0], /renovación automática/, "sin aceptar la renovación no hay suscripción");
assert.match(parseInscripcion({ ...ok, acceptTerms: false }).errors[0], /Términos/);
assert.match(parseInscripcion({ ...ok, address: "" }).errors[0], /dirección/);
assert.match(parseInscripcion({ ...ok, phone: "" }).errors[0], /celular/);
assert.match(parseInscripcion({ ...ok, tokenId: "x" }).errors[0], /tarjeta/);
assert.deepEqual(customerBody(p.data), { first_name: "Ana", last_name: "Pérez", email: "ana@example.com", address: "Av. Arequipa 123", address_city: "Lima", country_code: "PE", phone_number: "51999888777" });
assert.deepEqual(cardBody("cus_test_1", p.data), { customer_id: "cus_test_1", token_id: "tkn_test_abc123", validate: true }, "la tarjeta se valida (cargo mínimo anulado)");
const con3ds = parseInscripcion({ ...ok, authentication3DS: { eci: "05", xid: "x", cavv: "c", otro: "no" } }).data;
assert.deepEqual(cardBody("cus_test_1", con3ds).authentication_3DS, { eci: "05", xid: "x", cavv: "c" });
assert.deepEqual(subscriptionBody("crd_test_1", "pln_test_1", { a: "b" }), { card_id: "crd_test_1", plan_id: "pln_test_1", tyc: true, metadata: { a: "b" } });
assert.deepEqual([1, 2, 3, 4, 5, 6, 9].map(estadoCulqi), ["pending", "trialing", "active", "canceled", "pending", "ended", "pending"]);
assert.equal(fechaCulqi(1700000000000), "2023-11-14T22:13:20.000Z");
assert.equal(fechaCulqi(1700000000), "2023-11-14T22:13:20.000Z", "también en segundos");
assert.equal(fechaCulqi(null), null);
assert.deepEqual(tarjetaInfo({ source: { last_four: "1111", iin: { bin: "411111", card_brand: "Visa" } } }), { brand: "Visa", last4: "1111", bin: "411111" });
assert.deepEqual(tarjetaInfo({}), { brand: null, last4: null, bin: null });
assert.equal(interpretCreacion(200, { action_code: "REVIEW" }).result, "needs3ds");
assert.equal(interpretCreacion(201, { object: "card", id: "crd_test_1" }).result, "ok");
assert.equal(interpretCreacion(402, { object: "error", user_message: "Fondos insuficientes" }).error, "Fondos insuficientes");
assert.deepEqual(idsEnEvento({ data: { object: "charge", id: "chr_test_9", amount: 2990, currency_code: "PEN", metadata: { subscription_id: "sxn_test_1" } } }),
  { subscriptionId: "sxn_test_1", chargeId: "chr_test_9", amount: 2990, currency: "PEN" });
assert.equal(idsEnEvento({ data: JSON.stringify({ subscription: { id: "sxn_test_2" } }) }).subscriptionId, "sxn_test_2", "data puede llegar como texto JSON");

// Planes que crea scripts/culqi-crear-planes.mjs.
const [planPrueba, planMensual] = planesSuscripcion();
assert.equal(planPrueba.env, "CULQI_PLAN_PRUEBA_ID");
assert.deepEqual([planPrueba.body.amount, planPrueba.body.currency, planPrueba.body.interval_unit_time, planPrueba.body.interval_count], [2990, "PEN", 3, 0], "mensual (3), indefinido (0)");
assert.deepEqual(planPrueba.body.initial_cycles, { count: 7, has_initial_charge: false, amount: 0, interval_unit_time: 1 }, "7 ciclos diarios sin cargo");
assert.equal(planMensual.body.initial_cycles.count, 0);
for (const pl of [planPrueba, planMensual]) {
  assert.ok(pl.body.name.length >= 5 && pl.body.name.length <= 50 && pl.body.short_name.length <= 50 && pl.body.description.length <= 200, "límites de la API de planes");
}

// ── Culqi y Supabase simulados ─────────────────────────────────────────────────────
const SUPA = "https://mock.supabase.co";
const ENV = { SUPABASE_URL: SUPA, SUPABASE_SERVICE_ROLE_KEY: "svc", SUPABASE_PUBLISHABLE_KEY: "anon", CULQI_SECRET_KEY: "sk_test_mock", CULQI_PLAN_PRUEBA_ID: "pln_test_prueba", CULQI_PLAN_MENSUAL_ID: "pln_test_mensual", TIENDA_SUSCRIPCION_ENABLED: "1" };
const E = env(ENV);

function fakeWorld() {
  const w = {
    tables: { subscriptions: [], user_entitlements: [], billing_events: [], subscription_charges: [], profiles: [] },
    users: [], culqi: { customers: [], cards: [], subs: [], events: {}, deleted: [] },
    calls: [], cardMode: "ok", subMode: "ok", deleteStatus: 200, sessions: {},
  };
  let seq = 0;
  const id = (pfx) => pfx + (++seq).toString().padStart(4, "0");
  const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  const matches = (row, params) => {
    for (const [k, v] of params) {
      if (["select", "limit", "order"].includes(k)) continue;
      const val = row[k];
      if (v.startsWith("eq.")) { if (String(val) !== decodeURIComponent(v.slice(3))) return false; }
      else if (v.startsWith("in.(")) { if (!v.slice(4, -1).split(",").includes(String(val))) return false; }
      else if (v.startsWith("gt.")) { if (!(val && String(val) > decodeURIComponent(v.slice(3)))) return false; }
      else throw new Error("filtro no simulado " + k + "=" + v);
    }
    return true;
  };
  w.fetch = async (url, init = {}) => {
    const method = init.method || "GET";
    const body = init.body ? JSON.parse(init.body) : null;
    w.calls.push({ method, url, body, headers: init.headers || {} });
    const u = new URL(url);
    if (u.origin === "https://api.culqi.com") {
      const c = w.culqi;
      if (u.pathname === "/v2/customers" && method === "GET") return json(200, { data: c.customers.filter((x) => x.email === u.searchParams.get("email")) });
      if (u.pathname === "/v2/customers" && method === "POST") { const x = { object: "customer", id: id("cus_test_"), email: body.email }; c.customers.push(x); return json(201, x); }
      if (u.pathname === "/v2/cards" && method === "POST") {
        if (w.cardMode === "3ds" && !body.authentication_3DS) return json(200, { action_code: "REVIEW", user_message: "Autentica" });
        if (w.cardMode === "declined") return json(402, { object: "error", type: "card_error", user_message: "Tarjeta rechazada." });
        const x = { object: "card", id: id("crd_test_"), customer_id: body.customer_id, source: { last_four: w.last4 || "1111", iin: { bin: w.bin || "411111", card_brand: "Visa" } } };
        c.cards.push({ ...x, body }); return json(201, x);
      }
      if (u.pathname === "/v2/recurrent/subscriptions/create") {
        if (w.subMode === "error") return json(400, { object: "error", user_message: "No se pudo suscribir." });
        const prueba = body.plan_id === "pln_test_prueba";
        const now = Date.now();
        const x = { id: id("sxn_test_"), status: prueba ? 2 : 1, plan_id: body.plan_id, card_id: body.card_id, trial_start: prueba ? now : null, trial_end: prueba ? now + 7 * DAY : null, next_billing_date: prueba ? now + 7 * DAY : now };
        c.subs.push(x); return json(201, x);
      }
      let m = u.pathname.match(/^\/v2\/recurrent\/subscriptions\/(sxn_test_\w+)$/);
      if (m && method === "GET") { const x = c.subs.find((s) => s.id === m[1]); return x ? json(200, x) : json(404, {}); }
      if (m && method === "DELETE") { if (w.deleteStatus === 200) c.deleted.push(m[1]); return json(w.deleteStatus, { deleted: true, id: m[1] }); }
      m = u.pathname.match(/^\/v2\/events\/(evt_test_\w+)$/);
      if (m) return c.events[m[1]] ? json(200, c.events[m[1]]) : json(404, { object: "error" });
      throw new Error("Culqi no simulado: " + method + " " + url);
    }
    if (u.origin === SUPA) {
      if (u.pathname === "/auth/v1/user") { const t = String(init.headers.Authorization || "").slice(7); return w.sessions[t] ? json(200, w.sessions[t]) : json(401, {}); }
      if (u.pathname === "/auth/v1/invite") { const x = { id: crypto.randomUUID(), email: body.email }; w.users.push(x); return json(200, x); }
      if (u.pathname === "/auth/v1/admin/users") return json(200, { users: w.users });
      const t = u.pathname.replace("/rest/v1/", "");
      const rows = w.tables[t];
      if (!rows) throw new Error("tabla no simulada " + t);
      const params = [...u.searchParams.entries()];
      if (method === "GET") {
        let out = rows.filter((r) => matches(r, params));
        const order = u.searchParams.get("order");
        if (order) { const [col, dir] = order.split("."); out.sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : 1) * (dir === "desc" ? -1 : 1)); }
        return json(200, out.slice(0, Number(u.searchParams.get("limit") || 1000)));
      }
      if (method === "POST") {
        const prefer = String(init.headers.Prefer || "");
        const pk = { billing_events: "stripe_event_id", subscription_charges: "charge_ref" }[t];
        if (pk && rows.some((r) => r[pk] === body[pk])) return prefer.includes("ignore-duplicates") ? json(201, []) : json(409, { message: "duplicate" });
        const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...body };
        rows.push(row);
        return json(201, prefer.includes("return=representation") ? [row] : null);
      }
      if (method === "PATCH") { const out = rows.filter((r) => matches(r, params)); out.forEach((r) => Object.assign(r, body)); return json(200, null); }
    }
    throw new Error("red no simulada: " + method + " " + url);
  };
  return w;
}

function res() {
  return { statusCode: 0, payload: null, status(c) { this.statusCode = c; return this; }, json(o) { this.payload = o; return this; }, setHeader() {} };
}
const post = (body, headers) => ({ method: "POST", headers: headers || {}, body: JSON.stringify(body) });
async function run(fn, req, e = E) { const r = res(); await fn(req, r, e); return r; }
const realFetch = globalThis.fetch;
const quiet = console.error;
console.error = () => {};

try {
  // ── Inscripción ──────────────────────────────────────────────────────────────────
  let w = fakeWorld(); globalThis.fetch = w.fetch;
  assert.equal((await run(inscribir, post(ok), env({ ...ENV, TIENDA_SUSCRIPCION_ENABLED: "" }))).statusCode, 404, "sin la bandera no hay inscripción");
  assert.equal((await run(inscribir, post(ok), env({ ...ENV, CULQI_PLAN_PRUEBA_ID: "" }))).statusCode, 503, "sin planes configurados");
  assert.equal((await run(inscribir, post({ ...ok, acceptRenewal: false }))).statusCode, 400);
  assert.equal(w.calls.length, 0, "nada sale a Culqi sin la bandera, sin planes o con datos inválidos");

  let r = await run(inscribir, post(ok));
  assert.equal(r.statusCode, 200);
  assert.equal(r.payload.ok, true);
  assert.equal(r.payload.cuenta, "invitada", "correo nuevo: se invita la cuenta");
  assert.equal(r.payload.conPrueba, true);
  assert.deepEqual(r.payload.tarjeta, { marca: "Visa", ultimos4: "1111" });
  assert.equal(r.payload.monto, "S/ 29.90");
  const sub1 = w.tables.subscriptions[0];
  assert.equal(sub1.status, "trialing");
  assert.equal(sub1.culqi_plan_id, "pln_test_prueba");
  assert.equal(sub1.email, "ana@example.com");
  assert.equal(sub1.user_id, w.users[0].id);
  assert.equal(w.culqi.cards[0].body.validate, true);
  const createCall = w.calls.find((c) => c.url.endsWith("/v2/recurrent/subscriptions/create"));
  assert.equal(createCall.body.tyc, true, "se envía la aceptación de términos a Culqi");
  assert.equal(createCall.headers.Authorization, "Bearer sk_test_mock");
  const prueba = w.tables.user_entitlements[0];
  assert.equal(prueba.payment_ref, sub1.culqi_subscription_id + ":prueba");
  assert.equal(prueba.plan_id, "monthly");
  assert.equal(Math.round((new Date(prueba.expires_at) - new Date(prueba.starts_at)) / DAY), 7, "7 días de acceso gratis");
  assert.equal(w.tables.billing_events[0].event_type, "culqi.subscription.created");
  assert.ok(!JSON.stringify(w.tables.billing_events).includes("tkn_test"), "el token de la tarjeta no se guarda");

  r = await run(inscribir, post(ok));
  assert.equal(r.statusCode, 409, "una suscripción viva por correo");
  assert.equal(w.culqi.subs.length, 1);

  // Misma tarjeta (bin + últimos 4) con otro correo: sin prueba.
  r = await run(inscribir, post({ ...ok, email: "otra@example.com" }));
  assert.equal(r.payload.conPrueba, false);
  assert.equal(w.tables.subscriptions[1].culqi_plan_id, "pln_test_mensual");
  assert.equal(w.tables.user_entitlements.length, 1, "sin prueba, el acceso llega con el primer cobro (webhook)");

  // Cuenta que ya pagó un plan: sin prueba.
  const pagador = { id: crypto.randomUUID(), email: "paga@example.com" };
  w.users.push(pagador);
  w.tables.user_entitlements.push({ id: crypto.randomUUID(), user_id: pagador.id, origin: "checkout", status: "expired", payment_ref: "chr_test_old", expires_at: "2026-01-01T00:00:00.000Z" });
  w.bin = "520000"; w.last4 = "2222";
  r = await run(inscribir, post({ ...ok, email: "paga@example.com" }));
  assert.equal(r.payload.cuenta, "existente");
  assert.equal(r.payload.conPrueba, false, "quien ya tuvo un plan pagado no tiene días gratis");

  // 3DS: primero pide autenticar; al reintentar se reutiliza el cliente.
  w.cardMode = "3ds"; w.bin = "455170"; w.last4 = "3333";
  r = await run(inscribir, post({ ...ok, email: "tres@example.com" }));
  assert.deepEqual(r.payload, { ok: false, needs3ds: true });
  assert.equal(w.culqi.subs.length, 3, "sin autenticar no se crea la suscripción");
  const clientes = w.culqi.customers.length;
  r = await run(inscribir, post({ ...ok, email: "tres@example.com", authentication3DS: { eci: "05", xid: "x", cavv: "c" } }));
  assert.equal(r.payload.ok, true);
  assert.equal(w.culqi.customers.length, clientes, "el cliente creado en el primer intento se reutiliza");
  assert.deepEqual(w.culqi.cards.at(-1).body.authentication_3DS, { eci: "05", xid: "x", cavv: "c" });

  // Tarjeta rechazada o suscripción fallida: error claro y nada guardado.
  w.cardMode = "declined";
  const filas = w.tables.subscriptions.length;
  r = await run(inscribir, post({ ...ok, email: "rechazo@example.com" }));
  assert.equal(r.statusCode, 402);
  assert.equal(r.payload.error, "Tarjeta rechazada.");
  w.cardMode = "ok"; w.subMode = "error"; w.bin = "400000"; w.last4 = "4444";
  r = await run(inscribir, post({ ...ok, email: "rechazo@example.com" }));
  assert.equal(r.statusCode, 402);
  assert.equal(w.tables.subscriptions.length, filas);
  w.subMode = "ok";

  // Por /api/checkout?op=suscripcion (rewrite de vercel.json).
  const vercel = JSON.parse(read("vercel.json"));
  for (const [source, op] of [["/api/suscripcion", "suscripcion"], ["/api/culqi-webhook", "culqi-webhook"], ["/api/suscripcion/cancelar", "suscripcion-cancelar"]]) {
    assert.ok(vercel.rewrites.some((x) => x.source === source && x.destination === "/api/checkout?op=" + op), source + ": falta el rewrite");
  }
  const funciones = fs.readdirSync(ROOT + "api").filter((f) => f.endsWith(".js") && !f.startsWith("_"));
  assert.ok(funciones.length <= 12, "Vercel Hobby: 12 funciones como máximo");
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v;
  const viaRouter = res();
  await checkout({ method: "POST", headers: {}, query: { op: "suscripcion" }, body: JSON.stringify({ ...ok, acceptRenewal: false }) }, viaRouter);
  assert.equal(viaRouter.statusCode, 400, "la ruta llega al motor de suscripción");

  // ── Webhook ─────────────────────────────────────────────────────────────────────
  w = fakeWorld(); globalThis.fetch = w.fetch;
  await run(inscribir, post(ok));
  const fila = w.tables.subscriptions[0];
  const sxn = fila.culqi_subscription_id;
  const evento = (idEv, type, data) => { w.culqi.events[idEv] = { object: "event", id: idEv, type, data }; };

  assert.equal((await run(webhook, post({ id: "nada" }))).statusCode, 400);
  r = await run(webhook, post({ id: "evt_test_falso", type: "subscription.charge.succeeded", data: { subscription_id: sxn, id: "chr_test_falso" } }));
  assert.equal(r.statusCode, 401, "un evento que Culqi no reconoce no se procesa");
  assert.equal(w.tables.user_entitlements.length, 1);

  // El cuerpo dice cobro exitoso, pero Culqi dice fallido: manda Culqi.
  evento("evt_test_fail1", "subscription.charge.failed", { subscription_id: sxn });
  r = await run(webhook, post({ id: "evt_test_fail1", type: "subscription.charge.succeeded", data: { subscription_id: sxn, id: "chr_test_x" } }));
  assert.equal(r.statusCode, 200);
  assert.equal(fila.status, "past_due");
  assert.equal(w.tables.user_entitlements.length, 1, "un cobro fallido no da acceso");

  const finPrueba = new Date(w.tables.user_entitlements[0].expires_at).getTime();
  evento("evt_test_ok1", "subscription.charge.succeeded", { object: "charge", id: "chr_test_m1", amount: 2990, currency_code: "PEN", metadata: { subscription: sxn } });
  r = await run(webhook, post({ id: "evt_test_ok1" }));
  assert.deepEqual(r.payload, { ok: true });
  assert.equal(fila.status, "active");
  const mes1 = w.tables.user_entitlements[1];
  assert.equal(mes1.payment_ref, "chr_test_m1");
  assert.equal(new Date(mes1.starts_at).getTime(), finPrueba, "el mes se suma desde el fin de la prueba");
  assert.equal(Math.round((new Date(mes1.expires_at) - new Date(mes1.starts_at)) / DAY), 30);
  assert.equal(fila.current_period_end, mes1.expires_at);
  assert.equal(w.tables.subscription_charges[0].entitlement_id, mes1.id);

  r = await run(webhook, post({ id: "evt_test_ok1" }));
  assert.equal(r.payload.duplicado, true, "el mismo evento no se procesa dos veces");
  evento("evt_test_ok1b", "subscription.charge.succeeded", { object: "charge", id: "chr_test_m1", metadata: { subscription: sxn } });
  r = await run(webhook, post({ id: "evt_test_ok1b" }));
  assert.equal(r.payload.duplicado, true, "el mismo cobro con otro evento tampoco suma días");
  assert.equal(w.tables.user_entitlements.length, 2);

  evento("evt_test_ok2", "subscription.charge.succeeded", { object: "charge", id: "chr_test_m2", metadata: { subscription: sxn } });
  await run(webhook, post({ id: "evt_test_ok2" }));
  assert.equal(new Date(w.tables.user_entitlements[2].starts_at).getTime(), new Date(mes1.expires_at).getTime(), "el segundo mes sigue al primero");

  evento("evt_test_otro", "subscription.charge.succeeded", { id: "chr_test_z", subscription_id: "sxn_test_desconocida" });
  r = await run(webhook, post({ id: "evt_test_otro" }));
  assert.equal(r.payload.desconocida, true);
  evento("evt_test_charge", "charge.creation.succeeded", { id: "chr_test_tienda" });
  assert.equal((await run(webhook, post({ id: "evt_test_charge" }))).payload.ignorado, "charge.creation.succeeded", "los pagos únicos siguen por su flujo");

  evento("evt_test_cancel", "subscription.cancel.succeeded", { subscription_id: sxn });
  await run(webhook, post({ id: "evt_test_cancel" }));
  assert.equal(fila.status, "canceled");
  assert.ok(fila.canceled_at);
  assert.equal(new Set(w.tables.billing_events.map((b) => b.stripe_event_id)).size, w.tables.billing_events.length, "un registro por evento");

  // ── Cancelar ─────────────────────────────────────────────────────────────────────
  w = fakeWorld(); globalThis.fetch = w.fetch;
  await run(inscribir, post(ok));
  const userId = w.users[0].id;
  w.sessions.tok = { id: userId, email: "ana@example.com" };
  assert.equal((await run(cancelar, post({}))).statusCode, 401, "cancelar exige sesión");
  r = await run(cancelar, post({}, { authorization: "Bearer tok" }));
  assert.equal(r.statusCode, 200);
  assert.deepEqual(w.culqi.deleted, [w.tables.subscriptions[0].culqi_subscription_id], "se cancela en Culqi");
  assert.equal(w.tables.subscriptions[0].status, "canceled");
  assert.ok(w.tables.subscriptions[0].cancel_requested_at);
  assert.equal(r.payload.accesoHasta, w.tables.user_entitlements[0].expires_at, "el acceso sigue hasta el fin de lo ya dado");
  assert.equal(w.tables.user_entitlements[0].status, "active", "cancelar no corta el acceso");
  assert.equal((await run(cancelar, post({}, { authorization: "Bearer tok" }))).statusCode, 404, "sin suscripción viva");

  // Si Culqi no cancela, se informa y la fila sigue viva (no se miente).
  w = fakeWorld(); globalThis.fetch = w.fetch;
  await run(inscribir, post(ok));
  w.deleteStatus = 500;
  await assert.rejects(cancelarDeCuenta(E, w.users[0].id), /Culqi/);
  assert.equal(w.tables.subscriptions[0].status, "trialing");
  w.deleteStatus = 404;
  await cancelarDeCuenta(E, w.users[0].id);
  assert.equal(w.tables.subscriptions[0].status, "canceled", "si Culqi ya no la tiene, queda cancelada");
  assert.equal(await cancelarDeCuenta(E, crypto.randomUUID()), null);
} finally {
  globalThis.fetch = realFetch;
  console.error = quiet;
}

// Borrar la cuenta cancela antes la suscripción (y no borra si no puede).
const privacy = read("api/privacy.js");
assert.ok(privacy.indexOf("cancelarDeCuenta(") > 0 && privacy.indexOf("cancelarDeCuenta(") < privacy.indexOf('"/auth/v1/admin/users/"'), "privacy.js cancela la suscripción antes de borrar la cuenta");
assert.match(privacy, /restRows\(e, "subscriptions"/, "la exportación incluye la suscripción");
assert.doesNotMatch(privacy.match(/restRows\(e, "subscriptions"[^)]*\)/)[0], /culqi_|card_bin/, "la exportación no expone ids internos ni el bin");

// ── SQL: idempotente, RLS y una suscripción viva por correo ────────────────────────
const db = new PGlite();
await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
create table user_entitlements(id uuid primary key default gen_random_uuid());`);
await db.exec(read("supabase/billing.sql"));
await db.exec(read("supabase/tienda_culqi.sql"));
const migration = read("supabase/suscripciones.sql");
await db.exec(migration);
await db.exec(migration); // idempotencia
const u1 = "10000000-0000-4000-8000-000000000001";
await db.query("insert into auth.users values($1)", [u1]);
const ins = (email, sxnId, status, user) => db.query(`insert into subscriptions(user_id,email,status,culqi_customer_id,culqi_card_id,culqi_subscription_id,culqi_plan_id,card_last4)
  values($1,$2,$3,'cus_test_1','crd_test_1',$4,'pln_test_1','1111') returning id`, [user || null, email, status, sxnId]);
const s1 = (await ins("a@x.pe", "sxn_test_1", "trialing", u1)).rows[0].id;
await assert.rejects(ins("A@x.pe", "sxn_test_2", "active"), /subscriptions_one_live_per_email_idx/, "una suscripción viva por correo");
await assert.rejects(ins("b@x.pe", "sxn_test_3", "active", u1), /subscriptions_one_live_per_user_idx/, "una suscripción viva por cuenta");
await assert.rejects(ins("c@x.pe", "sxn_test_1", "canceled"), /culqi_subscription_id/, "id de Culqi único");
await assert.rejects(ins("d@x.pe", "sxn_test_4", "rara"), /status_check/);
await db.query("update subscriptions set status='canceled' where id=$1", [s1]);
await ins("a@x.pe", "sxn_test_5", "active", u1); // tras cancelar puede volver a suscribirse
await db.query("insert into subscription_charges(charge_ref,subscription_id,event_id) values('chr_test_1',$1,'evt_test_1')", [s1]);
const dup = await db.query("insert into subscription_charges(charge_ref,subscription_id,event_id) values('chr_test_1',$1,'evt_test_2') on conflict do nothing returning charge_ref", [s1]);
assert.equal(dup.rows.length, 0, "un cobro se registra una sola vez");
for (const t of ["subscriptions", "subscription_charges"]) {
  assert.equal((await db.query("select relrowsecurity from pg_class where relname=$1", [t])).rows[0].relrowsecurity, true, t + ": RLS activo");
}
const pol = (await db.query("select policyname, cmd from pg_policies where tablename in ('subscriptions','subscription_charges')")).rows;
assert.deepEqual(pol, [{ policyname: "subscriptions_select_own", cmd: "SELECT" }], "solo lectura de la propia suscripción; escribe el servidor");
await db.query("delete from auth.users where id=$1", [u1]);
assert.equal((await db.query("select count(*)::int as n from subscriptions where user_id is null")).rows[0].n, 2, "borrar la cuenta conserva el historial sin el vínculo");

assert.equal(SUSCRIPCION.planId, "monthly");
console.log("  ✓ suscripción Culqi (REQ-355): inscripción, prueba única, 3DS, webhook verificado e idempotente, cancelación y SQL");
