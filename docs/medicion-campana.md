# Medición de la campaña en Meta (REQ-376)

Píxel de Meta en la web pública y Purchase por la API de conversiones, para medir la campaña de diciembre de 2026 en Instagram y Facebook. La app (`/app`, `/admin`) y el service worker no cargan nada de Meta.

## Qué se mide

| Evento | Dónde | Cuándo | Parámetros |
|---|---|---|---|
| PageView | portada, `/planes`, `/pago`, `/unete`, `/beta` | al cargar | ninguno |
| ViewContent | `/planes` | al pintar los planes | `content_type`, `content_ids` (ids de plan), `currency` |
| InitiateCheckout | `/pago` | al abrir el checkout de Culqi | `value`, `currency`, `content_type`, `content_ids`, `num_items` |
| Purchase | `/pago` y servidor | cuando `/api/culqi-charge` confirma el cargo | igual que InitiateCheckout, con `value` y `currency` de la respuesta del servidor |
| Lead | `/unete`, `/beta` | cuando la API responde `ok` | ninguno |

Ningún evento lleva correo, teléfono, nombre ni datos de salud. `web/medicion.js` solo deja pasar los parámetros de la tabla. El píxel se inicia sin datos de usuario y con `autoConfig` apagado. `REQ-370` (origen de campaña) sigue sin implementar; cuando exista, `campana` puede sumarse como parámetro a la lista blanca.

## Cómo funciona

- **`web/medicion.js`** espera al evento `load`, pide `/api/config` y carga `connect.facebook.net/en_US/fbevents.js` solo si llega `metaPixelId`. Sin ID no hay ninguna petición a Meta. Los eventos disparados antes quedan en cola y se descartan si no hay píxel. `/planes` y `/pago` lo cargan con `import()` dinámico: si un bloqueador o la red lo impiden, la página funciona igual.
- **`api/config.js`** entrega `metaPixelId` desde `META_PIXEL_ID` (solo dígitos). El token nunca sale del servidor.
- **`api/_tienda/meta-capi.js`** (no es función de Vercel) arma y envía el Purchase desde `api/_tienda/culqi-charge.js`, en paralelo con la activación del plan. Tiene un límite de 3 s, nunca lanza y un error de Meta solo queda en el log.
- **Deduplicación:** el servidor arma `eventId = "compra-" + id del cargo de Culqi` y lo devuelve en `compra: { eventId, value, currency }`. `/pago` usa ese mismo `eventId` en el Purchase del navegador y el servidor lo usa como `event_id` en la API de conversiones. Meta une los dos por nombre de evento e id. El navegador no repite un Purchase con el mismo id (memoria y `sessionStorage`).
- **Datos de usuario de la API de conversiones:** solo `fbp` y `fbc` (cookies del píxel que `/pago` manda con el pedido), IP (`x-forwarded-for`) y user agent.
- **Comprobaciones:** `scripts/validate-meta-pixel.mjs` y `scripts/test-meta-capi.mjs` en el release gate; `tests/e2e/medicion.spec.js`.

## Lo que hace una persona

1. **Aprobar el texto de `/privacidad`** (borrador abajo) y publicarlo **antes** de configurar `META_PIXEL_ID` en producción.
2. **Crear el píxel** (conjunto de datos) en el Administrador de eventos de Meta. En su configuración, dejar **apagada** la "Coincidencia avanzada automática": si se enciende, el script de Meta lee correos y teléfonos de los formularios por su cuenta.
3. **Generar el token** de la API de conversiones (Administrador de eventos → Configuración → API de conversiones).
4. **Configurar en Vercel** (Production):
   - `META_PIXEL_ID`: el ID del píxel (público).
   - `META_CAPI_TOKEN`: el token (secreto). Sin él solo funciona el píxel del navegador.
   - `META_CAPI_TEST_CODE` (opcional): código de "Probar eventos" para verificar sin ensuciar datos. Quitarlo después de probar.
5. **Verificar** en "Probar eventos": PageView en cada página, ViewContent en `/planes`, InitiateCheckout al abrir el pago, Lead al inscribirse, y un pago con llaves de prueba de Culqi que muestre un único Purchase "deduplicado" (navegador + servidor).

## Borrador para `/privacidad` (pendiente de aprobación)

No está publicado: `privacidad/index.html` sigue igual hasta que una persona apruebe el texto. Cambios propuestos:

- **Reemplazar** "No vendemos tus datos ni los usamos para publicidad. Tus datos de salud, fotos, progreso y conversaciones no se envían a herramientas de analítica." por:

  > No vendemos tus datos. Tus datos de salud, fotos, progreso y conversaciones no se envían a herramientas de analítica ni de publicidad.

- **Agregar** en "Qué datos tratamos y para qué":

  > **Medición de anuncios en la web:** en la portada, Planes, Pago, Únete y Beta usamos el píxel de Meta (Facebook e Instagram) para saber qué anuncio trajo una visita, una inscripción o una compra. Meta recibe la página visitada, el tipo de acción (visita, inscripción, inicio de pago o compra), el plan y su monto, tu dirección IP, tu navegador y sus propias cookies. No le enviamos tu nombre, correo, teléfono ni datos de salud. La app de Evolv no usa el píxel. Puedes bloquearlo desde la configuración de tu navegador y revisar tus preferencias de anuncios en Meta.

- **Agregar** a la lista de "Con quién los compartimos": "medición de anuncios en la web pública (Meta)".
- **Actualizar** `vigenciaLegal` en `tienda/comercio.js` al publicar.
- **Revisar** la frase del consentimiento de la app ("No vendemos tus datos ni los usamos para publicidad", `app/index.html`, exigida por `scripts/validate-privacy.mjs`). Sigue siendo cierta para los datos de la app, pero conviene que Legal la confirme.

Una ventana de consentimiento de cookies queda fuera de este REQ; se evalúa aparte si Legal la pide.

## Riesgos

- `fbevents.js` no tiene versión fija (Meta no la ofrece): no puede llevar SRI. Por eso solo se carga con ID configurado, en la web pública y después de `load`.
- La API de conversiones usa Graph `v24.0` (`api/_tienda/meta-capi.js`). Meta mantiene cada versión unos dos años; actualizarla cuando avise la baja.
