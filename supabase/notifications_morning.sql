-- Resumen de la mañana con el plan del día (REQ-298) y horario del aviso del
-- día ampliado a 06:00–23:00 en la app (el CHECK de notify_hour ya admite 0–23).
-- Diseño: docs/reminders-journey.md. Dependencias: notifications.sql,
-- push_subscriptions.sql y notifications_journey.sql. Idempotente; aplicar
-- manualmente:
--   psql $DATABASE_URL -f supabase/notifications_morning.sql
--
-- Mientras no se aplique, la app guarda los recordatorios sin el resumen de la
-- mañana (reintenta sin esas columnas) y /api/notify no lo envía (no hay
-- opt-in; además el CHECK rechazaría el registro del intento y no se envía).
--
-- ROLLBACK (deja los tipos de REQ-285):
--   ALTER TABLE notification_preferences DROP COLUMN IF EXISTS morning_opt_in;
--   ALTER TABLE notification_preferences DROP COLUMN IF EXISTS morning_hour;
--   DELETE FROM notification_log WHERE notification_type IN ('morning','push_morning');
--   ALTER TABLE notification_log DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
--   ALTER TABLE notification_log ADD CONSTRAINT notification_log_notification_type_check
--     CHECK (notification_type IN ('nutrition','training','push_streak','comeback','push_comeback','push_last_call'));

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS morning_opt_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS morning_hour SMALLINT NOT NULL DEFAULT 7;

DO $$ BEGIN
  ALTER TABLE notification_preferences
    ADD CONSTRAINT notification_preferences_morning_hour_check
    CHECK (morning_hour BETWEEN 5 AND 11);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE notification_log
  DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
ALTER TABLE notification_log
  ADD CONSTRAINT notification_log_notification_type_check
  CHECK (notification_type IN (
    'nutrition', 'training', 'push_streak',          -- aviso del día (correo y push) y rescate de ayer
    'comeback', 'push_comeback',                    -- regreso, volver a entrenar e invitación al push
    'push_last_call',                               -- última llamada de racha
    'morning', 'push_morning'                       -- resumen de la mañana (REQ-298)
  ));

-- RLS sin cambios (notifications.sql): cada usuario solo escribe su fila de
-- preferencias y lee su historial; el cron usa service role.
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
