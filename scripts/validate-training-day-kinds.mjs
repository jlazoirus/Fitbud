// REQ-386: explicit days, legacy parity and strength/sport rotation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('app/index.html','utf8');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync('js/nutrition-pure.js','utf8'),ctx);
const start=html.indexOf('function workoutSchedule('),end=html.indexOf('function generatedTrainingPlanForDate',start);
vm.runInContext(html.slice(start,end),ctx);
let cases=0;
for(const sport of ['walking','running','cycling','swimming','other','strength_only'])for(const strength of ['gym','bodyweight','none'])for(const experience of ['beginner','intermediate','advanced'])for(const count of [3,4,5,6]){
 const days=[1,2,3,4,5,6].slice(0,count),args=[count,days,'composition',{},sport,experience,undefined,strength,false];
 const legacy=ctx.workoutSchedule(...args);
 const kinds=Object.fromEntries(days.map(d=>[d,ctx.STRENGTH_SESSION_IDS.has(legacy[d])?'strength':'sport']));
 assert.equal(JSON.stringify(ctx.workoutSchedule(...args,kinds)),JSON.stringify(legacy),'Untouched defaults retain exact sessions');cases++;
}
for(const place of ['gym','outdoor']){
 const kinds={1:'strength',2:'sport',3:'strength',5:'strength',6:'sport'};
 const result=ctx.workoutSchedule(5,[1,2,3,5,6],'composition',Object.fromEntries([1,2,3,5,6].map(d=>[d,place])),'cycling','beginner',undefined,'gym',false,kinds);
 for(const day of [1,3,5])assert(ctx.STRENGTH_SESSION_IDS.has(result[day]));
 for(const day of [2,6])assert(!ctx.STRENGTH_SESSION_IDS.has(result[day]));
 assert.equal(result[1],'fullA');assert.equal(result[3],'fullB');assert.equal(result[5],'fullA');
}
assert(html.includes('trainingDayKinds:draft.trainingDayKinds'));
assert(html.includes('trainingDayKinds:d.trainingDayKinds'));
assert(html.includes('trainingDayKinds:{...p.trainingDayKinds}'));
console.log(`REQ-386: ${cases} legacy/default combinations + explicit indoor/outdoor days and rotation passed`);
