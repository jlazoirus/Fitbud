# Recordatorios por WhatsApp (REQ-255)

Especificación completa de REQ-255. `REQUIREMENTS.md` guarda solo la versión compacta.

## Decisiones de Jonathan (2026-11-14)

| Tema | Decisión |
| --- | --- |
| Canal | WhatsApp, además del correo y el push existentes (no los reemplaza). |
| Proveedor | **WhatsApp Business Cloud API de Meta, directa.** Sin BSP (Twilio, 360dialog). |
| Presupuesto | **Tope de US$20 al mes** en mensajes de WhatsApp. |
| Mensajes | **Solo el aviso diario de la noche**, y solo si falta registrar algo (pasos `day`/`rescue` de `planReminder`). El resumen de la mañana, la última llamada, los regresos, los seguimientos, los referidos y los vencimientos siguen por correo o push. |
| Número y negocio | Jonathan tiene un número dedicado (no registrado en la app de WhatsApp) y RUC para verificar el negocio en Meta Business. |
| Qué es un recordatorio | Solo los mensajes diarios que recuerdan el entreno y la dieta de ese día si aún no están hechos: el aviso de la noche, el resumen de la mañana y la última llamada. **Solo se envían a quien activó ese canal.** Los correos del journey (activación, regreso, volver a entrenar; REQ-296/297), los referidos y los vencimientos del plan **no** son recordatorios y siguen como están. |
| Invitación | Al entrar a la app, quien no tiene ningún recordatorio activo ve un aviso para activarlos. **Como máximo una vez por semana**, y nunca más si toca «No me interesa». No debe ser intrusivo. |

### Por qué Meta directa

- Volumen actual (14 nov 2026): 32 cuentas, 3 con correo activo y 3 con push, y 115 envíos en 30 días. Con 20 usuarios activos y un aviso diario como máximo se gastan menos de US$20 al mes.
- 360dialog cobra una licencia de unos €49 al mes por número: más que todo el gasto en mensajes. Twilio suma unos US$0,005 por mensaje y otro encargado que procesa teléfonos y avisos.
- La Cloud API es REST: basta `fetch`, igual que Resend. No hace falta ninguna dependencia nueva.

### Precios de referencia (verificar en el rate card de Meta antes de activar)

- Desde el 1 de octubre de 2026, Meta cobra por mensaje según el mercado y la categoría. Perú es un mercado propio y sus tarifas de utilidad y autenticación subieron en esa fecha. Fuentes de terceros publican un precio de utilidad de **unos US$0,03 por mensaje**; la cifra oficial está en el CSV o PDF del rate card ([precios de Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)).
- Desde el 1 de octubre de 2026, las plantillas de utilidad se cobran **también dentro de la ventana de 24 h**. Los mensajes de servicio (texto libre que responde al usuario dentro de esa ventana) tienen 1.000 gratis al mes por número.
- Una plantilla clasificada como **marketing** cuesta más (unos US$0,07) y Meta limita su frecuencia. La plantilla debe redactarse para que Meta la clasifique como utilidad.

## Problema

El único recordatorio fuera de la app es el correo (REQ-24), y muchos usuarios no lo revisan. Diego (beta, 2026-10-21) lo pidió: «sería cool que sea al WhatsApp». El push (REQ-38) en iPhone exige instalar la app. `api/notify.js` solo envía correo con Resend y push con VAPID. No hay número verificado ni consentimiento para WhatsApp: `beta_applications.whatsapp` es un dato de la postulación y **no** sirve como consentimiento.

## Objetivo

Quien lo active desde Perfil → Recordatorios recibe, por WhatsApp, el aviso diario cuando le falta registrar comidas o entreno, con el mismo criterio y la misma hora que el correo. Ningún mes se supera el tope de gasto. Darse de baja es inmediato.

## Alcance

### 1. Vinculación sin escribir el número (opt-in iniciado por el usuario)

- Perfil → Recordatorios muestra la fila «WhatsApp» con el botón «Activar en WhatsApp».
- Al tocarlo, el servidor crea un código de un solo uso (6 caracteres, vigente 30 min) y la app abre `https://wa.me/<número público>?text=EVOLV%20<código>`.
- El usuario envía el mensaje. El webhook valida la firma, busca el código vigente y guarda el número del remitente (`from`, en E.164) como vinculado, con la fecha del consentimiento. Responde con un mensaje de servicio de texto libre, que es gratis dentro de la ventana: «Listo, te avisaremos por aquí a las 20:00 si te falta algo del día. Responde BAJA para dejar de recibirlos.» (con la hora real del usuario).
- Si el código no existe o venció, responde en texto libre cómo generar uno nuevo en la app y no guarda nada.
- Al volver a la app (`visibilitychange`), la fila muestra «Vinculado: +51 9•• ••• 123» con el número enmascarado y el botón «Desactivar».
- El mensaje del usuario prueba que el número es suyo, y es la manera de darse de alta. No hace falta enviar un código de autenticación aparte.

### 2. Datos (migración `supabase/whatsapp.sql`, idempotente y con RLS)

- La tabla `whatsapp_links` guarda: `user_id` (PK, FK a `auth.users` con `ON DELETE CASCADE`), `phone_e164`, `opted_in`, `consent_at`, `opted_out_at`, `link_code`, `link_code_expires_at` y `updated_at`. Hay un índice único sobre `phone_e164` para las filas con `opted_in`: un número pertenece a una sola cuenta.
- El usuario autenticado solo puede leer su propia fila y no puede escribirla. Solo el servidor (service role) crea códigos, vincula y da de baja.
- `notification_log.notification_type` admite `whatsapp`. Al ampliar el CHECK se conservan todos los valores actuales (ver `notifications_plan_expiry.sql`).
- Borrar la cuenta borra el número (cascade). `api/privacy.js` incluye el número en la exportación de datos.

### 3. Webhook (sin crear funciones nuevas)

- **Vercel Hobby admite 12 funciones y ya hay 12** (`scripts/test-tienda-culqi.mjs` lo comprueba). El webhook va dentro de una función existente (sugerido: `api/push-subscribe.js`, que ya gestiona suscripciones de canal), con un rewrite `/api/whatsapp` en `vercel.json`. Ahí también va el POST autenticado que crea el código y el que desactiva.
- `GET`: verificación de Meta (`hub.mode`, `hub.verify_token` == `WHATSAPP_VERIFY_TOKEN`; responde `hub.challenge`).
- `POST`: rechaza con 401 si `X-Hub-Signature-256` no coincide con el HMAC-SHA256 del cuerpo crudo calculado con `WHATSAPP_APP_SECRET`. Procesa solo mensajes `text`:
  - `EVOLV <código>`: vincula.
  - `BAJA`, `STOP`, `SALIR` o `CANCELAR` (sin distinguir mayúsculas ni tildes): `opted_in=false` y `opted_out_at=now()`. Responde con un texto libre de confirmación.
  - Cualquier otro texto: no responde nada; no hay chat con el coach por WhatsApp.
- Siempre responde 200 a Meta tras validar la firma, aunque no haga nada, para evitar reintentos. Los estados de entrega (`statuses`) actualizan `notification_log` solo cuando el envío falla.

### 4. Envío en el cron (`api/notify.js`)

- `runJob` considera también a los usuarios con `whatsapp_links.opted_in` (además de `email_opt_in`/`push_opt_in`) y respeta `enabled_days`, `notify_hour`, `notify_nutrition` y `notify_training`.
- Solo usa WhatsApp cuando `decision.step` es `day` o `rescue`. Clave idempotente: `${user_id}:whatsapp:${today}`. Un mensaje al día como máximo.
- El correo y el push del usuario siguen saliendo según sus propias preferencias: WhatsApp no los reemplaza ni los apaga.
- Envío: `POST https://graph.facebook.com/<versión>/<WHATSAPP_PHONE_NUMBER_ID>/messages` con `type:"template"`, la plantilla `WHATSAPP_TEMPLATE` (`es`) y dos variables. Hace la llamada con `boundedRequest` y respeta el presupuesto de 24 s de REQ-383. Usa hasta 4 usuarios concurrentes; no añade espera entre mensajes.
- **Tope mensual:** antes de enviar, cuenta los `notification_log` con tipo `whatsapp` y estado `sent` del mes calendario en horario de Lima. Si llega a `WHATSAPP_MONTHLY_CAP` (por defecto 600, unos US$18 a US$0,03), no envía y registra `action:"whatsapp_cap"` sin datos personales. El log `notify_job` incluye `whatsapp: { ready, sent, skipped, errors, capped }`.
- Si faltan variables de entorno, `whatsapp.ready=false` con el motivo, igual que el push con VAPID, y no se envía nada.
- Error 131047 (ventana o reenganche), 131026 (no entregable) o un número que ya no está en WhatsApp: registra el error y no reintenta ese día. Tras 3 fallos de entrega seguidos, marca `opted_in=false`, y Perfil muestra «No pudimos entregarte avisos por WhatsApp; vuelve a activarlos».
- `dry_run` no llama a Meta.

### 5. Plantilla (Jonathan la registra en WhatsApp Manager)

- Nombre: `recordatorio_diario`. Categoría: **Utility**. Idioma: `es`.
- Cuerpo: `Hola, hoy te falta registrar {{1}} en Evolv. Responde BAJA si ya no quieres estos avisos.`
- Botón URL (opcional, sin variables): «Abrir Evolv» → `https://evolvapp.club/app`.
- `{{1}}` puede ser «tus comidas», «tu entreno», «tus comidas y tu entreno», «tu día» (si aún no registró nada hoy) o «lo pendiente de ayer» (si queda algo por rescatar del día anterior). No se envía el nombre: Meta recibe el mínimo de datos (`pendingLabel` en `api/_whatsapp/core.js`).
- Lo que **no** debe incluir (para que Meta la clasifique como utilidad y por privacidad): precios, ofertas, emojis de urgencia, rachas, «no pierdas», peso, calorías, fotos, metas corporales ni ningún dato de salud. Tampoco menciones de IA, coach automático, modelos ni cuotas (REQ-31).

### 6. Interfaz y textos

- Perfil → Recordatorios: fila «WhatsApp» con estado (sin activar, vinculado o pausado por fallos). El texto de consentimiento junto al botón dice: «Te enviaremos por WhatsApp un aviso al día como máximo, a tu hora de recordatorio, solo si te falta algo. WhatsApp (Meta) recibe tu número y el texto del aviso. Puedes darte de baja respondiendo BAJA.»
- Si el servidor no tiene WhatsApp configurado (`api/config.js` no expone el número público), la fila no aparece.
- Privacidad (`/privacidad`): añadir a Meta Platforms como encargado de los avisos por WhatsApp, indicar qué datos recibe (número y texto del aviso) y explicar la baja.
- Sin eventos de analytics con el número ni con el contenido del mensaje (ver la sección 8).

### 7. Solo para quien los activa (invariante, ya vigente)

- El aviso de la noche, el resumen de la mañana y la última llamada salen por un canal solo si el usuario lo activó: `email_opt_in`, `push_opt_in` con suscripción, o `whatsapp_links.opted_in`.
- Hoy `runJob` ya cumple esto y `runFollowups` nunca envía el aviso del día. Este REQ lo deja cubierto por una prueba, para que el canal nuevo no lo rompa.
- No cambia nada del journey: activación, regreso, volver a entrenar, invitación a push (REQ-296/297), referidos y vencimientos siguen igual.

### 8. Invitación semanal a activar los recordatorios (pop-up no intrusivo)

- **Cuándo aparece:** al abrir o volver a la app con sesión iniciada y el perfil completo. Aparece en Hoy, después de que la pantalla haya cargado, y solo si se cumplen todas estas condiciones:
  - no tiene ningún canal de recordatorio activo: ni correo, ni push encendido en este dispositivo, ni WhatsApp vinculado;
  - no tocó «No me interesa»;
  - pasaron 7 días o más desde la última vez que se le mostró;
  - no es el mismo día en que el onboarding le ofreció activar los avisos;
  - no hay otro modal, hoja o celebración abiertos (racha, cierre del día, pago). Si lo hay, no se encola: espera a la siguiente apertura.
- **Forma:** hoja inferior pequeña en móvil o diálogo compacto en escritorio. Título «¿Te recordamos tu día?» y texto «Un aviso al día como máximo, a la hora que elijas, solo si te falta tu entreno o tus comidas.»
- **Acciones:** una por canal disponible: «Avisos en este teléfono» (push, o los pasos de instalación en iPhone), «WhatsApp» (solo si el servidor lo tiene configurado) y «Correo». Además: «Ahora no» y «No me interesa».
- **Al activar un canal** se usa el mismo flujo que en Perfil → Recordatorios (`enableDevicePush`, `enableEmailReminders` o la vinculación de WhatsApp), y la hoja se cierra.
- **«Ahora no»**, la X, Escape o tocar fuera: no vuelve a mostrarse en 7 días.
- **«No me interesa»:** no vuelve a mostrarse nunca. El usuario aún puede activarlos desde Perfil → Recordatorios. Si después activa un canal y lo apaga, sigue sin mostrarse.
- **Dónde se guarda:** `reminderInviteLastShownAt` y `reminderInviteDeclined` en `profiles.prefs`, para que viajen entre dispositivos; `localStorage` sirve solo como caché si falla la red. **No** debe crear una fila en `notification_preferences`: según REQ-296, esa fila corta los correos del journey.
- **La tarjeta de Hoy:** la tarjeta «Activa tus recordatorios» dentro de «Avisos», que está plegado (`notifyNudgeHtml`, REQ-367), es pasiva y no depende de cuándo apareció el pop-up. Su «Ahora no» la oculta 7 días (antes, hasta el día siguiente) y «No me interesa» la oculta para siempre, igual que el pedido tras la racha (REQ-341).
- **Accesibilidad:** `role="dialog"`, foco dentro del diálogo mientras está abierto y devuelto al cerrar, y se cierra con Escape. Respeta `prefers-reduced-motion`.
- **Analytics:** reutiliza el evento permitido `notifications_prompt`: `source:"invite"` con `action` `shown|later|declined|choose_push|choose_email|choose_whatsapp`, y `whatsapp_start|whatsapp_linked|whatsapp_unlinked` para el canal. No incluye datos personales y no hace falta ampliar la lista de eventos de `api/analytics.js`. El texto no menciona IA (REQ-31).

## Implementación (2026-11-14)

- `supabase/whatsapp.sql`: crea `whatsapp_links` (RLS de solo lectura propia y escritura solo del servidor), `notification_log.provider_message_id` y el tipo `whatsapp`.
- `api/_whatsapp/core.js`: configuración, firma, códigos, clasificación de textos, plantilla, envío y tope.
- `api/push-subscribe.js`: atiende `/api/whatsapp` (rewrite en `vercel.json`). Ahí están la verificación GET, el webhook firmado, `link` y `unlink`. Así se mantienen 12 funciones.
- `api/notify.js`: aviso del día y rescate por WhatsApp, con tope mensual reservado antes de enviar y sin reintentos el mismo día tras un fallo.
- `api/config.js`: expone `whatsapp: {enabled, number}`. `api/privacy.js` exporta el número y el consentimiento.
- `app/index.html`: fila de WhatsApp en Perfil → Recordatorios e invitación semanal. `js/api-client.js` admite `/api/whatsapp`.
- `privacidad/index.html`: Meta como encargado de los avisos por WhatsApp.
- Pruebas: `scripts/test-whatsapp-reminders.mjs` (release gate) y `tests/e2e/recordatorios-whatsapp.spec.js`. `E2E_PORT` permite correr la suite E2E si otra copia del repo ya ocupa el puerto 8923.

## Fuera de alcance

- Chat con el coach por WhatsApp, respuestas automáticas a otros textos, envío de fotos o registro de comidas desde WhatsApp.
- Resumen de la mañana, última llamada, regresos, seguimientos, referidos, vencimientos y cualquier plantilla de marketing.
- Twilio, 360dialog u otro BSP; SMS.
- Usar `beta_applications.whatsapp` para dar de alta a alguien sin que inicie el chat.
- App nativa (track NAT): reutilizará el mismo backend más adelante.

## Riesgos

- **Clasificación de Meta.** Si Meta reclasifica la plantilla como marketing, sube el costo y aparecen límites de frecuencia. Mitigación: texto neutro de utilidad. Si Meta la rechaza, Jonathan ajusta el texto sin cambiar el código (el nombre se lee de `WHATSAPP_TEMPLATE`).
- **Precio.** Las tarifas cambian cada trimestre (1 de enero, 1 de abril, 1 de julio y 1 de octubre). El tope cuenta mensajes, no dólares: si sube el precio, Jonathan ajusta `WHATSAPP_MONTHLY_CAP`.
- **Datos personales.** El número es un dato personal: RLS, nunca va a analytics ni a los logs (los logs enmascaran o no incluyen el número) y se borra con la cuenta. El texto del aviso no contiene datos de salud.
- **Seguridad del webhook.** Sin validar la firma, cualquiera podría vincular números o dar de baja a otros. La validación HMAC es obligatoria y tiene pruebas.
- **Tiempo del cron.** Más llamadas por disparo; se mantienen la concurrencia y el presupuesto de REQ-383.
- **Límite de funciones de Vercel.** No se puede crear `api/whatsapp.js` como función nueva.

## Criterios de aceptación

1. Con la configuración de WhatsApp completa, Perfil → Recordatorios muestra «Activar en WhatsApp». El enlace abre un chat con `EVOLV <código>` ya escrito, y al enviarlo la fila pasa a «Vinculado» con el número enmascarado.
2. Un código vencido, ya usado o inexistente no vincula. Un número ya vinculado a otra cuenta tampoco se vincula a una segunda.
3. Un webhook con firma inválida recibe 401 y no modifica datos. La verificación `GET` responde el challenge solo si el token coincide.
4. Responder `BAJA`/`STOP` (o tocar «Desactivar») corta los envíos desde el siguiente disparo, y el usuario recibe una confirmación.
5. Un usuario vinculado al que le falta algo recibe un solo WhatsApp a su `notify_hour`, en un día habilitado. Si no le falta nada, no recibe ninguno. Repetir el disparo el mismo día no envía otro.
6. Con el contador del mes en `WHATSAPP_MONTHLY_CAP`, no sale ningún WhatsApp, el log indica `capped` y el correo y el push siguen saliendo.
7. Si falta una variable de entorno, `whatsapp.ready=false` con el motivo, no se llama a Meta y la fila de Perfil no aparece.
8. Ni el número ni el contenido aparecen en analytics ni en `notify_job`. Borrar la cuenta elimina la fila de `whatsapp_links`. La exportación de datos incluye el número.
9. Las funciones de `api/` siguen siendo 12 o menos, y no se añade ninguna dependencia en `package.json`.
10. La interfaz y la plantilla no mencionan IA, modelos ni cuotas (REQ-31).
11. Sin ningún canal activo, ningún usuario recibe el aviso de la noche, el resumen de la mañana ni la última llamada. Los correos del journey (REQ-296/297) siguen saliendo igual que antes.
12. Quien no tiene recordatorios activos ve la invitación al abrir la app. Si toca «Ahora no» y vuelve a abrir la app durante la misma semana, no la ve. A los 7 días la ve de nuevo, incluso desde otro dispositivo.
13. Tras «No me interesa», no vuelve a ver la invitación (ni la tarjeta de Hoy), ni siquiera desde otro dispositivo. Responder la invitación no crea una fila en `notification_preferences`.
14. La invitación no aparece si ya hay un canal activo, si el onboarding ya ofreció los avisos ese mismo día, ni encima de otro modal.

## Verificación sugerida

- Nuevo `scripts/test-whatsapp-reminders.mjs` (en el release gate) con Meta simulado:
  - firma HMAC válida e inválida y verificación `GET`;
  - vinculación con códigos válidos, vencidos, reutilizados y con número duplicado;
  - baja por palabra clave;
  - en el cron: envío único por día, días deshabilitados, `day`/`rescue` frente a otros pasos, tope mensual, `ready=false`, `dry_run` y los errores 131047 y 131026;
  - 3 fallos seguidos pausan el canal.
- `scripts/test-notify-latency.mjs` sigue en verde con usuarios de WhatsApp en el fixture.
- `scripts/test-tienda-culqi.mjs` (12 funciones o menos) y `node scripts/release-gate.mjs`.
- Recorrido en el navegador con el backend simulado: activar, ver «Vinculado», desactivar; la fila no aparece sin configuración.
- Prueba del cron: un usuario sin canales activos no recibe el aviso de la noche, el resumen de la mañana ni la última llamada, pero sí los correos del journey.
- Recorrido en el navegador de la invitación, con el reloj simulado: aparece, «Ahora no», no aparece al recargar, aparece a los 7 días, «No me interesa», y no vuelve a aparecer en otro contexto con la misma cuenta. Probar también con un canal activo y con otro modal abierto. Revisar a 375 px y en escritorio.
- Sin llamadas reales a Meta en CI ni en el loop (`paidExternalCallsPerRun: 0`).

## Activación (acción humana de Jonathan, tras el merge)

1. Verificar el negocio en [Meta Business Manager](https://business.facebook.com) con el RUC y el nombre comercial «Evolv».
2. Crear una app en developers.facebook.com con el producto WhatsApp y registrar el número dedicado. El nombre visible «Evolv» lo aprueba Meta.
3. En WhatsApp Manager: añadir un método de pago, crear la plantilla `recordatorio_diario` (sección 5) y esperar su aprobación como Utility.
4. Crear un usuario del sistema con un token permanente y los permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
5. En Vercel, definir: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_TEMPLATE=recordatorio_diario`, `WHATSAPP_PUBLIC_NUMBER` (E.164, sin `+`) y `WHATSAPP_MONTHLY_CAP=600`.
6. Aplicar `supabase/whatsapp.sql` en producción a mano.
7. Configurar el webhook `https://evolvapp.club/api/whatsapp` con el verify token y suscribir el campo `messages`.
8. Probarlo con su propia cuenta: activar, recibir el aviso de la noche y responder BAJA.
