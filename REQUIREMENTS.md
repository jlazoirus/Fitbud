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
- Nutricion tiene catalogo con recetas, restricciones, dominio puro y metadata semantica de REQ-79. El foco pendiente es sacar la aritmetica nutricional del coach textual y pasarla a solver/planner determinista.
- Migraciones SQL nunca se ejecutan automaticamente en produccion; documentar acciones manuales.
- Al tocar `index.html` o shell PWA, revisar si corresponde subir `CACHE_NAME` en `service-worker.js`.

## Secuencia activa

Automatizable por el agente desarrollador:

1. REQ-81 - Planner semanal nutricional determinista y lista de compras derivada.
2. REQ-82 - Plan nutricional activo versionado en `plan_versions`.
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
14. REQ-106 - Perfil: aria-label en todos los inputs. (P1)
15. REQ-107 - Perfil: reagrupar Suscripción/Recordatorios/Avisos bajo Cuenta. (P1, depende de REQ-105)
16. REQ-108 - Perfil: guardado por sección con aviso de cambios sin guardar. (P1, depende de REQ-105 — el de mayor riesgo, al final)
17. REQ-109 - Fix Home: badge "N pendientes" cuenta la fila de Descanso. (P2)
18. REQ-110 - Fix: catch de aiGenerateWeek sin salida — opción práctica y reintento. (P1)
19. ~~REQ-111 - Fix API: /api/checkout valida Stripe antes que la sesión.~~ (implementado por REQ-59; entrada duplicada, no reabrir)
20. REQ-112 - Accesibilidad: toasts aria-live y contraste de texto muted. (P2)

Nota: los hallazgos P0-1 y P0-2 de esa auditoría (ruta determinista sin paywall en "Preparar mi día" y fallback+reintento en errores del coach) ya quedaron implementados el 1 jul junto con mejoras de calidad del solver determinista (pre-rankeo calórico, variedad por `recentUsed` y desempate por fecha).

Pendiente no automatizable por agentes:

- REQ-49 - Revision legal pre-lanzamiento.
- REQ-60 - Configuracion manual de redirects en Supabase.
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

**Estado: implementado (2026-06-30).**

### Origen

Los bugs REQ-64, REQ-75 y REQ-76 muestran el mismo patrón: el sistema le pide al modelo que ajuste gramos y macros, luego intenta corregir con prompt engineering o con más platos. El análisis recomienda mover esa aritmética a un solver determinista que trabaje sobre ingredientes, gramos y metadata del catálogo.

### Problema

`deterministicDayPayload()` existe como fallback, pero usa constantes y divisiones aproximadas. No calcula porciones desde la composición real de cada receta ni puede explicar cuándo un plato no alcanza las metas dentro de límites palatables. En cambio, el camino principal de `generateOneDay()` sigue dependiendo de una respuesta textual con macros declarados.

### Objetivo

Crear un solver determinista que, dado un perfil, target diario, slots del día y catálogo compatible, produzca un día nutricional completo con platos, ingredientes en gramos y macros recalculados. Debe funcionar sin llamadas externas y convertirse en el fallback principal de "Preparar mi día".

### Dependencias

- Requiere REQ-77 para targets consistentes.
- Requiere REQ-78 para contratos de dominio nutricional.
- Requiere idealmente REQ-79 para `compatible_slots` y límites de escalado; si REQ-79 no está aplicado en producción, debe degradar usando `slot` y defaults seguros.

### Alcance

1. Implementar en el módulo nutricional puro funciones como:
   - `mealSlotTargets(dayTarget, prefs, workoutContext)`;
   - `compatibleDishesForSlot(slot, prefs, catalog)`;
   - `solveDishPortion(dish, mealTarget, options)`;
   - `planDeterministicNutritionDay(ctx)`.
2. El solver debe optimizar `kcal`, proteína, carbohidratos y grasa como dimensiones independientes:
   - no asumir que cuadrar P/C/F cuadra kcal;
   - recalcular kcal desde `ingredients.kcal`;
   - devolver residual y score por dimensión.
3. Definir límites:
   - gramos mínimos, máximos y step por ingrediente cuando existan;
   - defaults conservadores cuando no existan;
   - topes palatables para evitar porciones absurdas.
4. Manejar `no_solution` de forma explícita:
   - plato incompatible;
   - proteína insuficiente;
   - kcal fuera de tolerancia;
   - ingrediente sin macros;
   - slot sin candidatos.
5. Integrar el solver como fallback principal en:
   - `homePrepareDay()` cuando no hay coach disponible;
   - `prepareFirstCycleDay()` ante fallo del servicio;
   - `deterministicDayPayload()` o reemplazo equivalente.
6. Mantener la UI sin lenguaje técnico: si no hay solución perfecta, mostrar una opción viable y un mensaje neutral, no detalles del solver.
7. Agregar tests:
   - metas normales y altas de proteína;
   - perfil vegano/vegetariano/omnívoro;
   - 2, 4 y 6 comidas;
   - slot sin candidatos devuelve `no_solution` medible;
   - kcal se valida con `ingredients.kcal`.

### Fuera de alcance

- No guardar todavía el día en `plan_versions.snapshot.nutritionPlan`.
- No reemplazar por completo la generación semanal con coach.
- No crear recetas nuevas.
- No ejecutar migraciones de producción.

### Riesgos

- El catálogo puede no tener suficientes platos para metas extremas; eso debe producir una causa medible, no una tolerancia escondida.
- El solver puede elegir porciones matemáticamente correctas pero poco apetecibles; los límites de porción son parte crítica del alcance.
- Cambiar el fallback puede alterar expectativas de usuarios sin coach; debe verificarse en Home y Nutrición móvil.

### Criterios de aceptación

- "Preparar mi día" puede llenar un día válido sin llamar a `/api/claude`.
- El día generado contiene platos, ingredientes con gramos y macros calculados por el motor.
- Para metas altas de proteína, el solver combina opciones compatibles o devuelve una causa `no_solution` sin dejar el día vacío.
- Los totales del día quedan dentro de la tolerancia documentada.
- No se muestran palabras prohibidas por REQ-31.
- `node scripts/validate-nutrition-solver.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Servir local y desactivar disponibilidad del coach; usar "Preparar mi día" en Home.
- Probar perfiles de 2, 4 y 6 comidas.
- Revisar red: cero llamadas a `/api/claude` durante el fallback determinista.
- `node scripts/validate-nutrition-solver.mjs`.

---

## REQ-81 - Planner semanal nutricional determinista y lista de compras derivada

**Estado: implementado.**
Funciones puras `planNutritionWeek`, `scoreWeeklyVariety` y `buildShoppingListFromNutritionPlan` en `js/nutrition-domain.js`. Integradas en `aiGenerateWeek()` como ruta determinista cuando el coach no está disponible. `genWeekReviewHtml()` muestra resumen semanal, advertencias de variedad y lista de compras por slug. Tests en `scripts/validate-nutrition-week-planner.mjs`.

### Origen

Fitbros ya muestra borradores semanales y lista de compras cuando genera una semana, pero esa lista depende del resultado generado y no de un plan nutricional determinista estable. El análisis propone que la lista de compras sea una derivación del plan semanal estructurado, no un artefacto textual del coach.

### Problema

El usuario puede preparar una semana, pero la coherencia depende de respuestas externas y de overrides. Además, si luego se necesita operar sin coach o controlar costo, no existe un planner semanal determinista equivalente al generador de entrenamiento validado.

### Objetivo

Crear un planner semanal que use el solver diario para producir 7 días estructurados, controle repetición, respete restricciones y genere lista de compras agregada desde ingredientes y gramos aplicados.

### Dependencias

- Requiere REQ-80.
- Aprovecha REQ-79 para variedad por slots y metadata.

### Alcance

1. Implementar funciones puras:
   - `planNutritionWeek(ctx)`;
   - `scoreWeeklyVariety(days, prefs)`;
   - `buildShoppingListFromNutritionPlan(days)`.
2. Generar exactamente 7 días desde fecha de inicio seleccionada.
3. Controlar repetición:
   - evitar repetir plato igual en días consecutivos si hay alternativa compatible;
   - respetar `repeatPreference` cuando exista;
   - permitir repetición pragmática si el catálogo no ofrece alternativas.
4. Generar lista de compras por ingrediente:
   - agrupar por `ingredientSlug` o fallback estable;
   - sumar gramos;
   - conservar nombre visible y categoría;
   - redondear cantidades a unidades razonables cuando aplique.
5. Integrar como fallback o modo determinista en el flujo actual de "Preparar mi semana", manteniendo revisión antes de aplicar.
6. El borrador semanal debe mostrar:
   - resumen de kcal/proteína promedio;
   - advertencias de slots sin variedad;
   - lista de compras derivada;
   - botón para aplicar como hoy.
7. Agregar tests de semana:
   - suma diaria en tolerancia;
   - lista de compras coincide con ingredientes de los 7 días;
   - no duplica ingredientes por nombre distinto si comparten slug;
   - respeta restricciones duras.

### Fuera de alcance

- No mover todavía el plan semanal activo a `plan_versions`.
- No construir rebalanceo de reemplazos.
- No crear panel nuevo de inventario o despensa.

### Riesgos

- El catálogo puede ser insuficiente para variedad real en 5-6 comidas; debe avisarse como limitación de catálogo, no fallar silenciosamente.
- Si no existen slugs, la agregación de compras debe usar fallback seguro hasta REQ-79.

### Criterios de aceptación

- "Preparar mi semana" tiene una ruta determinista sin llamada externa cuando el coach no está disponible.
- El borrador semanal contiene 7 días con comidas estructuradas y lista de compras derivada de ingredientes reales.
- La lista de compras suma exactamente lo aplicado en los días del borrador, dentro de redondeos documentados.
- Restricciones duras se respetan en todos los días.
- `node scripts/validate-nutrition-week-planner.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Desactivar coach y preparar una semana.
- Probar perfil vegetariano, vegano y omnívoro.
- Comparar manualmente un ingrediente repetido en varios días contra su total en compras.
- `node scripts/validate-nutrition-week-planner.mjs`.

---

## REQ-82 - Plan nutricional activo versionado en `plan_versions`

**Estado: implementado.**
`validateNutritionPlanSnapshot()` en `domain-contracts.js`. `buildNutritionPlanSnapshot()`, `saveNutritionPlanVersion()` y `activeNutritionPlanDay()` en `index.html`. `buildDay()` lee primero el nutritionPlan activo; `mealValue()` añade capa `nutritionPlan` entre override y fallback vacío. `applyWeekPlan()` guarda en `plan_versions` (con compatibilidad de override). Tests en `scripts/validate-nutrition-plan-snapshot.mjs`.

### Origen

El análisis identificó la falla arquitectónica más importante: la prescripción nutricional vive como overrides de `day_log.state.meals`, mientras `day_log` debería representar ejecución. Fitbros ya tiene `plan_versions` para entrenamiento y snapshots de plan; nutrición debe usar el mismo patrón.

### Problema

Actualmente:

- `buildDay(ds)` puede construir slots vacíos.
- `applyDayComidas()` guarda comidas generadas como overrides en `day_log`.
- `day_log` mezcla prescripción, cambios y ejecución.
- Auditar qué plan vio el usuario en una fecha futura o pasada depende de reconstruir estado mutable y overrides.

Esto debilita historial inmutable, sync, reemplazos y compras.

### Objetivo

Guardar el plan nutricional prescrito como entidad de primera clase dentro de `plan_versions.snapshot.nutritionPlan`, con snapshots materializados y auditables. `day_log` debe quedar para registrar lo ejecutado, cambios aplicados, extras y estado offline, no como fuente principal de prescripción.

### Dependencias

- Requiere REQ-79 antes de guardar referencias estables.
- Requiere REQ-80 o REQ-81 para producir planes estructurados.
- Debe respetar REQ-13: versiones futuras no reescriben historial.

### Alcance

1. Definir schema de `nutritionPlan` dentro de `plan_versions.snapshot`:
   - `version`;
   - `catalogVersion` o fecha de catálogo si existe;
   - `days[]`;
   - `day.date`;
   - `day.target`;
   - `day.meals[]`;
   - `meal.id` estable dentro del plan;
   - `meal.slot`;
   - `meal.dishSlug`, `dishName` y opcional `dishId` operativo;
   - `meal.ingredients[]` con `ingredientSlug`, `name`, `grams`, macros por línea opcionales;
   - `meal.macros` calculados al activar;
   - `shoppingList`.
2. Guardar snapshots materializados: aunque el catálogo cambie después, el snapshot conserva nombre, gramos y macros usados en ese momento.
3. Adaptar `buildDay(ds)` para leer primero la prescripción de `nutritionPlan` activa para la fecha:
   - si existe, renderiza comidas desde snapshot;
   - si no existe, usa el fallback actual.
4. Adaptar `mealValue()` para resolver:
   - ejecución/override de `day_log` cuando exista;
   - prescripción de `nutritionPlan`;
   - catálogo DB/fallback solo como compatibilidad.
5. Adaptar `applyDayComidas()` y flujos de aplicar semana:
   - crear o actualizar borrador de `plan_versions` con `nutritionPlan`;
   - activar solo después de confirmación;
   - no escribir prescripción como override del día salvo compatibilidad temporal necesaria.
6. Mantener `day_log.state.meals` para:
   - `done`;
   - replacement aplicado;
   - edición manual real del día;
   - notas/contingencias;
   - estado de sync/conflicto.
7. Migración/backfill:
   - no intentar reconstruir todo el pasado;
   - para perfiles sin `nutritionPlan`, seguir usando compatibilidad hasta que preparen día/semana;
   - no borrar overrides existentes.
8. Agregar validador de snapshot:
   - every meal has slug/materialized name/macros;
   - day targets sum within tolerance;
   - shopping list matches days if present.

### Fuera de alcance

- No cambiar tablas SQL si `plan_versions.snapshot` JSONB es suficiente.
- No reescribir historial existente.
- No resolver reemplazos con rebalanceo; eso es REQ-83.

### Riesgos

- Mezclar snapshots nuevos con overrides antiguos puede duplicar comidas si no se define prioridad clara.
- Los service workers viejos pueden servir una versión de `index.html` incompatible; subir `CACHE_NAME` si se toca el shell PWA.
- El sync offline debe seguir considerando `day_log` como ejecución, no plan.

### Criterios de aceptación

- Un plan nutricional nuevo queda guardado en `plan_versions.snapshot.nutritionPlan`.
- `buildDay()` renderiza comidas prescritas desde `nutritionPlan` sin depender de overrides en `day_log`.
- Marcar una comida como hecha escribe ejecución en `day_log` sin modificar el snapshot prescrito.
- Cambiar un plan futuro no reescribe días ya ejecutados.
- Snapshots siguen auditables aunque cambie el catálogo, porque guardan slugs, nombres, gramos y macros materializados.
- `node scripts/validate-nutrition-plan-snapshot.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Preparar una semana, activar, recargar y confirmar que `plan_versions.snapshot.nutritionPlan` contiene días y compras.
- Marcar una comida, recargar y confirmar que el snapshot no cambia pero `day_log` sí.
- Cambiar catálogo localmente y confirmar que el día histórico sigue mostrando lo materializado en el snapshot.

---

## REQ-83 - Reemplazos equivalentes con rebalanceo de comidas futuras

**Estado: implementado.** Motor puro `rankReplacementCandidates`, `solveReplacement`, `rebalanceFutureMeals` en `js/nutrition-domain.js`; `openChangeMeal`/`applyChangeMeal`/`revertMeal` en `index.html` enriquecidos con ranking y rebalanceo; contingencyLog incluye comidas rebalanceadas; 9 tests en `scripts/validate-nutrition-replacements.mjs`.

### Origen

REQ-36 unificó acciones de comida y REQ-19 agregó contingencias, pero el reemplazo actual sigue siendo principalmente una lista de platos con delta de kcal. El análisis nutricional propone el comportamiento tipo Fitia: cambiar una comida sin romper el día ni reescribir lo ya ejecutado.

### Problema

Hoy cambiar una comida:

- muestra impacto, pero no siempre conserva coherencia de macros diarios;
- no rebalancea el resto del día;
- puede dejar déficit/exceso que el usuario debe resolver manualmente;
- no usa todavía un solver de porciones ni una prescripción nutricional activa.

### Objetivo

Convertir "Cambiar" en un reemplazo equivalente: elegir alternativas compatibles, ajustar porciones y, cuando sea necesario, rebalancear comidas futuras no registradas para conservar los objetivos diarios. El usuario debe ver el impacto antes de confirmar.

### Dependencias

- Requiere REQ-80 para solver.
- Requiere REQ-82 para distinguir prescripción de ejecución de forma robusta.

### Alcance

1. Implementar motor puro de reemplazo:
   - `rankReplacementCandidates(meal, candidates, target, prefs)`;
   - `solveReplacement(meal, candidate, dayPlan, dayLog)`;
   - `rebalanceFutureMeals(dayPlan, changedMeal, dayLog)`.
2. En el modal/hoja de "Cambiar":
   - listar candidatos por cercanía a kcal/proteína y restricciones;
   - mostrar delta de kcal, proteína, carbohidratos y grasa;
   - indicar si requiere rebalancear otra comida futura;
   - conservar motivo opcional y alcance.
3. Rebalancear solo comidas del mismo día que:
   - no estén marcadas como hechas;
   - no tengan edición manual explícita;
   - no pertenezcan a días completados.
4. Si no se puede rebalancear:
   - permitir aplicar con advertencia neutral si queda dentro de tolerancia aceptable;
   - o bloquear si rompe restricciones/targets de forma severa.
5. Guardar en `day_log.state.contingencyLog`:
   - comida original;
   - comida nueva;
   - gramos/macros;
   - comidas rebalanceadas;
   - motivo;
   - timestamp.
6. Mantener "Volver al plan":
   - revierte reemplazo y rebalanceos asociados cuando sea seguro;
   - nunca borra registros ejecutados.
7. Agregar tests:
   - reemplazo dentro de tolerancia sin rebalanceo;
   - reemplazo que rebalancea cena futura;
   - comida ya registrada no se toca;
   - día completado no se reescribe;
   - restricciones duras bloquean candidato.

### Fuera de alcance

- No resolver rebalanceo semanal completo; este REQ opera por día.
- No crear recetas nuevas.
- No cambiar el flujo de entrenamiento.

### Riesgos

- Rebalancear silenciosamente puede erosionar confianza; cada cambio debe mostrarse antes de confirmar.
- Revertir debe ser cuidadoso para no borrar acciones hechas después del reemplazo.
- Los conflictos offline pueden involucrar cambios rebalanceados; el log debe ser claro.

### Criterios de aceptación

- Cambiar una comida propone alternativas compatibles rankeadas por cercanía a la meta.
- Si el reemplazo desbalancea el día, el sistema propone ajustes en comidas futuras no registradas antes de aplicar.
- Ninguna comida ya marcada como hecha se modifica por rebalanceo.
- "Volver al plan" revierte el cambio sin borrar ejecución real.
- El resumen del día muestra la adaptación y cualquier rebalanceo aplicado.
- `node scripts/validate-nutrition-replacements.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Día con desayuno hecho y almuerzo pendiente: cambiar almuerzo y confirmar que desayuno no cambia.
- Día con comida futura disponible: aplicar reemplazo alto en kcal y confirmar rebalanceo propuesto.
- Forzar offline, aplicar cambio, reconectar y confirmar que sync mantiene log y estado.

---

## REQ-84 - Coach nutricional como generador auxiliar validado, no autoridad de macros

**Estado: implementado.** `recalcCoachMealMacros(comida, catalog)` y `normalizeCoachIngredient` en `js/nutrition-domain.js` calculan macros reales desde el catálogo. `validateGeneratedDay` en `index.html` ignora macros declarados por el coach cuando el catálogo está disponible; marca ingredientes desconocidos con `needs_catalog_review`; mantiene fallback declarado cuando el catálogo no está cargado. 8 tests en `scripts/validate-nutrition-coach-contract.mjs`.

### Origen

El análisis concluye que los parches de prompt no deben seguir siendo la forma principal de corregir aritmética nutricional. La IA debe aportar variedad, explicación y traducción de preferencias, pero el sistema debe mapear ingredientes, calcular macros, ajustar porciones y validar antes de aplicar.

### Problema

`generateOneDay()` y flujos similares todavía dependen de respuestas que declaran macros y gramos. Aunque hay validaciones, el modelo sigue siendo la fuente inicial de un cálculo que debería ser determinista. Esto genera fallos recurrentes con metas altas, restricciones, porciones y catálogo incompleto.

### Objetivo

Reubicar al coach nutricional como capa auxiliar: propone recetas o alternativas, pero Fitbros solo aplica resultados que el motor nutricional pueda normalizar, recalcular y validar. La experiencia visible sigue siendo la misma: "tu coach" prepara opciones; internamente, el motor decide si son aplicables.

### Dependencias

- Requiere REQ-78 y REQ-80.
- Idealmente requiere REQ-79 para mapear recetas a slugs/metadata.
- Debe respetar REQ-31, REQ-32 y REQ-25.

### Alcance

1. Cambiar el contrato de generación nutricional:
   - el coach puede proponer nombre, slot, ingredientes y preparación;
   - macros declarados por la respuesta son informativos o ignorados;
   - el motor calcula macros reales desde ingredientes mapeados.
2. Implementar normalización de ingredientes:
   - match por `ingredientSlug` si existe;
   - match por nombre normalizado;
   - si el ingrediente no existe, marcar `needs_catalog_review` o usar sustituto aprobado;
   - no aplicar recetas con ingredientes desconocidos como plan activo.
3. Pasar toda propuesta por:
   - restricciones duras;
   - solver de porciones;
   - tolerancias del día/slot;
   - validación de ingredientes conocidos;
   - entitlement/cuota existente.
4. Mantener fallback determinista:
   - si el coach falla o propone algo inválido, usar solver determinista;
   - no dejar el día vacío.
5. Guardar resultados válidos en un pool privado solo si son recalculables y compatibles con el perfil actual.
6. Opcional en este REQ si el alcance alcanza: crear una cola/admin de "recetas candidatas" para que recetas nuevas se revisen antes de entrar al catálogo global.
7. Actualizar tests de `api/claude.js`/quota:
   - respuesta con macros falsos pero ingredientes conocidos se recalcula;
   - ingrediente desconocido no se aplica;
   - restricción dura bloquea;
   - quota agotada usa fallback sin llamada externa.

### Fuera de alcance

- No crear automáticamente recetas globales sin revisión.
- No ampliar catálogo masivo.
- No mostrar detalles técnicos al usuario.
- No consumir servicios pagados fuera de las llamadas ya controladas por cuota.

### Riesgos

- Mapear ingredientes por nombre puede producir falsos positivos; debe preferirse slug o selección de catálogo.
- Rechazar demasiadas propuestas puede reducir variedad; el fallback determinista debe cubrir la experiencia.
- Si se guarda pool privado, debe revalidarse ante cambios de perfil.

### Criterios de aceptación

- Ninguna comida generada por el coach se aplica usando macros declarados como autoridad.
- Las macros visibles salen del motor sobre ingredientes conocidos y gramos finales.
- Una propuesta con ingrediente desconocido queda bloqueada o marcada para revisión, sin aplicarse como plan activo.
- Al fallar una propuesta, el usuario recibe una opción determinista válida.
- Se mantiene el techo de cuota y el vocabulario invisible.
- `node scripts/test-coach-quota.mjs` pasa.
- `node scripts/validate-nutrition-coach-contract.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Mockear respuesta con macros inflados y confirmar que la app recalcula.
- Mockear ingrediente inexistente y confirmar bloqueo/fallback.
- Agotar cuota y confirmar que no hay llamada externa adicional.
- Recorrer "Preparar mi día" y "Preparar mi semana" como usuario normal, sin textos técnicos.

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

**Estado: implementado.** Fixes en `deterministicTrainingWeekPayload` (causa raíz), `workout-player.js`, `training-plan.js` y `workoutPrescription`.

### Problema

Al iniciar una sesión de gimnasio generada (ej. "Gimnasio - Pull A"), la sesión mostraba solo 2 bloques: **Bloque 1 de 2 (Calentamiento)** y **Bloque 2 de 2 (Vuelta a la calma)**, sin ningún bloque de ejercicios reales entre ellos.

### Causa raíz

En `deterministicTrainingWeekPayload` (el fallback determinístico que se usa cuando la IA falla o genera datos inválidos), los ejercicios del template estático se filtran por `spec.allowedExerciseIds`:

```js
const exerciseIds = exerciseArray(workout.exerciseIds).filter(id => spec.allowedExerciseIds.includes(id));
```

Los ejercicios del template Pull A de gimnasio son `["lat-pulldown","seated-cable-row","face-pull","biceps-curl","hammer-curl"]`, todos requieren cable (machines) o mancuernas. Si el usuario no tiene `machines` ni `dumbbells` en su equipamiento seleccionado (ej: solo barra y dominadas), **ninguno pasa el filtro** → `exerciseIds = []` → el fallback genera una sesión con `exercises: []`.

Cuando el usuario inicia esa sesión, `WORKOUT_PLAYER.buildPrescription` detecta `generatedPrescription.exercises` como array vacío, entra al path "generado" (la condición original solo verificaba `Array.isArray` sin verificar longitud), y `generatedStrengthSteps` itera 0 veces → solo warmup + cooldown = **2 bloques**.

La misma condición de guarda (`!session.allowedExerciseIds.length`) no protege este caso porque `allowedExerciseIds` del usuario incluye otros ejercicios (back-squat, pull-up, etc.), así que la generación del plan procede, pero los ejercicios del template nunca coinciden.

### Solución (4 fixes)

**Fix 1 — Causa raíz (`index.html` `deterministicTrainingWeekPayload`):** Si el filtro de template produce < 2 ejercicios, suplementar con ejercicios de `spec.allowedExerciseIds` hasta 6:

```js
let exerciseIds = exerciseArray(workout?.exerciseIds).filter(id => allowedExerciseIds.includes(id));
if (strength && exerciseIds.length < 2) {
  const extra = allowedExerciseIds.filter(id => !exerciseIds.includes(id));
  exerciseIds = [...exerciseIds, ...extra].slice(0, 6);
}
```

**Fix 2 — Defensivo (`workout-player.js` `buildPrescription`):** No entrar al path generado cuando `exercises` está vacío; agregar `&& exercises.length > 0`:

```js
if (workout.generatedPrescription && Array.isArray(workout.generatedPrescription.exercises) && workout.generatedPrescription.exercises.length > 0)
```

**Fix 3 — Data (`training-plan.js` `workoutFromSession`):** Incluir `role: session.role` en el workout generado para que el fallback de sesión pueda buscarlo.

**Fix 4 — Fallback de sesión (`index.html` `workoutPrescription`):** Cuando el workout generado tiene `exerciseIds: []` (plan almacenado con bug), usar el template estático del rol como respaldo para que el usuario pueda iniciar la sesión sin regenerar el plan:

```js
if (workout.generated && !prescribedIds.length && workout.role) {
  const template = workoutById(ds, workout.role, planPrefsForDate(ds));
  if (template?.exerciseIds?.length) prescribedIds = exerciseArray(template.exerciseIds);
}
```

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `deterministicTrainingWeekPayload`: suplementar ejercicios cuando filtro < 2 |
| `index.html` | `workoutPrescription`: fallback a template estático cuando `exerciseIds` vacío |
| `workout-player.js` | `buildPrescription`: condición `exercises.length > 0` antes de path generado |
| `training-plan.js` | `workoutFromSession`: expone `role: session.role` en el workout |

### Criterios de aceptación

- Una sesión Pull A de gimnasio generada muestra calentamiento + ejercicios reales + vuelta a la calma (≥ 3 bloques).
- Para usuario con equipamiento limitado (sin machines/dumbbells), el fallback usa ejercicios alternativos de `allowedExerciseIds`.
- Para planes ya almacenados con `exercises: []`, la sesión usa el template estático del rol (el usuario ve ejercicios aunque no sean los generados por IA).
- No hay regresión en sesiones Pull A ya generadas correctamente con ejercicios.
- `node scripts/release-gate.mjs` pasa.

---

## REQ-94 - Fix: demostración de ejercicio aparecía como imagen estática con "Reducir Movimiento" activo

**Estado: implementado.** Dos cambios en `index.html`: (1) se eliminó `demo-frame-1` del bloque CSS `prefers-reduced-motion`, (2) se reemplazó el botón disabled "Movimiento reducido" por el botón habilitado "Reproducir/Pausar".

### Descripción del bug

En la pantalla de detalle de ejercicio (ej. Face Pull), la demostración aparecía como imagen estática sin movimiento en dispositivos con "Reducir Movimiento" activo (iOS: Configuración → Accesibilidad → Movimiento → Reducir Movimiento, o preferencia equivalente del sistema operativo que activa `prefers-reduced-motion: reduce` en el navegador).

### Contexto del sistema de demos

Los ejercicios de Supabase usan `media_type: "image_sequence"` con 2 fotogramas JPEG (posición inicio y posición final, provenientes de Free Exercise DB). La "animación" es CSS puro: `.demo-frame-1` alterna su `opacity` vía `@keyframes demoFrame` (`1.6s steps(1,end) infinite`), creando el efecto de flip entre los dos fotogramas.

### Causa raíz (dos fallos compuestos)

**Fallo 1 — CSS aplasta la animación con `!important`:**

```css
/* Antes — en @media(prefers-reduced-motion:reduce) */
.demo-frame.demo-frame-1 { animation: none !important; opacity: 0 !important; }
```

`opacity:0!important` ocultaba `demo-frame-1` permanentemente bajo `prefers-reduced-motion`. Como la regla `.exercise-card.paused .demo-frame-1 { animation-play-state: paused }` ya maneja el estado "pausado" (animación detenida en `opacity: 0` al inicio del ciclo), esta regla era redundante y además dañina al bloquear que el usuario pudiera ver frame-1 incluso si activa la animación.

**Fallo 2 — Botón de control deshabilitado:**

```js
// Antes
${reduced ? '<button class="btn btn-sm" disabled>Movimiento reducido</button>' : `...Reproducir/Pausar...`}
```

Con `reduced === true`, el botón de play/pause se reemplazaba por un botón deshabilitado, impidiendo que el usuario activara manualmente la animación.

### Fix (`index.html`)

**CSS** — eliminar `demo-frame-1` del bloque `prefers-reduced-motion`:

```css
/* Antes */
@media(prefers-reduced-motion:reduce){
    .demo-athlete,.demo-crank{animation:none!important}
    .demo-frame.demo-frame-1{animation:none!important;opacity:0!important}
}

/* Después (REQ-94) */
@media(prefers-reduced-motion:reduce){
    .demo-athlete,.demo-crank{animation:none!important}
}
```

**JS** — siempre mostrar el botón habilitado:

```js
// Antes
${reduced ? '<button class="btn btn-sm" disabled>Movimiento reducido</button>' : `<button ... >${pausedByDefault?"Reproducir":"Pausar"}</button>`}

// Después (REQ-94)
<button class="btn btn-sm" onclick="toggleExerciseMotion(this)" aria-pressed="${pausedByDefault}">${pausedByDefault?"Reproducir":"Pausar"}</button>
```

### Comportamiento resultante

- Con `prefers-reduced-motion: reduce` activo: la tarjeta arranca con clase `paused` → `demo-frame-1` tiene `animation-play-state: paused` → se ve solo frame-0 (posición inicial). El botón muestra **"Reproducir"** (habilitado).
- Al pulsar "Reproducir": se elimina clase `paused` → `demoFrame` corre → flip entre frame-0 y frame-1 cada 0.8s. El botón cambia a **"Pausar"**.
- Sin `prefers-reduced-motion`: comportamiento sin cambios (animación automática al cargar).
- Las SVGs animadas (`.demo-athlete`, `.demo-crank`) siguen bloqueadas bajo `prefers-reduced-motion` correctamente.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | CSS: eliminar `demo-frame-1` de `@media(prefers-reduced-motion:reduce)` |
| `index.html` | JS `exerciseCard`: siempre renderizar botón Reproducir/Pausar habilitado |

### Criterios de aceptación

- Con `prefers-reduced-motion: reduce` simulado, `exerciseCard` con `media_type: "image_sequence"` rinde HTML sin `disabled` y con texto "Reproducir".
- La tarjeta tiene clase `paused` al renderizarse → `demo-frame-1.animationPlayState === "paused"`.
- Al hacer click en "Reproducir", la clase `paused` se elimina → `demo-frame-1.animationPlayState === "running"`.
- El bloque CSS `@media(prefers-reduced-motion:reduce)` ya no contiene regla para `.demo-frame-1`.
- `node scripts/release-gate.mjs` pasa.

---

## REQ-93 - Fix: exerciseCatalog devolvía catálogo vacío cuando tabla exercises de Supabase está vacía

**Estado: implementado.** Fix en `exerciseCatalog` (`index.html`) para usar `LOCAL_EXERCISES` como fallback cuando `DB.exercises` está vacío, consistente con `activeTrainingCatalog`.

### Descripción del bug

Cuando la tabla `exercises` de Supabase existe pero está vacía (i.e. `exercises.sql` no se ejecutó o los seeds no se aplicaron), `dbLoad` almacenaba `DB.exercises = []` con `DB.exerciseReady = true`. Esto provocaba que `exerciseCatalog()` devolviera un array vacío, haciendo que `exerciseBySlug()` retornara `null` para todos los slugs.

### Causa raíz

`exerciseCatalog()` y `activeTrainingCatalog()` usaban condiciones de fallback inconsistentes:

```js
// exerciseCatalog — NO verificaba length: retornaba [] cuando DB.exercises=[]
const source = DB.exerciseReady ? DB.exercises : LOCAL_EXERCISES;

// activeTrainingCatalog — SÍ verificaba length: fallback correcto a LOCAL
const source = DB.loaded && Array.isArray(DB.exercises) && DB.exercises.length
  ? DB.exercises : LOCAL_EXERCISES;
```

Resultado: `allowedExerciseIds` se calculaba correctamente (vía `activeTrainingCatalog` con LOCAL), el plan se generaba, pero todos los `exerciseBySlug()` en `deterministicTrainingWeekPayload` y `workoutPrescription` retornaban `null` → `exercises = []` → 2 bloques solamente.

### Fix (`index.html` `exerciseCatalog`)

Alinear `exerciseCatalog` con la condición de fallback de `activeTrainingCatalog`:

```js
// Antes
const source = DB.exerciseReady ? DB.exercises : LOCAL_EXERCISES;

// Después (REQ-93)
const source = (DB.exerciseReady && Array.isArray(DB.exercises) && DB.exercises.length)
  ? DB.exercises : LOCAL_EXERCISES;
```

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `exerciseCatalog`: fallback a `LOCAL_EXERCISES` cuando `DB.exercises` está vacío |

### Criterios de aceptación

- Con Supabase configurado pero tabla `exercises` vacía, `exerciseBySlug("lat-pulldown", true)` retorna el ejercicio de `LOCAL_EXERCISES`.
- Con Supabase configurado y tabla `exercises` con datos, `exerciseBySlug` sigue usando los datos de Supabase (sin regresión).
- Combinado con REQ-92, una sesión Pull A de gimnasio muestra ejercicios reales independientemente del estado de la tabla `exercises` en Supabase.
- `node scripts/release-gate.mjs` pasa.

---

## REQ-95 - Nav bar del footer no ancla al fondo en iOS

**Estado: implementado.**

### Problema

En iOS, la barra de navegación inferior (`.tabs` con `position:fixed;bottom:0`) no se anclaba al fondo de la pantalla. En la vista principal aparecía en medio del contenido con la sección del coach visible debajo de ella. Causa probable: quirk de iOS Safari con `position:fixed` cuando el contenido desborda la altura del viewport.

### Solución

Cambio de arquitectura: de `position:fixed` para el nav bar a un layout flexbox en `body`.

- `html/body`: `height:100dvh; display:flex; flex-direction:column; overflow:hidden`
- `#app`: `flex:1; min-height:0; overflow-y:auto` (el contenido scrollea dentro del `#app`, no en el `window`)
- `.tabs`: `flex-shrink:0` (queda anclado al fondo de body como hijo flex natural, sin `position:fixed`)
- `padding-bottom` de `#app`: de `calc(88px + safe-bottom)` a `calc(20px + safe-bottom)` (ya no es necesario reservar espacio para el nav flotante)

Se agregaron helpers `scrollAppTop()` y `scrollAppBottom()` para reemplazar los 14 llamados a `window.scrollTo()` que ya no funcionan cuando el scroll container es `#app` en vez de `window`.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | Layout flexbox en body/app/tabs + helpers scroll + sustitución de window.scrollTo |

### Criterios de aceptación

- La barra de navegación (Hoy/Nutrición/Entreno/Progreso/Perfil) siempre queda en el borde inferior de la pantalla.
- El contenido de la vista Hoy (incluyendo la sección del coach) scrollea por encima del nav bar.
- Las hojas modales (`.overlay`, `.sheet`), toasts y otros elementos `position:fixed` siguen funcionando correctamente.
- `node scripts/release-gate.mjs` pasa.

## REQ-96 - Crear suite E2E Playwright de journeys críticos e integrarla al release-gate

**Estado: implementado.**

### Solución (2026-07-02)

Suite en `tests/e2e/` con `@playwright/test` (devDependency) + Chromium headless, corriendo la app real servida por `python3 -m http.server 8923` con **toda la red interceptada** (`tests/e2e/helpers.js`): Supabase (PostgREST stateful: lo upserteado se devuelve en GETs), `/api/*`, CDN de supabase-js vendorizado (`tests/e2e/vendor/`) y fuentes. El "coach" (`/api/claude`) se mockea leyendo metas y slots del propio prompt y construyendo comidas del catálogo fixture que cumplen las metas — 0 llamadas pagadas, 100 % offline y determinista.

5 specs / 7 tests: `onboarding.spec.js` (onboarding completo, Mifflin-St Jeor verificado aparte, macros mostrados = guardados en el upsert de profiles), `nutricion.spec.js` (objetivos del día + preparar mi día + aplicar), `entreno.spec.js` (sesión guiada completa, adaptativa al nº de bloques, regresión REQ-92), `progreso.spec.js` (peso mostrado = guardado = sincronizado a weight_log), `navegacion.spec.js` (5 tabs + landing sin sesión + REQ-31, consola limpia en todos). Helpers exportados (`installMocks`, `seedLoggedInUser`, `completePrefs`) reutilizables por el loop auditor. Integrada a `release-gate.mjs` como check bloqueante con timeout de 5 min. Verificado: romper `completeWorkoutStep` hace fallar la suite.

Comandos: `npm run test:e2e` o `npx playwright test`. Primera vez: `npm install && npx playwright install chromium`.

### Origen

Decisión de producto (2026-07-01): el loop auditor ahora hace verificación funcional obligatoria en navegador por corrida, pero los commits diarios del desarrollador solo pasan por `release-gate.mjs` (sintaxis, validadores, SQL, seguridad) — nadie verifica automáticamente que un fix funcione *en pantalla* antes del push. Se necesita una capa de regresión E2E determinista.

### Problema

Un fix puede pasar el release-gate en verde y aun así romper un journey completo en la UI (ejemplos recientes: REQ-92 sesión Pull A solo mostraba calentamiento, REQ-95 nav bar desanclada en iOS). No existe ninguna prueba automatizada que abra la app en un navegador y recorra los flujos críticos.

### Causa raíz

No aplica un bug puntual: es una brecha de infraestructura de QA. El release-gate (`scripts/release-gate.mjs`) no incluye ningún check que ejecute la app renderizada.

### Objetivo

Que ningún commit pueda publicarse si rompe uno de los journeys críticos: la suite E2E recorre la app como usuario real y falla el gate si un flujo se rompe.

### Alcance

1. Añadir Playwright como dependencia de desarrollo (`@playwright/test`, navegador chromium) — patrón aprobado explícitamente para este REQ pese al invariante "sin dependencias nuevas"; es tooling de test, no dependencia runtime de la app.
2. Crear `tests/e2e/` con specs para los journeys críticos: (a) onboarding/perfil y cálculo de macros mostrado, (b) ver objetivos del día en Nutrición y aplicar una comida, (c) iniciar y completar una sesión de entreno con el reproductor, (d) registrar peso en Progreso, (e) navegación entre tabs y estados vacíos sin errores de consola.
3. Fixtures/mocks deterministas para toda llamada a IA y a Supabase (interceptar red con `page.route`); las pruebas corren 100% offline y sin llamadas pagadas.
4. Helpers reutilizables (login/seed de estado local) exportados para que el loop auditor los reuse en su verificación funcional.
5. Integrar la suite al `release-gate.mjs` como check bloqueante, con timeout razonable.

### Fuera de alcance

- No cambiar comportamiento de la app para hacerla "testeable" (si algo no se puede testear sin tocar la app, documentarlo como REQ aparte).
- No testear Stripe real ni Supabase real.
- No cubrir los 12 journeys en esta primera iteración: solo los 5 críticos listados.

### Riesgos

- Flakiness de E2E puede bloquear el loop desarrollador; mitigar con mocks deterministas, `retries: 1` y timeouts generosos.
- El tamaño de `index.html` (~600 KB) puede hacer lentos los arranques; servir con el mismo `http.server` local.
- Instalación de chromium requiere red la primera vez (`npx playwright install chromium`).

### Criterios de aceptación

- `npx playwright test` corre en local, offline, y pasa en verde sobre `HEAD`.
- Romper deliberadamente un journey (p. ej. comentar el render del reproductor) hace fallar la suite.
- Las pruebas no hacen ninguna llamada de red externa (IA, Supabase, Stripe) — todo interceptado.
- `node scripts/release-gate.mjs` ejecuta la suite y queda en verde.

### Verificación sugerida

- `npx playwright test --reporter=list` y revisar que los 5 journeys pasan.
- `node scripts/release-gate.mjs` incluye y pasa el check E2E.


## REQ-97 - UX: reordenar Home — la agenda primero, hero compacto, un banner a la vez

**Estado: implementado.**
`renderHoy()` en `index.html` ahora ordena header → agenda → hero → banners → coach. `heroDash(ds,opts)` acepta `opts.compact` (solo Home lo usa) y colapsa a una línea ("kcal/meta kcal · comidas/total") mientras `doneMeals===0`; Nutrición sigue usando la versión completa sin pasar `opts`. Los banners de check-in y "Afina tu plan" comparten cola de prioridad (checkin > afinar plan, máximo uno); "Afina tu plan" es ahora un chip discreto (`.coach-chip`) en vez de un alert de ancho completo. `planEnded`/`planNotStarted`/`trainingSafetyHold` quedan fuera de esa cola por ser estados críticos/bloqueantes, no promocionales.

### Origen

Auditoría UI del 1 jul 2026 (`estrategia/08-Analisis-UI-Exhaustivo-2026-07-01.md`, hallazgo P0-3).

### Problema

En `renderHoy()` el orden actual es: header → alert "Afina tu plan" → banner check-in → `heroDash` (~230 px) → agenda → coach. Para un usuario nuevo, "lo que te toca ahora" (el núcleo de la propuesta de valor) queda al borde o debajo del fold en móvil, detrás de dos avisos y un dashboard en cero.

### Objetivo

Que la próxima acción del día sea lo primero que ve el usuario al abrir la app, en cualquier estado de su cuenta.

### Alcance

1. Reordenar `renderHoy()`: header → agenda (próxima acción) → hero → banners → coach.
2. Hero en modo compacto (una línea: "0/1900 kcal · 0/4 comidas") mientras el día no tenga registros; versión completa cuando hay actividad.
3. Cola de prioridad de banners: mostrar máximo uno a la vez (check-in > afinar plan); "Afina tu plan" como chip discreto, no como primer elemento.

### Fuera de alcance

- No tocar la lógica de `homeAgendaData` ni el contenido de la agenda.
- No rediseñar el chat del coach en Home.

### Riesgos

- El tour contextual ancla su primer coachmark a la agenda; verificar que los selectores (`data-tab`, contenedores) sigan válidos tras el reorden.
- `heroDash` se reusa en Nutrición: el modo compacto debe ser opt-in para no alterar esa vista (o coordinarse con REQ-100).

### Criterios de aceptación

- Con viewport móvil (390×844), la tarjeta de agenda es visible completa en el primer viewport para un usuario nuevo.
- Nunca se muestran dos banners apilados en Home.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Servir local, simular usuario nuevo (sin día preparado) y usuario con actividad; capturar Home en 390×844 y verificar orden y fold.
- Forzar check-in pendiente + perfil sin afinar a la vez y verificar que solo se muestra un banner.

## REQ-98 - Fix UX: banner de check-in con fechas rotas, duplicado y sin tono de arranque

**Estado: implementado.**
`weeklyCheckinRangeLabel(startDs,endDs)` (nuevo, en `index.html`) reemplaza `prettyDate(...).split(",")[0]` (que descartaba la fecha y dejaba solo el nombre del día) por un rango compacto real ("13–19 jun" o "29 jun – 5 jul" si cruza de mes); se usa en `weeklyCheckinBanner()`, la nueva `weeklyCheckinChip()` y en `weeklyCheckinHistory()`, que tenía el mismo bug. `weeklyCheckinDue()` ahora calcula `active` con `weekDays(dueWeek).some(dayActive)`; `weeklyCheckinBanner()` usa ese flag para cambiar el copy a un tono no punitivo cuando la semana no tuvo actividad registrada ("No registraste actividad esa semana. Aun así puedes ajustar tu plan para la que sigue."), sin omitir el check-in automáticamente (se deja el botón "Omitir esta semana" como acción explícita del usuario, evitando tocar el conteo de check-ins de ciclos). `renderProgress()` ya no llama `weeklyCheckinBanner()` completo — usa `weeklyCheckinChip()`, un botón discreto estilo `.coach-chip` que abre `openWeeklyCheckin()` directamente, eliminando el banner duplicado entre Hoy y Progreso.

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-4). Bug de copy verificado en producción.

### Problema

En `weeklyCheckinBanner()`, `prettyDate(due.start).split(",")[0]` produce "Martes – Lunes" (solo nombres de día, sin fechas). El banner aparece en Hoy y en Progreso a la vez, y se muestra aunque la semana a revisar no tenga ningún dato registrado ("Revisa cómo fue tu semana" sin nada que revisar).

### Objetivo

Que el check-in comunique fechas concretas, aparezca una sola vez y no exija revisar semanas vacías.

### Alcance

1. Copy con fechas reales: "Semana 1 · 23–29 jun".
2. Banner completo solo en Hoy; en Progreso, acceso discreto (link/chip).
3. Si la semana a revisar no tiene actividad registrada (`dayActive` en 0 días), cambiar el tono a arranque no punitivo u omitir automáticamente sin registro de "skip" culposo.

### Fuera de alcance

- No cambiar el flujo interno de `openWeeklyCheckin` ni sus ajustes propuestos.
- No cambiar la lógica de `weeklyCheckinDue` salvo el caso "semana sin actividad".

### Riesgos

- `skipWeeklyCheckin` persiste claves por semana; la omisión automática no debe romper el conteo de check-ins de ciclos.

### Criterios de aceptación

- El banner muestra fechas concretas, no solo nombres de día.
- No aparece duplicado en dos vistas a la vez.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Simular plan iniciado hace 8+ días sin actividad y verificar tono/omisión; con actividad, verificar fechas correctas en el banner.

## REQ-99 - UX: Perfil por secciones reales con guardado por sección y labels accesibles

**Estado: implementado (dividido en REQ-105, REQ-106, REQ-107, REQ-108).**
Marcado como el REQ más grande del backlog (~4.850 px, 91 elementos interactivos, guardado global + 2 guardados locales inconsistentes). Siguiendo el protocolo de la fase de product manager (dividir en vez de implementar a medias), se partió en cuatro requerimientos atómicos, cada uno completable en una ejecución: REQ-105 (acordeón real), REQ-106 (aria-label), REQ-107 (reagrupar Suscripción/Recordatorios/Avisos bajo Cuenta) y REQ-108 (guardado por sección, el de mayor riesgo, al final y dependiente de REQ-105). No se tocó código de `index.html` en este commit.

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-5); retoma los pendientes #6/#7 del plan del 24 jun.

### Problema

`renderProfile()` renderiza una sola página de ~4.850 px con 8 secciones, 91 elementos interactivos y 64 inputs sin label programático. Los chips de navegación solo hacen `scrollIntoView` y el guardado es un botón global al fondo más dos guardados locales inconsistentes — riesgo de perder cambios y parálisis de decisión.

### Objetivo

Que Perfil deje de abrumar: el usuario encuentra la sección que busca, guarda con confianza y ningún cambio se pierde en silencio.

### Alcance

1. Convertir los chips (Objetivo · Comidas · Entreno · Privacidad · Cuenta) en subvistas reales o acordeones colapsados por defecto (solo la sección activa abierta).
2. Guardado sticky por sección, visible solo cuando hay cambios pendientes; cuidado con `saveProfilePrefs` y esquemas versionados.
3. Agrupar Suscripción/Recordatorios/Avisos del dispositivo bajo Cuenta.
4. `aria-label` en todos los inputs al migrar.

### Fuera de alcance

- No cambiar el esquema de `profiles.prefs` ni `profileSchemaVersion`.
- No tocar los flujos de privacidad/consentimientos más allá de su ubicación visual.

### Riesgos

- El guardado por sección cambia el modelo actual "todo al final": riesgo de guardados parciales inconsistentes; definir qué campos viajan juntos.
- Los flujos de push/recordatorios tienen guardados propios; unificar sin romper sus validaciones.

### Criterios de aceptación

- Ninguna sección de Perfil supera ~1.500 px de alto renderizado.
- Cambiar un campo y salir de la sección sin guardar muestra aviso o autoguarda; no se pierden cambios en silencio.
- 0 inputs visibles sin label programático en Perfil.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Medir `#app.scrollHeight` por sección; editar un campo, navegar a otra sección y verificar el aviso/autoguardado; auditar labels con querySelector.

## REQ-100 - UX: Nutrición sin duplicación — un CTA contextual y hero compacto

**Estado: implementado.**
`renderNutrition()` en `index.html` ahora muestra un solo CTA prominente: la tarjeta "Prepara tus comidas de hoy" (llama `homePrepareDay(ds)`, ruta determinista sin paywall) cuando el día no está preparado; cuando ya está preparado, no hay CTA prominente. Las 3-4 acciones sueltas ("Preparar otra semana"/"Preparar semana", "Ver otra opción de comida", "Revisar mis macros", y "Volver a preparar este día" cuando ya hay plan) se movieron a un menú "Más opciones" (`openNutritionMoreMenu()`) abierto vía `modal()`, con iconos del set existente (`miniIcon()`, nuevo, reutiliza `TAB_ICONS`; se agregaron `more` y `refresh`) en vez de emojis. El hero de macros usa `heroDash(ds,{compact:"always"})` — se extendió `heroDash(ds,opts)` (REQ-97) para aceptar `opts.compact==="always"` y así no repetir nunca el bloque completo que Home puede mostrar. Fix de bug encontrado en el camino: el botón "Preparar este día" de Nutrición llamaba `aiGenerateDay()` directo, lo que mostraba el paywall a usuarios sin entitlement; ahora la regeneración pasa por `homePrepareDay()` como en Home, respetando la ruta determinista del 1 jul.

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-6).

### Problema

`renderNutrition()` repite el `heroDash` completo de Home y ofrece 4 acciones sin jerarquía ("Preparar otra semana", "Preparar este día", "Ver otra opción de comida", "Revisar mis macros") con solapamiento semántico y emojis en botones.

### Objetivo

Que en Nutrición siempre quede claro cuál es LA acción siguiente, sin repetir información que Home ya muestra.

### Alcance

1. Un CTA primario contextual: día sin preparar → "Preparar este día"; día preparado → sin CTA prominente.
2. Acciones restantes a menú "···" o dentro de cada comida.
3. Hero de macros en versión compacta (no repetir el bloque completo de Home).
4. Iconos del set existente en lugar de emojis en botones.

### Fuera de alcance

- No cambiar la lógica de generación (día/semana) ni los flujos de "Cambiar" comida.

### Riesgos

- Los CTAs actuales gatean por entitlement (coach); el CTA contextual debe respetar la ruta determinista sin paywall implementada el 1 jul.

### Criterios de aceptación

- Máximo un CTA primario visible en la parte superior de Nutrición.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Capturar Nutrición con día vacío y con día preparado; verificar jerarquía y ausencia del hero duplicado completo.

## REQ-101 - UX: Entreno sin CTAs duplicados — tarjeta instructiva solo como empty state

**Estado: implementado.**
`renderWorkout()`: `emptyWkHtml` ahora depende de `contentIssues.length`, no de ausencia de plan IA; se quitaron sus CTAs duplicados de "Iniciar sesión guiada"/"Preparar mi plan".

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-101`).

## REQ-102 - UX: Progreso con estado cero guiado y tabla de peso en tarjetas mobile

**Estado: implementado.**
`progressIsEmpty()` detecta usuario sin peso, sin entrenos y sin racha. En ese estado, `renderProgress()` muestra primero la tarjeta "Registra tu peso de la semana" (con copy sobre qué se desbloquea) y arranca "Tus números" y "Rachas e hitos" colapsadas (`section()` acepta ahora un default de colapso vía `isCollapsed(key,def)`). `progressStats()` usa labels autoexplicativos ("Peso actual (kg)", "Entrenos completados", "Racha (días)", "Adherencia a comidas"); la primera tarjeta muestra el peso actual en vez de un delta críptico. `weightChart()` ya no duplica el mensaje de peso vacío. La tabla de peso a tarjetas full-width en mobile con inputs de 44px ya estaba resuelta por REQ-56.

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-8); retoma el pendiente #8 del plan del 24 jun.

### Problema

Un usuario nuevo abre Progreso y ve 4 stat-cards en cero con labels crípticos ("completos", "kg"), rachas en cero y una tabla de peso con inputs pequeños. Los ceros en la fuente display parecen píldoras, no números. Hay un box redundante que repite lo que ya dice la tarjeta "Registra tu peso de la semana".

### Objetivo

Que Progreso sin datos invite a la primera acción en lugar de mostrar estadísticas vacías, y que registrar peso sea cómodo en móvil.

### Alcance

1. Con cero datos: colapsar stats/rachas y abrir con la tarjeta de registro de peso + qué se desbloquea al registrar.
2. Labels autoexplicativos: "Peso actual", "Entrenos completados", "Racha", "Adherencia a comidas".
3. `weightRows()`: tabla → tarjetas por semana full-width en mobile con inputs grandes o stepper (los aria-labels ya existen).
4. Eliminar el box redundante "Ingresa tu peso semanal para ver el gráfico".

### Fuera de alcance

- No cambiar el modelo de datos de `weight_log` ni la lógica de rangos (`buildWeightRanges`).

### Riesgos

- `scrollToWeightInput()` asume la tabla `.wt input`; actualizar el selector al migrar a tarjetas.

### Criterios de aceptación

- Usuario sin datos ve primero una acción clara, no estadísticas en cero.
- Inputs de peso con hit area ≥44 px en táctil.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Capturar Progreso sin datos y con 2 semanas de datos, en viewport móvil; probar registro de peso con teclado numérico.

## REQ-103 - UX: onboarding sin jerga — macros como resumen y lugar de entrenamiento único por defecto

**Estado: implementado.**
Paso 2: macros bajo `<details>` "Ajustar valores"; arriba, resumen "Tu referencia: N kcal · N g proteína" y botón "¿Cómo lo calculamos?" con modal (antes texto fijo "Fórmula: ..."). Paso 3: checkboxes de día + un único select "Lugar de entrenamiento" aplicado a todos; personalización por día colapsada. `readOnboardingStep()` sigue completando `d.trainingLocations` por día, sin pérdida de datos. Perfil (prefix "pf") no cambió.

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-9).

### Problema

El paso 2 del onboarding expone 4 inputs crudos de macros más el texto "Fórmula: Katch-McArdle" (jerga técnica, contra el tono coach del principio 9). El paso 3 pide checkbox por día y lugar por día (7 selects): configuración avanzada a destiempo.

### Objetivo

Bajar el tiempo-a-plan del onboarding sin perder ningún dato esencial: el principiante no debería decidir macros ni logística por día para empezar.

### Alcance

1. Paso 2: resultado como resumen amable ("Tu referencia: 2.262 kcal · 137 g proteína") con "Ajustar valores" colapsado; la fórmula a un tooltip "¿cómo lo calculamos?".
2. Paso 3: días + un solo lugar por defecto; "personalizar por día" colapsado.
3. No perder ningún dato del esquema de prefs; solo cambia la presentación.

### Fuera de alcance

- No cambiar `calculateMacroTargets` ni las fórmulas.
- No cambiar el número de pasos del onboarding.

### Riesgos

- `hasCompleteOnboarding()` y `migrateProfilePrefs()` esperan campos concretos; el colapsado no debe impedir setearlos con defaults válidos.

### Criterios de aceptación

- El onboarding no muestra nombres de fórmulas ni inputs de macros abiertos por defecto.
- `hasCompleteOnboarding()` sigue cumpliéndose con el flujo nuevo.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Completar onboarding sin abrir ningún colapsable y verificar perfil válido con plan preparable; abrir "Ajustar valores" y verificar edición de macros.

## REQ-104 - Copy y paywall coherentes: sin "cancela cuando quieras", paywall degradado sin checkout activo

**Estado: implementado.**
Señal de checkout activo agregada a `/api/config` (`checkout.enabled`); `showPaywall` la usa para ocultar los botones de compra y mostrar "Disponible pronto" + canje de código cuando `STRIPE_SECRET_KEY` no está configurada.

### Origen

Auditoría UI del 1 jul 2026 (hallazgos P2-10 y cadena P0-1 con REQ-26).

### Problema

(a) "Cancela cuando quieras" aparece 3 veces pero los planes son pago único sin renovación — no hay nada que cancelar. (b) Mientras el checkout de Stripe no esté activo (REQ-26), el paywall muestra botones de compra que terminan en error 503. (c) Empty state de Home con copy pasivo y largo.

### Objetivo

Que ninguna promesa visible contradiga el modelo de cobro real y que ningún botón lleve a un error por configuración faltante.

### Alcance

1. Reemplazar "Cancela cuando quieras" por "Sin renovación automática — pagas solo el período".
2. `showPaywall`: si el checkout no está configurado, no mostrar botones de compra; mostrar mensaje "disponible pronto" + mantener la alternativa determinista.
3. Empty state de Home: "Tu coach arma comidas y entreno para hoy en segundos."

### Fuera de alcance

- No activar el checkout de Stripe (eso es REQ-26).
- No cambiar precios ni estructura de planes.

### Riesgos

- Detectar "checkout no configurado" desde el cliente requiere una señal del servidor (p. ej. respuesta de `/api/checkout` o flag en config); no exponer detalles técnicos al usuario (principio 9).

### Criterios de aceptación

- Ningún botón visible lleva a un endpoint que responde 503 por configuración faltante.
- El copy de planes no promete cancelación de una renovación que no existe.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Sin `STRIPE_SECRET_KEY` en entorno local, abrir el paywall y verificar el estado degradado; grep de "Cancela cuando quieras" devuelve 0.

## REQ-105 - UX: Perfil en acordeón real (una sección a la vez)

**Estado: implementado.**
Perfil ya no usa `.pf-nav` ni `pfScrollTo`; `renderProfile()` renderiza secciones nativas `<details class="pf-accordion">` para Objetivo, Comidas, Entrenamiento, Mi suscripción, Privacidad, Recordatorios, Avisos del dispositivo, Administración y Cuenta. `profileAccordionToggle()` mantiene como máximo una sección abierta. Los campos permanecen montados en el DOM al cerrar secciones, `#pfEditableBody` sigue delegando cambios solo de Objetivo/Comidas/Entreno y el botón flotante `#profileSaveFloat` conserva el flujo de guardado global existente. Prueba E2E: `tests/e2e/perfil.spec.js`.

### Origen

División de REQ-99 (2 jul 2026) por tamaño; auditoría UI del 1 jul 2026 (hallazgo P1-5).

### Problema

En `renderProfile()`, `.pf-nav` son chips que solo hacen `scrollIntoView`; las ocho secciones (Objetivo, Comidas, Entreno, Suscripción, Privacidad, Recordatorios, Avisos del dispositivo, Cuenta) están expandidas simultáneamente en una sola página de ~4.850 px.

### Objetivo

Que el usuario vea y navegue una sección a la vez, sin perder el modelo de guardado actual.

### Alcance

1. Reemplazar `.pf-nav` + `pfScrollTo` por un acordeón real (`<details>` o equivalente JS): cada sección colapsada por defecto; abrir una puede cerrar las demás.
2. Conservar sin cambios `saveProfile()`, `profileMarkDirty`/`profileClearDirty`, `#profileSaveFloat`, `saveOptionalConsents()`, `saveNotifPrefs()`, `renderPushSection()` — este REQ es solo estructura/visual.
3. Conservar los ids existentes (`pfSecObjetivo`, `pfSecComidas`, `pfSecEntreno`, `pfSecPrivacidad`, `pfSecCuenta`) para no romper referencias externas.
4. Colapsar/ocultar con CSS (no desmontar del DOM) para no perder valores de inputs no guardados al cambiar de sección.

### Fuera de alcance

- Guardado por sección (REQ-108).
- Reagrupar Suscripción/Recordatorios/Avisos del dispositivo bajo Cuenta (REQ-107).
- `aria-label` (REQ-106).

### Riesgos

- Si el toggle desmonta/remonta el HTML de una sección (en vez de solo ocultar), se pierden valores no guardados al cambiar de sección; usar ocultamiento CSS, no re-render parcial.

### Criterios de aceptación

- Cada sección abierta individualmente mide ~1.500 px o menos de alto renderizado.
- Editar un campo en una sección, abrir otra y volver conserva el valor editado (no se pierde por el toggle).
- El botón flotante "Guardar cambios" sigue apareciendo y funcionando igual que hoy.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Medir `scrollHeight` de cada sección abierta individualmente; editar un campo, alternar entre dos secciones y confirmar que el valor persiste en el DOM antes de guardar.

## REQ-106 - Accesibilidad: aria-label en todos los inputs de Perfil

**Estado: pendiente.**

### Origen

División de REQ-99 (2 jul 2026) por tamaño; auditoría UI del 1 jul 2026 (hallazgo P1-5).

### Problema

Varios inputs/selects de `renderProfile()` y sus helpers (`mealTimesHtml`, `trainingAvailabilityHtml`, `checkChips`) dependen de un `<label>` visual sin asociación programática (`for`/`id`) o de un label genérico compartido (p. ej. horarios por día de la semana bajo un único label "Horarios aproximados") — un lector de pantalla no anuncia el propósito real del campo.

### Objetivo

Que cualquier input interactivo de Perfil tenga un nombre accesible correcto.

### Alcance

1. Auditar cada `<input>`/`<select>`/`<textarea>` dentro de `renderProfile()` y los helpers que usa (`mealTimesHtml`, `trainingAvailabilityHtml`, `checkChips`).
2. Agregar `aria-label` donde el nombre accesible actual sea ambiguo o inexistente (los `label.chip-check` que envuelven el input ya son accesibles por asociación implícita — no agregar `aria-label` redundante ahí; enfocar en inputs de hora/número por día y campos con label compartido).
3. No cambiar estructura visual, ids usados por JS, ni lógica de guardado.

### Fuera de alcance

- Orden de tabulación, foco programático, overhaul de accesibilidad fuera de Perfil.

### Riesgos

- Bajo: cambio aditivo de atributos; riesgo principal es duplicar anuncios si se agrega `aria-label` a un input que ya tiene nombre accesible claro por `<label for>`.

### Criterios de aceptación

- 0 inputs/selects/textareas visibles en Perfil sin nombre accesible (por `for`/`id`, `aria-label`, o `<label>` envolvente), verificado con un script de auditoría del DOM renderizado.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Script en `scripts/` (jsdom o parseo del HTML renderizado) que liste inputs de Perfil sin nombre accesible; debe reportar 0.

## REQ-107 - UX: reagrupar Suscripción, Recordatorios y Avisos del dispositivo bajo Cuenta

**Estado: pendiente.**

### Origen

División de REQ-99 (2 jul 2026) por tamaño; auditoría UI del 1 jul 2026 (hallazgo P1-5).

### Problema

"Mi suscripción", "Recordatorios" y "Avisos del dispositivo" son secciones sueltas entre Entreno y Cuenta, sin agrupación visual con la sección "Cuenta" a la que pertenecen conceptualmente.

### Objetivo

Que toda la información de cuenta (identidad, suscripción, notificaciones) viva en un solo lugar coherente.

### Alcance

1. Mover los bloques "Mi suscripción" (`subscriptionStatusHtml()`), "Recordatorios" y "Avisos del dispositivo" (`renderPushSection`) para que queden agrupados junto a `pfSecCuenta`, después de Privacidad.
2. Implementar sobre la estructura vigente al momento de ejecutarse (acordeón de REQ-105 si ya está implementado; bloques secuenciales si no).
3. No cambiar ids usados por `loadNotifPrefs`/`populateNotifPrefsForm`/`renderPushSection` (`#notif_*`, `#pushSection`) ni su lógica.

### Fuera de alcance

- Cambiar lógica o copy de guardado de recordatorios/push.

### Riesgos

- `renderPushSection()` y `loadNotifPrefs().then(...)` corren después de escribir `innerHTML`; confirmar que las referencias por `id` (`$("#pushSection")`, `$("#notif_*")`) se siguen resolviendo igual tras mover los bloques de contenedor padre (los ids son globales al documento, no deberían romperse).

### Criterios de aceptación

- Privacidad, Suscripción, Recordatorios y Avisos del dispositivo aparecen agrupados junto a "Cuenta", en ese orden.
- Activar/guardar recordatorios y el estado de notificaciones push siguen funcionando igual que antes del cambio.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Inspeccionar el DOM renderizado y confirmar el nuevo orden de secciones; probar activar recordatorios y confirmar que `renderPushSection()` sigue pintando el estado de push correctamente.

## REQ-108 - UX: guardado por sección en Perfil con aviso de cambios sin guardar

**Estado: pendiente.**

### Origen

División de REQ-99 (2 jul 2026) por tamaño; auditoría UI del 1 jul 2026 (hallazgo P1-5). Depende de REQ-105 (estructura de acordeón).

### Problema

Todo Perfil comparte un único guardado global (`saveProfile()` + botón flotante), salvo Recordatorios y el permiso de fotos que tienen guardados propios independientes — modelo inconsistente con riesgo de pérdida silenciosa de cambios al navegar entre secciones.

### Objetivo

Que cada sección tenga una vía de guardado clara, visible solo cuando hay cambios pendientes, sin perder cambios de otras secciones.

### Alcance

1. Sobre la estructura de acordeón de REQ-105, mostrar el indicador de "cambios sin guardar" de forma consistente en las tres vías de guardado existentes (Objetivo+Comidas+Entreno vía `saveProfile()`; Privacidad/fotos vía `saveOptionalConsents()`; Recordatorios vía `saveNotifPrefs()`).
2. Mantener a Objetivo+Comidas+Entreno bajo un único guardado (`saveProfile()`) porque `validateTrainingProfile`/`validateFoodSchedule`/`validateFoodPreferences` validan esos campos en conjunto — no partir esa validación cruzada en guardados independientes.
3. Al cambiar de sección con cambios pendientes sin guardar, mostrar aviso (confirm o banner inline); no perder el valor en el DOM (la sección solo se oculta, no se destruye — ya garantizado por REQ-105).

### Fuera de alcance

- Cambiar `profileSchemaVersion` ni el esquema de `profiles.prefs`.
- Separar la validación cruzada de Objetivo/Comidas/Entreno en guardados independientes.

### Riesgos

- Guardar solo una parte de Objetivo/Comidas/Entreno dejaría `profiles.prefs` en un estado que no pasa `validateTrainingProfile`/`validateFoodSchedule`/`validateFoodPreferences`; ese trío debe seguir viajando en un solo `saveProfilePrefs`.

### Criterios de aceptación

- Cambiar un campo y navegar a otra sección sin guardar muestra aviso, o el cambio permanece recuperable al volver (no se pierde en silencio).
- Ningún guardado deja `profiles.prefs` en un estado que falle las validaciones existentes.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Editar un campo de Entreno, navegar a Comidas sin guardar, confirmar aviso; guardar y confirmar que el cambio persiste; repetir sin guardar y confirmar que se avisó antes de perder el cambio.

## REQ-109 - Fix Home: el badge "N pendientes" cuenta la fila de Descanso

**Estado: pendiente.**

### Origen

Auditoría del journey **home** (2 jul 2026), verificado en navegador (E2E): día de descanso con comidas pendientes.

### Problema

El badge muestra "2 pendientes" en un día de descanso, pero solo hay una acción real: la 2.ª fila ("Descanso planificado") es informativa, sin botón. Contar el descanso infla el número y contradice el texto "pendiente(s)".

### Causa raíz

`homeAgendaHtml` deriva el conteo de `data.items.length` (`index.html:3481`) sin excluir la fila de descanso que `homeAgendaData` inserta con `actions:""` (`index.html:3409`).

### Objetivo

Que el badge cuente solo acciones pendientes; una fila informativa no suma.

### Alcance

1. En `homeAgendaHtml`, contar `items.filter(i=>i.actions)`, no `items.length`; mantener visible la fila de descanso.

### Fuera de alcance

- No cambiar orden ni contenido de la agenda (REQ-97).

### Riesgos

- No romper el conteo cuando todas las filas son accionables.

### Criterios de aceptación

- Descanso con comidas pendientes: badge "1 pendiente"; entreno con comida+entreno pendientes: "2 pendientes".
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E: `completePrefs({trainingDays:[díasSinHoy]})`, preparar día, afirmar `.agenda-count`="1 pendiente".

## REQ-110 - Fix UX: catch de aiGenerateWeek sin salida — sumar opción práctica y reintento

**Estado: pendiente.**

### Origen

Sesión del 1 jul 2026: el fix de P0-2 (auditoría `estrategia/08-Analisis-UI-Exhaustivo-2026-07-01.md`) se aplicó a `aiGenerateDay` pero no al flujo semanal.

### Problema

`aiGenerateWeek` ya entra por ruta determinista sin coach o sin entitlement, pero si el coach falla a mitad de la generación, el catch externo muestra solo `⚠️ <mensaje>` en el modal, sin reintento ni alternativa. Mismo callejón sin salida que tenía el día.

### Objetivo

Ningún fallo del coach durante "Preparar mi semana" deja al usuario sin salida accionable.

### Alcance

1. Catch externo de `aiGenerateWeek`: botones "Usar una semana práctica ahora" (aplica `generateDeterministicWeek` + `genWeekReviewHtml`) y "Reintentar".
2. Conservar los días ya generados (`daysData` parcial) y completar solo los faltantes por ruta determinista.
3. Reusar el patrón de `deterministicFromModal` (mismo copy y clases).

### Fuera de alcance

- Lógica de cuota y `beginCoachAction`/`endCoachAction`.
- El flujo determinista semanal existente.

### Riesgos

- `window._genWeek` debe quedar consistente al mezclar días del coach con deterministas.

### Criterios de aceptación

- Con fallo del coach en el día N, el modal ofrece continuar determinista o reintentar; ninguna ruta termina en modal muerto.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Forzar error en `generateOneDay` en local y recorrer ambos botones; la semana aplicada respeta slots y restricciones.

## REQ-111 - Fix API: /api/checkout valida configuración de Stripe antes que la sesión (503 en vez de 401/403)

**Estado: implementado.**
Ya resuelto por REQ-59 (`fix(checkout): REQ-59 validar sesión antes de Stripe`, commit `a7409ea`): `api/checkout.js` valida método → `verifyUser` (401) → `stripeKey` (503) → resto del flujo, verificado leyendo el archivo línea por línea el 2 jul 2026. Esta entrada reapareció por re-derivar el backlog desde una auditoría vieja (23 jun) sin verificar contra el código actual; se deja como registro para no reabrirla.

## REQ-112 - Accesibilidad: toasts anunciados a lectores de pantalla y contraste de texto muted

**Estado: pendiente.**

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P2-11); complementa los aria-labels de Perfil (REQ-106). Alcance recortado el 2 jul 2026: el ítem de trap de foco en modales ya estaba resuelto por REQ-37 (`_modalKeyHandler` en `index.html`: Escape cierra, Tab queda atrapado en `.sheet`, el foco vuelve al disparador al cerrar) — verificado contra el código, no repetir.

### Problema

(a) Los toasts (`#toast`) no se anuncian a lectores de pantalla: no tienen `role`/`aria-live`. (b) `--muted` (`#8880aa`) da ~4.0:1 sobre `--surf4` y ~4.5:1 sobre `--surf3` (roza o incumple AA para texto de cuerpo); `--muted2` (`#52516e`) da 1.9–2.6:1 sobre todas las superficies del tema — muy por debajo de AA donde se usa como texto legible, no solo decorativo.

### Objetivo

Avisos y textos secundarios usables con lector de pantalla y legibles con baja visión, sin rediseñar la estética.

### Alcance

1. `#toast` con `role="status"` y `aria-live="polite"`.
2. Auditar cada uso de `--muted`/`--muted2` como color de texto: subir el token o mover a `--txt`/un tono intermedio donde el contenido sea texto de cuerpo real (no decorativo tipo punto de estado o cifra secundaria de una sola línea corta).

### Fuera de alcance

- Foco atrapado en modales (ya resuelto por REQ-37). Aria-labels de inputs de Perfil (REQ-106). Paleta de marca y tipografías.

### Riesgos

- Subir el contraste de `--muted`/`--muted2` afecta toda la app: revisar jerarquía visual en las vistas principales para no aplanar la UI.

### Criterios de aceptación

- Un toast se anuncia con VoiceOver/NVDA sin robar el foco.
- Texto de cuerpo que hoy usa `--muted`/`--muted2` cumple ≥4.5:1 contra su superficie real.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Recorrido con VoiceOver en Safari iOS; medir contraste de los tokens finales sobre `--surf1`..`--surf4`.

## REQ-113 - UX Auth: mostrar/ocultar contraseña en todos los campos de password

**Estado: pendiente.**

### Origen

Feedback de producto de Jonathan (3 jul 2026): en el textbox de password debe haber un icono que permita ver lo escrito.

### Problema

Los campos `type="password"` de login, registro, recuperación/invitación y modales administrativos no ofrecen control de visibilidad. En móvil esto aumenta errores de tipeo y fricción de activación, especialmente en el primer registro.

### Causa raíz

`index.html` renderiza inputs de contraseña directamente (`au_pwd`, `recovery_pwd`, `recovery_confirm`, `adminTestPwd`, `adminTestPwdConfirm`, `adminPwd`, `adminPwdConfirm`, y campos técnicos locales) sin componente/helper compartido ni botón de toggle.

### Objetivo

Que cualquier usuario pueda alternar entre contraseña oculta y visible de forma accesible, sin afectar autocomplete ni validaciones.

### Alcance

1. Crear un helper visual reutilizable para campos password con botón iconográfico de ojo/ojo tachado.
2. Aplicarlo a login/registro, recuperación/invitación, preparación de usuario QA y cambio de contraseña admin.
3. Mantener `autocomplete`, `minlength`, ids y validaciones existentes.
4. El botón debe tener `aria-label` dinámico ("Mostrar contraseña" / "Ocultar contraseña") y no enviar formularios ni mover foco innecesariamente.

### Fuera de alcance

- Cambiar políticas de contraseña, login social, passkeys o recuperación por correo.
- Mostrar secretos técnicos permanentes; para llaves/API locales aplicar el mismo patrón solo si no debilita el masking actual.

### Riesgos

- Un toggle mal implementado puede romper `autocomplete` o leer valores incorrectos en `doAuth`, `finishPasswordRecovery` y flujos admin.

### Criterios de aceptación

- Cada input de contraseña visible para usuario/admin tiene un botón de mostrar/ocultar.
- Alternar visibilidad conserva el valor escrito y no dispara acciones de submit.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E o prueba manual mobile: registro, login, recuperación y cambio admin de contraseña alternando dos veces antes de enviar.

## REQ-114 - UX Onboarding: copy sin jerga en objetivo, grasa, ciclo y patrón de comida

**Estado: pendiente.**

### Origen

Feedback de producto de Jonathan (3 jul 2026): "Mantener y recomponer", "Omnívoro", "% grasa" y "Duration" no son autoexplicativos para una persona normal.

### Problema

El onboarding todavía usa lenguaje técnico o poco cotidiano:

- "Mantener peso y recomponer" no comunica claramente el objetivo.
- "Omnívoro" no es como se identifica una persona que come de todo.
- "% grasa" puede sentirse obligatorio o intimidante aunque sea opcional.
- "Duración del plan" no explica que el usuario elige un ciclo de seguimiento, con 10 semanas como opción recomendada.

### Causa raíz

REQ-103 redujo jerga de macros y lugar, pero no cambió todos los labels de dominio ni sus ayudas contextuales. Las etiquetas visibles salen de `index.html` y de constantes compartidas en `js/nutrition-pure.js`.

### Objetivo

Que el onboarding sea entendible para principiantes sin cambiar los valores internos ni romper planes existentes.

### Alcance

1. Cambiar el copy visible de `mantenimiento` a una frase corta que conserve significado: mantener peso mientras mejora composición. Si no hay copy más corto y claro, usar "Mantener mi peso y mejorar mi cuerpo".
2. Cambiar el label visible de `omnivoro` a "Como de todo"; conservar el valor interno `omnivoro`.
3. Aclarar que el porcentaje de grasa corporal es opcional y se puede completar después, con tooltip o nota compacta según encaje en mobile.
4. Cambiar "Duración del plan" por una decisión de ciclo: 4 semanas como ciclo corto para empezar, 10 semanas como proceso completo/recomendado por defecto.
5. Replicar el copy consistente en Perfil donde aparezcan los mismos controles.

### Fuera de alcance

- Cambiar fórmulas de macros, `profileSchemaVersion`, valores guardados o historial.
- Rediseñar el entrenamiento completo; eso queda en REQ-115 y REQ-116.

### Riesgos

- Cambiar labels sin conservar valores internos puede romper validaciones, tests y compatibilidad con perfiles existentes.

### Criterios de aceptación

- El onboarding no muestra "Omnívoro" ni "Mantener peso y recomponer" como labels principales.
- El campo de grasa corporal queda claramente opcional.
- 10 semanas sigue siendo el default.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Completar onboarding sin ingresar grasa corporal y confirmar que el perfil queda válido y el plan se puede preparar.

## REQ-115 - UX Onboarding: entrenamiento en dos decisiones claras sin duplicar lugar y fuerza

**Estado: pendiente.**

### Origen

Feedback de producto de Jonathan (3 jul 2026): "Deporte cardio" no se entiende; el lugar de entrenamiento se cruza con gimnasio/peso corporal; la persona debería elegir dónde entrenar fuerza y con qué equipamiento si entrena en casa o al aire libre.

### Problema

El onboarding mezcla tres conceptos en controles separados: deporte cardio, trabajo de fuerza y lugar por día. Eso obliga al usuario a reconciliar "Gimnasio/Peso corporal" con "Lugar de entrenamiento", generando duplicidad y decisiones raras en mobile.

### Causa raíz

El modelo actual mantiene `primarySport`, `strengthMode`, `trainingLocations` y `equipment`, pero la UI los presenta como selectores paralelos en vez de una secuencia de intención:

1. actividad física/deporte que quiere practicar;
2. si quiere fuerza;
3. dónde y con qué recursos quiere hacer esa fuerza.

### Objetivo

Que el flujo de entrenamiento sea autoexplicativo y capture la intención real sin duplicar decisiones.

### Alcance

1. Reemplazar "¿Tienes un deporte cardio...?" y "Deporte cardio" por "¿Practicas alguna actividad física?" sin usar la palabra cardiovascular.
2. Ofrecer opciones explícitas: caminar, correr, bicicleta, natación, otro, ninguna.
3. Reemplazar "Trabajo de fuerza" por una pregunta única: dónde quiere entrenar fuerza: gimnasio, casa con peso corporal/equipo, aire libre con peso corporal/equipo, o "No quiero fuerza por ahora".
4. Si elige casa o aire libre, preguntar si tiene o quiere considerar equipamiento; permitir seleccionar ninguno, bandas/elásticos, mancuernas, barra/discos y barra de dominadas.
5. Mantener compatibilidad interna con `primarySport`, `strengthMode`, `trainingLocations` y `equipment` mediante mapeo/migración.
6. Actualizar Perfil con el mismo modelo para editarlo después.

### Fuera de alcance

- Cambiar el contenido de rutinas suaves por edad/restricción (REQ-116).
- Crear ejercicios nuevos si el catálogo actual cubre las combinaciones básicas.
- Permitir menores de edad.

### Riesgos

- `validateTrainingProfile`, `defaultTrainingLocations`, `trainingExpectedWeeks` y el generador de entrenamiento dependen de valores existentes. El cambio debe ser de presentación/mapeo antes de tocar contratos.

### Criterios de aceptación

- El usuario puede elegir caminar como actividad principal.
- El usuario puede elegir no hacer fuerza por ahora sin caer en validaciones contradictorias.
- Casa/aire libre muestran recursos disponibles sin repetir "Lugar de entrenamiento" como decisión duplicada.
- Perfiles antiguos siguen migrando a una selección válida.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E onboarding con: caminata + no fuerza; ninguna actividad + fuerza en casa sin equipo; running + fuerza en gimnasio.

## REQ-116 - Entrenamiento seguro: modo suave recomendado por edad o restricciones

**Estado: pendiente.**

### Origen

Feedback de producto de Jonathan (3 jul 2026) + revisión de guías oficiales WHO/CDC/HHS: caminar cuenta como actividad aeróbica válida; en adultos mayores conviene ajustar intensidad, sumar balance/fuerza cuando sea apropiado y adaptar a condiciones reales.

### Problema

El flujo actual puede sugerir rutinas estándar a usuarios de 18-21, mayores de 50, mayores de 55 o personas con restricciones, sin una recomendación visible de bajar intensidad, priorizar caminatas/cardio ligero o evitar movimientos complejos.

### Causa raíz

La app tiene safety screening y nivel de experiencia, pero no traduce edad/restricciones a una recomendación de plan más suave que el usuario pueda aceptar o rechazar. Además, "solo caminatas/cardio ligero" no está modelado como opción válida y explícita para mayores.

### Objetivo

Ofrecer planes más seguros y sostenibles sin imponerlos: sugerencia suave desde 50, recomendación más fuerte desde 55, y libertad para elegir plan completo si el usuario lo decide y no hay red flags médicos.

### Alcance

1. Si edad 18-21: sugerir empezar conservador, con técnica y progresión gradual, sin bloquear plan completo.
2. Si edad >=50: sugerir modo suave/bajo impacto o fuerza ligera.
3. Si edad >=55: sugerir caminar/cardio ligero como plan válido, con opción de fuerza mínima o plan completo.
4. Si hay restricciones/limitaciones declaradas: recomendar modo suave y excluir movimientos complejos o invertidos cuando aplique.
5. El modo suave debe reducir intensidad/volumen, favorecer caminatas, movilidad, ejercicios estables y alternativas de bajo impacto.
6. La UI debe explicar la sugerencia con tono de cuidado, no de incapacidad.
7. Si el safety screening tiene red flags, mantener la pausa de seguridad vigente y no permitir saltarla.

### Fuera de alcance

- Diagnóstico médico, rehabilitación clínica o planes para menores de 18.
- Reescribir todo el catálogo de ejercicios; usar sustituciones y filtros disponibles donde sea posible.

### Riesgos

- Mensajes sobre edad y salud deben evitar promesas médicas o tono discriminatorio.
- Permitir "solo cardio" requiere revisar validaciones que hoy esperan fuerza/equipment.

### Criterios de aceptación

- Usuario de 50-54 ve sugerencia de plan suave, pero puede elegir plan completo.
- Usuario de 55+ puede elegir caminatas/cardio ligero como plan válido.
- Usuario con red flag médico sigue bloqueado por safety hold.
- Rutinas suaves no incluyen ejercicios complejos como pike push-ups, dominadas o movimientos invertidos salvo que el usuario elija plan completo y tenga perfil compatible.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E con edades 20, 52 y 58; validar copy, opciones y plan resultante. Revisar manualmente un plan suave de 55+ en mobile.

## REQ-117 - Trial premium: primera semana con plan personalizado y cuotas limitadas

**Estado: pendiente.**

### Origen

Feedback de producto de Jonathan (3 jul 2026): antes del paywall debe generarse la primera semana gratis de dieta y entrenamiento con experiencia premium, limitando llamadas para controlar gasto y sin mencionar IA al usuario.

### Problema

La estrategia pide entregar valor antes del paywall, pero la experiencia premium real está ligada a entitlement. Un usuario nuevo debe probar el producto completo, pero sin abrir consumo ilimitado de coach.

### Causa raíz

El modelo actual distingue `hasEntitlement()` y cuotas de coach por acción, pero no existe un estado de trial premium de primera semana con límites propios, mensajes de conversión y expiración clara.

### Objetivo

Dar a cada usuario nuevo una primera semana personalizada gratis, con acceso premium limitado y mensajes comerciales claros cuando se agoten los cambios/rearmados.

### Alcance

1. Crear estado de trial por usuario: inicio, fin, uso y expiración; duración inicial 7 días desde completar onboarding o primer plan generado.
2. Durante trial, permitir generar la primera semana de nutrición y entrenamiento con el coach premium.
3. Limitar acciones costosas de trial: rearmar semana/día, "otra opción", cambios de plato y regeneraciones; los límites deben ser configurables en políticas server-side o constantes claras.
4. Al agotar límites de trial, mostrar copy visible: está en su semana gratis, ya usó sus cambios incluidos, puede activar un plan para seguir personalizando.
5. Respetar REQ-31: no usar "IA", modelos, tokens, cuotas internas ni proveedor en UI normal; usar "coach", "plan personalizado", "cambios incluidos".
6. Mantener fallback determinista gratuito si el servicio premium falla.

### Fuera de alcance

- Activar Stripe o cambiar precios.
- Implementar métodos de pago locales.
- Cambiar la frontera premium completa más allá del trial.

### Riesgos

- El gasto puede crecer si los límites no se aplican server-side.
- El trial no debe convertirse en entitlement indefinido ni poder reiniciarse con refresh/localStorage.

### Criterios de aceptación

- Usuario nuevo sin plan pago puede generar su primera semana personalizada dentro del trial.
- Agotar límites de trial bloquea nuevas llamadas costosas con mensaje comercial no técnico.
- Un usuario con plan pago no queda limitado por límites de trial.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Tests de `api/claude.js`/cuotas con usuario trial: primera acción permitida, límite agotado bloqueado, usuario pago permitido.

## REQ-118 - Activación: generar automáticamente la primera semana al terminar onboarding

**Estado: pendiente.**

### Origen

Feedback de producto de Jonathan (3 jul 2026): al terminar onboarding el usuario debe recibir automáticamente su primera semana completa, personalizada a sus gustos y objetivos.

### Problema

Hoy el onboarding termina y la preparación del día/semana depende de acciones posteriores. Para activación, el usuario debería salir del onboarding con "qué comer y entrenar esta semana" ya listo.

### Causa raíz

`saveOnboarding()` guarda preferencias y prepara estados iniciales, pero no orquesta una generación semanal premium automática de nutrición + entrenamiento ni una pantalla de progreso/revisión post-onboarding.

### Objetivo

Reducir time-to-first-value: registro -> onboarding -> primera semana personalizada lista, sin que el usuario tenga que buscar "Preparar semana".

### Alcance

1. Al guardar onboarding, iniciar generación de la primera semana de nutrición y entrenamiento usando el trial premium de REQ-117 cuando corresponda.
2. Mostrar estado de progreso comprensible: preparando comidas, preparando entrenamiento, validando plan.
3. Guardar nutrición en `plan_versions`/snapshot y entrenamiento como plan activo o borrador activado, sin reescribir historial.
4. Si falla una parte, usar fallback determinista y avisar con opción de reintento sin dejar pantalla muerta.
5. Al finalizar, llevar a Home con el anillo de macros, siguiente comida y sesión/descanso de hoy ya visibles.

### Fuera de alcance

- Rediseñar el paywall completo.
- Regenerar semanas futuras después de la primera; eso sigue siendo acción premium normal.

### Riesgos

- Generar nutrición + entrenamiento puede tardar; la UX debe manejar espera, errores parciales y navegación.
- No debe aplicar planes si falta consentimiento o safety screening vigente.

### Criterios de aceptación

- Un usuario nuevo completa onboarding y termina con primera semana aplicada o con fallback aplicado y reintento disponible.
- La generación usa preferencias guardadas antes de llamar al coach.
- Home no queda en estado "Aún falta preparar este día" después de onboarding exitoso.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E onboarding completo con mocks de coach exitoso y con fallo parcial; verificar Home y `plan_versions`.

## REQ-119 - Onboarding nutricional: capturar gustos y disgustos antes del primer plan

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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
