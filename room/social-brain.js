// Higher-order interaction intelligence for the Impossible Room.
(function(){
 const now=()=>performance.now(),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 class RoomSocialBrain{
  constructor({memory={},emit=()=>{},persist=()=>{}}={}){this.emit=emit;this.persist=persist;this.state={beliefs:{},pending:null,history:[],...memory};}
  out(type,text,detail={}){let e={type,text,detail,at:now()};this.state.history.push(e);this.state.history=this.state.history.slice(-80);this.emit(e);return e}
  ingest(e){if(!e)return;this.repair(e);this.uncertainty(e);this.attend(e);this.inferIntent(e);this.scorePrediction(e);this.predict(e);this.curiosity(e);this.baseline(e);this.fuse(e);this.relationship(e)}
  repair(e){let p=this.state.pending;if(!p)return;if(e.detail?.confirmed){p.accepts=(p.accepts||0)+1;return}if(e.detail?.key===p.key&&e.detail?.invoked)return;let age=now()-p.at;if(age>9000&&p.accepts===0){p.rejects=(p.rejects||0)+1;this.out('repair','I may have misunderstood what that movement meant.',{key:p.key,rejects:p.rejects});this.state.pending=null;this.persist(this.state)}}
  uncertainty(e){let c=e.confidence??1;if(c>=.7)return;if(now()-(this.state.lastClarify||0)<7000)return;this.state.lastClarify=now();let ask=e.kind==='face'?'Hold that expression for a second.':e.kind==='composed'?'Do that once more. I am not sure I understood it.':'Do that again. I want another look.';this.out('clarify',ask,{confidence:c,source:e.kind})}

  attend(e){let score=(e.confidence??.5)+(e.detail?.novel?.3:0)+(e.detail?.remembered?.25:0)+(e.detail?.learned?.35:0);let last=this.state.lastEvent;if(last&&last.text===e.text&&now()-last.at<3000)score-=.5;this.state.lastEvent={text:e.text,at:now()};if(score>.95){this.state.attention={target:e.text,score:clamp(score/1.5),at:now()};this.out('attention','That got my attention.',{target:e.text,score})}}

  inferIntent(e){let h=this.state.history.slice(-12),novel=h.filter(x=>x.detail?.novel).length,clarify=h.filter(x=>x.type==='clarify').length;let intent=novel>=2?'teaching':clarify>=2?'showing':'exploring';if(intent!==this.state.intent){this.state.intent=intent;this.out('intent',intent==='teaching'?'I think you are trying to teach me something.':intent==='showing'?'I think you want me to notice something specific.':'You seem to be exploring what responds.',{intent,scope:'this interaction only'})}}

  predict(e){let h=this.state.history.filter(x=>x.type==='attention'||x.type==='intent').slice(-8);if(h.length<3||now()-(this.state.lastPrediction||0)<9000)return;let repeated=e.detail?.novel||e.detail?.remembered;if(!repeated)return;this.state.lastPrediction=now();this.state.prediction={kind:'repeat',key:e.detail?.key,at:now(),expires:now()+6500,resolved:false};this.out('prediction','I think you are going to do that again.',{key:e.detail?.key,horizonMs:6500})}
  scorePrediction(e){let p=this.state.prediction;if(!p||p.resolved)return;if(now()>p.expires){p.resolved=true;this.out('prediction_miss','No. You changed course.',{prediction:p.kind});return}if(p.key&&e.detail?.key===p.key&&e.detail?.novel){p.resolved=true;this.out('prediction_hit','I expected that.',{prediction:p.kind,latency:now()-p.at})}}

  curiosity(e){if(now()-(this.state.lastExperiment||0)<12000)return;let b=this.state.beliefs,kind=e.detail?.novel?'repeat':e.kind==='face'?'hold':'change';b[kind]=(b[kind]||0)+1;if(b[kind]<2)return;this.state.lastExperiment=now();let experiment=kind==='repeat'?'Do it once more, but change one part of the movement.':kind==='hold'?'Keep that still. I want to see what changes when you stop moving.':'Try the opposite of what you just did.';this.out('experiment',experiment,{kind,reason:'reduce uncertainty'})}

  baseline(e){let k=e.kind||'unknown',b=this.state.baselines||(this.state.baselines={}),x=b[k]||(b[k]={n:0,confidence:0,interval:0,last:0});let t=now(),dt=x.last?t-x.last:0;x.n++;x.confidence+=((e.confidence??.5)-x.confidence)/Math.min(x.n,30);if(dt>0)x.interval+=((dt-x.interval)/Math.min(x.n,30));x.last=t;if(x.n===12)this.out('baseline','I have enough of your normal rhythm now to notice when you break it.',{kind:k,confidence:x.confidence,interval:x.interval});}

  fuse(e){let t=now(),q=this.state.signals||(this.state.signals=[]);q.push({kind:e.kind,text:e.text,at:t,detail:e.detail});this.state.signals=q.filter(x=>t-x.at<1400);let kinds=[...new Set(this.state.signals.map(x=>x.kind))];if(kinds.length<2||t-(this.state.lastFusion||0)<5000)return;this.state.lastFusion=t;this.out('fusion','Two things changed together. I am treating them as one moment.',{kinds,signals:this.state.signals.map(x=>x.text).slice(-4)})}

  relationship(e){let r=this.state.relationship||(this.state.relationship={trust:.35,shared:0,repairs:0});if(e.detail?.confirmed){r.shared++;r.trust=clamp(r.trust+.08)}if(e.type==='repair'||e.detail?.rejected){r.repairs++;r.trust=clamp(r.trust-.05)}if(r.shared===2&&!r.sharedNotice){r.sharedNotice=true;this.out('relationship','We have started to build rules that belong to this conversation.',{...r})}this.persist(this.state)}

  propose(key,effect){this.state.pending={key,effect,at:now(),accepts:0,rejects:0};this.persist(this.state)}
 }
 window.RoomSocialBrain={RoomSocialBrain};
})();