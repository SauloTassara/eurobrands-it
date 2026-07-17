export function getPerformanceTier(){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData=Boolean(navigator.connection?.saveData);
  const memory=navigator.deviceMemory||4;
  const cores=navigator.hardwareConcurrency||4;
  const narrow=innerWidth<760;
  if(reduced||saveData||memory<=2||cores<=2)return{tier:'low',dpr:1,particles:28,reflection:false,reducedMotion:reduced};
  if(narrow||memory<=4||cores<=4)return{tier:'medium',dpr:Math.min(devicePixelRatio,1.35),particles:54,reflection:true,reducedMotion:reduced};
  return{tier:'high',dpr:Math.min(devicePixelRatio,1.75),particles:92,reflection:true,reducedMotion:reduced};
}

export function supportsWebGL(){
  try{
    for(const type of['webgl2','webgl']){
      const canvas=document.createElement('canvas'),context=canvas.getContext(type);
      if(context){context.getExtension('WEBGL_lose_context')?.loseContext();return true;}
    }
    return false;
  }catch{return false;}
}

export function detectCapabilities(){
  const supports=(property,value)=>{try{return CSS.supports(property,value);}catch{return false;}};
  return{
    webgl2:typeof WebGL2RenderingContext!=='undefined',
    scrollTimeline:supports('animation-timeline','scroll()'),
    viewTransition:typeof document.startViewTransition==='function',
    oklch:supports('color','oklch(50% 0.1 100)'),
    p3:supports('color','color(display-p3 1 0.5 0.3)')&&matchMedia('(color-gamut: p3)').matches,
    containerQueries:supports('container-type','inline-size'),
    reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer:matchMedia('(pointer: coarse)').matches
  };
}
