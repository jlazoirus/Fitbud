// REQ-334: cobro de un plan de la tienda web con Culqi (pago único, en soles;
// en dólares solo con TIENDA_USD_ENABLED, REQ-381).
// POST /api/culqi-charge (reescrita a /api/checkout?op=culqi) — pública: la compra no exige cuenta (REQ-333).
// Body: { planId, tokenId, email, firstName, lastName, phone, deviceId,
//         acceptTerms: true, authentication3DS?, campana?, moneda? }
// El monto sale de tienda/planes.js, nunca del navegador. Si el cargo sale bien:
// busca la cuenta por correo (o la invita), suma los días del plan desde el
// vencimiento vigente y registra el cobro en billing_events (provider = culqi).
// Vars: CULQI_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//       NOTIFY_APP_URL, RESEND_API_KEY, NOTIFY_FROM_EMAIL.
// REQ-376: con META_PIXEL_ID y META_CAPI_TOKEN, el cargo confirmado también va como
// Purchase a la API de conversiones de Meta (api/_tienda/meta-capi.js), con el mismo
// eventId que la respuesta entrega a /pago para el Purchase del navegador.
// REQ-370: `campana` (origen de campaña de web/origen.js) es opcional; se revalida aquí
// y solo se guarda en el payload de billing_events y en la metadata de Culqi. Nunca
// cambia precio, plan ni acceso, y si es inválida se descarta sin frenar el pago.
// REQ-381: `moneda` ("PEN" | "USD"; sin ella, soles) se valida contra las monedas
// permitidas: "USD" solo con TIENDA_USD_ENABLED = "1" | "true". El monto sale del
// catálogo para ese plan y esa moneda, y la moneda va al cargo, a billing_events,
// al correo y a la API de conversiones.

import { MONEDA, planPorId, montoPlan, formatoPrecio, monedasPermitidas, usdHabilitado } from "../../tienda/planes.js";
import { COMERCIO } from "../../tienda/comercio.js";
import { limpiarCampana, CLAVES as CLAVES_CAMPANA } from "../../web/origen.js";
import { metaEnv, metaIds, clientInfo, compraMedicion, purchaseEvent, sendPurchase } from "./meta-capi.js";

const CULQI_CHARGES_URL = "https://api.culqi.com/v2/charges";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOKEN_RE = /^tkn_(test|live)_[A-Za-z0-9]+$/;
const MAIL_TIMEOUT_MS = 4000;

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    culqiSecret: process.env.CULQI_SECRET_KEY || "",
    appUrl: (process.env.NOTIFY_APP_URL || "https://evolvapp.club").replace(/\/$/, ""),
    usd: usdHabilitado(process.env.TIENDA_USD_ENABLED),
  };
}

function svc(e, extra) {
  return Object.assign({ apikey: e.service, Authorization: "Bearer " + e.service, "Content-Type": "application/json" }, extra || {});
}

async function rj(r) {
  return r.json().catch(() => ({}));
}

function clean(value, max) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max || 120);
}

// `opciones.usd`: si la tienda acepta dólares (por defecto, la bandera del servidor).
export function parseCompra(body, opciones = {}) {
  const b = body && typeof body === "object" ? body : {};
  const usd = opciones.usd !== undefined ? !!opciones.usd : usdHabilitado(process.env.TIENDA_USD_ENABLED);
  const monedaPedida = b.moneda == null || b.moneda === "" ? MONEDA : clean(b.moneda, 8).toUpperCase();
  const moneda = monedasPermitidas(usd).includes(monedaPedida) ? monedaPedida : "";
  const plan = planPorId(clean(b.planId, 40));
  const data = {
    plan,
    moneda: moneda || MONEDA,
    monto: plan && moneda ? montoPlan(plan, moneda) : null,
    tokenId: clean(b.tokenId, 80),
    email: clean(b.email, 160).toLowerCase(),
    firstName: clean(b.firstName, 50),
    lastName: clean(b.lastName, 50),
    phone: clean(b.phone, 20).replace(/[^\d+]/g, ""),
    deviceId: clean(b.deviceId, 80),
    acceptTerms: b.acceptTerms === true,
    authentication3DS: null,
    campana: null,
  };
  try { data.campana = limpiarCampana(b.campana); } catch (_) { data.campana = null; }
  const a = b.authentication3DS;
  if (a && typeof a === "object") {
    data.authentication3DS = {};
    for (const key of ["eci", "xid", "cavv", "protocolVersion", "directoryServerTransactionId"]) {
      if (a[key] != null) data.authentication3DS[key] = clean(a[key], 120);
    }
  }
  const errors = [];
  if (!data.plan) errors.push("El plan elegido no existe. Vuelve a Planes y elige uno.");
  else if (!moneda || data.monto == null) errors.push(monedaPedida === "USD" ? "Por ahora solo puedes pagar en soles. Vuelve a Planes y elige Soles." : "Esa moneda no está disponible. Vuelve a Planes y elige otra vez tu plan.");
  if (!EMAIL_RE.test(data.email)) errors.push("Revisa tu correo.");
  if (!data.firstName || !data.lastName) errors.push("Escribe tu nombre y apellido.");
  if (!data.acceptTerms) errors.push("Para comprar, acepta los Términos y la Política de devoluciones.");
  if (!TOKEN_RE.test(data.tokenId)) errors.push("No recibimos los datos de la tarjeta. Intenta pagar de nuevo.");
  return { errors, data };
}

export function chargeBody(data) {
  const body = {
    amount: data.monto,
    currency_code: data.moneda,
    email: data.email,
    source_id: data.tokenId,
    description: ("Evolv " + data.plan.nombre).slice(0, 80),
    metadata: { plan_id: data.plan.id, origen: "tienda_web", ...metadataCampana(data.campana) },
    antifraud_details: {
      first_name: data.firstName,
      last_name: data.lastName,
      ...(data.phone ? { phone_number: data.phone } : {}),
      ...(data.deviceId ? { device_finger_print_id: data.deviceId } : {}),
    },
  };
  if (data.authentication3DS) body.authentication_3DS = data.authentication3DS;
  return body;
}

// La metadata de Culqi es plana (texto por clave): campana_source, campana_utm_source…
export function metadataCampana(campana) {
  const out = {};
  if (!campana) return out;
  for (const key of CLAVES_CAMPANA) if (campana[key]) out["campana_" + key] = campana[key];
  return out;
}

// Culqi responde con object "charge" si autorizó, con action_code "REVIEW" si
// pide autenticación 3DS (la doc cambia el código HTTP entre 200 y 201, así que
// se decide por el cuerpo) y con object "error" si rechazó.
export function interpretCharge(status, data) {
  const d = data && typeof data === "object" ? data : {};
  if (d.object === "charge" && d.id) return { result: "paid", chargeId: d.id };
  if (d.action_code === "REVIEW") return { result: "needs3ds" };
  const msg = d.user_message || "No pudimos procesar el pago. Revisa los datos de tu tarjeta o prueba con otra.";
  return { result: "declined", error: msg, code: d.decline_code || d.code || d.type || "status_" + status };
}

async function findUserIdByEmail(e, email) {
  const r = await fetch(e.url + "/rest/v1/profiles?email=eq." + encodeURIComponent(email) + "&select=id&limit=1", { headers: svc(e) });
  const rows = await rj(r);
  if (r.ok && Array.isArray(rows) && rows[0]) return rows[0].id;
  // Respaldo: cuentas sin perfil todavía (invitadas que no entraron).
  for (let page = 1; page <= 20; page += 1) {
    const ur = await fetch(e.url + "/auth/v1/admin/users?page=" + page + "&per_page=200", { headers: svc(e) });
    const data = await rj(ur);
    const batch = ur.ok && Array.isArray(data.users) ? data.users : [];
    const hit = batch.find((u) => String(u.email || "").toLowerCase() === email);
    if (hit) return hit.id;
    if (batch.length < 200) break;
  }
  return null;
}

async function inviteUser(e, email, data) {
  const redirect = encodeURIComponent(e.appUrl + "/app?auth=invite");
  const r = await fetch(e.url + "/auth/v1/invite?redirect_to=" + redirect, {
    method: "POST",
    headers: svc(e),
    body: JSON.stringify({ email, data: { fitbros_purchase: true, full_name: (data.firstName + " " + data.lastName).trim() } }),
  });
  const out = await rj(r);
  if (!r.ok) return null;
  return (out.user && out.user.id) || out.id || null;
}

// Mismo criterio que el webhook de Stripe: los días nuevos se suman desde el
// vencimiento vigente para no perder días pagados.
async function grantEntitlement(e, userId, plan, chargeId, cobro) {
  const existing = await fetch(e.url + "/rest/v1/user_entitlements?payment_ref=eq." + encodeURIComponent(chargeId) + "&select=id,expires_at&limit=1", { headers: svc(e) });
  const prev = await rj(existing);
  if (existing.ok && Array.isArray(prev) && prev[0]) return prev[0];
  const now = new Date();
  const ar = await fetch(
    e.url + "/rest/v1/user_entitlements?user_id=eq." + encodeURIComponent(userId)
      + "&status=in.(active,courtesy)&expires_at=gt." + encodeURIComponent(now.toISOString())
      + "&order=expires_at.desc&limit=1&select=expires_at",
    { headers: svc(e) }
  );
  const active = await rj(ar);
  const currentExpiry = ar.ok && Array.isArray(active) && active[0] ? new Date(active[0].expires_at) : null;
  const start = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const expires = new Date(start.getTime() + plan.duracionDias * 86400000);
  const r = await fetch(e.url + "/rest/v1/user_entitlements", {
    method: "POST",
    headers: svc(e, { Prefer: "return=representation" }),
    body: JSON.stringify({
      user_id: userId,
      plan_id: plan.id,
      status: "active",
      starts_at: start.toISOString(),
      expires_at: expires.toISOString(),
      origin: "checkout",
      payment_ref: chargeId,
      notes: "Culqi cargo " + chargeId + " · " + formatoPrecio(cobro.monto, cobro.moneda),
    }),
  });
  const data = await rj(r);
  if (!r.ok) throw new Error((data && data.message) || "No se pudo crear el acceso.");
  return Array.isArray(data) ? data[0] : data;
}

async function logBilling(e, chargeId, userId, plan, entitlementId, status, payload, error) {
  try {
    await fetch(e.url + "/rest/v1/billing_events", {
      method: "POST",
      headers: svc(e),
      body: JSON.stringify({
        stripe_event_id: chargeId,
        provider: "culqi",
        event_type: "culqi.charge.succeeded",
        user_id: userId || null,
        plan_id: plan.id,
        entitlement_id: entitlementId || null,
        status,
        payload,
        error: error || null,
      }),
    });
  } catch (_) { /* el registro no bloquea la respuesta */ }
}

function escHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// `cobro` = { monto, moneda } del cargo; sin él, el precio en soles del plan.
export function receiptEmail(plan, chargeId, expiresAt, cuenta, appUrl, cobro) {
  const pagado = cobro && Number.isInteger(cobro.monto) ? cobro : { monto: plan.montoCentimos, moneda: MONEDA };
  const vence = expiresAt ? new Date(expiresAt).toLocaleDateString("es-PE", { timeZone: "America/Lima", dateStyle: "long" }) : "";
  const paso = cuenta === "invitada"
    ? "Te llegará otro correo para crear tu contraseña. Al entrar, tu plan ya estará activo."
    : cuenta === "pendiente"
      ? "Recibimos tu pago y estamos activando tu acceso. Si en unas horas no lo ves, escríbenos con el número de operación."
      : "Tu plan ya está activo en tu cuenta. Entra con tu correo de siempre.";
  return {
    subject: "Tu compra en Evolv: " + plan.nombre,
    html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tu compra en Evolv</title></head>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
  <p style="font-size:18px;font-weight:700;margin:0 0 6px">¡Gracias por tu compra!</p>
  <p style="color:#555;margin:0 0 18px">${escHtml(paso)}</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 18px">
    <tr><td style="padding:6px 10px 6px 0;color:#666">Plan</td><td>${escHtml(plan.nombre)} (${escHtml(plan.periodo)})</td></tr>
    <tr><td style="padding:6px 10px 6px 0;color:#666">Monto</td><td>${escHtml(formatoPrecio(pagado.monto, pagado.moneda))}</td></tr>
    ${vence ? `<tr><td style="padding:6px 10px 6px 0;color:#666">Acceso hasta</td><td>${escHtml(vence)}</td></tr>` : ""}
    <tr><td style="padding:6px 10px 6px 0;color:#666">Operación</td><td>${escHtml(chargeId)}</td></tr>
  </table>
  <a href="${escHtml(appUrl)}" style="display:inline-block;background:#101010;color:#d6ff3a;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">Ir a Evolv</a>
  <p style="font-size:12px;color:#666;margin:22px 0 0">Pago único, sin renovación automática. Tienes 7 días para pedir el reembolso completo: ${escHtml(appUrl)}/devoluciones. ${escHtml(COMERCIO.razonSocial)} · RUC ${escHtml(COMERCIO.ruc)}.</p>
</body></html>`,
  };
}

async function sendReceipt(email, mail) {
  const key = process.env.RESEND_API_KEY || "";
  if (!key) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MAIL_TIMEOUT_MS);
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM_EMAIL || "recordatorios@fitbros.app", to: email, subject: mail.subject, html: mail.html }),
      signal: controller.signal,
    });
  } catch (_) { /* best-effort */ } finally {
    clearTimeout(timer);
  }
}

// Purchase por la API de conversiones: solo si está configurada y sin datos personales.
// sendPurchase nunca rechaza; el catch cubre cualquier otro imprevisto.
async function enviarCompraMeta(req, body, plan, compra, appUrl, cobro) {
  try {
    const env = metaEnv();
    if (!env.pixelId || !env.token) return;
    const event = purchaseEvent({ eventId: compra.eventId, plan, ids: metaIds(body), client: clientInfo(req), cobro, sourceUrl: appUrl + "/pago" });
    await sendPurchase(env, event);
  } catch (err) {
    console.error("meta-capi: error inesperado", String(err && err.message || err));
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido." });
    return;
  }
  const e = env();
  if (!e.culqiSecret || !e.url || !e.service) {
    res.status(503).json({ error: "Los pagos no están disponibles en este momento. Escríbenos y te ayudamos." });
    return;
  }
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (_) {
    res.status(400).json({ error: "No pudimos leer el pedido. Intenta de nuevo." });
    return;
  }
  const { errors, data } = parseCompra(body, { usd: e.usd });
  if (errors.length) {
    res.status(400).json({ error: errors[0], errors });
    return;
  }

  let status = 0;
  let culqi = {};
  try {
    const r = await fetch(CULQI_CHARGES_URL, {
      method: "POST",
      headers: { Authorization: "Bearer " + e.culqiSecret, "Content-Type": "application/json" },
      body: JSON.stringify(chargeBody(data)),
    });
    status = r.status;
    culqi = await rj(r);
  } catch (_) {
    res.status(502).json({ error: "No pudimos conectar con la pasarela de pago. No se hizo ningún cobro; intenta de nuevo." });
    return;
  }

  const outcome = interpretCharge(status, culqi);
  if (outcome.result === "needs3ds") {
    res.status(200).json({ ok: false, needs3ds: true });
    return;
  }
  if (outcome.result === "declined") {
    console.error("culqi-charge: rechazado", status, outcome.code);
    res.status(402).json({ error: outcome.error });
    return;
  }

  // Cobrado. Desde aquí, cualquier fallo se registra y se resuelve a mano: la
  // persona nunca ve un error después de haber pagado.
  const plan = data.plan;
  const chargeId = outcome.chargeId;
  const cobro = { monto: data.monto, moneda: data.moneda };
  const payload = { email: data.email, amount: cobro.monto, currency: cobro.moneda, plan_id: plan.id };
  if (data.campana) payload.campana = data.campana; // REQ-370: sin origen, el campo no existe
  // REQ-376: corre en paralelo con la activación y nunca cambia la respuesta del pago.
  const compra = compraMedicion(chargeId, plan, cobro);
  const capi = enviarCompraMeta(req, body, plan, compra, e.appUrl, cobro);
  let userId = null;
  let cuenta = "existente";
  try {
    userId = await findUserIdByEmail(e, data.email);
    if (!userId) {
      userId = await inviteUser(e, data.email, data);
      cuenta = "invitada";
      if (!userId) userId = await findUserIdByEmail(e, data.email);
    }
    if (!userId) throw new Error("No se pudo crear ni encontrar la cuenta de " + data.email);
    const ent = await grantEntitlement(e, userId, plan, chargeId, cobro);
    await logBilling(e, chargeId, userId, plan, ent && ent.id, "processed", payload);
    await sendReceipt(data.email, receiptEmail(plan, chargeId, ent && ent.expires_at, cuenta, e.appUrl, cobro));
    await capi;
    res.status(200).json({ ok: true, cuenta, plan: plan.id, moneda: cobro.moneda, monto: cobro.monto, expiresAt: ent && ent.expires_at, operacion: chargeId, compra });
  } catch (err) {
    console.error("culqi-charge: cobro sin acceso", chargeId, String(err && err.message || err));
    await logBilling(e, chargeId, userId, plan, null, "failed", payload, String(err && err.message || err));
    await sendReceipt(data.email, receiptEmail(plan, chargeId, null, "pendiente", e.appUrl, cobro));
    await capi;
    res.status(200).json({ ok: true, cuenta: "pendiente", plan: plan.id, moneda: cobro.moneda, monto: cobro.monto, operacion: chargeId, compra });
  }
}
