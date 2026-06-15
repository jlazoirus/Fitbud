import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const catalogPath=path.join(root,"exercise-catalog.js");
const outputPath=path.join(root,"supabase","exercises.sql");
const context={globalThis:{}};
context.window=context.globalThis;
vm.runInNewContext(fs.readFileSync(catalogPath,"utf8"),context,{filename:catalogPath});
const catalog=context.globalThis.FITBUD_EXERCISES;

if(!Array.isArray(catalog)||!catalog.length)throw new Error("Catálogo de ejercicios vacío.");

const text=value=>value==null?"null":`'${String(value).replaceAll("'","''")}'`;
const json=value=>`${text(JSON.stringify(value))}::jsonb`;
const bool=value=>value?"true":"false";
const rows=catalog.map(ex=>`(
  ${text(ex.slug)}, ${text(ex.name)}, ${json(ex.aliases)}, ${text(ex.discipline)}, ${text(ex.level)},
  ${json(ex.equipment)}, ${json(ex.places)}, ${json(ex.muscles)}, ${text(ex.movement_pattern)},
  ${text(ex.start_position)}, ${json(ex.steps)}, ${text(ex.breathing)}, ${json(ex.common_errors)},
  ${json(ex.safety_signals)}, ${text(ex.regression)}, ${text(ex.progression)}, ${json(ex.substitute_slugs)},
  ${json(ex.contraindications)}, ${text(ex.media_type)}, ${text(ex.media_key)}, ${text(ex.static_key)},
  ${text(ex.source_name)}, ${text(ex.source_url)}, ${text(ex.license_name)}, ${text(ex.attribution)}, ${bool(ex.active)}
)`).join(",\n");

const sql=`-- ============================================================
-- Fitbros - biblioteca de ejercicios y demostraciones (REQ-15)
-- Idempotente. Ejecuta despues de supabase/auth.sql.
--
-- Decision de contenido: produccion propia Fitbros. Las demostraciones
-- SVG procedimentales viven en la app; no se usan hotlinks ni media de
-- terceros. Recuperacion: archivar filas (active=false) o borrar la tabla
-- exercises si se necesita retirar por completo este catalogo.
-- ============================================================

create table if not exists exercises (
  id                  bigint generated always as identity primary key,
  slug                text not null unique,
  name                text not null,
  aliases             jsonb not null default '[]'::jsonb,
  discipline          text not null,
  level               text not null check (level in ('beginner','intermediate','advanced')),
  equipment           jsonb not null default '[]'::jsonb,
  places              jsonb not null default '[]'::jsonb,
  muscles             jsonb not null default '[]'::jsonb,
  movement_pattern    text not null,
  start_position      text not null,
  steps               jsonb not null default '[]'::jsonb,
  breathing           text not null,
  common_errors       jsonb not null default '[]'::jsonb,
  safety_signals      jsonb not null default '[]'::jsonb,
  regression          text not null,
  progression         text not null,
  substitute_slugs    jsonb not null default '[]'::jsonb,
  contraindications   jsonb not null default '[]'::jsonb,
  media_type          text not null default 'inline_svg',
  media_key           text not null,
  static_key          text not null,
  source_name         text not null,
  source_url          text,
  license_name        text not null,
  attribution         text,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint exercises_complete_check check (
    length(trim(name)) > 0
    and jsonb_array_length(steps) > 0
    and jsonb_array_length(safety_signals) > 0
    and length(trim(media_key)) > 0
    and length(trim(static_key)) > 0
    and length(trim(source_name)) > 0
    and length(trim(license_name)) > 0
  )
);

create index if not exists exercises_active_discipline_idx
  on exercises (active, discipline, level, name);

alter table exercises enable row level security;
drop policy if exists "read exercise catalog" on exercises;
drop policy if exists "admin write exercise catalog" on exercises;
create policy "read exercise catalog" on exercises
  for select to authenticated using (true);
create policy "admin write exercise catalog" on exercises
  for all to authenticated
  using (is_admin() and is_active())
  with check (is_admin() and is_active());

insert into exercises (
  slug,name,aliases,discipline,level,equipment,places,muscles,movement_pattern,
  start_position,steps,breathing,common_errors,safety_signals,regression,progression,
  substitute_slugs,contraindications,media_type,media_key,static_key,source_name,
  source_url,license_name,attribution,active
) values
${rows}
on conflict (slug) do update set
  name=excluded.name,
  aliases=excluded.aliases,
  discipline=excluded.discipline,
  level=excluded.level,
  equipment=excluded.equipment,
  places=excluded.places,
  muscles=excluded.muscles,
  movement_pattern=excluded.movement_pattern,
  start_position=excluded.start_position,
  steps=excluded.steps,
  breathing=excluded.breathing,
  common_errors=excluded.common_errors,
  safety_signals=excluded.safety_signals,
  regression=excluded.regression,
  progression=excluded.progression,
  substitute_slugs=excluded.substitute_slugs,
  contraindications=excluded.contraindications,
  media_type=excluded.media_type,
  media_key=excluded.media_key,
  static_key=excluded.static_key,
  source_name=excluded.source_name,
  source_url=excluded.source_url,
  license_name=excluded.license_name,
  attribution=excluded.attribution,
  active=excluded.active,
  updated_at=now();
`;

fs.writeFileSync(outputPath,sql);
console.log(`Generado ${path.relative(root,outputPath)} con ${catalog.length} ejercicios.`);
