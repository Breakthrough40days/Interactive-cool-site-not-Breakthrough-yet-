import * as THREE from 'three';
const canvas=document.querySelector('#world'), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,100);camera.position.set(0,0,7.2);
const group=new THREE.Group();scene.add(group);
const N=innerWidth<700?9000:18000,pos=new Float32Array(N*3),start=new Float32Array(N*3),end=new Float32Array(N*3),seed=new Float32Array(N),color=new Float32Array(N*3);
const c1=new THREE.Color('#d7d0bd'),c2=new THREE.Color('#5d8b7d'),c3=new THREE.Color('#d4a15b');
function gaussian(){return (Math.random()+Math.random()+Math.random()+Math.random()-2)*.7}
for(let i=0;i<N;i++){const k=i*3,u=Math.random(),a=Math.random()*Math.PI*2;
 const rr=.25+Math.pow(Math.random(),1.8)*1.25;start[k]=Math.cos(a*2.3+u*9)*rr*.62+gaussian()*.15;start[k+1]=(u-.5)*3.6+gaussian()*.28;start[k+2]=Math.sin(a*1.8+u*8)*rr*.62+gaussian()*.17;
 const r=.65+Math.pow(u,.75)*2.05*(.48+Math.random()*.52),t=u*Math.PI*6+(i%2?Math.PI:0);end[k]=Math.cos(t)*r+gaussian()*.16;end[k+1]=(u-.5)*4.4+gaussian()*.16;end[k+2]=Math.sin(t)*r+gaussian()*.16;if(u>.72){const b=(u-.72)/.28;end[k]+=gaussian()*1.2*b;end[k+2]+=gaussian()*1.2*b}
 pos[k]=start[k];pos[k+1]=start[k+1];pos[k+2]=start[k+2];seed[i]=Math.random();const cc=seed[i]>.91?c3:seed[i]>.73?c2:c1;color[k]=cc.r;color[k+1]=cc.g;color[k+2]=cc.b}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(color,3));geo.setAttribute('aSeed',new THREE.BufferAttribute(seed,1));
const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{uTime:{value:0},uMouse:{value:new THREE.Vector3(99,99,0)},uMorph:{value:0},uPoint:{value:innerWidth<700?3.0:2.4}},vertexShader:`attribute float aSeed;uniform float uTime;uniform vec3 uMouse;uniform float uPoint;varying vec3 vColor;varying float vAlpha;void main(){vec3 p=position;float wave=sin(uTime*.45+aSeed*28.)*.025;p+=normalize(p+vec3(.001))*wave;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uPoint*(1.4+aSeed*1.8)*(7./-mv.z);vColor=color;vAlpha=.32+aSeed*.58;}`,fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);if(d>.5)discard;float glow=smoothstep(.5,0.,d);gl_FragColor=vec4(vColor,glow*vAlpha);}`});
const points=new THREE.Points(geo,mat);group.add(points);
const mouse=new THREE.Vector2(99,99),targetMouse=new THREE.Vector2(),ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0),hit=new THREE.Vector3();let morph=0,targetMorph=0,drag=false,last={x:0,y:0},vel={x:0,y:0},hold;
function pointerWorld(e){targetMouse.x=e.clientX/innerWidth*2-1;targetMouse.y=-(e.clientY/innerHeight)*2+1;ray.setFromCamera(targetMouse,camera);ray.ray.intersectPlane(plane,hit)}
addEventListener('pointermove',e=>{pointerWorld(e);if(drag){let dx=e.clientX-last.x,dy=e.clientY-last.y;vel.y=dx*.0035;vel.x=dy*.0025;last={x:e.clientX,y:e.clientY}}});
addEventListener('pointerdown',e=>{drag=true;last={x:e.clientX,y:e.clientY};hold=setTimeout(()=>document.querySelector('#holdMessage').classList.add('show'),650)});
addEventListener('pointerup',()=>{drag=false;clearTimeout(hold);document.querySelector('#holdMessage').classList.remove('show')});addEventListener('pointercancel',()=>{drag=false;clearTimeout(hold)});
const scenes=[...document.querySelectorAll('.scene')],sceneNo=document.querySelector('#sceneNo');let active=0;
const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>.48){active=+e.target.dataset.scene;targetMorph=active/3;sceneNo.textContent='0'+(active+1)}}),{threshold:[.48,.65]});scenes.forEach(s=>obs.observe(s));
const forty=document.querySelector('#forty');for(let i=0;i<40;i++){const d=document.createElement('i');forty.appendChild(d)}
function animate(t){requestAnimationFrame(animate);const time=t*.001;mat.uniforms.uTime.value=time;morph+=(targetMorph-morph)*.018;
 const arr=geo.attributes.position.array;
 for(let i=0;i<N;i++){const k=i*3,s=seed[i],m=morph*morph*(3-2*morph);let x=start[k]+(end[k]-start[k])*m,y=start[k+1]+(end[k+1]-start[k+1])*m,z=start[k+2]+(end[k+2]-start[k+2])*m;
  // GPU-looking tactile wake: local 3D displacement toward/away from cursor projected near z=0.
  if(!reduced&&hit){const dx=x-hit.x,dy=y-hit.y,d2=dx*dx+dy*dy,R=1.15;if(d2<R*R){const d=Math.sqrt(d2)+.001,f=(1-d/R);x+=dx/d*f*.42;y+=dy/d*f*.42;z+=Math.sin(s*30+time*3)*f*.34}}
  arr[k]+=(x-arr[k])*.12;arr[k+1]+=(y-arr[k+1])*.12;arr[k+2]+=(z-arr[k+2])*.12}
 geo.attributes.position.needsUpdate=true;if(drag){group.rotation.y+=vel.y;group.rotation.x+=vel.x;vel.x*=.92;vel.y*=.92}else{group.rotation.y+=reduced?0:.0012+vel.y;group.rotation.x+=vel.x;vel.x*=.94;vel.y*=.94}
 group.rotation.x+=( -.12-group.rotation.x)*.008;group.position.x+=(mouse.x*.12-group.position.x)*.025;renderer.render(scene,camera);
 document.querySelectorAll('.forty i').forEach((d,i)=>d.classList.toggle('on',active>=2&&i<Math.round(8+(morph-.66)*94)))}
animate(0);
addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight,p=max?scrollY/max:0;document.querySelector('#railFill').style.height=(p*100)+'%'},{passive:true});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight)});
