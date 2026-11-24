# Nutrición: primero entender cómo comes — REQ-404..407

Solicitud de Jonathan del 16 de noviembre de 2026: «Las dietas se deberían generar en base a lo que comes. Cuando recién comienzas, en vez de sugerirte de frente una dieta, durante unos tres o cinco días recopilamos cuáles son tus comidas diarias. Le avisamos antes al usuario. Luego analizamos qué come y le sugerimos algunos cambios. Eso siempre lo deberíamos hacer».

Estado: REQ-404 implementado; REQ-405..407 pendientes. Decisiones cerradas por Jonathan el 16 de noviembre de 2026. Cada REQ es una implementación y un commit. Orden obligatorio: REQ-404 → 405 → 406 → 407.

## Qué pasa hoy

- Al terminar el onboarding, `saveOnboarding()` llama a `prepareFirstCycleWeek()` (`app/index.html:4482`), que prepara de inmediato las comidas de la primera semana con `prepareFirstWeekNutrition()` (`app/index.html:4320`). El usuario recibe un menú antes de haber registrado una sola comida.
- Ese menú sale del catálogo y de las preferencias declaradas (patrón, alergias, cocina, nivel de cocina). No usa lo que la persona come de verdad.
- Las comidas habituales (REQ-360, `docs/habitual-meals.md`) recién se aprenden con 7 días registrados y 3 días en meta, y solo para platos del catálogo (`HABIT_RULES`, `js/nutrition-domain.js:748`). Un usuario nuevo no cumple ninguna de esas condiciones.

## Qué cambia

El primer menú deja de ser lo primero. Un usuario nuevo pasa por tres momentos:

1. **Tus primeros días (REQ-404).** Registra lo que come, sin menú sugerido.
2. **Así comes (REQ-405).** Ve un resumen de esos días y hasta tres cambios concretos.
3. **Tu menú (REQ-406 y 407).** El primer menú parte de sus propias comidas, con los cambios que aceptó.

Es el comportamiento por defecto de toda cuenta nueva. No es un experimento ni depende de una bandera.

## 1. Tus primeros días — REQ-404

### Aviso

Aparece una sola vez, al terminar el onboarding y antes de entrar a Hoy. Texto base:

> **Primero queremos conocerte**
> Antes de sugerirte platos para llegar a tus macros, queremos entender cómo es tu día a día. Durante los próximos 3 a 5 días registra cada una de tus comidas, tal como comes hoy. Con eso vemos qué comes y te proponemos algunos cambios.
>
> [Empezar a registrar]

El mismo texto resumido queda en la tarjeta de Nutrición mientras dure el periodo. El aviso no menciona tecnología (REQ-31) ni promete resultados.

### Estado

`profiles.prefs.nutritionIntake`, privado por usuario como el resto de `prefs`, sin SQL:

```json
{"version":1,"status":"observing","startedAt":"2026-11-17","endedAt":null,"cycle":1}
```

`status`: `observing` → `review` → `done`, o `skipped`. El avance no se guarda: se calcula desde `day_log`.

### Reglas

- **Día completo:** tiene al menos 2 comidas registradas y las kcal registradas llegan al 40 % de la meta. Evita contar un día en que solo se anotó un café.
- **Mínimo 3 días completos.** Al tercero se ofrece: «Ya tenemos 3 días. ¿Vemos tu resumen o registras 2 días más para afinar?». Con 5 días completos el resumen queda listo sin preguntar.
- **Tope de 7 días calendario** desde `startedAt`. Si ese día hay al menos 1 día completo, se ofrece el resumen con lo que hay. Si no hay ninguno, se ofrece preparar el menú de siempre. El usuario nunca queda bloqueado.
- **Sin menú durante el periodo.** `prepareFirstCycleWeek()` no prepara comidas; el entreno sí se prepara igual. La preparación automática (`maybePrepareNutritionWeek()`, REQ-349) no corre. «Preparar mi semana» no se muestra.
- **Sin presión.** La meta de macros se sigue viendo en Perfil, pero Hoy y Nutrición no muestran «te falta» ni «te pasaste» durante el periodo. Se muestra el total registrado y el avance: «Día 2 de 3».
- **Registrar es la acción principal** en Hoy y Nutrición, con el flujo existente (`openFoodRegistration()`, REQ-329/330): por alimento y gramos, recientes, favoritas, a mano o con foto.
- **Salida:** enlace discreto «Prefiero recibir un menú ya» en la tarjeta de Nutrición. Pide confirmación, marca `skipped` y prepara la semana con el flujo actual.
- **Quién entra:** cuentas que terminan su primer onboarding desde este cambio. Las cuentas existentes no entran: usan su historial (REQ-411). Un ciclo nuevo no repite el periodo si hay 3 días completos en los últimos 28.
- **Coach:** si el usuario pide ideas de comida, el coach responde como siempre. Lo que cambia es que la app no propone menú por su cuenta.

### Decisiones cerradas (Jonathan, 2026-11-16)

- **Salida «Prefiero recibir un menú ya»:** se conserva, como enlace discreto con confirmación.
- **Semana gratis (REQ-356):** el mínimo queda en 3 días. Se acepta que el primer menú llegue el día 4 de la prueba como muy pronto.
- **Metas durante el periodo:** se ocultan los avisos de «te falta / te pasaste».
- **Cuentas existentes:** no pasan por el periodo. Su menú y su rutina también deben salir de su historial y de lo que cumplen, con sugerencias de mejora: REQ-411..414, en `docs/plan-from-history.md`.

## 2. Así comes — REQ-405

Función pura `analyzeIntakeDays(history, target, slots)` en `js/nutrition-domain.js`. Se calcula en el dispositivo con los días completos del periodo. No hay llamadas pagadas.

### Resumen

- Promedio diario de kcal, proteína, carbohidratos y grasa, junto a la meta.
- Por franja: cuánto aporta y qué plato se repite (2 o más veces).
- Franjas que suele saltarse.
- Al menos una cosa que ya funciona: «Tu desayuno ya te da 30 g de proteína: se queda igual».

### Cambios sugeridos

Máximo tres, ordenados por impacto. Cada uno nombra una comida del propio usuario y un ajuste que se puede hacer mañana:

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| `add` | La proteína promedio queda por debajo del 90 % de la meta | «Suma 2 huevos a tu desayuno: +12 g de proteína» |
| `portion` | Las kcal promedio se alejan más del 10 % de la meta | «En tu almuerzo, media taza menos de arroz: −100 kcal» |
| `swap` | Un componente repetido tiene un equivalente del catálogo que acerca los macros | «Cambia la gaseosa de la cena por agua con limón» |
| `fill` | Una franja se salta 2 o más días y el día queda corto | «Agrega una merienda: yogur con fruta» |

Reglas:

- Con registro por alimento y gramos, el cambio se expresa sobre la línea concreta. Con registro a mano o por foto, se expresa sobre la porción completa.
- Mandan las restricciones del perfil (`mealPreferenceConflict()`): nunca se sugiere un alimento vetado.
- Sin culpa ni diagnóstico. No se usan palabras como «mal», «exceso» o «déficit».
- Si los días ya están en meta, no se inventan cambios: «Ya comes cerca de tu objetivo. Tu menú va a repetir lo que haces».

### Pantalla

«Así comes» (resumen) → «Lo que te proponemos» (cada cambio con Aceptar / Ahora no) → «Preparar mi menú». Nada se aplica sin confirmar. Los cambios aceptados se guardan en `nutritionIntake.accepted` con franja, tipo y plato. No se envía contenido de comidas a analytics; solo eventos sin datos de alimentos.

## 3. Tu menú parte de lo que comes — REQ-406

`learnHabitualMeals(history, {mode:"intake"})` aprende de los días completos del periodo, sin exigir días en meta ni 7 días registrados. Un plato es habitual en una franja con 2 repeticiones y la mitad de los días.

- La franja con hábito lleva ese plato en el primer menú, con la porción ajustada a la meta de la franja y el cierre del día con `globalClosePass()`.
- Los cambios aceptados en REQ-405 se aplican encima.
- Las franjas sin hábito se llenan con el catálogo, como hoy.
- Se mantiene la etiqueta «Lo que sueles comer», las restricciones y la regla de no repetir plato en el día.
- Después del primer menú sigue mandando REQ-360 con su ventana de 28 días.

Alcance de REQ-406: platos que tienen `dishSlug` del catálogo.

## 4. Tus comidas propias entran al menú — REQ-407

Lo que la gente come no siempre está en el catálogo. REQ-360 dejó fuera del motor local los platos fuera de catálogo; aquí entran.

- Una comida registrada sin `dishSlug`, repetida en su franja, se convierte en candidata con su nombre y sus valores.
- Si tiene líneas por gramos, se escalan con `lineLimits()` y `clampStep()`.
- Si solo tiene totales, se usa un multiplicador de porción de 0,5 a 1,5 en pasos de 0,25: «Tu arroz con pollo · ¾ de tu porción habitual».
- No se guarda en el catálogo compartido: vive en los registros del usuario.

## Privacidad y operación

Todo se calcula en el dispositivo. Sin tablas, migraciones, dependencias ni llamadas automáticas pagadas. Al tocar el shell, subir `CACHE_NAME`.

## Verificación

- `scripts/validate-habitual-meals.mjs`: modo `intake`, día completo, mínimos y topes.
- Script nuevo para `analyzeIntakeDays`: cada tipo de cambio, días en meta, restricciones.
- `tests/e2e/primeros-dias.spec.js` a 320, 390 y 1280 px: aviso, avance, tercer y quinto día, tope de 7 días, salida, resumen, aceptar y rechazar cambios, primer menú con hábitos y con comidas propias, recarga y cambio de cuenta.
- Regresiones: `onboarding.spec.js`, `onboarding-essential.spec.js`, `home-optional-menu.spec.js`, `nutricion-continuidad.spec.js`, `comidas-habituales.spec.js`.

## Fuera de alcance

Recordatorios específicos del periodo, pedir que entre un día de fin de semana, redacción del resumen por el coach, reabrir el periodo a mano desde Perfil y pasar a las cuentas existentes por el periodo (su camino es `docs/plan-from-history.md`).
