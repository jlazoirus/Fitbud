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
- **Sin documentar** (se le pregunta a Culqi, ver §5):
  - si `initial_cycles` sirve para 7 días gratis y cómo se traduce `interval_unit_time`;
  - si guardar la tarjeta hace un cargo de validación;
  - si los cobros recurrentes piden 3DS;
  - los nombres exactos de los eventos del webhook;
  - si las suscripciones necesitan activación comercial.

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
- **Cobros.** La opción preferida es la suscripción de Culqi con prueba vía `initial_cycles`, si Culqi confirma que funciona. La alternativa es crear la suscripción de Culqi al terminar la prueba, desde el cron (el primer cobro sale ese día y los siguientes los hace Culqi). En ambos casos los cobros los hace Culqi, no un cron propio con la tarjeta guardada.
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

### Legales (REQ-354, antes de abrir la inscripción)

- **Términos:** prueba gratuita de 7 días, renovación automática mensual, monto, fecha de cobro, cómo cancelar (inmediato y sin costo), qué pasa al cancelar y con un cobro fallido, y que la aceptación se pide de forma expresa al inscribirse.
- **Cambios y devoluciones:** para la suscripción, cancelar evita los cobros siguientes. Se devuelve un cobro hecho por error, o hecho después de una cancelación registrada.
  - **Propuesta, para confirmar por una persona:** devolver también el primer cobro tras la prueba si se pide dentro de las 48 h y casi no se usó.
  - Los pagos únicos siguen con 7 días de reembolso.
- **Libro de Reclamaciones:** sin cambios.

## 4. Fases y REQ

| Fase | REQ | Depende de |
|---|---|---|
| 1 | REQ-352: web pública en `/` y app en `/app` | — |
| 2 | REQ-353: portada sin beta; la beta solo en `/beta` | REQ-352 |
| 3 | REQ-354: términos y devoluciones de la suscripción | Revisión de una persona |
| 4 | REQ-355: motor de suscripción con Culqi (SQL, inscripción en el servidor, webhook, cancelación por API) | Respuestas de Culqi y llaves de prueba |
| 5 | REQ-356: `/registro` con tarjeta y semana gratis, y la llamada a la acción en la portada y la app | REQ-353, REQ-354, REQ-355 |
| 6 | REQ-357: gestionar la suscripción (estado, cancelar) y sus correos | REQ-355 |

La inscripción se abre al público (la portada cambia "Ver planes" por "Empieza tu semana gratis") recién cuando las fases 3 a 6 están en producción.

## 5. Lo que hace una persona

1. **Preguntar a Culqi** (soporte o ejecutivo):
   - si la cuenta tiene habilitadas las suscripciones y los cargos recurrentes, y con qué comisión;
   - cómo configurar 7 días gratis (`initial_cycles`) y qué significa `interval_unit_time`;
   - si guardar una tarjeta hace un cargo de validación;
   - si los cobros recurrentes piden 3DS;
   - los nombres de los eventos del webhook para cobro exitoso, cobro fallido y suscripción cancelada.
2. **Llaves de prueba de Culqi** (integración), para probar en el entorno de pruebas sin tocar producción. Se cargan como credencial de la sesión, nunca en el chat.
3. **Configurar el webhook** en CulqiPanel (Eventos → Webhook) con la URL que deje REQ-355.
4. **Revisar y aprobar** los textos de REQ-354.
5. **Aplicar** el SQL de REQ-355 en Supabase.

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| Mover la app rompe sesiones, apps instaladas o enlaces de correo. | Redirección desde `/` (sesión, modo instalado, parámetros y hash); pruebas E2E de cada caso; mismo origen, así que la sesión no se pierde. |
| Culqi no permite la prueba gratuita en el plan. | Alternativa ya diseñada: crear la suscripción al terminar la prueba. |
| Contracargos por cobros que la persona no esperaba. | Aceptación expresa, aviso 2 días antes, cancelación en un toque y recibo de cada cobro. |
| Abuso de pruebas con correos nuevos. | Una prueba por cuenta, correo y tarjeta (señal débil); el costo de la prueba es bajo. |
| Webhook falso. | Se verifica cada evento contra la API de Culqi con la llave secreta. |
