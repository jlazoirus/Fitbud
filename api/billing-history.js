// Serverless: historial de pagos seguro para el usuario autenticado.
// GET /api/billing-history -> [{ event_type, plan_id, status, created_at, amount_cents, currency }]

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

export default async function handler(req, res) {
  if (req.method !== "GET") {
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
}
