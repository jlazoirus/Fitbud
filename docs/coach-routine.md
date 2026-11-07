# REQ-359 — Rutina semanal acordada con el coach

Origen: Jonathan autoriza implementar el feedback de Allison (2026-11-06): prefiere máquinas, quiere conservar partes de su rutina de Smart Fit y espera que lo conversado se convierta en cambios reales.

## Experiencia

Hoy y Entreno ofrecen «Cuéntame cómo entrenas» (o «Revisar mi rutina con el coach»). La entrevista opcional recoge preferencia de equipo, rutina actual pegada como texto, qué conservar/cambiar y una selección explícita de ejercicios del plan que deben conservarse. No sustituye el onboarding ni llama al servicio al abrirse. El chat habitual también permite solicitar cambios; cuando falta información, pide aclaraciones.

La respuesta propone, nunca afirma que haya guardado. «Revisar rutina semanal» muestra días, nombres, ejercicios ordenados, series, repeticiones y descansos, fechas y número de sesiones pendientes. Solo «Aplicar a mis próximos entrenamientos» escribe. Se repite en los días de fuerza elegidos hasta el fin del ciclo; no convierte días de deporte en fuerza. Se conservan las sesiones pasadas, iniciadas, registradas y las excepciones de lugar de un día. Las elecciones pendientes de ejercicios de los días ajustados se reemplazan explícitamente. Una propuesta parcial conserva las otras sesiones de la plantilla y sus elecciones de un día; la revisión distingue días ajustados y conservados.

Máquinas/peso libre/ambos también se elige en onboarding y Perfil. La preferencia interviene en plantillas, generación, validación de propuestas y contexto conversacional. Máquinas permite poleas y core sin carga y excluye barras, mancuernas y bandas; no confundir material disponible con preferencia.

## Contrato y datos

- `js/training-routine.js`: contrato puro compartido entre cliente y `api/claude.js`. Acción `actualizar_rutina`, `style`, `sessions:[{weekday,name,exercises:[{exerciseId,sets,reps,restSeconds}]}]`. Entre 1 y 7 días únicos; 2–8 ejercicios por día. IDs exactos del catálogo, días compatibles, restricciones/nivel/recursos vigentes, conservación obligatoria de la selección explícita, dosis y tiempo disponible. Máximo 5 series (3 en modo suave), repeticiones válidas y descansos de 20–300 s.
- `profiles.prefs.trainingStyle`: `mixed` por defecto, `machines` o `free_weights`. `weeklyRoutine`: versión 1, ciclo, inicio, fin y sesiones. Preferencia privada por usuario siguiendo el patrón de `savedRoutines`; no requiere SQL. La prescripción futura procede del perfil, sin usar `day_log` como fuente principal.
- `effectiveWorkout()` proyecta la plantilla semanal sobre los días pendientes. Las elecciones explícitas de un día siguen funcionando; el reproductor congela la prescripción al iniciar. Una sesión que inició con la rutina semanal conserva su nombre, ejercicios y dosis aunque la plantilla se retire o cambie después.
- El perfil se guarda con `saveProfilePrefs(...,{skipPlanVersion:true})`, como otras rutinas privadas. No se modifica el snapshot del plan anterior ni el menú. Se limpian solamente overrides pendientes de los días confirmados, mediante la cola de sincronización existente. Cambios incompatibles posteriores muestran aviso de revisión y el plan compatible.
- Propuesta y revisión quedan vinculadas a usuario, ciclo y huella del perfil/rutina. Se revalidan al abrir y al guardar; se evita doble escritura y se comprueba identidad tras esperas. Un error de red no marca la propuesta aplicada. El chat conserva su política existente de memoria de sesión; la rutina confirmada sí persiste al recargar y sincronizar.
- Texto del coach: JSON se analiza antes de limpiar el contenido. Saltos reales o duplicadamente escapados se muestran como líneas, se eliminan marcadores visibles y todo se escapa como texto; nunca se interpreta HTML.
- `COACH_PROMPT_VERSION=13`, PWA v218. Sin nuevas dependencias, migraciones ni llamadas automáticas pagadas. Ningún contenido de rutina/conversación se envía a analytics.

## Validación y recuperación

`scripts/test-training-routine.mjs` prueba el contrato y el handler real del proxy con red simulada, incluyendo rechazo de peso libre en una propuesta de máquinas. `tests/e2e/coach-rutina.spec.js` recorre conversación, revisión, guardado, recarga, repetición futura, dosis, privacidad, fallos y coherencia con el reproductor a 320/390/1280. Regresiones del coach, Perfil, onboarding y entrenamiento en el release gate.

«Volver al plan sugerido» retira la plantilla para sesiones pendientes, conservando la preferencia de equipo y los snapshots ejecutados. Las ediciones de un solo día siguen disponibles desde «Editar ejercicios».

Fuera de alcance: sustituir todo el onboarding por chat, importar imágenes de rutinas, alterar automáticamente disponibilidad/deportes, ejecutar cambios sin confirmación, y modificar el historial o la migración nativa.
