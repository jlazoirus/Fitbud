/*
  Fitbud runtime config.

  Este archivo se carga antes de la app. Para un despliegue público,
  evita poner aquí una API key privada de Claude: cualquier valor en
  una app estática puede ser leído desde el navegador. Supabase usa una
  publishable key, pero protege escrituras con RLS/Auth si el sitio es público.
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
