import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, collectConsoleErrors } from "./helpers.js";

for(const width of [390,1280]){
  test(`REQ-302: fichas ampliadas, fotos y material real (${width}px)`, async ({page,context})=>{
    await page.setViewportSize({width,height:844});
    await installMocks(context,{tables:{exercises:{rows:[{slug:"dumbbell-floor-press",name:"Antiguo",level:"advanced",muscles:["incorrecto"],equipment:[],active:true}]}}});
    await seedLoggedInUser(page);
    const errors=collectConsoleErrors(page);
    await gotoApp(page);
    const result=await page.evaluate(()=>{
      const catalog=activeTrainingCatalog();
      const added=catalog.filter(ex=>ex.catalog_batch===302);
      const home=equipment=>added.filter(ex=>exerciseFitsHomeSetup(ex,{strengthPlace:"home",equipment})).map(ex=>ex.slug);
      return {count:added.length,without:home(["bodyweight"]),bands:home(["bodyweight","bands"]),dumbbells:home(["bodyweight","dumbbells"]),
        bad:added.flatMap(ex=>window.FITBUD_EXERCISE_SUBSTITUTION.candidates(ex,catalog).filter(other=>EXERCISE_SUBSTITUTION.primaryMuscle(other)!==EXERCISE_SUBSTITUTION.primaryMuscle(ex)).map(other=>other.slug)),
        floor:exerciseBySlug("dumbbell-floor-press")};
    });
    expect(result.count).toBe(28);
    expect(result.without.sort()).toEqual(["crunch","oblique-crunch","reverse-crunch"]);
    expect(result.bands).toContain("band-lateral-raise");
    expect(result.bands).not.toContain("machine-chest-press");
    expect(result.dumbbells).toContain("dumbbell-floor-press");
    expect(result.dumbbells).not.toContain("band-chest-fly");
    expect(result.bad).toEqual([]);
    expect(result.floor.level).toBe("beginner");
    expect(result.floor.equipment).toEqual(["dumbbells"]);
    for(const slug of ["dumbbell-floor-press","band-lateral-raise","reverse-pec-deck","crunch"]){
      await page.evaluate(slug=>openExerciseGuide(slug),slug);
      const demo=page.locator("#overlay .guide-demo img").first();
      await expect(demo).toHaveAttribute("src",`assets/exercise-media/${slug}-0.jpg`);
      await expect.poll(()=>demo.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
      await expect(page.locator("#overlay .exercise-meta")).not.toContainText("machines");
      await page.evaluate(()=>closeModal());
    }
    expect(errors).toEqual([]);
  });
}
