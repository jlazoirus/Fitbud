// Devuelve al navegador la configuración PÚBLICA, leída de variables de
// entorno en Vercel. NO incluye la API key de Claude (esa solo se usa
// server-side en /api/claude). La publishable key de Supabase es pública
// por diseño; lo que protege la escritura es el RLS.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
  res.status(200).json({
    supabase: {
      url: process.env.SUPABASE_URL || "",
      publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || "",
    },
    anthropic: {
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      // El proxy solo se anuncia cuando puede aplicar cuota server-side.
      proxy: !!process.env.ANTHROPIC_API_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    signup: {
      // REQ-205: beta cerrada por defecto (registro solo con código de
      // invitación). SIGNUP_MODE=open reabre el registro; además hay que
      // reactivar las altas públicas en Supabase (Auth → Sign In / Providers).
      mode: process.env.SIGNUP_MODE === "open" ? "open" : "invite",
    },
    checkout: {
      // REQ-104: el cliente usa esto para ocultar botones de compra si el
      // checkout no esta configurado, en vez de dejarlos fallar en /api/checkout.
      enabled: !!process.env.STRIPE_SECRET_KEY,
    },
  });
}
