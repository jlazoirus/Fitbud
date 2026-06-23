# Fitbros — Auditoría de deploy y UX/UI

Fecha: 23 jun 2026  
Producción evaluada: https://fitbud-green.vercel.app/  
Contexto: intento de deploy forzado a Vercel + análisis heurístico visual de la app.

## Resumen ejecutivo

El deploy forzado a producción no se completó. Vercel rechazó el despliegue porque el proyecto está en plan Hobby y `vercel.json` define un cron horario (`0 * * * *`) para `/api/notify`; Hobby solo permite cron diario.

La producción actual sigue mayormente operativa: el smoke test público pasó 8/9 checks. El fallo restante es `POST /api/checkout` sin sesión, que devuelve `503` en vez de `401/403`. La causa probable es que `api/checkout.js` verifica la configuración de Stripe antes de validar la sesión, o que faltan variables de Stripe en Vercel.

En UX/UI, la base visual está consistente y sin desbordes horizontales. Los principales riesgos son de activación y operación móvil: el usuario puede terminar en un primer día vacío, Perfil es demasiado largo/denso y Progreso/Perfil tienen controles táctiles pequeños.

## Deploy

Comando ejecutado:

```bash
npx vercel@latest --prod --force --yes
```

Resultado:

```text
Vercel CLI 54.15.1
Deploying jlazoirus-projects/fitbud
Error: Hobby accounts are limited to daily cron jobs.
This cron expression (0 * * * *) would run more than once per day.
Upgrade to the Pro plan to unlock all Cron Jobs features on Vercel.
```

Bloqueo:

- `vercel.json` tiene `crons[0].schedule = "0 * * * *"`.
- En Vercel Hobby, esa frecuencia no se puede desplegar.

Opciones de resolución:

1. Subir el proyecto a Vercel Pro y mantener recordatorios horarios.
2. Cambiar el cron a diario, por ejemplo `0 20 * * *`, sabiendo que cambia la semántica de recordatorios.
3. Quitar temporalmente el cron para desplegar y manejar `/api/notify` con un scheduler externo.

No se recomienda degradar el cron sin decisión de producto, porque afecta retención y recordatorios.

## Verificación técnica

Checks locales ejecutados:

```bash
node scripts/audit-html.mjs
node scripts/validate-contracts.mjs
node scripts/validate-privacy.mjs
node scripts/validate-training-plan.mjs
```

Resultado: todos pasaron.

Smoke test de producción:

```bash
node scripts/smoke-test.mjs --url https://fitbud-green.vercel.app
```

Resultado: 8/9 checks pasaron.

Fallo:

```text
POST /api/checkout sin auth devuelve 401: Se esperaba 401/403, recibido 503.
```

Lectura técnica:

- En `api/checkout.js`, si `STRIPE_SECRET_KEY` no está configurada, el endpoint responde `503` antes de llamar a `verifyUser`.
- Para una petición sin auth, el contrato esperado por el smoke es `401/403`.
- Corregir el orden de validación haría el endpoint más seguro y estable: primero método, luego sesión, luego configuración de pasarela.

## Evidencia visual

Capturas guardadas:

- [Landing mobile](../assets/ux-audit-2026-06-23/01-landing-mobile.png)
- [Auth local mobile](../assets/ux-audit-2026-06-23/02-auth-local-mobile.png)
- [Onboarding paso 1 mobile](../assets/ux-audit-2026-06-23/03-onboarding-step1-mobile.png)
- [Home mobile](../assets/ux-audit-2026-06-23/04-home-mobile.png)
- [Nutrición mobile](../assets/ux-audit-2026-06-23/05-nutricion-mobile.png)
- [Entreno mobile](../assets/ux-audit-2026-06-23/05-entreno-mobile.png)
- [Progreso mobile](../assets/ux-audit-2026-06-23/05-progreso-mobile.png)
- [Perfil mobile](../assets/ux-audit-2026-06-23/05-perfil-mobile.png)
- [Landing desktop](../assets/ux-audit-2026-06-23/10-landing-desktop.png)
- [Home desktop](../assets/ux-audit-2026-06-23/11-home-desktop.png)
- [Métricas DOM](../assets/ux-audit-2026-06-23/metrics.json)

Método:

- Servidor estático local en `http://127.0.0.1:4173/`.
- Chrome headless vía DevTools Protocol.
- Usuario activo simulado solo en memoria del navegador para capturar Home, Nutrición, Entreno, Progreso y Perfil sin tocar backend ni datos reales.

## Hallazgos UX/UI priorizados

### P0 — Primer valor puede quedar vacío

Pantallas afectadas: Home y Nutrición.

El estado capturado muestra:

- Home: “Aún falta preparar este día”.
- Nutrición: comidas “Sin asignar — prepara una opción con tu coach o elige”.

Esto contradice la promesa central de activación: terminar onboarding y tener algo concreto para ejecutar. El riesgo no es visual, es de confianza. Un usuario nuevo puede sentir que completó datos pero aún no recibió el plan.

Recomendación:

- Garantizar un día determinístico completo tras onboarding aunque el coach/backend falle.
- En Home, el CTA primario debería preparar el día directamente si falta, no mandar a Perfil salvo que falten datos realmente obligatorios.
- Separar “afinar plan” de “bloquea el primer día”. Afinar debe ser mejora posterior, no requisito perceptual para recibir valor.

### P1 — Perfil es demasiado denso para mobile

Pantalla afectada: Perfil.

La captura de Perfil mide aprox. 5,436 px de alto en mobile. Contiene macros, alimentación, entrenamiento, suscripción, privacidad, recordatorios, push y cuenta en una sola pantalla.

Riesgo:

- El usuario no sabe qué sección importa ahora.
- Guardar todo al final aumenta miedo a perder cambios.
- Hay demasiadas decisiones avanzadas en una pantalla de ajuste.

Recomendación:

- Dividir Perfil en secciones con navegación local: “Objetivo”, “Comidas”, “Entrenamiento”, “Privacidad”, “Cuenta”.
- Guardado por sección o botón sticky “Guardar cambios” cuando haya modificaciones.
- Ocultar opciones avanzadas por defecto: cocinas, preparaciones, equipo detallado, lesiones y recordatorios.

### P1 — Controles táctiles pequeños en Progreso y Perfil

Métricas:

- Progreso mobile: 26 targets bajo 44 px.
- Perfil mobile: 30 targets bajo 44 px.
- Nutrición mobile: 19 targets bajo 44 px.

Ejemplos:

- Inputs de peso/% grasa en tabla.
- Checkboxes dentro de chips.
- Botones pequeños como “Cambiar”, “···”, controles colapsables y CTAs secundarios.

Recomendación:

- Elevar altura mínima de `.btn-sm`, chips y controles de tabla a 44 px en pantallas táctiles.
- Convertir la tabla de peso en filas tipo tarjeta en mobile, con inputs full-width o steppers.
- Mantener botones iconográficos solo si el hit area completo llega a 44x44 px.

### P1 — Accesibilidad de inputs de Progreso

Métricas:

- Progreso mobile: 20 inputs sin etiqueta programática.

La tabla comunica “kg” y “%” visualmente por placeholder y columnas, pero los inputs no tienen `aria-label` contextual. Para lectores de pantalla, “kg” repetido no dice semana ni métrica.

Recomendación:

- Agregar `aria-label="Peso semana S1 en kg"` y `aria-label="Grasa corporal semana S1 en porcentaje"`.
- Si se cambia a tarjetas mobile, usar labels visibles por fila.

### P2 — Landing móvil es persuasiva pero larga

La landing no tiene overflow horizontal y la propuesta es clara. El problema es jerarquía y velocidad de convicción.

Observaciones:

- El primer viewport es mayormente headline + copy + CTA.
- El mockup aparece después, no como prueba inmediata del producto.
- En desktop se mantiene una columna móvil centrada, dejando mucho espacio vacío.

Recomendación:

- En mobile, subir parte del mockup/product proof al primer viewport o reducir altura del hero.
- En desktop, usar layout de dos columnas o una composición más ancha para landing, manteniendo la app interna como PWA mobile.
- Hacer que “qué recibiré hoy” sea visible antes de features abstractas.

### P2 — Home desktop confirma estrategia mobile-first

Home desktop se ve limpio, pero el producto completo queda dentro de un contenedor móvil centrado. Esto es aceptable si Fitbros se posiciona como PWA móvil, pero la landing pública no debería heredar necesariamente esa restricción.

Recomendación:

- Mantener app autenticada en ancho móvil si el uso esperado es celular.
- Dar a la landing un breakpoint desktop propio.

## Métricas capturadas

| Pantalla | Overflow horizontal | Targets < 44 px | Inputs sin label | Alto scroll |
|---|---:|---:|---:|---:|
| Landing mobile | 0 | 3 | 0 | 3334 |
| Auth local mobile | 0 | 2 | 0 | 844 |
| Onboarding paso 1 | 0 | 0 | 0 | 916 |
| Home mobile | 0 | 0 | 0 | 844 |
| Nutrición mobile | 0 | 19 | 0 | 1415 |
| Entreno mobile | 0 | 5 | 0 | 844 |
| Progreso mobile | 0 | 26 | 20 | 2012 |
| Perfil mobile | 0 | 30 | 3 | 5436 |
| Landing desktop | 0 | 3 | 0 | 3042 |
| Home desktop | 0 | 0 | 0 | 900 |

## Backlog sugerido

1. Corregir contrato de `api/checkout.js`: validar auth antes de validar Stripe config.
2. Decidir cron de Vercel: Pro, diario o scheduler externo.
3. Asegurar primer día completo tras onboarding con fallback determinístico.
4. Rediseñar Progreso mobile: inputs accesibles y touch targets de 44 px.
5. Compactar Perfil con secciones y guardado por sección.
6. Dar a la landing un breakpoint desktop propio y acercar el mockup al primer viewport.

## Nota de estado del repo

Durante esta auditoría se detectó que el worktree ya contenía cambios no relacionados en:

- `CONTEXT.md`
- `index.html`
- `service-worker.js`
- `api/billing-history.js`
- `scripts/test-billing-history-api.mjs`

No fueron revertidos ni modificados como parte de esta auditoría.
