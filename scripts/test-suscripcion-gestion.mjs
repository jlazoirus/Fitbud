// REQ-357: gestionar la suscripción (estado y cancelación en Perfil y en /cuenta) y
// sus correos (inicio de la prueba, aviso antes del primer cobro, recibo, cobro
// fallido y cancelación), cada uno una sola vez. Sin red ni producción: Culqi,
// Supabase y Resend simulados en memoria, y PGlite para el SQL.
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { env, inscribir, webhook, cancelar, estado, estadoPublico } from "../api/_tienda/suscripcion.js";
import { mensajeSuscripcion, htmlCorreoSuscripcion, enviarCorreoSuscripcion, ymdLima } from "../api/_tienda/suscripcion-correos.js";
import { subscriptionNoticeDue, runSubscriptionNotices, runPlanExpiry } from "../api/notify.js";
import { filasEstado, notaEstado, puedeCancelar, textoConfirmar, textoCancelada, sesionGuardada } from "../tienda/cuenta.js";
import checkout from "../api/checkout.js";

const ROOT = new URL("..", import.meta.url).pathname;
const read = (p) => fs.readFileSync(ROOT + p, "utf8");
const DAY = 86400000;
const H = 3600000;

// ── Textos de los correos ───────────────────────────────────────────────────────────
const fila0 = { culqi_subscription_id: "sxn_test_1", card_brand: "Visa", card_last4: "1111", next_billing_at: "2026-11-27T15:00:00Z", trial_ends_at: "2026-11-27T15:00:00Z" };
const correos = {
  prueba: mensajeSuscripcion("prueba", { fila: fila0 }),
  aviso_cobro: mensajeSuscripcion("aviso_cobro", { fila: fila0 }),
  recibo: mensajeSuscripcion("recibo", { fila: fila0, accesoHasta: "2026-12-27T15:00:00Z", fecha: "2026-11-27T15:00:00Z" }),
  cobro_fallido: mensajeSuscripcion("cobro_fallido", { fila: fila0 }),
  cancelada: mensajeSuscripcion("cancelada", { fila: fila0, accesoHasta: "2026-11-27T15:00:00Z" }),
};
assert.match(correos.prueba.paragraphs.join(" "), /27 de noviembre de 2026/, "fecha del primer cobro");
assert.match(correos.prueba.paragraphs.join(" "), /S\/ 29\.90 a Visa •••• 1111/);
assert.match(correos.aviso_cobro.subject, /primer cobro de Evolv es el 27 de noviembre/);
assert.match(correos.aviso_cobro.paragraphs.join(" "), /cancela antes de esa fecha/);
assert.match(correos.recibo.subject, /Recibo .*S\/ 29\.90/);
assert.match(correos.recibo.paragraphs.join(" "), /pagado hasta el 27 de diciembre de 2026/);
assert.match(correos.recibo.paragraphs.join(" "), /RUC \d{11}/, "el recibo identifica al comercio");
assert.match(correos.cobro_fallido.paragraphs.join(" "), /volverá a intentar/);
assert.match(correos.cancelada.paragraphs.join(" "), /ningún cobro más.*hasta el 27 de noviembre/s);
for (const [tipo, msg] of Object.entries(correos)) {
  const text = JSON.stringify(msg);
  assert.doesNotMatch(text, /\bIA\b|inteligencia artificial|modelo|prompt|token|Claude/i, tipo + ": REQ-31");
  assert.doesNotMatch(text, /peso|kg|grasa|foto|calor/i, tipo + ": sin datos de salud");
  assert.doesNotMatch(text, /sxn_|crd_|cus_/, tipo + ": sin ids de Culqi");
  assert.equal(msg.url, tipo === "cancelada" ? "/planes" : "/cuenta", tipo + ": enlace para ver o cancelar");
}
assert.throws(() => mensajeSuscripcion("otro", {}), /desconocido/);
const html = htmlCorreoSuscripcion("https://evolvapp.club/", { ...correos.prueba, title: "<b>x</b>" });
assert.match(html, /href="https:\/\/evolvapp\.club\/cuenta"/);
assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/, "escapa el contenido");
assert.match(html, /aviso sobre tu suscripción/);
assert.doesNotMatch(html, /unsubscribe|Desactivar recordatorios/, "transaccional: sin baja");
assert.equal(ymdLima("2026-11-27T03:00:00Z"), "2026-11-26", "fecha en hora de Lima");

// ── /cuenta: textos puros ─────────────────────────────────────────────────────────
const sPrueba = { estado: "trialing", conPrueba: true, pruebaHasta: "2026-11-27T15:00:00Z", proximoCobro: "2026-11-27T15:00:00Z", monto: "S/ 29.90", tarjeta: { marca: "Visa", ultimos4: "1111" }, canceladaEl: null, accesoHasta: "2026-11-27T15:00:00Z" };
assert.deepEqual(filasEstado(sPrueba).map((f) => f[0]), ["Estado", "Gratis hasta", "Primer cobro", "Precio", "Tarjeta", "Acceso hasta"]);
assert.equal(filasEstado(sPrueba)[0][1], "Semana gratis");
assert.equal(puedeCancelar(sPrueba), true);
assert.match(notaEstado(sPrueba), /no se cobra nada/);
assert.match(textoConfirmar(sPrueba), /^¿Cancelar tu suscripción\? No se hará ningún cobro y conservas el acceso hasta el 27 de noviembre de 2026\.$/);
const sCancel = { ...sPrueba, estado: "canceled", proximoCobro: null, pruebaHasta: null, canceladaEl: "2026-11-21T15:00:00Z" };
assert.equal(puedeCancelar(sCancel), false, "cancelada: sin botón");
assert.deepEqual(filasEstado(sCancel).map((f) => f[0]), ["Estado", "Tarjeta", "Cancelada el", "Acceso hasta"]);
assert.match(notaEstado(sCancel), /Conservas el acceso hasta el 27 de noviembre/);
assert.match(notaEstado({ ...sPrueba, estado: "past_due" }), /no pasó/);
assert.match(textoCancelada("2026-11-27T15:00:00Z"), /conservas el acceso hasta el 27 de noviembre de 2026/);
assert.deepEqual(filasEstado(null), []);
const store = (obj) => ({ length: Object.keys(obj).length, key: (i) => Object.keys(obj)[i], getItem: (k) => obj[k] });
const t0 = Date.parse("2026-11-20T15:00:00Z");
assert.deepEqual(sesionGuardada(store({ "sb-abc-auth-token": JSON.stringify({ access_token: "at", expires_at: t0 / 1000 + 3600, user: { email: "a@x.pe" } }) }), t0), { token: "at", email: "a@x.pe" });
assert.equal(sesionGuardada(store({ "sb-abc-auth-token": JSON.stringify({ access_token: "at", expires_at: t0 / 1000 + 30 }) }), t0), null, "por vencer: se pide iniciar sesión (no se refresca)");
assert.equal(sesionGuardada(store({ otra: "{}" }), t0), null);
assert.equal(sesionGuardada({ get length() { throw new Error("bloqueado"); } }, t0), null, "sin almacenamiento");

// estadoPublico: sin ids de Culqi ni bin; la cancelada solo mientras dure el acceso.
const filaViva = { status: "active", con_prueba: true, culqi_subscription_id: "sxn_test_9", culqi_card_id: "crd_test_9", culqi_customer_id: "cus_test_9", card_bin: "411111", card_brand: "Visa", card_last4: "1111", next_billing_at: "2026-12-27T15:00:00Z" };
const pub = estadoPublico(filaViva, "2026-12-27T15:00:00Z", t0);
assert.equal(pub.estado, "active");
assert.equal(pub.proximoCobro, "2026-12-27T15:00:00Z");
assert.doesNotMatch(JSON.stringify(pub), /sxn_|crd_|cus_|411111/, "sin ids internos ni bin");
assert.equal(estadoPublico({ ...filaViva, status: "canceled" }, "2026-01-01T00:00:00Z", t0), null, "cancelada y vencida: nada que mostrar");
assert.equal(estadoPublico({ ...filaViva, status: "canceled" }, "2026-12-27T15:00:00Z", t0).proximoCobro, null);

// ── Mundo simulado: Culqi, Supabase (PostgREST y Auth) y Resend ─────────────────────
const SUPA = "https://mock.supabase.co";
const ENV = {
  SUPABASE_URL: SUPA, SUPABASE_SERVICE_ROLE_KEY: "svc", SUPABASE_PUBLISHABLE_KEY: "anon", CULQI_SECRET_KEY: "sk_test_mock",
  CULQI_PLAN_PRUEBA_ID: "pln_test_prueba", CULQI_PLAN_MENSUAL_ID: "pln_test_mensual", TIENDA_SUSCRIPCION_ENABLED: "1",
  RESEND_API_KEY: "re_mock", NOTIFY_FROM_EMAIL: "hola@evolvapp.club", NOTIFY_APP_URL: "https://evolvapp.club",
};
const E = env(ENV);

function fakeWorld() {
  const w = {
    tables: { subscriptions: [], user_entitlements: [], billing_events: [], subscription_charges: [], notification_log: [], profiles: [] },
    users: [], culqi: { customers: [], cards: [], subs: [], events: {}, deleted: [] }, sessions: {}, mails: [],
    logAccepts: true, resendStatus: 200,
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
    const u = new URL(url);
    if (u.origin === "https://api.resend.com") {
      if (w.resendStatus !== 200) return json(w.resendStatus, { message: "rate" });
      w.mails.push({ ...body, idem: init.headers["Idempotency-Key"] });
      return json(200, { id: "re_" + w.mails.length });
    }
    if (u.origin === "https://api.culqi.com") {
      const c = w.culqi;
      if (u.pathname === "/v2/customers" && method === "GET") return json(200, { data: c.customers.filter((x) => x.email === u.searchParams.get("email")) });
      if (u.pathname === "/v2/customers" && method === "POST") { const x = { object: "customer", id: id("cus_test_"), email: body.email }; c.customers.push(x); return json(201, x); }
      if (u.pathname === "/v2/cards" && method === "POST") { const x = { object: "card", id: id("crd_test_"), source: { last_four: "1111", iin: { bin: "411111", card_brand: "Visa" } } }; c.cards.push(x); return json(201, x); }
      if (u.pathname === "/v2/recurrent/subscriptions/create") {
        const now = Date.now();
        const x = { id: id("sxn_test_"), status: 2, trial_start: now, trial_end: now + 7 * DAY, next_billing_date: now + 7 * DAY };
        c.subs.push(x); return json(201, x);
      }
      let m = u.pathname.match(/^\/v2\/recurrent\/subscriptions\/(sxn_test_\w+)$/);
      if (m && method === "GET") { const x = c.subs.find((s) => s.id === m[1]); return x ? json(200, x) : json(404, {}); }
      if (m && method === "DELETE") { c.deleted.push(m[1]); return json(200, { deleted: true }); }
      m = u.pathname.match(/^\/v2\/events\/(evt_test_\w+)$/);
      if (m) return c.events[m[1]] ? json(200, c.events[m[1]]) : json(404, {});
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
        if (t === "notification_log" && !w.logAccepts) return json(400, { message: "violates check constraint notification_log_notification_type_check" });
        const pk = { billing_events: "stripe_event_id", subscription_charges: "charge_ref", notification_log: "idempotency_key" }[t];
        if (pk && rows.some((r) => r[pk] === body[pk])) return prefer.includes("ignore-duplicates") ? json(201, []) : json(409, { message: "duplicate" });
        const row = { id: crypto.randomUUID(), created_at: new Date(Date.now() + rows.length).toISOString(), ...body };
        rows.push(row);
        return json(201, prefer.includes("return=representation") ? [row] : null);
      }
      if (method === "PATCH") { rows.filter((r) => matches(r, params)).forEach((r) => Object.assign(r, body)); return json(200, null); }
    }
    throw new Error("red no simulada: " + method + " " + url);
  };
  return w;
}

function res() {
  return { statusCode: 0, payload: null, headers: {}, status(c) { this.statusCode = c; return this; }, json(o) { this.payload = o; return this; }, setHeader(k, v) { this.headers[k] = v; } };
}
const post = (body, headers) => ({ method: "POST", headers: headers || {}, body: JSON.stringify(body) });
const get = (headers) => ({ method: "GET", headers: headers || {} });
async function run(fn, req, e = E) { const r = res(); await fn(req, r, e); return r; }
const ok = { tokenId: "tkn_test_abc123", email: "ana@example.com", firstName: "Ana", lastName: "Pérez", phone: "999888777", address: "Av. Arequipa 123", city: "Lima", acceptTerms: true, acceptRenewal: true };
const realFetch = globalThis.fetch;
const quiet = console.error;
console.error = () => {};
const subjects = (w) => w.mails.map((m) => m.subject);

try {
  // ── Ciclo completo de correos ───────────────────────────────────────────────────
  let w = fakeWorld(); globalThis.fetch = w.fetch;
  let r = await run(inscribir, post(ok));
  assert.equal(r.payload.ok, true);
  assert.equal(w.mails.length, 1, "inicio de la prueba");
  assert.match(w.mails[0].subject, /semana gratis en Evolv empezó/);
  assert.equal(w.mails[0].to, "ana@example.com");
  assert.equal(w.mails[0].from, "hola@evolvapp.club");
  const fila = w.tables.subscriptions[0];
  const sxn = fila.culqi_subscription_id;
  assert.equal(w.mails[0].idem, `sub:${sxn}:prueba`, "Resend recibe la misma clave");
  const log0 = w.tables.notification_log[0];
  assert.deepEqual([log0.notification_type, log0.idempotency_key, log0.status, log0.user_id], ["subscription", `sub:${sxn}:prueba`, "sent", fila.user_id]);

  const evento = (idEv, type, data) => { w.culqi.events[idEv] = { object: "event", id: idEv, type, data }; };
  // Cobro fallido: un solo aviso por cobro vencido, aunque Culqi reintente.
  evento("evt_test_f1", "subscription.charge.failed", { subscription_id: sxn });
  evento("evt_test_f2", "subscription.charge.failed", { subscription_id: sxn });
  await run(webhook, post({ id: "evt_test_f1" }));
  await run(webhook, post({ id: "evt_test_f2" }));
  assert.equal(subjects(w).filter((s) => /No pudimos cobrar/.test(s)).length, 1, "un aviso de cobro fallido por cobro");
  assert.equal(fila.status, "past_due");

  // Recibo por cada cobro, una vez aunque el evento o el cobro se repitan.
  evento("evt_test_ok1", "subscription.charge.succeeded", { object: "charge", id: "chr_test_m1", amount: 2990, currency_code: "PEN", metadata: { subscription: sxn } });
  evento("evt_test_ok1b", "subscription.charge.succeeded", { object: "charge", id: "chr_test_m1", metadata: { subscription: sxn } });
  await run(webhook, post({ id: "evt_test_ok1" }));
  await run(webhook, post({ id: "evt_test_ok1" }));
  await run(webhook, post({ id: "evt_test_ok1b" }));
  const recibos = w.mails.filter((m) => /Recibo/.test(m.subject));
  assert.equal(recibos.length, 1, "un recibo por cobro");
  assert.equal(recibos[0].idem, `sub:${sxn}:recibo:chr_test_m1`);
  assert.match(recibos[0].html, /S\/ 29\.90 a Visa •••• 1111/);
  evento("evt_test_ok2", "subscription.charge.succeeded", { object: "charge", id: "chr_test_m2", metadata: { subscription: sxn } });
  await run(webhook, post({ id: "evt_test_ok2" }));
  assert.equal(w.mails.filter((m) => /Recibo/.test(m.subject)).length, 2, "el segundo mes trae su recibo");

  // ── Estado (Perfil y /cuenta) ─────────────────────────────────────────────────
  const userId = fila.user_id;
  w.sessions.tok = { id: userId, email: "ana@example.com" };
  assert.equal((await run(estado, get())).statusCode, 401, "estado exige sesión");
  assert.equal((await run(estado, post({}, { authorization: "Bearer tok" }))).statusCode, 405);
  r = await run(estado, get({ authorization: "Bearer tok" }));
  assert.equal(r.statusCode, 200);
  assert.equal(r.headers["Cache-Control"], "no-store");
  const s = r.payload.suscripcion;
  assert.equal(s.estado, "active");
  assert.deepEqual(s.tarjeta, { marca: "Visa", ultimos4: "1111" });
  assert.equal(s.monto, "S/ 29.90");
  assert.ok(s.accesoHasta && new Date(s.accesoHasta) > new Date(Date.now() + 60 * DAY), "acceso: prueba + 2 meses");
  assert.doesNotMatch(JSON.stringify(r.payload), /sxn_|crd_|cus_|411111/, "sin ids de Culqi ni bin");
  w.sessions.otro = { id: crypto.randomUUID(), email: "otro@example.com" };
  assert.equal((await run(estado, get({ authorization: "Bearer otro" }))).payload.suscripcion, null, "cada persona ve solo la suya");

  // ── Cancelar desde la cuenta: sin más cobros, acceso hasta el fin y un correo ──
  const hastaAntes = s.accesoHasta;
  r = await run(cancelar, post({}, { authorization: "Bearer tok" }));
  assert.equal(r.statusCode, 200);
  assert.equal(r.payload.accesoHasta, hastaAntes, "el acceso dura hasta el fin del período");
  assert.deepEqual(w.culqi.deleted, [sxn], "Culqi cancela: no hay más cobros");
  assert.ok(w.tables.user_entitlements.every((x) => x.status === "active"), "cancelar no corta el acceso");
  assert.equal(subjects(w).filter((t) => /Cancelaste/.test(t)).length, 1);
  // Culqi confirma la cancelación por webhook: no se repite el correo.
  evento("evt_test_c1", "subscription.cancel.succeeded", { subscription_id: sxn });
  await run(webhook, post({ id: "evt_test_c1" }));
  assert.equal(subjects(w).filter((t) => /Cancelaste/.test(t)).length, 1, "un solo correo de cancelación");
  r = await run(estado, get({ authorization: "Bearer tok" }));
  assert.equal(r.payload.suscripcion.estado, "canceled", "cancelada con acceso vigente: se sigue viendo");
  assert.equal(r.payload.suscripcion.proximoCobro, null);
  assert.equal(r.payload.suscripcion.accesoHasta, hastaAntes);
  assert.equal(new Set(w.tables.notification_log.map((l) => l.idempotency_key)).size, w.tables.notification_log.length);
  assert.ok(w.tables.notification_log.every((l) => l.status === "sent" && l.notification_type === "subscription"));

  // Cancelación hecha por Culqi (cobros fallidos): también avisa, una vez.
  w = fakeWorld(); globalThis.fetch = w.fetch;
  await run(inscribir, post(ok));
  const sxn2 = w.tables.subscriptions[0].culqi_subscription_id;
  w.culqi.events.evt_test_c2 = { object: "event", id: "evt_test_c2", type: "subscription.cancel.succeeded", data: { subscription_id: sxn2 } };
  await run(webhook, post({ id: "evt_test_c2" }));
  assert.deepEqual(subjects(w).map((t) => /Cancelaste/.test(t)), [false, true]);

  // Resend falla: el intento queda en error y el siguiente evento lo reintenta.
  w = fakeWorld(); globalThis.fetch = w.fetch;
  w.resendStatus = 429;
  r = await run(inscribir, post(ok));
  assert.equal(r.payload.ok, true, "un correo que falla no rompe la inscripción");
  assert.equal(w.tables.notification_log[0].status, "error");
  w.resendStatus = 200;
  const filaR = w.tables.subscriptions[0];
  assert.equal(await enviarCorreoSuscripcion(E, { userId: filaR.user_id, email: filaR.email, key: `sub:${filaR.culqi_subscription_id}:prueba`, msg: correos.prueba }), "sent", "se reintenta lo que falló");
  assert.equal(await enviarCorreoSuscripcion(E, { userId: filaR.user_id, email: filaR.email, key: `sub:${filaR.culqi_subscription_id}:prueba`, msg: correos.prueba }), "already", "y no se repite");
  assert.equal(w.mails.length, 1);

  // Sin el SQL (CHECK sin `subscription`) o sin Resend: no se envía, el flujo sigue.
  w = fakeWorld(); globalThis.fetch = w.fetch;
  w.logAccepts = false;
  r = await run(inscribir, post(ok));
  assert.equal(r.payload.ok, true);
  assert.equal(w.mails.length, 0, "sin registro de idempotencia no se envía");
  w = fakeWorld(); globalThis.fetch = w.fetch;
  r = await run(inscribir, post(ok), env({ ...ENV, RESEND_API_KEY: "" }));
  assert.equal(r.payload.ok, true);
  assert.deepEqual([w.mails.length, w.tables.notification_log.length], [0, 0]);

  // Estado sin supabase/suscripciones.sql: suscripción nula, Perfil sigue con el plan.
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return { ok: true, status: 200, json: async () => ({ id: "u1" }) };
    return { ok: false, status: 404, json: async () => ({ message: "relation does not exist" }) };
  };
  assert.deepEqual((await run(estado, get({ authorization: "Bearer x" }))).payload, { suscripcion: null });

  // Ruta: /api/suscripcion/estado → /api/checkout?op=suscripcion-estado.
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v;
  w = fakeWorld(); globalThis.fetch = w.fetch;
  const viaRouter = res();
  await checkout({ method: "GET", headers: {}, query: { op: "suscripcion-estado" } }, viaRouter);
  assert.equal(viaRouter.statusCode, 401, "la ruta llega al estado");
} finally {
  globalThis.fetch = realFetch;
  console.error = quiet;
}

// ── Cron: aviso 2 días antes del primer cobro y REQ-351 sin suscriptores ───────────
// 10:00 en Lima = 15:00 UTC.
const NOW = new Date("2026-11-20T15:00:00Z");
const at = (h) => new Date(NOW.getTime() + h * H).toISOString();
assert.equal(subscriptionNoticeDue({ status: "trialing", next_billing_at: at(40) }, NOW), true);
assert.equal(subscriptionNoticeDue({ status: "trialing", next_billing_at: at(50) }, NOW), false, "más de 2 días: todavía no");
assert.equal(subscriptionNoticeDue({ status: "trialing", next_billing_at: at(-1) }, NOW), false, "ya pasó");
assert.equal(subscriptionNoticeDue({ status: "active", next_billing_at: at(40) }, NOW), false, "solo antes del primer cobro");
assert.equal(subscriptionNoticeDue({ status: "trialing", next_billing_at: at(40) }, new Date("2026-11-20T08:00:00Z")), false, "03:00 en Lima: fuera de horario");

const NE = { url: SUPA, service: "svc", resendKey: "re_mock", fromEmail: "hola@evolvapp.club", appUrl: "https://evolvapp.club" };
function cronWorld() {
  const w = { log: new Map(), mails: [] };
  const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  w.subs = [
    { id: "s-a", user_id: "u-a", email: "a@example.com", status: "trialing", culqi_subscription_id: "sxn_test_a", card_brand: "Visa", card_last4: "1111", next_billing_at: at(40) },
    { id: "s-b", user_id: null, email: "b@example.com", status: "trialing", culqi_subscription_id: "sxn_test_b", next_billing_at: at(30) },
  ];
  globalThis.fetch = async (url, opts = {}) => {
    const u = decodeURIComponent(String(url));
    const method = opts.method || "GET";
    if (u.startsWith(SUPA + "/rest/v1/subscriptions?status=eq.trialing")) return json(200, w.subs);
    if (u.startsWith(SUPA + "/rest/v1/subscriptions?user_id=eq.")) return json(200, u.includes("u-sub") ? [{ id: "s-x" }] : []);
    if (u.startsWith(SUPA + "/rest/v1/user_entitlements?origin=eq.checkout")) {
      return json(200, [{ id: "e-sub", user_id: "u-sub", plan_id: "monthly", expires_at: at(50) }, { id: "e-uno", user_id: "u-uno", plan_id: "monthly", expires_at: at(50) }]);
    }
    if (u.startsWith(SUPA + "/rest/v1/user_entitlements?user_id=eq.")) return json(200, []);
    if (u.startsWith(SUPA + "/rest/v1/profiles?id=eq.")) return json(200, [{ email: u.match(/id=eq\.([^&]+)/)[1] + "@example.com", active: true }]);
    if (u.startsWith(SUPA + "/rest/v1/notification_log?idempotency_key=in.(")) {
      const key = u.match(/in\.\((.*)\)&/)[1];
      const row = w.log.get(key);
      return json(200, row ? [{ id: row.id, status: row.status, idempotency_key: key }] : []);
    }
    if (u === SUPA + "/rest/v1/notification_log" && method === "POST") {
      const body = JSON.parse(opts.body);
      const id = "log-" + (w.log.size + 1);
      w.log.set(body.idempotency_key, { id, status: "pending", type: body.notification_type });
      return json(201, [{ id }]);
    }
    if (u.startsWith(SUPA + "/rest/v1/notification_log?id=eq.") && method === "PATCH") {
      const id = u.match(/id=eq\.(.+)$/)[1];
      for (const row of w.log.values()) if (row.id === id) row.status = JSON.parse(opts.body).status;
      return json(204, {});
    }
    if (u === "https://api.resend.com/emails") { w.mails.push({ ...JSON.parse(opts.body), idem: opts.headers["Idempotency-Key"] }); return json(200, { id: "re_" + w.mails.length }); }
    throw new Error("fetch inesperado: " + method + " " + u);
  };
  return w;
}
try {
  let w = cronWorld();
  let results = { log: [] };
  await runSubscriptionNotices(NE, false, results, NOW);
  assert.equal(w.mails.length, 1, "avisa a quien tiene cuenta; sin cuenta no hay registro posible");
  assert.equal(w.mails[0].to, "a@example.com");
  assert.equal(w.mails[0].idem, "sub:sxn_test_a:aviso_cobro");
  assert.match(w.mails[0].subject, /primer cobro de Evolv es el 22 de noviembre/);
  assert.equal(w.log.get("sub:sxn_test_a:aviso_cobro").type, "subscription");
  results = { log: [] };
  await runSubscriptionNotices(NE, false, results, new Date(NOW.getTime() + H));
  assert.equal(w.mails.length, 1, "la hora siguiente no repite el aviso");

  // REQ-351: quien tiene una suscripción viva no recibe el aviso de vencimiento.
  w = cronWorld();
  results = { log: [] };
  await runPlanExpiry(NE, false, results, NOW);
  assert.deepEqual(w.mails.map((m) => m.to), ["u-uno@example.com"], "solo el pago único recibe el aviso");
  assert.ok(results.log.some((l) => l.user === "u-sub" && l.action === "subscription"));

  // Sin la tabla de suscripciones: nada que avisar y el cron sigue.
  globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({ message: "no existe" }) });
  results = { log: [] };
  await runSubscriptionNotices(NE, false, results, NOW);
  assert.ok(results.log.some((l) => l.action === "subscription_list_unavailable"));
} finally {
  globalThis.fetch = realFetch;
}

// ── Cableado: rutas, páginas, Perfil y documentos ─────────────────────────────────
const vercel = JSON.parse(read("vercel.json"));
assert.ok(vercel.rewrites.some((x) => x.source === "/api/suscripcion/estado" && x.destination === "/api/checkout?op=suscripcion-estado"));
const idxEstado = vercel.rewrites.findIndex((x) => x.source === "/api/suscripcion/estado");
assert.ok(idxEstado < vercel.rewrites.findIndex((x) => x.source === "/api/suscripcion"), "la ruta específica va antes");
assert.ok(vercel.rewrites.some((x) => x.source === "/cuenta" && x.destination === "/cuenta/index.html"));
assert.match(read(".vercelignore"), /^!\/cuenta$/m, "la página /cuenta se publica");
const cuenta = read("cuenta/index.html");
assert.match(cuenta, /\/api\/suscripcion\/estado/);
assert.match(cuenta, /\/api\/suscripcion\/cancelar/);
assert.match(cuenta, /grant_type=password/, "se entra con la cuenta de Evolv");
assert.doesNotMatch(cuenta, /grant_type=refresh_token/, "no rota la sesión de la app");
assert.doesNotMatch(cuenta, /localStorage\.setItem/, "no guarda la sesión de esta página");
const app = read("app/index.html");
assert.match(app, /function recurringSubscriptionHtml\(/);
assert.match(app, /onclick="openCancelSubscription\(\)">Cancelar suscripción</);
assert.match(app, /apiFetch\("\/api\/checkout\?op=suscripcion-estado"/, "la app usa la ruta que admite js\/api-client.js");
assert.match(app, /apiFetch\("\/api\/checkout\?op=suscripcion-cancelar"/);
assert.match(app, /if\(recurringSub\)return recurringSubscriptionHtml\(\)\+billingHistorySectionHtml\(\);/, "con suscripción no se ofrece \"Renovar plan\"");
assert.equal((app.match(/resetRecurringSubscription\(\);/g) || []).length, 2, "se limpia al cambiar de cuenta");
assert.match(read("registro/index.html"), /Perfil|cuenta/);

// ── SQL: idempotente, agrega `subscription` y conserva los tipos anteriores ─────────
const db = new PGlite();
await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql as $$ select null::uuid $$;`);
for (const f of ["notifications.sql", "push_subscriptions.sql", "notifications_journey.sql", "notifications_morning.sql", "notifications_plan_expiry.sql", "whatsapp.sql"]) {
  await db.exec(read("supabase/" + f));
}
const sql = read("supabase/notifications_subscription.sql");
await db.exec(sql);
await db.exec(sql); // idempotente
const uid = "00000000-0000-0000-0000-000000000001";
await db.query("insert into auth.users(id) values ($1)", [uid]);
const ins = (type, key) => db.query("insert into notification_log(user_id, notification_type, reference_date, idempotency_key) values ($1,$2,'2026-11-22',$3)", [uid, type, key]);
await ins("subscription", "sub:sxn_test_1:prueba");
for (const t of ["nutrition", "training", "push_streak", "comeback", "push_comeback", "push_last_call", "morning", "push_morning", "plan_expiry", "whatsapp"]) await ins(t, "k-" + t);
await assert.rejects(ins("subscription", "sub:sxn_test_1:prueba"), /duplicate|unique/i, "cada correo una sola vez");
await assert.rejects(ins("otro", "k-otro"), /check/i);
assert.equal((await db.query("select relrowsecurity from pg_class where relname='notification_log'")).rows[0].relrowsecurity, true);

console.log("  ✓ gestión de la suscripción (REQ-357): estado, cancelación, /cuenta, correos únicos, aviso previo y SQL");
