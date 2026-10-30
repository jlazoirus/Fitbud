-- ============================================================
-- Fitbros - biblioteca de ejercicios y demostraciones (REQ-15)
-- Idempotente. Ejecuta despues de supabase/auth.sql.
--
-- Contenido: guías SVG propias y fotografías Free Exercise DB (Unlicense),
-- con fuente/licencia por ficha. Las demostraciones revisadas se sirven
-- desde assets/ del deploy, sin hotlinks. Recuperación: archivar filas
-- nuevas (active=false); conservar IDs utilizados en historiales.
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
  'back-squat', 'Sentadilla con barra', '["sentadilla"]'::jsonb, 'gym', 'intermediate',
  '["barbell","rack"]'::jsonb, '["gym"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'squat',
  'Pies firmes, tronco alto y abdomen activo.', '["Lleva la cadera atrás y flexiona las rodillas con control.","Desciende hasta el rango que puedas mantener sin dolor.","Empuja el suelo y vuelve a la posición inicial sin perder alineación."]'::jsonb, 'Inhala antes de bajar, mantén el abdomen firme y exhala al subir.', '["Rodillas colapsando hacia dentro","Talones despegados","Perder la postura del tronco"]'::jsonb,
  '["Dolor agudo de rodilla, cadera o espalda","Mareo o pérdida de equilibrio"]'::jsonb, 'Sentadilla a caja', 'Sentadilla frontal', '["tempo-squat","leg-press","bulgarian-split-squat","walking-lunge","step-up","front-squat","dumbbell-squat","dumbbell-reverse-lunge","leg-extension"]'::jsonb,
  '["dolor agudo de rodilla","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'squat', 'squat',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'bench-press', 'Press de banca', '["press banca"]'::jsonb, 'gym', 'intermediate',
  '["barbell","bench"]'::jsonb, '["gym"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Press de pecho en el suelo', 'Press de banca con pausa en el pecho', '["push-up","incline-dumbbell-press","assisted-dip","incline-push-up","cable-fly","decline-push-up","archer-push-up","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press","pec-deck"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'seated-cable-row', 'Remo sentado en polea', '["remo sentado"]'::jsonb, 'gym', 'beginner',
  '["cable"]'::jsonb, '["gym"]'::jsonb, '["espalda","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.', '["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Remo con banda', 'Remo sentado con pausa', '["band-row","inverted-row","one-arm-dumbbell-row"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'romanian-deadlift', 'Peso muerto rumano', '["RDL"]'::jsonb, 'gym', 'intermediate',
  '["barbell"]'::jsonb, '["gym"]'::jsonb, '["isquiotibiales","glúteos"]'::jsonb, 'hinge',
  'Pies al ancho de cadera, rodillas suaves y columna neutra.', '["Empuja la cadera hacia atrás manteniendo la carga cerca del cuerpo.","Baja solo mientras conserves la espalda estable.","Aprieta glúteos y lleva la cadera hacia delante para volver."]'::jsonb, 'Inhala y bloquea el tronco antes de bajar; exhala al extender la cadera.', '["Redondear la espalda","Convertir el movimiento en sentadilla","Separar la carga del cuerpo"]'::jsonb,
  '["Dolor punzante lumbar","Hormigueo o dolor irradiado"]'::jsonb, 'Reduce la carga de la barra para practicar la bisagra sin perder la postura', 'Peso muerto a una pierna', '["single-leg-rdl","leg-curl","slider-leg-curl","nordic-hamstring-curl","band-seated-leg-curl","dumbbell-stiff-leg-deadlift","seated-leg-curl"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de isquiotibiales"]'::jsonb, 'inline_svg', 'hinge', 'hinge',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'barbell-hip-thrust', 'Hip thrust', '["empuje de cadera"]'::jsonb, 'gym', 'intermediate',
  '["barbell","bench"]'::jsonb, '["gym"]'::jsonb, '["glúteos","isquiotibiales"]'::jsonb, 'bridge',
  'Apoya la espalda y los pies con la pelvis neutra.', '["Activa el abdomen antes de mover la cadera.","Eleva la pelvis apretando glúteos sin arquear la espalda.","Pausa arriba y baja de forma controlada."]'::jsonb, 'Exhala al elevar la cadera e inhala al bajar.', '["Empujar solo con la zona lumbar","Pies demasiado lejos","Rodillas abriéndose o cerrándose"]'::jsonb,
  '["Dolor lumbar o de cadera","Calambre persistente"]'::jsonb, 'Puente de glúteo', 'Hip thrust con pausa arriba', '["glute-bridge","single-leg-glute-bridge"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'bridge', 'bridge',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'incline-dumbbell-press', 'Press inclinado con mancuernas', '["press inclinado"]'::jsonb, 'gym', 'beginner',
  '["dumbbells","bench"]'::jsonb, '["gym"]'::jsonb, '["pecho","hombros","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Usa mancuernas más ligeras', 'Press inclinado alternado', '["bench-press","incline-push-up","assisted-dip","push-up","cable-fly","decline-push-up","archer-push-up","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press","pec-deck"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'lat-pulldown', 'Jalón al pecho', '["jalón"]'::jsonb, 'gym', 'beginner',
  '["cable"]'::jsonb, '["gym"]'::jsonb, '["dorsales","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.', '["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Reduce el peso de la polea sin perder el control del tirón', 'Dominada asistida', '["assisted-pull-up","pull-up","weighted-pull-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'bulgarian-split-squat', 'Sentadilla búlgara', '["búlgara"]'::jsonb, 'strength', 'intermediate',
  '["bench_or_chair"]'::jsonb, '["gym","home"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'lunge',
  'Tronco alto, pies separados y mirada al frente.', '["Da un paso estable y reparte el peso entre ambos pies.","Baja la rodilla posterior con control sin golpear el suelo.","Empuja con el pie delantero para volver o avanzar."]'::jsonb, 'Inhala al bajar y exhala al subir.', '["Paso demasiado corto","Rodilla colapsando hacia dentro","Perder el equilibrio"]'::jsonb,
  '["Dolor agudo de rodilla o cadera","Inestabilidad que no mejora al reducir rango"]'::jsonb, 'Zancada', 'Sentadilla búlgara con más carga', '["walking-lunge","step-up","back-squat","leg-press","tempo-squat","front-squat","dumbbell-squat","dumbbell-reverse-lunge","leg-extension"]'::jsonb,
  '["dolor agudo de rodilla","problemas de equilibrio no evaluados"]'::jsonb, 'image', 'lunge', 'lunge',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'overhead-press', 'Press militar', '["press sobre cabeza"]'::jsonb, 'gym', 'intermediate',
  '["barbell_or_dumbbells"]'::jsonb, '["gym"]'::jsonb, '["hombros","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Press de hombros sentado con mancuernas', 'Press militar de pie con pausa', '["pike-push-up","band-shoulder-press","seated-dumbbell-press","machine-shoulder-press"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'walking-lunge', 'Zancada', '["lunges"]'::jsonb, 'strength', 'intermediate',
  '[]'::jsonb, '["gym","home","outdoor"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'lunge',
  'Tronco alto, pies separados y mirada al frente.', '["Da un paso estable y reparte el peso entre ambos pies.","Baja la rodilla posterior con control sin golpear el suelo.","Empuja con el pie delantero para volver o avanzar."]'::jsonb, 'Inhala al bajar y exhala al subir.', '["Paso demasiado corto","Rodilla colapsando hacia dentro","Perder el equilibrio"]'::jsonb,
  '["Dolor agudo de rodilla o cadera","Inestabilidad que no mejora al reducir rango"]'::jsonb, 'Zancada con apoyo', 'Sentadilla búlgara', '["bulgarian-split-squat","step-up","back-squat","leg-press","tempo-squat","front-squat","dumbbell-squat","dumbbell-reverse-lunge","leg-extension"]'::jsonb,
  '["dolor agudo de rodilla","problemas de equilibrio no evaluados"]'::jsonb, 'image_sequence', 'lunge', 'lunge',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'standing-calf-raise', 'Elevación de gemelos', '["gemelos"]'::jsonb, 'strength', 'beginner',
  '[]'::jsonb, '["gym","home"]'::jsonb, '["pantorrillas"]'::jsonb, 'calf',
  'Pies paralelos, apoyo estable y rodillas suaves.', '["Eleva los talones manteniendo el peso sobre el primer y segundo dedo.","Pausa arriba sin perder equilibrio.","Baja lentamente hasta apoyar por completo."]'::jsonb, 'Exhala al subir e inhala al bajar.', '["Rebotar","Girar los tobillos","Acortar el descenso"]'::jsonb,
  '["Dolor agudo de tobillo o pantorrilla","Pérdida de equilibrio"]'::jsonb, 'Elevación de gemelos con apoyo', 'Elevación de gemelos a una pierna', '["seated-dumbbell-calf-raise","seated-calf-raise"]'::jsonb,
  '["lesión reciente de Aquiles","dolor agudo de tobillo"]'::jsonb, 'image', 'calf', 'calf',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'assisted-dip', 'Fondos asistidos', '["fondos"]'::jsonb, 'strength', 'intermediate',
  '["bench_or_assistance"]'::jsonb, '["gym","home"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Flexión inclinada', 'Fondos con menos asistencia', '["incline-push-up","push-up","bench-press","incline-dumbbell-press","cable-fly","decline-push-up","archer-push-up","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press","pec-deck"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'biceps-curl', 'Curl de bíceps', '["curl"]'::jsonb, 'gym', 'beginner',
  '["dumbbells_or_cable"]'::jsonb, '["gym"]'::jsonb, '["bíceps"]'::jsonb, 'isolation',
  'Articulación estable y recorrido cómodo sin impulso.', '["Ajusta la carga para controlar todo el movimiento.","Mueve solo la articulación objetivo.","Regresa lentamente sin dejar caer la carga."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Usa mancuernas más ligeras', 'Curl alternado controlado', '["hammer-curl","concentration-curl","dumbbell-alternating-curl","machine-biceps-curl"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'inline_svg', 'isolation', 'isolation',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'triceps-pushdown', 'Extensión de tríceps en polea', '["tríceps polea"]'::jsonb, 'gym', 'beginner',
  '["cable"]'::jsonb, '["gym"]'::jsonb, '["tríceps"]'::jsonb, 'isolation',
  'Articulación estable y recorrido cómodo sin impulso.', '["Ajusta la carga para controlar todo el movimiento.","Mueve solo la articulación objetivo.","Regresa lentamente sin dejar caer la carga."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce el peso de la polea', 'Extensión de tríceps a un brazo', '["diamond-push-up","lying-dumbbell-triceps-extension"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'inline_svg', 'isolation', 'isolation',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'leg-press', 'Prensa de piernas', '["prensa"]'::jsonb, 'gym', 'beginner',
  '["leg_press"]'::jsonb, '["gym"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'squat',
  'Pies firmes, tronco alto y abdomen activo.', '["Lleva la cadera atrás y flexiona las rodillas con control.","Desciende hasta el rango que puedas mantener sin dolor.","Empuja el suelo y vuelve a la posición inicial sin perder alineación."]'::jsonb, 'Inhala antes de bajar, mantén el abdomen firme y exhala al subir.', '["Rodillas colapsando hacia dentro","Talones despegados","Perder la postura del tronco"]'::jsonb,
  '["Dolor agudo de rodilla, cadera o espalda","Mareo o pérdida de equilibrio"]'::jsonb, 'Prensa con rango corto', 'Prensa a una pierna', '["back-squat","tempo-squat","bulgarian-split-squat","walking-lunge","step-up","front-squat","dumbbell-squat","dumbbell-reverse-lunge","leg-extension"]'::jsonb,
  '["dolor agudo de rodilla","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'squat', 'squat',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'leg-curl', 'Curl femoral', '["femoral"]'::jsonb, 'gym', 'beginner',
  '["leg_curl"]'::jsonb, '["gym"]'::jsonb, '["isquiotibiales"]'::jsonb, 'isolation',
  'Articulación estable y recorrido cómodo sin impulso.', '["Ajusta la carga para controlar todo el movimiento.","Mueve solo la articulación objetivo.","Regresa lentamente sin dejar caer la carga."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Curl femoral con rango corto', 'Curl femoral a una pierna', '["slider-leg-curl","romanian-deadlift","single-leg-rdl","nordic-hamstring-curl","band-seated-leg-curl","dumbbell-stiff-leg-deadlift","seated-leg-curl"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'inline_svg', 'isolation', 'isolation',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'tempo-squat', 'Sentadilla tempo', '["sentadilla corporal"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'squat',
  'Pies firmes, tronco alto y abdomen activo.', '["Lleva la cadera atrás y flexiona las rodillas con control.","Desciende hasta el rango que puedas mantener sin dolor.","Empuja el suelo y vuelve a la posición inicial sin perder alineación."]'::jsonb, 'Inhala antes de bajar, mantén el abdomen firme y exhala al subir.', '["Rodillas colapsando hacia dentro","Talones despegados","Perder la postura del tronco"]'::jsonb,
  '["Dolor agudo de rodilla, cadera o espalda","Mareo o pérdida de equilibrio"]'::jsonb, 'Sentarse y levantarse de una silla', 'Sentadilla con pausa abajo', '["back-squat","step-up","bulgarian-split-squat","walking-lunge","leg-press","front-squat","dumbbell-squat","dumbbell-reverse-lunge","leg-extension"]'::jsonb,
  '["dolor agudo de rodilla","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'squat', 'squat',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'push-up', 'Flexión de brazos', '["flexiones"]'::jsonb, 'bodyweight', 'intermediate',
  '[]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Flexión inclinada', 'Flexión con pies elevados', '["incline-push-up","bench-press","incline-dumbbell-press","assisted-dip","cable-fly","decline-push-up","archer-push-up","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press","pec-deck"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'incline-push-up', 'Flexión inclinada', '["flexión elevada"]'::jsonb, 'bodyweight', 'beginner',
  '["bench_or_wall"]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Flexión contra la pared', 'Flexión de brazos', '["push-up","assisted-dip","bench-press","incline-dumbbell-press","cable-fly","decline-push-up","archer-push-up","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press","pec-deck"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'band-row', 'Remo con banda', '["remo con banda elástica"]'::jsonb, 'bodyweight', 'beginner',
  '["resistance_band"]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["espalda","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.', '["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Usa una banda más suave', 'Remo invertido', '["inverted-row","seated-cable-row","one-arm-dumbbell-row"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'image', 'pull', 'pull',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'inverted-row', 'Remo invertido', '["remo bajo la mesa","remo australiano"]'::jsonb, 'bodyweight', 'beginner',
  '["table_or_low_bar"]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["espalda","bíceps"]'::jsonb, 'pull',
  'Túmbate boca arriba bajo una mesa firme (o una barra baja) y agarra el borde con las manos al ancho de hombros, rodillas flexionadas y talones en el suelo.', '["Aprieta glúteos y abdomen para que hombros, cadera y rodillas queden en línea.","Lleva el pecho hacia el borde juntando las escápulas, con los codos cerca del cuerpo.","Baja con control hasta estirar los brazos, sin dejar caer la cadera."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Dejar caer la cadera","Adelantar el cuello hacia el borde","Usar una mesa ligera o con patas plegables"]'::jsonb,
  '["La mesa se mueve, cruje o se inclina","Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Remo invertido más vertical', 'Remo invertido con piernas estiradas', '["band-row","seated-cable-row","one-arm-dumbbell-row"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'image_sequence', 'pull', 'pull',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'glute-bridge', 'Puente de glúteo', '["puente"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["glúteos","isquiotibiales"]'::jsonb, 'bridge',
  'Apoya la espalda y los pies con la pelvis neutra.', '["Activa el abdomen antes de mover la cadera.","Eleva la pelvis apretando glúteos sin arquear la espalda.","Pausa arriba y baja de forma controlada."]'::jsonb, 'Exhala al elevar la cadera e inhala al bajar.', '["Empujar solo con la zona lumbar","Pies demasiado lejos","Rodillas abriéndose o cerrándose"]'::jsonb,
  '["Dolor lumbar o de cadera","Calambre persistente"]'::jsonb, 'Puente de glúteo con rango corto', 'Puente de glúteo a una pierna', '["barbell-hip-thrust","single-leg-glute-bridge"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'bridge', 'bridge',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'single-leg-glute-bridge', 'Puente de glúteo a una pierna', '["puente unilateral"]'::jsonb, 'bodyweight', 'intermediate',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["glúteos","isquiotibiales"]'::jsonb, 'bridge',
  'Apoya la espalda y los pies con la pelvis neutra.', '["Activa el abdomen antes de mover la cadera.","Eleva la pelvis apretando glúteos sin arquear la espalda.","Pausa arriba y baja de forma controlada."]'::jsonb, 'Exhala al elevar la cadera e inhala al bajar.', '["Empujar solo con la zona lumbar","Pies demasiado lejos","Rodillas abriéndose o cerrándose"]'::jsonb,
  '["Dolor lumbar o de cadera","Calambre persistente"]'::jsonb, 'Puente de glúteo', 'Puente a una pierna con pausa arriba', '["glute-bridge","barbell-hip-thrust"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'bridge', 'bridge',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'front-plank', 'Plancha frontal', '["plancha"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["core"]'::jsonb, 'core',
  'Columna neutra, abdomen activo y respiración continua.', '["Crea tensión suave antes de mover brazos o piernas.","Mantén pelvis y costillas estables durante el ejercicio.","Detén la serie cuando pierdas la postura."]'::jsonb, 'Respira corto y continuo; no aguantes el aire por tiempo prolongado.', '["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"]'::jsonb,
  '["Dolor lumbar o cervical","Mareo al sostener la posición"]'::jsonb, 'Plancha con rodillas apoyadas', 'Plancha con toque de hombro', '["dead-bug","side-plank","shoulder-tap-plank","crunch","reverse-crunch","oblique-crunch"]'::jsonb,
  '["dolor lumbar agudo","cirugía abdominal reciente"]'::jsonb, 'inline_svg', 'core', 'core',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'side-plank', 'Plancha lateral', '["plancha de lado"]'::jsonb, 'bodyweight', 'intermediate',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["core","oblicuos"]'::jsonb, 'core',
  'Columna neutra, abdomen activo y respiración continua.', '["Crea tensión suave antes de mover brazos o piernas.","Mantén pelvis y costillas estables durante el ejercicio.","Detén la serie cuando pierdas la postura."]'::jsonb, 'Respira corto y continuo; no aguantes el aire por tiempo prolongado.', '["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"]'::jsonb,
  '["Dolor lumbar o cervical","Mareo al sostener la posición"]'::jsonb, 'Plancha lateral con rodillas', 'Plancha lateral con pierna elevada', '["front-plank","dead-bug","shoulder-tap-plank","crunch","reverse-crunch","oblique-crunch"]'::jsonb,
  '["dolor lumbar agudo","cirugía abdominal reciente"]'::jsonb, 'inline_svg', 'core', 'core',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'dead-bug', 'Dead bug', '["insecto muerto"]'::jsonb, 'bodyweight', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["core"]'::jsonb, 'core',
  'Columna neutra, abdomen activo y respiración continua.', '["Crea tensión suave antes de mover brazos o piernas.","Mantén pelvis y costillas estables durante el ejercicio.","Detén la serie cuando pierdas la postura."]'::jsonb, 'Respira corto y continuo; no aguantes el aire por tiempo prolongado.', '["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"]'::jsonb,
  '["Dolor lumbar o cervical","Mareo al sostener la posición"]'::jsonb, 'Dead bug moviendo solo brazos o piernas', 'Dead bug con brazo y pierna opuestos', '["front-plank","shoulder-tap-plank","side-plank","crunch","reverse-crunch","oblique-crunch"]'::jsonb,
  '["dolor lumbar agudo","cirugía abdominal reciente"]'::jsonb, 'inline_svg', 'core', 'core',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'pike-push-up', 'Pike push-up', '["flexión pica"]'::jsonb, 'bodyweight', 'intermediate',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["hombros","tríceps"]'::jsonb, 'push',
  'Manos al ancho de hombros, pies apoyados en el suelo y cadera elevada formando una V invertida.', '["Mantén los pies en el suelo y el abdomen firme; flexiona los codos con control.","Acerca la cabeza al suelo entre las manos y ligeramente por delante, sin apoyarla ni cargar el cuello.","Empuja con los brazos para volver a la V invertida, conservando la cadera elevada."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Despegar los pies e intentar una parada de manos","Abrir los codos en exceso","Apoyar el peso sobre la cabeza o el cuello"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Pike push-up con manos elevadas', 'Pike push-up con pies elevados', '["overhead-press","band-shoulder-press","seated-dumbbell-press","machine-shoulder-press"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'image', 'push', 'push',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'single-leg-rdl', 'Peso muerto a una pierna', '["bisagra unilateral"]'::jsonb, 'bodyweight', 'intermediate',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["isquiotibiales","glúteos"]'::jsonb, 'hinge',
  'Pies al ancho de cadera, rodillas suaves y columna neutra.', '["Empuja la cadera hacia atrás manteniendo la carga cerca del cuerpo.","Baja solo mientras conserves la espalda estable.","Aprieta glúteos y lleva la cadera hacia delante para volver."]'::jsonb, 'Inhala y bloquea el tronco antes de bajar; exhala al extender la cadera.', '["Redondear la espalda","Convertir el movimiento en sentadilla","Separar la carga del cuerpo"]'::jsonb,
  '["Dolor punzante lumbar","Hormigueo o dolor irradiado"]'::jsonb, 'Peso muerto a una pierna con apoyo', 'Peso muerto a una pierna con carga', '["romanian-deadlift","leg-curl","slider-leg-curl","nordic-hamstring-curl","band-seated-leg-curl","dumbbell-stiff-leg-deadlift","seated-leg-curl"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de isquiotibiales"]'::jsonb, 'image', 'hinge', 'hinge',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'assisted-pull-up', 'Dominada asistida', '["dominada con banda"]'::jsonb, 'bodyweight', 'intermediate',
  '["pullup_bar","resistance_band"]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["espalda","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.', '["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Usa una banda de mayor asistencia y conserva la bajada controlada', 'Dominada con menos asistencia', '["lat-pulldown","pull-up","weighted-pull-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'shoulder-tap-plank', 'Plancha con toque de hombro', '["toques de hombro"]'::jsonb, 'bodyweight', 'intermediate',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["core","hombros"]'::jsonb, 'core',
  'Columna neutra, abdomen activo y respiración continua.', '["Crea tensión suave antes de mover brazos o piernas.","Mantén pelvis y costillas estables durante el ejercicio.","Detén la serie cuando pierdas la postura."]'::jsonb, 'Respira corto y continuo; no aguantes el aire por tiempo prolongado.', '["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"]'::jsonb,
  '["Dolor lumbar o cervical","Mareo al sostener la posición"]'::jsonb, 'Plancha frontal', 'Toques de hombro más lentos', '["front-plank","dead-bug","side-plank","crunch","reverse-crunch","oblique-crunch"]'::jsonb,
  '["dolor lumbar agudo","cirugía abdominal reciente"]'::jsonb, 'image', 'core', 'core',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'step-up', 'Subida al banco', '["step ups"]'::jsonb, 'bodyweight', 'beginner',
  '["step_or_bench"]'::jsonb, '["home","outdoor","gym"]'::jsonb, '["cuádriceps","glúteos"]'::jsonb, 'lunge',
  'Tronco alto, pies separados y mirada al frente.', '["Da un paso estable y reparte el peso entre ambos pies.","Baja la rodilla posterior con control sin golpear el suelo.","Empuja con el pie delantero para volver o avanzar."]'::jsonb, 'Inhala al bajar y exhala al subir.', '["Paso demasiado corto","Rodilla colapsando hacia dentro","Perder el equilibrio"]'::jsonb,
  '["Dolor agudo de rodilla o cadera","Inestabilidad que no mejora al reducir rango"]'::jsonb, 'Subida a un escalón bajo con apoyo', 'Escalón más alto o con carga', '["walking-lunge","bulgarian-split-squat","back-squat","leg-press","tempo-squat","front-squat","dumbbell-squat","dumbbell-reverse-lunge","leg-extension"]'::jsonb,
  '["dolor agudo de rodilla","problemas de equilibrio no evaluados"]'::jsonb, 'image', 'lunge', 'lunge',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'slider-leg-curl', 'Curl femoral deslizante', '["curl deslizante"]'::jsonb, 'bodyweight', 'intermediate',
  '["sliders_or_towel"]'::jsonb, '["home","gym"]'::jsonb, '["isquiotibiales","glúteos"]'::jsonb, 'hinge',
  'Pies al ancho de cadera, rodillas suaves y columna neutra.', '["Empuja la cadera hacia atrás manteniendo la carga cerca del cuerpo.","Baja solo mientras conserves la espalda estable.","Aprieta glúteos y lleva la cadera hacia delante para volver."]'::jsonb, 'Inhala y bloquea el tronco antes de bajar; exhala al extender la cadera.', '["Redondear la espalda","Convertir el movimiento en sentadilla","Separar la carga del cuerpo"]'::jsonb,
  '["Dolor punzante lumbar","Hormigueo o dolor irradiado"]'::jsonb, 'Curl deslizante bilateral con recorrido corto', 'Curl deslizante completo con cadera elevada', '["leg-curl","romanian-deadlift","single-leg-rdl","nordic-hamstring-curl","band-seated-leg-curl","dumbbell-stiff-leg-deadlift","seated-leg-curl"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de isquiotibiales"]'::jsonb, 'image', 'hinge', 'hinge',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'lateral-raise', 'Elevación lateral', '["elevaciones laterales"]'::jsonb, 'gym', 'beginner',
  '["dumbbells"]'::jsonb, '["gym"]'::jsonb, '["hombros"]'::jsonb, 'isolation',
  'Articulación estable y recorrido cómodo sin impulso.', '["Ajusta la carga para controlar todo el movimiento.","Mueve solo la articulación objetivo.","Regresa lentamente sin dejar caer la carga."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Elevación lateral con poco rango', 'Elevación lateral con pausa arriba', '["band-lateral-raise"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'inline_svg', 'isolation', 'isolation',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'cable-fly', 'Apertura en polea', '["cruces en polea"]'::jsonb, 'gym', 'intermediate',
  '["cable"]'::jsonb, '["gym"]'::jsonb, '["pecho","hombros"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Apertura en polea con rango corto', 'Apertura en polea con pausa al centro', '["bench-press","incline-dumbbell-press","assisted-dip","push-up","incline-push-up","decline-push-up","archer-push-up","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press","pec-deck"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'face-pull', 'Face pull', '["jalón a la cara"]'::jsonb, 'gym', 'intermediate',
  '["cable"]'::jsonb, '["gym"]'::jsonb, '["hombros posteriores","trapecios"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.', '["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Usa menos peso', 'Face pull con rotación externa', '["band-pull-apart","seated-dumbbell-reverse-fly","reverse-pec-deck"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'hammer-curl', 'Curl martillo', '["curl neutro"]'::jsonb, 'gym', 'beginner',
  '["dumbbells"]'::jsonb, '["gym"]'::jsonb, '["bíceps","antebrazo"]'::jsonb, 'isolation',
  'Articulación estable y recorrido cómodo sin impulso.', '["Ajusta la carga para controlar todo el movimiento.","Mueve solo la articulación objetivo.","Regresa lentamente sin dejar caer la carga."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Usa mancuernas más ligeras', 'Aumenta ligeramente las mancuernas al completar todas las series sin balancearte', '["biceps-curl","concentration-curl","dumbbell-alternating-curl","machine-biceps-curl"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'inline_svg', 'isolation', 'isolation',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'diamond-push-up', 'Flexión diamante', '["flexión tríceps"]'::jsonb, 'bodyweight', 'intermediate',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["tríceps","pecho"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Flexión diamante con rodillas', 'Flexión diamante con pausa', '["triceps-pushdown","lying-dumbbell-triceps-extension"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'pull-up', 'Dominada', '["dominadas","chin-up"]'::jsonb, 'bodyweight', 'intermediate',
  '["pullup_bar"]'::jsonb, '["gym","outdoor"]'::jsonb, '["espalda","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.', '["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Dominada asistida', 'Dominada con lastre', '["assisted-pull-up","lat-pulldown","weighted-pull-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'decline-push-up', 'Flexión con pies elevados', '["flexión declinada"]'::jsonb, 'bodyweight', 'intermediate',
  '["bench_or_chair"]'::jsonb, '["home","gym"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Flexión de brazos', 'Flexión arquero', '["push-up","bench-press","incline-dumbbell-press","assisted-dip","incline-push-up","cable-fly","archer-push-up","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press","pec-deck"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'inline_svg', 'push', 'push',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'weighted-pull-up', 'Dominada con lastre', '["dominada lastrada"]'::jsonb, 'gym', 'advanced',
  '["pullup_bar","weight_belt"]'::jsonb, '["gym"]'::jsonb, '["espalda","bíceps"]'::jsonb, 'pull',
  'Agarre firme, pecho abierto y hombros alejados de las orejas.', '["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Dominada', 'Dominada con más lastre', '["pull-up","lat-pulldown","assisted-pull-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'inline_svg', 'pull', 'pull',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'front-squat', 'Sentadilla frontal', '["front squat"]'::jsonb, 'gym', 'advanced',
  '["barbell","rack"]'::jsonb, '["gym"]'::jsonb, '["cuádriceps","core"]'::jsonb, 'squat',
  'Pies firmes, tronco alto y abdomen activo.', '["Lleva la cadera atrás y flexiona las rodillas con control.","Desciende hasta el rango que puedas mantener sin dolor.","Empuja el suelo y vuelve a la posición inicial sin perder alineación."]'::jsonb, 'Inhala antes de bajar, mantén el abdomen firme y exhala al subir.', '["Rodillas colapsando hacia dentro","Talones despegados","Perder la postura del tronco"]'::jsonb,
  '["Dolor agudo de rodilla, cadera o espalda","Mareo o pérdida de equilibrio"]'::jsonb, 'Sentadilla con mancuernas a los lados', 'Sentadilla frontal con pausa', '["back-squat","tempo-squat","bulgarian-split-squat","walking-lunge","leg-press","step-up","dumbbell-squat","dumbbell-reverse-lunge","leg-extension"]'::jsonb,
  '["dolor agudo de rodilla","lesión reciente de cadera"]'::jsonb, 'inline_svg', 'squat', 'squat',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'archer-push-up', 'Flexión arquero', '["flexión lateral"]'::jsonb, 'bodyweight', 'advanced',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["pecho","tríceps"]'::jsonb, 'push',
  'Manos estables, hombros lejos de las orejas y tronco firme.', '["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Flexión arquero con apoyo', 'Flexión a un brazo asistida', '["push-up","bench-press","incline-dumbbell-press","assisted-dip","incline-push-up","cable-fly","decline-push-up","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press","pec-deck"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'image', 'push', 'push',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'nordic-hamstring-curl', 'Curl nórdico', '["nordico","nordic curl"]'::jsonb, 'bodyweight', 'advanced',
  '["bench_or_anchor"]'::jsonb, '["gym","home"]'::jsonb, '["isquiotibiales"]'::jsonb, 'hinge',
  'Pies al ancho de cadera, rodillas suaves y columna neutra.', '["Empuja la cadera hacia atrás manteniendo la carga cerca del cuerpo.","Baja solo mientras conserves la espalda estable.","Aprieta glúteos y lleva la cadera hacia delante para volver."]'::jsonb, 'Inhala y bloquea el tronco antes de bajar; exhala al extender la cadera.', '["Redondear la espalda","Convertir el movimiento en sentadilla","Separar la carga del cuerpo"]'::jsonb,
  '["Dolor punzante lumbar","Hormigueo o dolor irradiado"]'::jsonb, 'Curl nórdico parcial', 'Curl nórdico completo con pausa', '["slider-leg-curl","romanian-deadlift","leg-curl","single-leg-rdl","band-seated-leg-curl","dumbbell-stiff-leg-deadlift","seated-leg-curl"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de isquiotibiales"]'::jsonb, 'inline_svg', 'hinge', 'hinge',
  'Evolv Studio', '', 'Contenido propio Evolv', 'Evolv Studio', true
),
(
  'band-pull-apart', 'Apertura de banda al frente', '["Band Pull Apart"]'::jsonb, 'strength', 'beginner',
  '["resistance_band"]'::jsonb, '["home","gym"]'::jsonb, '["Deltoides posterior"]'::jsonb, 'isolation',
  'De pie, sujeta una banda delante del pecho con los brazos extendidos.', '["Separa las manos sin encoger los hombros.","Acerca la banda al pecho con los codos suaves y el tronco quieto.","Vuelve despacio sin soltar la tensión."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["face-pull","seated-dumbbell-reverse-fly","reverse-pec-deck"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'image_sequence', 'isolation', 'isolation',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'band-lateral-raise', 'Elevación lateral con banda', '["Lateral Raise - With Bands"]'::jsonb, 'strength', 'beginner',
  '["resistance_band"]'::jsonb, '["home","gym"]'::jsonb, '["Deltoides lateral"]'::jsonb, 'isolation',
  'Pisa el centro de la banda y sujeta los extremos junto a los muslos.', '["Eleva los brazos hacia los lados hasta la altura de hombros.","Mantén los codos ligeramente flexionados y las muñecas neutras.","Baja sin balancear el cuerpo."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["lateral-raise"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'image_sequence', 'isolation', 'isolation',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'band-shoulder-press', 'Press de hombros con banda', '["Shoulder Press - With Bands"]'::jsonb, 'strength', 'intermediate',
  '["resistance_band"]'::jsonb, '["home","gym"]'::jsonb, '["Hombros"]'::jsonb, 'push',
  'Pisa la banda con ambos pies y coloca las manos a la altura de los hombros.', '["Activa el abdomen y empuja los extremos por encima de la cabeza.","Extiende los brazos sin arquear la espalda ni encoger el cuello.","Vuelve con control a la altura de hombros."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["overhead-press","pike-push-up","seated-dumbbell-press","machine-shoulder-press"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'image_sequence', 'push', 'push',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'band-chest-fly', 'Apertura de pecho con banda', '["Cross Over - With Bands"]'::jsonb, 'strength', 'intermediate',
  '["resistance_band"]'::jsonb, '["home","gym"]'::jsonb, '["Pecho"]'::jsonb, 'push',
  'Ancla la banda a un poste firme detrás del cuerpo, a la altura del pecho, y adelanta un pie.', '["Abre los brazos con los codos ligeramente flexionados.","Junta las manos delante del pecho sin cambiar el ángulo de los codos.","Abre despacio hasta un recorrido cómodo; comprueba antes el anclaje."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["push-up","bench-press","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press","pec-deck","incline-dumbbell-press","assisted-dip","incline-push-up","cable-fly","decline-push-up","archer-push-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'image_sequence', 'push', 'push',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'band-seated-leg-curl', 'Curl femoral sentado con banda', '["Seated Band Hamstring Curl"]'::jsonb, 'strength', 'beginner',
  '["resistance_band","bench_or_chair"]'::jsonb, '["home","gym"]'::jsonb, '["Isquiotibiales"]'::jsonb, 'isolation',
  'Siéntate en un banco firme frente a una banda anclada cerca del suelo, colocada detrás de los tobillos.', '["Empieza con las piernas casi extendidas y el tronco estable.","Flexiona las rodillas llevando los talones hacia el banco.","Extiende despacio sin que la banda se suelte del anclaje o los tobillos."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["leg-curl","slider-leg-curl","dumbbell-stiff-leg-deadlift","seated-leg-curl","romanian-deadlift","single-leg-rdl","nordic-hamstring-curl"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'image_sequence', 'isolation', 'isolation',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'dumbbell-floor-press', 'Press de pecho en el suelo', '["Dumbbell Floor Press"]'::jsonb, 'strength', 'beginner',
  '["dumbbells"]'::jsonb, '["home","gym"]'::jsonb, '["Pecho"]'::jsonb, 'push',
  'Túmbate boca arriba con rodillas flexionadas y una mancuerna en cada mano sobre el pecho.', '["Baja las pesas con los codos a unos 45 grados del tronco.","Apoya suavemente la parte posterior de los brazos en el suelo sin rebotar.","Empuja hacia arriba manteniendo las muñecas alineadas."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["push-up","bench-press","band-chest-fly","dumbbell-chest-fly","machine-chest-press","pec-deck","incline-dumbbell-press","assisted-dip","incline-push-up","cable-fly","decline-push-up","archer-push-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'image_sequence', 'push', 'push',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'one-arm-dumbbell-row', 'Remo con mancuerna a una mano con apoyo', '["One-Arm Dumbbell Row"]'::jsonb, 'strength', 'beginner',
  '["dumbbells","bench_or_chair"]'::jsonb, '["home","gym"]'::jsonb, '["Espalda media"]'::jsonb, 'pull',
  'Apoya una mano y una rodilla en un banco firme y sostén una mancuerna con el brazo libre.', '["Mantén la espalda neutra y tira del codo hacia la cadera.","Acerca la mancuerna al costado sin girar el tronco.","Estira el brazo con control y repite por el otro lado."]'::jsonb, 'Exhala al tirar e inhala al volver.', '["Encoger los hombros","Usar impulso","Acortar el regreso"]'::jsonb,
  '["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["band-row","seated-cable-row","inverted-row"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de codo"]'::jsonb, 'image_sequence', 'pull', 'pull',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'dumbbell-squat', 'Sentadilla con mancuernas a los lados', '["Dumbbell Squat"]'::jsonb, 'strength', 'beginner',
  '["dumbbells"]'::jsonb, '["home","gym"]'::jsonb, '["Cuádriceps"]'::jsonb, 'squat',
  'De pie, pies al ancho de hombros y una mancuerna junto a cada muslo.', '["Flexiona caderas y rodillas manteniendo toda la planta apoyada.","Baja hasta donde puedas controlar la postura sin dolor.","Empuja el suelo y sube sin juntar las rodillas."]'::jsonb, 'Inhala antes de bajar, mantén el abdomen firme y exhala al subir.', '["Rodillas colapsando hacia dentro","Talones despegados","Perder la postura del tronco"]'::jsonb,
  '["Dolor agudo de rodilla, cadera o espalda","Mareo o pérdida de equilibrio"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["tempo-squat","leg-press","dumbbell-reverse-lunge","leg-extension","back-squat","bulgarian-split-squat","walking-lunge","step-up","front-squat"]'::jsonb,
  '["dolor agudo de rodilla","lesión reciente de cadera"]'::jsonb, 'image_sequence', 'squat', 'squat',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'dumbbell-reverse-lunge', 'Zancada hacia atrás con mancuernas', '["Dumbbell Rear Lunge"]'::jsonb, 'strength', 'intermediate',
  '["dumbbells"]'::jsonb, '["home","gym"]'::jsonb, '["Cuádriceps"]'::jsonb, 'lunge',
  'De pie con una mancuerna a cada lado y espacio libre detrás.', '["Da un paso hacia atrás y mantén el pie delantero completamente apoyado.","Flexiona ambas rodillas sin golpear el suelo con la posterior.","Empuja con la pierna delantera para regresar; alterna lados."]'::jsonb, 'Inhala al bajar y exhala al subir.', '["Paso demasiado corto","Rodilla colapsando hacia dentro","Perder el equilibrio"]'::jsonb,
  '["Dolor agudo de rodilla o cadera","Inestabilidad que no mejora al reducir rango"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["tempo-squat","leg-press","dumbbell-squat","leg-extension","back-squat","bulgarian-split-squat","walking-lunge","step-up","front-squat"]'::jsonb,
  '["dolor agudo de rodilla","problemas de equilibrio no evaluados"]'::jsonb, 'image_sequence', 'lunge', 'lunge',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'dumbbell-stiff-leg-deadlift', 'Peso muerto de piernas semirrígidas con mancuernas', '["Stiff-Legged Dumbbell Deadlift"]'::jsonb, 'strength', 'intermediate',
  '["dumbbells"]'::jsonb, '["home","gym"]'::jsonb, '["Isquiotibiales"]'::jsonb, 'hinge',
  'De pie con mancuernas delante de los muslos y rodillas ligeramente flexionadas, sin bloquearlas.', '["Lleva la cadera atrás sin redondear la espalda.","Desliza las pesas cerca de las piernas y detente al notar tensión en los isquiotibiales.","Extiende la cadera para volver, sin inclinarte hacia atrás."]'::jsonb, 'Inhala y bloquea el tronco antes de bajar; exhala al extender la cadera.', '["Redondear la espalda","Convertir el movimiento en sentadilla","Separar la carga del cuerpo"]'::jsonb,
  '["Dolor punzante lumbar","Hormigueo o dolor irradiado"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["leg-curl","slider-leg-curl","band-seated-leg-curl","seated-leg-curl","romanian-deadlift","single-leg-rdl","nordic-hamstring-curl"]'::jsonb,
  '["dolor lumbar agudo","lesión reciente de isquiotibiales"]'::jsonb, 'image_sequence', 'hinge', 'hinge',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'seated-dumbbell-press', 'Press de hombros sentado con mancuernas', '["Seated Dumbbell Press"]'::jsonb, 'strength', 'beginner',
  '["dumbbells","bench"]'::jsonb, '["home","gym"]'::jsonb, '["Hombros"]'::jsonb, 'push',
  'Siéntate con la espalda apoyada en un banco con respaldo y las mancuernas a la altura de hombros.', '["Empuja ambas pesas hacia arriba manteniendo el abdomen activo.","Extiende sin bloquear los codos ni separar la espalda del respaldo.","Baja despacio hasta un recorrido cómodo."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["overhead-press","pike-push-up","band-shoulder-press","machine-shoulder-press"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'image_sequence', 'push', 'push',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'seated-dumbbell-reverse-fly', 'Pájaros sentado con mancuernas', '["Seated Bent-Over Rear Delt Raise"]'::jsonb, 'strength', 'intermediate',
  '["dumbbells","bench_or_chair"]'::jsonb, '["home","gym"]'::jsonb, '["Deltoides posterior"]'::jsonb, 'isolation',
  'Siéntate al borde de un banco firme con los pies apoyados, inclina el tronco hacia los muslos y mantén la espalda neutra.', '["Abre los brazos hacia los lados con los codos ligeramente flexionados.","Mantén quietos el tronco y el cuello sin dar impulso.","Baja lentamente las mancuernas."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["face-pull","band-pull-apart","reverse-pec-deck"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'image_sequence', 'isolation', 'isolation',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'concentration-curl', 'Curl concentrado', '["Concentration Curls"]'::jsonb, 'strength', 'beginner',
  '["dumbbells","bench_or_chair"]'::jsonb, '["home","gym"]'::jsonb, '["Bíceps"]'::jsonb, 'isolation',
  'Siéntate con las piernas separadas y apoya la parte posterior del brazo contra la cara interna del muslo.', '["Flexiona el codo llevando la mancuerna hacia el hombro.","Mantén el brazo apoyado y evita girar el tronco.","Baja con control y cambia de brazo al completar la serie."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["biceps-curl","hammer-curl","dumbbell-alternating-curl","machine-biceps-curl"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'image_sequence', 'isolation', 'isolation',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'lying-dumbbell-triceps-extension', 'Extensión de tríceps tumbado con mancuernas', '["Lying Dumbbell Tricep Extension"]'::jsonb, 'strength', 'intermediate',
  '["dumbbells","bench"]'::jsonb, '["home","gym"]'::jsonb, '["Tríceps"]'::jsonb, 'isolation',
  'Túmbate en un banco plano con las mancuernas sobre los hombros y las palmas enfrentadas.', '["Mantén los brazos superiores estables y flexiona los codos.","Baja las mancuernas junto a la cabeza sin golpearla.","Extiende los codos despacio sin abrirlos en exceso."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["triceps-pushdown","diamond-push-up"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'image_sequence', 'isolation', 'isolation',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'seated-dumbbell-calf-raise', 'Elevación de talón sentado con mancuerna', '["Dumbbell Seated One-Leg Calf Raise"]'::jsonb, 'strength', 'beginner',
  '["dumbbells","bench_or_chair","step_or_bench"]'::jsonb, '["home","gym"]'::jsonb, '["Pantorrillas"]'::jsonb, 'calf',
  'Siéntate en un banco firme, coloca el antepié sobre un escalón bajo y sujeta una mancuerna encima del muslo de esa pierna.', '["Eleva el talón sin que el pie gire hacia fuera.","Pausa arriba con la pesa sujeta en todo momento.","Baja despacio dentro del recorrido cómodo y cambia de pierna."]'::jsonb, 'Exhala al subir e inhala al bajar.', '["Rebotar","Girar los tobillos","Acortar el descenso"]'::jsonb,
  '["Dolor agudo de tobillo o pantorrilla","Pérdida de equilibrio"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["standing-calf-raise","seated-calf-raise"]'::jsonb,
  '["lesión reciente de Aquiles","dolor agudo de tobillo"]'::jsonb, 'image_sequence', 'calf', 'calf',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'dumbbell-chest-fly', 'Apertura de pecho con mancuernas', '["Dumbbell Flyes"]'::jsonb, 'strength', 'intermediate',
  '["dumbbells","bench"]'::jsonb, '["home","gym"]'::jsonb, '["Pecho"]'::jsonb, 'push',
  'Túmbate en un banco plano con las mancuernas sobre el pecho y los codos ligeramente flexionados.', '["Abre los brazos en arco sin variar la flexión de codos.","Detente antes de que el hombro moleste o el brazo descienda más allá del tronco.","Junta las pesas sobre el pecho sin golpearlas."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["push-up","bench-press","band-chest-fly","dumbbell-floor-press","machine-chest-press","pec-deck","incline-dumbbell-press","assisted-dip","incline-push-up","cable-fly","decline-push-up","archer-push-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'image_sequence', 'push', 'push',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'dumbbell-alternating-curl', 'Curl alternado de bíceps', '["Dumbbell Alternate Bicep Curl"]'::jsonb, 'strength', 'beginner',
  '["dumbbells"]'::jsonb, '["home","gym"]'::jsonb, '["Bíceps"]'::jsonb, 'isolation',
  'De pie con una mancuerna a cada lado, brazos junto al tronco y palmas hacia dentro.', '["Flexiona un codo y gira suavemente la palma hacia arriba.","Mantén el brazo pegado al cuerpo y evita balancearte.","Baja lentamente antes de repetir con el otro brazo."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["biceps-curl","hammer-curl","concentration-curl","machine-biceps-curl"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'image_sequence', 'isolation', 'isolation',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'machine-chest-press', 'Press de pecho en máquina', '["Machine Bench Press"]'::jsonb, 'gym', 'beginner',
  '["machines"]'::jsonb, '["gym"]'::jsonb, '["Pecho"]'::jsonb, 'push',
  'Ajusta el asiento para que las asas queden a la altura del pecho y apoya la espalda.', '["Toma las asas sin llevar los hombros hacia delante.","Empuja sin bloquear los codos ni despegarte del respaldo.","Vuelve lentamente hasta un rango cómodo."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["push-up","bench-press","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","pec-deck","incline-dumbbell-press","assisted-dip","incline-push-up","cable-fly","decline-push-up","archer-push-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'image_sequence', 'push', 'push',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'machine-shoulder-press', 'Press de hombros en máquina', '["Machine Shoulder (Military) Press"]'::jsonb, 'gym', 'beginner',
  '["machines"]'::jsonb, '["gym"]'::jsonb, '["Hombros"]'::jsonb, 'push',
  'Ajusta el asiento con las asas a la altura de hombros y la espalda apoyada.', '["Empuja hacia arriba sin arquear la zona lumbar.","Mantén el cuello relajado y evita bloquear los codos.","Baja lentamente hasta la posición inicial."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["overhead-press","pike-push-up","band-shoulder-press","seated-dumbbell-press"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'image_sequence', 'push', 'push',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'reverse-pec-deck', 'Apertura inversa en máquina', '["Reverse Machine Flyes"]'::jsonb, 'gym', 'beginner',
  '["machines"]'::jsonb, '["gym"]'::jsonb, '["Deltoides posterior"]'::jsonb, 'isolation',
  'Siéntate mirando al respaldo con el pecho apoyado y las asas a la altura de hombros.', '["Abre los brazos hacia los lados sin despegar el pecho.","Mantén los codos ligeramente flexionados y los hombros bajos.","Vuelve despacio sin dejar que las placas golpeen."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["face-pull","band-pull-apart","seated-dumbbell-reverse-fly"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'image_sequence', 'isolation', 'isolation',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'leg-extension', 'Extensión de cuádriceps en máquina', '["Leg Extensions"]'::jsonb, 'gym', 'beginner',
  '["machines"]'::jsonb, '["gym"]'::jsonb, '["Cuádriceps"]'::jsonb, 'isolation',
  'Alinea la rodilla con el eje de la máquina, apoya la espalda y coloca el rodillo sobre la parte baja de las espinillas.', '["Extiende las rodillas con control y sin dar patadas.","Pausa sin bloquear las rodillas.","Baja despacio manteniendo la cadera en el asiento."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["tempo-squat","leg-press","dumbbell-squat","dumbbell-reverse-lunge","back-squat","bulgarian-split-squat","walking-lunge","step-up","front-squat"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'image_sequence', 'isolation', 'isolation',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'seated-leg-curl', 'Curl femoral sentado en máquina', '["Seated Leg Curl"]'::jsonb, 'gym', 'beginner',
  '["leg_curl"]'::jsonb, '["gym"]'::jsonb, '["Isquiotibiales"]'::jsonb, 'isolation',
  'Ajusta el eje a la altura de las rodillas, el apoyo sobre los muslos y el rodillo detrás de los tobillos.', '["Flexiona las rodillas llevando los talones hacia abajo y atrás.","Mantén la espalda y la pelvis apoyadas.","Vuelve lentamente sin que las placas golpeen."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["leg-curl","slider-leg-curl","band-seated-leg-curl","dumbbell-stiff-leg-deadlift","romanian-deadlift","single-leg-rdl","nordic-hamstring-curl"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'image_sequence', 'isolation', 'isolation',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'seated-calf-raise', 'Elevación de gemelos sentado en máquina', '["Seated Calf Raise"]'::jsonb, 'gym', 'beginner',
  '["machines"]'::jsonb, '["gym"]'::jsonb, '["Pantorrillas"]'::jsonb, 'calf',
  'Siéntate con el antepié en la plataforma y las almohadillas sobre los muslos; libera el seguro según la máquina.', '["Eleva los talones sin girar los tobillos.","Pausa arriba sin rebotar.","Desciende con control y coloca el seguro antes de salir."]'::jsonb, 'Exhala al subir e inhala al bajar.', '["Rebotar","Girar los tobillos","Acortar el descenso"]'::jsonb,
  '["Dolor agudo de tobillo o pantorrilla","Pérdida de equilibrio"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["standing-calf-raise","seated-dumbbell-calf-raise"]'::jsonb,
  '["lesión reciente de Aquiles","dolor agudo de tobillo"]'::jsonb, 'image_sequence', 'calf', 'calf',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'machine-biceps-curl', 'Curl de bíceps en máquina', '["Machine Bicep Curl"]'::jsonb, 'gym', 'beginner',
  '["machines"]'::jsonb, '["gym"]'::jsonb, '["Bíceps"]'::jsonb, 'isolation',
  'Ajusta el asiento, apoya los brazos en la almohadilla y alinea los codos con el eje de giro.', '["Flexiona los codos sin levantar los brazos del apoyo.","Evita adelantar los hombros para terminar la repetición.","Baja con control sin bloquear los codos."]'::jsonb, 'Exhala durante el esfuerzo e inhala al volver.', '["Usar impulso","Carga excesiva","Recorrido doloroso"]'::jsonb,
  '["Dolor agudo articular","Hormigueo o pérdida de control"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["biceps-curl","hammer-curl","concentration-curl","dumbbell-alternating-curl"]'::jsonb,
  '["dolor agudo en la articulación trabajada"]'::jsonb, 'image_sequence', 'isolation', 'isolation',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'pec-deck', 'Apertura de pecho en máquina', '["Butterfly"]'::jsonb, 'gym', 'beginner',
  '["machines"]'::jsonb, '["gym"]'::jsonb, '["Pecho"]'::jsonb, 'push',
  'Siéntate con la espalda apoyada, ajusta el asiento y coloca los antebrazos en las almohadillas a la altura del pecho.', '["Junta las almohadillas delante del pecho sin encoger los hombros.","Mantén la espalda apoyada y evita impulsarte.","Abre lentamente hasta un recorrido cómodo."]'::jsonb, 'Inhala al bajar y exhala durante el empuje.', '["Hombros elevados","Codos sin control","Arquear la zona lumbar"]'::jsonb,
  '["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"]'::jsonb, 'Reduce la resistencia y completa las repeticiones sin perder la postura.', 'Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.', '["push-up","bench-press","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press","incline-dumbbell-press","assisted-dip","incline-push-up","cable-fly","decline-push-up","archer-push-up"]'::jsonb,
  '["dolor agudo de hombro","lesión reciente de muñeca"]'::jsonb, 'image_sequence', 'push', 'push',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'crunch', 'Crunch abdominal', '["Crunches"]'::jsonb, 'strength', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["Core"]'::jsonb, 'core',
  'Túmbate boca arriba con las rodillas flexionadas y los pies apoyados; coloca las manos a los lados de la cabeza sin tirar de ella.', '["Acerca las costillas a la pelvis elevando ligeramente los hombros.","Mantén la zona lumbar en el suelo y el cuello relajado.","Baja despacio sin usar impulso."]'::jsonb, 'Respira corto y continuo; no aguantes el aire por tiempo prolongado.', '["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"]'::jsonb,
  '["Dolor lumbar o cervical","Mareo al sostener la posición"]'::jsonb, 'Reduce las repeticiones manteniendo el recorrido cómodo y la técnica.', 'Añade 1–2 repeticiones por serie sin impulso ni pérdida de postura.', '["dead-bug","front-plank","reverse-crunch","oblique-crunch","side-plank","shoulder-tap-plank"]'::jsonb,
  '["dolor lumbar agudo","cirugía abdominal reciente"]'::jsonb, 'image_sequence', 'core', 'core',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'reverse-crunch', 'Crunch inverso', '["Reverse Crunch"]'::jsonb, 'strength', 'intermediate',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["Core"]'::jsonb, 'core',
  'Túmbate boca arriba con brazos a los lados, caderas y rodillas flexionadas a unos 90 grados.', '["Enrolla suavemente la pelvis para despegar un poco la cadera.","Acerca las rodillas hacia el tronco sin balancear las piernas.","Baja la pelvis despacio sin arquear la espalda."]'::jsonb, 'Respira corto y continuo; no aguantes el aire por tiempo prolongado.', '["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"]'::jsonb,
  '["Dolor lumbar o cervical","Mareo al sostener la posición"]'::jsonb, 'Reduce las repeticiones manteniendo el recorrido cómodo y la técnica.', 'Añade 1–2 repeticiones por serie sin impulso ni pérdida de postura.', '["dead-bug","front-plank","crunch","oblique-crunch","side-plank","shoulder-tap-plank"]'::jsonb,
  '["dolor lumbar agudo","cirugía abdominal reciente"]'::jsonb, 'image_sequence', 'core', 'core',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'oblique-crunch', 'Crunch oblicuo en el suelo', '["Oblique Crunches - On The Floor"]'::jsonb, 'strength', 'beginner',
  '[]'::jsonb, '["home","gym"]'::jsonb, '["Core"]'::jsonb, 'core',
  'Túmbate de lado con las rodillas flexionadas y una mano junto a la cabeza sin tirar del cuello.', '["Eleva el hombro acercando las costillas a la cadera.","Haz un recorrido corto sin girar de golpe el tronco.","Baja despacio y cambia de lado al completar la serie."]'::jsonb, 'Respira corto y continuo; no aguantes el aire por tiempo prolongado.', '["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"]'::jsonb,
  '["Dolor lumbar o cervical","Mareo al sostener la posición"]'::jsonb, 'Reduce las repeticiones manteniendo el recorrido cómodo y la técnica.', 'Añade 1–2 repeticiones por serie sin impulso ni pérdida de postura.', '["dead-bug","front-plank","crunch","reverse-crunch","side-plank","shoulder-tap-plank"]'::jsonb,
  '["dolor lumbar agudo","cirugía abdominal reciente"]'::jsonb, 'image_sequence', 'core', 'core',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'walk-brisk', 'Caminata a paso activo', '[]'::jsonb, 'walking', 'beginner',
  '[]'::jsonb, '["outdoor"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'walk',
  'Postura alta, mirada al frente y pasos cómodos.', '["Empieza con paso suave para entrar en calor.","Mantén un ritmo estable y respiración controlada.","Baja el ritmo o detente ante cualquier señal de alerta."]'::jsonb, 'Respira de forma rítmica y conserva un ritmo que te permita hablar.', '["Caminar encorvado","Tensar hombros y manos","Ignorar dolor creciente"]'::jsonb,
  '["Dolor de pecho, mareo o falta de aire inusual","Dolor articular que cambia la técnica"]'::jsonb, 'Caminar a ritmo cómodo con pausas breves', 'Aumentar tiempo a paso vivo sin perder respiración controlada', '["walk-easy","walk-mobility"]'::jsonb,
  '["dolor agudo al caminar","señales cardiovasculares no evaluadas"]'::jsonb, 'image', 'run', 'run',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'walk-easy', 'Caminata aeróbica fácil', '[]'::jsonb, 'walking', 'beginner',
  '[]'::jsonb, '["outdoor"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'walk',
  'Postura alta, mirada al frente y pasos cómodos.', '["Empieza con paso suave para entrar en calor.","Mantén un ritmo estable y respiración controlada.","Baja el ritmo o detente ante cualquier señal de alerta."]'::jsonb, 'Respira de forma rítmica y conserva un ritmo que te permita hablar.', '["Caminar encorvado","Tensar hombros y manos","Ignorar dolor creciente"]'::jsonb,
  '["Dolor de pecho, mareo o falta de aire inusual","Dolor articular que cambia la técnica"]'::jsonb, 'Caminata corta en terreno plano', 'Aumentar duración manteniendo conversación', '["walk-brisk","walk-mobility"]'::jsonb,
  '["dolor agudo al caminar","señales cardiovasculares no evaluadas"]'::jsonb, 'image', 'run', 'run',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'walk-mobility', 'Caminata con movilidad', '[]'::jsonb, 'walking', 'beginner',
  '[]'::jsonb, '["outdoor"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'walk',
  'Postura alta, mirada al frente y pasos cómodos.', '["Empieza con paso suave para entrar en calor.","Mantén un ritmo estable y respiración controlada.","Baja el ritmo o detente ante cualquier señal de alerta."]'::jsonb, 'Respira de forma rítmica y conserva un ritmo que te permita hablar.', '["Caminar encorvado","Tensar hombros y manos","Ignorar dolor creciente"]'::jsonb,
  '["Dolor de pecho, mareo o falta de aire inusual","Dolor articular que cambia la técnica"]'::jsonb, 'Caminata suave y movilidad articular', 'Sumar bloques de paso activo entre movilidad', '["walk-easy"]'::jsonb,
  '["dolor agudo al caminar","señales cardiovasculares no evaluadas"]'::jsonb, 'image', 'run', 'run',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'run-intervals', 'Intervalos de running', '[]'::jsonb, 'running', 'intermediate',
  '[]'::jsonb, '["outdoor"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'run',
  'Postura alta, mirada al frente y pasos suaves bajo el cuerpo.', '["Comienza a ritmo fácil para estabilizar respiración y técnica.","Completa el bloque indicado manteniendo una zancada controlada.","Reduce el ritmo durante la recuperación y detente si aparece una señal de alerta."]'::jsonb, 'Usa una respiración rítmica y recupera el habla durante los tramos suaves.', '["Salir demasiado rápido","Alargar la zancada por delante del cuerpo","Ignorar dolor creciente"]'::jsonb,
  '["Dolor de pecho, mareo o falta de aire inusual","Dolor articular que cambia la técnica"]'::jsonb, 'Series de carrera suave con más recuperación', 'Aumentar gradualmente la duración del bloque rápido', '["run-easy","run-drills"]'::jsonb,
  '["dolor agudo al correr","señales cardiovasculares no evaluadas"]'::jsonb, 'image', 'run', 'run',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'run-easy', 'Running aeróbico fácil', '[]'::jsonb, 'running', 'beginner',
  '[]'::jsonb, '["outdoor"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'run',
  'Postura alta, mirada al frente y pasos suaves bajo el cuerpo.', '["Comienza a ritmo fácil para estabilizar respiración y técnica.","Completa el bloque indicado manteniendo una zancada controlada.","Reduce el ritmo durante la recuperación y detente si aparece una señal de alerta."]'::jsonb, 'Usa una respiración rítmica y recupera el habla durante los tramos suaves.', '["Salir demasiado rápido","Alargar la zancada por delante del cuerpo","Ignorar dolor creciente"]'::jsonb,
  '["Dolor de pecho, mareo o falta de aire inusual","Dolor articular que cambia la técnica"]'::jsonb, 'Alternar caminar y correr', 'Aumentar tiempo manteniendo ritmo conversacional', '["run-intervals","run-drills"]'::jsonb,
  '["dolor agudo al correr","señales cardiovasculares no evaluadas"]'::jsonb, 'image', 'run', 'run',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'run-drills', 'Técnica de carrera', '[]'::jsonb, 'running', 'beginner',
  '[]'::jsonb, '["outdoor"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'run',
  'Postura alta, mirada al frente y pasos suaves bajo el cuerpo.', '["Comienza a ritmo fácil para estabilizar respiración y técnica.","Completa el bloque indicado manteniendo una zancada controlada.","Reduce el ritmo durante la recuperación y detente si aparece una señal de alerta."]'::jsonb, 'Usa una respiración rítmica y recupera el habla durante los tramos suaves.', '["Salir demasiado rápido","Alargar la zancada por delante del cuerpo","Ignorar dolor creciente"]'::jsonb,
  '["Dolor de pecho, mareo o falta de aire inusual","Dolor articular que cambia la técnica"]'::jsonb, 'Marcha técnica y progresivos cortos', 'Añadir repeticiones sin perder postura', '["run-easy"]'::jsonb,
  '["dolor agudo al correr","señales cardiovasculares no evaluadas"]'::jsonb, 'image', 'run', 'run',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'cycle-intervals', 'Intervalos de cycling', '[]'::jsonb, 'cycling', 'intermediate',
  '["bicycle"]'::jsonb, '["outdoor","gym"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'cycle',
  'Bicicleta estable, sillín ajustado y manos relajadas.', '["Pedalea suave hasta encontrar una cadencia estable.","Completa los bloques sin balancear excesivamente el tronco.","Recupera con resistencia baja y termina con pedaleo fácil."]'::jsonb, 'Mantén respiración rítmica; baja la intensidad si no puedes recuperarla.', '["Resistencia excesiva","Caderas balanceándose","Bloquear hombros y manos"]'::jsonb,
  '["Dolor de pecho, mareo o adormecimiento persistente","Dolor agudo de rodilla"]'::jsonb, 'Bloques cortos con resistencia moderada', 'Aumentar duración antes que resistencia', '["cycle-endurance","cycle-cadence"]'::jsonb,
  '["dolor agudo de rodilla","señales cardiovasculares no evaluadas"]'::jsonb, 'image', 'cycle', 'cycle',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'cycle-endurance', 'Cycling aeróbico fácil', '[]'::jsonb, 'cycling', 'beginner',
  '["bicycle"]'::jsonb, '["outdoor","gym"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'cycle',
  'Bicicleta estable, sillín ajustado y manos relajadas.', '["Pedalea suave hasta encontrar una cadencia estable.","Completa los bloques sin balancear excesivamente el tronco.","Recupera con resistencia baja y termina con pedaleo fácil."]'::jsonb, 'Mantén respiración rítmica; baja la intensidad si no puedes recuperarla.', '["Resistencia excesiva","Caderas balanceándose","Bloquear hombros y manos"]'::jsonb,
  '["Dolor de pecho, mareo o adormecimiento persistente","Dolor agudo de rodilla"]'::jsonb, 'Sesión más corta y resistencia baja', 'Aumentar tiempo en zona cómoda', '["cycle-intervals","cycle-cadence"]'::jsonb,
  '["dolor agudo de rodilla","señales cardiovasculares no evaluadas"]'::jsonb, 'image', 'cycle', 'cycle',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'cycle-cadence', 'Técnica y cadencia en bicicleta', '[]'::jsonb, 'cycling', 'beginner',
  '["bicycle"]'::jsonb, '["outdoor","gym"]'::jsonb, '["piernas","sistema cardiovascular"]'::jsonb, 'cycle',
  'Bicicleta estable, sillín ajustado y manos relajadas.', '["Pedalea suave hasta encontrar una cadencia estable.","Completa los bloques sin balancear excesivamente el tronco.","Recupera con resistencia baja y termina con pedaleo fácil."]'::jsonb, 'Mantén respiración rítmica; baja la intensidad si no puedes recuperarla.', '["Resistencia excesiva","Caderas balanceándose","Bloquear hombros y manos"]'::jsonb,
  '["Dolor de pecho, mareo o adormecimiento persistente","Dolor agudo de rodilla"]'::jsonb, 'Cadencia cómoda con bloques breves', 'Bloques más largos sin balancear el tronco', '["cycle-endurance"]'::jsonb,
  '["dolor agudo de rodilla","señales cardiovasculares no evaluadas"]'::jsonb, 'image', 'cycle', 'cycle',
  'Free Exercise DB', '', 'Public Domain (Unlicense)', 'Free Exercise DB (yuhonas) — dominio público', true
),
(
  'swim-intervals', 'Intervalos de natación', '[]'::jsonb, 'swimming', 'intermediate',
  '["pool"]'::jsonb, '["pool"]'::jsonb, '["cuerpo completo"]'::jsonb, 'swim',
  'Cuerpo alineado, cuello relajado y respiración preparada.', '["Nada suave hasta estabilizar la técnica.","Mantén alineación y agarre antes de aumentar el ritmo.","Usa las pausas indicadas y sal del agua ante cualquier señal de alerta."]'::jsonb, 'Exhala dentro del agua y toma aire sin levantar en exceso la cabeza.', '["Acelerar perdiendo alineación","Contener el aire","Cruzar la mano delante de la cabeza"]'::jsonb,
  '["Mareo, dificultad respiratoria o desorientación","Dolor agudo de hombro"]'::jsonb, 'Bloques más cortos con pausa amplia', 'Aumentar distancia manteniendo técnica', '["swim-endurance","swim-drills"]'::jsonb,
  '["no saber nadar con seguridad","dolor agudo de hombro"]'::jsonb, 'image', 'swim', 'swim',
  'DoD Warrior Games 2016 (U.S. Army)', '', 'Public Domain (obra del Gobierno de EE. UU.)', 'U.S. Army vía Wikimedia Commons — dominio público', true
),
(
  'swim-endurance', 'Natación aeróbica fácil', '[]'::jsonb, 'swimming', 'beginner',
  '["pool"]'::jsonb, '["pool"]'::jsonb, '["cuerpo completo"]'::jsonb, 'swim',
  'Cuerpo alineado, cuello relajado y respiración preparada.', '["Nada suave hasta estabilizar la técnica.","Mantén alineación y agarre antes de aumentar el ritmo.","Usa las pausas indicadas y sal del agua ante cualquier señal de alerta."]'::jsonb, 'Exhala dentro del agua y toma aire sin levantar en exceso la cabeza.', '["Acelerar perdiendo alineación","Contener el aire","Cruzar la mano delante de la cabeza"]'::jsonb,
  '["Mareo, dificultad respiratoria o desorientación","Dolor agudo de hombro"]'::jsonb, 'Alternar largos suaves y pausas', 'Aumentar distancia sin perder alineación', '["swim-intervals","swim-drills"]'::jsonb,
  '["no saber nadar con seguridad","dolor agudo de hombro"]'::jsonb, 'image', 'swim', 'swim',
  'DoD Warrior Games 2016 (U.S. Army)', '', 'Public Domain (obra del Gobierno de EE. UU.)', 'U.S. Army vía Wikimedia Commons — dominio público', true
),
(
  'swim-drills', 'Técnica de natación', '[]'::jsonb, 'swimming', 'beginner',
  '["pool"]'::jsonb, '["pool"]'::jsonb, '["cuerpo completo"]'::jsonb, 'swim',
  'Cuerpo alineado, cuello relajado y respiración preparada.', '["Nada suave hasta estabilizar la técnica.","Mantén alineación y agarre antes de aumentar el ritmo.","Usa las pausas indicadas y sal del agua ante cualquier señal de alerta."]'::jsonb, 'Exhala dentro del agua y toma aire sin levantar en exceso la cabeza.', '["Acelerar perdiendo alineación","Contener el aire","Cruzar la mano delante de la cabeza"]'::jsonb,
  '["Mareo, dificultad respiratoria o desorientación","Dolor agudo de hombro"]'::jsonb, 'Un ejercicio técnico por bloque', 'Combinar ejercicios manteniendo respiración estable', '["swim-endurance"]'::jsonb,
  '["no saber nadar con seguridad","dolor agudo de hombro"]'::jsonb, 'image', 'swim', 'swim',
  'DoD Warrior Games 2016 (U.S. Army)', '', 'Public Domain (obra del Gobierno de EE. UU.)', 'U.S. Army vía Wikimedia Commons — dominio público', true
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

-- Demostraciones locales revisadas (REQ-302). Mismos permisos RLS.
alter table exercises add column if not exists media_url text;
alter table exercises add column if not exists poster_url text;
alter table exercises add column if not exists frames jsonb not null default '[]'::jsonb;
update exercises set media_type='image', media_url='assets/exercise-media/bulgarian-split-squat.svg', poster_url='assets/exercise-media/bulgarian-split-squat.svg', frames='[]'::jsonb where slug='bulgarian-split-squat';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/walking-lunge-0.jpg', frames='["assets/exercise-media/walking-lunge-0.jpg","assets/exercise-media/walking-lunge-1.jpg"]'::jsonb where slug='walking-lunge';
update exercises set media_type='image', media_url='assets/exercise-media/standing-calf-raise.svg', poster_url='assets/exercise-media/standing-calf-raise.svg', frames='[]'::jsonb where slug='standing-calf-raise';
update exercises set media_type='image', media_url='assets/exercise-media/band-row.svg', poster_url='assets/exercise-media/band-row.svg', frames='[]'::jsonb where slug='band-row';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/inverted-row-0.jpg', frames='["assets/exercise-media/inverted-row-0.jpg","assets/exercise-media/inverted-row-1.jpg"]'::jsonb where slug='inverted-row';
update exercises set media_type='image', media_url='assets/exercise-media/pike-push-up.svg', poster_url='assets/exercise-media/pike-push-up.svg', frames='[]'::jsonb where slug='pike-push-up';
update exercises set media_type='image', media_url='assets/exercise-media/single-leg-rdl.svg', poster_url='assets/exercise-media/single-leg-rdl.svg', frames='[]'::jsonb where slug='single-leg-rdl';
update exercises set media_type='image', media_url='assets/exercise-media/shoulder-tap-plank.svg', poster_url='assets/exercise-media/shoulder-tap-plank.svg', frames='[]'::jsonb where slug='shoulder-tap-plank';
update exercises set media_type='image', media_url='assets/exercise-media/step-up.svg', poster_url='assets/exercise-media/step-up.svg', frames='[]'::jsonb where slug='step-up';
update exercises set media_type='image', media_url='assets/exercise-media/slider-leg-curl.svg', poster_url='assets/exercise-media/slider-leg-curl.svg', frames='[]'::jsonb where slug='slider-leg-curl';
update exercises set media_type='image', media_url='assets/exercise-media/archer-push-up.svg', poster_url='assets/exercise-media/archer-push-up.svg', frames='[]'::jsonb where slug='archer-push-up';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/band-pull-apart-0.jpg', frames='["assets/exercise-media/band-pull-apart-0.jpg","assets/exercise-media/band-pull-apart-1.jpg"]'::jsonb where slug='band-pull-apart';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/band-lateral-raise-0.jpg', frames='["assets/exercise-media/band-lateral-raise-0.jpg","assets/exercise-media/band-lateral-raise-1.jpg"]'::jsonb where slug='band-lateral-raise';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/band-shoulder-press-0.jpg', frames='["assets/exercise-media/band-shoulder-press-0.jpg","assets/exercise-media/band-shoulder-press-1.jpg"]'::jsonb where slug='band-shoulder-press';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/band-chest-fly-0.jpg', frames='["assets/exercise-media/band-chest-fly-0.jpg","assets/exercise-media/band-chest-fly-1.jpg"]'::jsonb where slug='band-chest-fly';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/band-seated-leg-curl-0.jpg', frames='["assets/exercise-media/band-seated-leg-curl-0.jpg","assets/exercise-media/band-seated-leg-curl-1.jpg"]'::jsonb where slug='band-seated-leg-curl';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/dumbbell-floor-press-0.jpg', frames='["assets/exercise-media/dumbbell-floor-press-0.jpg","assets/exercise-media/dumbbell-floor-press-1.jpg"]'::jsonb where slug='dumbbell-floor-press';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/one-arm-dumbbell-row-0.jpg', frames='["assets/exercise-media/one-arm-dumbbell-row-0.jpg","assets/exercise-media/one-arm-dumbbell-row-1.jpg"]'::jsonb where slug='one-arm-dumbbell-row';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/dumbbell-squat-0.jpg', frames='["assets/exercise-media/dumbbell-squat-0.jpg","assets/exercise-media/dumbbell-squat-1.jpg"]'::jsonb where slug='dumbbell-squat';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/dumbbell-reverse-lunge-0.jpg', frames='["assets/exercise-media/dumbbell-reverse-lunge-0.jpg","assets/exercise-media/dumbbell-reverse-lunge-1.jpg"]'::jsonb where slug='dumbbell-reverse-lunge';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/dumbbell-stiff-leg-deadlift-0.jpg', frames='["assets/exercise-media/dumbbell-stiff-leg-deadlift-0.jpg","assets/exercise-media/dumbbell-stiff-leg-deadlift-1.jpg"]'::jsonb where slug='dumbbell-stiff-leg-deadlift';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/seated-dumbbell-press-0.jpg', frames='["assets/exercise-media/seated-dumbbell-press-0.jpg","assets/exercise-media/seated-dumbbell-press-1.jpg"]'::jsonb where slug='seated-dumbbell-press';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/seated-dumbbell-reverse-fly-0.jpg', frames='["assets/exercise-media/seated-dumbbell-reverse-fly-0.jpg","assets/exercise-media/seated-dumbbell-reverse-fly-1.jpg"]'::jsonb where slug='seated-dumbbell-reverse-fly';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/concentration-curl-0.jpg', frames='["assets/exercise-media/concentration-curl-0.jpg","assets/exercise-media/concentration-curl-1.jpg"]'::jsonb where slug='concentration-curl';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/lying-dumbbell-triceps-extension-0.jpg', frames='["assets/exercise-media/lying-dumbbell-triceps-extension-0.jpg","assets/exercise-media/lying-dumbbell-triceps-extension-1.jpg"]'::jsonb where slug='lying-dumbbell-triceps-extension';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/seated-dumbbell-calf-raise-0.jpg', frames='["assets/exercise-media/seated-dumbbell-calf-raise-0.jpg","assets/exercise-media/seated-dumbbell-calf-raise-1.jpg"]'::jsonb where slug='seated-dumbbell-calf-raise';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/dumbbell-chest-fly-0.jpg', frames='["assets/exercise-media/dumbbell-chest-fly-0.jpg","assets/exercise-media/dumbbell-chest-fly-1.jpg"]'::jsonb where slug='dumbbell-chest-fly';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/dumbbell-alternating-curl-0.jpg', frames='["assets/exercise-media/dumbbell-alternating-curl-0.jpg","assets/exercise-media/dumbbell-alternating-curl-1.jpg"]'::jsonb where slug='dumbbell-alternating-curl';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/machine-chest-press-0.jpg', frames='["assets/exercise-media/machine-chest-press-0.jpg","assets/exercise-media/machine-chest-press-1.jpg"]'::jsonb where slug='machine-chest-press';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/machine-shoulder-press-0.jpg', frames='["assets/exercise-media/machine-shoulder-press-0.jpg","assets/exercise-media/machine-shoulder-press-1.jpg"]'::jsonb where slug='machine-shoulder-press';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/reverse-pec-deck-0.jpg', frames='["assets/exercise-media/reverse-pec-deck-0.jpg","assets/exercise-media/reverse-pec-deck-1.jpg"]'::jsonb where slug='reverse-pec-deck';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/leg-extension-0.jpg', frames='["assets/exercise-media/leg-extension-0.jpg","assets/exercise-media/leg-extension-1.jpg"]'::jsonb where slug='leg-extension';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/seated-leg-curl-0.jpg', frames='["assets/exercise-media/seated-leg-curl-0.jpg","assets/exercise-media/seated-leg-curl-1.jpg"]'::jsonb where slug='seated-leg-curl';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/seated-calf-raise-0.jpg', frames='["assets/exercise-media/seated-calf-raise-0.jpg","assets/exercise-media/seated-calf-raise-1.jpg"]'::jsonb where slug='seated-calf-raise';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/machine-biceps-curl-0.jpg', frames='["assets/exercise-media/machine-biceps-curl-0.jpg","assets/exercise-media/machine-biceps-curl-1.jpg"]'::jsonb where slug='machine-biceps-curl';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/pec-deck-0.jpg', frames='["assets/exercise-media/pec-deck-0.jpg","assets/exercise-media/pec-deck-1.jpg"]'::jsonb where slug='pec-deck';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/crunch-0.jpg', frames='["assets/exercise-media/crunch-0.jpg","assets/exercise-media/crunch-1.jpg"]'::jsonb where slug='crunch';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/reverse-crunch-0.jpg', frames='["assets/exercise-media/reverse-crunch-0.jpg","assets/exercise-media/reverse-crunch-1.jpg"]'::jsonb where slug='reverse-crunch';
update exercises set media_type='image_sequence', media_url=null, poster_url='assets/exercise-media/oblique-crunch-0.jpg', frames='["assets/exercise-media/oblique-crunch-0.jpg","assets/exercise-media/oblique-crunch-1.jpg"]'::jsonb where slug='oblique-crunch';
update exercises set media_type='image', media_url='assets/exercise-media/walking.jpg', poster_url='assets/exercise-media/walking.jpg', frames='[]'::jsonb where slug='walk-brisk';
update exercises set media_type='image', media_url='assets/exercise-media/walking.jpg', poster_url='assets/exercise-media/walking.jpg', frames='[]'::jsonb where slug='walk-easy';
update exercises set media_type='image', media_url='assets/exercise-media/walking.jpg', poster_url='assets/exercise-media/walking.jpg', frames='[]'::jsonb where slug='walk-mobility';
update exercises set media_type='image', media_url='assets/exercise-media/running.jpg', poster_url='assets/exercise-media/running.jpg', frames='[]'::jsonb where slug='run-intervals';
update exercises set media_type='image', media_url='assets/exercise-media/running.jpg', poster_url='assets/exercise-media/running.jpg', frames='[]'::jsonb where slug='run-easy';
update exercises set media_type='image', media_url='assets/exercise-media/running.jpg', poster_url='assets/exercise-media/running.jpg', frames='[]'::jsonb where slug='run-drills';
update exercises set media_type='image', media_url='assets/exercise-media/cycling.jpg', poster_url='assets/exercise-media/cycling.jpg', frames='[]'::jsonb where slug='cycle-intervals';
update exercises set media_type='image', media_url='assets/exercise-media/cycling.jpg', poster_url='assets/exercise-media/cycling.jpg', frames='[]'::jsonb where slug='cycle-endurance';
update exercises set media_type='image', media_url='assets/exercise-media/cycling.jpg', poster_url='assets/exercise-media/cycling.jpg', frames='[]'::jsonb where slug='cycle-cadence';
update exercises set media_type='image', media_url='assets/exercise-media/swimming.jpg', poster_url='assets/exercise-media/swimming.jpg', frames='[]'::jsonb where slug='swim-intervals';
update exercises set media_type='image', media_url='assets/exercise-media/swimming.jpg', poster_url='assets/exercise-media/swimming.jpg', frames='[]'::jsonb where slug='swim-endurance';
update exercises set media_type='image', media_url='assets/exercise-media/swimming.jpg', poster_url='assets/exercise-media/swimming.jpg', frames='[]'::jsonb where slug='swim-drills';
