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

  // ── REQ-268: composición por ingredientes ──────────────────────────────────
  // Una línea guarda su propia base (snapshot): reabrir no depende del catálogo.
  //   {name, unit: 100g|100ml|portion, amount, base:{kcal,p,c,f}, ref?}
  // amount son gramos/ml (100g/100ml) o porciones (portion). Los totales se
  // suman con precisión completa y solo se redondean al guardar/mostrar.
  const COMPONENTS_MAX=30;
  const COMPONENT_AMOUNT_MAX={"100g":2000,"100ml":2000,portion:20};
  function normalizeComponent(c){
    if(!c||typeof c!=="object")return null;
    const name=cleanText(c.name,160);
    const unit=NUTRITION_UNITS.includes(c.unit)?c.unit:"100g";
    const amount=Number(c.amount);
    const base=cleanMacros(c.base);
    if(!name||!base||!Number.isFinite(amount)||amount<=0||amount>COMPONENT_AMOUNT_MAX[unit])return null;
    const out={name,unit,amount:Math.round(amount*1000)/1000,base};
    if(c.ref&&typeof c.ref==="object"&&NUTRITION_REF_KINDS.includes(c.ref.kind)){
      const ref={kind:c.ref.kind};
      const id=cleanText(c.ref.id,64);if(id)ref.id=id;
      const version=Number(c.ref.version);if(Number.isInteger(version)&&version>0)ref.version=version;
      out.ref=ref;
    }
    return out;
  }
  function normalizeComponents(list){
    return (Array.isArray(list)?list:[]).map(normalizeComponent).filter(Boolean).slice(0,COMPONENTS_MAX);
  }
  function componentFactor(c){return c.unit==="portion"?c.amount:c.amount/100;}
  function componentValues(c){
    const k=componentFactor(c);
    return {kcal:c.base.kcal*k,p:c.base.p*k,c:c.base.c*k,f:c.base.f*k};
  }
  function componentsTotals(list){
    const t={kcal:0,p:0,c:0,f:0};
    normalizeComponents(list).forEach(c=>{const v=componentValues(c);t.kcal+=v.kcal;t.p+=v.p;t.c+=v.c;t.f+=v.f;});
    return t;
  }
  function componentAmountLabel(c){
    if(c.unit==="portion")return c.amount===1?"1 porción":`${fmtQty(c.amount)} porciones`;
    return `${fmtQty(c.amount)} ${c.unit==="100ml"?"ml":"g"}`;
  }
  function componentsName(list){
    return normalizeComponents(list).map(c=>c.unit==="portion"&&c.amount===1?c.name:`${c.name} ${componentAmountLabel(c)}`).join(" + ").slice(0,MEAL_NAME_MAX);
  }
  // Origen que resulta de las líneas: todo catálogo → catalog; todo propio → food.
  function componentsSource(list){
    const kinds=new Set(normalizeComponents(list).map(c=>c.ref&&c.ref.kind||"manual"));
    if(kinds.size===1&&kinds.has("ingredient"))return "catalog";
    if(kinds.size===1&&kinds.has("food"))return "food";
    if(kinds.size===1&&kinds.has("recipe"))return "recipe";
    return "manual";
  }

  // ── REQ-270: copiar comidas entre días ──────────────────────────────────────
  // Copia el snapshot (valores, líneas y origen) con identidad nueva: nunca
  // arrastra ids de sync, orden, estado hecho/saltado ni el deshacer del origen.
  function copyEntrySnapshot(entry,from){
    if(!entry||typeof entry!=="object")return null;
    const name=cleanText(entry.name,MEAL_NAME_MAX);
    const vals=cleanMacros(entry,entry.macrosUnknown);
    if(!name||!vals)return null;
    const out={name,kcal:vals.kcal,p:vals.p,c:vals.c,f:vals.f};
    if(entry.macrosUnknown)out.macrosUnknown=true;
    const components=normalizeComponents(entry.components);
    if(components.length)out.components=components;
    const meta=normalizeNutritionMeta(entry.nutritionMeta);
    if(meta)out.nutritionMeta=meta;
    if(from&&from.date)out.copiedFrom={date:cleanText(from.date,10),key:cleanText(from.key,40)};
    return out;
  }

  // ── REQ-271: alimentos propios desde la etiqueta ───────────────────────────
  // Biblioteca privada en profiles.prefs.customFoods (máx. 100):
  //   {id, name, brand?, unit: 100g|100ml|portion, base:{kcal,p,c,f},
  //    portion?:{label, amount}, version, updatedAt}
  // unit "portion" = valores por una porción declarada sin peso conocido: se
  // registra por porciones, nunca se convierte a gramos. `portion` en 100g/100ml
  // es una equivalencia opcional ("1 pote = 125 g") solo si el usuario la conoce.
  const CUSTOM_FOODS_MAX=100;
  const CUSTOM_FOOD_DELETED_MAX=200;
  const CUSTOM_FOOD_LIMITS={
    "100g":{kcal:900,macro:100,sum:100},
    "100ml":{kcal:1500,macro:150,sum:150},
    portion:{kcal:MEAL_VALUE_LIMITS.kcal,macro:MEAL_VALUE_LIMITS.c,sum:null},
  };
  function validateCustomFoodInput(input){
    const errors={};
    const name=cleanText(input&&input.name,200);
    if(!name)errors.name="Pon el nombre del alimento.";
    else if(name.length>MEAL_NAME_MAX)errors.name=`Usa hasta ${MEAL_NAME_MAX} caracteres.`;
    const brand=cleanText(input&&input.brand,120);
    if(brand.length>80)errors.brand="Usa hasta 80 caracteres.";
    const unit=NUTRITION_UNITS.includes(input&&input.unit)?input.unit:null;
    if(!unit)errors.unit="Elige por qué cantidad son los valores.";
    const lim=CUSTOM_FOOD_LIMITS[unit||"100g"];
    const base={};
    [["kcal","kcal"],["p","proteína"],["c","carbohidratos"],["f","grasa"]].forEach(([k,label])=>{
      const r=parseNutrientInput(input&&input[k]);
      const max=k==="kcal"?lim.kcal:lim.macro;
      if(r.empty)errors[k]=`Indica ${label} como figura en la etiqueta (0 si no tiene).`;
      else if(r.error==="negative")errors[k]="No puede ser negativo.";
      else if(!r.ok)errors[k]="Escribe un número (usa coma o punto para decimales).";
      else if(r.value>max)errors[k]=`Revisa el valor: máximo ${max}${k==="kcal"?" kcal":" g"}.`;
      else base[k]=roundTenth(r.value);
    });
    if(lim.sum&&!errors.p&&!errors.c&&!errors.f&&base.p+base.c+base.f>lim.sum)errors.f=`Proteína, carbohidratos y grasa suman más de ${lim.sum} g por 100 ${unit==="100ml"?"ml":"g"}.`;
    let portion=null;
    const label=cleanText(input&&input.portionLabel,60);
    const amountRaw=input&&input.portionAmount;
    if(unit==="portion"){
      if(!label)errors.portionLabel="Describe la porción de la etiqueta (ej. 1 barra).";
      else if(label.length>40)errors.portionLabel="Usa hasta 40 caracteres.";
      else portion={label};
    }else if(label||String(amountRaw==null?"":amountRaw).trim()){
      const r=parseNutrientInput(amountRaw);
      if(!label)errors.portionLabel="Describe la porción (ej. 1 pote) o deja ambos campos vacíos.";
      else if(label.length>40)errors.portionLabel="Usa hasta 40 caracteres.";
      if(!r.ok||r.value<=0)errors.portionAmount=`Indica cuántos ${unit==="100ml"?"ml":"g"} tiene la porción, o deja ambos campos vacíos.`;
      else if(r.value>COMPONENT_AMOUNT_MAX[unit])errors.portionAmount=`Máximo ${COMPONENT_AMOUNT_MAX[unit]} ${unit==="100ml"?"ml":"g"}.`;
      if(!errors.portionLabel&&!errors.portionAmount)portion={label,amount:roundTenth(r.value)};
    }
    const ok=!Object.keys(errors).length;
    const value=ok?Object.assign({name,unit,base},brand?{brand}:{},portion?{portion}:{}):null;
    return {ok,value,errors};
  }
  function normalizeCustomFood(f){
    if(!f||typeof f!=="object")return null;
    const id=cleanText(f.id,64);
    if(!/^[a-z0-9_-]{4,64}$/i.test(id))return null;
    const name=cleanText(f.name,MEAL_NAME_MAX);
    const unit=NUTRITION_UNITS.includes(f.unit)?f.unit:null;
    const base=cleanMacros(f.base);
    if(!name||!unit||!base)return null;
    const out={id,name,unit,base:{kcal:roundTenth(base.kcal),p:roundTenth(base.p),c:roundTenth(base.c),f:roundTenth(base.f)}};
    const brand=cleanText(f.brand,80);if(brand)out.brand=brand;
    if(f.portion&&typeof f.portion==="object"){
      const label=cleanText(f.portion.label,40);
      const amount=Number(f.portion.amount);
      if(label&&unit==="portion")out.portion={label};
      else if(label&&Number.isFinite(amount)&&amount>0&&amount<=COMPONENT_AMOUNT_MAX[unit])out.portion={label,amount:roundTenth(amount)};
    }
    if(unit==="portion"&&!out.portion)out.portion={label:"1 porción"};
    const version=Number(f.version);out.version=Number.isInteger(version)&&version>0?version:1;
    const at=Date.parse(f.updatedAt);if(Number.isFinite(at))out.updatedAt=new Date(at).toISOString();
    return out;
  }
  function normalizedCustomFoods(list){
    const out=[],seen=new Set();
    (Array.isArray(list)?list:[]).forEach(item=>{
      const f=normalizeCustomFood(item);
      if(f&&!seen.has(f.id)&&out.length<CUSTOM_FOODS_MAX){seen.add(f.id);out.push(f);}
    });
    return out;
  }
  // Fusión entre dispositivos: unión por id, gana la versión más alta (o la más
  // reciente si empatan) y los borrados (lápidas) no resucitan.
  function mergeCustomFoods(serverList,localList,deletedIds){
    const deleted=new Set((Array.isArray(deletedIds)?deletedIds:[]).map(String));
    const byId=new Map();
    const take=f=>{
      if(!f||deleted.has(f.id))return;
      const prev=byId.get(f.id);
      if(!prev||f.version>prev.version||(f.version===prev.version&&(Date.parse(f.updatedAt)||0)>(Date.parse(prev.updatedAt)||0)))byId.set(f.id,f);
    };
    normalizedCustomFoods(serverList).forEach(take);
    normalizedCustomFoods(localList).forEach(take);
    return [...byId.values()].slice(0,CUSTOM_FOODS_MAX);
  }
  function customFoodLabel(f){return f.brand?`${f.name} (${f.brand})`:f.name;}
  function customFoodBaseLabel(f){return f.unit==="portion"?`por ${f.portion&&f.portion.label||"porción"}`:`por 100 ${f.unit==="100ml"?"ml":"g"}`;}

  const api={
    MEAL_VALUE_LIMITS,MEAL_NAME_MAX,
    parseNutrientInput,roundTenth,validateMealValues,
    NUTRITION_META_VERSION,normalizeNutritionMeta,nutritionMetaFor,finalizeNutritionMeta,
    metaComputedValues,sameMacros,nutritionMetaLabel,
    COMPONENTS_MAX,COMPONENT_AMOUNT_MAX,normalizeComponent,normalizeComponents,componentValues,componentsTotals,
    componentAmountLabel,componentsName,componentsSource,
    copyEntrySnapshot,
    CUSTOM_FOODS_MAX,CUSTOM_FOOD_DELETED_MAX,validateCustomFoodInput,normalizeCustomFood,normalizedCustomFoods,
    mergeCustomFoods,customFoodLabel,customFoodBaseLabel,
  };
  root.FITBUD_MEAL_LOG=api;
  Object.keys(api).forEach(key=>{root[key]=api[key];});
})(typeof window!=="undefined"?window:globalThis);
