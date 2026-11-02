import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors, completePrefs, screeningFixture, startGuidedSession } from "./helpers.js";

async function boot(page, context, opts={}) {
  await installMocks(context, opts);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
}
for(const width of [390,1280]) test(`Coach acompaña y lleva a Entreno (${width}px)`,async({page,context})=>{
  await page.setViewportSize({width,height:844});
  const errors=collectConsoleErrors(page),paid=[];
  page.on("request",req=>{if(req.url().includes("/api/claude"))paid.push(req.url());});
  await boot(page,context);
  const welcome=page.locator(".coach-welcome");
  await expect(welcome).toContainText("Vamos paso a paso");
  if(process.env.CAPTURE_COACH_WELCOME)await page.screenshot({path:`/tmp/coach-welcome-${width}.png`});
  const before=await page.evaluate(()=>JSON.stringify(dayState(todayStr())));
  await welcome.getByRole("button",{name:"¿Cómo entreno hoy?",exact:true}).click();
  const reply=page.locator(".coach-guide-reply").last();
  await expect(reply).toContainText("paso a paso");
  await expect(reply).toBeFocused();
  await reply.getByRole("button",{name:"Llévame a mi entrenamiento"}).click();
  await expect(page.locator('[data-tab="entreno"]')).toHaveClass("active");
  expect(await page.evaluate(()=>JSON.stringify(dayState(todayStr())))).toBe(before);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("Poco tiempo muestra opciones antes de cambiar la sesión",async({page,context})=>{
  await boot(page,context);
  const before=await page.evaluate(()=>JSON.stringify(dayState(todayStr())));
  await page.locator(".coach-welcome").getByRole("button",{name:"Tengo poco tiempo, ¿qué hago?"}).click();
  await expect(page.locator(".coach-guide-reply").last()).toContainText("tú eliges");
  await page.getByRole("button",{name:"Ver opciones para hoy",exact:true}).click();
  await expect(page.locator("#overlay")).toContainText("Solo tengo poco tiempo");
  expect(await page.evaluate(()=>JSON.stringify(dayState(todayStr())))).toBe(before);
});

test("Preguntas de texto, comidas y foco en el coach",async({page,context})=>{
  await boot(page,context);
  await page.locator(".coach-welcome").getByRole("button",{name:"Escribir otra pregunta"}).click();
  await expect(page.locator("#coachInput")).toBeFocused();
  await page.locator("#coachInput").fill("Hoy día cómo entreno?");
  await page.locator("#coachInput").press("Enter");
  await expect(page.locator(".coach-guide-reply")).toContainText("Iniciar sesión guiada");
  await page.evaluate(()=>setView("hoy"));
  await page.locator(".coach-welcome").getByRole("button",{name:"¿Qué puedo comer hoy?"}).click();
  await page.getByRole("button",{name:"Ir a mis comidas",exact:true}).click();
  await expect(page.locator('[data-tab="nutricion"]')).toHaveClass("active");
});

test("Descartes persistentes, límite de cinco días y aislamiento por usuario",async({page,context})=>{
  await boot(page,context);
  await page.locator(".coach-welcome").getByRole("button",{name:"Ocultar ayuda del coach por hoy"}).click();
  await expect(page.locator(".coach-welcome")).toHaveCount(0);
  await page.reload();await page.waitForFunction(()=>typeof profile!=="undefined"&&profile&&!_authBusy);
  await expect(page.locator(".coach-welcome")).toHaveCount(0);
  await page.evaluate(()=>{saveCoachWelcomeState({days:[addDays(todayStr(),-1)]});renderHoy();});
  await expect(page.locator(".coach-welcome")).toBeVisible();
  await page.locator(".coach-welcome").getByRole("button",{name:"No volver a mostrar"}).click();
  await page.reload();await page.waitForFunction(()=>typeof profile!=="undefined"&&profile&&!_authBusy);
  await expect(page.locator(".coach-welcome")).toHaveCount(0);
  const isolated=await page.evaluate(()=>{const previous=session.user.id;session.user.id="other-user";const state=coachWelcomeState();session.user.id=previous;return state;});
  expect(isolated).toEqual({});
  await page.evaluate(()=>{saveCoachWelcomeState({days:[1,2,3,4,5].map(n=>addDays(todayStr(),-n))});renderHoy();});
  await expect(page.locator(".coach-welcome")).toHaveCount(0);
});

test("Cuenta antigua no recibe la bienvenida",async({page,context})=>{
  await boot(page,context,{prefs:completePrefs({onboardingCompletedAt:new Date(Date.now()-30*86400000).toISOString()})});
  await expect(page.locator(".coach-welcome")).toHaveCount(0);
});

test("Descanso y sesión registrada conservan su contexto",async({page,context})=>{
  await boot(page,context);
  await page.evaluate(()=>{dayState(todayStr()).workoutOverride="descanso";renderHoy();});
  await expect(page.locator(".coach-welcome")).toContainText("recuperar");
  await expect(page.locator(".coach-welcome")).not.toContainText("Tengo poco tiempo");
  await page.locator(".coach-welcome").getByRole("button",{name:"¿Cómo entreno hoy?"}).click();
  await expect(page.locator(".coach-guide-reply").last()).toContainText("descanso planificado");
  await page.evaluate(()=>{delete dayState(todayStr()).workoutOverride;dayState(todayStr()).workoutDone=true;renderHoy();});
  await expect(page.locator(".coach-welcome")).toContainText("ya tiene un registro");
  await page.locator(".coach-welcome").getByRole("button",{name:"¿Cómo entreno hoy?"}).click();
  await expect(page.locator(".coach-guide-reply").last()).toContainText("sin cambiar lo que hiciste");
});

test("Seguridad y guía sin servicio del coach",async({page,context})=>{
  await boot(page,context,{tables:{safety_screenings:{row:{...screeningFixture(),has_red_flags:true,cleared_for_training:false,responses:{chest_pain:true}}}}});
  await expect(page.locator(".coach-welcome")).not.toContainText("Tengo poco tiempo");
  await page.locator(".coach-welcome").getByRole("button",{name:"¿Cómo empiezo con seguridad?"}).click();
  await expect(page.locator(".coach-guide-reply")).toContainText("pausa por seguridad");
  await page.getByRole("button",{name:"Revisar mi evaluación",exact:true}).click();
  await expect(page.locator('[data-tab="perfil"]')).toHaveClass("active");
  await page.evaluate(()=>{REMOTE.anthropic.proxy=false;S.settings={...(S.settings||{}),apiKey:""};CONFIG.anthropic.apiKey="";setView("hoy");});
  await page.locator(".coach-welcome").getByRole("button",{name:"¿Qué puedo comer hoy?"}).click();
  await expect(page.locator(".coach-guide-reply").last()).toContainText("Preparar un menú es opcional");
});


test("Ayuda opcional en lugar del tour automático; guía manual disponible",async({page,context})=>{
  await installMocks(context);await seedLoggedInUser(page,{skipTour:false});await autoDismissNudges(page);await gotoApp(page);
  await expect(page.locator(".coach-welcome")).toBeVisible();
  await expect(page.locator(".tour-tip")).toHaveCount(0);
  await page.getByRole("button",{name:"Ver guía rápida",exact:true}).click();
  await expect(page.locator(".tour-tip")).toBeVisible();
  await page.locator(".tour-skip").click();
  await expect(page.locator(".coach-welcome")).toBeVisible();
});

test("Retomar una sesión conserva su registro y no ofrece adaptarla",async({page,context})=>{
  await boot(page,context);await page.locator('[data-tab="entreno"]').click();
  await startGuidedSession(page);
  const before=await page.evaluate(()=>JSON.stringify(normalizedWorkoutExecution(todayStr())));
  await page.locator('[data-tab="hoy"]').click();
  await expect(page.locator(".coach-welcome")).not.toContainText("Tengo poco tiempo");
  await page.locator(".coach-welcome").getByRole("button",{name:"¿Cómo entreno hoy?"}).click();
  await expect(page.locator(".coach-guide-reply").last()).toContainText("donde la dejaste");
  expect(await page.evaluate(()=>JSON.stringify(normalizedWorkoutExecution(todayStr())))).toBe(before);
});
