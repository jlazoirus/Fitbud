# Catalogo lote 2B - fuentes nutricionales

REQ-140 amplio el catalogo local con 41 ingredientes y 45 platos nuevos para
dar profundidad por cocina (criolla, mediterranea, mexicana, asiatica) en
desayuno/snack/plato principal, y mas opciones sin cocina, aptas para comer
fuera, de bajo presupuesto y de alta proteina sin depender de proteina en
polvo. Los valores son aproximaciones por 100 g para planificacion, no
etiquetado legal. Cuando un producto depende de marca o preparacion comercial
(salsas, quesos frescos regionales, pastas de condimento), el valor se tomo
como promedio de etiquetas comerciales; para alimentos genericos se uso una
tabla publica tipo USDA/FoodData Central como referencia de revision humana.

| Ingrediente | Fuente de referencia |
|---|---|
| Cancha serrana | Etiqueta comercial promedio de maiz tostado |
| Ají amarillo | Etiqueta comercial promedio de pasta/puré |
| Queso feta | Tabla publica tipo USDA/FoodData Central |
| Salsa de soya | Etiqueta comercial promedio |
| Jengibre | Tabla publica tipo USDA/FoodData Central |
| Ajonjolí | Tabla publica tipo USDA/FoodData Central |
| Pasta de miso | Etiqueta comercial promedio |
| Salsa teriyaki | Etiqueta comercial promedio |
| Salsa de tomate natural | Tabla publica tipo USDA/FoodData Central |
| Pepinillos encurtidos | Etiqueta comercial promedio |
| Chile jalapeño | Tabla publica tipo USDA/FoodData Central |
| Cilantro | Tabla publica tipo USDA/FoodData Central |
| Limón | Tabla publica tipo USDA/FoodData Central |
| Requesón | Etiqueta comercial promedio |
| Lomo fino de res | Tabla publica tipo USDA/FoodData Central |
| Bacalao desalado | Tabla publica tipo USDA/FoodData Central |
| Pulpo cocido | Tabla publica tipo USDA/FoodData Central |
| Huevo de codorniz | Tabla publica tipo USDA/FoodData Central |
| Queso panela | Etiqueta comercial promedio |
| Frijoles pintos cocidos | Tabla publica tipo USDA/FoodData Central |
| Frijoles rojos cocidos | Tabla publica tipo USDA/FoodData Central |
| Brotes de soya | Tabla publica tipo USDA/FoodData Central |
| Setas shiitake | Tabla publica tipo USDA/FoodData Central |
| Col morada | Tabla publica tipo USDA/FoodData Central |
| Rábano | Tabla publica tipo USDA/FoodData Central |
| Betarraga | Tabla publica tipo USDA/FoodData Central |
| Coliflor | Tabla publica tipo USDA/FoodData Central |
| Higos secos | Tabla publica tipo USDA/FoodData Central |
| Ciruelas pasas | Tabla publica tipo USDA/FoodData Central |
| Granada | Tabla publica tipo USDA/FoodData Central |
| Kiwi | Tabla publica tipo USDA/FoodData Central |
| Sandía | Tabla publica tipo USDA/FoodData Central |
| Melón | Tabla publica tipo USDA/FoodData Central |
| Aceite de sésamo | Tabla publica tipo USDA/FoodData Central |
| Semillas de girasol | Tabla publica tipo USDA/FoodData Central |
| Avellanas | Tabla publica tipo USDA/FoodData Central |
| Leche entera | Tabla publica tipo USDA/FoodData Central |
| Pan integral de centeno | Etiqueta comercial promedio |
| Rúcula | Tabla publica tipo USDA/FoodData Central |
| Puerro | Tabla publica tipo USDA/FoodData Central |
| Nabo | Tabla publica tipo USDA/FoodData Central |

## Cobertura de cocina agregada

- Criolla: desayuno (2), snack (2), almuerzo (11 incl. lote 1), cena (1).
- Mediterranea: desayuno (3), snack (4), almuerzo (9 incl. lote 1), cena (3).
- Mexicana: desayuno (2), snack (2), almuerzo (7 incl. lote 1), cena (2).
- Asiatica: desayuno (2), snack (3), almuerzo (7 incl. lote 1), cena (2).

`inferCuisineTags` (en `supabase/nutrition_catalog_semantics.sql` y su espejo
de test en `scripts/validate-nutrition-catalog.mjs`) ahora tambien reconoce
`criolla`/`criollo` en el nombre del plato, ya que las palabras clave previas
(tacu tacu, ají, locro, chaufa) solo aparecían en almuerzos.
