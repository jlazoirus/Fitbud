# Fitbros — Plan de UX: ¿guided tour? + simplificación de usabilidad

Fecha: 24 jun 2026
Autor: análisis sobre el repo (`index.html`, onboarding, Home, pestañas) + auditoría UX del 23 jun 2026.
Alcance: decidir si implementar un guided tour y reducir la fricción de uso (menos pasos, menos densidad).

---

## 1. Resumen ejecutivo

**El problema no es que falte un tour. Es que el primer valor puede llegar vacío, Perfil abruma y hay callejones sin salida.** Un tour clásico (10 globos señalando botones) taparía esos problemas sin resolverlos: la mayoría de usuarios lo saltan y no lo recuerdan.

**Veredicto sobre el guided tour: SÍ, pero uno contextual y ligero — no un tour lineal pesado.** Cinco coachmarks de orientación tras el onboarding, más pistas contextuales en cada pantalla (empty states que enseñan). Eso ya está prototipado en esta sesión y se puede evaluar hoy.

**La palanca de mayor impacto es la activación, no el tour:** garantizar que después del onboarding el usuario SIEMPRE tenga un día listo para ejecutar, que el botón principal de Home prepare el plan al instante (sin mandarlo a Perfil), y que Perfil deje de ser una sola pantalla de 5.400 px. Esos cambios reducen pasos y eliminan la sensación de "completé datos pero no recibí nada".

En esta sesión ya dejé implementados los quick wins de bajo riesgo y un prototipo funcional del tour (sección 5). Todas las validaciones del repo siguen pasando.

---

## 2. Diagnóstico: por qué se siente complicada

Evidencia combinada de la auditoría visual y de la lectura del código.

### 2.1 El primer valor puede quedar vacío (crítico)

La auditoría capturó Home mostrando *"Aún falta preparar este día"* y Nutrición con comidas *"Sin asignar"*. Existe `prepareFirstCycleDay()` (REQ-34) que arma un día determinista tras el onboarding, pero el flujo tenía un hueco: si el coach (IA) no estaba disponible, el botón de Home mandaba al usuario a **Perfil** con un toast, en vez de preparar el día. Resultado percibido: "terminé el onboarding y no pasó nada".

> Código: `homeAgendaData()` devuelve `state:"setup"` cuando `!hasPreparedMeals`; `homePrepareDay()` caía a `setView("perfil")` sin IA. Ya existe `deterministicDayPayload()` que puede llenar el día sin IA.

### 2.2 Perfil es una sola pantalla gigante

Perfil mide **~5.436 px de alto en mobile** y mezcla macros, alimentación, entrenamiento, suscripción, privacidad, recordatorios, push y cuenta. El usuario no sabe qué importa ahora y teme perder cambios al guardar todo al final. Ya existe el helper `section()` con `toggleSection()` (colapsables), pero las secciones avanzadas no vienen colapsadas por defecto ni hay navegación local.

### 2.3 Controles táctiles pequeños y poco accesibles

Targets por debajo de 44 px: **30 en Perfil, 26 en Progreso, 19 en Nutrición**. En Progreso, además, **20 inputs sin etiqueta programática** (la tabla de peso comunica "kg/%" solo visualmente).

### 2.4 Demasiados pasos hasta ejecutar algo

Camino actual hasta registrar la primera comida:

```
Auth → Onboarding (4 pasos) → Home
   └─ si el día está vacío → "Preparar mi día" → (IA genera | o Perfil) → Nutrición → Registrar
```

Cada bifurcación a Perfil es un desvío que rompe el momentum. El alert "Afina tu plan" en Home refuerza la idea de que falta trabajo antes de poder usar la app.

### 2.5 Lo que SÍ está bien (no tocar)

El onboarding de 4 pasos es limpio y tiene barra de progreso; la base visual es consistente y sin desbordes horizontales; el modelo de "agenda del día" (mostrar solo la próxima acción) es la decisión correcta. La estrategia mobile-first es coherente.

---

## 3. Decisión sobre el guided tour

### 3.1 Cuándo un tour ayuda y cuándo estorba

| Enfoque | Efecto real | Veredicto |
|---|---|---|
| Tour lineal de muchos pasos señalando botones | Se salta, no se recuerda, retrasa el primer valor | ❌ Evitar como solución principal |
| Coachmarks contextuales cortos (4-6) de orientación | Ubican al usuario sin bloquear; bajo costo | ✅ Recomendado |
| Empty states que enseñan ("aún no hay X, esto hace Y, toca aquí") | Guían justo cuando hace falta | ✅ Recomendado (mayor ROI) |
| Tooltips "just-in-time" la primera vez que se usa una función | Enseñan en contexto real | ✅ Fase 2 |

Principio: **la mejor guía es una interfaz que casi no necesita guía.** Primero se reduce la fricción; el tour es la capa de orientación, no el parche.

### 3.2 Recomendación concreta

1. **Tour contextual ligero (prototipado):** 5 coachmarks que se disparan UNA vez tras el onboarding — agenda del día + las 4 pestañas. Saltable, recordado, repetible desde el botón "?" en Home, respeta `prefers-reduced-motion`.
2. **Empty states que enseñan:** cada pantalla sin datos explica qué es y ofrece la acción que la llena (no un texto muerto).
3. **Tooltips just-in-time (fase 2):** la primera vez que el usuario entra a Entreno o al reproductor, una pista breve; no antes.

No recomiendo librerías externas (Shepherd, intro.js): suman peso y dependencias a una app que hoy es estática y sin build step. El prototipo es ~120 líneas vanilla, sin dependencias.

---

## 4. Simplificación de usabilidad — plan priorizado

Prioridad: **P0** = bloquea activación · **P1** = fricción alta · **P2** = pulido. Esfuerzo aproximado en jornadas de desarrollo.

| # | Cambio | Prioridad | Impacto | Esfuerzo | Estado |
|---|---|---|---|---|---|
| 1 | Día siempre listo tras onboarding (fallback determinista garantizado) | P0 | Alto | 0.5 d | ✅ Hecho (gap cerrado) |
| 2 | CTA de Home prepara el día al instante, nunca desvía a Perfil | P0 | Alto | 0.5 d | ✅ Hecho |
| 3 | Tour contextual ligero + botón de repetir | P1 | Medio | 1 d | ✅ Prototipo |
| 4 | Touch targets ≥44 px en pantallas táctiles | P1 | Medio | 0.5 d | ✅ Hecho (global) |
| 5 | aria-labels en inputs de Progreso | P1 | Medio | 0.25 d | ✅ Hecho |
| 6 | Perfil en secciones con navegación local + guardado por sección | P1 | Alto | 2-3 d | ⏳ Pendiente |
| 7 | Avanzado colapsado por defecto en Perfil y onboarding esencial | P1 | Alto | 1 d | ⏳ Pendiente |
| 8 | Progreso: tabla de peso → tarjetas full-width en mobile | P1 | Medio | 1 d | ⏳ Pendiente |
| 9 | Empty states que enseñan en Nutrición/Entreno/Progreso | P1 | Medio | 1 d | ⏳ Pendiente |
| 10 | Landing: breakpoint desktop + mockup más arriba en mobile | P2 | Medio | 1-2 d | ⏳ Pendiente |
| 11 | Fix contrato `api/checkout.js` (auth antes de Stripe) | P1 | Bajo* | 0.25 d | ⏳ Pendiente |

\* Bajo impacto en UX pero es un bug de contrato detectado en el smoke test (devuelve 503 en vez de 401/403).

### 4.1 Detalle de los pendientes clave

**#6 — Perfil en secciones (la más importante de las pendientes).**
Dividir Perfil en: *Objetivo · Comidas · Entrenamiento · Privacidad · Cuenta*, con una barra de navegación local (chips o tabs internos) y guardado por sección o un botón sticky "Guardar cambios" que solo aparece cuando hay modificaciones. Aprovechar `section()`/`toggleSection()` que ya existen.
Archivo: `renderProfile()` en `index.html`.

**#7 — Esconder lo avanzado por defecto.**
Ya existe el flag `onboardingEssentialOnly` y `needsProfileTuning()`. Llevar al onboarding a pedir solo lo esencial y dejar cocina/preparaciones/equipo detallado/lesiones/recordatorios como "ajustes avanzados" colapsados. El mensaje "Afina tu plan" debe ser mejora opcional, nunca prerrequisito percibido.

**#8 — Progreso en tarjetas.**
Convertir `weightRows()` (tabla) en filas tipo tarjeta con inputs full-width o steppers en mobile. Ya quedaron los aria-labels listos para esa migración.
Archivo: `weightRows()` / `renderProgress()`.

**#9 — Empty states que enseñan.**
Donde hoy dice "Sin asignar" o "Aún falta…", mostrar: qué es la sección + 1 acción que la llena. Reusar el patrón de la tarjeta `agenda-state setup` que ya quedó con CTA directo.

---

## 5. Lo que ya quedó implementado en esta sesión

Todo en `index.html` (139 inserciones, 4 borrados). `node scripts/audit-html.mjs`, `validate-contracts`, `validate-training-plan` y `validate-privacy` pasan. Control de flujo del tour cubierto con 9 pruebas (jsdom): 9/9 OK.

1. **Día siempre preparable sin IA** — `homePrepareDay()` ahora arma un día determinista al instante con `deterministicDayPayload()` y re-renderiza, en vez de desviar a Perfil. El CTA del estado vacío siempre dice "Preparar mi día".
2. **Touch targets 44 px** — bloque CSS `@media(pointer:coarse)` para `.btn-sm`, `.chip-check`, cabeceras colapsables e inputs de tabla.
3. **Accesibilidad en Progreso** — `aria-label` por semana en los inputs de peso y % de grasa.
4. **Guided tour contextual (prototipo)** — módulo vanilla autocontenido (~120 líneas) al final del script:
   - 5 coachmarks: agenda del día + pestañas Nutrición, Entreno, Progreso, Perfil.
   - Se dispara una sola vez tras el onboarding (`maybeStartFitbrosTour()` en `renderHoy`); guarda estado en `localStorage` (`fitbros_tour_v1`).
   - Saltable (botón Saltar / Esc), navegable (Siguiente/Atrás, flechas), repetible desde el botón **"?"** del header de Home (`startFitbrosTour(true)`).
   - Respeta `prefers-reduced-motion`; spotlight + tooltip posicionados con `getBoundingClientRect`; emite eventos `tour_start` / `tour_finish` para analítica.
   - Selectores estables vía `data-tab` añadido en `renderTabs()`.

### Cómo probarlo

Servir la carpeta y abrir como usuario nuevo:

```bash
cd Fitbud && python3 -m http.server 4173   # o: npx serve
# abrir http://127.0.0.1:4173/
```

- Tras completar el onboarding, el tour aparece solo.
- Para repetirlo: botón **"?"** arriba a la derecha en Home.
- Para reiniciar el "primera vez": en consola `localStorage.removeItem('fitbros_tour_v1')`.

Estos cambios están **sin commitear** (solo `index.html`), listos para que los revises antes de integrar.

---

## 6. Roadmap sugerido

**Semana 1 — Activación (cierra la fuga principal).**
Validar e integrar lo de la sección 5. Sumar #9 (empty states que enseñan) y #11 (fix de `checkout`). Objetivo: nadie termina el onboarding sin un día ejecutable.

**Semanas 2-3 — Densidad y accesibilidad.**
#6 Perfil en secciones + #7 avanzado colapsado + #8 Progreso en tarjetas. Objetivo: que Perfil deje de abrumar y se pueda guardar sin miedo.

**Backlog — Conversión.**
#10 landing con breakpoint desktop y prueba de producto más arriba. Tooltips just-in-time (fase 2 del tour).

---

## 7. Cómo medir si funcionó

Ya hay `trackEvent` y un embudo de activación en la vista de Analítica. Seguir:

- **Activación:** % de usuarios que registran su 1ª comida o inician su 1er entreno el mismo día del onboarding (antes/después).
- **Día vacío:** frecuencia del estado `setup` en Home (debería tender a cero).
- **Tour:** tasa de `tour_finish` con `reason:"done"` vs `"skipped"`; repeticiones manuales.
- **Perfil:** tiempo en Perfil y tasa de guardado por sección tras el rediseño.

Regla de producto: si el tour completo se salta >60%, acortarlo, no alargarlo — y reforzar empty states.

---

## 8. Riesgos y decisiones abiertas

- **Cron de Vercel (Hobby):** el deploy forzado falla por cron horario; decidir Pro, diario o scheduler externo. No degradar sin decisión de producto (afecta recordatorios y retención).
- **Calidad del día determinista:** el fallback usa ingredientes genéricos compatibles; sirve para no dejar el día vacío, pero conviene revisar el copy para que no se sienta "de relleno".
- **Guardado por sección en Perfil:** cambia el modelo de guardado actual (todo al final); requiere cuidado con `saveProfilePrefs` y los esquemas versionados.
- **Persistencia del tour:** hoy vive en `localStorage` (por dispositivo). Si se quiere "visto" por cuenta, mover el flag a `profiles.prefs`.
