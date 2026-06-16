-- Recordatorios de inactividad por correo (REQ-24)
-- Dependencias: auth.sql, plan_cycles.sql, privacy.sql
-- Aplicar manualmente: psql $DATABASE_URL -f supabase/notifications.sql
--
-- Proveedor de correo: Resend (resend.com) — variables Vercel necesarias:
--   RESEND_API_KEY       API key de Resend
--   NOTIFY_FROM_EMAIL    dirección verificada, ej: recordatorios@fitbros.app
--   NOTIFY_APP_URL       URL pública de la app, ej: https://fitbud-green.vercel.app
--   CRON_SECRET          cadena aleatoria para proteger el endpoint del cron
-- El cron se ejecuta en Vercel cada hora: "0 * * * *"
-- Hobby plan permite hasta 2 cron jobs con intervalo mínimo de 60 min.
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS notification_log CASCADE;
--   DROP TABLE IF EXISTS notification_preferences CASCADE;

-- ── notification_preferences ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_opt_in     BOOLEAN        NOT NULL DEFAULT false,
  timezone         TEXT           NOT NULL DEFAULT 'UTC',
  notify_hour      SMALLINT       NOT NULL DEFAULT 20
                     CHECK (notify_hour >= 0 AND notify_hour <= 23),
  enabled_days     SMALLINT[]     NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6]::SMALLINT[],
  notify_nutrition BOOLEAN        NOT NULL DEFAULT true,
  notify_training  BOOLEAN        NOT NULL DEFAULT true,
  unsubscribe_token TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ── notification_log ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_log (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT     NOT NULL
                     CHECK (notification_type IN ('nutrition', 'training')),
  reference_date   DATE      NOT NULL,
  idempotency_key  TEXT      NOT NULL UNIQUE,
  status           TEXT      NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','sent','skipped','error','bounced','cancelled')),
  attempted_at     TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_log_user_date_idx
  ON notification_log (user_id, reference_date, notification_type);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_prefs_self"    ON notification_preferences;
DROP POLICY IF EXISTS "notif_log_read_self" ON notification_log;

-- Cada usuario gestiona sus propias preferencias
CREATE POLICY "notif_prefs_self" ON notification_preferences
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cada usuario puede leer su historial de envíos (transparencia / baja)
CREATE POLICY "notif_log_read_self" ON notification_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- El cron usa service role, que omite RLS, para escribir en notification_log.
