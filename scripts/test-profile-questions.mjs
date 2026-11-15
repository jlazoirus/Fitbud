import assert from 'node:assert/strict';
import '../js/profile-questions.js';
import handler from '../api/analytics.js';
const Q=globalThis.FITBUD_PROFILE_QUESTIONS;
const ctx=day=>({today:day,now:day+'T17:00:00Z',defaultMealTimes:n=>['08:00','11:00','14:00','17:00','20:00','22:00'].slice(0,n),calculateMacroTargets:()=>({kcal:2300,p:150,c:290,f:60,maintenance:2600,method:'formula'}),currentTargets:{kcal:2100,p:140,c:250,f:60}});
let p={mealCount:4,allergies:'maní',calorieTarget:2100,profileRefinedAt:null};
assert(Q.eligible(p,'2026-11-14'));p=Q.claim(p,'2026-11-14');assert(!Q.claim(p,'2026-11-14'));assert(!Q.answer(p,'activityLevel','invalid',ctx('2026-11-14')).prefs);
p=Q.skip(p,'activityLevel','2026-11-14');assert.equal(p.profileQuestions.nextEligibleOn,'2026-11-17');assert(!Q.eligible(p,'2026-11-16'));p=Q.claim(p,'2026-11-17');p=Q.skip(p,'activityLevel','2026-11-17');assert.equal(Q.next(p).key,'dislikedIngredients');assert(!p.profileRefinedAt);
assert(!Q.eligible({...p,profileQuestions:{...p.profileQuestions,blockedOn:'2026-11-20'}},'2026-11-20'));
// Every answer is private preference state; two skips do not count as a response.
p={mealCount:4,allergies:'maní',profileRefinedAt:null};
for(const [i,q] of Q.questions.entries()){
 const day=`2026-12-${String(i+1).padStart(2,'0')}`,before=JSON.stringify(p);const claim=Q.claim(p,day,true);assert.equal(JSON.stringify(p),before);
 const value=q.choices?q.choices[0][0]:q.key==='mealTimes'?claim.mealTimes.join(','):q.key==='sessionMinutes'?45:q.key==='bodyFatPct'?'':'privado';
 if(q.key==='mealTimes')assert(Q.answer(claim,q.key,'25:01',ctx(day)).error);
 if(q.key==='sessionMinutes')assert(Q.answer(claim,q.key,'',ctx(day)).error);
 p=Q.answer(claim,q.key,value,ctx(day)).prefs;assert(p);
 if(q.key==='activityLevel'){assert.equal(p.macroTargetsValidFrom,'2026-12-02');assert.equal(p.previousMacroTargets.calorieTarget,2100);}
 if(q.key==='dislikedIngredients')assert.equal(p.avoid,'maní, privado');
 if(i<Q.questions.length-1)assert(!p.profileRefinedAt);
 assert(!Q.claim(p,day));
}
assert(Q.complete(Q.state(p)));assert(p.profileRefinedAt);assert.equal(p.bodyFatPct,null);assert.equal(Q.next(p,true),null);
// Event-specific server whitelist rejects values even under otherwise-safe property names.
process.env.SUPABASE_URL='https://fixture.supabase.invalid';process.env.SUPABASE_PUBLISHABLE_KEY='fixture-public';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-service';
const writes=[];globalThis.fetch=async(url,init={})=>{
 if(String(url).endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:'fixture-user'}));
 if(String(url).includes('/profiles?'))return new Response(JSON.stringify([{active:true,is_admin:false}]));
 if(String(url).endsWith('/product_events')&&init.method==='POST'){writes.push(JSON.parse(init.body));return new Response(null,{status:201});}
 throw new Error('Unexpected fixture request '+url);
};
for(const event_type of ['profile_question_shown','profile_question_answered','profile_question_skipped'])for(const question of ['activityLevel','privado']){
 const res={statusCode:0,status(code){this.statusCode=code;return this;},json(data){this.data=data;return this;},setHeader(){}};
 await handler({method:'POST',headers:{authorization:'Bearer fixture'},body:{event_type,properties:{question,value:'privado',context:'privado',weightKg:70,limitations:'privado'}}},res);
 assert.equal(res.statusCode,200);assert.deepEqual(writes.at(-1).properties,question==='privado'?{}:{question});
}
console.log('REQ-390: ordered questions, daily cap, 3-day snooze, two skips, validation, immutable input, completion and private analytics OK.');
