# Plan de requerimientos de producto - Fitbros

Backlog operativo de Fitbros. Consulta `docs/requirements-history.md` cuando lo requiera el REQ activo.

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

Prima el código en `HEAD`. Corrige discrepancias en el mismo commit.

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

- PWA vanilla sin build. Shell en `app/index.html`.
- Supabase es fuente de verdad; `localStorage` es cache/offline. Datos personales van por usuario con RLS.
- Login obligatorio, landing publica, paywall/checkout, cupones, historial de pagos, notificaciones, sync offline y roles admin ya existen.
- Entrenamiento tiene catalogo, reproductor recuperable, planes personalizados 4/10 semanas, splits progresivos y adaptaciones.
- Nutricion: catalogo con recetas, restricciones y planificador determinista (REQ-79..84 y serie "dieta exacta").
- Migraciones SQL nunca se ejecutan automaticamente en produccion; documentar acciones manuales.
- Al tocar `index.html` o shell PWA, revisar si corresponde subir `CACHE_NAME` en `service-worker.js`.

## Secuencia activa

**Series de Jonathan (16 nov 2026), cada una en orden:** nutrición REQ-404→407 (`docs/nutrition-first-days.md`) y entreno REQ-408→410 (`docs/training-stable-routine.md`); después, desde el historial, REQ-411→413 y REQ-414 (`docs/plan-from-history.md`). El paquete MyFitnessPal (REQ-268..276) ya está implementado. Revalidar contra código al tomar cada uno.

Automatizable por el agente desarrollador:

REQ-81..84 (planner determinista, versionado en `plan_versions`, reemplazos con rebalanceo, coach auxiliar validado) ya implementados — detalle en `docs/requirements-history.md`.

Las series UX (REQ-97..112) y «dieta exacta» (REQ-128..141 y 144) ya están implementadas; detalle en `docs/requirements-history.md`.

Pendiente de decisión del feedback de Diego (2026-10-21): REQ-254 (ver abajo). Las series ya cerradas (Claudia, flujo beta, Sathya, Jonathan 10-21, Diego) están en `docs/requirements-history.md`, en «Series cerradas de la secuencia activa».

Pendiente no automatizable por agentes:

- REQ-60 - Configuracion manual de redirects en Supabase.
- REQ-127 - Personalizar remitente/asunto de correos de Supabase (branding Fitbud).
- REQ-254 - Decidir el nivel de cocina en el catálogo y si se amplían almuerzos/cenas "sin cocinar" (feedback Diego).
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

**Estado: implementado.** Revisión legal hecha por Jonathan (confirmado el 2026-11-14).

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

**Estado: implementado (configuración externa).** Verificado el 2026-10-26 leyendo la configuración de Auth del proyecto `fitbud` (API de gestión de Supabase, solo lectura): Site URL `https://evolvapp.club`; Redirect URLs incluye `https://evolvapp.club/**`, `https://fitbud-green.vercel.app/**`, `https://fitbros.vercel.app/**` y `http://localhost:8923/**`. Sin cambios de código. Pendiente opcional: probar un reset real y revisar el enlace del correo.

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

**Estado: implementado.** Validación y beta hechas por Jonathan (confirmado el 2026-11-14).

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

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-86 - Fix: caché de coach reutilizaba resultados generados con prompts obsoletos

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-86).

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

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `validate-password-toggle.mjs`.

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

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-120 - Nutrición: "No me gusta este plato" bloquea futuras sugerencias hasta editar Perfil

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-120`).

## REQ-121 - Nutrición: cambios de preferencias regeneran solo futuro y se respetan de inmediato

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-122 - Fix Nutrición: dietas deben llegar a objetivos o completar con sugerencias aplicables

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-123 - Fix Nutrición: todos los botones "Otra opción" soportan reintentos repetidos con feedback

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-123).

## REQ-124 - Resumen de macros antes de la agenda y comidas

**Estado: implementado.**

[Historial](docs/requirements-history.md#req-124). Hoy evoluciona en REQ-364.

## REQ-125 - Nutrición: reordenar comidas y saltar comidas sin cambiar horarios históricos

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-125).

## REQ-126 - Admin: resetear futuro y regenerar nutrición/entrenamiento para cualquier usuario

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-126`).

## REQ-127 - Personalizar remitente y asunto de los correos de autenticacion de Supabase (branding Fitbud)

**Estado: implementado (configuración externa, con la marca Evolv).**

Detalle archivado en [historial](docs/requirements-history.md#req-127).

## REQ-128 - Contrato estricto único de dieta (`DIET_CONTRACT`) + canario de factibilidad

**Estado: implementado.** Exporta `DIET_CONTRACT`, `dietContractTolerance()` y `validateDietContractTotals()` en `js/nutrition-domain.js` (tolerancias kcal/proteína/carbos/grasa, kcal autoritativa de `ingredients.kcal`), en calibración (`runtimeActive:false`, sin tocar runtime). Canario `scripts/validate-diet-contract.mjs` en el release-gate. Detalle histórico: `docs/requirements-history.md` (buscar `## REQ-128`).

## REQ-129 - `finalizeNutritionDay()` etapa 1: puerta pura dormida y normalización de propuestas

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-130 - Coherencia de preferencias duras y patrón omnívoro activo

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-131 - Momento del día, etapa 1: presupuestos por slot y filtro heurístico sin migración

**Estado: implementado.** `generateOneDay()` calcula presupuestos por slot, filtra referencias con `compatibleDishesForSlot`, valida `compatible_slots` y aplica techo de contundencia en slots no principales. Validador: `scripts/validate-slot-budget-prompt.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-131`).

## REQ-132 - Momento del día, etapa 2: metadata de contundencia y cobertura de slots vacíos

**Estado: implementado.** `supabase/nutrition_catalog_semantics.sql` agrega/backfillea `meal_weight` y `meal_form`; dominio/prompt/validadores usan esa metadata para evitar platos contundentes en slots ligeros y reportar cobertura. Acción manual: re-ejecutar la migración semántica en Supabase.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-132`).

## REQ-133 - API del coach: structured outputs, límites y modelo por acción con gate de telemetría para Sonnet 5

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-134 - Pipeline de crecimiento del catálogo validado por el motor

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

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

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-138 - Conectar `finalizeNutritionDay()` en cliente sin activar contrato global

**Estado: implementado.** Conecta los flujos principales de nutrición (`generateOneDay`, determinista, semana, regenerar día y regenerar comida) a `finalizeDayWithGate()`/`finalizeNutritionDay()` sin activar el contrato global; reemplazos quedaron extraídos como REQ-142. Validador: `scripts/validate-nutrition-finalize-wiring.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-138`).

## REQ-139 - Activar `DIET_CONTRACT` en runtime con aviso suave no bloqueante

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-142 - Conectar reemplazos ("Cambiar comida") a `finalizeNutritionDay()`

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-143 - Catálogo lote 3: crecimiento drástico dirigido por el canario del contrato

**Estado: implementado (decisión de Jonathan, 2026-10-26: avisar en vez de crecer el catálogo).**

Detalle archivado en [historial](docs/requirements-history.md#req-143).

## REQ-144 - Medir impacto incremental de catálogo contra el canario antes de aceptar platos nuevos

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-145 - Fix E2E: el fixture de entreno deja "hoy" sin sesión de fuerza los domingos y pone el release-gate en rojo

**Estado: implementado.** Detalle archivado en [historial](docs/requirements-history.md#req-145).

## REQ-146 - Unificar el cálculo de racha: Progreso muestra "0 / racha rota" mientras hoy no se registra

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-146).

## REQ-147 - Decidir si vale la pena tocar la selección de `planDeterministicNutritionDay()`/`globalClosePass()` para superar el techo de catálogo del canario `DIET_CONTRACT`

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-147`).

## REQ-148 - Fix billing: un reembolso parcial de Stripe revoca todo el entitlement pagado

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-149 - Fix admin: "Regenerar plan · Solo nutrición" archiva también el entrenamiento futuro

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-149`).

## REQ-150 - PWA sirve HTML nuevo con JS del cache viejo tras un deploy (versión mezclada)

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-150`).

## REQ-151 - Landing muestra la sección "Planes" vacía cuando el catálogo carga después del primer render

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-151).

## REQ-152 - Fix onboarding: "Mantenerlo por ahora" en el aviso de revisión de 4 semanas lanza ReferenceError y no cierra ni guarda

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-152`).

## REQ-153 - Fix Home: las sugerencias del coach ignoran comidas saltadas (y la pausa por seguridad) y contradicen la agenda

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-153`).

## REQ-154 - Fix Nutrición: "Cambiar comida" guarda la porción escalada pero la tarjeta muestra (y suma) los macros de la receta base

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-154).

## REQ-155 - Fix reproductor de entreno: "duración real" cuenta el tiempo con la app cerrada

**Estado: implementado.** Reemplazado por REQ-244: el tiempo en segundo plano vuelve a contar; solo una ausencia de más de una hora pausa la sesión.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-155`).

## REQ-156 - Fix aislamiento: el cierre de sesión por evento (token expirado / logout remoto / otra pestaña) no purga la cola offline del usuario anterior

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-156`).

## REQ-157 - Fix billing: renovar antes de vencer no acumula los días ya pagados

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-157`).

## REQ-158 - Panel admin: "Cambiar contraseña" no protege a otros administradores (toma de cuenta entre admins)

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-158`).

## REQ-159 - El service worker cachea respuestas de error (404/500) y envenena el cache

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-159`).

## REQ-160 - Fix check-in semanal: el ajuste de calorías ignora las metas "volumen" y "mantenimiento"

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-160`).

## REQ-161 - Fix Home: marcar comidas "Sin asignar" (0 kcal) como hechas infla el contador y la racha

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-161`).

## REQ-162 - Fix Nutrición: la tarjeta y la suma del día muestran la receta base del catálogo, no los macros materializados del plan

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-162`).

## REQ-163 - Fix Entreno: una sesión abandonada en curso cuenta como entreno "hecho" e infla la racha

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-163`).

## REQ-164 - Fix Progreso: la variación de peso on-target se pinta como advertencia en metas de volumen/mantenimiento

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-164).

## REQ-165 - Fix check-in semanal: las escalas sin responder se leen como el peor valor y disparan ajustes falsos

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-165`).

## REQ-166 - La pasada global de cierre optimiza el contrato, no `scoreMacros()`

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-166).

## REQ-167 - Fix activación de cuenta: "Auth session missing!" crudo al crear la contraseña desde una invitación

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-168 - Reproductor de entreno usable en móvil: dosis sin desborde, RPE explicado, series añadibles y "serie hecha" explícita

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-168`).

## REQ-169 - Fix nutrición: lo descartado en el borrador del día vuelve al regenerar

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-169`).

## REQ-170 - Fix nutrición: platos de almuerzo propuestos para el desayuno

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-170`).

## REQ-171 - Fix nutrición: las calorías del día no convergen con comidas propuestas por el coach

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-171`).

## REQ-172 - Estimar macros de una comida con una foto, con preguntas de aclaración

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-172`).

## REQ-173 - Fix PWA: los deploys no llegan a la app instalada si no cambia `CACHE_NAME`

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-173`).

## REQ-174 - Entreno: antes de empezar se ve qué se va a hacer (series × repeticiones)

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-174`).

## REQ-175 - Capa de espera que bloquea la app mientras el coach responde

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-175`).

## REQ-176 - Alta de usuarios sin depender del correo

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-176`).

## REQ-177 - Planes de un coach conservan sus textos: calentamiento por día, duración y descanso

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-177`).

## REQ-178 - Fix facturación: el historial de pagos muestra el cargo original en lugar del monto reembolsado en reembolsos parciales

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-178`).

## REQ-179 - Supabase no se pausa por inactividad: keep-alive en el cron diario

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-179`).

## REQ-180 - Rebranding Fitbros → Evolv (dirección "Escala")

**Estado: implementado.** Marca Evolv, dirección "Escala": casi negro + lima `#D6FF3A` (`--on-accent:#101010`), azul señal `#3A7BFF`, Unbounded (titulares/números grandes) + Manrope, modo oscuro. Los tokens `--purple-*`/`--terra-*` son hoy las escalas lima/azul.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-180`).

## REQ-181 - Admin: el modal "Consumo" no precarga la cortesía vigente y la sobrescribe al guardar

**Estado: implementado.** El modal "Consumo" del admin precarga la cortesía vigente y no la sobrescribe al guardar.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-181`).

## REQ-182 - Fix PWA: el gate de bump de caché no cubre `assets/icon-180.png` (apple-touch-icon cache-first fuera de `APP_SHELL`)

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-182`).

## REQ-183 - Dominio propio: Evolv en evolvapp.club

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-183`).

## REQ-184 - Seguridad: el sitio público no publica los archivos internos del repositorio

**Estado: implementado.** `.vercelignore` en modo allowlist y `scripts/validate-deploy-allowlist.mjs` en el release gate: solo se publica lo que el runtime carga.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-184`).

## REQ-185 - Fix Entreno: una serie sin marcar deja la sesión "parcial" sin forma de corregirla

**Estado: implementado.** Una serie sin marcar ya no deja la sesión de Entreno "parcial" sin salida.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-185`).

## REQ-186 - Fix Entreno: el cronómetro de descanso se queda congelado

**Estado: implementado.** El cronómetro de descanso ya no se congela.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-186`).

## REQ-187 - Entreno: descanso cronometrado entre ejercicios (2:00 por defecto, configurable)

**Estado: implementado.** Descanso cronometrado entre ejercicios (2:00 por defecto), configurable en Perfil.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-187`).

## REQ-188 - Nutrición: reutilizar comidas recientes y favoritas, y registrar alimentos sueltos por gramos

**Estado: implementado.** Comidas recientes y favoritas reutilizables, y alimentos sueltos por gramos.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-188`).

## REQ-189 - Marca: ícono de la app con chevrons ascendentes (PWA, favicon y Open Graph)

**Estado: implementado.** Ícono de chevrons ascendentes en PWA, `brandMark()`, favicon (`/favicon.ico`, `assets/favicon.svg`) y Open Graph (`assets/og-image.png` 1200×630).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-189`).

## REQ-190 - Registro: pantalla "Revisa tu correo" en lugar del formulario con un aviso

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-190`).

## REQ-191 - Fix Perfil: el aviso de actividad ligera reaparece en cada visita

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-191`).

## REQ-192 - Accesibilidad: campos con nombre, landmarks, FAQ, contraste de `--muted2` y movimiento reducido

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-192`).

## REQ-193 - Táctil: todos los controles miden 44 px en pantallas táctiles

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-193`).

## REQ-194 - Textos: sin vocabulario interno, fechas consistentes y beta con ortografía completa

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-194`).

## REQ-195 - Progreso y Nutrición: menos campos vacíos para el usuario nuevo

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-195`).

## REQ-196 - Marca: restos de color de Fitbros y tokens CSS sin definir

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-196`).

## REQ-197 - Rendimiento: la portada no espera a la config ni a Supabase, y supabase-js va fijado con SRI

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-197`).

## REQ-198 - Portada: rediseño "Escalera de días" dentro de la marca Escala

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-198`).

## REQ-199 - Beta: la página de reclutamiento pasa a la marca Escala

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-199`).

## REQ-200 - Fix beta: la postulación falla con "Ganar músculo" o "Comer más sano y crear hábitos"

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-200`).

## REQ-201 - Beta: la postulación pasa a "Programa de fundadores" y el SW deja de tapar la página

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-201`).

## REQ-202 - Portada: los CTA llevan a postular a la beta de fundadores

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-202`).

## REQ-203 - Beta: enlace de invitación que activa el acceso solo y script para invitar

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-203`).

## REQ-204 - Beta: la cabecera de la postulación deja de decir "Beta cerrada"

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-204`).

## REQ-205 - Beta cerrada: crear cuenta solo con código de invitación

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-205`).

## REQ-206 - Entreno: registrar a mano lo entrenado (también en días de descanso) con estimación de calorías

**Estado: implementado.** Actividad manual con kcal estimadas, edición y borrado. «Entrené igual» en Hoy. Detalle en `docs/requirements-history.md`.

## REQ-207 - Fix: "Estimar con foto" no deja elegir una foto de la galería

**Estado: implementado.** "Estimar con foto" deja elegir de la galería: los inputs ya no llevan `capture`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-207`).

## REQ-208 - Beta: quien entra a la beta no ve precios ni cobro durante sus 90 días

**Estado: implementado.** Acceso beta sin precios (paywall → aviso neutro, Perfil "Acceso beta"), casilla beta de 90 días en Admin, reintento del canje de invitación e invariante de cobro en la web.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-208`).

## REQ-209 - Fix: la app no ocupa todo el ancho y siempre hay una barra de scroll

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-210 - Progreso: la semana 1 usa el peso y la grasa del onboarding

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-211 - Onboarding: el objetivo y el "ritmo del plan" se entienden a la primera

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-212 - Entreno: calentamiento y vuelta a la calma con movimientos concretos y cronómetro opcional

**Estado: implementado.** Calentamiento y vuelta a la calma con 4-6 movimientos concretos según la zona de la sesión; "Guíame" movimiento a movimiento con cronómetro opcional, o "Ya calenté".

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-212`).

## REQ-213 - Actualizaciones de la app sin botón "Actualizar app" que estorbe

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-214 - Plan: empezar de nuevo (4 o 10 semanas) en cualquier momento

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-215 - Nutrición: lista de compra semanal con "ya lo tengo" y "por comprar"

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-216 - Modo conversacional (beta oculta): usar la app desde el chat

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-216).

## REQ-217 - Beta: la postulación cierra con una confirmación amable y sin callejones sin salida

**Estado: implementado.** La postulación beta cierra con un panel de agradecimiento y pasos, validación igual a la API, errores claros con foco en el campo y borrador local.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-217`).

## REQ-218 - Admin: pantalla "Postulantes beta" para revisar, aceptar con 90 días y avisar por WhatsApp

**Estado: implementado.** Admin → "Postulantes beta": filtros, aceptar con 90 días (código `quarterly`), descartar o volver a revisar, y mensaje listo para enviar.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-218`).

## REQ-219 - Portada: los CTA del hero, la navegación y el subtítulo no respetan `SIGNUP_MODE=open`

**Estado: implementado.** Con `SIGNUP_MODE=open`, hero, navegación, subtítulo de precios y cierre de la portada llevan al registro directo; se actualizan in situ cuando el modo llega después del pintado optimista.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-219`).

## REQ-220 - Fix táctil: "¿Qué es RPE?" medía 42 px y dejaba el release gate en rojo

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-220`).

## REQ-221 - Mitigación de REQ-209: nada desborda la columna y la barra de escritorio es discreta

**Estado: implementado.** Mitigación de REQ-209: `html{overflow-x:clip}`, barra fina en `#app` y cortes de palabra en títulos y nombres largos.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-221`).

## REQ-222 - Fix admin: la cortesía de consumo rechazaba 3000 sin decir por qué

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-222`).

## REQ-223 - Textos: la beta no se limita a países

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-223`).

## REQ-224 - Fix Entreno: un borrador de plan archivado le gana al plan activo en los días nuevos

**Estado: implementado.** `planVersionForDate()` ignora versiones reemplazadas si una vigente cubre el día; los días anclados conservan su versión. Validador en el release gate.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-224`).

## REQ-225 - Beta: la aprobación es web y por correo, sin WhatsApp en el flujo

**Estado: implementado.** La postulación pide correo; aceptar envía la invitación de Supabase con 90 días de beta (enlace con código como respaldo). Sin WhatsApp en el flujo.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-225`).

## REQ-226 - Beta: aviso por correo al admin con cada postulación nueva

**Estado: implementado.** Cada postulación nueva avisa por correo (Resend) a `BETA_NOTIFY_EMAIL` o a los admins, con enlace `/?ver=postulantes`; un fallo no bloquea la postulación.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-226`).

## REQ-227 - Fix onboarding: editar un macro en "Ajustar valores" y continuar guarda una meta donde kcal ≠ suma de macros

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-228 - Fix: "Estimar con foto" falla con un mensaje genérico y sin forma de reintentar

**Estado: implementado.** "Estimar con foto" muestra el motivo concreto del fallo (`photoEstimateErrorMessage()`) y un botón "Reintentar" con la misma foto.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-228`).

## REQ-229 - Fix: "Estimar con foto" estima el plato planeado en vez del que se ve

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-230 - Estimar macros: se ve qué valores se aplicaron

**Estado: implementado.** Al estimar macros se resaltan los campos y se muestra "Aplicado: N kcal · P · C · G" (`applyEstimatedMacros()`).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-230`).

## REQ-231 - Nutrición: la lista de compra va con las herramientas, no como una acción del día

**Estado: implementado.** La lista de compra pasa a la fila de herramientas de Nutrición, con el número de ingredientes por comprar.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-231`).

## REQ-232 - Entreno: cada ejercicio muestra con qué carga lo hiciste la última vez

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-232`).

## REQ-233 - Nutrición: tocar la tarjeta de una comida abre su menú de opciones

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-233`).

## REQ-234 - El check-in semanal re-puntúa días ya ejecutados y contradice su copy "para la próxima semana"

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-234).

## REQ-235 - Entreno: la sesión empieza con una cuenta atrás de 3 segundos

**Estado: implementado.** La sesión guiada arranca con una cuenta atrás de 3 segundos antes del primer bloque.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-235`).

## REQ-236 - Entreno: calentamiento y vuelta a la calma son opcionales y se preguntan

**Estado: implementado.** Calentamiento y vuelta a la calma son opcionales: el reproductor pregunta si hacerlos.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-236`).

## REQ-237 - Entreno: la tarjeta del tempo dice qué es y lo explica

**Estado: implementado.** La tarjeta del tempo es un botón: dice "baja · pausa · sube ⓘ" (o "ritmo ⓘ") y explica el ritmo de cada repetición.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-237`).

## REQ-238 - Fix: "Estimar macros" falla sin decir por qué y se ve una caja rota "Foto de la comida"

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-239 - Entreno: con la sesión en curso, el plan y los avisos van en un desplegable

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-239`).

## REQ-240 - Entreno: la demostración y los pasos se abren desde junto al nombre del ejercicio

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-241 - Entreno: "Usar progresión" cambia de verdad el ejercicio (o dice que solo toca subir la carga)

**Estado: implementado.** `FITBUD_EXERCISE_VARIANTS` define versión más fácil y progresión de los 42 ejercicios de fuerza (`exercise`, `variant` o `load`): cambiar de ejercicio cambia título, imagen y guía; "solo carga" lo dice sin cambiar nada. Inventario en `docs/exercise-progressions.md`. Prueba: `tests/e2e/entreno.spec.js`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-241`).

## REQ-242 - Fix: lo registrado ayer desaparece al abrir la app hoy si su subida había fallado

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-243 - Fix: registrar una reciente con porción ×2 deja sus macros duplicados en Recientes

**Estado: implementado.** `saveEditor()` guarda `portion` al registrar una reciente o favorita con porción ×0,5–×2, y Recientes y "Guardar en favoritas" usan los macros de una porción (`perPortion()`). Prueba: `tests/e2e/comidas-guardadas.spec.js`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-243`).

## REQ-244 - Entreno: la duración cuenta de inicio a fin, también con la app en segundo plano

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-245 - Entreno: volver al ejercicio anterior para revisarlo, sin perder Siguiente ni Omitir

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-246 - Fix: "Estimar macros" (texto) falla en producción cuando el coach trae más de 3 preguntas

**Estado: implementado.** `validateCoachOutput()` para `meal_estimate` ya no limita cuántas preguntas trae el coach (seguía rechazando con 422) y el prompt de "Estimar macros" pide `"preguntas":[]`. Prueba: `scripts/validate-meal-estimate-output.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-246`).

## REQ-247 - Entreno: "Sustituir" solo propone ejercicios del mismo músculo principal

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-248 - Beta: los postulantes aceptados usan el coach sin tope durante sus 90 días

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-248`).

## REQ-249 - Fix: en "Lo que sigue hoy" los botones quedan pegados al borde de su tarjeta

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-250 - Fix Entreno: omitir el calentamiento ya elegido dejaba la sesión "parcial"

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-250`).

## REQ-251 - Beta: el perfil llega con lo que ya respondió en la postulación

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-251).

## REQ-252 - Fix Entreno: con "Otra actividad" los días de tu deporte salían como "Descanso total"

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-252`).

## REQ-253 - Entreno: "Actividad física principal" se entiende y cambiar el gimnasio por otro deporte un día es evidente

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-253`).

## REQ-254 - Nutrición: el plan respeta cuánto cocinas (quien no cocina no recibe tacos con frijoles)

**Estado: implementado — requiere acción humana:**

Detalle archivado en [historial](docs/requirements-history.md#req-254).

## REQ-255 - Recordatorios por WhatsApp

**Estado: implementado — requiere acción humana:** activar en Meta y Vercel y aplicar `supabase/whatsapp.sql` (pasos en [whatsapp-reminders](docs/whatsapp-reminders.md)).

### Origen
Diego (beta): «que sea al WhatsApp».
### Problema
Solo correo y push; nadie invita a activarlos.
### Objetivo
Aviso diario por WhatsApp (Cloud API de Meta, tope US$20/mes).
### Alcance
Vinculación por el usuario, webhook firmado, envío, baja e invitación semanal.
### Fuera de alcance
Otros avisos, BSP, chat.
### Riesgos
Clasificación de plantilla, número personal, 12 funciones.
### Criterios de aceptación
Los 14 del spec.
### Verificación sugerida
Meta simulado y release gate.

## REQ-256 - Fix Nutrición: "Volver a preparar este día" pisa comidas personalizadas sin marcar como hechas

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-257 - Fix: el plan de entrenamiento del coach nunca se usa porque la semana llega cortada

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Cada semana del plan del coach pide `TRAINING_WEEK_MAX_TOKENS` = 4096 y JSON en una sola línea: con 2048 llegaba cortada y siempre se usaba la alternativa. ✓ `tests/e2e/entreno.spec.js`.

## REQ-258 - Home: con el día cerrado, Hoy resume el día y muestra lo que toca mañana

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Día cerrado: Hoy oculta "Consumo de hoy" y muestra hoy en una línea, qué toca mañana (`homeTomorrowData()`) y "Ver mañana". ✓ `tests/e2e/home.spec.js`.

## REQ-259 - Entreno: caminata, running, bici y natación con foto real en vez del dibujo

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Los 12 ejercicios de resistencia muestran una foto por disciplina (`assets/exercise-media/`) desde `exercise-catalog.js`; `exerciseMediaSources()` la usa también si la fila de Supabase no trae media. SQL opcional: `supabase/exercise-media-endurance.sql`.

## REQ-260 - Entreno: hacer antes un ejercicio posterior y volver al pendiente

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-261 - Entreno: sustituir un ejercicio por uno buscado en el catálogo

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Feedback Sathya. "Sustituir" tiene buscador (nombre, alias o músculo; `FITBUD_EXERCISE_SUBSTITUTION.search`) sobre todo el catálogo de fuerza, filtrado por lesiones (`exerciseSafeForLimits`). ✓ `tests/e2e/entreno.spec.js`, `scripts/validate-exercises.mjs`.

## REQ-262 - Entreno: añadir un ejercicio a la sesión desde un buscador

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-263 - Fix Progreso: la "Adherencia a comidas" del ciclo activo se diluye con los días futuros

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

`progressStats()` acotaba `cycleSummary()` al ciclo completo (incluidos días futuros sin registrar), diluyendo la adherencia real a ~14% con 100% de cumplimiento hasta hoy. Ahora llama `cycleSummary(todayStr())`. ✓ `tests/e2e/progreso.spec.js`.

## REQ-264 - Entreno: revisar todos los niveles y corregir demos de variantes distintas

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-264).

## REQ-265 - Fix recordatorios: el cron marca "entrenamiento pendiente" en días de descanso

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

`commitDay()` guarda `restDay` (descanso del plan, marcado o pausa por seguridad) y `checkPending()` lo lee junto con `workoutOverride==="descanso"`. ✓ `scripts/validate-notify-schedule.mjs`, `tests/e2e/recordatorios.spec.js`.

## REQ-266 - Fix: los recordatorios por correo y push nunca se enviaban

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-267 - Fix: los avisos push no tenían clave privada VAPID

**Estado: implementado — requiere acción humana:** `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` en Vercel.

Clave pública nueva en `index.html` y `api/notify.js`; al entrar, `refreshPushSubscriptionKey()` renueva suscripciones con otra clave. ✓ `scripts/validate-vapid-key.mjs`.

## REQ-268 - Estimación: no aplicar plantillas genéricas como macros de una comida

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-268`).

## REQ-269 - Registro: validar valores nutricionales y distinguir desconocidos de ceros

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-269).

## REQ-270 - Registro: conservar procedencia y snapshot nutricional

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-270).

## REQ-271 - Registro: editar ingredientes y gramos decimales sin perder el cálculo

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-271`).

## REQ-272 - Nutrición: registrar una sustitución o un adicional de forma explícita

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-272).

## REQ-273 - Nutrición: copiar comida o selección del día a otra fecha

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-273`).

## REQ-274 - Nutrición: biblioteca privada de alimentos desde etiqueta

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-274`).

## REQ-275 - Nutrición: recetas propias con rendimiento y registro por porción

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-275).

## REQ-276 - Nutrición: productos propios por código y escaneo progresivo

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-276`).

## REQ-277 - Publicar análisis MyFitnessPal para continuidad entre agentes

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-278 - Estimación: validar también las respuestas completadas y su entrada real

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-278).

## REQ-279 - Perfil: Comidas excede el presupuesto de altura en móvil

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-279).

## REQ-280 - Conflictos de sync: el botón "Combinar seguro" nunca aparece y se pierden cambios no conflictivos

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-280).

## REQ-281 - Recordatorios: el job dice si el push está listo y tolera espacios en las claves

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

`api/notify.js` recorta `VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` y responde `push: {ready, issue}` (sin valores). ✓ `scripts/validate-notify-push-ready.mjs`.

## REQ-282 - Recordatorios: avisar a quien todavía no empezó el día

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-283 - Racha: animación al registrar algo que la hace avanzar

**Estado: implementado.** Detalle en `docs/requirements-history.md`; diseño en `docs/reminders-journey.md`.

Jonathan (2026-10-26). Cada registro que avanza el día muestra la píldora `#streakPop` con lo que falta; al cumplir, el número sube. ✓ `tests/e2e/racha-animacion.spec.js`.

## REQ-284 - Hoy: tarjeta de regreso y rescate de ayer

**Estado: implementado.** Detalle en `docs/requirements-history.md`; diseño en `docs/reminders-journey.md`.

Jonathan (2026-10-26). `returnCardHtml()`: rescate de ayer con racha previa de 2+ días, o bienvenida con progreso, objetivo y semana tras 2+ días fuera. ✓ `tests/e2e/regreso.spec.js`.

## REQ-285 - Recordatorios según cuánto tiempo lleva fuera (día, rescate, última llamada, regreso)

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-286 - Modo conversación: el hilo del día no se aísla entre cuentas en el mismo dispositivo

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

`chatTurns()`/`saveChatTurns()` namespaced por `uid()` además de fecha; `clearSignedOutState()` purga `evolv_chat_turns_v1` al cerrar sesión. ✓ `tests/e2e/sync-isolation.spec.js`.

## REQ-287 - Entreno: el plan en una línea y las señales para detenerse junto al inicio

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-288 - Push: par VAPID nuevo (la privada de REQ-267 no estaba en ningún lado)

**Estado: implementado.** Variables cargadas en Vercel; el 2026-10-27 el job respondió `push.ready:true`.

El job respondía `push.ready:false` ("falta VAPID_PRIVATE_KEY"). Clave pública nueva en `index.html` y `api/notify.js`; las suscripciones se renuevan al entrar. ✓ `scripts/validate-vapid-key.mjs`.

## REQ-289 - Onboarding: instalar la app y activar avisos; Hoy lo recuerda cada día

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-290 - Precios de lanzamiento: USD 7.99/mes y USD 39.90 por 6 meses

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-291 - Entreno: un día en otro lugar sin tocar el perfil

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Jonathan: `day_log.state.trainingPlace` lleva la sesión del día a otro lugar. ✓ `tests/e2e/lugar-del-dia.spec.js`.

## REQ-292 - Nutrición: la tarjeta "Prepara tus comidas de hoy" se puede colapsar

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `tests/e2e/nutricion-colapsar.spec.js`.

## REQ-293 - Entreno en casa: nada que pida material no declarado y siempre hay con qué sustituir

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `tests/e2e/entreno-casa.spec.js`.

## REQ-294 - Entreno: la zancada muestra su foto real en vez del dibujo

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `tests/e2e/entreno-casa.spec.js`.

## REQ-295 - Recordatorios: volver a entrenar

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Aviso a los 4 y 11 días sin entrenar (`trainingLapse()`). ✓ `scripts/validate-reminder-journey.mjs`.

## REQ-296 - Recordatorios: seguimiento por correo para quien nunca eligió sus avisos

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Correos de seguimiento con baja firmada (`runFollowups`). ✓ `scripts/validate-reminder-journey.mjs`.

## REQ-297 - Recordatorios: invitar a activar el push a la semana

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Correo único a los 7–13 días sin push (`pushInvite()`). ✓ `scripts/validate-reminder-journey.mjs`.

## REQ-298 - Recordatorios: elegir la hora del aviso y resumen de la mañana

**Estado: implementado** (migración `supabase/notifications_morning.sql` aplicada el 2026-10-28). Detalle en `docs/requirements-history.md`.

Hora 06–23 y resumen matutino opcional (`morningPlan()`). ✓ `scripts/validate-reminder-journey.mjs`, `tests/e2e/recordatorios.spec.js`.

## REQ-299 - Hoy: distinguir comidas registradas de la planificación opcional de mañana

**Estado: implementado.**

Detalle archivado en [historial](docs/requirements-history.md#req-299).

## REQ-300 - Compartir la racha y compararla con amigos

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

✓ PostgreSQL/RLS y E2E: `scripts/test-streak-friends.mjs`, `tests/e2e/rachas-amigos.spec.js`.

## REQ-301 - Estimar macros: productos de marca sin inventar

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-302 - Ampliar ejercicios

**Estado: implementado.** SQL de aplicación manual.

Detalle: `docs/exercise-progressions.md`.

## REQ-303 - Más ejercicios de gimnasio

**Estado: implementado.**

40 fichas; 32 de gimnasio. Criterios y operación SQL manual: `docs/exercise-gym-expansion.md`. ✓ `tests/e2e/exercise-gym-expansion.spec.js`.

## REQ-304 - Celebrar cada día de racha

**Estado: implementado.**

Animación visible del incremento, sin duplicados y con movimiento reducido. Detalle: `docs/streak-celebration.md`. ✓ `tests/e2e/streak-celebration.spec.js`.
## REQ-305 - Registro con invitación reconoce el correo ya registrado

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

✓ `tests/unit/invite-signup.test.mjs` (node, mocks, sin producción).

## REQ-306 - Canje de cupones: columnas calificadas en redeem_redemption_code

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-307 - Soporte por WhatsApp en app, onboarding y web pública

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

✓ `tests/e2e/soporte-whatsapp.spec.js`.

## REQ-308 - Consola de administración separada en /admin

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

La consola vive en `/admin`; la app de usuarios no muestra vistas de administración. ✓ `tests/e2e/admin-console.spec.js`.

## REQ-311 - Lesión declarada: aviso con opción voluntaria, no bloqueo duro

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Una lesión declarada muestra un aviso y permite entrenar si la persona lo decide; las señales graves siguen pausando.

## REQ-310 - Fotos reales en todo el catálogo de ejercicios (adiós al monigote)

**Estado: implementado.** Detalle archivado en [historial](docs/requirements-history.md#req-310).

## REQ-309 - Bump de caché del service worker (fitbud-pwa-v176)

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-312 - Curl predicador en banco Scott con barra EZ

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-313 - Extensión de tríceps en polea alta con cuerda

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-314 - Acompañamiento del coach durante los primeros usos

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Bienvenida del coach en Hoy durante los primeros usos, con preguntas que llevan a acciones reales; sin llamadas automáticas ni cambios de plan.

## REQ-315 - Reparar los controles que bloquean la entrega

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Validadores, allowlist, invitaciones, seguridad y Playwright reparados sin relajar contratos; gate con margen para la suite completa.

## REQ-316 - Hoy: registrar y entrenar sin preparar un menú

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Registro y entreno sin menú. Sugerencia descartable.

## REQ-317 - Beneficio por actividad: invitar hasta a tres amigos

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-318 - Rachas con amigos: explicar cómo se suma a un amigo

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Tres pasos, alias propuesto y «Crear invitación» que activa y deja el enlace; luego "Tus amigos te ven como …". Sin buscador. ✓ `tests/e2e/rachas-amigos.spec.js`.

## REQ-319 - Dietas: el día incluye fruta

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Fruta en 2 comidas (1 si hay menos de 4): en el pedido y en el plan sin modelo. ✓ `scripts/validate-diet-fruit.mjs`.

## REQ-320 - Entreno: nunca un dibujo; sin foto exacta, solo los pasos y la sesión prefiere otro con foto

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `tests/e2e/sin-dibujos.spec.js`.

## REQ-321 - Entreno en casa: el día de tirón no se queda en un solo ejercicio

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

✓ `tests/e2e/entreno-casa.spec.js`.

## REQ-322 - Entreno: el step-up con la animación del CDC (dominio público)

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

✓ `tests/e2e/sin-dibujos.spec.js`.

## REQ-323 - Estimar macros: tope de salida para Sonnet 5

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Topes 1000/1200 tokens. ✓ `scripts/validate-meal-estimate-output.mjs`.

## REQ-324 - Fechas y avisos de semana

**Estado: implementado.**

Detalle: `docs/plan-weeks.md`.

## REQ-325 - Recordatorios: solo CRON_SECRET autoriza el envío

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

`/api/notify` ya no acepta la cabecera `x-vercel-cron` sin secreto; solo `Authorization: Bearer CRON_SECRET`, comparado en tiempo constante. ✓ `scripts/validate-supabase-keepalive.mjs`.

## REQ-326 - Texto de baja del correo de invitaciones

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Pie: "No recibir más estos correos". ✓ `scripts/test-referrals.mjs`.

## REQ-327 - Entreno: imágenes propias para los cuatro ejercicios que quedaban solo con pasos

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `tests/e2e/sin-dibujos.spec.js`.

## REQ-328 - Entreno: ver el siguiente ejercicio sin salir del actual

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-329 - Nutrición: registrar alimentos por gramos sin sentir que armas una comida

**Estado: implementado.** Hoy abre Alimento; totales derivados visibles y entrada manual plegable, con reapertura automática para registros antiguos/corregidos y errores. Conserva gramos, porciones, favoritas y guardado. Detalle: `docs/food-registration.md`. ✓ `tests/e2e/registro-gramos.spec.js` y regresiones del editor. Detalle en `docs/requirements-history.md`.

## REQ-330 - Nutrición: acceso evidente para registrar algo fuera del plan

**Estado: implementado.** Acceso principal visible antes de la lista, con y sin menú; abre Alimento como extra y persiste sin cambiar comidas. Secundario conservado. ✓ `tests/e2e/registro-extra-visible.spec.js`. Detalle en `docs/requirements-history.md`.

## REQ-331 - Tienda: datos del comercio y páginas legales propias

**Estado: implementado.** Detalle en `docs/requirements-history.md`. Datos del titular (Sathya Bernedo Llerena, RUC 10758585960) cargados en `tienda/comercio.js` el 2026-11-02.

## REQ-332 - Tienda: Libro de Reclamaciones virtual integrado

**Estado: implementado.** Detalle en `docs/requirements-history.md`. `supabase/tienda_culqi.sql` aplicado en producción por Jonathan (2026-11-02).

## REQ-333 - Tienda: planes en soles con imagen y botón Comprar, sin cerrar la beta

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `tests/e2e/tienda.spec.js`.

## REQ-334 - Tienda: pago con tarjeta por Culqi (pago único, 3DS, acceso por correo)

**Estado: implementado — requiere acción humana** (llaves de Culqi en Vercel; ver `CULQI_SETUP.md`). Detalle en `docs/requirements-history.md`. ✓ `scripts/test-tienda-culqi.mjs`, `tests/e2e/tienda.spec.js`.

## REQ-335 - Primera semana: "Otra actividad" o deporte en días de gimnasio ya no bloquean el entreno

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `tests/e2e/semana-otra-actividad.spec.js`.

## REQ-336 - Primera semana: el coach trabaja en paralelo y el progreso se ve en la capa de espera

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `tests/e2e/semana-rapida.spec.js`.

## REQ-337 - Entreno: las series vienen precargadas con lo de la última vez

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

✓ `tests/e2e/entreno.spec.js` (Series precargadas).

## REQ-338 - Entreno: rutina propia editable de una vez y sugerida la próxima vez

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `tests/e2e/rutina-propia.spec.js`.

## REQ-339 - Avisos: medir la tarjeta y los fallos al activar

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Eventos con estado, plataforma e instalación; fallos con paso. ✓ `tests/e2e/avisos.spec.js`.

## REQ-340 - Avisos: correo con un toque en iPhone sin instalar

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

La tarjeta ofrece el correo a la hora elegida; activado, cubre y la tarjeta se va. ✓ `tests/e2e/avisos.spec.js`.

## REQ-341 - Avisos: pedirlos al sumar un día de racha

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Al cerrar la celebración, "¿Te aviso mañana?" (push o correo); máximo dos veces. ✓ `tests/e2e/avisos.spec.js`.

## REQ-342 - Tienda: imagen de cada plan que muestra el servicio

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Cada plan muestra comidas, entreno o progreso además de su duración. ✓ `scripts/test-tienda-culqi.mjs`, `tests/e2e/tienda.spec.js`.

## REQ-343 - Tienda: términos y devoluciones con todo lo que pide Culqi

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Términos y devoluciones siguen las secciones de las guías de Culqi; WhatsApp vuelve a enlazar. ✓ `tests/e2e/tienda.spec.js`.

## REQ-344 - Tienda: Libro de Reclamaciones con todo lo que pide Culqi

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Contacto del proveedor, declaración jurada como firma, quién recibe y respuesta del proveedor en la hoja. ✓ `scripts/test-tienda-culqi.mjs`, `tests/e2e/tienda.spec.js`.

## REQ-345 - Progreso: la racha en una sola tarjeta

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Número, hitos como paradas de una barra, desglose en una línea y amigos con un solo "Compartir". ✓ `tests/e2e/racha.spec.js`.

## REQ-346 - Entreno: repetir un entreno pasado y guardarlo para elegirlo otro día

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

✓ `tests/e2e/repetir-entreno.spec.js`.

## REQ-347 - Nutrición: "Registrar comida" alineado

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `tests/e2e/registrar-comida-estilos.spec.js`.

## REQ-348 - Racha: compartir envía tu invitación

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Compartir envía la racha con tu enlace de invitación. ✓ `tests/e2e/rachas-amigos.spec.js`.


## REQ-349 - Nutrición: restricciones vigentes, rechazo con reemplazo y continuidad semanal

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-350 - Facturación: el aviso de plan de la web vende los planes en soles con Culqi

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

✓ `tests/e2e/paywall-tienda.spec.js`.

## REQ-351 - Facturación: correos de vencimiento con enlace a los planes

**Estado: implementado — requiere acción humana** (aplicar `supabase/notifications_plan_expiry.sql`). Detalle en `docs/requirements-history.md`.

✓ `scripts/test-plan-expiry.mjs`.

## REQ-352 - Web pública en / y app en /app

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

✓ `tests/e2e/portada.spec.js`, `scripts/test-service-worker-cache.mjs`.

## REQ-353 - Portada sin beta; la beta solo en /beta

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

✓ `tests/e2e/portada.spec.js`.

## REQ-354 - Legales de la suscripción con semana gratis

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-355 - Motor de suscripción mensual con Culqi

**Estado: implementado.** `api/_tienda/suscripcion.js`: inscripción con prueba única, webhook verificado contra la API (+30 días por cobro, idempotente) y cancelación; `supabase/suscripciones.sql`; planes con `scripts/culqi-crear-planes.mjs`. Activación manual: plan §3, "Motor". REQ-356 debe pedir dirección, ciudad y celular.

✓ `scripts/test-suscripcion-culqi.mjs`.

## REQ-356 - /registro con tarjeta y semana gratis

**Estado: implementado.** `/registro` (Checkout de Culqi con monto 0, 3DS, renovación aceptada aparte y, sin días gratis, el cobro de hoy también) y llamadas a "Empieza tu semana gratis" en portada, `/planes` y la app sin sesión, todo solo con `TIENDA_SUSCRIPCION_ENABLED`. `/api/suscripcion` responde `sinPrueba` sin cobrar si falta esa aceptación.

✓ `tests/e2e/semana-gratis.spec.js`, `scripts/test-suscripcion-culqi.mjs`.

## REQ-357 - Gestionar la suscripción y sus correos

**Estado: implementado.** Perfil → Mi suscripción y `/cuenta` (web pública) muestran estado, próximo cobro y tarjeta, y cancelan con confirmación (`GET /api/suscripcion/estado`). Cinco correos del ciclo en `api/_tienda/suscripcion-correos.js`, una vez cada uno por su clave en `notification_log`; el aviso previo al primer cobro sale del cron de `/api/notify`, y REQ-351 omite a quien tiene una suscripción viva. Acción manual: aplicar `supabase/notifications_subscription.sql`. Plan §3, "Gestión y correos".

### Origen
Decisión de Jonathan (2026-11-06): cancelar en un toque y avisar antes de cada cobro.
### Problema
Sin cancelación fácil ni avisos llegan contracargos y reclamos.
### Objetivo
Ver el estado de la suscripción y cancelarla desde Perfil y desde la web pública, y recibir los correos del ciclo.
### Alcance
- Perfil → Mi suscripción: estado, próximo cobro, tarjeta (marca y últimos 4) y "Cancelar suscripción" con confirmación.
- La misma acción en la web pública, para quien usa la app nativa.
- Correos: inicio de la prueba, aviso 2 días antes del primer cobro, recibo de cada cobro, cobro fallido y cancelación. Se reutiliza `notification_log`.
- REQ-351 no avisa a quien tiene una suscripción activa.
### Fuera de alcance
Cambiar de tarjeta (llega después), otros planes recurrentes.
### Riesgos
Correos duplicados; que el acceso se corte antes de tiempo al cancelar.
### Criterios de aceptación
- Al cancelar, no hay más cobros y el acceso dura hasta el fin del período.
- Cada correo sale una sola vez.
### Verificación sugerida
Test Node con Culqi y Resend simulados, y E2E de Perfil.

## REQ-358 - Entreno: reemplazar una rutina actualiza el nombre, los visuales y Hoy

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-359 - Coach: conocer, revisar y guardar la rutina semanal

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-360 - Nutrición: la semana nueva repite lo que comes los días que cumples tu meta

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-361 - Avisos: "Ahora no" no calla la racha

**Estado: implementado.** Ver historial.

## REQ-362 - Nutrición: registrar alimentos por unidades

**Estado: implementado.** Ver `docs/requirements-history.md`.

## REQ-363 - Nutrición: configurar unidades enteras por alimento

**Estado: implementado.** Ver `docs/requirements-history.md`.

## REQ-364 - Hoy: acción principal y agenda plegable

**Estado: implementado.** Ver `docs/requirements-history.md`.

## REQ-365 - Navegación inferior flotante

**Estado: implementado.**

Referencia Platzi. Cinco pestañas visibles, selección accesible y avisos sobre la barra. PWA v224.

## REQ-366 - Hoy: sugerencia de técnica

**Estado: implementado.**

Con fuerza pendiente, muestra la demostración del primer ejercicio. El menú opcional tiene prioridad. Descarte por día y cuenta. PWA v225.

## REQ-367 - Hoy: avisos plegables

**Estado: implementado.**

Campana plegable para semana y recordatorios vigentes. Seguridad y agenda visibles. PWA v226.

## REQ-368 - Hoy: elegir entrenamiento en descanso

**Estado: implementado.** Selector de sesiones para hoy con las restricciones de seguridad. PWA v227.

## REQ-369 - Perfil: Entreno vuelve al alto de REQ-279

**Estado: implementado.** PWA v228.

## REQ-370 - Web pública: conservar el origen de campaña hasta la compra

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-371 - Web pública: inscripción corta al club en /unete

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-372 - Avisos: la prueba del horario no depende de la fecha

**Estado: implementado.** Ver historial. ✓ `validate-notify-schedule.mjs`.

## REQ-373 - Consola de administración para escritorio

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-374 - Beta: separar las opciones de «Dónde se rompe»

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-375 - Acceso: mostrar el progreso al entrar

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-376 - Web pública: píxel de Meta para medir la campaña de diciembre

**Estado: implementado — requiere acción humana** (configurar `META_PIXEL_ID` y `META_CAPI_TOKEN` en Vercel; el píxel ya existe y el texto de `/privacidad` se aprobó el 10 nov 2026). PWA v231. Ver `docs/medicion-campana.md` y `docs/requirements-history.md`.

✓ `scripts/validate-meta-pixel.mjs`, `scripts/test-meta-capi.mjs`, `tests/e2e/medicion.spec.js`.

## REQ-377 - Nutrición: variedad semanal y una sola entrada de preparación

**Estado: implementado.** Ver `docs/requirements-history.md`.

## REQ-378 - Coach: espera conversacional y sugerencias que respetan la petición

**Estado: implementado.** Ver `docs/requirements-history.md`.

## REQ-379 - Recuperar la racha después de uno o dos días fallados

**Estado: implementado.** Ver `docs/requirements-history.md`.

## REQ-380 - Compartir una imagen de la racha en redes sociales

**Estado: implementado.** Ver `docs/requirements-history.md`.

## REQ-381 - Tienda: cobro en dólares para Chile y Colombia

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

## REQ-382 - Administración: acciones de usuarios con estado visible, reset por correo y cortesía con coach

**Estado: implementado.** PWA v237. Detalle en `docs/requirements-history.md`. ✓ `scripts/test-admin-api.mjs`, `tests/e2e/admin-usuarios.spec.js`.

## REQ-383 - Recordatorios: resolver el timeout recurrente del cron

**Estado: implementado.** Presupuesto de ejecución y consultas acotadas; fixture de 31,7 a 3,2 s. Detalle en `docs/notify-runtime.md` y `docs/requirements-history.md`.

## REQ-384 - Administración: el correo de recuperación abre la app

**Estado: implementado.** Detalle en `docs/requirements-history.md`. ✓ `scripts/test-admin-api.mjs`, `tests/e2e/admin-usuarios.spec.js`.

## REQ-385 - Onboarding: entrenar sin fuerza es una opción más

**Estado: implementado.** Onboarding esencial según el feedback del 11/11. Detalle en `docs/requirements-history.md` y `docs/onboarding/2026-11-11-feedback.md`.

## REQ-386 - Onboarding: elegir qué entrenas cada día

**Estado: implementado.** Calendario de entrenamiento según el feedback del 11/11. Detalle en `docs/requirements-history.md` y `docs/onboarding/2026-11-11-feedback.md`.

## REQ-387 - Entreno: indoor cycling como actividad

**Estado: implementado.** Indoor cycling / spinning como actividad bajo techo. Detalle en `docs/requirements-history.md` y `docs/onboarding/2026-11-11-feedback.md`.

## REQ-388 - Onboarding: volver atrás en cada paso sin buscar el botón

**Estado: implementado.** «Atrás» visible desde el paso 2 y atrás del sistema con `popstate`. Detalle en `docs/requirements-history.md` y `docs/onboarding/2026-11-11-feedback.md`.

## REQ-389 - Onboarding corto: primera semana en 3 pantallas

**Estado: implementado.** Onboarding corto: primera semana en 3 pantallas. Detalle en `docs/requirements-history.md` y `docs/onboarding/2026-11-11-feedback.md`.

## REQ-390 - Completar el perfil de a pocos desde Hoy

**Estado: implementado.** Una pregunta de perfil al día desde Hoy, tras registrar comida o entreno. ✓ `scripts/test-profile-questions.mjs`, `tests/e2e/profile-questions.spec.js`. Detalle en `docs/requirements-history.md` y `docs/onboarding/2026-11-11-feedback.md`.

## REQ-391 - Cortesías anteriores: coach completo sin volver a otorgar acceso

**Estado: implementado.** Las cortesías vigentes completan automáticamente los permisos del coach antes de usarlo, también tras reiniciar la cuenta. Conserva el vencimiento y permisos suficientes más largos. Sin migración ni acción manual. Detalle en `docs/requirements-history.md`. ✓ `scripts/test-coach-quota.mjs`.

## REQ-392 - Hoy: un solo mensaje bajo la acción principal

**Estado: implementado.** `homeContextData()` deja un solo mensaje contextual bajo la acción principal; el resto espera en Avisos. ✓ `tests/e2e/home.spec.js`, `avisos.spec.js`. Detalle en `docs/requirements-history.md`.

## REQ-393 - Hoy: la bienvenida de regreso es el saludo

**Estado: implementado.** `homeGreetingData()`: saludo de regreso sin tarjeta ni «Racha 0». ✓ `tests/e2e/regreso.spec.js`. Detalle en `docs/requirements-history.md`.

## REQ-394 - Hoy: «Tu día» muestra comida y entreno

**Estado: implementado.** Comida y entreno en la misma tarjeta, sin ceros. PWA v252. ✓ `tests/e2e/home-optional-menu.spec.js`. Detalle en `docs/requirements-history.md`.

## REQ-395 - Hoy: check-in claro y placeholder legible

**Estado: implementado.** Check-in con título claro y omisión confirmada; placeholders AA. PWA v253. ✓ `tests/e2e/home.spec.js`. Detalle en `docs/requirements-history.md`.

## REQ-396 - Entreno: «Iniciar entreno» como acción principal, sin «sesión»

**Estado: implementado.** «Iniciar entreno», «Pausar/Reanudar entreno», «Terminar antes», «Me perdí el entreno» y el coach sin «sesión»; «Registrar otra actividad» es lima solo en descanso. PWA v258. ✓ `tests/e2e/entreno.spec.js` (REQ-396, 320/390 px). Detalle en `docs/requirements-history.md`.

## REQ-397 - Nutrición: comida vacía sin «Sin asignar» ni «Otra opción»

**Estado: implementado.** Comida vacía: «Nada registrado» y «Ver opciones»; el acceso al pie de «Comidas del día» es «Registrar algo que comí» y abre el mismo registro que el principal (REQ-330); el editor ofrece «Extra (se suma al día)» y «En lugar de una comida del plan». PWA v260. ✓ `tests/e2e/textos.spec.js`, `registro-extra-visible.spec.js`, `sustitucion.spec.js` (320/390 px). Detalle en `docs/requirements-history.md`.

## REQ-398 - Onboarding: errores junto al campo y todos a la vez

**Estado: implementado.** Un intento muestra todos los errores del paso, cada uno bajo su campo con `aria-invalid` y `aria-describedby`, foco en el primero y resumen «Revisa los N campos marcados.» junto al botón; ya no hay toast de validación. Cada mensaje se va al corregir su campo y nada pasa al paso siguiente. PWA v261. ✓ `tests/e2e/onboarding-essential.spec.js` (390 px), `accesibilidad.spec.js`. Detalle en `docs/requirements-history.md`.

## REQ-399 - Acceso: error del login junto al campo

**Estado: pendiente.** Auditoría heurística, severidad 2. Detalle en `docs/ux/2026-11-16-auditoria-heuristica.md`.

### Origen
Auditoría heurística de UX, 2026-11-16.
### Problema
«Pon correo y contraseña» aparece en gris bajo el botón, sin decir qué campo falta. No se valida el formato del correo. El placeholder `••••••••` parece una contraseña guardada.
### Causa raíz
`app/index.html:11275` y `:11162`.
### Objetivo
Saber qué corregir sin adivinar.
### Alcance
Mensaje por campo («Escribe tu correo», «Revisa el formato del correo», «Escribe tu contraseña») con `aria-invalid` y foco. Error en color de error. Contraseña sin placeholder. Aplica a entrar, registrarse y recuperar.
### Fuera de alcance
Errores de Supabase ya traducidos (REQ-375).
### Riesgos
`navegacion.spec.js` (REQ-375).
### Criterios de aceptación
Correo «malo» sin contraseña: dos mensajes, uno por campo, y foco en el correo.
### Verificación sugerida
`tests/e2e/navegacion.spec.js`.

## REQ-400 - Lenguaje: entreno y macros sin jerga

**Estado: pendiente.** Auditoría heurística, severidad 2. Detalle en `docs/ux/2026-11-16-auditoria-heuristica.md`.

### Origen
Auditoría heurística de UX, 2026-11-16.
### Problema
Se muestran «RPE 6/10», «repeticiones en reserva», «bloques» (dos veces en la misma tarjeta), «P 130 · C 146 · G 52 g», «sesión de calidad», «S1 74.7–75.3» sin rótulo y «Pausar» en las demos.
### Causa raíz
`app/index.html:2006-2070`, `:7411`, `:7163`, `:7459`, `:4119`, `:1990-1993`, `:8563` y `:6209`.
### Objetivo
Que el usuario sin experiencia entienda cada número.
### Alcance
«Esfuerzo 6/10» con «¿Qué es?» y «Termina con 3 repeticiones de sobra». «Ejercicios hechos 0/6», una sola vez. Proteína, carbohidratos y grasa sin abreviar en el onboarding. Nombres de sesiones sin «calidad». Rango de peso con rótulo («Meta: 74.7–75.3 kg»). «Pausar animación».
### Fuera de alcance
Lógica de RPE, progresión y rangos.
### Riesgos
Specs que leen esos textos.
### Criterios de aceptación
Ninguno de esos términos se ve sin explicación a 390 px.
### Verificación sugerida
`tests/e2e/entreno.spec.js`, `onboarding-essential.spec.js`, `peso-inicial.spec.js`.

## REQ-401 - Tienda: entrar a la app desde el encabezado

**Estado: pendiente.** Auditoría heurística, severidad 2. Detalle en `docs/ux/2026-11-16-auditoria-heuristica.md`.

### Origen
Auditoría heurística de UX, 2026-11-16.
### Problema
En `/planes`, `/contacto` y `/pago` el encabezado solo tiene «Planes» y «Contacto»: quien ya pagó no tiene cómo entrar.
### Causa raíz
`tienda/layout.js:11-14` (`NAV`).
### Objetivo
Entrar a la app desde cualquier página de la tienda.
### Alcance
Enlace «Iniciar sesión» a `/app/` en el encabezado de la tienda, como en la portada, legible a 320 px.
### Fuera de alcance
Portada, `/unete` y flujo de pago.
### Riesgos
Encabezado desbordado a 320 px.
### Criterios de aceptación
Las páginas de la tienda llevan a `/app/` en un toque, sin scroll horizontal a 320 px.
### Verificación sugerida
`tests/e2e/paywall-tienda.spec.js`, `legales-suscripcion.spec.js`.

## REQ-402 - Perfil: el aviso de actividad ligera no interrumpe

**Estado: pendiente.** Auditoría heurística, severidad 2. Detalle en `docs/ux/2026-11-16-auditoria-heuristica.md`.

### Origen
Auditoría heurística de UX, 2026-11-16.
### Problema
Si entrena solo fuerza, al abrir Perfil aparece el modal «Actividad ligera para tu salud», que tapa lo que venía a hacer.
### Causa raíz
`showCardioNudge("profile")` al renderizar Perfil (`app/index.html:9790`).
### Objetivo
Dar el consejo en contexto, sin bloquear.
### Alcance
Quitar el disparo al abrir Perfil. Mostrarlo como tarjeta descartable en Perfil › Entrenamiento, con la misma casilla y el mismo `UI.cardioNudgeDismissed`.
### Fuera de alcance
Aviso del onboarding y texto del consejo.
### Riesgos
Specs que esperan el modal en Perfil.
### Criterios de aceptación
Abrir Perfil no abre ningún modal. La tarjeta agrega la actividad igual que antes y no vuelve tras descartarla.
### Verificación sugerida
`tests/e2e/perfil.spec.js`.

## REQ-403 - Perfil: un guardado de fondo no revierte lo que el usuario acaba de guardar

**Estado: implementado.** `saveProfilePrefs` guarda en fila, registra la versión del plan antes de publicar `profile.prefs` y reaplica solo las claves que cambió cada llamador. ✓ `tests/e2e/perfil-guardado-concurrente.spec.js`. Detalle en `docs/requirements-history.md`.

## REQ-404 - Nutrición: los primeros días se registra, sin menú sugerido

**Estado: pendiente.** Serie REQ-404→407. Diseño y textos: `docs/nutrition-first-days.md`.

### Origen
Jonathan, 2026-11-16: antes de sugerir dietas, recopilar 3 a 5 días de comidas reales y avisarlo.
### Problema
El usuario nuevo recibe un menú antes de registrar una sola comida.
### Causa raíz
`saveOnboarding()` → `prepareFirstCycleWeek()` → `prepareFirstWeekNutrition()` (`app/index.html:4482`, `:4320`).
### Objetivo
Toda cuenta nueva empieza registrando lo que come, con aviso previo y avance visible.
### Alcance
`prefs.nutritionIntake`. Aviso al cerrar el onboarding. Sin menú inicial ni preparación automática; el entreno se prepara igual. Tarjeta «Día 2 de 3» y registrar como acción principal. Día completo: 2 comidas y 40 % de las kcal. Mínimo 3 días, 5 para cerrar solo, tope de 7. Salida «Prefiero recibir un menú ya».
### Fuera de alcance
Resumen (REQ-405), cuentas existentes (REQ-411), recordatorios propios.
### Riesgos
El menú llega el día 4 de la semana gratis (REQ-356). Specs que esperan menú tras el onboarding.
### Criterios de aceptación
Onboarding nuevo: aviso, cero comidas sugeridas y entreno listo. Al tercer día completo se ofrece el resumen. El tope o la salida preparan el menú actual. Persiste al recargar; una cuenta existente no cambia.
### Verificación sugerida
`tests/e2e/primeros-dias.spec.js`; regresión de `onboarding*.spec.js` y `home-optional-menu.spec.js`.

## REQ-405 - Nutrición: resumen de cómo comes y cambios sugeridos

**Estado: pendiente.** Depende de REQ-404. Reglas: `docs/nutrition-first-days.md`.

### Origen
Jonathan, 2026-11-16: analizar lo registrado y sugerir algunos cambios.
### Problema
Nada lee esos días: no hay resumen ni propuesta sobre las comidas del usuario.
### Causa raíz
No existe análisis del consumo; REQ-360 solo aprende platos repetidos en días en meta.
### Objetivo
Mostrar cómo come y hasta tres cambios concretos sobre sus propias comidas.
### Alcance
`analyzeIntakeDays()` pura en `js/nutrition-domain.js`: promedios frente a la meta, plato repetido y aporte por franja, franjas saltadas. Cambios `add/portion/swap/fill` y una cosa que ya funciona. Pantalla «Así comes» con Aceptar / Ahora no; lo aceptado va a `nutritionIntake.accepted`.
### Fuera de alcance
Armar el menú (REQ-406), redacción del coach, llamadas pagadas.
### Riesgos
Tono de juicio; sugerir un alimento vetado; registros a mano sin líneas.
### Criterios de aceptación
Con 3 días completos: promedios correctos y máximo 3 cambios, cada uno sobre una comida registrada. Proteína bajo el 90 % produce un `add`. Días en meta no producen cambios. Ninguno viola restricciones ni se aplica sin Aceptar. Sin comidas en analytics.
### Verificación sugerida
Script nuevo de `analyzeIntakeDays`, `primeros-dias.spec.js` y release gate.

## REQ-406 - Nutrición: el primer menú repite lo que registraste

**Estado: pendiente.** Depende de REQ-405. Reglas: `docs/nutrition-first-days.md`.

### Origen
Jonathan, 2026-11-16: las dietas se generan en base a lo que comes.
### Problema
El primer menú sale del catálogo y de preferencias declaradas, no de lo registrado.
### Causa raíz
`learnHabitualMeals()` exige 7 días registrados y 3 en meta (`HABIT_RULES`, `js/nutrition-domain.js:748`).
### Objetivo
El primer menú lleva en cada franja el plato que la persona ya come, con la porción ajustada.
### Alcance
Modo `intake`: aprende de los días completos del periodo, con 2 repeticiones y la mitad de los días, sin exigir meta. Aplica encima los cambios aceptados. Franjas sin hábito, con el catálogo. Solo platos con `dishSlug`.
### Fuera de alcance
Comidas fuera del catálogo (REQ-407); REQ-360 tras el primer menú.
### Riesgos
Repetir un plato que aleja de la meta: mandan el cierre del día y las restricciones.
### Criterios de aceptación
Desayuno repetido 2 de 3 días: el menú lo trae toda la semana con «Lo que sueles comer». Un cambio aceptado se ve en el menú. Un plato vetado no vuelve. Sin periodo, nada cambia.
### Verificación sugerida
`scripts/validate-habitual-meals.mjs`, `comidas-habituales.spec.js`, `primeros-dias.spec.js`.

## REQ-407 - Nutrición: tus comidas propias entran al menú

**Estado: pendiente.** Depende de REQ-406. Reglas: `docs/nutrition-first-days.md`.

### Origen
Jonathan, 2026-11-16: el menú parte de lo que la persona come, esté o no en el catálogo.
### Problema
Lo registrado a mano, por foto o por gramos sin plato del catálogo nunca vuelve como sugerencia.
### Causa raíz
REQ-360 dejó fuera del motor local los platos sin `dishSlug`.
### Objetivo
Una comida propia repetida se sugiere en su franja con la porción ajustada.
### Alcance
Candidata con su nombre y valores. Con líneas por gramos, se escalan con `lineLimits()`/`clampStep()`. Solo con totales, multiplicador de 0,5 a 1,5 en pasos de 0,25. No entra al catálogo compartido.
### Fuera de alcance
Convertirla en receta, compartirla, lista de compra.
### Riesgos
Valores mal estimados repetidos toda la semana; restricciones sin ingredientes que revisar.
### Criterios de aceptación
«Arroz con pollo» registrado a mano 2 de 3 almuerzos aparece en los almuerzos del menú, con porción en rango y macros recalculados. Tras «No me gusta» deja de sugerirse. Otra cuenta no la ve.
### Verificación sugerida
`scripts/validate-habitual-meals.mjs`, `primeros-dias.spec.js` y release gate.

## REQ-408 - Entreno: la misma rutina de fuerza todas las semanas del plan

**Estado: pendiente.** Serie REQ-408→410. Diseño: `docs/training-stable-routine.md`.

### Origen
Jonathan, 2026-11-16: en el gimnasio la rutina no debe cambiar semana a semana.
### Problema
Una misma sesión puede traer ejercicios distintos cada semana; así no se progresa en carga.
### Causa raíz
Cada semana se prepara por separado: `trainingWeekPrompt()` (`app/index.html:13812`) no recibe las semanas previas y `validatePlan()` (`training-plan.js:209`) no lo comprueba.
### Objetivo
Cada sesión de fuerza conserva ejercicios y orden todo el plan; solo cambia la dosis.
### Alcance
La semana 1 define los ejercicios; las semanas 2 a N se construyen en la app con la dosis de su fase. `validatePlan()` rechaza diferencias. En la revisión, «Otra sesión» cambia todas las semanas y se retira «Preparar otra semana N» para fuerza.
### Fuera de alcance
Deporte, planes activos, ediciones del usuario, rutina del coach (REQ-359).
### Riesgos
REQ-336 prepara las semanas en paralelo; la prueba gratis solo personaliza la semana 1.
### Criterios de aceptación
Planes de 4 y 10 semanas: cada sesión de fuerza repite ejercicios y orden; la descarga baja series. Una consulta al coach por plan. Un plan con diferencias no valida. Las ediciones de un día siguen funcionando.
### Verificación sugerida
`scripts/validate-training-plan.mjs`, `rutina-consistente.spec.js`, `entreno.spec.js`.

## REQ-409 - Entreno: carga y repeticiones sugeridas para hoy

**Estado: pendiente.** Depende de REQ-408. Tabla de reglas: `docs/training-stable-routine.md`.

### Origen
Jonathan, 2026-11-16: el sistema debe sugerir por defecto subir peso o alguna repetición.
### Problema
El usuario ve lo que hizo la última vez, no lo que le toca hoy.
### Causa raíz
`suggestedLoad` es un texto fijo (`workout-player.js:54`, `:276`) y `prefillStepFromLastTime()` (`app/index.html:6513`) copia la última vez.
### Objetivo
Cada ejercicio de fuerza con historial muestra y precarga la carga y repeticiones de hoy.
### Alcance
`progressionSuggestion()` pura: tope del rango completo → sube carga (2,5 kg; 5 kg en pierna pesada; 2 kg en mancuernas; máximo 10 %) y vuelve al inicio; dentro del rango → una repetición más; bajo el mínimo → repite. Resto de casos según el doc. Reproductor y lista del plan.
### Fuera de alcance
1RM, deporte, calentamiento, guardar la sugerencia.
### Riesgos
Sugerir de más tras una pausa o con mala técnica; chocar con REQ-337/346.
### Criterios de aceptación
3×12 con 40 kg en rango 8-12 → «Hoy: 42,5 kg × 8», precargado y editable. 12, 10, 9 → 40 kg y una repetición más. Sin historial no hay número. En descarga no sube. Sin RPE ni RIR en los textos.
### Verificación sugerida
`scripts/validate-workout-player.mjs`, `entreno.spec.js`, `repetir-entreno.spec.js`.

## REQ-410 - Entreno: el plan nuevo conserva tu rutina

**Estado: pendiente.** Depende de REQ-408. Diseño: `docs/training-stable-routine.md`.

### Origen
Jonathan, 2026-11-16: se sigue la misma rutina y se progresa sobre ella.
### Problema
Al empezar otro plan, la rutina se rehace y la acordada con el coach desaparece.
### Causa raíz
`weeklyRoutineSession()` (`app/index.html:7515`) descarta la rutina de otro ciclo; el plan nuevo parte de cero.
### Objetivo
El plan nuevo mantiene los ejercicios de cada sesión de fuerza, salvo que el usuario pida cambiarlos.
### Alcance
El ciclo nuevo reutiliza los ejercicios del plan anterior y la rutina del coach. La revisión dice «Mantienes tu rutina» y ofrece «Cambiar ejercicios». Si cambió el perfil, se conserva lo compatible y se avisa qué se sustituyó.
### Fuera de alcance
Cambiar días o duración del plan; historial.
### Riesgos
Arrastrar un ejercicio incompatible con el lugar, el nivel o una limitación.
### Criterios de aceptación
Ciclo nuevo sin cambios de perfil: mismas sesiones y ejercicios. Con equipo distinto: solo cambian los incompatibles, con aviso. «Cambiar ejercicios» prepara otra rutina. Las cargas sugeridas siguen desde el historial.
### Verificación sugerida
`tests/e2e/plan-weeks.spec.js`, `coach-rutina.spec.js` y release gate.

## REQ-411 - Nutrición: cuentas con historial ven «Así comes» sin periodo

**Estado: pendiente.** Serie REQ-411→413, tras REQ-407. Diseño: `docs/plan-from-history.md`.

### Origen
Jonathan, 2026-11-16: las cuentas existentes no pasan por el periodo, pero su dieta también debe salir de lo que comen.
### Problema
Quien ya tiene historial sigue recibiendo un menú de catálogo y nunca ve su resumen.
### Causa raíz
REQ-404..407 solo se activan con `nutritionIntake` de una cuenta nueva.
### Objetivo
Con historial suficiente, ofrecer el resumen y preparar el menú desde lo que ya come.
### Alcance
Cuenta sin periodo y con 3 días completos en los últimos 28: tarjeta única en Nutrición que abre «Así comes» (REQ-405) con esos días. Al aceptar, el menú siguiente usa el modo `intake` sobre 28 días. «Ahora no» la oculta 28 días.
### Fuera de alcance
Forzar el periodo; cambiar el menú vigente sin que el usuario prepare otro.
### Riesgos
Historial viejo o parcial que no representa cómo come hoy.
### Criterios de aceptación
Cuenta existente con 3 días completos: ve la tarjeta una vez; al aceptar, el menú nuevo trae sus platos repetidos. Con menos historial no cambia nada. El menú vigente no se toca.
### Verificación sugerida
`comidas-habituales.spec.js`, `nutricion-continuidad.spec.js` y release gate.

## REQ-412 - Nutrición: el menú aprende de lo que cumples

**Estado: pendiente.** Depende de REQ-411. Reglas: `docs/plan-from-history.md`.

### Origen
Jonathan, 2026-11-16: generar en base al histórico de lo que come y puede cumplir.
### Problema
Un plato que el usuario salta o reemplaza siempre vuelve a sugerirse; lo que come en su lugar no se aprende si el día no quedó en meta.
### Causa raíz
`learnHabitualMeals()` solo usa días en meta (`js/nutrition-domain.js:783`) y `habitualMealsHistory()` (`app/index.html:13444`) ignora `ms.skipped` y `ms.ovr.userSet`.
### Objetivo
Cada menú nuevo repite lo cumplido y deja de sugerir lo que no se cumple.
### Alcance
Ventana de 28 días. Plato hecho 2 veces y en la mitad de los días de su franja: habitual aunque el día no esté en meta, con porción ajustada. Plato saltado o reemplazado 2 veces y cumplido menos de la mitad: en pausa 28 días en esa franja. El reemplazo repetido toma la franja.
### Fuera de alcance
Vetos explícitos, metas de macros, guardar la pausa en el perfil.
### Riesgos
Menús monótonos; pausar un plato por una mala semana. Elegirlo a mano levanta la pausa.
### Criterios de aceptación
Avena saltada 3 de 4 desayunos no vuelve la semana siguiente; el pan con huevo que la reemplazó sí. Elegir la avena a mano la devuelve. Ningún plato vetado reaparece.
### Verificación sugerida
`scripts/validate-habitual-meals.mjs`, `comidas-habituales.spec.js`.

## REQ-413 - Nutrición: sugerencias de mejora en el check-in semanal

**Estado: pendiente.** Depende de REQ-412. Reglas: `docs/plan-from-history.md`.

### Origen
Jonathan, 2026-11-16: el historial debe traer sugerencias de mejoras.
### Problema
Tras el primer resumen, nadie vuelve a proponer cambios sobre lo que la persona come.
### Causa raíz
El check-in (`openWeeklyCheckin()`) solo ajusta metas; no lee las comidas registradas.
### Objetivo
Cada semana, hasta dos mejoras concretas sobre sus comidas, que acepta o descarta.
### Alcance
Bloque «Tu comida esta semana»: `analyzeIntakeDays()` sobre 14 días con 3 completos. Tipos de REQ-405 más `drop` (franja saltada la mitad de los días: repartirla). Aceptar cambia lo pendiente; «Ahora no» dura 28 días. Siempre una línea de lo que va bien.
### Fuera de alcance
Cambiar metas, avisos push, redacción del coach.
### Riesgos
Alargar el check-in; insistir con lo descartado.
### Criterios de aceptación
Con proteína baja 14 días aparece un `add` sobre una comida suya; aceptarlo cambia las comidas pendientes. Lo descartado no vuelve en 28 días. Con días en meta no hay sugerencias.
### Verificación sugerida
Spec E2E nuevo del check-in, script de `analyzeIntakeDays` y release gate.

## REQ-414 - Entreno: la rutina se ajusta a lo que cumples

**Estado: pendiente.** Depende de REQ-410. Tabla de señales: `docs/plan-from-history.md`.

### Origen
Jonathan, 2026-11-16: las rutinas también se generan desde el histórico y lo que la persona puede cumplir.
### Problema
El plan sale de lo declarado. Si entrena 3 de 5 días, siempre sustituye un ejercicio u omite otro, el plan siguiente repite lo mismo.
### Causa raíz
`trainingExpectedWeeks()` (`app/index.html:13701`) solo lee preferencias; `originalExerciseSlug`, `status:"skipped"` y `weeklyCheckinStats()` (`:17879`) no alimentan nada.
### Objetivo
Proponer hasta tres ajustes de rutina según lo hecho en las últimas 4 semanas.
### Alcance
`analyzeTrainingHistory()` pura: sustitución repetida → dejarla fija; ejercicio omitido → cambiarlo o quitarlo; menos del 70 % de sesiones dos semanas → menos días; sesiones parciales o largas → acortar; 90 % y series completas 3 semanas → sumar. En el check-in y en la revisión del plan nuevo. Se aplica a lo pendiente con `weeklyRoutine` o los días del perfil.
### Fuera de alcance
Cargas (REQ-409), deporte, historial.
### Riesgos
Recortar tras una semana atípica; sumar en modo suave (no se ofrece).
### Criterios de aceptación
Sentadilla cambiada por prensa 2 de 3 veces: se propone dejar la prensa y, al aceptar, queda en las sesiones pendientes y en el plan nuevo. 3 de 5 días dos semanas: se propone rutina de 3 días. Nada cambia sin aceptar; lo descartado no vuelve en 28 días.
### Verificación sugerida
Script nuevo de `analyzeTrainingHistory`, `coach-rutina.spec.js`, `plan-weeks.spec.js`.
