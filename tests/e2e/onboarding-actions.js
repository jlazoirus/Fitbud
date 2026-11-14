// Essential onboarding controls share the persisted day/kind preferences with Profile.
export async function selectOnboardingDays(page,days){
 for(const day of [0,1,2,3,4,5,6]){
  const el=page.locator(`#ob_day_${day}`),selected=(await el.getAttribute('aria-pressed'))==='true';
  if(selected!==days.includes(day))await el.click();
 }
}
export async function selectOnboardingKind(page,day,kind){
 const el=page.locator(`#ob_kind_${day}`);if(await el.getAttribute('value')!==kind)await el.click();
}
