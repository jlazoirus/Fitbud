// REQ-27: Analitica de producto, IA y costos.
// POST /api/analytics  — registra un evento de producto (usuario autenticado).
// GET  /api/analytics  — devuelve metricas agregadas (solo admin).
// Datos sensibles prohibidos: fotos, alergias, notas de salud, prompts completos.

const ALLOWED_EVENT_TYPES = new Set([
  "session_start",
  "onboarding_complete",
  "onboarding_review",
  "first_plan_ready",
  "diet_day_generated",
  "diet_day_applied",
  "diet_week_generated",
  "diet_week_applied",
  "meal_done",
  "workout_done",
  "training_plan_applied",
  "contingency_meal",
  "contingency_workout",
  "checkin_submitted",
  "paywall_shown",
  "checkout_start",
  "checkout_complete",
  "coach_message_sent",
  "streak_milestone",
]);

// Solo estas claves se almacenan en properties. Ningun dato de salud, identidad ni prompts.
const ALLOWED_PROP_KEYS = new Set([
  "week", "cycle", "day_of_week", "slot", "count",
  "source", "outcome", "plan_type", "sport",
  "context", "step", "error_code", "duration_weeks", "action",
]);

function filterProps(props) {
  const out = {};
  for (const [k, v] of Object.entries(props || {})) {
    if (
      ALLOWED_PROP_KEYS.has(k) &&
      (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    ) {
      out[k] = v;
    }
  }
  return out;
}

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    anon: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

function serviceHeaders(e, extra) {
  return Object.assign(
    { apikey: e.service, Authorization: "Bearer " + e.service },
    extra || {}
  );
}

async function responseJson(response) {
  return response.json().catch(() => ({}));
}

async function verifyUser(req, e) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !e.url || !e.anon) return null;
  try {
    const response = await fetch(e.url + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: e.anon },
    });
    if (!response.ok) return null;
    const user = await responseJson(response);
    if (!user || !user.id) return null;
    const profileResponse = await fetch(
      e.url + "/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=is_admin,active",
      { headers: { Authorization: "Bearer " + token, apikey: e.anon } }
    );
    if (!profileResponse.ok) return null;
    const rows = await responseJson(profileResponse);
    if (!Array.isArray(rows) || !rows[0] || rows[0].active === false) return null;
    return { userId: user.id, isAdmin: !!rows[0].is_admin };
  } catch (_) {
    return null;
  }
}

async function handlePost(req, res, e, user) {
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (_) {
    res.status(400).json({ error: "Cuerpo invalido." });
    return;
  }

  const eventType = String(body.event_type || "");
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    res.status(400).json({ error: "Tipo de evento no permitido." });
    return;
  }

  const sessionId = String(body.session_id || "").slice(0, 64) || null;
  const properties = filterProps(body.properties);

  const response = await fetch(e.url + "/rest/v1/product_events", {
    method: "POST",
    headers: serviceHeaders(e, { "content-type": "application/json", prefer: "return=minimal" }),
    body: JSON.stringify({
      user_id: user.userId,
      session_id: sessionId,
      event_type: eventType,
      properties,
    }),
  });

  if (!response.ok) {
    const data = await responseJson(response);
    if (response.status === 404) {
      // Tabla no existe todavia: no bloquear la experiencia.
      res.status(200).json({ ok: true, setup_pending: true });
      return;
    }
    res.status(500).json({ error: (data && data.message) || "No se pudo guardar el evento." });
    return;
  }

  res.status(200).json({ ok: true });
}

async function handleGet(req, res, e) {
  // Embudo de activacion
  const funnelRes = await fetch(e.url + "/rest/v1/v_activation_funnel?select=*", {
    headers: serviceHeaders(e),
  });
  const funnel = funnelRes.ok ? await funnelRes.json().catch(() => []) : [];

  // Costo IA por accion
  const costsRes = await fetch(e.url + "/rest/v1/v_ai_cost_summary?select=*", {
    headers: serviceHeaders(e),
  });
  const ai_costs = costsRes.ok ? await costsRes.json().catch(() => []) : [];

  // Resumen de usuarios activos y costo total
  const summaryRes = await fetch(
    e.url + "/rest/v1/product_events?select=user_id,created_at&created_at=gt."
      + new Date(Date.now() - 30 * 86400000).toISOString(),
    { headers: serviceHeaders(e) }
  );
  const allEvents = summaryRes.ok ? await summaryRes.json().catch(() => []) : [];
  const now = Date.now();
  const cutoff7d = now - 7 * 86400000;
  const users30d = new Set(allEvents.map((ev) => ev.user_id).filter(Boolean));
  const users7d = new Set(
    allEvents.filter((ev) => new Date(ev.created_at).getTime() > cutoff7d)
      .map((ev) => ev.user_id).filter(Boolean)
  );
  const totalCost = ai_costs.reduce((sum, row) => sum + (Number(row.total_cost_usd) || 0), 0);

  res.status(200).json({
    funnel: Array.isArray(funnel) ? funnel : [],
    ai_costs: Array.isArray(ai_costs) ? ai_costs : [],
    summary: {
      active_users_7d: users7d.size,
      active_users_30d: users30d.size,
      total_cost_30d: Math.round(totalCost * 10000) / 10000,
    },
  });
}

export default async function handler(req, res) {
  const e = env();
  if (!e.url || !e.anon || !e.service) {
    res.status(500).json({ error: "Falta configuracion server-side." });
    return;
  }

  const user = await verifyUser(req, e);
  if (!user) {
    res.status(401).json({ error: "Sesion requerida." });
    return;
  }

  if (req.method === "GET") {
    if (!user.isAdmin) {
      res.status(403).json({ error: "Solo administradores pueden ver la analitica." });
      return;
    }
    try {
      await handleGet(req, res, e);
    } catch (error) {
      res.status(500).json({ error: String((error && error.message) || error) });
    }
    return;
  }

  if (req.method === "POST") {
    try {
      await handlePost(req, res, e, user);
    } catch (error) {
      res.status(500).json({ error: String((error && error.message) || error) });
    }
    return;
  }

  res.status(405).json({ error: "Metodo no permitido." });
}
