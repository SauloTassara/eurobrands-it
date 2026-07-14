import*as THREE from'../vendor/three/three.module.min.js';
import{RoomEnvironment}from'../vendor/three/RoomEnvironment.js';

const OLIVE=0x101d14,RUBY=0x3b0713,COPPER=0xd58d6d,IVORY=0xeee7d8;

export function createScene(canvas,options){
  if(!canvas)return;
  const host=canvas.parentElement,scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x09110b,.038);
  const camera=new THREE.PerspectiveCamera(29,1,.1,80);camera.position.set(0,.1,16.4);
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:options.tier!=='low',powerPreference:options.tier==='high'?'high-performance':'default'});
  renderer.setPixelRatio(options.dpr);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;renderer.shadowMap.enabled=options.tier==='high';renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.debug.checkShaderErrors=false;
  const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.traverse(n=>{n.geometry?.dispose?.();n.material?.dispose?.();});pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xdce8da,0x030705,.55));
  const key=new THREE.RectAreaLight(0xffb18f,24,3.2,7.5);key.position.set(4.2,2.1,5.4);key.lookAt(0,.2,0);scene.add(key);
  const rim=new THREE.RectAreaLight(0x9ac7ac,16,2.1,8);rim.position.set(-4.4,1.4,-1.8);rim.lookAt(0,.3,0);scene.add(rim);
  const topLight=new THREE.SpotLight(0xffdfc8,22,18,.34,.65,1.5);topLight.position.set(.8,7,4);topLight.target.position.set(0,0,0);scene.add(topLight,topLight.target);

  const stage=new THREE.Group(),bottle=new THREE.Group();stage.add(bottle);scene.add(stage);
  const segments=options.tier==='low'?48:options.tier==='medium'?64:96;
  const profile=[
    [0,-3.42],[.46,-3.42],[.76,-3.39],[.89,-3.31],[.96,-3.16],[.985,-2.94],
    [.985,1.12],[.97,1.22],[.84,1.36],[.58,1.55],[.38,1.70],[.30,1.85],
    [.295,2.12],[.295,3.28],[.33,3.38]
  ].map(([x,y])=>new THREE.Vector2(x,y));
  const bottleGeometry=new THREE.LatheGeometry(profile,segments);bottleGeometry.computeVertexNormals();
  const glass=new THREE.MeshPhysicalMaterial({color:OLIVE,roughness:.15,metalness:0,transmission:.075,transparent:false,opacity:1,thickness:1.05,ior:1.49,clearcoat:1,clearcoatRoughness:.065,attenuationColor:new THREE.Color(0x071109),attenuationDistance:.42,envMapIntensity:2.2,side:THREE.FrontSide});
  const shell=new THREE.Mesh(bottleGeometry,glass);shell.castShadow=true;shell.receiveShadow=true;bottle.add(shell);

  const innerProfile=[[0,-3.18],[.48,-3.18],[.80,-3.14],[.84,-3.03],[.85,-2.82],[.85,.88],[.82,1.03],[.68,1.27],[.48,1.48],[.27,1.72],[.255,2.12],[.255,3.18]].map(([x,y])=>new THREE.Vector2(x,y));
  const innerGeometry=new THREE.LatheGeometry(innerProfile,segments);
  const wine=new THREE.MeshPhysicalMaterial({color:RUBY,emissive:0x28030b,emissiveIntensity:.3,roughness:.17,metalness:0,transmission:.04,transparent:true,opacity:.97,thickness:1.4,ior:1.37,clearcoat:.7,clearcoatRoughness:.11,attenuationColor:new THREE.Color(RUBY),attenuationDistance:.55,side:THREE.DoubleSide});
  const liquidProfile=[[0,-3.16],[.48,-3.16],[.79,-3.12],[.83,-3.0],[.84,-2.82],[.84,.54],[0,.54]].map(([x,y])=>new THREE.Vector2(x,y));
  const liquid=new THREE.Mesh(new THREE.LatheGeometry(liquidProfile,segments),wine);bottle.add(liquid);
  const meniscus=new THREE.Mesh(new THREE.CircleGeometry(.835,segments),new THREE.MeshPhysicalMaterial({color:0x7d1824,roughness:.12,transmission:.08,transparent:true,opacity:.92,side:THREE.DoubleSide}));meniscus.rotation.x=-Math.PI/2;meniscus.position.y=.55;bottle.add(meniscus);

  const innerGlass=new THREE.MeshPhysicalMaterial({color:0x294330,roughness:.08,transmission:.45,transparent:true,opacity:.2,thickness:.18,ior:1.49,side:THREE.BackSide,depthWrite:false});
  const innerShell=new THREE.Mesh(innerGeometry,innerGlass);bottle.add(innerShell);
  const baseRing=new THREE.Mesh(new THREE.TorusGeometry(.73,.09,18,segments),new THREE.MeshPhysicalMaterial({color:0x16281b,roughness:.1,transmission:.18,transparent:true,opacity:.92,clearcoat:1}));baseRing.rotation.x=Math.PI/2;baseRing.position.y=-3.34;bottle.add(baseRing);
  const punt=new THREE.Mesh(new THREE.SphereGeometry(.43,32,16),innerGlass.clone());punt.scale.set(1,.26,1);punt.position.y=-3.27;bottle.add(punt);

  const capsuleMat=new THREE.MeshPhysicalMaterial({color:0x2b1814,metalness:.48,roughness:.24,clearcoat:.75,clearcoatRoughness:.12,envMapIntensity:1.7});
  const capsule=new THREE.Mesh(new THREE.CylinderGeometry(.34,.325,.88,segments,1,false),capsuleMat);capsule.position.y=2.94;bottle.add(capsule);
  const capsuleBand=new THREE.Mesh(new THREE.TorusGeometry(.343,.035,14,segments),new THREE.MeshStandardMaterial({color:COPPER,metalness:.72,roughness:.25}));capsuleBand.rotation.x=Math.PI/2;capsuleBand.position.y=2.54;bottle.add(capsuleBand);
  const neckRing=new THREE.Mesh(new THREE.TorusGeometry(.355,.06,18,segments),capsuleMat);neckRing.rotation.x=Math.PI/2;neckRing.position.y=3.39;bottle.add(neckRing);
  const corkMat=new THREE.MeshStandardMaterial({color:0x9a6746,roughness:.88,metalness:0});
  const cork=new THREE.Mesh(new THREE.CylinderGeometry(.245,.255,.24,32),corkMat);cork.position.y=3.47;bottle.add(cork);
  const corkTop=new THREE.Mesh(new THREE.CircleGeometry(.245,32),corkMat);corkTop.rotation.x=-Math.PI/2;corkTop.position.y=3.595;bottle.add(corkTop);

  const labelTexture=makeLabelTexture();labelTexture.colorSpace=THREE.SRGBColorSpace;labelTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const labelMat=new THREE.MeshStandardMaterial({map:labelTexture,color:0xfff4df,roughness:.84,metalness:0,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const label=new THREE.Mesh(new THREE.CylinderGeometry(1.003,1.003,1.43,segments,1,true,-.72,1.44),labelMat);label.position.set(0,-.67,0);bottle.add(label);

  const contactLight=new THREE.PointLight(0xffb18f,10,4,2);contactLight.position.set(-.94,-.13,1.05);stage.add(contactLight);
  const internalLight=new THREE.PointLight(0x701126,7,5,2);internalLight.position.set(.15,-1.2,.15);bottle.add(internalLight);
  const glow=makeGlowSprite(0xc9795e,.34);glow.scale.set(5.2,7.2,1);glow.position.set(0,-.2,-2.7);stage.add(glow);

  const contact=makeGlowSprite(0xffc2a1,.95);contact.scale.set(.34,.34,1);contact.position.set(-.9,-.05,1.04);stage.add(contact);

  const waterUniforms={uTime:{value:0}};
  const water=new THREE.Mesh(new THREE.CircleGeometry(4.6,96),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:waterUniforms,vertexShader:`uniform float uTime;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z+=sin((p.x+p.y)*5.+uTime)*.012;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float uTime;varying vec2 vUv;void main(){float d=distance(vUv,vec2(.5));float rings=.5+.5*sin(d*88.-uTime*2.2);float fade=1.-smoothstep(.05,.5,d);vec3 c=mix(vec3(.10,.18,.12),vec3(.78,.43,.31),rings*.42);gl_FragColor=vec4(c,fade*(.045+rings*.11));}`}));water.rotation.x=-Math.PI/2;water.position.y=-3.5;water.position.z=.15;stage.add(water);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.45,64),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.42,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(0,-3.47,.1);shadow.scale.y=.42;stage.add(shadow);

  let reflection=null;
  if(options.reflection){reflection=bottle.clone(true);reflection.traverse(n=>{if(n.isLight)n.visible=false;if(n.isMesh){n.material=n.material.clone();n.material.transparent=true;n.material.opacity=.075;n.material.depthWrite=false;}});reflection.scale.set(1,-.29,1);reflection.position.y=-4.48;reflection.rotation.z=.012;stage.add(reflection);}

  const particlesGeometry=new THREE.BufferGeometry(),positions=[];for(let i=0;i<options.particles;i++){const a=Math.random()*Math.PI*2,r=1.6+Math.random()*2.5;positions.push(Math.cos(a)*r,-2.5+Math.random()*5.8,Math.sin(a)*r-1.2);}particlesGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const particles=new THREE.Points(particlesGeometry,new THREE.PointsMaterial({color:0xd99a7a,size:options.tier==='high'?.028:.021,transparent:true,opacity:.34,sizeAttenuation:true,depthWrite:false}));stage.add(particles);

  const target={x:0,y:0};function onPointerMove(e){const r=canvas.getBoundingClientRect();target.y=((e.clientX-r.left)/r.width*2-1)*.34;target.x=((e.clientY-r.top)/r.height*2-1)*.11;}function onLeave(){target.x=0;target.y=0;}canvas.addEventListener('pointermove',onPointerMove,{passive:true});canvas.addEventListener('pointerleave',onLeave,{passive:true});
  let running=true,raf=0,last=performance.now(),elapsed=0,slow=0;
  function resize(){const r=host.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),mobile=w<620;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=mobile?18.2:16.4;camera.updateProjectionMatrix();stage.position.set(mobile?.38:.28,mobile?.08:.12,0);stage.scale.setScalar(mobile?.79:.94);if(reflection)reflection.visible=!mobile;}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function animate(now){if(!running)return;const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;const drift=Math.sin(elapsed*.27)*.075;bottle.rotation.y+=(target.y+drift-bottle.rotation.y)*Math.min(1,dt*3.1);bottle.rotation.x+=(target.x+Math.sin(elapsed*.19)*.018-bottle.rotation.x)*Math.min(1,dt*3);bottle.rotation.z=Math.sin(elapsed*.31)*.006;bottle.position.y=Math.sin(elapsed*.56)*.075;meniscus.rotation.z=-bottle.rotation.y*.045;particles.rotation.y+=dt*.018;contact.material.opacity=.68+Math.sin(elapsed*1.9)*.22;contact.scale.setScalar(.3+Math.sin(elapsed*1.9)*.035);contactLight.intensity=8+Math.sin(elapsed*1.9)*2.5;internalLight.intensity=5.5+Math.sin(elapsed*.7)*1.2;glow.material.opacity=.27+Math.sin(elapsed*.42)*.045;waterUniforms.uTime.value=elapsed;if(reflection)reflection.rotation.y=bottle.rotation.y*.42;renderer.render(scene,camera);if(dt>.042)slow++;else slow=Math.max(0,slow-1);if(slow>90&&renderer.getPixelRatio()>1){renderer.setPixelRatio(1);resize();slow=0;}raf=requestAnimationFrame(animate);}
  function setRunning(v){if(v===running)return;running=v;if(v){last=performance.now();raf=requestAnimationFrame(animate);}else cancelAnimationFrame(raf);}document.addEventListener('visibilitychange',()=>setRunning(!document.hidden));addEventListener('blur',()=>setRunning(false));addEventListener('focus',()=>setRunning(true));canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setRunning(false);document.body.classList.remove('webgl-ready');document.body.classList.add('webgl-failed');});canvas.addEventListener('webglcontextrestored',()=>location.reload());document.body.classList.add('webgl-ready');raf=requestAnimationFrame(animate);
  return()=>{setRunning(false);observer.disconnect();canvas.removeEventListener('pointermove',onPointerMove);canvas.removeEventListener('pointerleave',onLeave);scene.traverse(n=>{n.geometry?.dispose?.();if(n.material){(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>m.dispose?.());}});environment.dispose();labelTexture.dispose();renderer.dispose();};
}

function makeLabelTexture(){const c=document.createElement('canvas');c.width=1024;c.height=768;const x=c.getContext('2d');x.fillStyle='#eee3cf';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#a8684c';x.lineWidth=10;x.strokeRect(34,34,c.width-68,c.height-68);x.textAlign='center';x.fillStyle='#0c1a10';x.font='600 92px Manrope, Arial, sans-serif';x.fillText('EUROBRANDS',512,326);x.font='600 34px Manrope, Arial, sans-serif';x.fillText('ORIGIN IN MOTION',512,435);x.fillStyle='#9d5f45';x.font='600 29px Manrope, Arial, sans-serif';x.fillText('ITALIA · EUROPA · PERÙ',512,525);x.fillStyle='#0c1a10';x.font='600 25px Manrope, Arial, sans-serif';x.fillText('CONCEPT EDITION',512,618);const texture=new THREE.CanvasTexture(c);const mark=new Image();mark.onload=()=>{x.drawImage(mark,454,74,116,116);texture.needsUpdate=true;};mark.src='/assets/logos/eurobrands-symbol-black.svg';return texture;}
function makeGlowSprite(color,opacity){const c=document.createElement('canvas');c.width=192;c.height=192;const x=c.getContext('2d'),g=x.createRadialGradient(96,96,0,96,96,96);g.addColorStop(0,'rgba(255,255,255,.96)');g.addColorStop(.17,'rgba(255,183,145,.52)');g.addColorStop(1,'rgba(255,140,100,0)');x.fillStyle=g;x.fillRect(0,0,192,192);const texture=new THREE.CanvasTexture(c);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));sprite.userData.texture=texture;return sprite;}
