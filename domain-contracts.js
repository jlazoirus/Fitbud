// Contratos de dominio de Fitbros — validadores puramente funcionales sin deps de DOM.
// Cada validador devuelve {ok:boolean, errors:string[]}.
// Importable en Node (scripts de prueba) y en el navegador como window.FITBUD_DOMAIN_CONTRACTS.
(function(root){
  "use strict";

  const VALID_SPORTS=new Set(["walking","running","cycling","swimming","other","strength_only"]);
  const VALID_STRENGTH=new Set(["gym","bodyweight","none"]);
  const VALID_EXPERIENCES=new Set(["beginner","intermediate","advanced"]);
  const VALID_PRIORITIES=new Set(["composition","performance","strength","health"]);
  const VALID_SPLITS=new Set(["fullbody","upperlower","ppl"]);
  const VALID_ENTITLEMENT_STATUSES=new Set(["active","expired","courtesy","revoked"]);
  const VALID_SYNC_ENTITIES=new Set(["day_log","weight_log"]);
  const VALID_SYNC_STATUSES=new Set(["pending","failed","conflict"]);
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
    if(!VALID_SPORTS.has(prefs.primarySport))errors.push("primarySport debe ser una disciplina válida (walking, running, cycling, swimming, other, strength_only).");
    if(!VALID_STRENGTH.has(prefs.strengthMode))errors.push("strengthMode debe ser gym, bodyweight o none.");
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
    if(prefs.workoutSplit&&(!VALID_SPLITS.has(prefs.workoutSplit)||prefs.trainingExperience!=="advanced"))errors.push("workoutSplit solo es válido para usuarios advanced y debe ser fullbody, upperlower o ppl.");
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
    if(!VALID_SYNC_STATUSES.has(entry.status))errors.push("status debe ser pending, failed o conflict.");
    if(entry.clientId!==undefined&&typeof entry.clientId!=="string")errors.push("clientId debe ser string cuando existe.");
    if(entry.baseRemoteUpdatedAt!==undefined&&entry.baseRemoteUpdatedAt!==null&&!ISO_RE.test(entry.baseRemoteUpdatedAt))errors.push("baseRemoteUpdatedAt debe ser ISO 8601 o null.");
    if(entry.basePayload!==undefined&&entry.basePayload!==null&&(typeof entry.basePayload!=="object"||Array.isArray(entry.basePayload)))errors.push("basePayload debe ser objeto o null.");
    if(entry.conflict!==undefined&&entry.conflict!==null&&(typeof entry.conflict!=="object"||Array.isArray(entry.conflict)))errors.push("conflict debe ser objeto o null.");
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

  // ── Validador de snapshot nutritionPlan (plan_versions.snapshot.nutritionPlan) ──
  // Verifica que el snapshot sea structuralmente completo y coherente.
  // Puede usarse en el navegador y en scripts de prueba sin dependencias externas.
  function validateNutritionPlanSnapshot(nutritionPlan){
    const errors=[];
    if(!nutritionPlan||typeof nutritionPlan!=="object")return ok(["nutritionPlan debe ser un objeto."]);
    if(!Array.isArray(nutritionPlan.days)||!nutritionPlan.days.length)
      errors.push("nutritionPlan.days debe ser un array no vacío.");
    (nutritionPlan.days||[]).forEach((day,di)=>{
      if(!day.date||!DATE_RE.test(String(day.date)))
        errors.push(`día ${di}: date debe ser YYYY-MM-DD.`);
      if(!day.target||typeof day.target!=="object")
        errors.push(`día ${di}: target debe ser un objeto {kcal,p,c,f}.`);
      if(!Array.isArray(day.meals)||!day.meals.length)
        errors.push(`día ${di}: meals debe ser un array no vacío.`);
      (day.meals||[]).forEach((m,mi)=>{
        if(!m.slot&&!m.id)errors.push(`día ${di} comida ${mi}: slot/id requerido.`);
        if(!m.dishName&&!m.dishSlug)errors.push(`día ${di} comida ${mi}: requiere dishName o dishSlug materializados.`);
        const mac=m.macros;
        if(!mac||typeof mac!=="object")errors.push(`día ${di} comida ${mi}: macros requeridos.`);
        else{
          ["kcal","p","c","f"].forEach(k=>{
            if(!Number.isFinite(Number(mac[k]))||Number(mac[k])<0)
              errors.push(`día ${di} comida ${mi}: macros.${k} inválido.`);
          });
        }
        if(!Array.isArray(m.ingredients)||!m.ingredients.length)
          errors.push(`día ${di} comida ${mi}: ingredients debe ser un array con al menos 1 elemento.`);
        (m.ingredients||[]).forEach((ing,ii)=>{
          if(!ing.name)errors.push(`día ${di} comida ${mi} ingrediente ${ii}: name requerido.`);
          if(!(Number(ing.grams)>0))errors.push(`día ${di} comida ${mi} ingrediente ${ii}: grams debe ser > 0.`);
        });
      });
      // Verificar que totales de comidas sumen dentro de ±15% del target.kcal
      if(day.target&&Number.isFinite(Number(day.target.kcal))&&Number(day.target.kcal)>0){
        const sumKcal=(day.meals||[]).reduce((s,m)=>s+Number((m.macros&&m.macros.kcal)||0),0);
        const pct=Math.abs(sumKcal-Number(day.target.kcal))/Number(day.target.kcal);
        if(pct>0.20)errors.push(`día ${di}: suma de kcal ${Math.round(sumKcal)} fuera de tolerancia 20% de meta ${day.target.kcal}.`);
      }
    });
    // Verificar lista de compras si está presente
    if(nutritionPlan.shoppingList!==undefined){
      if(!Array.isArray(nutritionPlan.shoppingList))
        errors.push("shoppingList debe ser un array si está presente.");
      else{
        // Construir suma manual de gramos por slug desde los días
        const slugTotals=new Map();
        (nutritionPlan.days||[]).forEach(day=>{
          (day.meals||[]).forEach(m=>{
            (m.ingredients||[]).forEach(ing=>{
              const key=(ing.ingredientSlug||"").trim()||(ing.name||"").toLowerCase().replace(/[^a-z0-9]+/g,"-");
              if(!key)return;
              slugTotals.set(key,(slugTotals.get(key)||0)+Math.round(Number(ing.grams||0)));
            });
          });
        });
        nutritionPlan.shoppingList.forEach((item,si)=>{
          if(!item.slug&&!item.nombre)errors.push(`shoppingList[${si}]: requiere slug o nombre.`);
          if(!(Number(item.gramos)>0))errors.push(`shoppingList[${si}]: gramos debe ser > 0.`);
        });
        // Verificar que no haya duplicados por slug
        const listSlugs=nutritionPlan.shoppingList.filter(i=>i.slug).map(i=>i.slug);
        const unique=new Set(listSlugs);
        if(unique.size!==listSlugs.length)errors.push("shoppingList contiene slugs duplicados.");
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
    validateNutritionPlanSnapshot,
    VALID_SPLITS,
  };
})(typeof window!=="undefined"?window:globalThis);
