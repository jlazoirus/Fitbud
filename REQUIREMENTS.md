# Plan de requerimientos de producto - Fitbros

Este es el backlog operativo compacto para agentes autonomos. El detalle historico vive en `docs/requirements-history.md` y no debe leerse en cada corrida salvo que el REQ activo lo necesite.

Regla base:

**Un requerimiento = una implementacion aislada = un commit propio = un push propio.**

No mezclar requerimientos en un mismo commit. Si durante un requerimiento aparece otro problema, anotarlo como candidato y dejarlo para otro commit salvo que bloquee directamente el alcance actual.

## Como leer este backlog

Lectura obligatoria por corrida:

1. `AGENTS.md` y el runbook del loop que corresponda.
2. `CONTEXT.md` compacto.
3. Este `REQUIREMENTS.md` completo.
4. El codigo real relacionado con el REQ seleccionado.

Lectura bajo demanda:

- `docs/requirements-history.md`: detalle de REQ implementados, decisiones antiguas, evidencia historica y criterios originales.
- `docs/architecture-reference.md`: mapa extendido de archivos, variables, migraciones y contexto operativo historico.

La verdad final sigue siendo el codigo en `HEAD`. Si un documento contradice el codigo, confirmar contra el codigo y actualizar la documentacion en el mismo commit del REQ.

## Vision compacta

Fitbros debe ser un coach personal que siempre ofrece una opcion viable para comer y entrenar hoy, explica como ejecutarla, adapta el plan a la vida real del usuario y protege sus datos personales. La experiencia visible habla de coach, plan, opciones y progreso; no de tecnologia interna.

## Principios que mandan

1. Flexibilidad con estructura: cambiar comidas, ejercicios, dias o lugar no debe romper metas ni progresion.
2. Explicacion antes que prescripcion: cada recomendacion importante debe ser ejecutable y segura.
3. El coach propone; el sistema valida: macros, restricciones, progresion, permisos y costos se validan con reglas deterministas.
4. Confirmacion antes de modificar: no cambiar planes activos ni datos del usuario sin mostrar impacto.
5. Historial inmutable: ajustar el futuro no reescribe lo ya ejecutado.
6. Motivacion sostenible: descansos planificados y dias incompletos no deben sentirse como castigo.
7. Privacidad por defecto: fotos, salud, progreso, conversaciones y preferencias son privadas por usuario.
8. Costo controlado: toda llamada externa debe tener limites, trazabilidad, validacion y fallback cuando sea posible.
9. Tecnologia invisible: usuarios normales no ven IA, Claude, modelos, prompts, tokens ni cuotas internas.

## Estado operativo actual

- App PWA vanilla sin build step; `index.html` sigue siendo el shell principal con modulos puros en `js/`.
- Supabase es fuente de verdad; `localStorage` es cache/offline. Datos personales van por usuario con RLS.
- Login obligatorio, landing publica, paywall/checkout, cupones, historial de pagos, notificaciones, sync offline y roles admin ya existen.
- Entrenamiento tiene catalogo, reproductor recuperable, planes personalizados 4/10 semanas, splits progresivos y adaptaciones.
- Nutricion tiene catalogo con recetas, restricciones, dominio puro y metadata semantica de REQ-79. El foco pendiente es sacar la aritmetica nutricional del coach textual y pasarla a solver/planner determinista: serie "dieta exacta" REQ-128..REQ-136 (diagnostico en `docs/nutrition-generation-architecture-diagnostic-2026-07-04.md`).
- Migraciones SQL nunca se ejecutan automaticamente en produccion; documentar acciones manuales.
- Al tocar `index.html` o shell PWA, revisar si corresponde subir `CACHE_NAME` en `service-worker.js`.

## Secuencia activa

Automatizable por el agente desarrollador:

REQ-81..84 (planner determinista, versionado en `plan_versions`, reemplazos con rebalanceo, coach auxiliar validado) ya implementados — detalle en `docs/requirements-history.md`.

Serie UX (auditoría 1 jul 2026, `estrategia/08-Analisis-UI-Exhaustivo-2026-07-01.md`, REQ-97..112) y serie "dieta exacta" (4 jul 2026, REQ-128..139 + REQ-140/141/144; diagnóstico en `docs/nutrition-generation-architecture-diagnostic-2026-07-04.md`, decisiones: tolerancias estrictas sujetas a canario, Sonnet 5 solo tras gate de telemetría, ampliación de catálogo, aviso suave no bloqueante) ya están implementadas — su detalle vive en el ledger de abajo y en `docs/requirements-history.md`. Pendientes de esa secuencia:

- REQ-142 - Conectar reemplazos ("Cambiar comida") a `finalizeNutritionDay()`. (P2; extraído de REQ-138)

Pausado esperando decisión de producto (ver REQ-147; no está en `agent-loop.json` hasta entonces):

- REQ-143 - Catálogo lote 3: crecimiento drástico dirigido por el canario del contrato. Dos lotes medidos con el diff de REQ-144 (2026-07-05 y 2026-07-08) confirman un techo cercano a 32%-33% bajo la selección actual; ver actualización 2026-07-08 en el REQ y REQ-147.

Pendiente no automatizable por agentes:

- REQ-49 - Revision legal pre-lanzamiento.
- REQ-60 - Configuracion manual de redirects en Supabase.
- REQ-127 - Personalizar remitente/asunto de correos de Supabase (branding Fitbud).
- REQ-70 - Validacion de negocio y beta con usuarios reales.
- REQ-147 - Decidir si vale la pena tocar la selección de `planDeterministicNutritionDay()`/`globalClosePass()` para superar el techo de catálogo (~32-33%) del canario `DIET_CONTRACT`; ver REQ-143.
- Decision de producto (previa a activar Stripe/REQ-26): frontera free/premium — que queda gratis (dia determinista de hoy + registrar) y que es premium (adaptar, semana completa, check-in con ajustes, conversacion). Analisis en `estrategia/08-Analisis-UI-Exhaustivo-2026-07-01.md` §3 (P0-1).

## Protocolo antes de implementar

1. Ejecutar el selector del loop y respetar su decision.
2. Confirmar rama `main`, worktree limpio y `HEAD == origin/main`.
3. Leer el commit anterior con `git show --stat --format=fuller HEAD` y `git show --name-status --format=fuller HEAD`.
4. Leer el REQ activo completo en este archivo y abrir el historial solo si el REQ lo referencia o hay duda de duplicado.
5. Revisar codigo, SQL y pruebas relacionados; no asumir que el texto refleja el estado real.
6. Implementar solo el REQ tomado, verificar, actualizar estado/docs, hacer un commit y push propio.

Formato recomendado del commit:

```text
REQ-XX: resumen imperativo corto

Contexto:
- Commit previo leido: <hash> <subject>
- Archivos revisados: <lista corta>

Hecho:
- <cambio principal 1>
- <cambio principal 2>

Verificacion:
- <comando o prueba ejecutada>
- <resultado importante>
```

## Formato para nuevos REQ

Los auditores agregan nuevos requerimientos al final, con estado `**Estado: pendiente.**` y estas secciones: Origen, Problema, Causa raiz, Objetivo, Alcance, Fuera de alcance, Riesgos, Criterios de aceptacion y Verificacion sugerida.

## Ledger historico compacto

Los REQ implementados se conservan aqui como indice compatible con los selectores. Para leer alcance, criterios y evidencia antiguos, buscar el mismo encabezado en `docs/requirements-history.md`.

## REQ-01 - Normalizar recetas y cumplimiento de macros

**Estado: implementado como base de catalogo y validacion.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-01`).

## REQ-02 - Usar recetas como fuente visible de cada comida

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-02`).

## REQ-03 - Dia inicial, historial de peso y grasa corporal

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-03`).

## REQ-04 - Bloques colapsables para movil

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-04`).

## REQ-05 - Login simple y modo publico solo lectura para DB e IA

**Estado: implementado, pero con una decision posterior que invalida parte del alcance original: el login es OBLIGATORIO. Hoy no existe modo anonimo de solo lectura; la primera pantalla es el login. La experiencia de visitante/muestra y el funnel comercial se definen en REQ-25 y en el nuevo REQ-33 (landing publica). Los criterios de "usuario anonimo" de abajo quedan derogados y se conservan solo como historia.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-05`).

## REQ-06 - Persistencia separada por usuario

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-06`).

## REQ-07 - Vista admin para usuarios

**Estado: implementado y endurecido.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-07`).

## REQ-08 - Generador de dias de dieta con Claude

**Estado: implementado como generacion de dia/semana; su evolucion comercial esta en REQ-18.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-08`).

## REQ-09 - Onboarding de objetivos, macros y preferencias

**Estado: implementado como flujo base; se amplia en REQ-12.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-09`).

## REQ-10 - Cierre de ciclo, recap y siguiente desafío

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-10`).

## REQ-11 - Duración configurable del plan

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-11`).

## REQ-12 - Perfil flexible de alimentacion y entrenamiento

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-12`).

## REQ-13 - Modelo de planes versionados

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-13`).

## REQ-14 - Seguridad, consentimiento y privacidad

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-14`).

## REQ-15 - Biblioteca de ejercicios y demostraciones animadas

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-15`).

## REQ-16 - Reproductor de entrenamiento para principiantes

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-16`).

## REQ-17 - Generador IA de planes de entrenamiento

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-17`).

## REQ-18 - Generador IA de planes nutricionales flexibles

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-18`).

## REQ-19 - Reemplazos y modo contingencia

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-19`).

## REQ-20 - Check-in semanal y ajuste adaptativo

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-20`).

## REQ-21 - Centro conversacional del coach

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-21`).

## REQ-22 - Home como agenda diaria del coach

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-22`).

## REQ-23 - Rachas, consistencia e hitos

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-23`).

## REQ-24 - Recordatorios de inactividad por correo

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-24`).

## REQ-25 - Oferta, entitlement y paywall

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-25`).

## REQ-26 - Checkout y ciclo de facturacion

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-26`).

## REQ-27 - Analitica de producto, IA y costos

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-27`).

## REQ-28 - Sincronizacion offline y resolucion de conflictos

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-28`).

## REQ-29 - Modularizacion incremental y contratos de dominio

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-29`).

## REQ-30 - Pruebas end-to-end, accesibilidad y release gates

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-30`).

## REQ-31 - Tecnologia invisible (lenguaje de producto)

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-31`).

## REQ-32 - Cuotas diarias y reutilizacion de opciones

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-32`).

## REQ-33 - Landing publica y funnel de adquisicion

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-33`).

## REQ-34 - Primer plan al terminar el onboarding (primer valor inmediato)

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-34`).

## REQ-35 - Onboarding minimo viable con divulgacion progresiva

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-35`).

## REQ-36 - Unificar acciones de comida (cambiar/adaptar)

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-36`).

## REQ-37 - Accesibilidad de modales y confirmacion de acciones destructivas

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-37`).

## REQ-38 - Notificaciones push y recordatorios de racha

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-38`).

## REQ-39 - Editor administrativo de dietas y asignaciones

**Estado: implementado (2026-06-18).**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-39`).

## REQ-40 - Home Hoy: agenda determinista del dia (sin IA)

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-40`).

## REQ-41 - Coach ejecutor con guardrales de confianza

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-41`).

## REQ-42 - Home agentico: conversacion como entry point

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-42`).

## REQ-43 - Gráfico de peso personalizado por usuario

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-43`).

## REQ-44 - Adherencia nutricional y contexto de peso en Progreso

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-44`).

## REQ-45 - Selector de disciplina en dos pasos: cardio opcional, aviso cardiovascular y cardio ligero genérico

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-45`).

## REQ-46 - Simplificar configuracion de nutricion (ocultar ventana y repeticion en flujo estandar)

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-46`).

## REQ-47 - Indicadores de carga (spinners) en generacion de plan, coach y nutricion diaria

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-47`).

## REQ-48 - Panel de historial de pagos para el usuario

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-48`).

## REQ-49 - Checklist de revision legal antes del lanzamiento comercial

**Estado: pendiente. Requiere accion humana; no implementable por el agente autonomo.**

Checklist de revision legal antes del lanzamiento comercial. Requiere revision humana de terminos, privacidad, salud/entrenamiento, pagos y comunicaciones; no agregar a `agent-loop.json`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-49`).

## REQ-50 - Cupones de acceso gratuito (duración configurable) sin Stripe

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-50`).

## REQ-51 - Activacion: primer dia siempre ejecutable y CTA de Home directo

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-51`).

## REQ-52 - Accesibilidad tactil: touch targets de 44px y labels en Progreso

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-52`).

## REQ-53 - Guided tour contextual ligero (prototipo)

**Estado: implementado (prototipo, sin dependencias externas).**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-53`).

## REQ-54 - Perfil en secciones con navegacion local y guardado por seccion

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-54`).

## REQ-55 - Onboarding esencial y opciones avanzadas colapsadas por defecto

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-55`).

## REQ-56 - Progreso: tabla de peso a tarjetas full-width en movil

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-56`).

## REQ-57 - Empty states que ensenan en Nutricion, Entreno y Progreso

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-57`).

## REQ-58 - Landing: breakpoint desktop propio y product proof en el primer viewport

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-58`).

## REQ-59 - Fix de contrato: validar autenticacion antes de la config de Stripe en checkout

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-59`).

## REQ-60 - Corregir Site URL / Redirect URLs de Supabase (recuperar contrasena apunta a localhost)

**Estado: pendiente. Requiere accion manual en el dashboard de Supabase; no implementable por el agente autonomo.**

Corregir Site URL / Redirect URLs en el dashboard de Supabase para que recuperacion de contrasena no apunte a localhost. Accion manual externa; no agregar a `agent-loop.json`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-60`).

## REQ-61 - Fix: "Preparar mi día" rechaza respuestas válidas cuando el perfil tiene restricciones de dieta

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-61`).

## REQ-62 - Fix infra: consolidar billing-history y coupon dentro de entitlement para cumplir límite de Vercel Hobby

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-62`).

## REQ-63 - Aprendizaje silencioso de patrones de alimentación del usuario

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-63`).

## REQ-64 - Fix: "Preparar mi semana" genera días con déficit calórico porque la IA no escalaba porciones a la meta

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-64`).

## REQ-65 - Fix: los patrones vegano/vegetariano no excluían productos de origen animal

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-65`).

## REQ-66 - Soporte real de dietas omnívoras: catálogo con carne/pescado + matcher por palabra

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-66`).

## REQ-67 - Splits progresivos de entrenamiento (Full Body → Upper/Lower → Push/Pull/Legs)

**Estado: implementado. Accion manual externa: aplicar bloque adicional de `supabase/exercises.sql` en Supabase si produccion no lo tiene.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-67`).

## REQ-68 - Fix: "Preparar mi plan de entrenamiento" rechazaba el plan con "La semana 2 está fuera de orden."

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-68`).

## REQ-69 - Fix: editar macros en el perfil no actualizaba el objetivo del día en Nutrición

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-69`).

## REQ-70 - Validación de negocio y beta controlada

**Estado: pendiente. Requiere entrevistas, usuarios reales y decisión de producto; no implementable por el agente autónomo.**

Validacion de negocio y beta controlada. Requiere entrevistas, usuarios reales y decision GO/ITERAR/PIVOT; el agente solo puede implementar sub-REQ tecnicos derivados.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-70`).

## REQ-71 - Sincronizar documentación operativa con el estado real del código

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-71`).

## REQ-72 - Modularización incremental de index.html sin cambio funcional

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-72`).

## REQ-73 - Resolución explícita de conflictos de sincronización offline

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-73`).

## REQ-74 - Aviso de privacidad y términos accesibles antes del registro

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-74`).

## REQ-75 - Fix: prompt de generateOneDay no alcanzaba metas altas de proteína

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-75`).

## REQ-76 - Catálogo: shakes de proteína como opción de alta proteína por porción

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-76`).

## REQ-77 - Fix: las metas calculadas en onboarding incumplen "kcal = suma de macros" para usuarios de alto peso en déficit

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-77`).

## REQ-78 - Dominio nutricional puro y contratos estrictos

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-78`).

## REQ-79 - Catálogo nutricional semántico, claves estables y cobertura de 2-6 comidas

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-79`).

## Requerimientos activos completos

Los siguientes REQ conservan detalle completo porque son trabajo operativo reciente o pendiente para agentes.

## REQ-80 - Solver determinista de porciones para preparar un día nutricional

**Estado: implementado.** Agrega `planDeterministicNutritionDay()`, `solveDishPortion()` y filtros por slot/restricciones usando ingredientes reales como fallback principal cuando el coach no está disponible.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-80`).

## REQ-81 - Planner semanal nutricional determinista y lista de compras derivada

**Estado: implementado.** Agrega `planNutritionWeek(ctx)`, variedad semanal y lista de compras agregada desde el plan nutricional determinista.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-81`).

## REQ-82 - Plan nutricional activo versionado en `plan_versions`

**Estado: implementado.** Versiona nutrición activa en `plan_versions.snapshot.nutritionPlan`; Home lee prescripción desde snapshot y `day_log` queda como compatibilidad/override.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-82`).

## REQ-83 - Reemplazos equivalentes con rebalanceo de comidas futuras

**Estado: implementado.** Agrega ranking de reemplazos equivalentes y rebalanceo de comidas futuras no registradas, con reversión segura.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-83`).

## REQ-84 - Coach nutricional como generador auxiliar validado, no autoridad de macros

**Estado: implementado.** Recalcula macros de comidas propuestas desde el catálogo real con `recalcCoachMealMacros()`; los macros declarados por el coach dejan de ser autoridad.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-84`).

## REQ-85 - Fix: fallbacks y IA generaban platos ficticios ("Desayuno práctica", "Alimento compatible")

**Estado: implementado.** `validateGeneratedDay` rechaza nombres placeholder con regex `placeholderRe`; `regenerateGenMeal` usa el plato real más cercano del catálogo como fallback; ambos prompts prohíben nombres genéricos. 5 asserts en `scripts/validate-placeholder-meals.mjs`.

### Problema

Con metas altas de proteína (post REQ-75), el usuario recibió un día donde los macros totales cuadraban perfectamente, pero el desayuno se llamaba "Desayuno práctica" y su único ingrediente era "Alimento compatible" — un placeholder ficticio, no una comida real.

### Causa raíz (verificada contra código)

**No es un efecto del prompt reforzado de REQ-75.** Es un bug preexistente del sistema de fallbacks del coach:

1. **`regenerateGenMeal` (línea ~7383)** construía un `fallbackText` literal con nombre `"${slot.slot} práctica"` e ingrediente `"Alimento compatible"` — valores inventados para rellenar macros matemáticamente.
2. Cuando el sistema de quota devuelve `mode: "reuse"` (reutilización), `select_reusable_coach_part` busca en el pool de resultados previos. Si no encuentra uno compatible, **sirve el `fallbackText` como respuesta real** (coach_quota.sql línea 591).
3. `validateGeneratedDay` no detectaba nombres ficticios: solo validaba macros, gramos y restricciones de dieta. El fallback pasaba todas las validaciones porque sus macros eran exactos.
4. `deterministicSuggestionPayload` también usaba nombres genéricos ("Bowl práctico compatible", "Plato rápido compatible", "Opción simple para completar el día").

### Solución

Tres capas de defensa:

**1. Validación (detectar):** `validateGeneratedDay` ahora rechaza nombres de plato e ingrediente que coincidan con un regex de términos placeholder (`práctica`, `genérico`, `compatible`, `relleno`, `placeholder`, `ficticio`, `completar el día`). Emite issue bloqueante, no warning.

**2. Fallbacks (prevenir):** 
- `regenerateGenMeal`: el fallback ahora selecciona el plato real del catálogo más cercano en macros al slot (por distancia kcal + proteína ponderada), con sus ingredientes reales de `DB.dishIng`.
- `deterministicSuggestionPayload`: los nombres genéricos se reemplazaron por nombres descriptivos realistas ("Bowl de quinua con tofu", "Avena proteica con frutos", "Ensalada de garbanzos y queso").

**3. Prompt (instruir):** Ambos prompts (`generateOneDay` y `regenerateGenMeal`) ahora incluyen una línea PROHIBIDO que veta explícitamente nombres genéricos/ficticios y exige nombres descriptivos reales con ingredientes reales.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | Regex `placeholderRe` en `validateGeneratedDay`, fallback real en `regenerateGenMeal`, nombres realistas en `deterministicSuggestionPayload`, línea PROHIBIDO en ambos prompts |
| `scripts/validate-placeholder-meals.mjs` | Validador estructural nuevo (5 asserts) |
| `scripts/release-gate.mjs` | Agrega `validate-placeholder-meals.mjs` al gate |

### Criterios de aceptación

- `validateGeneratedDay` rechaza un plato llamado "Desayuno práctica" con ingrediente "Alimento compatible".
- El fallback de `regenerateGenMeal` usa un plato real del catálogo (`fbDish`).
- `deterministicSuggestionPayload` no contiene "compatible" ni "completar el día".
- Los prompts de `generateOneDay` y `regenerateGenMeal` incluyen "PROHIBIDO inventar nombres genéricos".
- `node scripts/validate-placeholder-meals.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

## REQ-86 - Fix: caché de coach reutilizaba resultados generados con prompts obsoletos

**Estado: implementado.** `COACH_PROMPT_VERSION` (constante en `index.html`) se incluye en `coachCompatibilityContext`, que alimenta el `contextKey` del sistema de quota. Bumpar la constante invalida todos los resultados reutilizables generados con versiones anteriores del prompt. 3 asserts en `scripts/validate-coach-prompt-version.mjs`.

### Problema

Después de REQ-75 (prompt reforzado para proteína alta) y REQ-85 (prohibir platos ficticios), el usuario seguía recibiendo días con kcal muy por debajo de la meta (1798 vs 2300, -22%). Las comidas tenían nombres reales (fix de REQ-85 funcionó), pero los macros no cumplían.

### Causa raíz (verificada contra código)

El `contextKey` del sistema de quota se genera en `coachCompatibilityContext` (línea ~6522) y se usa en `select_reusable_coach_part` (coach_quota.sql) para decidir si reutilizar un resultado previo del pool en vez de hacer una llamada fresca a la IA.

El campo `version` dentro del contexto era un **literal hardcodeado `1`** que nunca cambiaba. Esto significa que:

1. Un resultado generado con el prompt viejo (pre-REQ-75, sin instrucciones de alta proteína ni prohibición de ficticios) quedaba en `coach_option_pool` con un `contextKey` que incluía `version:1`.
2. Al pedir "Preparar mi día" después de REQ-75/85, el `contextKey` seguía siendo idéntico (mismo `version:1`, mismos targets, mismas prefs) → `select_reusable_coach_part` devolvía el resultado viejo.
3. El resultado viejo no tenía las mejoras del prompt nuevo, así que sus kcal/proteína podían estar fuera de rango.

El `contextKey` **sí** invalida correctamente cuando cambian: targets de macros, prefs del usuario, catálogo de platos (hash), restricciones. Pero **no** invalidaba cuando cambiaba la lógica del prompt — que es exactamente lo que pasó con REQ-75/85.

### Solución

Extraer `version` a una constante `COACH_PROMPT_VERSION` y bumparla a `2`. Cada cambio futuro de lógica de prompt debe bumpar esta constante para invalidar el pool de resultados cacheados.

```js
const COACH_PROMPT_VERSION=2;
// en coachCompatibilityContext:
version:COACH_PROMPT_VERSION,  // antes: version:1
```

Al cambiar de `1` a `2`, el hash del `contextKey` cambia → todos los resultados previos en `coach_option_pool` quedan con un `contextKey` distinto → `select_reusable_coach_part` no los encuentra → se fuerza una generación fresca con el prompt actual.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | Constante `COACH_PROMPT_VERSION=2`, usada en `coachCompatibilityContext` |
| `scripts/validate-coach-prompt-version.mjs` | Validador: constante existe, >= 2, no hay literal numérico en version |
| `scripts/release-gate.mjs` | Agrega validador al gate |

### Criterios de aceptación

- `COACH_PROMPT_VERSION` es una constante >= 2 en `index.html`.
- `coachCompatibilityContext` usa `version:COACH_PROMPT_VERSION`, no un literal.
- `node scripts/validate-coach-prompt-version.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

## REQ-87 - Fix: "Preparar mi semana" sobrescribía días pasados y con datos registrados

**Estado: implementado.**
`weekPendingDays()` filtra días pasados o con comidas consumidas antes de generar la semana.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-87`).

## REQ-88 - Fix: contextKey de generación diaria no incluía la fecha, causando reuso cruzado entre días

**Estado: implementado.**
El contextKey de generación diaria incluye la fecha; sin reuso cruzado entre días.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-88`).

## REQ-89 - Feature: sugerir snack del catálogo para cerrar déficit de kcal/proteína en día generado

**Estado: implementado.**
`window._genDayGapSnack` sugiere snack del catálogo para cerrar déficit de kcal/proteína en el borrador del día.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-89`).

## REQ-90 - Feature: editar gramos/porciones de ingredientes en comidas generadas antes de aplicar

**Estado: implementado.**
`updateGenMealGrams()` permite editar gramos de ingredientes en el borrador y re-validar antes de aplicar.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-90`).

## REQ-91 - Fix: snack sugerido (REQ-89) aparecía como ya consumido al aplicar el día

**Estado: implementado.**
El snack sugerido se aplica como no consumido (`done:false`).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-91`).

## REQ-92 - Fix: sesión de entrenamiento generada mostraba solo Calentamiento + Vuelta a la calma sin bloques de ejercicios

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-92`).

## REQ-94 - Fix: demostración de ejercicio aparecía como imagen estática con "Reducir Movimiento" activo

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-94`).

## REQ-93 - Fix: exerciseCatalog devolvía catálogo vacío cuando tabla exercises de Supabase está vacía

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-93`).

## REQ-95 - Nav bar del footer no ancla al fondo en iOS

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-95`).

## REQ-96 - Crear suite E2E Playwright de journeys críticos e integrarla al release-gate

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-96`).

## REQ-97 - UX: reordenar Home — la agenda primero, hero compacto, un banner a la vez

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-97`).

## REQ-98 - Fix UX: banner de check-in con fechas rotas, duplicado y sin tono de arranque

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-98`).

## REQ-99 - UX: Perfil por secciones reales con guardado por sección y labels accesibles

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-99`).

## REQ-100 - UX: Nutrición sin duplicación — un CTA contextual y hero compacto

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-100`).

## REQ-101 - UX: Entreno sin CTAs duplicados — tarjeta instructiva solo como empty state

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-101`).

## REQ-102 - UX: Progreso con estado cero guiado y tabla de peso en tarjetas mobile

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-102`).

## REQ-103 - UX: onboarding sin jerga — macros como resumen y lugar de entrenamiento único por defecto

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-103`).

## REQ-104 - Copy y paywall coherentes: sin "cancela cuando quieras", paywall degradado sin checkout activo

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-104`).

## REQ-105 - UX: Perfil en acordeón real (una sección a la vez)

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-105`).

## REQ-106 - Accesibilidad: aria-label en todos los inputs de Perfil

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-106`).

## REQ-107 - UX: reagrupar Suscripción, Recordatorios y Avisos del dispositivo bajo Cuenta

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-107`).

## REQ-108 - UX: guardado por sección en Perfil con aviso de cambios sin guardar

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-108`).

## REQ-109 - Fix Home: el badge "N pendientes" cuenta la fila de Descanso

**Estado: implementado.** Home calcula el badge de pendientes con `pendingCount=items.filter(i=>i.actions).length`, excluyendo la fila informativa de descanso sin ocultarla.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-109`).

## REQ-110 - Fix UX: catch de aiGenerateWeek sin salida — sumar opción práctica y reintento

**Estado: implementado.** `aiGenerateWeek` conserva días parciales ante fallo, permite completar faltantes con semana práctica determinista o reintentar y evita modales sin salida.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-110`).

## REQ-111 - Fix API: /api/checkout valida configuración de Stripe antes que la sesión (503 en vez de 401/403)

**Estado: implementado.** Entrada duplicada: la validación de `/api/checkout` ya quedó resuelta por REQ-59; se conserva como registro para no reabrirla.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-111`).

## REQ-112 - Accesibilidad: toasts anunciados a lectores de pantalla y contraste de texto muted

**Estado: implementado.** `#toast` anuncia con `role="status"`/`aria-live="polite"` y el texto secundario real migra a contraste AA sin rediseñar la paleta.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-112`).

## REQ-113 - UX Auth: mostrar/ocultar contraseña en todos los campos de password

**Estado: implementado.** passwordField() centraliza los campos de contraseña de usuario/admin con toggle accesible de mostrar/ocultar sin cambiar ids, autocomplete ni validaciones. Validadores: `scripts/validate-password-toggle.mjs` y E2E de navegación.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-113`).

## REQ-114 - UX Onboarding: copy sin jerga en objetivo, grasa, ciclo y patrón de comida

**Estado: implementado.** Onboarding y Perfil conservan valores internos, pero muestran copy cotidiano para objetivo, patrón de comida, grasa corporal opcional y ciclo de seguimiento. Validador: `scripts/validate-onboarding-copy.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-114`).

## REQ-115 - UX Onboarding: entrenamiento en dos decisiones claras sin duplicar lugar y fuerza

**Estado: implementado.** Onboarding y Perfil separan actividad física principal de lugar/recursos de fuerza; soportan caminar y no hacer fuerza, manteniendo compatibilidad con prefs antiguas. Validador: `scripts/validate-training-onboarding-decisions.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-115`).

## REQ-116 - Entrenamiento seguro: modo suave recomendado por edad o restricciones

**Estado: implementado.** Agrega `trainingSafetyMode` (`auto/gentle/full`) con recomendación por edad o restricciones, dosis suave y filtro de ejercicios complejos sin saltar red flags. Validador: `scripts/validate-training-safety-mode.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-116`).

## REQ-117 - Trial premium: primera semana con plan personalizado y cuotas limitadas

**Estado: implementado.** Agrega trial premium server-side de 7 días con políticas propias en `coach_quota_policies`, gates cliente/servidor y copy comercial sin términos técnicos. Validadores: `scripts/test-coach-quota.mjs`, `scripts/validate-coach-quota.mjs` y `scripts/validate-training-plan-wiring.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-117`).

## REQ-118 - Activación: generar automáticamente la primera semana al terminar onboarding

**Estado: implementado.** `saveOnboarding()` prepara automáticamente primera semana de nutrición y entrenamiento, guarda snapshot combinado en `plan_versions` y deja Home con plan o fallback/reintento. Validador: `scripts/validate-onboarding-first-week.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-118`).

## REQ-119 - Onboarding nutricional: capturar gustos y disgustos antes del primer plan

**Estado: implementado.** Onboarding agrega sección "Tus gustos (opcional)" con ingredientes favoritos, platos favoritos y disgustos (`ob_preferred_ingredients`, `ob_preferred_dishes`, `ob_disliked`), guardados en `prefs.preferredDishes` (nuevo) y campos existentes. Perfil expone `preferredDishes` como editable. El prompt de IA (día, semana, "otra opción") recibe `coachLikesLine` con gustos y línea de disgustos suaves; el fallback determinista aplica `preferenceScoreAdjustment` en `js/nutrition-domain.js` para priorizar platos con ingredientes/nombres afines y penalizar los que coinciden con disgustos, tanto en generación de día como en reemplazos (`rankReplacementCandidates`). Alergias/restricciones duras siguen bloqueando vía `hard_restrictions` sin mezclarse con gustos.

### Origen

Feedback de producto de Jonathan (3 jul 2026): la dieta debe generarse desde el primer momento en base a gustos, porque una dieta genérica da mala impresión.

### Problema

El onboarding esencial captura patrón de alimentación y alergias, pero no pregunta de forma directa por ingredientes favoritos, platos que le gustan ni comidas/ingredientes que no le gustan. El primer plan puede sentirse genérico aunque cumpla macros.

### Causa raíz

Las preferencias detalladas existen en Perfil (`preferredIngredients`, `preferredCuisines`, `dislikedIngredients`, notas), pero parte de esos campos quedó fuera del onboarding para simplificarlo.

### Objetivo

Capturar gustos mínimos de alto impacto antes de generar la primera semana, sin volver pesado el onboarding.

### Alcance

1. En onboarding, agregar campos breves: ingredientes favoritos, platos que le gustan, comidas o ingredientes que no le gustan.
2. Guardar esos valores en prefs existentes si alcanzan, o extender prefs de forma compatible si hace falta.
3. Usar esos gustos en la primera generación semanal automática (REQ-118), día, semana, reemplazos y "otra opción".
4. Mantener alergias/restricciones duras separadas de disgustos/preferencias.
5. Reflejar los mismos campos en Perfil como configuración editable.

### Fuera de alcance

- Crear catálogo nuevo de platos para cada gusto.
- Hacer scoring avanzado de preferencias aprendidas; esto puede apoyarse en `learnedPatterns` existente.

### Riesgos

- Demasiados campos en onboarding pueden bajar conversión. Deben ser compactos y opcionales salvo restricciones duras.

### Criterios de aceptación

- El usuario puede completar onboarding con gustos vacíos, pero si los llena se guardan y se usan en el primer plan.
- El prompt/contexto y fallback determinista reciben preferencias positivas y negativas.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Test con "me gusta pollo/arroz" y "no me gusta avena": confirmar que el primer plan prioriza compatibles y evita disgustos cuando hay alternativas.

## REQ-120 - Nutrición: "No me gusta este plato" bloquea futuras sugerencias hasta editar Perfil

**Estado: implementado.** `profile.prefs.blockedDishes` guarda `{key,name}` por plato (key = `dish.slug` o nombre normalizado, deduplicado, tope 200). `dishDietAllowed` (`js/nutrition-domain.js`) excluye platos bloqueados del planificador determinista de día/semana (`compatibleDishesForSlot`); `coachDishBlockedByProfile` (index.html) hace lo mismo para la lista de referencia de IA, `changeMealCandidatePool`, `regenerateGenMeal`, `findGapSnack` y la validación de acciones del coach (`cambiar_plato`). Los prompts de generación de día y "otra opción" agregan una línea explícita con los nombres bloqueados (`coachBlockedDishesLine`) como refuerzo para platos generados por IA que no matchean el catálogo. Acción "🚫 No me gusta este plato" disponible desde el menú "···" de la comida aplicada (`openMealMore`/`blockCurrentMealDish`) y desde cada comida del borrador de día generado (`blockGenDraftMeal`). Perfil > Comidas lista los platos bloqueados con botón "Volver a sugerir" (`unblockDishFromProfile`) cuando hay al menos uno. Días ya ejecutados no se modifican (el bloqueo solo afecta generación futura). Verificado con `scripts/validate-blocked-dishes.mjs` y la suite E2E de Perfil/Nutrición.

### Origen

Feedback de producto de Jonathan (3 jul 2026): agregar una opción para decir que un plato no gusta y que no vuelva a sugerirse, salvo que el usuario lo cambie en Perfil.

### Problema

El usuario puede cambiar una comida, pero no hay una acción explícita para enseñar al sistema que un plato específico no debe volver a aparecer. Esto provoca repetición de platos rechazados y erosiona la confianza.

### Causa raíz

Las preferencias negativas son principalmente texto libre (`dislikedIngredients`) y patrones aprendidos. No existe una lista estructurada de platos bloqueados por slug/nombre ni un flujo de desbloqueo.

### Objetivo

Permitir bloquear platos de forma persistente, aplicable a todos los flujos de generación y editable desde Perfil avanzado.

### Alcance

1. En cada comida sugerida/aplicada, agregar acción "No me gusta este plato" o equivalente.
2. Guardar el bloqueo como preferencia estructurada por `dishSlug` cuando exista y por nombre normalizado como fallback.
3. Excluir platos bloqueados en generación de día, semana, reemplazos, "otra opción" y regenerar día.
4. En Perfil avanzado, listar platos bloqueados y permitir quitarlos ("volver a sugerir").
5. Si bloquear un plato deja muy pocos candidatos, mostrar mensaje útil y usar fallback compatible sin romper macros.

### Fuera de alcance

- Bloquear ingredientes completos desde esta acción; ingredientes se manejan en preferencias.
- Analytics de platos rechazados agregada a nivel global.

### Riesgos

- Bloqueos excesivos pueden dejar sin candidatos en dietas restrictivas; el sistema debe degradar con feedback claro.

### Criterios de aceptación

- Un plato marcado como no gustado no aparece en nuevas generaciones para ese usuario.
- El usuario puede desbloquearlo desde Perfil y vuelve a ser elegible.
- Días ya ejecutados no cambian.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Generar día con un plato, marcarlo como no gustado, regenerar día/semana y confirmar que no reaparece.

## REQ-121 - Nutrición: cambios de preferencias regeneran solo futuro y se respetan de inmediato

**Estado: implementado.** `coachCompatibilityContext` incluye ahora `preferredIngredients`, `preferredDishes`, `preferredCuisines`, `dislikedIngredients` y las keys de `blockedDishes` en el objeto serializado que arma `contextKey` (`coachQuota`); editar cualquiera de esas preferencias cambia el hash y evita que se reutilice un resultado cacheado/pooled generado con preferencias viejas. `COACH_PROMPT_VERSION` subió a 6 para invalidar de una vez lo cacheado antes de este cambio (incluido lo generado tras REQ-119/REQ-120 sin este contexto). `applyDayComidas` ya nunca reescribe una comida con `ms.done=true` (devuelve cuántas se preservaron y el toast lo confirma: "Lo que ya registraste no cambia"), así que regenerar el día de hoy solo toca comidas pendientes. `homePrepareDay` y la opción "Volver a preparar este día" del menú de Nutrición rechazan fechas pasadas (`ds<todayStr()`), consistente con `weekPendingDays` que ya excluía días pasados/con comidas registradas en la generación de semana. Verificado con `scripts/validate-preference-cache-invalidation.mjs`.

### Origen

Feedback de producto de Jonathan (3 jul 2026): si las preferencias de comida se actualizan, al regenerar el día deben tomarse en cuenta y solo debe cambiar el futuro.

### Problema

Aunque parte de la generación usa prefs actuales, no hay garantía visible/contractual de que todo flujo de regeneración invalide contexto anterior y preserve días ya registrados.

### Causa raíz

La app combina `plan_versions`, `day_log`, overrides, cache de coach y generación determinista. Algunos context keys ya incluyen preferencias, pero el contrato debe ser explícito para preferencias nuevas como gustos, platos bloqueados y disgustos.

### Objetivo

Que editar preferencias alimente inmediatamente toda regeneración futura sin tocar lo ya ejecutado.

### Alcance

1. Incluir gustos, disgustos y platos bloqueados en context keys/cache de generación cuando aplique.
2. Al regenerar día/semana, excluir días pasados y días con comidas ya registradas.
3. Si una comida futura fue generada antes del cambio de preferencias, regenerarla debe usar prefs actuales.
4. Mostrar copy de confirmación cuando el cambio solo afecte propuestas futuras.

### Fuera de alcance

- Reescribir historial de `day_log` ya ejecutado.
- Migrar planes antiguos salvo cuando el usuario regenere futuro.

### Riesgos

- Invalidar demasiado puede elevar consumo de coach; usar límites de trial/premium y fallback determinista.

### Criterios de aceptación

- Cambiar "no me gusta avena" y regenerar mañana evita avena si hay alternativas.
- Comidas hechas hoy o en días pasados no se modifican.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Test con plan versionado activo + día futuro regenerado tras editar preferencias; confirmar que snapshot futuro cambia y día pasado no.

## REQ-122 - Fix Nutrición: dietas deben llegar a objetivos o completar con sugerencias aplicables

**Estado: implementado.** Cuando el día generado no cumple el objetivo (`!res.ok`), `genReviewHtml` ya no deja solo un botón "Aplicar" deshabilitado: agrega "Reintentar" y "Completar con opción práctica ahora" (`deterministicFromModal`, que aplica `applyDeterministicDay` vía el solver determinista). `aiGenerateDay` cuenta intentos fallidos consecutivos en `_genDayFailStreak` y, al llegar a 2, aplica automáticamente la ruta determinista en vez de seguir insistiendo con la IA; `homePrepareDay` reinicia ese conteo en cada sesión nueva de preparación. En la revisión de semana, `genWeekReviewHtml` agrega el botón "Completar días faltantes con opción práctica" junto al aviso de días que no se pudieron preparar, reutilizando `deterministicWeekFromModal` (ya existía para el camino de error de red) para rellenar solo los días ausentes sin tocar los ya generados. Las restricciones duras (`dishDietAllowed`, `coachDishBlockedByProfile`) siguen aplicando como bloqueo absoluto en toda ruta, incluida la determinista. Verificado con `scripts/validate-diet-completion-fallback.mjs`.

### Origen

Feedback de producto de Jonathan (3 jul 2026): las dietas no están generando correctamente, no llegan al objetivo y no dejan avanzar; si falla varias veces debe sugerir comidas extra/snacks para llegar a macros.

### Problema

Cuando una dieta generada queda fuera de tolerancia, el usuario puede quedar bloqueado o recibir una opción que no cumple el objetivo. La app ya tiene snack de cierre para déficit en algunos casos, pero no hay garantía robusta para día/semana ni recuperación tras fallos repetidos.

### Causa raíz

Los caminos de coach, solver determinista, edición de gramos, gap snack y validación de macros no están completamente unificados como contrato de "plan aplicable". La proteína y calorías pueden fallar por catálogo, porciones o respuesta del coach.

### Objetivo

Toda dieta aplicada debe ser viable: cumplir objetivos dentro de tolerancia o incluir una sugerencia concreta aplicable que complete el día sin bloquear al usuario.

### Alcance

1. Revisar `validateGeneratedDay`, `findGapSnack`, `genReviewHtml`, `generateOneDay`, `planDeterministicNutritionDay` y flujo semanal.
2. Si el plan no llega a kcal/proteína, sugerir snack/comida extra compatible y permitir agregarlo al borrador.
3. Si dos intentos consecutivos no cumplen objetivo, activar ruta de completado determinista con comida extra compatible.
4. Permitir aplicar con aviso solo si el usuario entiende qué falta y hay una acción para completarlo; no aplicar silenciosamente un día claramente insuficiente.
5. Mantener restricciones duras como bloqueo absoluto.

### Fuera de alcance

- Cambiar metas calculadas de macros.
- Crear platos nuevos en catálogo global sin revisión.

### Riesgos

- Forzar macros puede generar porciones poco realistas; el solver debe preferir opciones consumibles y explicar cuando necesita comida extra.

### Criterios de aceptación

- Metas altas de proteína reciben plan aplicable o snack/comida extra aplicable.
- La semana no queda bloqueada por un día con déficit recuperable.
- Restricciones duras siguen bloqueando platos incompatibles.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Tests con objetivos altos y catálogo limitado: el sistema completa kcal/proteína con snack o comida extra sin violar restricciones.

## REQ-123 - Fix Nutrición: todos los botones "Otra opción" soportan reintentos repetidos con feedback

**Estado: implementado.** Causa raíz encontrada: al agotarse el cupo diario de generaciones "frescas" para una acción, `reserve_coach_action` cambia a modo `reuse` y el servidor devolvía en silencio una respuesta pooled/template idéntica en cada reintento (mismo `contextKey`, mismo fallback determinista) — el usuario veía siempre la misma sugerencia y lo percibía como que el botón no hacía nada. `/api/claude` ahora marca `reused:true` en esa respuesta para todos los usuarios (antes solo iba en el diagnóstico de admin). `callClaude` expone la señal como `lastCoachCallReused` y `generateOneDay` la propaga en su resultado. `regenerateGenMeal`, `rerollChangeMealOptions` y `regenerateDayInWeekDraft` la usan para avisar con un toast claro ("Ya usaste tus opciones nuevas de hoy...") y para descartar la sugerencia repetida a favor del plato más cercano del catálogo aún no mostrado (`freshSelected` filtra por `seenSlugs`, `regenerateGenMeal` compara contra el nombre previo del slot). `regenerateDayInWeekDraft` y `genReviewHtml` (revisión de día) ahora siempre ofrecen "Reintentar" junto a "Volver al borrador"/"Completar con opción práctica", así ningún error deja el modal sin una acción hacia adelante. Verificado con `scripts/validate-retry-feedback.mjs` y `scripts/test-coach-quota.mjs`.

### Origen

Feedback de producto de Jonathan (3 jul 2026): el botón de otra opción no funciona después del primer intento y no da feedback; revisar todos los botones "otra opción".

### Problema

Los flujos de alternativa de comida parecen funcionar una vez y fallar o quedar sin estado claro en el segundo intento. El usuario no sabe si se agotó límite, si falló el coach, si quedó el borrador anterior o si debe cerrar el modal.

### Causa raíz

Hay múltiples caminos: `regenerateGenMeal`, `regenerateDayInWeekDraft`, reemplazos de comida aplicada, "Rehacer opciones" y flujos de `meal_option`/cuota. No comparten un patrón uniforme de estado, fallback, límite diario y restauración.

### Objetivo

Que cualquier acción "Otra opción"/"Rehacer opciones" pueda repetirse dentro de su límite, tenga fallback y comunique claramente éxito, carga, límite agotado o error.

### Alcance

1. Auditar todos los botones visibles con copy "Otra opción", "Rehacer opciones", "Preparar otro..." y equivalentes.
2. Unificar comportamiento: loading, consumo de límite, fallback determinista, volver al borrador y reintentar.
3. Corregir el bug de segundo intento.
4. Mostrar contador o mensaje claro cuando el límite de opciones del día/trial se agota.
5. Mantener "Más opciones" sin duplicar reemplazos por comida.

### Fuera de alcance

- Cambiar límites de trial/premium definidos en REQ-117 salvo integrarlos.
- Rediseñar el modal completo de revisión de semana.

### Riesgos

- Consumir cuota antes de validar puede penalizar fallos técnicos; la reserva/devolución debe seguir el patrón server-side existente.

### Criterios de aceptación

- Cada botón de alternativa funciona al menos dos veces seguidas o muestra límite agotado con feedback.
- Ningún error deja modal muerto sin volver al borrador/reintentar.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E o script con mocks: día generado -> otra opción dos veces; semana -> preparar otro día dos veces; comida aplicada -> rehacer opciones dos veces.

## REQ-124 - Home y Nutrición: anillo de macros primero y agenda/comidas debajo

**Estado: implementado.** `renderHoy` renderiza `heroDash` (anillo/resumen de macros) antes que `homeAgendaHtml` (agenda), reemplazando el orden de REQ-97. `renderNutrition` mueve "Más opciones" al final, después de comidas del día y comidas extra. El tour guiado agrega un primer paso apuntando a `.mini-macro-dash` antes del paso de `.agenda-card`. Los comportamientos de "entrenamiento pendiente aunque las comidas estén completas" (`workoutPending` no depende de `pendingMeals`) y "día cerrado con racha" (`homeAgendaData` estado `done`) ya existían correctamente en `homeAgendaData`/`homeAgendaHtml` y no requirieron cambios. Verificado con `scripts/validate-home-macro-ring-first.mjs`.

Nota aparte (resuelta): `tests/e2e/entreno.spec.js` y `tests/e2e/navegacion.spec.js` fallaban en fechas concretas; en su momento se atribuyó a un problema de fecha del entorno, pero era un bug real de producción — ver commit "Fix: entrenamiento crasheaba para strength_only sin actividad ligera" (`workoutSchedule` no conocía `lightCardioEnabled` y podía asignar un slot "facil/calidad/técnica" sin sesión real, crasheando `renderWorkout`). Corregido junto con el helper de tests `trainingDaysIncludingToday()`, que ordenaba los días con el orden de `Date#getDay()` en vez del orden real de la app (Lunes..Domingo). Los 15 tests E2E pasan de nuevo.

### Origen

Feedback de producto de Jonathan (3 jul 2026): el gráfico/anillo de macros es crítico y debe aparecer primero en Home y Nutrición; luego siguiente comida y sesión pendiente.

### Problema

REQ-97 priorizó la agenda antes del hero compacto. La nueva decisión de producto cambia la jerarquía: el usuario debe ver primero su avance de macros, porque es el centro de control del día.

### Causa raíz

`renderHoy()` actualmente renderiza agenda antes de `heroDash`; `renderNutrition()` muestra un botón de más opciones antes del bloque de macros. Además el estado "done" de Home no está diseñado alrededor del anillo + racha + pendientes restantes.

### Objetivo

Home y Nutrición deben abrir con el anillo/resumen de macros, más compacto si hace falta, y luego mostrar la siguiente acción del día.

### Alcance

1. En Home: ordenar como anillo/resumen de macros -> siguiente comida -> entrenamiento pendiente/sesión de hoy -> coach.
2. Si ya completó entrenamiento, no mostrar tarjeta de sesión; si falta entrenar, mantenerla pendiente aunque ya completó comidas.
3. Si completó todas las comidas y entrenamiento, mostrar anillo + racha/mensaje de día cubierto.
4. En Nutrición: ordenar como anillo/resumen -> comidas del día -> comidas extra/reordenadas -> más opciones.
5. Hacer el anillo más compacto si es necesario para mobile sin perder lectura.
6. Revisar tour/coachmarks para que apunten al nuevo primer elemento.

### Fuera de alcance

- Cambiar cálculo de macros.
- Rediseñar todo el dashboard de progreso.

### Riesgos

- Contradice el orden definido en REQ-97; documentar la nueva decisión en el mismo commit para evitar reversiones automáticas.

### Criterios de aceptación

- En Home mobile, el primer bloque útil es el anillo/resumen de macros.
- Si falta entrenar, Home lo muestra como pendiente aunque las comidas estén completas.
- En Nutrición, "Más opciones" no aparece antes del resumen y las comidas.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Capturas Playwright mobile de Home: día vacío/preparado, comidas completas con entreno pendiente, día completo.

## REQ-125 - Nutrición: reordenar comidas y saltar comidas sin cambiar horarios históricos

**Estado: implementado.** Comidas planificadas y extras ahora viven en una sola lista ordenable dentro de "Comidas del día" (antes eran dos secciones separadas). El orden se guarda en `dayState(ds).mealOrder` (solo visual: `moveDayItem` únicamente reescribe ese array, nunca slot/horario/`ovr`/macros) y se reconcilia en `dayEffectiveOrder` con los ítems reales del día (nuevos al final, claves obsoletas descartadas). Cada extra recibe un `oid` estable (`nextExtraOid`) para que su clave de orden no dependa de su índice en el array (evita romperse al eliminar una extra). Controles subir/bajar (fallback accesible, sin drag-and-drop) solo se muestran para hoy/futuro (`canReorderDay`); los días pasados no ofrecen reordenar. Nueva acción "Saltar esta comida" (`skipMeal`/`unskipMeal`, con "Deshacer") para comidas planificadas no consumidas: se ve como "Saltada", no cuenta como pendiente ni consumida (`dayTotals` excluye comidas saltadas de `totMeals`) y no puede aplicarse sobre una comida ya registrada. `homeAgendaData` usa `dayEffectiveOrder` y excluye comidas saltadas al elegir la próxima comida pendiente en Home. Verificado con `scripts/validate-meal-reorder-skip.mjs`; se actualizó `scripts/validate-home-macro-ring-first.mjs` (REQ-124) porque la sección "nut.extra" se fusionó en "nut.plan".

### Origen

Feedback de producto de Jonathan (3 jul 2026): el usuario debe reordenar comidas según cómo las consume durante el día; también debe poder saltarse una comida que ya no hará.

### Problema

Las comidas extra quedan al final y pueden perder visibilidad. Si el usuario agrega una comida que hará a media tarde, no puede subirla al lugar lógico. Tampoco hay acción explícita para marcar que no hará una comida planificada sin borrarla ni consumirla.

### Causa raíz

`renderNutrition()` separa comidas planificadas y extras por estructura fija; `day_log` no tiene un orden visual persistente ni estado "saltada" para slots de comida. El orden actual deriva de slots/arrays, no de intención diaria del usuario.

### Objetivo

Permitir ordenar visualmente el día de comidas en mobile y marcar comidas saltadas, preservando el historial y los horarios originales.

### Alcance

1. Permitir reordenar comidas planificadas y extras en la vista de Nutrición.
2. Optimizar para mobile: drag and drop o control de agarre pequeño; si no queda claro/accesible, agregar botones subir/bajar discretos.
3. El reordenamiento cambia solo el orden visual del día, no el slot, horario original, macros ni historial.
4. Agregar acción "Saltar esta comida" para comidas planificadas no consumidas.
5. Una comida saltada no cuenta como consumida; debe verse como saltada y permitir deshacer.
6. Home debe usar el orden visual para decidir la siguiente comida pendiente cuando exista.

### Fuera de alcance

- Recalcular automáticamente macros al saltar una comida; eso puede quedar como sugerencia o acción posterior.
- Cambiar el template global de horarios del usuario.

### Riesgos

- Drag and drop móvil puede ser frágil; los controles deben tener fallback accesible.
- Saltar comida puede dejar macros bajos; coordinar copy con REQ-122.

### Criterios de aceptación

- Una comida extra puede moverse entre comidas planificadas y conserva su estado.
- Una comida planificada puede marcarse como saltada y luego restaurarse.
- El orden visual persiste al cambiar de tab o recargar.
- Días pasados ya registrados no se reordenan automáticamente.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E mobile: agregar snack extra, moverlo arriba del almuerzo, saltar desayuno, verificar Home muestra la siguiente comida correcta.

## REQ-126 - Admin: resetear futuro y regenerar nutrición/entrenamiento para cualquier usuario

**Estado: implementado.** `api/admin.js` agrega `previewResetPlan`/`applyResetPlan` (usuario, alcance nutrition/training/both, fecha de inicio opcional = hoy en la zona horaria del usuario objetivo) y `resetUserToOnboarding` (reutiliza el wipe ya probado de `resetTestUserData` sin marcar al usuario como QA). Un día queda protegido (nunca se toca) si ya tiene una comida registrada o un entrenamiento hecho/ejecutado dentro del alcance elegido; aplicar solo reescribe `meals`/`extras` (nutrición) o `workoutDone`/`workoutOverride`/`workoutExecution` (entrenamiento) en `day_log.state` para los días no protegidos, y archiva (`status=superseded`) la versión de plan activa cuando el alcance incluye nutrición. El horizonte revisado cubre 120 días (sin techo artificial por debajo de 7). Toda acción se audita en la nueva tabla `admin_actions_log` (`supabase/admin_reset.sql`, requiere aplicarse manualmente en Supabase). Panel de administración: botones "Regenerar plan" (vista previa obligatoria antes de aplicar) y "Reiniciar usuario" (doble confirmación), deshabilitados para la propia cuenta y para otros administradores. Verificado con `scripts/test-admin-reset.mjs`.

Pendiente de infraestructura (no ejecutable por el agente): aplicar `supabase/admin_reset.sql` en el proyecto de Supabase de producción para que `admin_actions_log` exista antes de usar estas acciones (la auditoría falla en silencio — no bloquea la operación principal — si la tabla no existe todavía).

### Origen

Feedback de producto de Jonathan (3 jul 2026): como administrador debe poder borrar para otro usuario todo lo futuro generado y volver a generar dieta y ejercicio para al menos toda la semana; también reiniciar a cero y devolverlo al onboarding si hace falta.

### Problema

El admin puede listar usuarios, activar/desactivar, invitar, resetear usuario QA y administrar consumo, pero no puede corregir planes futuros de un usuario normal sin intervención manual en base de datos.

### Causa raíz

`api/admin.js` tiene acciones administrativas acotadas; no existe una acción segura para borrar prescripción futura (`plan_versions`/`day_log` futuros) ni para preparar un flujo de regeneración por usuario y fecha.

### Objetivo

Dar al administrador una herramienta segura para resetear o regenerar futuro de nutrición y/o entrenamiento de cualquier usuario, con fecha de inicio y preview antes de aplicar.

### Alcance

1. En panel admin, agregar acción por usuario: "Regenerar plan" o "Resetear futuro".
2. Permitir seleccionar: nutrición, entrenamiento o ambos.
3. Permitir fecha de inicio; default = hoy en zona horaria del usuario/admin si no se elige.
4. Preview obligatorio antes de aplicar: qué días/versiones se archivarán/borrarán y qué se regenerará.
5. Al aplicar, borrar/archivar solo futuro desde la fecha elegida; no tocar días pasados ni registros ejecutados.
6. Permitir regenerar como mínimo 7 días.
7. Agregar opción separada de "Reiniciar usuario": borrar datos personales/planes/progreso según política existente y marcar onboarding pendiente para que vuelva a empezar.
8. Auditar acción con admin, usuario objetivo, fecha, alcance y resultado.

### Fuera de alcance

- Ejecutar migraciones de producción automáticamente.
- Saltarse RLS desde cliente; operaciones sensibles deben pasar por API admin server-side.
- Crear pagos, cupones o entitlements nuevos.

### Riesgos

- Alto riesgo de pérdida de datos si la acción toca historial; requerir confirmación explícita y preview.
- Regenerar con coach para otro usuario puede consumir cuota/costo; usar políticas admin claras y fallback determinista si corresponde.

### Criterios de aceptación

- Admin puede seleccionar usuario normal, fecha y tipo de plan a resetear/regenerar.
- El preview muestra impacto antes de aplicar.
- Aplicar desde hoy no modifica días pasados ni comidas/entrenos ya registrados.
- Reiniciar usuario lo devuelve a onboarding sin convertirlo necesariamente en usuario QA.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Tests de `api/admin.js` con mocks: preview, aplicar nutrición, aplicar entrenamiento, ambos, reinicio total, bloqueo a no-admin y protección de historial pasado.

## REQ-127 - Personalizar remitente y asunto de los correos de autenticacion de Supabase (branding Fitbud)

**Estado: pendiente. Requiere accion manual en el dashboard de Supabase (y de un proveedor SMTP externo para el remitente); no implementable por el agente autonomo.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-127`).

## REQ-128 - Contrato estricto único de dieta (`DIET_CONTRACT`) + canario de factibilidad

**Estado: implementado.** Exporta `DIET_CONTRACT`, `dietContractTolerance()` y `validateDietContractTotals()` en `js/nutrition-domain.js` con kcal ±3% o ±50 kcal, proteína ±5 g bilateral, carbohidratos ±8 g, grasa ±8 g y kcal autoritativa de `ingredients.kcal`. El contrato queda en calibración (`runtimeActive:false`): no cambia cliente, servidor, snapshots ni `validateDayTotals` hasta REQ-129. `scripts/validate-diet-contract.mjs` reconstruye el catálogo desde `supabase/seed.sql` + semántica REQ-79, corre la matriz 2/4/6 comidas × patrón dietario × proteína normal/alta × disgustos × 7 días y se ejecuta en `node scripts/release-gate.mjs`. Baseline 2026-07-04: 0/378 días dentro de contrato; causas principales `protein_contract`, `carbs_contract`, `kcal_contract`, `fat_contract`, `kcal_out_of_tolerance`, `slot_without_candidates` y `protein_insufficient`. Ajuste propuesto: no relajar ni activar en silencio; REQ-129 debe implementar cierre global con `finalizeNutritionDay()` y REQ-132/135 cerrar slots/catálogo antes de re-correr el canario.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-128`).

## REQ-129 - `finalizeNutritionDay()` etapa 1: puerta pura dormida y normalización de propuestas

**Estado: implementado.** `finalizeNutritionDay(ctx)` vive en `js/nutrition-domain.js`, se exporta en namespace/global y queda dormida: normaliza propuestas contra catálogo, descarta ingredientes desconocidos, completa slots faltantes con fallback determinista, conserva `lockedMeals`, calcula `totals`/`residual` y reporta `contract = validateDietContractTotals(...)` sin activar `DIET_CONTRACT.runtimeActive`. El canario `scripts/validate-diet-contract.mjs` ahora mide con `engine:"finalizeNutritionDay"` y el nuevo `scripts/validate-finalize-nutrition-day.mjs` cubre unknown ingredient, fallback, kcal desde catálogo, contract.ok y locked meal intacta. Detalle completo (origen, alcance, riesgos) archivado en `docs/requirements-history.md`.

## REQ-130 - Coherencia de preferencias duras y patrón omnívoro activo

**Estado: implementado.** `dislikedIngredients` ya se trata como exclusión obligatoria por defecto en dominio, cliente y proxy; el system prompt dejó de llamarlo preferencia blanda; `highProtLine` usa fuentes proteicas dinámicas filtradas por restricciones/disgustos y sin ejemplos de gramajes; el patrón omnívoro agrega señal verificable de proteína animal con warning/reintento dirigido (sin 422 duro) y relajación automática si el usuario excluye carnes/pescado. `COACH_PROMPT_VERSION` sube a 7 para invalidar pool previo. Se corrigieron las referencias erróneas `REQ-127` en código/tests. Validadores actualizados: `validate-nutrition-domain`, `validate-first-day-preferences`, `validate-high-protein-prompt`, `test-coach-quota`. Detalle completo archivado en `docs/requirements-history.md`.

## REQ-131 - Momento del día, etapa 1: presupuestos por slot y filtro heurístico sin migración

**Estado: implementado.** `generateOneDay()` calcula presupuestos por slot, filtra referencias con `compatibleDishesForSlot`, valida `compatible_slots` y aplica techo de contundencia en slots no principales. Validador: `scripts/validate-slot-budget-prompt.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-131`).

## REQ-132 - Momento del día, etapa 2: metadata de contundencia y cobertura de slots vacíos

**Estado: implementado.** `supabase/nutrition_catalog_semantics.sql` agrega/backfillea `meal_weight` y `meal_form`; dominio/prompt/validadores usan esa metadata para evitar platos contundentes en slots ligeros y reportar cobertura. Acción manual: re-ejecutar la migración semántica en Supabase.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-132`).

## REQ-133 - API del coach: structured outputs, límites y modelo por acción con gate de telemetría para Sonnet 5

**Estado: implementado.** `/api/claude` ahora usa `output_config.format` con JSON Schema para `diet_day`, `diet_week` y `meal_option`; si Anthropic rechaza el parámetro con 400, reintenta una vez sin structured outputs y conserva el parseo/validación existente como fallback. El proxy capea `maxTokens` en 4096, el cliente escala los tokens de nutrición según número de comidas, `ALLOWED_MODELS` incluye `claude-sonnet-5` y el modelo se resuelve por acción vía env (`ANTHROPIC_MODEL_DIET`, `ANTHROPIC_MODEL_MEAL_OPTION`, etc.) con default Haiku 4.5. `MODEL_COSTS` incluye Sonnet 5 con precio estándar e introductorio hasta 2026-08-31. `supabase/analytics.sql` agrega `v_coach_model_gate`, y el panel admin muestra JSON inválido, degradación, costo y latencia por acción/modelo. Gate documentado: cambiar `ANTHROPIC_MODEL_DIET` a `claude-sonnet-5` solo si `diet_*` supera 10% de degradación sostenida durante 1-2 semanas; `meal_estimate` y `coach_conversation` permanecen en Haiku. Acción manual externa: re-ejecutar `supabase/analytics.sql` en Supabase para crear/actualizar la vista.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-133`).

## REQ-134 - Pipeline de crecimiento del catálogo validado por el motor

**Estado: implementado.** `scripts/grow-catalog.mjs` es un pipeline offline: con `--fixture` no usa red y con `--brief` llama a Anthropic solo desde local/CI con `ANTHROPIC_API_KEY`; normaliza candidatos contra `supabase/seed.sql`, exige slugs estables, fuente para ingredientes nuevos, metadata semantica completa y limites de porcion, rechaza macros inconsistentes (`kcal` vs `4P+4C+9F`) y prueba cada plato con `solveDishPortion` contra presupuestos tipicos por slot. La salida son dos archivos en `--out-dir`: patch SQL revisable referenciado por slug (sin `truncate` ni IDs) y reporte JSON con aceptados/rechazados. `scripts/validate-grow-catalog.mjs` cubre un fixture offline con ingrediente/plato aceptado y rechazos por macros, fuente ausente y metadata incompleta; `release-gate` lo ejecuta.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-134`).

## REQ-135 - Catálogo lote 1: slots vacíos, desayunos y snacks

**Estado: implementado.** Lote 1 expandió `supabase/seed.sql` a 121 ingredientes, 100 platos y 359 líneas, con fuentes en `docs/catalog-lote-1-sources.md` y cobertura de desayuno/snacks/slots ligeros. Detalle y criterios archivados en `docs/requirements-history.md`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-135`).

## REQ-136 - Catálogo lote 2A: metadata de cocina y scoring de preferencias

**Estado: implementado.** Agrega `dishes.cuisine_tags`, backfill semántico y scoring suave por `preferredCuisines`; el editor admin/pipeline/validadores preservan y exigen tags de cocina. Acción manual: re-ejecutar `supabase/nutrition_catalog_semantics.sql` en Supabase.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-136`).

## REQ-140 - Catálogo lote 2B: profundidad por cocina, presupuesto y fuera de casa

**Estado: implementado.** Lote 2B subió el catálogo a 162 ingredientes, 145 platos y 522 líneas, con profundidad por cocina, presupuesto y fuera de casa; fuentes en `docs/catalog-lote-2b-sources.md`. Acción manual: re-ejecutar `seed.sql` y semántica en Supabase.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-140`).

## REQ-141 - Catálogo lote 2C: meta 180/200 y validadores de gustos

**Estado: implementado.** Lote 2C cerró la meta de 200 ingredientes, 180 platos y 654 líneas, con fuentes en `docs/catalog-lote-2c-sources.md` y validadores de escenarios/gustos; el canario queda como input para REQ-137/143.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-141`).

## REQ-137 - `finalizeNutritionDay()` etapa 2: cierre global y complemento dentro de contrato

**Estado: implementado.**
`finalizeNutritionDay()` agrega una pasada global (`globalClosePass`) que trata todas las líneas escalables de las comidas no bloqueadas como una única bolsa de palancas (clasificadas por `ingredientLeverCategory` en proteína/carbohidrato/grasa/neutro) e hill-climbea sobre los macros del día completo, no por comida, respetando siempre `lineLimits()`/`clampStep()`. Si el día sigue fuera de `DIET_CONTRACT`, `attemptContractComplement()` busca un snack/batido del catálogo compatible con `dislikedIngredients`/dieta que reduzca estrictamente el número de métricas fuera de contrato, sin reemplazar comidas existentes. `DIET_CONTRACT.runtimeActive` sigue `false`. Canario `validate-diet-contract.mjs` sube de 39/378 (10.3%) a 122/378 (32.3%) y ahora reporta `failureBreakdown` distinguiendo `catalogGapDays` (solo residuo de macro, 100% de los días que no cierran hoy) de `otherIssueDays` (causa estructural distinta). Tests nuevos en `scripts/validate-finalize-nutrition-day.mjs`: cierre de residuo acumulado exacto y caso imposible que debe devolver `no_solution` con causa medible.

Detalle historico (Origen/Problema/Alcance/Criterios originales): `docs/requirements-history.md` (buscar `## REQ-137`).

## REQ-138 - Conectar `finalizeNutritionDay()` en cliente sin activar contrato global

**Estado: implementado.** Conecta los flujos principales de nutrición (`generateOneDay`, determinista, semana, regenerar día y regenerar comida) a `finalizeDayWithGate()`/`finalizeNutritionDay()` sin activar el contrato global; reemplazos quedaron extraídos como REQ-142. Validador: `scripts/validate-nutrition-finalize-wiring.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-138`).

## REQ-139 - Activar `DIET_CONTRACT` en runtime con aviso suave no bloqueante

**Estado: implementado.**
`DIET_CONTRACT.runtimeActive=true`. `dietContractNoticeText(totals,target)` (index.html) evalúa el día ya cerrado (nunca la propuesta cruda) vía `nd.validateDietContractTotals()` y muestra "Tu día quedó cerca de tu meta, no exacto." en `genReviewHtml`/`genWeekReviewHtml` y en los toasts de `applyGeneratedDay`/`applyWeekPlan`/`applyDeterministicDay`. `finalizedDayIsComplete()` sigue siendo el único criterio de "aplicable" (cobertura de slots); ningún flujo bloquea aplicar/guardar por incumplir el contrato. Validador: `scripts/validate-diet-contract-runtime-notice.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-139`).

## REQ-142 - Conectar reemplazos ("Cambiar comida") a `finalizeNutritionDay()`

**Estado: implementado.**
`applyChangeMeal()` en `index.html` ya no llama a `rebalanceFutureMeals()` en el camino principal: cuando `rebalanceNeeded`, arma un `ctx` para `finalizeDayWithGate()`/`finalizeNutritionDay()` con `lockedMeals` = todas las comidas del día salvo las futuras candidatas (usa el valor efectivo actual vía el nuevo helper `mealEntryForFinalize()`) más la comida recién elegida, y `proposal` = valor actual de las comidas futuras (conserva plato; `normalizeProposalMeal()` re-resuelve porción si no trae ingredientes, o recalcula macros desde sus ingredientes si los trae, y `globalClosePass()` termina el cierre del día completo por hill-climbing). Los ajustes resultantes se escriben como `ovr` (`gen:true,nutritionPlan:true`) igual que antes. `rebalanceFutureMeals()` se conserva como capa de compatibilidad (solo se usa si `finalizeNutritionDay()` no está disponible) y sigue exportada/probada. Copy ("· N ajustada(s)") y `contingencyLog` sin cambios. Validador: `scripts/validate-nutrition-replacements.mjs` (10 tests; se agregó el test 10 que ejercita `finalizeNutritionDay()` con el mismo `ctx` que arma `applyChangeMeal()`).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-142`).

## REQ-143 - Catálogo lote 3: crecimiento drástico dirigido por el canario del contrato

**Estado: pendiente. Requiere acción humana (decisión de producto en REQ-147) antes de intentar otro lote; no implementable por el agente autónomo hasta esa decisión.**

Canario `validate-diet-contract.mjs`: 122/378 (32.3%), 100% `catalog_gap`. Dos sesiones (2026-07-05 y 2026-07-08) con estrategias distintas, midiendo cada lote con `scripts/diff-diet-contract.mjs` (REQ-144), confirmaron un techo cercano a 32-33% bajo la selección local de `planDeterministicNutritionDay()`/`globalClosePass()` (los fallos de `carbs_contract` son 100% por exceso de carbohidratos, nunca déficit). Ningún lote nuevo se comiteó. Detalle completo de ambos experimentos y del objetivo/alcance/criterios si se retoma tras REQ-147: `docs/requirements-history.md` (buscar `## REQ-143`).

## REQ-144 - Medir impacto incremental de catálogo contra el canario antes de aceptar platos nuevos

**Estado: implementado.** `scripts/diff-diet-contract.mjs` compara dos `seed.sql` y reporta el delta de `okDays` total, catálogo, causas y las 54 dimensiones; `scripts/validate-diet-contract-diff.mjs` lo valida y el release gate lo ejecuta. Detalle, motivación (REQ-143) y guía operativa: `docs/diet-contract-catalog-diff.md` y REQ-143 de `docs/requirements-history.md`.

## REQ-145 - Fix E2E: el fixture de entreno deja "hoy" sin sesión de fuerza los domingos y pone el release-gate en rojo

**Estado: pendiente.**

### Origen

Auditoría del journey **entrenamiento** (2026-07-05, domingo). `node scripts/release-gate.mjs` cierra en rojo: `68/69`, único check bloqueante = "Suite E2E (npx playwright test)". El test que falla es `tests/e2e/entreno.spec.js › sesión guiada completa`, en ambos intentos (original + retry #1). El mismo síntoma (E2E fallando en fechas concretas) fue declarado **resuelto** en la nota de REQUIREMENTS.md:1190 (commit `4ce8102`, 2026-07-04), pero la corrección quedó incompleta para los domingos.

### Problema

El test da por invariante que "hoy es día de entreno con sesión de fuerza en gimnasio" (`entreno.spec.js:22` espera `/Gimnasio ·/`). Cuando la suite corre un **domingo**, la app renderiza en Entreno para hoy **"Descanso total"** en vez de una sesión de gimnasio, así que la aserción hace timeout (10 s) y el reproductor nunca arranca. Reproducción real capturada por Playwright (Chromium) hoy: la tarjeta de hoy muestra `Domingo, 5 jul · hoy · Semana 2` seguida de `Descanso total · Movilidad suave y caminata opcional ... Pendiente` y `Descanso planificado: no cuenta como sesión incompleta`, nunca `Gimnasio ·`.

Como el release-gate ejecuta la suite E2E, cualquier corrida en domingo deja el gate en rojo, lo que **bloquea el push de ambos loops autónomos** (desarrollador y auditor) y emite una falsa señal de regresión del reproductor de entreno (REQ-92/REQ-96). El resto de días de la semana pasa.

### Causa raíz

Bug en el **fixture de tests**, no en la app. `trainingDaysIncludingToday()` (`tests/e2e/helpers.js:46-54`) arma el set de 4 días de entreno como `hoy + los 3 días siguientes` en orden cíclico Lunes..Domingo, e **incluye** hoy pero no garantiza que hoy caiga en un slot de fuerza una vez que la app reordena los días. La app ordena los días seleccionados en orden Lunes..Domingo (`normalizedTrainingDays`, `js/nutrition-pure.js:167`, con `WEEKDAY_OPTIONS` = Lun..Dom, Domingo último). El domingo (`getDay()===0`) es el último en ese orden, así que el bloque consecutivo que arranca en domingo deja a hoy como **4º** día seleccionado. La plantilla upper/lower de 4 días con prioridad "composition" es `["torsoA","piernaA","torsoB","facil"]` (`js/nutrition-pure.js:218`), y para `strength_only` sin actividad ligera el slot `facil` se sustituye por `descanso` (`workoutSchedule`, `index.html:1150-1152`). Resultado: el 4º día (hoy, domingo) = `descanso`. La propia nota del fixture (`helpers.js:37-38`) advierte "Si el día actual quedara de último, la sesión de hoy no sería de gimnasio", pero la implementación no lo evita.

Simulación de solo lectura de la cadena fixture→scheduler para los 7 días (mismo template y orden que la app):

```
Dom  days=[1,2,3,0]  todaySlot=descanso  *** FAIL (rest) ***
Lun  days=[1,2,3,4]  todaySlot=torsoA    OK (gym)
Mar  days=[2,3,4,5]  todaySlot=torsoA    OK (gym)
Mie  days=[3,4,5,6]  todaySlot=torsoA    OK (gym)
Jue  days=[4,5,6,0]  todaySlot=torsoA    OK (gym)
Vie  days=[1,5,6,0]  todaySlot=piernaA   OK (gym)
Sab  days=[1,2,6,0]  todaySlot=torsoB    OK (gym)
```

El comportamiento de la app (domingo = descanso para un usuario `strength_only`, 4 días, upper/lower, composición) es el diseñado (periodización con un día de recuperación); lo que está roto es el invariante que el fixture dice garantizar.

### Objetivo

Que la suite E2E y, por lo tanto, el release-gate sean **deterministas respecto al día de la semana**: el test de entreno debe correr contra un estado donde hoy tiene efectivamente una sesión de fuerza en gimnasio, cualquier día que corra la suite (incluidos domingos).

### Alcance

1. Corregir `trainingDaysIncludingToday()` (`tests/e2e/helpers.js`) para que hoy quede en un slot de **fuerza**, no en el 4º slot `facil`/descanso. Opción robusta: en vez de "hoy + 3 siguientes", elegir los 4 días de forma que hoy sea el **primero** en orden Lunes..Domingo (p. ej. hoy + los 3 días previos en ese orden, o forzar `trainingPriority:"strength"` cuyo template de 4 días es `["torsoA","piernaA","torsoB","piernaB"]`, sin slot de descanso).
2. Verificar que el fix cubre los 7 posibles `getDay()` (no solo el día en que se implemente), idealmente con una aserción/tabla de los 7 casos.
3. Actualizar la nota "resuelta" de REQUIREMENTS.md:1190 para reflejar que el caso domingo faltaba.

### Fuera de alcance

- Cambiar el comportamiento de producción de `workoutSchedule`/plantillas de entreno (`index.html`, `js/nutrition-pure.js`): el descanso del 4º día es intencional; no tocar el runtime de la app.
- Cambiar las aserciones de contenido del test (REQ-92: calentamiento + fuerza + vuelta a la calma). El test es correcto; el fixture es el que no cumple su invariante.

### Riesgos

- Al reordenar los días del fixture, verificar que sigan siendo 4 días válidos (`MIN/MAX_TRAINING_DAYS`) y que `navegacion.spec.js` (que reusa el mismo helper) siga pasando.
- Forzar `trainingPriority:"strength"` cambia la plantilla; confirmar que la sesión de hoy siga teniendo ≥2 series y ≥5 bloques como exige `entreno.spec.js`.

### Criterios de aceptación

- `node scripts/release-gate.mjs` pasa (69/69) **corriendo un domingo** (no solo en días laborables). Verificable fijando la fecha del entorno o parametrizando el día en el fixture.
- `npx playwright test tests/e2e/entreno.spec.js` pasa en los 7 días de la semana.
- No se modifica código de runtime de la app (`index.html`, `js/*.js`) para este arreglo.

### Verificación sugerida

- Correr la suite con la fecha del sistema fijada a un domingo (p. ej. `TZ` + un mock de `Date` en el fixture, o `libfaketime`) y confirmar verde.
- Tabla de los 7 `getDay()` mostrando que hoy cae siempre en un slot `torso*/pierna*/push*/pull*/legs*` (fuerza), nunca en `facil`/`descanso`.

## REQ-146 - Unificar el cálculo de racha: Progreso muestra "0 / racha rota" mientras hoy no se registra

**Estado: pendiente.**

### Origen

Journey `retencion` (racha, hitos y mensajes de recuperación). Auditando la pantalla Progreso con días previos completos pero **hoy sin registrar aún** (el caso normal cada mañana), la sección de rachas se contradice a sí misma y dispara un mensaje de "racha rota" falso.

### Problema

Reproducción funcional (Playwright + fixtures E2E, 0 llamadas pagadas): usuario con nutrición + entreno completos los últimos 4 días (2026-07-03..07-06) y **hoy (2026-07-07) sin registrar todavía**. En una sola pantalla Progreso conviven tres señales incompatibles:

- Tarjeta "Racha (días)" (sección *Tus números*): **🔥 4**.
- Tarjeta principal "Racha actual (combinada)" (sección *Rachas e hitos*): **—** (0), "Mejor: 4 días".
- Banner de recuperación: **"Tu mejor racha fue de 4 días. Retoma hoy: el progreso que hiciste no desaparece."** — como si la racha estuviera rota.
- Además salta el toast de hito **"🔥 ¡3 días de racha! Sigue así."** y se guarda un hito con fecha de hoy.

El usuario que NO ha roto nada (solo aún no registró el día en curso) recibe un mensaje demoralizante de racha perdida junto a otra tarjeta que le dice que su racha sigue viva en 4. Es una fuga de confianza justo en el journey de retención, y ocurre a diario en la franja horaria previa a completar el día.

Evidencia funcional (script `run-streak.mjs`, servidor local `http://127.0.0.1:8923`):
```
STREAK_INTERNALS: {"streakFn":4,"combCur":0,"combBest":4,"todayCombined":false}
UI_PROGRESO: {"rachaDias":"🔥 4","rachaCombinada":"—",
  "recoveryBanner":"Tu mejor racha fue de 4 días. Retoma hoy: el progreso que hiciste no desaparece."}
CONSOLE_ERRORS: []
```
Screenshot: `Racha (días) 🔥 4` y banner "racha rota" y `Racha actual (combinada) —` visibles a la vez, más el toast de 3 días de racha. Sin errores de consola.

### Causa raíz

Coexisten **dos cálculos distintos** de la racha combinada:

- `streak()` (`index.html:9415-9420`): cuenta hacia atrás desde hoy y, si hoy aún no está cumplido, **arranca en ayer** (`if(!combinedDayDone(ds))ds=addDays(ds,-1);`). Por eso devuelve 4 (racha viva). Lo usan `progressStats()` (`index.html:9149`→tarjeta "Racha (días)"), la agenda de Home (`index.html:4123`), el empty-state (`index.html:5092`) y `checkAndSaveMilestones()` (`index.html:9402`).
- `streakStats().combCur` (`index.html:9350-9377`): pasada hacia adelante desde `START` hasta hoy que **exige que HOY sea `combinedDayDone`**; si hoy no está cumplido, `combCur=0`. Lo usa `renderStreakSection()` (`index.html:5163`) para la tarjeta "Racha actual (combinada)" y para el banner de recuperación `broken=s.combBest>0&&stk===0` (`index.html:5167-5169`).

Como `streak()` ignora el día en curso incompleto pero `combCur` lo penaliza, ambos divergen exactamente durante la ventana "hoy aún no registrado". El banner de recuperación y el toast de hito quedan además calculados con fuentes opuestas (`combCur` vs `streak()`), de ahí la triple contradicción.

### Objetivo

Que la racha combinada tenga **una sola definición** y que la pantalla Progreso sea coherente: mientras el día en curso no esté cumplido pero exista una racha previa viva, no debe mostrarse "0" ni un mensaje de "racha rota". El número de la tarjeta principal, el de "Racha (días)" y el disparo del banner/hitos deben provenir del mismo cálculo.

### Alcance

1. Unificar el cálculo: que `renderStreakSection()` use el mismo criterio "hoy incompleto no rompe la racha" que `streak()` (p. ej. derivar `stk`/`combCur` de `streak()` o hacer que `streakStats().combCur` no penalice el día en curso aún no cumplido, distinguiendo "hoy pendiente" de "racha rota ayer").
2. Recalcular la condición del banner de recuperación (`broken`) para que solo se dispare cuando la racha esté **realmente rota** (último día vencido sin cumplir), no cuando hoy simplemente sigue abierto.
3. Verificar que las rachas separadas de nutrición y entrenamiento (`nutCur`/`trainCur`) mantengan una semántica coherente con la combinada respecto al día en curso.

### Fuera de alcance

- Cambiar la definición de `combinedDayDone`/`nutritionDayDone`/`trainingDayResult` ni los umbrales de cumplimiento.
- Rediseñar la sección "Rachas e hitos" o los niveles de hito (3/7/14/30).
- Tocar la lógica de sync o de persistencia de `streakMilestones`.

### Riesgos

- Al unificar, cuidar que la "mejor racha" (`combBest`) y los hitos ya guardados no cambien de valor retroactivamente.
- `checkAndSaveMilestones()` ya usa `streak()`; si se alinea la UI con `streak()`, confirmar que no se dupliquen ni se adelanten hitos.
- Evitar regresiones en Home/empty-state que ya consumen `streak()`.

### Criterios de aceptación

- Con días previos completos y hoy sin registrar, la tarjeta "Racha actual (combinada)" y "Racha (días)" muestran **el mismo número** (>0) y **no** aparece el banner de "racha rota".
- El banner de recuperación solo aparece cuando la racha está efectivamente rota (existió un día vencido sin cumplir después del último día de racha).
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Reusar los helpers E2E (`installMocks`+`seedLoggedInUser`): sembrar N días previos combinados-completos, dejar hoy sin registrar, abrir Progreso y assertar que ambos números coinciden y que `.streak-recovery` no existe.
- Segundo caso: dejar además ayer sin cumplir (racha realmente rota) y assertar que el banner sí aparece y ambos números son 0.

## REQ-147 - Decidir si vale la pena tocar la selección de `planDeterministicNutritionDay()`/`globalClosePass()` para superar el techo de catálogo del canario `DIET_CONTRACT`

**Estado: pendiente. Requiere acción humana (decisión de producto de Jonathan) antes de implementar cualquier alcance; no implementable por el agente autónomo sin esa autorización, porque reabre una restricción que él mismo fijó en REQ-143 ("no rediseñar la selección").**

### Origen

Dos sesiones autónomas independientes (2026-07-05 y 2026-07-08) intentaron subir el canario `DIET_CONTRACT` (`node scripts/validate-diet-contract.mjs`, hoy 122/378 = 32.3%) agregando solo contenido al catálogo, tal como exige el alcance de REQ-143. Ambas, con estrategias de contenido distintas, encontraron el mismo techo cerca de 32%-33%. El detalle completo del experimento de 2026-07-08 (incluida la sonda cuantitativa que confirma que el 100% de los fallos de `carbs_contract` son por exceso de carbohidratos, nunca por déficit, y el par de platos casi idénticos "Tempeh..."/"Seitán..." con efecto neto de signo opuesto) está documentado en la actualización 2026-07-08 de REQ-143.

### Problema

`planDeterministicNutritionDay()` elige, por slot, el plato con mejor `scoreMacros()` local entre como máximo 48 candidatos pre-rankeados por cercanía calórica (`js/nutrition-domain.js:663-690`), y `globalClosePass()` (línea ~1115) solo reescala gramos de las líneas ya elegidas — nunca cambia de plato. No hay búsqueda, ni siquiera acotada, sobre combinaciones de platos por día: es una selección local, ávida, de un solo paso por slot. Agregar contenido no puede compensar esa limitación de forma confiable: un plato nuevo puede ganar la selección local en un slot y, sin que el sistema lo sepa, empeorar el cierre global del día, aunque el plato en aislamiento sea nutricionalmente mejor que el que reemplaza.

### Objetivo

Que alguien con autoridad de producto decida, con la evidencia de REQ-143/REQ-144 en mano, entre estas opciones (u otra): (a) autorizar una mejora acotada de selección (no un rediseño completo) para intentar subir el canario más allá del ~32-33% que el catálogo por sí solo parece dar; (b) seguir subiendo el catálogo en lotes pequeños y medidos aceptando que el techo actual hace improbable alcanzar "sustancial"; (c) posponer indefinidamente el gate de REQ-139/REQ-128 y priorizar otro journey. Mientras no haya decisión, el agente autónomo no debe seguir gastando sesiones completas en lotes de catálogo para este fin específico.

### Alcance (solo si se autoriza la opción (a))

1. Ideas acotadas a evaluar, sin necesariamente implementar todas: (i) ampliar el pre-rankeo de 48 a más candidatos cuando el catálogo lo permita sin costo de performance relevante para el canario offline; (ii) en `globalClosePass()`, permitir explorar 2-3 alternativas de plato por slot (no solo reescalar gramos) cuando el cierre falla, manteniendo el resto del día fijo; (iii) cualquier alternativa que el responsable de producto prefiera.
2. Medir cada alternativa con `scripts/diff-diet-contract.mjs` antes/después, igual que un lote de catálogo, con desglose por dimensión.
3. Mantener el resto de contratos de dominio (REQ-78/80/83/84) sin cambio de comportamiento; `DIET_CONTRACT.runtimeActive` sigue en `false` — esto es tooling/canario, no activación (REQ-139 es quien activa el aviso suave, ya redefinido y sin depender de este REQ).

### Fuera de alcance

- Activar `DIET_CONTRACT` en runtime (REQ-139, ya redefinido y ejecutable de forma independiente).
- Cambiar modelo/prompt del coach (REQ-133, cerrado).
- Implementar cualquier alcance de la sección anterior sin la decisión explícita de Jonathan registrada en este REQ: este documento describe una tensión de producto (dos restricciones que él mismo fijó — "solo catálogo" en REQ-143 y "no tocar selección" — que juntas no alcanzan el objetivo que él mismo fijó para REQ-143), no una luz verde para implementar.

### Riesgos

- Tocar la selección es más invasivo que un lote de catálogo: puede afectar variedad semanal, tiempo de cómputo del canario (378 días) y comportamiento ya validado por REQ-80/83/84/137. Si se autoriza, requiere el mismo rigor de canario + regresión que REQ-137.
- No decidir indefinidamente deja REQ-143 pausado y consume ciclos de auditoría/PM de agentes futuros releyendo el mismo análisis; por eso REQ-143 se saca de `agent-loop.json` hasta que este REQ tenga una decisión.

### Criterios de aceptación

- No aplica hasta que exista una decisión de producto registrada aquí (fecha + decisión de Jonathan + qué opción de "Objetivo" se eligió).
- Si la decisión es "no tocar la selección", cerrar este REQ documentando la decisión y actualizar REQ-143 para reflejar el techo de ~32-33% como límite conocido y aceptado del catálogo bajo la selección actual (o cerrarlo también, según lo que decida Jonathan).
- Si la decisión es "sí, acotado", definir aquí mismo el sub-alcance elegido antes de que un agente lo implemente.

### Verificación sugerida

- N/A hasta la decisión. Si se autoriza, usar el mismo canario (`validate-diet-contract.mjs`) y diff (`diff-diet-contract.mjs`) como antes/después, con el mismo estándar de "no bajar el agregado ni una dimensión sana" que REQ-143.

## REQ-148 - Fix billing: un reembolso parcial de Stripe revoca todo el entitlement pagado

**Estado: pendiente.**

### Origen

Journey de **facturación** (2026-07-10, rotación del loop auditor tras REQ-147). Verificación funcional en navegador (preview `fitbud`): la app carga con planes de fallback y `showPaywall('profile')` renderiza mensual USD 14 / trimestral USD 36 con "Disponible pronto" (REQ-104), sin errores de consola. La rama de reembolso del webhook **no es ejercitable en local** (requiere un `charge.refunded` real de Stripe); este hallazgo está verificado por lectura de código + semántica documentada de Stripe.

### Problema

Stripe emite `charge.refunded` tanto en reembolsos totales como parciales; en un parcial el objeto `charge` trae `refunded:false` y `amount_refunded < amount`. El webhook no distingue ambos casos y revoca el entitlement completo ante cualquier `charge.refunded`. Reproducción (Stripe test mode): (1) usuario compra "Paquete 3 meses" (USD 36, 90 días); (2) soporte emite un reembolso parcial de USD 5 (el usuario sigue con ~85 días pagados); (3) Stripe envía `charge.refunded` con `refunded:false`, `amount_refunded:500`, `amount:3600`; (4) `handleRefund()` PATCH-ea el entitlement a `revoked`; (5) el usuario pierde **todo** el acceso premium pese a haber pagado casi todo el período.

### Causa raíz

`handleRefund(e, charge)` en `api/webhook.js:134-151` revoca incondicionalmente: solo verifica `charge.payment_intent` y una fila `active/courtesy` con ese `payment_ref`, y hace `sbPatch(... { status:"revoked" })` (`api/webhook.js:145-149`). Nunca inspecciona `charge.refunded` ni compara `charge.amount_refunded` con `charge.amount`. Dispatcher en `api/webhook.js:200-201`. El criterio de REQ-26 ("Reembolso/expiración retira acceso premium") se redactó asumiendo reembolso total; el caso parcial no se acotó.

### Objetivo

Que un reembolso parcial no le quite al usuario el acceso que pagó: solo un reembolso total (o disputa) debe revocar. Los parciales quedan auditados en `billing_events` sin tocar el acceso.

### Alcance

1. En `handleRefund()`, revocar **solo** si `charge.refunded === true` o `Number(charge.amount_refunded) >= Number(charge.amount)`. En parcial, no revocar y loguear el evento como `skipped`/`partial_refund` conservando auditoría.
2. Mantener idempotencia, verificación de firma y logging sin cambios.

### Fuera de alcance

- El monto mostrado en el historial (`moneyFromPayload()` en `api/entitlement.js:62-67` prioriza `amount` sobre `amount_refunded`): bug de visualización menor y distinto; documentarlo aparte, no aquí.
- Reembolsos totales, disputas y expiración: comportamiento actual sin cambios.

### Riesgos

- Un reembolso total debe seguir revocando: cubrir ambos campos (`refunded` y `amount_refunded >= amount`).
- Si un parcial se completa luego con otro reembolso hasta el total, el segundo `charge.refunded` debe poder revocar (no bloquear por idempotencia).

### Criterios de aceptación

- `charge.refunded` parcial (`refunded:false`, `amount_refunded < amount`) no cambia el `status`; queda auditado.
- `charge.refunded` total revoca como hoy; duplicados/desordenados no corrompen estado.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Test de webhook con fixtures parcial vs total (patrón `scripts/test-admin-api.mjs`) afirmando revocación solo en el total.
- Manual en Stripe test mode: reembolso parcial → entitlement sigue `active`; total → `revoked`.

## REQ-149 - Fix admin: "Regenerar plan · Solo nutrición" archiva también el entrenamiento futuro

**Estado: pendiente.**

### Origen

Auditoría del journey **administración** (panel "Usuarios" → "Regenerar plan", alcance "Solo nutrición"). Commit previo: `6fc83c1` (REQ-148).

### Problema

REQ-126 prometió un selector de alcance (nutrición/entrenamiento/ambos) para regenerar el futuro **sin tocar lo demás**. Pero "Solo nutrición" también archiva la prescripción de **entrenamiento** futura. Reproducción: (1) el usuario termina onboarding y `saveOnboarding()` guarda **una sola** versión activa combinada con `snapshot.nutritionPlan` **y** `snapshot.trainingPlan` en la misma fila (`ensurePlanVersion({…, trainingPlan, nutritionPlan})`, `index.html:3333-3343`); el índice `plan_versions_one_active_idx` (`supabase/plan_cycles.sql:40-42`) fuerza una única fila activa por ciclo. (2) El admin aplica "Solo nutrición". (3) `applyResetPlan()` con `scope="nutrition"` archiva esa fila combinada con `valid_to=fromDate-1`. (4) El entreno futuro pierde su versión activa (`planVersionForDate(ds)` ya no la cubre para `ds≥fromDate`) y cae a generación determinista, perdiendo sets/reps/sustituciones. (5) La vista previa engaña: muestra "Se archivará la versión activa del plan de nutrición." (`index.html:10231`) aunque la fila también trae entrenamiento. Evidencia: reproducción de la lógica del servidor con una única versión activa combinada → `scope="nutrition"` archiva `id=42`, `source="onboarding"`, `supersededHoldsTrainingSnapshot=true`. El flujo admin end-to-end no es ejercitable en local (requiere Supabase + service role): verificado por lectura de código + reproducción. `scripts/test-admin-reset.mjs` no cubre el caso (su mock devuelve una sola fila sin `snapshot`).

### Causa raíz

`fetchActivePlanVersion()` (`api/admin.js:312-316`) toma `plan_versions?status=eq.active&order=created_at.desc&limit=1` **sin filtrar por contenido de nutrición** (`snapshot.nutritionPlan`) ni por `source`; `applyResetPlan()`/`previewResetPlan()` (`api/admin.js:404-415` y `376`) la archivan siempre que `scope!=="training"`. Como nutrición y entrenamiento viven en la misma fila activa, archivar "por nutrición" arrastra el entrenamiento. El copy del preview (`index.html:10231`) asume que la fila es solo de nutrición.

### Objetivo

Que "Solo nutrición" afecte únicamente la nutrición y nunca archive la prescripción de entrenamiento futura, y que la vista previa describa con exactitud qué se archivará.

### Alcance

1. En `applyResetPlan()`/`previewResetPlan()`, al archivar por nutrición, preservar `snapshot.trainingPlan` de la versión activa (re-versionar la fila conservando el entrenamiento, o limitar el archivado a versiones sin entrenamiento activo).
2. `fetchActivePlanVersion()` debe distinguir nutrición vs entrenamiento (`snapshot.nutritionPlan`/`trainingPlan`) en vez de tomar la última activa sin filtrar.
3. Corregir el copy del preview (`index.html:10231`) según el alcance y contenido real.
4. Extender `scripts/test-admin-reset.mjs` con una fila activa combinada afirmando que `scope="nutrition"` conserva el entrenamiento futuro.

### Fuera de alcance

- El bug del CHECK de `source:"nutrition"` (journey nutrición, REQ aparte).
- Cambiar el modelo de una-fila-activa-por-ciclo o cómo `saveOnboarding` combina snapshots.
- Alcance `training` (ya no toca `plan_versions`) y `both` (archiva todo a propósito).

### Riesgos

- Re-versionar la fila puede chocar con `one_active_idx`; cuidar orden (no dejar dos activas ni cero).
- Preservar entrenamiento debe respetar `valid_from`/`valid_to` para no reintroducir prescripción en días ya protegidos.

### Criterios de aceptación

- Con una versión activa combinada, `applyResetPlan(scope="nutrition")` deja intacto el entrenamiento futuro.
- La vista previa no afirma archivar "el plan de nutrición" cuando la fila también trae entrenamiento.
- `scope="training"`/`"both"` sin cambios.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `scripts/test-admin-reset.mjs` con mock de fila combinada: tras `scope="nutrition"`, el entrenamiento futuro sigue disponible (versión activa con `snapshot.trainingPlan` cubriendo `ds≥fromDate`).
- Manual (staging): usuario con plan combinado → "Solo nutrición" → Entreno conserva la rutina futura.

## REQ-150 - PWA sirve HTML nuevo con JS del cache viejo tras un deploy (versión mezclada)

**Estado: pendiente.**

### Origen

Journey `pwa`: verificación en navegador (SW `fitbud-pwa-v67` activo, server local 8923); se revisó registro, shell y estrategias de `fetch`.

### Problema

Tras un deploy que toca `index.html` y algún `.js` (habitual en este monolito), abrir la PWA instalada trae `index.html` fresco de red mientras los `.js` salen del cache viejo en la misma carga: HTML nuevo + JS viejo puede romper la vista sin recuperación hasta recargar a mano. Reproducido contra el SW real: un centinela "STALE" en el cache de `training-plan.js` se devuelve vía `cacheFirst` mientras una navegación devuelve `index.html` fresco vía `networkFirst`.

### Causa raíz

`service-worker.js`: navegación `networkFirst` (39-42) vs `.js` mismo-origen `cacheFirst` (54); el único límite de versión es `CACHE_NAME` (sin hash de contenido) y `networkFirst` lo salta. `install` hace `skipWaiting()` (21) y `activate` `clients.claim()` (29), pero `registerServiceWorker()` (`index.html:11296-11306`) no escucha `updatefound`/`controllerchange` ni recarga.

### Objetivo

Que la PWA instalada nunca ejecute una mezcla de versiones.

### Alcance

1. Servir navegación y `.js` desde la misma generación de cache (shell `cacheFirst` con revalidación) o hashear el shell.
2. Manejar la actualización en `registerServiceWorker()`: al detectar SW nuevo, recargar o avisar sin vocabulario técnico (REQ-31).

### Fuera de alcance

- Otras estrategias (`/api/`, media de Storage) y automatizar el bump de `CACHE_NAME`.

### Riesgos

- `cacheFirst` de navegación puede servir HTML viejo si `activate` no purga; recargar solo puede interrumpir (preferir aviso).

### Criterios de aceptación

- Tras un deploy con bump de `CACHE_NAME`, abrir la PWA no ejecuta HTML nuevo con JS viejo (o recarga sola).
- UI de actualización, si existe, sin mención de IA/SW/cache/tokens (REQ-31).
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Cachear un `.js` viejo y confirmar que una navegación fresca ya no coexiste con JS viejo tras el fix.

## REQ-151 - Landing muestra la sección "Planes" vacía cuando el catálogo carga después del primer render

**Estado: pendiente.**

### Origen

Journey de **adquisición** (rotación del loop auditor tras REQ-150). Verificación funcional en navegador (preview `fitbud`, servidor local 8923, 0 llamadas pagadas): un visitante sin sesión ve la landing con la sección "Planes / Elige tu ritmo" **sin tarjetas de precio**, el elemento de conversión central del funnel.

### Problema

Con `authReady:true`, `session:false`, `_showAuth:false` la landing está renderizada, y `catalogPlans` ya tiene 2 planes, pero el DOM muestra `<div class="l-plans"></div>` vacío (0 tarjetas). Reproducción: al cargar la página, `document.querySelectorAll('.l-plan').length === 0` mientras `catalogPlans.length === 2`; llamar `render()` manualmente pinta las 2 tarjetas ("Plan mensual USD14/mes", "Paquete 3 meses USD36/3 meses"). La sección queda vacía de forma permanente para el visitante pasivo (no hay evento que la re-renderice). Sin errores de consola.

### Causa raíz

Carrera en `boot()` (`index.html:11355-11376`): `loadCatalog()` se llama sin `await` (`index.html:11361`, "no-await ... en paralelo") y sin `.then(render)`. Tras `await refreshAuth()`, si no hay sesión se llama `render()` (`index.html:11375`) → `renderLanding()` → `landingPricingHtml()` (`index.html:6796`) → `activeCatalogPlans()` (`index.html:787`) devuelve `(catalogPlans||[])`. Cuando `refreshAuth` (sesión de Supabase, a menudo desde localStorage) gana la carrera al fetch de `/api/catalog`, `catalogPlans` aún es `null` (`index.html:771`) y `landingPricingHtml()` devuelve `""`. `loadCatalog()` fija `catalogPlans` (`index.html:772-786`) pero **nunca vuelve a renderizar**, así que la sección permanece vacía. Confirmado por grep: no existe `loadCatalog().then(...)` ni re-render tras poblar el catálogo.

### Objetivo

Que el visitante siempre vea las tarjetas de precio en la landing, sin importar el orden en que resuelvan `refreshAuth` y `loadCatalog`.

### Alcance

1. Re-renderizar (o repintar la sección de planes) cuando `loadCatalog()` termina y hay una landing/paywall visible, p. ej. `loadCatalog().then(()=>{ if(authReady&&!session&&!window._showAuth)render(); })`.

### Fuera de alcance

- El fallback de planes, el paywall autenticado (REQ-104) y el orden de otras cargas de boot.

### Riesgos

- Un re-render extra en boot; acotarlo a cuando la landing está visible para no repintar la app autenticada.

### Criterios de aceptación

- Con `catalogPlans` poblado tras el primer render, la landing muestra las 2 tarjetas sin interacción del usuario.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Servir en 8923, cargar como visitante sin sesión y confirmar `document.querySelectorAll('.l-plan').length > 0` sin llamar `render()` a mano.

## REQ-152 - Fix onboarding: "Mantenerlo por ahora" en el aviso de revisión de 4 semanas lanza ReferenceError y no cierra ni guarda

**Estado: pendiente.**

### Origen

Journey de **onboarding** (rotación del loop auditor tras REQ-151). Verificación funcional en navegador (preview `fitbud`, 8923, 0 llamadas pagadas): el aviso de revisión "Han pasado 4 semanas" (`maybePromptProfileReview()`, `index.html:3487-3496`) ofrece "Revisar mi plan" (`startOnboarding()`) y "Mantenerlo por ahora" (`keepCurrentProfile()`). Al pulsar "Mantenerlo por ahora" no pasa nada visible: el modal no se cierra.

### Problema

Al pulsar "Mantenerlo por ahora", `keepCurrentProfile()` lanza `ReferenceError: calendarChanged is not defined` **antes** de llamar a `saveProfilePrefs()`, así que:

1. El modal nunca se cierra (`closeModal()` está al final y no se alcanza); el usuario solo puede salir por "Revisar mi plan", que lo manda a rehacer el onboarding (justo lo que quería evitar). Tampoco sale el toast de confirmación.
2. Lo más grave: `onboardingReviewedAt` **no se persiste**, por lo que `profileReviewDue()` sigue devolviendo true y el aviso reaparece cada sesión. El usuario no puede posponer la revisión.

Reproducción (consola): `await keepCurrentProfile()` → `ReferenceError: calendarChanged is not defined`; inyectando el modal real y clicando el botón, el DOM sigue mostrando "Mantenerlo por ahora" (modal abierto).

### Causa raíz

`keepCurrentProfile()` (`index.html:3497-3508`) referencia dos variables fuera de su ámbito: en el objeto que pasa a `saveProfilePrefs()` usa `reason:calendarChanged?...` y `validTo:planEndDate`. `calendarChanged` solo se declara como `const` local en `saveOnboarding()` (`index.html:3434`) y `saveProfile()` (`index.html:6230`); `planEndDate` solo como `let/const` local en `saveOnboarding()` (`index.html:3419`) y `saveProfile()` (`index.html:6229`). Ninguna es global. Con `"use strict"` activo (`index.html:761`), leer una variable no declarada lanza `ReferenceError` al construir el objeto literal, antes del `await`; como la función es `async`, el error queda como rechazo de promesa no manejado desde el `onclick`.

### Objetivo

Que "Mantenerlo por ahora" cierre el aviso, guarde `onboardingReviewedAt` y muestre la confirmación, de modo que la revisión se posponga los días previstos y no vuelva a molestar hasta entonces.

### Alcance

1. En `keepCurrentProfile()`, reemplazar las referencias fuera de ámbito por valores locales válidos: `reason` fijo (p. ej. `"Preferencias guardadas"`, este flujo no cambia el calendario) y `validTo` derivado de los prefs del perfil (`prefs.planEndDate` o `planEndFor(prefs.planStartDate,resolvedPlanDuration(prefs))`).

### Fuera de alcance

- La lógica de `saveOnboarding()`/`saveProfile()` (donde esas variables sí existen) y el resto del ciclo de revisión.

### Riesgos

- Un `validTo` incorrecto escribiría una `plan_versions` con vigencia rara; usar el `planEndDate` ya guardado en prefs mantiene coherencia. Regresión mínima: la función es corta y solo la usa este botón.

### Criterios de aceptación

- "Mantenerlo por ahora" cierra el modal, sin errores en consola, muestra el toast y persiste `onboardingReviewedAt`; el aviso no reaparece antes de `PROFILE_REVIEW_DAYS`.
- `keepCurrentProfile` no referencia `calendarChanged` ni `planEndDate` fuera de ámbito.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- En consola con perfil/sesión válidos: `await keepCurrentProfile()` no lanza `ReferenceError`; el clic en "Mantenerlo por ahora" cierra el modal y persiste `onboardingReviewedAt`.

## REQ-153 - Fix Home: las sugerencias del coach ignoran comidas saltadas (y la pausa por seguridad) y contradicen la agenda

**Estado: pendiente.**

### Origen

Auditoría del journey Home (Hoy): la agenda (`homeAgendaData`) y los chips (`buildContextualChips`) calculan los pendientes por caminos distintos y se contradicen al saltar una comida.

### Problema

Reproducción (plan de 3 comidas + entreno): el usuario **salta el desayuno** (REQ-125), registra almuerzo y cena y completa el entreno. La agenda pasa a `done` ("Todo lo importante de hoy está cubierto") sin listar el desayuno, pero justo debajo el chip dice **"¿Qué como para Desayuno? Me quedan 754 kcal"**, empujando a comer lo que se acaba de saltar. Análogo con `trainingSafetyHold()` activo (ver Causa raíz).

### Causa raíz

`buildContextualChips(ds)` (`index.html:4150`) recalcula pendientes en vez de reusar la agenda: `pendingMeals=day.meals.filter(m=>!mealState(ds,m.id).done)` (`index.html:4154`) filtra solo por `!done`, **no excluye `.skipped`** como sí hace `homeAgendaData` (`index.html:4002-4005`, corregido por REQ-125); el chip usa `pendingMeals[0].slot` (`index.html:4162`). Y `workoutPending` (`index.html:4158`) omite `!safetyHold` que la agenda aplica (`index.html:4006-4007`). Alimenta los chips de `renderHoy` (`index.html:4194`). El mismo filtro sin `.skipped` vive en `nextDailyAction` (`index.html:3836`, al parecer sin uso).

### Objetivo

Que los chips reflejen el mismo estado que la agenda.

### Alcance

1. En `buildContextualChips`, excluir saltadas de `pendingMeals` (`!done && !skipped`), derivando de `homeAgendaData` si es posible.
2. Respetar `trainingSafetyHold()` en `workoutPending`.

### Fuera de alcance

- Rediseñar `COACH_SUGGESTIONS` o `nextDailyAction` (posible código muerto, REQ aparte).

### Riesgos

- Reusar `homeAgendaData` no debe recomputar de más.

### Criterios de aceptación

- Tras saltar una comida ningún chip la propone; con pausa por seguridad ningún chip ofrece el entreno.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E/preview: plan aplicado, `skipMeal` en una comida; `buildContextualChips(ds)` no contiene "¿Qué como para <slot saltado>?".
