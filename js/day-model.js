// shared-module
// NAT-03 — modelo de día compartido por web y nativo, sin estado ni APIs web.
(function(root){
  "use strict";

  // Normalización sin escritura. Se conservan referencias de comidas/extras;
  // la persistencia y la identidad del contenedor corresponden al adaptador.
  function dayState(value){
    if(!value)return{meals:{},extras:[],workoutDone:false};
    return Object.assign({},value,{meals:value.meals||{},extras:value.extras||[]});
  }

  // El calendario resuelve estos datos antes de entrar al modelo (NAT-04).
  // target es la meta ACTUAL, no la de la versión histórica del plan (REQ-69).
  function buildDay(input){
    const {ds,weekday,week,slots,nutritionDay,target,workout,planVersionId}=input;
    const emptySlot=s=>({id:s.id,slot:s.slot,time:s.time,kcal:0,p:0,c:0,f:0,name:"",dishName:null});
    let meals;
    if(nutritionDay&&Array.isArray(nutritionDay.meals)&&nutritionDay.meals.length){
      meals=nutritionDay.meals.map(m=>{
        const meta=slots.find(s=>s.id===(m.slot||m.id))||{};
        return{
          id:m.slot||m.id,slot:m.slot||m.id,time:meta.time||null,
          kcal:(m.macros&&m.macros.kcal)||0,p:(m.macros&&m.macros.p)||0,
          c:(m.macros&&m.macros.c)||0,f:(m.macros&&m.macros.f)||0,
          name:m.dishName||"",dishName:m.dishName||null,dishSlug:m.dishSlug||null,
          ingredientes:(m.ingredients||[]).map(i=>({
            nombre:i.name,gramos:i.grams,ingredientSlug:i.ingredientSlug||null,
            kcal:i.kcal||0,proteina_g:i.protein_g||0,carbohidratos_g:i.carbs_g||0,grasa_g:i.fat_g||0,
          })),src:"nutritionPlan",
        };
      });
      // Una semana parcial conserva sus franjas vacías para registrar/reintentar.
      slots.forEach(s=>{if(!meals.some(m=>m.id===s.id))meals.push(emptySlot(s));});
    }else{
      meals=slots.map(emptySlot);
    }
    return{ds,wd:weekday,type:null,week,target,meals,workout,planVersionId:planVersionId||null};
  }

  // catalog inyecta loaded, dishByName(name) y dishMacros(id), resolutores puros.
  function mealValue(base,ms,catalog){
    if(ms&&ms.menuUnavailable&&!ms.done)return{name:"",kcal:0,p:0,c:0,f:0,src:"unavailable"};
    const o=ms&&ms.ovr;
    const name=o&&o.name!=null?o.name:base.name;
    if(o&&o.kcal!=null&&o.dishName==null){
      return Object.assign({name,kcal:+o.kcal||0,p:+o.p||0,c:+o.c||0,f:+o.f||0,src:"custom"},o.macrosUnknown?{macrosUnknown:true}:{});
    }
    // REQ-154: el reemplazo ya guarda macros de la porción escalada.
    if(o&&o.gen&&o.dishName!=null&&o.kcal!=null){
      return{name,kcal:+o.kcal||0,p:+o.p||0,c:+o.c||0,f:+o.f||0,src:"replacement"};
    }
    // REQ-162: el snapshot escalado gana a la receta base del catálogo.
    if((!o||o.dishName==null)&&base.src==="nutritionPlan"&&base.kcal>0){
      return{name:base.name||name,kcal:base.kcal,p:base.p,c:base.c,f:base.f,src:"nutritionPlan"};
    }
    const dn=o&&o.dishName!=null?o.dishName:base.dishName;
    if(dn&&catalog.loaded){
      const d=catalog.dishByName(dn);
      if(d){const m=catalog.dishMacros(d.id);return{name,kcal:m.kcal,p:m.p,c:m.c,f:m.f,src:"db"};}
    }
    return{name,kcal:base.kcal,p:base.p,c:base.c,f:base.f,src:"plan"};
  }

  // REQ-161: un slot sin nombre ni macros no cuenta como comida cumplida.
  function mealHasContent(v){return!!(v&&(v.name||v.kcal||v.p||v.c||v.f));}

  function dayTotals(day,state,catalog){
    const st=dayState(state);
    const skippedCount=day.meals.filter(b=>st.meals[b.id]&&st.meals[b.id].skipped).length;
    let t={kcal:0,p:0,c:0,f:0},doneMeals=0,totMeals=day.meals.length-skippedCount+st.extras.length,partial=0;
    day.meals.forEach(b=>{
      const ms=st.meals[b.id];
      if(ms&&ms.done){
        const v=mealValue(b,ms,catalog);
        if(mealHasContent(v)){t.kcal+=v.kcal;t.p+=v.p;t.c+=v.c;t.f+=v.f;doneMeals++;if(v.macrosUnknown)partial++;}
      }
    });
    st.extras.forEach(e=>{if(e.done){t.kcal+=+e.kcal||0;t.p+=+e.p||0;t.c+=+e.c||0;t.f+=+e.f||0;doneMeals++;if(e.macrosUnknown)partial++;}});
    // REQ-269/271: sumar con precisión guardada; redondear solo al final.
    t={kcal:Math.round(t.kcal),p:Math.round(t.p),c:Math.round(t.c),f:Math.round(t.f)};
    return{t,doneMeals,totMeals,target:day.target,partial};
  }

  root.FITBUD_DAY_MODEL={dayState,buildDay,mealValue,mealHasContent,dayTotals};
})(typeof window!=="undefined"?window:globalThis);
