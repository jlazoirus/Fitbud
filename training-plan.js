(function(root){
  "use strict";

  const VERSION=1;
  const SESSION_TYPES=new Set(["strength","running","cycling","swimming"]);
  const BLOCK_PHASES=new Set(["warmup","main","recovery","cooldown"]);

  function number(value,fallback){
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:fallback;
  }
  function integer(value,fallback){
    const parsed=Number.parseInt(value,10);
    return Number.isInteger(parsed)?parsed:fallback;
  }
  function text(value){
    return String(value==null?"":value).trim();
  }
  function unique(values){
    return [...new Set(values)];
  }
  function phaseForWeek(week,durationWeeks){
    const current=Math.max(1,integer(week,1));
    const duration=number(durationWeeks,10)===4?4:10;
    if(duration===4){
      if(current===1)return "base";
      if(current<=3)return "progression";
      return "consolidation";
    }
    if(current<=2)return "base";
    if(current<=5)return "progression";
    if(current===6)return "deload";
    if(current<=9)return "build";
    return "consolidation";
  }
  function phaseRanges(phase){
    return {
      base:{sets:[2,4],rpe:[5,7]},
      progression:{sets:[3,5],rpe:[6,8]},
      deload:{sets:[1,3],rpe:[4,6]},
      build:{sets:[3,5],rpe:[6,9]},
      consolidation:{sets:[2,4],rpe:[5,7]},
    }[phase]||{sets:[1,5],rpe:[3,9]};
  }
  function containsBlocked(value,blockedTerms){
    const haystack=JSON.stringify(value||{}).toLowerCase();
    return (blockedTerms||[]).some(term=>term&&haystack.includes(String(term).toLowerCase()));
  }
  function normalizeExercise(raw,ranges,allowed,issues,label){
    const exerciseId=text(raw&&(raw.exercise_id||raw.exerciseId));
    const sets=integer(raw&&raw.sets,0);
    const reps=text(raw&&raw.reps);
    const restSeconds=integer(raw&&(raw.rest_seconds!=null?raw.rest_seconds:raw.restSeconds),0);
    const targetRpe=number(raw&&(raw.target_rpe!=null?raw.target_rpe:raw.targetRpe),0);
    const targetRir=number(raw&&(raw.target_rir!=null?raw.target_rir:raw.targetRir),0);
    const tempo=text(raw&&raw.tempo)||"Controlado";
    if(!exerciseId||!allowed.has(exerciseId))issues.push(`${label}: ejercicio no permitido.`);
    if(sets<ranges.sets[0]||sets>ranges.sets[1])issues.push(`${label}: series fuera de la fase.`);
    if(!reps||reps.length>40)issues.push(`${label}: repeticiones inválidas.`);
    if(restSeconds<20||restSeconds>300)issues.push(`${label}: descanso inválido.`);
    if(targetRpe<ranges.rpe[0]||targetRpe>ranges.rpe[1])issues.push(`${label}: intensidad fuera de la fase.`);
    if(targetRir<0||targetRir>5)issues.push(`${label}: reserva inválida.`);
    return {exerciseId,sets,reps,restSeconds,targetRpe,targetRir,tempo};
  }
  function normalizeBlock(raw,issues,label){
    const phase=text(raw&&raw.phase);
    const durationSeconds=integer(raw&&(raw.duration_seconds!=null?raw.duration_seconds:raw.durationSeconds),0);
    const block={
      phase,
      label:text(raw&&raw.label),
      target:text(raw&&raw.target),
      intensity:text(raw&&raw.intensity),
      durationSeconds,
    };
    if(!BLOCK_PHASES.has(phase))issues.push(`${label}: fase de bloque inválida.`);
    if(!block.label||!block.target||!block.intensity)issues.push(`${label}: bloque incompleto.`);
    if(durationSeconds<15||durationSeconds>7200)issues.push(`${label}: duración de bloque inválida.`);
    return block;
  }
  function normalizeWeek(raw,config){
    const issues=[];
    const expected=Array.isArray(config&&config.sessions)?config.sessions:[];
    const allowed=new Set(Array.isArray(config&&config.allowedExerciseIds)?config.allowedExerciseIds.map(String):[]);
    const expectedWeek=Math.max(1,integer(config&&config.week,1));
    const durationWeeks=number(config&&config.durationWeeks,10)===4?4:10;
    const expectedPhase=phaseForWeek(expectedWeek,durationWeeks);
    const rawSessions=raw&&Array.isArray(raw.sessions)?raw.sessions:[];
    if(integer(raw&&raw.week,0)!==expectedWeek)issues.push("La semana no coincide con la solicitada.");
    if(text(raw&&raw.phase)!==expectedPhase)issues.push("La fase no coincide con la progresión esperada.");
    if(rawSessions.length!==expected.length)issues.push("La cantidad de sesiones no coincide con la disponibilidad.");
    if(containsBlocked(raw,config&&config.blockedTerms))issues.push("El plan incluye un movimiento o limitación bloqueada.");

    const expectedByDate=new Map(expected.map(item=>[item.date,item]));
    const seen=new Set();
    const ranges=phaseRanges(expectedPhase);
    const sessions=rawSessions.map((rawSession,index)=>{
      const date=text(rawSession&&rawSession.date);
      const spec=expectedByDate.get(date);
      const label=`Sesión ${index+1}`;
      if(!spec)issues.push(`${label}: fecha no disponible.`);
      if(seen.has(date))issues.push(`${label}: fecha duplicada.`);
      seen.add(date);
      const type=text(rawSession&&rawSession.type);
      const role=text(rawSession&&rawSession.role);
      const location=text(rawSession&&rawSession.location);
      const durationMinutes=integer(rawSession&&(rawSession.duration_minutes!=null?rawSession.duration_minutes:rawSession.durationMinutes),0);
      const intensity=text(rawSession&&rawSession.intensity);
      if(!SESSION_TYPES.has(type))issues.push(`${label}: tipo inválido.`);
      if(spec&&type!==spec.type)issues.push(`${label}: tipo distinto al plan combinado.`);
      if(spec&&role!==spec.role)issues.push(`${label}: objetivo distinto al plan combinado.`);
      if(spec&&location!==spec.location)issues.push(`${label}: lugar distinto a la disponibilidad.`);
      if(spec&&integer(rawSession&&rawSession.weekday,-1)!==Number(spec.weekday))issues.push(`${label}: día de semana inválido.`);
      if(durationMinutes<20||durationMinutes>Math.max(20,integer(config&&config.sessionMinutes,60)))issues.push(`${label}: duración fuera del tiempo disponible.`);
      if(!text(rawSession&&rawSession.name)||!text(rawSession&&rawSession.objective)||!intensity)issues.push(`${label}: faltan nombre, objetivo o intensidad.`);

      const rawExercises=Array.isArray(rawSession&&rawSession.exercises)?rawSession.exercises:[];
      const rawBlocks=Array.isArray(rawSession&&rawSession.blocks)?rawSession.blocks:[];
      const sessionAllowed=spec&&Array.isArray(spec.allowedExerciseIds)
        ?new Set(spec.allowedExerciseIds.map(String)):allowed;
      const exercises=rawExercises.map((exercise,exerciseIndex)=>
        normalizeExercise(exercise,ranges,sessionAllowed,issues,`${label}, ejercicio ${exerciseIndex+1}`)
      );
      const blocks=rawBlocks.map((block,blockIndex)=>normalizeBlock(block,issues,`${label}, bloque ${blockIndex+1}`));
      if(type==="strength"){
        if(exercises.length<2||exercises.length>8)issues.push(`${label}: una sesión de fuerza requiere entre 2 y 8 ejercicios.`);
        if(blocks.length)issues.push(`${label}: una sesión de fuerza no debe declarar intervalos.`);
        const estimatedSeconds=exercises.reduce((sum,exercise)=>sum+exercise.sets*(exercise.restSeconds+45),600);
        if(durationMinutes>0&&estimatedSeconds>durationMinutes*60*1.25)issues.push(`${label}: la dosis no cabe en el tiempo disponible.`);
      }else{
        if(exercises.length!==1)issues.push(`${label}: una sesión aeróbica requiere un ejercicio del catálogo.`);
        if(blocks.length<3||blocks[0]&&blocks[0].phase!=="warmup"||blocks.at(-1)&&blocks.at(-1).phase!=="cooldown"){
          issues.push(`${label}: la sesión aeróbica requiere calentamiento, trabajo y vuelta a la calma.`);
        }
        const blockSeconds=blocks.reduce((sum,block)=>sum+block.durationSeconds,0);
        if(durationMinutes>0&&(blockSeconds>durationMinutes*60*1.1||blockSeconds<durationMinutes*60*.45)){
          issues.push(`${label}: los bloques no coinciden con la duración declarada.`);
        }
      }
      return {
        id:`generated-${date}-${role||index+1}`,
        date,
        weekday:spec?Number(spec.weekday):integer(rawSession&&rawSession.weekday,0),
        location,
        role,
        type,
        name:text(rawSession&&rawSession.name),
        objective:text(rawSession&&rawSession.objective),
        durationMinutes,
        intensity,
        exercises,
        blocks,
      };
    });
    expected.forEach(spec=>{if(!seen.has(spec.date))issues.push(`Falta la sesión de ${spec.date}.`);});
    return {
      ok:issues.length===0,
      issues:unique(issues),
      week:{
        week:expectedWeek,
        phase:expectedPhase,
        reason:text(raw&&raw.reason),
        sessions,
      },
    };
  }
  function workoutFromSession(session,strengthMode){
    if(!session)return null;
    const strength=session.type==="strength";
    const kind=strength
      ?(strengthMode==="bodyweight"?"Peso corporal":"Gimnasio")
      :session.type==="swimming"?"Natación":session.type==="cycling"?"Cycling":"Running";
    return {
      id:session.id,
      kind,
      name:session.name,
      detail:`${session.objective} · ${session.durationMinutes} min · ${session.intensity}`,
      sport:strength?null:session.type,
      exerciseIds:session.exercises.map(item=>item.exerciseId),
      generated:true,
      generatedPrescription:{
        objective:session.objective,
        durationMinutes:session.durationMinutes,
        intensity:session.intensity,
        exercises:session.exercises,
        blocks:session.blocks,
      },
    };
  }
  function sessionForDate(plan,date){
    const weeks=plan&&Array.isArray(plan.weeks)?plan.weeks:[];
    for(const week of weeks){
      const session=(week.sessions||[]).find(item=>item.date===date);
      if(session)return session;
    }
    return null;
  }
  function validatePlan(plan,config){
    const issues=[];
    const duration=number(config&&config.durationWeeks,10)===4?4:10;
    const weeks=plan&&Array.isArray(plan.weeks)?plan.weeks:[];
    if(weeks.length!==duration)issues.push(`El plan debe contener ${duration} semanas.`);
    const dates=[];
    weeks.forEach((week,index)=>{
      if(Number(week.week)!==index+1)issues.push(`La semana ${index+1} está fuera de orden.`);
      if(week.phase!==phaseForWeek(index+1,duration))issues.push(`La semana ${index+1} no respeta la periodización.`);
      (week.sessions||[]).forEach(session=>dates.push(session.date));
    });
    if(unique(dates).length!==dates.length)issues.push("El plan contiene fechas repetidas.");
    return {ok:issues.length===0,issues:unique(issues)};
  }

  root.FITBUD_TRAINING_PLAN={
    VERSION,
    phaseForWeek,
    normalizeWeek,
    validatePlan,
    workoutFromSession,
    sessionForDate,
  };
})(typeof window!=="undefined"?window:globalThis);
