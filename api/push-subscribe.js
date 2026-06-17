// Registra o elimina suscripciones Web Push para el usuario autenticado (REQ-38)
// POST   /api/push-subscribe — guarda un endpoint de suscripción
// DELETE /api/push-subscribe — elimina todas las suscripciones del usuario (opt-out)
//
// El cliente llama este endpoint con el JWT de sesión en Authorization.
// Usa service role para escribir en push_subscriptions (tabla solo accesible
// por el propio usuario vía RLS o por service role).

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    anon: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
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
      e.url + "/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=active",
      { headers: { Authorization: "Bearer " + token, apikey: e.anon } }
    );
    if (!pr.ok) return null;
    const rows = await rj(pr);
    if (!Array.isArray(rows) || !rows[0] || rows[0].active === false) return null;
    return user;
  } catch (_) {
    return null;
  }
}

function svcHeaders(e, extra) {
  return Object.assign(
    { apikey: e.service, Authorization: "Bearer " + e.service, "Content-Type": "application/json" },
    extra || {}
  );
}

export default async function handler(req, res) {
  const e = env();
  if (!e.url || !e.service) {
    return res.status(503).json({ error: "DB no configurada" });
  }

  const user = await verifyUser(req, e);
  if (!user) return res.status(401).json({ error: "Sesión requerida" });

  const userId = user.id;

  if (req.method === "DELETE") {
    const r = await fetch(
      e.url + "/rest/v1/push_subscriptions?user_id=eq." + encodeURIComponent(userId),
      { method: "DELETE", headers: svcHeaders(e) }
    );
    if (!r.ok) {
      const err = await rj(r);
      return res.status(500).json({ error: err.message || "Error al eliminar" });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (_) {
    return res.status(400).json({ error: "JSON inválido" });
  }

  const { endpoint, keys } = body || {};
  if (!endpoint || typeof endpoint !== "string" ||
      !keys || typeof keys.p256dh !== "string" || typeof keys.auth !== "string") {
    return res.status(400).json({ error: "Suscripción incompleta (endpoint, keys.p256dh, keys.auth)" });
  }

  const userAgent = String(req.headers["user-agent"] || "").slice(0, 512);

  const r = await fetch(e.url + "/rest/v1/push_subscriptions", {
    method: "POST",
    headers: svcHeaders(e, { Prefer: "resolution=merge-duplicates" }),
    body: JSON.stringify({
      user_id: userId,
      endpoint,
      keys_p256dh: keys.p256dh,
      keys_auth: keys.auth,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    }),
  });

  if (!r.ok) {
    const err = await rj(r);
    return res.status(500).json({ error: err.message || "Error al guardar suscripción" });
  }
  return res.status(200).json({ ok: true });
}
