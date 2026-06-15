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

const sql=fs.readFileSync(path.join(root,"supabase","exercises.sql"),"utf8");
for(const slug of ids){
  if(!sql.includes(`'${slug}'`))errors.push(`SQL no incluye ${slug}`);
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Catálogo válido: ${catalog.length} ejercicios y todas las rutinas usan IDs existentes.`);
