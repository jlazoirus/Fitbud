// shared-module
// REQ-390: private progressive preferences. Pure state transitions, no analytics values.
(function(root){
  'use strict';
  const questions=[
    {key:'activityLevel',title:'En un día normal, ¿cuánto te mueves?',choices:[['light','Paso mucho tiempo sentado y camino poco'],['moderate','Me muevo bastante durante el día'],['high','Tengo trabajo físico o mucha actividad diaria']]},
    {key:'dislikedIngredients',title:'¿Qué ingredientes prefieres evitar?',placeholder:'Ej. aceitunas, tofu…',empty:'No quiero excluir ninguno'},
    {key:'preferredIngredients',title:'¿Qué ingredientes te gusta comer?',placeholder:'Ej. avena, lentejas, pollo…',empty:'No tengo favoritos'},
    {key:'preferredDishes',title:'¿Tienes algún plato favorito?',placeholder:'Ej. arroz con pollo…',empty:'No tengo un plato favorito'},
    {key:'cookingLevel',title:'¿Cuánto sueles cocinar?',choices:[['none','No cocino'],['basic','Lo básico'],['cook','Me gusta cocinar']]},
    {key:'mealCount',title:'¿Cuántas comidas te van bien al día?',choices:[2,3,4,5,6].map(n=>[String(n),String(n)+' comidas'])},
    {key:'mealTimes',title:'¿Te van bien estos horarios de comida?',placeholder:'08:00, 13:00, 17:00, 20:00',hint:'Puedes ajustarlos, separados por comas.'},
    {key:'trainingExperience',title:'¿Qué experiencia tienes entrenando?',choices:[['beginner','Estoy empezando'],['intermediate','Entreno con regularidad'],['advanced','Tengo experiencia avanzada']]},
    {key:'sessionMinutes',title:'¿Cuántos minutos tienes para entrenar?',type:'number',min:20,max:180},
    {key:'limitations',title:'¿Hay molestias o limitaciones que debamos considerar?',placeholder:'Lo que necesitemos tener en cuenta',empty:'No tengo molestias ni limitaciones'},
    {key:'bodyFatPct',title:'¿Conoces tu porcentaje de grasa corporal?',type:'number',min:3,max:60,empty:'No lo sé'},
  ];
  const keys=questions.map(q=>q.key),validDay=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''));
  const plusDays=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  function state(prefs){
    const p=prefs&&prefs.profileQuestions||{};
    return {...p,answered:[...new Set((Array.isArray(p.answered)?p.answered:[]).filter(k=>keys.includes(k)))],skips:Object.fromEntries(keys.map(k=>[k,Math.min(2,Math.max(0,Number(p.skips&&p.skips[k])||0))]))};
  }
  function complete(s){return keys.every(k=>s.answered.includes(k));}
  function next(prefs,manual){const s=state(prefs);return questions.find(q=>!s.answered.includes(q.key)&&s.skips[q.key]<2)||(manual?questions.find(q=>!s.answered.includes(q.key)):null)||null;}
  function eligible(prefs,today,manual){
    const s=state(prefs);
    return !!next(prefs,manual)&&s.lastAskedOn!==today&&s.blockedOn!==today&&(!validDay(s.nextEligibleOn)||s.nextEligibleOn<=today);
  }
  function claim(prefs,today,manual){
    if(!eligible(prefs,today,manual))return null;
    const q=next(prefs,manual),s={...state(prefs),lastAskedOn:today,lastQuestion:q.key,status:'open'};
    return {...prefs,profileQuestions:s};
  }
  function skip(prefs,key,today){
    const s=state(prefs);if(s.lastQuestion!==key||s.lastAskedOn!==today||s.status!=='open')return null;
    return {...prefs,profileQuestions:{...s,status:'skipped',skips:{...s.skips,[key]:Math.min(2,s.skips[key]+1)},nextEligibleOn:plusDays(today,3)}};
  }
  function answer(prefs,key,value,ctx){
    const q=questions.find(q=>q.key===key),s=state(prefs);
    if(!q||s.lastQuestion!==key||s.lastAskedOn!==ctx.today||s.status!=='open')return {error:'Esta pregunta ya no está pendiente.'};
    const p={...prefs};
    if(q.choices){if(!q.choices.some(([v])=>v===String(value)))return {error:'Elige una opción.'};p[key]=key==='mealCount'?Number(value):String(value);}
    else if(key==='mealTimes'){
      const times=String(value||'').split(',').map(v=>v.trim());
      if(times.length!==Number(p.mealCount)||times.some(v=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))||times.some((v,i)=>i>0&&v<=times[i-1]))return {error:'Escribe un horario HH:MM por comida, ordenado y separado por comas.'};
      p.mealTimes=times;p.eatingWindowStart=times[0];p.eatingWindowEnd=times.at(-1);
    }else if(q.type==='number'){
      if(key==='bodyFatPct'&&String(value).trim()==='')p[key]=null;
      else{const n=Number(value);if(String(value).trim()===''||!Number.isFinite(n)||n<q.min||n>q.max)return {error:`Escribe un valor entre ${q.min} y ${q.max}.`};p[key]=n;}
    }else p[key]=String(value||'').trim().slice(0,400);
    if(key==='dislikedIngredients')p.avoid=[p.allergies,p.dislikedIngredients].filter(Boolean).join(', ');
    if(key==='mealCount'){
      p.mealTimes=ctx.defaultMealTimes(p.mealCount);p.mainMealIndex=Math.min(p.mealCount,p.mainMealIndex||2);p.eatingWindowStart=p.mealTimes[0];p.eatingWindowEnd=p.mealTimes.at(-1);
    }
    if(['activityLevel','bodyFatPct'].includes(key)){
      const t=ctx.calculateMacroTargets(p),old=ctx.currentTargets;
      p.calorieTarget=t.kcal;p.proteinTarget=t.p;p.carbTarget=t.c;p.fatTarget=t.f;p.maintenanceCalories=t.maintenance;p.macroMethod=t.method;
      p.macroTargetsValidFrom=plusDays(ctx.today,1);p.previousMacroTargets={calorieTarget:old.kcal,proteinTarget:old.p,carbTarget:old.c,fatTarget:old.f};
    }
    const answered=[...new Set([...s.answered,key])];p.profileQuestions={...s,answered,status:'answered',nextEligibleOn:plusDays(ctx.today,1)};
    if(complete(p.profileQuestions))p.profileRefinedAt=ctx.now;
    return {prefs:p};
  }
  root.FITBUD_PROFILE_QUESTIONS=Object.freeze({questions,keys,state,next,eligible,claim,skip,answer,complete});
})(globalThis);
