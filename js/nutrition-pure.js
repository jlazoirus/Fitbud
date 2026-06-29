// Módulo puro de Fitbros — funciones y constantes de dominio sin dependencias de DOM ni estado global.
// Compatible con navegador (<script src="js/nutrition-pure.js">) y Node.js (import/require).
// Expone FITBUD_NUTRITION_PURE como namespace + cada símbolo como global individual
// para mantener compatibilidad con el script inline de index.html.
(function(root){
  "use strict";

  // ── Constantes de plan ──────────────────────────────────────────────────────
  const CYCLE_MENUS=["A","B","C","D","A","B","B","C","D","A"];
  const PLAN_DURATION_OPTIONS=[
    {value:4,label:"4 semanas · bloque corto"},
    {value:10,label:"10 semanas · proceso completo"},
  ];
  const CHALLENGE_LABELS={
    maintain:"Mantener lo logrado",
    continue:"Continuar el mismo objetivo",
    performance:"Mejorar rendimiento",
    strength:"Ganar fuerza",
  };
  const MEAL_SLOT_TEMPLATES={
    2:[["desayuno","Desayuno"],["cena","Cena"]],
    3:[["desayuno","Desayuno"],["almuerzo","Almuerzo"],["cena","Cena"]],
    4:[["desayuno","Desayuno"],["almuerzo","Almuerzo"],["snack","Snack"],["cena","Cena"]],
    5:[["desayuno","Desayuno"],["media_manana","Media mañana"],["almuerzo","Almuerzo"],["merienda","Merienda"],["cena","Cena"]],
    6:[["desayuno","Desayuno"],["media_manana","Media mañana"],["almuerzo","Almuerzo"],["merienda","Merienda"],["cena","Cena"],["recena","Recena"]],
  };
  const BASE_SLOTS=MEAL_SLOT_TEMPLATES[4].map(([id,slot])=>({id,slot}));

  // ── Constantes de perfil ────────────────────────────────────────────────────
  const SPORT_LABELS={running:"Running",cycling:"Cycling",swimming:"Natación",other:"Otro deporte cardio",strength_only:"Solo fuerza"};
  const STRENGTH_LABELS={gym:"Gimnasio",bodyweight:"Peso corporal"};
  const PROFILE_SCHEMA_VERSION=3;
  const PROFILE_REVIEW_DAYS=28;
  const PROFILE_REVIEW_MS=PROFILE_REVIEW_DAYS*24*60*60*1000;

  // ── Constantes de entrenamiento ─────────────────────────────────────────────
  const MIN_TRAINING_DAYS=3;
  const MAX_TRAINING_DAYS=6;
  const WEEKDAY_OPTIONS=[
    {value:1,label:"Lunes",short:"Lun"},
    {value:2,label:"Martes",short:"Mar"},
    {value:3,label:"Miércoles",short:"Mié"},
    {value:4,label:"Jueves",short:"Jue"},
    {value:5,label:"Viernes",short:"Vie"},
    {value:6,label:"Sábado",short:"Sáb"},
    {value:0,label:"Domingo",short:"Dom"},
  ];
  const TRAINING_LOCATION_LABELS={gym:"Gimnasio",home:"Casa",outdoor:"Exterior",pool:"Piscina"};
  const TRAINING_PRIORITY_LABELS={composition:"Composición corporal",performance:"Rendimiento",strength:"Fuerza",health:"Salud general"};
  const TRAINING_EXPERIENCE_LABELS={beginner:"Principiante",intermediate:"Intermedio",advanced:"Avanzado"};
  const WORKOUT_SPLIT_LABELS={fullbody:"Cuerpo completo",upperlower:"Superior / Inferior",ppl:"Push / Pull / Piernas"};
  const TRAINING_TIME_LABELS={morning:"Mañana",midday:"Mediodía",afternoon:"Tarde",evening:"Noche",flexible:"Flexible"};
  const EQUIPMENT_LABELS={
    bodyweight:"Peso corporal",bands:"Bandas",dumbbells:"Mancuernas",barbell:"Barra y discos",
    machines:"Máquinas",pullup:"Barra de dominadas",bike:"Bicicleta",trainer:"Rodillo",pool_gear:"Material de piscina",
  };
  const FOOD_BUDGET_LABELS={low:"Ajustado",medium:"Moderado",flexible:"Flexible"};
  const REPEAT_LABELS={low:"Poca repetición",moderate:"Repetir 2-3 veces",high:"Priorizar practicidad"};
  const CUISINE_LABELS={peruvian:"Peruana",mediterranean:"Mediterránea",asian:"Asiática",mexican:"Mexicana",italian:"Italiana",latin:"Latinoamericana"};
  const PREPARATION_LABELS={quick:"Rápidas",batch:"Cocinar por tandas",no_cook:"Sin cocinar",one_pot:"Una sola olla",oven:"Horno",grill:"Plancha o parrilla"};
  const STRENGTH_SESSION_IDS=new Set(["fullA","fullB","torsoA","torsoB","piernaA","piernaB","pushA","pullA","legsA","pushB","pullB","legsB"]);

  // ── Constantes de actividad y nutrición ────────────────────────────────────
  const ACTIVITY_LEVELS={
    light:{label:"Ligera",description:"Trabajo sedentario y caminatas ocasionales",factor:1.35},
    moderate:{label:"Moderada",description:"Vida activa además de los entrenamientos",factor:1.55},
    high:{label:"Alta",description:"Trabajo físico o actividad diaria intensa",factor:1.725},
  };

  // ── Texto del coach (REQ-31) ────────────────────────────────────────────────
  // Limpia referencias a IA/Claude/proveedores del texto visible al usuario.
  function coachCopy(value){
    return String(value||"")
      .replace(/\bcomo\s+(?:un[ao]?\s+)?(?:inteligencia artificial|IA|AI)(?:\s+de\s+(?:Anthropic|Claude(?:(?:[-\w.]+)|(?:\s+(?:Haiku|Sonnet)(?:\s*[\w.-]+)?))?))?/gi,"Como tu coach")
      .replace(/\bclaude(?:(?:[-\w.]+)|(?:\s+(?:haiku|sonnet)(?:\s*[\w.-]+)?))?\b/gi,"tu coach")
      .replace(/\b(?:haiku|sonnet)(?:\s*[\w.-]+)?\b/gi,"tu coach")
      .replace(/\banthropic\b/gi,"tu coach")
      .replace(/\binteligencia artificial\b/gi,"tu coach")
      .replace(/\b(?:IA|AI)\b/gi,"tu coach")
      .replace(/\busando tu coach\b/gi,"")
      .replace(/\bprompts?\b/gi,"pedido")
      .replace(/\btokens?\b/gi,"recursos")
      .replace(/\s+([,.])/g,"$1")
      .replace(/\s{2,}/g," ")
      .replace(/(^|[.!?]\s+)tu coach\b/g,"$1Tu coach")
      .trim();
  }

  // Normaliza texto a clave de búsqueda (sin acentos, sin espacios, minúsculas).
  function coachKey(value){
    return String(value||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
  }

  function coachSplitTerms(value){
    return String(value||"").split(/[,;]/).map(x=>x.trim()).filter(Boolean);
  }

  // Coincidencia por palabra (no substring): tokeniza con coachKey y compara término vs tokens.
  // El último token del término admite prefijo (plurales: "pollo"→"pollos"), los previos exactos.
  // Evita colisiones como "pollo"⊂"repollo" o "res"⊂"fresco". REQ-66.
  function coachTermInTokens(tokens,term){
    const tt=coachKey(term).split("_").filter(Boolean);
    if(!tt.length)return false;
    for(let i=0;i+tt.length<=tokens.length;i++){
      let ok=true;
      for(let j=0;j<tt.length;j++){
        const tok=tokens[i+j];
        if(j===tt.length-1?!tok.startsWith(tt[j]):tok!==tt[j]){ok=false;break;}
      }
      if(ok)return true;
    }
    return false;
  }

  function coachTextHasTerms(value,terms){
    const tokens=coachKey(value).split("_").filter(Boolean);
    return (terms||[]).find(term=>term&&coachTermInTokens(tokens,term))||"";
  }

  // ── Helpers de fecha ────────────────────────────────────────────────────────
  const DOW=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const MON=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

  function ymd(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
  function parseYmd(s){const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);}
  function addDays(s,n){const d=parseYmd(s);d.setDate(d.getDate()+n);return ymd(d);}
  function todayStr(){return ymd(new Date());}
  function prettyDate(s){const d=parseYmd(s);return DOW[d.getDay()]+", "+d.getDate()+" "+MON[d.getMonth()];}
  function validYmd(s){return typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(parseYmd(s));}

  // ── Helpers de hash ─────────────────────────────────────────────────────────
  function hashText(text){
    let h=2166136261;
    for(let i=0;i<text.length;i++){
      h^=text.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return ("00000000"+(h>>>0).toString(16)).slice(-8);
  }

  function stableJson(value){
    if(Array.isArray(value))return `[${value.map(stableJson).join(",")}]`;
    if(value&&typeof value==="object")return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }

  // ── Validadores de configuración de perfil ──────────────────────────────────
  function validTrainingDays(value){
    const days=Number.parseInt(value,10);
    return Number.isInteger(days)&&days>=MIN_TRAINING_DAYS&&days<=MAX_TRAINING_DAYS;
  }
  function validPlanDuration(value){return PLAN_DURATION_OPTIONS.some(o=>o.value===Number(value));}
  function resolvedPlanDuration(prefs){
    const duration=Number.parseInt(prefs&&prefs.planDurationWeeks,10);
    return validPlanDuration(duration)?duration:10;
  }
  function normalizedList(value,allowed){
    const list=Array.isArray(value)?value:[];
    return [...new Set(list.filter(item=>allowed.includes(item)))];
  }
  function defaultTrainingDays(count){
    const defaults={3:[1,3,6],4:[1,3,5,6],5:[1,2,3,5,6],6:[1,2,3,4,5,6]};
    return (defaults[validTrainingDays(count)?+count:3]||defaults[3]).slice();
  }
  function normalizedTrainingDays(value,count){
    const valid=[...new Set((Array.isArray(value)?value:[]).map(Number).filter(day=>WEEKDAY_OPTIONS.some(o=>o.value===day)))];
    valid.sort((a,b)=>WEEKDAY_OPTIONS.findIndex(o=>o.value===a)-WEEKDAY_OPTIONS.findIndex(o=>o.value===b));
    return valid.length>=MIN_TRAINING_DAYS&&valid.length<=MAX_TRAINING_DAYS?valid:defaultTrainingDays(count);
  }
  function defaultMealTimes(count){
    const presets={
      2:["10:00","19:00"],
      3:["08:00","13:00","19:00"],
      4:["08:00","12:30","17:00","20:30"],
      5:["07:30","11:00","14:00","17:30","20:30"],
      6:["07:30","10:30","13:00","16:00","19:00","21:00"],
    };
    return (presets[count]||presets[4]).slice();
  }
  function validTime(value){return typeof value==="string"&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);}
  function detectedTimeZone(){
    try{return Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";}catch(e){return"UTC";}
  }
  function validTimeZone(value){
    if(typeof value!=="string"||!value.trim())return false;
    try{Intl.DateTimeFormat("en-US",{timeZone:value}).format();return true;}catch(e){return false;}
  }
  function normalizedMealTimes(value,count){
    const fallback=defaultMealTimes(count);
    const source=Array.isArray(value)?value:[];
    return fallback.map((time,index)=>validTime(source[index])?source[index]:time);
  }

  // ── Inferencia de configuración de entrenamiento ────────────────────────────
  function inferredTrainingPriority(p){
    if(TRAINING_PRIORITY_LABELS[p.trainingPriority])return p.trainingPriority;
    if(p.challenge==="performance")return "performance";
    if(p.challenge==="strength")return "strength";
    return p.goal==="mantenimiento"?"health":"composition";
  }
  function effectiveWorkoutSplit(experience,workoutSplit){
    if(experience==="advanced"){
      if(workoutSplit==="fullbody")return "fullbody";
      if(workoutSplit==="upperlower")return "upperlower";
      return "ppl";
    }
    if(experience==="intermediate")return "upperlower";
    return "fullbody";
  }
  function _fullBodyTemplate(days,priority){
    const base={3:["fullA","calidad","facil"],4:["fullA","calidad","fullB","facil"],5:["fullA","calidad","fullA","fullB","facil"],6:["fullA","calidad","fullB","facil","fullA","calidad"]};
    const strength={3:["fullA","fullB","facil"],4:["fullA","fullB","fullA","facil"],5:["fullA","fullB","fullA","fullB","facil"],6:["fullA","fullB","fullA","fullB","fullA","facil"]};
    const performance={3:["fullA","calidad","facil"],4:["fullA","tecnica","calidad","facil"],5:["fullA","tecnica","calidad","fullB","facil"],6:["fullA","tecnica","calidad","fullB","tecnica","facil"]};
    const t=priority==="strength"?strength:priority==="performance"?performance:base;
    return (t[days]||t[3]).slice();
  }
  function _upperLowerTemplate(days,priority){
    const base={3:["torsoA","piernaA","facil"],4:["torsoA","piernaA","torsoB","facil"],5:["torsoA","piernaA","calidad","torsoB","piernaB"],6:["torsoA","piernaA","calidad","torsoB","piernaB","facil"]};
    const strength={3:["torsoA","piernaA","torsoB"],4:["torsoA","piernaA","torsoB","piernaB"],5:["torsoA","piernaA","torsoB","piernaB","facil"],6:["torsoA","piernaA","torsoB","piernaB","torsoA","facil"]};
    const performance={3:["torsoA","calidad","piernaA"],4:["torsoA","piernaA","tecnica","calidad"],5:["torsoA","piernaA","tecnica","calidad","torsoB"],6:["torsoA","piernaA","tecnica","calidad","torsoB","piernaB"]};
    const t=priority==="strength"?strength:priority==="performance"?performance:base;
    return (t[days]||t[3]).slice();
  }
  function _pplTemplate(days,priority){
    const base={3:["pushA","pullA","legsA"],4:["pushA","pullA","legsA","calidad"],5:["pushA","pullA","legsA","pushB","calidad"],6:["pushA","pullA","legsA","pushB","pullB","legsB"]};
    const strength={3:["pushA","pullA","legsA"],4:["pushA","pullA","legsA","pushB"],5:["pushA","pullA","legsA","pushB","pullB"],6:["pushA","pullA","legsA","pushB","pullB","legsB"]};
    const performance={3:["pushA","calidad","legsA"],4:["pushA","pullA","calidad","facil"],5:["pushA","pullA","legsA","tecnica","calidad"],6:["pushA","pullA","legsA","tecnica","calidad","facil"]};
    const t=priority==="strength"?strength:priority==="performance"?performance:base;
    return (t[days]||t[3]).slice();
  }
  function baseWorkoutTemplate(days,priority,experience,workoutSplit){
    const split=effectiveWorkoutSplit(experience,workoutSplit);
    if(split==="ppl")return _pplTemplate(days,priority);
    if(split==="upperlower")return _upperLowerTemplate(days,priority);
    return _fullBodyTemplate(days,priority);
  }
  function defaultTrainingLocations(primary,strength,dayIds,priority,experience,workoutSplit){
    const sessions=baseWorkoutTemplate(dayIds.length,priority,experience,workoutSplit);
    return Object.fromEntries(dayIds.map((day,index)=>{
      const session=sessions[index];
      const location=STRENGTH_SESSION_IDS.has(session)?(strength==="bodyweight"?"home":"gym"):(primary==="swimming"?"pool":"outdoor");
      return [day,location];
    }));
  }

  // ── Cálculo de macros ───────────────────────────────────────────────────────
  function calculateMacroTargets(input){
    const kg=Number(input.weightKg),cm=Number(input.heightCm),age=Number(input.age);
    const bf=Number(input.bodyFatPct);
    const activity=ACTIVITY_LEVELS[input.activityLevel]||ACTIVITY_LEVELS.moderate;
    const hasBf=Number.isFinite(bf)&&bf>=3&&bf<=60;
    const leanKg=hasBf?kg*(1-bf/100):null;
    const bmr=hasBf
      ?370+21.6*leanKg
      :10*kg+6.25*cm-5*age+(input.sex==="female"?-161:5);
    const maintenance=Math.round(bmr*activity.factor/10)*10;
    const goalFactor=input.goal==="volumen"?1.1:input.goal==="mantenimiento"?1:.85;
    const kcal=Math.round(maintenance*goalFactor/10)*10;
    const proteinRate=input.goal==="deficit"?2:1.8;
    const p=Math.round((hasBf?Math.max(leanKg*2.2,kg*1.6):kg*proteinRate));
    const f=Math.round(Math.max(45,kg*.8));
    const c=Math.max(50,Math.round((kcal-p*4-f*9)/4));
    return {kcal,p,c,f,maintenance,bmr:Math.round(bmr),method:hasBf?"Katch-McArdle":"Mifflin-St Jeor"};
  }

  // ── Helpers de plan y calendario ───────────────────────────────────────────
  function planEndFor(start,duration){return addDays(start,(validPlanDuration(duration)?+duration:10)*7-1);}
  function buildCycleWeeks(start,duration){
    return CYCLE_MENUS.slice(0,duration).map((menu,i)=>({
      label:"S"+(i+1),
      start:addDays(start,i*7),
      end:addDays(start,i*7+6),
      menu,
      num:i+1,
      dietBreak:i===5,
    }));
  }
  function weekdayInWeek(week,weekday){
    for(let i=0;i<7;i++){const ds=addDays(week.start,i);if(parseYmd(ds).getDay()===weekday)return ds;}
    return week.end;
  }

  // ── Namespace del módulo ────────────────────────────────────────────────────
  const FITBUD_NUTRITION_PURE={
    // Constantes
    CYCLE_MENUS,PLAN_DURATION_OPTIONS,CHALLENGE_LABELS,MEAL_SLOT_TEMPLATES,BASE_SLOTS,
    SPORT_LABELS,STRENGTH_LABELS,PROFILE_SCHEMA_VERSION,PROFILE_REVIEW_DAYS,PROFILE_REVIEW_MS,
    MIN_TRAINING_DAYS,MAX_TRAINING_DAYS,WEEKDAY_OPTIONS,TRAINING_LOCATION_LABELS,
    TRAINING_PRIORITY_LABELS,TRAINING_EXPERIENCE_LABELS,WORKOUT_SPLIT_LABELS,TRAINING_TIME_LABELS,
    EQUIPMENT_LABELS,FOOD_BUDGET_LABELS,REPEAT_LABELS,CUISINE_LABELS,PREPARATION_LABELS,STRENGTH_SESSION_IDS,
    ACTIVITY_LEVELS,DOW,MON,
    // Coach
    coachCopy,coachKey,coachSplitTerms,coachTermInTokens,coachTextHasTerms,
    // Fecha
    ymd,parseYmd,addDays,todayStr,prettyDate,validYmd,
    // Hash
    hashText,stableJson,
    // Validación
    validTrainingDays,validPlanDuration,resolvedPlanDuration,normalizedList,
    defaultTrainingDays,normalizedTrainingDays,defaultMealTimes,validTime,
    detectedTimeZone,validTimeZone,normalizedMealTimes,
    // Entrenamiento
    inferredTrainingPriority,effectiveWorkoutSplit,baseWorkoutTemplate,defaultTrainingLocations,
    _fullBodyTemplate,_upperLowerTemplate,_pplTemplate,
    // Macros
    calculateMacroTargets,
    // Plan
    planEndFor,buildCycleWeeks,weekdayInWeek,
  };
  root.FITBUD_NUTRITION_PURE=FITBUD_NUTRITION_PURE;

  // Exponer cada símbolo como global individual para que index.html pueda usarlos
  // sin cambiar ningún call-site existente.
  root.CYCLE_MENUS=CYCLE_MENUS;
  root.PLAN_DURATION_OPTIONS=PLAN_DURATION_OPTIONS;
  root.CHALLENGE_LABELS=CHALLENGE_LABELS;
  root.MEAL_SLOT_TEMPLATES=MEAL_SLOT_TEMPLATES;
  root.BASE_SLOTS=BASE_SLOTS;
  root.SPORT_LABELS=SPORT_LABELS;
  root.STRENGTH_LABELS=STRENGTH_LABELS;
  root.PROFILE_SCHEMA_VERSION=PROFILE_SCHEMA_VERSION;
  root.PROFILE_REVIEW_DAYS=PROFILE_REVIEW_DAYS;
  root.PROFILE_REVIEW_MS=PROFILE_REVIEW_MS;
  root.MIN_TRAINING_DAYS=MIN_TRAINING_DAYS;
  root.MAX_TRAINING_DAYS=MAX_TRAINING_DAYS;
  root.WEEKDAY_OPTIONS=WEEKDAY_OPTIONS;
  root.TRAINING_LOCATION_LABELS=TRAINING_LOCATION_LABELS;
  root.TRAINING_PRIORITY_LABELS=TRAINING_PRIORITY_LABELS;
  root.TRAINING_EXPERIENCE_LABELS=TRAINING_EXPERIENCE_LABELS;
  root.WORKOUT_SPLIT_LABELS=WORKOUT_SPLIT_LABELS;
  root.TRAINING_TIME_LABELS=TRAINING_TIME_LABELS;
  root.EQUIPMENT_LABELS=EQUIPMENT_LABELS;
  root.FOOD_BUDGET_LABELS=FOOD_BUDGET_LABELS;
  root.REPEAT_LABELS=REPEAT_LABELS;
  root.CUISINE_LABELS=CUISINE_LABELS;
  root.PREPARATION_LABELS=PREPARATION_LABELS;
  root.STRENGTH_SESSION_IDS=STRENGTH_SESSION_IDS;
  root.ACTIVITY_LEVELS=ACTIVITY_LEVELS;
  root.DOW=DOW;
  root.MON=MON;
  root.coachCopy=coachCopy;
  root.coachKey=coachKey;
  root.coachSplitTerms=coachSplitTerms;
  root.coachTermInTokens=coachTermInTokens;
  root.coachTextHasTerms=coachTextHasTerms;
  root.ymd=ymd;
  root.parseYmd=parseYmd;
  root.addDays=addDays;
  root.todayStr=todayStr;
  root.prettyDate=prettyDate;
  root.validYmd=validYmd;
  root.hashText=hashText;
  root.stableJson=stableJson;
  root.validTrainingDays=validTrainingDays;
  root.validPlanDuration=validPlanDuration;
  root.resolvedPlanDuration=resolvedPlanDuration;
  root.normalizedList=normalizedList;
  root.defaultTrainingDays=defaultTrainingDays;
  root.normalizedTrainingDays=normalizedTrainingDays;
  root.defaultMealTimes=defaultMealTimes;
  root.validTime=validTime;
  root.detectedTimeZone=detectedTimeZone;
  root.validTimeZone=validTimeZone;
  root.normalizedMealTimes=normalizedMealTimes;
  root.inferredTrainingPriority=inferredTrainingPriority;
  root.effectiveWorkoutSplit=effectiveWorkoutSplit;
  root.baseWorkoutTemplate=baseWorkoutTemplate;
  root.defaultTrainingLocations=defaultTrainingLocations;
  root._fullBodyTemplate=_fullBodyTemplate;
  root._upperLowerTemplate=_upperLowerTemplate;
  root._pplTemplate=_pplTemplate;
  root.calculateMacroTargets=calculateMacroTargets;
  root.planEndFor=planEndFor;
  root.buildCycleWeeks=buildCycleWeeks;
  root.weekdayInWeek=weekdayInWeek;

})(typeof window!=="undefined"?window:globalThis);
