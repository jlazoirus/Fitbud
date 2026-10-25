import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
import mediaMap from "./free-exercise-db-map.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const context={globalThis:{}};
context.window=context.globalThis;
vm.runInNewContext(fs.readFileSync(path.join(root,"exercise-catalog.js"),"utf8"),context);

const catalog=context.globalThis.FITBUD_EXERCISES||[];
const workouts=context.globalThis.FITBUD_WORKOUT_EXERCISES||{};
const required=[
  "slug","name","discipline","level","movement_pattern","start_position","steps",
  "breathing","common_errors","safety_signals","regression","progression",
  "contraindications","media_type","media_key","static_key","source_name","license_name",
];
const errors=[];
const ids=new Set();
const validLevels=new Set(["beginner","intermediate","advanced"]);

for(const exercise of catalog){
  if(ids.has(exercise.slug))errors.push(`Slug duplicado: ${exercise.slug}`);
  ids.add(exercise.slug);
  if(!validLevels.has(exercise.level))errors.push(`${exercise.slug}: nivel inválido o sin revisar`);
  for(const key of required){
    const value=exercise[key];
    if(value==null||value===""||(Array.isArray(value)&&!value.length))errors.push(`${exercise.slug}: falta ${key}`);
  }
  if(exercise.source_url&&/^https?:\/\//.test(exercise.source_url))errors.push(`${exercise.slug}: usa media externa`);
}

function visit(node,label){
  for(const [key,value] of Object.entries(node||{})){
    const next=label?`${label}.${key}`:key;
    if(Array.isArray(value)){
      if(!value.length)errors.push(`${next}: rutina sin ejercicios`);
      value.forEach(slug=>{if(!ids.has(slug))errors.push(`${next}: referencia inexistente ${slug}`);});
    }else visit(value,next);
  }
}
visit(workouts,"workouts");

// REQ-241: cada ejercicio de fuerza dice qué hacen "versión más fácil" y
// "progresión": otro ejercicio del mismo patrón (más fácil o más difícil según
// el nivel), una variante con nombre propio o solo la carga.
const variants=context.globalThis.FITBUD_EXERCISE_VARIANTS||{};
const LEVEL={beginner:0,intermediate:1,advanced:2};
const bySlug=new Map(catalog.map(exercise=>[exercise.slug,exercise]));
for(const exercise of catalog.filter(item=>!["walking","running","cycling","swimming"].includes(item.discipline))){
  const entry=variants[exercise.slug];
  if(!entry){errors.push(`${exercise.slug}: sin versión más fácil ni progresión definidas`);continue;}
  for(const direction of ["regression","progression"]){
    const v=entry[direction];
    if(!v||!["exercise","variant","load"].includes(v.kind)||!String(v.name||"").trim()){errors.push(`${exercise.slug}.${direction}: tipo o nombre inválido`);continue;}
    if(v.kind!=="exercise")continue;
    const target=bySlug.get(v.to);
    if(!target||target.slug===exercise.slug){errors.push(`${exercise.slug}.${direction}: destino inexistente ${v.to}`);continue;}
    if(target.movement_pattern!==exercise.movement_pattern)errors.push(`${exercise.slug}.${direction}: ${v.to} es de otro patrón`);
    const delta=(LEVEL[target.level]||0)-(LEVEL[exercise.level]||0);
    if(direction==="progression"?delta<0:delta>0)errors.push(`${exercise.slug}.${direction}: ${v.to} va en sentido contrario de nivel`);
  }
}
for(const slug of Object.keys(variants))if(!bySlug.has(slug))errors.push(`Variantes para slug inexistente: ${slug}`);

// REQ-247: cada ejercicio de fuerza tiene músculo principal, y tanto los
// sustitutos como las versiones más fácil/progresión trabajan ese mismo músculo.
const substitution=context.globalThis.FITBUD_EXERCISE_SUBSTITUTION;
const strength=catalog.filter(item=>!["walking","running","cycling","swimming"].includes(item.discipline));
for(const exercise of strength){
  if(!substitution.primaryMuscles[exercise.slug]){errors.push(`${exercise.slug}: sin músculo principal`);continue;}
  const muscle=substitution.primaryMuscle(exercise);
  for(const candidate of substitution.candidates(exercise,catalog)){
    if(substitution.primaryMuscle(candidate)!==muscle)errors.push(`${exercise.slug}: sustituto ${candidate.slug} trabaja otro músculo`);
  }
  for(const direction of ["regression","progression"]){
    const v=(variants[exercise.slug]||{})[direction];
    if(v&&v.kind==="exercise"&&bySlug.has(v.to)&&substitution.primaryMuscle(bySlug.get(v.to))!==muscle)errors.push(`${exercise.slug}.${direction}: ${v.to} trabaja otro músculo`);
  }
}
for(const slug of Object.keys(substitution.primaryMuscles))if(!bySlug.has(slug))errors.push(`Músculo principal para slug inexistente: ${slug}`);
const names=slug=>substitution.candidates(bySlug.get(slug),catalog).map(exercise=>exercise.slug);
const expect=(slug,includes,excludes)=>{
  const got=names(slug);
  includes.forEach(item=>{if(!got.includes(item))errors.push(`${slug}: debería poder sustituirse por ${item}`);});
  excludes.forEach(item=>{if(got.includes(item))errors.push(`${slug}: no debe sustituirse por ${item}`);});
};
expect("face-pull",[],["pull-up","assisted-pull-up","band-row","lat-pulldown","seated-cable-row"]);
expect("seated-cable-row",["band-row"],["lat-pulldown","assisted-pull-up","pull-up","face-pull"]);
expect("lat-pulldown",["assisted-pull-up","pull-up"],["band-row","seated-cable-row","face-pull"]);
expect("biceps-curl",["hammer-curl"],["band-row"]);
expect("triceps-pushdown",["diamond-push-up"],["assisted-dip","push-up"]);
expect("romanian-deadlift",["single-leg-rdl"],["barbell-hip-thrust"]);
expect("lateral-raise",[],["overhead-press"]);
// REQ-261: el buscador encuentra por nombre, alias o músculo, sin tildes, y
// nunca devuelve ejercicios de resistencia (caminar, correr…).
const search=query=>substitution.search(query,catalog).map(exercise=>exercise.slug);
if(search("press banca").join()!=="bench-press")errors.push(`Buscar "press banca": ${search("press banca").join()}`);
if(search("GLUTEO")[0]!=="barbell-hip-thrust"&&search("GLUTEO")[0]!=="glute-bridge")errors.push(`Buscar "GLUTEO" no empieza por un ejercicio de glúteo: ${search("GLUTEO")[0]}`);
if(search("caminata").length)errors.push(`Buscar "caminata" devuelve ejercicios de resistencia`);
if(search("").some(slug=>!["gym","strength","bodyweight"].includes(bySlug.get(slug).discipline)))errors.push("El buscador incluye ejercicios que no son de fuerza");
for(const exercise of catalog)if(!Array.isArray(exercise.substitute_slugs))errors.push(`${exercise.slug}: substitute_slugs no es lista`);

const sql=fs.readFileSync(path.join(root,"supabase","exercises.sql"),"utf8");
const levelSql=fs.readFileSync(path.join(root,"supabase","exercise-levels.sql"),"utf8");
const levelDoc=fs.readFileSync(path.join(root,"docs","exercise-levels.md"),"utf8");
const reviewedLevels=context.globalThis.FITBUD_REVIEWED_EXERCISE_LEVELS;
for(const slug of ids){
  if(!sql.includes(`'${slug}'`))errors.push(`SQL no incluye ${slug}`);
  const ex=bySlug.get(slug);
  const row=sql.split("\n").find(line=>line.trim().startsWith(`'${slug}',`));
  if(!row||!row.endsWith(`'${ex.level}',`))errors.push(`${slug}: nivel SQL base difiere del catálogo`);
  if(!levelSql.includes(`('${slug}', '${ex.level}')`))errors.push(`${slug}: falta nivel revisado en SQL incremental`);
  if(!levelDoc.includes(`\`${slug}\``))errors.push(`${slug}: falta justificación del nivel revisado`);
}
for(const [slug,level] of Object.entries(reviewedLevels)){
  if(!validLevels.has(level))errors.push(`${slug}: revisión con nivel inválido`);
  if(!levelSql.includes(`('${slug}', '${level}')`))errors.push(`${slug}: SQL incremental no coincide con revisión`);
  if(!levelDoc.includes(`\`${slug}\``))errors.push(`${slug}: falta justificación del nivel revisado`);
  if(context.globalThis.FITBUD_EXERCISE_CONTENT.normalize({slug,level:"beginner"}).level!==level)errors.push(`${slug}: no corrige nivel remoto antiguo`);
}

// REQ-264: el contenido revisado corrige filas antiguas sin mutar la BD ni
// convertir ejercicios propios sin nivel en ejercicios para principiantes.
const normalize=context.globalThis.FITBUD_EXERCISE_CONTENT.normalize;
const stale={...bySlug.get("pike-push-up"),level:"beginner",active:false,
  media_type:"image_sequence",media_url:"https://example.test/handstand.gif",
  frames:["handstand-0.jpg","handstand-1.jpg"],poster_url:"handstand.jpg"};
const original=JSON.stringify(stale),reviewed=normalize(stale);
if(reviewed.level!=="intermediate"||reviewed.active!==false)errors.push("Pike: no aplica nivel revisado o pisa estado administrativo");
if(JSON.stringify(stale)!==original)errors.push("La revisión muta la fila original");
if(reviewed.media_url!=="assets/exercise-media/pike-push-up.svg"||reviewed.frames.length)errors.push("Pike: conserva la demo antigua de handstand");
const custom={slug:"custom-exercise",name:"Ejercicio propio",level:"advanced",active:false};
if(JSON.stringify(normalize(custom))!==JSON.stringify(custom))errors.push("La revisión modifica un ejercicio propio");
if(normalize({slug:"unknown"}).level)errors.push("Ejercicio sin revisar hereda nivel por defecto");
for(const ex of catalog.filter(ex=>/assets\/exercise-media\/.+\.svg$/.test(ex.media_url||""))){
  if(mediaMap[ex.slug]?.id!==null)errors.push(`${ex.slug}: se puede reingerir una demo incorrecta`);
  const asset=path.join(root,ex.media_url);
  if(!fs.existsSync(asset)){errors.push(`${ex.slug}: falta demo revisada`);continue;}
  const svg=fs.readFileSync(asset,"utf8");
  if(!svg.includes("<title")||!svg.includes("<svg"))errors.push(`${ex.slug}: demo SVG sin título accesible`);
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Catálogo válido: ${catalog.length} fichas, ${Object.keys(reviewedLevels).length} niveles revisados y todas las rutinas usan IDs existentes.`);
