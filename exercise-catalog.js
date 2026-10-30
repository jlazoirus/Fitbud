(function(root){
  "use strict";

  const OWN_MEDIA={
    media_type:"inline_svg",
    source_name:"Evolv Studio",
    source_url:"",
    license_name:"Contenido propio Evolv",
    attribution:"Evolv Studio",
    active:true,
  };

  const PATTERNS={
    squat:{
      start_position:"Pies firmes, tronco alto y abdomen activo.",
      steps:["Lleva la cadera atrás y flexiona las rodillas con control.","Desciende hasta el rango que puedas mantener sin dolor.","Empuja el suelo y vuelve a la posición inicial sin perder alineación."],
      breathing:"Inhala antes de bajar, mantén el abdomen firme y exhala al subir.",
      common_errors:["Rodillas colapsando hacia dentro","Talones despegados","Perder la postura del tronco"],
      safety_signals:["Dolor agudo de rodilla, cadera o espalda","Mareo o pérdida de equilibrio"],
      contraindications:["dolor agudo de rodilla","lesión reciente de cadera"],
      media_key:"squat",
    },
    hinge:{
      start_position:"Pies al ancho de cadera, rodillas suaves y columna neutra.",
      steps:["Empuja la cadera hacia atrás manteniendo la carga cerca del cuerpo.","Baja solo mientras conserves la espalda estable.","Aprieta glúteos y lleva la cadera hacia delante para volver."],
      breathing:"Inhala y bloquea el tronco antes de bajar; exhala al extender la cadera.",
      common_errors:["Redondear la espalda","Convertir el movimiento en sentadilla","Separar la carga del cuerpo"],
      safety_signals:["Dolor punzante lumbar","Hormigueo o dolor irradiado"],
      contraindications:["dolor lumbar agudo","lesión reciente de isquiotibiales"],
      media_key:"hinge",
    },
    push:{
      start_position:"Manos estables, hombros lejos de las orejas y tronco firme.",
      steps:["Baja la carga o el cuerpo con los codos controlados.","Mantén muñecas, hombros y tronco alineados.","Empuja hasta extender sin bloquear con violencia."],
      breathing:"Inhala al bajar y exhala durante el empuje.",
      common_errors:["Hombros elevados","Codos sin control","Arquear la zona lumbar"],
      safety_signals:["Dolor agudo de hombro, codo o muñeca","Pérdida súbita de fuerza"],
      contraindications:["dolor agudo de hombro","lesión reciente de muñeca"],
      media_key:"push",
    },
    pull:{
      start_position:"Agarre firme, pecho abierto y hombros alejados de las orejas.",
      steps:["Inicia llevando los hombros atrás y abajo.","Acerca la carga o el cuerpo sin balancearte.","Regresa lentamente hasta recuperar el rango completo."],
      breathing:"Exhala al tirar e inhala al volver.",
      common_errors:["Encoger los hombros","Usar impulso","Acortar el regreso"],
      safety_signals:["Dolor agudo de hombro o codo","Hormigueo en brazo o mano"],
      contraindications:["dolor agudo de hombro","lesión reciente de codo"],
      media_key:"pull",
    },
    lunge:{
      start_position:"Tronco alto, pies separados y mirada al frente.",
      steps:["Da un paso estable y reparte el peso entre ambos pies.","Baja la rodilla posterior con control sin golpear el suelo.","Empuja con el pie delantero para volver o avanzar."],
      breathing:"Inhala al bajar y exhala al subir.",
      common_errors:["Paso demasiado corto","Rodilla colapsando hacia dentro","Perder el equilibrio"],
      safety_signals:["Dolor agudo de rodilla o cadera","Inestabilidad que no mejora al reducir rango"],
      contraindications:["dolor agudo de rodilla","problemas de equilibrio no evaluados"],
      media_key:"lunge",
    },
    bridge:{
      start_position:"Apoya la espalda y los pies con la pelvis neutra.",
      steps:["Activa el abdomen antes de mover la cadera.","Eleva la pelvis apretando glúteos sin arquear la espalda.","Pausa arriba y baja de forma controlada."],
      breathing:"Exhala al elevar la cadera e inhala al bajar.",
      common_errors:["Empujar solo con la zona lumbar","Pies demasiado lejos","Rodillas abriéndose o cerrándose"],
      safety_signals:["Dolor lumbar o de cadera","Calambre persistente"],
      contraindications:["dolor lumbar agudo","lesión reciente de cadera"],
      media_key:"bridge",
    },
    core:{
      start_position:"Columna neutra, abdomen activo y respiración continua.",
      steps:["Crea tensión suave antes de mover brazos o piernas.","Mantén pelvis y costillas estables durante el ejercicio.","Detén la serie cuando pierdas la postura."],
      breathing:"Respira corto y continuo; no aguantes el aire por tiempo prolongado.",
      common_errors:["Contener la respiración","Arquear la zona lumbar","Continuar después de perder postura"],
      safety_signals:["Dolor lumbar o cervical","Mareo al sostener la posición"],
      contraindications:["dolor lumbar agudo","cirugía abdominal reciente"],
      media_key:"core",
    },
    calf:{
      start_position:"Pies paralelos, apoyo estable y rodillas suaves.",
      steps:["Eleva los talones manteniendo el peso sobre el primer y segundo dedo.","Pausa arriba sin perder equilibrio.","Baja lentamente hasta apoyar por completo."],
      breathing:"Exhala al subir e inhala al bajar.",
      common_errors:["Rebotar","Girar los tobillos","Acortar el descenso"],
      safety_signals:["Dolor agudo de tobillo o pantorrilla","Pérdida de equilibrio"],
      contraindications:["lesión reciente de Aquiles","dolor agudo de tobillo"],
      media_key:"calf",
    },
    isolation:{
      start_position:"Articulación estable y recorrido cómodo sin impulso.",
      steps:["Ajusta la carga para controlar todo el movimiento.","Mueve solo la articulación objetivo.","Regresa lentamente sin dejar caer la carga."],
      breathing:"Exhala durante el esfuerzo e inhala al volver.",
      common_errors:["Usar impulso","Carga excesiva","Recorrido doloroso"],
      safety_signals:["Dolor agudo articular","Hormigueo o pérdida de control"],
      contraindications:["dolor agudo en la articulación trabajada"],
      media_key:"isolation",
    },
    run:{
      start_position:"Postura alta, mirada al frente y pasos suaves bajo el cuerpo.",
      steps:["Comienza a ritmo fácil para estabilizar respiración y técnica.","Completa el bloque indicado manteniendo una zancada controlada.","Reduce el ritmo durante la recuperación y detente si aparece una señal de alerta."],
      breathing:"Usa una respiración rítmica y recupera el habla durante los tramos suaves.",
      common_errors:["Salir demasiado rápido","Alargar la zancada por delante del cuerpo","Ignorar dolor creciente"],
      safety_signals:["Dolor de pecho, mareo o falta de aire inusual","Dolor articular que cambia la técnica"],
      contraindications:["dolor agudo al correr","señales cardiovasculares no evaluadas"],
      media_key:"run",
    },
    walk:{
      start_position:"Postura alta, mirada al frente y pasos cómodos.",
      steps:["Empieza con paso suave para entrar en calor.","Mantén un ritmo estable y respiración controlada.","Baja el ritmo o detente ante cualquier señal de alerta."],
      breathing:"Respira de forma rítmica y conserva un ritmo que te permita hablar.",
      common_errors:["Caminar encorvado","Tensar hombros y manos","Ignorar dolor creciente"],
      safety_signals:["Dolor de pecho, mareo o falta de aire inusual","Dolor articular que cambia la técnica"],
      contraindications:["dolor agudo al caminar","señales cardiovasculares no evaluadas"],
      media_key:"run",
    },
    cycle:{
      start_position:"Bicicleta estable, sillín ajustado y manos relajadas.",
      steps:["Pedalea suave hasta encontrar una cadencia estable.","Completa los bloques sin balancear excesivamente el tronco.","Recupera con resistencia baja y termina con pedaleo fácil."],
      breathing:"Mantén respiración rítmica; baja la intensidad si no puedes recuperarla.",
      common_errors:["Resistencia excesiva","Caderas balanceándose","Bloquear hombros y manos"],
      safety_signals:["Dolor de pecho, mareo o adormecimiento persistente","Dolor agudo de rodilla"],
      contraindications:["dolor agudo de rodilla","señales cardiovasculares no evaluadas"],
      media_key:"cycle",
    },
    swim:{
      start_position:"Cuerpo alineado, cuello relajado y respiración preparada.",
      steps:["Nada suave hasta estabilizar la técnica.","Mantén alineación y agarre antes de aumentar el ritmo.","Usa las pausas indicadas y sal del agua ante cualquier señal de alerta."],
      breathing:"Exhala dentro del agua y toma aire sin levantar en exceso la cabeza.",
      common_errors:["Acelerar perdiendo alineación","Contener el aire","Cruzar la mano delante de la cabeza"],
      safety_signals:["Mareo, dificultad respiratoria o desorientación","Dolor agudo de hombro"],
      contraindications:["no saber nadar con seguridad","dolor agudo de hombro"],
      media_key:"swim",
    },
  };

  const EXERCISE_LEVELS=new Set(["beginner","intermediate","advanced"]);
  function exercise(spec){
    if(!EXERCISE_LEVELS.has(spec.level))throw new Error(`Nivel sin revisar: ${spec.slug}`);
    const pattern=PATTERNS[spec.pattern];
    return Object.assign({},OWN_MEDIA,{
      slug:spec.slug,
      name:spec.name,
      aliases:spec.aliases||[],
      discipline:spec.discipline,
      level:spec.level,
      equipment:spec.equipment||[],
      places:spec.places||[],
      muscles:spec.muscles||[],
      movement_pattern:spec.pattern,
      start_position:spec.start_position||pattern.start_position,
      steps:spec.steps||pattern.steps,
      breathing:spec.breathing||pattern.breathing,
      common_errors:spec.common_errors||pattern.common_errors,
      safety_signals:spec.safety_signals||pattern.safety_signals,
      regression:spec.regression,
      progression:spec.progression,
      substitute_slugs:spec.substitutes||[],
      contraindications:spec.contraindications||pattern.contraindications,
      media_key:spec.media_key||pattern.media_key,
      static_key:spec.media_key||pattern.media_key,
    });
  }

  const strength=[
    ["back-squat","Sentadilla con barra",["sentadilla"],"gym","squat",["barbell","rack"],["gym"],["cuádriceps","glúteos"],"Sentadilla a caja","Sentadilla frontal",["tempo-squat","leg-press"],"intermediate"],
    ["bench-press","Press de banca",["press banca"],"gym","push",["barbell","bench"],["gym"],["pecho","tríceps"],"Press con mancuernas ligeras","Press con pausa",["push-up","incline-dumbbell-press"],"intermediate"],
    ["seated-cable-row","Remo sentado en polea",["remo sentado"],"gym","pull",["cable"],["gym"],["espalda","bíceps"],"Remo con banda","Remo con pausa",["band-row","lat-pulldown"],"beginner"],
    ["romanian-deadlift","Peso muerto rumano",["RDL"],"gym","hinge",["barbell"],["gym"],["isquiotibiales","glúteos"],"Bisagra con palo","Peso muerto rumano a una pierna",["single-leg-rdl","barbell-hip-thrust"],"intermediate"],
    ["barbell-hip-thrust","Hip thrust",["empuje de cadera"],"gym","bridge",["barbell","bench"],["gym"],["glúteos","isquiotibiales"],"Puente de glúteo","Hip thrust con pausa",["glute-bridge","single-leg-glute-bridge"],"intermediate"],
    ["incline-dumbbell-press","Press inclinado con mancuernas",["press inclinado"],"gym","push",["dumbbells","bench"],["gym"],["pecho","hombros","tríceps"],"Press inclinado ligero","Press alternado",["bench-press","incline-push-up"],"beginner"],
    ["lat-pulldown","Jalón al pecho",["jalón"],"gym","pull",["cable"],["gym"],["dorsales","bíceps"],"Jalón con banda","Dominada asistida",["assisted-pull-up","band-row"],"beginner"],
    ["bulgarian-split-squat","Sentadilla búlgara",["búlgara"],"strength","lunge",["bench_or_chair"],["gym","home"],["cuádriceps","glúteos"],"Zancada estática","Búlgara con carga",["walking-lunge","step-up"],"intermediate"],
    ["overhead-press","Press militar",["press sobre cabeza"],"gym","push",["barbell_or_dumbbells"],["gym"],["hombros","tríceps"],"Press sentado ligero","Press de pie con pausa",["pike-push-up","incline-dumbbell-press"],"intermediate"],
    ["walking-lunge","Zancada",["lunges"],"strength","lunge",[],["gym","home","outdoor"],["cuádriceps","glúteos"],"Zancada asistida","Zancada caminando con carga",["bulgarian-split-squat","step-up"],"intermediate"],
    ["standing-calf-raise","Elevación de gemelos",["gemelos"],"strength","calf",[],["gym","home"],["pantorrillas"],"Elevación con apoyo","Elevación a una pierna",[],"beginner"],
    ["assisted-dip","Fondos asistidos",["fondos"],"strength","push",["bench_or_assistance"],["gym","home"],["pecho","tríceps"],"Flexión inclinada","Fondos con menor asistencia",["incline-push-up","push-up"],"intermediate"],
    ["biceps-curl","Curl de bíceps",["curl"],"gym","isolation",["dumbbells_or_cable"],["gym"],["bíceps"],"Curl con banda ligera","Curl alternado controlado",["band-row"],"beginner"],
    ["triceps-pushdown","Extensión de tríceps en polea",["tríceps polea"],"gym","isolation",["cable"],["gym"],["tríceps"],"Extensión con banda","Extensión unilateral",["assisted-dip","push-up"],"beginner"],
    ["leg-press","Prensa de piernas",["prensa"],"gym","squat",["leg_press"],["gym"],["cuádriceps","glúteos"],"Prensa con rango corto","Prensa unilateral",["back-squat","tempo-squat"],"beginner"],
    ["leg-curl","Curl femoral",["femoral"],"gym","isolation",["leg_curl"],["gym"],["isquiotibiales"],"Curl con rango corto","Curl unilateral",["slider-leg-curl","romanian-deadlift"],"beginner"],
    ["tempo-squat","Sentadilla tempo",["sentadilla corporal"],"bodyweight","squat",[],["home","outdoor","gym"],["cuádriceps","glúteos"],"Sentarse y levantarse de una silla","Sentadilla con pausa",["back-squat","step-up"],"beginner"],
    ["push-up","Flexión de brazos",["flexiones"],"bodyweight","push",[],["home","outdoor","gym"],["pecho","tríceps"],"Flexión inclinada","Flexión con pausa",["incline-push-up","bench-press"],"intermediate"],
    ["incline-push-up","Flexión inclinada",["flexión elevada"],"bodyweight","push",["bench_or_wall"],["home","outdoor","gym"],["pecho","tríceps"],"Flexión contra pared","Flexión en el suelo",["push-up","assisted-dip"],"beginner"],
    ["band-row","Remo con banda",["remo con banda elástica"],"bodyweight","pull",["resistance_band"],["home","outdoor","gym"],["espalda","bíceps"],"Remo con menor tensión","Remo invertido",["inverted-row","seated-cable-row","assisted-pull-up"],"beginner"],
    ["inverted-row","Remo invertido",["remo bajo la mesa","remo australiano"],"bodyweight","pull",["table_or_low_bar"],["home","outdoor","gym"],["espalda","bíceps"],"Remo invertido más vertical","Remo invertido con piernas estiradas",["band-row","seated-cable-row"],"beginner"],
    ["glute-bridge","Puente de glúteo",["puente"],"bodyweight","bridge",[],["home","gym"],["glúteos","isquiotibiales"],"Puente con rango corto","Puente a una pierna",["barbell-hip-thrust","single-leg-glute-bridge"],"beginner"],
    ["single-leg-glute-bridge","Puente de glúteo a una pierna",["puente unilateral"],"bodyweight","bridge",[],["home","gym"],["glúteos","isquiotibiales"],"Puente bilateral","Puente unilateral con pausa",["glute-bridge","barbell-hip-thrust"],"intermediate"],
    ["front-plank","Plancha frontal",["plancha"],"bodyweight","core",[],["home","gym"],["core"],"Plancha elevada","Plancha con mayor duración",["dead-bug","side-plank"],"beginner"],
    ["side-plank","Plancha lateral",["plancha de lado"],"bodyweight","core",[],["home","gym"],["core","oblicuos"],"Plancha lateral con rodillas","Plancha lateral con pierna elevada",["front-plank","dead-bug"],"intermediate"],
    ["dead-bug","Dead bug",["insecto muerto"],"bodyweight","core",[],["home","gym"],["core"],"Mover solo brazos o piernas","Extender brazo y pierna opuestos",["front-plank","shoulder-tap-plank"],"beginner"],
    ["pike-push-up","Pike push-up",["flexión pica"],"bodyweight","push",[],["home","gym"],["hombros","tríceps"],"Pike con manos elevadas","Pike con pies elevados",["overhead-press","incline-push-up"],"intermediate"],
    ["single-leg-rdl","Peso muerto a una pierna",["bisagra unilateral"],"bodyweight","hinge",[],["home","gym"],["isquiotibiales","glúteos"],"Bisagra asistida","Bisagra unilateral con carga",["romanian-deadlift","glute-bridge"],"intermediate"],
    ["assisted-pull-up","Dominada asistida",["dominada con banda"],"bodyweight","pull",["pullup_bar","resistance_band"],["home","outdoor","gym"],["espalda","bíceps"],"Jalón con banda","Dominada con menos asistencia",["lat-pulldown","band-row"],"intermediate"],
    ["shoulder-tap-plank","Plancha con toque de hombro",["toques de hombro"],"bodyweight","core",[],["home","gym"],["core","hombros"],"Plancha alta sin toques","Toques más lentos",["front-plank","dead-bug"],"intermediate"],
    ["step-up","Subida al banco",["step ups"],"bodyweight","lunge",["step_or_bench"],["home","outdoor","gym"],["cuádriceps","glúteos"],"Escalón bajo con apoyo","Escalón más alto o con carga",["walking-lunge","bulgarian-split-squat"],"beginner"],
    ["slider-leg-curl","Curl femoral deslizante",["curl deslizante"],"bodyweight","hinge",["sliders_or_towel"],["home","gym"],["isquiotibiales","glúteos"],"Deslizar una pierna por vez","Curl completo con cadera elevada",["leg-curl","glute-bridge"],"intermediate"],
    ["lateral-raise","Elevación lateral",["elevaciones laterales"],"gym","isolation",["dumbbells"],["gym"],["hombros"],"Elevación con poco rango","Elevación con pausa arriba",["overhead-press"],"beginner"],
    ["cable-fly","Apertura en polea",["cruces en polea"],"gym","push",["cable"],["gym"],["pecho","hombros"],"Apertura con rango corto","Apertura con pausa al centro",["bench-press","incline-dumbbell-press"],"intermediate"],
    ["face-pull","Face pull",["jalón a la cara"],"gym","pull",["cable"],["gym"],["hombros posteriores","trapecios"],"Face pull con poco peso","Face pull con rotación externa",["seated-cable-row"],"intermediate"],
    ["hammer-curl","Curl martillo",["curl neutro"],"gym","isolation",["dumbbells"],["gym"],["bíceps","antebrazo"],"Curl martillo ligero","Curl inclinado",["biceps-curl"],"beginner"],
    ["diamond-push-up","Flexión diamante",["flexión tríceps"],"bodyweight","push",[],["home","gym"],["tríceps","pecho"],"Flexión diamante con rodillas","Flexión diamante con pausa",["push-up","assisted-dip"],"intermediate"],
    ["pull-up","Dominada",["dominadas","chin-up"],"bodyweight","pull",["pullup_bar"],["gym","outdoor"],["espalda","bíceps"],"Dominada asistida con banda","Dominada con lastre",["assisted-pull-up","lat-pulldown"],"intermediate"],
    ["decline-push-up","Flexión con pies elevados",["flexión declinada"],"bodyweight","push",["bench_or_chair"],["home","gym"],["pecho","tríceps"],"Flexión con pies a media altura","Flexión con lastre en espalda",["push-up","bench-press"],"intermediate"],
    ["weighted-pull-up","Dominada con lastre",["dominada lastrada"],"gym","pull",["pullup_bar","weight_belt"],["gym"],["espalda","bíceps"],"Dominada sin lastre","Dominada con lastre máximo",["pull-up","lat-pulldown"],"advanced"],
    ["front-squat","Sentadilla frontal",["front squat"],"gym","squat",["barbell","rack"],["gym"],["cuádriceps","core"],"Sentadilla goblet","Sentadilla frontal con pausa",["back-squat","tempo-squat"],"advanced"],
    ["archer-push-up","Flexión arquero",["flexión lateral"],"bodyweight","push",[],["home","gym"],["pecho","tríceps"],"Flexión arquero con apoyo","Flexión con un brazo asistida",["diamond-push-up","push-up"],"advanced"],
    ["nordic-hamstring-curl","Curl nórdico",["nordico","nordic curl"],"bodyweight","hinge",["bench_or_anchor"],["gym","home"],["isquiotibiales"],"Curl nórdico parcial","Curl nórdico completo con pausa",["slider-leg-curl","romanian-deadlift"],"advanced"],
  ].map(row=>exercise({
    slug:row[0],name:row[1],aliases:row[2],discipline:row[3],pattern:row[4],
    equipment:row[5],places:row[6],muscles:row[7],regression:row[8],
    progression:row[9],substitutes:row[10],level:row[11],
  }));

  // REQ-302: fichas completas con demostración exacta, dosis y músculo revisados.
  const EXPANDED_STRENGTH_SPECS=[
    {
      slug:"band-pull-apart",name:"Apertura de banda al frente",aliases:["Band Pull Apart"],
      discipline:"strength",pattern:"isolation",level:"beginner",
      muscles:["Deltoides posterior"],primary_muscle:"Deltoides posterior",equipment:["resistance_band"],places:["home","gym"],
      start_position:"De pie, sujeta una banda delante del pecho con los brazos extendidos.",
      steps:["Separa las manos sin encoger los hombros.","Acerca la banda al pecho con los codos suaves y el tronco quieto.","Vuelve despacio sin soltar la tensión."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["face-pull","seated-dumbbell-reverse-fly","reverse-pec-deck"],source_id:"Band_Pull_Apart",
    },
    {
      slug:"band-lateral-raise",name:"Elevación lateral con banda",aliases:["Lateral Raise - With Bands"],
      discipline:"strength",pattern:"isolation",level:"beginner",
      muscles:["Deltoides lateral"],primary_muscle:"Deltoides lateral",equipment:["resistance_band"],places:["home","gym"],
      start_position:"Pisa el centro de la banda y sujeta los extremos junto a los muslos.",
      steps:["Eleva los brazos hacia los lados hasta la altura de hombros.","Mantén los codos ligeramente flexionados y las muñecas neutras.","Baja sin balancear el cuerpo."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["lateral-raise"],source_id:"Lateral_Raise_-_With_Bands",
    },
    {
      slug:"band-shoulder-press",name:"Press de hombros con banda",aliases:["Shoulder Press - With Bands"],
      discipline:"strength",pattern:"push",level:"intermediate",
      muscles:["Hombros"],primary_muscle:"Hombros",equipment:["resistance_band"],places:["home","gym"],
      start_position:"Pisa la banda con ambos pies y coloca las manos a la altura de los hombros.",
      steps:["Activa el abdomen y empuja los extremos por encima de la cabeza.","Extiende los brazos sin arquear la espalda ni encoger el cuello.","Vuelve con control a la altura de hombros."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["overhead-press","pike-push-up","seated-dumbbell-press","machine-shoulder-press"],source_id:"Shoulder_Press_-_With_Bands",
    },
    {
      slug:"band-chest-fly",name:"Apertura de pecho con banda",aliases:["Cross Over - With Bands"],
      discipline:"strength",pattern:"push",level:"intermediate",
      muscles:["Pecho"],primary_muscle:"Pecho",equipment:["resistance_band"],places:["home","gym"],
      start_position:"Ancla la banda a un poste firme detrás del cuerpo, a la altura del pecho, y adelanta un pie.",
      steps:["Abre los brazos con los codos ligeramente flexionados.","Junta las manos delante del pecho sin cambiar el ángulo de los codos.","Abre despacio hasta un recorrido cómodo; comprueba antes el anclaje."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["push-up","bench-press","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press","pec-deck"],source_id:"Cross_Over_-_With_Bands",
    },
    {
      slug:"band-seated-leg-curl",name:"Curl femoral sentado con banda",aliases:["Seated Band Hamstring Curl"],
      discipline:"strength",pattern:"isolation",level:"beginner",
      muscles:["Isquiotibiales"],primary_muscle:"Isquiotibiales",equipment:["resistance_band","bench_or_chair"],places:["home","gym"],
      start_position:"Siéntate en un banco firme frente a una banda anclada cerca del suelo, colocada detrás de los tobillos.",
      steps:["Empieza con las piernas casi extendidas y el tronco estable.","Flexiona las rodillas llevando los talones hacia el banco.","Extiende despacio sin que la banda se suelte del anclaje o los tobillos."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["leg-curl","slider-leg-curl","dumbbell-stiff-leg-deadlift","seated-leg-curl"],source_id:"Seated_Band_Hamstring_Curl",
    },
    {
      slug:"dumbbell-floor-press",name:"Press de pecho en el suelo",aliases:["Dumbbell Floor Press"],
      discipline:"strength",pattern:"push",level:"beginner",
      muscles:["Pecho"],primary_muscle:"Pecho",equipment:["dumbbells"],places:["home","gym"],
      start_position:"Túmbate boca arriba con rodillas flexionadas y una mancuerna en cada mano sobre el pecho.",
      steps:["Baja las pesas con los codos a unos 45 grados del tronco.","Apoya suavemente la parte posterior de los brazos en el suelo sin rebotar.","Empuja hacia arriba manteniendo las muñecas alineadas."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["push-up","bench-press","band-chest-fly","dumbbell-chest-fly","machine-chest-press","pec-deck"],source_id:"Dumbbell_Floor_Press",
    },
    {
      slug:"one-arm-dumbbell-row",name:"Remo con mancuerna a una mano con apoyo",aliases:["One-Arm Dumbbell Row"],
      discipline:"strength",pattern:"pull",level:"beginner",
      muscles:["Espalda media"],primary_muscle:"Espalda media",equipment:["dumbbells","bench_or_chair"],places:["home","gym"],
      start_position:"Apoya una mano y una rodilla en un banco firme y sostén una mancuerna con el brazo libre.",
      steps:["Mantén la espalda neutra y tira del codo hacia la cadera.","Acerca la mancuerna al costado sin girar el tronco.","Estira el brazo con control y repite por el otro lado."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["band-row","seated-cable-row"],source_id:"One-Arm_Dumbbell_Row",
    },
    {
      slug:"dumbbell-squat",name:"Sentadilla con mancuernas a los lados",aliases:["Dumbbell Squat"],
      discipline:"strength",pattern:"squat",level:"beginner",
      muscles:["Cuádriceps"],primary_muscle:"Cuádriceps",equipment:["dumbbells"],places:["home","gym"],
      start_position:"De pie, pies al ancho de hombros y una mancuerna junto a cada muslo.",
      steps:["Flexiona caderas y rodillas manteniendo toda la planta apoyada.","Baja hasta donde puedas controlar la postura sin dolor.","Empuja el suelo y sube sin juntar las rodillas."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["tempo-squat","leg-press","dumbbell-reverse-lunge","leg-extension"],source_id:"Dumbbell_Squat",
    },
    {
      slug:"dumbbell-reverse-lunge",name:"Zancada hacia atrás con mancuernas",aliases:["Dumbbell Rear Lunge"],
      discipline:"strength",pattern:"lunge",level:"intermediate",
      muscles:["Cuádriceps"],primary_muscle:"Cuádriceps",equipment:["dumbbells"],places:["home","gym"],
      start_position:"De pie con una mancuerna a cada lado y espacio libre detrás.",
      steps:["Da un paso hacia atrás y mantén el pie delantero completamente apoyado.","Flexiona ambas rodillas sin golpear el suelo con la posterior.","Empuja con la pierna delantera para regresar; alterna lados."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["tempo-squat","leg-press","dumbbell-squat","leg-extension"],source_id:"Dumbbell_Rear_Lunge",
    },
    {
      slug:"dumbbell-stiff-leg-deadlift",name:"Peso muerto de piernas semirrígidas con mancuernas",aliases:["Stiff-Legged Dumbbell Deadlift"],
      discipline:"strength",pattern:"hinge",level:"intermediate",
      muscles:["Isquiotibiales"],primary_muscle:"Isquiotibiales",equipment:["dumbbells"],places:["home","gym"],
      start_position:"De pie con mancuernas delante de los muslos y rodillas ligeramente flexionadas, sin bloquearlas.",
      steps:["Lleva la cadera atrás sin redondear la espalda.","Desliza las pesas cerca de las piernas y detente al notar tensión en los isquiotibiales.","Extiende la cadera para volver, sin inclinarte hacia atrás."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["leg-curl","slider-leg-curl","band-seated-leg-curl","seated-leg-curl"],source_id:"Stiff-Legged_Dumbbell_Deadlift",
    },
    {
      slug:"seated-dumbbell-press",name:"Press de hombros sentado con mancuernas",aliases:["Seated Dumbbell Press"],
      discipline:"strength",pattern:"push",level:"beginner",
      muscles:["Hombros"],primary_muscle:"Hombros",equipment:["dumbbells","bench"],places:["home","gym"],
      start_position:"Siéntate con la espalda apoyada en un banco con respaldo y las mancuernas a la altura de hombros.",
      steps:["Empuja ambas pesas hacia arriba manteniendo el abdomen activo.","Extiende sin bloquear los codos ni separar la espalda del respaldo.","Baja despacio hasta un recorrido cómodo."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["overhead-press","pike-push-up","band-shoulder-press","machine-shoulder-press"],source_id:"Seated_Dumbbell_Press",
    },
    {
      slug:"seated-dumbbell-reverse-fly",name:"Pájaros sentado con mancuernas",aliases:["Seated Bent-Over Rear Delt Raise"],
      discipline:"strength",pattern:"isolation",level:"intermediate",
      muscles:["Deltoides posterior"],primary_muscle:"Deltoides posterior",equipment:["dumbbells","bench_or_chair"],places:["home","gym"],
      start_position:"Siéntate al borde de un banco firme con los pies apoyados, inclina el tronco hacia los muslos y mantén la espalda neutra.",
      steps:["Abre los brazos hacia los lados con los codos ligeramente flexionados.","Mantén quietos el tronco y el cuello sin dar impulso.","Baja lentamente las mancuernas."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["face-pull","band-pull-apart","reverse-pec-deck"],source_id:"Seated_Bent-Over_Rear_Delt_Raise",
    },
    {
      slug:"concentration-curl",name:"Curl concentrado",aliases:["Concentration Curls"],
      discipline:"strength",pattern:"isolation",level:"beginner",
      muscles:["Bíceps"],primary_muscle:"Bíceps",equipment:["dumbbells","bench_or_chair"],places:["home","gym"],
      start_position:"Siéntate con las piernas separadas y apoya la parte posterior del brazo contra la cara interna del muslo.",
      steps:["Flexiona el codo llevando la mancuerna hacia el hombro.","Mantén el brazo apoyado y evita girar el tronco.","Baja con control y cambia de brazo al completar la serie."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["biceps-curl","hammer-curl","dumbbell-alternating-curl","machine-biceps-curl"],source_id:"Concentration_Curls",
    },
    {
      slug:"lying-dumbbell-triceps-extension",name:"Extensión de tríceps tumbado con mancuernas",aliases:["Lying Dumbbell Tricep Extension"],
      discipline:"strength",pattern:"isolation",level:"intermediate",
      muscles:["Tríceps"],primary_muscle:"Tríceps",equipment:["dumbbells","bench"],places:["home","gym"],
      start_position:"Túmbate en un banco plano con las mancuernas sobre los hombros y las palmas enfrentadas.",
      steps:["Mantén los brazos superiores estables y flexiona los codos.","Baja las mancuernas junto a la cabeza sin golpearla.","Extiende los codos despacio sin abrirlos en exceso."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["triceps-pushdown","diamond-push-up"],source_id:"Lying_Dumbbell_Tricep_Extension",
    },
    {
      slug:"seated-dumbbell-calf-raise",name:"Elevación de talón sentado con mancuerna",aliases:["Dumbbell Seated One-Leg Calf Raise"],
      discipline:"strength",pattern:"calf",level:"beginner",
      muscles:["Pantorrillas"],primary_muscle:"Pantorrillas",equipment:["dumbbells","bench_or_chair","step_or_bench"],places:["home","gym"],
      start_position:"Siéntate en un banco firme, coloca el antepié sobre un escalón bajo y sujeta una mancuerna encima del muslo de esa pierna.",
      steps:["Eleva el talón sin que el pie gire hacia fuera.","Pausa arriba con la pesa sujeta en todo momento.","Baja despacio dentro del recorrido cómodo y cambia de pierna."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["standing-calf-raise","seated-calf-raise"],source_id:"Dumbbell_Seated_One-Leg_Calf_Raise",
    },
    {
      slug:"dumbbell-chest-fly",name:"Apertura de pecho con mancuernas",aliases:["Dumbbell Flyes"],
      discipline:"strength",pattern:"push",level:"intermediate",
      muscles:["Pecho"],primary_muscle:"Pecho",equipment:["dumbbells","bench"],places:["home","gym"],
      start_position:"Túmbate en un banco plano con las mancuernas sobre el pecho y los codos ligeramente flexionados.",
      steps:["Abre los brazos en arco sin variar la flexión de codos.","Detente antes de que el hombro moleste o el brazo descienda más allá del tronco.","Junta las pesas sobre el pecho sin golpearlas."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["push-up","bench-press","band-chest-fly","dumbbell-floor-press","machine-chest-press","pec-deck"],source_id:"Dumbbell_Flyes",
    },
    {
      slug:"dumbbell-alternating-curl",name:"Curl alternado de bíceps",aliases:["Dumbbell Alternate Bicep Curl"],
      discipline:"strength",pattern:"isolation",level:"beginner",
      muscles:["Bíceps"],primary_muscle:"Bíceps",equipment:["dumbbells"],places:["home","gym"],
      start_position:"De pie con una mancuerna a cada lado, brazos junto al tronco y palmas hacia dentro.",
      steps:["Flexiona un codo y gira suavemente la palma hacia arriba.","Mantén el brazo pegado al cuerpo y evita balancearte.","Baja lentamente antes de repetir con el otro brazo."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["biceps-curl","hammer-curl","concentration-curl","machine-biceps-curl"],source_id:"Dumbbell_Alternate_Bicep_Curl",
    },
    {
      slug:"machine-chest-press",name:"Press de pecho en máquina",aliases:["Machine Bench Press"],
      discipline:"gym",pattern:"push",level:"beginner",
      muscles:["Pecho"],primary_muscle:"Pecho",equipment:["machines"],places:["gym"],
      start_position:"Ajusta el asiento para que las asas queden a la altura del pecho y apoya la espalda.",
      steps:["Toma las asas sin llevar los hombros hacia delante.","Empuja sin bloquear los codos ni despegarte del respaldo.","Vuelve lentamente hasta un rango cómodo."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["push-up","bench-press","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","pec-deck"],source_id:"Machine_Bench_Press",
    },
    {
      slug:"machine-shoulder-press",name:"Press de hombros en máquina",aliases:["Machine Shoulder (Military) Press"],
      discipline:"gym",pattern:"push",level:"beginner",
      muscles:["Hombros"],primary_muscle:"Hombros",equipment:["machines"],places:["gym"],
      start_position:"Ajusta el asiento con las asas a la altura de hombros y la espalda apoyada.",
      steps:["Empuja hacia arriba sin arquear la zona lumbar.","Mantén el cuello relajado y evita bloquear los codos.","Baja lentamente hasta la posición inicial."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["overhead-press","pike-push-up","band-shoulder-press","seated-dumbbell-press"],source_id:"Machine_Shoulder_Military_Press",
    },
    {
      slug:"reverse-pec-deck",name:"Apertura inversa en máquina",aliases:["Reverse Machine Flyes"],
      discipline:"gym",pattern:"isolation",level:"beginner",
      muscles:["Deltoides posterior"],primary_muscle:"Deltoides posterior",equipment:["machines"],places:["gym"],
      start_position:"Siéntate mirando al respaldo con el pecho apoyado y las asas a la altura de hombros.",
      steps:["Abre los brazos hacia los lados sin despegar el pecho.","Mantén los codos ligeramente flexionados y los hombros bajos.","Vuelve despacio sin dejar que las placas golpeen."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["face-pull","band-pull-apart","seated-dumbbell-reverse-fly"],source_id:"Reverse_Machine_Flyes",
    },
    {
      slug:"leg-extension",name:"Extensión de cuádriceps en máquina",aliases:["Leg Extensions"],
      discipline:"gym",pattern:"isolation",level:"beginner",
      muscles:["Cuádriceps"],primary_muscle:"Cuádriceps",equipment:["machines"],places:["gym"],
      start_position:"Alinea la rodilla con el eje de la máquina, apoya la espalda y coloca el rodillo sobre la parte baja de las espinillas.",
      steps:["Extiende las rodillas con control y sin dar patadas.","Pausa sin bloquear las rodillas.","Baja despacio manteniendo la cadera en el asiento."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["tempo-squat","leg-press","dumbbell-squat","dumbbell-reverse-lunge"],source_id:"Leg_Extensions",
    },
    {
      slug:"seated-leg-curl",name:"Curl femoral sentado en máquina",aliases:["Seated Leg Curl"],
      discipline:"gym",pattern:"isolation",level:"beginner",
      muscles:["Isquiotibiales"],primary_muscle:"Isquiotibiales",equipment:["leg_curl"],places:["gym"],
      start_position:"Ajusta el eje a la altura de las rodillas, el apoyo sobre los muslos y el rodillo detrás de los tobillos.",
      steps:["Flexiona las rodillas llevando los talones hacia abajo y atrás.","Mantén la espalda y la pelvis apoyadas.","Vuelve lentamente sin que las placas golpeen."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["leg-curl","slider-leg-curl","band-seated-leg-curl","dumbbell-stiff-leg-deadlift"],source_id:"Seated_Leg_Curl",
    },
    {
      slug:"seated-calf-raise",name:"Elevación de gemelos sentado en máquina",aliases:["Seated Calf Raise"],
      discipline:"gym",pattern:"calf",level:"beginner",
      muscles:["Pantorrillas"],primary_muscle:"Pantorrillas",equipment:["machines"],places:["gym"],
      start_position:"Siéntate con el antepié en la plataforma y las almohadillas sobre los muslos; libera el seguro según la máquina.",
      steps:["Eleva los talones sin girar los tobillos.","Pausa arriba sin rebotar.","Desciende con control y coloca el seguro antes de salir."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["standing-calf-raise","seated-dumbbell-calf-raise"],source_id:"Seated_Calf_Raise",
    },
    {
      slug:"machine-biceps-curl",name:"Curl de bíceps en máquina",aliases:["Machine Bicep Curl"],
      discipline:"gym",pattern:"isolation",level:"beginner",
      muscles:["Bíceps"],primary_muscle:"Bíceps",equipment:["machines"],places:["gym"],
      start_position:"Ajusta el asiento, apoya los brazos en la almohadilla y alinea los codos con el eje de giro.",
      steps:["Flexiona los codos sin levantar los brazos del apoyo.","Evita adelantar los hombros para terminar la repetición.","Baja con control sin bloquear los codos."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["biceps-curl","hammer-curl","concentration-curl","dumbbell-alternating-curl"],source_id:"Machine_Bicep_Curl",
    },
    {
      slug:"pec-deck",name:"Apertura de pecho en máquina",aliases:["Butterfly"],
      discipline:"gym",pattern:"push",level:"beginner",
      muscles:["Pecho"],primary_muscle:"Pecho",equipment:["machines"],places:["gym"],
      start_position:"Siéntate con la espalda apoyada, ajusta el asiento y coloca los antebrazos en las almohadillas a la altura del pecho.",
      steps:["Junta las almohadillas delante del pecho sin encoger los hombros.","Mantén la espalda apoyada y evita impulsarte.","Abre lentamente hasta un recorrido cómodo."],
      regression:"Reduce la resistencia y completa las repeticiones sin perder la postura.",
      progression:"Añade 1–2 repeticiones por serie cuando completes todas con control; después aumenta gradualmente la resistencia.",
      substitutes:["push-up","bench-press","band-chest-fly","dumbbell-floor-press","dumbbell-chest-fly","machine-chest-press"],source_id:"Butterfly",
    },
    {
      slug:"crunch",name:"Crunch abdominal",aliases:["Crunches"],
      discipline:"strength",pattern:"core",level:"beginner",
      muscles:["Core"],primary_muscle:"Core",equipment:[],places:["home","gym"],
      start_position:"Túmbate boca arriba con las rodillas flexionadas y los pies apoyados; coloca las manos a los lados de la cabeza sin tirar de ella.",
      steps:["Acerca las costillas a la pelvis elevando ligeramente los hombros.","Mantén la zona lumbar en el suelo y el cuello relajado.","Baja despacio sin usar impulso."],
      regression:"Reduce las repeticiones manteniendo el recorrido cómodo y la técnica.",
      progression:"Añade 1–2 repeticiones por serie sin impulso ni pérdida de postura.",
      substitutes:["dead-bug","front-plank","reverse-crunch","oblique-crunch"],source_id:"Crunches",
    },
    {
      slug:"reverse-crunch",name:"Crunch inverso",aliases:["Reverse Crunch"],
      discipline:"strength",pattern:"core",level:"intermediate",
      muscles:["Core"],primary_muscle:"Core",equipment:[],places:["home","gym"],
      start_position:"Túmbate boca arriba con brazos a los lados, caderas y rodillas flexionadas a unos 90 grados.",
      steps:["Enrolla suavemente la pelvis para despegar un poco la cadera.","Acerca las rodillas hacia el tronco sin balancear las piernas.","Baja la pelvis despacio sin arquear la espalda."],
      regression:"Reduce las repeticiones manteniendo el recorrido cómodo y la técnica.",
      progression:"Añade 1–2 repeticiones por serie sin impulso ni pérdida de postura.",
      substitutes:["dead-bug","front-plank","crunch","oblique-crunch"],source_id:"Reverse_Crunch",
    },
    {
      slug:"oblique-crunch",name:"Crunch oblicuo en el suelo",aliases:["Oblique Crunches - On The Floor"],
      discipline:"strength",pattern:"core",level:"beginner",
      muscles:["Core"],primary_muscle:"Core",equipment:[],places:["home","gym"],
      start_position:"Túmbate de lado con las rodillas flexionadas y una mano junto a la cabeza sin tirar del cuello.",
      steps:["Eleva el hombro acercando las costillas a la cadera.","Haz un recorrido corto sin girar de golpe el tronco.","Baja despacio y cambia de lado al completar la serie."],
      regression:"Reduce las repeticiones manteniendo el recorrido cómodo y la técnica.",
      progression:"Añade 1–2 repeticiones por serie sin impulso ni pérdida de postura.",
      substitutes:["dead-bug","front-plank","crunch","reverse-crunch"],source_id:"Oblique_Crunches_-_On_The_Floor",
    },
  ];
  const expandedStrength=EXPANDED_STRENGTH_SPECS.map(spec=>Object.assign(exercise(spec),{source_id:spec.source_id}));
  strength.push(...expandedStrength);

  const endurance=[
    ["walk-brisk","Caminata a paso activo","walking","walk","Caminar a ritmo cómodo con pausas breves","Aumentar tiempo a paso vivo sin perder respiración controlada",["walk-easy","walk-mobility"],"beginner"],
    ["walk-easy","Caminata aeróbica fácil","walking","walk","Caminata corta en terreno plano","Aumentar duración manteniendo conversación",["walk-brisk","walk-mobility"],"beginner"],
    ["walk-mobility","Caminata con movilidad","walking","walk","Caminata suave y movilidad articular","Sumar bloques de paso activo entre movilidad",["walk-easy"],"beginner"],
    ["run-intervals","Intervalos de running","running","run","Series de carrera suave con más recuperación","Aumentar gradualmente la duración del bloque rápido",["run-easy","run-drills"],"intermediate"],
    ["run-easy","Running aeróbico fácil","running","run","Alternar caminar y correr","Aumentar tiempo manteniendo ritmo conversacional",["run-intervals","run-drills"],"beginner"],
    ["run-drills","Técnica de carrera","running","run","Marcha técnica y progresivos cortos","Añadir repeticiones sin perder postura",["run-easy"],"beginner"],
    ["cycle-intervals","Intervalos de cycling","cycling","cycle","Bloques cortos con resistencia moderada","Aumentar duración antes que resistencia",["cycle-endurance","cycle-cadence"],"intermediate"],
    ["cycle-endurance","Cycling aeróbico fácil","cycling","cycle","Sesión más corta y resistencia baja","Aumentar tiempo en zona cómoda",["cycle-intervals","cycle-cadence"],"beginner"],
    ["cycle-cadence","Técnica y cadencia en bicicleta","cycling","cycle","Cadencia cómoda con bloques breves","Bloques más largos sin balancear el tronco",["cycle-endurance"],"beginner"],
    ["swim-intervals","Intervalos de natación","swimming","swim","Bloques más cortos con pausa amplia","Aumentar distancia manteniendo técnica",["swim-endurance","swim-drills"],"intermediate"],
    ["swim-endurance","Natación aeróbica fácil","swimming","swim","Alternar largos suaves y pausas","Aumentar distancia sin perder alineación",["swim-intervals","swim-drills"],"beginner"],
    ["swim-drills","Técnica de natación","swimming","swim","Un ejercicio técnico por bloque","Combinar ejercicios manteniendo respiración estable",["swim-endurance"],"beginner"],
  ].map(row=>exercise({
    slug:row[0],name:row[1],aliases:[],discipline:row[2],pattern:row[3],
    equipment:row[2]==="cycling"?["bicycle"]:row[2]==="swimming"?["pool"]:[],
    places:row[2]==="swimming"?["pool"]:row[2]==="cycling"?["outdoor","gym"]:["outdoor"],
    muscles:row[2]==="swimming"?["cuerpo completo"]:["piernas","sistema cardiovascular"],
    regression:row[4],progression:row[5],substitutes:row[6],level:row[7],
  }));
  // REQ-259: foto real por disciplina, como los ejercicios de fuerza (antes
  // caían al dibujo SVG). Se sirve desde assets/ del propio deploy, sin hotlinks.
  const FREE_EXERCISE_DB={source_name:"Free Exercise DB",license_name:"Public Domain (Unlicense)",attribution:"Free Exercise DB (yuhonas) — dominio público"};
  const ENDURANCE_MEDIA={
    walking:["assets/exercise-media/walking.jpg",FREE_EXERCISE_DB],
    running:["assets/exercise-media/running.jpg",FREE_EXERCISE_DB],
    cycling:["assets/exercise-media/cycling.jpg",FREE_EXERCISE_DB],
    swimming:["assets/exercise-media/swimming.jpg",{source_name:"DoD Warrior Games 2016 (U.S. Army)",license_name:"Public Domain (obra del Gobierno de EE. UU.)",attribution:"U.S. Army vía Wikimedia Commons — dominio público"}],
  };
  endurance.forEach(ex=>{
    const [url,source]=ENDURANCE_MEDIA[ex.discipline];
    Object.assign(ex,source,{media_type:"image",media_url:url,poster_url:url});
  });

  // REQ-264: las demostraciones deben enseñar el ejercicio nombrado, sin
  // sustituirlo por otro más difícil que trabaje músculos parecidos.
  const CURATED_DEMO_SLUGS=new Set([
    "pike-push-up","band-row","shoulder-tap-plank","archer-push-up",
    "slider-leg-curl","single-leg-rdl","step-up","standing-calf-raise",
    "bulgarian-split-squat",
  ]);
  const reviewedMedia=new Map();
  strength.forEach(ex=>{
    if(!CURATED_DEMO_SLUGS.has(ex.slug))return;
    const url=`assets/exercise-media/${ex.slug}.svg`;
    const media={...OWN_MEDIA,media_type:"image",media_url:url,poster_url:url,frames:[]};
    // active es contenido administrativo, no parte de la corrección de media.
    delete media.active;
    Object.assign(ex,media);
    reviewedMedia.set(ex.slug,media);
  });
  // REQ-293: remo de espalda sin material para casa, con foto real del
  // movimiento (la barra de la foto es el borde de la mesa en casa).
  // REQ-294: la zancada sin carga también tiene foto exacta; deja el dibujo.
  const PHOTO_DEMOS={
    "inverted-row":["assets/exercise-media/inverted-row-0.jpg","assets/exercise-media/inverted-row-1.jpg"],
    "walking-lunge":["assets/exercise-media/walking-lunge-0.jpg","assets/exercise-media/walking-lunge-1.jpg"],
  };
  strength.forEach(ex=>{
    const frames=PHOTO_DEMOS[ex.slug];
    if(!frames)return;
    const media={...FREE_EXERCISE_DB,media_type:"image_sequence",media_url:"",poster_url:frames[0],frames};
    Object.assign(ex,media);
    reviewedMedia.set(ex.slug,media);
  });
  Object.assign(strength.find(ex=>ex.slug==="inverted-row"),{
    start_position:"Túmbate boca arriba bajo una mesa firme (o una barra baja) y agarra el borde con las manos al ancho de hombros, rodillas flexionadas y talones en el suelo.",
    steps:["Aprieta glúteos y abdomen para que hombros, cadera y rodillas queden en línea.","Lleva el pecho hacia el borde juntando las escápulas, con los codos cerca del cuerpo.","Baja con control hasta estirar los brazos, sin dejar caer la cadera."],
    common_errors:["Dejar caer la cadera","Adelantar el cuello hacia el borde","Usar una mesa ligera o con patas plegables"],
    safety_signals:["La mesa se mueve, cruje o se inclina","Dolor agudo de hombro o codo","Hormigueo en brazo o mano"],
  });
  const pike=strength.find(ex=>ex.slug==="pike-push-up");
  Object.assign(pike,{
    start_position:"Manos al ancho de hombros, pies apoyados en el suelo y cadera elevada formando una V invertida.",
    steps:["Mantén los pies en el suelo y el abdomen firme; flexiona los codos con control.","Acerca la cabeza al suelo entre las manos y ligeramente por delante, sin apoyarla ni cargar el cuello.","Empuja con los brazos para volver a la V invertida, conservando la cadera elevada."],
    common_errors:["Despegar los pies e intentar una parada de manos","Abrir los codos en exceso","Apoyar el peso sobre la cabeza o el cuello"],
  });
  expandedStrength.forEach(ex=>{
    const frames=[0,1].map(i=>`assets/exercise-media/${ex.slug}-${i}.jpg`);
    const media={...FREE_EXERCISE_DB,media_type:"image_sequence",media_url:"",poster_url:frames[0],frames};
    Object.assign(ex,media);
    reviewedMedia.set(ex.slug,media);
  });
  root.FITBUD_EXERCISES=strength.concat(endurance);
  const reviewedBySlug=new Map(root.FITBUD_EXERCISES.map(ex=>[ex.slug,ex]));
  // Ejercicios adicionales presentes en producción, revisados con sus
  // instrucciones reales. No duplicamos aquí sus fichas ni sus demostraciones.
  const SUPPLEMENTAL_LEVELS={
    "band-alternating-lat-pulldown":"beginner",
    "band-assisted-pull-up":"intermediate",
    "dumbbell-alternating-curl":"beginner",
    "dumbbell-alternating-hammer-curl":"beginner",
    "dumbbell-bent-over-row":"intermediate",
    "dumbbell-floor-press":"beginner",
    "dumbbell-glute-bridge":"beginner",
    "dumbbell-lateral-raise":"beginner",
    "dumbbell-overhead-triceps-extension":"intermediate",
    "dumbbell-reverse-fly":"intermediate",
    "dumbbell-reverse-lunge":"intermediate",
    "dumbbell-romanian-deadlift":"intermediate",
    "dumbbell-standing-shoulder-press":"intermediate",
    "goblet-squat":"beginner",
    "scaled-push-up":"intermediate",
    "standing-heel-raise":"beginner",
  };
  root.FITBUD_REVIEWED_EXERCISE_LEVELS=Object.freeze({
    ...Object.fromEntries(root.FITBUD_EXERCISES.map(ex=>[ex.slug,ex.level])),...SUPPLEMENTAL_LEVELS,
  });
  // La versión empaquetada corrige niveles y demos antiguas de Supabase sin
  // modificar filas, planes guardados, estados administrativos ni ejercicios propios.
  function normalizeReviewedExercise(exercise){
    if(!exercise)return exercise;
    const reviewed=reviewedBySlug.get(exercise.slug);
    const level=root.FITBUD_REVIEWED_EXERCISE_LEVELS[exercise.slug];
    if(!EXERCISE_LEVELS.has(level))return {...exercise};
    const technique=exercise.slug==="pike-push-up"?{
      start_position:reviewed.start_position,steps:reviewed.steps,common_errors:reviewed.common_errors,
    }:{};
    // Las nuevas fichas también corrigen metadatos remotos antiguos. Se conserva
    // active (administración) y no se modifica ningún snapshot de entrenamiento.
    const expanded=expandedStrength.find(ex=>ex.slug===exercise.slug);
    const content=expanded?Object.fromEntries(Object.entries(expanded).filter(([key])=>key!=="active")):{};
    const guidance=reviewed?{regression:reviewed.regression,progression:reviewed.progression,substitute_slugs:reviewed.substitute_slugs}:{};
    return {...exercise,...guidance,...content,level,...(reviewedMedia.get(exercise.slug)||{}),...technique};
  }
  root.FITBUD_EXERCISE_CONTENT={normalize:normalizeReviewedExercise};
  // REQ-241: qué hacen "Usar versión más fácil" y "Usar progresión" en cada
  // ejercicio de fuerza. Vive aquí (por slug) y no en la tabla para que valga
  // igual con el catálogo local que con el de Supabase.
  //   exercise → se cambia a otro ejercicio del catálogo (título e imagen nuevos)
  //   variant  → mismo ejercicio con otra ejecución (pausa, una pierna, menos asistencia)
  //   load     → solo cambia la carga: no hay otro ejercicio, se da la pauta
  const toEx=(to,name)=>({kind:"exercise",to,name});
  const variant=name=>({kind:"variant",name});
  const load=name=>({kind:"load",name});
  root.FITBUD_EXERCISE_VARIANTS={
    "back-squat":{regression:variant("Sentadilla a caja"),progression:toEx("front-squat","Sentadilla frontal")},
    "bench-press":{regression:toEx("dumbbell-floor-press","Press de pecho en el suelo"),progression:variant("Press de banca con pausa en el pecho")},
    "seated-cable-row":{regression:toEx("band-row","Remo con banda"),progression:variant("Remo sentado con pausa")},
    "romanian-deadlift":{regression:load("Reduce la carga de la barra para practicar la bisagra sin perder la postura"),progression:toEx("single-leg-rdl","Peso muerto a una pierna")},
    "barbell-hip-thrust":{regression:toEx("glute-bridge","Puente de glúteo"),progression:variant("Hip thrust con pausa arriba")},
    "incline-dumbbell-press":{regression:load("Usa mancuernas más ligeras"),progression:variant("Press inclinado alternado")},
    "lat-pulldown":{regression:load("Reduce el peso de la polea sin perder el control del tirón"),progression:toEx("assisted-pull-up","Dominada asistida")},
    "bulgarian-split-squat":{regression:toEx("walking-lunge","Zancada"),progression:load("Sentadilla búlgara con más carga")},
    "overhead-press":{regression:toEx("seated-dumbbell-press","Press de hombros sentado con mancuernas"),progression:variant("Press militar de pie con pausa")},
    "walking-lunge":{regression:variant("Zancada con apoyo"),progression:toEx("bulgarian-split-squat","Sentadilla búlgara")},
    "standing-calf-raise":{regression:variant("Elevación de gemelos con apoyo"),progression:variant("Elevación de gemelos a una pierna")},
    "assisted-dip":{regression:toEx("incline-push-up","Flexión inclinada"),progression:variant("Fondos con menos asistencia")},
    "biceps-curl":{regression:load("Usa mancuernas más ligeras"),progression:variant("Curl alternado controlado")},
    "triceps-pushdown":{regression:load("Reduce el peso de la polea"),progression:variant("Extensión de tríceps a un brazo")},
    "leg-press":{regression:variant("Prensa con rango corto"),progression:variant("Prensa a una pierna")},
    "leg-curl":{regression:variant("Curl femoral con rango corto"),progression:variant("Curl femoral a una pierna")},
    "tempo-squat":{regression:variant("Sentarse y levantarse de una silla"),progression:variant("Sentadilla con pausa abajo")},
    "push-up":{regression:toEx("incline-push-up","Flexión inclinada"),progression:toEx("decline-push-up","Flexión con pies elevados")},
    "incline-push-up":{regression:variant("Flexión contra la pared"),progression:toEx("push-up","Flexión de brazos")},
    "band-row":{regression:load("Usa una banda más suave"),progression:toEx("inverted-row","Remo invertido")},
    "inverted-row":{regression:variant("Remo invertido más vertical"),progression:variant("Remo invertido con piernas estiradas")},
    "glute-bridge":{regression:variant("Puente de glúteo con rango corto"),progression:toEx("single-leg-glute-bridge","Puente de glúteo a una pierna")},
    "single-leg-glute-bridge":{regression:toEx("glute-bridge","Puente de glúteo"),progression:variant("Puente a una pierna con pausa arriba")},
    "front-plank":{regression:variant("Plancha con rodillas apoyadas"),progression:toEx("shoulder-tap-plank","Plancha con toque de hombro")},
    "side-plank":{regression:variant("Plancha lateral con rodillas"),progression:variant("Plancha lateral con pierna elevada")},
    "dead-bug":{regression:variant("Dead bug moviendo solo brazos o piernas"),progression:variant("Dead bug con brazo y pierna opuestos")},
    "pike-push-up":{regression:variant("Pike push-up con manos elevadas"),progression:variant("Pike push-up con pies elevados")},
    "single-leg-rdl":{regression:variant("Peso muerto a una pierna con apoyo"),progression:load("Peso muerto a una pierna con carga")},
    "assisted-pull-up":{regression:load("Usa una banda de mayor asistencia y conserva la bajada controlada"),progression:variant("Dominada con menos asistencia")},
    "shoulder-tap-plank":{regression:toEx("front-plank","Plancha frontal"),progression:variant("Toques de hombro más lentos")},
    "step-up":{regression:variant("Subida a un escalón bajo con apoyo"),progression:load("Escalón más alto o con carga")},
    "slider-leg-curl":{regression:variant("Curl deslizante bilateral con recorrido corto"),progression:variant("Curl deslizante completo con cadera elevada")},
    "lateral-raise":{regression:variant("Elevación lateral con poco rango"),progression:variant("Elevación lateral con pausa arriba")},
    "cable-fly":{regression:variant("Apertura en polea con rango corto"),progression:variant("Apertura en polea con pausa al centro")},
    "face-pull":{regression:load("Usa menos peso"),progression:variant("Face pull con rotación externa")},
    "hammer-curl":{regression:load("Usa mancuernas más ligeras"),progression:load("Aumenta ligeramente las mancuernas al completar todas las series sin balancearte")},
    "diamond-push-up":{regression:variant("Flexión diamante con rodillas"),progression:variant("Flexión diamante con pausa")},
    "pull-up":{regression:toEx("assisted-pull-up","Dominada asistida"),progression:toEx("weighted-pull-up","Dominada con lastre")},
    "decline-push-up":{regression:toEx("push-up","Flexión de brazos"),progression:toEx("archer-push-up","Flexión arquero")},
    "weighted-pull-up":{regression:toEx("pull-up","Dominada"),progression:load("Dominada con más lastre")},
    "front-squat":{regression:toEx("dumbbell-squat","Sentadilla con mancuernas a los lados"),progression:variant("Sentadilla frontal con pausa")},
    "archer-push-up":{regression:variant("Flexión arquero con apoyo"),progression:variant("Flexión a un brazo asistida")},
    "nordic-hamstring-curl":{regression:variant("Curl nórdico parcial"),progression:variant("Curl nórdico completo con pausa")},
  };
  expandedStrength.forEach(ex=>{
    root.FITBUD_EXERCISE_VARIANTS[ex.slug]={
      regression:ex.equipment.length?load(ex.regression):variant(ex.regression),
      progression:ex.equipment.length?load(ex.progression):variant(ex.progression),
    };
  });
  strength.forEach(ex=>{
    const directions=root.FITBUD_EXERCISE_VARIANTS[ex.slug];
    ex.regression=directions.regression.name;
    ex.progression=directions.progression.name;
  });
  // REQ-247: "Sustituir ejercicio" solo propone ejercicios que trabajan el
  // mismo músculo principal. El patrón no basta: "pull" junta jalón, remo y
  // face pull, que cargan músculos distintos. Por slug, como las variantes, para
  // que valga con el catálogo local y con el de Supabase; un ejercicio sin
  // entrada (creado desde admin) usa el primero de su lista de músculos.
  const PRIMARY_MUSCLE={
    "back-squat":"Cuádriceps","front-squat":"Cuádriceps","tempo-squat":"Cuádriceps","leg-press":"Cuádriceps",
    "bulgarian-split-squat":"Cuádriceps","walking-lunge":"Cuádriceps","step-up":"Cuádriceps",
    "romanian-deadlift":"Isquiotibiales","single-leg-rdl":"Isquiotibiales","leg-curl":"Isquiotibiales",
    "slider-leg-curl":"Isquiotibiales","nordic-hamstring-curl":"Isquiotibiales",
    "barbell-hip-thrust":"Glúteos","glute-bridge":"Glúteos","single-leg-glute-bridge":"Glúteos",
    "standing-calf-raise":"Pantorrillas",
    "bench-press":"Pecho","incline-dumbbell-press":"Pecho","cable-fly":"Pecho","push-up":"Pecho",
    "incline-push-up":"Pecho","decline-push-up":"Pecho","archer-push-up":"Pecho","assisted-dip":"Pecho",
    "triceps-pushdown":"Tríceps","diamond-push-up":"Tríceps",
    "overhead-press":"Hombros","pike-push-up":"Hombros",
    "lateral-raise":"Deltoides lateral",
    "face-pull":"Deltoides posterior",
    "lat-pulldown":"Dorsal ancho","pull-up":"Dorsal ancho","assisted-pull-up":"Dorsal ancho","weighted-pull-up":"Dorsal ancho",
    "seated-cable-row":"Espalda media","band-row":"Espalda media","inverted-row":"Espalda media",
    "biceps-curl":"Bíceps","hammer-curl":"Bíceps",
    "front-plank":"Core","side-plank":"Core","dead-bug":"Core","shoulder-tap-plank":"Core",
  };
  EXPANDED_STRENGTH_SPECS.forEach(spec=>{PRIMARY_MUSCLE[spec.slug]=spec.primary_muscle;});
  const list=value=>{
    if(Array.isArray(value))return value;
    try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[];}catch(e){return [];}
  };
  function primaryMuscle(exercise){
    if(!exercise)return "";
    const muscle=PRIMARY_MUSCLE[exercise.slug]||list(exercise.muscles)[0]||"";
    return String(muscle).trim();
  }
  // REQ-302: también los enlaces declarados y exportados a SQL son válidos.
  // No basta con ocultar en la UI los destinos con otro músculo principal.
  strength.forEach(ex=>{
    const compatible=strength.filter(other=>other.slug!==ex.slug&&primaryMuscle(other)===primaryMuscle(ex));
    const valid=new Set(compatible.map(other=>other.slug));
    ex.substitute_slugs=[...new Set(ex.substitute_slugs.filter(slug=>valid.has(slug)).concat(compatible.map(other=>other.slug)))];
  });
  // Sustitutos directos primero y luego el resto del catálogo, siempre con el
  // mismo músculo principal que el ejercicio actual.
  function substituteCandidates(current,catalog){
    const target=primaryMuscle(current).toLowerCase();
    if(!target)return [];
    const items=(catalog||[]).filter(exercise=>exercise&&exercise.active!==false);
    const bySlug=new Map(items.map(exercise=>[exercise.slug,exercise]));
    const slugs=[...new Set(list(current.substitute_slugs).concat(items.map(exercise=>exercise.slug)))];
    return slugs
      .filter(slug=>slug!==current.slug)
      .map(slug=>bySlug.get(slug))
      .filter(exercise=>exercise&&primaryMuscle(exercise).toLowerCase()===target);
  }
  // REQ-261: buscador del catálogo de fuerza por nombre, alias o músculo, sin
  // distinguir tildes ni mayúsculas. Primero los que empiezan por lo buscado y
  // los de ese músculo principal.
  const fold=value=>String(value||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
  const STRENGTH_DISCIPLINES=new Set(["gym","strength","bodyweight"]);
  function searchExercises(query,catalog){
    const terms=fold(query).split(/\s+/).filter(Boolean);
    const q=terms.join(" ");
    return (catalog||[])
      .filter(exercise=>exercise&&exercise.active!==false&&STRENGTH_DISCIPLINES.has(exercise.discipline))
      .map(exercise=>{
        const name=fold(exercise.name),aliases=list(exercise.aliases).map(fold).join(" ");
        const muscles=[primaryMuscle(exercise)].concat(list(exercise.muscles)).map(fold).join(" ");
        const haystack=`${name} ${aliases} ${muscles}`;
        if(!terms.every(term=>haystack.includes(term)))return null;
        const score=!q||name.startsWith(q)?0:fold(primaryMuscle(exercise)).startsWith(q)?1:name.includes(q)?2:aliases.includes(q)?3:4;
        return {exercise,score};
      })
      .filter(Boolean)
      .sort((a,b)=>a.score-b.score||String(a.exercise.name).localeCompare(String(b.exercise.name),"es"))
      .map(item=>item.exercise);
  }
  root.FITBUD_EXERCISE_SUBSTITUTION={primaryMuscles:PRIMARY_MUSCLE,primaryMuscle,candidates:substituteCandidates,search:searchExercises};
  root.FITBUD_WORKOUT_EXERCISES={
    gym:{
      fullA:["back-squat","bench-press","seated-cable-row","romanian-deadlift","dead-bug"],
      fullB:["barbell-hip-thrust","incline-dumbbell-press","lat-pulldown","bulgarian-split-squat","side-plank"],
      torsoA:["bench-press","seated-cable-row","overhead-press","lat-pulldown"],
      piernaA:["back-squat","romanian-deadlift","walking-lunge","standing-calf-raise"],
      torsoB:["incline-dumbbell-press","seated-cable-row","assisted-dip","biceps-curl","triceps-pushdown"],
      piernaB:["leg-press","barbell-hip-thrust","bulgarian-split-squat","leg-curl"],
      pushA:["bench-press","overhead-press","incline-dumbbell-press","lateral-raise","triceps-pushdown","cable-fly"],
      pullA:["lat-pulldown","seated-cable-row","face-pull","biceps-curl","hammer-curl"],
      legsA:["back-squat","romanian-deadlift","leg-press","leg-curl","standing-calf-raise"],
      pushB:["incline-dumbbell-press","bench-press","lateral-raise","assisted-dip","cable-fly"],
      pullB:["seated-cable-row","lat-pulldown","hammer-curl","biceps-curl","face-pull"],
      legsB:["barbell-hip-thrust","bulgarian-split-squat","leg-press","leg-curl","standing-calf-raise"],
    },
    bodyweight:{
      fullA:["tempo-squat","push-up","inverted-row","glute-bridge","front-plank"],
      fullB:["bulgarian-split-squat","pike-push-up","inverted-row","single-leg-rdl","side-plank"],
      torsoA:["push-up","inverted-row","pike-push-up","assisted-pull-up"],
      piernaA:["tempo-squat","walking-lunge","single-leg-glute-bridge","standing-calf-raise"],
      torsoB:["incline-push-up","inverted-row","assisted-dip","shoulder-tap-plank"],
      piernaB:["bulgarian-split-squat","single-leg-rdl","step-up","slider-leg-curl","dead-bug"],
      pushA:["push-up","pike-push-up","diamond-push-up","assisted-dip"],
      pullA:["pull-up","inverted-row","assisted-pull-up"],
      legsA:["tempo-squat","bulgarian-split-squat","single-leg-rdl","standing-calf-raise"],
      pushB:["decline-push-up","push-up","pike-push-up","assisted-dip"],
      pullB:["pull-up","inverted-row","assisted-pull-up"],
      legsB:["walking-lunge","glute-bridge","slider-leg-curl","step-up"],
    },
    walking:{calidad:["walk-brisk"],facil:["walk-easy"],tecnica:["walk-mobility"]},
    running:{calidad:["run-intervals"],facil:["run-easy"],tecnica:["run-drills"]},
    cycling:{calidad:["cycle-intervals"],facil:["cycle-endurance"],tecnica:["cycle-cadence"]},
    swimming:{calidad:["swim-intervals"],facil:["swim-endurance"],tecnica:["swim-drills"]},
  };
})(typeof window!=="undefined"?window:globalThis);
