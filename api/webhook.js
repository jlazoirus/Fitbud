// Serverless: recibe y procesa webhooks de Stripe (firmados con HMAC-SHA256).
// POST /api/webhook  (registrar en Stripe → https://fitbud-green.vercel.app/api/webhook)
// Vars: STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Eventos: checkout.session.completed, charge.refunded, charge.dispute.created,
//          payment_intent.payment_failed, checkout.session.expired

import crypto from "crypto";

export const config = { api: { bodyParser: false } };

const PLAN_DURATION_DAYS = { monthly: 30, quarterly: 90 };

function env() {
  return {
    supaUrl:       (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    supaService:   process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  };
}

function svcHdr(e, extra) {
  return Object.assign({
    apikey:        e.supaService,
    Authorization: "Bearer " + e.supaService,
    "Content-Type": "application/json",
  }, extra || {});
}

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data",  c  => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end",   () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifyStripeSignature(rawBody, sigHeader, secret) {
  const parts = {};
  for (const part of sigHeader.split(",")) {
    const i = part.indexOf("=");
    if (i > 0) parts[part.slice(0, i)] = part.slice(i + 1);
  }
  if (!parts.t || !parts.v1) return false;
  // Rechazar eventos con más de 5 minutos de antigüedad (replay prevention)
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const payload  = parts.t + "." + rawBody.toString("utf8");
  const computed = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(parts.v1, "hex"));
  } catch (_) {
    return false;
  }
}

async function sbGet(e, path) {
  try {
    const r = await fetch(e.supaUrl + path, { headers: svcHdr(e) });
    return r.ok ? await r.json().catch(() => []) : [];
  } catch (_) { return []; }
}

async function sbPost(e, path, body) {
  return fetch(e.supaUrl + path, {
    method:  "POST",
    headers: svcHdr(e, { "Prefer": "return=representation" }),
    body:    JSON.stringify(body),
  });
}

async function sbPatch(e, path, body) {
  return fetch(e.supaUrl + path, {
    method:  "PATCH",
    headers: svcHdr(e),
    body:    JSON.stringify(body),
  });
}

async function logBillingEvent(e, stripeEventId, eventType, userId, planId, entitlementId, status, payload, error) {
  try {
    await sbPost(e, "/rest/v1/billing_events", {
      stripe_event_id: stripeEventId,
      event_type:      eventType,
      user_id:         userId         || null,
      plan_id:         planId         || null,
      entitlement_id:  entitlementId  || null,
      status,
      payload,
      error: error || null,
    });
  } catch (_) { /* log no bloquea la respuesta */ }
}

async function handleCheckoutCompleted(e, session) {
  const userId = session.metadata && session.metadata.user_id;
  const planId = session.metadata && session.metadata.plan_id;
  if (!userId || !planId || !PLAN_DURATION_DAYS[planId]) {
    return { ok: false, error: "Metadata incompleta: " + JSON.stringify({ userId, planId }) };
  }

  // payment_ref = payment_intent ID (enlaza con charge.refunded)
  const paymentRef = session.payment_intent || session.id;

  // Idempotencia: entitlement ya creado para este pago?
  const existing = await sbGet(
    e,
    "/rest/v1/user_entitlements?payment_ref=eq." + encodeURIComponent(paymentRef) + "&limit=1"
  );
  if (Array.isArray(existing) && existing.length) {
    return { ok: true, skipped: true, entitlementId: existing[0].id };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + PLAN_DURATION_DAYS[planId] * 86400000);
  const r = await sbPost(e, "/rest/v1/user_entitlements", {
    user_id:     userId,
    plan_id:     planId,
    status:      "active",
    starts_at:   now.toISOString(),
    expires_at:  expiresAt.toISOString(),
    origin:      "checkout",
    payment_ref: paymentRef,
    notes:       "Stripe checkout " + session.id,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    return { ok: false, error: (err && err.message) || "Error al crear entitlement" };
  }
  const data = await r.json().catch(() => []);
  const created = Array.isArray(data) ? data[0] : data;
  return { ok: true, entitlementId: created && created.id };
}

async function handleRefund(e, charge) {
  // Revoca el entitlement ligado al mismo payment_intent
  const pi = charge.payment_intent;
  if (!pi) return { ok: true, skipped: true };
  const rows = await sbGet(
    e,
    "/rest/v1/user_entitlements?payment_ref=eq." + encodeURIComponent(pi)
      + "&status=in.(active,courtesy)&limit=1"
  );
  if (!Array.isArray(rows) || !rows.length) return { ok: true, skipped: true };
  const entId = rows[0].id;
  await sbPatch(
    e,
    "/rest/v1/user_entitlements?id=eq." + entId,
    { status: "revoked", updated_at: new Date().toISOString() }
  );
  return { ok: true, entitlementId: entId };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }
  const e = env();
  // Sin config: responder 200 para que Stripe no reintente indefinidamente.
  if (!e.webhookSecret || !e.supaUrl || !e.supaService) {
    res.status(200).json({ received: true, configured: false });
    return;
  }

  const rawBody = await readRawBody(req);
  const sig = req.headers["stripe-signature"] || "";
  if (!verifyStripeSignature(rawBody, sig, e.webhookSecret)) {
    res.status(400).json({ error: "Firma inválida." });
    return;
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch (_) {
    res.status(400).json({ error: "Payload inválido." });
    return;
  }

  const stripeEventId = String(event.id || "");
  const eventType     = String(event.type || "");
  const obj           = event.data && event.data.object;
  const userId        = obj && obj.metadata && obj.metadata.user_id;
  const planId        = obj && obj.metadata && obj.metadata.plan_id;

  // Idempotencia: evento ya procesado con éxito?
  const done = await sbGet(
    e,
    "/rest/v1/billing_events?stripe_event_id=eq." + encodeURIComponent(stripeEventId)
      + "&status=eq.processed&limit=1"
  );
  if (Array.isArray(done) && done.length) {
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  let result = { ok: true, skipped: true };
  if (eventType === "checkout.session.completed" && obj) {
    result = await handleCheckoutCompleted(e, obj);
  } else if (eventType === "charge.refunded" && obj) {
    result = await handleRefund(e, obj);
  }
  // charge.dispute.created / payment_intent.payment_failed / checkout.session.expired → solo loguear

  const status = result.ok ? (result.skipped ? "skipped" : "processed") : "failed";
  await logBillingEvent(
    e, stripeEventId, eventType, userId, planId,
    result.entitlementId || null, status, event, result.error || null
  );

  res.status(200).json({ received: true, status, ...(result.error ? { detail: result.error } : {}) });
}
