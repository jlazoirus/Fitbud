-- REQ-351: avisos de vencimiento de planes pagados (correo 3 días antes y al
-- vencer, con enlace a la tienda web). Diseño: docs/native-migration/COBRO-WEB.md.
-- Dependencias: notifications.sql, push_subscriptions.sql,
-- notifications_journey.sql y notifications_morning.sql. Idempotente; aplicar
-- manualmente en Supabase → SQL Editor:
--   psql $DATABASE_URL -f supabase/notifications_plan_expiry.sql
--
-- Mientras no se aplique, /api/notify no envía estos avisos: el CHECK rechaza
-- el registro del intento en notification_log y el cron sigue con lo demás.
--
-- ROLLBACK (deja los tipos de REQ-298):
--   DELETE FROM notification_log WHERE notification_type = 'plan_expiry';
--   ALTER TABLE notification_log DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
--   ALTER TABLE notification_log ADD CONSTRAINT notification_log_notification_type_check
--     CHECK (notification_type IN ('nutrition','training','push_streak','comeback','push_comeback','push_last_call','morning','push_morning'));

ALTER TABLE notification_log
  DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
ALTER TABLE notification_log
  ADD CONSTRAINT notification_log_notification_type_check
  CHECK (notification_type IN (
    'nutrition', 'training', 'push_streak',          -- aviso del día (correo y push) y rescate de ayer
    'comeback', 'push_comeback',                    -- regreso, volver a entrenar e invitación al push
    'push_last_call',                               -- última llamada de racha
    'morning', 'push_morning',                      -- resumen de la mañana (REQ-298)
    'plan_expiry'                                   -- vencimiento de un plan pagado (REQ-351)
  ));

-- La clave de idempotencia (plan_expiry:<id del plan>:3d|expired) ya es UNIQUE
-- en notification_log. RLS sin cambios: el cron usa service role.
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
