# Fitbud 🏋️🥗

Tracker web/PWA de mi plan nutricional y de entrenamiento de **10 semanas** (sáb 13 jun → dom 23 ago 2026). App estática, sin frameworks ni build step.

**🔗 En vivo:** https://fitbud-green.vercel.app/ (desplegado en Vercel; las credenciales viven como variables de entorno en Vercel, no en este repo).

## Qué hace

- **Vista HOY** según la fecha real: comidas del plan, entrenamiento y metas del día.
- **Calorías y macros en vivo** (proteína / carbos / grasa) con barras de progreso; la proteína se destaca con código de color según el ritmo del día.
- **Tipos de día**: PESAS, BAJO, REFEED y DIET BREAK, cada uno con su meta de kcal y macros.
- **Marcar** comidas y entrenamiento como completados (se guarda en `localStorage`).
- **Reemplazar** comidas (otra opción del plan o una personalizada) y **agregar** extras.
- **Navegación** día anterior/siguiente y vista de semana completa.
- **Registro de peso** semanal con gráfico de evolución, indicador de semana y resumen del día.
- **Plan deportivo configurable**: elige Running, Cycling o Natación y combínalo siempre con fuerza en gimnasio o con peso corporal durante las 10 semanas.
- **Instalable como PWA** con manifest, íconos y cache offline del shell de la app.

## Plan de entrenamiento

Cada usuario configura en **Perfil**:

- una disciplina principal: **Running**, **Cycling** o **Natación**;
- un complemento de fuerza: **Gimnasio** o **Peso corporal**.

La semana combina cuatro sesiones de fuerza, una sesión de calidad de la disciplina principal, una sesión aeróbica larga y un día de descanso. El volumen progresa durante las 10 semanas, con descarga en la semana 6 y consolidación en la semana 10. Cada entrenamiento diario todavía se puede reemplazar manualmente.

## Configuración (de dónde salen las credenciales)

La app resuelve sus credenciales en este orden de prioridad:

1. **Override local** guardado en **Ajustes** (solo en tu navegador, `localStorage`). Útil para desarrollo local.
2. **`/api/config`** — config servida por Vercel desde variables de entorno (**la forma de producción**).
3. [`config.js`](config.js) — fallback opcional versionado (se deja vacío en el repo).

Las funciones serverless ([`api/`](api/)) son el corazón de la seguridad:

- **`/api/claude`** — proxy a la API de Anthropic. La API key vive **solo** en el servidor (variable `ANTHROPIC_API_KEY` en Vercel); nunca llega al navegador ni a GitHub.
- **`/api/config`** — devuelve al navegador solo datos públicos (URL + publishable key de Supabase, modelo). **No** devuelve la key de Claude.

## Funciones con IA (Claude)

Con la IA activa se habilitan:

- **Estimar una comida** (kcal + macros) a partir de una descripción.
- **Sugerir comidas** según lo que te queda para la meta del día.
- **Revisar tus macros** con una recomendación concreta.
- **Dictado por voz** (Web Speech API) para registrar lo que comiste.

En producción la IA funciona vía el proxy de Vercel. En desarrollo local (sin funciones) puedes pegar una API key en **Ajustes** para una llamada directa. Sin ninguna de las dos, el tracker funciona **100% manual**.

> 🔒 Con el proxy, la API key de Claude **nunca** es visible para los usuarios ni queda en el repo. (Una key puesta directamente en `config.js` y publicada sí sería visible; por eso la vía recomendada es Vercel.)

## Base de datos de alimentos (Supabase)

La pestaña **Alimentos** usa una base de datos real (Supabase / PostgreSQL) con tres tablas:

- **`ingredients`** — datos nutricionales por 100 g (kcal, proteína, carbos, grasa).
- **`dishes`** + **`dish_ingredients`** — platos como recetas de ingredientes con gramos.
- **`diets`** + **`diet_dishes`** — los menús A/B/C/D y qué plato va cada día.

Los **macros de cada plato y dieta se calculan** sumando sus ingredientes (no se guardan a mano). Desde la app puedes ver, crear y editar ingredientes y platos.

### Preparar la base

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta primero [`supabase/schema.sql`](supabase/schema.sql) y luego [`supabase/seed.sql`](supabase/seed.sql) (datos precargados: 55 ingredientes, 43 platos, 4 dietas).
3. En **Project Settings → API Keys**, copia la **Project URL** (o el Project ID) y la **Publishable key** (`sb_publishable_...`). Es la que reemplaza a la antigua `anon public` (ahora *legacy*); se usa igual y entra como rol `anon`.
4. Ponlos como variables de entorno en Vercel (ver despliegue). Para desarrollo local, también puedes guardarlos desde **Ajustes → Base de datos**.

> ⚠️ Las políticas RLS del `schema.sql` permiten lectura y escritura al rol anónimo (cómodo para uso personal). Como la URL + publishable key viven en tu navegador, cualquiera que las obtenga podría editar. Para proteger la escritura, activa Supabase Auth y cambia las políticas a `to authenticated`.

## Uso local

Como el micrófono y la PWA requieren contexto seguro, sírvelo desde `localhost`:

```bash
python3 -m http.server 8923
# abre http://localhost:8923
```

En `localhost` o HTTPS el service worker se registra automáticamente. La primera visita cachea el shell de la app para que pueda abrir aunque la red falle; Claude y Supabase siguen necesitando conexión.

## Despliegue en Vercel (gratis)

No hay build: archivos estáticos en la raíz + funciones serverless en [`api/`](api/) (Vercel las detecta solas).

1. [vercel.com](https://vercel.com) → **Add New… → Project** → importa `jlazoirus/Fitbud`.
2. Framework Preset: **Other**. Sin build command ni output dir.
3. En **Settings → Environment Variables**, agrega:

   | Variable | Valor | ¿Secreta? |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | tu key `sk-ant-...` de Claude | **Sí** (solo servidor) |
   | `SUPABASE_URL` | `https://xxxxx.supabase.co` | No (pública) |
   | `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | No (pública) |
   | `ANTHROPIC_MODEL` *(opcional)* | `claude-haiku-4-5-20251001` | No |

4. **Deploy**. Cada `git push` redepliega solo.

Así **todas las keys viven en Vercel**, ninguna en GitHub, y la de Claude tampoco es visible en el navegador (pasa por el proxy `/api/claude`).

> **GitHub Pages** puede seguir sirviendo la app como estático, pero ahí **no corren** las funciones `api/`, así que la IA quedaría apagada (salvo que pongas una API key local en Ajustes). El despliegue principal es Vercel.

### CLI (alternativa)
```bash
npm i -g vercel
vercel            # login la primera vez (con GitHub)
vercel env add ANTHROPIC_API_KEY        # y las demás variables
vercel --prod
```
