# Plan: web pública separada, beta aparte y suscripción con semana gratis

Fecha: 2026-11-06. Decisiones de Jonathan (2026-11-06):

1. **La app vive en `evolvapp.club/app`.** La portada, los planes y las páginas legales forman la web pública en `evolvapp.club`.
2. **La beta sale de la portada.** Solo queda en `/beta` (`beta-reclutamiento.html`), sin enlace desde la portada. Los códigos de invitación siguen dando acceso **sin tarjeta**.
3. **Inscripción pública con tarjeta y 7 días gratis.** Al terminar la prueba se cobra **S/ 29.90 cada mes hasta que la persona cancele**. Se cancela en un toque, y se avisa por correo antes del primer cobro y con cada cobro.
4. **Los pagos únicos se mantienen** (`/planes` → `/pago`, 1, 3 o 6 meses) para quien prefiera no suscribirse.

Relación con otros planes: `docs/native-migration/COBRO-WEB.md` sigue vigente (las apps no venden). Con este modelo, **la cuenta se crea en la web**, con tarjeta, y la app nativa solo inicia sesión (flujo A de COBRO-WEB.md), lo que además baja el riesgo ante App Store.

## 1. Web pública y app separadas (REQ-352)

**Problema:** hoy la portada la dibuja la app misma (`renderLanding()` dentro del `index.html` de ~17 700 líneas), así que cada visita a la portada descarga la app entera y cada cambio de la portada toca la app.

**Restricción comprobada en un preview de Vercel (2026-11-06):** el archivo `index.html` siempre se sirve en `/`, aunque haya una reescritura. Por eso la app se mueve a su carpeta.

| Antes | Después |
|---|---|
| `/` = app (`index.html`), que dibuja la portada si no hay sesión | `/` = portada pública liviana (`index.html` nuevo, HTML + CSS propios, sin la app) |
| `/admin` → `index.html` | `/app` = la app (`app/index.html`, con `<base href="/">` para que sus rutas relativas sigan apuntando a la raíz); `/admin` → `app/index.html` |
| Service worker y manifest con alcance `/` y `start_url: "./"` | Mismo service worker en `/service-worker.js`; precache y navegación de la app en `/app`; `start_url: "/app"` |

**Para que nada se rompa:**

- **Sesión guardada o app instalada.** Si la portada detecta una sesión de Supabase en `localStorage` o que está abierta como app instalada (`display-mode: standalone`, `navigator.standalone`), redirige a `/app` de inmediato, conservando la consulta y el hash. Las apps ya instaladas en iPhone conservan la `start_url` antigua (`/`) para siempre, así que esta redirección tiene que quedarse.
- **Enlaces de correos y de Supabase.** `/?codigo=`, `/?auth=…`, `/?ver=…`, `/?checkout=…`, `/?friend=`, `/?labs=`, `/?invite=` y el hash de Supabase (`#access_token`, `#error`) se reenvían a `/app` con la misma consulta. Además, `api/*.js` empieza a generar los enlaces nuevos con `/app`.
- **Redirecciones de Supabase Auth.** `uri_allow_list` ya incluye `https://evolvapp.club/**`, así que no hay cambio en Supabase.
- **La app sin sesión** ya no muestra portada: muestra su pantalla de inicio de sesión y, para crear una cuenta, enlaza a la web pública.
- **Pruebas y validadores.** Los 54 validadores y las pruebas E2E que leen o abren `index.html` pasan a `app/index.html` (o `/app/` en el navegador). La portada nueva tiene su propia prueba.
- **Despliegue.** Se agregan `!/app` en `.vercelignore` y las reescrituras en `vercel.json`, y se sube `CACHE_NAME`.

## 2. Beta solo en /beta (REQ-353)

- La portada nueva no tiene "Postular", "Beta" ni enlaces a `beta-reclutamiento.html`. Las llamadas a la acción son "Ver planes" y, cuando exista REQ-356, "Empieza tu semana gratis".
- Se conservan `/beta`, los enlaces con `?source=`, los códigos (`/app?codigo=`) y el canje en Perfil.
- En la app, el registro con código sigue igual. El aviso "Evolv está en beta cerrada… Postula a la beta" pasa a "¿No tienes cuenta? Empieza tu semana gratis" (o "Ver planes" mientras no exista REQ-356).

## 3. Suscripción mensual con semana gratis

### Cómo lo vive la persona

1. En la portada toca **Empieza tu semana gratis** y llega a `/registro`.
2. Escribe nombre, apellido, correo y, si quiere, celular. Lee y acepta: "7 días gratis. Desde el día 8 se cobran S/ 29.90 cada mes con tu tarjeta hasta que canceles. Cancela cuando quieras desde tu cuenta."
3. Ingresa su tarjeta en el formulario de Culqi. Ese día no se cobra nada.
4. Le llega el correo para crear su contraseña (o, si ya tenía cuenta, la suscripción se suma a ella) y entra a `/app` con 7 días de acceso completo.
5. Dos días antes del primer cobro recibe un correo con la fecha y el monto, y un enlace para cancelar.
6. El día 8 se cobra el primer mes; después, cada 30 días. Cada cobro llega con su recibo. Si un cobro falla, recibe un aviso para actualizar la tarjeta.
7. Si cancela, ya no se le cobra y conserva el acceso hasta el final del período pagado (o de la prueba).

### Lo que dice la documentación de Culqi (revisada el 2026-11-06)

- **Clientes y tarjetas:** un token de tarjeta vence a los 5 minutos, pero convertido en tarjeta (`crd_…`, ligada a un cliente) permite cobrar después.
- **Planes y suscripciones:**
  - un plan tiene monto, moneda (PEN), intervalo (`interval_unit_time`, `interval_count`) e `initial_cycles` (`count`, `has_initial_charge`, `amount`);
  - una suscripción (`card_id`, `plan_id`, `tyc: true`) devuelve `trial_start`, `trial_end` y `next_billing_date`;
  - Culqi cobra cada día las suscripciones que vencen ese día y avisa por webhook;
  - cancelar una suscripción es inmediato e irreversible.
- **Captura de tarjeta:** el Checkout de Culqi puede usarse solo para capturar la tarjeta.
- **Confirmado en la referencia de la API** (`https://apidocs.culqi.com/apiculqi.yaml`, revisada el 2026-11-14). Todas las llamadas usan `Authorization: Bearer <llave secreta>` sobre `https://api.culqi.com`.
  - **Endpoints:** `POST /v2/customers`; `POST /v2/cards` (`customer_id`, `token_id`); `POST /v2/recurrent/plans/create`; `POST /v2/recurrent/subscriptions/create` (`card_id`, `plan_id`, `tyc: true`, `metadata`); `GET`, `PATCH` y `DELETE /v2/recurrent/subscriptions/{id}`; `GET /v2/events/{id}`.
  - **Plan:**
    - `amount` va en céntimos, entre 300 y 5.000.000;
    - `currency` es `PEN` o `USD`;
    - `interval_unit_time`: 1 = diario, 2 = semanal, 3 = mensual, 4 = anual, 5 = trimestral, 6 = semestral;
    - `interval_count`: con 0 se cobra de forma indefinida;
    - `initial_cycles` (`count`, `has_initial_charge`, `amount`, `interval_unit_time`) son los ciclos iniciales del plan.
  - **Semana gratis:** la prueba es nativa. Existen el estado de suscripción 2 («Periodo de prueba»), `trial_start` y `trial_end`, y el evento `subscription.trial.end`. El plan mensual queda con `interval_unit_time: 3`, `interval_count: 0` e `initial_cycles: {count: 7, interval_unit_time: 1, has_initial_charge: false, amount: 0}`. Lo primero que hace REQ-355 en integración es confirmar que eso da `trial_end` a 7 días y ningún cobro antes. Si no lo da, se usa la alternativa del diseño.
  - **Tarjeta:** `POST /v2/cards` acepta `validate`, que por defecto es `true`. Con `true`, Culqi hace un cargo mínimo de S/ 3 y lo devuelve al instante. Se mantiene en `true`, porque detecta antes las tarjetas inválidas, y REQ-354 lo menciona. La misma llamada acepta `authentication_3DS`: si Culqi pide 3DS, se completa como en `culqi-charge.js`. La referencia no dice que los cobros recurrentes pidan 3DS.
  - **Estados de la suscripción:** 1 creada, 2 prueba, 3 activa, 4 cancelada, 5 en cola, 6 finalizada.
  - **Eventos del webhook:**
    - `subscription.creation.succeeded` / `.failed`;
    - `subscription.charge.succeeded` / `.failed`;
    - `subscription.cancel.succeeded` / `.failed`;
    - `subscription.trial.end`;
    - y, para cargos, `charge.creation.succeeded` / `.failed`.

    No hay firma documentada: cada evento se verifica con `GET /v2/events/{id}`.
  - **Cobro fallido:** Culqi reintenta un número no documentado de veces y después cancela la suscripción sola.
  - **Pendiente con Culqi** (no bloquea probar en integración): que la cuenta live tenga la recurrencia activa y con qué comisión.

### Diseño (sirve con o sin prueba gratuita nativa de Culqi)

- **Tabla `subscriptions`** (SQL idempotente, RLS: cada persona lee la suya y escribe solo el servidor):
  - `user_id`, `plan_id` (`monthly`), `status` (`trialing`, `active`, `past_due`, `canceled`, `ended`);
  - `culqi_customer_id`, `culqi_card_id`, `culqi_subscription_id`, `card_brand`, `card_last4`;
  - `trial_ends_at`, `current_period_end`, `cancel_requested_at`, `created_at`.
- **Inscripción:** `POST /api/checkout?op=subscribe`, por el límite de 12 funciones de Vercel Hobby.
  1. Valida los datos y la aceptación.
  2. Crea el cliente y la tarjeta en Culqi.
  3. Busca la cuenta o la invita (mismo criterio que `culqi-charge.js`).
  4. Crea la suscripción y un `user_entitlements` de prueba (`origin: 'trial'`, 7 días).
- **Una sola prueba por persona.** Quien ya tuvo una prueba o un plan pagado se suscribe sin días gratis (cobro inmediato). Se controla por cuenta y por correo, y se puede sumar marca y últimos 4 dígitos de la tarjeta como señal débil.
- **Cobros.** La opción elegida es la suscripción de Culqi con prueba nativa vía `initial_cycles` (ver arriba), confirmada primero en integración. La alternativa es crear la suscripción de Culqi al terminar la prueba, desde el cron (el primer cobro sale ese día y los siguientes los hace Culqi). En ambos casos los cobros los hace Culqi, no un cron propio con la tarjeta guardada.
- **Webhook.** `POST /api/checkout?op=culqi-webhook`. No se confía en el cuerpo: se consulta el cargo o la suscripción en la API de Culqi con la llave secreta antes de actuar.
  - **Cobro exitoso:** `user_entitlements` +30 días (`origin: 'subscription'`, `payment_ref` = id del cargo, idempotente), registro en `billing_events` y recibo por correo.
  - **Cobro fallido:** `past_due` y aviso por correo. Culqi reintenta.
  - **Cancelada:** el acceso queda hasta el final del período.
- **Cancelar.** En Perfil → Mi suscripción, en la app web, y en la página de cuenta de la web pública (para quien use la app nativa): "Cancelar suscripción", con confirmación de una línea. Cancela en Culqi, guarda `cancel_requested_at` y avisa por correo.
- **Correos** (sin datos de salud):
  - inicio de la prueba, con la fecha del primer cobro;
  - aviso 2 días antes del primer cobro;
  - recibo de cada cobro;
  - cobro fallido;
  - confirmación de la cancelación.

  Se reutiliza `notification_log` para no repetir envíos (REQ-351).
- **Avisos de vencimiento (REQ-351):** no se envían a quien tiene una suscripción activa, porque no tiene nada que renovar a mano.

### Motor (REQ-355, implementado el 2026-11-16)

- **Código:** `api/_tienda/suscripcion.js`, enrutado por `/api/checkout` (no suma funciones):
  - `POST /api/suscripcion`: inscripción pública. Solo funciona con `TIENDA_SUSCRIPCION_ENABLED`.
  - `POST /api/culqi-webhook`: eventos de Culqi.
  - `POST /api/suscripcion/cancelar`: cancelación, con sesión.
- **Inscripción:**
  - Pide `email`, `firstName`, `lastName`, `phone`, `address`, `city`, `tokenId`, `acceptTerms` y `acceptRenewal`. Culqi exige dirección, ciudad y teléfono para crear el cliente, así que REQ-356 debe pedirlos.
  - Si Culqi pide 3DS al guardar la tarjeta, responde `needs3ds`. El reintento con `authentication3DS` reutiliza el cliente ya creado.
  - Va con prueba (`CULQI_PLAN_PRUEBA_ID`) solo si ese correo y esa cuenta nunca tuvieron suscripción ni plan pagado, y si la misma tarjeta (bin y últimos 4) no tuvo prueba. Si no, va por `CULQI_PLAN_MENSUAL_ID`, y el acceso llega con el primer cobro.
  - Con prueba, el acceso de los días gratis queda en `user_entitlements`, con `payment_ref = sxn_…:prueba`.
- **Webhook:**
  - Lee el evento con `GET /v2/events/{id}` y la suscripción con `GET /v2/recurrent/subscriptions/{id}`.
  - `subscription.charge.succeeded` suma 30 días una sola vez, gracias a la clave de `subscription_charges`.
  - `subscription.charge.failed` → `past_due`; `subscription.cancel.succeeded` → `canceled`.
  - Un evento repetido o de otra suscripción no cambia nada.
- **Cancelar:** `DELETE` en Culqi. El acceso ya dado sigue hasta su vencimiento. Borrar la cuenta (`api/privacy.js`) cancela antes la suscripción y, si Culqi no responde, no borra la cuenta.
- **Datos:** `supabase/suscripciones.sql` (tablas `subscriptions` y `subscription_charges`). Cada persona lee su fila y solo escribe el servidor. La exportación de datos incluye la suscripción, con marca y últimos 4 de la tarjeta.
- **Prueba:** `node scripts/test-suscripcion-culqi.mjs` (Culqi y Supabase simulados, más PGlite).

- **Sin días gratis (REQ-356):** si el correo, la cuenta o la tarjeta ya tuvieron prueba o plan pagado, `/api/suscripcion` responde `409 { sinPrueba }` sin crear la suscripción. `/registro` muestra el motivo y pide aceptar aparte el cobro de hoy (`aceptaCobroInmediato`). Si el aviso vino por correo, reenvía el mismo token; si vino por la tarjeta (`nuevaTarjeta`), la pide otra vez.

### Gestión y correos (REQ-357, implementado el 2026-11-17)

- **Estado:** `GET /api/suscripcion/estado` (con sesión; en la app, `/api/checkout?op=suscripcion-estado`, la ruta que admite `js/api-client.js`). Devuelve estado, prueba, próximo cobro, monto, marca y últimos 4 de la tarjeta, fecha de cancelación y hasta cuándo dura el acceso. Sin ids de Culqi ni bin. Muestra la suscripción viva o, si no hay, la última cancelada mientras dure el acceso pagado.
- **Perfil → Mi suscripción** (app web): con una suscripción manda su bloque (sin "Renovar plan", porque se renueva sola) y "Cancelar suscripción" con confirmación de una línea.
- **`/cuenta`** (web pública, para la app nativa): usa la sesión de la app si está vigente (sin refrescarla, para no cerrar la de la app) o pide correo y contraseña de Evolv. Misma información y la misma cancelación. Enlazada desde el pie de la tienda y desde cada correo.
- **Correos** (`api/_tienda/suscripcion-correos.js`), una sola vez cada uno por su clave en `notification_log` (tipo `subscription`):

  | Correo | Cuándo | Clave |
  |---|---|---|
  | Inicio de la prueba | Al inscribirse con semana gratis | `sub:<sxn>:prueba` |
  | Aviso del primer cobro | Cron de `/api/notify`, 2 días antes (9 a 20 h de Lima) | `sub:<sxn>:aviso_cobro` |
  | Recibo | Cada `subscription.charge.succeeded` | `sub:<sxn>:recibo:<chr>` |
  | Cobro fallido | `subscription.charge.failed`; un aviso por cobro aunque Culqi reintente | `sub:<sxn>:fallido:<fecha>` |
  | Cancelación | Desde la cuenta o por Culqi (`subscription.cancel.succeeded`) | `sub:<sxn>:cancelada` |

  La clave se reclama antes de enviar; Resend recibe la misma como `Idempotency-Key`. Un envío fallido queda en `error` y se reintenta en el siguiente disparo; sin el SQL no se envía nada. Un correo que falla nunca rompe la inscripción, el webhook ni la cancelación.
- **REQ-351:** el aviso de vencimiento no sale a quien tiene una suscripción viva (`pending`, `trialing`, `active` o `past_due`).
- **SQL:** `supabase/notifications_subscription.sql` agrega el tipo `subscription` al CHECK de `notification_log` (después de `whatsapp.sql`).
- **Prueba:** `node scripts/test-suscripcion-gestion.mjs` y `tests/e2e/suscripcion-gestion.spec.js`.

#### Activación (Jonathan)

1. Aplicar `supabase/suscripciones.sql` en Supabase.
2. Con la llave de integración: `CULQI_SECRET_KEY=sk_test_… node scripts/culqi-crear-planes.mjs`, que muestra `CULQI_PLAN_PRUEBA_ID` y `CULQI_PLAN_MENSUAL_ID`.
3. En un entorno **Preview** de Vercel, cargar esas dos variables, las llaves de prueba y `TIENDA_SUSCRIPCION_ENABLED=1`.
4. En CulqiPanel (integración), Eventos → Webhooks: `https://<preview>/api/culqi-webhook` con los eventos de Suscripciones.
5. Inscribirse con una tarjeta de prueba y confirmar 4 cosas: `trial_end` a 7 días, ningún cobro antes, el estado 2 en Culqi y el acceso de 7 días en la app. Si Culqi no respeta `initial_cycles` como prueba, se pasa a la alternativa del diseño, que es crear la suscripción al terminar la prueba.
6. Aplicar `supabase/notifications_subscription.sql` (correos de REQ-357) y confirmar en Preview que llegan el correo de inicio, el recibo y el de cancelación.
7. Solo después, y con REQ-356 y REQ-357 listos: confirmar con Culqi la recurrencia en la cuenta live, crear los planes con `--live`, configurar Production y el webhook live, y encender la bandera.

### Legales (REQ-354, textos aprobados por Jonathan el 2026-11-14)

- **Detrás de una bandera.** Los textos de la suscripción solo se ven con `TIENDA_SUSCRIPCION_ENABLED` (`1` o `true` en Vercel → `tienda.suscripcion` en `/api/config`). Apagada, que es como queda hoy, `/terminos`, `/devoluciones` y `/planes` no cambian y siguen diciendo «pago único, sin renovación automática», que es lo cierto mientras no se pueda suscribir. Montos y plazos salen de `SUSCRIPCION` en `tienda/planes.js`, y el código está en `tienda/suscripcion.js`.
- **Términos, punto 4.1:** 7 días gratis; S/ 29.90 desde el día 8 y luego cada mes; aviso 2 días antes del primer cobro; una prueba por persona; validación de la tarjeta (S/ 3.00 anulados al instante); aceptación expresa; cancelación inmediata y sin costo, en Perfil, en la cuenta web o por correo; acceso hasta el fin del período; cobro fallido (reintentos de Culqi y luego cancelación automática); comprobante de cada cobro; aviso de 30 días ante un cambio de precio. Los puntos 4, 5, 6, 7 y 8 distinguen los pagos únicos de la suscripción.
- **Devoluciones, punto 2.1:** cancelar evita los cobros siguientes, sin reembolso del mes en curso; nada que devolver durante la prueba; primer cobro devuelto al 100 % si se pide dentro de las 48 h; se devuelve cualquier cobro posterior a una cancelación o hecho por error; la validación de S/ 3 no es un cobro. Los pagos únicos siguen con 7 días de reembolso.
- **`/planes`:** una nota con las condiciones de la suscripción, junto a los pagos únicos. El botón de inscripción lo agrega REQ-356.
- **Vigencia:** con la bandera encendida, las páginas muestran `vigenciaLegalSuscripcion` (`tienda/comercio.js`) en lugar de `vigenciaLegal`. Al encender la bandera se pone ahí la fecha de ese despliegue.
- **Libro de Reclamaciones:** sin cambios.
- **Encender la bandera** solo cuando REQ-355, REQ-356 y REQ-357 estén en producción: los textos prometen inscripción, cancelación en Perfil y correos que esos REQ construyen.

## 4. Fases y REQ

| Fase | REQ | Depende de |
|---|---|---|
| 1 | REQ-352: web pública en `/` y app en `/app` | — |
| 2 | REQ-353: portada sin beta; la beta solo en `/beta` | REQ-352 |
| 3 | REQ-354: términos y devoluciones de la suscripción (hecho, tras `TIENDA_SUSCRIPCION_ENABLED`) | — |
| 4 | REQ-355: motor de suscripción con Culqi (hecho; activación en §3, "Motor") | — |
| 5 | REQ-356: `/registro` con tarjeta y semana gratis, y la llamada a la acción en la portada y la app (hecho, tras la bandera) | — |
| 6 | REQ-357: gestionar la suscripción (estado, cancelar) y sus correos (hecho; Perfil, `/cuenta` y `notifications_subscription.sql`) | REQ-355 |

La inscripción se abre al público (la portada cambia "Ver planes" por "Empieza tu semana gratis") recién cuando las fases 3 a 6 están en producción.

## 5. Lo que hace una persona

1. ~~Preguntar a Culqi cómo funciona la API~~: resuelto con la referencia de la API (§3, 2026-11-14). Solo queda confirmar con Culqi que la cuenta live tenga la recurrencia activa y su comisión, antes de abrir la inscripción.
2. ~~Llaves de prueba de Culqi~~: ya existen; la tienda las usa. Nunca se pegan en el chat.
3. **Configurar el webhook** en CulqiPanel (Eventos → Webhook) con la URL que deje REQ-355.
4. ~~Revisar y aprobar los textos de REQ-354~~: aprobados por Jonathan (2026-11-14). Cuando REQ-355..357 estén en producción, encender `TIENDA_SUSCRIPCION_ENABLED` y actualizar `vigenciaLegalSuscripcion`.
5. **Activar REQ-355**: aplicar el SQL, crear los planes y probar en Preview (§3, "Motor" → "Activación").

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| Mover la app rompe sesiones, apps instaladas o enlaces de correo. | Redirección desde `/` (sesión, modo instalado, parámetros y hash); pruebas E2E de cada caso; mismo origen, así que la sesión no se pierde. |
| Culqi no permite la prueba gratuita en el plan. | Alternativa ya diseñada: crear la suscripción al terminar la prueba. |
| Contracargos por cobros que la persona no esperaba. | Aceptación expresa, aviso 2 días antes, cancelación en un toque y recibo de cada cobro. |
| Abuso de pruebas con correos nuevos. | Una prueba por cuenta, correo y tarjeta (señal débil); el costo de la prueba es bajo. |
| Webhook falso. | Se verifica cada evento contra la API de Culqi con la llave secreta. |
