// Módulo puro de dominio nutricional de Fitbros — autoridad local para targets,
// macros de recetas, restricciones dietarias, slots y tolerancias de validación.
// Sin DOM ni estado global. Requiere js/nutrition-pure.js cargado antes.
// Compatible con navegador (<script src="js/nutrition-domain.js">) y Node.js
// (primero import "../js/nutrition-pure.js", luego este módulo).
(function(root){
  "use strict";

  // ── Vocabulario canónico de slots de comida ─────────────────────────────────
  const MEAL_SLOT_VOCAB=new Set(["desayuno","media_manana","almuerzo","merienda","snack","cena","recena"]);

  // ── Tolerancias explícitas por nivel ────────────────────────────────────────
  // TARGET_KCAL_DELTA : targets calculados (calculateMacroTargets) — garantía post-REQ-77.
  // DAY_KCAL_PCT      : día completo generado — suma de comidas vs. meta.
  // DAY_PROTEIN_MIN   : proteína mínima — >= DAY_PROTEIN_MIN_PCT * target.p.
  // DAY_CARB_PCT      : carbohidratos del día — solo advertencia, no bloqueo.
  // SLOT_KCAL_PCT     : slot individual — tolerancia amplia para facilitar sustitución.
  // REPLACEMENT_KCAL  : reemplazo de un plato — dentro de este margen es rebalanceable
  //                     sin advertir al usuario; fuera conviene notificar.
  const NUTRITION_TOLERANCES={
    TARGET_KCAL_DELTA:10,
    DAY_KCAL_PCT:0.15,
    DAY_PROTEIN_MIN_PCT:0.85,
    DAY_CARB_PCT:0.30,
    SLOT_KCAL_PCT:0.25,
    REPLACEMENT_KCAL_PCT:0.20,
  };

  // ── kcal derivadas de macros ────────────────────────────────────────────────
  function kcalFromMacros(p,c,f){return Math.round(p*4+c*4+f*9);}

  // ── Macros de receta desde ingredientes + gramos ────────────────────────────
  // lines   : [{ingredient_id, grams}]
  // ingMap  : {[id]: {kcal, protein_g, carbs_g, fat_g}}
  // kcal se toma del ingrediente directamente, no derivado de 4/4/9, para
  // respetar valores de base de datos que incluyen fibra, alcohol u otros.
  function macrosFromIngredientMap(lines,ingMap){
    let kcal=0,p=0,c=0,f=0;
    (lines||[]).forEach(l=>{
      const ing=ingMap&&ingMap[+l.ingredient_id];
      if(!ing||l.grams==null)return;
      const g=+l.grams/100;
      kcal+=(ing.kcal||0)*g;
      p+=(ing.protein_g||0)*g;
      c+=(ing.carbs_g||0)*g;
      f+=(ing.fat_g||0)*g;
    });
    return{kcal:Math.round(kcal),p:Math.round(p),c:Math.round(c),f:Math.round(f)};
  }

  // ── Slots de comida para un conteo dado ────────────────────────────────────
  // Pura: no requiere prefs completo, solo el número de comidas (2-6).
  // Depende de MEAL_SLOT_TEMPLATES expuesto por nutrition-pure.js.
  function mealSlotsForCount(count){
    const templates=root.MEAL_SLOT_TEMPLATES;
    if(!templates)throw new Error("nutrition-pure.js debe cargarse antes de nutrition-domain.js");
    const tpl=templates[+count]||templates[4];
    return tpl.map(([id,slot])=>({id,slot}));
  }

  // ── Términos de restricción del perfil ─────────────────────────────────────
  // Pura: toma prefs (objeto), no depende de la variable global `profile`.
  // Equivalente a coachHardRestrictions() de index.html.
  function allergyTermsForProfile(prefs){
    const p=prefs||{};
    const terms=String(p.allergies||"").split(/[,;]/).map(x=>x.trim()).filter(Boolean);
    const diet=Array.isArray(p.diet)?p.diet:[];
    if(diet.includes("sin_huevo")||diet.includes("vegano"))
      terms.push("huevo","clara de huevo","yema");
    if(diet.includes("vegano"))
      terms.push("queso","yogur","yogurt","parmesano","leche evaporada","lácteo","lacteo");
    if(diet.includes("vegetariano")||diet.includes("vegano"))
      terms.push("carne","pollo","pavo","cerdo","ternera","res","jamón","chorizo","tocino",
        "pescado","atún","salmón","trucha","merluza","gamba","langostino","camarón",
        "marisco","calamar","pulpo","anchoa","sardina");
    return[...new Set(terms.map(x=>x.toLowerCase()))];
  }

  // ── Matcher de restricción sobre texto libre ────────────────────────────────
  // Usa coachTextHasTerms de nutrition-pure.js para evitar falsos positivos
  // como "pollo" en "repollo" (matcher de palabra completa, REQ-66).
  // Devuelve el término que dispara el bloqueo, o "" si no hay conflicto.
  function foodTextViolatesTerms(text,terms){
    if(!text||!terms||!terms.length)return"";
    const fn=root.coachTextHasTerms;
    if(fn)return fn(text,terms);
    // Fallback si nutrition-pure.js no está cargado: substring (sin garantía de falsos positivos)
    return terms.find(t=>String(text).toLowerCase().includes(t))||"";
  }

  // ── Validadores ─────────────────────────────────────────────────────────────
  function ok(errors){return{ok:errors.length===0,errors};}

  // Target de usuario: invariante post-REQ-77.
  // |kcal - (p*4+c*4+f*9)| <= TARGET_KCAL_DELTA
  function validateTargetConsistency(t){
    const errors=[];
    if(!t||typeof t!=="object")return ok(["targets debe ser un objeto."]);
    const kcal=Number(t.kcal),p=Number(t.p),c=Number(t.c),f=Number(t.f);
    if(!Number.isFinite(kcal)||!Number.isFinite(p)||!Number.isFinite(c)||!Number.isFinite(f))
      return ok(["kcal, p, c, f deben ser números finitos."]);
    const sum=p*4+c*4+f*9;
    const delta=Math.abs(kcal-sum);
    if(delta>NUTRITION_TOLERANCES.TARGET_KCAL_DELTA)
      errors.push("|kcal("+kcal+")-suma_macros("+sum+")| = "+delta+" > "+NUTRITION_TOLERANCES.TARGET_KCAL_DELTA);
    return ok(errors);
  }

  // Día completo: suma de comidas vs. target diario.
  // errors = bloqueo; warns = sugerencia de ajuste.
  function validateDayTotals(totals,target){
    const errors=[],warns=[];
    const tol=NUTRITION_TOLERANCES;
    const off=(v,t,pct)=>t>0&&Math.abs(v-t)>t*pct;
    if(off(totals.kcal,target.kcal,tol.DAY_KCAL_PCT))
      errors.push("kcal del día "+Math.round(totals.kcal)+" fuera de ±"+Math.round(tol.DAY_KCAL_PCT*100)+"% de "+target.kcal+".");
    if(totals.p<target.p*tol.DAY_PROTEIN_MIN_PCT)
      errors.push("Proteína "+Math.round(totals.p)+" g por debajo del "+Math.round(tol.DAY_PROTEIN_MIN_PCT*100)+"% de la meta ("+target.p+" g).");
    if(off(totals.c,target.c,tol.DAY_CARB_PCT))
      warns.push("Carbohidratos "+Math.round(totals.c)+" g lejos de la meta ("+target.c+" g).");
    return{ok:errors.length===0,errors,warns};
  }

  // Slot individual vs. target de ese slot.
  function validateSlotMacros(slotMacros,slotTarget){
    const errors=[];
    const tol=NUTRITION_TOLERANCES.SLOT_KCAL_PCT;
    if(slotTarget&&slotTarget.kcal>0&&Math.abs(slotMacros.kcal-slotTarget.kcal)>slotTarget.kcal*tol)
      errors.push("Slot kcal "+slotMacros.kcal+" fuera de ±"+Math.round(tol*100)+"% de "+slotTarget.kcal+".");
    return ok(errors);
  }

  // Reemplazo de plato: indica si la diferencia de kcal es rebalanceable
  // ajustando el resto del día sin advertencia al usuario.
  function validateReplacementFeasibility(replacementKcal,originalKcal){
    const tol=NUTRITION_TOLERANCES.REPLACEMENT_KCAL_PCT;
    const delta=replacementKcal-originalKcal;
    const pct=originalKcal>0?Math.abs(delta)/originalKcal:1;
    return{rebalanceable:pct<=tol,delta:Math.round(delta),pct:Math.round(pct*100)};
  }

  // ── Solver determinista de porciones (REQ-80) ──────────────────────────────
  const SNACK_COMPATIBLE_SLOTS=["media_manana","merienda","snack","recena"];
  const SHAKE_COMPATIBLE_SLOTS=["media_manana","merienda","snack","recena","batido"];

  function num(value,fallback){
    const n=Number(value);
    return Number.isFinite(n)?n:(fallback==null?0:fallback);
  }

  function asArray(value){
    if(Array.isArray(value))return value.map(x=>String(x).trim()).filter(Boolean);
    if(typeof value==="string")return value.replace(/[{}"]/g,"").split(",").map(x=>x.trim()).filter(Boolean);
    return [];
  }

  function solverKey(value){
    const fn=root.coachKey;
    if(fn)return fn(value);
    return String(value||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
  }

  function slugFor(row){
    return String(row&&(row.slug||row.ingredientSlug||row.dishSlug)||"").trim()||solverKey(row&&row.name).replace(/_/g,"-");
  }

  function macroPer100(ingredient){
    return {
      kcal:num(ingredient&&ingredient.kcal),
      p:num(ingredient&&(ingredient.protein_g!=null?ingredient.protein_g:ingredient.p)),
      c:num(ingredient&&(ingredient.carbs_g!=null?ingredient.carbs_g:ingredient.c)),
      f:num(ingredient&&(ingredient.fat_g!=null?ingredient.fat_g:ingredient.f)),
    };
  }

  function macrosForIngredient(ingredient,grams){
    const m=macroPer100(ingredient),g=num(grams)/100;
    return {kcal:m.kcal*g,p:m.p*g,c:m.c*g,f:m.f*g};
  }

  function addMacros(a,b){
    a.kcal+=b.kcal;a.p+=b.p;a.c+=b.c;a.f+=b.f;
    return a;
  }

  function roundMacros(m){
    return {kcal:Math.round(m.kcal),p:Math.round(m.p),c:Math.round(m.c),f:Math.round(m.f)};
  }

  function catalogMaps(catalog){
    const ingredients=Array.isArray(catalog&&catalog.ingredients)?catalog.ingredients:[];
    const byId=new Map(),bySlug=new Map(),byName=new Map();
    ingredients.forEach(ing=>{
      if(ing&&ing.id!=null)byId.set(String(ing.id),ing);
      const slug=slugFor(ing);if(slug)bySlug.set(slug,ing);
      const key=solverKey(ing&&ing.name);if(key)byName.set(key,ing);
    });
    return {ingredients,byId,bySlug,byName};
  }

  function ingredientForLine(line,maps){
    if(!line)return null;
    if(line.ingredient&&typeof line.ingredient==="object")return line.ingredient;
    if(line.ingredient_id!=null&&maps.byId.has(String(line.ingredient_id)))return maps.byId.get(String(line.ingredient_id));
    const slug=String(line.ingredientSlug||line.ingredient_slug||line.slug||"").trim();
    if(slug&&maps.bySlug.has(slug))return maps.bySlug.get(slug);
    const nameKey=solverKey(line.name||line.nombre||line.ingredient_name);
    return nameKey?maps.byName.get(nameKey)||null:null;
  }

  function dishLines(dish,catalog,maps){
    if(!dish)return[];
    const source=Array.isArray(dish.ingredients)?dish.ingredients
      :Array.isArray(dish.lines)?dish.lines
      :Array.isArray(catalog&&catalog.dishIng)?catalog.dishIng.filter(line=>String(line.dish_id)===String(dish.id))
      :Array.isArray(catalog&&catalog.dishIngredients)?catalog.dishIngredients.filter(line=>String(line.dish_id)===String(dish.id))
      :[];
    return source.map(line=>{
      const ingredient=ingredientForLine(line,maps);
      return {raw:line,ingredient,grams:num(line.grams!=null?line.grams:line.gramos)};
    }).filter(line=>line.grams>0);
  }

  function dishText(dish,catalog,maps){
    return [dish&&dish.name,dish&&dish.notes,...dishLines(dish,catalog,maps).map(line=>line.ingredient&&line.ingredient.name)]
      .filter(Boolean).join(" ");
  }

  function solverRestrictionTerms(prefs){
    const p=prefs||{},diet=Array.isArray(p.diet)?p.diet:[];
    const terms=allergyTermsForProfile(p);
    if(diet.includes("sin_lacteos"))terms.push("leche","lácteo","lacteo","queso","yogur","yogurt","parmesano","cottage");
    if(diet.includes("sin_gluten"))terms.push("gluten","trigo","pasta","fideos","pan","pita","tortilla integral");
    if(diet.includes("vegano"))terms.push("miel");
    return [...new Set(terms.map(t=>String(t||"").trim()).filter(Boolean))];
  }

  function dishDietAllowed(dish,prefs,catalog,maps){
    const diet=Array.isArray(prefs&&prefs.diet)?prefs.diet:[];
    const tags=asArray(dish&&dish.diet_tags);
    if(tags.length){
      if(diet.includes("vegano")&&!tags.includes("vegano"))return false;
      if(diet.includes("vegetariano")&&!tags.includes("vegetariano")&&!tags.includes("vegano"))return false;
    }
    const text=dishText(dish,catalog,maps);
    return !foodTextViolatesTerms(text,solverRestrictionTerms(prefs));
  }

  function compatibleSlotsForDish(dish){
    const declared=asArray(dish&&dish.compatible_slots);
    const base=declared.length?declared:(dish&&dish.slot?[String(dish.slot)]:[]);
    const expanded=[];
    base.forEach(slot=>{
      if(slot==="snack")expanded.push(...SNACK_COMPATIBLE_SLOTS);
      else if(slot==="batido")expanded.push(...SHAKE_COMPATIBLE_SLOTS);
      else expanded.push(slot);
    });
    return [...new Set(expanded.filter(Boolean))];
  }

  function compatibleDishesForSlot(slot,prefs,catalog){
    const slotId=typeof slot==="string"?slot:(slot&&slot.id)||"";
    const maps=catalogMaps(catalog);
    return (Array.isArray(catalog&&catalog.dishes)?catalog.dishes:[]).filter(dish=>{
      if(!compatibleSlotsForDish(dish).includes(slotId))return false;
      return dishDietAllowed(dish,prefs||{},catalog||{},maps);
    });
  }

  function splitWeighted(total,count,index,mainIndex){
    if(count<=1||!Number.isInteger(mainIndex)||mainIndex<0||mainIndex>=count){
      const base=Math.floor(num(total)/Math.max(1,count));
      return index===count-1?Math.round(num(total)-base*(count-1)):base;
    }
    const mainShare=count<=2?0.5:count===3?0.4:0.3;
    const main=Math.round(num(total)*mainShare),rest=num(total)-main,others=count-1;
    if(index===mainIndex)return main;
    const otherIndex=index<mainIndex?index:index-1;
    const base=Math.floor(rest/others);
    return otherIndex===others-1?Math.round(rest-base*(others-1)):base;
  }

  function mealSlotTargets(dayTarget,prefs,workoutContext){
    const p=prefs||{};
    const count=Math.min(6,Math.max(2,Number.parseInt(p.mealCount,10)||4));
    const slots=mealSlotsForCount(count);
    const mainIndex=Math.min(Math.max(1,Number.parseInt(p.mainMealIndex,10)||2),count)-1;
    return slots.map((slot,index)=>{
      const target={
        kcal:splitWeighted(dayTarget&&dayTarget.kcal,count,index,mainIndex),
        p:splitWeighted(dayTarget&&dayTarget.p,count,index,mainIndex),
        c:splitWeighted(dayTarget&&dayTarget.c,count,index,mainIndex),
        f:splitWeighted(dayTarget&&dayTarget.f,count,index,mainIndex),
      };
      if(workoutContext&&workoutContext.isTrainingDay&&(slot.id==="almuerzo"||slot.id==="merienda")){
        target.c=Math.round(target.c*1.05);
      }
      return {...slot,index,target};
    });
  }

  function categoryLimit(ingredient,baseMax){
    const text=solverKey((ingredient&&ingredient.name)+" "+(ingredient&&ingredient.category));
    if(/aceite/.test(text))return Math.min(baseMax,25);
    if(/proteina_en_polvo|caseina/.test(text))return Math.min(baseMax,90);
    if(/mantequilla|mani|chia|palta|aceituna/.test(text))return Math.min(baseMax,120);
    if(/verdura|fruta/.test(text))return Math.min(baseMax,500);
    return Math.min(baseMax,420);
  }

  function lineLimits(line){
    const raw=line.raw||{},base=line.grams;
    const scalable=raw.scalable!==false&&raw.scalable!=="false";
    const step=Math.max(1,num(raw.step_g!=null?raw.step_g:raw.stepG,5));
    if(!scalable)return{min:base,max:base,step,scalable:false};
    const min=Math.max(1,num(raw.min_g!=null?raw.min_g:raw.minG,Math.max(5,Math.round(base*0.5))));
    const rawMax=num(raw.max_g!=null?raw.max_g:raw.maxG,Math.max(base,Math.round(base*2)));
    const max=Math.max(min,categoryLimit(line.ingredient,rawMax));
    return{min,max,step,scalable:true};
  }

  function clampStep(value,limits){
    const clipped=Math.min(limits.max,Math.max(limits.min,num(value)));
    const stepped=Math.round(clipped/limits.step)*limits.step;
    return Math.min(limits.max,Math.max(limits.min,stepped));
  }

  function scoreMacros(macros,target){
    const t=target||{};
    const rel=(a,b)=>Math.abs(num(a)-num(b))/Math.max(1,num(b));
    const proteinPenalty=macros.p<num(t.p)?1.45:0.45;
    return rel(macros.kcal,t.kcal)*1.4+
      rel(macros.p,t.p)*proteinPenalty+
      rel(macros.c,t.c)*0.55+
      rel(macros.f,t.f)*0.55;
  }

  function macrosFromSolvedLines(lines){
    const total={kcal:0,p:0,c:0,f:0};
    lines.forEach(line=>addMacros(total,macrosForIngredient(line.ingredient,line.grams)));
    return total;
  }

  function optimizeLines(source,target,seedScale){
    const lines=source.map(line=>{
      const limits=lineLimits(line);
      return {...line,limits,grams:clampStep(line.grams*(seedScale||1),limits)};
    });
    let bestScore=scoreMacros(macrosFromSolvedLines(lines),target);
    for(let iter=0;iter<140;iter++){
      let improved=false;
      for(let i=0;i<lines.length;i++){
        const line=lines[i];
        if(!line.limits.scalable)continue;
        let bestGrams=line.grams;
        for(const dir of [1,-1]){
          const next=clampStep(line.grams+dir*line.limits.step,line.limits);
          if(next===line.grams)continue;
          line.grams=next;
          const s=scoreMacros(macrosFromSolvedLines(lines),target);
          if(s+0.0001<bestScore){bestScore=s;bestGrams=next;improved=true;}
        }
        line.grams=bestGrams;
      }
      if(!improved)break;
    }
    return{lines,score:bestScore,macros:macrosFromSolvedLines(lines)};
  }

  function solveDishPortion(dish,mealTarget,options){
    const catalog=(options&&options.catalog)||{};
    const maps=catalogMaps(catalog);
    const lines=dishLines(dish,catalog,maps);
    if(!lines.length)return{ok:false,no_solution:"dish_without_ingredients",dish,score:Infinity};
    const missing=lines.find(line=>!line.ingredient||macroPer100(line.ingredient).kcal<=0);
    if(missing)return{ok:false,no_solution:"ingredient_without_macros",dish,score:Infinity,line:missing.raw};
    const base=macrosFromSolvedLines(lines);
    const seeds=[1];
    if(base.kcal>0&&mealTarget&&mealTarget.kcal>0)seeds.push(mealTarget.kcal/base.kcal);
    if(base.p>0&&mealTarget&&mealTarget.p>0)seeds.push(mealTarget.p/base.p);
    let best=null;
    seeds.forEach(seed=>{
      const solved=optimizeLines(lines,mealTarget,Math.max(0.35,Math.min(2.5,seed)));
      if(!best||solved.score<best.score)best=solved;
    });
    const rounded=roundMacros(best.macros);
    const residual={
      kcal:Math.round(num(mealTarget&&mealTarget.kcal)-rounded.kcal),
      p:Math.round(num(mealTarget&&mealTarget.p)-rounded.p),
      c:Math.round(num(mealTarget&&mealTarget.c)-rounded.c),
      f:Math.round(num(mealTarget&&mealTarget.f)-rounded.f),
    };
    return{
      ok:true,dish,score:best.score,macros:rounded,residual,
      ingredients:best.lines.map(line=>{
        const m=roundMacros(macrosForIngredient(line.ingredient,line.grams));
        return {
          ingredient_id:line.ingredient&&line.ingredient.id,
          ingredientSlug:slugFor(line.ingredient),
          nombre:line.ingredient&&line.ingredient.name,
          gramos:Math.round(line.grams),
          kcal:m.kcal,proteina_g:m.p,carbohidratos_g:m.c,grasa_g:m.f,
        };
      }),
    };
  }

  function planDeterministicNutritionDay(ctx){
    const prefs=ctx&&ctx.prefs||{};
    const dayTarget=ctx&&ctx.dayTarget||ctx&&ctx.target||{kcal:2000,p:150,c:200,f:65};
    const generatedTargets=mealSlotTargets(dayTarget,prefs,ctx&&ctx.workoutContext);
    const slots=(Array.isArray(ctx&&ctx.slots)&&ctx.slots.length?ctx.slots:generatedTargets).map((slot,index)=>({
      id:slot.id||slot.slot_id||generatedTargets[index]&&generatedTargets[index].id,
      slot:slot.slot||slot.label||generatedTargets[index]&&generatedTargets[index].slot,
      target:(generatedTargets[index]&&generatedTargets[index].target)||generatedTargets[generatedTargets.length-1].target,
      index,
    })).filter(slot=>slot.id);
    const catalog=ctx&&ctx.catalog||{};
    const used=new Set(),comidas=[],diagnostics=[],causes=[];
    slots.forEach(slot=>{
      const candidates=compatibleDishesForSlot(slot.id,prefs,catalog);
      if(!candidates.length){
        causes.push({slot:slot.id,reason:"slot_without_candidates"});
        return;
      }
      let best=null;
      candidates.slice(0,48).forEach(dish=>{
        const solved=solveDishPortion(dish,slot.target,{catalog});
        if(!solved.ok){
          diagnostics.push({slot:slot.id,dish:dish.name,reason:solved.no_solution});
          return;
        }
        const reuse=used.has(slugFor(dish))?0.18:0;
        const score=solved.score+reuse;
        if(!best||score<best.rankScore)best={...solved,rankScore:score};
      });
      if(!best){
        causes.push({slot:slot.id,reason:(diagnostics.find(d=>d.slot===slot.id)||{}).reason||"no_viable_candidate"});
        return;
      }
      used.add(slugFor(best.dish));
      comidas.push({
        slot_id:slot.id,
        nombre:best.dish.name,
        dishSlug:slugFor(best.dish),
        dishId:best.dish.id,
        ingredientes:best.ingredients.map(({nombre,gramos,ingredientSlug,kcal,proteina_g,carbohidratos_g,grasa_g})=>({
          nombre,gramos,ingredientSlug,kcal,proteina_g,carbohidratos_g,grasa_g,
        })),
        kcal:best.macros.kcal,
        proteina_g:best.macros.p,
        carbohidratos_g:best.macros.c,
        grasa_g:best.macros.f,
        residual:best.residual,
        score:Number(best.score.toFixed(4)),
      });
    });
    const totals=roundMacros(comidas.reduce((sum,meal)=>addMacros(sum,{
      kcal:num(meal.kcal),p:num(meal.proteina_g),c:num(meal.carbohidratos_g),f:num(meal.grasa_g),
    }),{kcal:0,p:0,c:0,f:0}));
    const validation=validateDayTotals(totals,dayTarget);
    if(!validation.ok){
      validation.errors.forEach(error=>{
        causes.push({reason:/Proteína/i.test(error)?"protein_insufficient":"kcal_out_of_tolerance",detail:error});
      });
    }
    const noSolution=causes.length>0;
    return {
      ok:!noSolution,
      status:noSolution?"no_solution":"ok",
      no_solution:noSolution?causes:null,
      diagnostics,
      totals,
      target:{kcal:num(dayTarget.kcal),p:num(dayTarget.p),c:num(dayTarget.c),f:num(dayTarget.f)},
      residual:{
        kcal:Math.round(num(dayTarget.kcal)-totals.kcal),
        p:Math.round(num(dayTarget.p)-totals.p),
        c:Math.round(num(dayTarget.c)-totals.c),
        f:Math.round(num(dayTarget.f)-totals.f),
      },
      explicacion:noSolution
        ?"Preparamos la opción más viable con tu catálogo actual."
        :"Alternativa práctica construida con tus metas y restricciones vigentes.",
      comidas,
      warns:validation.warns||[],
    };
  }

  // ── Namespace ────────────────────────────────────────────────────────────────
  const FITBUD_NUTRITION_DOMAIN={
    MEAL_SLOT_VOCAB,
    NUTRITION_TOLERANCES,
    kcalFromMacros,
    macrosFromIngredientMap,
    mealSlotsForCount,
    allergyTermsForProfile,
    foodTextViolatesTerms,
    validateTargetConsistency,
    validateDayTotals,
    validateSlotMacros,
    validateReplacementFeasibility,
    mealSlotTargets,
    compatibleDishesForSlot,
    solveDishPortion,
    planDeterministicNutritionDay,
  };
  root.FITBUD_NUTRITION_DOMAIN=FITBUD_NUTRITION_DOMAIN;
  // Exponer selectos como globals para call-sites de index.html que lo necesiten.
  // No se expone macrosFromIngredientMap como global para no colisionar con
  // la función homónima (macrosFromLines) de index.html que usa ingById().
  root.MEAL_SLOT_VOCAB=MEAL_SLOT_VOCAB;
  root.NUTRITION_TOLERANCES=NUTRITION_TOLERANCES;
  root.kcalFromMacros=kcalFromMacros;
  root.allergyTermsForProfile=allergyTermsForProfile;
  root.foodTextViolatesTerms=foodTextViolatesTerms;
  root.validateTargetConsistency=validateTargetConsistency;
  root.validateDayTotals=validateDayTotals;
  root.validateSlotMacros=validateSlotMacros;
  root.validateReplacementFeasibility=validateReplacementFeasibility;
  root.mealSlotTargets=mealSlotTargets;
  root.compatibleDishesForSlot=compatibleDishesForSlot;
  root.solveDishPortion=solveDishPortion;
  root.planDeterministicNutritionDay=planDeterministicNutritionDay;
})(typeof window!=="undefined"?window:globalThis);
