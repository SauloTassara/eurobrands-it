import{bindLanguageLinks}from'./i18n.js';
import{getPerformanceTier,supportsWebGL}from'./capabilities.js';

const body=document.body;
const shell=document.querySelector('.site-shell');
const drawer=document.querySelector('#contact-panel');
const backdrop=document.querySelector('.drawer-backdrop');
const openers=[...document.querySelectorAll('[data-open-contact]')];
const closer=drawer?.querySelector('[data-close-contact]');
let previousFocus=null;

drawer?.setAttribute('aria-hidden','true');

bindLanguageLinks();

const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
let pointerTargetX=innerWidth*.68,pointerTargetY=innerHeight*.46,pointerX=pointerTargetX,pointerY=pointerTargetY,pointerOpacity=0,pointerOpacityTarget=0,pointerFrame=0,pointerLast=performance.now();

function updatePointer(event){
  if(reducedMotion.matches||!finePointer.matches)return;
  pointerTargetX=event.clientX;pointerTargetY=event.clientY;pointerOpacityTarget=1;
}
function releasePointer(){pointerOpacityTarget=0;}
function animatePointer(now){
  const delta=Math.min((now-pointerLast)/1000,.05),damping=1-Math.exp(-delta*7);pointerLast=now;
  pointerX+=(pointerTargetX-pointerX)*damping;pointerY+=(pointerTargetY-pointerY)*damping;pointerOpacity+=(pointerOpacityTarget-pointerOpacity)*damping;
  shell?.style.setProperty('--pointer-x',`${(pointerX/innerWidth)*100}%`);shell?.style.setProperty('--pointer-y',`${(pointerY/innerHeight)*100}%`);shell?.style.setProperty('--pointer-opacity',pointerOpacity.toFixed(3));
  pointerFrame=requestAnimationFrame(animatePointer);
}
if(shell&&finePointer.matches&&!reducedMotion.matches){shell.addEventListener('pointermove',updatePointer,{passive:true});shell.addEventListener('pointerleave',releasePointer,{passive:true});pointerFrame=requestAnimationFrame(animatePointer);}
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(pointerFrame);}else if(shell&&finePointer.matches&&!reducedMotion.matches){pointerLast=performance.now();pointerFrame=requestAnimationFrame(animatePointer);}});

function focusable(){
  return[...drawer.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden);
}

function openDrawer(){
  previousFocus=document.activeElement;
  body.classList.add('drawer-open');
  drawer.setAttribute('aria-hidden','false');
  openers.forEach(button=>button.setAttribute('aria-expanded','true'));
  closer.focus({preventScroll:true});
  if(window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    gsap.fromTo('.contact-card',{y:18,opacity:0},{y:0,opacity:1,duration:.65,stagger:.09,ease:'power3.out',delay:.12});
    gsap.fromTo('.membership',{y:12,opacity:0},{y:0,opacity:1,duration:.55,ease:'power2.out',delay:.3});
  }
}

function closeDrawer(){
  body.classList.remove('drawer-open');
  drawer.setAttribute('aria-hidden','true');
  openers.forEach(button=>button.setAttribute('aria-expanded','false'));
  previousFocus?.focus({preventScroll:true});
}

openers.forEach(button=>button.addEventListener('click',openDrawer));
closer?.addEventListener('click',closeDrawer);
backdrop?.addEventListener('click',closeDrawer);

document.addEventListener('keydown',event=>{
  if(!body.classList.contains('drawer-open'))return;
  if(event.key==='Escape'){event.preventDefault();closeDrawer();return;}
  if(event.key!=='Tab')return;
  const items=focusable();
  if(!items.length)return;
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});

function intro(){
  if(!window.gsap||reducedMotion.matches)return;
  gsap.set('[data-reveal]',{yPercent:110,opacity:0});
  const tl=gsap.timeline({defaults:{ease:'power3.out'}});
  tl.fromTo('.brand',{opacity:0,y:-8},{opacity:1,y:0,duration:.45})
    .fromTo('.header-actions',{opacity:0,y:-8},{opacity:1,y:0,duration:.42},'<.1')
    .fromTo('.topline',{opacity:0,y:10},{opacity:1,y:0,duration:.38},'<.04')
    .to('[data-reveal]',{yPercent:0,opacity:1,duration:.64,stagger:.07},'<.03')
    .fromTo('.intro',{opacity:0,y:14},{opacity:1,y:0,duration:.48},'<.22')
    .fromTo('.hero-actions',{opacity:0,y:12},{opacity:1,y:0,duration:.42},'<.1')
    .fromTo('.territories',{opacity:0},{opacity:1,duration:.5},'<.12')
    .fromTo('.site-footer',{opacity:0},{opacity:1,duration:.42},'<');
}

intro();

const perf=getPerformanceTier();
document.documentElement.dataset.performance=perf.tier;
body.classList.add('webgl-pending');
function webglFailed(){body.classList.remove('webgl-pending','webgl-loading','webgl-ready');body.classList.add('webgl-failed');}
if(supportsWebGL()&&!perf.reduced){
  const loaderTimer=setTimeout(()=>{if(body.classList.contains('webgl-pending')){body.classList.remove('webgl-pending');body.classList.add('webgl-loading');}},180);
  requestAnimationFrame(async()=>{
    try{
      const{createScene}=await import('./scene.js');
      await createScene(document.querySelector('#scene'),perf,{onFirstFrame(){clearTimeout(loaderTimer);body.classList.remove('webgl-pending','webgl-loading','webgl-failed');body.classList.add('webgl-ready');}});
    }catch{clearTimeout(loaderTimer);webglFailed();}
  });
}else{body.classList.remove('webgl-pending');body.classList.add(perf.reduced?'reduced-webgl':'webgl-failed');}
