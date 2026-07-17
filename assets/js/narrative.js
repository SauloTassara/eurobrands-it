const THEMES={hero:'olive',origin:'paper',bridge:'paper',motion:'copper',contact:'deep'};

export async function initNarrative(controller,{reducedMotion=false}={}){
  const body=document.body,root=document.documentElement,story=document.querySelector('.story');
  const scenes=[...document.querySelectorAll('[data-scene]')],progressLinks=[...document.querySelectorAll('[data-progress-link]')];
  if(!story||!scenes.length)return{refresh(){},dispose(){}};
  await(document.fonts?.ready||Promise.resolve());

  const activate=name=>{
    body.dataset.activeScene=name;body.dataset.theme=THEMES[name]||'olive';
    progressLinks.forEach(link=>link.dataset.progressLink===name?link.setAttribute('aria-current','step'):link.removeAttribute('aria-current'));
    controller?.setTheme?.(THEMES[name]||'olive');
  };
  activate('hero');

  if(reducedMotion||!window.gsap||!window.ScrollTrigger){
    body.classList.add('reduced-story');controller?.setNarrativeState?.('hero');
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)activate(entry.target.dataset.scene);},{rootMargin:'-42% 0px -42% 0px'});
    scenes.forEach(scene=>observer.observe(scene));
    return{refresh(){},dispose(){observer.disconnect();}};
  }

  body.classList.remove('reduced-story');
  const{gsap,ScrollTrigger}=window;gsap.registerPlugin(ScrollTrigger);ScrollTrigger.config({ignoreMobileResize:true});
  if(scrollY<24){gsap.fromTo('.brand img',{yPercent:115},{yPercent:0,duration:.65,ease:'power3.out'});gsap.fromTo('[data-reveal]',{yPercent:112},{yPercent:0,duration:.78,stagger:.08,ease:'power3.out',delay:.08});gsap.fromTo('.topline,.intro,.hero-actions',{clipPath:'inset(0 100% 0 0)',x:-18},{clipPath:'inset(0 0% 0 0)',x:0,duration:.72,stagger:.08,ease:'power3.out',delay:.16});}
  const context=gsap.context(()=>{}),media=gsap.matchMedia();let scrollFrame=0;
  const updateOverall=()=>{scrollFrame=0;const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);root.style.setProperty('--story-progress',(scrollY/max).toFixed(4));};
  const onScroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateOverall);};addEventListener('scroll',onScroll,{passive:true});updateOverall();

  const build=({mobile=false}={})=>{
    const cleanups=[];
    scenes.forEach((section,index)=>{
      const name=section.dataset.scene,content=section.querySelector('.scene-content');
      const timeline=gsap.timeline({scrollTrigger:{trigger:section,start:name==='hero'?'top top':'top bottom',end:name==='contact'?'bottom bottom':'bottom top',scrub:.82,invalidateOnRefresh:true,onEnter:()=>activate(name),onEnterBack:()=>activate(name),onUpdate:self=>{
        const p=self.progress;if(self.isActive||body.dataset.activeScene===name||(name==='contact'&&p>.999))controller?.setNarrativeProgress?.(name,p);
        if(name==='origin')root.style.setProperty('--portal-progress',Math.min(1,Math.max(0,(p-.14)/.55)).toFixed(4));
        if(name==='bridge'){
          root.style.setProperty('--route-progress',p.toFixed(4));const items=[...section.querySelectorAll('.territory')],active=Math.min(items.length-1,Math.floor(p*items.length));items.forEach((item,i)=>item.classList.toggle('is-active',i===active));
        }
        if(name==='motion')root.style.setProperty('--copper-progress',Math.min(1,p*1.65).toFixed(4));
        if(name==='contact'){root.style.setProperty('--copper-progress',Math.max(0,1-p*1.8).toFixed(4));root.style.setProperty('--portal-progress',Math.max(0,1-p*2.4).toFixed(4));root.style.setProperty('--route-progress',Math.max(0,1-p*2.2).toFixed(4));}
      }}});
      if(name==='hero')timeline.fromTo(content,{x:0,clipPath:'inset(0 0 0 0)'},{x:mobile?'-5vw':'-13vw',clipPath:'inset(0 12% 0 0)',ease:'power2.inOut'});
      if(name==='origin')timeline.fromTo(section.querySelectorAll('.origin-word'),{xPercent:i=>i%2?-10:8},{xPercent:i=>i%2?3:-4,stagger:.035,ease:'power2.inOut'},0).fromTo('.origin-note',{y:mobile?30:70},{y:mobile?-8:-20,ease:'sine.inOut'},0);
      if(name==='bridge')timeline.fromTo('.bridge-title',{x:mobile?0:'-2vw'},{x:mobile?0:'2vw',ease:'power2.inOut'},0).fromTo('.bridge-subtitle',{y:35},{y:-18,ease:'sine.inOut'},0);
      if(name==='motion')timeline.fromTo('.motion-intro span',{xPercent:i=>i?-4:3},{xPercent:i=>i?1:-1,stagger:.04,ease:'power3.inOut'},0).fromTo('.motion-steps span',{xPercent:i=>(i-1)*5},{xPercent:i=>(1-i)*2,stagger:.03,ease:'power3.inOut'},0);
      if(name==='contact')timeline.fromTo('.contact-title',{y:mobile?14:24,opacity:.35},{y:0,opacity:1,ease:'power3.inOut'},0).fromTo('.contact-action',{y:40},{y:-10,ease:'sine.inOut'},0);
      cleanups.push(()=>timeline.kill());
    });
    return()=>cleanups.forEach(cleanup=>cleanup());
  };
  media.add('(min-width: 1101px)',()=>build({mobile:false}));
  media.add('(min-width: 761px) and (max-width: 1100px)',()=>build({mobile:false}));
  media.add('(max-width: 760px)',()=>build({mobile:true}));

  let refreshTimer=0,lastWidth=innerWidth;
  const refresh=()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{controller?.resize?.();ScrollTrigger.refresh();updateOverall();},180);};
  const onResize=()=>{if(Math.abs(innerWidth-lastWidth)>2){lastWidth=innerWidth;refresh();}};
  const onOrientation=()=>refresh(),onPageShow=event=>{if(event.persisted)refresh();};
  addEventListener('resize',onResize,{passive:true});addEventListener('orientationchange',onOrientation,{passive:true});addEventListener('pageshow',onPageShow);
  controller?.resize?.();ScrollTrigger.refresh();
  return{refresh,dispose(){cancelAnimationFrame(scrollFrame);clearTimeout(refreshTimer);removeEventListener('scroll',onScroll);removeEventListener('resize',onResize);removeEventListener('orientationchange',onOrientation);removeEventListener('pageshow',onPageShow);media.revert();context.revert();}};
}
