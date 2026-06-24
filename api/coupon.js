// Serverless: genera y canjea códigos de acceso gratuito.
// POST /api/coupon
//   { action:"generate", durationDays?, validUntil?, planId? } -> solo admin
//   { action:"redeem", code } -> usuario autenticado sin plan activo

import crypto from "node:crypto";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

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

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch (_) {
    res.status(400).json({ error: "JSON inválido." });
    return;
  }

  const action = String(body.action || "");

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

  res.status(400).json({ error: "Acción no reconocida. Use 'generate' o 'redeem'." });
}
