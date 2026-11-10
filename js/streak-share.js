// REQ-380: una imagen local para compartir. No sube datos ni crea enlaces.
let streakImage=null;
function resetStreakImage(){
  if(streakImage)URL.revokeObjectURL(streakImage.url);
  streakImage=null;
}
function streakImageCanShare(file){
  try{return !!(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]}));}catch(_){return false;}
}
async function createStreakImage(days){
  await document.fonts.ready;
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('No se pudo crear la imagen.');
  ctx.fillStyle='#101010';ctx.fillRect(0,0,1080,1350);
  ctx.fillStyle='#d6ff3a';
  ctx.font='600 38px Unbounded, sans-serif';ctx.fillText('EVOLV',80,126);
  ctx.fillStyle='#f5f5ef';ctx.font='500 24px Manrope, sans-serif';ctx.textAlign='right';ctx.fillText('MI RACHA',1000,123);ctx.textAlign='left';
  ctx.save();ctx.translate(65,235);ctx.scale(8,8);ctx.fillStyle='#d6ff3a';ctx.fill(new Path2D(STREAK_FLAME_PATH));ctx.restore();
  ctx.fillStyle='#d6ff3a';
  let size=380;const number=String(days);
  do{ctx.font=`600 ${size}px Unbounded, sans-serif`;size-=10;}while(ctx.measureText(number).width>920&&size>60);
  ctx.fillText(number,65,815);
  ctx.fillStyle='#f5f5ef';ctx.font='600 42px Manrope, sans-serif';ctx.fillText(days===1?'DÍA DE RACHA':'DÍAS DE RACHA',80,910);
  ctx.font='400 40px Manrope, sans-serif';ctx.fillText('Un día a la vez.',80,1020);
  ctx.fillStyle='#d6ff3a';ctx.fillRect(80,1180,920,3);
  ctx.fillStyle='#f5f5ef';ctx.font='500 28px Manrope, sans-serif';ctx.fillText('evolvapp.club',80,1260);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No se pudo crear la imagen.')),'image/png'));
  return new File([blob],`evolv-racha-${days}-dias.png`,{type:'image/png'});
}
async function openStreakImage(button){
  const owner=uid(),cycle=START,days=streak();
  if(!owner||days<1){toast('Completa el día de hoy para empezar tu racha.');return;}
  if(button){button.disabled=true;button.setAttribute('aria-busy','true');}
  try{
    const file=await createStreakImage(days);
    if(uid()!==owner||START!==cycle)return;
    resetStreakImage();
    streakImage={file,days,owner,cycle,url:URL.createObjectURL(file)};
    const native=streakImageCanShare(file);
    modal(`<h3>Comparte tu racha</h3>
      <p class="muted small">Solo se comparte tu número de racha y la marca Evolv.</p>
      <img id="streakSharePreview" src="${streakImage.url}" alt="Mi racha en Evolv: ${days} ${days===1?'día':'días'}. Un día a la vez." width="1080" height="1350" style="display:block;width:100%;max-width:320px;height:auto;margin:16px auto;border-radius:12px">
      <div class="row" style="gap:10px;flex-wrap:wrap">
        ${native?'<button class="btn btn-accent" type="button" onclick="shareStreakImage(this)">Compartir imagen</button>':''}
        <button class="btn ${native?'':'btn-accent'}" type="button" onclick="downloadStreakImage()">Descargar imagen</button>
      </div>
      <p id="streakShareStatus" class="muted small" role="status">${native?'Elige una app en el menú de tu teléfono.':'Descarga la imagen y súbela a tu red social.'}</p>`,{onClose:resetStreakImage});
  }catch(e){if(uid()===owner)toast('No pudimos preparar la imagen. Inténtalo de nuevo.');}
  finally{if(button){button.disabled=false;button.removeAttribute('aria-busy');}}
}
function currentStreakImage(){
  if(streakImage&&streakImage.owner===uid()&&streakImage.cycle===START)return streakImage;
  resetStreakImage();return null;
}
function downloadStreakImage(){
  const data=currentStreakImage();if(!data)return;
  const link=document.createElement('a');link.href=data.url;link.download=data.file.name;
  document.body.appendChild(link);link.click();link.remove();
}
async function shareStreakImage(button){
  const data=currentStreakImage();if(!data)return;
  if(!streakImageCanShare(data.file)){downloadStreakImage();return;}
  if(button)button.disabled=true;
  try{
    await navigator.share({files:[data.file],title:'Mi racha en Evolv'});
  }catch(e){
    if(e.name!=='AbortError'&&currentStreakImage()===data){
      const el=document.getElementById('streakShareStatus');
      if(el)el.textContent='No se pudo abrir Compartir. Puedes descargar la imagen y subirla a tu red social.';
    }
  }finally{if(button)button.disabled=false;}
}
