# Fitbud 🏋️🥗

Tracker web de mi plan nutricional y de entrenamiento de **10 semanas** (sáb 13 jun → dom 23 ago 2026). Un solo archivo `index.html`, sin frameworks ni dependencias.

**🔗 En vivo:** https://jlazoirus.github.io/Fitbud/

## Qué hace

- **Vista HOY** según la fecha real: comidas del plan, entrenamiento y metas del día.
- **Calorías y macros en vivo** (proteína / carbos / grasa) con barras de progreso; la proteína se destaca con código de color según el ritmo del día.
- **Tipos de día**: PESAS, BAJO, REFEED y DIET BREAK, cada uno con su meta de kcal y macros.
- **Marcar** comidas y entrenamiento como completados (se guarda en `localStorage`).
- **Reemplazar** comidas (otra opción del plan o una personalizada) y **agregar** extras.
- **Navegación** día anterior/siguiente y vista de semana completa.
- **Registro de peso** semanal con gráfico de evolución, indicador de semana y resumen del día.

## Funciones con IA (opcionales — Claude API)

En **Ajustes** puedes pegar tu API key de [console.anthropic.com](https://console.anthropic.com). Con ella se habilitan:

- **Estimar una comida** (kcal + macros) a partir de una descripción.
- **Sugerir comidas** según lo que te queda para la meta del día.
- **Revisar tus macros** con una recomendación concreta.
- **Dictado por voz** (Web Speech API) para registrar lo que comiste.

Sin API key, el tracker funciona **100% manual**.

> 🔒 La API key vive solo en el `localStorage` de tu navegador. **Nunca** se escribe en el código ni se sube al repo.

## Uso local

Como el micrófono requiere contexto seguro, sírvelo desde `localhost`:

```bash
python3 -m http.server 8923
# abre http://localhost:8923
```

## Despliegue en Vercel (gratis)

La app es un único HTML estático, así que no necesita configuración de build.

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
