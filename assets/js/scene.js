import*as THREE from'../vendor/three/three.module.min.js';
import{RoomEnvironment}from'../vendor/three/RoomEnvironment.js';

const OLIVE=0x101d14,COPPER=0xd58d6d,IVORY=0xeee7d8;
const MAX_YAW=THREE.MathUtils.degToRad(70),SAFE_YAW=THREE.MathUtils.degToRad(38);

function createRenderer(placeholder,options){
  const attempts=[
    {type:'webgl2',powerPreference:'high-performance'},
    {type:'webgl2',powerPreference:'default'},
    {type:'webgl',powerPreference:'default'},
    {type:'webgl',powerPreference:'low-power'}
  ];
  const failures=[];
  for(const attempt of attempts){
    const candidate=placeholder.cloneNode(false);
    try{
      const attributes={alpha:true,antialias:options.tier!=='low',depth:true,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:Boolean(options.reducedMotion),powerPreference:attempt.powerPreference,failIfMajorPerformanceCaveat:false};
      const context=candidate.getContext(attempt.type,attributes);
      if(!context)throw new Error(`${attempt.type} context unavailable`);
      const renderer=new THREE.WebGLRenderer({canvas:candidate,context,alpha:true,antialias:attributes.antialias,powerPreference:attempt.powerPreference});
      candidate.dataset.webglContext=attempt.type;candidate.dataset.powerPreference=attempt.powerPreference;
      placeholder.replaceWith(candidate);
      return{renderer,canvas:candidate};
    }catch(error){failures.push(`${attempt.type}/${attempt.powerPreference}: ${error?.message||error}`);candidate.getContext(attempt.type)?.getExtension('WEBGL_lose_context')?.loseContext();}
  }
  throw new Error(`Renderer initialization failed (${failures.join(' | ')})`);
}

export async function createScene(canvas,options,hooks={}){
  if(!canvas)throw new Error('Missing WebGL canvas');
  const host=canvas.parentElement,interactionHost=document.querySelector('.site-shell')||host,scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x09110b,.038);
  const camera=new THREE.PerspectiveCamera(29,1,.1,80);camera.position.set(0,.1,16.4);
  const rendererResult=createRenderer(canvas,options),renderer=rendererResult.renderer;canvas=rendererResult.canvas;
  renderer.setPixelRatio(options.dpr);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=options.tier==='high';renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.traverse(n=>{n.geometry?.dispose?.();n.material?.dispose?.();});pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xdce8da,0x030705,.48));
  const key=new THREE.RectAreaLight(0xffb18f,26,2.8,7.6);key.position.set(4.1,2.2,5.2);key.lookAt(0,.2,0);scene.add(key);
  const ivoryRim=new THREE.RectAreaLight(0xffead7,12,1.7,7.6);ivoryRim.position.set(-4.5,1.7,1.2);ivoryRim.lookAt(0,.4,0);scene.add(ivoryRim);
  const oliveRim=new THREE.RectAreaLight(0x71947b,9,2,7);oliveRim.position.set(-3.4,.8,-2.4);oliveRim.lookAt(0,.2,0);scene.add(oliveRim);
  const topLight=new THREE.SpotLight(0xffdfc8,20,18,.31,.68,1.5);topLight.position.set(.8,7,4);topLight.target.position.set(0,0,0);scene.add(topLight,topLight.target);

  const stage=new THREE.Group(),bottleRig=new THREE.Group(),bottle=new THREE.Group();stage.add(bottleRig);bottleRig.add(bottle);scene.add(stage);
  bottleRig.position.y=-3.42;bottle.position.y=3.42;
  const segments=options.tier==='low'?48:options.tier==='medium'?64:96;
  const profile=[[0,-3.42],[.46,-3.42],[.76,-3.39],[.89,-3.31],[.96,-3.16],[.985,-2.94],[.985,1.12],[.97,1.22],[.84,1.36],[.58,1.55],[.38,1.70],[.30,1.85],[.295,2.12],[.295,3.28],[.33,3.38]].map(([x,y])=>new THREE.Vector2(x,y));
  const bottleGeometry=new THREE.LatheGeometry(profile,segments);bottleGeometry.computeVertexNormals();
  const glass=new THREE.MeshPhysicalMaterial({color:OLIVE,roughness:.12,metalness:0,transmission:.045,transparent:false,opacity:1,thickness:1.28,ior:1.49,clearcoat:1,clearcoatRoughness:.045,attenuationColor:new THREE.Color(0x071109),attenuationDistance:.32,envMapIntensity:2.35,side:THREE.FrontSide});
  const shell=new THREE.Mesh(bottleGeometry,glass);shell.castShadow=true;shell.receiveShadow=true;bottle.add(shell);

  const fresnelUniforms={uIntensity:{value:.18},uColor:{value:new THREE.Color(COPPER)}};
  const fresnel=new THREE.Mesh(bottleGeometry,new THREE.ShaderMaterial({uniforms:fresnelUniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`varying float vFresnel;void main(){vec4 worldPosition=modelMatrix*vec4(position,1.);vec3 worldNormal=normalize(mat3(modelMatrix)*normal);vec3 viewDirection=normalize(cameraPosition-worldPosition.xyz);vFresnel=pow(1.-abs(dot(worldNormal,viewDirection)),3.2);gl_Position=projectionMatrix*viewMatrix*worldPosition;}`,fragmentShader:`uniform vec3 uColor;uniform float uIntensity;varying float vFresnel;void main(){gl_FragColor=vec4(uColor,vFresnel*uIntensity);}`}));fresnel.scale.setScalar(1.006);bottle.add(fresnel);

  const innerProfile=[[0,-3.18],[.48,-3.18],[.80,-3.14],[.84,-3.03],[.85,-2.82],[.85,.88],[.82,1.03],[.68,1.27],[.48,1.48],[.27,1.72],[.255,2.12],[.255,3.18]].map(([x,y])=>new THREE.Vector2(x,y));
  const innerGeometry=new THREE.LatheGeometry(innerProfile,segments),innerGlass=new THREE.MeshPhysicalMaterial({color:0x294330,roughness:.09,transmission:.24,transparent:true,opacity:.12,thickness:.2,ior:1.49,side:THREE.BackSide,depthWrite:false});
  bottle.add(new THREE.Mesh(innerGeometry,innerGlass));
  const baseMaterial=new THREE.MeshPhysicalMaterial({color:0x0b180f,roughness:.12,transmission:.02,clearcoat:1,clearcoatRoughness:.06});
  const baseMass=new THREE.Mesh(new THREE.CylinderGeometry(.82,.78,.25,segments),baseMaterial);baseMass.position.y=-3.22;bottle.add(baseMass);
  const baseRing=new THREE.Mesh(new THREE.TorusGeometry(.73,.09,18,segments),baseMaterial);baseRing.rotation.x=Math.PI/2;baseRing.position.y=-3.34;bottle.add(baseRing);
  const punt=new THREE.Mesh(new THREE.SphereGeometry(.43,32,16),innerGlass.clone());punt.scale.set(1,.26,1);punt.position.y=-3.27;bottle.add(punt);

  const capsuleMat=new THREE.MeshPhysicalMaterial({color:0x321117,metalness:.34,roughness:.31,clearcoat:.72,clearcoatRoughness:.16,envMapIntensity:1.65});
  const capsule=new THREE.Mesh(new THREE.CylinderGeometry(.327,.318,.62,segments,2,false),capsuleMat);capsule.position.y=3.06;bottle.add(capsule);
  const capsuleBand=new THREE.Mesh(new THREE.TorusGeometry(.326,.025,14,segments),new THREE.MeshStandardMaterial({color:COPPER,metalness:.68,roughness:.3}));capsuleBand.rotation.x=Math.PI/2;capsuleBand.position.y=2.77;bottle.add(capsuleBand);
  const neckRing=new THREE.Mesh(new THREE.TorusGeometry(.344,.048,18,segments),capsuleMat);neckRing.rotation.x=Math.PI/2;neckRing.position.y=3.36;bottle.add(neckRing);
  const corkMat=new THREE.MeshStandardMaterial({color:0xb07b55,roughness:.96,metalness:0});
  const cork=new THREE.Mesh(new THREE.CylinderGeometry(.235,.245,.16,32),corkMat);cork.position.y=3.45;bottle.add(cork);
  const corkTop=new THREE.Mesh(new THREE.CircleGeometry(.235,32),corkMat);corkTop.rotation.x=-Math.PI/2;corkTop.position.y=3.535;bottle.add(corkTop);

  const compactLabel=innerWidth<760,labelTexture=await makeLabelTexture(renderer,compactLabel);const labelMat=compactLabel?new THREE.MeshBasicMaterial({map:labelTexture,color:0xffffff,toneMapped:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}):new THREE.MeshStandardMaterial({map:labelTexture,color:0xfff6e8,roughness:.93,metalness:0,emissive:new THREE.Color(0xffffff),emissiveMap:labelTexture,emissiveIntensity:.1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const label=new THREE.Mesh(new THREE.CylinderGeometry(1.004,1.004,1.43,segments,1,true,-.72,1.44),labelMat);label.position.set(0,-.67,0);bottle.add(label);

  const internalLight=new THREE.PointLight(0x5d1a1e,4.2,4.5,2);internalLight.position.set(.12,-1.25,.1);bottle.add(internalLight);
  const glow=makeGlowSprite(0xc9795e,.3);glow.scale.set(5,7,1);glow.position.set(0,-.25,-2.7);stage.add(glow);
  const contactLight=new THREE.PointLight(0xffb18f,0,3.2,2);stage.add(contactLight);
  const contact=makeGlowSprite(0xffc2a1,0);contact.scale.set(.28,.28,1);stage.add(contact);
  const ripple=makeGlowSprite(0xd58d6d,0);ripple.scale.set(.6,.6,1);stage.add(ripple);

  const waterUniforms={uTime:{value:0},uContact:{value:0}};
  const water=new THREE.Mesh(new THREE.CircleGeometry(4.6,96),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:waterUniforms,vertexShader:`uniform float uTime;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z+=sin((p.x+p.y)*5.+uTime)*.012;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float uTime;uniform float uContact;varying vec2 vUv;void main(){float d=distance(vUv,vec2(.5));float rings=.5+.5*sin(d*88.-uTime*2.2);float fade=1.-smoothstep(.05,.5,d);vec3 c=mix(vec3(.10,.18,.12),vec3(.78,.43,.31),rings*(.42+uContact*.18));gl_FragColor=vec4(c,fade*(.045+rings*.11+uContact*.045));}`}));water.rotation.x=-Math.PI/2;water.position.y=-3.5;water.position.z=.15;stage.add(water);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.45,64),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.46,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(0,-3.47,.1);shadow.scale.y=.42;stage.add(shadow);

  let reflection=null;
  if(options.reflection){reflection=bottle.clone(true);reflection.position.y=0;reflection.traverse(n=>{if(n.isLight)n.visible=false;if(n.isMesh){n.material=n.material.clone();n.material.transparent=true;n.material.opacity=.065;n.material.depthWrite=false;}});reflection.scale.set(1,-.27,1);reflection.position.y=-4.42;reflection.rotation.z=.01;stage.add(reflection);}

  const particlesGeometry=new THREE.BufferGeometry(),positions=[];for(let i=0;i<options.particles;i++){const a=Math.random()*Math.PI*2,r=1.6+Math.random()*2.5;positions.push(Math.cos(a)*r,-2.5+Math.random()*5.8,Math.sin(a)*r-1.2);}particlesGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const particlesMaterial=new THREE.PointsMaterial({color:0xd99a7a,size:options.tier==='high'?.028:.021,transparent:true,opacity:.28,sizeAttenuation:true,depthWrite:false});const particles=new THREE.Points(particlesGeometry,particlesMaterial);stage.add(particles);

  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(2,2),contactTarget=new THREE.Vector3(),neutralContact=new THREE.Vector3(-.85,-.1,1.05);let motionEnabled=Boolean(options.motionEnabled),pointerActive=false,targetYaw=0,targetTilt=0,targetRoll=0,currentYaw=0,currentTilt=0,currentRoll=0,contactStrength=0;
  function setPointer(event){if(!motionEnabled)return;const nx=(event.clientX/innerWidth)*2-1,ny=(event.clientY/innerHeight)*2-1;targetYaw=THREE.MathUtils.clamp(nx*MAX_YAW,-MAX_YAW,MAX_YAW);targetTilt=THREE.MathUtils.clamp(-ny*THREE.MathUtils.degToRad(4),-THREE.MathUtils.degToRad(4),THREE.MathUtils.degToRad(4));targetRoll=THREE.MathUtils.clamp(-nx*THREE.MathUtils.degToRad(2),-THREE.MathUtils.degToRad(2),THREE.MathUtils.degToRad(2));pointer.set(nx,-ny);pointerActive=true;}
  function clearPointer(){targetYaw=0;targetTilt=0;targetRoll=0;pointer.set(2,2);pointerActive=false;}
  interactionHost.addEventListener('pointermove',setPointer,{passive:true});interactionHost.addEventListener('pointerdown',setPointer,{passive:true});interactionHost.addEventListener('pointerleave',clearPointer,{passive:true});

  let running=motionEnabled,raf=0,last=performance.now(),lastFrame=0,elapsed=0,slow=0;
  function resize(){const r=host.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),mobile=w<620,tabletPortrait=innerWidth>=700&&innerWidth<=900&&innerHeight>innerWidth;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=tabletPortrait?18.9:mobile?18.25:16.4;camera.updateProjectionMatrix();stage.position.set(tabletPortrait?.06:mobile?.24:.28,tabletPortrait?.02:mobile?.04:.12,0);stage.scale.setScalar(tabletPortrait?.69:mobile?.79:.94);if(reflection)reflection.visible=!mobile&&!tabletPortrait;if(document.scrollingElement)document.scrollingElement.scrollLeft=0;}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  renderer.compile(scene,camera);renderer.render(scene,camera);hooks.onFirstFrame?.();

  function physicalYaw(raw){const sign=Math.sign(raw),amount=Math.abs(raw);return sign*(amount<=SAFE_YAW?amount:SAFE_YAW+(amount-SAFE_YAW)*.22);}
  function animate(now){
    if(!running)return;if(options.tier==='low'&&now-lastFrame<33){raf=requestAnimationFrame(animate);return;}lastFrame=now;const dt=Math.min((now-last)/1000,.05),damping=1-Math.exp(-dt*4.5),lightDamping=1-Math.exp(-dt*8);last=now;elapsed+=dt;
    currentYaw=THREE.MathUtils.lerp(currentYaw,physicalYaw(targetYaw),damping);currentTilt=THREE.MathUtils.lerp(currentTilt,targetTilt,damping);currentRoll=THREE.MathUtils.lerp(currentRoll,targetRoll,damping);
    bottleRig.rotation.y=currentYaw;bottleRig.rotation.x=currentTilt;bottleRig.rotation.z=currentRoll+Math.sin(elapsed*.31)*.004;bottle.position.y=3.42+Math.sin(elapsed*.52)*.045;
    const excess=Math.max(0,Math.abs(currentYaw)-SAFE_YAW);label.rotation.y=THREE.MathUtils.lerp(label.rotation.y,-Math.sign(currentYaw)*excess*.34,damping);
    scene.updateMatrixWorld(true);let hit=null;if(pointerActive){raycaster.setFromCamera(pointer,camera);hit=raycaster.intersectObject(shell,false)[0]||null;}
    if(hit){contactTarget.copy(stage.worldToLocal(hit.point.clone()));contactStrength=THREE.MathUtils.lerp(contactStrength,1,lightDamping);}else{contactTarget.copy(neutralContact);contactStrength=THREE.MathUtils.lerp(contactStrength,0,lightDamping*.55);}
    contact.position.lerp(contactTarget,lightDamping);ripple.position.copy(contact.position);contact.material.opacity=contactStrength*.82;ripple.material.opacity=contactStrength*(.2+.08*Math.sin(elapsed*3));contact.scale.setScalar(.22+contactStrength*.12);ripple.scale.setScalar(.46+contactStrength*(.3+.08*Math.sin(elapsed*2.4)));contactLight.position.copy(contact.position);contactLight.intensity=contactStrength*11;
    particles.rotation.y+=dt*(.014+contactStrength*.026);particles.position.lerp(contactTarget.clone().multiplyScalar(contactStrength*.025),lightDamping*.35);particlesMaterial.opacity=.27+contactStrength*.16;waterUniforms.uTime.value=elapsed;waterUniforms.uContact.value=contactStrength;if(!compactLabel)labelMat.emissiveIntensity=.1+contactStrength*.05;fresnelUniforms.uIntensity.value=.15+Math.sin(elapsed*.44)*.025+Math.abs(targetYaw/MAX_YAW)*.09+contactStrength*.12;internalLight.intensity=3.8+Math.sin(elapsed*.65)*.7+contactStrength*1.2;glow.material.opacity=.25+Math.sin(elapsed*.4)*.035+contactStrength*.04;if(reflection)reflection.rotation.y=currentYaw*.34;
    renderer.render(scene,camera);if(dt>.042)slow++;else slow=Math.max(0,slow-1);if(slow>90&&renderer.getPixelRatio()>1){renderer.setPixelRatio(1);resize();slow=0;}raf=requestAnimationFrame(animate);
  }
  function setRunning(value){if(value===running)return;running=value;if(value){last=performance.now();raf=requestAnimationFrame(animate);}else cancelAnimationFrame(raf);}
  function setMotionEnabled(value){
    motionEnabled=Boolean(value);
    if(!motionEnabled){clearPointer();currentYaw=targetYaw=0;currentTilt=targetTilt=0;currentRoll=targetRoll=0;bottleRig.rotation.set(0,0,0);bottle.position.y=3.42;label.rotation.y=0;contactStrength=0;contact.material.opacity=0;ripple.material.opacity=0;contactLight.intensity=0;renderer.render(scene,camera);}
    setRunning(motionEnabled&&!document.hidden);
  }
  const onVisibility=()=>setRunning(motionEnabled&&!document.hidden),onBlur=()=>setRunning(false),onFocus=()=>setRunning(motionEnabled);document.addEventListener('visibilitychange',onVisibility);addEventListener('blur',onBlur);addEventListener('focus',onFocus);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();setRunning(false);hooks.onFailure?.();});canvas.addEventListener('webglcontextrestored',()=>{renderer.render(scene,camera);hooks.onFirstFrame?.();setRunning(motionEnabled&&!document.hidden);});if(motionEnabled)raf=requestAnimationFrame(animate);
  function dispose(){setRunning(false);observer.disconnect();interactionHost.removeEventListener('pointermove',setPointer);interactionHost.removeEventListener('pointerdown',setPointer);interactionHost.removeEventListener('pointerleave',clearPointer);document.removeEventListener('visibilitychange',onVisibility);removeEventListener('blur',onBlur);removeEventListener('focus',onFocus);scene.traverse(n=>{n.geometry?.dispose?.();if(n.material)(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>{m.map?.dispose?.();m.dispose?.();});});environment.dispose();renderer.dispose();}
  return{setMotionEnabled,dispose};
}

async function makeLabelTexture(renderer,compact){
  const markPromise=loadImage('/assets/logos/eurobrands-symbol-black.svg'),fontPromise=document.fonts?.load?.('600 184px Manrope')||Promise.resolve();const[mark]=await Promise.all([markPromise,fontPromise]);
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1536;const context=canvas.getContext('2d');
  context.fillStyle='#eee3cf';context.fillRect(0,0,canvas.width,canvas.height);const grain=context.createLinearGradient(0,0,canvas.width,canvas.height);grain.addColorStop(0,'rgba(255,255,255,.06)');grain.addColorStop(.5,'rgba(130,92,65,.025)');grain.addColorStop(1,'rgba(255,255,255,.04)');context.fillStyle=grain;context.fillRect(0,0,canvas.width,canvas.height);
  context.strokeStyle='#9b5b40';context.lineWidth=compact?20:14;context.strokeRect(66,66,canvas.width-132,canvas.height-132);context.textAlign='center';
  if(compact){context.drawImage(mark,864,190,320,320);context.fillStyle='#06120a';context.font='600 220px Manrope,Arial,sans-serif';context.fillText('EUROBRANDS',1024,805);context.fillStyle='#7f422d';context.font='600 108px Manrope,Arial,sans-serif';context.fillText('ORIGIN IN MOTION',1024,1015);context.fillStyle='#06120a';context.font='600 82px Manrope,Arial,sans-serif';context.fillText('CONCEPT EDITION',1024,1205);}else{context.drawImage(mark,914,118,220,220);context.fillStyle='#08150d';context.font='600 184px Manrope,Arial,sans-serif';context.fillText('EUROBRANDS',1024,650);context.font='600 92px Manrope,Arial,sans-serif';context.fillText('ORIGIN IN MOTION',1024,860);context.fillStyle='#87472f';context.font='600 78px Manrope,Arial,sans-serif';context.fillText('ITALIA · EUROPA · PERÙ',1024,1050);context.fillStyle='#08150d';context.font='600 66px Manrope,Arial,sans-serif';context.fillText('CONCEPT EDITION',1024,1235);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.decoding='async';image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});}
function makeGlowSprite(color,opacity){const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;const context=canvas.getContext('2d'),gradient=context.createRadialGradient(96,96,0,96,96,96);gradient.addColorStop(0,'rgba(255,255,255,.96)');gradient.addColorStop(.17,'rgba(255,183,145,.52)');gradient.addColorStop(1,'rgba(255,140,100,0)');context.fillStyle=gradient;context.fillRect(0,0,192,192);const texture=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));return sprite;}
