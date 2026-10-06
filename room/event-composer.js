// Temporal multimodal event composer. Converts detector snapshots into reliable human actions.
(function(){
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 class EventComposer{
  constructor({emit,windowMs=8000}={}){this.emit=emit||(()=>{});this.windowMs=windowMs;this.frames=[];this.active=new Map();this.cool=new Map();this.baseline=new Map();this.stats=new Map();this.filters=new Map();this.lastT=new Map();this.transitions=new Map();this.lastEmit=new Map();}
  smooth(key,v,t,minCutoff=1,beta=.035,dCutoff=1){let prev=this.filters.get(key);if(!prev){this.filters.set(key,{x:v,dx:0});this.lastT.set(key,t);return v}let dt=Math.max(.001,(t-(this.lastT.get(key)||t))/1000),dx=(v-prev.x)/dt,aD=1/(1+1/(2*Math.PI*dCutoff*dt)),edx=aD*dx+(1-aD)*prev.dx,cut=minCutoff+beta*Math.abs(edx),a=1/(1+1/(2*Math.PI*cut*dt)),x=a*v+(1-a)*prev.x;this.filters.set(key,{x,dx:edx});this.lastT.set(key,t);return x;}
  push(type,data={},t=performance.now()){
   this.frames.push({type,data,t});while(this.frames.length&&t-this.frames[0].t>this.windowMs)this.frames.shift();
   if(type==='hands')this.hands(data,t);if(type==='pose')this.pose(data,t);if(type==='face')this.face(data,t);if(type==='audio')this.audio(data,t);
  }
  gate(key,on,{rise=3,fall=2,cooldown=3500}={}){
   let s=this.active.get(key)||{n:0,on:false};s.n=on?s.n+1:Math.max(0,s.n-fall);let fire=!s.on&&s.n>=rise;if(fire)s.on=true;if(!on&&s.n===0)s.on=false;this.active.set(key,s);
   if(!fire)return false;let now=performance.now(),last=this.cool.get(key)||0;if(now-last<cooldown)return false;this.cool.set(key,now);return true;
  }
  say(key,text,confidence,detail={}){confidence=clamp(confidence);if(confidence<.7)return;let now=performance.now(),sig=text+'|'+JSON.stringify(detail);if(this.lastEmit.get(key)?.sig===sig&&now-(this.lastEmit.get(key)?.at||0)<2200)return;this.lastEmit.set(key,{sig,at:now});this.emit({kind:'composed',key,text,confidence,detail,at:now});}
  phase(key,value,t,ttl=1400){let x=this.transitions.get(key)||[];x.push({value,t});x=x.filter(v=>t-v.t<ttl);this.transitions.set(key,x);return x;}
  velocity(points,a,b,dt){if(!points?.[a]||!points?.[b]||dt<=0)return 0;return Math.hypot(points[b].x-points[a].x,points[b].y-points[a].y)/dt;}
  hands(d,t){
   const h=d.landmarks||[];if(!h.length)return;
   const center=x=>({x:(x[0].x+x[5].x+x[9].x+x[13].x+x[17].x)/5,y:(x[0].y+x[5].y+x[9].y+x[13].y+x[17].y)/5});
   let cs=h.map((x,i)=>{let q=center(x);return {x:this.smooth('hx'+i,q.x,t),y:this.smooth('hy'+i,q.y,t)}});if(h.length===2){let gap=Math.hypot(cs[0].x-cs[1].x,cs[0].y-cs[1].y);let g=this.stats.get('handGap')||{lo:.105,seen:0};g.seen++;if(gap<.18)g.lo=g.lo*.995+gap*.005;this.stats.set('handGap',g);let enter=Math.max(.07,Math.min(.13,g.lo*1.35));if(this.gate('hands-together',gap<enter,{rise:4,cooldown:5000}))this.say('hands-together','You brought your hands together.',.86,{gap});let seq=this.phase('hand-gap',gap,t,900);if(seq.length>5){let vals=seq.map(x=>x.value),mn=Math.min(...vals),first=vals[0],last=vals.at(-1);if(first>enter*1.8&&mn<enter*.85&&last>enter*1.7&&this.gate('clap',true,{rise:1,cooldown:3500}))this.say('clap','You clapped.',.9,{gap:mn});}}
   let recent=this.frames.filter(x=>x.type==='hands'&&t-x.t<650);if(recent.length>3){let old=recent[0].data.landmarks||[];for(let i=0;i<Math.min(h.length,old.length);i++){let a=center(old[i]),b=cs[i],v=Math.hypot(b.x-a.x,b.y-a.y);if(this.gate('fast-hand-'+i,v>.16,{rise:2,cooldown:4500}))this.say('fast-hand','You moved your hand quickly.',.8,{speed:v});let hist=recent.map(r=>r.data.landmarks?.[i]).filter(Boolean).map(center);if(hist.length>5){let rev=0,lastSign=0;for(let j=1;j<hist.length;j++){let dx=hist[j].x-hist[j-1].x,sign=Math.abs(dx)>.012?Math.sign(dx):0;if(sign&&lastSign&&sign!==lastSign)rev++;if(sign)lastSign=sign;}let raised=h[i]?.[0]?.y<h[i]?.[9]?.y+.08;if(rev>=2&&raised&&this.gate('wave-'+i,true,{rise:1,cooldown:5000}))this.say('wave','You waved.',.86,{reversals:rev});}}}
  }
  pose(d,t){
   let p=d.landmarks;if(!p)return;let vis=i=>(p[i]?.visibility??1)>.45;
   if(vis(15)&&vis(16)){let shoulder=(p[11].y+p[12].y)/2,w=[p[15],p[16]],n=w.filter(x=>x.y<shoulder-.06).length;if(this.gate('both-arms',n===2,{rise:3,cooldown:5000}))this.say('both-arms','You raised both arms.',.9);}
   if(vis(15)&&vis(16)&&vis(0)){let face={x:p[0].x,y:p[0].y},cover=[p[15],p[16]].some(w=>Math.hypot(w.x-face.x,w.y-face.y)<.13);if(this.gate('cover-face',cover,{rise:4,cooldown:5000}))this.say('cover-face','You covered your face.',.84);}
   let recent=this.frames.filter(x=>x.type==='pose'&&t-x.t<1000),old=recent[0]?.data.landmarks;if(old){let c=q=>({x:(q[11].x+q[12].x+q[23].x+q[24].x)/4,y:(q[11].y+q[12].y+q[23].y+q[24].y)/4}),a=c(old),b=c(p),move=Math.hypot(b.x-a.x,b.y-a.y);if(this.gate('body-move',move>.065,{rise:2,cooldown:4000}))this.say('body-move','You shifted your body.',.78,{move});}
  }
  face(d){
   const f=d.features||{};for(const [k,v] of Object.entries(f)){let b=this.baseline.get('face:'+k);if(b==null)this.baseline.set('face:'+k,v);else if(v<b+.12)this.baseline.set('face:'+k,b*.985+v*.015);}
  }
  audio(d,t){
   if(this.gate('speaking',!!d.speaking,{rise:3,cooldown:2500}))this.say('speaking','I hear you speaking.',.92);
   let recent=this.frames.filter(x=>x.type==='audio'&&t-x.t<1200),old=recent[0]?.data;if(old&&d.energy&&old.energy){let ratio=d.energy/Math.max(.001,old.energy);if(this.gate('louder',ratio>1.8&&d.speaking,{rise:2,cooldown:5000}))this.say('louder','Your voice got louder.',.82,{ratio});}
  }
  summary(){return {buffered:this.frames.length,active:[...this.active.entries()].filter(([,v])=>v.on).map(([k])=>k),baselines:Object.fromEntries(this.baseline),filters:this.filters.size,transitions:this.transitions.size}}
 }
 window.RoomEventComposer={EventComposer};
})();