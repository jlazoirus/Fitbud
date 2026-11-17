-- REQ-357: correos del ciclo de la suscripción mensual (inicio de la prueba,
-- aviso antes del primer cobro, recibo, cobro fallido y cancelación). Diseño:
-- docs/web-publica-y-suscripcion.md §3. Cada correo sale una sola vez por su
-- clave en notification_log (sub:<id de Culqi>:<correo>), que ya es UNIQUE.
-- Dependencias: notifications.sql, push_subscriptions.sql,
-- notifications_journey.sql, notifications_morning.sql,
-- notifications_plan_expiry.sql, whatsapp.sql y suscripciones.sql.
-- Idempotente; aplicar manualmente en Supabase → SQL Editor:
--   psql $DATABASE_URL -f supabase/notifications_subscription.sql
--
-- Mientras no se aplique, ningún correo de la suscripción sale: el CHECK rechaza
-- el registro del intento y, sin registro, no se envía (así no se repite después).
-- Cobros, cancelaciones y el resto del cron siguen igual.
--
-- ROLLBACK (deja los tipos de REQ-255):
--   DELETE FROM notification_log WHERE notification_type = 'subscription';
--   ALTER TABLE notification_log DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;
--   ALTER TABLE notification_log ADD CONSTRAINT notification_log_notification_type_check
--     CHECK (notification_type IN ('nutrition','training','push_streak','comeback','push_comeback','push_last_call','morning','push_morning','plan_expiry','whatsapp'));

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
    'whatsapp',                                     -- aviso del día por WhatsApp (REQ-255)
    'subscription'                                  -- correos de la suscripción mensual (REQ-357)
  ));

-- RLS sin cambios: escribe el servidor (service role) y cada persona lee su historial.
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
