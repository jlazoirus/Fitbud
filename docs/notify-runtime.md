# Recordatorios: tiempo de ejecución (REQ-383)

El aviso de Jonathan corresponde al 12/11/2026 01:00:04 UTC (11/11, 20:00 Lima),
con estado Timeout en cron-job.org. Este proveedor espera como máximo
[30 segundos por ejecución](https://cron-job.org/en/faq/).

## Causa reproducida

En `d970def`, `runJob` y `runFollowups` recorrían usuarios en serie. Durante la
campaña de referidos, `runReferralCampaign` consultaba elegibilidad y preferencias
antes de comprobar si el correo ya había salido: 151 consultas para 50 personas
ya notificadas, en cada disparo de la semana. Fetch, lectura del cuerpo y Web Push
podían esperar sin límite propio.

Fixture a la hora del aviso: 18 recordatorios, 50 referidos ya enviados, 150 ms
de latencia por petición, dry_run en ambos casos:

| Código | Duración | Peticiones | RPC de referidos |
| --- | ---: | ---: | ---: |
| `d970def` | 31,7 s | 210 | 50 |
| REQ-383 | 3,2 s | 61 | 0 |

Es una reproducción controlada, no una medición de aquella ejecución en producción.
Los registros de Vercel no estaban disponibles durante el diagnóstico (403 del equipo).

## Comportamiento

- Hasta cuatro usuarios concurrentes para recordatorios, seguimientos y referidos. Correos
  serializados con separación de 600 ms; no crea una ráfaga de solicitudes a Resend.
- Referidos consulta claves enviadas en lotes de 50, con paginación de perfiles de
  200. Descarta los confirmados antes de llamar a `referral_dashboard`; conserva
  los pendientes/error, las bajas y la ventana original de campaña.
- Cada petición tiene 5 s como máximo, incluida la lectura de su cuerpo. El
  presupuesto total es 24 s desde la entrada al handler, incluido el keep-alive.
  AbortController cancela fetch y el agente HTTPS de cada push destruye sus sockets.
- Si se agota el tiempo, responde HTTP 503 con `ok:false`, `timedOut:true` y
  `retryable:true`. No devuelve éxito anticipado ni deja envíos en segundo plano.
  Los intentos no confirmados siguen disponibles en el siguiente disparo.
- Se mantienen las claves de `notification_log`. Todos los correos pasan además
  su clave a Resend para proteger los reintentos con respuesta ambigua dentro de
  la ventana de idempotencia del proveedor. Push conserva su registro existente;
  una respuesta perdida del proveedor no permite garantizar entrega exactamente una vez.
- Respuesta autenticada con `durationMs`; log `notify_job` solo con duración y
  conteos. No se registran correos, identificadores personales ni contenido de salud.
- Vercel configura `api/notify.js` con `maxDuration:30`, dejando margen para
  responder después de cancelar trabajo a los 24 s. No cambia los horarios.

No requiere migración SQL, dependencia nueva ni cambios de secretos.

## Verificación y operación

`node scripts/test-notify-latency.mjs` prueba carga, paginación, idempotencia,
cadencia, dry_run, cuerpo HTTP colgado, correo sin respuesta, cierre de push y
presupuesto agotado con recuperación en el disparo siguiente. Forma parte del
release gate; los validadores existentes cubren horario, preferencias, bajas,
journey, referidos y vencimientos.

El workflow `notify-hourly.yml` permite un disparo manual con `dry_run=true`
(valor predeterminado), que consulta el recorrido real sin enviar correos ni push.
Los disparos programados siguen enviando normalmente. El log de Actions muestra
solo conteos, duración y estado; un HTTP distinto de 200 falla la ejecución.

Para revisar una alerta, contrastar hora UTC, `durationMs`, `timedOut`, errores de
correo/push/vencimientos y `notification_log`. Un 503 explícito indica una operación
incompleta que merece revisión; no debe silenciarse convirtiéndolo en 200.
