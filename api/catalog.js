// Serverless: devuelve el catálogo de planes de suscripción.
// Público (sin sesión). Cache CDN: 5 min.
const FALLBACK_PLANS = [
  {
    id: "monthly",
    name: "Plan mensual",
    price_usd: 14,
    duration_days: 30,
    auto_renew: false,
    active: true,
    badge: null,
    description: "Acceso completo. Sin permanencia. Cancela cuando quieras.",
    features: [
      "Plan de nutrición personalizado",
      "Rutinas de entrenamiento guiadas",
      "Seguimiento de progreso",
      "Adaptaciones y contingencias",
      "Rachas e hitos de constancia",
      "Recordatorios opcionales",
    ],
    catalog_version: "2026-06-16",
  },
  {
    id: "quarterly",
    name: "Paquete 3 meses",
    price_usd: 36,
    duration_days: 90,
    auto_renew: false,
    active: true,
    badge: "Mejor valor",
    description: "Ahorra un 15 % respecto al plan mensual. Ideal para un ciclo completo.",
    features: [
      "Todo lo del plan mensual",
      "Ahorro del 15 %",
      "Acceso a ciclos de 10 semanas",
      "Recap detallado al cerrar ciclo",
      "Fotos de progreso privadas",
      "Prioridad en nuevas funciones",
    ],
    catalog_version: "2026-06-16",
  },
];

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    anon: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "",
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  const e = env();
  if (!e.url || !e.anon) {
    res.status(200).json({ plans: FALLBACK_PLANS, source: "fallback" });
    return;
  }
  try {
    const r = await fetch(
      e.url + "/rest/v1/subscription_plans?active=eq.true&order=duration_days.asc"
        + "&select=id,name,price_usd,duration_days,auto_renew,active,badge,description,features,catalog_version",
      { headers: { apikey: e.anon, Authorization: "Bearer " + e.anon } }
    );
    if (!r.ok) {
      res.status(200).json({ plans: FALLBACK_PLANS, source: "fallback" });
      return;
    }
    const plans = await r.json().catch(() => null);
    if (!Array.isArray(plans) || !plans.length) {
      res.status(200).json({ plans: FALLBACK_PLANS, source: "fallback" });
      return;
    }
    res.status(200).json({ plans, source: "db" });
  } catch (_) {
    res.status(200).json({ plans: FALLBACK_PLANS, source: "fallback" });
  }
}
