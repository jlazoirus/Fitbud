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

  // ── REQ-267: origen y snapshot nutricional ──────────────────────────────────
  // Contrato `nutritionMeta` (v1) guardado junto a los totales de cada consumo:
  //   source  manual | catalog | estimate | recipe | food | legacy
  //           (legacy = reutiliza un registro anterior sin origen; al leer una
  //           entrada sin metadatos también se trata como legacy, sin reescribirla)
  //   ref     {kind: saved|recent|food|recipe|ingredient, id?, name?, version?}
  //   base    valores de una unidad de la fuente {kcal,p,c,f,unit: portion|100g|100ml}
  //   qty     cantidad aplicada sobre base (porción ×k, o gramos/ml si unit es 100g/100ml)
  //   estimate {kind: text|photo, note?}  supuestos visibles; nunca prompt ni imagen
  //   corrected  true si el usuario cambió los totales calculados por la fuente
  //   macrosUnknown  copia del modo solo calorías (REQ-266)
  // Los totales del consumo son el snapshot: editar la fuente no cambia el pasado.
  const NUTRITION_META_VERSION=1;
  const NUTRITION_SOURCES=["manual","catalog","estimate","recipe","food","legacy"];
  const NUTRITION_REF_KINDS=["saved","recent","food","recipe","ingredient"];
  const NUTRITION_UNITS=["portion","100g","100ml"];
  const cleanText=(x,max)=>String(x==null?"":x).replace(/[\u0000-\u001f]/g," ").trim().slice(0,max);
  function cleanMacros(m,unknown){
    if(!m||typeof m!=="object")return null;
    const out={};
    for(const k of ["kcal","p","c","f"]){
      const n=Number(m[k]);
      if(!Number.isFinite(n)||n<0)return null;
      out[k]=Math.round(n*1000)/1000;
    }
    if(unknown)out.p=out.c=out.f=0;
    return out;
  }
  function normalizeNutritionMeta(meta){
    if(!meta||typeof meta!=="object"||!NUTRITION_SOURCES.includes(meta.source))return null;
    const out={v:NUTRITION_META_VERSION,source:meta.source};
    if(meta.ref&&typeof meta.ref==="object"&&NUTRITION_REF_KINDS.includes(meta.ref.kind)){
      const ref={kind:meta.ref.kind};
      const id=cleanText(meta.ref.id,64);if(id)ref.id=id;
      const name=cleanText(meta.ref.name,160);if(name)ref.name=name;
      const version=Number(meta.ref.version);if(Number.isInteger(version)&&version>0)ref.version=version;
      out.ref=ref;
    }
    const base=cleanMacros(meta.base,meta.macrosUnknown);
    if(base){base.unit=NUTRITION_UNITS.includes(meta.base.unit)?meta.base.unit:"portion";out.base=base;}
    const qty=Number(meta.qty);
    if(out.base&&Number.isFinite(qty)&&qty>0&&qty<=100000)out.qty=Math.round(qty*1000)/1000;
    if(meta.estimate&&typeof meta.estimate==="object"&&(meta.estimate.kind==="text"||meta.estimate.kind==="photo")){
      const est={kind:meta.estimate.kind};
      const note=cleanText(meta.estimate.note,200);if(note)est.note=note;
      out.estimate=est;
    }
    if(meta.corrected===true)out.corrected=true;
    if(meta.macrosUnknown===true)out.macrosUnknown=true;
    return out;
  }
  // Lectura: una entrada sin metadatos es un registro anterior, sin inventar su origen.
  function nutritionMetaFor(entry){
    return normalizeNutritionMeta(entry&&entry.nutritionMeta)||{v:NUTRITION_META_VERSION,source:"legacy"};
  }
  function sameMacros(a,b){
    if(!a||!b)return false;
    return ["kcal","p","c","f"].every(k=>Math.abs((Number(a[k])||0)-(Number(b[k])||0))<0.05);
  }
  // Valores que la fuente produce (base × cantidad) para comparar con lo guardado.
  function metaComputedValues(meta){
    if(!meta||!meta.base)return null;
    const k=meta.base.unit==="portion"?(meta.qty||1):(meta.qty||100)/100;
    return {kcal:meta.base.kcal*k,p:meta.base.p*k,c:meta.base.c*k,f:meta.base.f*k};
  }
  // Cierra el borrador al guardar: si los totales ya no coinciden con lo que
  // calculó la fuente, queda como corregido a mano sin perder la base.
  function finalizeNutritionMeta(draft,values){
    const meta=normalizeNutritionMeta(draft);
    if(!meta)return null;
    const computed=metaComputedValues(meta);
    if(computed&&!sameMacros(computed,values))meta.corrected=true;
    if(values&&values.macrosUnknown)meta.macrosUnknown=true;else delete meta.macrosUnknown;
    return meta;
  }
  function fmtQty(n){return String(Math.round(n*10)/10).replace(".",",");}
  // Texto para el detalle del registro (sin vocabulario técnico, REQ-31).
  function nutritionMetaLabel(meta){
    const m=meta&&meta.source?meta:{source:"legacy"};
    const base={
      manual:"Ingresado a mano",
      catalog:"Calculado con alimentos del catálogo",
      estimate:m.estimate&&m.estimate.kind==="photo"?"Estimado por tu coach a partir de una foto":"Estimado por tu coach a partir de la descripción",
      recipe:"Calculado desde una receta",
      food:"Calculado desde tu alimento guardado",
      legacy:"Registro anterior: su origen no se guardó",
    }[m.source]||"Origen desconocido";
    const parts=[base];
    if(m.ref&&m.ref.name&&(m.ref.kind==="saved"||m.ref.kind==="recent"))parts.push(`${m.ref.kind==="saved"?"favorita":"reciente"} «${m.ref.name}»`);
    else if(m.ref&&m.ref.name)parts.push(`«${m.ref.name}»`);
    if(m.base&&m.qty&&m.base.unit==="portion"&&m.qty!==1)parts.push(`porción ×${fmtQty(m.qty)}`);
    if(m.base&&m.qty&&m.base.unit!=="portion")parts.push(`${fmtQty(m.qty)} ${m.base.unit==="100ml"?"ml":"g"}`);
    if(m.corrected)parts.push("corregido a mano");
    if(m.macrosUnknown)parts.push("solo calorías");
    return parts.join(" · ");
  }

  const api={
    MEAL_VALUE_LIMITS,MEAL_NAME_MAX,
    parseNutrientInput,roundTenth,validateMealValues,
    NUTRITION_META_VERSION,normalizeNutritionMeta,nutritionMetaFor,finalizeNutritionMeta,
    metaComputedValues,sameMacros,nutritionMetaLabel,
  };
  root.FITBUD_MEAL_LOG=api;
  Object.keys(api).forEach(key=>{root[key]=api[key];});
})(typeof window!=="undefined"?window:globalThis);
