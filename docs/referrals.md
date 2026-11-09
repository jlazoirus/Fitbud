# Beneficio por invitaciones — REQ-317

Lanzamiento configurado: **9 de noviembre de 2026, 09:00 America/Lima** (14:00 UTC).

## Estado en producción

Activado el 02/11/2026: `supabase/referrals.sql` aplicada en el proyecto Supabase `fitbud` (`wtqnvtixvfapdbzcegdw`), verificada y probada con cuentas de prueba en una transacción revertida. Vercel sirve `main` con REQ-317 y tiene las variables de correo y `CRON_SECRET`; el workflow horario está activo. La campaña sale sola desde el 09/11 a las 09:00 Lima, con la primera ejecución del cron (GitHub la corre cada pocas horas, no exactamente cada hora).

## Activación

1. Aplicar manualmente `supabase/referrals.sql` después de las migraciones existentes de perfiles, analytics (product_events), entitlements, coupon_codes y notifications. No ejecutar `schema.sql` sobre una instalación existente.
2. Desplegar el commit completo en Vercel. Se reutilizan SUPABASE_URL, SUPABASE_ANON_KEY/PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, NOTIFY_FROM_EMAIL, NOTIFY_APP_URL y CRON_SECRET existentes. No se requieren claves nuevas.
3. Confirmar que el workflow horario `.github/workflows/notify-hourly.yml` está habilitado. El cron diario solo mantiene Supabase despierto; la campaña se suma al job horario existente.
4. Antes del lanzamiento, `GET /api/entitlement?action=referrals` con sesión devuelve eligible=false. Ningún correo de campaña sale antes del 09/11 a las 09:00 Lima. El cron no envía si la nueva RPC no existe.
5. A partir del lanzamiento, ejecutar el cron autorizado con `?dry_run=true` para comprobar destinatarios sin enviar. La consulta de elegibilidad puede inscribir a los miembros de la cohorte; dry_run nunca genera códigos ni acredita meses.
6. El primer job horario posterior al lanzamiento enviará el correo. Reintentos hasta el 16/11 a las 09:00 Lima. El despliegue no constituye confirmación de entrega: revisar `notification_log` y Resend tras la ejecución.

## Audiencia y beneficio

Cuenta habilitada al consultar, creada antes del lanzamiento, con **al menos 2 usos de la app en los últimos 7 días**. Se cuentan sesiones distintas (`product_events.event_type=session_start`, `session_id` no vacío) entre 02/11/2026 09:00 y 09/11/2026 09:00 Lima, ambos incluidos. Dos usos pueden ocurrir el mismo día; no se exigen dos días distintos ni registrar comidas o entrenos. Eventos repetidos con el mismo session_id cuentan una sola vez. Las sesiones de otras cuentas y las ocurridas fuera de la ventana no cuentan.

La app ya registra session_start al abrir autenticada. Al retomar la PWA tras 30 minutos en segundo plano se inicia otra sesión de uso; cambiar brevemente a WhatsApp no duplica usos. El servidor conserva la pertenencia en `referral_members`; usuarios que se den de baja del correo mantienen el panel. No se usa información de salud en correos o métricas.

Se generan tres enlaces de un solo uso, uno por amigo, reutilizables hasta completar el registro. Generar o compartir no cuenta como éxito. El panel diferencia disponibles (sin éxito), por generar y pendientes. La creación del código se serializa por usuario, incluso desde varios dispositivos.

El amigo debe ser una cuenta nueva creada con esa invitación por el servidor. El marcador en app_metadata no es editable por el cliente. El canje existente dispara un trigger: validación, acceso del amigo, tres meses calendario y recompensa del invitador se confirman o revierten juntos. Al invitador se le extiende su mayor vencimiento activo; si ya no tiene acceso, obtiene tres meses desde el canje. Los meses son calendario, no 90 días fijos. Hasta nueve meses por tres registros. No hay pagos ni renovación automática.

Correo de campaña una vez por usuario, respeta email_opt_in=false y lleva baja firmada. Reutiliza el tipo comeback existente con clave exclusiva `usuario:referral_campaign:2026-11-09`; también envía Idempotency-Key a Resend. No cambia los recordatorios habituales. La notificación dentro de la app es una tarjeta en Hoy y Perfil, sin exigir permiso push. El usuario elige cuándo compartir por WhatsApp o por su cliente de correo; no se envían invitaciones a sus contactos automáticamente.

## Recuperación

Para pausar, retirar `runReferralCampaign` del job y ocultar los accesos al panel. Conservar códigos canjeados, miembros y accesos ya otorgados. No retirar el trigger mientras existan enlaces de referidos habilitados, pues se perdería el control del beneficio. No borrar datos de producción como rollback.

Si la campaña falla en un disparo, el job responde 200, suma el fallo en `errors` (`referral_campaign_error` en el log) y el siguiente disparo reintenta sin duplicar. El workflow horario queda en verde en ese caso: revisar su conteo `errors`.

## Verificación local

`node scripts/test-referrals.mjs` comprueba SQL real en PGlite, idempotencia de migración, audiencia, persistencia de elegibilidad, límites, rollback, ausencia de premios duplicados, meses de ambos lados, permisos y campaña con red simulada. Playwright cubre móvil/escritorio, enlaces, generación, límites, contadores y reintento. Pruebas existentes de invitación cubren compatibilidad del registro cerrado.
