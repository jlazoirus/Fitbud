import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

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

for(const exercise of catalog){
  if(ids.has(exercise.slug))errors.push(`Slug duplicado: ${exercise.slug}`);
  ids.add(exercise.slug);
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

// REQ-245: cada ejercicio de fuerza tiene músculo principal, y tanto los
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
for(const exercise of catalog)if(!Array.isArray(exercise.substitute_slugs))errors.push(`${exercise.slug}: substitute_slugs no es lista`);

const sql=fs.readFileSync(path.join(root,"supabase","exercises.sql"),"utf8");
for(const slug of ids){
  if(!sql.includes(`'${slug}'`))errors.push(`SQL no incluye ${slug}`);
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Catálogo válido: ${catalog.length} ejercicios y todas las rutinas usan IDs existentes.`);
