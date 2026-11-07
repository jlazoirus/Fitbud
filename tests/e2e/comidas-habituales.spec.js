// REQ-360: tras una semana de registros, "Preparar mi semana" repite lo que el
// usuario come en cada franja los días que llega a su meta (si siempre desayuna
// lo mismo, se le sugiere lo mismo). Red simulada (el coach responde con el mock
// de helpers.js); cero llamadas pagadas.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, completePrefs, daysFromToday, USER_ID, collectConsoleErrors } from "./helpers.js";

const dish=(id,name,slug,slots)=>({id,name,slug,compatible_slots:slots,slot:slots[0],diet_tags:["omnivoro","vegetariano","vegano"],meal_weight:"light",meal_form:"bowl",needs_kitchen:false,cooking_minutes:5});
const all=["desayuno","almuerzo","cena"];
const dishes=[
  dish(101,"Yogur con plátano","yogur-platano",all),
  dish(102,"Avena con plátano y almendras","avena-platano",all),
  dish(103,"Pollo con arroz y brócoli","pollo-arroz",["almuerzo","cena"]),
  dish(104,"Atún con papa y palta","atun-papa",["almuerzo","cena"]),
  dish(105,"Fruta con almendras","fruta-almendras",all),
  dish(106,"Avena con palta","avena-palta",all),
];
const recipes={101:[[3,200],[9,100]],102:[[7,80],[9,100],[12,30]],103:[[1,180],[6,200],[13,100],[10,10]],104:[[2,180],[8,220],[11,60]],105:[[9,160],[12,60]],106:[[7,100],[11,80]]};
const lines=Object.entries(recipes).flatMap(([id,ings])=>ings.map(([ingredient_id,grams])=>({dish_id:+id,ingredient_id,grams,scalable:true,min_g:5,max_g:600,step_g:5})));
const byId=id=>dishes.find(d=>d.id===id);
// Comida registrada con los macros que el usuario anotó ese día.
const eaten=(id,kcal,p,c,f)=>({done:true,ovr:{name:byId(id).name,kcal,p,c,f,gen:true,dishSlug:byId(id).slug,ingredientes:[]}});
const row=(date,meals)=>({user_id:USER_ID,log_date:date,state:{meals,extras:[],workoutDone:false},updated_at:"2026-01-01T00:00:00Z"});
// Meta del perfil de prueba: 2200 kcal / 160 g proteína.
function history({onTarget=true}={}){
  const lunches=[103,104,105];
  return Array.from({length:7},(_,i)=>row(daysFromToday(-(i+1)),{
    desayuno:eaten(106,600,45,60,20),
    almuerzo:eaten(lunches[i%3],onTarget?850:400,onTarget?65:30,90,25),
    cena:eaten(103,onTarget?750:300,onTarget?55:20,70,20),
  }));
}

async function boot(page,context,opts={}){
  const prompts=[],errors=collectConsoleErrors(page);
  page.on("request",r=>{if(r.url().includes("/api/claude")){try{prompts.push(JSON.stringify(r.postDataJSON()));}catch(_){prompts.push("");}}});
  const prefs=completePrefs({planStartDate:daysFromToday(-8),planDurationWeeks:4,planEndDate:daysFromToday(19),diet:["omnivoro"],...opts.prefs});
  await installMocks(context,{prefs,tables:{dishes:{rows:dishes},dish_ingredients:{rows:lines},day_log:{rows:opts.days||[]},plan_versions:{rows:[]}}});
  await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);
  await expect.poll(()=>page.evaluate(()=>nutritionReadyUser===uid()&&!_authBusy&&DB.loaded)).toBe(true);
  // Sin coach: la semana sale del motor local del catálogo.
  if(opts.offlineCoach)await page.evaluate(()=>{window.aiAvailable=()=>false;});
  return{prompts,errors};
}
async function prepareWeek(page){
  await page.locator('[data-tab="nutricion"]').click();
  await page.locator(".nutrition-week").getByRole("button",{name:"Preparar mi semana",exact:true}).click();
  await expect(page.locator('#genwOut button[onclick="applyWeekPlan()"]')).toBeVisible();
  return page.evaluate(()=>window._genWeek.daysData.map(d=>(d.comidas.find(c=>c.slot_id==="desayuno")||{}).nombre));
}

for(const [width,offlineCoach] of [[320,true],[390,false],[1280,true]])test(`una semana en meta con el mismo desayuno: se sugiere ese desayuno (${width}px, ${offlineCoach?"motor local":"coach"})`,async({page,context})=>{
  await page.setViewportSize({width,height:900});
  const {prompts,errors}=await boot(page,context,{days:history(),offlineCoach});
  const learned=await page.evaluate(()=>habitualMealsForGeneration());
  expect(learned.ready).toBe(true);
  expect(learned.bySlot.desayuno.nombre).toBe("Avena con palta");
  expect(learned.bySlot.almuerzo).toBeUndefined();
  const breakfasts=await prepareWeek(page);
  expect(breakfasts.length).toBeGreaterThan(0);
  expect(new Set(breakfasts)).toEqual(new Set(["Avena con palta"]));
  await expect(page.locator('#genwOut [data-habit="1"]').first()).toBeVisible();
  await expect(page.locator("#genwOut")).toContainText("Lo que sueles comer");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(process.env.CAPTURE_HABITS)await page.screenshot({path:`/tmp/req-360-habitos-${width}.png`,fullPage:false});
  await page.locator('#genwOut button[onclick="applyWeekPlan()"]').click();
  await expect(page.locator("#overlay")).toHaveCount(0);
  const tomorrow=daysFromToday(1);
  expect(await page.evaluate(ds=>mealValue(buildDay(ds).meals.find(m=>m.id==="desayuno"),mealState(ds,"desayuno")).name,tomorrow)).toBe("Avena con palta");
  // Lo ya registrado no cambia.
  expect(await page.evaluate(ds=>mealState(ds,"almuerzo").ovr.kcal,daysFromToday(-1))).toBe(850);
  if(offlineCoach)expect(prompts).toEqual([]);
  else{
    // El coach recibe el desayuno habitual como base y ya no lo ve entre las comidas a no repetir.
    expect(prompts.length).toBeGreaterThan(0);
    const dayPrompt=prompts.find(p=>p.includes("Comidas de días recientes a NO repetir"));
    expect(dayPrompt).toContain("desayuno: Avena con palta");
    expect(dayPrompt.split("NO repetir:")[1].split("\\n")[0]).not.toContain("Avena con palta");
  }
  expect(errors).toEqual([]);
});

test("los días que no llegaron a la meta no enseñan hábitos",async({page,context})=>{
  const {prompts,errors}=await boot(page,context,{days:history({onTarget:false}),offlineCoach:true});
  const learned=await page.evaluate(()=>habitualMealsForGeneration());
  expect(learned.ready).toBe(false);
  expect(learned.qualifiedDays).toBe(0);
  await prepareWeek(page);
  await expect(page.locator('#genwOut [data-habit="1"]')).toHaveCount(0);
  expect(prompts).toEqual([]);expect(errors).toEqual([]);
});

test("menos de una semana de registros todavía no repite comidas",async({page,context})=>{
  const {errors}=await boot(page,context,{days:history().slice(0,5)});
  expect(await page.evaluate(()=>habitualMealsForGeneration().ready)).toBe(false);
  expect(errors).toEqual([]);
});

test("una restricción nueva manda sobre el desayuno habitual",async({page,context})=>{
  const {prompts,errors}=await boot(page,context,{days:history(),prefs:{dislikedIngredients:"palta"},offlineCoach:true});
  expect(await page.evaluate(()=>habitualBySlotForPrefs(migrateProfilePrefs(profile.prefs))&&habitualBySlotForPrefs(migrateProfilePrefs(profile.prefs)).desayuno)).toBeFalsy();
  const breakfasts=await prepareWeek(page);
  expect(breakfasts).not.toContain("Avena con palta");
  // La cena de siempre (sin palta) sigue siendo habitual; el desayuno con palta ya no.
  expect(await page.evaluate(()=>window._genWeek.daysData.every(d=>!(d.comidas.find(c=>c.slot_id==="desayuno")||{}).habit))).toBe(true);
  expect(await page.evaluate(()=>window._genWeek.daysData.every(d=>(d.comidas.find(c=>c.slot_id==="cena")||{}).nombre==="Pollo con arroz y brócoli"))).toBe(true);
  expect(prompts).toEqual([]);expect(errors).toEqual([]);
});
