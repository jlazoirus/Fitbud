/* REQ-300. Comparación voluntaria: nunca almacena la clasificación en disco.
 * Se carga antes del shell; sus helpers acceden al estado de la app al usarse. */
const STREAK_INVITE_KEY="evolv_streak_invite_v1";
let streakSocial={owner:null,loaded:false,enabled:false,alias:"",rows:[],unavailable:false};
let streakSocialOpen=false,streakSocialBusy=false,streakSocialError="",streakSocialInvite=null;
let streakSocialPending="",streakSocialPreview=null,streakShareFallback="",streakSocialTimer=null;
let streakSocialRequest=0,streakInviteBase=0;

function captureStreakInvite(){
  try{
    const u=new URL(location.href),hash=new URLSearchParams(u.hash.slice(1));
    const token=u.searchParams.get("friend")||hash.get("friend");
    if(token&&/^[a-f0-9]{64}$/.test(token)){
      streakSocialPending=token;sessionStorage.setItem(STREAK_INVITE_KEY,JSON.stringify({token,at:Date.now()}));
      u.searchParams.delete("friend");hash.delete("friend");u.hash=hash.toString();history.replaceState(null,"",u);
    }else{
      const saved=JSON.parse(sessionStorage.getItem(STREAK_INVITE_KEY)||"null");
      if(saved&&Date.now()-saved.at<7*86400000&&/^[a-f0-9]{64}$/.test(saved.token))streakSocialPending=saved.token;
    }
  }catch(e){/* el enlace sigue usable en memoria sin storage */}
  return !!streakSocialPending;
}
function forgetStreakInvite(){
  streakSocialPending="";streakSocialPreview=null;
  try{sessionStorage.removeItem(STREAK_INVITE_KEY);}catch(e){}
}
function resetStreakSocial(){
  if(typeof resetStreakImage==="function"){
    if(document.getElementById("streakSharePreview"))closeModal();
    else resetStreakImage();
  }
  clearTimeout(streakSocialTimer);streakSocialRequest++;
  streakSocial={owner:null,loaded:false,enabled:false,alias:"",rows:[],unavailable:false};
  streakSocialOpen=false;streakSocialBusy=false;streakSocialError="";streakSocialInvite=null;streakShareFallback="";
  forgetStreakInvite();
}
async function streakSocialRpc(action,data){
  const owner=uid(),client=supa;
  if(!owner||!client)throw new Error("Sin sesión");
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
    const r=await client.rpc("streak_social",{p_action:action,p_data:data||{}}).abortSignal(controller.signal);
    if(uid()!==owner)throw new Error("stale_session");
    if(r.error)throw r.error;
    return r.data;
  }finally{clearTimeout(timer);}
}
function streakSocialSnapshot(){
  const days=streak(),today=todayStr();
  // todayStr usa el calendario local del dispositivo, igual que esta zona.
  return {count:days,through:days>0?(combinedDayDone(today)?today:addDays(today,-1)):null,
    timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC"};
}
function streakSocialSyncPending(){
  return !navigator.onLine||_getSyncQ().some(item=>item.uid===uid()&&item.entity==="day_log");
}
function paintStreakSocial(){
  const el=document.getElementById("streakFriends");
  if(!el)return;
  const focused=document.activeElement;
  const draft=focused&&focused.id==="streakAlias"?{value:focused.value,start:focused.selectionStart,end:focused.selectionEnd}:null;
  el.innerHTML=streakFriendsBody();
  if(draft){const input=document.getElementById("streakAlias");if(input){input.value=draft.value;input.focus({preventScroll:true});input.setSelectionRange(draft.start,draft.end);}}
}
async function refreshStreakSocial(){
  if(!uid()||!supa||onboardingActive||!profile||!hasCompleteOnboarding(profile.prefs||{}))return;
  const owner=uid(),request=++streakSocialRequest;
  if(streakSocial.owner!==owner)streakSocial={owner,loaded:false,enabled:false,alias:"",rows:[],unavailable:false};
  try{
    let data=await streakSocialRpc("state");
    if(!data||typeof data.enabled!=="boolean")throw new Error("not_available");
    if(data.enabled&&!streakSocialSyncPending()){
      await streakSocialRpc("sync",streakSocialSnapshot());
      data=await streakSocialRpc("state");
    }
    if(uid()!==owner||request!==streakSocialRequest)return;
    // REQ-348: cada enlace sirve para un amigo. Si apareció un amigo nuevo por él, ya se usó.
    if(streakSocialInvite&&Array.isArray(data.rows)&&data.rows.length>streakInviteBase)streakSocialInvite=null;
    streakSocial={...data,owner,loaded:true,unavailable:false};
    streakSocialError="";
    if(streakSocialPending){
      streakSocialOpen=true;
      try{streakSocialPreview=await streakSocialRpc("preview",{token:streakSocialPending});}
      catch(e){if(uid()===owner)streakSocialError="Esta invitación ya no está disponible. Pide un enlace nuevo a tu amigo.";}
    }
    if(uid()===owner&&request===streakSocialRequest)paintStreakSocial();
  }catch(e){
    if(uid()!==owner||request!==streakSocialRequest)return;
    const unavailable=["PGRST202","42883"].includes(e.code)||e.message==="not_available";
    streakSocial={...streakSocial,owner,loaded:true,unavailable};
    if(streakSocialOpen)streakSocialError=unavailable?"La comparación con amigos estará disponible pronto.":"No pudimos actualizar las rachas. Revisa tu conexión y vuelve a intentar.";
    paintStreakSocial();
  }
}
async function loadStreakFriendsAfterAuth(){
  const owner=uid();
  await refreshStreakSocial();
  if(uid()===owner&&streakSocialPending&&!onboardingActive&&!notifySetupActive&&!privacyGateRequired()){
    streakSocialOpen=true;showStreakSection();
  }
}
function scheduleStreakSocialSync(){
  clearTimeout(streakSocialTimer);
  if(streakSocial.owner===uid()&&streakSocial.enabled)streakSocialTimer=setTimeout(()=>{if(!streakSocialBusy)refreshStreakSocial();},3000);
}
// REQ-345: amigos vive dentro de la sección "Racha" de Progreso; abrirla siempre
// la despliega para que una invitación o el texto para copiar no queden ocultos.
function showStreakSection(){
  UI.collapsed=UI.collapsed||{};
  if(UI.collapsed["pr.rachas"]){UI.collapsed["pr.rachas"]=false;uiSave();}
  setView("progreso");
}
function openStreakFriends(){
  // Desde Hoy se ve primero la racha; desde la propia tarjeta, se queda en amigos.
  const target=view==="progreso"?document.getElementById("streakFriends"):null;
  streakSocialOpen=true;showStreakSection();
  (target?document.getElementById("streakFriends"):document.getElementById("streakPanel")?.closest(".csec"))?.scrollIntoView({behavior:"smooth",block:"start"});
  if(!streakSocialBusy)refreshStreakSocial();
}
function closeStreakInvite(){forgetStreakInvite();streakSocialError="";paintStreakSocial();}
async function changeStreakSocial(action,data,button){
  if(streakSocialBusy)return;
  const owner=uid();streakSocialBusy=true;streakSocialError="";
  streakSocialRequest++; // descartar lecturas anteriores a esta mutación
  if(button){button.disabled=true;button.setAttribute("aria-busy","true");}
  paintStreakSocial();
  try{
    const result=await streakSocialRpc(action,data);
    if(uid()!==owner)return;
    const friends=Array.isArray(streakSocial.rows)?streakSocial.rows.length:0;
    if(action==="invite"){streakSocialInvite=result;streakInviteBase=friends;}
    if(action==="accept"&&streakSocialInvite)streakInviteBase=friends+1;
    if(action==="remove"&&streakSocialInvite)streakInviteBase=Math.max(0,friends-1);
    if(action==="revoke"||action==="disable")streakSocialInvite=null;
    if(action==="disable")forgetStreakInvite();
    if(action==="accept")forgetStreakInvite();
    await refreshStreakSocial();
  }catch(e){
    if(uid()!==owner)return;
    streakSocialError=action==="accept"?"No pudimos aceptar esta invitación. Puede haber caducado; pide un enlace nuevo.":"No pudimos guardar el cambio. Revisa tu conexión y vuelve a intentar.";
  }finally{
    if(uid()===owner){streakSocialBusy=false;paintStreakSocial();}
  }
}
// REQ-318: sin una invitación recibida, activar y crear el enlace es un solo paso.
function streakInviteOnActivate(){return !streakSocial.enabled&&!streakSocialPending;}
async function saveStreakAlias(form){
  const alias=form.elements.alias.value.trim();
  if(alias.length<2||alias.length>24){streakSocialError="Elige un alias de 2 a 24 caracteres.";paintStreakSocial();return false;}
  const invite=streakInviteOnActivate();
  await changeStreakSocial("enable",{alias},form.querySelector("button[type=submit]"));
  if(invite&&streakSocial.enabled&&!streakSocialError){
    await changeStreakSocial("invite",{});
    if(streakSocialInvite&&!streakSocialError)shareStreakInvite({auto:true});
  }
  return false;
}
function disableStreakSocial(){
  if(confirm("¿Dejar de comparar tu racha? Se eliminarán tus amistades y tus invitaciones."))changeStreakSocial("disable");
}
function removeStreakFriend(id){
  if(confirm("¿Eliminar esta amistad? Dejarán de ver sus rachas mutuamente."))changeStreakSocial("remove",{friend:id});
}
function streakInviteUrl(){return streakSocialInvite?"https://evolvapp.club/#friend="+streakSocialInvite.token:"";}
// REQ-348: compartir la racha siempre lleva el enlace personal de invitación.
// Un enlace genérico a la portada no dejaba al amigo hacer nada con él.
async function shareStreakText(text,title,{auto=false}={}){
  const owner=uid();
  if(navigator.share){
    try{await navigator.share({title,text});return;}
    catch(e){
      if(uid()!==owner||e.name==="AbortError")return;
      // Tras esperar a la red el navegador puede pedir otro toque: «Compartir enlace» queda a la vista.
      if(auto&&e.name==="NotAllowedError"){document.getElementById("streakShareBtn")?.focus();return;}
    }
  }
  try{
    await navigator.clipboard.writeText(text);
    if(uid()===owner)toast("Mensaje copiado. Pégalo en WhatsApp o donde quieras");
  }catch(e){
    if(uid()!==owner)return;
    streakShareFallback=text;streakSocialOpen=true;showStreakSection();
    const field=document.getElementById("streakShareText");if(field){field.focus();field.select();}
  }
}
function streakShareMessage(){
  const n=streak();
  return (n>0?`Llevo ${n} día${n===1?"":"s"} de racha en Evolv.`:"Estoy empezando mi racha en Evolv.")
    +" Acepta mi invitación y comparemos rachas: "+streakInviteUrl();
}
function shareStreakInvite(opts){
  if(streakSocialInvite)shareStreakText(streakShareMessage(),"Mi racha en Evolv",opts);
}
// Un solo botón: si ya comparas, crea el enlace (o reutiliza el vigente) y abre compartir;
// si aún no, lleva al alias, que crea la invitación al confirmar.
async function inviteStreakFriend(button){
  const mine=streakSocial.owner===uid()?streakSocial:null;
  if(!mine||!mine.loaded||mine.unavailable||!mine.enabled){
    openStreakFriends();document.getElementById("streakAlias")?.focus({preventScroll:true});return;
  }
  if(streakSocialInvite){shareStreakInvite();return;}
  await changeStreakSocial("invite",{},button);
  if(streakSocialInvite&&!streakSocialError)shareStreakInvite({auto:true});
}
window.addEventListener("online",()=>{if(uid()&&streakSocial.enabled&&!streakSocialBusy)refreshStreakSocial();});
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"&&uid()&&streakSocial.enabled&&!streakSocialBusy)refreshStreakSocial();
});
// REQ-318: antes de activar, el alias se propone con el primer nombre del perfil.
function streakAliasSuggestion(){
  const name=String(profile&&profile.prefs&&profile.prefs.name||"").trim().split(/\s+/)[0]||"";
  return name.length>=2?name.slice(0,24):"";
}
function streakAliasForm(enabled){
  return `<form class="streak-alias-form" onsubmit="saveStreakAlias(this);return false">
    <label for="streakAlias">Tu alias para amigos</label>
    <input id="streakAlias" name="alias" minlength="2" maxlength="24" required autocomplete="off" value="${esc(streakSocial.alias||(enabled?"":streakAliasSuggestion()))}" aria-describedby="streakPrivacy">
    <p id="streakPrivacy" class="muted small">${enabled?"Tus amigos solo ven tu alias y tus días de racha.":"Al aceptar una amistad, ambos verán su alias y sus días de racha. Tu peso, comidas y fotos siguen privados."}</p>
    <button type="submit" class="btn ${enabled?"":"btn-accent"}" ${streakSocialBusy?"disabled":""}>${enabled?"Guardar alias":streakInviteOnActivate()?"Crear invitación":"Activar comparación"}</button>
  </form>`;
}
function streakFriendsBody(){
  const mine=streakSocial.owner===uid()?streakSocial:{loaded:false,enabled:false,rows:[]};
  const busy=streakSocialBusy?"disabled":"";
  const head=`<div class="streak-social-head"><h3>Con amigos</h3></div>`;
  const fallback=streakShareFallback?`<label for="streakShareText">Copia este texto para compartir</label><textarea id="streakShareText" readonly rows="4" onclick="this.select()">${esc(streakShareFallback)}</textarea>`:"";
  // REQ-348: cerrado hay una sola acción. Quien ya compara ve directamente su clasificación.
  if(!streakSocialOpen&&!(mine.loaded&&mine.enabled))return head+`<p class="muted small">Envía tu enlace a un amigo y comparen sus rachas cada día.</p><div class="streak-social-actions stack"><button class="btn btn-accent" type="button" onclick="inviteStreakFriend(this)">Invitar a un amigo</button></div>`+fallback;
  const error=streakSocialError?`<p class="streak-social-status" role="status">${esc(streakSocialError)}</p>`:"";
  if(!mine.loaded)return head+`<p class="muted" role="status">Cargando rachas…</p>`+fallback;
  const retry=`<button class="btn" type="button" onclick="refreshStreakSocial()" ${busy}>Actualizar rachas</button>`;
  if(mine.unavailable)return head+error+retry+fallback;
  const invitation=streakSocialPending?`<div class="streak-incoming"><h3>${streakSocialPreview?`${esc(streakSocialPreview.alias)} te invita a comparar rachas`:"Tienes una invitación"}</h3><p class="muted small">Aceptar comparte tu alias y tus días de racha con esta persona, y te permite ver los suyos.</p>${mine.enabled&&streakSocialPreview?`<button class="btn btn-accent" type="button" onclick="changeStreakSocial('accept',{token:streakSocialPending},this)" ${busy}>Aceptar amistad</button>`:""}<button class="btn" type="button" onclick="closeStreakInvite()">Descartar invitación</button></div>`:"";
  // REQ-318: sin buscador ni correo: se agrega a un amigo con un enlace privado.
  const steps=`<ol class="streak-steps"><li><strong>Revisa tu alias.</strong> Es el nombre con el que te verán tus amigos.</li><li><strong>Toca «Crear invitación»</strong> y envía el enlace a un amigo por WhatsApp o donde quieras.</li><li><strong>Tu amigo la acepta</strong> desde su cuenta y los dos aparecen en la lista, cada uno con su alias.</li></ol><p class="muted small">Nadie puede buscarte: solo entra quien recibe tu enlace.</p>`;
  if(!mine.enabled)return head+error+invitation+(invitation?"":steps)+streakAliasForm(false)+fallback;
  const rows=Array.isArray(mine.rows)?mine.rows:[];
  const ranking=rows.length?`<ol class="streak-ranking" aria-label="Clasificación por racha actual">${rows.map(r=>{
    const id=/^[a-f0-9-]{36}$/i.test(r.id)?r.id:"";
    const days=Math.max(0,Math.floor(Number(r.days)||0)),position=Math.max(1,Math.floor(Number(r.position)||1));
    const updated=new Date(r.updatedAt);
    const when=Number.isFinite(updated.getTime())?updated.toLocaleString("es-PE",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"pendiente";
    return `<li ${r.self?'class="self"':''}><span class="streak-place" aria-label="Posición ${position}">${position}</span><div class="streak-person"><strong>${esc(r.alias)}${r.self?" (tú)":""}</strong><span class="muted small">Actualizada: ${esc(when)}</span></div><strong class="streak-days">${days}<span>día${days===1?"":"s"}</span></strong>${!r.self&&id?`<button type="button" class="btn btn-sm" aria-label="Eliminar amistad con ${esc(r.alias)}" onclick="removeStreakFriend('${id}')" ${busy}>Quitar</button>`:""}</li>`;
  }).join("")}</ol>`:"";
  const invite=streakSocialInvite?`<div class="streak-outgoing"><label for="streakInviteLink">Invitación para un amigo · sirve para una persona y vence en 7 días</label><input id="streakInviteLink" value="${esc(streakInviteUrl())}" readonly onclick="this.select()"><div class="streak-social-actions"><button type="button" id="streakShareBtn" class="btn btn-accent" onclick="shareStreakInvite()">Compartir enlace</button><button type="button" class="btn" onclick="changeStreakSocial('revoke',{},this)" ${busy}>Cancelar enlace</button></div></div>`
    :`<div class="streak-social-actions"><button class="btn btn-accent" type="button" onclick="inviteStreakFriend(this)" ${busy}>Invitar a un amigo</button></div>`;
  const self=rows.find(r=>r.self);
  const youAre=`<p class="streak-you">Tus amigos te ven como <strong>${esc((self&&self.alias)||mine.alias||"")}</strong>.</p>`;
  const refresh=`<div class="streak-social-head"><h3>Con amigos</h3><button class="btn btn-sm" type="button" aria-label="Actualizar rachas" onclick="refreshStreakSocial()" ${busy}>Actualizar</button></div>`;
  return refresh+error+invitation+youAre+`<p class="muted small">Gana la racha actual más larga. Los empates comparten posición. Se mantienen tus descansos y las reglas de tu racha.</p>`
    +(streakSocialSyncPending()?`<p class="streak-social-status" role="status">Actualización pendiente: la clasificación muestra la última racha guardada.</p>`:"")
    +ranking
    // REQ-348: una sola acción para sumar amigos; con un enlace a la vista, la acción es compartirlo.
    +invite
    +`<details class="streak-social-settings"><summary>${chevron()}Alias y privacidad</summary>${streakAliasForm(true)}<button class="btn" type="button" onclick="disableStreakSocial()" ${busy}>Dejar de comparar mi racha</button></details>`+fallback;
}
