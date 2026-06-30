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
