-- Web Push VAPID: suscripciones y extensión de preferencias/log (REQ-38)
-- Transporte: Web Push estándar con VAPID (sin FCM ni OneSignal).
-- Dependencias: notifications.sql (notification_preferences, notification_log)
--
-- Variables de entorno requeridas en Vercel (además de las de REQ-24):
--   VAPID_PRIVATE_KEY   — clave privada VAPID (solo servidor, nunca cliente/repo)
--   VAPID_SUBJECT       — ej: mailto:j.lazo.ir@gmail.com
--   VAPID_PUBLIC_KEY    — clave pública VAPID (opcional en servidor; el frontend usa literal)
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS push_subscriptions CASCADE;
--   ALTER TABLE notification_preferences DROP COLUMN IF EXISTS push_opt_in;
--   -- Revertir constraint de notification_type requiere DROP + ADD manual

-- ── push_subscriptions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL,
  keys_p256dh TEXT        NOT NULL,
  keys_auth   TEXT        NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

-- ── Agregar push_opt_in a notification_preferences ───────────────────────────
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS push_opt_in BOOLEAN NOT NULL DEFAULT false;

-- ── Extender notification_type para aceptar push_streak ──────────────────────
-- DROP + ADD es la única forma de modificar un CHECK en PostgreSQL
DO $$ BEGIN
  ALTER TABLE notification_log
    DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
  ALTER TABLE notification_log
    ADD CONSTRAINT notification_log_notification_type_check
    CHECK (notification_type IN ('nutrition', 'training', 'push_streak'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── RLS en push_subscriptions ─────────────────────────────────────────────────
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subs_self" ON push_subscriptions;
CREATE POLICY "push_subs_self" ON push_subscriptions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- El cron usa service role (omite RLS) para leer suscripciones y enviar push.
