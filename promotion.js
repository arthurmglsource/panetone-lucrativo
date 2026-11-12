/* Front-end preview only: checkout remains unavailable.
 * Before enabling purchases, enforce the same expiry in the checkout platform.
 * A storage deadline is not a server-enforced promotion or eligibility proof.
 * Bump the campaign key only for a genuinely new promotional campaign.
 */
(function(){
 'use strict';
 var bar=document.querySelector('[data-promo-bar]');if(!bar)return;
 var clock=bar.querySelector('[data-promo-clock]'),message=bar.querySelector('[data-promo-message]'),label=bar.querySelector('[data-promo-label]'),status=bar.querySelector('[data-promo-status]');
 var KEY='pqr:christmas-2026:bonus-window:v1',DURATION=15*60*1000,deadline,lastSeconds=null,interval;
 function size(){document.documentElement.style.setProperty('--promo-height',Math.ceil(bar.getBoundingClientRect().height)+'px');}
 if('ResizeObserver' in window)new ResizeObserver(size).observe(bar);else window.addEventListener('resize',size);size();
 function unavailable(){bar.classList.add('is-unavailable');message.textContent='3 BÓNUS INCLUÍDOS NA SUA COMPRA';status.textContent='Contagem indisponível.';size();}
 try{
  var saved=localStorage.getItem(KEY);
  if(saved!==null){
   var data=JSON.parse(saved);
   if(!data||!Number.isFinite(data.startedAt)||!Number.isFinite(data.expiresAt)||data.expiresAt-data.startedAt!==DURATION||data.expiresAt>Date.now()+DURATION){unavailable();return;}
   deadline=data.expiresAt;
  }else{
   var start=Date.now();deadline=start+DURATION;
   localStorage.setItem(KEY,JSON.stringify({startedAt:start,expiresAt:deadline}));
  }
 }catch(e){unavailable();return;}
 function tick(){
  var seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
  if(seconds===lastSeconds)return;lastSeconds=seconds;
  if(seconds===0){
   clock.textContent='Prazo terminado';clock.setAttribute('aria-label','Prazo promocional terminado');clock.dateTime=new Date(deadline).toISOString();
   bar.classList.add('is-expired');message.textContent='O PRAZO DESTA PROMOÇÃO TERMINOU';label.textContent='Estado da oferta:';
   status.textContent='O prazo promocional terminou.';clearInterval(interval);size();return;
  }
  var mins=Math.floor(seconds/60),secs=seconds%60;
  clock.textContent=String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0');clock.dateTime='PT'+mins+'M'+secs+'S';clock.setAttribute('aria-label',mins+' minutos e '+secs+' segundos restantes');
 }
 interval=setInterval(tick,1000);tick();
 document.addEventListener('visibilitychange',function(){if(!document.hidden)tick();});
 window.addEventListener('pageshow',tick);
 window.addEventListener('storage',function(e){if(e.key===KEY){window.location.reload();}});
})();
