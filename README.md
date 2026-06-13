# Fitbud 🏋️🥗

Tracker web/PWA de mi plan nutricional y de entrenamiento de **10 semanas** (sáb 13 jun → dom 23 ago 2026). App estática, sin frameworks ni build step.

**🔗 En vivo:** https://jlazoirus.github.io/Fitbud/

## Qué hace

- **Vista HOY** según la fecha real: comidas del plan, entrenamiento y metas del día.
- **Calorías y macros en vivo** (proteína / carbos / grasa) con barras de progreso; la proteína se destaca con código de color según el ritmo del día.
- **Tipos de día**: PESAS, BAJO, REFEED y DIET BREAK, cada uno con su meta de kcal y macros.
- **Marcar** comidas y entrenamiento como completados (se guarda en `localStorage`).
- **Reemplazar** comidas (otra opción del plan o una personalizada) y **agregar** extras.
- **Navegación** día anterior/siguiente y vista de semana completa.
- **Registro de peso** semanal con gráfico de evolución, indicador de semana y resumen del día.
- **Instalable como PWA** con manifest, íconos y cache offline del shell de la app.

## Configuración

La app lee servicios externos desde [`config.js`](config.js) al cargar:

```js
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
```

Los valores guardados en **Ajustes** siguen funcionando como override local del navegador, pero ya no son obligatorios si `config.js` está completo.

## Funciones con IA (opcionales — Claude API)

Define la API key de [console.anthropic.com](https://console.anthropic.com) en `config.js` o guárdala en **Ajustes**. Con ella se habilitan:

- **Estimar una comida** (kcal + macros) a partir de una descripción.
- **Sugerir comidas** según lo que te queda para la meta del día.
- **Revisar tus macros** con una recomendación concreta.
- **Dictado por voz** (Web Speech API) para registrar lo que comiste.

Sin API key, el tracker funciona **100% manual**.

> 🔒 En una app estática, cualquier API key puesta en `config.js` queda visible para el navegador. Úsala así solo en despliegues privados/locales. Para un sitio público, deja Claude vacío o usa un backend/proxy propio.

## Base de datos de alimentos (Supabase)

La pestaña **Alimentos** usa una base de datos real (Supabase / PostgreSQL) con tres tablas:

- **`ingredients`** — datos nutricionales por 100 g (kcal, proteína, carbos, grasa).
- **`dishes`** + **`dish_ingredients`** — platos como recetas de ingredientes con gramos.
- **`diets`** + **`diet_dishes`** — los menús A/B/C/D y qué plato va cada día.

Los **macros de cada plato y dieta se calculan** sumando sus ingredientes (no se guardan a mano). Desde la app puedes ver, crear y editar ingredientes y platos.

### Preparar la base

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta primero [`supabase/schema.sql`](supabase/schema.sql) y luego [`supabase/seed.sql`](supabase/seed.sql) (datos precargados: 55 ingredientes, 43 platos, 4 dietas).
3. En **Project Settings → API Keys**, copia la **Project URL** y la **Publishable key** (`sb_publishable_...`). Es la que reemplaza a la antigua `anon public` (ahora *legacy*); se usa igual y entra como rol `anon`.
4. Pega esos valores en `config.js`. Alternativamente, puedes guardarlos desde **Ajustes → Base de datos** como override local.

> ⚠️ Las políticas RLS del `schema.sql` permiten lectura y escritura al rol anónimo (cómodo para uso personal). Como la URL + publishable key viven en tu navegador, cualquiera que las obtenga podría editar. Para proteger la escritura, activa Supabase Auth y cambia las políticas a `to authenticated`.

## Uso local

Como el micrófono y la PWA requieren contexto seguro, sírvelo desde `localhost`:

```bash
python3 -m http.server 8923
# abre http://localhost:8923
```

En `localhost` o HTTPS el service worker se registra automáticamente. La primera visita cachea el shell de la app para que pueda abrir aunque la red falle; Claude y Supabase siguen necesitando conexión.

## Despliegue en Vercel (gratis)

La app es estática, así que no necesita configuración de build.

**Opción A — Dashboard (recomendada, auto-deploy):**
1. [vercel.com](https://vercel.com) → **Add New… → Project**.
2. Importa el repo `jlazoirus/Fitbud`.
3. Framework Preset: **Other**. Sin build command ni output dir. **Deploy**.
4. Cada `git push` vuelve a desplegar solo.

**Opción B — CLI:**
```bash
npm i -g vercel
vercel          # login la primera vez (con GitHub)
vercel --prod   # publica producción
```

El micrófono y la API funcionan en la URL HTTPS de Vercel.

Alternativas gratis equivalentes: Netlify, Cloudflare Pages o GitHub Pages.
