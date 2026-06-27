// Motor puro de sincronización offline (REQ-73).
// Sin DOM ni dependencias: importable en Node y disponible como global en navegador.
(function(root){
  "use strict";

  function clone(value){
    if(value===undefined)return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function stable(value){
    if(value===undefined)return "__undefined__";
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(Array.isArray(value))return "["+value.map(stable).join(",")+"]";
    return "{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+stable(value[k])).join(",")+"}";
  }

  function same(a,b){return stable(a)===stable(b);}

  function safeDate(value){
    const t=Date.parse(String(value||""));
    return Number.isFinite(t)?t:null;
  }

  function remoteChangedSince(baseUpdatedAt,remoteUpdatedAt){
    const remote=safeDate(remoteUpdatedAt);
    if(remote===null)return false;
    const base=safeDate(baseUpdatedAt);
    if(base===null)return true;
    return remote>base;
  }

  function extraSignature(extra){
    if(!extra||typeof extra!=="object")return "empty";
    return ["name","kcal","p","c","f","done"].map(k=>String(extra[k]??"")).join("|");
  }

  function extraKey(extra,index,prefix){
    if(extra&&typeof extra==="object"&&extra._syncId)return String(extra._syncId);
    if(extra&&typeof extra==="object"&&extra.id)return "id:"+String(extra.id);
    return (prefix||"sig")+":"+extraSignature(extra)+":"+index;
  }

  function normalizeDayStateForSync(state,makeId){
    const out=clone(state||{});
    if(!out.meals||typeof out.meals!=="object"||Array.isArray(out.meals))out.meals={};
    if(!Array.isArray(out.extras))out.extras=[];
    out.extras=out.extras.map((extra,index)=>{
      const item=(extra&&typeof extra==="object")?clone(extra):{};
      if(!item._syncId&&typeof makeId==="function")item._syncId=String(makeId(index,item));
      return item;
    });
    if(typeof out.workoutDone!=="boolean")out.workoutDone=!!out.workoutDone;
    return out;
  }

  function changed(local,base){return !same(local,base);}

  function pickField(field,base,local,remote,conflicts){
    const b=base?base[field]:undefined;
    const l=local?local[field]:undefined;
    const r=remote?remote[field]:undefined;
    const lc=changed(l,b);
    const rc=changed(r,b);
    if(lc&&rc&&!same(l,r)){
      conflicts.push(field);
      return r;
    }
    if(lc)return clone(l);
    if(rc)return clone(r);
    return clone(r!==undefined?r:l);
  }

  function mergeMeals(base,local,remote,conflicts){
    const out={};
    const ids=new Set([
      ...Object.keys((base&&base.meals)||{}),
      ...Object.keys((local&&local.meals)||{}),
      ...Object.keys((remote&&remote.meals)||{}),
    ]);
    ids.forEach(id=>{
      const b=base&&base.meals?base.meals[id]:undefined;
      const l=local&&local.meals?local.meals[id]:undefined;
      const r=remote&&remote.meals?remote.meals[id]:undefined;
      const lc=changed(l,b);
      const rc=changed(r,b);
      if(lc&&rc&&!same(l,r)){
        conflicts.push("meals."+id);
        out[id]=clone(r);
      }else if(lc)out[id]=clone(l);
      else if(rc)out[id]=clone(r);
      else if(r!==undefined)out[id]=clone(r);
      else if(l!==undefined)out[id]=clone(l);
    });
    return out;
  }

  function mapExtras(list,prefix){
    const map=new Map();
    (Array.isArray(list)?list:[]).forEach((extra,index)=>{
      map.set(extraKey(extra,index,prefix),extra);
    });
    return map;
  }

  function mergeExtras(base,local,remote,conflicts){
    const bm=mapExtras(base&&base.extras,"base");
    const lm=mapExtras(local&&local.extras,"local");
    const rm=mapExtras(remote&&remote.extras,"remote");
    const keys=new Set([...bm.keys(),...lm.keys(),...rm.keys()]);
    const out=[];
    keys.forEach(key=>{
      const b=bm.get(key),l=lm.get(key),r=rm.get(key);
      const lc=changed(l,b);
      const rc=changed(r,b);
      if(lc&&rc&&!same(l,r)){
        conflicts.push("extras."+key);
        if(r!==undefined)out.push(clone(r));
      }else if(lc&&l!==undefined)out.push(clone(l));
      else if(rc&&r!==undefined)out.push(clone(r));
      else if(r!==undefined)out.push(clone(r));
      else if(l!==undefined)out.push(clone(l));
    });
    return out;
  }

  function mergeLogs(baseList,localList,remoteList){
    const out=[];
    const seen=new Set();
    [baseList,remoteList,localList].forEach(list=>{
      (Array.isArray(list)?list:[]).forEach(item=>{
        const key=stable(item);
        if(!seen.has(key)){seen.add(key);out.push(clone(item));}
      });
    });
    return out;
  }

  function mergeDayLogStates(baseState,localState,remoteState){
    const base=normalizeDayStateForSync(baseState||{});
    const local=normalizeDayStateForSync(localState||{});
    const remote=normalizeDayStateForSync(remoteState||{});
    const conflicts=[];
    const merged={};

    merged.meals=mergeMeals(base,local,remote,conflicts);
    merged.extras=mergeExtras(base,local,remote,conflicts);

    const handled=new Set(["meals","extras","syncResolutionLog"]);
    const keys=new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)]);
    keys.forEach(key=>{
      if(handled.has(key))return;
      merged[key]=pickField(key,base,local,remote,conflicts);
    });
    merged.syncResolutionLog=mergeLogs(base.syncResolutionLog,local.syncResolutionLog,remote.syncResolutionLog);

    return {ok:conflicts.length===0,merged,conflicts};
  }

  function normalizeWeightPayload(payload){
    if(!payload)return null;
    return {
      user_id:payload.user_id,
      cycle_start:payload.cycle_start,
      week:Number(payload.week),
      kg:payload.kg==null?null:Number(payload.kg),
      bf_pct:payload.bf_pct==null?null:Number(payload.bf_pct),
      updated_at:payload.updated_at||null,
    };
  }

  function mergeWeightPayload(basePayload,localPayload,remotePayload){
    const base=normalizeWeightPayload(basePayload)||{};
    const local=normalizeWeightPayload(localPayload)||{};
    const remote=normalizeWeightPayload(remotePayload);
    if(!remote)return {ok:true,merged:clone(local),conflicts:[]};
    const conflicts=[];
    const merged=clone(remote);
    ["kg","bf_pct"].forEach(field=>{
      const lc=changed(local[field],base[field]);
      const rc=changed(remote[field],base[field]);
      if(lc&&rc&&!same(local[field],remote[field])){
        conflicts.push(field);
      }else if(lc){
        merged[field]=local[field];
      }
    });
    ["user_id","cycle_start","week"].forEach(field=>{
      if(local[field]!=null)merged[field]=local[field];
    });
    return {ok:conflicts.length===0,merged,conflicts};
  }

  root.FITBUD_SYNC_CONFLICTS={
    clone,
    same,
    stable,
    remoteChangedSince,
    normalizeDayStateForSync,
    mergeDayLogStates,
    mergeWeightPayload,
  };
})(typeof window!=="undefined"?window:globalThis);
