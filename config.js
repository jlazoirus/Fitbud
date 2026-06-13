/*
  Fitbud runtime config (FALLBACK opcional).

  En producción las credenciales NO van aquí: viven como variables de
  entorno en Vercel y la app las obtiene vía /api/config y /api/claude
  (ver README → Despliegue). Así nada de esto queda en GitHub.

  Este archivo es solo un fallback para desarrollo local sin funciones.
  ⚠️ NO pongas aquí la API key de Claude si vas a publicar el repo:
  cualquier valor en una app estática es legible desde el navegador.
  La publishable key de Supabase sí es pública por diseño (la protege el RLS).
*/
window.FITBUD_CONFIG = {
  anthropic: {
    apiKey: "",
    model: "claude-haiku-4-5-20251001",
  },
  supabase: {
    url: "",
    publishableKey: "",
  },
  pwa: {
    registerServiceWorker: true,
  },
};
