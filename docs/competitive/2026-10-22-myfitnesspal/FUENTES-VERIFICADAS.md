# Fuentes oficiales verificadas y contraste actual

**24 de octubre de 2026 · Sustituye el bloqueo de acceso registrado el 22 de octubre para las fuentes consultadas.**

Se leyeron catorce artículos mediante GET público de la API oficial de ayuda de MyFitnessPal. El fetch de GitHub confirmó `origin/main` en `62c7860`; el entorno requirió habilitar la ejecución con red para alcanzar el proxy. No se inició sesión en MFP, contrató un plan ni probó su app nativa. Las funciones y límites siguientes están documentados por el fabricante; no son una medición de usabilidad o una garantía comercial por país.

## Hallazgos que sí cambian el plan

- MFP ya ofrece planificación, sustituciones y compras en Premium+. Su ayuda enumera seis países (sin Perú), exige inglés y dice que el planner no está disponible en web. Evolv puede diferenciarse por ejecución en español y contexto local, sin afirmar que MFP solo registra.
- Free ya incluye alimentos/comidas/recetas propios y consulta de nutrientes; Premium añade otras herramientas, entre ellas escáner, copia multifecha y rutinas. No asumir que todo eso es una brecha pendiente de Evolv.
- Copia entre días y recetas con rendimiento son capacidades documentadas que faltan como flujos completos en Evolv revisado.
- La documentación de MFP advierte que un código puede faltar o apuntar al alimento equivocado; una cámara sin base fiable no resuelve el problema. Por eso el primer código de Evolv se vincula a productos privados introducidos por etiqueta.
- Meal Scan y Voice Logging tienen requisitos de idioma/plataforma. En ambos se revisa el resultado antes de registrar. No se declara una precisión comparativa a partir de estos textos.

## Registro por artículo

### S01 · The difference between Free, Premium, and Premium +

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/34889191368077-The-difference-between-Free-Premium-and-Premium) · Actualización declarada: `2026-10-15T12:57:53Z` · Consulta: 24 oct 2026 (America/Lima).

La tabla oficial distingue registro gratuito, herramientas Premium y planificación/compras Premium+. Incluye Workout Routines dentro de Premium; no permite asumir que MFP carece de rutinas.

### S02 · What is included in the free version?

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/15457546881805-What-is-included-in-the-free-version) · Actualización declarada: `2026-09-06T19:49:09Z` · Consulta: 24 oct 2026 (America/Lima).

La versión gratuita permite registro, creación de alimentos/comidas/recetas y consulta nutricional; no es correcto atribuir todo el análisis nutricional exclusivamente a Premium.

### S03 · Premium+

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/34347930588557-Premium) · Actualización declarada: `2026-09-20T10:57:47Z` · Consulta: 24 oct 2026 (America/Lima).

Premium+ incorpora planificación y compras. El artículo enumera Estados Unidos, Reino Unido, Canadá, Irlanda, Nueva Zelanda y Australia; no incluye Perú. Las funciones se describen para las apps móviles.

### S04 · How to use the Meal Planner

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/34603055097869-How-to-use-the-Meal-Planner) · Actualización declarada: `2026-10-01T22:03:27Z` · Consulta: 24 oct 2026 (America/Lima).

Meal Planner documenta planes de 2 a 15 días, sustituciones, alimentos que ya se tienen, porciones del hogar y compras. Exige inglés, versión mínima y países enumerados; no está en la web.

### S05 · How do I copy a meal from one day to another?

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/360032622131-How-do-I-copy-a-meal-from-one-day-to-another) · Actualización declarada: `2026-10-04T21:41:50Z` · Consulta: 24 oct 2026 (America/Lima).

La ayuda documenta copiar alimentos y comidas entre fechas en web, iOS y Android.

### S06 · Multi-Day Logging with MyFitnessPal Premium

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/33535658002061-Multi-Day-Logging-with-MyFitnessPal-Premium) · Actualización declarada: `2026-09-16T21:25:33Z` · Consulta: 24 oct 2026 (America/Lima).

Multi-Day Logging es Premium/Premium+ en apps móviles, hasta siete días. No soporta My Meals y no ofrece deshacer de todo el lote.

### S07 · How to create and find your recipes

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/360032271452-How-to-create-and-find-your-recipes) · Actualización declarada: `2026-09-29T20:26:49Z` · Consulta: 24 oct 2026 (America/Lima).

Las recetas guardan ingredientes y rendimiento; los nutrientes se suman y dividen entre porciones. Crear manualmente funciona en web y móvil; importar web exige inglés.

### S08 · Can the recipe feature calculate the number of servings produced?

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/360032622191-Can-the-recipe-feature-calculate-the-number-of-servings-produced) · Actualización declarada: `2026-09-05T15:34:39Z` · Consulta: 24 oct 2026 (America/Lima).

El rendimiento no se puede deducir automáticamente de una mezcla de medidas; debe indicarlo el usuario y corregirlo tras cocinar si corresponde.

### S09 · How to use the Barcode Scanner

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/360032624771-How-to-use-the-Barcode-Scanner) · Actualización declarada: `2026-10-15T15:50:13Z` · Consulta: 24 oct 2026 (America/Lima).

Barcode Scanner se describe como Premium para apps móviles; pide cámara trasera, confirmar cantidad y permite crear alimento desde la etiqueta si falta el producto.

### S10 · The barcode scanner returned the wrong item

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/360032270912-The-barcode-scanner-returned-the-wrong-item) · Actualización declarada: `2026-10-01T17:23:03Z` · Consulta: 24 oct 2026 (America/Lima).

La corrección de un emparejamiento de código se describe como cambio global para otros usuarios; para Evolv se propone corrección privada sin contaminar catálogo compartido.

### S11 · How the Recent and Frequent lists work.

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/360032622071-How-the-Recent-and-Frequent-lists-work) · Actualización declarada: `2026-09-28T20:51:55Z` · Consulta: 24 oct 2026 (America/Lima).

Recientes/frecuentes se construyen desde registros; ocultar una entrada de esas listas no elimina el alimento de la base.

### S12 · What to do if the serving size you need isn't available

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/360032272852-What-to-do-if-the-serving-size-you-need-isn-t-available) · Actualización declarada: `2026-09-24T20:53:51Z` · Consulta: 24 oct 2026 (America/Lima).

Las porciones dependen de las unidades de la entrada. Se documentan decimales, unidades alternativas y crear alimento propio; no toda entrada admite conversión universal.

### S13 · How to use the Meal Scanner

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/360045761612-How-to-use-the-Meal-Scanner) · Actualización declarada: `2026-09-16T18:08:57Z` · Consulta: 24 oct 2026 (America/Lima).

Meal Scan es Premium, en inglés y apps con requisitos de OS/versión. El usuario revisa sugerencias y porciones, y puede añadir alimentos no detectados antes de registrar.

### S14 · How to log food with your voice

[Artículo oficial](https://support.myfitnesspal.com/hc/en-us/articles/30332897072269-How-to-log-food-with-your-voice) · Actualización declarada: `2026-09-21T21:25:13Z` · Consulta: 24 oct 2026 (America/Lima).

Voice Logging es Premium en inglés y apps móviles, con revisión por alimento. No admite entradas personales My Foods/Recipes/Meals ni funciona offline.

## Evidencia de Evolv

- Seis E2E: tres de comidas guardadas, dos de compras y uno de confirmación de correo. Pasaron sin reintentos con Chromium de sistema y fixtures. [Resumen](evidence/2026-10-24/baseline-checks.json).
- Tres reproducciones con datos ficticios: valores negativos aceptados, ingredientes reducidos a texto/totales y plantilla genérica de estimación aplicada. [Resultados](evidence/2026-10-24/probes.json).
- Las dos primeras reproducen directamente comportamientos del cliente. La tercera simula la respuesta reutilizada con la plantilla que existe en código; demuestra el efecto y la ruta posible, no su frecuencia en producción.
- `verify-current.mjs` conserva el recorrido. Requiere servidor local 8923 y Chromium; no altera datos de producción.

La matriz original y las capturas del 22 de octubre quedan como histórico. La [matriz actualizada](matriz-actualizada-2026-10-24.csv) distingue lo documentado en MFP, lo confirmado en Evolv y lo todavía no verificado. No se usan entrevistas ni reclutamiento como dependencia de los requerimientos.

En la matriz actualizada, `iniciativas` conserva la trazabilidad MFP original; **solo `req_autorizados` identifica trabajo nuevo aprobado**. Las filas no revalidadas permanecen históricas y no se convierten automáticamente en requerimientos.
