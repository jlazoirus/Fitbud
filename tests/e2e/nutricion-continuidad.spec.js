import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, completePrefs, daysFromToday, todayYmd, SUPA_URL, USER_ID, collectConsoleErrors } from "./helpers.js";

const today=todayYmd(),tomorrow=daysFromToday(1),yesterday=daysFromToday(-1);
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
const entry=(id=101)=>({name:dishes.find(d=>d.id===id).name,kcal:450,p:25,c:50,f:16,gen:true,dishSlug:dishes.find(d=>d.id===id).slug,ingredientes:recipes[id].map(([i,g])=>({nombre:({1:"Pechuga de pollo",2:"Atún en agua",3:"Yogur griego 0%",6:"Arroz blanco cocido",7:"Avena",8:"Papa cocida",9:"Plátano",10:"Aceite de oliva",11:"Palta",12:"Almendras",13:"Brócoli"})[i],gramos:g}))});
const state=(meals={})=>({meals,extras:[],workoutDone:false});
const row=(date,meals)=>({user_id:USER_ID,log_date:date,state:state(meals),updated_at:"2026-01-01T00:00:00Z"});

async function boot(page,context,opts={}){
  const paid=[],errors=collectConsoleErrors(page);
  page.on("request",r=>{if(r.url().includes("/api/claude"))paid.push(r.url());});
  const prefs=completePrefs({planStartDate:daysFromToday(-7),planDurationWeeks:4,planEndDate:daysFromToday(20),diet:["omnivoro"],...opts.prefs});
  const mocks=await installMocks(context,{prefs,tables:{dishes:{rows:opts.onlyDairy?[dishes[0]]:dishes},dish_ingredients:{rows:lines},day_log:{rows:opts.days||[]},plan_versions:{rows:opts.versions||[]}}});
  let saved=prefs;
  await context.route(`${SUPA_URL}/rest/v1/profiles**`,async route=>{
    const req=route.request();
    if(req.method()!=="GET"){
      const payload=req.postDataJSON();mocks.calls.push({table:"profiles",method:req.method(),payload});
      saved=payload.prefs||saved;
    }
    const profile={...mocks.tables.profiles.row,prefs:saved};
    await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(req.headers().accept?.includes("vnd.pgrst.object")?profile:[profile])});
  });
  await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);
  await expect.poll(()=>page.evaluate(()=>nutritionReadyUser===uid()&&!_authBusy)).toBe(true);
  return{...mocks,paid,errors,saved:()=>saved};
}

for(const width of [320,390,1280])test(`preparación semanal visible y opcional (${width}px)`,async({page,context})=>{
  await page.setViewportSize({width,height:900});
  const {paid,errors}=await boot(page,context);
  await page.locator('[data-tab="nutricion"]').click();
  const weekly=page.locator(".nutrition-week");
  await expect(weekly.getByRole("button",{name:"Preparar mi semana",exact:true})).toBeVisible();
  await expect(weekly).toContainText("Semana 2");
  await expect(weekly.getByRole("checkbox")).not.toBeChecked();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await weekly.getByRole("button").evaluate(b=>b.getBoundingClientRect().bottom<innerHeight)).toBe(true);
  if(process.env.CAPTURE_NUTRITION_CONTINUITY)await page.screenshot({path:`/tmp/req-349-nutricion-${width}.png`,fullPage:true});
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("guardar sin lácteos repara pendientes y conserva consumo, pasado, saltadas y elecciones compatibles",async({page,context})=>{
  const done={done:true,ovr:entry()},skip={done:false,skipped:true,ovr:entry()};
  const days=[row(yesterday,{desayuno:done}),row(today,{desayuno:done,almuerzo:{done:false,ovr:{...entry(),name:"Bowl de fruta",userSet:true}},cena:skip}),row(tomorrow,{desayuno:{done:false,ovr:entry()},almuerzo:{done:false,ovr:{...entry(103),userSet:true}}})];
  const {paid,errors,saved}=await boot(page,context,{days});
  const before=await page.evaluate(d=>JSON.stringify({past:dayState(d.yesterday),done:mealState(d.today,"desayuno"),skip:mealState(d.today,"cena"),chosen:mealState(d.tomorrow,"almuerzo")}),{today,tomorrow,yesterday});
  await page.locator('[data-tab="perfil"]').click();await page.locator("#pfSecComidas > summary").click();
  await page.check("#pf_diet_sin_lacteos");await page.locator("#profileSaveFloat button").click();
  await expect(page.locator(".nutrition-update")).toContainText("Actualizamos 2 comidas pendientes");
  if(process.env.CAPTURE_NUTRITION_CONTINUITY)await page.screenshot({path:"/tmp/req-349-preferencias.png",fullPage:true});
  expect(saved().diet).toEqual(expect.arrayContaining(["omnivoro","sin_lacteos"]));
  const after=await page.evaluate(d=>JSON.stringify({past:dayState(d.yesterday),done:mealState(d.today,"desayuno"),skip:mealState(d.today,"cena"),chosen:mealState(d.tomorrow,"almuerzo")}),{today,tomorrow,yesterday});
  expect(after).toBe(before);
  expect(await page.evaluate(()=>nutritionFutureDates().every(ds=>buildDay(ds).meals.every(m=>{const ms=mealState(ds,m.id);return ms.done||ms.skipped||!FITBUD_NUTRITION_DOMAIN.mealPreferenceConflict(nutritionMealEntry(buildDay(ds),m),profile.prefs,DB);} )))).toBe(true);
  await gotoApp(page);
  expect(await page.evaluate(()=>profile.prefs.diet.includes("sin_lacteos"))).toBe(true);
  expect(await page.evaluate(()=>mealState(todayStr(),"almuerzo").ovr.name)).not.toMatch(/yogur/i);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("rechazar tres platos sustituye sin vacíos y Deshacer respeta cambios posteriores",async({page,context})=>{
  const {paid,errors,saved}=await boot(page,context,{days:[row(today,{desayuno:{done:false,ovr:entry()},almuerzo:{done:false,ovr:entry(103)},cena:{done:false,ovr:entry(104)}}),row(tomorrow,{desayuno:{done:false,ovr:entry()}})]});
  await page.locator('[data-tab="nutricion"]').click();
  const rejected=[];
  for(let i=0;i<3;i++){
    rejected.push(await page.evaluate(()=>mealValue(buildDay(todayStr()).meals.find(m=>m.id==="desayuno"),mealState(todayStr(),"desayuno")).name));
    await page.getByRole("button",{name:/^Más opciones de desayuno$/i}).click();
    await page.getByRole("button",{name:/No me gusta este plato/}).click();
    await expect(page.locator("#overlay")).toHaveCount(0);
    await expect(page.locator(".nutrition-update")).toContainText("Actualizamos");
    const feedback=await page.locator(".nutrition-update").boundingBox();
    expect(feedback.y).toBeGreaterThanOrEqual(0);expect(feedback.y+feedback.height).toBeLessThan(900);
    const value=await page.evaluate(()=>mealValue(buildDay(todayStr()).meals.find(m=>m.id==="desayuno"),mealState(todayStr(),"desayuno")));
    expect(value.name).toBeTruthy();expect(rejected).not.toContain(value.name);
  }
  expect(saved().blockedDishes).toHaveLength(3);
  if(process.env.CAPTURE_NUTRITION_CONTINUITY)await page.screenshot({path:"/tmp/req-349-rechazo.png",fullPage:true});
  const eaten=await page.evaluate(()=>{mealState(todayStr(),"desayuno").done=true;commitDay(todayStr());return JSON.stringify(mealState(todayStr(),"desayuno"));});
  await page.locator(".nutrition-update").getByRole("button",{name:"Deshacer",exact:true}).click();
  await expect(page.locator(".nutrition-update")).toContainText("Deshicimos");
  expect(await page.evaluate(()=>JSON.stringify(mealState(todayStr(),"desayuno")))).toBe(eaten);
  expect(saved().blockedDishes).toHaveLength(2);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("sin alternativas explica el hueco, persiste y permite registrar lo realmente comido",async({page,context})=>{
  const {paid,errors}=await boot(page,context,{onlyDairy:true,prefs:{diet:["omnivoro","sin_lacteos"]},days:[row(today,{desayuno:{done:false,ovr:entry()}})]});
  await page.locator('[data-tab="nutricion"]').click();
  await expect(page.locator("#app")).toContainText("Sin alternativa compatible");
  await expect(page.locator("#app")).toContainText("Tus restricciones siguen activas");
  if(process.env.CAPTURE_NUTRITION_CONTINUITY)await page.screenshot({path:"/tmp/req-349-sin-alternativa.png",fullPage:true});
  await gotoApp(page);await page.locator('[data-tab="nutricion"]').click();
  await page.getByRole("button",{name:"Registrar lo que comí",exact:true}).first().click();
  await page.locator("#f_name").fill("Mi desayuno real");
  for(const [id,value]of Object.entries({f_kcal:"400",f_p:"20",f_c:"40",f_f:"10"}))await page.locator("#"+id).fill(value);
  await page.locator("#overlay").getByRole("button",{name:"Guardar",exact:true}).click();
  expect(await page.evaluate(()=>mealState(todayStr(),"desayuno").done)).toBe(true);
  expect(await page.evaluate(()=>dayTotals(todayStr()).t.kcal)).toBe(400);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("renovación opcional completa tras desayunar, persiste sin duplicados y permite desactivar",async({page,context})=>{
  const {paid,errors,saved,calls}=await boot(page,context,{days:[row(today,{desayuno:{done:true,ovr:entry()},almuerzo:{done:false,ovr:{...entry(103),userSet:true}}})]});
  const eaten=await page.evaluate(()=>JSON.stringify(mealState(todayStr(),"desayuno")));
  await page.locator('[data-tab="nutricion"]').click();
  await page.locator(".nutrition-week").getByRole("checkbox").check();
  await expect.poll(()=>page.evaluate(()=>nutritionWeekStatus(todayStr()).missing.length)).toBe(0);
  expect(saved().autoNutritionWeeks).toBe(true);
  expect(await page.evaluate(()=>JSON.stringify(mealState(todayStr(),"desayuno")))).toBe(eaten);
  expect(await page.evaluate(()=>mealState(todayStr(),"almuerzo").ovr.userSet)).toBe(true);
  const versions=calls.filter(c=>c.table==="plan_versions"&&c.payload?.source==="nutrition").length;
  await gotoApp(page);await page.locator('[data-tab="nutricion"]').click();
  await expect(page.locator(".nutrition-week").getByRole("checkbox")).toBeChecked();
  expect(calls.filter(c=>c.table==="plan_versions"&&c.payload?.source==="nutrition").length).toBe(versions);
  await page.locator(".nutrition-week").getByRole("checkbox").uncheck();
  await expect.poll(()=>saved().autoNutritionWeeks).toBe(false);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("al volver en la siguiente semana la prepara una sola vez",async({page,context})=>{
  await page.clock.install({time:new Date()});
  const {paid,errors,calls}=await boot(page,context,{prefs:{autoNutritionWeeks:true}});
  await expect.poll(()=>page.evaluate(()=>nutritionWeekStatus(todayStr()).missing.length)).toBe(0);
  await expect.poll(()=>page.evaluate(()=>nutritionUpdating)).toBe(false);
  const first=calls.filter(c=>c.table==="plan_versions"&&c.payload?.source==="nutrition").length;
  await page.clock.setFixedTime(new Date(Date.now()+7*86400000));
  await page.evaluate(()=>document.dispatchEvent(new Event("visibilitychange")));
  await expect.poll(()=>page.evaluate(()=>nutritionWeekStatus(todayStr()).missing.length)).toBe(0);
  await expect.poll(()=>calls.filter(c=>c.table==="plan_versions"&&c.payload?.source==="nutrition").length).toBe(first+1);
  await page.evaluate(()=>{render();document.dispatchEvent(new Event("visibilitychange"));});
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("fallo al guardar un rechazo no cambia preferencias ni comidas",async({page,context})=>{
  const {errors}=await boot(page,context,{days:[row(today,{desayuno:{done:false,ovr:entry()}})]});
  await context.route(`${SUPA_URL}/rest/v1/profiles**`,route=>route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({message:"Sin conexión"})}));
  await page.locator('[data-tab="nutricion"]').click();
  await page.getByRole("button",{name:/^Más opciones de desayuno$/i}).click();
  const before=await page.evaluate(()=>JSON.stringify({prefs:profile.prefs,days:S.days}));
  await page.getByRole("button",{name:/No me gusta este plato/}).click();
  await expect(page.locator("#toast")).toContainText("No se pudo bloquear");
  expect(await page.evaluate(()=>JSON.stringify({prefs:profile.prefs,days:S.days}))).toBe(before);
  expect(errors).toEqual([expect.stringMatching(/^Failed to load resource:.*503/)]);
});

test("borradores antiguos no reintroducen ingredientes excluidos",async({page,context})=>{
  await boot(page,context,{prefs:{diet:["omnivoro","sin_lacteos"]}});
  const result=await page.evaluate(()=>{
    const x={slot_id:"desayuno",nombre:"Yogur con plátano",ingredientes:[{nombre:"Yogur griego 0%",gramos:200}],kcal:450,proteina_g:25,carbohidratos_g:50,grasa_g:16};
    window._genDay={ds:todayStr(),comidas:[x]};applyGeneratedDay();
    return{value:mealValue(buildDay(todayStr()).meals[0],mealState(todayStr(),"desayuno")),draft:window._genDay};
  });
  expect(result.value.name).toBeFalsy();expect(result.draft).toBe(null);
});

test("preparar semana a mano incluye las comidas pendientes del día parcialmente registrado",async({page,context})=>{
  const {errors}=await boot(page,context,{days:[row(today,{desayuno:{done:true,ovr:entry()}})]});
  const before=await page.evaluate(()=>JSON.stringify(mealState(todayStr(),"desayuno")));
  await page.locator('[data-tab="nutricion"]').click();
  await page.locator(".nutrition-week").getByRole("button",{name:"Preparar mi semana",exact:true}).click();
  await page.locator('#genwOut button[onclick="applyWeekPlan()"]').click();
  await expect(page.locator("#overlay")).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.stringify(mealState(todayStr(),"desayuno")))).toBe(before);
  expect(await page.evaluate(()=>["almuerzo","cena"].every(id=>mealHasContent(mealValue(buildDay(todayStr()).meals.find(m=>m.id===id),mealState(todayStr(),id)))))).toBe(true);
  expect(errors).toEqual([]);
});

test("sin conexión espera y al reconectar completa sin llamadas pagadas",async({page,context})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,"onLine",{configurable:true,get:()=>false}));
  const {paid,errors}=await boot(page,context,{prefs:{autoNutritionWeeks:true}});
  expect(await page.evaluate(()=>nutritionWeekStatus(todayStr()).missing.length)).toBe(7);
  await page.evaluate(()=>{Object.defineProperty(navigator,"onLine",{configurable:true,get:()=>true});window.dispatchEvent(new Event("online"));});
  await expect.poll(()=>page.evaluate(()=>nutritionWeekStatus(todayStr()).missing.length)).toBe(0);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("una respuesta de guardado de la cuenta anterior no activa menús en otra cuenta",async({page,context})=>{
  const {paid,calls,errors}=await boot(page,context);
  let complete,requested=false;
  const responseReady=new Promise(resolve=>{complete=resolve;});
  await context.route(`${SUPA_URL}/rest/v1/profiles**`,async route=>{
    requested=true;await responseReady;
    await route.fulfill({status:200,contentType:"application/json",body:"[]"});
  });
  await page.locator('[data-tab="nutricion"]').click();
  await page.locator(".nutrition-week").getByRole("checkbox").check();
  await expect.poll(()=>requested).toBe(true);
  await page.evaluate(()=>{session.user.id="other-account";});complete();
  await expect.poll(()=>page.evaluate(()=>nutritionUpdating)).toBe(false);
  expect(await page.evaluate(()=>profile.prefs.autoNutritionWeeks===true)).toBe(false);
  expect(await page.evaluate(()=>nutritionUpdateHtml())).toBe("");
  expect(calls.filter(c=>c.table==="day_log"&&c.method==="POST")).toEqual([]);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("rechazo en borrador sustituye también apariciones futuras y permite deshacer",async({page,context})=>{
  await boot(page,context,{days:[row(tomorrow,{desayuno:{done:false,ovr:entry()}})]});
  const original=await page.evaluate(()=>{
    const day=buildDay(todayStr());
    const comidas=day.meals.map(m=>({slot_id:m.id,nombre:"Yogur con plátano",ingredientes:[{nombre:"Yogur griego 0%",gramos:200},{nombre:"Plátano",gramos:100}],kcal:450,proteina_g:25,carbohidratos_g:50,grasa_g:16}));
    window._genDay={ds:todayStr(),comidas};modal('<div id="genOut"></div>');
    document.querySelector("#genOut").innerHTML=genReviewHtml(validateGeneratedDay({comidas},day,effectiveDayTarget()),effectiveDayTarget());
    return JSON.stringify(comidas);
  });
  await page.locator("#genOut").getByRole("button",{name:"🚫 No me gusta",exact:true}).first().click();
  await expect(page.locator("#genOut .nutrition-update")).toContainText("Actualizamos");
  expect(await page.evaluate(ds=>mealState(ds,"desayuno").ovr.name,tomorrow)).not.toMatch(/yogur/i);
  await page.locator("#genOut .nutrition-update").getByRole("button",{name:"Deshacer",exact:true}).click();
  await expect(page.locator("#genOut .nutrition-update")).toContainText("Deshicimos");
  expect(await page.evaluate(()=>JSON.stringify(window._genDay.comidas))).toBe(original);
  expect(await page.evaluate(ds=>mealState(ds,"desayuno").ovr.name,tomorrow)).toBe("Yogur con plátano");
});

test("repara prescripción sin overrides y versionar contenido idéntico no lo duplica",async({page,context})=>{
  const meals=[{id:"desayuno",slot:"desayuno",dishName:"Bowl de fruta",ingredients:[{name:"Yogur griego 0%",grams:200},{name:"Plátano",grams:100}],macros:{kcal:450,p:25,c:50,f:16}}];
  const version={id:500,user_id:USER_ID,version_key:"snapshot-anterior",version_number:1,cycle_number:1,status:"active",source:"nutrition",valid_from:yesterday,valid_to:tomorrow,
    snapshot:{nutritionPlan:{days:[{date:today,meals},{date:tomorrow,meals}]}}};
  const {calls,paid,errors}=await boot(page,context,{prefs:{diet:["omnivoro","sin_lacteos"]},versions:[version]});
  expect(await page.evaluate(()=>mealState(todayStr(),"desayuno").ovr.name)).not.toBe("Bowl de fruta");
  const count=()=>calls.filter(c=>c.table==="plan_versions"&&c.payload?.source==="nutrition").length;
  const before=count();expect(before).toBe(1);
  await page.evaluate(async()=>{await persistNutritionEdits();await persistNutritionEdits();});
  expect(count()).toBe(before);
  expect(calls.filter(c=>c.table==="day_log"&&c.method==="POST").every(c=>c.payload.user_id===USER_ID&&c.payload.log_date>=today)).toBe(true);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});
