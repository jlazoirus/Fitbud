-- ============================================================
-- Fitbros - biblioteca de ejercicios y demostraciones (REQ-15)
-- Idempotente. Ejecuta despues de supabase/auth.sql.
--
-- Decision de contenido: produccion propia Fitbros. Las demostraciones
-- SVG procedimentales viven en la app; no se usan hotlinks ni media de
-- terceros. Recuperacion: archivar filas (active=false) o borrar la tabla
-- exercises si se necesita retirar por completo este catalogo.
-- ============================================================

create table if not exists exercises (
  id                  bigint generated always as identity primary key,
  slug                text not null unique,
  name                text not null,
  aliases             jsonb not null default '[]'::jsonb,
  discipline          text not null,
  level               text not null check (level in ('beginner','intermediate','advanced')),
  equipment           jsonb not null default '[]'::jsonb,
  places              jsonb not null default '[]'::jsonb,
  muscles             jsonb not null default '[]'::jsonb,
  movement_pattern    text not null,
  start_position      text not null,
  steps               jsonb not null default '[]'::jsonb,
  breathing           text not null,
  common_errors       jsonb not null default '[]'::jsonb,
  safety_signals      jsonb not null default '[]'::jsonb,
  regression          text not null,
  progression         text not null,
  substitute_slugs    jsonb not null default '[]'::jsonb,
  contraindications   jsonb not null default '[]'::jsonb,
  media_type          text not null default 'inline_svg',
  media_key           text not null,
  static_key          text not null,
  source_name         text not null,
  source_url          text,
  license_name        text not null,
  attribution         text,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint exercises_complete_check check (
    length(trim(name)) > 0
    and jsonb_array_length(steps) > 0
    and jsonb_array_length(safety_signals) > 0
    and length(trim(media_key)) > 0
    and length(trim(static_key)) > 0
    and length(trim(source_name)) > 0
    and length(trim(license_name)) > 0
  )
);

create index if not exists exercises_active_discipline_idx
  on exercises (active, discipline, level, name);

alter table exercises enable row level security;
drop policy if exists "read exercise catalog" on exercises;
drop policy if exists "admin write exercise catalog" on exercises;
create policy "read exercise catalog" on exercises
  for select to authenticated using (true);
create policy "admin write exercise catalog" on exercises
  for all to authenticated
  using (is_admin() and is_active())
  with check (is_admin() and is_active());

insert into exercises (
  slug,name,aliases,discipline,level,equipment,places,muscles,movement_pattern,
  start_position,steps,breathing,common_errors,safety_signals,regression,progression,
  substitute_slugs,contraindications,media_type,media_key,static_key,source_name,
  source_url,license_name,attribution,active
) values
(
  'back-squat', 'Sentadilla con barra', '["sentadilla"]'::jsonb, 'gym', 'beginner',
  '["barbell","rack"]'::jsonb, '["gym"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'squat',
  'Pies firmes, tronco alto y abdomen activo.', '["Lleva la cadera atrás y flexiona las rodillas con control.","Desciende hasta el rango que puedas mantener sin dolor.","Empuja el suelo y vuelve a la posición inicial sin perder alineación."]'::jsonb, 'Inhala antes de bajar, mantén el abdomen firme y exhala al subir.', '["Rodillas colapsando hacia dentro","Talones despegados","Perder la postura del tronco"]'::jsonb,
  '["Dolor agudo de rodilla, cadera o espalda","Mareo o pérdida de equilibrio"]'::jsonb, 'Sentadilla a caja', 'Sentadilla frontal', '["tempo-squat","leg-press"]'::jsonb,
  '["dolor agudo de rodilla","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'squat', 'squat',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'bench-press', 'Press de banca', '["press banca"]'::jsonb, 'gym', 'beginner',
  '["barbell","bench"]'::jsonb, '["gym"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Press con mancuernas ligeras', 'Press con pausa', '["push-up","incline-dumbbell-press"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'seated-cable-row', 'Remo sentado en polea', '["remo sentado"]'::jsonb, 'gym', 'beginner',
  '["cable"]'::jsonb, '["gym"]'::jsonb, '["espalda","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.', '["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Remo con banda', 'Remo con pausa', '["band-row","lat-pulldown"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'romanian-deadlift', 'Peso muerto rumano', '["RDL"]'::jsonb, 'gym', 'beginner',
  '["barbell"]'::jsonb, '["gym"]'::jsonb, '["isquiotibiales","glúteos"]'::jsonb, 'hinge',
  'Pies al ancho de cadera, rodillas suaves y columna neutra.', '["Empuja la cadera hacia atrás manteniendo la carga cerca del cuerpo.","Baja solo mientras conserves la espalda estable.","Aprieta glúteos y lleva la cadera hacia delante para volver."]'::jsonb, 'Inhala y bloquea el tronco antes de bajar; exhala al extender la cadera.', '["Redondear la espalda","Convertir el movimiento en sentadilla","Separar la carga del cuerpo"]'::jsonb,
  '["Dolor punzante lumbar","Hormigueo o dolor irradiado"]'::jsonb, 'Bisagra con palo', 'Peso muerto rumano a una pierna', '["single-leg-rdl","barbell-hip-thrust"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de isquiotibiales"]'::jsonb, 'inline_svg', 'hinge', 'hinge',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'barbell-hip-thrust', 'Hip thrust', '["empuje de cadera"]'::jsonb, 'gym', 'beginner',
  '["barbell","bench"]'::jsonb, '["gym"]'::jsonb, '["glúteos","isquiotibiales"]'::jsonb, 'bridge',
  'Apoya la espalda y los pies con la pelvis neutra.', '["Activa el abdomen antes de mover la cadera.","Eleva la pelvis apretando glúteos sin arquear la espalda.","Pausa arriba y baja de forma controlada."]'::jsonb, 'Exhala al elevar la cadera e inhala al bajar.', '["Empujar solo con la zona lumbar","Pies demasiado lejos","Rodillas abriéndose o cerrándose"]'::jsonb,
  '["Dolor lumbar o de cadera","Calambre persistente"]'::jsonb, 'Puente de glúteo', 'Hip thrust con pausa', '["glute-bridge","single-leg-glute-bridge"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'bridge', 'bridge',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'incline-dumbbell-press', 'Press inclinado con mancuernas', '["press inclinado"]'::jsonb, 'gym', 'beginner',
  '["dumbbells","bench"]'::jsonb, '["gym"]'::jsonb, '["pecho","hombros","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Press inclinado ligero', 'Press alternado', '["bench-press","incline-push-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'lat-pulldown', 'Jalón al pecho', '["jalón"]'::jsonb, 'gym', 'beginner',
  '["cable"]'::jsonb, '["gym"]'::jsonb, '["dorsales","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.', '["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Jalón con banda', 'Dominada asistida', '["assisted-pull-up","band-row"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'bulgarian-split-squat', 'Sentadilla búlgara', '["búlgara"]'::jsonb, 'strength', 'beginner',
  '["bench_or_chair"]'::jsonb, '["gym","home"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'lunge',
  'Tronco alto, pies separados y mirada al frente.', '["Da un paso estable y reparte el peso entre ambos pies.","Baja la rodilla posterior con control sin golpear el suelo.","Empuja con el pie delantero para volver o avanzar."]'::jsonb, 'Inhala al bajar y exhala al subir.', '["Paso demasiado corto","Rodilla colapsando hacia dentro","Perder el equilibrio"]'::jsonb,
  '["Dolor agudo de rodilla o cadera","Inestabilidad que no mejora al reducir rango"]'::jsonb, 'Zancada estática', 'Búlgara con carga', '["walking-lunge","step-up"]'::jsonb,
  '["dolor agudo de rodilla","problemas de equilibrio no evaluados"]'::jsonb, 'inline_svg', 'lunge', 'lunge',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'overhead-press', 'Press militar', '["press sobre cabeza"]'::jsonb, 'gym', 'beginner',
  '["barbell_or_dumbbells"]'::jsonb, '["gym"]'::jsonb, '["hombros","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Press sentado ligero', 'Press de pie con pausa', '["pike-push-up","incline-dumbbell-press"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'walking-lunge', 'Zancada', '["lunges"]'::jsonb, 'strength', 'beginner',
  '[]'::jsonb, '["gym","home","outdoor"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'lunge',
  'Tronco alto, pies separados y mirada al frente.', '["Da un paso estable y reparte el peso entre ambos pies.","Baja la rodilla posterior con control sin golpear el suelo.","Empuja con el pie delantero para volver o avanzar."]'::jsonb, 'Inhala al bajar y exhala al subir.', '["Paso demasiado corto","Rodilla colapsando hacia dentro","Perder el equilibrio"]'::jsonb,
  '["Dolor agudo de rodilla o cadera","Inestabilidad que no mejora al reducir rango"]'::jsonb, 'Zancada asistida', 'Zancada caminando con carga', '["bulgarian-split-squat","step-up"]'::jsonb,
  '["dolor agudo de rodilla","problemas de equilibrio no evaluados"]'::jsonb, 'inline_svg', 'lunge', 'lunge',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'standing-calf-raise', 'Elevación de gemelos', '["gemelos"]'::jsonb, 'strength', 'beginner',
  '[]'::jsonb, '["gym","home"]'::jsonb, '["pantorrillas"]'::jsonb, 'calf',
  'Pies paralelos, apoyo estable y rodillas suaves.', '["Eleva los talones manteniendo el peso sobre el primer y segundo dedo.","Pausa arriba sin perder equilibrio.","Baja lentamente hasta apoyar por completo."]'::jsonb, 'Exhala al subir e inhala al bajar.', '["Rebotar","Girar los tobillos","Acortar el descenso"]'::jsonb,
  '["Dolor agudo de tobillo o pantorrilla","Pérdida de equilibrio"]'::jsonb, 'Elevación con apoyo', 'Elevación a una pierna', '[]'::jsonb,
  '["lesión reciente de Aquiles","dolor agudo de tobillo"]'::jsonb, 'inline_svg', 'calf', 'calf',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'assisted-dip', 'Fondos asistidos', '["fondos"]'::jsonb, 'strength', 'beginner',
  '["bench_or_assistance"]'::jsonb, '["gym","home"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Flexión inclinada', 'Fondos con menor asistencia', '["incline-push-up","push-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'biceps-curl', 'Curl de bíceps', '["curl"]'::jsonb, 'gym', 'beginner',
  '["dumbbells_or_cable"]'::jsonb, '["gym"]'::jsonb, '["bíceps"]'::jsonb, 'isolation',
  'Articulación estable y recorrido cómodo sin impulso.', '["Ajusta la carga para controlar todo el movimiento.","Mueve solo la articulación objetivo.","Regresa lentamente sin dejar caer la carga."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Curl con banda ligera', 'Curl alternado controlado', '["band-row"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'inline_svg', 'isolation', 'isolation',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'triceps-pushdown', 'Extensión de tríceps en polea', '["tríceps polea"]'::jsonb, 'gym', 'beginner',
  '["cable"]'::jsonb, '["gym"]'::jsonb, '["tríceps"]'::jsonb, 'isolation',
  'Articulación estable y recorrido cómodo sin impulso.', '["Ajusta la carga para controlar todo el movimiento.","Mueve solo la articulación objetivo.","Regresa lentamente sin dejar caer la carga."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Extensión con banda', 'Extensión unilateral', '["assisted-dip","push-up"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'inline_svg', 'isolation', 'isolation',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'leg-press', 'Prensa de piernas', '["prensa"]'::jsonb, 'gym', 'beginner',
  '["leg_press"]'::jsonb, '["gym"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'squat',
  'Pies firmes, tronco alto y abdomen activo.', '["Lleva la cadera atrás y flexiona las rodillas con control.","Desciende hasta el rango que puedas mantener sin dolor.","Empuja el suelo y vuelve a la posición inicial sin perder alineación."]'::jsonb, 'Inhala antes de bajar, mantén el abdomen firme y exhala al subir.', '["Rodillas colapsando hacia dentro","Talones despegados","Perder la postura del tronco"]'::jsonb,
  '["Dolor agudo de rodilla, cadera o espalda","Mareo o pérdida de equilibrio"]'::jsonb, 'Prensa con rango corto', 'Prensa unilateral', '["back-squat","tempo-squat"]'::jsonb,
  '["dolor agudo de rodilla","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'squat', 'squat',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'leg-curl', 'Curl femoral', '["femoral"]'::jsonb, 'gym', 'beginner',
  '["leg_curl"]'::jsonb, '["gym"]'::jsonb, '["isquiotibiales"]'::jsonb, 'isolation',
  'Articulación estable y recorrido cómodo sin impulso.', '["Ajusta la carga para controlar todo el movimiento.","Mueve solo la articulación objetivo.","Regresa lentamente sin dejar caer la carga."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Curl con rango corto', 'Curl unilateral', '["slider-leg-curl","romanian-deadlift"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'inline_svg', 'isolation', 'isolation',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'tempo-squat', 'Sentadilla tempo', '["sentadilla corporal"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'squat',
  'Pies firmes, tronco alto y abdomen activo.', '["Lleva la cadera atrás y flexiona las rodillas con control.","Desciende hasta el rango que puedas mantener sin dolor.","Empuja el suelo y vuelve a la posición inicial sin perder alineación."]'::jsonb, 'Inhala antes de bajar, mantén el abdomen firme y exhala al subir.', '["Rodillas colapsando hacia dentro","Talones despegados","Perder la postura del tronco"]'::jsonb,
  '["Dolor agudo de rodilla, cadera o espalda","Mareo o pérdida de equilibrio"]'::jsonb, 'Sentarse y levantarse de una silla', 'Sentadilla con pausa', '["back-squat","step-up"]'::jsonb,
  '["dolor agudo de rodilla","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'squat', 'squat',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'push-up', 'Flexión de brazos', '["flexiones"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Flexión inclinada', 'Flexión con pausa', '["incline-push-up","bench-press"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'incline-push-up', 'Flexión inclinada', '["flexión elevada"]'::jsonb, 'bodyweight', 'beginner',
  '["bench_or_wall"]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Flexión contra pared', 'Flexión en el suelo', '["push-up","assisted-dip"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'band-row', 'Remo con banda', '["remo invertido"]'::jsonb, 'bodyweight', 'beginner',
  '["resistance_band"]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["espalda","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.', '["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Remo con menor tensión', 'Remo invertido', '["seated-cable-row","assisted-pull-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'glute-bridge', 'Puente de glúteo', '["puente"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["glúteos","isquiotibiales"]'::jsonb, 'bridge',
  'Apoya la espalda y los pies con la pelvis neutra.', '["Activa el abdomen antes de mover la cadera.","Eleva la pelvis apretando glúteos sin arquear la espalda.","Pausa arriba y baja de forma controlada."]'::jsonb, 'Exhala al elevar la cadera e inhala al bajar.', '["Empujar solo con la zona lumbar","Pies demasiado lejos","Rodillas abriéndose o cerrándose"]'::jsonb,
  '["Dolor lumbar o de cadera","Calambre persistente"]'::jsonb, 'Puente con rango corto', 'Puente a una pierna', '["barbell-hip-thrust","single-leg-glute-bridge"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'bridge', 'bridge',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'single-leg-glute-bridge', 'Puente de glúteo a una pierna', '["puente unilateral"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["glúteos","isquiotibiales"]'::jsonb, 'bridge',
  'Apoya la espalda y los pies con la pelvis neutra.', '["Activa el abdomen antes de mover la cadera.","Eleva la pelvis apretando glúteos sin arquear la espalda.","Pausa arriba y baja de forma controlada."]'::jsonb, 'Exhala al elevar la cadera e inhala al bajar.', '["Empujar solo con la zona lumbar","Pies demasiado lejos","Rodillas abriéndose o cerrándose"]'::jsonb,
  '["Dolor lumbar o de cadera","Calambre persistente"]'::jsonb, 'Puente bilateral', 'Puente unilateral con pausa', '["glute-bridge","barbell-hip-thrust"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'bridge', 'bridge',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'front-plank', 'Plancha frontal', '["plancha"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["core"]'::jsonb, 'core',
  'Columna neutra, abdomen activo y respiración continua.', '["Crea tensión suave antes de mover brazos o piernas.","Mantén pelvis y costillas estables durante el ejercicio.","Detén la serie cuando pierdas la postura."]'::jsonb, 'Respira corto y continuo; no aguantes el aire por tiempo prolongado.', '["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"]'::jsonb,
  '["Dolor lumbar o cervical","Mareo al sostener la posición"]'::jsonb, 'Plancha elevada', 'Plancha con mayor duración', '["dead-bug","side-plank"]'::jsonb,
  '["dolor lumbar agudo","cirugía abdominal reciente"]'::jsonb, 'inline_svg', 'core', 'core',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'side-plank', 'Plancha lateral', '["plancha de lado"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["core","oblicuos"]'::jsonb, 'core',
  'Columna neutra, abdomen activo y respiración continua.', '["Crea tensión suave antes de mover brazos o piernas.","Mantén pelvis y costillas estables durante el ejercicio.","Detén la serie cuando pierdas la postura."]'::jsonb, 'Respira corto y continuo; no aguantes el aire por tiempo prolongado.', '["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"]'::jsonb,
  '["Dolor lumbar o cervical","Mareo al sostener la posición"]'::jsonb, 'Plancha lateral con rodillas', 'Plancha lateral con pierna elevada', '["front-plank","dead-bug"]'::jsonb,
  '["dolor lumbar agudo","cirugía abdominal reciente"]'::jsonb, 'inline_svg', 'core', 'core',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'dead-bug', 'Dead bug', '["insecto muerto"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["core"]'::jsonb, 'core',
  'Columna neutra, abdomen activo y respiración continua.', '["Crea tensión suave antes de mover brazos o piernas.","Mantén pelvis y costillas estables durante el ejercicio.","Detén la serie cuando pierdas la postura."]'::jsonb, 'Respira corto y continuo; no aguantes el aire por tiempo prolongado.', '["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"]'::jsonb,
  '["Dolor lumbar o cervical","Mareo al sostener la posición"]'::jsonb, 'Mover solo brazos o piernas', 'Extender brazo y pierna opuestos', '["front-plank","shoulder-tap-plank"]'::jsonb,
  '["dolor lumbar agudo","cirugía abdominal reciente"]'::jsonb, 'inline_svg', 'core', 'core',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'pike-push-up', 'Pike push-up', '["flexión pica"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["hombros","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Pike con manos elevadas', 'Pike con pies elevados', '["overhead-press","incline-push-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'single-leg-rdl', 'Peso muerto a una pierna', '["bisagra unilateral"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["isquiotibiales","glúteos"]'::jsonb, 'hinge',
  'Pies al ancho de cadera, rodillas suaves y columna neutra.', '["Empuja la cadera hacia atrás manteniendo la carga cerca del cuerpo.","Baja solo mientras conserves la espalda estable.","Aprieta glúteos y lleva la cadera hacia delante para volver."]'::jsonb, 'Inhala y bloquea el tronco antes de bajar; exhala al extender la cadera.', '["Redondear la espalda","Convertir el movimiento en sentadilla","Separar la carga del cuerpo"]'::jsonb,
  '["Dolor punzante lumbar","Hormigueo o dolor irradiado"]'::jsonb, 'Bisagra asistida', 'Bisagra unilateral con carga', '["romanian-deadlift","glute-bridge"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de isquiotibiales"]'::jsonb, 'inline_svg', 'hinge', 'hinge',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'assisted-pull-up', 'Dominada asistida', '["dominada con banda"]'::jsonb, 'bodyweight', 'beginner',
  '["pullup_bar","resistance_band"]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["espalda","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.', '["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Jalón con banda', 'Dominada con menos asistencia', '["lat-pulldown","band-row"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'shoulder-tap-plank', 'Plancha con toque de hombro', '["toques de hombro"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["core","hombros"]'::jsonb, 'core',
  'Columna neutra, abdomen activo y respiración continua.', '["Crea tensión suave antes de mover brazos o piernas.","Mantén pelvis y costillas estables durante el ejercicio.","Detén la serie cuando pierdas la postura."]'::jsonb, 'Respira corto y continuo; no aguantes el aire por tiempo prolongado.', '["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"]'::jsonb,
  '["Dolor lumbar o cervical","Mareo al sostener la posición"]'::jsonb, 'Plancha alta sin toques', 'Toques más lentos', '["front-plank","dead-bug"]'::jsonb,
  '["dolor lumbar agudo","cirugía abdominal reciente"]'::jsonb, 'inline_svg', 'core', 'core',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'step-up', 'Subida al banco', '["step ups"]'::jsonb, 'bodyweight', 'beginner',
  '["step_or_bench"]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'lunge',
  'Tronco alto, pies separados y mirada al frente.', '["Da un paso estable y reparte el peso entre ambos pies.","Baja la rodilla posterior con control sin golpear el suelo.","Empuja con el pie delantero para volver o avanzar."]'::jsonb, 'Inhala al bajar y exhala al subir.', '["Paso demasiado corto","Rodilla colapsando hacia dentro","Perder el equilibrio"]'::jsonb,
  '["Dolor agudo de rodilla o cadera","Inestabilidad que no mejora al reducir rango"]'::jsonb, 'Escalón bajo con apoyo', 'Escalón más alto o con carga', '["walking-lunge","bulgarian-split-squat"]'::jsonb,
  '["dolor agudo de rodilla","problemas de equilibrio no evaluados"]'::jsonb, 'inline_svg', 'lunge', 'lunge',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'slider-leg-curl', 'Curl femoral deslizante', '["curl deslizante"]'::jsonb, 'bodyweight', 'beginner',
  '["sliders_or_towel"]'::jsonb, '["home","gym"]'::jsonb, '["isquiotibiales","glúteos"]'::jsonb, 'hinge',
  'Pies al ancho de cadera, rodillas suaves y columna neutra.', '["Empuja la cadera hacia atrás manteniendo la carga cerca del cuerpo.","Baja solo mientras conserves la espalda estable.","Aprieta glúteos y lleva la cadera hacia delante para volver."]'::jsonb, 'Inhala y bloquea el tronco antes de bajar; exhala al extender la cadera.', '["Redondear la espalda","Convertir el movimiento en sentadilla","Separar la carga del cuerpo"]'::jsonb,
  '["Dolor punzante lumbar","Hormigueo o dolor irradiado"]'::jsonb, 'Deslizar una pierna por vez', 'Curl completo con cadera elevada', '["leg-curl","glute-bridge"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de isquiotibiales"]'::jsonb, 'inline_svg', 'hinge', 'hinge',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'run-intervals', 'Intervalos de running', '[]'::jsonb, 'running', 'beginner',
  '[]'::jsonb, '["outdoor"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'run',
  'Postura alta, mirada al frente y pasos suaves bajo el cuerpo.', '["Comienza a ritmo fácil para estabilizar respiración y técnica.","Completa el bloque indicado manteniendo una zancada controlada.","Reduce el ritmo durante la recuperación y detente si aparece una señal de alerta."]'::jsonb, 'Usa una respiración rítmica y recupera el habla durante los tramos suaves.', '["Salir demasiado rápido","Alargar la zancada por delante del cuerpo","Ignorar dolor creciente"]'::jsonb,
  '["Dolor de pecho, mareo o falta de aire inusual","Dolor articular que cambia la técnica"]'::jsonb, 'Series de carrera suave con más recuperación', 'Aumentar gradualmente la duración del bloque rápido', '["run-easy","run-drills"]'::jsonb,
  '["dolor agudo al correr","señales cardiovasculares no evaluadas"]'::jsonb, 'inline_svg', 'run', 'run',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'run-easy', 'Running aeróbico fácil', '[]'::jsonb, 'running', 'beginner',
  '[]'::jsonb, '["outdoor"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'run',
  'Postura alta, mirada al frente y pasos suaves bajo el cuerpo.', '["Comienza a ritmo fácil para estabilizar respiración y técnica.","Completa el bloque indicado manteniendo una zancada controlada.","Reduce el ritmo durante la recuperación y detente si aparece una señal de alerta."]'::jsonb, 'Usa una respiración rítmica y recupera el habla durante los tramos suaves.', '["Salir demasiado rápido","Alargar la zancada por delante del cuerpo","Ignorar dolor creciente"]'::jsonb,
  '["Dolor de pecho, mareo o falta de aire inusual","Dolor articular que cambia la técnica"]'::jsonb, 'Alternar caminar y correr', 'Aumentar tiempo manteniendo ritmo conversacional', '["run-intervals","run-drills"]'::jsonb,
  '["dolor agudo al correr","señales cardiovasculares no evaluadas"]'::jsonb, 'inline_svg', 'run', 'run',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'run-drills', 'Técnica de carrera', '[]'::jsonb, 'running', 'beginner',
  '[]'::jsonb, '["outdoor"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'run',
  'Postura alta, mirada al frente y pasos suaves bajo el cuerpo.', '["Comienza a ritmo fácil para estabilizar respiración y técnica.","Completa el bloque indicado manteniendo una zancada controlada.","Reduce el ritmo durante la recuperación y detente si aparece una señal de alerta."]'::jsonb, 'Usa una respiración rítmica y recupera el habla durante los tramos suaves.', '["Salir demasiado rápido","Alargar la zancada por delante del cuerpo","Ignorar dolor creciente"]'::jsonb,
  '["Dolor de pecho, mareo o falta de aire inusual","Dolor articular que cambia la técnica"]'::jsonb, 'Marcha técnica y progresivos cortos', 'Añadir repeticiones sin perder postura', '["run-easy"]'::jsonb,
  '["dolor agudo al correr","señales cardiovasculares no evaluadas"]'::jsonb, 'inline_svg', 'run', 'run',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'cycle-intervals', 'Intervalos de cycling', '[]'::jsonb, 'cycling', 'beginner',
  '["bicycle"]'::jsonb, '["outdoor","gym"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'cycle',
  'Bicicleta estable, sillín ajustado y manos relajadas.', '["Pedalea suave hasta encontrar una cadencia estable.","Completa los bloques sin balancear excesivamente el tronco.","Recupera con resistencia baja y termina con pedaleo fácil."]'::jsonb, 'Mantén respiración rítmica; baja la intensidad si no puedes recuperarla.', '["Resistencia excesiva","Caderas balanceándose","Bloquear hombros y manos"]'::jsonb,
  '["Dolor de pecho, mareo o adormecimiento persistente","Dolor agudo de rodilla"]'::jsonb, 'Bloques cortos con resistencia moderada', 'Aumentar duración antes que resistencia', '["cycle-endurance","cycle-cadence"]'::jsonb,
  '["dolor agudo de rodilla","señales cardiovasculares no evaluadas"]'::jsonb, 'inline_svg', 'cycle', 'cycle',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'cycle-endurance', 'Cycling aeróbico fácil', '[]'::jsonb, 'cycling', 'beginner',
  '["bicycle"]'::jsonb, '["outdoor","gym"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'cycle',
  'Bicicleta estable, sillín ajustado y manos relajadas.', '["Pedalea suave hasta encontrar una cadencia estable.","Completa los bloques sin balancear excesivamente el tronco.","Recupera con resistencia baja y termina con pedaleo fácil."]'::jsonb, 'Mantén respiración rítmica; baja la intensidad si no puedes recuperarla.', '["Resistencia excesiva","Caderas balanceándose","Bloquear hombros y manos"]'::jsonb,
  '["Dolor de pecho, mareo o adormecimiento persistente","Dolor agudo de rodilla"]'::jsonb, 'Sesión más corta y resistencia baja', 'Aumentar tiempo en zona cómoda', '["cycle-intervals","cycle-cadence"]'::jsonb,
  '["dolor agudo de rodilla","señales cardiovasculares no evaluadas"]'::jsonb, 'inline_svg', 'cycle', 'cycle',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'cycle-cadence', 'Técnica y cadencia en bicicleta', '[]'::jsonb, 'cycling', 'beginner',
  '["bicycle"]'::jsonb, '["outdoor","gym"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'cycle',
  'Bicicleta estable, sillín ajustado y manos relajadas.', '["Pedalea suave hasta encontrar una cadencia estable.","Completa los bloques sin balancear excesivamente el tronco.","Recupera con resistencia baja y termina con pedaleo fácil."]'::jsonb, 'Mantén respiración rítmica; baja la intensidad si no puedes recuperarla.', '["Resistencia excesiva","Caderas balanceándose","Bloquear hombros y manos"]'::jsonb,
  '["Dolor de pecho, mareo o adormecimiento persistente","Dolor agudo de rodilla"]'::jsonb, 'Cadencia cómoda con bloques breves', 'Bloques más largos sin balancear el tronco', '["cycle-endurance"]'::jsonb,
  '["dolor agudo de rodilla","señales cardiovasculares no evaluadas"]'::jsonb, 'inline_svg', 'cycle', 'cycle',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'swim-intervals', 'Intervalos de natación', '[]'::jsonb, 'swimming', 'beginner',
  '["pool"]'::jsonb, '["pool"]'::jsonb, '["cuerpo completo"]'::jsonb, 'swim',
  'Cuerpo alineado, cuello relajado y respiración preparada.', '["Nada suave hasta estabilizar la técnica.","Mantén alineación y agarre antes de aumentar el ritmo.","Usa las pausas indicadas y sal del agua ante cualquier señal de alerta."]'::jsonb, 'Exhala dentro del agua y toma aire sin levantar en exceso la cabeza.', '["Acelerar perdiendo alineación","Contener el aire","Cruzar la mano delante de la cabeza"]'::jsonb,
  '["Mareo, dificultad respiratoria o desorientación","Dolor agudo de hombro"]'::jsonb, 'Bloques más cortos con pausa amplia', 'Aumentar distancia manteniendo técnica', '["swim-endurance","swim-drills"]'::jsonb,
  '["no saber nadar con seguridad","dolor agudo de hombro"]'::jsonb, 'inline_svg', 'swim', 'swim',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'swim-endurance', 'Natación aeróbica fácil', '[]'::jsonb, 'swimming', 'beginner',
  '["pool"]'::jsonb, '["pool"]'::jsonb, '["cuerpo completo"]'::jsonb, 'swim',
  'Cuerpo alineado, cuello relajado y respiración preparada.', '["Nada suave hasta estabilizar la técnica.","Mantén alineación y agarre antes de aumentar el ritmo.","Usa las pausas indicadas y sal del agua ante cualquier señal de alerta."]'::jsonb, 'Exhala dentro del agua y toma aire sin levantar en exceso la cabeza.', '["Acelerar perdiendo alineación","Contener el aire","Cruzar la mano delante de la cabeza"]'::jsonb,
  '["Mareo, dificultad respiratoria o desorientación","Dolor agudo de hombro"]'::jsonb, 'Alternar largos suaves y pausas', 'Aumentar distancia sin perder alineación', '["swim-intervals","swim-drills"]'::jsonb,
  '["no saber nadar con seguridad","dolor agudo de hombro"]'::jsonb, 'inline_svg', 'swim', 'swim',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'swim-drills', 'Técnica de natación', '[]'::jsonb, 'swimming', 'beginner',
  '["pool"]'::jsonb, '["pool"]'::jsonb, '["cuerpo completo"]'::jsonb, 'swim',
  'Cuerpo alineado, cuello relajado y respiración preparada.', '["Nada suave hasta estabilizar la técnica.","Mantén alineación y agarre antes de aumentar el ritmo.","Usa las pausas indicadas y sal del agua ante cualquier señal de alerta."]'::jsonb, 'Exhala dentro del agua y toma aire sin levantar en exceso la cabeza.', '["Acelerar perdiendo alineación","Contener el aire","Cruzar la mano delante de la cabeza"]'::jsonb,
  '["Mareo, dificultad respiratoria o desorientación","Dolor agudo de hombro"]'::jsonb, 'Un ejercicio técnico por bloque', 'Combinar ejercicios manteniendo respiración estable', '["swim-endurance"]'::jsonb,
  '["no saber nadar con seguridad","dolor agudo de hombro"]'::jsonb, 'inline_svg', 'swim', 'swim',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
-- REQ-67: ejercicios intermedios y avanzados para splits PPL / Upper-Lower
(
  'lateral-raise', 'Elevación lateral', '["elevaciones laterales"]'::jsonb, 'gym', 'intermediate',
  '["dumbbells"]'::jsonb, '["gym"]'::jsonb, '["hombros"]'::jsonb, 'isolation',
  'Articulación estable y recorrido cómodo sin impulso.',
  '["Agarra las mancuernas con los brazos ligeramente flexionados.","Eleva los brazos hasta la altura del hombro sin subir los trapecios.","Baja de forma controlada."]'::jsonb,
  'Exhala durante el esfuerzo e inhala al volver.',
  '["Usar impulso","Elevar los trapecios","Superar la altura del hombro"]'::jsonb,
  '["Dolor agudo de hombro o cuello","Hormigueo en brazo"]'::jsonb,
  'Elevación con poco rango', 'Elevación con pausa arriba', '["overhead-press"]'::jsonb,
  '["dolor agudo de hombro"]'::jsonb, 'inline_svg', 'isolation', 'isolation',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'cable-fly', 'Apertura en polea', '["cruces en polea"]'::jsonb, 'gym', 'intermediate',
  '["cable"]'::jsonb, '["gym"]'::jsonb, '["pecho","hombros"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.',
  '["Coloca los cables a la altura de los hombros y da un paso al frente.","Lleva las manos al centro con los codos ligeramente flexionados.","Regresa de forma controlada manteniendo la tensión."]'::jsonb,
  'Inhala al abrir y exhala al cerrar.',
  '["Codos bloqueados","Carga excesiva","Perder la postura del tronco"]'::jsonb,
  '["Dolor agudo de hombro o pecho","Pérdida súbita de fuerza"]'::jsonb,
  'Apertura con rango corto', 'Apertura con pausa al centro', '["bench-press","incline-dumbbell-press"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de pecho"]'::jsonb, 'inline_svg', 'push', 'push',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'face-pull', 'Face pull', '["jalón a la cara"]'::jsonb, 'gym', 'intermediate',
  '["cable"]'::jsonb, '["gym"]'::jsonb, '["hombros posteriores","trapecios"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.',
  '["Fija la polea alta y agarra la cuerda con las palmas hacia abajo.","Tira hacia la cara separando las manos y rotando los hombros hacia afuera.","Regresa lentamente manteniendo la tensión."]'::jsonb,
  'Exhala al tirar e inhala al volver.',
  '["Encoger los hombros","Usar impulso","Acortar la rotación externa"]'::jsonb,
  '["Dolor agudo de hombro o cuello","Hormigueo en brazo o mano"]'::jsonb,
  'Face pull con poco peso', 'Face pull con rotación externa completa', '["seated-cable-row"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de cuello"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'hammer-curl', 'Curl martillo', '["curl neutro"]'::jsonb, 'gym', 'intermediate',
  '["dumbbells"]'::jsonb, '["gym"]'::jsonb, '["bíceps","antebrazo"]'::jsonb, 'isolation',
  'Articulación estable y recorrido cómodo sin impulso.',
  '["Sujeta las mancuernas con agarre neutro (pulgares arriba).","Flexiona los codos acercando las mancuernas al hombro sin girar la muñeca.","Baja de forma controlada."]'::jsonb,
  'Exhala durante la flexión e inhala al extender.',
  '["Usar impulso con el torso","Girar la muñeca","Codo separado del cuerpo"]'::jsonb,
  '["Dolor agudo de codo o muñeca","Hormigueo en mano"]'::jsonb,
  'Curl martillo ligero', 'Curl inclinado en banco', '["biceps-curl"]'::jsonb,
  '["dolor agudo de codo","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'isolation', 'isolation',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'diamond-push-up', 'Flexión diamante', '["flexión tríceps"]'::jsonb, 'bodyweight', 'intermediate',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["tríceps","pecho"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.',
  '["Coloca las manos formando un diamante bajo el pecho.","Baja el pecho manteniendo los codos cerca del cuerpo.","Empuja hasta extender sin bloquear con violencia."]'::jsonb,
  'Inhala al bajar y exhala durante el empuje.',
  '["Hombros elevados","Codos abiertos","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb,
  'Flexión diamante con rodillas', 'Flexión diamante con pausa', '["push-up","assisted-dip"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'pull-up', 'Dominada', '["dominadas","chin-up"]'::jsonb, 'bodyweight', 'intermediate',
  '["pullup_bar"]'::jsonb, '["gym","outdoor"]'::jsonb, '["espalda","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.',
  '["Cuelga de la barra con los brazos extendidos y los hombros activos.","Tira hacia arriba hasta que la barbilla supere la barra.","Baja de forma controlada hasta recuperar el rango completo."]'::jsonb,
  'Exhala al subir e inhala al bajar.',
  '["Encoger los hombros al comienzo","Usar impulso","Acortar el descenso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb,
  'Dominada asistida con banda', 'Dominada con lastre', '["assisted-pull-up","lat-pulldown"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'decline-push-up', 'Flexión con pies elevados', '["flexión declinada"]'::jsonb, 'bodyweight', 'intermediate',
  '["bench_or_chair"]'::jsonb, '["home","gym"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.',
  '["Apoya los pies en un banco o silla con las manos en el suelo.","Baja el pecho con los codos a 45-75° del tronco.","Empuja hasta extender manteniendo el cuerpo alineado."]'::jsonb,
  'Inhala al bajar y exhala durante el empuje.',
  '["Hombros elevados","Caderas caídas","Rango incompleto"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Mareo al bajar la cabeza"]'::jsonb,
  'Flexión con pies a media altura', 'Flexión con lastre en espalda', '["push-up","bench-press"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca","vértigo"]'::jsonb, 'inline_svg', 'push', 'push',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'weighted-pull-up', 'Dominada con lastre', '["dominada lastrada"]'::jsonb, 'gym', 'advanced',
  '["pullup_bar","weight_belt"]'::jsonb, '["gym"]'::jsonb, '["espalda","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.',
  '["Fija el lastre y cuelga de la barra con los brazos extendidos.","Tira hacia arriba hasta que la barbilla supere la barra con control.","Baja de forma controlada hasta recuperar el rango completo."]'::jsonb,
  'Exhala al subir e inhala al bajar.',
  '["Usar impulso","Acortar el descenso","Carga excesiva que altera la técnica"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb,
  'Dominada sin lastre', 'Dominada con lastre máximo', '["pull-up","lat-pulldown"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'front-squat', 'Sentadilla frontal', '["front squat"]'::jsonb, 'gym', 'advanced',
  '["barbell","rack"]'::jsonb, '["gym"]'::jsonb, '["cuádriceps","core"]'::jsonb, 'squat',
  'Pies firmes, tronco alto y abdomen activo.',
  '["Coloca la barra sobre los deltoides anteriores con los codos altos.","Desciende manteniendo el torso muy vertical y las rodillas alineadas.","Empuja el suelo y vuelve a la posición inicial sin perder la posición de los codos."]'::jsonb,
  'Inhala antes de bajar, mantén el abdomen firme y exhala al subir.',
  '["Codos bajos que dejan caer la barra","Inclinación excesiva del torso","Rodillas colapsando"]'::jsonb,
  '["Dolor agudo de rodilla, cadera o espalda","Mareo o pérdida de equilibrio"]'::jsonb,
  'Sentadilla goblet', 'Sentadilla frontal con pausa', '["back-squat","tempo-squat"]'::jsonb,
  '["dolor agudo de rodilla","lesión reciente de cadera","dolor de muñeca"]'::jsonb, 'inline_svg', 'squat', 'squat',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'archer-push-up', 'Flexión arquero', '["flexión lateral"]'::jsonb, 'bodyweight', 'advanced',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.',
  '["Coloca las manos muy separadas en el suelo.","Desplaza el peso hacia un lado flexionando ese codo mientras el otro brazo permanece extendido.","Alterna lados de forma controlada."]'::jsonb,
  'Inhala al bajar y exhala durante el empuje.',
  '["Perder la alineación del tronco","Rango incompleto","Velocidad excesiva"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb,
  'Flexión arquero con apoyo', 'Flexión con un brazo asistida', '["diamond-push-up","push-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
),
(
  'nordic-hamstring-curl', 'Curl nórdico', '["nordico","nordic curl"]'::jsonb, 'bodyweight', 'advanced',
  '["bench_or_anchor"]'::jsonb, '["gym","home"]'::jsonb, '["isquiotibiales"]'::jsonb, 'hinge',
  'Pies al ancho de cadera, rodillas suaves y columna neutra.',
  '["Ancla los talones y arrodíllate con el cuerpo erguido.","Baja el cuerpo hacia adelante de forma excéntrica usando los isquiotibiales para frenar.","Empuja con las manos al final del descenso y usa los isquios para volver."]'::jsonb,
  'Inhala y bloquea el tronco antes de bajar; exhala al volver.',
  '["Caer sin control","No activar los isquiotibiales en el frenado","Caderas que se flexionan prematuramente"]'::jsonb,
  '["Dolor punzante de isquiotibiales","Calambres severos que no ceden"]'::jsonb,
  'Curl nórdico parcial', 'Curl nórdico completo con pausa', '["slider-leg-curl","romanian-deadlift"]'::jsonb,
  '["lesión reciente de isquiotibiales","dolor lumbar agudo"]'::jsonb, 'inline_svg', 'hinge', 'hinge',
  'Fitbros Studio', '', 'Contenido propio Fitbros', 'Fitbros Studio', true
)
on conflict (slug) do update set
  name=excluded.name,
  aliases=excluded.aliases,
  discipline=excluded.discipline,
  level=excluded.level,
  equipment=excluded.equipment,
  places=excluded.places,
  muscles=excluded.muscles,
  movement_pattern=excluded.movement_pattern,
  start_position=excluded.start_position,
  steps=excluded.steps,
  breathing=excluded.breathing,
  common_errors=excluded.common_errors,
  safety_signals=excluded.safety_signals,
  regression=excluded.regression,
  progression=excluded.progression,
  substitute_slugs=excluded.substitute_slugs,
  contraindications=excluded.contraindications,
  media_type=excluded.media_type,
  media_key=excluded.media_key,
  static_key=excluded.static_key,
  source_name=excluded.source_name,
  source_url=excluded.source_url,
  license_name=excluded.license_name,
  attribution=excluded.attribution,
  active=excluded.active,
  updated_at=now();
