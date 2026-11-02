import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, collectConsoleErrors } from "./helpers.js";

for(const width of [390,1280])test(`REQ-303: lote de gimnasio, material y demostraciones (${width}px)`,async({page,context})=>{
  await page.setViewportSize({width,height:844});
  await installMocks(context,{tables:{exercises:{rows:[{slug:"machine-hip-adduction",name:"Antiguo",level:"advanced",muscles:["cuádriceps"],equipment:[],active:true}]}}});
  await seedLoggedInUser(page);
  const errors=collectConsoleErrors(page);
  await gotoApp(page);
  const result=await page.evaluate(()=>{
    const catalog=activeTrainingCatalog(),batch=catalog.filter(ex=>ex.catalog_batch===303);
    const bySlug=slug=>catalog.find(ex=>ex.slug===slug);
    return {total:catalog.length,count:batch.length,gym:batch.filter(ex=>ex.discipline==="gym").length,
      home:batch.filter(ex=>exerciseFitsHomeSetup(ex,{strengthPlace:"home",equipment:["bodyweight"]})).map(ex=>ex.slug),
      adductor:EXERCISE_SUBSTITUTION.candidates(bySlug("machine-hip-adduction"),catalog).map(ex=>({slug:ex.slug,muscle:EXERCISE_SUBSTITUTION.primaryMuscle(ex)})),
      gentleBlocked:["chin-up","body-up","dumbbell-step-up","dumbbell-forward-lunge","arnold-press"].every(slug=>exerciseBlockedByGentleMode(bySlug(slug))),
      shoulder:EXERCISE_SUBSTITUTION.primaryMuscle(bySlug("seated-cable-reverse-fly")),
      variants:Object.fromEntries(["chin-up","body-up","dumbbell-flat-bench-press"].map(slug=>[slug,window.FITBUD_EXERCISE_VARIANTS[slug]]))};
  });
  expect(result.total).toBeGreaterThanOrEqual(123);
  expect(result.count).toBe(40);expect(result.gym).toBe(32);
  expect(result.home).not.toContain("smith-squat");expect(result.home).not.toContain("chin-up");expect(result.home).not.toContain("band-hip-adduction");
  expect(result.home).toContain("quadruped-glute-kickback");
  expect(result.adductor.map(ex=>ex.slug).sort()).toEqual(["band-hip-adduction","cable-hip-adduction"]);
  expect(result.adductor.every(ex=>ex.muscle==="Aductores")).toBe(true);
  expect(result.shoulder).toBe("Deltoides posterior");
  expect(result.gentleBlocked).toBe(true);
  expect(result.variants["chin-up"].regression.to).toBe("assisted-pull-up");
  expect(result.variants["chin-up"].progression.to).toBe("weighted-pull-up");
  expect(result.variants["body-up"].regression.to).toBe("close-grip-incline-push-up");
  expect(result.variants["dumbbell-flat-bench-press"].regression.to).toBe("dumbbell-floor-press");
  for(const slug of ["smith-squat","seated-cable-reverse-fly","machine-hip-adduction","dumbbell-flat-bench-press"]){
    await page.evaluate(slug=>openExerciseGuide(slug),slug);
    const demo=page.locator("#overlay .guide-demo img").first();
    await expect(demo).toHaveAttribute("src",`assets/exercise-media/${slug}-0.jpg`);
    await expect.poll(()=>demo.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    await page.evaluate(()=>closeModal());
  }
  expect(errors).toEqual([]);
});
