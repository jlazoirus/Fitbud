// Registro nutricional puro de Fitbros — REQ-266..273.
// Sin DOM ni estado global: parseo y validación de valores, contrato de origen
// (nutritionMeta), composición por ingredientes, alimentos/recetas propios y GTIN.
// Compatible con navegador (<script src="js/meal-log.js">) y Node.js (import).
// Expone FITBUD_MEAL_LOG como namespace + cada símbolo como global individual,
// igual que js/nutrition-pure.js.
(function(root){
  "use strict";

  // ── REQ-266: valores de una comida ──────────────────────────────────────────
  // Límites por comida registrada: una entrada razonable y nunca negativa.
  const MEAL_VALUE_LIMITS={kcal:5000,p:500,c:1000,f:500};
  const MEAL_NAME_MAX=160;
  const MEAL_VALUE_FIELDS=[["kcal","kcal"],["p","proteína"],["c","carbohidratos"],["f","grasa"]];

  // Convierte lo escrito en un número finito ≥0. Acepta coma o punto decimal
  // ("33,5" = 33.5) y números programáticos. Vacío ≠ cero: devuelve empty:true.
  function parseNutrientInput(raw){
    if(typeof raw==="number"){
      if(!Number.isFinite(raw))return{ok:false,empty:false,value:null,error:"invalid"};
      if(raw<0)return{ok:false,empty:false,value:null,error:"negative"};
      return{ok:true,empty:false,value:raw};
    }
    const text=String(raw==null?"":raw).trim().replace(/\s+/g,"");
    if(!text)return{ok:false,empty:true,value:null,error:"empty"};
    if(/^-/.test(text))return{ok:false,empty:false,value:null,error:"negative"};
    if(!/^\d+(?:[.,]\d+)?$/.test(text)&&!/^[.,]\d+$/.test(text))return{ok:false,empty:false,value:null,error:"invalid"};
    const value=Number(text.replace(",","."));
    if(!Number.isFinite(value))return{ok:false,empty:false,value:null,error:"invalid"};
    return{ok:true,empty:false,value};
  }
  // Una décima basta para gramos y kcal; evita ruido de coma flotante.
  function roundTenth(n){return Math.round((Number(n)||0)*10)/10;}

  // Valida lo que el usuario quiere guardar. mode "full" exige los cuatro
  // valores; "kcal_only" guarda kcal y marca los macros como desconocidos.
  // Devuelve {ok, value, errors:{campo:mensaje}}; nunca convierte vacío en 0.
  function validateMealValues(input,opts){
    const mode=opts&&opts.mode==="kcal_only"?"kcal_only":"full";
    const errors={};
    const name=String(input&&input.name||"").trim();
    if(!name)errors.name="Pon una descripción.";
    else if(name.length>MEAL_NAME_MAX)errors.name=`Usa hasta ${MEAL_NAME_MAX} caracteres.`;
    const value={name:name.slice(0,MEAL_NAME_MAX)};
    MEAL_VALUE_FIELDS.forEach(([key,label])=>{
      if(mode==="kcal_only"&&key!=="kcal"){value[key]=0;return;}
      const r=parseNutrientInput(input&&input[key]);
      const max=MEAL_VALUE_LIMITS[key];
      if(r.empty)errors[key]=key==="kcal"?"Indica las kcal (0 si no tiene).":`Indica ${label} o marca «Solo conozco las calorías».`;
      else if(r.error==="negative")errors[key]="No puede ser negativo.";
      else if(!r.ok)errors[key]="Escribe un número (usa coma o punto para decimales).";
      else if(r.value>max)errors[key]=`Máximo ${max}${key==="kcal"?" kcal":" g"} por comida.`;
      else value[key]=roundTenth(r.value);
    });
    if(mode==="kcal_only")value.macrosUnknown=true;
    const ok=!Object.keys(errors).length;
    return{ok,value:ok?value:null,errors};
  }

  const api={
    MEAL_VALUE_LIMITS,MEAL_NAME_MAX,
    parseNutrientInput,roundTenth,validateMealValues,
  };
  root.FITBUD_MEAL_LOG=api;
  Object.keys(api).forEach(key=>{root[key]=api[key];});
})(typeof window!=="undefined"?window:globalThis);
