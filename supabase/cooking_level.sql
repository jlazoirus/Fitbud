-- ============================================================
-- Fitbud — nivel de cocina por plato (REQ-254)
-- ------------------------------------------------------------
-- Idempotente. Agrega dishes.cooking_level, carga los platos nuevos sin
-- cocinar / de cocina básica y clasifica todo el catálogo:
--   none  = armar o calentar (microondas, tostadora); sin cocinar
--   basic = una sartén, hervir u hornear una bandeja simple
--   cook  = receta de varios pasos (guisos, salsas, masas, sopas, rellenos)
-- También corrige prep_minutes por plato (antes era un valor fijo por franja)
-- y needs_kitchen (false solo para "none").
--
-- Instalación nueva: schema.sql, seed.sql, nutrition_catalog_semantics.sql y
-- después este archivo. Instalación existente: ejecutar este archivo y luego
-- volver a ejecutar nutrition_catalog_semantics.sql (completa slug, slots,
-- etiquetas y límites de escalado de los platos nuevos; no pisa lo ya cargado).
-- No se ejecuta automáticamente en producción.
-- Recuperación: los platos nuevos se pueden borrar por nombre; la columna se
-- puede dejar (el cliente la ignora si un perfil no eligió nivel).
-- ============================================================

alter table dishes add column if not exists cooking_level text;

do $$
begin
  alter table dishes add constraint dishes_cooking_level_vocab
    check (cooking_level is null or cooking_level in ('none','basic','cook'));
exception
  when duplicate_object then null;
end $$;

-- ---------- Ingredientes nuevos (por 100 g) ----------
insert into ingredients (name, category, kcal, protein_g, carbs_g, fat_g)
select v.name, v.category, v.kcal, v.protein_g, v.carbs_g, v.fat_g
from (values
  ('Pollo rostizado sin piel','Proteína animal',165,27,0,6.5)
) as v(name, category, kcal, protein_g, carbs_g, fat_g)
where not exists (select 1 from ingredients i where i.name = v.name);

-- ---------- Platos nuevos ----------
insert into dishes (name, slot, menu)
select v.name, v.slot, null
from (values
  ('Pollo rostizado con arroz listo y ensalada','almuerzo'),
  ('Wrap de atún, palta y lechuga','almuerzo'),
  ('Wrap de pavo, queso fresco y tomate','almuerzo'),
  ('Bowl de lentejas listas, arroz y palta','almuerzo'),
  ('Bowl de garbanzos listos, quinua y hummus','almuerzo'),
  ('Sándwich de pollo rostizado y palta','almuerzo'),
  ('Wrap de seitán, hummus y espinaca','almuerzo'),
  ('Bowl de edamame, arroz listo y maní','almuerzo'),
  ('Burrito frío de frijoles y queso fresco','almuerzo'),
  ('Tortilla francesa con pan y ensalada','almuerzo'),
  ('Quesadilla de pollo rostizado y queso','almuerzo'),
  ('Tempeh a la sartén con arroz listo','almuerzo'),
  ('Ensalada exprés de atún, garbanzos y palta','cena'),
  ('Pollo rostizado con ensalada y palta','cena'),
  ('Bowl de lentejas listas con espinaca y semillas','cena'),
  ('Sándwich de pavo y cottage','cena'),
  ('Wrap de seitán y verduras listas','cena'),
  ('Tortilla de claras con espinaca y pan','cena'),
  ('Seitán con quinua lista y verduras','cena')
) as v(name, slot)
where not exists (select 1 from dishes d where d.name = v.name);

insert into dish_ingredients (dish_id, ingredient_id, grams)
select d.id, i.id, v.grams
from (values
  ('Pollo rostizado con arroz listo y ensalada','Pollo rostizado sin piel',180),('Pollo rostizado con arroz listo y ensalada','Arroz cocido',180),('Pollo rostizado con arroz listo y ensalada','Lechuga',80),('Pollo rostizado con arroz listo y ensalada','Tomate',80),('Pollo rostizado con arroz listo y ensalada','Aceite de oliva',6),
  ('Wrap de atún, palta y lechuga','Wrap integral',80),('Wrap de atún, palta y lechuga','Atún en agua',150),('Wrap de atún, palta y lechuga','Palta',50),('Wrap de atún, palta y lechuga','Lechuga',50),
  ('Wrap de pavo, queso fresco y tomate','Wrap integral',80),('Wrap de pavo, queso fresco y tomate','Pechuga de pavo',140),('Wrap de pavo, queso fresco y tomate','Queso fresco',50),('Wrap de pavo, queso fresco y tomate','Tomate',60),
  ('Bowl de lentejas listas, arroz y palta','Lentejas cocidas',250),('Bowl de lentejas listas, arroz y palta','Arroz cocido',120),('Bowl de lentejas listas, arroz y palta','Palta',40),('Bowl de lentejas listas, arroz y palta','Tomate',80),
  ('Bowl de garbanzos listos, quinua y hummus','Garbanzos cocidos',220),('Bowl de garbanzos listos, quinua y hummus','Quinua cocida',150),('Bowl de garbanzos listos, quinua y hummus','Hummus',50),('Bowl de garbanzos listos, quinua y hummus','Pepino',80),
  ('Sándwich de pollo rostizado y palta','Pan integral',100),('Sándwich de pollo rostizado y palta','Pollo rostizado sin piel',150),('Sándwich de pollo rostizado y palta','Palta',40),('Sándwich de pollo rostizado y palta','Lechuga',30),
  ('Wrap de seitán, hummus y espinaca','Wrap integral',80),('Wrap de seitán, hummus y espinaca','Seitán',150),('Wrap de seitán, hummus y espinaca','Hummus',50),('Wrap de seitán, hummus y espinaca','Espinaca',40),
  ('Bowl de edamame, arroz listo y maní','Edamame',200),('Bowl de edamame, arroz listo y maní','Arroz cocido',150),('Bowl de edamame, arroz listo y maní','Maní',15),('Bowl de edamame, arroz listo y maní','Pepino',80),
  ('Burrito frío de frijoles y queso fresco','Tortilla integral de trigo',80),('Burrito frío de frijoles y queso fresco','Frijoles negros cocidos',180),('Burrito frío de frijoles y queso fresco','Queso fresco',60),('Burrito frío de frijoles y queso fresco','Lechuga',40),
  ('Tortilla francesa con pan y ensalada','Huevo entero',150),('Tortilla francesa con pan y ensalada','Claras pasteurizadas',100),('Tortilla francesa con pan y ensalada','Pan integral',80),('Tortilla francesa con pan y ensalada','Lechuga',60),('Tortilla francesa con pan y ensalada','Tomate',60),('Tortilla francesa con pan y ensalada','Aceite de oliva',5),
  ('Quesadilla de pollo rostizado y queso','Tortilla integral de trigo',80),('Quesadilla de pollo rostizado y queso','Pollo rostizado sin piel',140),('Quesadilla de pollo rostizado y queso','Mozzarella light',50),('Quesadilla de pollo rostizado y queso','Pimiento',50),
  ('Tempeh a la sartén con arroz listo','Tempeh',180),('Tempeh a la sartén con arroz listo','Arroz cocido',150),('Tempeh a la sartén con arroz listo','Espinaca',60),('Tempeh a la sartén con arroz listo','Salsa de soya',10),
  ('Ensalada exprés de atún, garbanzos y palta','Atún en agua',140),('Ensalada exprés de atún, garbanzos y palta','Garbanzos cocidos',150),('Ensalada exprés de atún, garbanzos y palta','Palta',40),('Ensalada exprés de atún, garbanzos y palta','Tomate',80),('Ensalada exprés de atún, garbanzos y palta','Lechuga',60),
  ('Pollo rostizado con ensalada y palta','Pollo rostizado sin piel',160),('Pollo rostizado con ensalada y palta','Lechuga',100),('Pollo rostizado con ensalada y palta','Tomate',100),('Pollo rostizado con ensalada y palta','Palta',40),
  ('Bowl de lentejas listas con espinaca y semillas','Lentejas cocidas',250),('Bowl de lentejas listas con espinaca y semillas','Espinaca',60),('Bowl de lentejas listas con espinaca y semillas','Semillas de calabaza',15),('Bowl de lentejas listas con espinaca y semillas','Tomate',80),
  ('Sándwich de pavo y cottage','Pan integral',90),('Sándwich de pavo y cottage','Pechuga de pavo',120),('Sándwich de pavo y cottage','Queso cottage',80),('Sándwich de pavo y cottage','Tomate',50),
  ('Wrap de seitán y verduras listas','Wrap integral',70),('Wrap de seitán y verduras listas','Seitán',140),('Wrap de seitán y verduras listas','Verduras mixtas',120),('Wrap de seitán y verduras listas','Hummus',40),
  ('Tortilla de claras con espinaca y pan','Claras pasteurizadas',200),('Tortilla de claras con espinaca y pan','Huevo entero',60),('Tortilla de claras con espinaca y pan','Espinaca',60),('Tortilla de claras con espinaca y pan','Pan integral',60),
  ('Seitán con quinua lista y verduras','Seitán',150),('Seitán con quinua lista y verduras','Quinua cocida',150),('Seitán con quinua lista y verduras','Verduras mixtas',150),('Seitán con quinua lista y verduras','Aceite de oliva',5)
) as v(dish_name, ing_name, grams)
join dishes d      on d.name = v.dish_name
join ingredients i on i.name = v.ing_name
where not exists (
  select 1 from dish_ingredients di where di.dish_id = d.id and di.ingredient_id = i.id
);

-- ---------- Clasificación (nombre, nivel, minutos) ----------
-- COOKING_LEVELS:BEGIN
update dishes d
set cooking_level = v.level,
    prep_minutes = v.minutes,
    needs_kitchen = (v.level <> 'none')
from (values
  ('Avena proteica','none',5),
  ('Bowl griego','none',5),
  ('Panqueques sin huevo','basic',15),
  ('Smoothie bowl','none',5),
  ('Desayuno refeed (avena + plátano + miel)','none',5),
  ('Batido peri-entreno (día pesas)','none',5),
  ('Batido peri-entreno (día bajo)','none',5),
  ('Cena: yogur griego + cottage + fruta','none',5),
  ('Cena: queso fresco a la plancha + palta','basic',10),
  ('Cena: crema de verduras + tofu sellado','cook',30),
  ('Cena exprés: caseína + mantequilla de maní','none',5),
  ('Cena refeed: arroz + tofu + verduras','basic',15),
  ('Snack refeed: pan + mermelada + proteína','none',5),
  ('Snack diet break: pan con palta','none',5),
  ('Snack extra: fruta + yogur','none',5),
  ('Shake de proteína con agua','none',5),
  ('Shake de proteína con yogur griego','none',5),
  ('Saltado de tofu firme + arroz','basic',20),
  ('Lentejas guisadas + quinua + ensalada','cook',40),
  ('Tacu tacu de pallares + seitán','cook',40),
  ('Ají de garbanzos + arroz','cook',35),
  ('Quinua atamalada + queso fresco + tofu','cook',30),
  ('Frijoles canarios + arroz + queso fresco','cook',40),
  ('Locro de zapallo con quinua + tofu','cook',40),
  ('Pasta integral + boloñesa de lentejas + parmesano','cook',30),
  ('Bowl de hummus + tofu horneado + pita','basic',20),
  ('Falafel al horno + tabule de quinua + yogur','cook',45),
  ('Berenjenas al horno con lentejas + queso fresco','cook',45),
  ('Risotto de champiñones + tofu','cook',40),
  ('Ensalada griega + garbanzos + queso fresco','none',10),
  ('Pisto de verduras + soya texturizada + papa','cook',35),
  ('Tofu teriyaki + arroz + brócoli','basic',20),
  ('Curry de garbanzos + arroz','cook',30),
  ('Salteado de tempeh con pak choi y pimientos','basic',20),
  ('Pad thai de tofu','cook',30),
  ('Bowl de edamame + tofu + arroz + palta','basic',15),
  ('Ramen miso con tofu y fideos','cook',30),
  ('Chaufa de quinua con tofu','basic',20),
  ('Burrito bowl de frijol negro','none',10),
  ('Chili vegetariano + arroz','cook',40),
  ('Tacos de frijol negro y queso fresco','basic',15),
  ('Fajitas de tofu + tortillas','basic',20),
  ('Quesadillas de frijol, queso y champiñones','basic',15),
  ('Enchiladas de frijol + cottage','cook',35),
  ('Sopa azteca + tofu + palta','cook',35),
  ('Huevos revueltos + avena','basic',10),
  ('Pollo a la plancha + arroz + brócoli','basic',20),
  ('Bowl de atún + arroz + palta','none',10),
  ('Carne de res salteada + papa + verduras','basic',25),
  ('Salmón al horno + quinua + verduras','basic',25),
  ('Overnight de avena y skyr','none',5),
  ('Tostadas de palta y huevo','basic',10),
  ('Wrap de claras y pavo','basic',10),
  ('Bowl tropical de yogur','none',5),
  ('Avena mani y coco','none',5),
  ('Arepa con queso fresco','basic',15),
  ('Smoothie verde proteico','none',5),
  ('Pita de pollo y tomate','none',5),
  ('Panqueques de avena con fresa','basic',15),
  ('Tostadas de ricotta y arandanos','none',5),
  ('Bowl vegano de soya y granola','none',5),
  ('Porridge de quinua y platano','none',5),
  ('Huevos con camote','basic',15),
  ('Cereal integral con leche y fruta','none',3),
  ('Yogur de soya con frutos rojos','none',5),
  ('Garbanzos tostados con naranja','none',5),
  ('Manzana con mantequilla de almendra','none',5),
  ('Hummus con galletas de arroz','none',5),
  ('Batido vegetal de platano','none',5),
  ('Batido de skyr y mango','none',5),
  ('Rollitos de pavo y pepino','none',5),
  ('Cottage con pina','none',5),
  ('Almendras y naranja','none',5),
  ('Pita mini de hummus','none',5),
  ('Smoothie de soya y fresa','none',5),
  ('Caseina con arandanos','none',5),
  ('Arepa mini con queso','basic',10),
  ('Sardinas con galletas de arroz','none',5),
  ('Tofu sedoso con mango','none',5),
  ('Edamame con choclo','none',5),
  ('Wrap pequeno de pollo','none',5),
  ('Datiles con mani','none',5),
  ('Batido tropical vegetal','none',5),
  ('Pera con nueces y skyr','none',5),
  ('Bowl de pollo y camote','basic',15),
  ('Ensalada de camarones y quinua','basic',15),
  ('Merluza con arroz integral','basic',20),
  ('Bowl vegano de lenteja roja y bulgur','basic',20),
  ('Chili de frijol blanco y choclo','cook',35),
  ('Wrap de tempeh y hummus','basic',10),
  ('Pasta de legumbres con tomate y espinaca','basic',15),
  ('Arepa de pavo y palta','basic',15),
  ('Tilapia con zucchini y cuscus','basic',20),
  ('Trucha con camote y esparragos','basic',25),
  ('Ensalada de tofu sedoso y edamame','none',10),
  ('Sopa de lenteja roja y verduras','cook',35),
  ('Pollo deshilachado con verduras','basic',20),
  ('Sardinas con ensalada y papa','basic',15),
  ('Cuscus con garbanzos y tahini','basic',10),
  ('Cerdo magro con yuca y repollo','basic',25),
  ('Tamal criollo de choclo y queso panela','cook',60),
  ('Sanguche criollo de pollo deshilachado','none',5),
  ('Cancha criolla con queso fresco','none',5),
  ('Camote criollo con queso panela','none',5),
  ('Seco criollo de pollo con frijoles canarios','cook',45),
  ('Cau cau criollo de pollo y papas','cook',45),
  ('Tostada mediterranea con hummus y tomate','none',5),
  ('Pan pita con queso feta y aceitunas','none',5),
  ('Hummus con bastones de pepino y zanahoria','none',5),
  ('Mini pita con falafel','cook',30),
  ('Cuscus mediterraneo con garbanzos y aceitunas','basic',10),
  ('Ensalada griega con pollo a la plancha','basic',15),
  ('Huevos rancheros estilo azteca','basic',15),
  ('Tacos de huevo y frijol','basic',15),
  ('Mini quesadilla de frijol y queso panela','basic',10),
  ('Nachos ligeros estilo azteca','basic',10),
  ('Fajitas de pollo con pimientos','basic',20),
  ('Enchiladas de pollo con frijoles rojos','cook',35),
  ('Onigiri de edamame y atún','cook',25),
  ('Bowl de arroz y pak choi al vapor','basic',15),
  ('Edamame con sal marina','none',5),
  ('Pepino con salsa teriyaki y ajonjolí','none',5),
  ('Pad thai de camarones','cook',30),
  ('Ramen de pollo, pak choi y miso','cook',30),
  ('Bowl de pollo, arroz y frijoles negros','basic',20),
  ('Ensalada de atún con garbanzos y limón','none',10),
  ('Tacos de pollo con frijoles pintos','basic',15),
  ('Pasta integral con atún y tomate','basic',15),
  ('Bowl de huevo, camote y espinaca','basic',15),
  ('Yogur griego con nueces y miel','none',5),
  ('Requesón con higos y avellanas','none',5),
  ('Bacalao al horno con papas y coliflor','cook',40),
  ('Pulpo a la parrilla con papas doradas','cook',30),
  ('Ensalada de lomo fino con rúcula y granada','basic',15),
  ('Huevos de codorniz con palta y tostada','basic',10),
  ('Bowl de betarraga, garbanzos y queso feta','none',10),
  ('Salteado de setas shiitake y tofu','basic',15),
  ('Ensalada de col morada, rábano y pepinillos','none',5),
  ('Batido de leche entera, plátano y avena','none',5),
  ('Batido de sandía y limón','none',5),
  ('Ensalada de melón y jamón de pavo','none',5),
  ('Bowl de kiwi, yogur griego y semillas de girasol','none',5),
  ('Sopa de puerro y papa','cook',30),
  ('Ensalada de nabo, zanahoria y pollo','basic',15),
  ('Snack de ciruelas pasas y almendras','none',5),
  ('Bowl de papaya y maracuyá con yogur de coco','none',5),
  ('Panqueques de harina de almendra y arroz','basic',20),
  ('Porridge de trigo sarraceno y amaranto con frutos rojos','basic',15),
  ('Tostadas sin gluten con palta y huevo','basic',10),
  ('Bowl criollo de camote, huevo y ají amarillo','basic',15),
  ('Yogur de almendra con lúcuma y granola','none',5),
  ('Pita con jamón serrano y tomate','none',5),
  ('Tostadas mexicanas de tomatillo y huevo','basic',15),
  ('Bowl asiático de pollo molido, arroz y pak choi','basic',20),
  ('Ensalada de mejillones con quinua y limón','none',10),
  ('Tacos de nopal y frijol negro','basic',20),
  ('Chuleta de cerdo con puré de camote y coles de Bruselas','cook',35),
  ('Seco criollo de costilla con frijoles canarios y ají panca','cook',90),
  ('Bowl de calamar salteado con pasta de maíz','basic',20),
  ('Ensalada griega de alcachofa y aceitunas kalamata','none',10),
  ('Falafel de garbanzo con hongos portobello y hummus','cook',40),
  ('Enchiladas verdes de pollo con tomatillo y crema agria','cook',40),
  ('Cena mediterránea de anchoas con pan sin gluten y aceitunas','none',5),
  ('Calamar a la plancha con espárragos','basic',15),
  ('Costilla de res con puré de coliflor','cook',60),
  ('Cena criolla de chuleta de cerdo con rocoto y huacatay','cook',35),
  ('Ensalada tibia de pollo molido y trigo sarraceno','basic',20),
  ('Tofu con hongos portobello y salsa de soya','basic',15),
  ('Sopa de mejillones y verduras','cook',30),
  ('Tacos de chorizo con nopal','basic',20),
  ('Yogur de coco con camu camu','none',5),
  ('Yogur de almendra con semillas de cáñamo','none',5),
  ('Papaya con lúcuma','none',5),
  ('Aceitunas kalamata y queso feta a la griega','none',5),
  ('Maracuyá con granola y yogur griego','none',5),
  ('Hongos portobello rellenos de queso vegano','basic',15),
  ('Snack sin gluten de pan multigrano con jamón serrano','none',5),
  ('Cancha criolla con levadura nutricional','none',5),
  ('Batido de leche de almendra y maracuyá','none',5),
  ('Batido de bebida de coco y papaya','none',5),
  ('Pollo rostizado con arroz listo y ensalada','none',10),
  ('Wrap de atún, palta y lechuga','none',10),
  ('Wrap de pavo, queso fresco y tomate','none',10),
  ('Bowl de lentejas listas, arroz y palta','none',10),
  ('Bowl de garbanzos listos, quinua y hummus','none',10),
  ('Sándwich de pollo rostizado y palta','none',5),
  ('Wrap de seitán, hummus y espinaca','none',10),
  ('Bowl de edamame, arroz listo y maní','none',10),
  ('Burrito frío de frijoles y queso fresco','none',10),
  ('Tortilla francesa con pan y ensalada','basic',10),
  ('Quesadilla de pollo rostizado y queso','basic',10),
  ('Tempeh a la sartén con arroz listo','basic',15),
  ('Ensalada exprés de atún, garbanzos y palta','none',10),
  ('Pollo rostizado con ensalada y palta','none',5),
  ('Bowl de lentejas listas con espinaca y semillas','none',10),
  ('Sándwich de pavo y cottage','none',5),
  ('Wrap de seitán y verduras listas','none',10),
  ('Tortilla de claras con espinaca y pan','basic',10),
  ('Seitán con quinua lista y verduras','basic',15)
) as v(name, level, minutes)
where d.name = v.name;
-- COOKING_LEVELS:END
