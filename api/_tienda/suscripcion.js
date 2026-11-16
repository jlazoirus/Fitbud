// REQ-355: motor de la suscripción mensual con 7 días gratis (Culqi, cobros recurrentes).
// Diseño y API confirmada: docs/web-publica-y-suscripcion.md §3. Vive en /api/checkout
// por el límite de 12 funciones (vercel.json reescribe las rutas):
//   POST /api/suscripcion           → op=suscripcion          inscripción (pública)
//   POST /api/culqi-webhook         → op=culqi-webhook        eventos de Culqi
//   POST /api/suscripcion/cancelar  → op=suscripcion-cancelar cancelar (con sesión)
//
// - Inscripción: cliente → tarjeta (con validación) → suscripción al plan de Culqi con
//   prueba (CULQI_PLAN_PRUEBA_ID) o sin ella (CULQI_PLAN_MENSUAL_ID), según si la
//   persona ya tuvo prueba o plan pagado. Después busca o invita la cuenta, guarda la
//   fila en `subscriptions` y, con prueba, da el acceso de los días gratis.
// - Los cobros los hace Culqi. El webhook no confía en el cuerpo: consulta el evento
//   con GET /v2/events/{id} (la API no documenta firma) y la suscripción con la API.
//   Cada cobro exitoso suma 30 días una sola vez (clave: subscription_charges).
// - Cancelar es inmediato en Culqi; el acceso pagado sigue hasta su vencimiento.
// - La inscripción solo funciona con TIENDA_SUSCRIPCION_ENABLED (REQ-354: los textos
//   legales se muestran con la misma bandera). Webhook y cancelación siempre.
//
// Vars: CULQI_SECRET_KEY, CULQI_PLAN_PRUEBA_ID, CULQI_PLAN_MENSUAL_ID,
//       TIENDA_SUSCRIPCION_ENABLED, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//       SUPABASE_PUBLISHABLE_KEY (cancelar), NOTIFY_APP_URL.

import { SUSCRIPCION, suscripcionHabilitada, formatoPrecio } from "../../tienda/planes.js";
import { svc, rj, findUserIdByEmail, inviteUser } from "./culqi-charge.js";

export const CULQI_API = "https://api.culqi.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOKEN_RE = /^tkn_(test|live)_[A-Za-z0-9]+$/;
const DAY_MS = 86400000;
const DIAS_PERIODO = 30;
const LIVE_STATES = ["pending", "trialing", "active", "past_due"];

export function env(source = process.env) {
  return {
    url: (source.SUPABASE_URL || "").replace(/\/$/, ""),
    service: source.SUPABASE_SERVICE_ROLE_KEY || "",
    anon: source.SUPABASE_PUBLISHABLE_KEY || source.SUPABASE_ANON_KEY || "",
    culqiSecret: source.CULQI_SECRET_KEY || "",
    planPrueba: source.CULQI_PLAN_PRUEBA_ID || "",
    planMensual: source.CULQI_PLAN_MENSUAL_ID || "",
    enabled: suscripcionHabilitada(source.TIENDA_SUSCRIPCION_ENABLED),
    appUrl: (source.NOTIFY_APP_URL || "https://evolvapp.club").replace(/\/$/, ""),
  };
}

function clean(value, max) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max || 120);
}

function readBody(req) {
  try {
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (_) {
    return null;
  }
}

// ── Inscripción: validación ─────────────────────────────────────────────────────
// Culqi exige dirección, ciudad y teléfono para crear el cliente (POST /v2/customers).
export function parseInscripcion(body) {
  const b = body && typeof body === "object" ? body : {};
  const data = {
    tokenId: clean(b.tokenId, 80),
    email: clean(b.email, 50).toLowerCase(),
    firstName: clean(b.firstName, 50),
    lastName: clean(b.lastName, 50),
    phone: clean(b.phone, 20).replace(/[^\d]/g, "").slice(0, 15),
    address: clean(b.address, 100),
    city: clean(b.city, 30),
    deviceId: clean(b.deviceId, 80),
    acceptTerms: b.acceptTerms === true,
    acceptRenewal: b.acceptRenewal === true,
    authentication3DS: null,
  };
  const a = b.authentication3DS;
  if (a && typeof a === "object") {
    data.authentication3DS = {};
    for (const key of ["eci", "xid", "cavv", "protocolVersion", "directoryServerTransactionId"]) {
      if (a[key] != null) data.authentication3DS[key] = clean(a[key], 120);
    }
  }
  const errors = [];
  if (!EMAIL_RE.test(data.email)) errors.push("Revisa tu correo.");
  if (data.firstName.length < 2 || data.lastName.length < 2) errors.push("Escribe tu nombre y apellido.");
  if (data.phone.length < 5) errors.push("Escribe tu celular.");
  if (data.address.length < 5 || data.city.length < 2) errors.push("Escribe tu dirección y tu ciudad.");
  if (!data.acceptTerms) errors.push("Para suscribirte, acepta los Términos y la Política de devoluciones.");
  if (!data.acceptRenewal) errors.push("Para suscribirte, acepta la renovación automática mensual.");
  if (!TOKEN_RE.test(data.tokenId)) errors.push("No recibimos los datos de la tarjeta. Intenta de nuevo.");
  return { errors, data };
}

export function customerBody(data) {
  return {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    address: data.address,
    address_city: data.city,
    country_code: "PE",
    phone_number: data.phone,
  };
}

export function cardBody(customerId, data) {
  const body = { customer_id: customerId, token_id: data.tokenId, validate: true };
  if (data.authentication3DS) body.authentication_3DS = data.authentication3DS;
  return body;
}

export function subscriptionBody(cardId, planId, meta) {
  return { card_id: cardId, plan_id: planId, tyc: true, metadata: meta || {} };
}

// Estados de Culqi (referencia de la API): 1 creada, 2 prueba, 3 activa,
// 4 cancelada, 5 en cola, 6 finalizada.
export function estadoCulqi(status) {
  return { 1: "pending", 2: "trialing", 3: "active", 4: "canceled", 5: "pending", 6: "ended" }[Number(status)] || "pending";
}

// Culqi da fechas en milisegundos UNIX (a veces en segundos).
export function fechaCulqi(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n < 1e12 ? n * 1000 : n).toISOString();
}

// Datos de la tarjeta para mostrar (marca y últimos 4) y para la señal débil de
// "una prueba por persona" (bin + últimos 4). Nunca el número completo.
export function tarjetaInfo(card) {
  const src = card && card.source && typeof card.source === "object" ? card.source : {};
  const iin = src.iin && typeof src.iin === "object" ? src.iin : {};
  const last4 = /^\d{4}$/.test(String(src.last_four || "")) ? String(src.last_four) : null;
  const bin = /^\d{6,8}$/.test(String(iin.bin || "")) ? String(iin.bin) : null;
  const brand = clean(iin.card_brand || (card && card.metadata && card.metadata.marca_tarjeta) || "", 30) || null;
  return { brand, last4, bin };
}

// Respuesta de Culqi a una creación: ok, pide 3DS (action_code REVIEW) o error.
export function interpretCreacion(status, data, objeto) {
  const d = data && typeof data === "object" ? data : {};
  if (d.action_code === "REVIEW") return { result: "needs3ds" };
  if (status >= 200 && status < 300 && d.id && (!objeto || !d.object || d.object === objeto)) return { result: "ok", data: d };
  const msg = d.user_message || "No pudimos procesar tu tarjeta. Revisa los datos o prueba con otra.";
  return { result: "error", error: msg, code: d.decline_code || d.code || d.type || "status_" + status };
}

// ── Utilidades HTTP ───────────────────────────────────────────────────────────────
async function culqi(e, method, path, body) {
  const r = await fetch(CULQI_API + path, {
    method,
    headers: { Authorization: "Bearer " + e.culqiSecret, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, data: await rj(r) };
}

async function rest(e, path, init) {
  const r = await fetch(e.url + "/rest/v1/" + path, { ...(init || {}), headers: svc(e, (init && init.headers) || {}) });
  const data = await rj(r);
  return { ok: r.ok, status: r.status, data };
}

async function buscarCliente(e, email) {
  const { status, data } = await culqi(e, "GET", "/v2/customers?email=" + encodeURIComponent(email) + "&limit=1");
  const list = status === 200 && data && Array.isArray(data.data) ? data.data : [];
  const hit = list.find((c) => String(c.email || "").toLowerCase() === email);
  return hit ? hit.id : null;
}

// ── Una prueba por persona ──────────────────────────────────────────────────────────
// Sin prueba si: ya hubo una suscripción con ese correo o esa cuenta, la cuenta tuvo
// un plan pagado (origin checkout), o la misma tarjeta (bin + últimos 4) ya tuvo prueba.
export async function puedeProbar(e, { email, userId, tarjeta }) {
  const porCorreo = await rest(e, "subscriptions?email=eq." + encodeURIComponent(email) + "&select=id&limit=1");
  if (!porCorreo.ok) throw new Error("subscriptions no disponible");
  if (Array.isArray(porCorreo.data) && porCorreo.data.length) return false;
  if (userId) {
    const porCuenta = await rest(e, "subscriptions?user_id=eq." + encodeURIComponent(userId) + "&select=id&limit=1");
    if (Array.isArray(porCuenta.data) && porCuenta.data.length) return false;
    const pagado = await rest(e, "user_entitlements?user_id=eq." + encodeURIComponent(userId) + "&origin=eq.checkout&select=id&limit=1");
    if (Array.isArray(pagado.data) && pagado.data.length) return false;
  }
  if (tarjeta && tarjeta.bin && tarjeta.last4) {
    const porTarjeta = await rest(e, "subscriptions?card_bin=eq." + tarjeta.bin + "&card_last4=eq." + tarjeta.last4 + "&con_prueba=eq.true&select=id&limit=1");
    if (Array.isArray(porTarjeta.data) && porTarjeta.data.length) return false;
  }
  return true;
}

async function suscripcionViva(e, email, userId) {
  const estados = "status=in.(" + LIVE_STATES.join(",") + ")";
  const porCorreo = await rest(e, "subscriptions?email=eq." + encodeURIComponent(email) + "&" + estados + "&select=id&limit=1");
  if (Array.isArray(porCorreo.data) && porCorreo.data.length) return true;
  if (!userId) return false;
  const porCuenta = await rest(e, "subscriptions?user_id=eq." + encodeURIComponent(userId) + "&" + estados + "&select=id&limit=1");
  return Array.isArray(porCuenta.data) && porCuenta.data.length > 0;
}

// Suma `dias` desde el vencimiento vigente (o desde ahora), como los pagos únicos.
export async function sumarAcceso(e, userId, { dias, paymentRef, notes }) {
  const prev = await rest(e, "user_entitlements?payment_ref=eq." + encodeURIComponent(paymentRef) + "&select=id,expires_at&limit=1");
  if (prev.ok && Array.isArray(prev.data) && prev.data[0]) return prev.data[0];
  const now = new Date();
  const act = await rest(e, "user_entitlements?user_id=eq." + encodeURIComponent(userId)
    + "&status=in.(active,courtesy)&expires_at=gt." + encodeURIComponent(now.toISOString())
    + "&order=expires_at.desc&limit=1&select=expires_at");
  const vigente = act.ok && Array.isArray(act.data) && act.data[0] ? new Date(act.data[0].expires_at) : null;
  const start = vigente && vigente > now ? vigente : now;
  const expires = new Date(start.getTime() + dias * DAY_MS);
  const ins = await rest(e, "user_entitlements", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: userId,
      plan_id: SUSCRIPCION.planId,
      status: "active",
      starts_at: start.toISOString(),
      expires_at: expires.toISOString(),
      origin: "checkout",
      payment_ref: paymentRef,
      notes,
    }),
  });
  if (!ins.ok) throw new Error((ins.data && ins.data.message) || "No se pudo crear el acceso.");
  return Array.isArray(ins.data) ? ins.data[0] : ins.data;
}

async function logBilling(e, eventId, eventType, sub, entitlementId, status, payload, error) {
  try {
    await rest(e, "billing_events", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify({
        stripe_event_id: eventId,
        provider: "culqi",
        event_type: eventType,
        user_id: (sub && sub.user_id) || null,
        plan_id: SUSCRIPCION.planId,
        entitlement_id: entitlementId || null,
        status,
        payload: payload || null,
        error: error || null,
      }),
    });
  } catch (_) { /* el registro no bloquea */ }
}

// ── POST /api/suscripcion ─────────────────────────────────────────────────────────
export async function inscribir(req, res, e = env()) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });
  if (!e.enabled) return res.status(404).json({ error: "La suscripción todavía no está disponible." });
  if (!e.culqiSecret || !e.url || !e.service || !e.planPrueba || !e.planMensual) {
    return res.status(503).json({ error: "La suscripción no está disponible en este momento. Escríbenos y te ayudamos." });
  }
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "No pudimos leer el pedido. Intenta de nuevo." });
  const { errors, data } = parseInscripcion(body);
  if (errors.length) return res.status(400).json({ error: errors[0], errors });

  let userId = null;
  try {
    userId = await findUserIdByEmail(e, data.email);
    if (await suscripcionViva(e, data.email, userId)) {
      return res.status(409).json({ error: "Ya tienes una suscripción activa con este correo. Puedes verla en Perfil → Mi suscripción." });
    }
  } catch (_) {
    return res.status(503).json({ error: "La suscripción no está disponible en este momento. Escríbenos y te ayudamos." });
  }

  // 1) Cliente (se reutiliza si ya existe con ese correo, p. ej. al reintentar con 3DS).
  let customerId;
  try {
    customerId = await buscarCliente(e, data.email);
    if (!customerId) {
      const c = await culqi(e, "POST", "/v2/customers", customerBody(data));
      const out = interpretCreacion(c.status, c.data, "customer");
      if (out.result !== "ok") return res.status(400).json({ error: out.error });
      customerId = out.data.id;
    }
  } catch (_) {
    return res.status(502).json({ error: "No pudimos conectar con la pasarela de pago. No se hizo ningún cobro; intenta de nuevo." });
  }

  // 2) Tarjeta: Culqi la valida con un cargo mínimo que anula al instante.
  let card;
  try {
    const c = await culqi(e, "POST", "/v2/cards", cardBody(customerId, data));
    const out = interpretCreacion(c.status, c.data, "card");
    if (out.result === "needs3ds") return res.status(200).json({ ok: false, needs3ds: true });
    if (out.result !== "ok") {
      console.error("suscripcion: tarjeta rechazada", c.status, out.code);
      return res.status(402).json({ error: out.error });
    }
    card = out.data;
  } catch (_) {
    return res.status(502).json({ error: "No pudimos conectar con la pasarela de pago. No se hizo ningún cobro; intenta de nuevo." });
  }
  const tarjeta = tarjetaInfo(card);

  // 3) Suscripción: con prueba solo la primera vez.
  let conPrueba;
  try {
    conPrueba = await puedeProbar(e, { email: data.email, userId, tarjeta });
  } catch (_) {
    return res.status(503).json({ error: "La suscripción no está disponible en este momento. Escríbenos y te ayudamos." });
  }
  const culqiPlan = conPrueba ? e.planPrueba : e.planMensual;
  let sub;
  try {
    const s = await culqi(e, "POST", "/v2/recurrent/subscriptions/create", subscriptionBody(card.id, culqiPlan, { origen: "evolv_web", con_prueba: conPrueba ? "si" : "no" }));
    const out = interpretCreacion(s.status, s.data);
    if (out.result !== "ok") {
      console.error("suscripcion: Culqi no creó la suscripción", s.status, out.code);
      return res.status(402).json({ error: out.error });
    }
    sub = out.data;
  } catch (_) {
    return res.status(502).json({ error: "No pudimos conectar con la pasarela de pago. Revisa en unos minutos si te llegó un correo antes de reintentar." });
  }

  // Desde aquí la suscripción existe en Culqi: un fallo se registra y se resuelve a
  // mano, y la persona no ve un error (el webhook completa los datos después).
  const now = Date.now();
  const trialEnds = conPrueba ? (fechaCulqi(sub.trial_end) || new Date(now + SUSCRIPCION.diasPrueba * DAY_MS).toISOString()) : null;
  const row = {
    user_id: null,
    email: data.email,
    plan_id: SUSCRIPCION.planId,
    status: conPrueba ? "trialing" : estadoCulqi(sub.status) === "active" ? "active" : "pending",
    con_prueba: conPrueba,
    culqi_customer_id: customerId,
    culqi_card_id: card.id,
    culqi_subscription_id: sub.id,
    culqi_plan_id: culqiPlan,
    card_brand: tarjeta.brand,
    card_last4: tarjeta.last4,
    card_bin: tarjeta.bin,
    trial_ends_at: trialEnds,
    next_billing_at: fechaCulqi(sub.next_billing_date) || trialEnds,
  };
  let cuenta = "existente";
  let acceso = null;
  try {
    if (!userId) {
      userId = await inviteUser(e, data.email, data);
      cuenta = "invitada";
      if (!userId) userId = await findUserIdByEmail(e, data.email);
    }
    row.user_id = userId || null;
    const ins = await rest(e, "subscriptions", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
    if (!ins.ok) throw new Error((ins.data && ins.data.message) || "No se pudo guardar la suscripción.");
    const saved = Array.isArray(ins.data) ? ins.data[0] : ins.data;
    if (!userId) throw new Error("No se pudo crear ni encontrar la cuenta de " + data.email);
    if (conPrueba) {
      const dias = Math.max(1, Math.round((new Date(trialEnds).getTime() - now) / DAY_MS));
      acceso = await sumarAcceso(e, userId, { dias, paymentRef: sub.id + ":prueba", notes: "Suscripción Culqi " + sub.id + " · " + dias + " días gratis" });
    }
    await logBilling(e, sub.id, "culqi.subscription.created", saved, acceso && acceso.id, "processed", { email: data.email, con_prueba: conPrueba, culqi_plan_id: culqiPlan });
  } catch (err) {
    console.error("suscripcion: creada en Culqi sin completar", sub.id, String(err && err.message || err));
    await logBilling(e, sub.id, "culqi.subscription.created", { user_id: userId }, null, "failed", { email: data.email, con_prueba: conPrueba }, String(err && err.message || err));
    return res.status(200).json({ ok: true, cuenta: "pendiente", conPrueba, suscripcion: sub.id });
  }
  return res.status(200).json({
    ok: true,
    cuenta,
    conPrueba,
    suscripcion: sub.id,
    monto: formatoPrecio(SUSCRIPCION.montoCentimos, SUSCRIPCION.moneda),
    accesoHasta: acceso ? acceso.expires_at : null,
    primerCobro: row.next_billing_at,
    tarjeta: tarjeta.last4 ? { marca: tarjeta.brand, ultimos4: tarjeta.last4 } : null,
  });
}

// ── POST /api/culqi-webhook ───────────────────────────────────────────────────────
// Busca ids de Culqi en el evento verificado, sin depender de su forma exacta
// (la referencia de la API deja `data` sin documentar).
export function idsEnEvento(evento) {
  const out = { subscriptionId: null, chargeId: null, amount: null, currency: null };
  const seen = new Set();
  const visit = (v, depth) => {
    if (v == null || depth > 6) return;
    if (typeof v === "string") {
      const s = v.trim();
      if (!out.subscriptionId && /^sxn_(test|live)_[A-Za-z0-9]+$/.test(s)) out.subscriptionId = s;
      else if (!out.chargeId && /^chr_(test|live)_[A-Za-z0-9]+$/.test(s)) out.chargeId = s;
      else if ((s.startsWith("{") || s.startsWith("[")) && depth < 3) {
        try { visit(JSON.parse(s), depth + 1); } catch (_) { /* texto */ }
      }
      return;
    }
    if (typeof v !== "object" || seen.has(v)) return;
    seen.add(v);
    if (!Array.isArray(v)) {
      if (out.amount == null && Number.isInteger(v.amount)) out.amount = v.amount;
      const cur = v.currency_code || v.currency;
      if (out.currency == null && typeof cur === "string" && /^[A-Z]{3}$/.test(cur)) out.currency = cur;
    }
    for (const k of Object.keys(v)) visit(v[k], depth + 1);
  };
  visit(evento && evento.data, 0);
  return out;
}

async function filaPorCulqi(e, subscriptionId) {
  const r = await rest(e, "subscriptions?culqi_subscription_id=eq." + encodeURIComponent(subscriptionId) + "&select=*&limit=1");
  return r.ok && Array.isArray(r.data) && r.data[0] ? r.data[0] : null;
}

async function actualizar(e, id, patch) {
  await rest(e, "subscriptions?id=eq." + encodeURIComponent(id), {
    method: "PATCH",
    body: JSON.stringify({ ...patch, last_event_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  });
}

export async function webhook(req, res, e = env()) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });
  if (!e.culqiSecret || !e.url || !e.service) return res.status(503).json({ error: "no_configurado" });
  const body = readBody(req) || {};
  const eventId = clean(body.id, 60);
  if (!/^evt_(test|live)_[A-Za-z0-9]+$/.test(eventId)) return res.status(400).json({ error: "evento_invalido" });

  // Nunca se confía en el cuerpo: el evento se lee de la API con la llave secreta.
  let evento;
  try {
    const r = await culqi(e, "GET", "/v2/events/" + encodeURIComponent(eventId));
    if (r.status === 404 || r.status === 401) return res.status(401).json({ error: "evento_no_verificado" });
    if (r.status !== 200 || !r.data || r.data.id !== eventId) return res.status(502).json({ error: "culqi_no_responde" });
    evento = r.data;
  } catch (_) {
    return res.status(502).json({ error: "culqi_no_responde" }); // Culqi reintenta
  }
  const tipo = String(evento.type || "");
  if (!tipo.startsWith("subscription.")) return res.status(200).json({ ok: true, ignorado: tipo });

  const ya = await rest(e, "billing_events?stripe_event_id=eq." + encodeURIComponent(eventId) + "&select=id&limit=1");
  if (!ya.ok) return res.status(503).json({ error: "db_no_disponible" });
  if (Array.isArray(ya.data) && ya.data.length) return res.status(200).json({ ok: true, duplicado: true });

  const ids = idsEnEvento(evento);
  const fila = ids.subscriptionId ? await filaPorCulqi(e, ids.subscriptionId) : null;
  if (!fila) {
    await logBilling(e, eventId, "culqi." + tipo, null, null, "skipped", { subscription: ids.subscriptionId, charge: ids.chargeId }, "suscripción desconocida");
    return res.status(200).json({ ok: true, desconocida: true });
  }

  // Estado y fechas de la API (no del evento).
  let remota = null;
  try {
    const r = await culqi(e, "GET", "/v2/recurrent/subscriptions/" + encodeURIComponent(fila.culqi_subscription_id));
    if (r.status === 200 && r.data && r.data.id === fila.culqi_subscription_id) remota = r.data;
  } catch (_) { remota = null; }
  const proximo = remota ? fechaCulqi(remota.next_billing_date) : null;

  try {
    if (tipo === "subscription.charge.succeeded") {
      const userId = fila.user_id || await findUserIdByEmail(e, fila.email);
      const ref = ids.chargeId || eventId;
      const claim = await rest(e, "subscription_charges", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({ charge_ref: ref, subscription_id: fila.id, event_id: eventId, amount: ids.amount, currency: ids.currency }),
      });
      if (!claim.ok) throw new Error("No se pudo registrar el cobro.");
      if (!Array.isArray(claim.data) || !claim.data.length) {
        await logBilling(e, eventId, "culqi." + tipo, fila, null, "skipped", { charge: ref }, "cobro ya procesado");
        return res.status(200).json({ ok: true, duplicado: true });
      }
      if (!userId) throw new Error("Cobro sin cuenta para " + fila.email);
      const monto = ids.amount != null ? formatoPrecio(ids.amount, ids.currency || SUSCRIPCION.moneda) : formatoPrecio(SUSCRIPCION.montoCentimos, SUSCRIPCION.moneda);
      const ent = await sumarAcceso(e, userId, { dias: DIAS_PERIODO, paymentRef: ref, notes: "Suscripción Culqi " + fila.culqi_subscription_id + " · cobro " + ref + " · " + monto });
      await rest(e, "subscription_charges?charge_ref=eq." + encodeURIComponent(ref), { method: "PATCH", body: JSON.stringify({ entitlement_id: ent && ent.id }) });
      await actualizar(e, fila.id, {
        status: "active",
        user_id: userId,
        current_period_end: ent && ent.expires_at,
        next_billing_at: proximo || (ent && ent.expires_at) || null,
      });
      await logBilling(e, eventId, "culqi." + tipo, { user_id: userId }, ent && ent.id, "processed", { subscription: fila.culqi_subscription_id, charge: ref, amount: ids.amount, currency: ids.currency });
      return res.status(200).json({ ok: true });
    }
    if (tipo === "subscription.charge.failed") {
      if (!["canceled", "ended"].includes(fila.status)) await actualizar(e, fila.id, { status: "past_due", ...(proximo ? { next_billing_at: proximo } : {}) });
    } else if (tipo === "subscription.cancel.succeeded") {
      await actualizar(e, fila.id, { status: "canceled", canceled_at: fila.canceled_at || new Date().toISOString(), next_billing_at: null });
    } else if (tipo === "subscription.creation.failed") {
      await actualizar(e, fila.id, { status: "ended" });
    } else if (remota) {
      // subscription.trial.end, subscription.creation.succeeded y otros: se alinea con Culqi.
      const estado = estadoCulqi(remota.status);
      await actualizar(e, fila.id, { ...(["canceled", "ended"].includes(fila.status) ? {} : { status: estado }), ...(proximo ? { next_billing_at: proximo } : {}) });
    }
    await logBilling(e, eventId, "culqi." + tipo, fila, null, "processed", { subscription: fila.culqi_subscription_id });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("culqi-webhook: fallo procesando", eventId, String(err && err.message || err));
    await logBilling(e, eventId, "culqi." + tipo, fila, null, "failed", { subscription: fila.culqi_subscription_id, charge: ids.chargeId }, String(err && err.message || err));
    return res.status(200).json({ ok: false, registrado: true }); // queda para revisión manual
  }
}

// ── POST /api/suscripcion/cancelar ────────────────────────────────────────────────
async function usuarioDeSesion(req, e) {
  const auth = (req.headers && (req.headers.authorization || req.headers.Authorization)) || "";
  const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !e.url || !e.anon) return null;
  try {
    const r = await fetch(e.url + "/auth/v1/user", { headers: { Authorization: "Bearer " + token, apikey: e.anon } });
    if (!r.ok) return null;
    const u = await rj(r);
    return u && u.id ? u : null;
  } catch (_) {
    return null;
  }
}

// Cancela en Culqi la suscripción viva de la cuenta. La usan la cancelación desde
// Perfil (REQ-357) y el borrado de cuenta (api/privacy.js). Devuelve la fila o null.
export async function cancelarDeCuenta(e, userId) {
  const r = await rest(e, "subscriptions?user_id=eq." + encodeURIComponent(userId) + "&status=in.(" + LIVE_STATES.join(",") + ")&select=*&order=created_at.desc&limit=1");
  if (r.status === 404) return null; // supabase/suscripciones.sql sin aplicar: no hay suscripciones
  if (!r.ok) throw new Error("subscriptions no disponible");
  const fila = Array.isArray(r.data) ? r.data[0] : null;
  if (!fila) return null;
  if (!e.culqiSecret) throw new Error("Falta CULQI_SECRET_KEY para cancelar la suscripción.");
  const c = await culqi(e, "DELETE", "/v2/recurrent/subscriptions/" + encodeURIComponent(fila.culqi_subscription_id));
  // 404: Culqi ya no la tiene (p. ej., la canceló por cobros fallidos).
  if (!(c.status >= 200 && c.status < 300) && c.status !== 404) {
    throw new Error((c.data && (c.data.user_message || c.data.merchant_message)) || "Culqi no canceló la suscripción.");
  }
  const now = new Date().toISOString();
  await actualizar(e, fila.id, { status: "canceled", cancel_requested_at: now, canceled_at: now, next_billing_at: null });
  await logBilling(e, fila.culqi_subscription_id + ":cancelada", "culqi.subscription.cancel_requested", fila, null, "processed", { subscription: fila.culqi_subscription_id });
  return fila;
}

export async function cancelar(req, res, e = env()) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });
  if (!e.culqiSecret || !e.url || !e.service) return res.status(503).json({ error: "No pudimos cancelar ahora. Escríbenos y lo hacemos por ti." });
  const user = await usuarioDeSesion(req, e);
  if (!user) return res.status(401).json({ error: "Sesión requerida." });
  try {
    const fila = await cancelarDeCuenta(e, user.id);
    if (!fila) return res.status(404).json({ error: "No tienes una suscripción activa." });
    const acc = await rest(e, "user_entitlements?user_id=eq." + encodeURIComponent(user.id)
      + "&status=in.(active,courtesy)&order=expires_at.desc&limit=1&select=expires_at");
    const hasta = acc.ok && Array.isArray(acc.data) && acc.data[0] ? acc.data[0].expires_at : null;
    return res.status(200).json({ ok: true, accesoHasta: hasta });
  } catch (err) {
    console.error("suscripcion: no se pudo cancelar", user.id, String(err && err.message || err));
    return res.status(502).json({ error: "No pudimos cancelar ahora. Intenta de nuevo o escríbenos y lo hacemos por ti." });
  }
}

export default async function handler(req, res) {
  const op = (req.query && req.query.op) || (() => { try { return new URL(req.url || "", "http://local").searchParams.get("op") || ""; } catch (_) { return ""; } })();
  if (op === "culqi-webhook") return webhook(req, res);
  if (op === "suscripcion-cancelar") return cancelar(req, res);
  return inscribir(req, res);
}

