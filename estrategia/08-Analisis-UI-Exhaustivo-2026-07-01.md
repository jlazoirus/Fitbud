# Fitbros — Análisis exhaustivo de UI y plan de mejoras

Fecha: 1 jul 2026
Producción evaluada: https://fitbros.vercel.app/ (nota: los docs internos aún referencian `fitbud-green.vercel.app`; ambas resuelven al mismo deploy)
Método: lectura completa de estrategia y código (`index.html`, 9.904 líneas) + navegación de la app en producción con usuario simulado en memoria del navegador (mismo método de la auditoría del 23 jun; sin tocar backend ni datos reales). Cada hallazgo está verificado contra líneas concretas del código.

---

## 1. Resumen ejecutivo

La app avanzó mucho desde las auditorías de junio: la landing ya tiene breakpoint desktop propio, el tour contextual está en producción, hay empty states que enseñan, Perfil tiene chips de navegación local, y `homePrepareDay()` arma un día determinista cuando el coach no está configurado.

**Pero el problema P0 de activación sigue abierto, solo cambió de forma.** El camino determinista gratis solo se ejecuta cuando el servicio del coach *no está configurado*. En producción el coach SÍ está configurado, así que un usuario nuevo sin entitlement que toca "Preparar mi día" cae directo al **paywall** — y con el checkout de Stripe aún pendiente de activar (REQ-26), ese paywall es hoy un botón roto. La promesa estratégica del "Home agéntico" ("la agenda determinista es gratis y cargar el inicio cuesta cero tokens") no se cumple en el flujo real.

El segundo frente es **jerarquía y densidad**: la agenda (el núcleo del valor) queda enterrada bajo dos banners y un dashboard de macros; Entreno muestra CTAs duplicados; Nutrición repite el hero de Home; Perfil sigue midiendo ~4.850 px con un solo guardado global; Progreso recibe al usuario nuevo con un mar de ceros.

Nada de esto requiere rediseño: son reordenamientos, fusiones y reglas de visibilidad sobre componentes que ya existen.

---

## 2. Qué mejoró desde junio (verificado, no volver a tocar)

- **Landing**: dos columnas en desktop con mockup del producto como prueba inmediata (`@media(min-width:900px)`, línea 636). Pricing y FAQ claros, precios consistentes con NEGOCIO.md (USD 14 / USD 36).
- **Tour contextual** de 5 coachmarks en producción, saltable y repetible desde "?" (líneas 9782+).
- **Día determinista sin coach**: `homePrepareDay()` ya no desvía a Perfil cuando no hay IA (línea 3288).
- **Empty states que enseñan** en Home, Nutrición, Entreno y Progreso (tarjetas `agenda-state setup` con CTA directo).
- **Perfil**: chips de navegación local (Objetivo · Comidas · Entreno · Privacidad · Cuenta) con scroll suave (línea 5000).
- **Touch targets 44 px** vía `@media(pointer:coarse)` (línea 93) y aria-labels en la tabla de peso.
- **Onboarding paso 4** ("Casi listo") es un buen cierre: resumen de referencia diaria + privacidad inline.

---

## 3. Hallazgos priorizados

Prioridad: **P0** bloquea activación/valor · **P1** fricción alta · **P2** pulido.

### P0-1 · "Preparar mi día" lleva al paywall, no al día gratis

**Dónde:** `homePrepareDay()` (línea 3288) → `aiGenerateDay()` (7227) → `coachUnavailable()` (788) → `showPaywall()`.

La lógica actual es: si `aiAvailable()` → intentar coach; el fallback determinista solo corre si el servicio no está configurado. Como en producción el proxy del coach existe, un usuario nuevo sin entitlement nunca llega al camino determinista: ve el paywall en su primera acción tras el onboarding. Cadena agravante: con Stripe pendiente (REQ-26), "Empezar ahora" del paywall termina en error 503.

Esto contradice dos definiciones propias del producto: la promesa de activación ("terminar onboarding y tener algo concreto para ejecutar") y el guardarraíl del Home agéntico ("cargar el inicio cuesta cero tokens", NEGOCIO.md §9).

**Mejora:** invertir el orden. "Preparar mi día" ejecuta SIEMPRE la ruta determinista primero (gratis, instantánea, cero tokens) y muestra el día listo con un CTA secundario "Mejorar con tu coach" que sí puede gatear por entitlement/paywall. El paywall pasa de bloquear la activación a vender una mejora sobre valor ya entregado — mucho mejor momento de venta.

### P0-2 · Si el coach falla, el modal es un callejón sin salida

**Dónde:** `aiGenerateDay()` catch (línea 7237): `$("#genOut").innerHTML = "⚠️ <mensaje>"`.

Ante error de red, sesión o cuota, el modal muestra solo el warning, sin reintentar ni alternativa. Verificado en vivo: modal "⚠️ Vuelve a iniciar sesión para continuar con tu coach." sin más salida que cerrar.

**Mejora:** en el catch, ofrecer siempre dos botones: "Usar una opción práctica ahora" (aplica `deterministicDayPayload()`) y "Reintentar". Aplica igual a `aiGenerateWeek` y demás acciones del coach.

### P0-3 · La agenda queda enterrada en Home

**Dónde:** `renderHoy()` (línea 3490): orden actual = header → alert "Afina tu plan" → banner check-in → `heroDash` (anillo de macros, ~230 px) → agenda → coach.

Para un usuario nuevo el primer viewport son dos avisos y un dashboard en cero; "lo que te toca ahora" (la propuesta de valor) queda al borde o debajo del fold. Además el tour se dispara encima de todo eso la primera vez.

**Mejora:** reordenar: header → **agenda (próxima acción)** → hero compacto → banners → coach. Reglas de visibilidad: el hero en modo compacto (una línea: "0/1900 kcal · 0/4 comidas") mientras no haya registros del día; "Afina tu plan" como chip discreto, no como primer elemento; máximo un banner a la vez (cola de prioridad).

### P1-4 · Banner de check-in: copy roto y triplicado

**Dónde:** `weeklyCheckinBanner()` (línea 9391): `prettyDate(due.start).split(",")[0]` produce **"Martes – Lunes"** — solo los nombres de día, sin fechas. Es un bug de copy verificado en vivo. El banner además aparece en Hoy (3535) y Progreso (4370), y se muestra aunque la semana a revisar no tenga un solo dato registrado ("Revisa cómo fue tu semana" cuando no hubo nada que revisar).

**Mejora:** (a) mostrar "23 jun – 29 jun" o "Semana 1 · 23–29 jun"; (b) un solo lugar (Hoy) y en Progreso solo un acceso discreto; (c) si la semana no tuvo actividad, cambiar el tono a arranque ("Esta semana empecemos de verdad") o auto-omitir sin culpa, coherente con "constancia no punitiva".

### P1-5 · Perfil sigue siendo una página de ~4.850 px

**Dónde:** `renderProfile()` (línea 5002). Medido en vivo: 4.846 px de alto, 91 elementos interactivos, 8 secciones, 47 chips, 64 inputs sin label programático. Los chips solo hacen `scrollIntoView`; el guardado es un "Guardar cambios" global al fondo más dos guardados locales inconsistentes ("Guardar permiso de fotos", "Guardar recordatorios").

Es el pendiente #6/#7 del plan del 24 jun, aún sin ejecutar. El riesgo sigue siendo el mismo: no saber qué importa, y miedo a perder cambios.

**Mejora:** convertir los chips en subvistas reales (o acordeones con todo colapsado por defecto salvo la sección activa), guardado sticky por sección que aparece solo con cambios pendientes, y "Suscripción / Recordatorios / Avisos del dispositivo" agrupados bajo Cuenta. Añadir `aria-label` a los inputs al migrar.

### P1-6 · Nutrición: duplicación y acciones que compiten

**Dónde:** `renderNutrition()` (línea 3544). La vista repite el `heroDash` completo de Home y ofrece tres chips ("🍽️ Preparar este día", "✨ Ver otra opción de comida", "🔍 Revisar mis macros") más "🔄 Preparar otra semana" arriba — cuatro acciones sin jerarquía y con solapamiento semántico (¿en qué se diferencia "preparar día", "otra opción" y "otra semana"?), más un texto helper de dos líneas.

**Mejora:** un CTA primario contextual (si el día no está preparado → "Preparar este día"; si está → nada prominente), y el resto en un menú "···" o como acciones dentro de cada comida. El hero de macros en versión compacta (ya existe en Home; no repetir el bloque completo). Los emojis en botones restan seriedad al tono coach; usar los iconos del set existente.

### P1-7 · Entreno: CTAs duplicados

**Dónde:** `renderWorkout()` (línea 4184). Verificado en vivo: "Iniciar sesión guiada" aparece dos veces (tarjeta instructiva "Guía tu sesión de hoy" + tarjeta del workout) y "Preparar mi plan" otras dos (tarjeta instructiva + tarjeta del plan). Cuatro botones para dos acciones, y la tarjeta instructiva ocupa el primer lugar de la vista de forma permanente.

**Mejora:** la tarjeta "Guía tu sesión de hoy" solo como empty state (sin plan/sesión); con sesión disponible, una sola tarjeta con un "Iniciar sesión guiada" primario y "Cambiar / Adaptar hoy" secundarios. Los chips de contingencia ("Solo 20 min / En casa / Sin equipo / Me perdí la sesión") están muy bien — conservarlos tal cual.

### P1-8 · Progreso recibe al usuario nuevo con un mar de ceros

**Dónde:** `renderProgress()` (línea 4368). Primer viewport para usuario nuevo: banner check-in + 4 stat-cards en cero ("kg", "completos", "días racha", "comidas del plan") + rachas en cero. La tarjeta que enseña ("Registra tu peso de la semana") está bien pero queda abajo, y convive con un box redundante ("Ingresa tu peso semanal para ver el gráfico") que dice lo mismo. La tabla de peso sigue siendo tabla con inputs pequeños (pendiente #8 del plan de junio; los aria-labels sí están).

Detalle visual: los ceros renderizados en la fuente mono display parecen píldoras/óvalos, no números — un usuario puede no entender qué ve.

**Mejora:** con cero datos, colapsar stats y rachas y abrir con la tarjeta "Registra tu peso" + explicación de qué se desbloqueará; labels autoexplicativos ("Peso actual", "Entrenos completados", "Racha", "Adherencia a comidas"); tabla → tarjetas por semana en mobile con stepper; eliminar el box redundante.

### P1-9 · Onboarding: jerga y decisiones avanzadas a destiempo

**Dónde:** `renderOnboarding()` (línea 2546). Paso 2 expone 4 inputs crudos de macros + "Fórmula: Katch-McArdle" — jerga técnica para un público cuyo problema es "no sé qué comer". Paso 3 pide checkbox por día **y** lugar por día (7 selects) — configuración avanzada en pleno onboarding, cuando "Podrás afinar desde tu Perfil" ya existe como patrón.

**Mejora:** paso 2 → mostrar el resultado como resumen amable ("Tu referencia: 2.262 kcal · 137 g proteína") con "Ajustar valores" colapsado para quien sabe; mover la fórmula a un tooltip "¿cómo lo calculamos?". Paso 3 → días + un solo lugar por defecto, "personalizar por día" colapsado. Objetivo: bajar tiempo-a-plan sin perder el dato esencial.

### P2-10 · Copy y consistencia

- "Cancela cuando quieras" (3 ocurrencias en `index.html`) no aplica: los planes son pago único sin renovación. Cambiar a "Sin renovación automática · pagas solo el período".
- Empty state de Home: "Completa o actualiza tu plan para llenar comidas y entrenamiento antes de registrar actividad" → pasivo y largo. Mejor: "Tu coach arma comidas y entreno para hoy en segundos."
- El título de pestaña dice "Fitbros — Tu cuerpo, tu sistema" mientras el copy estratégico usa "tu coach personal"; unificar tagline.
- Paywall visible con checkout inactivo (REQ-26): mientras Stripe no esté activo, no mostrar botones de compra que devuelven error; degradar a determinista + "avísame cuando esté disponible".

### P2-11 · Accesibilidad (deuda transversal)

Medido en vivo: 64 inputs sin label en Perfil, 1 en Home (textarea del coach). Pendientes: labels programáticos al migrar Perfil, `aria-live` para toasts, foco atrapado en modales, y revisar contraste de `--muted` sobre superficies oscuras en textos largos. Los touch targets ya están cubiertos por `pointer:coarse` (las mediciones en desktop no lo activan; re-medir en dispositivo real tras los cambios).

---

## 4. Plan priorizado

| # | Mejora | Prioridad | Impacto | Esfuerzo | Archivo/función |
|---|---|---|---|---|---|
| 1 | Ruta determinista para usuarios sin acceso en "Preparar mi día" (sin paywall en la primera acción) | P0 | Muy alto | 0.5–1 d | ✅ Hecho (1 jul) — `homePrepareDay` usa el patrón de `aiGenerateWeek`: `!aiAvailable()||!hasEntitlement()` → determinista |
| 2 | Fallback + reintento en errores del coach | P0 | Alto | 0.5 d | ✅ Hecho (1 jul) — catch de `aiGenerateDay` ofrece "Usar una opción práctica ahora" + "Reintentar" |
| 3 | Reordenar Home: agenda primero, hero compacto, 1 banner máx. | P0 | Alto | 1 d | ⏳ **REQ-97** — `renderHoy`, `heroDash` |
| 4 | Check-in: fechas reales, un solo lugar, tono de arranque sin datos | P1 | Medio | 0.5 d | ⏳ **REQ-98** — `weeklyCheckinBanner`, `weeklyCheckinDue` |
| 5 | Perfil en subvistas/acordeones + guardado por sección + aria-labels | P1 | Alto | 2–3 d | ⏳ **REQ-99** — `renderProfile` |
| 6 | Nutrición: 1 CTA contextual, hero compacto, acciones a menú | P1 | Medio | 1 d | ⏳ **REQ-100** — `renderNutrition` |
| 7 | Entreno: eliminar CTAs duplicados; instructiva solo como empty state | P1 | Medio | 0.5 d | ⏳ **REQ-101** — `renderWorkout` |
| 8 | Progreso: estado cero guiado, labels claros, tabla→tarjetas | P1 | Medio | 1 d | ⏳ **REQ-102** — `renderProgress`, `weightRows` |
| 9 | Onboarding: macros como resumen, lugar único por defecto | P1 | Alto | 1 d | ⏳ **REQ-103** — `renderOnboarding` |
| 10 | Copy: "sin renovación automática", empty states, tagline | P2 | Bajo | 0.25 d | ⏳ **REQ-104** — `renderLanding`, varios |
| 11 | Paywall degradado mientras REQ-26 no esté activo | P2 | Medio | 0.5 d | ⏳ **REQ-104** — `showPaywall`, `api/checkout.js` |

> Los pendientes quedaron registrados como REQ-97…REQ-104 en `REQUIREMENTS.md` (sección "Secuencia activa"), listos para correr en próximas sesiones o por el agente autónomo, un REQ por commit.

**Secuencia sugerida:** Semana 1 → #1, #2, #3, #4 (cierra la fuga de activación; ~3 días). Semana 2 → #6, #7, #8, #9 (densidad y claridad por pestaña). Semana 3 → #5 (Perfil, el más grande) + #10, #11.

**Adenda 1 jul — calidad del día determinista (implementado junto con #1 y #2):**

- **Pre-rankeo por cercanía calórica**: los 48 platos que reciben solver completo ahora son los de tamaño más apropiado para cada slot, no los primeros en orden arbitrario del catálogo (`planDeterministicNutritionDay`).
- **Variedad entre días**: nuevo parámetro `recentUsed` (penaliza platos de los últimos 3 días, construido desde `day_log` local vía `recentDishSlugs()`) + desempate determinista por fecha (`seededJitter`): el mismo día siempre produce el mismo plan, pero días distintos rotan entre platos casi equivalentes en vez de repetir siempre el mismo ganador.
- **`applyDayComidas` guarda `dishSlug`** en el override para que la detección de "usado reciente" sea confiable.
- **Copy con datos reales**: la explicación del día generado ahora dice "Tu día quedó en X kcal con Y g de proteína…" en vez de "Alternativa práctica construida…" (menos sensación de relleno).
- **Sin más callejones**: se eliminó el desvío a Perfil cuando falla el catálogo; ahora toast con reintento.
- Cobertura: 6 tests nuevos en `validate-nutrition-solver.mjs` (determinismo por fecha, rotación por `recentUsed`, semana reproducible con `startDate`). Los 43 checks funcionales del release gate pasan.

---

## 5. Cómo medir

Reusar `trackEvent` y el embudo de activación existente:

- **Activación (north star local):** % de usuarios que registran 1ª comida o inician 1er entreno el mismo día del onboarding. El cambio #1 debería moverla de forma visible.
- **Paywall:** eventos de paywall mostrado en el primer día de vida del usuario (debería tender a cero tras #1) vs. paywall mostrado sobre "Mejorar con tu coach" (nuevo, mejor momento de venta).
- **Día vacío:** frecuencia del estado `setup` en Home.
- **Check-in:** tasa de check-ins iniciados vs. omitidos tras el fix de copy.
- **Perfil:** tiempo en Perfil y tasa de guardado tras la migración por secciones.

---

## 6. Anexo: métricas DOM capturadas (1 jul 2026, producción)

| Vista | Alto scroll (px) | Interactivos | Inputs sin label |
|---|---:|---:|---:|
| Hoy | 1.174 | 18 | 1 |
| Nutrición | 1.243 | 31 | 0 |
| Entreno | 1.621 | 23 | 0 |
| Progreso | 2.034 | 29 | 0 |
| Perfil | **4.846** | **91** | **64** |

Nota: medidas tomadas con viewport desktop; los mínimos táctiles de `pointer:coarse` no aplican en esa condición, por lo que no se reportan conteos de targets <44 px (re-medir en dispositivo táctil real). Perfil bajó de ~5.436 px (23 jun) a ~4.846 px, sigue siendo 4–5× el resto de las vistas.
