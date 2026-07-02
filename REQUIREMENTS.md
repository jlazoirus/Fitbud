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

5. REQ-97 - Reordenar Home: agenda primero, hero compacto, un banner a la vez. (P0)
6. REQ-98 - Fix banner de check-in: fechas rotas, duplicado, tono de arranque. (P1)
7. REQ-100 - Nutrición sin duplicación: un CTA contextual y hero compacto. (P1)
8. REQ-101 - Entreno sin CTAs duplicados. (P1)
9. REQ-102 - Progreso con estado cero guiado y peso en tarjetas. (P1)
10. REQ-103 - Onboarding sin jerga: macros como resumen. (P1)
11. REQ-99 - Perfil por secciones con guardado por sección. (P1, el más grande)
12. REQ-104 - Copy y paywall coherentes (depende de decisión REQ-26). (P2)

Nota: los hallazgos P0-1 y P0-2 de esa auditoría (ruta determinista sin paywall en "Preparar mi día" y fallback+reintento en errores del coach) ya quedaron implementados el 1 jul junto con mejoras de calidad del solver determinista (pre-rankeo calórico, variedad por `recentUsed` y desempate por fecha).

Pendiente no automatizable por agentes:

- REQ-49 - Revision legal pre-lanzamiento.
- REQ-60 - Configuracion manual de redirects en Supabase.
- REQ-70 - Validacion de negocio y beta con usuarios reales.

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

**Estado: implementado.** `weekPendingDays` filtra días anteriores a hoy y días con comidas consumidas (`doneMeals > 0`) antes de iterar. El progreso ("día X de Y") refleja solo los días pendientes. 4 asserts en `scripts/validate-week-skip-past.mjs`.

### Problema

Al usar "Preparar mi semana" (ej. semana 3, inicio 27 de junio), el sistema generaba los 7 días de la semana sin importar que los días 27 y 28 ya hubieran pasado y tuvieran comidas registradas manualmente por el usuario. El sistema intentaba sobrescribirlos con comidas generadas por IA.

### Causa raíz (verificada contra código)

`aiGenerateWeek` (línea ~7212) obtiene los días con `weekDays(w)` que devuelve **todos** los días de la semana (start..end). El bucle `for(let i=0;i<days.length;i++)` iteraba sobre todos sin ningún filtro de:
- Fecha anterior a hoy
- Días con comidas ya consumidas por el usuario (`dayTotals(ds).doneMeals > 0`)

El mismo problema existía en el flujo determinista (`generateDeterministicWeek`) que recibía `days` sin filtrar.

### Solución

Nueva función `weekPendingDays(allDays)` que filtra:
1. Días con fecha anterior a `todayStr()` → se saltan
2. Días con `dayTotals(ds).doneMeals > 0` (comidas ya consumidas) → se saltan

`aiGenerateWeek` ahora:
- Llama `weekPendingDays(allDays)` para obtener solo días pendientes
- Muestra cuántos días se saltaron en el modal de progreso ("5 días a tu medida (2 días ya registrados)")
- El contador de progreso dice "día X de Y" donde Y = días pendientes, no los 7 totales
- Si todos los días están registrados, muestra toast informativo y no genera nada
- Pasa `days` filtrados a `generateDeterministicWeek`

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | Función `weekPendingDays`, filtrado en `aiGenerateWeek`, progreso ajustado |
| `scripts/validate-week-skip-past.mjs` | Validador estructural (4 asserts) |
| `scripts/release-gate.mjs` | Agrega validador al gate |

### Invariantes que se mantienen

- "Preparar mi día" (flujo individual) no se ve afectado — el usuario puede regenerar el día de hoy explícitamente
- La estructura del draft (`window._genWeek`) no cambia, solo contiene menos días
- `applyWeekPlan` aplica solo los días que están en `daysData` (ya filtrados)

### Criterios de aceptación

- Si la semana tiene días pasados con comidas consumidas, "Preparar mi semana" solo genera los días pendientes (hoy en adelante, sin consumo).
- El progreso muestra "día X de Y" donde Y = días pendientes.
- Si todos los días de la semana ya pasaron/están registrados, muestra toast y no genera nada.
- `node scripts/validate-week-skip-past.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

## REQ-88 - Fix: contextKey de generación diaria no incluía la fecha, causando reuso cruzado entre días

**Estado: implementado.** `generateOneDay` ahora pasa `ds` como `scope` a `coachQuota`, y `COACH_PROMPT_VERSION` sube a 3 para invalidar entradas de pool anteriores. 5 asserts en `scripts/validate-day-scope-in-context.mjs`.

### Problema

Al generar una semana completa ("Preparar mi semana"), todos los días recibían el mismo resultado de la IA en vez de planes individualizados. Ejemplo concreto: miércoles y viernes ambos mostraban exactamente 1798 kcal con las mismas comidas — evidencia de que un resultado cached se reutilizaba para todos los días.

### Causa raíz (verificada contra código)

`generateOneDay` llamaba a `coachQuota` con solo 5 argumentos, sin pasar el 6to parámetro `scope`:

```js
const quota=coachQuota(
    coachRequest.action,
    coachRequest.requestId,
    coachRequest.partKey,
    fallback,
    dietQuotaValidation(ds)
    // ← falta ds como scope
);
```

En `coachQuota(action,requestId,partKey,fallbackText,validation,scope)`, cuando `scope` es `undefined`, se convierte en `scope||null` → `null`. El `contextKey` resultante (hash del JSON serializado del contexto) era **idéntico para todos los días** de la semana, porque la fecha no formaba parte del hash.

El sistema de reuso (`select_reusable_coach_part` en Supabase) buscaba por `context_key` y encontraba el resultado del primer día generado, sirviéndolo para todos los demás.

Comparación con `regenerateGenMeal` (que SÍ funcionaba bien):
```js
const quota=coachQuota("diet_day",requestId,"slot-"+slotId,fallback,validation,slotId+":"+draft.ds);
//                                                                               ↑ scope incluye fecha
```

### Solución

1. **`generateOneDay`**: Se agrega `ds` (la fecha del día, ej. `"2026-06-30"`) como 7mo argumento a `coachQuota`:
```js
const quota=coachQuota(
    coachRequest.action,
    coachRequest.requestId,
    coachRequest.partKey,
    fallback,
    dietQuotaValidation(ds),
    ds  // ← fecha como scope → contextKey único por día
);
```

2. **`COACH_PROMPT_VERSION`**: Bump de 2 → 3. Esto invalida todas las entradas existentes en `coach_option_pool` que se generaron sin scope en el contextKey. Sin este bump, las entradas viejas (con scope=null) seguirían matcheando si alguien no hubiera regenerado aún.

### Por qué este fix es definitivo

El contextKey ahora incluye:
- `version: COACH_PROMPT_VERSION` (3) — invalida resultados de prompts anteriores
- `scope: ds` (ej. "2026-06-30") — hace cada día único
- `nutrition.target` — metas del usuario
- `catalog` hash — catálogo de platos disponible
- `diet`, `mealCount`, etc. — preferencias

Un resultado solo se puede reutilizar si: (a) es del mismo usuario, (b) mismo día, (c) misma versión de prompt, (d) mismas metas, (e) mismo catálogo, (f) mismas preferencias. Cualquier cambio en cualquiera de estos factores genera un contextKey diferente y fuerza una nueva llamada a la IA.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `generateOneDay` pasa `ds` como scope; `COACH_PROMPT_VERSION` = 3 |
| `scripts/validate-day-scope-in-context.mjs` | Validador estructural (5 asserts) |
| `scripts/release-gate.mjs` | Agrega validador al gate |

### Criterios de aceptación

- Cada día de "Preparar mi semana" genera un resultado diferente (contextKey único por fecha).
- `COACH_PROMPT_VERSION >= 3`.
- Entradas antiguas del pool (version 2, scope null) no se reutilizan.
- `node scripts/validate-day-scope-in-context.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

## REQ-89 - Feature: sugerir snack del catálogo para cerrar déficit de kcal/proteína en día generado

**Estado: implementado.** `findGapSnack` busca el mejor snack/shake del catálogo para completar el día. `genReviewHtml` muestra el botón de sugerencia. `addGapSnackToDay` agrega y re-valida. `applyGeneratedDay` separa extras. 6 asserts en `scripts/validate-gap-snack.mjs`.

### Problema

Cuando un día generado por IA no alcanzaba la meta de kcal o proteína (validación ±15% kcal, ≥85% proteína), el usuario solo podía descartar las 3-4 comidas completas y volver a generar. Esto era frustrante porque las comidas individuales podían estar bien — solo faltaba un poco para llegar a la meta.

### Solución

#### 1. `findGapSnack(totals, target)` (nueva función)

Busca en el catálogo (`DB.dishes`) el mejor snack/shake para cerrar el hueco:

- **Filtra candidatos**: solo platos con slots `snack`, `batido`, `media_manana`, `merienda`
- **Respeta restricciones**: excluye platos bloqueados por `coachDishBlockedByProfile` (alergias, dieta vegana, etc.)
- **Escala ingredientes**: ajusta gramos proporcionalmente (factor 0.5x–2.5x) para acercarse al hueco
  - Si el déficit es dominantemente de proteína (`protGap*4 > kcalGap`), escala por proteína
  - Si no, escala por kcal
- **Scoring**: selecciona el candidato que minimice la desviación de macros al agregarlo
- **Rechaza gaps irrazonables**: si faltan >700 kcal, no sugiere (el problema es estructural, no resoluble con un snack)
- **Rechaza gaps triviales**: si faltan <80 kcal y <8g proteína, no sugiere

Prioriza naturalmente los shakes de proteína (REQ-76) cuando el déficit es de proteína, porque tienen la mejor ratio proteína/kcal del catálogo.

#### 2. `genReviewHtml` (modificada)

Cuando `res.ok === false`:
- Detecta si los issues son **solo** de déficit (kcal bajo o proteína baja, no errores estructurales como alergias o nombres ficticios)
- Si `findGapSnack` encuentra un candidato, muestra un box con:
  - Nombre del snack, macros, y el total proyectado
  - Ingredientes con gramos
  - Botón "Agregar [nombre del snack]"

#### 3. `addGapSnackToDay()` (nueva función)

- Agrega el snack sugerido a `window._genDay.comidas` con `slot_id: "snack_extra"`
- Re-valida con `validateGeneratedDay` (el snack suma a los totales del día)
- Re-renderiza el review — si ahora pasa la validación, "Aplicar al día" se habilita

#### 4. `applyGeneratedDay()` (modificada)

- Separa comidas que mapean a slots existentes del día de las extras (`snack_extra`)
- Las comidas con slot existente se aplican vía `applyDayComidas` (overrides en meal slots)
- Las extras se agregan a `dayState(ds).extras` con `done:true` — `dayTotals` ya las cuenta

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `findGapSnack`, `addGapSnackToDay`, mod `genReviewHtml`, mod `applyGeneratedDay` |
| `scripts/validate-gap-snack.mjs` | Validador estructural (6 asserts) |
| `scripts/release-gate.mjs` | Agrega validador al gate |

### Criterios de aceptación

- Si un día generado falla solo por déficit de kcal/proteína y el gap es razonable (80–700 kcal), se muestra sugerencia de snack.
- El snack sugerido respeta restricciones del perfil (alergias, dieta).
- Al agregar el snack, se re-valida y si pasa, "Aplicar al día" se habilita.
- Al aplicar, el snack se guarda en `extras` (no sobreescribe un slot de comida).
- Si hay errores no-déficit (nombres ficticios, alergias), no se muestra sugerencia.
- Si el gap es >700 kcal, no se muestra sugerencia.
- `node scripts/validate-gap-snack.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

## REQ-90 - Feature: editar gramos/porciones de ingredientes en comidas generadas antes de aplicar

**Estado: implementado.** Inputs numéricos inline en cada ingrediente de `genReviewHtml` y `genWeekReviewHtml`. `updateGenMealGrams` y `updateGenWeekMealGrams` recalculan macros vía `recalcCoachMealMacros` y re-validan. 7 asserts en `scripts/validate-portion-editing.mjs`.

### Problema

Cuando un día generado no llegaba a la meta de kcal/proteína, la única opción era descartar todo y regenerar, o agregar un snack automático (REQ-89). El usuario quiere poder ajustar los gramajes de los ingredientes existentes (ej. subir arroz de 80g a 120g, o pechuga de 100g a 150g) para cerrar el déficit él mismo, manteniendo las comidas que ya le gustan.

### Investigación previa

1. **No existía edición de gramos por ingrediente** — `editorSheet` (editor genérico) solo permite editar macros totales planos (kcal/P/C/G), no ingredientes individuales. El modal de revisión (`genReviewHtml`) mostraba los ingredientes como texto estático.

2. **Patrón UI**: la app usa `<input type="number">` con `inputmode="numeric"` en todos los formularios (peso, edad, RPE, macros). No hay componente stepper. Los inputs se estilizan con las CSS vars del tema (`var(--surf3)`, `var(--border-2)`, `var(--txt)`).

3. **Fórmula de macros**: `DB.ingredients` almacena macros por 100g (`kcal`, `protein_g`, `carbs_g`, `fat_g`). La fórmula es `macro = macro_per_100g × gramos / 100`. `recalcCoachMealMacros` (nutrition-domain.js) ya implementa esto: resuelve ingredientes por nombre, aplica la fórmula, y devuelve macros recalculados.

4. **Dos flujos de revisión separados**: `genReviewHtml` sirve el día individual; `genWeekReviewHtml` sirve la semana. Ambos necesitan los inputs.

5. **Guardado**: `applyDayComidas` graba `c.ingredientes` tal cual viene del draft. Al editar gramos en el draft antes de aplicar, los valores editados se persisten correctamente.

### Solución

#### Inputs inline en ingredientes

En `genReviewHtml` y `genWeekReviewHtml`, cada ingrediente pasa de texto estático (`"Avena 50g"`) a un input editable:

```html
Avena <input type="number" min="5" step="5" value="50"
  onchange="updateGenMealGrams(cIdx, gIdx, +this.value)">g
```

Estilo compacto (52px ancho, font 13px) con las CSS vars del tema para integrarse con el diseño oscuro.

#### `updateGenMealGrams(mealIdx, ingIdx, grams)` — día individual

1. Actualiza `window._genDay.comidas[mealIdx].ingredientes[ingIdx].gramos`
2. Recalcula macros de la comida con `recalcCoachMealMacros` (match por nombre → fórmula per-100g × gramos)
3. Actualiza `comida.kcal`, `.proteina_g`, `.carbohidratos_g`, `.grasa_g`
4. Re-valida con `validateGeneratedDay` (que re-suma totales y checa ±15% kcal, ≥85% prot)
5. Re-renderiza `genReviewHtml` → los macros por comida, totales del día, issues y botón "Aplicar" se actualizan

#### `updateGenWeekMealGrams(dayIdx, mealIdx, ingIdx, grams)` — semana

Igual que el anterior pero opera sobre `window._genWeek.daysData[dayIdx]`. Además recalcula la lista de compras con `buildShoppingListFromNutritionPlan`.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | Inputs inline en `genReviewHtml` y `genWeekReviewHtml`; funciones `updateGenMealGrams` y `updateGenWeekMealGrams` |
| `scripts/validate-portion-editing.mjs` | Validador estructural (7 asserts) |
| `scripts/release-gate.mjs` | Agrega validador al gate |

### Criterios de aceptación

- Cada ingrediente en el modal de revisión muestra un input numérico editable para gramos.
- Al cambiar gramos, los macros de la comida se recalculan desde `DB.ingredients` (per-100g × gramos).
- Los totales del día se actualizan y la validación se re-ejecuta (±15% kcal, ≥85% prot).
- Si los totales editados pasan la validación, "Aplicar al día" se habilita.
- Funciona tanto en "Preparar mi día" como en "Preparar mi semana".
- Al aplicar, los gramos editados se guardan (no los originales).
- La lista de compras de la semana se actualiza al editar gramos.
- `node scripts/validate-portion-editing.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

## REQ-91 - Fix: snack sugerido (REQ-89) aparecía como ya consumido al aplicar el día

**Estado: implementado.** `applyGeneratedDay` pone `done:false` en extras generados. 3 asserts en `scripts/validate-gap-snack-pending.mjs`.

### Problema

Al aplicar un día generado que incluía un snack sugerido por REQ-89 para cerrar déficit, el snack aparecía con el checkbox marcado (✓ en morado) en la sección "Comidas extra", como si el usuario ya lo hubiera consumido. Las comidas regulares del plan (Desayuno, Almuerzo, Cena) aparecían correctamente sin marcar.

### Causa raíz

En `applyGeneratedDay`, los extras se creaban con `done:true` hardcodeado:

```js
st.extras.push({..., done:true, gen:true});
```

El flag `done:true` hace que `dayTotals` cuente sus macros como "ya consumidos" y que el checkbox aparezca marcado. Las comidas de slot (`applyDayComidas`) no tocan `done` — usan solo `ms.ovr`, dejando el flag en su estado inicial (`false`).

### Solución

Cambiar `done:true` → `done:false` en la línea de `applyGeneratedDay` que crea extras. El snack aparece como pendiente y el usuario lo marca cuando lo consume.

El flujo manual "Agregar comida/snack" (`saveEditor`, línea 6434) y "Sugerir comida" (`addSuggestion`, línea 7048) mantienen `done:true` intencionalmente — en esos flujos el usuario está registrando algo que ya comió o va a comer de inmediato.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `applyGeneratedDay`: `done:true` → `done:false` en extras |
| `scripts/validate-gap-snack-pending.mjs` | Validador (3 asserts) |
| `scripts/release-gate.mjs` | Agrega validador al gate |

### Criterios de aceptación

- El snack sugerido aparece sin marcar (pendiente) al aplicar el día.
- El usuario lo marca manualmente cuando lo consume.
- Las comidas de slot siguen apareciendo sin marcar (no regresión).
- `dayTotals` no cuenta el snack como consumido hasta que el usuario lo marque.
- `node scripts/validate-gap-snack-pending.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-7).

### Problema

En `renderWorkout()`, "Iniciar sesión guiada" aparece dos veces (tarjeta instructiva + tarjeta del workout) y "Preparar mi plan" otras dos. Cuatro botones para dos acciones; la tarjeta instructiva ocupa el primer lugar de forma permanente.

### Objetivo

Una sola tarjeta de sesión con una acción primaria clara; la explicación solo cuando no hay nada que ejecutar.

### Alcance

1. La tarjeta "Guía tu sesión de hoy" solo se muestra como empty state (sin plan/sesión disponible).
2. Con sesión disponible: una sola tarjeta con "Iniciar sesión guiada" primario y "Cambiar/Adaptar hoy" secundarios.
3. Conservar tal cual los chips de contingencia (Solo 20 min / En casa / Sin equipo / Me perdí la sesión).

### Fuera de alcance

- No tocar el reproductor (`workout-player.js`) ni la generación del plan de entrenamiento.

### Riesgos

- Estados intermedios (descanso, safety hold, ejecución en curso) deben conservar sus tarjetas actuales; revisar cada rama de `renderWorkout()`.

### Criterios de aceptación

- Cada acción aparece exactamente una vez en la vista.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Capturar Entreno en estados: sin plan, con sesión pendiente, día de descanso, safety hold, ejecución en curso.

## REQ-102 - UX: Progreso con estado cero guiado y tabla de peso en tarjetas mobile

**Estado: pendiente.**

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

**Estado: pendiente.**

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

**Estado: pendiente.**

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
