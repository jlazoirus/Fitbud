# Migraciones SQL pendientes — Fitbros (producción)

> **Fecha de generación:** 2026-06-16
>
> Este documento lista todos los scripts SQL que deben ejecutarse **manualmente** en el SQL Editor de Supabase. El agente autónomo no puede aplicarlos.
>
> **Proyecto Supabase:** `wtqnvtixvfapdbzcegdw` (URL en variables de Vercel)

---

## Estado base asumido

Se asume que ya se aplicaron en algún momento:

| Script | Qué incluye |
|--------|-------------|
| `supabase/schema.sql` | Tablas base del catálogo (ingredients, dishes, diets, etc.) |
| `supabase/seed.sql` | Datos iniciales del catálogo |
| `supabase/auth.sql` | Multiusuario: profiles, day_log/weight_log por usuario, RLS, plan_cycles |

> ⚠️ **NUNCA re-ejecutes `schema.sql` ni `auth.sql` en producción.** `schema.sql` destruye todo el catálogo de alimentos. `auth.sql` hace `DROP TABLE IF EXISTS day_log CASCADE` y `DROP TABLE IF EXISTS weight_log CASCADE`, borrando todo el historial de usuarios.

Los siguientes scripts son **seguros de re-ejecutar** (idempotentes): no borran datos de usuario.

---

## Scripts descartados (obsoletos o no-migraciones)

| Script | Por qué no ejecutar |
|--------|---------------------|
| `supabase/day_log.sql` | Supersedido por `auth.sql` (versión monosuario sin user_id) |
| `supabase/weight_log.sql` | Supersedido por `auth.sql` (versión monosuario sin user_id) |
| `supabase/validate.sql` | No es migración — son consultas de diagnóstico para pegar en el editor y verificar integridad del catálogo |

---

## Migraciones pendientes (orden de ejecución)

```
1. seed.sql
2. weight_bf.sql
3. admin.sql
4. plan_cycles.sql
5. privacy.sql
6. exercises.sql
7. coach_quota.sql
8. notifications.sql
9. entitlements.sql
10. billing.sql
11. analytics.sql
12. push_subscriptions.sql
```

---

### 1. `supabase/seed.sql`

**REQ:** REQ-01 (normalización de recetas y macros)

**Qué hace:** Re-carga el catálogo completo de alimentos: 55 ingredientes, 43 platos con receta en gramos, 4 dietas (A/B/C/D) y 28 asignaciones almuerzo-por-día. Usa `TRUNCATE … RESTART IDENTITY CASCADE` para ser re-ejecutable sin duplicados. **No toca tablas de usuario** (day_log, weight_log, profiles, plan_versions, etc.).

**Por qué es necesario:** Las recetas fueron normalizadas en REQ-01 (gramos actualizados para cumplir los macros objetivo). La DB de producción tiene los valores anteriores.

**Prerequisito:** `schema.sql` ya aplicado.

**Nota:** Este script tarda ~5-10 segundos por el volumen de inserciones. Si la app está activa, las comidas de usuarios se calculan a partir de la DB; al re-cargar, los macros de platos cambiarán inmediatamente para todos.

```sql
-- Ver contenido completo en: supabase/seed.sql
-- (55 ingredientes + 43 platos + 4 dietas + 28 diet_dishes)
-- Ejecutar tal cual desde el archivo.
```

---

### 2. `supabase/weight_bf.sql`

**REQ:** REQ-03 (% grasa corporal)

**Qué hace:** Agrega la columna `bf_pct NUMERIC` a `weight_log` si no existe. Es un `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, por lo que es completamente idempotente.

**Por qué es necesario:** La app escribe y lee `bf_pct` en `weight_log`. Sin esta columna, los registros de composición corporal fallan silenciosamente.

**Prerequisito:** `auth.sql` ya aplicado.

**Nota:** Si `auth.sql` se aplicó recientemente (después del commit que lo incluye), `bf_pct` ya existe y este script es un no-op sin efectos secundarios.

```sql
-- supabase/weight_bf.sql
alter table weight_log add column if not exists bf_pct numeric;
```

---

### 3. `supabase/admin.sql`

**REQ:** REQ-07 (administración de usuarios: activar/desactivar)

**Qué hace:**
- Agrega `profiles.active BOOLEAN NOT NULL DEFAULT TRUE` si no existe.
- Crea (o reemplaza) la función `is_active()` — helper para RLS.
- Crea (o reemplaza) el trigger `protect_profile_system_fields_trigger` — impide que un usuario eleve su propio `is_admin` o `active`.
- Reemplaza las políticas RLS de `profiles`, `day_log`, `weight_log` y el catálogo (`ingredients`, `dishes`, etc.) para que usuarios inactivos queden en solo lectura.

**Por qué es necesario:** Sin este script, desactivar un usuario desde el panel admin (`api/admin.js`) no tiene efecto real en la DB: el usuario inactivo todavía puede escribir.

**Prerequisito:** `auth.sql` ya aplicado.

```sql
-- Ver contenido completo en: supabase/admin.sql
-- (~85 líneas)
```

---

### 4. `supabase/plan_cycles.sql`

**REQ:** REQ-11 / REQ-13 (ciclos de 4 o 10 semanas + versionado de planes)

**Qué hace:**
- Agrega `plan_version_id BIGINT` a `day_log` (FK hacia `plan_versions`).
- Agrega `cycle_start DATE` a `weight_log` y actualiza el PRIMARY KEY a `(user_id, cycle_start, week)` para separar ciclos sucesivos.
- Crea la tabla `plan_versions` (snapshots del plan prescrito por ciclo).
- Crea la tabla `plan_cycles` (historial de ciclos con fechas, recap y foto).
- Crea el bucket privado de Storage `progress-photos` con RLS por `user_id`.

**Por qué es necesario:** El sistema de ciclos sucesivos (`plan_versions`, `ensurePlanVersion()`, `activateTrainingPlanDraft()`) depende completamente de estas tablas. Sin ellas, la app falla al guardar o leer planes.

**Prerequisito:** `auth.sql` ya aplicado.

**Nota:** El `ALTER TABLE weight_log ADD COLUMN IF NOT EXISTS cycle_start` es idempotente. La línea `UPDATE weight_log SET cycle_start = '2026-06-13' WHERE cycle_start IS NULL` inicializa registros preexistentes al ciclo original.

```sql
-- Ver contenido completo en: supabase/plan_cycles.sql
-- (~109 líneas)
```

---

### 5. `supabase/privacy.sql`

**REQ:** REQ-14 (privacidad, consentimientos y aptitud)

**Qué hace:**
- Crea la tabla `user_consents` (historial versionado de consentimientos: `automated_coach`, `body_progress`, `progress_photos`, etc.).
- Crea la tabla `safety_screenings` (cuestionario de aptitud versionado; una señal de alerta bloquea rutinas).
- Aplica RLS: cada usuario solo ve y escribe sus propias filas.

**Por qué es necesario:** Sin estas tablas, el onboarding falla al guardar el consentimiento esencial y el cuestionario de seguridad. La app bloquea el acceso al coach si no hay consentimiento vigente en DB.

**Prerequisito:** `plan_cycles.sql` ya aplicado (usa `is_active()` definida en `admin.sql`/`auth.sql`).

```sql
-- Ver contenido completo en: supabase/privacy.sql
-- (~71 líneas)
```

---

### 6. `supabase/exercises.sql`

**REQ:** REQ-15 (biblioteca guiada de ejercicios)

**Qué hace:**
- Crea la tabla `exercises` (40 ejercicios propios de Fitbros: gimnasio, peso corporal, running, cycling, natación) con todos los campos de instrucción, seguridad, media y licencia.
- Aplica RLS: lectura para cualquier usuario autenticado; escritura solo para admins activos.
- Hace seed con `ON CONFLICT (slug) DO UPDATE`, por lo que es idempotente y actualiza ejercicios existentes.

**Por qué es necesario:** La app carga ejercicios desde `exercises` (`dbLoad()`). Si la tabla no existe, degrada al catálogo local empaquetado. El administrador de ejercicios en la UI (`renderExerciseAdmin()`) requiere la tabla en DB.

**Prerequisito:** `admin.sql` ya aplicado (usa `is_admin()` e `is_active()`).

```sql
-- Ver contenido completo en: supabase/exercises.sql
-- (~418 líneas; incluye 40 ejercicios)
```

---

### 7. `supabase/coach_quota.sql`

**REQ:** REQ-32 (controlar consumo y reutilizar opciones del coach)

**Qué hace:**
- Crea 6 tablas: `coach_quota_policies`, `coach_quota_overrides`, `coach_usage`, `coach_option_pool`, `coach_generation_parts`, `coach_option_impressions`.
- Revoca acceso a `anon`/`authenticated`; solo `service_role` opera estas tablas.
- Crea 6 funciones PL/pgSQL (`reserve_coach_action`, `claim_coach_generation_part`, `complete_fresh_coach_part`, `fail_coach_generation_part`, `select_reusable_coach_part`, `admin_reset_coach_quota`) con `security definer` y concesión solo a `service_role`.
- Hace seed de las políticas por defecto (límites diarios por acción).

**Por qué es necesario:** `api/claude.js` llama a `reserve_coach_action()` vía RPC con service role para reservar cuota antes de llamar a Anthropic. Sin este script, **todas las llamadas al coach fallan con un error de función inexistente**.

**Prerequisito:** `privacy.sql` ya aplicado.

```sql
-- Ver contenido completo en: supabase/coach_quota.sql
-- (~652 líneas; incluye tablas, funciones y grants)
```

---

### 8. `supabase/notifications.sql`

**REQ:** REQ-24 (recordatorios de inactividad por correo)

**Qué hace:**
- Crea la tabla `notification_preferences` (preferencias por usuario: opt-in, hora, días, token de baja).
- Crea la tabla `notification_log` (auditoría e idempotencia del cron; clave `idempotency_key UNIQUE`).
- Aplica RLS: el usuario gestiona sus propias preferencias; lee su historial; el cron escribe con service role.

**Por qué es necesario:** El cron `GET /api/notify` (Vercel, cada hora) y la UI de preferencias en Perfil (`loadNotifPrefs`, `saveNotifPrefs`) dependen de estas tablas. Sin ellas, el cron falla con un error 500 y el panel de preferencias no guarda nada.

**Prerequisito:** `auth.sql` ya aplicado.

**Variables Vercel también necesarias (si no están):**
- `RESEND_API_KEY`
- `NOTIFY_FROM_EMAIL` (ej: `recordatorios@fitbros.app`, verificada en Resend)
- `NOTIFY_APP_URL` (ej: `https://fitbud-green.vercel.app`)
- `CRON_SECRET` (cadena aleatoria; el cron la pasa como `Authorization: Bearer …`)

```sql
-- Ver contenido completo en: supabase/notifications.sql
-- (~70 líneas)
```

---

### 9. `supabase/entitlements.sql`

**REQ:** REQ-25 (oferta, entitlement y paywall)

**Qué hace:**
- Crea la tabla `subscription_plans` (catálogo de planes: `monthly` $14/30d, `quarterly` $36/90d).
- Crea la tabla `user_entitlements` (entitlement activo por usuario: status, origen, fechas, auditoría).
- Crea la función `get_active_entitlement(p_user_id uuid)` con `security definer` y concesión solo a `service_role`.
- Hace seed idempotente del catálogo de planes.

**Por qué es necesario:** `api/entitlement.js` llama a `get_active_entitlement()` para verificar si el usuario tiene plan activo. `api/claude.js` retorna 402 + `paywall:true` si no hay entitlement. Sin este script, el proxy del coach deniega acceso a todos los usuarios con un error de función inexistente.

**Prerequisito:** `coach_quota.sql` ya aplicado (el comentario en el archivo lo indica; la dependencia real es `auth.sql` + `is_active()`).

```sql
-- Ver contenido completo en: supabase/entitlements.sql
-- (~112 líneas)
```

---

---

### 10. `supabase/billing.sql`

**REQ:** REQ-26 (checkout y ciclo de facturación)

**Qué hace:**
- Crea la tabla `billing_events` (auditoría de webhooks de Stripe: stripe_event_id, event_type, user_id, plan_id, entitlement_id, status, payload, error).
- `stripe_event_id` es `UNIQUE` para garantizar idempotencia: un webhook duplicado de Stripe no crea dos entitlements.
- RLS habilitado sin políticas → solo `service_role` puede operar la tabla (el webhook en `api/webhook.js` usa service role).

**Por qué es necesario:** `api/webhook.js` escribe en `billing_events` para auditoría y comprueba duplicados antes de crear entitlements. Sin esta tabla, el webhook falla con error de relación inexistente.

**Prerequisito:** `entitlements.sql` ya aplicado (FK hacia `user_entitlements`).

```sql
-- Ver contenido completo en: supabase/billing.sql
-- (~25 líneas)
```

---

### 11. `supabase/analytics.sql`

**REQ:** REQ-27 (analítica de producto, IA y costos)

**Qué hace:**
- Crea la tabla `product_events` (eventos de embudo anonimizados: session_start, onboarding_complete, paywall_shown, checkout, etc.). RLS: usuarios insertan/leen los propios; service_role accede a todo para vistas admin.
- Crea la tabla `feature_flags` (versionado de prompts y flags de experimentos). Lectura pública; escritura solo admin.
- Extiende `coach_usage` con: `latency_ms INTEGER`, `estimated_cost_usd NUMERIC(10,6)`, `prompt_version TEXT`, `outcome TEXT`.
- Reemplaza `complete_fresh_coach_part` y `fail_coach_generation_part` con versiones que aceptan los nuevos campos como parámetros opcionales con DEFAULT (backward compatible con llamadas existentes).
- Crea vistas admin `v_activation_funnel` (embudo 90d por evento y usuarios únicos) y `v_ai_cost_summary` (costo, latencia y tasa de error por acción 30d).

**Por qué es necesario:** `api/analytics.js` inserta en `product_events` y consulta `v_activation_funnel`/`v_ai_cost_summary`. `api/claude.js` pasa `p_latency_ms`, `p_estimated_cost` y `p_prompt_version` a los RPCs actualizados para registrar métricas de costo en `coach_usage`. Sin este script, los eventos de producto se descartan (404) y los RPCs del coach fallan porque la firma antigua fue reemplazada.

**Prerequisito:** `coach_quota.sql` ya aplicado (las funciones reemplazadas viven en ese script).

**Nota:** El DROP de las funciones antiguas es necesario porque PostgreSQL trata firmas distintas como funciones diferentes. El script DROP + CREATE es idempotente si se ejecuta varias veces porque `CREATE OR REPLACE` recrea la versión nueva.

```sql
-- Ver contenido completo en: supabase/analytics.sql
-- (~200 líneas; incluye tablas, extensión de coach_usage, funciones y vistas)
```

---

## Resumen de orden y dependencias

```
schema.sql ──► seed.sql (re-correr)
     │
     └──► auth.sql (ya aplicado — NO re-ejecutar)
               │
               ├──► weight_bf.sql   (paso 2)
               │
               ├──► admin.sql       (paso 3)
               │         │
               │         ├──► plan_cycles.sql   (paso 4)
               │         │         │
               │         │         └──► privacy.sql      (paso 5)
               │         │                   │
               │         │                   └──► coach_quota.sql   (paso 7)
               │         │                               │
               │         │                               ├──► entitlements.sql (paso 9)
               │         │                               │           │
               │         │                               │           └──► billing.sql (paso 10)
               │         │                               │
               │         │                               └──► analytics.sql (paso 11)
               │         │
               │         └──► exercises.sql    (paso 6)
               │
               └──► notifications.sql          (paso 8, independiente)
                         │
                         └──► push_subscriptions.sql (paso 12)
```

---

### 12. `supabase/push_subscriptions.sql`

**REQ:** REQ-38 (notificaciones push y recordatorios de racha)

**Qué hace:**
- Crea la tabla `push_subscriptions` (`user_id`, `endpoint`, `keys_p256dh`, `keys_auth`, `user_agent`, `created_at`). Restricción `UNIQUE(user_id, endpoint)` para deduplicar suscripciones desde el mismo dispositivo. RLS: cada usuario gestiona las propias; el cron usa service role.
- Agrega la columna `push_opt_in BOOLEAN NOT NULL DEFAULT false` a `notification_preferences` (`ADD COLUMN IF NOT EXISTS`, idempotente).
- Extiende el CHECK de `notification_log.notification_type` para aceptar el valor `push_streak` (idempotente mediante `DO $$ BEGIN … EXCEPTION WHEN OTHERS THEN NULL END $$`).

**Por qué es necesario:** `api/push-subscribe.js` escribe las suscripciones, `api/notify.js` las lee para enviar notificaciones VAPID, y `notification_log` necesita el tipo `push_streak` para la deduplicación diaria.

**Prerequisito:** `notifications.sql` ya aplicado (las tablas `notification_preferences` y `notification_log` deben existir).

> ⚠️ **Variables de entorno que el usuario debe configurar en Vercel antes de que el cron de push funcione en producción:**
> - `VAPID_PRIVATE_KEY` — clave privada VAPID generada con `npx web-push generate-vapid-keys`
> - `VAPID_SUBJECT` — será `mailto:j.lazo.ir@gmail.com`
> - `VAPID_PUBLIC_KEY` — mismo valor que el literal embebido en el frontend (opcional; el frontend usa el literal directamente)

```sql
-- Ver contenido completo en: supabase/push_subscriptions.sql
-- (~50 líneas; incluye tabla, ALTER TABLE, extensión de CHECK y RLS)
```

---

## Cómo ejecutar

1. Ir a **Supabase → SQL Editor** del proyecto `wtqnvtixvfapdbzcegdw`.
2. Abrir el archivo del repo (o copiar su contenido).
3. Pegar en el editor y pulsar **Run**.
4. Verificar que no haya errores en la salida.
5. Para seed.sql: confirmar que la tabla `dishes` tiene ~43 filas con `SELECT COUNT(*) FROM dishes;`.

Para validar la integridad del catálogo tras el seed, pegar el contenido de `supabase/validate.sql` (consultas de diagnóstico, no es migración).
