const canvas=document.querySelector('#world'),ctx=canvas.getContext('2d',{alpha:true}),shell=document.querySelector('#worldShell');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let W=0,H=0,dpr=1,particles=[],stage=0,stageEase=0,interaction=0;
let pointer={x:-9999,y:-9999,active:false},drag={on:false,x:0,y:0,lastX:0,lastY:0},rot={x:-.12,y:-.35},targetRot={x:-.12,y:-.35},spin=.00045,holdTimer=null;
const count=innerWidth<560?900:innerWidth<900?1450:2600;
const words=['fear','comparison','overthinking','guilt','tomorrow','perfect'];
function randn(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function resize(){dpr=Math.min(devicePixelRatio||1,1.75);W=shell.clientWidth;H=shell.clientHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
function make(){
 particles=[];
 for(let i=0;i<count;i++){
  const u=Math.random(),a=Math.random()*Math.PI*2,band=Math.random();
  // Home A: compressed, tangled seed. Home B: open, ordered helix/field.
  const r0=28+Math.pow(Math.random(),1.7)*115;
  const x0=Math.cos(a*2.2+u*8)*r0*.72+randn()*14;
  const y0=(u-.5)*310+randn()*28;
  const z0=Math.sin(a*1.7+u*7)*r0*.72+randn()*16;
  const open=Math.pow(u,.8),r1=52+open*175*(.45+Math.random()*.65);
  const turn=u*Math.PI*5.4+(band>.5?0:Math.PI);
  let x1=Math.cos(turn)*r1+randn()*17,y1=(u-.5)*390+randn()*18,z1=Math.sin(turn)*r1+randn()*17;
  if(u>.7){const bloom=(u-.7)/.3;x1+=randn()*85*bloom;z1+=randn()*85*bloom}
  const word=i<words.length?words[i]:null;
  particles.push({x:x0,y:y0,z:z0,vx:0,vy:0,vz:0,x0,y0,z0,x1,y1,z1,u,size:.45+Math.random()*1.55,alpha:.22+Math.random()*.72,word});
 }
}
function home(p){
 const s=stageEase;
 // Stage 0 compressed; 1 begins opening; 2 ordered paths; 3 fully open.
 const openness=s===0?0:Math.min(1,s/3);
 let x=p.x0+(p.x1-p.x0)*openness,y=p.y0+(p.y1-p.y0)*openness,z=p.z0+(p.z1-p.z0)*openness;
 if(s>1&&s<2.6){const rhythm=(s-1)/1.6;x+=Math.sin(p.u*70)*7*rhythm;z+=Math.cos(p.u*60)*7*rhythm}
 return{x,y,z};
}
function project(p){let{x,y,z}=p,cy=Math.cos(rot.y),sy=Math.sin(rot.y),cx=Math.cos(rot.x),sx=Math.sin(rot.x);let x1=x*cy-z*sy,z1=x*sy+z*cy,y2=y*cx-z1*sx,z2=y*sx+z1*cx,scale=Math.min(W,H)/520,pers=690/(690+z2);return{x:W*.5+x1*scale*pers,y:H*.49-y2*scale*pers,z:z2,pers}}
function draw(){
 ctx.clearRect(0,0,W,H);stageEase+=(stage-stageEase)*.025;targetRot.y+=reduced?0:spin;rot.x+=(targetRot.x-rot.x)*.065;rot.y+=(targetRot.y-rot.y)*.065;
 const ordered=[];
 for(const p of particles){
  const h=home(p);p.vx+=(h.x-p.x)*.018;p.vy+=(h.y-p.y)*.018;p.vz+=(h.z-p.z)*.018;p.vx*=.895;p.vy*=.895;p.vz*=.895;p.x+=p.vx;p.y+=p.vy;p.z+=p.vz;
  const q=project(p);
  if(pointer.active&&!drag.on&&!reduced){const dx=q.x-pointer.x,dy=q.y-pointer.y,d2=dx*dx+dy*dy,R=105;if(d2<R*R&&d2>2){const d=Math.sqrt(d2),f=(1-d/R)*3.7;p.vx+=dx/d*f;p.vy-=dy/d*f;p.vz+=(Math.random()-.5)*f*2;interaction=Math.min(1,interaction+.0008)}}
  ordered.push([q,p]);
 }
 ordered.sort((a,b)=>a[0].z-b[0].z);
 for(const [q,p] of ordered){const depth=Math.max(.25,Math.min(1.2,q.pers)),warm=p.u>.72&&((p.u*1000|0)%5===0),teal=((p.u*1000|0)%7===0);ctx.beginPath();ctx.arc(q.x,q.y,p.size*depth,0,Math.PI*2);ctx.fillStyle=warm?`rgba(189,139,73,${p.alpha*.85})`:teal?`rgba(49,95,89,${p.alpha*.9})`:`rgba(23,33,31,${p.alpha*Math.min(1,q.pers)})`;ctx.fill()}
 requestAnimationFrame(draw);
}
function local(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
canvas.addEventListener('pointerenter',()=>{document.querySelector('#touchHint').style.opacity='.35'});
canvas.addEventListener('pointermove',e=>{const p=local(e);pointer={x:p.x,y:p.y,active:true};if(drag.on){const dx=p.x-drag.lastX,dy=p.y-drag.lastY;targetRot.y+=dx*.006;targetRot.x=Math.max(-1,Math.min(.8,targetRot.x+dy*.004));spin=dx*.00008;drag.lastX=p.x;drag.lastY=p.y}});
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);const p=local(e);drag={on:true,x:p.x,y:p.y,lastX:p.x,lastY:p.y};shell.classList.add('dragging');holdTimer=setTimeout(()=>document.querySelector('#holdThought').classList.add('show'),650)});
function release(){drag.on=false;shell.classList.remove('dragging');clearTimeout(holdTimer);document.querySelector('#holdThought').classList.remove('show');setTimeout(()=>spin=.00045,800)}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('pointerleave',()=>{pointer.active=false;if(!drag.on)pointer.x=-9999});
new ResizeObserver(resize).observe(shell);resize();make();draw();

const dayline=document.querySelector('#dayline');for(let i=1;i<=40;i++){const d=document.createElement('div');d.className='day';d.textContent=i;dayline.appendChild(d)}
const chapters=[...document.querySelectorAll('.text-chapter')];
const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>.42){stage=+e.target.dataset.stage;document.querySelector('#stageNumber').textContent=`0${stage+1} / 04`;document.querySelectorAll('.day').forEach((d,i)=>d.classList.toggle('active',stage>=2&&i<Math.round(10+(stage-2)*30)))}})},{threshold:[.42,.6]});
chapters.forEach(c=>io.observe(c));
addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight,p=max?scrollY/max:0;document.querySelector('#progressBar').style.width=(p*100)+'%'},{passive:true});
