// REQ-331..334: tienda web con Culqi y Libro de Reclamaciones.
// Sin red ni producción: fetch simulado para Culqi/Supabase/Resend y PGlite para el SQL.
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PLANES_TIENDA, planPorId, formatoSoles, MONEDA } from "../tienda/planes.js";
import { COMERCIO, esMarcador } from "../tienda/comercio.js";
import { parseCompra, chargeBody, interpretCharge } from "../api/_tienda/culqi-charge.js";
import { parseHoja, hojaRows } from "../api/_tienda/reclamaciones.js";
import checkout from "../api/checkout.js";

// Los handlers de la tienda se ejecutan a través de /api/checkout (rewrites de vercel.json):
// uno por req.query (Vercel) y otro por la URL, para cubrir ambas formas.
const charge = (rq, rs) => checkout({ ...rq, query: { op: "culqi" } }, rs);
const reclamaciones = (rq, rs) => checkout({ ...rq, url: "/api/checkout?op=reclamaciones" }, rs);

const ROOT = new URL("..", import.meta.url).pathname;
const read = (p) => fs.readFileSync(ROOT + p, "utf8");

// ── Catálogo: precios en soles, ids con FK válida, imagen y descripción ─────────
assert.equal(MONEDA, "PEN");
assert.deepEqual(PLANES_TIENDA.map((p) => p.id), ["monthly", "quarterly", "semiannual"]);
const entitlementsSql = read("supabase/entitlements.sql");
for (const p of PLANES_TIENDA) {
  assert.ok(Number.isInteger(p.montoCentimos) && p.montoCentimos >= 300, p.id + ": monto en céntimos (mínimo de Culqi 3DS)");
  assert.ok(entitlementsSql.includes("'" + p.id + "'"), p.id + " debe existir en subscription_plans (FK de user_entitlements)");
  assert.ok(fs.existsSync(ROOT + p.imagen.slice(1)), p.id + ": falta la imagen " + p.imagen);
  // REQ-342: imagen que muestra el servicio (scripts/build-plan-images.mjs), no solo la duración.
  assert.match(p.imagen, /^\/assets\/planes\/[a-z]+\.webp$/, p.id + ": la imagen sale de scripts/build-plan-images.mjs");
  assert.match(p.imagenAlt || "", /comida|desayuno|entreno|ciclo|progreso/i, p.id + ": el texto alternativo describe lo que se ve");
  assert.ok(p.descripcion.length > 40 && p.incluye.length >= 3, p.id + ": descripción e items visibles");
}
assert.equal(formatoSoles(2990), "S/ 29.90");
assert.equal(planPorId("semiannual").duracionDias, 180);
assert.equal(planPorId("annual"), null);

// ── Páginas: existen, se enlazan desde la portada y llevan pie con el Libro ─────
const PAGINAS = ["planes", "pago", "terminos", "devoluciones", "privacidad", "contacto", "libro-de-reclamaciones"];
const vercel = JSON.parse(read("vercel.json"));
const index = read("index.html");
for (const p of PAGINAS) {
  const html = read(p + "/index.html");
  assert.match(html, /<footer id="t-footer"><\/footer>/, p + ": falta el pie común (datos del comercio y Libro)");
  assert.match(html, /mountLayout\(\)/, p + ": falta montar cabecera y pie");
  assert.ok(vercel.rewrites.some((r) => r.source === "/" + p && r.destination === "/" + p + "/index.html"), p + ": falta la ruta limpia en vercel.json");
  if (p !== "pago") assert.ok(index.includes('href="/' + p + '"'), p + ": la portada debe enlazarla en el pie");
}
for (const [source, op] of [["/api/culqi-charge", "culqi"], ["/api/reclamaciones", "reclamaciones"]]) {
  assert.ok(vercel.rewrites.some((r) => r.source === source && r.destination === "/api/checkout?op=" + op), source + ": falta la reescritura a /api/checkout");
}
// Plan Hobby de Vercel: máximo 12 funciones por deploy (el PR #93 falló por pasarlo).
const funciones = fs.readdirSync(ROOT + "api").filter((f) => f.endsWith(".js") && !f.startsWith("_"));
assert.ok(funciones.length <= 12, "Vercel Hobby admite 12 funciones y hay " + funciones.length + ": " + funciones.join(", "));
assert.match(read("tienda/layout.js"), /href="\/libro-de-reclamaciones">\$\{LIBRO_ICONO\}/, "el pie muestra el ícono del Libro de Reclamaciones");
const marcadores = Object.entries(COMERCIO).filter(([, v]) => esMarcador(v)).map(([k]) => k);
if (marcadores.length) console.warn("  ⚠ tienda/comercio.js tiene datos por completar antes de reenviar a Culqi: " + marcadores.join(", "));

// ── Utilidades de prueba de handlers ──────────────────────────────────────────
function req(body) { return { method: "POST", headers: {}, body: JSON.stringify(body) }; }
function res() {
  return { statusCode: 0, payload: null, status(c) { this.statusCode = c; return this; }, json(o) { this.payload = o; return this; } };
}
const json = (status, obj) => ({ ok: status >= 200 && status < 300, status, json: async () => obj });
process.env.SUPABASE_URL = "https://mock.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
process.env.CULQI_SECRET_KEY = "sk_test_mock";
process.env.RESEND_API_KEY = "re_mock";

// ── /api/culqi-charge: validación y cuerpo del cargo ─────────────────────────────
const compra = { planId: "quarterly", tokenId: "tkn_test_abc123", email: " Ana@Example.com ", firstName: "Ana", lastName: "Pérez", phone: "999 888 777", deviceId: "dev-1", acceptTerms: true };
let parsed = parseCompra(compra);
assert.deepEqual(parsed.errors, []);
assert.equal(parsed.data.email, "ana@example.com");
let body = chargeBody(parsed.data);
assert.equal(body.amount, 7990, "el monto sale del catálogo del servidor");
assert.equal(body.currency_code, "PEN");
assert.equal(body.source_id, "tkn_test_abc123");
assert.equal(body.antifraud_details.phone_number, "999888777");
assert.equal(body.antifraud_details.device_finger_print_id, "dev-1");
assert.equal(body.authentication_3DS, undefined);
assert.equal(chargeBody(parseCompra({ ...compra, amount: 1, montoCentimos: 1 }).data).amount, 7990, "el navegador no puede cambiar el precio");
assert.match(parseCompra({ ...compra, acceptTerms: false }).errors[0], /acepta los Términos/);
assert.match(parseCompra({ ...compra, planId: "annual" }).errors[0], /no existe/);
assert.match(parseCompra({ ...compra, tokenId: "x" }).errors[0], /tarjeta/);
const con3ds = parseCompra({ ...compra, authentication3DS: { eci: "05", xid: "x1", cavv: "c1", protocolVersion: "2.1.0", directoryServerTransactionId: "d1", otro: "no" } });
assert.deepEqual(chargeBody(con3ds.data).authentication_3DS, { eci: "05", xid: "x1", cavv: "c1", protocolVersion: "2.1.0", directoryServerTransactionId: "d1" });

assert.deepEqual(interpretCharge(201, { object: "charge", id: "chr_test_1" }), { result: "paid", chargeId: "chr_test_1" });
assert.equal(interpretCharge(200, { action_code: "REVIEW", user_message: "..." }).result, "needs3ds");
const rechazo = interpretCharge(402, { object: "error", type: "card_error", user_message: "Tu tarjeta no tiene fondos suficientes." });
assert.equal(rechazo.result, "declined");
assert.equal(rechazo.error, "Tu tarjeta no tiene fondos suficientes.");

// ── /api/culqi-charge: escenarios con fetch simulado ─────────────────────────────
function mockChargeFetch(sc) {
  const calls = { culqi: [], entitlements: [], billing: [], invites: 0, mails: [] };
  globalThis.fetch = async (url, opts = {}) => {
    if (url === "https://api.culqi.com/v2/charges") {
      const b = JSON.parse(opts.body);
      calls.culqi.push({ auth: opts.headers.Authorization, body: b });
      if (sc.culqi === "3ds" && !b.authentication_3DS) return json(200, { action_code: "REVIEW", user_message: "Autentica" });
      if (sc.culqi === "declined") return json(402, { object: "error", user_message: "Tarjeta rechazada." });
      return json(201, { object: "charge", id: "chr_test_99", amount: b.amount, outcome: { type: "venta_exitosa" } });
    }
    if (url.includes("/rest/v1/profiles?email=eq.")) return json(200, sc.profile ? [{ id: "user-1" }] : []);
    if (url.includes("/auth/v1/admin/users?page=")) return json(200, { users: [] });
    if (url.includes("/auth/v1/invite")) { calls.invites += 1; return json(200, { id: "user-new" }); }
    if (url.includes("/rest/v1/user_entitlements?payment_ref=")) return json(200, []);
    if (url.includes("/rest/v1/user_entitlements?user_id=")) return json(200, sc.activeUntil ? [{ expires_at: sc.activeUntil }] : []);
    if (url.endsWith("/rest/v1/user_entitlements") && opts.method === "POST") {
      const b = JSON.parse(opts.body);
      calls.entitlements.push(b);
      if (sc.grantFails) return json(400, { message: "boom" });
      return json(201, [{ id: "ent-1", ...b }]);
    }
    if (url.endsWith("/rest/v1/billing_events")) { calls.billing.push(JSON.parse(opts.body)); return json(201, {}); }
    if (url === "https://api.resend.com/emails") { calls.mails.push(JSON.parse(opts.body)); return json(200, {}); }
    throw new Error("fetch inesperado: " + url);
  };
  return calls;
}

let calls = mockChargeFetch({ profile: true });
let r = res();
await charge(req(compra), r);
assert.equal(r.statusCode, 200);
assert.deepEqual([r.payload.ok, r.payload.cuenta, r.payload.operacion], [true, "existente", "chr_test_99"]);
assert.equal(calls.culqi[0].auth, "Bearer sk_test_mock");
assert.equal(calls.entitlements[0].user_id, "user-1");
assert.equal(calls.entitlements[0].payment_ref, "chr_test_99");
assert.equal(calls.entitlements[0].origin, "checkout");
assert.equal(calls.invites, 0);
assert.equal(calls.billing[0].provider, "culqi");
assert.equal(calls.billing[0].status, "processed");
assert.equal(calls.mails[0].to, "ana@example.com");

// Con acceso vigente, los 90 días se suman desde el vencimiento (no se pierden días pagados).
const vence = new Date(Date.now() + 10 * 86400000).toISOString();
calls = mockChargeFetch({ profile: true, activeUntil: vence });
await charge(req(compra), res());
assert.equal(calls.entitlements[0].starts_at, vence);
assert.equal(Date.parse(calls.entitlements[0].expires_at) - Date.parse(vence), 90 * 86400000);

// Sin cuenta: se invita y el plan queda activo en la cuenta nueva (la beta no se abre).
calls = mockChargeFetch({ profile: false });
r = res();
await charge(req(compra), r);
assert.equal(r.payload.cuenta, "invitada");
assert.equal(calls.invites, 1);
assert.equal(calls.entitlements[0].user_id, "user-new");

// 3DS: primero pide autenticación; el segundo intento lleva authentication_3DS.
calls = mockChargeFetch({ profile: true, culqi: "3ds" });
r = res();
await charge(req(compra), r);
assert.deepEqual([r.statusCode, r.payload.needs3ds], [200, true]);
assert.equal(calls.entitlements.length, 0, "sin cobro no hay acceso");
r = res();
await charge(req({ ...compra, authentication3DS: { eci: "05", xid: "x", cavv: "c" } }), r);
assert.equal(r.payload.ok, true);
assert.deepEqual(calls.culqi[1].body.authentication_3DS, { eci: "05", xid: "x", cavv: "c" });

// Rechazo: mensaje de Culqi a la persona, sin acceso ni registro de cobro.
calls = mockChargeFetch({ profile: true, culqi: "declined" });
r = res();
await charge(req(compra), r);
assert.deepEqual([r.statusCode, r.payload.error], [402, "Tarjeta rechazada."]);
assert.equal(calls.entitlements.length + calls.billing.length, 0);

// Cobrado pero sin poder dar acceso: nunca se muestra error tras pagar; queda registrado para resolverlo.
calls = mockChargeFetch({ profile: true, grantFails: true });
r = res();
await charge(req(compra), r);
assert.deepEqual([r.statusCode, r.payload.ok, r.payload.cuenta], [200, true, "pendiente"]);
assert.equal(calls.billing[0].status, "failed");

// Validación antes de cobrar y sin llaves configuradas.
calls = mockChargeFetch({ profile: true });
r = res();
await charge(req({ ...compra, acceptTerms: false }), r);
assert.equal(r.statusCode, 400);
assert.equal(calls.culqi.length, 0);
delete process.env.CULQI_SECRET_KEY;
r = res();
await charge(req(compra), r);
assert.equal(r.statusCode, 503);
process.env.CULQI_SECRET_KEY = "sk_test_mock";

// ── /api/reclamaciones ─────────────────────────────────────────────────────────
const hoja = { tipo: "reclamo", nombre: "Ana Pérez", tipoDocumento: "DNI", numeroDocumento: "12345678", email: "ana@example.com", bienDescripcion: "Plan mensual", montoReclamado: "29,90", detalle: "Me cobraron dos veces el plan.", pedido: "Devolver el cobro duplicado." };
let h = parseHoja(hoja);
assert.deepEqual(h.errors, []);
assert.equal(h.data.montoReclamado, 29.9);
// INDECOPI sancionó exigir correo y domicilio a la vez: basta un medio de contacto.
assert.deepEqual(parseHoja({ ...hoja, email: "", telefono: "999888777" }).errors, []);
assert.match(parseHoja({ ...hoja, email: "" }).errors[0], /al menos un medio/);
assert.match(parseHoja({ ...hoja, menorEdad: true }).errors[0], /apoderado/);
assert.match(parseHoja({ ...hoja, tipo: "otro" }).errors[0], /reclamo o una queja/);
assert.match(parseHoja({ ...hoja, numeroDocumento: "12" }).errors[0], /documento/);

const filas = hojaRows({ codigo: "EVOLV-LR-000001", created_at: "2026-11-02T15:00:00Z", nombre: "Ana", tipo_documento: "DNI", numero_documento: "1", bien_tipo: "servicio", bien_descripcion: "Plan", monto_reclamado: null, tipo: "queja", detalle: "d", pedido: "p", menor_edad: false });
assert.deepEqual(filas[0], ["Hoja N.°", "EVOLV-LR-000001"]);
assert.ok(filas.some(([k, v]) => k === "Proveedor" && v.includes(COMERCIO.ruc)), "la hoja identifica al proveedor con su RUC");
assert.ok(filas.some(([k, v]) => k === "Tipo" && v === "Queja"));

const mails = [];
let inserted = null;
globalThis.fetch = async (url, opts = {}) => {
  if (url.endsWith("/rest/v1/libro_reclamaciones") && opts.method === "POST") {
    inserted = JSON.parse(opts.body);
    return json(201, [{ id: "lr-1", numero: 1, codigo: "EVOLV-LR-000001", created_at: new Date().toISOString(), ...inserted }]);
  }
  if (url.includes("/rest/v1/libro_reclamaciones?id=eq.")) return json(204, {});
  if (url.includes("/rest/v1/profiles?is_admin=eq.true")) return json(200, [{ email: "admin@evolv.test" }]);
  if (url === "https://api.resend.com/emails") { mails.push(JSON.parse(opts.body)); return json(200, {}); }
  throw new Error("fetch inesperado: " + url);
};
r = res();
await reclamaciones(req(hoja), r);
assert.equal(r.statusCode, 201);
assert.equal(r.payload.hoja.codigo, "EVOLV-LR-000001");
assert.equal(r.payload.hoja.copiaEnviada, true);
assert.equal(inserted.monto_reclamado, 29.9);
assert.deepEqual(mails.map((m) => m.to), ["ana@example.com", ["admin@evolv.test"]], "copia al consumidor y aviso al comercio");
r = res();
await reclamaciones(req({ ...hoja, website: "bot" }), r);
assert.equal(r.statusCode, 400, "el campo trampa bloquea bots");
r = res();
await reclamaciones(req({ ...hoja, detalle: "" }), r);
assert.equal(r.statusCode, 400);

// ── SQL: idempotente, numeración correlativa y contacto mínimo ────────────────────
const db = new PGlite();
await db.exec(`create schema auth; create table auth.users(id uuid primary key);
create table user_entitlements(id uuid primary key default gen_random_uuid());`);
await db.exec(read("supabase/billing.sql"));
const migration = read("supabase/tienda_culqi.sql");
await db.exec(migration);
await db.exec(migration); // idempotencia
const ins = (extra) => db.query(`insert into libro_reclamaciones(tipo,nombre,tipo_documento,numero_documento,bien_descripcion,detalle,pedido,email,telefono)
  values('reclamo','Ana','DNI','12345678','Plan','detalle largo','pedido',$1,$2) returning numero,codigo`, extra);
const a = (await ins(["a@x.pe", null])).rows[0];
const b = (await ins([null, "999"])).rows[0];
assert.equal(b.numero, a.numero + 1, "numeración correlativa");
assert.match(a.codigo, /^EVOLV-LR-\d{6}$/);
await assert.rejects(ins([null, null]), /libro_reclamaciones_contacto/, "sin ningún medio de contacto no se registra");
await db.query("insert into billing_events(stripe_event_id,event_type,status,provider) values('chr_test_1','culqi.charge.succeeded','processed','culqi')");
await db.query("insert into billing_events(stripe_event_id,event_type,status) values('evt_x','checkout.session.completed','processed')");
assert.equal((await db.query("select provider from billing_events where stripe_event_id='evt_x'")).rows[0].provider, "stripe", "Stripe sigue con su valor por defecto");
assert.equal((await db.query("select relrowsecurity from pg_class where relname='libro_reclamaciones'")).rows[0].relrowsecurity, true, "RLS activo");

console.log("  ✓ tienda Culqi: catálogo, páginas, cobro, 3DS, Libro de Reclamaciones y SQL");
