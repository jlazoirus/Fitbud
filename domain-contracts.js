// Contratos de dominio de Fitbros — validadores puramente funcionales sin deps de DOM.
// Cada validador devuelve {ok:boolean, errors:string[]}.
// Importable en Node (scripts de prueba) y en el navegador como window.FITBUD_DOMAIN_CONTRACTS.
(function(root){
  "use strict";

  const VALID_SPORTS=new Set(["running","cycling","swimming"]);
  const VALID_STRENGTH=new Set(["gym","bodyweight"]);
  const VALID_EXPERIENCES=new Set(["beginner","intermediate","advanced"]);
  const VALID_PRIORITIES=new Set(["composition","performance","strength","health"]);
  const VALID_ENTITLEMENT_STATUSES=new Set(["active","expired","courtesy","revoked"]);
  const VALID_SYNC_ENTITIES=new Set(["day_log","weight_log"]);
  const VALID_SYNC_STATUSES=new Set(["pending","failed"]);
  const VALID_COACH_ACTION_TYPES=new Set(["marcar_descanso","registrar_comida","cambiar_plato","adaptar_entreno","registrar_peso"]);
  const VALID_COACH_WORKOUT_REASONS=new Set(["tiempo","casa","equipo","sesion_perdida"]);
  const TIME_RE=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const ISO_RE=/^\d{4}-\d{2}-\d{2}T/;
  const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
  const VALID_WEEKDAYS=new Set([0,1,2,3,4,5,6]);

  function ok(errors){return{ok:errors.length===0,errors};}

  // Macros diarios del usuario: {kcal,p,c,f} en números positivos.
  // La suma de macros * factores debe coincidir con kcal dentro de ±100.
  function validateMacroTargets(t){
    const errors=[];
    if(!t||typeof t!=="object")return ok(["Las metas de macros deben ser un objeto."]);
    const kcal=Number(t.kcal),p=Number(t.p),c=Number(t.c),f=Number(t.f);
    if(!Number.isFinite(kcal)||kcal<500||kcal>6000)errors.push("kcal fuera de rango (500-6000).");
    if(!Number.isFinite(p)||p<30||p>600)errors.push("Proteína (p) fuera de rango (30-600 g).");
    if(!Number.isFinite(c)||c<0||c>800)errors.push("Carbohidratos (c) fuera de rango (0-800 g).");
    if(!Number.isFinite(f)||f<10||f>400)errors.push("Grasas (f) fuera de rango (10-400 g).");
    if(errors.length===0){
      const computed=p*4+c*4+f*9;
      if(Math.abs(computed-kcal)>150)errors.push("Los macros suman "+Math.round(computed)+" kcal pero se declararon "+Math.round(kcal)+" kcal (diferencia >150).");
    }
    return ok(errors);
  }

  // Perfil de usuario migrado (profiles.prefs schema v3).
  // Valida los campos que el coach y los generadores exigen como estructurados.
  function validateProfilePrefs(prefs){
    const errors=[];
    if(!prefs||typeof prefs!=="object")return ok(["El perfil debe ser un objeto."]);
    if(!VALID_SPORTS.has(prefs.primarySport))errors.push("primarySport debe ser running, cycling o swimming.");
    if(!VALID_STRENGTH.has(prefs.strengthMode))errors.push("strengthMode debe ser gym o bodyweight.");
    const days=Array.isArray(prefs.trainingDays)?prefs.trainingDays:[];
    if(days.length<1||days.length>6)errors.push("trainingDays debe tener entre 1 y 6 elementos.");
    else if(days.some(d=>!VALID_WEEKDAYS.has(Number(d))))errors.push("trainingDays contiene días inválidos (0-6).");
    const sm=Number(prefs.sessionMinutes);
    if(!Number.isFinite(sm)||sm<20||sm>180)errors.push("sessionMinutes fuera de rango (20-180).");
    const mc=Number(prefs.mealCount);
    if(!Number.isInteger(mc)||mc<2||mc>6)errors.push("mealCount fuera de rango (2-6).");
    const mt=Array.isArray(prefs.mealTimes)?prefs.mealTimes:[];
    if(mt.length!==mc)errors.push("mealTimes debe tener exactamente mealCount entradas.");
    else if(mt.some(t=>!TIME_RE.test(t)))errors.push("mealTimes contiene horas inválidas (HH:MM).");
    if(prefs.eatingWindowStart&&!TIME_RE.test(prefs.eatingWindowStart))errors.push("eatingWindowStart inválido.");
    if(prefs.eatingWindowEnd&&!TIME_RE.test(prefs.eatingWindowEnd))errors.push("eatingWindowEnd inválido.");
    if(!VALID_EXPERIENCES.has(prefs.trainingExperience))errors.push("trainingExperience debe ser beginner, intermediate o advanced.");
    if(prefs.trainingPriority&&!VALID_PRIORITIES.has(prefs.trainingPriority))errors.push("trainingPriority inválido.");
    if(!Array.isArray(prefs.equipment))errors.push("equipment debe ser un array.");
    const age=Number(prefs.age);
    if(Number.isFinite(age)&&age<18)errors.push("Edad mínima 18 años.");
    return ok(errors);
  }

  // Estado de un día en day_log.state (meals, extras, workoutDone, etc.).
  function validateDayLogState(state){
    const errors=[];
    if(!state||typeof state!=="object")return ok(["El estado del día debe ser un objeto."]);
    if(typeof state.workoutDone!=="boolean")errors.push("workoutDone debe ser boolean.");
    if(!state.meals||typeof state.meals!=="object"||Array.isArray(state.meals))errors.push("meals debe ser un objeto plano.");
    if(!Array.isArray(state.extras))errors.push("extras debe ser un array.");
    if(state.contingencyLog!==undefined&&!Array.isArray(state.contingencyLog))errors.push("contingencyLog debe ser un array.");
    return ok(errors);
  }

  // Entitlement activo devuelto por /api/entitlement.
  function validateEntitlement(ent){
    const errors=[];
    if(!ent||typeof ent!=="object")return ok(["El entitlement debe ser un objeto."]);
    if(!ent.plan_id)errors.push("plan_id requerido.");
    if(!VALID_ENTITLEMENT_STATUSES.has(ent.status))errors.push("status debe ser active, expired, courtesy o revoked.");
    if(!ent.starts_at||!ISO_RE.test(ent.starts_at))errors.push("starts_at debe ser ISO 8601.");
    if(!ent.expires_at||!ISO_RE.test(ent.expires_at))errors.push("expires_at debe ser ISO 8601.");
    if(ent.starts_at&&ent.expires_at&&new Date(ent.starts_at)>=new Date(ent.expires_at))errors.push("starts_at debe ser anterior a expires_at.");
    return ok(errors);
  }

  // Entrada de la cola de sincronización offline (fitbud_syncq_v1).
  function validateSyncEntry(entry){
    const errors=[];
    if(!entry||typeof entry!=="object")return ok(["La entrada de cola debe ser un objeto."]);
    if(!entry.id||typeof entry.id!=="string")errors.push("id requerido (string).");
    if(!entry.uid||typeof entry.uid!=="string")errors.push("uid requerido (string).");
    if(!VALID_SYNC_ENTITIES.has(entry.entity))errors.push("entity debe ser day_log o weight_log.");
    if(!entry.entityKey||typeof entry.entityKey!=="string")errors.push("entityKey requerido (string).");
    if(!entry.payload||typeof entry.payload!=="object"||Array.isArray(entry.payload))errors.push("payload debe ser un objeto plano.");
    if(!entry.ts||!ISO_RE.test(entry.ts))errors.push("ts debe ser ISO 8601.");
    if(!Number.isInteger(entry.retries)||entry.retries<0)errors.push("retries debe ser entero >= 0.");
    if(!VALID_SYNC_STATUSES.has(entry.status))errors.push("status debe ser pending o failed.");
    return ok(errors);
  }

  // Solicitud al proxy del coach (/api/claude): acción, requestId y maxTokens.
  function validateCoachRequest(req){
    const errors=[];
    if(!req||typeof req!=="object")return ok(["La solicitud al coach debe ser un objeto."]);
    if(!req.action||typeof req.action!=="string"||!req.action.trim())errors.push("action requerida (string no vacía).");
    if(!req.requestId||typeof req.requestId!=="string"||!req.requestId.trim())errors.push("requestId requerido (string no vacío).");
    const max=Number(req.maxTokens);
    if(!Number.isFinite(max)||max<1||max>16000)errors.push("maxTokens fuera de rango (1-16000).");
    if(req.context!==undefined&&(typeof req.context!=="object"||req.context===null))errors.push("context debe ser un objeto.");
    return ok(errors);
  }

  // Acción ejecutable propuesta por el coach conversacional.
  // La UI vuelve a validarla contra el estado real antes de mostrar/aplicar.
  function validateCoachAction(action){
    const errors=[];
    if(!action||typeof action!=="object"||Array.isArray(action))return ok(["La acción del coach debe ser un objeto."]);
    const tipo=String(action.tipo||"").trim();
    if(!VALID_COACH_ACTION_TYPES.has(tipo))errors.push("tipo de acción no permitido.");
    if(action.descripcion!==undefined&&typeof action.descripcion!=="string")errors.push("descripcion debe ser string.");
    if(action.ds!==undefined&&!DATE_RE.test(String(action.ds)))errors.push("ds debe ser YYYY-MM-DD.");
    if(tipo==="registrar_comida"||tipo==="cambiar_plato"){
      if(typeof action.slot!=="string"||!action.slot.trim())errors.push("slot requerido para acciones de comida.");
    }
    if(tipo==="cambiar_plato"){
      if(typeof action.dishName!=="string"||!action.dishName.trim())errors.push("dishName requerido para cambiar plato.");
    }
    if(tipo==="adaptar_entreno"){
      if(!VALID_COACH_WORKOUT_REASONS.has(String(action.reason||"")))errors.push("reason de entrenamiento no permitido.");
    }
    if(tipo==="registrar_peso"){
      const kg=Number(action.kg);
      if(!Number.isFinite(kg)||kg<30||kg>300)errors.push("kg fuera de rango (30-300).");
      if(action.bf_pct!==undefined&&action.bf_pct!==null&&action.bf_pct!==""){
        const bf=Number(action.bf_pct);
        if(!Number.isFinite(bf)||bf<3||bf>70)errors.push("bf_pct fuera de rango (3-70).");
      }
    }
    return ok(errors);
  }

  root.FITBUD_DOMAIN_CONTRACTS={
    validateProfilePrefs,
    validateMacroTargets,
    validateDayLogState,
    validateEntitlement,
    validateSyncEntry,
    validateCoachRequest,
    validateCoachAction,
  };
})(typeof window!=="undefined"?window:globalThis);
