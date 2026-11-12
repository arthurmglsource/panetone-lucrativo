(function(){'use strict';document.querySelectorAll('[data-checkout]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();document.getElementById('checkout-pendente').showModal();});});
  var countdown=document.querySelector('[data-countdown]');
  var lastCountdownMinutes=null;
  function pad(value){return String(Math.max(0,value)).padStart(2,'0');}
  function tick(){
    if(!countdown)return;
    var target=new Date(countdown.dataset.deadline).getTime();
    var distance=Math.max(0,target-Date.now());
    var totalMinutes=Math.floor(distance/60000);
    var days=Math.floor(totalMinutes/1440);
    var hours=Math.floor((totalMinutes%1440)/60);
    var minutes=totalMinutes%60;
    if(lastCountdownMinutes!==null&&lastCountdownMinutes!==totalMinutes){
      countdown.classList.remove('is-ticking');
      void countdown.offsetWidth;
      countdown.classList.add('is-ticking');
    }
    lastCountdownMinutes=totalMinutes;
    countdown.querySelector('[data-days]').textContent=pad(days);
    countdown.querySelector('[data-hours]').textContent=pad(hours);
    countdown.querySelector('[data-minutes]').textContent=pad(minutes);
  }
  tick();setInterval(tick,30000);

  var sticky=document.querySelector('[data-sticky-cta]');
  var hero=document.querySelector('.hero');
  if(sticky&&hero&&'IntersectionObserver' in window){
    new IntersectionObserver(function(entries){sticky.classList.toggle('is-visible',!entries[0].isIntersecting);},{threshold:.08}).observe(hero);
  }

  document.querySelectorAll('details').forEach(function(detail){
    detail.addEventListener('toggle',function(){if(!detail.open)return;document.querySelectorAll('details[open]').forEach(function(other){if(other!==detail)other.removeAttribute('open');});});
  });

  var revealItems=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var revealObserver=new IntersectionObserver(function(entries,observer){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.14});
    revealItems.forEach(function(item){revealObserver.observe(item);});
  }else{revealItems.forEach(function(item){item.classList.add('is-visible');});}
})();
(function(){
 var rail=document.querySelector('#whatsapp-conversas');if(!rail)return;
 var slides=Array.from(rail.children),dots=Array.from(document.querySelectorAll('[data-chat-index]')),index=0,timer;
 function update(){dots.forEach(function(d,i){d.setAttribute('aria-current',String(i===index));});}
 function go(i){index=(i+slides.length)%slides.length;rail.scrollTo({left:slides[index].offsetLeft-slides[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});update();}
 document.querySelector('[data-chat-prev]').onclick=function(){go(index-1);};document.querySelector('[data-chat-next]').onclick=function(){go(index+1);};dots.forEach(function(d,i){d.onclick=function(){go(i);};});
 rail.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(index+(e.key==='ArrowRight'?1:-1));}});
 rail.addEventListener('scroll',function(){clearTimeout(timer);timer=setTimeout(function(){var x=rail.scrollLeft;index=slides.reduce(function(best,s,i){return Math.abs(s.offsetLeft-slides[0].offsetLeft-x)<Math.abs(slides[best].offsetLeft-slides[0].offsetLeft-x)?i:best;},0);update();},120);});
 var inView=false;new IntersectionObserver(function(entries){inView=entries[0].isIntersecting;},{threshold:.2}).observe(rail);
 setInterval(function(){if(inView&&!document.hidden)go(index+1);},6500);
})();

(function(){var link=document.querySelector('[data-scroll-offer]'),offer=document.getElementById('oferta');if(!link||!offer)return;link.addEventListener('click',function(e){if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();var bar=document.querySelector('[data-promo-bar]'),offset=bar?bar.getBoundingClientRect().height:0;window.scrollTo({top:Math.max(0,offer.getBoundingClientRect().top+window.scrollY-offset-16),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});})();
