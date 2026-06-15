(function(root){
  "use strict";

  const VERSION=1;
  const STRENGTH_KINDS=new Set(["Gimnasio","Peso corporal"]);
  const CARDIO_KINDS=new Set(["Running","Cycling","Natación"]);

  function number(value,fallback){
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:fallback;
  }
  function clamp(value,min,max){
    return Math.min(max,Math.max(min,number(value,min)));
  }
  function iso(now){
    return new Date(now==null?Date.now():now).toISOString();
  }
  function phaseSettings(week,durationWeeks){
    const current=Math.max(1,Math.round(number(week,1)));
    const duration=number(durationWeeks,10)===4?4:10;
    if(duration===4){
      if(current===1)return {sets:3,rpe:6,rir:3,label:"Base"};
      if(current<=3)return {sets:4,rpe:7,rir:2,label:"Progresión"};
      return {sets:2,rpe:6,rir:3,label:"Consolidación"};
    }
    if(current<=2)return {sets:3,rpe:6,rir:3,label:"Base"};
    if(current<=5)return {sets:4,rpe:7,rir:2,label:"Progresión"};
    if(current===6)return {sets:2,rpe:5,rir:4,label:"Descarga"};
    if(current<=9)return {sets:4,rpe:8,rir:1,label:"Bloque fuerte"};
    return {sets:3,rpe:6,rir:3,label:"Consolidación"};
  }
  function strengthDose(exercise,phase){
    const pattern=String(exercise&&exercise.movement_pattern||"").toLowerCase();
    const slug=String(exercise&&exercise.slug||"");
    let reps="8-12",defaultReps=10,restSeconds=90,tempo="3-1-1",unit="reps";
    if(/back-squat|bench-press|romanian-deadlift|overhead-press/.test(slug)){
      reps="6-10";defaultReps=8;restSeconds=120;
    }else if(pattern==="lunge"){
      reps="8-12 por lado";defaultReps=10;restSeconds=90;
    }else if(pattern==="core"){
      reps="30-45 s";defaultReps=30;restSeconds=60;tempo="Controlado";unit="seg";
    }else if(pattern==="calf"||pattern==="isolation"){
      reps="12-15";defaultReps=12;restSeconds=60;tempo="2-1-2";
    }
    return {
      prescribedSets:phase.sets,
      reps,
      defaultReps,
      restSeconds,
      tempo,
      targetRpe:phase.rpe,
      targetRir:phase.rir,
      unit,
      suggestedLoad:exercise&&exercise.discipline==="bodyweight"
        ? `Peso corporal o asistencia que deje ${phase.rir} repeticiones en reserva`
        : `Carga controlable que deje ${phase.rir} repeticiones en reserva`,
    };
  }
  function timedStep(id,phase,label,target,intensity,durationSeconds,extra){
    return Object.assign({
      id,
      type:"timed",
      phase,
      label,
      target,
      intensity,
      durationSeconds:Math.max(15,Math.round(number(durationSeconds,60))),
    },extra||{});
  }
  function cardioLabels(sport){
    if(sport==="swimming")return {warmup:"Entrada en calor",cooldown:"Vuelta a la calma",easy:"Nado aeróbico"};
    if(sport==="cycling")return {warmup:"Pedaleo de calentamiento",cooldown:"Pedaleo suave",easy:"Fondo aeróbico"};
    return {warmup:"Calentamiento",cooldown:"Enfriamiento",easy:"Carrera aeróbica"};
  }
  function cardioSpecs(sport,sessionId,phaseIndex,sessionMinutes){
    const phase=clamp(phaseIndex,0,4);
    const minutes=clamp(sessionMinutes,30,120);
    const labels=cardioLabels(sport);
    const warmupSeconds=sport==="swimming"?300:(sport==="cycling"?720:600);
    const cooldownSeconds=sport==="swimming"?300:600;
    const warmupTarget=sport==="swimming"?"200-300 m suaves":`${Math.round(warmupSeconds/60)} min suaves`;
    const cooldownTarget=sport==="swimming"?"200 m suaves":`${Math.round(cooldownSeconds/60)} min suaves`;
    const steps=[timedStep("warmup","warmup",labels.warmup,warmupTarget,"RPE 2-3",warmupSeconds)];

    if(sessionId==="calidad"){
      const quality={
        running:[
          {rounds:6,target:"400 m",seconds:150,recovery:90,rpe:7},
          {rounds:5,target:"800 m",seconds:240,recovery:120,rpe:8},
          {rounds:4,target:"15 s progresivos",seconds:15,recovery:45,rpe:6},
          {rounds:4,target:"1 km",seconds:300,recovery:120,rpe:8},
          {rounds:4,target:"200 m ágiles",seconds:45,recovery:60,rpe:6},
        ],
        cycling:[
          {rounds:6,target:"2 min fuertes",seconds:120,recovery:120,rpe:7},
          {rounds:5,target:"4 min fuertes",seconds:240,recovery:180,rpe:8},
          {rounds:4,target:"20 s de cadencia",seconds:20,recovery:60,rpe:5},
          {rounds:4,target:"6 min a umbral controlado",seconds:360,recovery:180,rpe:8},
          {rounds:4,target:"20 s de aceleración",seconds:20,recovery:70,rpe:6},
        ],
        swimming:[
          {rounds:8,target:"50 m",seconds:50,recovery:20,rpe:7},
          {rounds:6,target:"100 m",seconds:100,recovery:30,rpe:8},
          {rounds:6,target:"50 m técnica",seconds:60,recovery:30,rpe:5},
          {rounds:4,target:"200 m",seconds:210,recovery:40,rpe:8},
          {rounds:4,target:"25 m ágiles",seconds:25,recovery:35,rpe:6},
        ],
      };
      const spec=(quality[sport]||quality.running)[phase];
      for(let round=1;round<=spec.rounds;round++){
        steps.push(timedStep(
          `work-${round}`,"main",`Bloque ${round} de ${spec.rounds}`,
          spec.target,`RPE ${spec.rpe}`,spec.seconds,{round,totalRounds:spec.rounds}
        ));
        if(round<spec.rounds)steps.push(timedStep(
          `recovery-${round}`,"recovery",`Recuperación ${round}`,
          `${spec.recovery} s suaves`,"RPE 2-3",spec.recovery,{round,totalRounds:spec.rounds}
        ));
      }
    }else if(sessionId==="tecnica"){
      const targets={
        running:["Movilidad y técnica de carrera","6 progresivos de 15 s","Carrera suave con postura estable"],
        cycling:["Cadencia cómoda","6 bloques de cadencia alta","Pedaleo estable sin balanceo"],
        swimming:["Agarre y alineación","Respiración y virajes","Nado suave integrando la técnica"],
      };
      const names=targets[sport]||targets.running;
      const blockSeconds=Math.max(300,Math.round((minutes*60-warmupSeconds-cooldownSeconds)/3));
      names.forEach((target,index)=>steps.push(timedStep(
        `technique-${index+1}`,"main",`Técnica ${index+1}`,target,index===1?"RPE 5-6":"RPE 3-5",blockSeconds
      )));
    }else{
      const mainSeconds=Math.max(1200,minutes*60-warmupSeconds-cooldownSeconds);
      const targets={
        running:["45-55 min a ritmo conversacional","55-70 min; últimos 10 min estables","40-45 min muy suaves","65-80 min sostenibles","40-50 min suaves"],
        cycling:["60-75 min en zona 2","75-105 min en zona 2","50-60 min muy fáciles","90-120 min con 3 bloques tempo","60-75 min fáciles"],
        swimming:["1200-1600 m suaves","1600-2200 m aeróbicos","1000-1400 m muy suaves","2000-2600 m aeróbicos","1200-1600 m cómodos"],
      };
      steps.push(timedStep("endurance","main",labels.easy,(targets[sport]||targets.running)[phase],"RPE 3-5",mainSeconds));
    }

    steps.push(timedStep("cooldown","cooldown",labels.cooldown,cooldownTarget,"RPE 1-2",cooldownSeconds));
    return steps;
  }
  function generatedStrengthSteps(workout,exercises,context){
    const custom=workout.generatedPrescription||{};
    const bySlug=new Map(exercises.map(exercise=>[exercise.slug,exercise]));
    const warmupMinutes=clamp(Math.round(number(custom.durationMinutes||context.sessionMinutes,60)*.12),5,10);
    const cooldownMinutes=clamp(Math.round(number(custom.durationMinutes||context.sessionMinutes,60)*.08),4,8);
    const steps=[timedStep(
      "warmup","warmup","Calentamiento",
      "Movilidad dinámica y series de aproximación de los primeros movimientos","RPE 2-3",warmupMinutes*60
    )];
    (custom.exercises||[]).forEach((dose,index)=>{
      const exercise=bySlug.get(dose.exerciseId)||{};
      steps.push({
        id:`exercise-${index+1}`,
        type:"strength",
        phase:"main",
        label:exercise.name||dose.exerciseId,
        exerciseSlug:dose.exerciseId,
        originalExerciseSlug:dose.exerciseId,
        phaseLabel:"Plan personalizado",
        prescribedSets:clamp(dose.sets,1,5),
        reps:String(dose.reps||"8-12"),
        defaultReps:Math.max(1,Math.round(number(String(dose.reps||"").match(/\d+/)?.[0],10))),
        restSeconds:clamp(dose.restSeconds,20,300),
        tempo:String(dose.tempo||"Controlado"),
        targetRpe:clamp(dose.targetRpe,3,9),
        targetRir:clamp(dose.targetRir,0,5),
        unit:/\bseg|segundo|s\b/i.test(String(dose.reps||""))?"seg":"reps",
        suggestedLoad:exercise.discipline==="bodyweight"
          ?`Peso corporal o asistencia que deje ${clamp(dose.targetRir,0,5)} repeticiones en reserva`
          :`Carga controlable para RPE ${clamp(dose.targetRpe,3,9)}`,
      });
    });
    steps.push(timedStep(
      "cooldown","cooldown","Vuelta a la calma",
      "Respiración tranquila y movilidad suave de las zonas trabajadas","RPE 1-2",cooldownMinutes*60
    ));
    return steps;
  }
  function generatedCardioSteps(workout){
    const blocks=workout.generatedPrescription&&Array.isArray(workout.generatedPrescription.blocks)
      ?workout.generatedPrescription.blocks:[];
    return blocks.map((block,index)=>timedStep(
      `generated-${index+1}`,
      block.phase,
      block.label,
      block.target,
      block.intensity,
      block.durationSeconds
    ));
  }
  function buildPrescription(input){
    const workout=input&&input.workout||{};
    const exercises=Array.isArray(input&&input.exercises)?input.exercises:[];
    const context=input&&input.context||{};
    const kind=String(workout.kind||"");
    if(workout.id==="descanso"||kind==="Descanso"||workout.id==="safety_hold"){
      return {
        version:VERSION,
        workoutId:workout.id||"descanso",
        name:workout.name||"Descanso",
        kind,
        sessionType:"rest",
        objective:"Recuperar para la siguiente sesión",
        estimatedMinutes:0,
        steps:[],
      };
    }
    if(STRENGTH_KINDS.has(kind)){
      if(workout.generatedPrescription&&Array.isArray(workout.generatedPrescription.exercises)){
        return {
          version:VERSION,
          workoutId:workout.id,
          name:workout.name,
          kind,
          sessionType:"strength",
          objective:workout.generatedPrescription.objective||"Completar la sesión con técnica estable",
          estimatedMinutes:clamp(workout.generatedPrescription.durationMinutes||context.sessionMinutes,20,180),
          phaseLabel:"Plan personalizado",
          steps:generatedStrengthSteps(workout,exercises,context),
        };
      }
      const phase=phaseSettings(context.week,context.durationWeeks);
      const warmupMinutes=clamp(Math.round(number(context.sessionMinutes,60)*.12),5,10);
      const cooldownMinutes=clamp(Math.round(number(context.sessionMinutes,60)*.08),4,8);
      const steps=[timedStep(
        "warmup","warmup","Calentamiento",
        "Movilidad dinámica y 1-2 series ligeras de los primeros movimientos","RPE 2-3",warmupMinutes*60
      )];
      exercises.forEach((exercise,index)=>{
        const dose=strengthDose(exercise,phase);
        steps.push(Object.assign({
          id:`exercise-${index+1}`,
          type:"strength",
          phase:"main",
          label:exercise.name,
          exerciseSlug:exercise.slug,
          originalExerciseSlug:exercise.slug,
          phaseLabel:phase.label,
        },dose));
      });
      steps.push(timedStep(
        "cooldown","cooldown","Vuelta a la calma",
        "Respiración tranquila y movilidad suave de las zonas trabajadas","RPE 1-2",cooldownMinutes*60
      ));
      return {
        version:VERSION,
        workoutId:workout.id,
        name:workout.name,
        kind,
        sessionType:"strength",
        objective:"Completar cada serie con técnica estable y esfuerzo controlado",
        estimatedMinutes:clamp(context.sessionMinutes,30,100),
        phaseLabel:phase.label,
        steps,
      };
    }
    if(CARDIO_KINDS.has(kind)){
      const steps=workout.generatedPrescription&&Array.isArray(workout.generatedPrescription.blocks)
        ?generatedCardioSteps(workout)
        :cardioSpecs(
          workout.sport||String(kind).toLowerCase(),
          workout.id,
          workout.phaseIndex,
          context.sessionMinutes
        );
      const seconds=steps.reduce((sum,step)=>sum+number(step.durationSeconds,0),0);
      return {
        version:VERSION,
        workoutId:workout.id,
        name:workout.name,
        kind,
        sessionType:"cardio",
        objective:workout.generatedPrescription&&workout.generatedPrescription.objective
          ?workout.generatedPrescription.objective
          :workout.id==="calidad"
          ?"Sostener la intensidad indicada sin perder técnica"
          :workout.id==="tecnica"
            ?"Mejorar eficiencia y control antes que velocidad"
            :"Acumular trabajo aeróbico a un ritmo sostenible",
        estimatedMinutes:Math.max(1,Math.round(seconds/60)),
        steps,
      };
    }
    return {
      version:VERSION,
      workoutId:workout.id||"unknown",
      name:workout.name||"Entrenamiento",
      kind,
      sessionType:"rest",
      objective:"Revisar la sesión antes de comenzar",
      estimatedMinutes:0,
      steps:[],
    };
  }
  function emptySet(){
    return {done:false,reps:null,load:"",rpe:null,completedAt:null};
  }
  function normalizeStep(saved,prescribed){
    const step=Object.assign({},prescribed,saved||{});
    if(prescribed.type==="strength"){
      const prior=Array.isArray(saved&&saved.sets)?saved.sets:[];
      step.sets=Array.from({length:prescribed.prescribedSets},(_,index)=>Object.assign(emptySet(),prior[index]||{}));
      step.exerciseSlug=String(step.exerciseSlug||prescribed.exerciseSlug);
      step.originalExerciseSlug=String(step.originalExerciseSlug||prescribed.originalExerciseSlug||prescribed.exerciseSlug);
      step.variation=step.variation||"standard";
    }
    step.status=step.status==="done"||step.status==="skipped"?step.status:"pending";
    return step;
  }
  function normalizeExecution(saved,prescription,now){
    if(!saved||typeof saved!=="object"||saved.workoutId!==prescription.workoutId)return null;
    const execution=Object.assign({},saved,{
      version:VERSION,
      workoutId:prescription.workoutId,
      prescriptionName:prescription.name,
      sessionType:prescription.sessionType,
      objective:prescription.objective,
      estimatedMinutes:prescription.estimatedMinutes,
    });
    const previous=Array.isArray(saved.steps)?saved.steps:[];
    execution.steps=prescription.steps.map((step,index)=>normalizeStep(previous.find(item=>item&&item.id===step.id)||previous[index],step));
    execution.status=["in_progress","paused","completed","partial"].includes(saved.status)?saved.status:"in_progress";
    execution.elapsedSeconds=Math.max(0,Math.round(number(saved.elapsedSeconds,0)));
    execution.resumedAt=execution.status==="in_progress"?(saved.resumedAt||iso(now)):null;
    execution.currentStep=Math.round(clamp(saved.currentStep,0,Math.max(0,execution.steps.length-1)));
    if(execution.status==="in_progress"||execution.status==="paused"){
      const next=execution.steps.findIndex(step=>step.status==="pending");
      execution.currentStep=next>=0?next:Math.max(0,execution.steps.length-1);
    }
    execution.timer=saved.timer&&typeof saved.timer==="object"?Object.assign({},saved.timer):null;
    execution.notes=String(saved.notes||"");
    execution.pain=saved.pain||"";
    execution.difficulty=saved.difficulty||"";
    return execution;
  }
  function createExecution(prescription,now){
    const timestamp=iso(now);
    return normalizeExecution({
      workoutId:prescription.workoutId,
      status:"in_progress",
      startedAt:timestamp,
      updatedAt:timestamp,
      resumedAt:timestamp,
      elapsedSeconds:0,
      currentStep:0,
      steps:[],
      timer:null,
      notes:"",
      pain:"",
      difficulty:"",
    },prescription,now);
  }
  function elapsedSeconds(execution,now){
    if(!execution)return 0;
    let elapsed=Math.max(0,number(execution.elapsedSeconds,0));
    if(execution.status==="in_progress"&&execution.resumedAt){
      elapsed+=Math.max(0,(new Date(now==null?Date.now():now)-new Date(execution.resumedAt))/1000);
    }
    return Math.round(elapsed);
  }
  function timerRemaining(timer,now){
    if(!timer)return 0;
    if(timer.running&&timer.endsAt){
      return Math.max(0,Math.ceil((new Date(timer.endsAt)-new Date(now==null?Date.now():now))/1000));
    }
    return Math.max(0,Math.round(number(timer.remainingSeconds,0)));
  }
  function progress(execution){
    const steps=execution&&Array.isArray(execution.steps)?execution.steps:[];
    const completed=steps.filter(step=>step.status==="done").length;
    const skipped=steps.filter(step=>step.status==="skipped").length;
    return {completed,skipped,total:steps.length,remaining:Math.max(0,steps.length-completed-skipped)};
  }
  function strengthTotals(execution){
    const steps=execution&&Array.isArray(execution.steps)?execution.steps:[];
    let completedSets=0,totalSets=0;
    steps.filter(step=>step.type==="strength").forEach(step=>{
      const sets=Array.isArray(step.sets)?step.sets:[];
      totalSets+=sets.length;
      completedSets+=sets.filter(set=>set.done).length;
    });
    return {completedSets,totalSets};
  }
  function outcome(execution){
    if(!execution)return "pending";
    if(execution.status==="completed")return "completed";
    if(execution.status==="partial")return "partial";
    if(execution.status==="paused")return "paused";
    return "in_progress";
  }

  root.FITBUD_WORKOUT_PLAYER={
    VERSION,
    buildPrescription,
    createExecution,
    normalizeExecution,
    elapsedSeconds,
    timerRemaining,
    progress,
    strengthTotals,
    outcome,
  };
})(typeof window!=="undefined"?window:globalThis);
