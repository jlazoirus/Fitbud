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

Serie "feedback Claudia" (beta, 2026-10-16, día Pull en iPhone). Orden: lo que hoy le impide cerrar bien su entreno primero, luego lo que lo hace más cómodo, luego nutrición:

- REQ-185 - Fix Entreno: una serie sin marcar deja la sesión "parcial" sin forma de corregirla. (P0; implementado)
- REQ-186 - Fix Entreno: el cronómetro de descanso se queda congelado. (P0; implementado)
- REQ-187 - Entreno: descanso cronometrado entre ejercicios (2:00 por defecto, configurable). (P1; implementado)
- REQ-188 - Nutrición: reutilizar comidas recientes y favoritas, y registrar alimentos sueltos por gramos. (P1; implementado)

Serie "feedback flujo beta" (Jonathan, 2026-10-18). Orden: lo que hoy rompe la beta primero (cobro), luego lo que confunde en el alta y el entreno, luego funciones nuevas:

- REQ-208 - Beta: quien entra a la beta no ve precios ni cobro durante sus 90 días; cobro siempre en la web. (P0; implementado)
- REQ-209 - Fix: la app no ocupa todo el ancho y siempre hay una barra de scroll. (P0; espera captura para reproducir; mitigación en REQ-221)
- REQ-210 - Progreso: la semana 1 usa el peso y la grasa del onboarding. (P1; implementado)
- REQ-211 - Onboarding: el objetivo y el "ritmo del plan" se entienden a la primera. (P1; implementado)
- REQ-212 - Entreno: calentamiento y vuelta a la calma con movimientos concretos y cronómetro opcional. (P1; implementado)
- REQ-213 - Actualizaciones de la app sin botón "Actualizar app" que estorbe. (P1; implementado)
- REQ-214 - Plan: empezar de nuevo (4 o 10 semanas) en cualquier momento. (P1; implementado)
- REQ-215 - Nutrición: lista de compra semanal con "ya lo tengo" y "por comprar". (P2; implementado)
- REQ-216 - Modo conversacional (beta oculta). (P2; fase 1 implementada)

Pausado esperando decisión de producto (ver REQ-147; no está en `agent-loop.json` hasta entonces):

- REQ-143 - Catálogo lote 3: crecimiento drástico dirigido por el canario del contrato. Dos lotes medidos con el diff de REQ-144 (2026-07-05 y 2026-07-08) confirman un techo cercano a 32%-33% bajo la selección actual; ver actualización 2026-07-08 en el REQ y REQ-147.

Pendiente no automatizable por agentes:

- REQ-49 - Revision legal pre-lanzamiento.
- REQ-60 - Configuracion manual de redirects en Supabase.
- REQ-127 - Personalizar remitente/asunto de correos de Supabase (branding Fitbud).
- REQ-70 - Validacion de negocio y beta con usuarios reales.
- REQ-209 - Scroll/ancho: falta captura y dispositivo para reproducir.
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

**Estado: pendiente. Requiere acción humana: sus criterios de aceptación ("subir de forma sustancial desde 32.3%") quedaron obsoletos y hay que re-basarlos antes de retomarlo; no implementable por el agente autónomo hasta esa decisión.**

El "techo de catálogo ~32-33%" que motivaba este REQ **no existía**: era la función objetivo de `globalClosePass()`, corregida en REQ-166. El canario pasó de 122/378 (32.3%) a 289/378 (76.5%) sin agregar un solo plato. Las dos sesiones de lotes de catálogo (2026-07-05 y 2026-07-08) estaban alimentando un solver que optimizaba la métrica equivocada, y sus conclusiones sobre el contenido no son válidas.

Lo que queda es un hueco de catálogo **real y ahora sí medible**: las 7 dimensiones que siguen en 0/7 son todas de **2 comidas** (cerrar 2250 kcal / 190 g de proteína en dos comidas) más vegano/`sin_tofu`. Si se retoma, el alcance debe apuntar solo ahí y medirse con `scripts/diff-diet-contract.mjs` contra la línea base nueva de 289/378, no contra 122/378. Detalle histórico de los experimentos (hoy superados): `docs/requirements-history.md` (buscar `## REQ-143`).

## REQ-144 - Medir impacto incremental de catálogo contra el canario antes de aceptar platos nuevos

**Estado: implementado.** `scripts/diff-diet-contract.mjs` compara dos `seed.sql` y reporta el delta de `okDays` total, catálogo, causas y las 54 dimensiones; `scripts/validate-diet-contract-diff.mjs` lo valida y el release gate lo ejecuta. Detalle, motivación (REQ-143) y guía operativa: `docs/diet-contract-catalog-diff.md` y REQ-143 de `docs/requirements-history.md`.

## REQ-145 - Fix E2E: el fixture de entreno deja "hoy" sin sesión de fuerza los domingos y pone el release-gate en rojo

**Estado: implementado.** El perfil E2E usa `trainingPriority:"strength"` para que los 4 slots sean de fuerza aun cuando Domingo quede ultimo tras la normalizacion Lunes..Domingo; `trainingDaysIncludingToday(referenceDate)` permite validar los 7 dias y `scripts/validate-e2e-training-fixture.mjs` queda en el release gate. No se modifico runtime de la app. Detalle historico: `docs/requirements-history.md` (buscar `## REQ-145`).

## REQ-146 - Unificar el cálculo de racha: Progreso muestra "0 / racha rota" mientras hoy no se registra

**Estado: implementado.**
`streakStats()` (`index.html`) comparte ahora el criterio de `streak()`: el día en curso que aún no cumple no resetea `nutCur`/`trainCur`/`combCur`, solo un día ya vencido sin cumplir lo hace; `combBest` no cambia de fórmula, así que hitos y mejor racha no se alteran retroactivamente. `renderStreakSection()` no se tocó: al unificarse `combCur` con `streak()`, el banner de recuperación deja de dispararse solo por "hoy pendiente". Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/racha.spec.js`.

## REQ-147 - Decidir si vale la pena tocar la selección de `planDeterministicNutritionDay()`/`globalClosePass()` para superar el techo de catálogo del canario `DIET_CONTRACT`

**Estado: implementado.** Cerrado con decisión de producto (Jonathan, 2026-08-30): no había techo de catálogo; el ~32-33% del canario `DIET_CONTRACT` venía de que `globalClosePass()` optimizaba `scoreMacros()` (asimétrico) mientras el contrato exige tolerancias duras y simétricas (100% de los fallos de carbohidratos eran por exceso). Se autorizó una cuarta opción —corregir la función objetivo del cierre sin tocar la selección de platos (REQ-143 intacto)— implementada en REQ-166 (canario 32.3%→76.5%, 38/54 dimensiones, sin regresiones). Aprendizajes para futuras corridas: ampliar el pre-rankeo 48→200 no mueve el canario (medido y descartado, no reintentar); la etiqueta `catalog_gap` era un diagnóstico incorrecto y costó dos sesiones de lotes de catálogo. Detalle completo en git (commit de REQ-166) y en REQ-143.

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

**Estado: implementado.**

`mealHasContent(v)` (`index.html`) centraliza el criterio de "contenido real" (nombre o algún macro), igual que ya exigía `homeDayHasPreparedMeals`. `toggleMeal()` ignora el intento de marcar como hecha una comida sin contenido (toast explicativo); el botón `.chk` en `mealCard()` sale `disabled` en ese caso. `dayTotals()` y `nutritionDayDone()` solo cuentan como cumplida la comida `done` que además tenga contenido real, como defensa adicional si `done:true` llegara por otra vía. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/home.spec.js` (confirmado que el test falla exactamente como describe el REQ contra el código sin el fix); ajustado el fixture de `tests/e2e/racha.spec.js` (REQ-146) para que sus días "cumplidos" simulen comidas con contenido real, ya que antes se apoyaba en el comportamiento que este REQ corrige.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-161`).

## REQ-162 - Fix Nutrición: la tarjeta y la suma del día muestran la receta base del catálogo, no los macros materializados del plan

**Estado: implementado.**

`mealValue()` y `mealRecipe()` (`index.html`) ahora priorizan `base.src==="nutritionPlan"` (con `base.kcal>0`/`base.ingredientes`) sobre la resolución por `dishName` en el catálogo, siempre que no haya un override que cambie de plato (`!o||o.dishName==null`) — si el usuario reemplazó la comida (REQ-154), esa ruta sigue ganando. Sin snapshot materializado, la resolución por catálogo sigue funcionando igual que antes (compatibilidad). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-nutritionplan-priority.mjs` (4 casos: snapshot gana al catálogo en macros e ingredientes, un reemplazo explícito sigue ganando al snapshot, y sin snapshot la compatibilidad con catálogo no se rompe; confirmado que el caso principal falla exactamente como describe el REQ —165 vs 495 kcal— contra el código sin el fix).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-162`).

## REQ-163 - Fix Entreno: una sesión abandonada en curso cuenta como entreno "hecho" e infla la racha

**Estado: implementado.**

`trainingDayResult()` (`index.html`) ya no cuenta "done" por `workoutHasRecordedActivity()` (cualquier bloque omitido o serie marcada, sin exigir cierre); ahora exige un resultado TERMINAL vía `workoutOutcomeForState(st)` (`completed`/`partial`) o el legado `st.workoutDone`. `workoutHasRecordedActivity()` no se tocó (otros usos, p. ej. protección de días en REQ-126, siguen queriendo detectar cualquier actividad). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/entreno.spec.js` (inicia sesión, omite un bloque y abandona sin finalizar; confirmado que el test falla exactamente como describe el REQ —"done" en vez de "missed"— contra el código sin el fix).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-163`).

## REQ-164 - Fix Progreso: la variación de peso on-target se pinta como advertencia en metas de volumen/mantenimiento

**Estado: implementado.**

`goalAwareDeltaColor(delta,goal)` (`index.html`) centraliza el color de `Δ peso (sem)`/`Δ grasa %` en `bodyComposition()` según `prefs.goal`: volumen (subir=bueno), mantenimiento (tolera hasta ±0.4, mismo umbral que el check-in de REQ-160), deficit/fallback (bajar=bueno, sin cambio de sentido). `composition()` no se tocó. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/progreso.spec.js` (meta volumen + 2 semanas de peso ascendente; confirmado que el test falla exactamente como describe el REQ —`var(--warn)` en vez de `var(--good)`— contra el código sin el fix).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-164`).

## REQ-165 - Fix check-in semanal: las escalas sin responder se leen como el peor valor y disparan ajustes falsos

**Estado: implementado.**

`analyzeCheckinAnswers()` (`index.html`) neutraliza `answers.energy`/`answers.sleep` con `||3` (punto medio) en la rama de hambre/energía, igual que ya hacían nutrición/dificultad/recuperación — antes, `null<=2` evaluaba `true` y una escala nunca respondida se leía como "energía/sueño bajos", disparando mensajes y ajustes de calorías sobre datos inexistentes (incluso con `keep:true`). `hunger` no se tocó (su comparación `>=4` ya era segura ante `null`). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-checkin-goal-mapping.mjs` (3 casos nuevos: check-in vacío → sin razón fantasma; hambre alta + energía/sueño sin responder = mismo ajuste que con energía/sueño altos; energía/sueño realmente bajos siguen generando el aviso; confirmado que fallan exactamente como describe el REQ contra el código sin el fix).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-165`).

## REQ-166 - La pasada global de cierre optimiza el contrato, no `scoreMacros()`

**Estado: implementado.**

`scoreDayAgainstContract()` (`js/nutrition-domain.js`) reemplaza a `scoreMacros()` como objetivo del hill-climbing de `globalClosePass()`: mide cada métrica en múltiplos de su propia tolerancia de `DIET_CONTRACT` y la eleva al cuadrado, así que las 4 pesan igual en unidades de contrato. No cambia qué plato se elige en ningún slot — `scoreMacros()` sigue siendo el score por comida de `solveDishPortion()`/`optimizeLines()`. Canario `validate-diet-contract.mjs`: 122/378 (32.3%) → 289/378 (76.5%), 34 dimensiones mejoran, **0 regresionan**, dimensiones al 100% de 5/54 a 38/54. Validador: `scripts/validate-global-close-objective.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-166`).

## REQ-167 - Fix activación de cuenta: "Auth session missing!" crudo al crear la contraseña desde una invitación

**Estado: implementado.**

`finishPasswordRecovery()` revalida la sesión del enlace con `getSession()` antes de `updateUser()`, bloquea el botón mientras trabaja y traduce el error a español; si la sesión ya no existe, muestra la pantalla "No pudimos abrir el enlace" con el siguiente paso.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-167`).

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

**Estado: implementado.**

### Origen

Feedback de Claudia (beta, 2026-10-18): aunque tenga día de descanso, si no le apetece descansar quiere añadir que hoy entrenó, qué hizo y que la app le estime cuánto gastó según el deporte.

### Problema

Un día de descanso solo mostraba "Descanso planificado" sin acciones, y un día de entreno solo admitía la sesión guiada del plan. No había forma de registrar otra actividad ni de saber su gasto.

### Alcance

1. `dayState(ds).manualActivities` (`{id,sport,minutes,intensity,notes,kcal,weightKg,loggedAt}`), sincronizado con el resto de `day_log.state` sin migración (el merge de `sync-conflicts.js` ya conserva campos nuevos); `validateDayLogState()` exige que sea array si existe.
2. Estimación determinista, sin llamadas externas: `kcal = MET × kg × horas`, redondeada a 5, con 16 deportes y tres intensidades (MET aproximados del Compendio de Actividades Físicas). Peso: el último registrado, el del perfil o 70 kg de referencia (la app lo avisa).
3. Entreno: sección "Actividad registrada" con "Hoy entrené igual: registrar actividad" (descanso) o "＋ Registrar otra actividad" (día de entreno); editar y quitar. Modal con deporte, minutos, intensidad, detalle opcional y estimación en vivo.
4. Hoy: la fila de descanso de la agenda ofrece "Entrené igual" sin contar como pendiente, y la tarjeta de descanso de la acción del día "Hoy entrené igual"; con actividad registrada ambas lo resumen.
5. Una actividad registrada cuenta como día entrenado: `workoutOutcomeForState()` la trata como completada y `trainingDayResult()` devuelve `done` también en descanso. Solo hoy o días pasados; no con la pausa por seguridad activa.
6. `CACHE_NAME` → `fitbud-pwa-v90`.

### Fuera de alcance

- Sumar las calorías gastadas al objetivo de comida del día.
- Importar actividades de relojes o apps de salud.

### Riesgos

- La estimación MET es aproximada (±20-30%); la UI la presenta como "≈ … kcal gastadas" y estimación.

### Criterios de aceptación

- En un día de descanso se registra "Pádel 60 min moderada" y la app estima ≈ 450 kcal con 75 kg; el día pasa a contar como entrenado y al quitarla vuelve a descanso. ✓
- En un día de entreno se registra otro deporte y el día cuenta como entrenado. ✓
- La fila de descanso no infla el contador de pendientes de Hoy. ✓
- `node scripts/release-gate.mjs` pasa. ✓ (`tests/e2e/actividad-manual.spec.js`)

## REQ-207 - Fix: "Estimar con foto" no deja elegir una foto de la galería

**Estado: implementado.**

### Origen

Jonathan (2026-10-19): al estimar una comida con foto, el móvil solo abre la cámara; no se puede elegir una foto ya hecha.

### Causa raíz

Los dos selectores de foto (`#f_photo` en el editor de comidas, REQ-172, y el de la foto del resumen de progreso) declaraban `capture="environment"`, que en iOS y Android abre directamente la cámara trasera y omite la fototeca. El resumen incluso dice "Tomar o elegir foto".

### Alcance

1. Quitar `capture` de ambos inputs (`accept="image/*"` se mantiene): el sistema muestra su menú nativo con fototeca, cámara y archivos.
2. `tests/e2e/foto-comida.spec.js` y `scripts/validate-meal-photo-estimate.mjs` (que exigía `capture`) comprueban ahora que el input no fuerza la cámara.
3. `CACHE_NAME` → `fitbud-pwa-v91`.

### Fuera de alcance

- Elegir varias fotos a la vez.

### Riesgos

- Ninguno: la cámara sigue disponible desde el mismo menú del sistema.

### Criterios de aceptación

- Ningún `<input type="file">` de la app declara `capture`. ✓
- En iPhone, "Estimar con foto" ofrece "Fototeca" y "Tomar foto" (verificación manual tras el deploy).
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-208 - Beta: quien entra a la beta no ve precios ni cobro durante sus 90 días

**Estado: implementado.** Acceso beta sin precios (paywall → aviso neutro, Perfil "Acceso beta"), casilla beta de 90 días en Admin, reintento del canje de invitación e invariante de cobro en la web.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-208`).

## REQ-209 - Fix: la app no ocupa todo el ancho y siempre hay una barra de scroll

**Estado: pendiente. Requiere acción humana: captura y dispositivo/navegador donde se ve, para reproducir; no implementable por el agente autónomo hasta tenerlos.**

### Origen

Feedback beta de Jonathan (2026-10-18): "hay que arreglar el scroll horizontal; no coge todo el ancho de la pantalla y siempre hay una barra de scroll".

### Problema

No se pudo reproducir en Chromium móvil emulado (2026-10-18): Hoy, Nutrición, Entreno (también con el reproductor abierto), Progreso, Perfil con todos sus acordeones, los 4 pasos del onboarding, la portada y `beta-reclutamiento.html` (versión anterior al rediseño de REQ-199), a 360, 375 y 390 px, tienen `scrollWidth == clientWidth`, ningún elemento sobresale de `#app` y ningún contenedor tiene scroll horizontal propio.

### Causa raíz (hipótesis a confirmar)

- `index.html:76-77`: `body` es `height:100dvh; overflow:hidden` y el scroll vive en `#app` (`index.html:84-85`, `overflow-y:auto; max-width:560px`), no en el documento. En escritorio, y en navegadores con barras clásicas (Windows, o macOS con "mostrar barras siempre"), la app es una columna de 560 px con su propia barra vertical en medio de la pantalla. Eso encaja con "no coge todo el ancho" y "siempre hay una barra".
- En iOS, `overflow-x:hidden` solo está en `body`/`#app` y no en `html`. Si algún contenido real (nombres largos de platos o ejercicios del coach, que los mocks no tienen) desborda, Safari permite arrastrar la página de lado.

### Objetivo

En cualquier dispositivo, la app ocupa el ancho disponible de forma intencional y no muestra barras de scroll que no aporten.

### Alcance (una vez reproducido)

1. Según la evidencia: o la barra de `#app` se estiliza/oculta (`scrollbar-gutter`, `scrollbar-width:thin`), o el scroll pasa al documento manteniendo la barra de tabs fija; en móvil, `overflow-x:clip` en `html` y corte de palabras largas (`overflow-wrap:anywhere`) en títulos de platos y ejercicios.
2. E2E que falle con el código actual en el caso reproducido.

### Criterios de aceptación

- El caso de la captura deja de verse; sin regresión en `tactil.spec.js`, `accesibilidad.spec.js` y `portada.spec.js`.

### Verificación sugerida

- Jonathan: captura + modelo de teléfono/navegador (o "escritorio, Chrome en Windows").

## REQ-210 - Progreso: la semana 1 usa el peso y la grasa del onboarding

**Estado: implementado.** El peso y la grasa del alta quedan como semana 1 (y se rellenan una vez en cuentas existentes); Progreso muestra "Tu punto de partida" en vez de pedirlos otra vez.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-210`).

## REQ-211 - Onboarding: el objetivo y el "ritmo del plan" se entienden a la primera

**Estado: implementado.** Objetivo como "Bajar grasa / Recomponer mi cuerpo / Ganar músculo" con una línea de ayuda; "Intensidad del entreno" (Recomendada para ti / Suave / Completa) con ayuda viva y "¿Qué cambia?".

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-211`).

## REQ-212 - Entreno: calentamiento y vuelta a la calma con movimientos concretos y cronómetro opcional

**Estado: implementado.** Calentamiento y vuelta a la calma con 4-6 movimientos concretos según la zona de la sesión; "Guíame" movimiento a movimiento con cronómetro opcional, o "Ya calenté".

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-212`).

## REQ-213 - Actualizaciones de la app sin botón "Actualizar app" que estorbe

**Estado: implementado.** Sin botón flotante "Actualizar app": la versión nueva se aplica sola al volver de segundo plano si no hay nada a medias; tras 24 h sin momento seguro se ofrece en Perfil → Cuenta.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-213`).

## REQ-214 - Plan: empezar de nuevo (4 o 10 semanas) en cualquier momento

**Estado: implementado.** Perfil → Objetivo "Empezar de nuevo mi plan" (4 o 10 semanas) archiva el ciclo como interrumpido y arranca hoy desde la semana 1; tras 14 días sin entrenar, Hoy sugiere retomar o empezar de nuevo.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-214`).

## REQ-215 - Nutrición: lista de compra semanal con "ya lo tengo" y "por comprar"

**Estado: implementado.** Nutrición → "Lista de compra · semana N": cantidades de lo que queda de semana (o la semana completa) sobre las comidas efectivas, agrupadas por categoría, con "Ya lo tengo"/"Por comprar" guardado por semana y compartir lo que falta.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-215`).

## REQ-216 - Modo conversacional (beta oculta): usar la app desde el chat

**Estado: implementado.** Fase 1 en prueba: el enlace `/?labs=conversacion` habilita en la cuenta un modo "Conversación" (Perfil → Cuenta) con un hilo donde se entrena paso a paso, se marcan o cambian comidas y se registra el peso con tarjetas sin llamadas pagadas; el texto libre va al coach de siempre. Fases 2 (foto e intención libre) y 3 (métricas por modo) quedan como candidatos.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-216`).

## REQ-217 - Beta: la postulación cierra con una confirmación amable y sin callejones sin salida

**Estado: implementado.**

### Origen

Jonathan (2026-10-19): quien postula tiene que saber, de forma amable, que sus datos llegaron, que se revisarán y que se le escribirá si queda. La crítica de impeccable (19/36) encontró además: tras enviar, el formulario seguía visible y se podía volver a enviar; la API rechazaba "Dónde se rompe" vacío y casos de menos de 20 caracteres que el navegador dejaba pasar, con mensajes sin tildes ("WhatsApp invalido.") y un "intenta más tarde" engañoso; "Limpiar" borraba todo junto al botón de enviar; recargar perdía lo escrito; elegir una cuarta fricción desmarcaba otra.

### Alcance

1. Al enviar, el formulario se reemplaza por un panel "¡Gracias, {nombre}! Ya tenemos tu postulación." con el número de WhatsApp al que se le escribirá y tres pasos (recibida → la revisamos → te escribimos). Recibe el foco. Ya no muestra el número de postulación.
2. Validación igual a la API: al menos una fricción (contador "n de 3"), historia de 20 a 1400 caracteres, WhatsApp de 8 a 15 dígitos con código de país, `maxlength` en nombre y ciudad. La cuarta fricción no se marca y se avisa.
3. `api/beta-recruitment.js`: mensajes en español claro con tildes; los 500 no exponen texto interno. Si el error nombra un campo, la página lleva el foco ahí.
4. Borrador en `localStorage` (con try/catch) que se borra al enviar; sin botón "Limpiar"; el aviso de salud pasa arriba de la historia.

### Criterios de aceptación

- `tests/e2e/beta.spec.js`: envío completo muestra el panel y oculta el formulario; sin fricción no se envía; la cuarta fricción no desmarca otra; el borrador sobrevive a recargar; un 400 de WhatsApp se explica y enfoca el campo. ✓
- impeccable sin hallazgos; axe sin violaciones en el panel. ✓

## REQ-218 - Admin: pantalla "Postulantes beta" para revisar, aceptar con 90 días y avisar por WhatsApp

**Estado: implementado.**

### Origen

Jonathan (2026-10-19): necesita ver a los postulantes y aceptarlos de forma clara, y que al aceptarlos se les asignen por defecto los 3 meses gratis con las cuotas del coach. Hasta ahora solo existían scripts de terminal (REQ-203).

### Alcance

1. `api/admin.js` (solo admin activo): `betaApplicants` (filtros por revisar / aceptados / descartados / todos, con conteos), `betaAccept` (código de 90 días del plan `quarterly`, activable 30 días, auditado con el admin; postulación en `beta_invited` con nota; devuelve mensaje, enlace `/?codigo=` y `wa.me`) y `betaSetStatus` (`new`, `shortlisted`, `rejected`, `archived`; `beta_invited` solo se pone aceptando).
2. `index.html`: Perfil → Administración → "Postulantes beta" (vista `adminBeta`, solo admin). Tarjetas con datos legibles, historia plegable, aviso de lesión, "Aceptar (90 días)", "Descartar", "Volver a revisar", "Generar enlace nuevo" y "Abrir WhatsApp". Al aceptar, modal con el mensaje, "Enviar por WhatsApp" y "Copiar mensaje". SW v92.
3. `BETA_PROGRAM.md`: revisar y aceptar desde la app; la terminal queda como alternativa.

### Criterios de aceptación

- `scripts/test-admin-beta-api.mjs` (gate): conteos, código de 90 días `quarterly` auditado, `beta_invited` con nota, mensaje y `wa.me` correctos, ids inválidos, estados no permitidos y 403 para no admin. ✓
- `tests/e2e/admin-beta.spec.js`: el admin acepta y ve el mensaje con el enlace; un usuario normal no entra a la vista. ✓

## REQ-219 - Portada: los CTA del hero, la navegación y el subtítulo no respetan `SIGNUP_MODE=open`

**Estado: implementado.** Con `SIGNUP_MODE=open`, hero, navegación, subtítulo de precios y cierre de la portada llevan al registro directo; se actualizan in situ cuando el modo llega después del pintado optimista.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-219`).

## REQ-220 - Fix táctil: "¿Qué es RPE?" medía 42 px y dejaba el release gate en rojo

**Estado: implementado.**

### Origen

`tests/e2e/tactil.spec.js` (REQ-193) fallaba en `main` desde 2026-10-18: el enlace "¿Qué es RPE?" del resumen de Entreno (`.link-btn.small`) medía 100×42 px en táctil. El gate quedaba en rojo para todos los loops.

### Alcance

1. `@media(pointer:coarse)`: `.link-btn` con `min-height:44px` y `box-sizing:border-box`, sin cambiar su aspecto. SW v93.

### Criterios de aceptación

- `tactil.spec.js` pasa y el release gate queda en verde. ✓

## REQ-221 - Mitigación de REQ-209: nada desborda la columna y la barra de escritorio es discreta

**Estado: implementado.**

### Origen

REQ-209 (feedback beta 2026-10-18: "no coge todo el ancho y siempre hay una barra de scroll") no se reprodujo en Chromium móvil (360-414 px) ni en producción (`evolvapp.club/beta` a 375 px). Mientras llega la captura, se cierran las causas plausibles. Una prueba encontró una real: con un nombre de plato sin espacios, la tarjeta "Próxima comida" de Hoy (`.agenda-name`) se estiraba a 936 px dentro de la columna.

### Alcance

1. `html{overflow-x:clip}`: iOS no deja arrastrar la página de lado.
2. `#app` con barra fina (`scrollbar-width:thin`), para escritorio con barras clásicas.
3. `overflow-wrap:break-word` en `#app` y `anywhere` en títulos, nombres de comida/agenda/ejercicio, lista de compra y chat. SW v101.

### Criterios de aceptación

- `tests/e2e/ancho.spec.js`: a 360 px, un nombre de 120 caracteres no desborda Hoy ni Nutrición (antes: 658 px de desborde). ✓

## REQ-222 - Fix admin: la cortesía de consumo rechazaba 3000 sin decir por qué

**Estado: implementado.**

### Origen

Jonathan (2026-10-19, captura): en "Consumo y cortesía" de un beta tester, límite 3000 y unidades extra 3000 en `coach_conversation` → "Usuario, acción y valores de cortesía válidos requeridos." y no guardaba. `api/admin.js` (`setQuotaOverride`) aceptaba como máximo 1000 en ambos campos con un único mensaje genérico; el selector mostraba la clave interna `coach_conversation`.

### Alcance

1. Tope por día y por acción a 10.000 (`QUOTA_OVERRIDE_MAX`, solo contra errores de tipeo); cada error dice qué campo y qué rango.
2. Modal: ayuda "Por día y por acción, de 0 a 10.000", validación antes de enviar con foco en el campo, y "Conversación con el coach" en el selector. SW v104.

### Criterios de aceptación

- `scripts/test-coach-quota.mjs`: 3000/3000 en `coach_conversation` se guarda; 20000 responde 400 nombrando el campo y el rango. ✓

## REQ-223 - Textos: la beta no se limita a países

**Estado: implementado.**

### Origen

Jonathan (2026-10-19, captura de la portada): "no debe limitar países en ningún texto". La portada decía "Beta de fundadores en Perú, Chile y México" y la postulación repetía los países en la nota del hero, las meta descripciones, la ayuda de WhatsApp (+51, +56, +52) y los ejemplos ("Lima, Perú", "+51 999 999 999").

### Alcance

1. `index.html` (nota del hero en modo invitación) y `beta-reclutamiento.html` (meta, nota del hero, ayuda y ejemplos de WhatsApp y ciudad) sin países; los ejemplos pasan a "+ código de país y número" y "Ciudad, país".
2. `api/beta-recruitment.js`: el error de WhatsApp pide el código del país sin ejemplo de un país. SW v105.

### Criterios de aceptación

- `tests/e2e/portada.spec.js` y `tests/e2e/beta.spec.js`: ni la portada ni la postulación (incluida la meta descripción) mencionan Perú, Chile o México. ✓

## REQ-224 - Fix Entreno: un borrador de plan archivado le gana al plan activo en los días nuevos

**Estado: implementado.**

### Origen

Feedback de una usuaria (2026-10-19): la rutina que le cargó su coach no aparecía; el lunes mostraba la rutina genérica.

### Causa raíz

`planVersionForDate()` (`index.html`) ordenaba las versiones que cubren el día primero por `valid_from` y recién después por estado. Dos borradores generados el 13 y luego archivados (`superseded`, `valid_to` sin recortar) empezaban un día después que el plan activo, así que cada día nuevo sin ancla quedaba asignado a un borrador archivado.

### Alcance

1. `planVersionForDate()`: si alguna versión no reemplazada cubre el día, las reemplazadas quedan fuera; un día ya anclado (`planVersionId`) conserva su versión (historial inmutable).
2. Datos: recorte de `valid_to` de los borradores archivados y re-anclaje de los días futuros sin actividad al plan activo.
3. `scripts/validate-plan-version-for-date.mjs` en el release gate. `CACHE_NAME` v106.

### Criterios de aceptación

- El plan activo gana a un borrador archivado posterior; un día anclado conserva su versión; un día cubierto solo por una versión reemplazada la sigue usando. ✓
