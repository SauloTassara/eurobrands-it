import{bindLanguageLinks}from'./i18n.js?v=20260717-bottle-continuity-1';
import{detectCapabilities,getPerformanceTier,supportsWebGL}from'./capabilities.js?v=20260717-bottle-continuity-1';
import{initNarrative}from'./narrative.js?v=20260717-bottle-continuity-1';

const BUILD_ID='20260717-bottle-continuity-1';
const body=document.body,shell=document.querySelector('.site-shell'),drawer=document.querySelector('#contact-panel'),backdrop=document.querySelector('.drawer-backdrop');
const openers=[...document.querySelectorAll('[data-open-contact]')],closer=drawer?.querySelector('[data-close-contact]'),motionButton=document.querySelector('[data-motion-toggle]'),retryButton=document.querySelector('[data-webgl-retry]');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)'),finePointer=matchMedia('(hover:hover) and (pointer:fine)'),motionStorageKey='eurobrands:3d-motion';
let previousFocus=null,sceneController=null,narrativeController=null,webglInitializing=false,narrativeInitializing=false,sceneFrameReady=false;

drawer?.setAttribute('aria-hidden','true');bindLanguageLinks();
const capabilityMap=detectCapabilities();
for(const[name,enabled]of Object.entries(capabilityMap))document.documentElement.classList.toggle(`${enabled?'supports':'no'}-${name.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)}`,enabled);
function storedMotion(){try{return localStorage.getItem(motionStorageKey);}catch{return null;}}
function preferredMotion(){const stored=storedMotion();return stored==='enabled'?true:stored==='reduced'?false:!reducedMotion.matches;}
let motionEnabled=preferredMotion();
let pointerTargetX=innerWidth*.68,pointerTargetY=innerHeight*.46,pointerX=pointerTargetX,pointerY=pointerTargetY,pointerOpacity=0,pointerOpacityTarget=0,pointerFrame=0,pointerLast=performance.now(),pointerBound=false;
function updatePointer(event){if(!motionEnabled||!finePointer.matches)return;pointerTargetX=event.clientX;pointerTargetY=event.clientY;pointerOpacityTarget=1;}
function releasePointer(){pointerOpacityTarget=0;}
function animatePointer(now){if(!pointerBound)return;const delta=Math.min((now-pointerLast)/1000,.05),damping=1-Math.exp(-delta*7);pointerLast=now;pointerX+=(pointerTargetX-pointerX)*damping;pointerY+=(pointerTargetY-pointerY)*damping;pointerOpacity+=(pointerOpacityTarget-pointerOpacity)*damping;shell?.style.setProperty('--pointer-x',`${pointerX/innerWidth*100}%`);shell?.style.setProperty('--pointer-y',`${pointerY/innerHeight*100}%`);shell?.style.setProperty('--pointer-opacity',pointerOpacity.toFixed(3));pointerFrame=requestAnimationFrame(animatePointer);}
function setPointerMotion(enabled){const shouldRun=Boolean(shell&&finePointer.matches&&enabled&&!document.hidden);if(shouldRun===pointerBound)return;pointerBound=shouldRun;if(shouldRun){shell.addEventListener('pointermove',updatePointer,{passive:true});shell.addEventListener('pointerleave',releasePointer,{passive:true});pointerLast=performance.now();pointerFrame=requestAnimationFrame(animatePointer);}else{shell?.removeEventListener('pointermove',updatePointer);shell?.removeEventListener('pointerleave',releasePointer);cancelAnimationFrame(pointerFrame);pointerOpacityTarget=pointerOpacity=0;shell?.style.setProperty('--pointer-opacity','0');}}
setPointerMotion(motionEnabled);document.addEventListener('visibilitychange',()=>setPointerMotion(motionEnabled));

function focusable(){return[...drawer.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden);}
function openDrawer(){previousFocus=document.activeElement;body.classList.add('drawer-open');drawer.setAttribute('aria-hidden','false');openers.forEach(button=>button.setAttribute('aria-expanded','true'));setTimeout(()=>closer?.focus({preventScroll:true}),460);if(window.gsap&&motionEnabled){gsap.fromTo('.contact-card',{x:24,opacity:0},{x:0,opacity:1,duration:.55,stagger:.08,ease:'power3.out',delay:.12});}}
function closeDrawer(){body.classList.remove('drawer-open');drawer.setAttribute('aria-hidden','true');openers.forEach(button=>button.setAttribute('aria-expanded','false'));previousFocus?.focus({preventScroll:true});}
openers.forEach(button=>button.addEventListener('click',openDrawer));closer?.addEventListener('click',closeDrawer);backdrop?.addEventListener('click',closeDrawer);
document.addEventListener('keydown',event=>{if(!body.classList.contains('drawer-open'))return;if(event.key==='Escape'){event.preventDefault();closeDrawer();return;}if(event.key!=='Tab')return;const items=focusable();if(!items.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});

const perf=getPerformanceTier();document.documentElement.dataset.performance=perf.tier;document.documentElement.classList.toggle('low-performance',perf.tier==='low');
function updateMotionButton(){if(!motionButton)return;motionButton.setAttribute('aria-pressed',String(motionEnabled));motionButton.textContent=motionEnabled?motionButton.dataset.reduceLabel:motionButton.dataset.enableLabel;}
function applyMotion(enabled,persist=false){motionEnabled=Boolean(enabled);if(persist){try{localStorage.setItem(motionStorageKey,motionEnabled?'enabled':'reduced');}catch{}}updateMotionButton();setPointerMotion(motionEnabled);sceneController?.setMotionEnabled?.(motionEnabled);}
updateMotionButton();motionButton?.addEventListener('click',()=>{applyMotion(!motionEnabled,true);initializeNarrative();});

async function initializeNarrative(){if(narrativeInitializing)return;narrativeInitializing=true;try{if(document.readyState==='loading')await new Promise(resolve=>addEventListener('DOMContentLoaded',resolve,{once:true}));narrativeController?.dispose?.();narrativeController=await initNarrative(sceneController,{reducedMotion:!motionEnabled});}finally{narrativeInitializing=false;}}
reducedMotion.addEventListener?.('change',()=>{applyMotion(preferredMotion());initializeNarrative();});
function webglFailed(){body.classList.remove('webgl-pending','webgl-loading','webgl-ready');body.classList.add('webgl-failed');}
async function initWebGL(){if(webglInitializing)return false;if(!supportsWebGL()){webglFailed();await initializeNarrative();return false;}webglInitializing=true;sceneFrameReady=false;body.classList.remove('webgl-failed','webgl-ready');body.classList.add('webgl-pending');const loaderTimer=setTimeout(()=>{if(body.classList.contains('webgl-pending')){body.classList.remove('webgl-pending');body.classList.add('webgl-loading');}},180);let success=false;try{sceneController?.dispose?.();sceneController=null;const{createScene}=await import(`./scene.js?v=${BUILD_ID}`);sceneController=await createScene(document.querySelector('#scene'),{...perf,reducedMotion:reducedMotion.matches,motionEnabled},{onFirstFrame(event){clearTimeout(loaderTimer);sceneFrameReady=true;if(event?.restored&&sceneController)narrativeController?.sync?.({immediate:true});},onFailure(){webglFailed();}});success=true;}catch(error){clearTimeout(loaderTimer);console.warn('[EuroBrands WebGL] Scene unavailable',error);webglFailed();}finally{webglInitializing=false;}await initializeNarrative();if(success&&sceneFrameReady){body.classList.remove('webgl-pending','webgl-loading','webgl-failed');body.classList.add('webgl-ready');}return success;}
retryButton?.addEventListener('click',initWebGL);
addEventListener('pagehide',event=>{if(!event.persisted){narrativeController?.dispose?.();sceneController?.dispose?.();}});
initWebGL();
