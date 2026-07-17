const THEMES={hero:'olive',origin:'paper',bridge:'paper',motion:'copper',contact:'deep'};
const clamp=value=>Math.min(1,Math.max(0,value));
const smoothstep=value=>{const p=clamp(value);return p*p*(3-2*p);};

export async function initNarrative(controller,{reducedMotion=false}={}){
  const body=document.body,root=document.documentElement,story=document.querySelector('.story'),portal=document.querySelector('.label-portal'),originWords=document.querySelector('.origin-words');
  const scenes=[...document.querySelectorAll('[data-scene]')],progressLinks=[...document.querySelectorAll('[data-progress-link]')];
  if(!story||!scenes.length)return{refresh(){},sync(){},dispose(){}};
  await(document.fonts?.ready||Promise.resolve());

  let portalCoverScale=8;
  const setPortalProgress=value=>{
    const progress=clamp(value),scale=.08+progress*(portalCoverScale-.08);
    root.style.setProperty('--portal-progress',progress.toFixed(4));
    root.style.setProperty('--portal-scale',scale.toFixed(4));
  };
  const setPortalOverlay=value=>root.style.setProperty('--portal-overlay-opacity',clamp(value).toFixed(4));
  const updatePortalCoverScale=()=>{
    if(!portal)return;
    const width=Math.max(1,portal.offsetWidth),height=Math.max(1,portal.offsetHeight);
    portalCoverScale=Math.max(innerWidth/width,innerHeight/height)*1.12;
    root.style.setProperty('--portal-cover-scale',portalCoverScale.toFixed(4));
    setPortalProgress(Number.parseFloat(getComputedStyle(root).getPropertyValue('--portal-progress'))||0);
  };
  const fitOriginWords=()=>{
    if(!originWords)return;
    const words=[...originWords.querySelectorAll('.origin-word')],availableWidth=originWords.clientWidth;
    if(!words.length||availableWidth<1)return;
    const mobile=innerWidth<=760,intermediate=innerWidth<=1100;
    const minSize=mobile?42:56,maxSize=mobile?94:intermediate?180:230;
    const targetWidths=mobile?[.78,.9,1]:intermediate?[.74,.9,1]:[.72,.9,1];
    words.forEach((word,index)=>{
      word.style.width='max-content';word.style.maxWidth='none';word.style.fontSize=`${maxSize}px`;
      const marginLeft=Number.parseFloat(getComputedStyle(word).marginLeft)||0,allowed=Math.max(minSize,availableWidth*targetWidths[index]-marginLeft-2);
      let low=minSize,high=maxSize;
      for(let iteration=0;iteration<16;iteration++){
        const middle=(low+high)/2;word.style.fontSize=`${middle}px`;
        if(word.scrollWidth<=allowed)low=middle;else high=middle;
      }
      word.style.fontSize=`${Math.floor(low)}px`;word.style.width='auto';word.style.maxWidth='100%';
    });
  };
  const updateOriginVisuals=progress=>{
    const p=clamp(progress),portalProgress=clamp(p/.60),paperProgress=smoothstep((p-.34)/.26),reveal=clamp((p-.60)/.18);
    const portalIn=smoothstep(p/.18),portalOut=1-smoothstep((p-.60)/.12);
    setPortalProgress(portalProgress);setPortalOverlay(portalIn*portalOut);
    root.style.setProperty('--paper-progress',paperProgress.toFixed(4));root.style.setProperty('--origin-reveal',reveal.toFixed(4));root.style.setProperty('--origin-clip',`${((1-reveal)*12).toFixed(3)}%`);
    body.classList.remove('origin-paper-covered');body.classList.toggle('origin-content-ready',p>=.595);
  };
  const activate=name=>{
    if(body.dataset.activeScene===name)return;
    body.dataset.activeScene=name;body.dataset.theme=THEMES[name]||'olive';
    progressLinks.forEach(link=>link.dataset.progressLink===name?link.setAttribute('aria-current','step'):link.removeAttribute('aria-current'));
    controller?.setTheme?.(THEMES[name]||'olive');
  };
  fitOriginWords();updatePortalCoverScale();

  const hasNarrative=Boolean(window.gsap&&window.ScrollTrigger);
  if(reducedMotion||!hasNarrative){
    body.dataset.storyMode=reducedMotion?'reduced-motion':'static-fallback';body.classList.remove('origin-paper-covered');body.classList.add('reduced-story','origin-content-ready');root.style.setProperty('--origin-reveal','1');root.style.setProperty('--origin-clip','0%');setPortalOverlay(0);controller?.setNarrativeState?.('hero');
    if(!hasNarrative)console.error('[EuroBrands narrative] GSAP or ScrollTrigger unavailable; static fallback enabled.');
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)activate(entry.target.dataset.scene);},{rootMargin:'-42% 0px -42% 0px'});
    scenes.forEach(scene=>observer.observe(scene));
    const refresh=()=>{fitOriginWords();updatePortalCoverScale();controller?.resize?.();controller?.setNarrativeState?.('hero');};
    const onResize=()=>refresh(),onOrientation=()=>refresh(),onPageShow=()=>refresh();
    addEventListener('resize',onResize,{passive:true});addEventListener('orientationchange',onOrientation,{passive:true});addEventListener('pageshow',onPageShow);
    return{refresh,sync:refresh,dispose(){observer.disconnect();removeEventListener('resize',onResize);removeEventListener('orientationchange',onOrientation);removeEventListener('pageshow',onPageShow);}};
  }

  body.dataset.storyMode='full';body.classList.remove('reduced-story','origin-content-ready','origin-paper-covered');root.style.setProperty('--origin-reveal','0');root.style.setProperty('--origin-clip','12%');
  const{gsap,ScrollTrigger}=window;gsap.registerPlugin(ScrollTrigger);ScrollTrigger.config({ignoreMobileResize:true});
  if(scrollY<24){gsap.fromTo('.brand img',{yPercent:115},{yPercent:0,duration:.65,ease:'power3.out'});gsap.fromTo('[data-reveal]',{yPercent:112},{yPercent:0,duration:.78,stagger:.08,ease:'power3.out',delay:.08});gsap.fromTo('.topline,.intro,.hero-actions',{clipPath:'inset(0 100% 0 0)',x:-18},{clipPath:'inset(0 0% 0 0)',x:0,duration:.72,stagger:.08,ease:'power3.out',delay:.16});}

  const context=gsap.context(()=>{}),media=gsap.matchMedia();let scrollFrame=0,refreshTimer=0,lastWidth=innerWidth,storyTop=0,storyScrollable=1,sceneRanges=[];
  const updateOverall=()=>{scrollFrame=0;const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);root.style.setProperty('--story-progress',(scrollY/max).toFixed(4));};
  const onScroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateOverall);};addEventListener('scroll',onScroll,{passive:true});updateOverall();
  const rangeProgress=(range,progress)=>clamp((progress-range.start)/Math.max(.000001,range.end-range.start));
  const calculateRanges=()=>{
    storyTop=story.getBoundingClientRect().top+scrollY;storyScrollable=Math.max(1,story.offsetHeight-innerHeight);
    sceneRanges=scenes.map(section=>{
      const name=section.dataset.scene,top=section.getBoundingClientRect().top+scrollY-storyTop,height=section.offsetHeight;
      const startScroll=name==='hero'?top:top-innerHeight,endScroll=top+height-(name==='origin'||name==='contact'?innerHeight:0);
      return{name,start:clamp(startScroll/storyScrollable),end:clamp(endScroll/storyScrollable),top,height};
    });
    controller?.setStoryRanges?.(sceneRanges);
  };
  const activateFromScroll=()=>{
    const center=scrollY-storyTop+innerHeight*.5;
    let active=scenes[0];
    for(const section of scenes){const top=section.getBoundingClientRect().top+scrollY-storyTop;if(center>=top)active=section;if(center<top)break;}
    activate(active.dataset.scene);
  };
  const updateSceneVisuals=progress=>{
    const byName=Object.fromEntries(sceneRanges.map(range=>[range.name,range]));
    if(!byName.origin)return;
    const originProgress=rangeProgress(byName.origin,progress),bridgeProgress=rangeProgress(byName.bridge,progress),motionProgress=rangeProgress(byName.motion,progress),contactProgress=rangeProgress(byName.contact,progress);
    updateOriginVisuals(originProgress);
    root.style.setProperty('--route-progress',bridgeProgress.toFixed(4));
    const items=[...document.querySelectorAll('.scene-bridge .territory')],active=Math.min(items.length-1,Math.floor(bridgeProgress*items.length));items.forEach((item,index)=>item.classList.toggle('is-active',index===active));
    root.style.setProperty('--copper-progress',Math.min(1,motionProgress*1.65).toFixed(4));
    if(contactProgress>0){const paperProgress=Math.max(0,1-contactProgress*2.4);root.style.setProperty('--copper-progress',Math.max(0,1-contactProgress*1.8).toFixed(4));root.style.setProperty('--paper-progress',paperProgress.toFixed(4));setPortalProgress(paperProgress);setPortalOverlay(0);root.style.setProperty('--route-progress',Math.max(0,1-contactProgress*2.2).toFixed(4));}
  };
  const storyProgress=()=>clamp((scrollY-storyTop)/storyScrollable);
  const applyStoryProgress=(progress,{immediate=false}={})=>{controller?.setStoryProgress?.(progress,{immediate});updateSceneVisuals(progress);activateFromScroll();updateOverall();};
  const syncStoryFromCurrentScroll=({immediate=true}={})=>{calculateRanges();applyStoryProgress(storyProgress(),{immediate});};

  const build=({mobile=false}={})=>{
    const cleanups=[];
    scenes.forEach(section=>{
      const name=section.dataset.scene,content=section.querySelector('.scene-content');
      const timeline=gsap.timeline({scrollTrigger:{trigger:section,start:name==='hero'?'top top':'top bottom',end:name==='origin'||name==='contact'?'bottom bottom':'bottom top',scrub:.82,invalidateOnRefresh:true}});
      if(name==='hero')timeline.fromTo(content,{x:0,clipPath:'inset(0 0 0 0)'},{x:mobile?'-5vw':'-13vw',clipPath:'inset(0 12% 0 0)',ease:'power2.inOut'});
      if(name==='origin')timeline.fromTo(section.querySelectorAll('.origin-word'),{y:mobile?12:20},{y:0,duration:.4,stagger:.02,ease:'power2.inOut'},.6).fromTo('.origin-note',{y:mobile?20:42},{y:mobile?-4:-12,duration:.4,ease:'sine.inOut'},.6);
      if(name==='bridge')timeline.fromTo('.bridge-title',{x:mobile?0:'-2vw'},{x:mobile?0:'2vw',ease:'power2.inOut'},0).fromTo('.bridge-subtitle',{y:35},{y:-18,ease:'sine.inOut'},0);
      if(name==='motion')timeline.fromTo('.motion-intro span',{xPercent:index=>index?-4:3},{xPercent:index=>index?1:-1,stagger:.04,ease:'power3.inOut'},0).fromTo('.motion-steps span',{xPercent:index=>(index-1)*5},{xPercent:index=>(1-index)*2,stagger:.03,ease:'power3.inOut'},0);
      if(name==='contact')timeline.fromTo('.contact-title',{y:mobile?14:24,opacity:.35},{y:0,opacity:1,ease:'power3.inOut'},0).fromTo('.contact-action',{y:40},{y:-10,ease:'sine.inOut'},0);
      cleanups.push(()=>timeline.kill());
    });
    return()=>cleanups.forEach(cleanup=>cleanup());
  };
  media.add('(min-width: 1101px)',()=>build({mobile:false}));media.add('(min-width: 761px) and (max-width: 1100px)',()=>build({mobile:false}));media.add('(max-width: 760px)',()=>build({mobile:true}));

  const bottleTrigger=ScrollTrigger.create({trigger:story,start:'top top',end:'bottom bottom',scrub:.75,invalidateOnRefresh:true,onRefresh:calculateRanges,onUpdate:self=>applyStoryProgress(self.progress)});
  const syncAfterRefresh=({immediate=true}={})=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{syncStoryFromCurrentScroll({immediate});resolve();})));
  const refreshNow=async()=>{fitOriginWords();updatePortalCoverScale();controller?.resize?.();ScrollTrigger.refresh();await syncAfterRefresh({immediate:true});};
  const refresh=()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshNow,180);};
  const onResize=()=>{if(Math.abs(innerWidth-lastWidth)>2){lastWidth=innerWidth;refresh();}},onOrientation=()=>refresh(),onPageShow=()=>refreshNow(),onHashChange=()=>requestAnimationFrame(()=>syncStoryFromCurrentScroll({immediate:true}));
  addEventListener('resize',onResize,{passive:true});addEventListener('orientationchange',onOrientation,{passive:true});addEventListener('pageshow',onPageShow);addEventListener('hashchange',onHashChange);
  fitOriginWords();updatePortalCoverScale();controller?.resize?.();ScrollTrigger.refresh();await syncAfterRefresh({immediate:true});
  if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target){const previousBehavior=root.style.scrollBehavior;root.style.scrollBehavior='auto';scrollTo(0,target.getBoundingClientRect().top+scrollY);root.style.scrollBehavior=previousBehavior;ScrollTrigger.update();await syncAfterRefresh({immediate:true});}}
  return{refresh,sync:options=>syncStoryFromCurrentScroll({immediate:options?.immediate!==false}),dispose(){cancelAnimationFrame(scrollFrame);clearTimeout(refreshTimer);bottleTrigger.kill();removeEventListener('scroll',onScroll);removeEventListener('resize',onResize);removeEventListener('orientationchange',onOrientation);removeEventListener('pageshow',onPageShow);removeEventListener('hashchange',onHashChange);media.revert();context.revert();}};
}
