# Nivel de cocina por plato (REQ-254)

Fuente de verdad: `supabase/cooking_level.sql` (bloque `COOKING_LEVELS`). El canario y los validadores la leen desde ahí (`scripts/seed-catalog.mjs`).

## Criterio

| Nivel | Significa | Ejemplos |
|---|---|---|
| `none` — No cocino | Armar o calentar: ingredientes listos (legumbres en lata, arroz o quinua precocidos, pollo rostizado, atún, pavo en lonchas), tostadora o microondas. | Bowl de atún con arroz, wraps, sándwiches, yogur con fruta, batidos, ensaladas con legumbres listas. |
| `basic` — Lo básico | Un solo paso: una sartén, hervir u hornear una bandeja simple. | Pollo a la plancha con arroz, huevos revueltos, pasta con atún, tofu salteado, quesadillas, tacos con frijoles de lata. |
| `cook` — Me gusta cocinar | Recetas de varios pasos: guisos, salsas o masas caseras, sopas, rellenos, frituras. | Ají de garbanzos, tacu tacu, risotto, curry, enchiladas, falafel, ramen, seco. |

- Ante la duda entre dos niveles se elige el más exigente: es preferible que alguien que cocina reciba un plato simple a que alguien que no cocina reciba uno que no puede hacer.
- Los ingredientes que el catálogo llama «cocidos» (legumbres, arroz, quinua, camote) se asumen comprados listos o precocidos. «Papa» cruda sí implica hervir.
- `prep_minutes` se estimó por plato (antes era un valor fijo por franja). `needs_kitchen` es `false` solo para `none`.
- Platos que se agreguen después sin nivel no se excluyen para nadie; el editor admin permite clasificarlos.

## Platos nuevos

19 almuerzos y cenas `none`/`basic` (14 y 5) con ingredientes del catálogo y un ingrediente nuevo: **Pollo rostizado sin piel** (por 100 g: 165 kcal, 27 g proteína, 0 g carbohidratos, 6,5 g grasa). Son valores aproximados de pollo rostizado comercial, carne sin piel (mezcla de pechuga y pierna), según las tablas de composición USDA FoodData Central (*rotisserie chicken, meat only*).

## Impacto medido (canario `DIET_CONTRACT`, 378 días)

- Catálogo nuevo sin filtro: 288 → 311 días que cuadran.
- Con «Lo básico»: 312. Con «No cocino»: 266 en total; 245/252 con 4 y 6 comidas. Los planes de 2 comidas casi no cuadran sin cocinar, caso cubierto por el aviso de REQ-143.
