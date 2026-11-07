import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors, screeningFixture, startGuidedSession } from "./helpers.js";

async function boot(page, context, opts={}) {
  const paid=[];
  page.on("request", req=>{if(req.url().includes("/api/claude"))paid.push(req.postData());});
  const errors=collectConsoleErrors(page);
  const mocks=await installMocks(context,opts);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  return {...mocks,paid,errors};
}

for(const width of [320,390,1280]) test(`Hoy prioriza registro, entreno y coach sin menú (${width}px)`,async({page,context})=>{
  await page.setViewportSize({width,height:900});
  const {paid,errors}=await boot(page,context);
  const app=page.locator("#app"),suggestion=app.locator(".menu-suggestion");
  const primary=app.locator(".home-primary");
  const agenda=app.locator(".home-agenda");
  await expect(primary.locator(".btn-accent")).toHaveText("Registrar comida");
  await expect(primary.getByRole("button",{name:"Ver entreno",exact:true})).toBeInViewport();
  await expect(agenda).toHaveJSProperty("open",false);
  await expect(agenda.locator(".home-agenda-count")).toHaveText("1 pendiente");
  await expect(agenda.getByRole("button",{name:"Iniciar entreno",exact:true})).toHaveCount(0);
  await agenda.locator("summary").press("Enter");
  await expect(agenda.getByRole("button",{name:"Iniciar entreno",exact:true})).toBeVisible();
  await agenda.locator("summary").press("Space");
  await expect(agenda).toHaveJSProperty("open",false);
  await expect(suggestion).toContainText("Tú eliges si lo usas");
  await expect(suggestion.getByRole("button",{name:"Sugerirme un menú"})).not.toHaveClass(/btn-accent/);
  await expect(app).not.toContainText("Aún falta preparar");
  await expect(app).not.toContainText("Afina tu plan");
  const layout=await page.evaluate(()=>{
    const selectors=[".home-consumption",".home-primary",".home-agenda",".coach-welcome","#coachInput",".menu-suggestion"];
    const boxes=selectors.map(s=>document.querySelector(s).getBoundingClientRect());
    return {ordered:boxes.every((b,i)=>!i||b.top>=boxes[i-1].bottom),overflow:document.documentElement.scrollWidth>innerWidth,
      controls:[...document.querySelectorAll(".home-consumption,.home-primary button,.home-agenda summary,.menu-suggestion button")].map(b=>b.getBoundingClientRect().height)};
  });
  expect(layout.ordered).toBe(true);expect(layout.overflow).toBe(false);
  expect(layout.controls.every(h=>h>=44)).toBe(true);
  if(process.env.CAPTURE_OPTIONAL_MENU){
    await page.screenshot({path:`/tmp/req-316-hoy-${width}.png`,fullPage:true});
    await suggestion.scrollIntoViewIfNeeded();
    await page.screenshot({path:`/tmp/req-316-suggestion-${width}.png`});
  }
  await app.getByRole("button",{name:/Ver consumo/}).click();
  await expect(app.locator(".mini-macro-dash")).toContainText("Proteínas");
  await expect(app.locator(".nut-setup")).toHaveClass(/is-collapsed/);
  if(process.env.CAPTURE_OPTIONAL_MENU){
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`/tmp/req-316-nutrition-${width}.png`});
  }
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("Registrar comida guarda y suma el consumo sin generar un menú",async({page,context})=>{
  const {paid,errors,calls}=await boot(page,context);
  const workoutBefore=await page.evaluate(()=>JSON.stringify(effectiveWorkout(todayStr())));
  await page.getByRole("button",{name:"Registrar comida",exact:true}).click();
  const overlay=page.locator("#overlay");
  await expect(overlay.locator("h3")).toHaveText("Registrar comida");
  await expect(overlay.locator("#f_target")).toHaveValue("desayuno");
  await expect(overlay).toContainText("Una comida del día");
  await page.locator("#f_name").fill("Mi desayuno con avena");
  for(const [id,value] of Object.entries({f_kcal:"400",f_p:"25",f_c:"45",f_f:"13"}))await page.locator("#"+id).fill(value);
  await overlay.getByRole("button",{name:"Guardar",exact:true}).click();
  await expect(overlay).toHaveCount(0);
  await expect(page.locator(".home-consumption")).toContainText("400/2200 kcal");
  await expect(page.locator(".home-consumption")).toContainText("1/3 comidas");
  await expect(page.locator(".menu-suggestion")).toHaveCount(0);
  // Los slots sin contenido no se presentan como comidas pendientes.
  await expect(page.locator(".agenda-item.kind-meal")).toHaveCount(0);
  await expect(page.locator(".home-agenda-count")).toHaveText("1 pendiente");
  await expect.poll(()=>Promise.resolve(calls.filter(c=>c.table==="day_log"&&c.method==="POST").length)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>({done:mealState(todayStr(),"desayuno").done,extras:dayState(todayStr()).extras.length}))).toEqual({done:true,extras:0});
  expect(await page.evaluate(()=>JSON.stringify(effectiveWorkout(todayStr())))).toBe(workoutBefore);
  await page.getByRole("button",{name:"Registrar comida",exact:true}).click();
  await expect(page.locator("#f_target")).toHaveValue("almuerzo");
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("Ahora no persiste por cuenta y por día, sin quitar la opción de Nutrición",async({page,context})=>{
  const {paid,errors}=await boot(page,context);
  const stateBefore=await page.evaluate(()=>JSON.stringify(dayState(todayStr())));
  await page.locator(".menu-suggestion").getByRole("button",{name:"Ahora no",exact:true}).click();
  await expect(page.locator(".menu-suggestion")).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Registrar comida",exact:true})).toBeFocused();
  expect(await page.evaluate(()=>JSON.stringify(dayState(todayStr())))).toBe(stateBefore);
  await gotoApp(page);
  await expect(page.locator(".menu-suggestion")).toHaveCount(0);
  await page.locator('[data-tab="nutricion"]').click();
  await expect(page.locator(".nut-setup").getByRole("button",{name:"Sugerirme un menú"})).toBeVisible();
  await expect(page.locator("#app")).not.toContainText("Prepara tu día");
  await page.getByRole("button",{name:"Registrar Almuerzo",exact:true}).click();
  await expect(page.locator("#f_target")).toHaveValue("almuerzo");
  await page.locator("#overlay").getByRole("button",{name:"Cerrar",exact:true}).last().click();
  const isolated=await page.evaluate(()=>{
    const ds=todayStr(),before=session.user.id;
    session.user.id="other-user";const other=menuSuggestionDismissed(ds);session.user.id=before;
    return {other,today:menuSuggestionDismissed(ds),tomorrow:menuSuggestionDismissed(addDays(ds,1)),value:localStorage.getItem(menuSuggestionKey())};
  });
  expect(isolated.other).toBe(false);expect(isolated.today).toBe(true);expect(isolated.tomorrow).toBe(false);
  expect(isolated.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("La sugerencia solo genera al elegirla y aplica el menú con confirmación",async({page,context})=>{
  const {paid,errors}=await boot(page,context);
  const before=await page.evaluate(()=>JSON.stringify(dayState(todayStr())));
  expect(paid).toEqual([]);
  await page.locator(".menu-suggestion").getByRole("button",{name:"Sugerirme un menú"}).click();
  const overlay=page.locator("#overlay");
  await expect(overlay).toContainText("Total del día");
  expect(paid.length).toBeGreaterThan(0);
  expect(await page.evaluate(()=>JSON.stringify(dayState(todayStr())))).toBe(before);
  await overlay.getByRole("button",{name:"Aplicar al día"}).click();
  await expect(page.locator(".menu-suggestion")).toHaveCount(0);
  const primary=page.locator(".home-primary.kind-meal");
  const agenda=page.locator(".home-agenda");
  await expect(primary).toContainText("Bowl proteico de la mañana");
  await expect(primary.locator(".btn-accent")).toHaveText("Registrar este plato");
  await expect(agenda).toHaveJSProperty("open",false);
  await expect(agenda.locator(".home-agenda-count")).toHaveText("3 pendientes");
  await agenda.locator("summary").click();
  await expect(agenda.locator(".kind-meal")).toHaveCount(2);
  await expect(agenda).not.toContainText("Bowl proteico de la mañana");

  // Abrir el registro alternativo no confirma el plato ni cambia el menú.
  await primary.getByRole("button",{name:"Registrar otra comida"}).click();
  await expect(overlay.locator("#f_target")).toHaveValue("desayuno");
  expect(await page.evaluate(()=>!!mealState(todayStr(),"desayuno").done)).toBe(false);
  await overlay.getByRole("button",{name:"Cerrar",exact:true}).last().click();
  await primary.getByRole("button",{name:"Registrar este plato"}).click();
  await expect(agenda).toHaveJSProperty("open",true);
  await expect(agenda.locator(".home-agenda-count")).toHaveText("2 pendientes");
  expect(errors).toEqual([]);
});

test("Iniciar y continuar el entreno funciona sin menú y conserva la ejecución",async({page,context})=>{
  const {paid,errors}=await boot(page,context);
  await page.locator(".home-primary").getByRole("button",{name:"Ver entreno",exact:true}).click();
  await startGuidedSession(page);
  const before=await page.evaluate(()=>JSON.stringify(normalizedWorkoutExecution(todayStr())));
  await page.locator('[data-tab="hoy"]').click();
  const resume=page.locator(".home-primary.kind-resume").getByRole("button",{name:"Continuar entreno",exact:true});
  await expect(resume).toBeInViewport();
  await expect(resume).toHaveClass(/btn-accent/);
  await expect(page.locator("#homeLogAction")).not.toHaveClass(/btn-accent/);
  await expect(page.locator(".home-welcome")).toHaveCount(0);
  await resume.click();
  expect(await page.evaluate(()=>JSON.stringify(normalizedWorkoutExecution(todayStr())))).toBe(before);
  expect(await page.evaluate(()=>homeDayHasPreparedMeals(todayStr(),buildDay(todayStr())))).toBe(false);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("Sin menú, descanso y entreno registrado no declaran el día cerrado",async({page,context})=>{
  const {paid,errors}=await boot(page,context);
  await page.evaluate(()=>{dayState(todayStr()).workoutOverride="descanso";renderHoy();});
  await expect(page.locator(".kind-rest")).toContainText("Descanso planificado");
  await expect(page.locator(".home-agenda-count")).toHaveCount(0);
  await expect(page.locator(".agenda-state.done")).toHaveCount(0);
  await page.evaluate(()=>{delete dayState(todayStr()).workoutOverride;dayState(todayStr()).workoutDone=true;renderHoy();});
  await expect(page.locator(".home-primary")).toContainText("Entreno completado");
  await expect(page.locator(".agenda-state.done")).toHaveCount(0);
  await expect(page.locator(".home-consumption")).toBeVisible();
  await expect(page.getByRole("button",{name:"Registrar comida",exact:true})).toBeVisible();
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("Sin menú, la evaluación de seguridad sigue bloqueando iniciar entreno",async({page,context})=>{
  const {paid,errors}=await boot(page,context,{tables:{safety_screenings:{row:{...screeningFixture(),has_red_flags:true,cleared_for_training:false,responses:{chest_pain:true}}}}});
  await expect(page.locator(".home-primary.kind-safety")).toContainText("Entrenamiento en pausa");
  await expect(page.getByRole("button",{name:"Iniciar entreno",exact:true})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Registrar comida",exact:true})).toBeVisible();
  await page.locator(".home-primary").getByRole("button",{name:"Completar evaluación"}).click();
  await expect(page.locator('[data-tab="perfil"]')).toHaveClass("active");
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test("Una pausa por seguridad sustituye la opción de continuar una sesión",async({page,context})=>{
  const {paid,errors}=await boot(page,context);
  await page.getByRole("button",{name:"Ver entreno",exact:true}).click();
  await startGuidedSession(page);
  const before=await page.evaluate(()=>JSON.stringify(dayState(todayStr()).workoutExecution));
  await page.evaluate(()=>{safetyScreening={...safetyScreening,has_red_flags:true,cleared_for_training:false,responses:{chest_pain:true}};});
  await page.locator('[data-tab="hoy"]').click();
  await expect(page.locator(".home-primary .btn-accent")).toHaveText("Completar evaluación");
  await expect(page.getByRole("button",{name:"Continuar entreno",exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.stringify(dayState(todayStr()).workoutExecution))).toBe(before);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});
