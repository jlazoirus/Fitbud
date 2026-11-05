# Plan de implementación: cobro solo en la web con apps nativas

Fecha: 2026-11-05. Decisión de Jonathan: **en las apps de iOS y Android no se compra; se paga en `evolvapp.club` (Culqi) y la app lee el acceso del servidor.** Este documento dice cómo se implementa, qué riesgo tiene frente a las tiendas y qué hacer si una tienda lo rechaza.

Relación con el resto del plan: reemplaza la recomendación original de NAT-H3 (compra integrada) en `PLAN.md` §7 y redefine NAT-13 y NAT-45 (`BACKLOG.md`). La migración nativa sigue en pausa (`native-migration.json`). La Fase 0 de abajo es trabajo **web** y no depende de esa pausa.

## 1. Qué permiten hoy las tiendas en Perú (verificado el 2026-11-05)

| Tienda | Regla | Qué significa para Evolv |
|---|---|---|
| App Store 3.1.1 | Para desbloquear funciones o suscripciones dentro de la app hay que usar la compra integrada; la app no puede usar mecanismos propios para desbloquear (códigos, llaves). | Una app de fitness por suscripción cae en esta regla. Canjear cupones dentro de la app iOS cuenta como "mecanismo propio". |
| App Store 3.1.3(b) Multiplataforma | La app puede dar acceso a lo comprado en la web **siempre que lo mismo también se pueda comprar con compra integrada dentro de la app**. | El "solo web" puro no entra en esta excepción. |
| App Store 3.1.3(a) y 3.1.3(f) | Excepciones para apps "lectoras" (revistas, libros, música, video) y apps gratuitas de VoIP, almacenamiento, correo y hosting. | Evolv no entra en ninguna. |
| App Store, anti-steering (3.1.1(a), 3.1.3) | Salvo en la tienda de EE. UU. y en los países con permiso de enlace externo (UE, Japón, Brasil, entre otros), la app y su ficha no pueden tener botones, enlaces ni llamados a comprar fuera. Sí se permite comunicarse **fuera de la app** (correo) sobre otras formas de pago. | Perú no tiene excepción. La app no puede mostrar precios, "compra en la web" ni enlaces a `/planes`. El correo sí puede. |
| Google Play, pagos | Las apps que exigen o aceptan pago por funciones o servicios (el ejemplo citado es "suscripciones de fitness") deben usar la facturación de Google Play; no pueden llevar al usuario a otro medio de pago (ficha, botones, enlaces, flujos de registro). Los programas de facturación alternativa y ofertas externas no incluyen Perú. | Mismo riesgo que en iOS. La política no tiene una excepción explícita para apps que solo leen lo comprado fuera. |

**Conclusión:** la app sin compra es viable en la práctica (muchas apps solo inician sesión), pero **ninguna de las dos tiendas la permite de forma explícita en Perú**. Puede pasar la revisión o ser rechazada (App Store 3.1.1 es el motivo de rechazo más común en este caso). Por eso el plan:

1. diseña la app para que no haya **ningún** llamado a comprar (sección 4), lo que reduce el riesgo;
2. lo valida con las tiendas lo antes posible, en beta (Fase 2);
3. deja preparada la compra integrada como contingencia (Fase 3), sin rehacer nada: el servidor ya guarda el acceso con su origen.

Fuentes: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (3.1.1, 3.1.1(a), 3.1.3), [Google Play — Pagos](https://support.google.com/googleplay/android-developer/answer/9858738), [Facturación alternativa con elección del usuario](https://support.google.com/googleplay/android-developer/answer/13821247) y [Programa de ofertas externas](https://support.google.com/googleplay/android-developer/answer/14372887). Las reglas cambian seguido: volver a verificarlas al reanudar la migración y antes de cada envío a revisión.

## 2. Cómo funciona para la persona

**A. Compra primero en la web.** Paga en `evolvapp.club/planes` → recibe el correo para crear su contraseña (o el plan se suma a su cuenta) → descarga la app → inicia sesión con el mismo correo → la app muestra su plan activo.

**B. Empieza en la app.** Crea su cuenta en la app → tiene su semana gratis (REQ-117, en el servidor) → cuando termina o su plan vence, la app muestra que su acceso no está activo, **sin precios ni enlaces** → le llega un correo (fuera de la app) con el enlace a `/planes` → paga en la web con el mismo correo → al volver a la app, el acceso se actualiza solo.

**C. Vencimiento.** Correo 3 días antes y el día que vence, con enlace a `/planes` (fuera de la app; permitido). Dentro de la app solo se informa la fecha de vencimiento.

**D. Reembolso.** Igual que hoy (`CULQI_SETUP.md`): CulqiPanel → devolución → `status = 'revoked'`. La app deja de ver el acceso en el siguiente refresco.

**E. Cupones y beta.** Se canjean en la web (`/?invite=` y Perfil de la web), no en las apps.

## 3. Arquitectura

```
evolvapp.club (web)                         Apps iOS / Android
───────────────────                         ──────────────────
/planes → /pago → Culqi                     Iniciar sesión (Supabase)
        │                                          │
        ▼                                          ▼
/api/culqi-charge ──► user_entitlements ◄── GET /api/entitlement
        (origin: checkout,                  (al abrir, al volver a primer plano
         payment_ref chr_…)                  y al tocar "Actualizar")
        │
        └─► correo de compra
notify (cron) ──► correos de vencimiento con enlace a /planes
```

- **El servidor es la única fuente de verdad del acceso.** `user_entitlements` + `GET /api/entitlement`, que ya devuelve `plan_id`, `status`, `starts_at`, `expires_at` y `origin`. No hace falta tabla nueva para el modelo "solo web".
- **La compra se asocia por correo.** `/api/culqi-charge` busca la cuenta por correo y, si no existe, la invita. Por eso la app y la web deben usar siempre el mismo correo.
- **La app guarda el último estado conocido** (con su fecha) para funcionar sin conexión, pero las funciones de pago (coach, generar planes) siguen exigiendo el permiso en el servidor, como hoy en la web.
- **Origen reservado para la contingencia:** `apple` y `google` solo se agregan si se activa la Fase 3.

## 4. Reglas para la app (anti-steering)

Aplican a la UI, las notificaciones push y la ficha de la tienda, en iOS y Android, fuera de EE. UU.:

- Nada de precios, "planes", "comprar", "suscríbete", "activa tu plan en la web", enlaces o códigos QR a `evolvapp.club/planes`, `/pago` o WhatsApp de ventas.
- Sin acceso activo, la pantalla dice algo neutral, por ejemplo: "Tu acceso no está activo. Si ya lo renovaste, toca Actualizar." Botones permitidos: **Actualizar**, **Cerrar sesión** y **Ayuda** (que lleva a soporte, no a comprar).
- "Mi plan" muestra el plan, el estado y la fecha de vencimiento, y nada sobre cómo renovarlo.
- Sin canje de cupones en la app.
- Los términos y la política de privacidad se pueden enlazar (son obligatorios), pero desde la app no se abre `/planes`.
- Las notificaciones push no hablan de pagar.
- Se controla con un validador automático en el release gate (NAT-28 ampliado), igual que REQ-31.

Excepción posible más adelante: si la app se publica también en la tienda de EE. UU. o de países con permiso de enlace, ahí se podría mostrar un enlace, detectando el país de la tienda. No es parte de este plan.

## 5. Fases

### Fase 0 — Web, ahora (no depende de la pausa nativa)

| # | Qué | Quién | Estado |
|---|---|---|---|
| 0.1 | Poner las llaves de **producción** de Culqi en Vercel (`CULQI_PUBLIC_KEY`, `CULQI_SECRET_KEY`), redesplegar, hacer una compra real de S/ 29.90 y reembolsarla el mismo día (`CULQI_SETUP.md` §6). Hasta entonces la web cobra con llaves de prueba. | Persona | Pendiente (el 2026-11-05 la web seguía con `pk_test_`) |
| 0.2 | **REQ-350:** el aviso de plan de la web (`showPaywall()`) muestra los planes en soles y lleva a `/pago` con el correo de la cuenta. Antes mostraba el catálogo en USD de Stripe con "Disponible pronto". | Agente | Hecho (2026-11-05) |
| 0.3 | **REQ-351:** correos de vencimiento (3 días antes y al vencer) con enlace a `/planes`. Es el canal permitido para recordar la renovación a quien usa las apps. | Agente | Pendiente (necesita SQL manual) |

### Fase 1 — Al reanudar la migración: la app lee el acceso

| Tarea | Cambio |
|---|---|
| NAT-H3 | Se cierra con "cobro solo en la web" (decisión del 2026-11-05) y esta contingencia. |
| NAT-13 | Pasa a ser **contingencia**: solo se hace si se activa la Fase 3. Para el modelo "solo web" no hace falta nada nuevo en el servidor. |
| NAT-45 | "Mi plan" sin compra: estado, plan y vencimiento desde `/api/entitlement`; pantalla neutral sin acceso; **Actualizar**; refresco al abrir y al volver a primer plano; caché sin conexión. Sin dependencias de compra integrada. |
| NAT-28 | El validador de textos nativos también rechaza precios, "comprar"/"planes"/"suscripción" en botones y enlaces a `/planes` o `/pago` (sección 4). |
| NAT-62 | Ficha de tienda sin precios ni menciones a comprar en la web. Notas para el revisor con una cuenta demo con plan de cortesía. |
| NAT-23 / NAT-30 | El registro en la app debe existir para el flujo B. Si la web sigue solo con invitación (`SIGNUP_MODE=invite`), decidir antes si la app abre el registro (ver sección 7). |

### Fase 2 — Validación con las tiendas (antes del lanzamiento público)

1. **iOS:** TestFlight interno (sin revisión) → TestFlight externo (pasa la revisión de beta) → envío a App Review con la cuenta demo y una nota que diga que la app es el acceso al servicio de Evolv y que no vende nada dentro de la app. Si App Review rechaza por 3.1.1, activar la Fase 3 para iOS.
2. **Android:** prueba cerrada en Play Console → producción. Si Google exige su facturación, activar la Fase 3 para Android.
3. Registrar el resultado en `docs/native-migration/decisions.md` (NAT-H3).

### Fase 3 — Contingencia: compra integrada (solo si una tienda la exige)

- Los mismos 3 planes como productos de la tienda: en iOS, "non-renewing subscription" de 30, 90 y 180 días; en Play, productos de compra única equivalentes. Se gestionan con RevenueCat o con StoreKit 2 y Play Billing con verificación en el servidor.
- NAT-13 completo:
  - `origin in ('apple','google')` en `user_entitlements`;
  - un webhook con verificación de firma;
  - idempotencia por id de transacción;
  - el reembolso revoca el acceso.
- **"Restaurar compras"** dentro de la app (obligatorio en iOS si hay compra integrada).
- **Precio en la tienda:** puede ser más alto que en la web para cubrir la comisión (15 % en el Small Business Program de Apple y en el primer millón de Google). Dentro de la app no se puede mencionar que en la web es más barato.
- **La web no cambia:** sigue con Culqi, y los correos de vencimiento siguen enviándose.
- **Esfuerzo estimado:** 1 a 2 semanas, con la base de las fases 0 y 1 ya hecha.

## 6. Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| App Store rechaza por 3.1.1 (acceso comprado fuera sin compra integrada). | Media-alta | Fase 2 temprana en TestFlight; Fase 3 lista para activarse; cero llamados a comprar. |
| Google Play exige su facturación para la suscripción de fitness. | Media | Prueba cerrada antes del lanzamiento; Fase 3 para Android. |
| La persona paga en la web con otro correo y la app no ve el acceso. | Media | `/pago` pide usar el mismo correo; soporte puede mover el plan desde Admin. Un REQ futuro podría ofrecer "¿pagaste con otro correo?" en Ayuda. |
| La web sigue cobrando con llaves de prueba. | Alta hoy | Tarea 0.1. |
| Un texto o push de la app empuja a pagar fuera y causa rechazo. | Media | Validador automático (NAT-28) y revisión de la ficha (NAT-H7). |
| Los correos de vencimiento se sienten spam. | Baja | Solo dos por vencimiento, transaccionales, sin datos de salud, con remitente y asunto claros. |

## 7. Lo que decide una persona

1. **Llaves de producción de Culqi** (tarea 0.1). Urgente: sin esto no entra dinero real.
2. **Registro en la app:** si las apps permiten crear cuenta con la semana gratis (flujo B) o solo iniciar sesión a quien ya compró en la web (flujo A). Solo A reduce el riesgo en la revisión de Apple, pero corta la adquisición desde la tienda.
3. **Países de distribución:** solo Perú al inicio (recomendado), o también otros.
4. **Precio en la tienda** si se activa la Fase 3.
5. **Recurrencia:** hoy los planes son pago único sin renovación automática. Si más adelante se quiere un cobro automático mensual, es un cambio aparte en la web (Culqi), en los términos y en los correos. Este plan funciona igual con ambos modelos.
