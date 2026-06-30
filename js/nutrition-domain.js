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
})(typeof window!=="undefined"?window:globalThis);
