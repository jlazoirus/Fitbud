# Requerimientos aprobados para iniciar implementación

Actualización: **24 de octubre de 2026**, por instrucción directa del usuario: no depender de entrevistas; identificar mejoras e incorporarlas al backlog operativo. Base contrastada: `origin/main` `62c7860`. Los REQ están pendientes, no implementados. Su fuente operativa es `REQUIREMENTS.md`.

## Decisión y método

Se sustituyen entrevistas/reclutamiento por tres evidencias suficientes para decidir este paquete: catorce artículos oficiales actuales de MyFitnessPal, seis E2E existentes de Evolv y tres reproducciones en navegador con fixtures. No se necesitan compras, cuentas de pago, reclutar personas, contratar proveedores ni ejecutar SQL de producción para empezar.

Los recorridos de MyFitnessPal se reconstruyeron desde su ayuda oficial; no se inició sesión ni se probó su app nativa. Esta diferencia impide afirmar superioridad medida, pero no impide especificar y verificar una copia entre días, un cálculo por porciones o un error de datos ya reproducido. [Fuentes verificadas](FUENTES-VERIFICADAS.md) y [evidencia nueva](evidence/2026-10-24/probes.json).

## Qué se elimina como trabajo nuevo

| Propuesta anterior | Estado comprobado en Evolv | Decisión |
|---|---|---|
| Recientes, favoritas y búsqueda de ingredientes | REQ-188 y REQ-243; `recentCustomMeals`, `savedMeals`, `renderQuickPicks`; tres E2E pasan | Reutilizar; no volver a construir |
| Compras recuperables y checklist | REQ-215 y REQ-231; `openShoppingList`, dos E2E pasan | Conservar y hacer que las composiciones nuevas aporten ingredientes |
| Reenvío de confirmación | REQ-190; `resendConfirmEmail`; E2E pasa | No crear otro REQ de alta por el caso histórico |
| Preview roto y errores de estimación | REQ-228/230/238/246 y CSS actual | No repetir esos fixes; el fallback específico sí sigue pendiente |
| Última carga de un ejercicio | REQ-232 y `lastWorkoutPerformance`/render asociado | Ya existe; no confundirlo con progresión automática |
| Historial alterado por check-in | REQ-234 | Conservar el fix; no rehacer check-in como prerequisito |
| Búsqueda/cambio/añadir ejercicios | REQ-260/261/262 | Ya implementado; sin trabajo duplicado |

## Orden ejecutable

| Orden | REQ | Entrega | Dependencias |
|---|---|---|---|
| 1 | 268 · P0 | Fallo honesto de estimación, sin plantilla de 500 kcal | Ninguna nueva |
| 2 | 269 · P0 | Validación de valores manuales, sin negativos/vacíos convertidos en cero | Ninguna nueva |
| 3 | 270 · P1 | Origen y snapshot del registro nutricional | 268–269 |
| 4 | 271 · P1 | Composición editable por ingredientes y gramos decimales | 270 |
| 5 | 272 · P1 | Registrar en lugar de una comida o además de ella | 270 |
| 6 | 273 · P1 | Copiar comida/día con preview, sin consumir el futuro | 270 y 272 |
| 7 | 274 · P1 | Alimentos propios desde etiqueta: marca, base y porción | 269–271 |
| 8 | 275 · P1 | Recetas propias y rendimiento por porción/peso final | 271 y 274 |
| 9 | 276 · P2 | Código GTIN privado y escaneo progresivo cuando el navegador lo soporte | 274 |

El selector actual descubre pendientes no listados y los ordena por número; no hace falta cambiar `agent-loop.json`. Al integrarse este cambio en `main`, el primero será REQ-268. La escritura sobre archivos compartidos sigue usando el lock existente y un REQ por implementación/commit. Este paquete no habilita trabajo nativo ni promueve los nueve REQ como una sola implementación.

## Contratos comunes para los agentes

- Mantener frontend sin framework/build nuevo y sin dependencias runtime nuevas. Cálculos puros bajo `js/` con el patrón existente cuando corresponda; funciones públicas compatibles con handlers.
- Persistir preferencias/bibliotecas privadas dentro de `profiles.prefs`, siguiendo `savedMeals`, con límites explícitos. Conservar claves ajenas y manejo de fallos/conflictos. Usar RLS, API y cola actuales; este paquete no necesita una nueva tabla para arrancar.
- Guardar en cada consumo un snapshot de valores utilizados, no un enlace que cambie el pasado si se edita el alimento/receta. No inferir ingredientes de una descripción antigua ni certificar alérgenos.
- Propuesta de contrato versionado: `nutritionMeta` con origen (`manual/catalog/estimate/recipe/legacy`), referencia opcional y valores base/porción; `components` para líneas reales del compositor. La forma final debe quedar documentada y probada en REQ-270/271, sin inventar datos en backfill.
- No registrar alimentos, fotos, GTIN, salud ni descripciones en analytics. Pruebas solo con fixtures y cuentas ficticias. La foto de comida no se persiste como consecuencia de estos cambios.
- Toda escritura nueva debe conservar idempotencia, aislamiento entre cuentas, cola offline y flags de consumo/plan. Subir versión de cache si se toca el shell; los documentos por sí solos no requieren bump.

## Especificaciones y casos de verificación

### REQ-268 · Eliminar estimaciones genéricas presentadas como resultado

**Problema observado:** `aiEstimate()` (`index.html:10444`) envía una plantilla fija 500/25/55/20 en `fallbackText`; `api/claude.js:926` permite seleccionarla en `reuse`. El navegador aplica una respuesta con esos valores a «Un vaso de agua». Se simuló esa respuesta; no es una medición de incidencias reales.

**Resultado:** reutilizar solo una estimación válida del mismo contexto y política compatible; si no existe, informar que no se pudo estimar y conservar los campos. No reemplazar la plantilla por otro número genérico ni por ceros de apariencia válida.

**Casos:** generación correcta, reutilización exacta, ausencia de resultado compatible, proveedor caído, cuota/política sin generación, misma descripción en otro usuario, foto/QA diferentes. Ni el botón «Guardar» ni una nota deben presentar el fallo como una estimación aplicada. El servidor debe diferenciar fallback/ausencia de una respuesta generada o exacta sin exponer jerga al usuario.

**Fuera:** cambiar pricing/cuotas o quitar la reutilización compatible de otras acciones del coach.

### REQ-269 · Validar números y datos nutricionales incompletos

**Problema observado:** `readEditor()` convierte vacío/NaN en 0; `saveEditor()` solo exige nombre. El probe guardó `kcal:-100,p:-10` como consumido.

**Resultado:** parseo numérico explícito y validación antes de cualquier mutación del registro o favoritas. Descripción, valores finitos no negativos y límites de cantidad documentados; validar decimales con coma/punto sin truncar. No exigir que kcal sea exactamente 4/4/9: no todos los alimentos cumplen esa identidad.

Implementar «Solo conozco las calorías» como modo explícito: kcal válida, macros no informados como desconocidos y totales de macros identificados como parciales. En el modo completo se exigen los cuatro campos. Un cero escrito es válido y diferente de un campo vacío. Registros antiguos conservan sus valores; no reinterpretar sus ceros automáticamente.

**Casos:** negativos, vacío, texto no numérico, infinito en entrada programática, 0 explícito válido, decimales locales, doble envío y guardado en favoritas. Un error conserva formulario/estado y no modifica día, perfil ni cola.

### REQ-270 · Origen y snapshot nutricional persistidos

**Problema:** los números de una receta, una entrada manual y una estimación acaban guardados como nombre y totales; las notas de estimación son temporales. `saveEditor`, `applyEstimatedMacros`, `mealMacrosEntry`, `perPortion` y `normalizedSavedMeals` son rutas a cubrir, no solo el editor visible.

**Resultado:** persistir origen, referencia/versionado cuando existan, base utilizada y cantidad/porción. Mostrar origen en detalle y supuestos de estimación disponibles. Una corrección manual queda como tal sin borrar la base que explica el cálculo. Solo guardar datos realmente conocidos: los registros viejos se leen como legacy/sin origen conocido, sin reescribirlos automáticamente.

**Casos:** guardar/reabrir/sincronizar, corregir cantidad, favorita/reciente con ×2, editar fuente tras consumir, cuenta A→B y merge offline. Valores visibles e históricos permanecen iguales en la migración de lectura. No conservar imagen ni prompts completos.

### REQ-271 · Editor de ingredientes con cantidades reales

**Problema observado:** `addFoodToEditor()` redondea 33,5 a 34 g, concatena nombres y suma a campos; el registro pierde las líneas. No permite quitar/corregir una línea sin rehacer cuentas.

**Resultado:** lista de componentes con snapshot por 100 g, gramos decimales, editar/quitar/añadir y total recalculado. Conservar precisión interna y redondear para mostrar, no después de cada suma. Integrar esas líneas en `mealRecipe()`/compras cuando el consumo o plan las posee, sin extraer ingredientes de texto legacy.

**Casos:** 33,5 g + 0,5 g, mismo alimento dos veces, quitar componente, ingrediente no disponible al reabrir, base crudo/cocido, receta aplicada y gramos cambiados, editor de una entrada antigua sin líneas. Registrar no debe editar ni añadir elementos al catálogo global.

### REQ-272 · Registrar claramente una sustitución o un adicional

**Problema:** `openEditor('extra')` siempre suma un extra consumido; reemplazar exige otra ruta en la tarjeta. La intención de «comí esto en lugar del almuerzo» no tiene una acción explícita en el registro general.

**Resultado:** elegir «Además de lo previsto» o «En lugar de…», identificar fecha/comida y mostrar impacto. Confirmar la sustitución y su estado de consumo; modificar solo esa comida. Si ya tenía consumo, explicar que se está corrigiendo. Conservar historial/metadata y una opción de deshacer el cambio propio sin borrar modificaciones posteriores.

**Casos:** comida pendiente/hecha/saltada, adicional que mantiene el plan, cancelar, fecha equivocada, reintento de red y deshacer. El total cambia exactamente una vez. Ni sustitución ni copiar prescriben compensaciones agresivas ni regeneran automáticamente toda la semana.

### REQ-273 · Copiar comidas/día con control del destino

**Referencia:** artículos oficiales de copia entre días y Multi-Day Logging. En Evolv hay recientes y propagación de una alternativa, pero no un flujo general de copiar selección/día con preview.

**Resultado:** seleccionar una comida o las entradas del día y copiar a una fecha dentro del ciclo actual. Preview de selección, cantidad y modo adicional/sustitución. Mantener el origen intacto, generar identidades nuevas y conservar procedencia. La fecha futura siempre queda planificada/no consumida; hoy o pasado requiere elegir explícitamente si se consumió. No copiar `done`/saltado por accidente.

**Casos:** origen vacío, destino con datos, cancelación, misma fecha, parcial de red y reintento, copiar receta antigua y editarla después. Nueva copia no debe aparecer en adherencia/racha hasta consumirse. La primera entrega es una fecha destino: registro múltiple de siete días/undo de lotes se deja para otro REQ y no bloquea este.

### REQ-274 · Alimentos privados desde la etiqueta

**Referencia:** MFP ofrece alimentos propios aun en Free; su ayuda propone crearlos cuando falta el producto o su porción. Evolv solo guarda comidas favoritas totales y consulta `DB.ingredients`, sin una ficha privada de producto reutilizable por gramos/porción.

**Resultado:** biblioteca privada persistida con nombre, marca opcional, unidad base (100 g/100 ml/porción declarada), nutrientes y equivalencia de porción solo cuando se conoce. Límite inicial: 100 fichas por cuenta, nombres hasta 160 caracteres; validar payload antes de guardar. Ampliar el buscador existente, no crear otro duplicado. Etiquetar el dato como introducido por el usuario.

**Casos:** yogur por 125 g, bebida por 100 ml, alimento por una unidad sin peso conocido (no convertir a gramos), variantes de marca, edición tras registrar, otro dispositivo, offline, conflicto y cuenta A→B. No sobrescribir globalmente ingredientes ni afirmar que una marca es segura para alergias. El alta se puede completar manualmente sin OCR/proveedor.

### REQ-275 · Recetas propias con rendimiento y porciones

**Referencia:** MFP suma ingredientes y divide entre porciones, con rendimiento indicado por el usuario. En Evolv existen recetas curadas, no una biblioteca privada de recetas de cocina con rendimiento editable.

**Resultado:** hasta 50 recetas privadas con hasta 30 líneas de ingredientes del catálogo o alimentos propios, pasos opcionales, rendimiento positivo por número de porciones y/o peso final aportado. Registrar una fracción conserva snapshot de la versión y cantidad. Separar guardar receta de consumirla. No inferir automáticamente rendimiento cocido de ingredientes crudos.

**Casos:** receta de cuatro porciones registrar 1/4, pesar resultado y registrar 150 g, cambiar rendimiento tras cocinar sin reescribir consumos pasados, editar ingrediente, eliminar receta con historia, ausencia de datos y sincronización. Un cambio futuro crea nueva versión; la receta no entra automáticamente al solver público ni se comparte con otras cuentas.

### REQ-276 · Código de producto y escaneo progresivo

**Referencia:** MFP usa Barcode Scanner para identificar un producto, pero documenta faltantes y emparejamientos erróneos; exige confirmar cantidad. No se necesita contratar un catálogo externo para empezar con productos propios.

**Resultado:** asociar GTIN a ficha propia, buscar por código escrito y, cuando `BarcodeDetector` y cámara segura lo permitan, capturarlo. Validar formato/dígito de control de GTIN-8/12/13/14, conservar ceros e identidad de presentación, pedir confirmación de etiqueta/cantidad y mantener correcciones privadas. Sin llamada externa, librería runtime nueva ni fallback de nutrientes inventados.

**Casos:** código válido/desconocido/erróneo, sin cámara o permiso, navegador sin `BarcodeDetector` (incluido el caso de iOS), varios códigos, cancelación, misma marca en otro tamaño y offline. En dispositivos sin lector, entrada manual completa sin callejón sin salida; no anunciar escaneo universal. Un código desconocido ofrece alta manual, nunca registro automático. Un catálogo externo o lector compatible con todos los navegadores será una ampliación separada.

## Definition of ready y cierre

Cada REQ tiene problema, objetivo, alcance, exclusiones, riesgo, aceptación y verificación en el ledger. Los nueve pueden resolverse con los servicios y patrones actuales. El agente debe confirmar de nuevo su necesidad al tomarlo, implementar uno por vez y adjuntar evidencia de sus casos, sin pedir entrevistas como condición.

Se valida con fixtures de alimentos/porciones, pruebas puras de cálculo, E2E de tarea, RLS ya existente, dos cuentas, offline/reintento y móvil/escritorio. Para cámara, los tests de capacidad/permiso deben acompañarse de límites declarados; una simulación no se presenta como una prueba física en iPhone. Estas pruebas justifican funcionamiento y menor trabajo de interacción; no prueban retención, demanda ni resultados clínicos. Métricas pasivas futuras son observación opcional posterior, no una puerta que impida implementar.
