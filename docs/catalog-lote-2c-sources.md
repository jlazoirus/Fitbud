# Catalogo lote 2C - fuentes nutricionales

REQ-141 cierra la meta final de profundidad del REQ-136 original: 38
ingredientes y 35 platos nuevos para llegar a 200 ingredientes / 180 platos.
El foco es (a) opciones explicitas sin lacteos y sin gluten, (b) mas
proteinas animales/vegetales para variar los platos de alta proteina sin
depender de proteina en polvo, y (c) profundidad adicional por cocina
(criolla, mediterranea, mexicana, asiatica). Los valores son aproximaciones
por 100 g para planificacion, no etiquetado legal. Cuando un producto depende
de marca o preparacion comercial, el valor se tomo como promedio de etiquetas
comerciales; para alimentos genericos se uso una tabla publica tipo
USDA/FoodData Central como referencia de revision humana.

| Ingrediente | Fuente de referencia |
|---|---|
| Chuleta de cerdo | Tabla publica tipo USDA/FoodData Central |
| Costilla de res | Tabla publica tipo USDA/FoodData Central |
| Mejillones cocidos | Tabla publica tipo USDA/FoodData Central |
| Calamar cocido | Tabla publica tipo USDA/FoodData Central |
| Anchoas en aceite | Etiqueta comercial promedio |
| Jamón serrano | Etiqueta comercial promedio |
| Chorizo criollo | Etiqueta comercial promedio |
| Pollo molido | Tabla publica tipo USDA/FoodData Central |
| Leche de almendra sin azúcar | Etiqueta comercial promedio |
| Bebida de coco sin azúcar | Etiqueta comercial promedio |
| Yogur de coco natural | Etiqueta comercial promedio |
| Yogur de almendra natural | Etiqueta comercial promedio |
| Queso vegano rallado | Etiqueta comercial promedio |
| Levadura nutricional | Etiqueta comercial promedio |
| Harina de almendra | Tabla publica tipo USDA/FoodData Central |
| Harina de arroz | Tabla publica tipo USDA/FoodData Central |
| Harina de garbanzo | Tabla publica tipo USDA/FoodData Central |
| Trigo sarraceno cocido | Tabla publica tipo USDA/FoodData Central |
| Amaranto cocido | Tabla publica tipo USDA/FoodData Central |
| Pan sin gluten multigrano | Etiqueta comercial promedio |
| Pasta de maíz cocida | Etiqueta comercial promedio |
| Alcachofa cocida | Tabla publica tipo USDA/FoodData Central |
| Berros | Tabla publica tipo USDA/FoodData Central |
| Hongos portobello | Tabla publica tipo USDA/FoodData Central |
| Coles de Bruselas | Tabla publica tipo USDA/FoodData Central |
| Tomatillo | Tabla publica tipo USDA/FoodData Central |
| Nopal | Tabla publica tipo USDA/FoodData Central |
| Chipotle en adobo | Etiqueta comercial promedio |
| Ají panca | Etiqueta comercial promedio de pasta/puré |
| Rocoto | Etiqueta comercial promedio de pasta/puré |
| Huacatay | Tabla publica tipo USDA/FoodData Central |
| Aceitunas kalamata | Tabla publica tipo USDA/FoodData Central |
| Semillas de cáñamo | Tabla publica tipo USDA/FoodData Central |
| Crema agria light | Etiqueta comercial promedio |
| Maracuyá | Tabla publica tipo USDA/FoodData Central |
| Lúcuma | Tabla publica tipo USDA/FoodData Central |
| Camu camu | Tabla publica tipo USDA/FoodData Central |
| Papaya | Tabla publica tipo USDA/FoodData Central |

## Escenarios cubiertos

- **Sin lácteos explícito**: leche/yogur/queso de almendra y coco, bebida de
  coco, queso vegano y levadura nutricional habilitan desayunos, snacks y
  cenas veganas sin ingredientes de categoría `Lácteo` (p. ej. "Bowl de papaya
  y maracuyá con yogur de coco", "Tofu con hongos portobello y salsa de
  soya").
- **Sin gluten explícito**: harinas de almendra/arroz/garbanzo, trigo
  sarraceno, amaranto, pan sin gluten multigrano y pasta de maíz permiten
  platos como "Panqueques de harina de almendra y arroz" o "Tostadas sin
  gluten con palta y huevo" sin depender de trigo/cebada/centeno.
- **Profundidad por cocina**: nuevas proteínas (costilla, chuleta, mejillones,
  calamar, anchoas, jamón serrano, chorizo, pollo molido) y condimentos
  regionales (ají panca, rocoto, huacatay, tomatillo, chipotle) amplían
  criolla, mediterránea, mexicana y asiática sin reemplazar los lotes previos.

`scripts/validate-nutrition-catalog.mjs` estima cobertura de "sin lácteos" y
"sin gluten" por categoría de ingrediente y por una lista explícita de
ingredientes con gluten conocido (`GLUTEN_INGREDIENTS`); es una heurística de
composición de catálogo para dimensionar REQ-137, no una certificación de
alérgenos ni el filtrado real de restricciones del usuario (eso vive en
`js/nutrition-domain.js` y se aplica sobre las preferencias declaradas en el
perfil, no sobre esta estimación).
