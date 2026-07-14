import{bindLanguageLinks}from'./i18n.js';
import{getPerformanceTier,supportsWebGL}from'./capabilities.js';

const body=document.body;
const drawer=document.querySelector('#contact-panel');
const backdrop=document.querySelector('.drawer-backdrop');
const openers=[...document.querySelectorAll('[data-open-contact]')];
const closer=drawer?.querySelector('[data-close-contact]');
let previousFocus=null;

bindLanguageLinks();

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
  if(!window.gsap||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
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
if(supportsWebGL()&&!perf.reduced){
  const start=()=>import('./scene.js').then(({createScene})=>createScene(document.querySelector('#scene'),perf)).catch(error=>{console.error('EuroBrands WebGL initialization failed',error);body.classList.add('webgl-failed');});
  if('requestIdleCallback'in window)requestIdleCallback(start,{timeout:900});else setTimeout(start,120);
}
