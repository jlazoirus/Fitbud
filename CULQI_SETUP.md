# Tienda web con Culqi — pasos manuales

Qué falta para pasar la revisión de Culqi y empezar a cobrar (REQ-331..334). El código ya está; esto lo hace una persona.

---

## 1. Datos del comercio

Editar `tienda/comercio.js` y reemplazar cada `[COMPLETAR…]` con los datos **del titular inscrito en Culqi** (Sathya):

| Campo | Ejemplo |
|-------|---------|
| `razonSocial` | Nombre completo (persona natural con RUC) o razón social |
| `ruc` | 10XXXXXXXXX / 20XXXXXXXXX |
| `direccion` | Dirección fiscal según SUNAT |
| `correo` | Correo de atención que se revise a diario |
| `telefono` | Teléfono de atención |
| `redes` | Solo cuentas reales: `[{ nombre: "Instagram", url: "https://instagram.com/…" }]` |

`node scripts/test-tienda-culqi.mjs` avisa mientras quede algún marcador.

## 2. Base de datos (Supabase → SQL Editor)

Ejecutar `supabase/tienda_culqi.sql` (idempotente). Crea `libro_reclamaciones` y agrega `billing_events.provider`. Sin esto, el Libro de Reclamaciones responde "no disponible".

Para pegar el SQL sin romper tildes: `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pbcopy < supabase/tienda_culqi.sql`.

## 3. Llaves de Culqi (Vercel → Settings → Environment Variables)

CulqiPanel → **Desarrollo → API Keys**, entorno **Integración** mientras dure la revisión:

```
CULQI_PUBLIC_KEY   llave pública  (la usa el navegador)
CULQI_SECRET_KEY   llave secreta  (solo /api/culqi-charge)
```

Deben existir también (ya usadas por los recordatorios): `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL`. Opcional: `RECLAMOS_NOTIFY_EMAIL` (coma-separados) para recibir las hojas del Libro; si falta, llegan a los admins activos.

Redesplegar después de agregar las variables.

## 4. Prueba de punta a punta (llaves de integración)

1. Abrir `https://evolvapp.club/planes` → **Comprar** un plan.
2. Correo de prueba propio, aceptar términos, **Pagar**.
3. Tarjeta `4111 1111 1111 1111`, vencimiento `09/30`, CVV `123`.
4. Debe aparecer "¡Gracias por tu compra!" y llegar el correo de invitación o el recibo.
5. En Supabase: fila en `user_entitlements` con `payment_ref = chr_…` y en `billing_events` con `provider = culqi`.
6. 3DS: correo `review@culqi.com` y tarjeta `4456 5300 0000 1096` (07/30, CVV 111).
7. Libro: enviar una hoja de prueba desde `/libro-de-reclamaciones` y confirmar el correo.

## 5. Reenviar a Culqi

URLs para la revisión:

- Productos y compra: `https://evolvapp.club/planes` (también en la portada, sección "Elige tu ritmo")
- Pago: `https://evolvapp.club/pago?plan=monthly`
- Términos: `https://evolvapp.club/terminos`
- Cambios y devoluciones: `https://evolvapp.club/devoluciones`
- Privacidad: `https://evolvapp.club/privacidad`
- Contacto: `https://evolvapp.club/contacto`
- Libro de Reclamaciones: `https://evolvapp.club/libro-de-reclamaciones`

La compra no pide usuario ni contraseña: no hace falta darles credenciales de prueba. La inscripción debe ser como **página web** (el requisito de App Store/Google Play aplica solo a apps).

## 6. Al aprobarse

Cambiar `CULQI_PUBLIC_KEY` y `CULQI_SECRET_KEY` por las de **Producción** y redesplegar. Hacer una compra real de S/ 29.90 y reembolsarla el mismo día desde CulqiPanel (sin comisión ese día).

## Operación

- **Reembolsos:** CulqiPanel → la venta → Devolución. Luego, en Supabase, poner `status = 'revoked'` en la fila de `user_entitlements` con ese `payment_ref`.
- **Cobro sin acceso:** si `billing_events` tiene `provider = culqi` y `status = failed`, la persona pagó y no recibió acceso. Crear o invitar la cuenta y otorgar el plan desde Admin.
- **Comprobantes:** los términos prometen enviar el comprobante electrónico al correo de la compra. Emitirlo con el sistema de facturación del titular (SUNAT).
- **Avisos de vencimiento (REQ-351):** el cron horario (`/api/notify`) manda un correo 3 días antes y otro al vencer cada plan pagado, entre las 9:00 y las 20:00 de Lima, con enlace para renovar. Requiere aplicar una vez `supabase/notifications_plan_expiry.sql`; sin él no se envían (el resto del cron sigue igual). La respuesta del cron trae el conteo en `planExpiry`.
- **Libro de Reclamaciones:** responder cada hoja en máximo 15 días hábiles por el medio que indicó la persona y registrar la respuesta en `libro_reclamaciones` (`respuesta`, `respondido_en`, `estado = 'respondido'`).
