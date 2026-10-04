const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let cleanup=()=>{},RAF=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a=1,b=0)=>b+Math.random()*(a-b);
function fit(c,read=false){const d=Math.min(devicePixelRatio||1,1.6),r=c.getBoundingClientRect(),ctx=c.getContext('2d',read?{willReadFrequently:true}:undefined);c.width=Math.max(1,r.width*d);c.height=Math.max(1,r.height*d);ctx.setTransform(d,0,0,d,0,0);return{ctx,w:r.width,h:r.height,d}}
function stop(){cancelAnimationFrame(RAF);cleanup();cleanup=()=>{}}
function route(){stop();const id=location.hash.slice(1)||'home';$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('nav a').forEach(a=>a.classList.toggle('on',a.hash==='#'+id));$('#nav')?.classList.remove('open');({body:initBody,trails:initTrails,voice:initVoice,move:initMove,future:initFuture,mirror:initMirror}[id]||(()=>{}))()}
addEventListener('hashchange',route);$('#menu').onclick=()=>$('#nav').classList.toggle('open');

function flash(text){let el=document.createElement('div');el.className='impact';el.textContent=text;document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),500)},850)}

function initTrails(){
 const c=$('#trailCanvas'),o=fit(c),ctx=o.ctx;let run=true,down=false,p={x:o.w*.7,y:o.h*.5},last={...p},speed=0;
 const gap=15,cols=Math.ceil(o.w/gap)+1,rows=Math.ceil(o.h/gap)+1,nodes=[];
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)nodes.push({x:x*gap,y:y*gap,hx:x*gap,hy:y*gap,vx:0,vy:0});
 let scars=JSON.parse(localStorage.getItem('field-scars-v2')||'[]'),sparks=[];
 function pos(e){let r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
 function pd(e){down=true;p=last=pos(e);c.setPointerCapture?.(e.pointerId)}
 function pm(e){let q=pos(e);speed=Math.hypot(q.x-p.x,q.y-p.y);last=p;p=q;if(down&&speed>4){scars.push([p.x,p.y,clamp(speed/45,.15,1)]);if(scars.length>1500)scars.splice(0,200);for(let i=0;i<Math.min(10,speed/4);i++)sparks.push({x:p.x,y:p.y,vx:(p.x-last.x)*.18+rnd(3,-3),vy:(p.y-last.y)*.18+rnd(3,-3),a:1})}}
 function pu(){if(down){down=false;localStorage.setItem('field-scars-v2',JSON.stringify(scars));$('#trailCount').textContent=scars.length+' POINTS OF YOUR PATH REMEMBERED';if(speed>25)flash('THE FIELD REMEMBERS')}} 
 c.addEventListener('pointerdown',pd);c.addEventListener('pointermove',pm);addEventListener('pointerup',pu);
 function loop(){
  if(!run)return;ctx.fillStyle='rgba(5,7,6,.26)';ctx.fillRect(0,0,o.w,o.h);
  for(const q of nodes){q.vx+=(q.hx-q.x)*.012;q.vy+=(q.hy-q.y)*.012;let dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||1;if(down&&d<155){let f=(1-d/155)*(2.5+speed*.11);q.vx+=dx/d*f+(p.x-last.x)*.07;q.vy+=dy/d*f+(p.y-last.y)*.07}q.vx*=.91;q.vy*=.91;q.x+=q.vx;q.y+=q.vy;let mag=Math.hypot(q.x-q.hx,q.y-q.hy);ctx.fillStyle=mag>8?'rgba(209,154,75,.58)':'rgba(120,153,142,.24)';ctx.fillRect(q.x,q.y,mag>8?2.2:1.1,mag>8?2.2:1.1)}
  for(let i=1;i<scars.length;i++){let a=scars[i-1],b=scars[i];if(Math.hypot(a[0]-b[0],a[1]-b[1])<55){ctx.strokeStyle='rgba(209,154,75,'+(.05+a[2]*.16)+')';ctx.lineWidth=.6+a[2]*1.6;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()}}
  sparks.forEach(s=>{s.x+=s.vx;s.y+=s.vy;s.vx*=.97;s.vy*=.97;s.a*=.95;ctx.fillStyle='rgba(238,232,217,'+s.a+')';ctx.fillRect(s.x,s.y,2,2)});sparks=sparks.filter(s=>s.a>.04);RAF=requestAnimationFrame(loop)
 }loop();cleanup=()=>{run=false;c.removeEventListener('pointerdown',pd);c.removeEventListener('pointermove',pm);removeEventListener('pointerup',pu)}
}

function initVoice(){
 const c=$('#voiceCanvas'),o=fit(c),ctx=o.ctx;let run=true,stream,ac,an,forms=[],grab=null,spoken=false,lastBirth=0,shock=0;
 function point(e){let r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
 function pd(e){let p=point(e);grab=[...forms].reverse().find(f=>Math.hypot(f.x-p.x,f.y-p.y)<f.r*1.25)||null;if(grab)c.setPointerCapture?.(e.pointerId)}
 function pm(e){if(!grab)return;let p=point(e);grab.vx=(p.x-grab.x)*.16;grab.vy=(p.y-grab.y)*.16;grab.x=p.x;grab.y=p.y}
 function pu(){grab=null}
 c.addEventListener('pointerdown',pd);c.addEventListener('pointermove',pm);c.addEventListener('pointerup',pu);
 $('#micBtn').onclick=async()=>{try{stream=await navigator.mediaDevices.getUserMedia({audio:true});ac=new (window.AudioContext||window.webkitAudioContext)();await ac.resume();an=ac.createAnalyser();an.fftSize=1024;an.smoothingTimeConstant=.72;ac.createMediaStreamSource(stream).connect(an);$('#micBtn').textContent='SPEAK — LOUD OR SOFT';$('#micStatus').textContent='Your sound is now physical. Speak, then throw the forms.';flash('YOUR VOICE IS LIVE')}catch(e){$('#micStatus').textContent='Microphone blocked. You can still click the field to create matter.'}};
 c.addEventListener('dblclick',e=>{let p=point(e);forms.push(makeForm(p.x,p.y,.55,new Uint8Array(64).fill(120)))});
 function makeForm(x,y,e,a){return{x,y,r:32+e*105,vx:rnd(1.5,-1.5),vy:rnd(1.5,-1.5),rot:rnd(6.28),spin:rnd(.012,-.012),bins:Array.from({length:48},(_,i)=>(a[i*2]||100)/255),h:rnd(1),age:0}}
 function loop(t){
  if(!run)return;ctx.fillStyle='rgba(5,7,6,.16)';ctx.fillRect(0,0,o.w,o.h);
  if(an){let a=new Uint8Array(an.frequencyBinCount);an.getByteFrequencyData(a);let e=a.slice(0,180).reduce((s,n)=>s+n,0)/180/255;if(e>.075&&t-lastBirth>520){forms.push(makeForm(o.w*.72+rnd(80,-80),o.h*.5+rnd(120,-120),e,a));lastBirth=t;spoken=true;if(e>.32){shock=1;flash('THAT ONE HIT HARD')}}}
  shock*=.94;
  for(let i=0;i<forms.length;i++){let f=forms[i];f.age++;f.rot+=f.spin;if(f!==grab){f.x+=f.vx;f.y+=f.vy;f.vx*=.997;f.vy*=.997;if(f.x<f.r){f.x=f.r;f.vx=Math.abs(f.vx)}if(f.x>o.w-f.r){f.x=o.w-f.r;f.vx=-Math.abs(f.vx)}if(f.y<f.r){f.y=f.r;f.vy=Math.abs(f.vy)}if(f.y>o.h-f.r){f.y=o.h-f.r;f.vy=-Math.abs(f.vy)}}for(let j=i+1;j<forms.length;j++){let g=forms[j],dx=g.x-f.x,dy=g.y-f.y,d=Math.hypot(dx,dy)||1,m=(f.r+g.r)*.7;if(d<m){let k=(m-d)*.025;f.vx-=dx/d*k;f.vy-=dy/d*k;g.vx+=dx/d*k;g.vy+=dy/d*k}}
   if(shock>.05){let dx=f.x-o.w*.72,dy=f.y-o.h*.5,d=Math.hypot(dx,dy)||1;f.vx+=dx/d*shock*.25;f.vy+=dy/d*shock*.25}
   ctx.beginPath();f.bins.forEach((v,k)=>{let a=k/f.bins.length*Math.PI*2+f.rot,r=f.r*(.58+v*.75+Math.sin(t*.002+k)*.035),x=f.x+Math.cos(a)*r,y=f.y+Math.sin(a)*r;k?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fillStyle='rgba(120,153,142,.075)';ctx.fill();ctx.strokeStyle=grab===f?'rgba(209,154,75,.95)':'rgba(238,232,217,.48)';ctx.lineWidth=grab===f?2:1;ctx.stroke();
  }RAF=requestAnimationFrame(loop)
 }loop();cleanup=()=>{run=false;stream?.getTracks().forEach(t=>t.stop());ac?.close();c.onpointerdown=c.onpointermove=c.onpointerup=null}
}

function initMove(){
 const c=$('#moveCanvas'),o=fit(c),ctx=o.ctx;let run=true,active=false,tilt={x:0,y:0},vel={x:0,y:0},last=null;
 const stars=Array.from({length:1700},()=>({x:rnd(2,-1),y:rnd(2,-1),z:Math.random(),h:Math.random()}));
 function orient(e){if(!active)return;tilt.x=clamp((e.gamma||0)/38,-1.4,1.4);tilt.y=clamp(((e.beta||0)-35)/55,-1.4,1.4)}
 function pd(e){last={x:e.clientX,y:e.clientY};c.setPointerCapture?.(e.pointerId)}
 function pm(e){if(!active||!last)return;vel.x+=(e.clientX-last.x)/260;vel.y+=(e.clientY-last.y)/260;last={x:e.clientX,y:e.clientY}}
 function pu(){last=null}
 $('#motionBtn').onclick=async()=>{active=true;let granted=true;if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){try{granted=(await DeviceOrientationEvent.requestPermission())==='granted'}catch{granted=false}}if(granted)addEventListener('deviceorientation',orient);$('#motionBtn').textContent='NOW MOVE THE DEVICE';$('#moveText').textContent='Tilt on phone. Drag and throw on desktop. The tunnel has inertia.';flash('THE SCREEN IS A WINDOW')};
 c.addEventListener('pointerdown',pd);c.addEventListener('pointermove',pm);c.addEventListener('pointerup',pu);
 function loop(){if(!run)return;vel.x*=.94;vel.y*=.94;tilt.x+=vel.x;tilt.y+=vel.y;tilt.x*=.985;tilt.y*=.985;ctx.fillStyle='#eee8d9';ctx.fillRect(0,0,o.w,o.h);let cx=o.w*.5+tilt.x*o.w*.22,cy=o.h*.5+tilt.y*o.h*.18;for(const s of stars){s.z-=active?.012:.002;if(s.z<.015){s.z=1;s.x=rnd(2,-1);s.y=rnd(2,-1)}let sc=1/s.z,x=cx+s.x*o.w*.42*sc,y=cy+s.y*o.h*.42*sc;if(x>-20&&x<o.w+20&&y>-20&&y<o.h+20){let size=Math.min(8,.35+sc*.55),alpha=clamp((1-s.z)*.9,.06,.78);ctx.fillStyle=s.h>.93?'rgba(166,91,67,'+alpha+')':'rgba(17,26,23,'+alpha+')';ctx.fillRect(x,y,size,size)}}ctx.strokeStyle='rgba(17,26,23,.08)';for(let r=1;r<7;r++){ctx.beginPath();ctx.arc(cx,cy,r*r*16+Math.sin(performance.now()*.001+r)*4,0,7);ctx.stroke()}RAF=requestAnimationFrame(loop)}loop();cleanup=()=>{run=false;removeEventListener('deviceorientation',orient);c.removeEventListener('pointerdown',pd);c.removeEventListener('pointermove',pm);c.removeEventListener('pointerup',pu)}
}

function initFuture(){
 const c=$('#futureCanvas'),o=fit(c),ctx=o.ctx;let run=true,day=+(localStorage.getItem('future-day-v2')||0),burst=0;
 const pts=Array.from({length:1800},(_,i)=>({seed:Math.random(),a:Math.random()*6.28,j:Math.random(),side:Math.random()>.5?1:-1}));
 function label(){$('#dayLabel').textContent='DAY '+String(day).padStart(2,'0')+' / 40'}
 label();$('#buildBtn').onclick=()=>{if(!$('#futureAction').value.trim()){$('#futureAction').focus();return}day=Math.min(40,day+1);localStorage.setItem('future-day-v2',day);label();burst=1;if([1,10,20,30,40].includes(day))flash(day===40?'YOU BUILT THE WHOLE FIGURE':'DAY '+day+' CHANGED THE SHAPE')};$('#futureReset').onclick=()=>{day=0;localStorage.removeItem('future-day-v2');label()};
 function target(p){let cx=o.w*.76,cy=o.h*.52,s=Math.min(o.w,o.h)*.27,y=(p.seed*2-1)*s,x;if(p.seed<.13){let a=p.j*6.28;x=Math.cos(a)*s*.15;y=-s*.77+Math.sin(a)*s*.15}else if(p.seed<.55){x=p.side*(.05+p.j*.18)*s;y=-s*.52+(p.seed-.13)/.42*s*.82}else{x=p.side*(.06+p.j*.3)*s;y=-s*.1+(p.seed-.55)/.45*s*.82}return[cx+x,cy+y]}
 function loop(t){if(!run)return;ctx.fillStyle='rgba(5,7,6,.22)';ctx.fillRect(0,0,o.w,o.h);let f=day/40,ease=f*f*(3-2*f);burst*=.94;pts.forEach((p,i)=>{let q=target(p),chaos=(1-ease)*Math.min(o.w,o.h)*.25,ang=p.a+t*.00018*(.5+p.j),x=q[0]+Math.cos(ang)*chaos*p.j,y=q[1]+Math.sin(ang*1.3)*chaos*p.j;if(burst>.02){x+=(Math.random()-.5)*burst*80;y+=(Math.random()-.5)*burst*80}let built=i<day*45;ctx.fillStyle=built?'rgba(209,154,75,.82)':'rgba(238,232,217,'+(.035+ease*.24)+')';let sz=built?2.1:1.15;ctx.fillRect(x,y,sz,sz)});ctx.strokeStyle='rgba(120,153,142,'+(.08+ease*.25)+')';ctx.beginPath();ctx.arc(o.w*.76,o.h*.52,Math.min(o.w,o.h)*(.09+ease*.23),0,7);ctx.stroke();RAF=requestAnimationFrame(loop)}loop();cleanup=()=>run=false
}

function initMirror(){
 const v=$('#mirrorVideo'),c=$('#mirrorCanvas'),o=fit(c,true),ctx=o.ctx;let run=true,stream,off=document.createElement('canvas'),ox=off.getContext('2d',{willReadFrequently:true}),history=[],last=null,still=0,started=false;
 $('#mirrorStart').onclick=async()=>{try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});v.srcObject=stream;await v.play();started=true;$('#mirrorIntro').classList.add('started');flash('MOVE. THEN STOP.')}catch{$('#mirrorIntro p:not(.eyebrow)').textContent='Camera was blocked. Allow camera access and try again.'}};
 function loop(){if(!run)return;ctx.fillStyle='#030504';ctx.fillRect(0,0,o.w,o.h);if(started&&v.readyState>=2){off.width=240;off.height=180;ox.save();ox.translate(240,0);ox.scale(-1,1);ox.drawImage(v,0,0,240,180);ox.restore();let data=ox.getImageData(0,0,240,180),motion=.5;if(last){let diff=0;for(let i=0;i<data.data.length;i+=64)diff+=Math.abs(data.data[i]-last.data[i]);motion=clamp(diff/55000,0,1)}last=data;if(motion>.08){let snap=document.createElement('canvas');snap.width=240;snap.height=180;snap.getContext('2d').drawImage(off,0,0);history.push(snap);if(history.length>14)history.shift()}still=clamp(still+(motion<.075?.018:-.055),0,1);history.forEach((im,i)=>{let f=(i+1)/history.length;ctx.save();ctx.globalAlpha=.018+f*.065;let drift=(history.length-i)*4*(1-still);ctx.drawImage(im,-drift,0,o.w+drift*2,o.h);ctx.restore()});ctx.globalAlpha=.58;ctx.drawImage(off,0,0,o.w,o.h);ctx.globalAlpha=1;let wall=still*o.w*.34;ctx.fillStyle='rgba(3,5,4,'+(.18+still*.8)+')';ctx.fillRect(0,0,wall,o.h);ctx.fillRect(o.w-wall,0,wall,o.h);if(still>.72){ctx.strokeStyle='rgba(209,154,75,'+((still-.72)*2)+')';ctx.lineWidth=1;for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(wall+i*9,0);ctx.lineTo(wall-i*5,o.h);ctx.stroke();ctx.beginPath();ctx.moveTo(o.w-wall-i*9,0);ctx.lineTo(o.w-wall+i*5,o.h);ctx.stroke()}}$('#mirrorMsg').classList.toggle('show',motion>.16||still>.62)}RAF=requestAnimationFrame(loop)}loop();cleanup=()=>{run=false;stream?.getTracks().forEach(t=>t.stop());v.srcObject=null}
}

function initBody(){
 const v=$('#bodyVideo'),c=$('#bodyCanvas'),mc=$('#bodyMask'),o=fit(c),ctx=o.ctx,mx=mc.getContext('2d',{willReadFrequently:true});mc.width=160;mc.height=120;
 let run=true,stream,seg=null,handsModel=null,gpuMatter=null,mask=null,particles=[],mode='sand',lastVision=0,pointer={x:o.w*.5,y:o.h*.5,on:false},bodyTracking=false,handStates=[],visionBusy=false;
 const palmIds=[0,5,9,13,17],tipIds=[4,8,12,16,20],fingerChains=[[0,1,2,3,4],[0,5,6,7,8],[0,9,10,11,12],[0,13,14,15,16],[0,17,18,19,20]];
 function solid(x,y){if(!mask||x<0||y<0||x>=o.w||y>=o.h)return false;let X=clamp(Math.floor(x/o.w*160),0,159),Y=clamp(Math.floor(y/o.h*120),0,119);return mask[(Y*160+X)*4+3]>90}
 function pm(e){let r=c.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top,on:true}}function pl(){pointer.on=false}c.addEventListener('pointermove',pm);c.addEventListener('pointerleave',pl);
 function handFromLandmarks(lm,index){
   const pts=lm.map(p=>({x:p.x*o.w,y:p.y*o.h}));
   let palm={x:0,y:0};palmIds.forEach(i=>{palm.x+=pts[i].x;palm.y+=pts[i].y});palm.x/=palmIds.length;palm.y/=palmIds.length;
   const handSize=Math.max(45,Math.hypot(pts[5].x-pts[17].x,pts[5].y-pts[17].y)*1.65);
   const tipSpread=tipIds.slice(1).reduce((s,i)=>s+Math.hypot(pts[i].x-palm.x,pts[i].y-palm.y),0)/4;
   const pinchDist=Math.hypot(pts[4].x-pts[8].x,pts[4].y-pts[8].y),pinching=pinchDist<handSize*.32;\n   const closed=tipSpread<handSize*.72;
   let old=handStates[index]||{x:palm.x,y:palm.y,vx:0,vy:0,closed:false,caught:[]};
   old.vx=(palm.x-old.x)*.7+old.vx*.3;old.vy=(palm.y-old.y)*.7+old.vy*.3;old.x=palm.x;old.y=palm.y;old.size=handSize;old.pts=pts;old.pinchX=(pts[4].x+pts[8].x)/2;old.pinchY=(pts[4].y+pts[8].y)/2;old.pinching=pinching;
   if(closed&&!old.closed){let caught=0;for(const p of particles){if(p.held==null&&Math.hypot(p.x-palm.x,p.y-palm.y)<handSize*.85){p.held=index;p.ox=p.x-palm.x;p.oy=p.y-palm.y;old.caught.push(p);caught++}}if(caught){flash('GRABBED '+caught+' PARTICLES')}}
   if(!closed&&old.closed){for(const p of old.caught){if(p.held===index){p.held=null;p.vx=old.vx*.65+rnd(1,-1);p.vy=old.vy*.65+rnd(1,-1)}}if(old.caught.length)flash('THROWN');old.caught=[]}
   if(pinching&&!old.wasPinching){let nearest=null,nd=handSize*.5;for(const p of particles){if(p.held==null){let d=Math.hypot(p.x-old.pinchX,p.y-old.pinchY);if(d<nd){nearest=p;nd=d}}}if(nearest){nearest.held=index;nearest.pinch=true;nearest.ox=0;nearest.oy=0;old.caught.push(nearest);flash('PINCHED ONE')}}\n   if(!pinching&&old.wasPinching){for(const p of old.caught.filter(p=>p.pinch)){p.held=null;p.pinch=false;p.vx=old.vx*.9;p.vy=old.vy*.9}old.caught=old.caught.filter(p=>!p.pinch)}\n   old.wasPinching=pinching;old.closed=closed;gpuMatter?.setHands(handStates.map(x=>x||old).filter(Boolean));return old;
 }
 async function begin(){try{\n   if(navigator.gpu&&!gpuMatter){try{const m=await import('./gpu-matter.js');gpuMatter=await m.createGPUMatter($('#bodyGPU'),{count:innerWidth<700?60000:120000});$('#bodyStatus').textContent='GPU matter online. Loading camera + hands…';flash('120,000 PARTICLES ONLINE')}catch(e){gpuMatter=null}}
   stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});v.srcObject=stream;await v.play();$('#body').querySelector('.bodyIntro').classList.add('started');$('#bodyStatus').textContent='Camera live. Loading body + hand tracking…';
   if(window.SelfieSegmentation){try{seg=new SelfieSegmentation({locateFile:f=>'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/'+f});seg.setOptions({modelSelection:1,selfieMode:true});seg.onResults(r=>{mx.clearRect(0,0,160,120);mx.drawImage(r.segmentationMask,0,0,160,120);mask=mx.getImageData(0,0,160,120).data;if(!bodyTracking){bodyTracking=true;flash('YOUR BODY IS SOLID')}})}catch(e){seg=null}}
   if(window.Hands){try{handsModel=new Hands({locateFile:f=>'https://cdn.jsdelivr.net/npm/@mediapipe/hands/'+f});handsModel.setOptions({maxNumHands:2,modelComplexity:1,minDetectionConfidence:.55,minTrackingConfidence:.55,selfieMode:true});handsModel.onResults(r=>{let next=[];(r.multiHandLandmarks||[]).forEach((lm,i)=>next[i]=handFromLandmarks(lm,i));for(let i=next.length;i<handStates.length;i++){let h=handStates[i];if(h?.caught?.length){for(const p of h.caught){p.held=null;p.vx=h.vx*.5;p.vy=h.vy*.5}}}handStates=next;if(next.length)$('#bodyStatus').textContent='Hands tracked. SCOOP with your palm · PINCH thumb + index · FIST to grab a handful · OPEN to throw.'})}catch(e){handsModel=null}}
   if(!handsModel)$('#bodyStatus').textContent='Hand model unavailable. Body + mouse/finger force field still works.';
 }catch(e){$('#bodyStatus').textContent='Camera blocked. Mouse/finger force field is active.';$('#body').querySelector('.bodyIntro').classList.add('started');flash('TOUCH PHYSICS ACTIVE')}}
 $('#bodyStart').onclick=begin;$$('[data-matter]').forEach(b=>b.onclick=()=>{mode=b.dataset.matter;gpuMatter?.setMode(mode);$('[data-matter]').forEach(x=>x.classList.toggle('on',x===b));flash(mode.toUpperCase())});
 async function vision(t){if(visionBusy||v.readyState<2||t-lastVision<75)return;visionBusy=true;lastVision=t;try{if(seg)await seg.send({image:v});if(handsModel)await handsModel.send({image:v})}catch(e){}visionBusy=false}
 function drawHand(h){if(!h?.pts)return;ctx.save();ctx.lineWidth=1.5;ctx.strokeStyle=h.pinching?'rgba(255,218,126,.95)':h.closed?'rgba(209,154,75,.9)':'rgba(225,239,233,.42)';for(const chain of fingerChains){ctx.beginPath();chain.forEach((id,k)=>{let q=h.pts[id];k?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.stroke()}ctx.beginPath();ctx.moveTo(h.pts[5].x,h.pts[5].y);[9,13,17,0,5].forEach(id=>ctx.lineTo(h.pts[id].x,h.pts[id].y));ctx.fillStyle=h.closed?'rgba(209,154,75,.12)':'rgba(120,153,142,.055)';ctx.fill();ctx.stroke();for(const id of tipIds){let q=h.pts[id];ctx.beginPath();ctx.arc(q.x,q.y,h.pinching&&(id===4||id===8)?6:3,0,7);ctx.fillStyle=h.pinching?'#ffda7e':'#dfe9e4';ctx.fill()}if(h.pinching){ctx.beginPath();ctx.arc(h.pinchX,h.pinchY,15,0,7);ctx.strokeStyle='rgba(255,218,126,.8)';ctx.stroke()}ctx.font='9px DM Mono';ctx.fillStyle=h.pinching?'#ffda7e':h.closed?'#d19a4b':'#dfe9e4';ctx.fillText(h.pinching?'PINCH':h.closed?'GRAB':'SCOOP',h.x-22,h.y-h.size*.9);ctx.restore()}
 function loop(t){if(!run)return;vision(t);ctx.fillStyle='rgba(3,5,4,.32)';ctx.fillRect(0,0,o.w,o.h);
   if(v.readyState>=2){ctx.save();ctx.translate(o.w,0);ctx.scale(-1,1);ctx.globalAlpha=.24;ctx.filter='grayscale(1) contrast(1.35) brightness(.75)';ctx.drawImage(v,0,0,o.w,o.h);ctx.restore();ctx.filter='none';ctx.globalAlpha=1}
   const max=gpuMatter?1200:(innerWidth<700?6500:12000),n=gpuMatter?3:(mode==='storm'?55:mode==='light'?24:38);for(let k=0;k<n&&particles.length<max;k++)particles.push({x:Math.random()*o.w,y:-20-rnd(80),vx:rnd(mode==='storm'?6:.8,mode==='storm'?-6:-.8),vy:rnd(5,1),r:mode==='light'?rnd(2.6,1.2):rnd(2,.7),held:null});
   for(let i=particles.length-1;i>=0;i--){let p=particles[i];
     if(p.held!=null&&handStates[p.held]){let h=handStates[p.held];if(p.pinch){p.x=h.pinchX;p.y=h.pinchY}else{p.x=h.x+p.ox*.34;p.y=h.y+p.oy*.34}p.vx=h.vx;p.vy=h.vy}
     else{p.vy+=mode==='light'?.012:.075;let nx=p.x+p.vx,ny=p.y+p.vy,hit=solid(nx,ny);
       for(const h of handStates){if(!h)continue;
       for(const chain of fingerChains){for(let z=1;z<chain.length;z++){let a=h.pts[chain[z-1]],b=h.pts[chain[z]],abx=b.x-a.x,aby=b.y-a.y,l2=abx*abx+aby*aby||1,u=clamp(((nx-a.x)*abx+(ny-a.y)*aby)/l2,0,1),qx=a.x+abx*u,qy=a.y+aby*u,dx=nx-qx,dy=ny-qy,d=Math.hypot(dx,dy)||1;if(d<9){p.vx+=dx/d*.8+h.vx*.12;p.vy+=dy/d*.8+h.vy*.12;hit=true}}}
       let dx=nx-h.x,dy=ny-h.y,d=Math.hypot(dx,dy)||1;if(d<h.size*.62&&!h.closed){let f=(1-d/(h.size*.62))*.75;p.vx+=dx/d*f+h.vx*.045;p.vy+=dy/d*f+h.vy*.045}
     }
       if(pointer.on){let dx=nx-pointer.x,dy=ny-pointer.y,d=Math.hypot(dx,dy)||1;if(d<100){let f=(1-d/100)*2;p.vx+=dx/d*f;p.vy+=dy/d*f;hit=true}}
       if(hit){let L=solid(nx-7,ny),R=solid(nx+7,ny);if(!L)p.vx-=.45;else if(!R)p.vx+=.45;else{p.vx+=rnd(.6,-.6);p.vy=-Math.abs(p.vy)*.14}}else{p.x=nx;p.y=ny}
     }
     if(p.y>o.h+40||p.x<-80||p.x>o.w+80){particles.splice(i,1);continue}let col=p.held!=null?'255,218,126':mode==='storm'?'209,154,75':mode==='light'?'225,239,233':'226,192,124';ctx.fillStyle='rgba('+col+',.82)';ctx.beginPath();ctx.arc(p.x,p.y,p.held!=null?p.r*1.45:p.r,0,7);ctx.fill()
   }
   handStates.forEach(drawHand);RAF=requestAnimationFrame(loop)
 }loop();cleanup=()=>{run=false;gpuMatter?.destroy();stream?.getTracks().forEach(t=>t.stop());v.srcObject=null;c.removeEventListener('pointermove',pm);c.removeEventListener('pointerleave',pl)}
}
route();