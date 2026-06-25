// Serverless: crea una sesión de pago en Stripe (checkout alojado).
// POST /api/checkout  Body: { planId: "monthly"|"quarterly" }
// Requiere sesión autenticada.
// Vars: STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_QUARTERLY, NOTIFY_APP_URL

function env() {
  return {
    supaUrl:       (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    supaAnon:      process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "",
    stripeKey:     process.env.STRIPE_SECRET_KEY || "",
    priceMonthly:  process.env.STRIPE_PRICE_MONTHLY || "",
    priceQuarterly: process.env.STRIPE_PRICE_QUARTERLY || "",
    appUrl: (process.env.NOTIFY_APP_URL || "https://fitbud-green.vercel.app").replace(/\/$/, ""),
  };
}

async function verifyUser(req, e) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !e.supaUrl || !e.supaAnon) return null;
  try {
    const r = await fetch(e.supaUrl + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: e.supaAnon },
    });
    if (!r.ok) return null;
    const user = await r.json().catch(() => null);
    if (!user || !user.id) return null;
    return user;
  } catch (_) {
    return null;
  }
}

const VALID_PLANS = new Set(["monthly", "quarterly"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }
  const e = env();
  const user = await verifyUser(req, e);
  if (!user) {
    res.status(401).json({ error: "Sesión requerida." });
    return;
  }

  if (!e.stripeKey) {
    res.status(503).json({ error: "Pasarela de pago no configurada. Contacta al administrador." });
    return;
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (_) {
    res.status(400).json({ error: "JSON inválido." });
    return;
  }

  const planId = String(body.planId || "");
  if (!VALID_PLANS.has(planId)) {
    res.status(400).json({ error: "Plan no válido. Usa 'monthly' o 'quarterly'." });
    return;
  }

  const priceId = planId === "quarterly" ? e.priceQuarterly : e.priceMonthly;
  if (!priceId) {
    res.status(503).json({ error: "Plan no configurado en el servidor. Contacta al administrador." });
    return;
  }

  const successUrl = e.appUrl + "/?checkout=success&plan_id=" + planId;
  const cancelUrl  = e.appUrl + "/?checkout=cancel";

  const params = new URLSearchParams();
  params.set("mode",           "payment");
  params.set("success_url",    successUrl);
  params.set("cancel_url",     cancelUrl);
  params.append("line_items[0][price]",    priceId);
  params.append("line_items[0][quantity]", "1");
  params.set("metadata[user_id]", user.id);
  params.set("metadata[plan_id]", planId);
  if (user.email) params.set("customer_email", user.email);

  try {
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method:  "POST",
      headers: {
        "Authorization": "Bearer " + e.stripeKey,
        "Content-Type":  "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data || !data.url) {
      const msg = (data && data.error && data.error.message) || "No se pudo iniciar la sesión de pago.";
      res.status(502).json({ error: msg });
      return;
    }
    res.status(200).json({ url: data.url });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
}
