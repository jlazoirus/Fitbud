# Fitbud 🏋️🥗

Tracker web/PWA de ciclos personalizados de nutrición y entrenamiento de **4 o 10 semanas**. El ciclo original va del sáb 13 jun al dom 23 ago 2026; los siguientes se recalculan por usuario. App estática, sin frameworks ni build step.

**🔗 En vivo:** https://fitbud-green.vercel.app/ (desplegado en Vercel; las credenciales viven como variables de entorno en Vercel, no en este repo).

## Qué hace

- **Vista HOY** según la fecha real: comidas del plan, entrenamiento y metas del día.
- **Calorías y macros en vivo** (proteína / carbos / grasa) con barras de progreso; la proteína se destaca con código de color según el ritmo del día.
- **Perfil flexible** para calcular macros y registrar horarios de comida, presupuesto, alergias, días/lugares de entrenamiento, equipo, experiencia y limitaciones.
- **Privacidad y seguridad versionadas**: edad mínima de 18 años, un permiso esencial y fotos opcionales, evaluación de aptitud, exportación y borrado de cuenta.
- **Revisión cada 4 semanas** para actualizar peso, objetivo, macros o preferencias sin perder el progreso.
- **Cierre de ciclo** con recap de logros, foto de progreso personal de cuerpo entero y elección del siguiente desafío antes de recalcular el próximo bloque.
- **Metas personales uniformes** para todos los días, calculadas en onboarding y editables desde Perfil.
- **Registrar** comidas y ejecutar entrenamientos; Supabase es la fuente de verdad y `localStorage` mantiene una caché recuperable.
- **Reemplazar** comidas (otra opción del plan o una personalizada) y **agregar** extras.
- **Navegación** día anterior/siguiente y vista de semana completa.
- **Registro de peso** semanal con gráfico de evolución, indicador de semana y resumen del día.
- **Plan deportivo configurable**: elige 4 o 10 semanas, Running, Cycling o Natación y combínalo siempre con fuerza en gimnasio o con peso corporal.
- **Plan de entrenamiento personalizado**: prepara, revisa y activa 4 o 10 semanas completas usando solo días, lugares, recursos y ejercicios compatibles; permite cambiar una semana o sesión sin rehacer el resto.
- **Ejercicios guiados**: cada rutina enlaza un catálogo propio con instrucciones, respiración, errores comunes, señales de seguridad y demostraciones SVG animadas que se pueden pausar.
- **Reproductor de entrenamiento**: calentamiento, series o intervalos, carga/repeticiones/RPE, descansos temporizados, sustituciones y cierre completo o parcial recuperable al reabrir la PWA.
- **Consumo controlado del coach**: cada acción reserva una unidad server-side; al alcanzar el límite reutiliza opciones compatibles o una alternativa determinista sin mostrar contadores.
- **Instalable como PWA** con manifest, íconos y cache offline del shell de la app.

## Plan de entrenamiento

Cada usuario configura en **Perfil**:

- una disciplina principal: **Running**, **Cycling** o **Natación**;
- un complemento de fuerza: **Gimnasio** o **Peso corporal**;
- entre **3 y 6 días exactos** y el lugar disponible cada día;
- minutos por sesión, equipo, experiencia, prioridad, horario y movimientos a evitar.

El reparto se adapta a la disponibilidad real y coloca las sesiones deportivas en los días compatibles con piscina o exterior. Natación valida que existan suficientes días con piscina. Desde **Entreno → Preparar mi plan**, Fitbros construye las 4 o 10 semanas, valida ejercicios, dosis, tiempo y limitaciones, y muestra el borrador antes de activarlo. El bloque corto consolida en la semana 4; el largo descarga en la semana 6 y consolida en la semana 10. Una semana o sesión puede prepararse otra vez sin reemplazar el resto.

Todas las sesiones publicadas usan IDs del catálogo de ejercicios, no nombres libres. La vista **Entreno** muestra la demostración y las instrucciones de cada movimiento; `prefers-reduced-motion` deja la ilustración estática. Los administradores pueden buscar, filtrar, crear, editar o archivar ejercicios desde **Perfil → Ejercicios** y revisar que cada registro tenga fuente, licencia y media.

Al iniciar una sesión, Fitbros la ordena en calentamiento, bloque principal y vuelta a la calma. En fuerza registra cada serie con repeticiones, carga o asistencia y RPE; los descansos tienen temporizador y una sustitución conserva la dosis del movimiento. Running, cycling y natación se presentan como bloques con objetivo, intensidad, recuperación y timer. Pausar, cerrar o recargar conserva el avance en el estado diario sincronizado con Supabase. El cierre solicita dificultad y señales anormales antes de marcar el resultado como completo o parcial.

## Configuración inicial y macros

Después del primer inicio de sesión, Fitbud guía al usuario por cinco pasos:

1. Datos corporales y nivel de actividad.
2. Objetivo y cálculo editable de calorías, proteína, carbohidratos y grasas.
3. Disciplina, días, lugares, recursos y limitaciones de entrenamiento.
4. Número y horario de comidas, ventana alimentaria, tiempo de cocina y presupuesto.
5. Patrón de alimentación, alergias, privacidad, consentimientos y evaluación básica de seguridad.

El cálculo usa Katch-McArdle cuando se proporciona el porcentaje de grasa corporal y Mifflin-St Jeor en caso contrario. El perfil queda guardado por usuario en `profiles.prefs` con `profileSchemaVersion: 3`, incluida su zona horaria para ventanas diarias; las cuentas existentes reciben defaults compatibles sin repetir el onboarding. Los consentimientos y la evaluación viven en tablas versionadas independientes. Cada 28 días la app pregunta si se desea revisar la configuración; también puede abrirse manualmente desde **Perfil → Recalcular objetivos y preferencias**.

Al terminar la duración elegida, Fitbud resume entrenamientos, adherencia, cambio de peso, grasa corporal y mejor racha. El usuario puede guardar una foto de progreso personal de cuerpo entero y elegir entre mantener, continuar, mejorar rendimiento o ganar fuerza. Esa elección vuelve a abrir el onboarding y crea un ciclo nuevo de 4 o 10 semanas con fechas, macros y reparto deportivo recalculados.

## Configuración (de dónde salen las credenciales)

La app resuelve sus credenciales en este orden de prioridad:

1. **Override local** guardado en **Ajustes** (solo en tu navegador, `localStorage`). Útil para desarrollo local.
2. **`/api/config`** — config servida por Vercel desde variables de entorno (**la forma de producción**).
3. [`config.js`](config.js) — fallback opcional versionado (se deja vacío en el repo).

Las funciones serverless ([`api/`](api/)) son el corazón de la seguridad:

- **`/api/claude`** — proxy a la API de Anthropic. Valida la respuesta, reserva cuota atómicamente, guarda opciones compatibles y reutiliza el pool privado sin una llamada externa cuando corresponde. La API key vive **solo** en el servidor.
- **`/api/config`** — devuelve al navegador solo datos públicos (URL + publishable key de Supabase, modelo). **No** devuelve la key de Claude.
- **`/api/admin`** — lista, activa/desactiva y cambia contraseñas. Exige un administrador activo y usa `SUPABASE_SERVICE_ROLE_KEY` únicamente en el servidor.
- **`/api/privacy`** — exporta los datos del usuario autenticado y borra cuenta, datos y fotos tras una confirmación estricta. Usa `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor.

## Privacidad y seguridad

Ningún plan nuevo ni llamada del coach se habilita sin el permiso esencial y la evaluación de seguridad vigentes. La interfaz reúne el uso de datos para personalizar el plan en un solo check y deja como segundo check opcional únicamente las fotos de progreso personal. Fitbros no vende estos datos ni los usa para publicidad. Una señal de alerta pausa las rutinas y mantiene disponibles nutrición, historial y exportación.

La política operativa, retención y advertencias para revisión legal están en [`PRIVACY.md`](PRIVACY.md). El texto es preliminar y requiere revisión profesional antes del lanzamiento comercial.

## Administración de usuarios

Los administradores tienen una vista **Perfil → Usuarios** con búsqueda y filtros. Desde allí pueden:

- activar o desactivar cuentas;
- asignar una nueva contraseña;
- enviar un correo de recuperación;
- crear o reiniciar una cuenta QA conservando sus credenciales pero eliminando perfil, progreso, planes, consentimientos y fotos para repetir el onboarding completo;
- consultar fecha de alta y último acceso.
- configurar límites por acción, desactivar una función costosa, comparar respuestas nuevas/reutilizadas y otorgar o reiniciar cortesía por usuario.

Desactivar una cuenta actualiza `profiles.active` y bloquea al usuario en Supabase Auth. También queda protegido por RLS y no puede escribir ni usar Claude. El servidor impide que un administrador se desactive a sí mismo o desactive al último administrador activo.

La herramienta **Preparar usuario QA** solo reinicia cuentas creadas por ella y marcadas internamente como prueba. Si el correo pertenece a una cuenta normal o administradora, la operación se rechaza. El administrador puede elegir **Reiniciar e ingresar** para salir de su sesión y abrir inmediatamente el onboarding con la cuenta limpia.

Para habilitar esta función en una instalación existente, ejecuta [`supabase/admin.sql`](supabase/admin.sql) en el SQL Editor. La migración también evita que un usuario pueda elevarse a administrador o cambiar su propio estado mediante una llamada directa a REST.

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
2. En el **SQL Editor**, ejecuta en orden [`supabase/schema.sql`](supabase/schema.sql), [`supabase/seed.sql`](supabase/seed.sql), [`supabase/auth.sql`](supabase/auth.sql), [`supabase/plan_cycles.sql`](supabase/plan_cycles.sql), [`supabase/privacy.sql`](supabase/privacy.sql), [`supabase/exercises.sql`](supabase/exercises.sql) y [`supabase/coach_quota.sql`](supabase/coach_quota.sql). Las migraciones finales crean planes, privacidad, la biblioteca compartida y el control de consumo con RLS.
3. En **Project Settings → API Keys**, copia la **Project URL** (o el Project ID) y la **Publishable key** (`sb_publishable_...`). Es la que reemplaza a la antigua `anon public` (ahora *legacy*); se usa igual y entra como rol `anon`.
4. Ponlos como variables de entorno en Vercel (ver despliegue). Para desarrollo local, también puedes guardarlos desde **Ajustes → Base de datos**.

> Para una instalación existente, ejecuta las migraciones idempotentes pendientes en orden: [`supabase/plan_cycles.sql`](supabase/plan_cycles.sql) si aún no se aplicó, después [`supabase/privacy.sql`](supabase/privacy.sql), [`supabase/exercises.sql`](supabase/exercises.sql) y finalmente [`supabase/coach_quota.sql`](supabase/coach_quota.sql). No se ejecutan automáticamente en producción.

El catálogo base se mantiene en [`exercise-catalog.js`](exercise-catalog.js). Después de editarlo, regenera la migración y valida referencias con:

```bash
node scripts/generate-exercise-sql.mjs
node scripts/validate-exercises.mjs
node scripts/validate-workout-player.mjs
node scripts/validate-training-plan.mjs
node scripts/test-training-plan-api.mjs
node scripts/validate-coach-quota.mjs
node scripts/test-coach-quota.mjs
```

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
   | `SUPABASE_SERVICE_ROLE_KEY` | service role para cuotas, `/api/admin` y `/api/privacy` | **Sí (solo servidor)** |
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
