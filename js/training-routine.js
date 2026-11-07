// REQ-359: contrato compartido de propuestas semanales. Sin DOM ni persistencia.
(function(root){
  "use strict";
  const STYLES={mixed:"Máquinas y peso libre",machines:"Máquinas",free_weights:"Peso libre"};
  const text=value=>String(value==null?"":value).trim();
  function style(value){return Object.hasOwn(STYLES,value)?value:"mixed";}
  function matchesStyle(exercise,value){
    const selected=style(value);
    if(selected==="mixed")return true;
    const equipment=Array.isArray(exercise&&exercise.equipment)?exercise.equipment:[];
    const name=text(exercise&&exercise.name).toLowerCase();
    if(selected==="machines")return equipment.every(item=>["machines","cable","leg_press","leg_curl","bench","bodyweight","bench_or_assistance"].includes(item)
      ||(item==="dumbbells_or_cable"&&/polea|cable/i.test(name)))&&!/mancuerna|con barra/i.test(name);
    return !equipment.some(item=>["machines","cable","leg_press","leg_curl"].includes(item))&&!/polea|máquina|maquina/i.test(name);
  }
  function validReps(value){
    const match=text(value).match(/^(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?(\s*(?:s|seg|segundos|\/lado|por lado))?$/i);
    if(!match)return false;
    const low=Number(match[1]),high=Number(match[2]||low),seconds=!!match[3]&&!match[3].toLowerCase().includes("lado");
    return low>=1&&high>=low&&high<=(seconds?120:60);
  }
  function validate(action,context){
    const ctx=context||{},errors=[];
    const fail=message=>errors.push(message);
    if(!action||action.tipo!=="actualizar_rutina")return {ok:false,errors:["La propuesta no contiene una rutina."]};
    if(!Object.hasOwn(STYLES,action.style))fail("Elige máquinas, peso libre o ambos.");
    if(ctx.requiredStyle&&action.style!==ctx.requiredStyle)fail("La propuesta cambió la preferencia de equipo que elegiste.");
    const sessions=Array.isArray(action.sessions)?action.sessions:[];
    if(!sessions.length||sessions.length>7)fail("La propuesta debe tener entre uno y siete días.");
    const seen=new Set(),allIds=new Set();
    const allowedDays=Array.isArray(ctx.days)?new Map(ctx.days.map(day=>[day.weekday,day])):null;
    const normalized=sessions.slice(0,7).map(session=>{
      const weekday=session&&session.weekday;
      const name=text(session&&session.name);
      if(!Number.isInteger(weekday)||weekday<0||weekday>6||seen.has(weekday))fail("Los días de la rutina deben ser únicos y válidos.");
      seen.add(weekday);
      const day=allowedDays&&allowedDays.get(weekday);
      if(allowedDays&&!day)fail("La rutina incluye un día sin fuerza disponible en tu semana.");
      if(!name||name.length>80)fail("Cada día necesita un nombre de hasta 80 caracteres.");
      const raw=Array.isArray(session&&session.exercises)?session.exercises:[];
      if(raw.length<2||raw.length>8)fail("Cada sesión necesita entre dos y ocho ejercicios.");
      const used=new Set(),allowed=day?new Set(day.allowedExerciseIds||[]):null;
      const exercises=raw.slice(0,8).map(item=>{
        const exerciseId=text(item&&item.exerciseId),sets=item&&item.sets,reps=text(item&&item.reps),restSeconds=item&&item.restSeconds;
        if(!/^[a-z0-9_-]{1,100}$/i.test(exerciseId)||used.has(exerciseId))fail("Hay un ejercicio inválido o repetido en la sesión.");
        if(allowed&&!allowed.has(exerciseId))fail("Un ejercicio no corresponde a tus recursos, preferencias o nivel.");
        const entry=Array.isArray(ctx.catalog)&&ctx.catalog.find(exercise=>exercise.slug===exerciseId);
        if(entry&&!matchesStyle(entry,action.style))fail("Un ejercicio no respeta la preferencia de máquinas o peso libre.");
        if(!Number.isInteger(sets)||sets<1||sets>(ctx.gentle?3:5))fail("Revisa la cantidad de series de la propuesta.");
        if(!validReps(reps))fail("Revisa las repeticiones de la propuesta.");
        if(!Number.isInteger(restSeconds)||restSeconds<20||restSeconds>300)fail("El descanso debe estar entre 20 y 300 segundos.");
        used.add(exerciseId);allIds.add(exerciseId);
        return {exerciseId,sets,reps,restSeconds};
      });
      const seconds=600+exercises.reduce((sum,item)=>sum+item.sets*(45+item.restSeconds),0)+Math.max(0,exercises.length-1)*120;
      if(ctx.sessionMinutes&&seconds>ctx.sessionMinutes*60*1.25)fail("La dosis propuesta no cabe en tu tiempo disponible.");
      return {weekday,name,exercises};
    });
    const preserve=Array.isArray(ctx.preserve)?ctx.preserve:[];
    if(preserve.some(id=>!allIds.has(id)))fail("La propuesta no conserva todos los ejercicios que elegiste.");
    return {ok:!errors.length,errors:[...new Set(errors)],action:{tipo:"actualizar_rutina",descripcion:"Actualizar mi rutina semanal",style:style(action.style),sessions:normalized}};
  }
  // Texto plano seguro: conserva saltos y elimina marcadores visibles; jamás interpreta HTML.
  function plainText(value){
    return text(value).replace(/\\r\\n|\\n/g,"\n").replace(/\\t/g," ")
      .replace(/\*\*([^*]+)\*\*/g,"$1").replace(/__([^_]+)__/g,"$1")
      .replace(/^#{1,6}\s+/gm,"").replace(/```(?:\w+)?\n?|```/g,"");
  }
  root.FITBUD_TRAINING_ROUTINE={STYLES,style,matchesStyle,validReps,validate,plainText};
})(typeof window!=="undefined"?window:globalThis);
