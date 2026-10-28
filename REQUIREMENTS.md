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

**Paquete MyFitnessPal aprobado (24 oct 2026): REQ-268..276, en orden.** Especificaciones en `docs/competitive/2026-10-22-myfitnesspal/BACKLOG.md`. No depende de entrevistas/reclutamiento. El selector descubre estos pendientes; revalidar contra código al tomar cada uno.

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
- REQ-209 - Fix: la app no ocupa todo el ancho y siempre hay una barra de scroll. (descartado: no se reprodujo; mitigación en REQ-221)
- REQ-210 - Progreso: la semana 1 usa el peso y la grasa del onboarding. (P1; implementado)
- REQ-211 - Onboarding: el objetivo y el "ritmo del plan" se entienden a la primera. (P1; implementado)
- REQ-212 - Entreno: calentamiento y vuelta a la calma con movimientos concretos y cronómetro opcional. (P1; implementado)
- REQ-213 - Actualizaciones de la app sin botón "Actualizar app" que estorbe. (P1; implementado)
- REQ-214 - Plan: empezar de nuevo (4 o 10 semanas) en cualquier momento. (P1; implementado)
- REQ-215 - Nutrición: lista de compra semanal con "ya lo tengo" y "por comprar". (P2; implementado)
- REQ-216 - Modo conversacional (beta oculta). (P2; fase 1 implementada)

Feedback Sathya (beta, 2026-10-21, iPhone):

- REQ-242 - Fix: lo registrado ayer desaparece al abrir la app hoy si su subida había fallado. (P0; implementado)

Feedback Jonathan (2026-10-21, iPhone):

- REQ-243 - Fix: registrar una reciente con porción ×2 deja sus macros duplicados en Recientes. (P1; implementado)
- REQ-245 - Entreno: volver al ejercicio anterior para revisarlo, sin perder Siguiente ni Omitir. (P1; implementado)

Feedback Diego (beta, 2026-10-21, iPhone; capturas de Perfil → Entrenamiento/Recordatorios y audio sobre la próxima comida):

- REQ-252 - Fix Entreno: con "Otra actividad" los días de tu deporte salían como "Descanso total". (P0; implementado)
- REQ-253 - Entreno: "Actividad física principal" se entiende y cambiar el gimnasio por otro deporte un día es evidente. (P1; implementado)
- REQ-254 - Nutrición: el plan respeta cuánto cocinas. (P1; pendiente de decisión, ver abajo)
- REQ-255 - Recordatorios por WhatsApp. (P2; pendiente de decisión, ver abajo)

- REQ-258 - Home: día cerrado muestra mañana. (Jonathan; implementado)

Journey de recordatorios y racha (Jonathan, 2026-10-26; diseño en `docs/reminders-journey.md`): REQ-283 animación de racha, REQ-284 regreso en Hoy, REQ-285 recordatorios por ausencia.

Pausado esperando decisión de producto (ver REQ-147; no está en `agent-loop.json` hasta entonces):

- REQ-143 - Catálogo lote 3: crecimiento drástico dirigido por el canario del contrato. Dos lotes medidos con el diff de REQ-144 (2026-07-05 y 2026-07-08) confirman un techo cercano a 32%-33% bajo la selección actual; ver actualización 2026-07-08 en el REQ y REQ-147.

Pendiente no automatizable por agentes:

- REQ-49 - Revision legal pre-lanzamiento.
- REQ-60 - Configuracion manual de redirects en Supabase.
- REQ-127 - Personalizar remitente/asunto de correos de Supabase (branding Fitbud).
- REQ-70 - Validacion de negocio y beta con usuarios reales.
- REQ-254 - Decidir el nivel de cocina en el catálogo y si se amplían almuerzos/cenas "sin cocinar" (feedback Diego).
- REQ-255 - Decidir si los recordatorios llegan por WhatsApp: proveedor y presupuesto (feedback Diego).
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

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-120`).

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

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-126`).

## REQ-127 - Personalizar remitente y asunto de los correos de autenticacion de Supabase (branding Fitbud)

**Estado: implementado (configuración externa, con la marca Evolv).** Verificado el 2026-10-26 (API de gestión de Supabase, solo lectura): SMTP propio `smtp-relay.brevo.com`, remitente «Evolv» <hola@evolvapp.club>; asuntos «Tu cuenta de Evolv está lista», «Restablece tu contraseña de Evolv» y «Confirma tu correo en Evolv». Magic link y cambio de correo siguen en inglés, pero la app no usa esos flujos. Pendiente opcional: invitación/reset real para revisar la bandeja.

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

**Estado: implementado (decisión de Jonathan, 2026-10-26: avisar en vez de crecer el catálogo).** El techo del 32,3% era la función objetivo de `globalClosePass()` (REQ-166); el hueco real que quedaba eran los planes de **2 comidas** (y vegano/vegetariano sin tofu). En vez de un lote de catálogo para ese caso, `twoMealNoticeHtml()` avisa al elegir 2 comidas en el registro inicial y en Perfil → Comidas que el plan cuadra peor y que con 3 o más cuadra mejor. Los platos de REQ-254 suben de paso el canario de 288/378 a 311/378 (2 comidas vegano/vegetariano alta proteína: 0→7 y 0→6 de 7). ✓ `tests/e2e/cocina.spec.js`. Experimentos anteriores: `docs/requirements-history.md` (buscar `## REQ-143`).

## REQ-144 - Medir impacto incremental de catálogo contra el canario antes de aceptar platos nuevos

**Estado: implementado.** `scripts/diff-diet-contract.mjs` compara dos `seed.sql` y reporta el delta de `okDays` total, catálogo, causas y las 54 dimensiones; `scripts/validate-diet-contract-diff.mjs` lo valida y el release gate lo ejecuta. Detalle, motivación (REQ-143) y guía operativa: `docs/diet-contract-catalog-diff.md` y REQ-143 de `docs/requirements-history.md`.

## REQ-145 - Fix E2E: el fixture de entreno deja "hoy" sin sesión de fuerza los domingos y pone el release-gate en rojo

**Estado: implementado.** El perfil E2E usa `trainingPriority:"strength"` para que los 4 slots sean de fuerza aun cuando Domingo quede ultimo tras la normalizacion Lunes..Domingo; `trainingDaysIncludingToday(referenceDate)` permite validar los 7 dias y `scripts/validate-e2e-training-fixture.mjs` queda en el release gate. No se modifico runtime de la app. Detalle historico: `docs/requirements-history.md` (buscar `## REQ-145`).

## REQ-146 - Unificar el cálculo de racha: Progreso muestra "0 / racha rota" mientras hoy no se registra

**Estado: implementado.**
`streakStats()` (`index.html`) comparte ahora el criterio de `streak()`: el día en curso que aún no cumple no resetea `nutCur`/`trainCur`/`combCur`, solo un día ya vencido sin cumplir lo hace; `combBest` no cambia de fórmula, así que hitos y mejor racha no se alteran retroactivamente. `renderStreakSection()` no se tocó: al unificarse `combCur` con `streak()`, el banner de recuperación deja de dispararse solo por "hoy pendiente". Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/racha.spec.js`.

## REQ-147 - Decidir si vale la pena tocar la selección de `planDeterministicNutritionDay()`/`globalClosePass()` para superar el techo de catálogo del canario `DIET_CONTRACT`

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-147`).

## REQ-148 - Fix billing: un reembolso parcial de Stripe revoca todo el entitlement pagado

**Estado: implementado.**
`handleRefund()` (`api/webhook.js`) solo revoca cuando `charge.refunded===true` o `Number(charge.amount_refunded)>=Number(charge.amount)`; un reembolso parcial devuelve `skipped` (queda auditado en `billing_events` con el payload completo, sin tocar el entitlement). Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-webhook-refund.mjs`.

## REQ-149 - Fix admin: "Regenerar plan · Solo nutrición" archiva también el entrenamiento futuro

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-149`).

## REQ-150 - PWA sirve HTML nuevo con JS del cache viejo tras un deploy (versión mezclada)

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-150`).

## REQ-151 - Landing muestra la sección "Planes" vacía cuando el catálogo carga después del primer render

**Estado: implementado.**
`boot()` (`index.html`) encadena `loadCatalog().then(()=>{if(authReady&&!session&&!window._showAuth)render();})` en vez de dejarla en paralelo sin seguimiento: si `refreshAuth()` gana la carrera y pinta la landing antes de que `catalogPlans` esté poblado, el `then` repinta al resolver el catálogo, acotado a cuando la landing sigue visible (no repinta la app autenticada). Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/navegacion.spec.js` (retraso artificial de `/api/catalog`; confirmado que el test falla sin el fix y pasa con él).

## REQ-152 - Fix onboarding: "Mantenerlo por ahora" en el aviso de revisión de 4 semanas lanza ReferenceError y no cierra ni guarda

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-152`).

## REQ-153 - Fix Home: las sugerencias del coach ignoran comidas saltadas (y la pausa por seguridad) y contradicen la agenda

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-153`).

## REQ-154 - Fix Nutrición: "Cambiar comida" guarda la porción escalada pero la tarjeta muestra (y suma) los macros de la receta base

**Estado: implementado.**
`mealValue()` (`index.html`) gana una rama antes del recálculo por `dishMacros()`: si el override es un reemplazo materializado (`ovr.gen&&ovr.dishName!=null&&ovr.kcal!=null`, la forma que arman `applyChangeMeal()` y el rebalanceo de REQ-142), honra `ovr.kcal/p/c/f` en vez de recalcular desde la receta base sin escalar. Los dos caminos preexistentes (dishName sin kcal → `dishMacros()`; kcal sin dishName → "custom") quedan intactos. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-meal-value-replacement.mjs` (mealValue() real vía `node:vm` contra un candidato real de `rankReplacementCandidates()`).

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

`goalAwareDeltaColor(delta,goal)` (`index.html`) centraliza el color de `Δ peso (sem)`/`Δ grasa %` en `bodyComposition()` según `prefs.goal`: volumen (subir=bueno), mantenimiento (tolera hasta ±0.4, mismo umbral que el check-in de REQ-160), deficit/fallback (bajar=bueno, sin cambio de sentido). `composition()` no se tocó. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/progreso.spec.js` (meta volumen + 2 semanas de peso ascendente; confirmado que el test falla exactamente como describe el REQ —`var(--warn)` en vez de `var(--good)`— contra el código sin el fix).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-164`).

## REQ-165 - Fix check-in semanal: las escalas sin responder se leen como el peor valor y disparan ajustes falsos

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-165`).

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

**Estado: implementado.** Registrar a mano lo entrenado (también en días de descanso) en `dayState(ds).manualActivities`, con kcal estimadas por MET × kg × horas; editar y quitar desde Entreno y "Entrené igual" en Hoy.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-206`).

## REQ-207 - Fix: "Estimar con foto" no deja elegir una foto de la galería

**Estado: implementado.** "Estimar con foto" deja elegir de la galería: los inputs ya no llevan `capture`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-207`).

## REQ-208 - Beta: quien entra a la beta no ve precios ni cobro durante sus 90 días

**Estado: implementado.** Acceso beta sin precios (paywall → aviso neutro, Perfil "Acceso beta"), casilla beta de 90 días en Admin, reintento del canje de invitación e invariante de cobro en la web.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-208`).

## REQ-209 - Fix: la app no ocupa todo el ancho y siempre hay una barra de scroll

**Estado: implementado.** Descartado por decisión de Jonathan (2026-10-19): no se reprodujo en Chromium móvil ni en producción; la mitigación quedó en REQ-221. Si vuelve a aparecer, se abre un REQ nuevo con captura y dispositivo.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-209`).

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

**Estado: implementado.** `reconcileOnboardingMacros()` reconcilia el paso 2 del onboarding: si se editó un macro, kcal = p·4+c·4+f·9; si solo kcal, proteína fija y carbos/grasa escalan (piso 50 g/45 g), con aviso. Test: `scripts/validate-onboarding-macro-reconcile.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-227`).

## REQ-228 - Fix: "Estimar con foto" falla con un mensaje genérico y sin forma de reintentar

**Estado: implementado.** "Estimar con foto" muestra el motivo concreto del fallo (`photoEstimateErrorMessage()`) y un botón "Reintentar" con la misma foto.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-228`).

## REQ-229 - Fix: "Estimar con foto" estima el plato planeado en vez del que se ve

**Estado: implementado.** "Estimar con foto" identifica el plato por la foto: el nombre precargado del plan no se envía como descripción, y la descripción entra en la clave de reutilización.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-229`).

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
El ajuste del check-in ya no muta `calorieTarget/carbTarget/fatTarget` al aceptar (eso re-puntuaba de inmediato hoy y días ya ejecutados). Queda como `pendingCheckinAdjustment` y recién se aplica a las prefs vivas cuando empieza la próxima semana no iniciada; no se tocó el wiring de REQ-69 (`buildDay`/`effectiveDayTarget()` sigue leyendo siempre el perfil vigente). Copy del modal/toast alineado con ese momento real. `CACHE_NAME` → `fitbud-pwa-v137`.

- ✓ `node scripts/validate-macro-target-wiring.mjs`; `node scripts/release-gate.mjs` pasa (111 E2E, incl. 1 flake preexistente no relacionado en `entreno.spec.js` que pasa al reintentar).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-234`).

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

**Estado: implementado.** "Estimar macros" (texto y foto) dice por qué falló, con "(código N)" si el motivo no se reconoce, y ofrece "Reintentar"; sin foto ya no se ve la vista previa rota.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-238`).

## REQ-239 - Entreno: con la sesión en curso, el plan y los avisos van en un desplegable

**Estado: implementado.**

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-239`).

## REQ-240 - Entreno: la demostración y los pasos se abren desde junto al nombre del ejercicio

**Estado: implementado.** Junto al nombre del ejercicio, "▶ Cómo se hace" abre `openExerciseGuide()` (demostración, pasos, respiración, errores y señales para detenerse) en vez de la tarjeta incrustada del reproductor. Prueba: `tests/e2e/entreno.spec.js`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-240`).

## REQ-241 - Entreno: "Usar progresión" cambia de verdad el ejercicio (o dice que solo toca subir la carga)

**Estado: implementado.** `FITBUD_EXERCISE_VARIANTS` define versión más fácil y progresión de los 42 ejercicios de fuerza (`exercise`, `variant` o `load`): cambiar de ejercicio cambia título, imagen y guía; "solo carga" lo dice sin cambiar nada. Inventario en `docs/exercise-progressions.md`. Prueba: `tests/e2e/entreno.spec.js`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-241`).

## REQ-242 - Fix: lo registrado ayer desaparece al abrir la app hoy si su subida había fallado

**Estado: implementado.** Tras vaciar la caché en `onAuth()`, `restorePendingFromQueue()` repone desde la cola los días y pesos que aún no subieron, y `drainSyncQueue()` reintenta también los `failed`. Prueba: `tests/e2e/dia-sin-subir.spec.js`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-242`).

## REQ-243 - Fix: registrar una reciente con porción ×2 deja sus macros duplicados en Recientes

**Estado: implementado.** `saveEditor()` guarda `portion` al registrar una reciente o favorita con porción ×0,5–×2, y Recientes y "Guardar en favoritas" usan los macros de una porción (`perPortion()`). Prueba: `tests/e2e/comidas-guardadas.spec.js`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-243`).

## REQ-244 - Entreno: la duración cuenta de inicio a fin, también con la app en segundo plano

**Estado: implementado.** Al ocultarse la app el cronómetro sigue (`awayAt`); al volver, `returnFromAway()` cuenta la ausencia entera hasta 1 h y, si fue mayor, deja la sesión en pausa con la duración de cuando saliste. El resumen dice "duración total". Prueba: `scripts/validate-workout-player.mjs`, `tests/e2e/entreno.spec.js`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-244`).

## REQ-245 - Entreno: volver al ejercicio anterior para revisarlo, sin perder Siguiente ni Omitir

**Estado: implementado.** "← Ejercicio anterior" abre una revisión de solo lectura de los bloques ya registrados (`workoutExecution.reviewStep`), con "Hacerlo ahora" para retomar uno omitido; Siguiente y Omitir no cambian. Prueba: `tests/e2e/entreno.spec.js`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-245`).

## REQ-246 - Fix: "Estimar macros" (texto) falla en producción cuando el coach trae más de 3 preguntas

**Estado: implementado.** `validateCoachOutput()` para `meal_estimate` ya no limita cuántas preguntas trae el coach (seguía rechazando con 422) y el prompt de "Estimar macros" pide `"preguntas":[]`. Prueba: `scripts/validate-meal-estimate-output.mjs`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-246`).

## REQ-247 - Entreno: "Sustituir" solo propone ejercicios del mismo músculo principal

**Estado: implementado.** "Sustituir" solo propone ejercicios con el mismo músculo principal (`FITBUD_EXERCISE_SUBSTITUTION`, `exercise-catalog.js`): sustitutos directos primero y luego el resto del catálogo; el modal dice qué músculo conserva. Prueba: `scripts/validate-exercises.mjs`, `tests/e2e/entreno.spec.js`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-247`).

## REQ-248 - Beta: los postulantes aceptados usan el coach sin tope durante sus 90 días

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-248`).

## REQ-249 - Fix: en "Lo que sigue hoy" los botones quedan pegados al borde de su tarjeta

**Estado: implementado.** Las filas de "Lo que sigue hoy" usan clases `kind-*` en vez de `meal`/`workout` (las tarjetas globales), así que ya no son tarjetas sin relleno lateral y los botones quedan a 16 px del borde. Test: `tests/e2e/home.spec.js`.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-249`).

## REQ-250 - Fix Entreno: omitir el calentamiento ya elegido dejaba la sesión "parcial"

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-250`).

## REQ-251 - Beta: el perfil llega con lo que ya respondió en la postulación

**Estado: implementado.**

Pedido del dueño: no volver a pedir lo que ya llenó al postular. Al aceptar (`api/admin.js`) o al canjear el código de una postulación (`api/entitlement.js`), `prefs` recibe `name`, `goal` (Bajar grasa → `deficit`, Ganar músculo → `volumen`, Mejorar rendimiento → `mantenimiento`) y `trainingExperience` (según `stage`). No toca perfiles con `onboardingCompletedAt`, respeta un nombre ya puesto y no marca el onboarding como hecho. Edad (rango) y salud no se copian: el onboarding las pide con detalle.

- ✓ `scripts/test-admin-beta-api.mjs`, `scripts/test-invite-signup-api.mjs`; `node scripts/release-gate.mjs` pasa.

## REQ-252 - Fix Entreno: con "Otra actividad" los días de tu deporte salían como "Descanso total"

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-252`).

## REQ-253 - Entreno: "Actividad física principal" se entiende y cambiar el gimnasio por otro deporte un día es evidente

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-253`).

## REQ-254 - Nutrición: el plan respeta cuánto cocinas (quien no cocina no recibe tacos con frijoles)

**Estado: implementado — requiere acción humana:** ejecutar `supabase/cooking_level.sql` y luego volver a ejecutar `supabase/nutrition_catalog_semantics.sql` en Supabase.

Feedback Diego (beta). Preferencia «¿Cuánto cocinas?» (`cookingLevel`: none/basic/cook; registro inicial y Perfil → Comidas; perfiles existentes parten de «Lo básico»). `dishes.cooking_level` clasifica los 180 platos (criterio en `docs/catalog-req-254-cooking-level.md`), corrige `prep_minutes`/`needs_kitchen` por plato y suma 19 almuerzos y cenas sin cocinar o básicos (pollo rostizado, wraps de atún/pavo/seitán, bowls con legumbres listas…). `compatibleDishesForSlot()` excluye platos por encima del nivel (sin clasificar no se excluye); si una franja queda vacía sube un nivel y avisa («Hoy no encontramos algo más simple para la cena…»); las propuestas del coach por encima del nivel se descartan y el prompt lo indica (`COACH_PROMPT_VERSION` 12). «Cambiar comida» filtra de verdad con «⏱ Más fácil de preparar» y «🍱 Sin cocina»; el editor admin fija el nivel. «No cocino» cuadra 245/252 días con 4 y 6 comidas. ✓ `scripts/validate-cooking-level.mjs`, `tests/e2e/cocina.spec.js`. Propuesta original en `docs/requirements-history.md`.

## REQ-255 - Recordatorios por WhatsApp

**Estado: pendiente — requiere acción humana:** elegir canal, proveedor y presupuesto mensual.

### Origen

Diego (beta, 2026-10-21), sobre Perfil → Recordatorios: "Esto también está chévere, pero no veo mi correo; sería cool que sea al WhatsApp."

### Problema

El único recordatorio fuera de la app es por correo (REQ-24) y muchos usuarios no revisan su correo. Los avisos del dispositivo (push, REQ-38) existen, pero en iPhone solo funcionan con la app instalada en la pantalla de inicio y viven en otra sección plegada ("Avisos del dispositivo"), aparte de Recordatorios: quien abre Recordatorios solo ve el correo.

### Causa raíz

- `api/notify.js` solo envía correo (Resend) y push VAPID; no hay canal WhatsApp.
- REQ-225 sacó WhatsApp del flujo beta a propósito; la postulación beta sí guarda el número (`beta_applications.whatsapp`), pero no hay consentimiento para recordatorios ni número verificado en el perfil.

### Opciones

1. **WhatsApp Business Cloud API (Meta) directo:** plantilla "utility" aprobada por Meta, número de empresa verificado, costo por mensaje según país (Perú/LatAm: centavos de dólar por conversación de utilidad). Requiere guardar el teléfono con consentimiento explícito y baja con "STOP".
2. **Vía proveedor (Twilio, 360dialog):** misma plantilla y aprobación de Meta, más margen del proveedor; integración más simple.
3. **Sin WhatsApp por ahora:** hacer visible el push. En Recordatorios, ofrecer "Avisos en este teléfono" junto al correo y explicar en iPhone "Añade la app a tu pantalla de inicio para recibir avisos".

### Alcance (si se aprueba la opción 1 o 2)

1. Perfil → Recordatorios: canal "WhatsApp" con número (prefijo de país) y verificación por código; consentimiento y aviso de privacidad actualizados.
2. `api/notify.js`: envío por plantilla con el mismo criterio que el correo (solo si hay pendiente, nunca dos veces el mismo día), límite diario y registro de envíos sin contenido personal.
3. Baja con un toque (responder "STOP" o desde Perfil).

### Riesgos

- Costo por mensaje y dependencia de la aprobación de plantillas de Meta.
- El teléfono es dato personal: RLS, no va a analytics, se borra con la cuenta.
- Lenguaje REQ-31 en la plantilla.

### Decisión pendiente (Jonathan)

- ¿WhatsApp (opción 1 o 2, con presupuesto mensual) o primero la opción 3?

## REQ-256 - Fix Nutrición: "Volver a preparar este día" pisa comidas personalizadas sin marcar como hechas

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

`applyDayComidas` solo preservaba `ms.done`; editar o cambiar una comida sin marcarla hecha se perdía al re-preparar. Nueva marca `ovr.userSet` (en `saveEditor`, `applyChangeMeal`, `applyReplace` y la acción del coach `cambiar_plato`) que `applyDayComidas` también preserva. ✓ `tests/e2e/nutricion.spec.js`.

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

Feedback Sathya (beta). "Hacer otro ejercicio primero" elige un ejercicio pendiente posterior; el actual queda pendiente con sus series y se vuelve a él al terminar (`nextWorkoutStepIndex` = primer pendiente). ✓ `tests/e2e/entreno.spec.js`, `scripts/validate-workout-player.mjs`.

## REQ-261 - Entreno: sustituir un ejercicio por uno buscado en el catálogo

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Feedback Sathya. "Sustituir" tiene buscador (nombre, alias o músculo; `FITBUD_EXERCISE_SUBSTITUTION.search`) sobre todo el catálogo de fuerza, filtrado por lesiones (`exerciseSafeForLimits`). ✓ `tests/e2e/entreno.spec.js`, `scripts/validate-exercises.mjs`.

## REQ-262 - Entreno: añadir un ejercicio a la sesión desde un buscador

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Feedback Sathya. "+ Añadir ejercicio" busca en el catálogo y lo suma antes de la vuelta a la calma con la dosis de la fase (`addedStrengthStep`); sin series hechas se quita. ✓ `tests/e2e/entreno.spec.js`, `scripts/validate-workout-player.mjs`.

## REQ-263 - Fix Progreso: la "Adherencia a comidas" del ciclo activo se diluye con los días futuros

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

`progressStats()` acotaba `cycleSummary()` al ciclo completo (incluidos días futuros sin registrar), diluyendo la adherencia real a ~14% con 100% de cumplimiento hasta hoy. Ahora llama `cycleSummary(todayStr())`. ✓ `tests/e2e/progreso.spec.js`.

## REQ-264 - Entreno: revisar todos los niveles y corregir demos de variantes distintas

**Estado: implementado.** Revisión de Jonathan (2026-10-24): Pike push-up aparecía como principiante con una parada de manos. Inventario completo: 54 fichas locales y 16 adicionales de producción, 70 ejercicios únicos; criterio y razones en `docs/exercise-levels.md`.

Niveles explícitos y corrección de filas remotas antiguas sin modificar la base; diez demostraciones propias exactas; rutinas automáticas respetan experiencia y los planes pendientes se adaptan al leerlos, preservando ejecuciones/historial. Búsqueda manual muestra el nivel. Sin nivel válido no entra al plan. SQL opcional `supabase/exercise-levels.sql`; ninguna migración de producción ejecutada. Verificación: `scripts/validate-exercises.mjs`, `tests/e2e/exercise-levels.spec.js`, release gate. Detalle en `docs/requirements-history.md`.

## REQ-265 - Fix recordatorios: el cron marca "entrenamiento pendiente" en días de descanso

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

`commitDay()` guarda `restDay` (descanso del plan, marcado o pausa por seguridad) y `checkPending()` lo lee junto con `workoutOverride==="descanso"`. ✓ `scripts/validate-notify-schedule.mjs`, `tests/e2e/recordatorios.spec.js`.

## REQ-266 - Fix: los recordatorios por correo y push nunca se enviaban

**Estado: implementado — requiere acción humana:** secreto `CRON_SECRET` en GitHub (mismo valor que en Vercel).

El cron diario (03:00 en Lima) nunca coincidía con la hora elegida (17–23). `.github/workflows/notify-hourly.yml` llama cada hora a `/api/notify`, que envía desde la hora elegida (`isNotifyTime`), una vez por día. ✓ `scripts/validate-notify-schedule.mjs`.

## REQ-267 - Fix: los avisos push no tenían clave privada VAPID

**Estado: implementado — requiere acción humana:** `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` en Vercel.

Clave pública nueva en `index.html` y `api/notify.js`; al entrar, `refreshPushSubscriptionKey()` renueva suscripciones con otra clave. ✓ `scripts/validate-vapid-key.mjs`.

## REQ-268 - Estimación: no aplicar plantillas genéricas como macros de una comida

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-268`).

## REQ-269 - Registro: validar valores nutricionales y distinguir desconocidos de ceros

**Estado: implementado.** Prioridad P0. Dependencias: ninguna nueva. Detalle y casos: `docs/competitive/2026-10-22-myfitnesspal/BACKLOG.md`.

### Origen
Probe `negative-manual`; `readEditor()` y `saveEditor()` solo validan nombre.

### Problema
Se guardan kcal/proteína negativas; vacío o NaN se convierte en cero sin decisión del usuario.

### Objetivo
Guardar solo datos válidos y representar información incompleta explícitamente.

### Alcance
Parseo finito no negativo, coma/punto, errores por campo; modo completo con cuatro campos y modo explícito Solo calorías con macros desconocidos/totales parciales.

### Fuera de alcance
Reinterpretar ceros históricos y exigir igualdad exacta 4/4/9.

### Riesgos
Perder valores, cambiar totales antiguos o guardar favoritas inválidas.

### Criterios de aceptación
Negativo/vacío inválido no escribe día/perfil/cola; cero explícito se admite. Solo calorías conserva kcal e indica macros desconocidos. Legado conserva números y formulario conserva correcciones.

### Verificación sugerida
Pruebas puras de parseo y E2E de negativos/vacíos/decimales/cero/solo calorías/doble envío.

### Implementación
- Nuevo módulo puro `js/meal-log.js` (shell PWA): `parseNutrientInput` (coma/punto, vacío ≠ 0, sin negativos, exponentes ni infinitos) y `validateMealValues` (modo completo con cuatro campos o `kcal_only`; límites 5000 kcal, 500 g P/G, 1000 g C; una décima). No exige 4/4/9.
- Editor: campos de texto `inputmode="decimal"`, casilla «Solo conozco las calorías», errores por campo (`#f_errors`, `aria-invalid`, foco). `saveEditor` valida antes de tocar día/favoritas/cola y tiene guardia de doble envío. `macrosUnknown:true` se conserva en `mealMacrosEntry`/`mealValue`; tarjetas muestran «macros no informados» y `dayTotals` redondea al final y cuenta `partial` («Macros parciales»). Registros antiguos no se reinterpretan.
- Verificación: `scripts/test-meal-log.mjs`, `tests/e2e/registro-valores.spec.js`.

## REQ-270 - Registro: conservar procedencia y snapshot nutricional

**Estado: implementado.** Prioridad P1. Dependencias: REQ-268 y REQ-269. Detalle y casos: `docs/competitive/2026-10-22-myfitnesspal/BACKLOG.md`.

### Origen
`saveEditor()`, `applyEstimatedMacros()`, `mealMacrosEntry()` y `normalizedSavedMeals()`; metadatos no persistidos.

### Problema
Los totales pierden origen y supuestos al guardar o reutilizar una comida.

### Objetivo
Explicar los datos del registro y mantener historia independiente de la fuente.

### Alcance
Contrato versionado de origen manual/catálogo/estimación/receta/legacy, referencia opcional, base/porción y snapshot; lectura, corrección, recientes, favoritas y sync.

### Fuera de alcance
Guardar fotos/prompts o inferir datos antiguos.

### Riesgos
Escalar dos veces, perder metadata o compartir referencias privadas entre cuentas.

### Criterios de aceptación
Guardar/reabrir/reutilizar preserva origen; editar fuente no cambia pasado. ×2 conserva base; corrección manual se identifica. Legado legible sin backfill inventado.

### Verificación sugerida
Roundtrip, fuente editada, favoritas ×2, dos cuentas y merge offline; inspección de detalle accesible.

### Implementación
- Contrato `nutritionMeta` v1 en `js/meal-log.js` (documentado en el módulo): `source` manual/catalog/estimate/recipe/food/legacy, `ref` opcional, `base` por unidad, `qty`, `estimate.{kind,note}`, `corrected`, `macrosUnknown`. `normalizeNutritionMeta` descarta imagen/prompt y acota textos; `finalizeNutritionMeta` marca `corrected` sin perder la base.
- Editor: borrador por fuente (manual, estimación texto/foto, reciente/favorita con porción, catálogo, receta del plan). Se guarda con el consumo; recientes y favoritas lo conservan (`mealMacrosEntry`, `perPortion` vuelve `qty` a 1). Detalle «Origen: …» en el editor y en `openMealMore`. Entradas sin metadatos se leen como legacy y solo pasan a manual si se cambian; sin backfill.
- Verificación: `scripts/test-meal-log.mjs` (contrato, legacy, corrección, merge offline) y `tests/e2e/origen-registro.spec.js`.

## REQ-271 - Registro: editar ingredientes y gramos decimales sin perder el cálculo

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-271`).

## REQ-272 - Nutrición: registrar una sustitución o un adicional de forma explícita

**Estado: implementado.** Prioridad P1. Dependencias: REQ-270. Detalle y casos: `docs/competitive/2026-10-22-myfitnesspal/BACKLOG.md`.

### Origen
`openEditor(extra)`, `saveEditor()` y `openMealMore()`; flujo libre siempre añade un extra.

### Problema
Registrar algo comido en lugar del almuerzo puede acabar como consumo adicional.

### Objetivo
Expresar intención y modificar el total exactamente una vez.

### Alcance
Elegir Además de lo previsto o En lugar de, fecha/comida, preview/confirmación y deshacer propio con control de cambios posteriores.

### Fuera de alcance
Regenerar semana o compensar automáticamente calorías.

### Riesgos
Duplicar consumo, reescribir otro día o deshacer cambios ajenos.

### Criterios de aceptación
Pendiente/hecha/saltada tienen resultado explícito; cancelar no escribe. Sustituir cambia solo la elegida y no añade extra duplicado; reintento idempotente y deshacer seguro.

### Verificación sugerida
E2E de tres estados, adicional, cancelación, fecha, reintento, totales e historial.

### Implementación
- «Agregar comida / snack» pregunta «¿Cómo lo registras?»: día (dentro del ciclo), «Además de lo previsto» o «En lugar de una comida del día» con selector de comida, «Ya me lo comí» (por defecto sí hasta hoy, no en el futuro) e impacto en kcal; avisa si la comida ya estaba registrada o saltada.
- `applyMealSubstitution` cambia solo esa comida (snapshot, origen y líneas), quita el saltado, registra `meal_replace`/`logged_instead` y guarda `ms.subst` con el estado previo. `undoMealSubstitution` (tarjeta y «···») restaura solo si la comida no se editó después. Sin rebalanceos ni regeneración de la semana.
- Verificación: `tests/e2e/sustitucion.spec.js`.

## REQ-273 - Nutrición: copiar comida o selección del día a otra fecha

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-273`).

## REQ-274 - Nutrición: biblioteca privada de alimentos desde etiqueta

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-274`).

## REQ-275 - Nutrición: recetas propias con rendimiento y registro por porción

**Estado: implementado.** Prioridad P1. Dependencias: REQ-271 y REQ-274. Detalle y casos: `docs/competitive/2026-10-22-myfitnesspal/BACKLOG.md`.

### Origen
Fuentes S07/S08; Evolv tiene recetas curadas pero no biblioteca privada con rendimiento editable.

### Problema
Favoritas por totales no permiten recalcular una receta al cambiar ingredientes o porciones.

### Objetivo
Guardar receta, cocinar una cantidad y registrar solo lo consumido.

### Alcance
Hasta 50 recetas privadas/30 líneas, ingredientes existentes/propios, pasos opcionales, rendimiento por porciones o peso final conocido; snapshots versionados.

### Fuera de alcance
Inferir rendimiento cocido, importar URLs, compartir públicamente o incluirla en solver global.

### Riesgos
Cambiar pasado, dividir por cero, desconocidos tratados como ceros o pérdida entre dispositivos.

### Criterios de aceptación
Cuatro porciones registra una cuarta parte; 150 g usa peso final conocido. Guardar no consume; editar/eliminar fuente conserva consumos. Cantidades inválidas no escriben.

### Verificación sugerida
Pruebas de fracciones/rendimiento, E2E crear/guardar/registrar/editar, legado, sync y aislamiento.

### Implementación
- `prefs.customRecipes` (máx. 50): hasta 30 líneas del catálogo o alimentos propios, pasos opcionales y rendimiento indicado por el usuario (porciones y/o peso final cocinado); nunca se infiere del crudo. `recipeBase` da la base por porción o por 100 g cocinada; fusión por id/versión con lápidas (`persistLibraryOp` compartido con REQ-274).
- «Mis recetas» (Más opciones): crear, editar (versión +1) y eliminar con vista previa por porción/100 g; guardar no registra nada. En «Alimento», «Tus recetas» se registran por porciones o gramos como línea `ref:{kind:"recipe",id,version}` con snapshot: cambiar rendimiento o eliminar no reescribe consumos. No entra al solver ni se comparte.
- Verificación: `scripts/test-meal-log.mjs`, `tests/e2e/recetas.spec.js`.

## REQ-276 - Nutrición: productos propios por código y escaneo progresivo

**Estado: implementado.** Detalle y verificación en `docs/requirements-history.md` (buscar `## REQ-276`).

## REQ-277 - Publicar análisis MyFitnessPal para continuidad entre agentes

**Estado: implementado.**

Solicitud directa: compartir el análisis guardado localmente. Publica `docs/competitive/2026-10-22-myfitnesspal/README.md`, matriz de 48 dimensiones y propuestas MFP-00..17; añade entradas desde AGENTS, README y estrategia. Conserva evidencia del checkout anterior, declara diferencias con main y verificación externa pendiente. No incorpora las propuestas al selector ni reactiva el track nativo.

## REQ-278 - Estimación: validar también las respuestas completadas y su entrada real

**Estado: implementado.**

### Origen
Revisión del paquete ya integrado en `10f9f2e`. Un fixture de `claim_coach_generation_part` con parte completed y result_id nulo todavía devolvía la plantilla 500/25/55/20 con HTTP 200, antes del filtro de REQ-268.

### Problema
Las rutas de replay inmediato/en espera saltaban la comprobación de procedencia. Además, la compatibilidad dependía solo de una clave recibida del cliente, aunque cambiara texto, foto o aclaración.

### Objetivo
Solo reutilizar una estimación real, activa, del mismo usuario y entrada/política.

### Alcance
Contexto SHA-256 con namespace nuevo para prompt/texto, modelo e imagen. Verificar resultado, contenido, usuario y contexto contra pool activo en replay y selección. Mantener origin/reused y 422 no_compatible_result; sin SQL ni cambios de cuota.

### Fuera de alcance
Reimplementar REQ-268..276, modificar persistencia nutricional o migraciones de producción.

### Riesgos
Invalidar cache antigua de forma segura sin bloquear generaciones nuevas; no comparar solo la cifra 500 ni guardar imágenes/prompts en el nuevo contexto.

### Criterios de aceptación
Plantillas legacy y replays con otra entrada fallan sin texto de estimación. Generación y reutilización exacta siguen funcionando. Cambiar usuario, foto, aclaración o modelo no reutiliza. Sin resultado, cliente conserva datos.

### Verificación sugerida
`scripts/test-meal-estimate-reuse.mjs`, regresiones de cuota/estimación y suite E2E. Caso anterior: replay completed sin result_id devolvía 200; después devuelve 422. El namespace nuevo exige nueva generación para caches antiguas; no hay migración ni llamadas pagadas.

## REQ-279 - Perfil: Comidas excede el presupuesto de altura en móvil

**Estado: implementado.** Prioridad P2. Campos cortos en dos columnas, preferencias de cocina/preparación desplegables, copy resumido y controles de Perfil a 16 px/44 px. Alturas a 390 px con fuentes reales y puntero táctil: Comidas 1184 px, Entreno 1481 px. Sin cambios al límite E2E; guardado y valores del desplegable verificados. Evidencia: `docs/requirements-evidence/req-279.md`.

### Origen
Gate completo al verificar REQ-278: 154 de 155 E2E pasan; falla Perfil por altura. `index.html` es idéntico al main anterior a este fix.

### Problema
`tests/e2e/perfil.spec.js` exige máximo 1500 px al abrir Comidas. Se midieron 1539 px con fallback del entorno y 1551 px al probar las fuentes reales; no es una falla de la API de estimación.

### Objetivo
Recuperar el presupuesto móvil de la sección manteniendo campos y lectura cómoda.

### Alcance
Revisar espaciado y divulgación de opciones de Perfil, medidas en 390 px y tipografía real; conservar guardado y valores al alternar secciones.

### Fuera de alcance
Subir el límite del test para ocultar el fallo, reducir tamaño táctil o modificar nutrición/entrenamiento.

### Riesgos
Ocultar restricciones importantes, perder cambios o degradar accesibilidad.

### Criterios de aceptación
Comidas y Entreno abiertos miden como máximo 1500 px en el caso E2E; editar, alternar y guardar conserva datos. No se relaja la aserción. Gate completo verde.

### Verificación sugerida
`tests/e2e/perfil.spec.js`, capturas móvil/escritorio y validación de etiquetas/controles. Evidencia del bloqueo: `docs/requirements-evidence/req-279-profile.json`.

## REQ-280 - Conflictos de sync: el botón "Combinar seguro" nunca aparece y se pierden cambios no conflictivos

**Estado: implementado.**
`_resolveQueuedConflictPayload()` (`index.html`) calcula `merged.merged` con `mergeDayLogStates` también cuando `merged.ok===false` y lo etiqueta `autoMergedPayload` (log `safe_merge`); `drainSyncQueue()` lo propaga a `_markSyncConflict()`, que ahora lo guarda en `item.conflict.autoMergedPayload`. `openSyncConflicts()` ya mostraba el botón cuando esa propiedad existe; `resolveSyncConflict("merge")` ahora también aplica `payload.state` a `S.days` antes de reencolar, igual que la rama "local". `weight_log` queda sin esta oferta, como define REQ-73. ✓ `scripts/validate-sync-safe-merge.mjs`.

### Origen
Journey `sync`, auditoría del 2026-10-26 sobre `6ed64ed` (REQ-278). Al recorrer la resolución de conflictos offline reproduje un conflicto real en la app corriendo (localhost:8923) y el modal "Revisar sincronización" solo ofrece dos opciones, nunca la tercera que REQ-73 documenta.

### Problema
Cuando dos dispositivos editan el mismo día y hay un campo en conflicto (p. ej. la misma comida con valores distintos), el usuario solo puede elegir "Conservar este dispositivo" o "Usar versión guardada": ambas opciones son con pérdida. La opción "Combinar seguro" —diseñada para preservar los cambios NO conflictivos de ambos lados y resolver solo el campo en disputa— no se muestra jamás. Repro: con base `{meals.lunch}`, local que cambia `lunch` y además agrega `breakfast` + un extra, y remoto que cambia `lunch` distinto, el motor marca conflicto en `meals.lunch` pero computa un merge que conserva `breakfast` y el extra; aun así el usuario no puede aplicarlo y, al elegir local o remoto, pierde los cambios no conflictivos del otro dispositivo.

### Causa raíz
`_markSyncConflict()` (`index.html:2250`) guarda `item.conflict={detectedAt,remoteUpdatedAt,remotePayload,conflicts}` y **nunca** escribe `autoMergedPayload`. Además `_resolveQueuedConflictPayload()` (`index.html:2322-2329`) computa `merged.merged` con `mergeDayLogStates()` pero, cuando `ok===false`, devuelve `{ok:false,remotePayload,conflicts}` y **descarta** `merged.merged`. Como consecuencia, los dos únicos lectores de `autoMergedPayload` quedan muertos: `hasMerge` en `openSyncConflicts()` (`index.html:2409`) siempre es `false` (el botón no se renderiza) y la rama `action==="merge"` de `resolveSyncConflict()` (`index.html:2453`) es inalcanzable. La propiedad se referencia pero nunca se asigna desde el commit original de REQ-73 (`80fc012`, verificado con `git log -S`).

### Objetivo
Que el modal de resolución de conflictos ofrezca "Combinar seguro" cuando exista un merge parcial computable, aplicando los cambios no conflictivos de ambos dispositivos y resolviendo el campo en disputa, como promete REQ-73.

### Alcance
1. En `_markSyncConflict()` (o en el llamador `drainSyncQueue`), cuando `mergeDayLogStates` haya producido un `merged.merged` utilizable, almacenarlo en `item.conflict.autoMergedPayload` (payload `day_log` completo con `updated_at` nuevo, análogo al de la rama `auto_merge`).
2. Que `_resolveQueuedConflictPayload` propague ese payload combinado hacia `_markSyncConflict` en vez de descartarlo.

### Fuera de alcance
- Cambiar la semántica de `mergeDayLogStates`/`mergeWeightPayload` ni las ramas local/remoto (funcionan).
- Ofrecer "Combinar seguro" para `weight_log` cuando el conflicto es sobre el mismo campo (REQ-73 lo deja como conflicto visible).
- CRDT o edición colaborativa en tiempo real.

### Riesgos
- Registrar el merge en `syncResolutionLog` sin duplicar (reusar `appendSyncResolutionLogToPayload`).
- No exponer datos de salud a analytics ni romper el aislamiento por `uid`.

### Criterios de aceptación
- Ante un conflicto de `day_log` con merge parcial computable, el modal muestra "Combinar seguro" y aplicarlo conserva los cambios no conflictivos de ambos dispositivos.
- Las opciones local/remoto siguen funcionando igual.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida
- Test Node/E2E: sembrar un item `conflict` de `day_log` (base/local/remoto con un slot en disputa y otro no), verificar que `item.conflict.autoMergedPayload` existe y que el modal renderiza 3 botones.
- Repro manual (auditoría): modal "Revisar sincronización" con `hasAutoMergedPayload:false` y solo 2 botones; screenshot en `tool-results` de la corrida.

## REQ-281 - Recordatorios: el job dice si el push está listo y tolera espacios en las claves

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

`api/notify.js` recorta `VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` y responde `push: {ready, issue}` (sin valores). ✓ `scripts/validate-notify-push-ready.mjs`.

## REQ-282 - Recordatorios: avisar a quien todavía no empezó el día

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Sin el día en `day_log`, o sin nada registrado, `checkPending()` cuenta comidas pendientes y el correo dice "Tu plan de hoy te espera"; el entreno no se avisa sin el día. ✓ `scripts/validate-notify-schedule.mjs`.

## REQ-283 - Racha: animación al registrar algo que la hace avanzar

**Estado: implementado.** Detalle en `docs/requirements-history.md`; diseño en `docs/reminders-journey.md`.

Jonathan (2026-10-26). Cada registro que avanza el día muestra la píldora `#streakPop` con lo que falta; al cumplir, el número sube. ✓ `tests/e2e/racha-animacion.spec.js`.

## REQ-284 - Hoy: tarjeta de regreso y rescate de ayer

**Estado: implementado.** Detalle en `docs/requirements-history.md`; diseño en `docs/reminders-journey.md`.

Jonathan (2026-10-26). `returnCardHtml()`: rescate de ayer con racha previa de 2+ días, o bienvenida con progreso, objetivo y semana tras 2+ días fuera. ✓ `tests/e2e/regreso.spec.js`.

## REQ-285 - Recordatorios según cuánto tiempo lleva fuera (día, rescate, última llamada, regreso)

**Estado: implementado.** Migración `supabase/notifications_journey.sql` aplicada el 2026-10-26.

Jonathan (2026-10-26). `planReminder()` en `api/notify.js` elige una etapa por usuario y día: día en juego, rescate de ayer, última llamada (push) o regreso a los 2/5/7/14/30 días; después, silencio. Diseño: `docs/reminders-journey.md`; detalle en `docs/requirements-history.md`. ✓ `scripts/validate-reminder-journey.mjs`, `tests/e2e/recordatorios.spec.js`.

## REQ-286 - Modo conversación: el hilo del día no se aísla entre cuentas en el mismo dispositivo

**Estado: implementado.**

`chatTurns()`/`saveChatTurns()` namespaced por `uid()` además de fecha; `clearSignedOutState()` purga `evolv_chat_turns_v1` al cerrar sesión. ✓ `tests/e2e/sync-isolation.spec.js`.

### Origen

Auditoría del journey **auth-roles** (aislamiento entre usuarios en un dispositivo compartido) sobre `62aef73`. Revisando qué estado local sobrevive a `signOutUser()`/`clearSignedOutState()` cuando una cuenta cierra sesión y otra entra en la misma pestaña, el hilo del "modo conversación" (REQ-216) persiste en `sessionStorage` sin identificar al usuario.

### Problema

En modo conversación (labs: `labs.conversational` + `uiMode:"chat"`), el hilo del día se guarda en `sessionStorage` bajo la clave fija `evolv_chat_turns_v1`, etiquetado **solo por fecha** (`{ds, turns}`), sin `user_id`. Si en el mismo dispositivo/pestaña y el mismo día el usuario A usa el modo conversación (incluido el texto libre que escribe, p. ej. datos de salud) y luego cierra sesión y entra el usuario B —también con el modo activo—, el hilo de B muestra los mensajes de A.

Reproducción (contra la app en `http://127.0.0.1:8923`, 0 llamadas pagadas): (1) A escribe `saveChatTurns([{role:"user",text:"Tengo 95 kg…"},{role:"assistant",text:"Claro…"}])`; (2) A cierra sesión con `clearSignedOutState("user-A-uuid")` (el helper real del botón y del evento `SIGNED_OUT`), **sin recargar** (SPA); (3) entra B; (4) `chatTurns()` devuelve para B los mismos turnos de A, y `renderChatMode()` los pinta como burbujas de B.

### Causa raíz

El hilo no lleva el `uid` en su clave ni en su payload, y el logout no lo purga:

- `index.html:7488` `const CHAT_TURNS_KEY="evolv_chat_turns_v1"` — clave fija sin `uid`.
- `index.html:7512-7513` `chatTurns()` solo filtra por fecha: `all.ds===todayStr()&&Array.isArray(all.turns)?all.turns:[]`; nunca compara el dueño.
- `index.html:7515` `saveChatTurns()` guarda `{ds,turns}` sin `uid`.
- `index.html:13125-13142` `clearSignedOutState()` limpia `S.days`/`S.weights`/cola de sync (REQ-156)/coach/entitlement pero **no toca** `sessionStorage["evolv_chat_turns_v1"]`.
- Lo materializa en UI `index.html:7576` `renderChatMode()` (tramo `local:true` desde `chatTurns()`).

Contrasta con el resto del journey, ya aislado por `uid`: `RETURN_CARD_KEY+":"+uid()` (`index.html:13441`), `mealOptionRerollBucket()` (`index.html:9371`), `coachChatKey()` con `session.user.id` (`index.html:6932`) y la purga de REQ-156. Evidencia funcional (`javascript_tool` sobre funciones reales): tras `clearSignedOutState("user-A-uuid")`, `sessionStorage` sigue con el hilo de A y `chatTurns()` desde B devuelve ese mismo contenido.

### Objetivo

Que el hilo del modo conversación de un usuario nunca sea visible para otra cuenta que inicie sesión en el mismo dispositivo/pestaña, coherente con "privacidad por defecto" y con el aislamiento del resto de claves locales y la cola de sync.

### Alcance

1. Namespacing por usuario: incluir `uid()` en la clave o el payload de `evolv_chat_turns_v1`; `chatTurns()` solo devuelve turnos cuando el `uid` coincide con el usuario actual (además del filtro por fecha).
2. Purga en logout: `clearSignedOutState()` elimina el hilo local del modo conversación del usuario saliente.

### Fuera de alcance

- La funcionalidad del modo conversación (REQ-216) y el `coachChatMemory` del coach normal (ya namespaced por `uid`+ciclo).
- La cola de sync (REQ-156) y las claves ya aisladas; persistir el hilo entre recargas (es efímero por diseño).

### Riesgos

- No romper `tests/e2e/conversacion.spec.js` (flujo de un solo usuario).
- Lectura tolerante al formato viejo del payload si se cambia su forma.

### Criterios de aceptación

- Tras A escribe → A cierra sesión (`clearSignedOutState`/`SIGNED_OUT`, sin reload) → B entra en la misma pestaña, `chatTurns()` y el hilo de `renderChatMode()` para B **no** contienen los turnos de A.
- Un solo usuario conserva su hilo del día en la misma sesión de pestaña (sin regresión de REQ-216).
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Caso nuevo en `tests/e2e/conversacion.spec.js` o `sync-isolation.spec.js`: sembrar hilo con A, disparar `SIGNED_OUT`, re-seedear como B con `labs.conversational`+`uiMode:"chat"`, afirmar que el modo conversación de B no muestra las burbujas de A.

## REQ-287 - Entreno: el plan en una línea y las señales para detenerse junto al inicio

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Jonathan (2026-10-27). Sin aviso fijo ni tarjeta del plan: `.wk-planline` ("Semana N de M") abre `openTrainingPlanSheet()` (personalizar, cambiar días/deporte/lugar, señales). Señales bajo "Iniciar sesión guiada" y en la cuenta atrás. ✓ `tests/e2e/entreno.spec.js`.

## REQ-288 - Push: par VAPID nuevo (la privada de REQ-267 no estaba en ningún lado)

**Estado: implementado.** Variables cargadas en Vercel; el 2026-10-27 el job respondió `push.ready:true`.

El job respondía `push.ready:false` ("falta VAPID_PRIVATE_KEY"). Clave pública nueva en `index.html` y `api/notify.js`; las suscripciones se renuevan al entrar. ✓ `scripts/validate-vapid-key.mjs`.

## REQ-289 - Onboarding: instalar la app y activar avisos; Hoy lo recuerda cada día

**Estado: implementado.** Detalle en `docs/requirements-history.md`.

Jonathan (2026-10-27). Con la primera semana lista, `renderNotifySetup()` pide instalar Evolv (móvil) y activar avisos (o correo si no hay push). Hoy muestra `notifyNudgeHtml()` hasta activarlos; "Ahora no" lo oculta hasta mañana. ✓ `tests/e2e/avisos.spec.js`.

## REQ-290 - Precios de lanzamiento: USD 7.99/mes y USD 39.90 por 6 meses

**Estado: implementado.** Falta aplicar el seed de `supabase/entitlements.sql` y crear los precios en Stripe (`STRIPE_SETUP.md`).

`semiannual` (180 días) reemplaza a `quarterly`, que queda `active=false` solo para cortesías beta e histórico.
