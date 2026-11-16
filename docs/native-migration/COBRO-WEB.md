# Plan de implementación: cobro solo en la web con apps nativas

Decisión base: 2026-11-05. Plan actualizado por NAT-70 con la revisión del 2026-11-16. Decisión de Jonathan: **en las apps de iOS y Android no se compra; se paga en `evolvapp.club` (Culqi) y la app lee el acceso del servidor.** Este documento dice cómo se implementa, qué riesgo tiene frente a las tiendas y qué hacer si una tienda lo rechaza.

Relación con el resto del plan: reemplaza la recomendación original de NAT-H3 (compra integrada) en `PLAN.md` §7 y redefine NAT-13 y NAT-45 (`BACKLOG.md`). Jonathan reanudó la migración el 2026-11-10 (`native-migration.json`, `decisions.md`). La Fase 0 de abajo es trabajo **web**.

## 1. Qué permiten las tiendas en Perú

App Store: lectura del 2026-11-05, no revalidada aquí. Google Play: guía de pagos leída en la revisión del 2026-11-16 (H-12). Confirmar ambas antes de enviar.

| Tienda | Regla | Qué significa para Evolv |
|---|---|---|
| App Store 3.1.1 | Para desbloquear funciones o suscripciones dentro de la app hay que usar la compra integrada; la app no puede usar mecanismos propios para desbloquear (códigos, llaves). | Una app de fitness por suscripción cae en esta regla. Canjear cupones dentro de la app iOS cuenta como "mecanismo propio". |
| App Store 3.1.3(b) Multiplataforma | La app puede dar acceso a lo comprado en la web **siempre que lo mismo también se pueda comprar con compra integrada dentro de la app**. | El "solo web" puro no entra en esta excepción. |
| App Store 3.1.3(a) y 3.1.3(f) | Excepciones para apps "lectoras" (revistas, libros, música, video) y apps gratuitas de VoIP, almacenamiento, correo y hosting. | Evolv no entra en ninguna. |
| App Store, anti-steering (3.1.1(a), 3.1.3) | Salvo en la tienda de EE. UU. y en los países con permiso de enlace externo (UE, Japón, Brasil, entre otros), la app y su ficha no pueden tener botones, enlaces ni llamados a comprar fuera. Sí se permite comunicarse **fuera de la app** (correo) sobre otras formas de pago. | Perú no tiene excepción. La app no puede mostrar precios, "compra en la web" ni enlaces a `/planes`. El correo sí puede. |
| Google Play, pagos | La guía permite explícitamente apps de solo consumo, incluso de un servicio pagado: "Yes. Google Play allows any app to be consumption-only, even if it is part of a paid service." También: "For example, a user could log in when the app opens and access content paid for somewhere else." | Evolv puede iniciar sesión y dar acceso a lo comprado fuera. Vender suscripciones de fitness dentro de la app exige Play Billing. Se admite información sin enlace sobre dónde comprar y comunicación fuera de la app; adoptar textos Android distintos requiere NAT-H9 (D-1/D-4). |

**Conclusión:** Google Play permite expresamente el modelo de solo consumo; el riesgo no es igual al de iOS. En App Store permanece el riesgo de rechazo por 3.1.1. El plan conserva reglas estrictas iguales en ambas plataformas hasta NAT-H9 y valida cada tienda por separado:

1. diseña la app para que no haya **ningún** llamado a comprar (sección 4), lo que reduce el riesgo;
2. lo valida con las tiendas lo antes posible, en beta (Fase 2);
3. deja preparada la compra integrada como contingencia (Fase 3), sin rehacer nada: el servidor ya guarda el acceso con su origen.

Fuentes: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (3.1.1, 3.1.1(a), 3.1.3), [Google Play — Pagos](https://support.google.com/googleplay/android-developer/answer/9858738), [guía de pagos y apps de solo consumo](https://support.google.com/googleplay/android-developer/answer/10281818), [Facturación alternativa con elección del usuario](https://support.google.com/googleplay/android-developer/answer/13821247) y [Programa de ofertas externas](https://support.google.com/googleplay/android-developer/answer/14372887). Las reglas cambian seguido: volver a verificarlas al reanudar la migración y antes de cada envío a revisión.

## 2. Cómo funciona para la persona

**A. Cuenta y compra primero en la web: modelo vigente para la app.** Con la bandera `TIENDA_SUSCRIPCION_ENABLED`, `/registro` pide tarjeta y consentimiento de renovación mensual, con 7 días gratis solo si corresponde (REQ-355/356). La persona recibe el correo para crear su contraseña o usa la cuenta existente; también puede entrar desde una invitación. Descarga la app e inicia sesión con el mismo correo. El pago único de `/planes` → `/pago` sigue disponible cuando la bandera está apagada; no se afirma que la suscripción esté activada en producción.

**B. Registro dentro de la app: no disponible.** La decisión del 2026-11-06 exige crear la cuenta en la web con tarjeta (`docs/web-publica-y-suscripcion.md`); registrar desde nativo permitiría saltarse ese paso. Quien no tiene cuenta ve solo inicio de sesión y texto neutral sin enlaces (D-1 a, valor conservador mientras NAT-H9 siga abierta).

**C. Ciclo de la suscripción.** Cobro mensual por Culqi. El diseño de REQ-357 contempla aviso previo (2 días antes del primer cobro), recibo y aviso de cobro fallido; los correos van fuera de la app. REQ-357 sigue pendiente: no dar estos envíos por implementados. Dentro de la app, próximo cobro solo como fecha cuando el servidor lo exponga, sin precio ni llamada a pagar. Mientras tanto se muestran solo los datos disponibles de `GET /api/entitlement`. Los avisos de vencimiento del pago único siguen su flujo existente (REQ-351) y no deben duplicar los de una suscripción activa.

**D. Cancelación y reembolso.** Cancelar detiene cobros futuros y conserva acceso hasta el fin del período ya cubierto; el endpoint `POST /api/suscripcion/cancelar` existe, la gestión visible y sus correos siguen en REQ-357. Cancelación dentro de la app solo si NAT-H9 aprueba D-2; por omisión queda solo en la web. Reembolso según `CULQI_SETUP.md`: CulqiPanel → devolución → revocación del acceso, visible en el siguiente refresco. No confundir cancelar la renovación con revocar un período pagado.

**E. Cupones y beta.** Se canjean en la web (`/?invite=` y Perfil de la web), no en las apps.

## 3. Arquitectura

```
evolvapp.club (web)                             Apps iOS / Android
/registro → POST /api/suscripcion → Culqi        Iniciar sesión (Supabase)
                                      │                    │
Culqi → POST /api/culqi-webhook ────────┤                    │
                                      ▼                    ▼
                            subscriptions + user_entitlements
/planes → /pago → /api/culqi-charge ────┘          GET /api/entitlement
                                                 (abrir, volver, Actualizar)
Web → POST /api/suscripcion/cancelar → Culqi (sin cobros futuros)
      acceso hasta fin del período; app solo si D-2 se aprueba
notify (cron) → correos fuera de la app; ciclo recurrente pendiente REQ-357
```

Las rutas de suscripción y `/api/culqi-webhook` se reescriben a `/api/checkout?op=…` en `vercel.json` y viven en `api/_tienda/suscripcion.js`. El webhook verifica el evento consultando la API de Culqi; no se supone una firma que esa API no documenta. Inscripción detrás de bandera; webhook y cancelación mantienen su comportamiento servidor.

- **El servidor es la única fuente de verdad del acceso.** `user_entitlements` + `GET /api/entitlement`, que ya devuelve `plan_id`, `status`, `starts_at`, `expires_at` y `origin`. La suscripción ya usa `subscriptions` y `subscription_charges` (REQ-355); los detalles de suscripción para la pantalla dependen de REQ-357. No agregar tablas nativas para leer el acceso.
- **La compra se asocia por correo.** `/api/culqi-charge` busca la cuenta por correo y, si no existe, la invita. Por eso la app y la web deben usar siempre el mismo correo.
- **La app guarda el último estado conocido** (con su fecha) para funcionar sin conexión, pero las funciones de pago (coach, generar planes) siguen exigiendo el permiso en el servidor, como hoy en la web.
- **Origen reservado para la contingencia:** `apple` y `google` solo se agregan si se activa la Fase 3.

## 4. Reglas para la app (anti-steering)

Aplican a la UI, las notificaciones push y la ficha de la tienda, en iOS y Android, fuera de EE. UU.:

- Nada de precios, "planes", "comprar", "suscríbete", "activa tu plan en la web", enlaces o códigos QR a `evolvapp.club/planes`, `/pago` o WhatsApp de ventas.
- Sin acceso activo, la pantalla dice algo neutral, por ejemplo: "Tu acceso no está activo. Si ya lo renovaste, toca Actualizar." Botones permitidos: **Actualizar**, **Cerrar sesión** y **Ayuda** por correo de soporte (D-3 conservador; no `/contacto` ni WhatsApp que llevan a tienda).
- "Mi plan" contempla prueba, activa, cobro fallido, cancelada, vencida, cortesía y beta, según lo que exponga el servidor. Beta no ve nada de cobro (REQ-208). Próximo cobro solo con fecha, sin importe. Cancelar dentro de la app exige D-2 aprobada en NAT-H9; por omisión no hay botón de cancelación.
- Sin canje de cupones en la app.
- Enlaces legales solo a `/privacidad?app=1` y `/terminos?app=1`, con la variante sin navegación, pie de tienda ni enlaces comerciales que implementa NAT-76; no dar esa variante por implementada antes de su verificación. Google permite enlaces administrativos solo si la página no conduce a un pago alternativo.
- D-4 sigue abierta: ambas plataformas usan las mismas reglas estrictas. La guía de Google permite información sin enlace sobre dónde comprar, pero no habilitar esa diferencia hasta NAT-H9.
- Todo error con `paywall` muestra texto local neutral, nunca el mensaje del servidor (NAT-76).
- Las notificaciones push no hablan de pagar.
- Se controla con un validador automático en el release gate (NAT-28 ampliado), igual que REQ-31.

Excepción posible más adelante: si la app se publica también en la tienda de EE. UU. o de países con permiso de enlace, ahí se podría mostrar un enlace, detectando el país de la tienda. No es parte de este plan.

## 5. Fases

### Fase 0 — Web, ahora (no depende de la pausa nativa)

| # | Qué | Quién | Estado |
|---|---|---|---|
| 0.1 | Poner las llaves de **producción** de Culqi en Vercel (`CULQI_PUBLIC_KEY`, `CULQI_SECRET_KEY`), redesplegar, hacer una compra real de S/ 29.90 y reembolsarla el mismo día (`CULQI_SETUP.md` §6). Hasta entonces la web cobra con llaves de prueba. | Persona | Pendiente (el 2026-11-05 la web seguía con `pk_test_`) |
| 0.2 | **REQ-350:** el aviso de plan de la web (`showPaywall()`) muestra los planes en soles y lleva a `/pago` con el correo de la cuenta. Antes mostraba el catálogo en USD de Stripe con "Disponible pronto". | Agente | Hecho (2026-11-05) |
| 0.3 | **REQ-351:** correos de vencimiento (3 días antes y al vencer) con enlace a `/planes`. Es el canal permitido para recordar la renovación a quien usa las apps. | Agente + persona | Código hecho (2026-11-05); falta aplicar `supabase/notifications_plan_expiry.sql` |

### Fase 1 — Al reanudar la migración: la app lee el acceso

| Tarea | Cambio |
|---|---|
| NAT-H3 | Decisión tomada: cobro solo web. Cierre formal solo por una persona (D-10); resultado con tiendas en NAT-H12. |
| NAT-13 | Pasa a ser **contingencia**: solo se hace si se activa la Fase 3. Para el modelo "solo web" no hace falta nada nuevo en el servidor. |
| NAT-45 | "Mi plan" sin compra: estado, plan y vencimiento desde `/api/entitlement`; pantalla neutral sin acceso; **Actualizar**; refresco al abrir y al volver a primer plano; caché sin conexión. Sin dependencias de compra integrada. |
| NAT-28 | El validador de textos nativos también rechaza precios, "comprar"/"planes"/"suscripción" en botones y enlaces a `/planes` o `/pago` (sección 4). |
| NAT-62 | Ficha de tienda sin precios ni menciones a comprar en la web. Notas para el revisor con una cuenta demo con plan de cortesía. |
| NAT-23 / NAT-30 | Flujo A: solo iniciar sesión, recuperar o crear contraseña desde compra/invitación; onboarding después. Sin registro nativo. Pantalla sin cuenta neutral según D-1 a. |

### Fase 2 — Validación temprana: NAT-80 y NAT-H12

NAT-80 prepara el build mínimo después de la fundación; NAT-H12 realiza los envíos y registra el resultado. TestFlight externo no garantiza aprobación final. Si las pestañas están vacías, reservar App Review con publicación manual para cuando Hoy, Nutrición y Entreno funcionen (riesgo de funcionalidad mínima 4.2).

1. **iOS:** TestFlight interno (sin revisión) → TestFlight externo (pasa la revisión de beta) → envío a App Review con la cuenta demo y una nota que diga que la app es el acceso al servicio de Evolv y que no vende nada dentro de la app. Si App Review rechaza por 3.1.1, activar la Fase 3 para iOS.
2. **Android:** prueba cerrada en Play Console → producción. Si Google exige su facturación, activar la Fase 3 para Android.
3. Registrar el resultado en `docs/native-migration/decisions.md` (NAT-H12).

### Fase 3 — Contingencia: compra integrada (solo si una tienda la exige)

- Suscripción mensual: en iOS, suscripción auto-renovable; en Play, suscripción equivalente. Al activarla en NAT-H12 se define la integración (RevenueCat o StoreKit 2/Play Billing) y verificación servidor, renovaciones, período de gracia, reintentos, cancelaciones y reembolsos. No trasladar el antiguo catálogo de duraciones fijas a la recurrencia.
- NAT-13 completo:
  - `origin in ('apple','google')` en `user_entitlements`;
  - un webhook con verificación de firma;
  - idempotencia por id de transacción;
  - el reembolso revoca el acceso.
- **"Restaurar compras"** dentro de la app (obligatorio en iOS si hay compra integrada).
- **Precio en la tienda:** puede ser más alto que en la web para cubrir la comisión (15 % en el Small Business Program de Apple y en el primer millón de Google). Dentro de la app no se puede mencionar que en la web es más barato.
- **La web no cambia:** sigue con Culqi, y los correos de vencimiento siguen enviándose.
- **Esfuerzo:** estimar al activar la contingencia, según plataforma, proveedor y ciclo completo de suscripción; no hay una estimación aprobada.

## 6. Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| App Store rechaza por 3.1.1 (acceso comprado fuera sin compra integrada). | Media-alta | Fase 2 temprana en TestFlight; Fase 3 lista para activarse; cero llamados a comprar. |
| Google Play rechaza un flujo que deja de ser solo consumo (venta o enlaces comerciales). | Menor que iOS | Mantener solo acceso, validar en prueba cerrada y registrar resultado en NAT-H12; contingencia solo si se exige. |
| La persona paga en la web con otro correo y la app no ve el acceso. | Media | `/pago` pide usar el mismo correo; soporte puede mover el plan desde Admin. Un REQ futuro podría ofrecer "¿pagaste con otro correo?" en Ayuda. |
| La web sigue cobrando con llaves de prueba. | Alta hoy | Tarea 0.1. |
| Un texto o push de la app empuja a pagar fuera y causa rechazo. | Media | Validador automático (NAT-28) y revisión de la ficha (NAT-H7). |
| Los correos de vencimiento se sienten spam. | Baja | Solo dos por vencimiento, transaccionales, sin datos de salud, con remitente y asunto claros. |

## 7. Decisiones abiertas

Ninguna recomendación cierra una decisión humana. Ver revisión §3 y `decisions.md`.

| Decisión | Responsable | Valor conservador mientras sigue abierta |
|---|---|---|
| D-1: pantalla para quien no tiene cuenta | NAT-H9 | Solo iniciar sesión y texto neutral sin enlaces en ambas plataformas (a). Android informativo (b) es recomendación, no aprobación. |
| D-2: cancelar desde la app | NAT-H9 | Sin cancelación in-app; mantenerla en la web. |
| D-3: destino de Ayuda | NAT-H9 | Correo de soporte dentro de la app. |
| D-4: textos diferentes por plataforma | NAT-H9 | Mismas reglas estrictas en iOS y Android; ninguna excepción del validador. |
| D-8: cuándo validar con tiendas | NAT-H12 | Preparar build mínimo con NAT-80; envíos solo por una persona. TestFlight externo y prueba cerrada primero; App Review cuando las pantallas principales funcionen. |
