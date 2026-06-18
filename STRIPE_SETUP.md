# Configuración de Stripe para Fitbros

Pasos pendientes para activar el checkout de suscripciones (REQ-26).
La tabla `billing_events` ya está aplicada en Supabase.

---

## 1. Crear cuenta Stripe

https://dashboard.stripe.com/register — el modo **Test** (sandbox) es gratuito y no cobra real.

---

## 2. Crear los dos precios en Stripe

**Catalog → Products → Add product** (o desde la API):

| Plan | Monto | Tipo | Variable Vercel |
|------|-------|------|-----------------|
| Plan mensual | USD 14.00 | One-time | `STRIPE_PRICE_MONTHLY` |
| Paquete 3 meses | USD 36.00 | One-time | `STRIPE_PRICE_QUARTERLY` |

Copiar el `price_xxx` de cada uno.

---

## 3. Variables de entorno en Vercel

Ir a **Vercel → fitbud-green → Settings → Environment Variables** y agregar:

```
STRIPE_SECRET_KEY        sk_test_...       (Stripe → Developers → API keys)
STRIPE_WEBHOOK_SECRET    whsec_...         (se genera en el paso 4)
STRIPE_PRICE_MONTHLY     price_...
STRIPE_PRICE_QUARTERLY   price_...
```

> Las keys de test tienen prefijo `sk_test_` y `pk_test_`. Las de producción usan `sk_live_` / `pk_live_`.

---

## 4. Registrar el webhook en Stripe

**Stripe → Developers → Webhooks → Add endpoint**

- **URL:** `https://fitbud-green.vercel.app/api/webhook`
- **Eventos a escuchar:**
  - `checkout.session.completed`
  - `charge.refunded`
  - `charge.dispute.created`
  - `payment_intent.payment_failed`
  - `checkout.session.expired`

Stripe genera un `whsec_...` — copiarlo a `STRIPE_WEBHOOK_SECRET` en Vercel.

---

## 5. Verificar en sandbox

Stripe provee tarjetas de prueba: `4242 4242 4242 4242` (cualquier fecha futura, cualquier CVC).

1. Abrir la app → Perfil → "Ver planes disponibles" → "Activar plan"
2. Completar el checkout con la tarjeta de prueba
3. Confirmar que al volver aparece el modal "¡Pago recibido!"
4. Verificar en Perfil → "Mi suscripción" que el plan está activo
5. En Stripe → Developers → Webhooks → ver que el evento `checkout.session.completed` llegó con status 200
6. En Supabase → `user_entitlements`: debe haber una fila con `origin = 'checkout'`
7. En Supabase → `billing_events`: debe haber una fila con `status = 'processed'`

---

## 6. Pasar a producción (cuando corresponda)

1. Reemplazar las keys de test (`sk_test_`, `whsec_test_`) por las de producción (`sk_live_`, `whsec_live_`)
2. Registrar un segundo webhook endpoint apuntando al mismo dominio, con las keys de producción
3. Verificar que los `price_xxx` de producción correspondan a los planes correctos
