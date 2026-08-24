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

**Estado: implementado.** Onboarding agrega sección "Tus gustos (opcional)" con ingredientes favoritos, platos favoritos y disgustos (`ob_preferred_ingredients`, `ob_preferred_dishes`, `ob_disliked`), guardados en `prefs.preferredDishes` (nuevo) y campos existentes. Perfil expone `preferredDishes` como editable. El prompt de IA (día, semana, "otra opción") recibe `coachLikesLine` con gustos y línea de disgustos suaves; el fallback determinista aplica `preferenceScoreAdjustment` en `js/nutrition-domain.js` para priorizar platos con ingredientes/nombres afines y penalizar los que coinciden con disgustos, tanto en generación de día como en reemplazos (`rankReplacementCandidates`). Alergias/restricciones duras siguen bloqueando vía `hard_restrictions` sin mezclarse con gustos. Detalle (origen 3 jul 2026, alcance onboarding+perfil, criterios) en el commit. Verificado con `scripts/release-gate.mjs`.

## REQ-120 - Nutrición: "No me gusta este plato" bloquea futuras sugerencias hasta editar Perfil

**Estado: implementado.** `profile.prefs.blockedDishes` guarda `{key,name}` por plato (key = `dish.slug` o nombre normalizado, deduplicado, tope 200). `dishDietAllowed` (`js/nutrition-domain.js`) excluye platos bloqueados del planificador determinista de día/semana (`compatibleDishesForSlot`); `coachDishBlockedByProfile` (index.html) hace lo mismo para la lista de referencia de IA, `changeMealCandidatePool`, `regenerateGenMeal`, `findGapSnack` y la validación de acciones del coach (`cambiar_plato`). Los prompts de generación de día y "otra opción" agregan una línea explícita con los nombres bloqueados (`coachBlockedDishesLine`) como refuerzo para platos generados por IA que no matchean el catálogo. Acción "🚫 No me gusta este plato" disponible desde el menú "···" de la comida aplicada (`openMealMore`/`blockCurrentMealDish`) y desde cada comida del borrador de día generado (`blockGenDraftMeal`). Perfil > Comidas lista los platos bloqueados con botón "Volver a sugerir" (`unblockDishFromProfile`) cuando hay al menos uno. Días ya ejecutados no se modifican (el bloqueo solo afecta generación futura). Verificado con `scripts/validate-blocked-dishes.mjs` y la suite E2E de Perfil/Nutrición.

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

**Estado: implementado.** Comidas planificadas y extras viven en una sola lista ordenable dentro de "Comidas del día". El orden se guarda en `dayState(ds).mealOrder` (solo visual: `moveDayItem` reescribe ese array, nunca slot/horario/`ovr`/macros) y se reconcilia en `dayEffectiveOrder` con los ítems reales (nuevos al final, claves obsoletas descartadas). Cada extra recibe un `oid` estable (`nextExtraOid`) para que su clave de orden no dependa del índice. Controles subir/bajar (fallback accesible, sin drag-and-drop) solo para hoy/futuro (`canReorderDay`). Acción "Saltar esta comida" (`skipMeal`/`unskipMeal`, con "Deshacer") para comidas planificadas no consumidas: se ve como "Saltada", no cuenta como pendiente ni consumida (`dayTotals` la excluye de `totMeals`) y no aplica sobre una ya registrada. `homeAgendaData` usa `dayEffectiveOrder` y excluye saltadas al elegir la próxima comida. Verificado con `scripts/validate-meal-reorder-skip.mjs`; se actualizó `scripts/validate-home-macro-ring-first.mjs` (REQ-124) al fusionar "nut.extra" en "nut.plan".

_Origen: feedback de Jonathan (3 jul 2026). Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`._

## REQ-126 - Admin: resetear futuro y regenerar nutrición/entrenamiento para cualquier usuario

**Estado: implementado.** `api/admin.js` agrega `previewResetPlan`/`applyResetPlan` (usuario, alcance nutrition/training/both, fecha de inicio opcional = hoy en la zona horaria del usuario objetivo) y `resetUserToOnboarding` (reutiliza el wipe ya probado de `resetTestUserData` sin marcar al usuario como QA). Un día queda protegido (nunca se toca) si ya tiene una comida registrada o un entrenamiento hecho/ejecutado dentro del alcance elegido; aplicar solo reescribe `meals`/`extras` (nutrición) o `workoutDone`/`workoutOverride`/`workoutExecution` (entrenamiento) en `day_log.state` para los días no protegidos, y archiva (`status=superseded`) la versión de plan activa cuando el alcance incluye nutrición. El horizonte revisado cubre 120 días (sin techo artificial por debajo de 7). Toda acción se audita en la nueva tabla `admin_actions_log` (`supabase/admin_reset.sql`, requiere aplicarse manualmente en Supabase). Panel de administración: botones "Regenerar plan" (vista previa obligatoria antes de aplicar) y "Reiniciar usuario" (doble confirmación), deshabilitados para la propia cuenta y para otros administradores. Verificado con `scripts/test-admin-reset.mjs`.

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

## REQ-154 - Fix Nutrición: "Cambiar comida" guarda la porción escalada pero la tarjeta muestra (y suma) los macros de la receta base

**Estado: pendiente.**

### Origen

Auditoría del journey Nutrición → acción "Otra opción / Cambiar comida" (`openChangeMeal` → `applyChangeMeal`). Los candidatos se rankean con la porción **escalada** al target del slot (REQ-83/131), pero `mealValue()` vuelve a calcular los macros desde la receta base del catálogo.

### Problema

Reproducción (catálogo cargado, `DB.loaded`): el usuario toca "Otra opción" en una comida principal y elige un plato cuya receta base es más pequeña que el objetivo del slot. El solver escala la porción hacia arriba y el botón de opción muestra p. ej. **1004 kcal · P 90** (receta escalada: pollo 265 g, arroz 300 g). Al aplicar:

- La tarjeta de la comida muestra en el encabezado **654 kcal · P 62** (receta base 180/220/8 g), Δ **−350 kcal** / **−28 g proteína** frente a lo elegido.
- Pero la receta que se despliega bajo esa misma tarjeta usa los gramos **escalados** (265 g de pollo ≈ 437 kcal solo el pollo), así que el encabezado de macros se contradice con su propia lista de ingredientes.
- `dayTotals()` (anillo "kcal restantes", "Consumo de hoy", % de la meta y racha de adherencia) suma los **654 kcal base**, no los 1004 que el usuario creyó registrar. Con platos grandes escalados hacia abajo el error es inverso (sobrecuenta).

El rebalanceo de comidas futuras (REQ-142) parte del delta escalado, de modo que el cierre del día queda calibrado contra un número que la UI luego no muestra. Es una violación del invariante "macros mostrados = macros guardados" (clase REQ-69) y contradice el diseño de REQ-82, que exige conservar "nombre, gramos y macros usados en ese momento".

### Causa raíz

`applyChangeMeal` guarda en `ms.ovr` los macros escalados y los ingredientes escalados del candidato rankeado (`newOvr.kcal=ranked_item.macros.kcal…`, `index.html:7505-7513`); esos macros vienen de `rankReplacementCandidates` → `solveDishPortion`, que escala la porción con `seed=mealTarget.kcal/base.kcal` acotado a `[0.35, 2.5]` (`js/nutrition-domain.js:595-602`, `755-778`). Pero `mealValue()` resuelve el override por **nombre de plato** antes que por los macros guardados: como `ms.ovr.dishName` está seteado y `DB.loaded`, entra en `const d=dishByName(dn); const m=dishMacros(d.id)` y devuelve la receta base sin escalar, **ignorando `ms.ovr.kcal/p/c/f`** (`index.html:2236-2237`; `dishMacros`, `index.html:10145`). En cambio `mealRecipe()` sí prioriza `ovr.ingredientes` escalados (`index.html:4952-4954`), y `mealCard` pinta el encabezado con `mealValue()` (`index.html:4997`) — de ahí las tres cifras inconsistentes.

### Objetivo

Que tras "Cambiar comida" el encabezado de macros, la receta desplegada, el candidato elegido y la suma del día muestren y contabilicen exactamente la porción que el usuario escogió.

### Alcance

1. En `mealValue()`, cuando el override es un reemplazo con macros materializados (`ovr.gen`/`ovr.dishName` con `ovr.kcal` presente), honrar los macros guardados (`ovr.kcal/p/c/f`) en vez de recalcular `dishMacros(d.id)` desde la receta base.
2. Alternativa equivalente: no guardar macros/ingredientes escalados en `applyChangeMeal` y en su lugar persistir la porción/escala, resolviéndola de forma consistente en `mealValue()` y `mealRecipe()`.

### Fuera de alcance

- El motor de escalado (`solveDishPortion`) y el rebalanceo (REQ-142): el número escalado es el correcto; lo que falla es que la UI/suma no lo respeta.
- Comidas sin override y comidas del snapshot `nutritionPlan` (`base.src==="nutritionPlan"`), que ya llevan sus macros materializados.
- Overrides manuales del editor (`ovr.kcal` con `dishName==null`), que ya se muestran correctamente por la rama "custom".

### Riesgos

- Regresión en la ruta REQ-82: para overrides antiguos sin `ovr.kcal` (solo `dishName`) hay que conservar el fallback a `dishMacros`.
- La resolución por nombre existe para reflejar ediciones de catálogo; distinguir "reemplazo materializado" de "solo prescribe plato" para no romper ese caso.

### Criterios de aceptación

- Tras elegir un reemplazo escalado, el encabezado de la tarjeta, la receta desplegada y `dayTotals()` muestran los mismos kcal/macros que el botón de opción seleccionado (± redondeo).
- Overrides manuales y comidas del `nutritionPlan` siguen mostrando sus macros correctos.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Reproducción de dominio (0 llamadas pagadas): con el catálogo de prueba, `rankReplacementCandidates(current, [dish], {kcal:1000,…}, catalog)[0].macros.kcal ≈ 1004` mientras `dishMacros` de la receta base ≈ 654; el `mealValue()` corregido debe devolver ≈ 1004 para ese override.
- Preview/E2E con catálogo real: aplicar "Otra opción" en una comida principal y verificar que encabezado, receta e "Consumo de hoy" coinciden con el candidato elegido.

## REQ-155 - Fix reproductor de entreno: "duración real" cuenta el tiempo con la app cerrada

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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
