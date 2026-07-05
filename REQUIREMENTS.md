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

1. ~~REQ-81 - Planner semanal nutricional determinista y lista de compras derivada.~~ (implementado)
2. ~~REQ-82 - Plan nutricional activo versionado en `plan_versions`.~~ (implementado)
3. ~~REQ-83 - Reemplazos equivalentes con rebalanceo de comidas futuras.~~ (implementado)
4. ~~REQ-84 - Coach nutricional como generador auxiliar validado, no autoridad de macros.~~ (implementado)

Serie UX de la auditoría del 1 jul 2026 (`estrategia/08-Analisis-UI-Exhaustivo-2026-07-01.md`) — en orden de prioridad:

5. ~~REQ-97 - Reordenar Home: agenda primero, hero compacto, un banner a la vez.~~ (implementado, P0)
6. ~~REQ-98 - Fix banner de check-in: fechas rotas, duplicado, tono de arranque.~~ (implementado, P1)
7. ~~REQ-100 - Nutrición sin duplicación: un CTA contextual y hero compacto.~~ (implementado, P1)
8. ~~REQ-101 - Entreno sin CTAs duplicados.~~ (implementado, P1)
9. ~~REQ-102 - Progreso con estado cero guiado y peso en tarjetas.~~ (implementado, P1)
10. ~~REQ-103 - Onboarding sin jerga: macros como resumen.~~ (implementado, P1)
11. ~~REQ-99 - Perfil por secciones con guardado por sección.~~ (P1, el más grande; dividido el 2 jul en REQ-105..REQ-108, ver abajo)
12. ~~REQ-104 - Copy y paywall coherentes.~~ (implementado, P2)
13. ~~REQ-105 - Perfil: acordeón real (una sección a la vez).~~ (implementado, P1)
14. ~~REQ-106 - Perfil: aria-label en todos los inputs.~~ (implementado, P1)
15. ~~REQ-107 - Perfil: reagrupar Suscripción/Recordatorios/Avisos bajo Cuenta.~~ (implementado, P1)
16. ~~REQ-108 - Perfil: guardado por sección con aviso de cambios sin guardar.~~ (implementado, P1)
17. ~~REQ-109 - Fix Home: badge "N pendientes" cuenta la fila de Descanso.~~ (implementado, P2)
18. ~~REQ-110 - Fix: catch de aiGenerateWeek sin salida — opción práctica y reintento.~~ (implementado, P1)
19. ~~REQ-111 - Fix API: /api/checkout valida Stripe antes que la sesión.~~ (implementado por REQ-59; entrada duplicada, no reabrir)
20. ~~REQ-112 - Accesibilidad: toasts aria-live y contraste de texto muted.~~ (implementado, P2)

Nota: los hallazgos P0-1 y P0-2 de esa auditoría (ruta determinista sin paywall en "Preparar mi día" y fallback+reintento en errores del coach) ya quedaron implementados el 1 jul junto con mejoras de calidad del solver determinista (pre-rankeo calórico, variedad por `recentUsed` y desempate por fecha).

Serie "dieta exacta" (4 jul 2026). Origen: dos análisis independientes convergentes — Codex (`docs/nutrition-generation-architecture-diagnostic-2026-07-04.md`) y sesión de arquitectura de Claude — fusionados y aprobados por Jonathan con tres decisiones: tolerancias estrictas ±3%/±50 kcal y ±5 g proteína sujetas a canario, Sonnet 5 solo tras gate de telemetría, y ampliación drástica del catálogo. Orden recomendado (REQ-128 y REQ-129 son un par: el contrato no se activa sin el solver):

21. ~~REQ-128 - Contrato estricto único de dieta (`DIET_CONTRACT`) + canario de factibilidad.~~ (implementado, P0)
22. ~~REQ-129 - `finalizeNutritionDay()` etapa 1: puerta pura dormida y normalización de propuestas.~~ (implementado, P0)
23. ~~REQ-130 - Coherencia de preferencias duras y patrón omnívoro activo.~~ (implementado, P0)
24. ~~REQ-131 - Momento del día, etapa 1: presupuestos por slot y filtro heurístico sin migración.~~ (implementado, P1)
25. ~~REQ-132 - Momento del día, etapa 2: metadata de contundencia y cobertura de slots vacíos.~~ (implementado, P1)
26. ~~REQ-133 - API del coach: structured outputs, límites y modelo por acción con gate de telemetría para Sonnet 5.~~ (implementado, P1)
27. ~~REQ-134 - Pipeline de crecimiento del catálogo validado por el motor.~~ (implementado, P1)
28. ~~REQ-135 - Catálogo lote 1: slots vacíos, desayunos y snacks.~~ (implementado, P1)
29. ~~REQ-136 - Catálogo lote 2A: metadata de cocina y scoring de preferencias.~~ (implementado, P1)
30. ~~REQ-140 - Catálogo lote 2B: profundidad por cocina, presupuesto y fuera de casa.~~ (implementado, P2)
31. ~~REQ-141 - Catálogo lote 2C: meta 180/200 y validadores de gustos.~~ (implementado, P2)
32. ~~REQ-137 - `finalizeNutritionDay()` etapa 2: cierre global y complemento dentro de contrato.~~ (implementado, P0)
33. ~~REQ-138 - Conectar `finalizeNutritionDay()` en cliente sin activar contrato global.~~ (implementado, P0)
34. REQ-144 - Medir impacto incremental de catálogo contra el canario antes de aceptar platos nuevos. (P0; nuevo 2026-07-05, bloquea REQ-143)
35. REQ-143 - Catálogo lote 3: crecimiento drástico dirigido por el canario del contrato. (P0; bloqueado por REQ-144, ver hallazgo 2026-07-05)
36. REQ-139 - Activar `DIET_CONTRACT` en runtime, servidor, snapshots y pool con aviso suave no bloqueante. (P1; alcance redefinido 2026-07-05, decision de Jonathan tomada, ya no depende del gate de catalogo)
37. REQ-142 - Conectar reemplazos ("Cambiar comida") a `finalizeNutritionDay()`. (P2; extraído de REQ-138)

Pendiente no automatizable por agentes:

- REQ-49 - Revision legal pre-lanzamiento.
- REQ-60 - Configuracion manual de redirects en Supabase.
- REQ-127 - Personalizar remitente/asunto de correos de Supabase (branding Fitbud).
- REQ-70 - Validacion de negocio y beta con usuarios reales.
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

**Estado: implementado.** `generateOneDay()` ahora calcula `mealSlotTargets` y envía presupuesto kcal/proteína por slot, arquetipos por momento del día y referencia de platos filtrada por `compatibleDishesForSlot` para cada slot. `validateGeneratedDay()` matchea comidas contra el catálogo con `findDishForMeal`, rechaza `compatible_slots` incompatibles y aplica un techo interino de contundencia (`slotKcalCeiling`, presupuesto ×1.15) en slots no principales. `regenerateGenMeal()` recibe el arquetipo del slot. Validador nuevo: `scripts/validate-slot-budget-prompt.mjs`, agregado al release gate.

### Origen

Bug reportado por Jonathan (4 jul 2026): platos demasiado contundentes para el desayuno. Diagnóstico Codex §7 + propuesta Claude (etapa interina sin migración).

### Problema

El prompt lista los slots con id/hora pero no reparte el presupuesto calórico por comida ni exige adecuación del plato al momento del día; la lista de referencia manda ~60 platos de cualquier slot mezclados; la validación no comprueba slot-plato aunque el catálogo ya tiene `compatible_slots` (REQ-79). El modelo puede poner un guiso de almuerzo al desayuno y pasar validación.

### Causa raíz

La meta se comunica solo como total diario y la adecuación por slot nunca se validó.

### Objetivo

Que cada comida respete su presupuesto y su momento del día, con lo que ya existe (sin migración de schema).

### Alcance

1. Prompt: incluir presupuesto kcal/proteína por slot (desde `mealSlotTargets`), respetando `mainMealIndex`.
2. Prompt: lista de platos de referencia filtrada por slot (los candidatos de desayuno para desayuno, etc.).
3. Prompt: línea de arquetipos por slot (desayuno: avena, huevos, yogur, tostadas, batidos; no guisos ni platos de almuerzo; merienda/recena: ligero).
4. Validación: si el plato propuesto matchea el catálogo, verificar `compatible_slots`; incompatible → issue → política de reparación de REQ-129.
5. Heurística interina de contundencia: techo kcal por slot (p. ej. desayuno ≤ presupuesto del slot × 1.15 salvo comida principal) validado con los macros recalculados.

### Fuera de alcance

- Metadata nueva (`meal_weight`, `meal_form`) y backfill (REQ-132).

### Riesgos

- La heurística por kcal puede marcar falsos positivos en desayunos legítimamente grandes (comida principal en desayuno); el techo debe respetar `mainMealIndex`.

### Criterios de aceptación

- E2E: un perfil estándar nunca recibe en desayuno un plato del catálogo marcado solo como almuerzo/cena.
- El prompt contiene presupuestos por slot y la referencia va filtrada por slot.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Generar 10 días de prueba y verificar distribución kcal por slot contra `mealSlotTargets`.

## REQ-132 - Momento del día, etapa 2: metadata de contundencia y cobertura de slots vacíos

**Estado: implementado.** `supabase/nutrition_catalog_semantics.sql` agrega/backfillea `dishes.meal_weight` (`light/medium/heavy`) y `dishes.meal_form` (`bowl/sandwich/shake/plated/soup/snack`), con constraints idempotentes; `supabase/schema.sql` queda alineado para instalaciones nuevas. Los snacks, batidos y platos ligeros de yogur/caseína cubren `media_manana`, `merienda`, `snack` y `recena` sin crear platos nuevos. `compatibleDishesForSlot()` ahora rechaza `heavy` en desayuno no-principal y cualquier no-`light` en `media_manana`/`merienda`/`recena`; `validateGeneratedDay()` aplica la misma regla cuando matchea catálogo. `supabase/validate.mjs` y `validate-diet-contract.mjs` reportan cobertura por slot; baseline local: desayuno=6, media_manana>=7, almuerzo>=29, merienda>=7, snack>=7, cena>=5, recena>=7. `COACH_PROMPT_VERSION` sube a 8 y el `contextKey` incluye `compatible_slots`, `meal_weight` y `meal_form`. Acción manual externa: aplicar/re-ejecutar `supabase/nutrition_catalog_semantics.sql` en Supabase.

### Origen

Diagnóstico Codex §"Catalogo" + hallazgo verificado del análisis v2 (2026-06-28): cobertura por slot rota.

### Problema

- Sin metadata de contundencia, un plato puede ser compatible en macros pero mala experiencia para desayuno; la heurística de REQ-131 es aproximada.
- Cobertura del catálogo por slot: `media_manana`, `merienda` y `recena` = 0 platos. Los perfiles de 5-6 comidas no tienen candidatos y degradan siempre.

### Causa raíz

La metadata semántica de REQ-79 no incluyó contundencia/forma, y `compatible_slots` se pobló conservadoramente.

### Objetivo

Que el motor pueda decidir adecuación por momento del día con datos, y que los 7 slots renderizables tengan candidatos.

### Alcance

1. Migración SQL (aplicación manual documentada, como todas): columnas `meal_weight` (light/medium/heavy) y `meal_form` (bowl/sandwich/shake/plated/soup/snack) en `dishes` (extensión de `supabase/nutrition_catalog_semantics.sql` o archivo nuevo).
2. Backfill de los ~50 platos existentes con `meal_weight`/`meal_form` y revisión de `compatible_slots` multi-slot: shakes/snacks/yogures existentes deben cubrir `media_manana`, `merienda` y `recena` (>0 candidatos por slot sin crear platos nuevos).
3. Reglas de slot en dominio y validación: desayuno acepta light/medium (heavy solo si es comida principal); merienda/media mañana/recena solo light; almuerzo/cena sin restricción.
4. `compatibleDishesForSlot` y el prompt (REQ-131) consumen la metadata nueva; la heurística de kcal de REQ-131 queda como respaldo cuando falte metadata.
5. Actualizar `supabase/validate.mjs` y el canario para reportar cobertura por slot.

### Fuera de alcance

- Platos nuevos (REQ-135/136).

### Riesgos

- Migración manual en producción: dejar constancia como acción manual pendiente en el commit.
- Backfill subjetivo: usar criterios documentados (kcal por porción base, forma) para que sea auditable.

### Criterios de aceptación

- Todos los slots renderizables tienen ≥1 candidato compatible (reportado por el canario).
- Ningún plato heavy se aplica a desayuno no-principal ni a merienda/recena.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Canario con perfiles de 5 y 6 comidas: factibilidad por slot > 0 en los 7 slots.

## REQ-133 - API del coach: structured outputs, límites y modelo por acción con gate de telemetría para Sonnet 5

**Estado: implementado.** `/api/claude` ahora usa `output_config.format` con JSON Schema para `diet_day`, `diet_week` y `meal_option`; si Anthropic rechaza el parámetro con 400, reintenta una vez sin structured outputs y conserva el parseo/validación existente como fallback. El proxy capea `maxTokens` en 4096, el cliente escala los tokens de nutrición según número de comidas, `ALLOWED_MODELS` incluye `claude-sonnet-5` y el modelo se resuelve por acción vía env (`ANTHROPIC_MODEL_DIET`, `ANTHROPIC_MODEL_MEAL_OPTION`, etc.) con default Haiku 4.5. `MODEL_COSTS` incluye Sonnet 5 con precio estándar e introductorio hasta 2026-08-31. `supabase/analytics.sql` agrega `v_coach_model_gate`, y el panel admin muestra JSON inválido, degradación, costo y latencia por acción/modelo. Gate documentado: cambiar `ANTHROPIC_MODEL_DIET` a `claude-sonnet-5` solo si `diet_*` supera 10% de degradación sostenida durante 1-2 semanas; `meal_estimate` y `coach_conversation` permanecen en Haiku. Acción manual externa: re-ejecutar `supabase/analytics.sql` en Supabase para crear/actualizar la vista.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-133`).

## REQ-134 - Pipeline de crecimiento del catálogo validado por el motor

**Estado: implementado.** `scripts/grow-catalog.mjs` es un pipeline offline: con `--fixture` no usa red y con `--brief` llama a Anthropic solo desde local/CI con `ANTHROPIC_API_KEY`; normaliza candidatos contra `supabase/seed.sql`, exige slugs estables, fuente para ingredientes nuevos, metadata semantica completa y limites de porcion, rechaza macros inconsistentes (`kcal` vs `4P+4C+9F`) y prueba cada plato con `solveDishPortion` contra presupuestos tipicos por slot. La salida son dos archivos en `--out-dir`: patch SQL revisable referenciado por slug (sin `truncate` ni IDs) y reporte JSON con aceptados/rechazados. `scripts/validate-grow-catalog.mjs` cubre un fixture offline con ingrediente/plato aceptado y rechazos por macros, fuente ausente y metadata incompleta; `release-gate` lo ejecuta.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-134`).

## REQ-135 - Catálogo lote 1: slots vacíos, desayunos y snacks

**Estado: implementado.** `supabase/seed.sql` crece a 121 ingredientes, 100 platos y 359 lineas de receta: +60 ingredientes con fuente de revision humana documentada en `docs/catalog-lote-1-sources.md` y +50 platos orientados a desayunos, snacks/batidos, almuerzos y cenas ligeras. `supabase/nutrition_catalog_semantics.sql` ahora etiqueta proteinas animales por categoria, no por una lista corta, e infiere `low` budget y `sandwich` para nombres nuevos como avena/pan/arepa/wrap. `scripts/validate-nutrition-catalog.mjs` endurece los minimos de REQ-135: ingredientes>=100, platos>=100, desayuno>=20, snack>=15, media_manana/merienda>=10, recena>=8, vegetariano>=30%, vegano>=15%, prep<=15 y low budget en al menos un tercio. Baseline local post-lote: desayuno=20, media_manana=30, almuerzo=37, merienda=30, snack=30, cena=13, recena=30; el canario ya no reporta `slot_without_candidates` y sube a 27/378 dias (`7.1%`). El objetivo macro >=98% queda pendiente funcional de cierre global en REQ-137, no de cobertura de catalogo.

### Origen

Misma decisión que REQ-134. Prioridad del lote: los huecos que hoy rompen la experiencia (slots sin candidatos y desayunos repetitivos/contundentes).

### Problema

Cobertura actual por slot: almuerzo ~30, cena ~7, desayuno ~6, snack ~5, batido ~2, y `media_manana`/`merienda`/`recena` = 0. Los perfiles de 5-6 comidas no tienen de dónde elegir y el desayuno tiene 6 opciones para todos los gustos.

### Causa raíz

El catálogo se pobló para el plan original de 4 comidas de un usuario; nunca se dimensionó para la matriz real de perfiles.

### Dependencias

- REQ-134 (pipeline) y REQ-132 (metadata definida) aplicados.

### Objetivo

Que ningún slot quede sin candidatos variados y que el desayuno tenga profundidad real.

### Alcance

1. Generar y aprobar vía pipeline REQ-134 un lote con mínimos por slot: desayuno ≥20, media_manana ≥10, merienda ≥10, recena ≥8, snack/batido ≥15; total de platos del catálogo ≥100 (desde ~50).
2. Ingredientes nuevos según lo exijan las recetas (~61 → ~120), cada uno con fuente anotada.
3. Distribución del lote: ≥30% apto vegetariano, ≥15% apto vegano, cobertura de `budget_tier` bajo y de `prep_minutes` ≤15 en al menos un tercio.
4. Aplicar SQL en Supabase (acción manual documentada) y actualizar `CONTEXT.md`/validadores con los conteos nuevos.
5. Re-correr el canario de REQ-128: la factibilidad del contrato para perfiles de 5-6 comidas debe quedar ≥98%.

### Fuera de alcance

- Profundidad por cocinas/gustos específicos (REQ-136).

### Riesgos

- Volumen de revisión humana: el lote llega pre-validado por el pipeline, la aprobación es sobre plausibilidad nutricional y nombres.

### Criterios de aceptación

- Todos los slots con los mínimos definidos y metadata completa.
- Canario ≥98% de factibilidad en la matriz completa de perfiles.
- `node supabase/validate.mjs` (o equivalente vigente) y `node scripts/release-gate.mjs` pasan.

### Verificación sugerida

- Generar semana E2E para un perfil de 6 comidas: cero slots degradados por falta de candidatos.

## REQ-136 - Catálogo lote 2A: metadata de cocina y scoring de preferencias

**Estado: implementado.** `supabase/schema.sql` y `supabase/nutrition_catalog_semantics.sql` agregan `dishes.cuisine_tags text[]` con constraint idempotente (`criolla`, `mediterranea`, `mexicana`, `asiatica`) y backfill por menu/nombre. `js/nutrition-domain.js` exporta `cuisineTagsForDish()` y `preferredCuisineTags()`; `preferenceScoreAdjustment()` aplica un bonus suave cuando `prefs.preferredCuisines` coincide con tags del plato. `index.html` preserva la metadata en el editor admin, incluye `cuisine_tags` en el hash de catálogo y sube `COACH_PROMPT_VERSION` a 9. El pipeline `scripts/grow-catalog.mjs` ahora exige y emite `cuisine_tags`, y `scripts/validate-cuisine-preferences.mjs` prueba que perfiles criollo/mediterráneo/mexicano rankean candidatos distintos con los mismos hard filters. Acción manual externa: re-ejecutar `supabase/nutrition_catalog_semantics.sql` en Supabase para crear/backfillear `cuisine_tags` antes de usar los lotes REQ-140/141.

### Origen

Subdivisión del REQ-136 original. Evidencia al 4 jul 2026: `preferredCuisines` se captura en onboarding/perfil, pero el dominio solo prioriza `preferredIngredients`/`preferredDishes`; `dishes` no tiene metadata de cocina. El lote de datos no puede cumplir la aceptación de "semanas alineadas a cocina" sin este contrato previo.

### Problema

Las preferencias de cocina existen en `prefs.preferredCuisines`, pero el catálogo no declara cocina y `preferenceScoreAdjustment()` no las usa. Agregar 80 platos sin tags no garantiza que un perfil criollo, mediterráneo, mexicano o asiático reciba platos alineados.

### Causa raíz

Falta un contrato de metadata (`cuisine_tags`) y una regla determinista que convierta `preferredCuisines` en score de selección.

### Dependencias

- REQ-134 y REQ-135 aplicados.

### Objetivo

Preparar el catálogo para crecer por gustos: cada plato puede declarar cocina y el solver prioriza las cocinas preferidas sin bloquear restricciones, variedad ni contrato.

### Alcance

1. Agregar `dishes.cuisine_tags text[]` a `supabase/schema.sql` y `supabase/nutrition_catalog_semantics.sql` con vocabulario inicial alineado a `CUISINE_LABELS` (`criolla`, `mediterranea`, `mexicana`, `asiatica`) y backfill por nombre/menu.
2. Actualizar parsers/validadores de catálogo para exigir tags válidos y cobertura mínima por cocina antes de los lotes 2B/2C.
3. Actualizar `js/nutrition-domain.js`: `likedTermsForProfile` o `preferenceScoreAdjustment` debe considerar `prefs.preferredCuisines` contra `dish.cuisine_tags`; el ajuste es suave, no bloqueante.
4. Añadir test dedicado que demuestre que dos perfiles con cocinas opuestas rankean candidatos distintos cuando ambos cumplen slot/dieta.
5. Documentar que el gate macro 98% sigue siendo responsabilidad de REQ-137; este REQ solo habilita alineación por gustos.

### Fuera de alcance

- Agregar los 80 platos restantes (REQ-140/REQ-141).
- Personalización por usuario individual; el catálogo es común y la personalización la hacen filtros/scoring existentes.

### Riesgos

- Tags mal inferidos pueden sesgar demasiado el plan: mitigación con vocabulario chico, validadores y score suave.

### Criterios de aceptación

- `supabase/schema.sql` y `supabase/nutrition_catalog_semantics.sql` exponen `cuisine_tags` idempotente con constraint de vocabulario.
- `scripts/validate-nutrition-catalog.mjs` valida cobertura por cocina en el catálogo actual.
- Test puro: mismo slot/candidatos, `preferredCuisines=["criolla"]` favorece platos criollos y `["mediterranea"]` favorece mediterráneos sin tocar hard filters.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `node scripts/validate-nutrition-catalog.mjs` y test nuevo de preference scoring.

## REQ-140 - Catálogo lote 2B: profundidad por cocina, presupuesto y fuera de casa

**Estado: implementado.**
`supabase/seed.sql` agrega lote 2B: 41 ingredientes y 45 platos nuevos (162 ingredientes, 145 platos, 522 líneas de receta en total; fuentes en `docs/catalog-lote-2b-sources.md`). Cada cocina (`criolla`, `mediterranea`, `mexicana`, `asiatica`) ahora cubre desayuno, snack y al menos un slot principal (almuerzo/cena), no solo almuerzo como en REQ-136. `inferCuisineTags` en `supabase/nutrition_catalog_semantics.sql` y su espejo de test en `scripts/validate-nutrition-catalog.mjs` reconocen además `criolla`/`criollo` en el nombre del plato. El lote también suma opciones `needs_kitchen=false`, `eat_out_ok` (bowl/tacos/pasta/pollo) y `budget_tier='low'`, más proteína alta con fuentes naturales (pollo, pescado, huevo, lácteos) sin depender de proteína en polvo. `node scripts/validate-nutrition-catalog.mjs`, `node supabase/validate.mjs` y el canario `node scripts/validate-diet-contract.mjs` pasan; el gate macro estricto sigue en calibración hasta REQ-137 (fuera de alcance de este REQ). Acción manual externa: re-ejecutar `supabase/seed.sql` y `supabase/nutrition_catalog_semantics.sql` en Supabase para reemplazar/backfillear el catálogo antes de usar el lote 2C (REQ-141).

### Origen

Subdivisión del REQ-136 original. Depende de REQ-136 para que los platos nuevos tengan `cuisine_tags` útiles.

### Problema

El lote 1 resuelve cobertura por slot, pero la profundidad por cocina y por escenarios prácticos (`needs_kitchen=false`, `eat_out_ok=true`, bajo presupuesto) sigue siendo superficial.

### Causa raíz

El seed histórico fue creado por menú semanal, no por matriz de preferencias de onboarding.

### Objetivo

Primer lote de profundidad por cocina y escenarios: aumentar variedad real sin perder validación determinista.

### Alcance

1. Agregar lote validado por el pipeline o fixture offline con foco en criolla/peruana, mediterránea, mexicana y asiática.
2. Subir el catálogo al menos a 140 platos y 160 ingredientes, manteniendo los mínimos de REQ-135 y cobertura por `cuisine_tags`.
3. Aumentar opciones `needs_kitchen=false`, `eat_out_ok=true`, `budget_tier='low'` y alta proteína sin depender de proteína en polvo.
4. Documentar fuentes de ingredientes nuevos y actualizar conteos en `CONTEXT.md`, README y validadores.
5. Re-correr canario y confirmar que no reaparece `slot_without_candidates`; no exigir 98% macro hasta REQ-137.

### Fuera de alcance

- Alcanzar 180/200 finales (REQ-141).
- Activar contrato macro runtime.

### Riesgos

- Aumentar platos sin suficientes tags de cocina puede diluir el scoring: mitigado por depender de REQ-136 y validar cobertura por cocina.
- Reintroducir ingredientes no revisados: mitigado por fuentes documentadas y fixture/pipeline offline sin llamadas pagadas.

### Criterios de aceptación

- Conteos locales >=140 platos y >=160 ingredientes.
- Cada cocina principal tiene cobertura en desayuno/snack y al menos un slot principal.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `node scripts/validate-nutrition-catalog.mjs`, `node supabase/validate.mjs` y canario `node scripts/validate-diet-contract.mjs`.

## REQ-141 - Catálogo lote 2C: meta 180/200 y validadores de gustos

**Estado: implementado.**
`supabase/seed.sql` agrega lote 2C: 38 ingredientes y 35 platos nuevos (200 ingredientes, 180 platos, 654 líneas de receta en total; fuentes en `docs/catalog-lote-2c-sources.md`), cerrando la meta final de profundidad del REQ-136 original. El lote suma proteínas nuevas (chuleta de cerdo, costilla, mejillones, calamar, anchoas, jamón serrano, chorizo, pollo molido), alternativas sin lácteos explícitas (leche/yogur de almendra y coco, queso vegano, levadura nutricional) y sin gluten explícitas (harinas de almendra/arroz/garbanzo, trigo sarraceno, amaranto, pan sin gluten multigrano, pasta de maíz), más condimentos regionales (ají panca, rocoto, huacatay, tomatillo, chipotle) para profundizar las 4 cocinas. `scripts/validate-nutrition-catalog.mjs` ahora exige explícitamente `REQ141_MIN_DISHES=180`/`REQ141_MIN_INGREDIENTS=200` y cobertura mínima de `needs_kitchen=false` (>=40), `eat_out_ok` (>=25), y estima cobertura de "sin lácteos"/"sin gluten" por categoría de ingrediente y una lista explícita de ingredientes con gluten conocido; estas dos últimas son heurísticas de composición de catálogo para dimensionar REQ-137, no una certificación de alérgenos ni reemplazan el filtrado real de restricciones del usuario (`js/nutrition-domain.js`). El canario `node scripts/validate-diet-contract.mjs` sube de 27/378 (7.1%) a 39/378 (10.3%) con `engine:"finalizeNutritionDay"`; el gate del 98% macro sigue siendo responsabilidad de REQ-137 (fuera de alcance). `node scripts/release-gate.mjs` pasa. Acción manual externa: re-ejecutar `supabase/seed.sql` en Supabase de producción para reemplazar el catálogo antes de que REQ-137 use el volumen completo.

### Origen

Subdivisión final del REQ-136 original.

### Problema

Después del lote 2B todavía faltará volumen para variedad semanal sostenida y preferencias específicas sin repetición.

### Causa raíz

Los gustos del onboarding necesitan más candidatos por cocina, presupuesto, sin lácteos, sin gluten, sin cocina y comer fuera.

### Objetivo

Cerrar la meta de profundidad del REQ-136 original sin mezclarla con el cierre macro de REQ-137.

### Alcance

1. Subir el catálogo a >=180 platos y >=200 ingredientes con fuentes documentadas.
2. Mantener mínimos REQ-135, cobertura por cocina REQ-136 y escenarios REQ-140.
3. Endurecer validadores para platos/ingredientes finales, cobertura por `cuisine_tags`, no cocina, comer fuera, sin lácteos y sin gluten cuando la metadata disponible lo permita.
4. Re-correr canario: debe mantenerse sin `slot_without_candidates`; reportar porcentaje macro como input de REQ-137.

### Fuera de alcance

- Resolver el 98% macro con optimización global; eso es REQ-137.

### Riesgos

- Volumen alto de datos puede esconder duplicados o platos demasiado similares: mitigado por slugs únicos, validadores de cobertura y revisión de fuentes.
- Canario macro puede seguir bajo aunque el catálogo cumpla volumen: mitigado documentando causas para REQ-137 en vez de relajar el contrato.

### Criterios de aceptación

- Conteos locales >=180 platos y >=200 ingredientes.
- Perfiles con `preferredCuisines=["criolla"]` y `["mediterranea"]` tienen candidatos suficientes para semanas variadas.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `node scripts/validate-nutrition-catalog.mjs`, `node scripts/validate-diet-contract.mjs --json` y release gate completo.

## REQ-137 - `finalizeNutritionDay()` etapa 2: cierre global y complemento dentro de contrato

**Estado: implementado.**
`finalizeNutritionDay()` agrega una pasada global (`globalClosePass`) que trata todas las líneas escalables de las comidas no bloqueadas como una única bolsa de palancas (clasificadas por `ingredientLeverCategory` en proteína/carbohidrato/grasa/neutro) e hill-climbea sobre los macros del día completo, no por comida, respetando siempre `lineLimits()`/`clampStep()`. Si el día sigue fuera de `DIET_CONTRACT`, `attemptContractComplement()` busca un snack/batido del catálogo compatible con `dislikedIngredients`/dieta que reduzca estrictamente el número de métricas fuera de contrato, sin reemplazar comidas existentes. `DIET_CONTRACT.runtimeActive` sigue `false`. Canario `validate-diet-contract.mjs` sube de 39/378 (10.3%) a 122/378 (32.3%) y ahora reporta `failureBreakdown` distinguiendo `catalogGapDays` (solo residuo de macro, 100% de los días que no cierran hoy) de `otherIssueDays` (causa estructural distinta). Tests nuevos en `scripts/validate-finalize-nutrition-day.mjs`: cierre de residuo acumulado exacto y caso imposible que debe devolver `no_solution` con causa medible.

Detalle historico (Origen/Problema/Alcance/Criterios originales): `docs/requirements-history.md` (buscar `## REQ-137`).

## REQ-138 - Conectar `finalizeNutritionDay()` en cliente sin activar contrato global

**Estado: implementado.**
`generateOneDay()`, `deterministicDayPayload()` (usado por `applyDeterministicDay()` y como fallback de cuota), `generateDeterministicWeek()`, `regenerateDayInWeekDraft()` y `regenerateGenMeal()` ahora pasan su composición por el helper `finalizeDayWithGate()` → `finalizeNutritionDay()`; `prepareFirstWeekNutrition()`/`prepareFirstCycleWeek()` heredan la conexión porque delegan en esos dos primeros. El "ok" visible de cada flujo sigue dependiendo de que cada slot quede cubierto (`finalizedDayIsComplete()`) y de validación estructural, no de `DIET_CONTRACT` (sigue `runtimeActive:false`, REQ-139 lo activará). `lockedMealsForDay()` protege comidas `done=true` pasándolas como `lockedMeals`. El prompt de `generateOneDay()` quitó la exigencia "OBLIGATORIO — el día DEBE cumplir AMBAS metas... suma y verifica los totales"; ahora pide solo composición realista y dice explícitamente que el sistema ajusta las porciones finales. `validateGeneratedDay()` degradó sus dos chequeos de tolerancia de macros del día (kcal ±15%, proteína ≥85%) de `issues` (bloqueante) a `warns` (informativo), porque el cierre real ya no depende de que el modelo acierte los totales. Validador estructural nuevo: `scripts/validate-nutrition-finalize-wiring.mjs` (agregado a `release-gate.mjs`) confirma por fuente que los 5 flujos invocan la puerta única y que el prompt/validador ya no tratan los totales del modelo como autoridad final.
Alcance recortado a propósito: el reemplazo de una comida vía "Cambiar comida" (`applyChangeMeal`/`rebalanceFutureMeals`, REQ-83) NO se conectó a `finalizeNutritionDay()` en este REQ — es un mecanismo puro y ya probado (9 tests en `validate-nutrition-replacements.mjs`) con una lógica de rebalanceo proporcional distinta al hill-climbing de `globalClosePass()`; conectarlo requiere su propio análisis de riesgo. Se extrajo como REQ-142 para no bloquear ni diluir la entrega de los 5 flujos de generación/regeneración, que sí cubren el criterio de aceptación "los flujos principales del cliente invocan finalizeNutritionDay()".

### Origen

Subdivisión de REQ-129 original. Depende de REQ-129 y REQ-137.

### Problema

Aunque el dominio tenga una puerta final, los flujos visibles seguirán usando rutas fragmentadas (`validateGeneratedDay`, semana, determinista, regenerar comida, onboarding, reemplazos) hasta conectarla.

### Causa raíz

`index.html` contiene la orquestación histórica de nutrición y cada flujo acepta/rehace comidas con lógica local.

### Objetivo

Que todos los caminos del cliente pasen por `finalizeNutritionDay()` para obtener comidas normalizadas, pero sin activar aún el rechazo estricto global ni cambiar servidor/snapshots.

### Alcance

1. Cambiar `generateOneDay()` para pedir solo composición/semillas y finalizar con `finalizeNutritionDay()`.
2. Usar `finalizeNutritionDay()` en `generateDeterministicWeek`, `applyDeterministicDay`, primera semana de onboarding, `regenerateDayInWeekDraft`, `regenerateGenMeal` y reemplazos cuando recalculen el día.
3. Mantener protección de comidas `done=true` vía `lockedMeals`.
4. Mantener copy de usuario sin términos técnicos prohibidos.
5. Agregar/actualizar validadores estructurales para confirmar que los flujos llaman la puerta única.

### Fuera de alcance

- Activación del contrato en servidor/snapshot/pool (REQ-139).
- Structured outputs o modelo por acción (REQ-133).

### Riesgos

- Cambios en `index.html` son amplios; verificar día, semana, regeneración y onboarding con mocks.
- No reescribir historial ni comidas registradas.

### Criterios de aceptación

- Los flujos principales del cliente invocan `finalizeNutritionDay()`.
- Regenerar una comida no cambia comidas registradas.
- El prompt ya no le exige al modelo verificar totales como autoridad final.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E mockeado de preparar día, semana y onboarding inicial; inspeccionar que las comidas aplicadas vienen finalizadas.

## REQ-139 - Activar `DIET_CONTRACT` en runtime con aviso suave no bloqueante

**Estado: pendiente.**

### Decisión de producto (2026-07-05, Jonathan)

El alcance original (rechazo duro en cliente/servidor/snapshot) habría roto `aiGenerateDay()` para la mayoría de perfiles: canario en 32.3%, debajo del gate ≥98% de REQ-128, y `validateGeneratedDay()` valida la propuesta cruda del modelo antes del cierre determinista. Detalle del análisis: commit "REQ-139: bloquear activacion de DIET_CONTRACT por brecha de catalogo".

Jonathan decidió: (1) el contrato se evalúa sobre el **día ya cerrado** por `finalizeNutritionDay()`, nunca sobre la propuesta cruda; `validateGeneratedDay()` no sube sus checks de macro a `issues`; (2) si el día cerrado no cumple `DIET_CONTRACT`, la UI muestra un **aviso suave** (ej. "Tu día quedó cerca de tu meta, no exacto") y el usuario aplica/guarda igual — ningún flujo bloquea; (3) el crecimiento de catálogo (REQ-143) ya no es prerrequisito duro, porque el aviso no depende de la factibilidad. Reemplaza el alcance/criterios originales de rechazo duro.

### Origen

Subdivisión final de REQ-129. Redefinido 2026-07-05 (ver decisión arriba).

### Problema

El "ok" visible de un día generado depende solo de `finalizedDayIsComplete()` (cobertura de slots); el usuario nunca ve si su día quedó cerca o lejos de sus metas, aunque `finalizeNutritionDay()` ya calcula `contract`/`residual`.

### Objetivo

Activar `DIET_CONTRACT` como señal informativa (no bloqueante) en el resultado ya cerrado, para que el usuario sepa cuándo su día quedó exacto y cuándo solo cercano, sin arriesgar la disponibilidad de la generación por IA mientras el catálogo sigue creciendo (REQ-143).

### Alcance

1. Cambiar `DIET_CONTRACT.runtimeActive` a `true` (deja de ser solo calibración).
2. En el resultado visible de `finalizeDayWithGate()` (día generado/regenerado/semana), cuando `finalized.contract.ok===false` agregar un aviso suave, sin vocabulario técnico prohibido (REQ-31; ej. "Tu día quedó cerca de tu meta, no exacto"), visible en la pantalla de revisión y en el día aplicado. No cambia `finalizedDayIsComplete()` como criterio de "aplicable" (sigue siendo cobertura de slots).
3. NO subir los 2 checks de macro de `validateGeneratedDay()` de `warns` a `issues` — siguen evaluando la propuesta cruda del modelo solo informativamente.
4. `api/claude.js::validateDietDay()`: no agregar rechazo nuevo por macros; puede anotar/loguear cumplimiento de contrato para telemetría futura, sin bloquear la respuesta.
5. `domain-contracts.js::validateNutritionPlanSnapshot()`: mantiene su tolerancia estructural actual (~±20%) para guardar/sync; NO se ata a las tolerancias estrictas de `DIET_CONTRACT` (evitar bloquear el guardado de días válidos aunque no queden "exactos").
6. Solo subir `COACH_PROMPT_VERSION`/`PROMPT_VERSION` e invalidar pool si el prompt o el criterio de aceptación del modelo cambian de verdad (probablemente no aplica bajo este alcance reducido).
7. Actualizar/crear validador que confirme: (a) ningún flujo cliente/servidor/snapshot bloquea aplicar/guardar un día por incumplir `DIET_CONTRACT`; (b) el aviso suave aparece cuando corresponde sin vocabulario técnico prohibido.

### Fuera de alcance

- Crecimiento de catálogo para subir la factibilidad del canario (REQ-143).
- Cambios de modelo/API (REQ-133).
- Reemplazo puntual de comida (REQ-142).
- Cualquier rechazo/bloqueo duro atado a `DIET_CONTRACT` (queda derogado de este REQ; requeriría una nueva decisión de producto explícita).

### Riesgos

- Confundir el aviso nuevo con los `warns` existentes de `validateGeneratedDay()`/`validateDayTotals()`: evitar mensajes duplicados en la misma pantalla.
- El copy debe pasar el filtro REQ-31 (nada de "IA", "modelo", "prompt"): hablar de "tu coach"/"tu plan".

### Criterios de aceptación

- `DIET_CONTRACT.runtimeActive` queda `true`.
- Cuando `finalized.contract.ok` es `false` tras `finalizeNutritionDay()`, la UI muestra un aviso suave y no bloqueante, sin vocabulario técnico prohibido.
- Ningún flujo (cliente, servidor, snapshot) rechaza ni impide aplicar/guardar un día por no cumplir `DIET_CONTRACT`.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Test que arma un día con `contract.ok:false` y confirma que el flujo lo deja aplicar igual, mostrando el aviso suave.
- Grep de vocabulario prohibido (REQ-31) en el copy nuevo.

## REQ-142 - Conectar reemplazos ("Cambiar comida") a `finalizeNutritionDay()`

**Estado: pendiente.**

### Origen

Extraído de REQ-138 (4 jul 2026) al acotar su alcance: los 5 flujos de generación/regeneración de día ya quedaron conectados a `finalizeNutritionDay()`, pero el flujo de reemplazo puntual de una comida (`openChangeMeal`/`applyChangeMeal`) usa su propio mecanismo (REQ-83: `rankReplacementCandidates` + `solveReplacement` + `rebalanceFutureMeals`), distinto y ya probado, que no se tocó para no arriesgar una regresión sin análisis dedicado.

### Problema

Cuando el usuario cambia una comida y el reemplazo dispara rebalanceo de comidas futuras (`rebalanceNeeded`), ese rebalanceo reparte `-deltaKcal/n` proporcionalmente entre las comidas futuras (REQ-83), sin pasar por el cierre global de macros (`globalClosePass`) ni por la normalización de `finalizeNutritionDay()`. El día resultante no se beneficia del mismo cierre que sí aplican ahora `generateOneDay`, `deterministicDayPayload`, `generateDeterministicWeek`, `regenerateDayInWeekDraft` y `regenerateGenMeal`.

### Causa raíz

El REQ-83 se construyó antes que `finalizeNutritionDay()` (REQ-129/137) y resuelve el mismo problema (cerrar macros del día tras un cambio) con un algoritmo propio de rebalanceo proporcional en vez del hill-climbing de `globalClosePass()`.

### Objetivo

Evaluar si `rebalanceFutureMeals()` debe reemplazarse (o complementarse) por una llamada a `finalizeNutritionDay()` con las comidas ya-hechas/ya-elegidas como `lockedMeals`, sin regresar los 9 casos cubiertos por `scripts/validate-nutrition-replacements.mjs`.

### Alcance

1. Diseñar el `ctx` de `finalizeNutritionDay()` para el caso "una comida cambia, N futuras se ajustan": `lockedMeals` = comidas hechas + la recién elegida; `proposal` = comidas futuras actuales (para conservar plato) o vacío (para permitir que el fallback determinista las reconsidere).
2. Decidir si se conserva `rebalanceFutureMeals()` como capa de compatibilidad (menos cambio de UI: "ajusta N comidas futuras") o se reemplaza por el resultado de `finalizeNutritionDay()`.
3. Mantener el copy existente ("· N ajustada(s)") y el registro en `contingencyLog`.
4. Actualizar/ampliar `scripts/validate-nutrition-replacements.mjs` para el nuevo camino.

### Fuera de alcance

- Activar `DIET_CONTRACT` en runtime (REQ-139).
- Cambiar el ranking de candidatos (`rankReplacementCandidates`) ni el scope "solo hoy/esta semana".

### Riesgos

- `rebalanceFutureMeals()` ya tiene 9 tests verificados; reemplazarlo sin cuidado puede regresar casos límite (ej. sin comidas futuras, deltas pequeños que no requieren rebalanceo).
- El "Cambiar comida" es una interacción de alta frecuencia; cualquier regresión de UX es muy visible.

### Criterios de aceptación

- El reemplazo de una comida con rebalanceo pasa por `finalizeNutritionDay()` (o se documenta explícitamente por qué no, con evidencia).
- Los 9 casos de `scripts/validate-nutrition-replacements.mjs` (o su reemplazo equivalente) siguen pasando.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E mockeado de "Cambiar comida" con rebalanceo de 2+ comidas futuras; inspeccionar que el resultado final es consistente con `finalizeNutritionDay()` o que la decisión de no usarlo queda documentada.

## REQ-143 - Catálogo lote 3: crecimiento drástico dirigido por el canario del contrato

**Estado: pendiente.**

### Origen

Decisión de Jonathan (2026-07-05) tras el bloqueo de REQ-139: antes de subir el rigor de cualquier validación de macros, el catálogo debe crecer drásticamente. Este REQ es exclusivamente sobre contenido de catálogo — ningún cambio de validación, prompt, modelo ni UI.

### Problema

`node scripts/validate-diet-contract.mjs` mide 32.3% (122/378), 100% `catalog_gap` (residuo de macro, no bug del solver). Causas: `carbs_contract` (133), `protein_contract` (111), `fat_contract` (47), `kcal_contract` (16). Dimensiones más débiles: "alta_proteina" con 2 o 6 comidas, vegano en general, vegetariano/vegano con "sin_tofu" (0% en casi todos los conteos).

### Causa raíz

REQ-135/136/140/141 ampliaron el catálogo a 200 ingredientes/180 platos, suficiente para eliminar `slot_without_candidates`, pero no suficiente densidad de platos con perfiles de macro específicos (altos en proteína con pocos carbohidratos, opciones veganas sin tofu/yogur) para que el solver + `globalClosePass()` puedan cerrar dentro de ±3%/±50 kcal, ±5 g proteína, ±8 g carbohidratos/grasa en esas combinaciones.

**Actualización (2026-07-05, intento sin commit):** agregar contenido no garantiza subir el canario. `planDeterministicNutritionDay()` elige el plato de cada slot por score local (ajuste de macro a ese slot + desempate de variedad), sin optimizar el día completo; además `almuerzo/media_manana/merienda/snack/recena` ya superan el corte de 48 candidatos por slot (solo los 48 más cercanos en kcal reciben solver completo), así que sumar platos ahí puede desplazar sin aviso al plato que hoy cierra un día. Se probaron 5 lotes (4 a 22 platos, en `desayuno`/`cena` para evitar ese corte): el mejor subió "2 comidas" de 39/54 a 50/54 (`vegano/alta_proteina/sin_tofu` de 0% a 85.7%) pero bajó "4 comidas" de 66/162 a 53/162; el agregado quedó siempre bajo 32.3% (27.8%-31.2%). Un lote de solo 4 platos de desayuno, sin relación con ninguna dimensión débil, regresó el agregado igual de fuerte, confirmando que el efecto es del mecanismo de selección, no del contenido. Ningún lote se comiteó. Ver REQ-144: hace falta medir el impacto real de un candidato contra el canario de 378 días, no solo contra el ajuste genérico de `scripts/grow-catalog.mjs`.

### Objetivo

Subir la factibilidad del canario de forma sustancial (no un lote incremental menor) priorizando las causas y dimensiones más débiles listadas arriba, acercándose lo más posible al gate ≥98% de REQ-128; si no alcanza el gate completo, dejar documentado el remanente para un REQ de continuación (siguiendo el patrón REQ-136→140→141). Bloqueado hasta que REQ-144 exista: sin medir el impacto por lote antes de comitear, no se puede garantizar que un lote nuevo suba el canario en vez de regresarlo.

### Alcance

1. Con la herramienta de REQ-144, generar candidatos (`scripts/grow-catalog.mjs` o curaduría manual) priorizando `carbs_contract`/`protein_contract` y las dimensiones en 0%-14%.
2. Medir cada candidato/lote contra el canario de 378 días antes de sumarlo a `supabase/seed.sql`; descartar lo que tenga impacto neto negativo o empeore una dimensión hoy sana.
3. Documentar fuentes en `docs/catalog-lote-3-sources.md` (formato de lotes previos) solo para los platos aceptados.
4. Actualizar `scripts/validate-nutrition-catalog.mjs` si cambian mínimos de cobertura (sin bajar los ya exigidos).
5. Documentar el nuevo % y `failureBreakdown`, y la acción manual pendiente de re-ejecutar `seed.sql` en producción.

### Fuera de alcance

- Cambio de validación/gating de `DIET_CONTRACT` (REQ-139) o de la selección de `planDeterministicNutritionDay()` (rediseño de día completo, no cabe en un lote de catálogo).
- Cambios de modelo/prompt (REQ-133, cerrado). Reemplazo puntual de comida (REQ-142).

### Riesgos

- Platos sin fuente de macros verificable rompen la confianza en `ingredients.kcal` (REQ-128); mantener el estándar de lotes previos.
- Optimizar solo el % agregado puede ocultar que se rompió una dimensión sana (visto en el intento de 2026-07-05); revisar el reporte por dimensión, no solo el neto.

### Criterios de aceptación

- El canario sube de forma sustancial desde 32.3% **sin bajar el total agregado respecto a la medición previa** (documentar el nuevo % y `failureBreakdown`, y el delta por dimensión de REQ-144).
- Las dimensiones hoy en 0% (ej. `vegano/alta_proteina/sin_tofu`, `vegetariano/normal/sin_tofu`) mejoran o quedan documentadas con causa explícita si no.
- `node scripts/validate-nutrition-catalog.mjs` y `node supabase/validate.mjs` pasan.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Reporte de REQ-144 antes/después del lote completo (no solo el % agregado de `validate-diet-contract.mjs`).
- `node supabase/validate.mjs` para integridad de recetas/macros del catálogo ampliado.

## REQ-144 - Medir impacto incremental de catálogo contra el canario antes de aceptar platos nuevos

**Estado: pendiente.**

### Origen

Hallazgo de REQ-143 (2026-07-05, sin commit): agregar platos, aun calibrados y confinados a slots sin corte de candidatos, puede regresar el % agregado de `validate-diet-contract.mjs` porque `planDeterministicNutritionDay()` elige por score local por slot sin optimizar el día completo.

### Problema

No hay forma barata de saber, antes de comitear un lote, si sube o baja el canario agregado y por dimensión. `scripts/grow-catalog.mjs` (REQ-134) solo valida que cada plato "encaje" contra `SLOT_TARGETS` genéricos de tolerancia amplia, no contra `finalizeNutritionDay()` sobre la matriz real de 378 días.

### Objetivo

Dar a cualquier lote de catálogo futuro una forma de comparar el canario antes/después de un candidato o lote completo, para aceptar solo cambios con impacto neto no negativo.

### Alcance

1. Agregar un modo a `scripts/validate-diet-contract.mjs` (o script nuevo `scripts/diff-diet-contract.mjs`) que acepte dos rutas de `seed.sql` y reporte el delta de `okDays` total y por dimensión.
2. Documentar en `docs/` cómo correrlo antes de comitear un lote de catálogo.
3. No modificar `DIET_CONTRACT` ni el solver: es tooling de medición offline.

### Fuera de alcance

- Cambiar la selección de `planDeterministicNutritionDay()` (rediseño de solver, fuera de este REQ). Activar el contrato en runtime (REQ-139).

### Riesgos

- Si el reporte solo muestra el delta neto sin desglose por dimensión, se repite el error que REQ-143 encontró a mano (optimizar el promedio a costa de una dimensión sana).

### Criterios de aceptación

- El nuevo modo/script corre sobre dos versiones de `supabase/seed.sql` y reporta `okDays` antes/después, delta total y por dimensión.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Usar los 5 lotes de prueba de REQ-143 (descartados, no comiteados) como casos de regresión conocidos: el tooling debe reportarlos como negativos.
