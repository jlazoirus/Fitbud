-- REQ-255: recordatorios por WhatsApp (Cloud API de Meta). Diseño y activación:
-- docs/whatsapp-reminders.md.
-- Dependencias: notifications.sql, push_subscriptions.sql,
-- notifications_journey.sql, notifications_morning.sql y
-- notifications_plan_expiry.sql. Idempotente; aplicar manualmente en
-- Supabase → SQL Editor:
--   psql $DATABASE_URL -f supabase/whatsapp.sql
--
-- Mientras no se aplique, /api/notify no envía WhatsApp: no puede leer
-- whatsapp_links, y el CHECK rechazaría el registro del intento.
--
-- ROLLBACK (deja los tipos de REQ-351):
--   DROP TABLE IF EXISTS whatsapp_links CASCADE;
--   ALTER TABLE notification_log DROP COLUMN IF EXISTS provider_message_id;
--   DELETE FROM notification_log WHERE notification_type = 'whatsapp';
--   ALTER TABLE notification_log DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
--   ALTER TABLE notification_log ADD CONSTRAINT notification_log_notification_type_check
--     CHECK (notification_type IN ('nutrition','training','push_streak','comeback','push_comeback','push_last_call','morning','push_morning','plan_expiry'));

-- ── whatsapp_links ───────────────────────────────────────────────────────────
-- Un número por cuenta. Lo escribe solo el servidor (service role): el código
-- de vinculación, el número que llega firmado por Meta y la baja.
CREATE TABLE IF NOT EXISTS whatsapp_links (
  user_id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_e164           TEXT        CHECK (phone_e164 IS NULL OR phone_e164 ~ '^[1-9][0-9]{7,14}$'),
  opted_in             BOOLEAN     NOT NULL DEFAULT false,
  consent_at           TIMESTAMPTZ,
  opted_out_at         TIMESTAMPTZ,
  paused_at            TIMESTAMPTZ,            -- 3 fallos de entrega seguidos
  fail_count           SMALLINT    NOT NULL DEFAULT 0,
  link_code            TEXT        UNIQUE,
  link_code_expires_at TIMESTAMPTZ,
  timezone             TEXT,                   -- zona del dispositivo al pedir el código
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un número activo pertenece a una sola cuenta.
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_links_phone_active_idx
  ON whatsapp_links (phone_e164) WHERE opted_in;

ALTER TABLE whatsapp_links ENABLE ROW LEVEL SECURITY;

-- El usuario solo lee su fila; no hay políticas de escritura (solo service role).
DROP POLICY IF EXISTS "whatsapp_links_read_self" ON whatsapp_links;
CREATE POLICY "whatsapp_links_read_self" ON whatsapp_links
  FOR SELECT
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON whatsapp_links FROM anon, authenticated;

-- ── notification_log ─────────────────────────────────────────────────────────
-- Id del mensaje de Meta (wamid) para marcar el error si la entrega falla.
ALTER TABLE notification_log
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT;

CREATE INDEX IF NOT EXISTS notification_log_provider_message_idx
  ON notification_log (provider_message_id) WHERE provider_message_id IS NOT NULL;

-- Conteo del tope mensual (WHATSAPP_MONTHLY_CAP).
CREATE INDEX IF NOT EXISTS notification_log_type_delivered_idx
  ON notification_log (notification_type, delivered_at);

ALTER TABLE notification_log
  DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
ALTER TABLE notification_log
  ADD CONSTRAINT notification_log_notification_type_check
  CHECK (notification_type IN (
    'nutrition', 'training', 'push_streak',          -- aviso del día (correo y push) y rescate de ayer
    'comeback', 'push_comeback',                    -- regreso, volver a entrenar e invitación al push
    'push_last_call',                               -- última llamada de racha
    'morning', 'push_morning',                      -- resumen de la mañana (REQ-298)
    'plan_expiry',                                  -- vencimiento de un plan pagado (REQ-351)
    'whatsapp'                                      -- aviso del día por WhatsApp (REQ-255)
  ));
