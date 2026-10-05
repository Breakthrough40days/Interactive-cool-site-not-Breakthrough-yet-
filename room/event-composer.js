// Temporal multimodal event composer. Converts detector snapshots into reliable human actions.
(function(){
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 class EventComposer{
  constructor({emit,windowMs=8000}={}){this.emit=emit||(()=>{});this.windowMs=windowMs;this.frames=[];this.active=new Map();this.cool=new Map();this.baseline=new Map();this.stats=new Map();}
  push(type,data={},t=performance.now()){
   this.frames.push({type,data,t});while(this.frames.length&&t-this.frames[0].t>this.windowMs)this.frames.shift();
   if(type==='hands')this.hands(data,t);if(type==='pose')this.pose(data,t);if(type==='face')this.face(data,t);if(type==='audio')this.audio(data,t);
  }
  gate(key,on,{rise=3,fall=2,cooldown=3500}={}){
   let s=this.active.get(key)||{n:0,on:false};s.n=on?s.n+1:Math.max(0,s.n-fall);let fire=!s.on&&s.n>=rise;if(fire)s.on=true;if(!on&&s.n===0)s.on=false;this.active.set(key,s);
   if(!fire)return false;let now=performance.now(),last=this.cool.get(key)||0;if(now-last<cooldown)return false;this.cool.set(key,now);return true;
  }
  say(key,text,confidence,detail={}){confidence=clamp(confidence);if(confidence<.7)return;this.emit({kind:'composed',key,text,confidence,detail,at:performance.now()});}
  hands(d,t){
   const h=d.landmarks||[];if(!h.length)return;
   const center=x=>({x:(x[0].x+x[5].x+x[9].x+x[13].x+x[17].x)/5,y:(x[0].y+x[5].y+x[9].y+x[13].y+x[17].y)/5});
   let cs=h.map(center);if(h.length===2){let gap=Math.hypot(cs[0].x-cs[1].x,cs[0].y-cs[1].y);if(this.gate('hands-together',gap<.105,{rise:4,cooldown:5000}))this.say('hands-together','You brought your hands together.',.86,{gap});}
   let recent=this.frames.filter(x=>x.type==='hands'&&t-x.t<650);if(recent.length>3){let old=recent[0].data.landmarks||[];for(let i=0;i<Math.min(h.length,old.length);i++){let a=center(old[i]),b=cs[i],v=Math.hypot(b.x-a.x,b.y-a.y);if(this.gate('fast-hand-'+i,v>.16,{rise:2,cooldown:4500}))this.say('fast-hand','You moved your hand quickly.',.8,{speed:v});}}
  }
  pose(d,t){
   let p=d.landmarks;if(!p)return;let vis=i=>(p[i]?.visibility??1)>.45;
   if(vis(15)&&vis(16)){let shoulder=(p[11].y+p[12].y)/2,w=[p[15],p[16]],n=w.filter(x=>x.y<shoulder-.06).length;if(this.gate('both-arms',n===2,{rise:3,cooldown:5000}))this.say('both-arms','You raised both arms.',.9);}
   let recent=this.frames.filter(x=>x.type==='pose'&&t-x.t<1000),old=recent[0]?.data.landmarks;if(old){let c=q=>({x:(q[11].x+q[12].x+q[23].x+q[24].x)/4,y:(q[11].y+q[12].y+q[23].y+q[24].y)/4}),a=c(old),b=c(p),move=Math.hypot(b.x-a.x,b.y-a.y);if(this.gate('body-move',move>.065,{rise:2,cooldown:4000}))this.say('body-move','You shifted your body.',.78,{move});}
  }
  face(d){
   const f=d.features||{};for(const [k,v] of Object.entries(f)){let b=this.baseline.get('face:'+k);if(b==null)this.baseline.set('face:'+k,v);else if(v<b+.12)this.baseline.set('face:'+k,b*.985+v*.015);}
  }
  audio(d,t){
   if(this.gate('speaking',!!d.speaking,{rise:3,cooldown:2500}))this.say('speaking','I hear you speaking.',.92);
   let recent=this.frames.filter(x=>x.type==='audio'&&t-x.t<1200),old=recent[0]?.data;if(old&&d.energy&&old.energy){let ratio=d.energy/Math.max(.001,old.energy);if(this.gate('louder',ratio>1.8&&d.speaking,{rise:2,cooldown:5000}))this.say('louder','Your voice got louder.',.82,{ratio});}
  }
  summary(){return {buffered:this.frames.length,active:[...this.active.entries()].filter(([,v])=>v.on).map(([k])=>k),baselines:Object.fromEntries(this.baseline)}}
 }
 window.RoomEventComposer={EventComposer};
})();