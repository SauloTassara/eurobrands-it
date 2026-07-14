export function getPerformanceTier(){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData=Boolean(navigator.connection?.saveData);
  const memory=navigator.deviceMemory||4;
  const cores=navigator.hardwareConcurrency||4;
  const narrow=innerWidth<760;
  if(reduced||saveData||memory<=2||cores<=2)return{tier:'low',dpr:1,particles:28,reflection:false,reduced};
  if(narrow||memory<=4||cores<=4)return{tier:'medium',dpr:Math.min(devicePixelRatio,1.35),particles:54,reflection:true,reduced};
  return{tier:'high',dpr:Math.min(devicePixelRatio,1.75),particles:92,reflection:true,reduced};
}

export function supportsWebGL(){
  try{
    const canvas=document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2')||canvas.getContext('webgl'));
  }catch{return false;}
}
