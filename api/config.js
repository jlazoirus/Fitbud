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
      // true si el servidor tiene la key => la app usará el proxy /api/claude
      proxy: !!process.env.ANTHROPIC_API_KEY,
    },
  });
}
