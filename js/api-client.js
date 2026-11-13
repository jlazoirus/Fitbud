// shared-module
// NAT-07 — transporte compartido. Red, sesión, reloj y plataforma inyectados.
(function(root){
  "use strict";
  const ENDPOINT=/^\/api\/(config|claude|entitlement|privacy|push-subscribe|analytics|catalog|checkout)(?:\?[^#\s]*)?$/;
  function apiError(message,status,data){
    const error=new Error(message);
    if(status!=null)error.status=status;
    if(data&&data.code)error.code=String(data.code);
    if(status===402){
      error.paywall=true;error.expired=!!(data&&data.expired);
      error.trialLimit=!!(data&&data.trialLimit);error.trial=(data&&data.trial)||null;
    }
    return error;
  }
  function createApiClient(options){
    // Invocar los puertos como funciones, sin usar options como receptor:
    // las APIs del navegador rechazan un `this` ajeno con Illegal invocation.
    const {fetch:send,getAccessToken:readToken,setTimeout:schedule,clearTimeout:cancel,AbortController:RequestController}=options;
    const baseUrl=String(options.baseUrl||"").replace(/\/+$/,"");
    if(baseUrl&&!/^https?:\/\/[^/?#\s]+$/.test(baseUrl))throw new Error("Invalid API baseUrl");
    if(typeof send!=="function")throw new Error("Inject an API transport");
    function urlFor(route){
      if(!ENDPOINT.test(route))throw new Error("Unsupported API route");
      return baseUrl+route;
    }
    async function transport(route,init,policy){
      // Validar ANTES de leer la sesión: nunca mandar Bearer a una URL ajena.
      const url=urlFor(route),headers={};
      const input=(init&&init.headers)||{};
      if(Array.isArray(input))input.forEach(([key,value])=>{headers[key]=value;});
      else if(typeof input.forEach==="function")input.forEach((value,key)=>{headers[key]=value;});
      else Object.assign(headers,input);
      const has=name=>Object.keys(headers).some(key=>key.toLowerCase()===name);
      if(options.client&&!has("x-evolv-client"))headers["X-Evolv-Client"]=options.client;
      if(options.appVersion&&!has("x-evolv-app-version"))headers["X-Evolv-App-Version"]=options.appVersion;
      const publicRoute=/^\/api\/(config|catalog)(?:\?|$)/.test(route);
      if(!publicRoute&&(!policy||policy.auth!==false)&&!has("authorization")){
        const token=readToken?await readToken():null;
        if(token)headers.Authorization="Bearer "+token;
      }
      return send(url,Object.assign({},init,{headers}));
    }
    async function request(route,init,policy){
      const config=policy||{},requestInit=Object.assign({},init);
      let controller,timer,onAbort;
      const originalSignal=requestInit.signal;
      if(config.timeoutMs>0){
        controller=new RequestController();
        timer=schedule(()=>controller.abort(),config.timeoutMs);
        if(originalSignal){
          onAbort=()=>controller.abort();
          if(originalSignal.aborted)onAbort();
          else originalSignal.addEventListener("abort",onAbort,{once:true});
        }
        requestInit.signal=controller.signal;
      }
      try{
        const response=await transport(route,requestInit,config);
        let data;
        try{data=await response.json();}
        catch(error){
          if(controller&&controller.signal.aborted)throw error;
          if(config.lenientJson)data={};
          else throw apiError("No pudimos leer la respuesta. Inténtalo de nuevo.",response.status,{code:"invalid_json"});
        }
        if(controller&&controller.signal.aborted)throw apiError("Solicitud cancelada.",null,{code:"aborted"});
        if(!response.ok)throw apiError((data&&data.error)||(response.status===402?(config.paywallMessage||"Tu acceso no está activo."):("Error "+response.status)),response.status,data);
        return data;
      }catch(error){
        if(controller&&controller.signal.aborted&&!(originalSignal&&originalSignal.aborted)){
          throw apiError(config.timeoutMessage||"La solicitud tardó demasiado. Inténtalo de nuevo.",null,{code:"timeout"});
        }
        throw error;
      }finally{
        if(timer!==undefined)cancel(timer);
        if(onAbort)originalSignal.removeEventListener("abort",onAbort);
      }
    }
    async function coach(payload,config){
      const settings=config||{},quota=payload&&payload.quota;
      if(!quota||!quota.action||!quota.requestId)throw new Error("La acción del coach no tiene una reserva válida.");
      // Se serializa una sola vez: los reintentos conservan la reserva y la
      // parte originales, sin crear consumo ni regeneraciones duplicadas.
      const body=JSON.stringify(payload);
      const pause=ms=>new Promise(resolve=>schedule(resolve,ms));
      for(let attempt=0;attempt<2;attempt++){
        try{
          return await request("/api/claude",{
            method:"POST",headers:{"content-type":"application/json"},body,
          },{
            timeoutMs:settings.timeoutMs||90000,lenientJson:true,
            paywallMessage:settings.paywallMessage,
            timeoutMessage:settings.timeoutMessage||"Tu coach tardó demasiado en responder. Inténtalo de nuevo en un momento.",
          });
        }catch(error){
          if(error.status===404&&settings.notFoundMessage)throw new Error(settings.notFoundMessage);
          if(attempt===0&&error.status===409){await pause(350);continue;}
          if(attempt===0&&/fetch|network|conexi|proceso/i.test(String(error&&error.message||error))){await pause(250);continue;}
          throw error;
        }
      }
    }
    return{fetch:transport,request,coach};
  }
  root.FITBUD_API_CLIENT={createApiClient};
})(typeof window!=="undefined"?window:globalThis);
