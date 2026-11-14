import assert from 'node:assert/strict';
import handler from '../api/analytics.js';
process.env.SUPABASE_URL='https://fixture.supabase.invalid';process.env.SUPABASE_PUBLISHABLE_KEY='fixture-public';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-service';
const writes=[];
globalThis.fetch=async(url,init={})=>{
 if(String(url).endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:'fixture-user'}));
 if(String(url).includes('/profiles?'))return new Response(JSON.stringify([{active:true,is_admin:false}]));
 if(String(url).endsWith('/product_events')&&init.method==='POST'){writes.push(JSON.parse(init.body));return new Response(null,{status:201});}
 throw new Error('Unexpected fixture request '+url);
};
for(const [event_type,properties,expected] of [
 ['onboarding_step_view',{step:2,name:'private',allergies:'private',weightKg:70},{step:2}],
 ['onboarding_complete',{duration_s:83,name:'private',safetyResponses:{chest_pain:'no'}},{duration_s:83}],
]){
 const res={statusCode:0,status(code){this.statusCode=code;return this;},json(data){this.data=data;return this;},setHeader(){}};
 await handler({method:'POST',headers:{authorization:'Bearer fixture'},body:{event_type,properties}},res);
 assert.equal(res.statusCode,200);assert.deepEqual(writes.at(-1).properties,expected);
}
assert.equal(writes.length,2);assert(writes.every(row=>row.user_id==='fixture-user'));
console.log('REQ-389: step views and duration accepted; names, health and body values discarded.');
