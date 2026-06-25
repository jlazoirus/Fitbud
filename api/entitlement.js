// Serverless: entitlements, historial de pagos y códigos de canje.
// GET                            → entitlement activo (o null) + último vencido
// GET  ?action=billing-history   → historial de pagos del usuario
// POST action:"grant"            → admin: otorgar acceso de cortesía
// POST action:"revoke"           → admin: revocar acceso de cortesía
// POST action:"generate"         → admin: generar código de canje
// POST action:"redeem"           → usuario autenticado: canjear código

import crypto from "node:crypto";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    anon: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

function svcHeaders(e, extra) {
  return Object.assign({ apikey: e.service, Authorization: "Bearer " + e.service }, extra || {});
}

async function rj(r) { return r.json().catch(() => ({})); }

async function verifyUser(req, e) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !e.url || !e.anon) return null;
  try {
    const r = await fetch(e.url + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: e.anon },
    });
    if (!r.ok) return null;
    const user = await rj(r);
    if (!user || !user.id) return null;
    const pr = await fetch(
      e.url + "/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=active,is_admin",
      { headers: { Authorization: "Bearer " + token, apikey: e.anon } }
    );
    if (!pr.ok) return null;
    const rows = await rj(pr);
    if (!Array.isArray(rows) || !rows[0] || rows[0].active === false) return null;
    return { user, profile: rows[0], token };
  } catch (_) {
    return null;
  }
}

// ── billing-history helpers ───────────────────────────────────────────────────

function firstFinite(...values) {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num)) return Math.round(num);
  }
  return null;
}

function moneyFromPayload(payload) {
  const obj = payload && payload.data && payload.data.object ? payload.data.object : {};
  const amount = firstFinite(obj.amount_total, obj.amount_paid, obj.amount, obj.amount_refunded);
  const currency = obj.currency ? String(obj.currency).toUpperCase() : null;
  return { amount_cents: amount, currency };
}

function projectEvent(row) {
  const money = moneyFromPayload(row && row.payload);
  return {
    event_type: String((row && row.event_type) || ""),
    plan_id: String((row && row.plan_id) || ""),
    status: String((row && row.status) || ""),
    created_at: String((row && row.created_at) || ""),
    amount_cents: money.amount_cents,
    currency: money.currency,
  };
}

// ── coupon helpers ────────────────────────────────────────────────────────────

function generatedCode() {
  let body = "";
  for (let i = 0; i < 8; i++) {
    body += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  }
  return "FIT-" + body.slice(0, 4) + "-" + body.slice(4);
}

function normalizeCouponCode(input) {
  const compact = String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.startsWith("FIT") && compact.length === 11) {
    return "FIT-" + compact.slice(3, 7) + "-" + compact.slice(7, 11);
  }
  return String(input || "").trim().toUpperCase().replace(/\s+/g, "");
}

function parseDuration(value) {
  if (value === undefined || value === null || value === "") return 28;
  const days = Number(value);
  if (!Number.isInteger(days) || days < 1 || days > 365) return null;
  return days;
}

function parseValidUntil(value) {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  const dt = new Date(String(value));
  if (Number.isNaN(dt.getTime())) return { ok: false, value: null };
  return { ok: true, value: dt.toISOString() };
}

async function planExists(e, planId) {
  const r = await fetch(
    e.url + "/rest/v1/subscription_plans?id=eq." + encodeURIComponent(planId) + "&active=eq.true&select=id&limit=1",
    { headers: svcHeaders(e) }
  );
  const rows = await rj(r);
  return r.ok && Array.isArray(rows) && rows.length > 0;
}

function couponOut(row) {
  return {
    code: String(row.code || ""),
    plan_id: String(row.plan_id || ""),
    duration_days: Number(row.duration_days || 0),
    valid_until: row.valid_until || null,
    created_at: row.created_at || null,
  };
}

function entitlementOut(row) {
  return {
    id: row.id || null,
    plan_id: String(row.plan_id || ""),
    status: String(row.status || ""),
    starts_at: row.starts_at || null,
    expires_at: row.expires_at || null,
    origin: String(row.origin || ""),
    duration_days: Number(row.duration_days || 0),
  };
}

function couponError(data) {
  const msg = String((data && (data.message || data.error)) || "");
  const known = [
    "Código no válido.",
    "Este código ya fue utilizado.",
    "El código ha expirado.",
    "Ya tienes un plan activo.",
    "Sesión requerida.",
  ];
  const clean = known.find(item => msg.includes(item));
  if (clean) return clean;
  if (msg.includes("redeem_redemption_code")) return "El canje no está disponible en este momento.";
  return "No pudimos canjear el código. Intenta de nuevo.";
}

// ── handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const e = env();
  if (!e.url || !e.service) {
    res.status(500).json({ error: "Servicio no configurado." });
    return;
  }
  const auth = await verifyUser(req, e);
  if (!auth) {
    res.status(401).json({ error: "Sesión requerida." });
    return;
  }

  // GET /api/entitlement?action=billing-history
  if (req.method === "GET" && (req.query && req.query.action) === "billing-history") {
    try {
      const url = e.url + "/rest/v1/billing_events?user_id=eq." + encodeURIComponent(auth.user.id)
        + "&order=created_at.desc&limit=24"
        + "&select=event_type,plan_id,status,created_at,payload";
      const r = await fetch(url, { headers: svcHeaders(e) });
      const rows = await rj(r);
      if (!r.ok || !Array.isArray(rows)) {
        res.status(500).json({ error: "No se pudo cargar el historial de pagos." });
        return;
      }
      res.status(200).json({ history: rows.map(projectEvent) });
    } catch (err) {
      res.status(500).json({ error: String(err.message || err) });
    }
    return;
  }

  // GET /api/entitlement  → entitlement activo / último vencido
  if (req.method === "GET") {
    try {
      const now = new Date().toISOString();
      const activeUrl = e.url + "/rest/v1/user_entitlements?user_id=eq." + auth.user.id
        + "&status=in.(active,courtesy)&expires_at=gt." + now
        + "&order=expires_at.desc&limit=1"
        + "&select=id,plan_id,status,starts_at,expires_at,origin,notes";
      const ar = await fetch(activeUrl, { headers: svcHeaders(e) });
      const active = await rj(ar);
      if (ar.ok && Array.isArray(active) && active.length) {
        res.status(200).json({ entitlement: active[0], expired: null, isAdmin: !!auth.profile.is_admin });
        return;
      }
      const expUrl = e.url + "/rest/v1/user_entitlements?user_id=eq." + auth.user.id
        + "&status=in.(active,expired)&order=expires_at.desc&limit=1"
        + "&select=id,plan_id,status,starts_at,expires_at,origin";
      const er = await fetch(expUrl, { headers: svcHeaders(e) });
      const expired = await rj(er);
      res.status(200).json({
        entitlement: null,
        expired: er.ok && Array.isArray(expired) && expired.length ? expired[0] : null,
        isAdmin: !!auth.profile.is_admin,
      });
    } catch (err) {
      res.status(500).json({ error: String(err.message || err) });
    }
    return;
  }

  if (req.method === "POST") {
    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    } catch (_) {
      res.status(400).json({ error: "JSON inválido." });
      return;
    }
    const action = String(body.action || "");

    // POST action:"grant"  → admin: otorgar acceso de cortesía
    if (action === "grant") {
      if (!auth.profile.is_admin) {
        res.status(403).json({ error: "Solo administradores pueden gestionar entitlements." });
        return;
      }
      const targetUserId = String(body.userId || "");
      if (!UUID_RE.test(targetUserId)) {
        res.status(400).json({ error: "userId inválido." });
        return;
      }
      const planId = String(body.planId || "monthly");
      const days = Math.max(1, Math.min(365, Number(body.days) || 30));
      const notes = String(body.notes || "").slice(0, 500);
      const now = new Date();
      const exp = new Date(now.getTime() + days * 86400000);
      try {
        const r = await fetch(e.url + "/rest/v1/user_entitlements", {
          method: "POST",
          headers: svcHeaders(e, { "content-type": "application/json", "Prefer": "return=representation" }),
          body: JSON.stringify({
            user_id:   targetUserId,
            plan_id:   planId,
            status:    "courtesy",
            starts_at: now.toISOString(),
            expires_at: exp.toISOString(),
            origin:    "admin_courtesy",
            notes:     notes || "Acceso de cortesía otorgado por administrador",
            granted_by: auth.user.id,
          }),
        });
        const data = await rj(r);
        if (!r.ok) {
          res.status(500).json({ error: (data && data.message) || "No se pudo crear el acceso de cortesía." });
          return;
        }
        res.status(201).json({ entitlement: Array.isArray(data) ? data[0] : data });
      } catch (err) {
        res.status(500).json({ error: String(err.message || err) });
      }
      return;
    }

    // POST action:"revoke"  → admin: revocar acceso
    if (action === "revoke") {
      if (!auth.profile.is_admin) {
        res.status(403).json({ error: "Solo administradores pueden gestionar entitlements." });
        return;
      }
      const targetUserId = String(body.userId || "");
      if (!UUID_RE.test(targetUserId)) {
        res.status(400).json({ error: "userId inválido." });
        return;
      }
      const entitlementId = String(body.entitlementId || "");
      if (!UUID_RE.test(entitlementId)) {
        res.status(400).json({ error: "entitlementId inválido." });
        return;
      }
      try {
        const r = await fetch(
          e.url + "/rest/v1/user_entitlements?id=eq." + entitlementId + "&user_id=eq." + targetUserId,
          {
            method: "PATCH",
            headers: svcHeaders(e, { "content-type": "application/json" }),
            body: JSON.stringify({ status: "revoked", updated_at: new Date().toISOString() }),
          }
        );
        if (!r.ok) {
          res.status(500).json({ error: "No se pudo revocar el acceso." });
          return;
        }
        res.status(200).json({ ok: true });
      } catch (err) {
        res.status(500).json({ error: String(err.message || err) });
      }
      return;
    }

    // POST action:"generate"  → admin: generar código de canje
    if (action === "generate") {
      if (!auth.profile.is_admin) {
        res.status(403).json({ error: "Solo administradores pueden generar códigos." });
        return;
      }

      const planId = String(body.planId || "monthly").trim();
      if (!/^[a-z0-9_-]{1,64}$/i.test(planId) || !(await planExists(e, planId))) {
        res.status(400).json({ error: "Plan no disponible." });
        return;
      }

      const durationDays = parseDuration(body.durationDays);
      if (!durationDays) {
        res.status(400).json({ error: "Duración inválida." });
        return;
      }

      const validUntil = parseValidUntil(body.validUntil);
      if (!validUntil.ok) {
        res.status(400).json({ error: "Fecha de caducidad inválida." });
        return;
      }

      for (let attempt = 0; attempt < 8; attempt++) {
        const code = generatedCode();
        const r = await fetch(e.url + "/rest/v1/redemption_codes", {
          method: "POST",
          headers: svcHeaders(e, { "content-type": "application/json", Prefer: "return=representation" }),
          body: JSON.stringify({
            code,
            plan_id: planId,
            duration_days: durationDays,
            valid_until: validUntil.value,
            created_by: auth.user.id,
          }),
        });
        const data = await rj(r);
        if (r.ok) {
          const row = Array.isArray(data) ? data[0] : data;
          res.status(201).json(couponOut(row || {}));
          return;
        }
        if (!(r.status === 409 || String(data && data.code) === "23505")) {
          res.status(500).json({ error: (data && data.message) || "No se pudo generar el código." });
          return;
        }
      }

      res.status(500).json({ error: "No se pudo generar un código único. Intenta de nuevo." });
      return;
    }

    // POST action:"redeem"  → usuario autenticado: canjear código
    if (action === "redeem") {
      const code = normalizeCouponCode(body.code);
      if (!code) {
        res.status(400).json({ error: "Código no válido." });
        return;
      }

      const r = await fetch(e.url + "/rest/v1/rpc/redeem_redemption_code", {
        method: "POST",
        headers: svcHeaders(e, { "content-type": "application/json" }),
        body: JSON.stringify({ p_code: code, p_user_id: auth.user.id }),
      });
      const data = await rj(r);
      if (!r.ok) {
        res.status(r.status === 404 ? 503 : 400).json({ error: couponError(data) });
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      res.status(200).json({ entitlement: entitlementOut(row || {}) });
      return;
    }

    res.status(400).json({ error: "Acción no reconocida." });
    return;
  }

  res.status(405).json({ error: "Método no permitido" });
}
