# Diagnostico de arquitectura: generacion de dieta

Fecha: 2026-07-04

## Resumen

Los bugs reportados en la generacion de dieta no parecen ser fallos aislados de prompt. La causa principal es arquitectonica: la app todavia permite que el modelo externo proponga comidas, gramos y distribucion diaria, y luego acepta resultados con tolerancias nutricionales amplias. Para que la dieta sea confiable, Fitbros debe tratar al motor nutricional determinista como unica autoridad de aplicacion: el modelo puede proponer variedad, pero el sistema debe cerrar macros, gramajes, restricciones y adecuacion por momento del dia antes de guardar cualquier plan.

## Bugs reportados

1. Ingredientes no gustados ignorados:
   - El usuario especifico tofu en `dislikedIngredients`.
   - El plan sigue sugiriendo tofu.
   - El filtro debe ser bloqueo duro en todos los caminos: dia, semana, otra opcion, reemplazos, fallback determinista, cache/pool y ejemplos del prompt.

2. Dieta vegetariana por defecto:
   - El usuario no selecciono vegetariano ni vegano.
   - La app tiende a sugerir comidas sin proteinas animales.
   - El patron omnivoro debe ser activo, no solo ausencia de veto vegetariano.

3. Macros incompletos o inexactos:
   - Los planes pueden quedar lejos de los macros del usuario.
   - Las porciones no siempre se ajustan por pesos/gramajes reales.
   - El contrato actual permite desviaciones demasiado amplias.

4. Platos inadecuados por momento del dia:
   - Se sugieren platos demasiado contundentes para desayuno.
   - Falta una regla fuerte de adecuacion por slot y carga de comida.

## Hallazgos tecnicos

### Modelo actual

La app usa por defecto `claude-haiku-4-5-20251001`.

Referencias internas:

- `/Users/jonathan/Fitbud/api/claude.js`: `ALLOWED_MODELS` permite `claude-haiku-4-5-20251001` y `claude-sonnet-4-6`.
- `/Users/jonathan/Fitbud/api/claude.js`: `DEFAULT_MODEL` es `claude-haiku-4-5-20251001`.
- `/Users/jonathan/Fitbud/config.js` y `/Users/jonathan/Fitbud/api/config.js` tambien exponen Haiku 4.5 como default.

Sonnet 5 existe oficialmente como `claude-sonnet-5`, pero hoy no esta en la whitelist del backend. Migrar a Sonnet 5 puede mejorar calidad de sugerencias, pero no resuelve por si solo el cumplimiento exacto de macros. El fix principal debe ser determinista.

Referencias externas:

- https://platform.claude.com/docs/en/about-claude/models/overview
- https://platform.claude.com/docs/en/about-claude/models/whats-new-sonnet-5
- https://platform.claude.com/docs/en/about-claude/pricing

### Prompt y contexto

El prompt de dieta ya intenta corregir parte de los problemas:

- Incluye una linea para no sugerir ingredientes bloqueados.
- Incluye una linea explicita para patron omnivoro.
- Pide ajustar gramajes y verificar totales.

Pero hay contradicciones:

- `buildSysPrompt()` dice que los ingredientes no preferidos son preferencias blandas.
- `generateOneDay()` intenta tratarlos como restriccion dura.
- El bloque de proteina alta incluye ejemplos como tofu, incluso si tofu esta bloqueado por el usuario.

Esto aumenta la probabilidad de que el modelo reintroduzca ingredientes no gustados.

### Validacion actual de macros

El contrato actual es laxo:

- `validateGeneratedDay()` acepta kcal dentro de +/-15%.
- Acepta proteina desde 85% de la meta.
- `validateDayTotals()` en el dominio nutricional usa tolerancias equivalentes.
- `validateNutritionPlanSnapshot()` permite desviaciones de kcal de hasta 20% en snapshot.
- Los tests actuales validan esas tolerancias, no exactitud de macros.

Para la promesa de producto "exacto a los macros", esas tolerancias son insuficientes.

### Servidor

`api/claude.js` valida estructura, slots y restricciones, pero no cierra macros. El propio comentario de `validateDietDay()` indica que la tolerancia de macros se valida en cliente para mejor UX. Eso deja pasar respuestas que son estructuralmente validas pero nutricionalmente flojas.

### Solver determinista

Ya existe una base valiosa:

- `planDeterministicNutritionDay()`
- `solveDishPortion()`
- `mealSlotTargets()`
- `compatibleDishesForSlot()`
- `planNutritionWeek()`
- `recalcCoachMealMacros()`

El problema es que el solver todavia opera principalmente por plato/slot y con tolerancias amplias. Falta una pasada global que cierre el dia completo contra kcal, proteina, carbohidratos y grasa.

### Catalogo

El catalogo ya tiene metadata importante:

- `compatible_slots`
- `diet_tags`
- `prep_minutes`
- `budget_tier`
- `needs_kitchen`
- `eat_out_ok`
- `protein_density`
- `scalable`, `min_g`, `max_g`, `step_g`

Falta metadata especifica para adecuacion por momento del dia, por ejemplo:

- `meal_weight`: light, medium, heavy
- `meal_form`: bowl, sandwich, shake, plated, soup, snack
- limites por slot de kcal/volumen

Sin eso, un plato puede ser tecnicamente compatible con macros pero mala experiencia para desayuno.

## Propuesta de fix definitivo

### 1. Hacer al motor nutricional la unica autoridad

Claude no debe ser autoridad de macros ni gramajes finales. El flujo recomendado:

1. Claude propone nombres o ideas, opcionalmente.
2. Fitbros mapea contra catalogo.
3. Fitbros resuelve gramajes.
4. Fitbros recalcula macros desde ingredientes reales.
5. Fitbros valida restricciones, slots y tolerancias estrictas.
6. Solo entonces se aplica o versiona el plan.

Si algo no pasa, se descarta la propuesta y se usa ruta determinista.

### 2. Crear `finalizeNutritionDay()`

Nuevo contrato puro en `js/nutrition-domain.js`:

- Entrada: target diario, prefs, slots, catalogo, propuestas opcionales.
- Salida: dia aplicable o `no_solution` con causa medible.
- Responsabilidad:
  - filtrar restricciones duras, disgustos y platos bloqueados;
  - seleccionar platos compatibles;
  - resolver porciones;
  - correr ajuste global del dia;
  - agregar snack/complemento solo si hace falta;
  - devolver totales finales y residual.

Este contrato debe ser usado por:

- onboarding/primera semana;
- preparar dia;
- preparar semana;
- regenerar comida;
- reemplazos;
- fallback por cuota o error.

### 3. Endurecer tolerancias

Propuesta inicial:

- kcal: +/-3% o +/-50 kcal, lo que sea mayor.
- proteina: +/-5 g, no solo minimo de 85%.
- carbohidratos y grasa: +/-8 g o tolerancia porcentual pequena.
- Si el catalogo no puede cerrar exacto, mostrar accion concreta: ajustar porciones, agregar complemento o informar limitacion del catalogo.

La regla importante: nada claramente fuera de macros se aplica como plan valido.

### 4. Ajuste global del dia

Despues de elegir platos por slot, hacer una pasada global que ajuste ingredientes escalables en todo el dia:

- proteinas magras para cerrar proteina;
- carbohidratos base para cerrar carbos;
- grasas densas para cerrar grasa/kcal;
- limites `min_g`, `max_g`, `step_g` para evitar porciones absurdas;
- no tocar comidas ya registradas.

Si el residual no se puede cerrar, devolver `no_solution` o sugerir complemento aplicable.

### 5. Disgustos como bloqueo duro

`dislikedIngredients` debe tratarse como restriccion obligatoria para generacion futura. Debe aplicar a:

- `compatibleDishesForSlot()`;
- prompt;
- fallback;
- cache context key;
- pool reutilizado;
- validacion del servidor;
- tests.

Tambien se deben limpiar ejemplos del prompt: si tofu esta bloqueado, nunca debe aparecer en instrucciones ni ejemplos.

### 6. Omnivoro activo

Para usuarios con `diet: ["omnivoro"]`:

- no bloquear platos vegetarianos;
- pero exigir diversidad omnivora si no hay preferencias contrarias:
  - al menos 1 comida con proteina animal al dia, o
  - minimo semanal de comidas con pollo, carne, huevo, pescado o lacteo alto en proteina.

Si el usuario marca disgustos contra proteinas animales, esa preferencia puede relajar la regla.

### 7. Momento del dia

Agregar metadata y reglas de slot:

- desayuno: light/medium, preparacion simple, limite relativo de kcal salvo que sea comida principal;
- almuerzo/cena: medium/heavy permitidos;
- snacks/merienda/recena: light, porciones pequenas;
- entrenamiento puede mover carbohidratos, pero sin romper tipo de comida.

Esto evita desayunos demasiado contundentes aunque el total diario cierre.

### 8. Sonnet 5 como mejora secundaria

Agregar `claude-sonnet-5` a la whitelist puede ser positivo para:

- mejor variedad;
- mejor interpretacion de preferencias;
- menos contradicciones;
- mejor adherencia al formato.

Pero debe quedar detras del contrato determinista. La migracion debe revisar:

- `ALLOWED_MODELS`;
- `DEFAULT_MODEL` o seleccion por accion;
- costos;
- `max_tokens`;
- prompt cache/context key;
- pruebas de quota/costo.

## Orden recomendado de implementacion

1. REQ A: Contrato estricto de aplicabilidad nutricional.
   - Endurecer tolerancias.
   - Bloquear aplicacion de dias fuera de macros.
   - Actualizar tests para exactitud.

2. REQ B: `finalizeNutritionDay()` y ajuste global de porciones.
   - Solver de dia completo.
   - Macro closers.
   - No tocar comidas hechas.

3. REQ C: Preferencias duras y omnivoro activo.
   - `dislikedIngredients` como bloqueo absoluto.
   - Limpiar contradicciones del prompt.
   - Regla de proteina animal para omnivoro.

4. REQ D: Semantica de momento del dia.
   - Agregar metadata de contundencia/forma.
   - Filtrar y validar por slot.

5. REQ E: Migracion opcional a Sonnet 5.
   - Whitelist, config, costos y pruebas.
   - Mantener Haiku para flujos baratos si el determinista cubre macros.

## Criterios de aceptacion sugeridos

- Si el usuario pone `tofu` en `dislikedIngredients`, ningun flujo futuro sugiere tofu.
- Un usuario omnivoro recibe proteina animal en el plan salvo preferencia contraria explicita.
- Ningun plan se aplica si no queda dentro de tolerancias estrictas de kcal, proteina, carbos y grasa.
- Los gramos finales vienen del solver y se recalculan desde ingredientes del catalogo.
- Desayuno no recibe platos marcados como contundentes o de almuerzo/cena.
- Si no hay solucion con el catalogo actual, la app muestra una alternativa clara sin inventar macros.
- Sonnet 5 puede estar disponible, pero el plan sigue siendo valido aunque el modelo falle.

## Archivos revisados

- `/Users/jonathan/Fitbud/index.html`
- `/Users/jonathan/Fitbud/api/claude.js`
- `/Users/jonathan/Fitbud/js/nutrition-domain.js`
- `/Users/jonathan/Fitbud/domain-contracts.js`
- `/Users/jonathan/Fitbud/supabase/schema.sql`
- `/Users/jonathan/Fitbud/supabase/nutrition_catalog_semantics.sql`
- `/Users/jonathan/Fitbud/scripts/validate-nutrition-solver.mjs`
- `/Users/jonathan/Fitbud/scripts/validate-nutrition-week-planner.mjs`
- `/Users/jonathan/Fitbud/scripts/validate-first-day-preferences.mjs`
- `/Users/jonathan/Fitbud/scripts/test-coach-quota.mjs`
