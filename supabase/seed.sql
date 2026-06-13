-- ============================================================
-- Fitbud — datos precargados (ejecuta DESPUÉS de schema.sql)
-- Valores nutricionales por 100 g (aproximados, editables).
-- Vegetariano sin huevo. Re-ejecutable: hace truncate primero.
-- ============================================================
truncate diet_dishes, diets, dish_ingredients, dishes, ingredients restart identity cascade;

-- ---------- INGREDIENTES (por 100 g) ----------
insert into ingredients (name, category, kcal, protein_g, carbs_g, fat_g) values
('Tofu firme','Proteína',145,16,3,9),
('Tempeh','Proteína',192,20,8,11),
('Seitán','Proteína',130,24,4,2),
('Proteína en polvo','Proteína',375,80,8,5),
('Caseína en polvo','Proteína',360,78,9,4),
('Soya texturizada (seca)','Proteína',330,52,14,3),
('Edamame','Proteína',121,12,9,5),
('Garbanzos cocidos','Legumbre',164,9,27,2.6),
('Lentejas cocidas','Legumbre',116,9,20,0.4),
('Frijoles negros cocidos','Legumbre',132,8.9,24,0.5),
('Frijoles canarios cocidos','Legumbre',120,8,22,0.5),
('Pallares cocidos','Legumbre',115,8,21,0.5),
('Hummus','Legumbre',166,8,14,10),
('Avena','Cereal',389,13,66,7),
('Arroz cocido','Cereal',130,2.7,28,0.3),
('Quinua cocida','Cereal',120,4.4,21,1.9),
('Pasta integral seca','Cereal',348,13,70,2.5),
('Fideos de arroz secos','Cereal',360,3.4,80,0.5),
('Fideos de trigo secos','Cereal',350,12,70,1.5),
('Tortilla de maíz','Cereal',218,5.7,45,2.9),
('Tortilla integral de trigo','Cereal',310,8,50,8),
('Pan pita integral','Cereal',275,9,55,1.2),
('Pan de molde','Cereal',265,9,49,3.2),
('Granola sin azúcar','Cereal',450,10,60,18),
('Yogur griego natural 0%','Lácteo',60,10,3.6,0.4),
('Queso cottage','Lácteo',98,11,3.4,4.3),
('Queso fresco','Lácteo',150,12,3,10),
('Parmesano','Lácteo',431,38,4,29),
('Leche vegetal','Lácteo',45,3,4,2),
('Leche de coco light','Lácteo',73,0.7,3,7),
('Leche evaporada light','Lácteo',100,7,10,3),
('Plátano','Fruta',89,1.1,23,0.3),
('Frutos rojos','Fruta',50,1,12,0.3),
('Frutos congelados','Fruta',55,0.7,13,0.3),
('Fruta pequeña (manzana)','Fruta',52,0.3,14,0.2),
('Palta','Grasa',160,2,9,15),
('Aceitunas','Grasa',115,0.8,6,11),
('Aceite de oliva','Grasa',884,0,0,100),
('Mantequilla de maní','Grasa',588,25,20,50),
('Maní','Grasa',567,26,16,49),
('Chía','Grasa',486,17,42,31),
('Brócoli','Verdura',34,2.8,7,0.4),
('Pak choi','Verdura',13,1.5,2,0.2),
('Champiñones','Verdura',22,3,3,0.3),
('Berenjena','Verdura',25,1,6,0.2),
('Pimiento','Verdura',31,1,6,0.3),
('Cebolla','Verdura',40,1.1,9,0.1),
('Tomate','Verdura',18,0.9,3.9,0.2),
('Zapallo','Verdura',26,1,6.5,0.1),
('Repollo','Verdura',25,1.3,6,0.1),
('Papa','Verdura',77,2,17,0.1),
('Verduras mixtas','Verdura',25,1.5,4,0.3),
('Alga nori','Verdura',35,6,5,0.3),
('Miel','Otros',304,0.3,82,0),
('Mermelada','Otros',250,0.5,65,0);

-- ---------- PLATOS ----------
insert into dishes (name, slot, menu) values
-- Desayunos (compartidos)
('Avena proteica','desayuno',null),
('Bowl griego','desayuno',null),
('Panqueques sin huevo','desayuno',null),
('Smoothie bowl','desayuno',null),
('Desayuno refeed (avena + plátano + miel)','desayuno',null),
-- Batidos
('Batido peri-entreno (día pesas)','batido',null),
('Batido peri-entreno (día bajo)','batido',null),
-- Cenas (compartidas)
('Cena: yogur griego + cottage + fruta','cena',null),
('Cena: queso fresco a la plancha + palta','cena',null),
('Cena: crema de verduras + tofu sellado','cena',null),
('Cena exprés: caseína + mantequilla de maní','cena',null),
('Cena refeed: arroz + tofu + verduras','cena',null),
-- Snacks
('Snack refeed: pan + mermelada + proteína','snack',null),
('Snack diet break: pan con palta','snack',null),
('Snack extra: fruta + yogur','snack',null),
-- Menú A (Criollo)
('Saltado de tofu firme + arroz','almuerzo','A'),
('Lentejas guisadas + quinua + ensalada','almuerzo','A'),
('Tacu tacu de pallares + seitán','almuerzo','A'),
('Ají de garbanzos + arroz','almuerzo','A'),
('Quinua atamalada + queso fresco + tofu','almuerzo','A'),
('Frijoles canarios + arroz + queso fresco','almuerzo','A'),
('Locro de zapallo con quinua + tofu','almuerzo','A'),
-- Menú B (Mediterráneo)
('Pasta integral + boloñesa de lentejas + parmesano','almuerzo','B'),
('Bowl de hummus + tofu horneado + pita','almuerzo','B'),
('Falafel al horno + tabule de quinua + yogur','almuerzo','B'),
('Berenjenas al horno con lentejas + queso fresco','almuerzo','B'),
('Risotto de champiñones + tofu','almuerzo','B'),
('Ensalada griega + garbanzos + queso fresco','almuerzo','B'),
('Pisto de verduras + soya texturizada + papa','almuerzo','B'),
-- Menú C (Asiático)
('Tofu teriyaki + arroz + brócoli','almuerzo','C'),
('Curry de garbanzos + arroz','almuerzo','C'),
('Salteado de tempeh con pak choi y pimientos','almuerzo','C'),
('Pad thai de tofu','almuerzo','C'),
('Bowl de edamame + tofu + arroz + palta','almuerzo','C'),
('Ramen miso con tofu y fideos','almuerzo','C'),
('Chaufa de quinua con tofu','almuerzo','C'),
-- Menú D (Mexicano)
('Burrito bowl de frijol negro','almuerzo','D'),
('Chili vegetariano + arroz','almuerzo','D'),
('Tacos de frijol negro y queso fresco','almuerzo','D'),
('Fajitas de tofu + tortillas','almuerzo','D'),
('Quesadillas de frijol, queso y champiñones','almuerzo','D'),
('Enchiladas de frijol + cottage','almuerzo','D'),
('Sopa azteca + tofu + palta','almuerzo','D');

-- ---------- RECETAS (dish_ingredients) ----------
insert into dish_ingredients (dish_id, ingredient_id, grams)
select d.id, i.id, v.grams
from (values
  -- Desayunos
  ('Avena proteica','Avena',50),('Avena proteica','Proteína en polvo',45),('Avena proteica','Chía',10),
  ('Bowl griego','Yogur griego natural 0%',250),('Bowl griego','Proteína en polvo',25),('Bowl griego','Granola sin azúcar',25),('Bowl griego','Frutos rojos',50),
  ('Panqueques sin huevo','Avena',50),('Panqueques sin huevo','Proteína en polvo',45),('Panqueques sin huevo','Plátano',60),
  ('Smoothie bowl','Proteína en polvo',45),('Smoothie bowl','Frutos congelados',150),('Smoothie bowl','Avena',30),('Smoothie bowl','Leche vegetal',200),
  ('Desayuno refeed (avena + plátano + miel)','Avena',80),('Desayuno refeed (avena + plátano + miel)','Proteína en polvo',45),('Desayuno refeed (avena + plátano + miel)','Plátano',120),('Desayuno refeed (avena + plátano + miel)','Miel',20),
  -- Batidos
  ('Batido peri-entreno (día pesas)','Proteína en polvo',60),('Batido peri-entreno (día pesas)','Plátano',120),
  ('Batido peri-entreno (día bajo)','Proteína en polvo',60),('Batido peri-entreno (día bajo)','Leche vegetal',150),
  -- Cenas
  ('Cena: yogur griego + cottage + fruta','Yogur griego natural 0%',300),('Cena: yogur griego + cottage + fruta','Queso cottage',100),('Cena: yogur griego + cottage + fruta','Fruta pequeña (manzana)',100),
  ('Cena: queso fresco a la plancha + palta','Queso fresco',180),('Cena: queso fresco a la plancha + palta','Palta',35),('Cena: queso fresco a la plancha + palta','Verduras mixtas',200),('Cena: queso fresco a la plancha + palta','Aceite de oliva',5),
  ('Cena: crema de verduras + tofu sellado','Tofu firme',200),('Cena: crema de verduras + tofu sellado','Verduras mixtas',250),('Cena: crema de verduras + tofu sellado','Aceite de oliva',5),
  ('Cena exprés: caseína + mantequilla de maní','Caseína en polvo',40),('Cena exprés: caseína + mantequilla de maní','Mantequilla de maní',15),('Cena exprés: caseína + mantequilla de maní','Leche vegetal',200),
  ('Cena refeed: arroz + tofu + verduras','Arroz cocido',250),('Cena refeed: arroz + tofu + verduras','Tofu firme',200),('Cena refeed: arroz + tofu + verduras','Verduras mixtas',100),
  -- Snacks
  ('Snack refeed: pan + mermelada + proteína','Pan de molde',80),('Snack refeed: pan + mermelada + proteína','Mermelada',30),('Snack refeed: pan + mermelada + proteína','Proteína en polvo',30),
  ('Snack diet break: pan con palta','Pan de molde',60),('Snack diet break: pan con palta','Palta',50),
  ('Snack extra: fruta + yogur','Yogur griego natural 0%',200),('Snack extra: fruta + yogur','Fruta pequeña (manzana)',120),
  -- Menú A
  ('Saltado de tofu firme + arroz','Tofu firme',250),('Saltado de tofu firme + arroz','Arroz cocido',200),('Saltado de tofu firme + arroz','Cebolla',50),('Saltado de tofu firme + arroz','Tomate',50),('Saltado de tofu firme + arroz','Aceite de oliva',8),
  ('Lentejas guisadas + quinua + ensalada','Lentejas cocidas',350),('Lentejas guisadas + quinua + ensalada','Quinua cocida',120),('Lentejas guisadas + quinua + ensalada','Verduras mixtas',100),('Lentejas guisadas + quinua + ensalada','Aceite de oliva',5),
  ('Tacu tacu de pallares + seitán','Pallares cocidos',250),('Tacu tacu de pallares + seitán','Seitán',120),('Tacu tacu de pallares + seitán','Aceite de oliva',8),
  ('Ají de garbanzos + arroz','Garbanzos cocidos',280),('Ají de garbanzos + arroz','Leche evaporada light',50),('Ají de garbanzos + arroz','Arroz cocido',120),
  ('Quinua atamalada + queso fresco + tofu','Quinua cocida',200),('Quinua atamalada + queso fresco + tofu','Queso fresco',100),('Quinua atamalada + queso fresco + tofu','Tofu firme',150),
  ('Frijoles canarios + arroz + queso fresco','Frijoles canarios cocidos',250),('Frijoles canarios + arroz + queso fresco','Arroz cocido',80),('Frijoles canarios + arroz + queso fresco','Queso fresco',120),
  ('Locro de zapallo con quinua + tofu','Zapallo',200),('Locro de zapallo con quinua + tofu','Quinua cocida',120),('Locro de zapallo con quinua + tofu','Tofu firme',200),
  -- Menú B
  ('Pasta integral + boloñesa de lentejas + parmesano','Pasta integral seca',80),('Pasta integral + boloñesa de lentejas + parmesano','Lentejas cocidas',250),('Pasta integral + boloñesa de lentejas + parmesano','Parmesano',15),('Pasta integral + boloñesa de lentejas + parmesano','Tomate',80),
  ('Bowl de hummus + tofu horneado + pita','Hummus',100),('Bowl de hummus + tofu horneado + pita','Tofu firme',150),('Bowl de hummus + tofu horneado + pita','Pan pita integral',50),('Bowl de hummus + tofu horneado + pita','Verduras mixtas',100),
  ('Falafel al horno + tabule de quinua + yogur','Garbanzos cocidos',200),('Falafel al horno + tabule de quinua + yogur','Quinua cocida',120),('Falafel al horno + tabule de quinua + yogur','Yogur griego natural 0%',80),('Falafel al horno + tabule de quinua + yogur','Aceite de oliva',8),
  ('Berenjenas al horno con lentejas + queso fresco','Berenjena',150),('Berenjenas al horno con lentejas + queso fresco','Lentejas cocidas',200),('Berenjenas al horno con lentejas + queso fresco','Queso fresco',120),('Berenjenas al horno con lentejas + queso fresco','Arroz cocido',100),
  ('Risotto de champiñones + tofu','Arroz cocido',200),('Risotto de champiñones + tofu','Champiñones',150),('Risotto de champiñones + tofu','Tofu firme',200),('Risotto de champiñones + tofu','Parmesano',10),
  ('Ensalada griega + garbanzos + queso fresco','Garbanzos cocidos',250),('Ensalada griega + garbanzos + queso fresco','Queso fresco',120),('Ensalada griega + garbanzos + queso fresco','Aceitunas',30),('Ensalada griega + garbanzos + queso fresco','Verduras mixtas',150),
  ('Pisto de verduras + soya texturizada + papa','Soya texturizada (seca)',60),('Pisto de verduras + soya texturizada + papa','Verduras mixtas',200),('Pisto de verduras + soya texturizada + papa','Papa',150),('Pisto de verduras + soya texturizada + papa','Aceite de oliva',8),
  -- Menú C
  ('Tofu teriyaki + arroz + brócoli','Tofu firme',250),('Tofu teriyaki + arroz + brócoli','Arroz cocido',200),('Tofu teriyaki + arroz + brócoli','Brócoli',150),
  ('Curry de garbanzos + arroz','Garbanzos cocidos',250),('Curry de garbanzos + arroz','Leche de coco light',80),('Curry de garbanzos + arroz','Arroz cocido',100),
  ('Salteado de tempeh con pak choi y pimientos','Tempeh',200),('Salteado de tempeh con pak choi y pimientos','Pak choi',150),('Salteado de tempeh con pak choi y pimientos','Pimiento',100),('Salteado de tempeh con pak choi y pimientos','Aceite de oliva',8),
  ('Pad thai de tofu','Tofu firme',250),('Pad thai de tofu','Fideos de arroz secos',60),('Pad thai de tofu','Maní',15),('Pad thai de tofu','Verduras mixtas',100),
  ('Bowl de edamame + tofu + arroz + palta','Edamame',200),('Bowl de edamame + tofu + arroz + palta','Tofu firme',150),('Bowl de edamame + tofu + arroz + palta','Arroz cocido',120),('Bowl de edamame + tofu + arroz + palta','Palta',30),
  ('Ramen miso con tofu y fideos','Tofu firme',250),('Ramen miso con tofu y fideos','Fideos de trigo secos',60),('Ramen miso con tofu y fideos','Verduras mixtas',100),('Ramen miso con tofu y fideos','Alga nori',5),
  ('Chaufa de quinua con tofu','Quinua cocida',200),('Chaufa de quinua con tofu','Tofu firme',200),('Chaufa de quinua con tofu','Verduras mixtas',100),
  -- Menú D
  ('Burrito bowl de frijol negro','Frijoles negros cocidos',250),('Burrito bowl de frijol negro','Arroz cocido',100),('Burrito bowl de frijol negro','Queso cottage',100),('Burrito bowl de frijol negro','Palta',40),
  ('Chili vegetariano + arroz','Soya texturizada (seca)',60),('Chili vegetariano + arroz','Frijoles negros cocidos',200),('Chili vegetariano + arroz','Tomate',100),('Chili vegetariano + arroz','Arroz cocido',80),
  ('Tacos de frijol negro y queso fresco','Frijoles negros cocidos',200),('Tacos de frijol negro y queso fresco','Queso fresco',100),('Tacos de frijol negro y queso fresco','Tortilla de maíz',75),('Tacos de frijol negro y queso fresco','Repollo',100),
  ('Fajitas de tofu + tortillas','Tofu firme',250),('Fajitas de tofu + tortillas','Pimiento',100),('Fajitas de tofu + tortillas','Cebolla',50),('Fajitas de tofu + tortillas','Tortilla integral de trigo',75),
  ('Quesadillas de frijol, queso y champiñones','Tortilla integral de trigo',80),('Quesadillas de frijol, queso y champiñones','Frijoles negros cocidos',150),('Quesadillas de frijol, queso y champiñones','Queso fresco',80),('Quesadillas de frijol, queso y champiñones','Champiñones',80),
  ('Enchiladas de frijol + cottage','Frijoles negros cocidos',200),('Enchiladas de frijol + cottage','Tortilla de maíz',75),('Enchiladas de frijol + cottage','Queso cottage',100),('Enchiladas de frijol + cottage','Tomate',50),
  ('Sopa azteca + tofu + palta','Tofu firme',200),('Sopa azteca + tofu + palta','Tortilla de maíz',50),('Sopa azteca + tofu + palta','Palta',40),('Sopa azteca + tofu + palta','Verduras mixtas',150)
) as v(dish_name, ing_name, grams)
join dishes d      on d.name = v.dish_name
join ingredients i on i.name = v.ing_name;

-- ---------- DIETAS ----------
insert into diets (code, name, description) values
('A','Menú A — Criollo','Semanas 1, 5, 10'),
('B','Menú B — Mediterráneo','Semanas 2, 7 (y base del diet break)'),
('C','Menú C — Asiático','Semanas 3, 8'),
('D','Menú D — Mexicano','Semanas 4, 9');

-- ---------- ASIGNACIÓN de almuerzos por día (1=Lun .. 6=Sáb, 0=Dom) ----------
insert into diet_dishes (diet_id, dish_id, weekday, slot)
select dt.id, d.id, v.weekday, 'almuerzo'
from (values
  ('A','Saltado de tofu firme + arroz',1),
  ('A','Lentejas guisadas + quinua + ensalada',2),
  ('A','Tacu tacu de pallares + seitán',3),
  ('A','Ají de garbanzos + arroz',4),
  ('A','Quinua atamalada + queso fresco + tofu',5),
  ('A','Frijoles canarios + arroz + queso fresco',6),
  ('A','Locro de zapallo con quinua + tofu',0),
  ('B','Pasta integral + boloñesa de lentejas + parmesano',1),
  ('B','Bowl de hummus + tofu horneado + pita',2),
  ('B','Falafel al horno + tabule de quinua + yogur',3),
  ('B','Berenjenas al horno con lentejas + queso fresco',4),
  ('B','Risotto de champiñones + tofu',5),
  ('B','Ensalada griega + garbanzos + queso fresco',6),
  ('B','Pisto de verduras + soya texturizada + papa',0),
  ('C','Tofu teriyaki + arroz + brócoli',1),
  ('C','Curry de garbanzos + arroz',2),
  ('C','Salteado de tempeh con pak choi y pimientos',3),
  ('C','Pad thai de tofu',4),
  ('C','Bowl de edamame + tofu + arroz + palta',5),
  ('C','Ramen miso con tofu y fideos',6),
  ('C','Chaufa de quinua con tofu',0),
  ('D','Burrito bowl de frijol negro',1),
  ('D','Chili vegetariano + arroz',2),
  ('D','Tacos de frijol negro y queso fresco',3),
  ('D','Fajitas de tofu + tortillas',4),
  ('D','Quesadillas de frijol, queso y champiñones',5),
  ('D','Enchiladas de frijol + cottage',6),
  ('D','Sopa azteca + tofu + palta',0)
) as v(diet_code, dish_name, weekday)
join diets dt on dt.code = v.diet_code
join dishes d on d.name = v.dish_name;
