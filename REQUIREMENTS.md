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

**Estado: implementado; derogado en parte — el login es OBLIGATORIO (sin modo anónimo). El funnel de visitante se rehace en REQ-25/REQ-33.**

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

## REQ-86 - Fix: caché de coach reutilizaba resultados generados con prompts obsoletos

**Estado: implementado.** `COACH_PROMPT_VERSION` (constante en `index.html`) se incluye en `coachCompatibilityContext`, que alimenta el `contextKey` del sistema de quota. Bumpar la constante invalida todos los resultados reutilizables generados con versiones anteriores del prompt. 3 asserts en `scripts/validate-coach-prompt-version.mjs`.

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

**Estado: implementado.** Onboarding y Perfil capturan gustos/disgustos (`prefs.preferredDishes` nuevo + campos existentes). El prompt de IA recibe `coachLikesLine`; el fallback determinista aplica `preferenceScoreAdjustment` (`js/nutrition-domain.js`) para priorizar afines y penalizar disgustos en generación y reemplazos. Alergias/restricciones duras siguen bloqueando por separado. Detalle en el commit. Verificado con `scripts/release-gate.mjs`.

## REQ-120 - Nutrición: "No me gusta este plato" bloquea futuras sugerencias hasta editar Perfil

**Estado: implementado.** `profile.prefs.blockedDishes` guarda `{key,name}` por plato bloqueado; el planificador determinista y todas las rutas de IA (`dishDietAllowed`, `coachDishBlockedByProfile`, reemplazos y validación de acciones del coach) los excluyen, con refuerzo por prompt. Acción "🚫 No me gusta este plato" desde la comida aplicada y el borrador generado; Perfil > Comidas permite "Volver a sugerir". Días ejecutados no se tocan. Detalle en el commit. Verificado con `scripts/validate-blocked-dishes.mjs` y la suite E2E.

_Origen: feedback de Jonathan (3 jul 2026). Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`._

## REQ-121 - Nutrición: cambios de preferencias regeneran solo futuro y se respetan de inmediato

**Estado: implementado.** Editar preferencias (`preferredIngredients/Dishes/Cuisines`, `dislikedIngredients`, `blockedDishes`) cambia el `contextKey` y no reutiliza pooled/caché viejo; `COACH_PROMPT_VERSION=6` invalida lo previo; `applyDayComidas` no reescribe comidas `done=true`; `homePrepareDay` y "Volver a preparar" rechazan fechas pasadas. Detalle en el commit. Verificado con `scripts/validate-preference-cache-invalidation.mjs`.

## REQ-122 - Fix Nutrición: dietas deben llegar a objetivos o completar con sugerencias aplicables

**Estado: implementado.** Cuando el día generado no cumple objetivo, la revisión ofrece "Reintentar" y "Completar con opción práctica" (`deterministicFromModal`/`applyDeterministicDay`); `aiGenerateDay` cae a determinista tras 2 fallos (`_genDayFailStreak`, reiniciado por `homePrepareDay`); la revisión de semana ofrece completar días faltantes; las restricciones duras siguen bloqueando en toda ruta. Detalle en el commit. Verificado con `scripts/validate-diet-completion-fallback.mjs`.

## REQ-123 - Fix Nutrición: todos los botones "Otra opción" soportan reintentos repetidos con feedback

**Estado: implementado.** Al agotarse el cupo de generaciones frescas, `reserve_coach_action` pasa a `reuse` y devolvía en silencio la misma respuesta pooled (botón "sin efecto"); ahora `/api/claude` marca `reused:true`, `callClaude` lo expone (`lastCoachCallReused`) y `regenerateGenMeal`/`rerollChangeMealOptions`/`regenerateDayInWeekDraft` avisan con toast y descartan la sugerencia repetida por el plato más cercano no mostrado; los modales siempre ofrecen "Reintentar". Verificado con `scripts/validate-retry-feedback.mjs` y `scripts/test-coach-quota.mjs`.

### Origen

Feedback de producto de Jonathan (3 jul 2026): el botón de otra opción no funciona después del primer intento y no da feedback; revisar todos los botones "otra opción".

## REQ-124 - Home y Nutrición: anillo de macros primero y agenda/comidas debajo

**Estado: implementado.** `renderHoy` renderiza `heroDash` (anillo/resumen de macros) antes que `homeAgendaHtml`, reemplazando el orden de REQ-97; `renderNutrition` mueve "Más opciones" al final; el tour guiado apunta primero a `.mini-macro-dash`. "Entrenamiento pendiente con comidas completas" y "día cerrado con racha" ya funcionaban en `homeAgendaData`. Verificado con `scripts/validate-home-macro-ring-first.mjs`.

Nota aparte: el crash de producción para `strength_only` sin actividad ligera quedó corregido en su commit original; faltaba el caso domingo del fixture E2E, cerrado después en REQ-145.

_Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`._

## REQ-125 - Nutrición: reordenar comidas y saltar comidas sin cambiar horarios históricos

**Estado: implementado.** Comidas y extras en una lista ordenable; el orden se guarda en `dayState(ds).mealOrder` (solo visual, nunca slot/horario/macros) y se reconcilia en `dayEffectiveOrder`. Controles subir/bajar (accesibles, sin drag-and-drop) solo para hoy/futuro (`canReorderDay`). Acción "Saltar esta comida" (`skipMeal`/`unskipMeal`, con "Deshacer") no cuenta como pendiente ni consumida (`dayTotals` la excluye) ni aplica sobre una ya registrada; `homeAgendaData` excluye saltadas. Detalle en el commit. Verificado con `scripts/validate-meal-reorder-skip.mjs`.

_Origen: feedback de Jonathan (3 jul 2026). Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`._

## REQ-126 - Admin: resetear futuro y regenerar nutrición/entrenamiento para cualquier usuario

**Estado: implementado.** `api/admin.js` agrega `previewResetPlan`/`applyResetPlan` (alcance nutrition/training/both) y `resetUserToOnboarding`; los días con comida registrada o entreno hecho quedan protegidos, aplicar solo reescribe `day_log.state` de días no protegidos y archiva la versión de plan activa. Panel admin con "Regenerar plan" (vista previa obligatoria) y "Reiniciar usuario" (doble confirmación), bloqueados para la propia cuenta y otros admins. Detalle en el commit. **Infra pendiente:** `supabase/admin_reset.sql` (tabla `admin_actions_log`) requiere aplicarse manualmente en Supabase. Verificado con `scripts/test-admin-reset.mjs`.

Pendiente de infraestructura (no ejecutable por el agente): aplicar `supabase/admin_reset.sql` en el proyecto de Supabase de producción para que `admin_actions_log` exista antes de usar estas acciones (la auditoría falla en silencio — no bloquea la operación principal — si la tabla no existe todavía). Detalle histórico: commit de implementación de REQ-126.

## REQ-127 - Personalizar remitente y asunto de los correos de autenticacion de Supabase (branding Fitbud)

**Estado: pendiente. Requiere accion manual en el dashboard de Supabase (y de un proveedor SMTP externo para el remitente); no implementable por el agente autonomo.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-127`).

## REQ-128 - Contrato estricto único de dieta (`DIET_CONTRACT`) + canario de factibilidad

**Estado: implementado.** Exporta `DIET_CONTRACT`, `dietContractTolerance()` y `validateDietContractTotals()` en `js/nutrition-domain.js` (tolerancias kcal/proteína/carbos/grasa, kcal autoritativa de `ingredients.kcal`), en calibración (`runtimeActive:false`, sin tocar runtime). Canario `scripts/validate-diet-contract.mjs` en el release-gate. Detalle histórico: `docs/requirements-history.md` (buscar `## REQ-128`).

## REQ-129 - `finalizeNutritionDay()` etapa 1: puerta pura dormida y normalización de propuestas

**Estado: implementado.** `finalizeNutritionDay(ctx)` en `js/nutrition-domain.js`, dormida: normaliza propuestas contra catálogo, descarta ingredientes desconocidos, completa slots con fallback determinista, conserva `lockedMeals`, reporta `contract` sin activar `runtimeActive`. Validadores: `validate-diet-contract` (engine `finalizeNutritionDay`) y `validate-finalize-nutrition-day`. Detalle histórico: `docs/requirements-history.md` (buscar `## REQ-129`).

## REQ-130 - Coherencia de preferencias duras y patrón omnívoro activo

**Estado: implementado.** `dislikedIngredients` como exclusión obligatoria en dominio/cliente/proxy; `highProtLine` con fuentes proteicas dinámicas filtradas; patrón omnívoro con warning/reintento suave (sin 422 duro) y relajación si se excluyen carnes/pescado; `COACH_PROMPT_VERSION`=7. Validadores: `validate-nutrition-domain`, `validate-first-day-preferences`, `validate-high-protein-prompt`, `test-coach-quota`. Detalle histórico: `docs/requirements-history.md` (buscar `## REQ-130`).

## REQ-131 - Momento del día, etapa 1: presupuestos por slot y filtro heurístico sin migración

**Estado: implementado.** `generateOneDay()` calcula presupuestos por slot, filtra referencias con `compatibleDishesForSlot`, valida `compatible_slots` y aplica techo de contundencia en slots no principales. Validador: `scripts/validate-slot-budget-prompt.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-131`).

## REQ-132 - Momento del día, etapa 2: metadata de contundencia y cobertura de slots vacíos

**Estado: implementado.** `supabase/nutrition_catalog_semantics.sql` agrega/backfillea `meal_weight` y `meal_form`; dominio/prompt/validadores usan esa metadata para evitar platos contundentes en slots ligeros y reportar cobertura. Acción manual: re-ejecutar la migración semántica en Supabase.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-132`).

## REQ-133 - API del coach: structured outputs, límites y modelo por acción con gate de telemetría para Sonnet 5

**Estado: implementado.** `/api/claude` usa `output_config.format` (JSON Schema) para `diet_day`/`diet_week`/`meal_option` con fallback si Anthropic lo rechaza; capea `maxTokens` en 4096, resuelve modelo por acción vía env (default Haiku 4.5) e incluye `claude-sonnet-5`. `v_coach_model_gate` (`supabase/analytics.sql`, re-ejecutar en Supabase) gatea subir dieta a Sonnet 5 solo con >10% de degradación sostenida.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-133`).

## REQ-134 - Pipeline de crecimiento del catálogo validado por el motor

**Estado: implementado.** `scripts/grow-catalog.mjs` es un pipeline offline (`--fixture` sin red; `--brief` usa `ANTHROPIC_API_KEY` local/CI) que normaliza candidatos contra `supabase/seed.sql`, exige slugs/fuente/metadata/límites, rechaza macros inconsistentes y prueba `solveDishPortion` por slot; emite patch SQL + reporte. Validador `scripts/validate-grow-catalog.mjs` en `release-gate`.

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

**Estado: implementado.** `finalizeNutritionDay()` agrega una pasada global (`globalClosePass`) que hill-climbea sobre los macros del día completo respetando `lineLimits()`/`clampStep()`, y `attemptContractComplement()` añade snack/batido del catálogo compatible si el día sigue fuera de contrato; `runtimeActive` sigue `false`. Canario sube de 39/378 a 122/378 con `failureBreakdown`. Validador: `scripts/validate-finalize-nutrition-day.mjs`. Detalle histórico: `docs/requirements-history.md` (buscar `## REQ-137`).

## REQ-138 - Conectar `finalizeNutritionDay()` en cliente sin activar contrato global

**Estado: implementado.** Conecta los flujos principales de nutrición (`generateOneDay`, determinista, semana, regenerar día y regenerar comida) a `finalizeDayWithGate()`/`finalizeNutritionDay()` sin activar el contrato global; reemplazos quedaron extraídos como REQ-142. Validador: `scripts/validate-nutrition-finalize-wiring.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-138`).

## REQ-139 - Activar `DIET_CONTRACT` en runtime con aviso suave no bloqueante

**Estado: implementado.**
`DIET_CONTRACT.runtimeActive=true`. `dietContractNoticeText(totals,target)` (index.html) evalúa el día ya cerrado (nunca la propuesta cruda) vía `nd.validateDietContractTotals()` y muestra "Tu día quedó cerca de tu meta, no exacto." en `genReviewHtml`/`genWeekReviewHtml` y en los toasts de `applyGeneratedDay`/`applyWeekPlan`/`applyDeterministicDay`. `finalizedDayIsComplete()` sigue siendo el único criterio de "aplicable" (cobertura de slots); ningún flujo bloquea aplicar/guardar por incumplir el contrato. Validador: `scripts/validate-diet-contract-runtime-notice.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-139`).

## REQ-142 - Conectar reemplazos ("Cambiar comida") a `finalizeNutritionDay()`

**Estado: implementado.** `applyChangeMeal()` arma un `ctx` para `finalizeDayWithGate()`/`finalizeNutritionDay()` (`lockedMeals` = comidas del día salvo las futuras candidatas + la recién elegida) en vez de `rebalanceFutureMeals()` (que queda como fallback compatible); escribe los ajustes como `ovr`. Validador: `scripts/validate-nutrition-replacements.mjs`. Detalle histórico: `docs/requirements-history.md` (buscar `## REQ-142`).

## REQ-143 - Catálogo lote 3: crecimiento drástico dirigido por el canario del contrato

**Estado: pendiente. Requiere acción humana (decisión de producto en REQ-147) antes de intentar otro lote; no implementable por el agente autónomo hasta esa decisión.**

Canario `validate-diet-contract.mjs` en 122/378 (32.3%), 100% `catalog_gap`; dos experimentos medidos con `scripts/diff-diet-contract.mjs` (REQ-144) confirmaron un techo ~32-33% bajo la selección local de `planDeterministicNutritionDay()`/`globalClosePass()`. Ningún lote nuevo se comiteó. Detalle completo (experimentos, objetivo/alcance/criterios si se retoma tras REQ-147): `docs/requirements-history.md` (buscar `## REQ-143`).

## REQ-144 - Medir impacto incremental de catálogo contra el canario antes de aceptar platos nuevos

**Estado: implementado.** `scripts/diff-diet-contract.mjs` compara dos `seed.sql` y reporta el delta de `okDays` total, catálogo, causas y las 54 dimensiones; `scripts/validate-diet-contract-diff.mjs` lo valida y el release gate lo ejecuta. Detalle, motivación (REQ-143) y guía operativa: `docs/diet-contract-catalog-diff.md` y REQ-143 de `docs/requirements-history.md`.

## REQ-145 - Fix E2E: el fixture de entreno deja "hoy" sin sesión de fuerza los domingos y pone el release-gate en rojo

**Estado: implementado.** El perfil E2E usa `trainingPriority:"strength"` para que los 4 slots sean de fuerza aun cuando Domingo quede ultimo tras la normalizacion Lunes..Domingo; `trainingDaysIncludingToday(referenceDate)` permite validar los 7 dias y `scripts/validate-e2e-training-fixture.mjs` queda en el release gate. No se modifico runtime de la app. Detalle historico: `docs/requirements-history.md` (buscar `## REQ-145`).

## REQ-146 - Unificar el cálculo de racha: Progreso muestra "0 / racha rota" mientras hoy no se registra

**Estado: implementado.**
`streakStats()` (`index.html`) comparte ahora el criterio de `streak()`: el día en curso que aún no cumple no resetea `nutCur`/`trainCur`/`combCur`, solo un día ya vencido sin cumplir lo hace; `combBest` no cambia de fórmula, así que hitos y mejor racha no se alteran retroactivamente. `renderStreakSection()` no se tocó: al unificarse `combCur` con `streak()`, el banner de recuperación deja de dispararse solo por "hoy pendiente". Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/racha.spec.js`.

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

**Estado: implementado.**
`handleRefund()` (`api/webhook.js`) solo revoca cuando `charge.refunded===true` o `Number(charge.amount_refunded)>=Number(charge.amount)`; un reembolso parcial devuelve `skipped` (queda auditado en `billing_events` con el payload completo, sin tocar el entitlement). Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-webhook-refund.mjs`.

## REQ-149 - Fix admin: "Regenerar plan · Solo nutrición" archiva también el entrenamiento futuro

**Estado: implementado.**
`fetchActivePlanVersion()` (`api/admin.js`) ahora trae `snapshot`; `applyResetPlan(scope="nutrition")` sigue archivando (`superseded`) la fila activa combinada, pero si `snapshot.trainingPlan` tiene contenido real (`planVersionHasTrainingContent()`), `insertTrainingOnlyVersion()` inserta una nueva fila activa (mismo `cycle_number`, próximo `version_number`) que conserva `trainingPlan` intacto con `nutritionPlan:null` desde `fromDate` — el entrenamiento futuro no pierde su prescripción y la nutrición sí cae a generación fresca, que es el efecto deseado. La fila vieja se supersede ANTES del insert, así nunca hay dos filas activas a la vez para `plan_versions_one_active_idx`. `previewResetPlan()` expone `willPreserveTraining` (sin filtrar el `snapshot` completo hacia el cliente) y el copy del modal admin distingue "se conserva el entrenamiento" de "se archiva el plan de nutrición". `scope="training"`/`"both"` sin cambios. Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-admin-reset.mjs` (2 casos nuevos: preview y apply sobre fila combinada).

## REQ-150 - PWA sirve HTML nuevo con JS del cache viejo tras un deploy (versión mezclada)

**Estado: implementado.**
`service-worker.js`: la navegación ahora usa `cacheFirst(request,"./index.html")` en vez de `networkFirst` — se sirve desde la MISMA `CACHE_NAME` que los `.js` (`cacheFirst` sin cambios), así que HTML y JS siempre son de la misma generación; la versión nueva llega completa recién cuando el SW nuevo instala y activa (atómico vía `cache.addAll`). `CACHE_NAME` subido a `v69`. `registerServiceWorker()` (`index.html`) escucha `updatefound`/`statechange` y, cuando detecta una instalación real (no la primera) vía `navigator.serviceWorker.controller` ya presente, muestra un badge discreto ("↻ Actualizar", sin vocabulario técnico) en vez de recargar sola — recargar automáticamente podía interrumpir una acción en curso. Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-service-worker-cache.mjs` (ejecuta el SW real en `node:vm` con `caches`/`fetch` simulados).

## REQ-151 - Landing muestra la sección "Planes" vacía cuando el catálogo carga después del primer render

**Estado: implementado.**
`boot()` (`index.html`) encadena `loadCatalog().then(()=>{if(authReady&&!session&&!window._showAuth)render();})` en vez de dejarla en paralelo sin seguimiento: si `refreshAuth()` gana la carrera y pinta la landing antes de que `catalogPlans` esté poblado, el `then` repinta al resolver el catálogo, acotado a cuando la landing sigue visible (no repinta la app autenticada). Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/navegacion.spec.js` (retraso artificial de `/api/catalog`; confirmado que el test falla sin el fix y pasa con él).

## REQ-152 - Fix onboarding: "Mantenerlo por ahora" en el aviso de revisión de 4 semanas lanza ReferenceError y no cierra ni guarda

**Estado: implementado.**
`keepCurrentProfile()` (`index.html`) ya no referencia `calendarChanged`/`planEndDate` (variables locales de `saveOnboarding()`/`saveProfile()`, fuera de su ámbito, causaban `ReferenceError` bajo `"use strict"` antes del `await`): usa `reason:"Preferencias guardadas"` fijo (este flujo nunca cambia el calendario) y `validTo` de `prefs.planEndDate` ya guardado, o `planEndFor(prefs.planStartDate,resolvedPlanDuration(prefs))` si faltara. Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/onboarding.spec.js` (confirmado que el test falla exactamente como describe el REQ contra el código sin el fix y pasa con él).

## REQ-153 - Fix Home: las sugerencias del coach ignoran comidas saltadas (y la pausa por seguridad) y contradicen la agenda

**Estado: implementado.**
`buildContextualChips(ds)` (`index.html`) ahora excluye comidas `.skipped` de `pendingMeals` (igual que `homeAgendaData`, REQ-125) y agrega `!trainingSafetyHold()` a `workoutPending`, así los chips nunca sugieren una comida recién saltada ni el entrenamiento mientras hay una pausa por seguridad activa — mismo criterio que ya usa la agenda, sin tocar `COACH_SUGGESTIONS`/`nextDailyAction` (fuera de alcance). Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/home.spec.js` (nuevo; confirmado que ambos casos fallan exactamente como describe el REQ contra el código sin el fix y pasan con él).

## REQ-154 - Fix Nutrición: "Cambiar comida" guarda la porción escalada pero la tarjeta muestra (y suma) los macros de la receta base

**Estado: implementado.**
`mealValue()` (`index.html`) gana una rama antes del recálculo por `dishMacros()`: si el override es un reemplazo materializado (`ovr.gen&&ovr.dishName!=null&&ovr.kcal!=null`, la forma que arman `applyChangeMeal()` y el rebalanceo de REQ-142), honra `ovr.kcal/p/c/f` en vez de recalcular desde la receta base sin escalar. Los dos caminos preexistentes (dishName sin kcal → `dishMacros()`; kcal sin dishName → "custom") quedan intactos. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-meal-value-replacement.mjs` (mealValue() real vía `node:vm` contra un candidato real de `rankReplacementCandidates()`).

## REQ-155 - Fix reproductor de entreno: "duración real" cuenta el tiempo con la app cerrada

**Estado: implementado.**
`freezeInProgressWorkouts()` (`index.html`) trata el cierre/segundo plano como pausa implícita: en `visibilitychange` (oculto) y `pagehide`, congela `elapsedSeconds` y limpia `resumedAt` (misma `captureWorkoutElapsed()` que ya usa la pausa manual) para cualquier `workoutExecution` `in_progress`, y persiste con `commitDay`. Al volver, `WORKOUT_PLAYER.normalizeExecution()` ya resetea `resumedAt` a "ahora" porque queda en `null` (lógica preexistente de pausa/reanudación), así que el cronómetro retoma sin sumar el hueco. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/entreno.spec.js` (confirmado que el test falla exactamente como describe el REQ contra el código sin el fix).

### Origen

Auditoría del journey **entrenamiento** (2026-07-18). Verificación funcional del reproductor recuperable (REQ-16/92) con Playwright + fixtures E2E (0 llamadas pagadas).

### Problema

El usuario inicia una sesión guiada y la deja "En curso" sin tocar "Pausar sesión" (típico en móvil: la pantalla se bloquea, se cierra o se cambia de app, hay una interrupción). Al reabrir la app horas después y tocar "Finalizar y guardar sesión", el cronómetro y la tarjeta "duración real" cuentan todo el tiempo transcurrido —incluidas las horas con la app cerrada— como tiempo de entrenamiento. Reproducción: sesión iniciada, 0 actividad extra, `resumedAt` a 2 h atrás → el `.player-clock` muestra `02:00:00` y el registro guardado queda con `elapsedSeconds=7200` ("duración real: 2h 00m") para una sesión de minutos reales.

### Causa raíz

`WORKOUT_PLAYER.elapsedSeconds` (`workout-player.js:366-373`) suma `(now - resumedAt)` mientras el estado es `in_progress`. `resumedAt` solo avanza al reanudar (`index.html:4554,4746`) y el acumulado solo se congela al pausar (`captureWorkoutElapsed`, `index.html:4520-4522`). Nada congela el tiempo cuando la app se cierra o pasa a segundo plano con la sesión en curso; al reabrir, `normalizeExecution` (`workout-player.js:337`) conserva el `resumedAt` guardado para sesiones `in_progress`. `finishWorkoutExecution` (`index.html:4731`) persiste ese valor inflado como "duración real" en el resumen inmutable (`renderWorkoutExecution`, `index.html:4854`).

### Objetivo

Que "duración real" refleje el tiempo realmente ejercitado, no el reloj de pared con la app cerrada.

### Alcance

1. Tratar el cierre/segundo plano como pausa implícita del cronómetro: congelar `elapsedSeconds` y limpiar `resumedAt` en `visibilitychange`/`beforeunload`, o acotar el salto de `resumedAt` al reabrir antes de acumular.
2. Aplicar el mismo tope al valor que `captureWorkoutElapsed` persiste en el cierre.

### Fuera de alcance

- El diseño del reproductor recuperable y la pausa manual (siguen igual).
- Rachas/cumplimiento (no dependen de `elapsedSeconds`).

### Riesgos

- Un tope por inactividad puede subestimar sesiones largas legítimas; elegir umbral y evento de congelado con cuidado (`visibilitychange` vs. `beforeunload` en PWA/iOS).

### Criterios de aceptación

- Iniciar sesión, cerrar/segundo plano sin pausar y reabrir: cronómetro y "duración real" no incluyen el tiempo con la app cerrada.
- Pausar manualmente sigue congelando el tiempo como hoy.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Repro Playwright (0 llamadas pagadas): iniciar sesión, fijar `resumedAt` a 2 h atrás con la app "cerrada" y finalizar → `elapsedSeconds` acotado, no 7200; `.player-clock` no salta a `02:00:00`.

## REQ-156 - Fix aislamiento: el cierre de sesión por evento (token expirado / logout remoto / otra pestaña) no purga la cola offline del usuario anterior

**Estado: implementado.**
El handler `onAuthStateChange` (`index.html`) captura `prevUid=uid()` **antes** de reasignar `session=sess||null`, y lo pasa a `clearSignedOutState(prevUid)` en el evento `SIGNED_OUT`; sin ese cambio, `session` ya quedaba en `null` cuando `clearSignedOutState()` calculaba su propio `uid()`, y la purga de la cola offline del usuario saliente se saltaba. `clearSignedOutState(prevUid)` ahora acepta el uid como parámetro opcional (fallback a `uid()` si no se pasa), así que el botón "Cerrar sesión" y el borrado de cuenta —que llaman sin argumento mientras la sesión sigue seteada— quedan sin cambios. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/sync-isolation.spec.js` (dispara `supa.auth.signOut()` directo, el mismo evento que un token vencido o logout remoto; confirmado que el test falla exactamente como describe el REQ contra el código sin el fix).

### Origen

Auditoría del journey **auth-roles** (rotación del loop auditor tras REQ-155). Verificación funcional en navegador (preview `fitbud`, servidor local 8923, 0 llamadas pagadas), ejercitando las funciones reales de sesión de la app. El invariante bajo prueba es el aislamiento entre usuarios en un dispositivo compartido, declarado explícitamente en el código (`index.html:1824` "Descarta toda la cola del usuario al cerrar sesión (aislamiento entre usuarios en el dispositivo)." y `index.html:9622` "aislar cola: no exponer datos al próximo usuario") y en `docs/requirements-history.md:1539` ("La cola se aísla por usuario en `clearSyncQueueForUser()` al detectar cierre de sesión.").

### Problema

La purga de la cola offline (`fitbud_syncq_v1`, que contiene payloads de `day_log`/`weight_log` con datos de salud del usuario: peso, comidas, ejecución de entreno) **solo ocurre cuando el usuario pulsa "Cerrar sesión"**. Cualquier cierre de sesión que llegue por el evento `onAuthStateChange('SIGNED_OUT')` — token/refresh vencido al reabrir la app, revocación remota de la sesión, "cerrar sesión en todos los dispositivos", o logout propagado desde otra pestaña — **deja intactas en el `localStorage` del dispositivo las mutaciones encoladas del usuario anterior**, contradiciendo el invariante de aislamiento.

Reproducción funcional (ejecutada contra las funciones vivas de la app servida en 8923, sin sesión real ni mutación de producción):

1. Sembrar la cola con una mutación `day_log` del `userA` con datos de salud (`state.weights["2026-07-28"]=81.4`, `state.meals.m1={done:true,kcal:640}`) y `session={user:{id:"userA"}}`.
2. **Ruta A — botón "Cerrar sesión"** (orden real de `signOutUser`→`clearSignedOutState` con `session` aún seteada): entradas de `userA` en la cola pasan de `1 → 0` (purgada correctamente). ✔
3. **Ruta B — evento `SIGNED_OUT`** (orden real del handler: `session=sess||null` y luego `clearSignedOutState()`): entradas de `userA` pasan de `1 → 1`. **La cola con datos de salud de `userA` persiste.** ✘

Impacto: en un dispositivo compartido (familia, kiosco de gimnasio), tras un cierre de sesión no iniciado por el botón, los payloads de salud del usuario anterior quedan en el `localStorage` del dispositivo de forma indefinida y la cola crece sin acotar entre sesiones. No es una fuga visible en la UI del siguiente usuario —`drainSyncQueue` (`index.html:1933`) y `_updateSyncBadge` (`index.html:1862`) filtran por `x.uid===uid()`, así que `userB` no drena ni ve la cola de `userA`—, pero sí es una violación directa del invariante de aislamiento declarado y una retención de datos de salud personales en el dispositivo que el diseño promete borrar.

### Causa raíz

Dependencia de orden entre el handler del evento y `clearSignedOutState()`. El handler `onAuthStateChange` (`index.html:11385-11394`) hace primero `session=sess||null` (`index.html:11386`) y **después** `clearSignedOutState()` (`index.html:11388`). Pero `clearSignedOutState()` calcula el usuario a purgar leyendo la sesión: `const prevUid=uid();` (`index.html:9610`), y `uid()` devuelve `session&&session.user?session.user.id:null` (`index.html:9321`). Como el handler ya puso `session=null`, `prevUid` es `null`, y la purga `if(prevUid)clearSyncQueueForUser(prevUid)` (`index.html:9622`) se salta por completo; aunque no se saltara, `clearSyncQueueForUser(null)` filtra `x.uid!==null` (`index.html:1825-1826`), que **no** elimina las entradas del usuario real. La ruta del botón funciona solo por accidente de orden: `signOutUser` (`index.html:9637`) invoca `clearSignedOutState()` (`index.html:9644`) mientras `session` sigue seteada, por lo que ahí `prevUid` sí es correcto. La ruta de borrado de cuenta (`deleteMyAccount`→`clearSignedOutState`, `index.html:6512`) también conserva `session`, así que igualmente purga; el único camino defectuoso es el evento `SIGNED_OUT`.

### Objetivo

Que la cola offline del usuario que cierra sesión se purgue **en todos los caminos** de cierre (botón, borrado de cuenta y evento `SIGNED_OUT` por expiración/revocación/otra pestaña), cumpliendo el aislamiento entre usuarios que el código ya promete.

### Alcance

1. Purgar la cola con el `uid` correcto también en la ruta por evento. Opción mínima: en el handler `SIGNED_OUT` (`index.html:11388`), capturar `prevUid=uid()` **antes** de reasignar `session` (o pasar el `uid` a `clearSignedOutState`), y no nullificar `session` en `index.html:11386` hasta después de la purga.
2. Alternativa robusta: que `clearSignedOutState()` acepte un `prevUid` explícito (con fallback al `uid()` actual) para no depender del orden de asignación de `session`.

### Fuera de alcance

- El motor de sincronización, el filtrado por `uid` de `drainSyncQueue`/`_updateSyncBadge` (que ya evita la fuga en UI) y la lógica de conflictos.
- La limpieza de otras cachés por usuario (chat `fitbud_chat_v1_*`, etc.), que se resuelve por clave distinta de `uid` y no está en el alcance de este REQ atómico.
- El comportamiento del botón "Cerrar sesión" y de `deleteMyAccount`, que ya purgan correctamente.

### Riesgos

- Retrasar la nullificación de `session` en el handler podría afectar a código que corre entre medias; acotar el cambio a capturar `prevUid` primero y purgar, manteniendo el resto del orden.
- `drainSyncQueue` corre en `onAuth` del siguiente usuario; confirmar que la purga ocurre antes de que otro usuario inicie sesión (el handler es síncrono hasta `clearSignedOutState`, así que basta con el orden correcto).

### Criterios de aceptación

- Tras un evento `SIGNED_OUT` (token vencido / logout remoto / otra pestaña) con mutaciones encoladas del usuario saliente, `_getSyncQ().filter(x=>x.uid===prevUid).length === 0`.
- El botón "Cerrar sesión" y `deleteMyAccount` siguen purgando la cola como hoy.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Repro en consola contra las funciones vivas (0 llamadas pagadas): sembrar `_setSyncQ([{uid:"userA",entity:"day_log",…,status:"pending"}])`, fijar `session={user:{id:"userA"}}`, luego `session=null; clearSignedOutState();` y confirmar que la cola de `userA` queda vacía tras el fix (hoy queda en 1).
- Añadir un test de aislamiento (patrón `scripts/test-sync-conflicts.mjs`) que afirme la purga en el camino por evento.

## REQ-157 - Fix billing: renovar antes de vencer no acumula los días ya pagados

**Estado: implementado.**
`handleCheckoutCompleted()` (`api/webhook.js`) busca el entitlement vigente del usuario (`status in (active,courtesy)`, `expires_at>now`, el de vencimiento más lejano) antes de crear la fila nueva; usa `max(now, ese vencimiento)` como base tanto de `starts_at` como de `expires_at` (suma la duración del plan comprado desde ahí), en vez de contar siempre desde "ahora". Sin entitlement vigente el comportamiento es idéntico a hoy. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-webhook-renewal.mjs` (3 casos: sin entitlement, 20 días vivos + mensual → ~50 días, trimestral vivo + mensual → ~120 días; confirmado que el caso de renovación falla exactamente como describe el REQ contra el código sin el fix).

### Origen

Journey `facturacion`: al recorrer compra→webhook→entitlement, una segunda compra ignora el entitlement activo del usuario.

### Problema

Con plan activo, volver a pagar (botón "Renovar plan", visible a ≤14 días; `index.html:6752`) crea un entitlement `starts_at=now, expires_at=now+duración` sin sumar el tiempo restante. Con 20 días vivos + mensual nuevo pasa de `now+20` a `now+30` (debería `now+50`): se pierden 20 días ya pagados. Peor: si el plan activo vence después que el nuevo (trimestral vivo + compra mensual), el GET (`order=expires_at.desc&limit=1`, `api/entitlement.js:248`) conserva la fila más larga y la compra suma 0 días de acceso.

### Causa raíz

`handleCheckoutCompleted` (`api/webhook.js:113-114`) calcula `expiresAt = now + PLAN_DURATION_DAYS[planId]` incondicionalmente; nunca consulta el entitlement activo del usuario para extender desde su `expires_at`.

### Objetivo

Recomprar/renovar suma la nueva duración al vencimiento vigente, sin perder días ni pagos.

### Alcance

1. En `handleCheckoutCompleted`, buscar el entitlement activo del usuario y usar `max(now, expires_at vigente)` como base de `starts_at`/`expires_at`.

### Fuera de alcance

- Reembolsos (REQ-148); prorrateo entre planes distintos.

### Riesgos

- Conservar el guard de idempotencia por `payment_ref` para no duplicar en reintentos de webhook.

### Criterios de aceptación

- Comprar con plan activo extiende desde el vencimiento vigente; ninguna compra resta días.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Arnés con `fetch` mockeado que envía un segundo `checkout.session.completed` mientras existe un entitlement activo y afirma `expires_at = vencimiento vigente + duración`.

## REQ-158 - Panel admin: "Cambiar contraseña" no protege a otros administradores (toma de cuenta entre admins)

**Estado: implementado.**
`setPassword` (`api/admin.js`) ahora resuelve `targetProfile` y rechaza con 409 cuando `userId!==caller&&targetProfile.is_admin` — mismo invariante que ya protegía `setActive`/`resetUserToOnboarding`; sobre uno mismo o un usuario normal sigue funcionando igual. `adminUsersHtml()` (`index.html`) deshabilita el botón "Cambiar contraseña" con el patrón `u.is_admin&&!me` (no `me||u.is_admin`, para no bloquear el cambio de la propia contraseña). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-admin-api.mjs` (3 casos: otro admin rechazado, uno mismo y usuario normal aceptados; confirmado que el rechazo falla exactamente como describe el REQ contra el código sin el fix) y verificación visual manual de `adminUsersHtml()` con filas admin-propio/admin-ajeno/usuario normal.

### Origen

Auditoría del journey **administración** (panel "Usuarios"). Commit previo leído: `57a15b5` (REQ-145). Se revisó el guardado de acciones admin sobre otros administradores en `api/admin.js` y `index.html`.

### Problema

Un administrador puede fijar la contraseña de **otro** administrador (y luego iniciar sesión como él) sin ninguna barrera. REQ-126 dejó establecido el invariante de que las acciones sensibles del panel están "deshabilitadas para la propia cuenta y para otros administradores" (ver ledger de REQ-126). Ese invariante se cumple para "Desactivar" (bloquea al último admin y a uno mismo), "Regenerar plan" y "Reiniciar usuario" (deshabilitados para `me||u.is_admin`), pero **no** para "Cambiar contraseña", que es la acción más poderosa: cambia la credencial y habilita impersonación. Reproducción: como admin, abrir el panel de usuarios → en la fila de otro administrador, el botón "Cambiar contraseña" está activo → fijar una contraseña nueva → esa cuenta admin queda tomada. El servidor la acepta sin verificar que el objetivo sea admin ni distinto del que llama.

### Causa raíz

- API: la acción `setPassword` (`api/admin.js:730-744`) solo valida formato de UUID, longitud de contraseña y existencia del usuario; **no** comprueba `targetProfile.is_admin` ni `userId===caller`. Contrasta con `setActive` (`api/admin.js:702-705` self, `715-718` último admin), `resetUserToOnboarding` (`api/admin.js:431-435` self, `442-446` admin) y `prepareTestUser` (`api/admin.js:756-768`), que sí bloquean objetivos admin/self.
- UI: `adminUsersHtml` (`index.html:10231`) renderiza `Cambiar contraseña` sin el atributo `disabled` que sí aplica a Desactivar (`index.html:10230`, `me`) y a Regenerar/Reiniciar (`index.html:10235-10236`, `me||u.is_admin`).

### Objetivo

Un administrador no puede tomar la cuenta de otro administrador cambiándole la contraseña desde el panel; la protección de cuentas admin es consistente entre todas las acciones sensibles.

### Alcance

1. En `setPassword` (`api/admin.js`), rechazar (409) cuando el `userId` objetivo es admin y distinto del que llama; permitir que el admin cambie su propia contraseña.
2. En `adminUsersHtml` (`index.html`), deshabilitar el botón "Cambiar contraseña" para otras cuentas admin (patrón `u.is_admin&&!me`), conservándolo habilitado para la propia cuenta.

### Fuera de alcance

- "Enviar reset" (recuperación por correo que controla el propio usuario) y el resto de acciones ya guardadas.
- Rediseñar el modelo de roles o añadir niveles de admin.

### Riesgos

- No romper el caso legítimo de que un admin cambie su propia contraseña.
- Mantener alineadas la barrera de UI y la de servidor (el servidor es la que realmente protege).

### Criterios de aceptación

- `setPassword` sobre otro admin devuelve error y no altera la credencial; sobre uno mismo o sobre un usuario normal sigue funcionando.
- En el panel, "Cambiar contraseña" aparece deshabilitado en filas de otros administradores.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Extender `scripts/test-admin-api.mjs` con un caso: `setPassword` con `userId` de otro admin → rechazado; con el propio o con un usuario normal → aceptado.
- Evidencia funcional (esta auditoría): render de `adminUsersHtml` con `uid()` = admin-A y filas [admin-A, admin-B, usuario normal] → en la fila de admin-B, `Regenerar plan`/`Reiniciar usuario` salen `disabled` pero `Cambiar contraseña` y `Desactivar` quedan habilitados (screenshot del panel mock, 0 errores de consola).

## REQ-159 - El service worker cachea respuestas de error (404/500) y envenena el cache

**Estado: implementado.**
`service-worker.js` agrega `isCacheableResponse(response)` (ok, o `type==="opaque"` para no romper respuestas cross-origin sin CORS como el CDN) y la usa antes de todo `cache.put` en `cacheFirst`/`networkFirst`/`staleWhileRevalidate`; `networkFirst` además, si la red responde no-OK, prefiere la copia cacheada válida en vez de servir/guardar el error. `CACHE_NAME` subido a `v70`. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-service-worker-cache.mjs` (2 casos nuevos: un 404 nunca queda cacheado y el servidor se autorepara al recuperarse; un 500 no sobrescribe un shell bueno ya cacheado; confirmado que ambos fallan exactamente como describe el REQ contra el código sin el fix).

### Origen

Journey `pwa`: verificación en navegador (SW `fitbud-pwa-v68` activo, servidor 8923). Distinto de REQ-150 (mezcla de versiones): aquí una respuesta **no-OK** se guarda y se sirve como buena.

### Problema

Ante un error transitorio (deploy en curso, hiccup del edge, URL de Storage vencida), el SW guarda la respuesta de error y la re-sirve hasta que cambie `CACHE_NAME`. En `cacheFirst` (assets, `.js` del shell, media de ejercicios), un 404/500 queda cacheado y se re-sirve aunque el servidor ya se recuperó: el asset/demo queda roto sin autorreparación. En `networkFirst` (navegación y `config.js`), un 500 de la red **sobrescribe** el último shell bueno; al recargar offline se sirve el 500 cacheado.

### Causa raíz

`service-worker.js`: `cacheFirst` (69-76), `networkFirst` (78-87) y `staleWhileRevalidate` (124-133) hacen `cache.put(request, response.clone())` **sin verificar `response.ok`**. `fetch` solo rechaza ante fallo de red, no ante 4xx/5xx, así que los errores entran al cache como válidos. No hay ningún check de `.ok`/`status` en el archivo.

### Objetivo

Que una respuesta de error nunca reemplace ni contamine una entrada de cache; el usuario nunca queda con un asset/shell roto de forma persistente por un error transitorio.

### Alcance

1. En los tres helpers, `cache.put` solo cuando `response && response.ok`.
2. En `networkFirst`, si la red responde no-OK, no sobrescribir el cache y preferir la copia cacheada válida.

### Fuera de alcance

- Mezcla de versiones HTML/JS (REQ-150), bump de `CACHE_NAME` y estrategia de `/api/*`.

### Riesgos

- No romper el precache del install (`addAll` ya falla atómico ante no-OK).
- Cuidar respuestas opacas (`type:"opaque"`, status 0) de CDN.

### Criterios de aceptación

- Un 404/500 no queda cacheado ni se re-sirve tras la recuperación.
- Un 500 en navegación no sobrescribe el shell bueno; offline sirve el válido.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Arnés que carga `service-worker.js` real con `fetch` mockeado 503/500: hoy `cacheFirst` re-sirve el 503 tras recuperación y `networkFirst` sobrescribe el shell bueno.
- Navegador: `fetch` a un asset mismo-origen inexistente → hoy `caches.match` en `fitbud-pwa-v68` devuelve un 404 cacheado.

## REQ-160 - Fix check-in semanal: el ajuste de calorías ignora las metas "volumen" y "mantenimiento"

**Estado: implementado.**
`analyzeCheckinAnswers()` (`index.html`) ramificaba por `goal==="surplus"`/`"maintain"`, vocabulario que el perfil nunca guarda (usa `deficit`/`mantenimiento`/`volumen`); ambas metas caían siempre en la rama de déficit. Cambiadas las dos comparaciones a `goal==="volumen"`/`"mantenimiento"`, sin tocar los umbrales/ajustes ya existentes (0.15–0.6 kg/sem sin ajuste en volumen, |Δ|>0.4 kg/sem corrige en mantenimiento) ni `CHECKIN_MAX_KCAL_ADJUST`/`CHECKIN_MIN_KCAL`. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-checkin-goal-mapping.mjs` (ejecuta la función real extraída de `index.html` en `node:vm`, cubriendo las 3 metas; confirmado que volumen/mantenimiento fallan exactamente como describe el REQ contra el código sin el fix).

### Origen

Auditoría del journey de onboarding, siguiendo el valor `goal` (`#ob_goal`, index.html:2955-2957) hasta sus consumidores.

### Problema

El check-in semanal (REQ-20) ramifica por `goal==="surplus"`/`"maintain"`, pero el perfil solo guarda `deficit`/`mantenimiento`/`volumen`: ambas caen en el `else` (déficit). `volumen` ganando +0.4 kg/sem RECORTA 100 kcal/día ("El peso subió esta semana"), saboteando la masa; `mantenimiento` bajando -0.5 kg/sem no recibe ajuste (déficit tolera hasta -0.8). Solo `deficit` funciona.

### Causa raíz

`analyzeCheckinAnswers`, index.html:11187/:11191 ramifica por `surplus`/`maintain`; el vocabulario real es `deficit`/`mantenimiento`/`volumen` (`#ob_goal` :2955-2957; `buildWeightRanges` :1459 sí usa `volumen`).

### Objetivo

En volumen la ganancia esperada no recorta calorías; en mantenimiento la deriva se corrige en cualquier dirección.

### Alcance

1. Mapear las ramas al vocabulario real (o normalizar `goal`) en `analyzeCheckinAnswers`.
2. Cobertura determinista de las 3 metas.

### Fuera de alcance

- Umbrales kcal/kg y demás señales (hambre, energía, seguridad).

### Riesgos

- Cambia el ajuste para usuarios en curso; conservar `CHECKIN_MAX_KCAL_ADJUST`/`CHECKIN_MIN_KCAL`.

### Criterios de aceptación

- `volumen` ganando 0.15–0.6 kg/sem: `calorieAdjust===0`; <0.15: +kcal.
- `mantenimiento` con |Δ|>0.4 kg/sem: corrección en el signo esperado.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `analyzeCheckinAnswers` con las 3 metas y pesos límite (arnés determinista, 0 llamadas).

## REQ-161 - Fix Home: marcar comidas "Sin asignar" (0 kcal) como hechas infla el contador y la racha

**Estado: implementado.**
`mealHasContent(v)` (`index.html`) centraliza el criterio de "contenido real" (nombre o algún macro), igual que ya exigía `homeDayHasPreparedMeals`. `toggleMeal()` ignora el intento de marcar como hecha una comida sin contenido (toast explicativo); el botón `.chk` en `mealCard()` sale `disabled` en ese caso. `dayTotals()` y `nutritionDayDone()` solo cuentan como cumplida la comida `done` que además tenga contenido real, como defensa adicional si `done:true` llegara por otra vía. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/home.spec.js` (confirmado que el test falla exactamente como describe el REQ contra el código sin el fix); ajustado el fixture de `tests/e2e/racha.spec.js` (REQ-146) para que sus días "cumplidos" simulen comidas con contenido real, ya que antes se apoyaba en el comportamiento que este REQ corrige.

### Origen

Journey `home` (Hoy), logueado con la suite E2E (REQ-96): día sin preparar → marcar los slots vacíos en Nutrición → volver a Home.

### Problema

En un día sin preparar cada slot se muestra "Sin asignar — … 0 kcal" pero con su check activo. Al tocar los tres checks (clics reales), Home se contradice en la misma pantalla: el anillo dice "0/2200 kcal · 3/3 comidas" y el header "🔥 1", mientras la agenda dice "Aún falta preparar este día". `nutritionDayDone`/`combinedDayDone` dan `true` con 0 kcal, así que la racha (métrica de retención) y los hitos se acreditan por días sin nutrición real.

### Causa raíz

`mealCard` (`index.html:4993`) pinta el botón `.chk` sin `disabled` aunque la comida esté vacía (`v.name` vacío, `v.kcal===0`) y `toggleMeal` (`index.html:5054`) alterna `ms.done` sin mirar contenido. Aguas abajo `dayTotals` (`index.html:2251`) la suma a `doneMeals`/`totMeals` y `nutritionDayDone` (`index.html:9346`) usa `done>=ceil(meals/2)` sobre el estado, no el contenido, así que `streak()`/`combinedDayDone` (`index.html:9416,9488`) suben. En cambio `homeDayHasPreparedMeals` (`index.html:3916`) sí exige contenido: por eso la agenda queda en "setup" y contradice al anillo.

### Objetivo

Una comida sin contenido no debe contar como cumplida (ni en "N/N comidas" ni en `nutritionDayDone`/racha/hitos), y Home no debe afirmar a la vez "N/N comidas + racha" y "aún falta preparar este día".

### Alcance

1. Impedir registrar una comida vacía: deshabilitar el check en `mealCard` cuando `mealValue` no tiene nombre ni macros, o que `toggleMeal` la ignore.
2. Que `dayTotals` y `nutritionDayDone` cuenten como cumplida solo la comida con contenido real.

### Fuera de alcance

- Divergencia `streak()` vs `streakStats().combCur` del día en curso (REQ-146); empty states (REQ-57); umbrales de hito.

### Riesgos

- No romper el registro de comidas ya preparadas, de extras (que sí tienen contenido) ni de días pasados ya marcados.

### Criterios de aceptación

- Con día sin preparar, marcar slots vacíos no acredita "N/N comidas" ni racha, y agenda y anillo coinciden.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Repetir el flujo del Origen: tras marcar los slots vacíos, Home no debe mostrar "3/3 comidas" ni "🔥 1", y la agenda no debe contradecir al anillo.

## REQ-162 - Fix Nutrición: la tarjeta y la suma del día muestran la receta base del catálogo, no los macros materializados del plan

**Estado: implementado.**
`mealValue()` y `mealRecipe()` (`index.html`) ahora priorizan `base.src==="nutritionPlan"` (con `base.kcal>0`/`base.ingredientes`) sobre la resolución por `dishName` en el catálogo, siempre que no haya un override que cambie de plato (`!o||o.dishName==null`) — si el usuario reemplazó la comida (REQ-154), esa ruta sigue ganando. Sin snapshot materializado, la resolución por catálogo sigue funcionando igual que antes (compatibilidad). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-nutritionplan-priority.mjs` (4 casos: snapshot gana al catálogo en macros e ingredientes, un reemplazo explícito sigue ganando al snapshot, y sin snapshot la compatibilidad con catálogo no se rompe; confirmado que el caso principal falla exactamente como describe el REQ —165 vs 495 kcal— contra el código sin el fix).

### Origen

Auditoría del journey Nutrición. Tras "Preparar mi día" → "Aplicar al día", cada comida del snapshot `nutritionPlan` (REQ-82) se rinde con `mealValue()`/`mealRecipe()`. El planner escala las porciones al objetivo, pero la tarjeta muestra la receta base.

### Problema

Reproducción (catálogo cargado, `DB.loaded`): el plan materializa el Almuerzo en 495 kcal / P93 (300 g de pollo) y el usuario aprueba ese total en la revisión. En Nutrición la tarjeta muestra 165 kcal / P31 (100 g, receta base) y `dayTotals()` suma 165, no 495: anillo, "Consumo de hoy", % de meta y racha de adherencia cuentan la porción sin escalar (con platos mayores al objetivo, sobrecuenta). Afecta a todo plan cuyo `dishName` exista en el catálogo con macros distintos a los guardados. Además, editar la receta del catálogo luego muta días ya ejecutados que leen del snapshot (rompe historial inmutable).

### Causa raíz

`mealValue()` resuelve el plato por nombre ANTES que el snapshot: `if(dn&&DB.loaded){const d=dishByName(dn);…return dishMacros(d.id)}` (`index.html:2237`) devuelve la receta base y deja inalcanzable la rama materializada `if(base.src==="nutritionPlan"&&base.kcal>0)` (`index.html:2239`). Invierte el orden que fija REQ-82 (`nutritionPlan` primero, catálogo solo como compatibilidad). `mealRecipe()` (`index.html:4957-4962`) hace lo mismo con los gramos base en vez de `base.ingredientes`.

### Objetivo

Que una comida del plan muestre y sume los macros y gramos que el plan materializó, aunque el catálogo esté cargado.

### Alcance

1. En `mealValue()`, priorizar la rama `base.src==="nutritionPlan"` (con `base.kcal>0`) sobre la resolución por `dishName` en catálogo.
2. Igual en `mealRecipe()`: usar `base.ingredientes` del snapshot antes que la receta base de `DB.dishIng`.

### Fuera de alcance

- Overrides (`ms.ovr`) de "Cambiar comida" (REQ-154) y ediciones manuales, que ya tienen su ruta.
- El motor de escalado y el planner: el número materializado es correcto; falla la lectura.

### Riesgos

- Comidas de plan sin `base.kcal>0` deben seguir cayendo al catálogo como compatibilidad.
- No romper la resolución por nombre para comidas sin snapshot.

### Criterios de aceptación

- Tras aplicar el plan, tarjeta, receta desplegada y `dayTotals()` muestran los macros/gramos materializados del snapshot (± redondeo), no la receta base.
- Editar el catálogo no cambia días pasados renderizados desde snapshot.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Repro de runtime (0 pagadas): con `DB.loaded` y un plato cuya receta base ≠ macros del snapshot, `mealValue({src:"nutritionPlan",dishName,kcal:495},{})` debe devolver 495 (`src:"nutritionPlan"`), no `{kcal:165,src:"db"}`.

## REQ-163 - Fix Entreno: una sesión abandonada en curso cuenta como entreno "hecho" e infla la racha

**Estado: implementado.**
`trainingDayResult()` (`index.html`) ya no cuenta "done" por `workoutHasRecordedActivity()` (cualquier bloque omitido o serie marcada, sin exigir cierre); ahora exige un resultado TERMINAL vía `workoutOutcomeForState(st)` (`completed`/`partial`) o el legado `st.workoutDone`. `workoutHasRecordedActivity()` no se tocó (otros usos, p. ej. protección de días en REQ-126, siguen queriendo detectar cualquier actividad). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/entreno.spec.js` (inicia sesión, omite un bloque y abandona sin finalizar; confirmado que el test falla exactamente como describe el REQ —"done" en vez de "missed"— contra el código sin el fix).

### Origen

Auditoría del journey Entreno. Al iniciar el reproductor y omitir un bloque (o marcar una sola serie) sin finalizar la sesión, el día ya cuenta como entreno cumplido para la racha, aunque el propio "Resumen" del día muestre "En curso".

### Problema

Reproducción funcional (Playwright + fixtures REQ-96, 0 llamadas pagadas): día de entreno de fuerza. Antes de tocar nada `trainingDayResult(hoy)="missed"` y `streakStats().trainCur=0`. El usuario pulsa "Iniciar sesión guiada", pulsa "Omitir bloque" una vez y abandona (nunca "Finalizar" ni "Terminar parcialmente"). Después: la sesión sigue `in_progress` (`workoutOutcomeForDay="in_progress"`, la tarjeta muestra "En curso · 0/6 bloques"), pero `trainingDayResult="done"` y `trainCur` sube a 1. Como `combinedDayDone` exige `trainingDayResult==="done"||"rest"`, en un día con la nutrición cumplida esa sesión abandonada completa la racha combinada y Home enciende 🔥 (y `checkAndSaveMilestones` puede otorgar hitos). La app se autocontradice: el día está "En curso"/pendiente pero la racha ya lo acreditó. Contradice REQ-23 (racha combinada = "entrenamiento hecho o descanso planificado"). Basta un bloque omitido o una serie marcada por día para sostener una racha sin entrenar de verdad.

### Causa raíz

`trainingDayResult(ds)` decide "done" con `workoutHasRecordedActivity(st)||!!st.workoutDone` (`index.html:9411`). `workoutHasRecordedActivity` (`index.html:4471-4477`) devuelve `true` ante cualquier `step.status==="done"||"skipped"` o cualquier `set.done`, **sin exigir un estado terminal** (`completed`/`partial`). Así una ejecución `in_progress`/`paused` con un solo bloque omitido ya se cuenta como día hecho en `streakStats()` (`:9431`), `combinedDayDone` (`:9419`) y `streak()` (`:9488`). El "Resumen" del día usa `workoutOutcomeForState` (`:5038`), que sí muestra "En curso" → divergencia visible.

### Objetivo

Que un día de entreno solo cuente como "hecho" para la racha cuando la sesión llegó a un cierre real (completa o parcial guardada), no por una sesión en curso o abandonada con bloques omitidos.

### Alcance

1. En `trainingDayResult()`, contar "done" solo si el resultado del día es terminal: `workoutOutcomeForState(st)` es `completed` o `partial` (o el legado `st.workoutDone`), no por mera actividad registrada de una sesión `in_progress`/`paused`.

### Fuera de alcance

- La divergencia `streak()` vs `streakStats().combCur` del día en curso (REQ-146) y las comidas vacías/nutrición (REQ-161): son otros caminos.
- Cambiar qué cuenta como "parcial" en el cierre (`finishWorkoutExecution`), ni la duración (REQ-155).

### Riesgos

- No romper el caso legítimo: una sesión finalizada como "parcial" debe seguir contando; un descanso planificado sigue siendo "rest".
- `workoutHasRecordedActivity` se usa además en otros lugares (p. ej. protección de días en REQ-126); acotar el cambio a `trainingDayResult` para no alterar esa protección.

### Criterios de aceptación

- Una sesión `in_progress`/`paused` (aunque tenga bloques omitidos o series sueltas) da `trainingDayResult="missed"` y no incrementa `trainCur` ni la racha combinada.
- Una sesión finalizada (`completed`/`partial`) sí cuenta como día de entreno.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E: iniciar sesión, "Omitir bloque", no finalizar; comprobar `trainingDayResult(hoy)==="missed"` y `streakStats().trainCur` sin cambio, mientras la tarjeta sigue mostrando "En curso".

## REQ-164 - Fix Progreso: la variación de peso on-target se pinta como advertencia en metas de volumen/mantenimiento

**Estado: implementado.**
`goalAwareDeltaColor(delta,goal)` (`index.html`) centraliza el color de `Δ peso (sem)`/`Δ grasa %` en `bodyComposition()` según `prefs.goal`: volumen (subir=bueno), mantenimiento (tolera hasta ±0.4, mismo umbral que el check-in de REQ-160), deficit/fallback (bajar=bueno, sin cambio de sentido). `composition()` no se tocó. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/progreso.spec.js` (meta volumen + 2 semanas de peso ascendente; confirmado que el test falla exactamente como describe el REQ —`var(--warn)` en vez de `var(--good)`— contra el código sin el fix).

### Origen

Journey `progreso`, sección "Peso corporal" → "Composición". Recorrido con meta `volumen` y ganancia de peso deliberada.

### Problema

En volumen, subir de peso es el objetivo del ciclo y `buildWeightRanges` prescribe un rango creciente, pero la tarjeta "Δ peso (sem)" pinta la ganancia como advertencia (ámbar) en vez de logro (verde), y "Δ grasa %" hace lo mismo. La pantalla se contradice: la tabla "Rango kg" sube semana a semana mientras el delta que la cumple sale en rojo/ámbar. En mantenimiento cualquier variación tiene el mismo sesgo "bajar=bueno". Solo `deficit` está bien coloreado.

### Causa raíz

`bodyComposition()` (index.html:5235-5236) fija el color sin mirar `prefs.goal`: `dKg<=0?var(--good):var(--warn)` y `dBf<=0?var(--good):var(--warn)`. `buildWeightRanges` (index.html:1459) sí es goal-aware (`deficit -.004`, `volumen +.002`, mantenimiento `0`).

### Objetivo

El color del delta refleja si el cambio va en la dirección del objetivo del usuario, coherente con el rango prescrito.

### Alcance

1. En `bodyComposition()`, derivar el color de `dKg`/`dBf` de la dirección esperada según `prefs.goal` (volumen: subir=bueno; déficit: bajar=bueno; mantenimiento: estabilidad, sin alarmar variaciones pequeñas).

### Fuera de alcance

- Umbrales del check-in (REQ-160) y el cálculo de racha (REQ-146).
- `recapDelta`/tarjetas neutras que ya muestran +/- sin juicio de color.

### Riesgos

- No invertir el sentido para `deficit` (regresión); mantener `composition()` intacto.

### Criterios de aceptación

- Meta `volumen` con Δ peso >0 on-target: la tarjeta usa `var(--good)`, no `var(--warn)`.
- Meta `deficit` con Δ peso <0: sigue en `var(--good)`.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E: sembrar meta `volumen` + dos semanas de peso ascendente, abrir Progreso y assertar `color:var(--good)` en "Δ peso (sem)".

## REQ-165 - Fix check-in semanal: las escalas sin responder se leen como el peor valor y disparan ajustes falsos

**Estado: pendiente.**

### Origen

Auditoría del journey retención → check-in semanal (REQ-20). Las 7 escalas 1–5 son opcionales; al enviar sin marcarlas, el motor de ajuste devuelve mensajes negativos y cambia calorías sobre respuestas que el usuario nunca dio.

### Problema

`readCiScale` devuelve `null` para una escala sin marcar, y en las comparaciones `null<=2` es `true` (0≤2) mientras `null>=4` es `false`. Repro determinista (meta déficit, 2000 kcal): (A) enviar el check-in sin marcar nada → propuesta `keep:true` ("Tu plan está bien calibrado") pero con razón "Energía y sueño bajos: prioriza el descanso…", contradicción visible en la misma tarjeta sobre campos jamás respondidos. (B) marcar solo hambre=5 y dejar energía y sueño en blanco → `+100 kcal/día` con "Hambre alta y energía baja: añadir calorías". Control (C) idéntico pero energía=5, sueño=5 → solo `+50 kcal`. Mismo hambre: el delta extra sale enteramente de tratar energía sin responder como baja, subiendo el objetivo calórico contra una meta de déficit por un dato inexistente.

### Causa raíz

`analyzeCheckinAnswers` (`index.html:11201`,`:11204`,`:11207`) compara `answers.energy`/`answers.sleep` crudos (null→0 en `<=`), mientras las ramas de fatiga/adherencia sí neutralizan con `||3` (`:11212`,`:11218`,`:11221`). `readCiScale` produce el `null` (`index.html:11166`). Manejo de "sin responder" inconsistente entre ramas.

### Objetivo

Una escala sin responder no debe contar como valor extremo ni generar mensajes/ajustes: se trata como neutral o se ignora esa rama.

### Alcance

1. En `analyzeCheckinAnswers`, normalizar las escalas ausentes (p. ej. `||3` o guarda de `!=null`) en las ramas de energía y sueño, igual que hambre/dificultad/recuperación/adherencia.
2. Que una razón negativa no coexista con `keep:true`.

### Fuera de alcance

- El mapeo de metas volumen/mantenimiento (REQ-160) y el coloreo de deltas (REQ-164): misma función/journey, otra causa.
- Hacer obligatorias las escalas del formulario.

### Riesgos

- Cambia el ajuste de usuarios en curso; conservar `CHECKIN_MAX_KCAL_ADJUST`/`CHECKIN_MIN_KCAL` y las demás ramas.

### Criterios de aceptación

- Enviar el check-in con energía/sueño sin marcar no produce "Energía y sueño bajos" ni suma calorías por esa vía; caso B iguala al control C.
- Ninguna propuesta con `keep:true` muestra una razón de déficit/molestia.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Arnés determinista (0 llamadas): `analyzeCheckinAnswers` con escalas en `null` vs marcadas altas; assertar mismos `calorieAdjust`/`details` salvo por lo realmente respondido.
