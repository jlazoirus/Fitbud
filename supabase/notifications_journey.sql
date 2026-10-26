-- Journey de recordatorios (REQ-283): resumen de racha por usuario y etapas
-- nuevas en notification_log.
-- Diseño: docs/reminders-journey.md. Dependencias: notifications.sql y
-- push_subscriptions.sql. Idempotente; aplicar manualmente:
--   psql $DATABASE_URL -f supabase/notifications_journey.sql
--
-- Mientras no se aplique, /api/notify no envía las etapas nuevas (registra el
-- intento antes de enviar y el CHECK lo rechaza) y el aviso del día sale sin
-- racha ni rescate (la app no tiene dónde guardar el resumen).
--
-- ROLLBACK (deja la tabla y los tipos de REQ-24/38):
--   ALTER TABLE notification_preferences DROP COLUMN IF EXISTS engagement;
--   DELETE FROM notification_log
--     WHERE notification_type IN ('comeback','push_comeback','push_last_call');
--   ALTER TABLE notification_log DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
--   ALTER TABLE notification_log ADD CONSTRAINT notification_log_notification_type_check
--     CHECK (notification_type IN ('nutrition','training','push_streak'));

-- Resumen que la app escribe al cambiar (racha, rescate posible de ayer,
-- progreso del ciclo). Columna propia para no reescribir profiles.prefs. Sin
-- datos de salud; la política notif_prefs_self ya limita la fila a su dueño.
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS engagement JSONB;

ALTER TABLE notification_log
  DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
ALTER TABLE notification_log
  ADD CONSTRAINT notification_log_notification_type_check
  CHECK (notification_type IN (
    'nutrition', 'training', 'push_streak',          -- aviso del día (correo y push) y rescate de ayer
    'comeback', 'push_comeback',                    -- regreso a los 2/5/7/14/30 días
    'push_last_call'                                -- última llamada de racha
  ));

-- RLS sin cambios (notifications.sql): cada usuario solo escribe su fila de
-- preferencias y lee su historial; el cron usa service role.
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
