// Higher-order interaction intelligence for the Impossible Room.
(function(){
 const now=()=>performance.now(),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 class RoomSocialBrain{
  constructor({memory={},emit=()=>{},persist=()=>{}}={}){this.emit=emit;this.persist=persist;this.state={beliefs:{},pending:null,history:[],...memory};}
  out(type,text,detail={}){let e={type,text,detail,at:now()};this.state.history.push(e);this.state.history=this.state.history.slice(-80);this.emit(e);return e}
  ingest(e){if(!e)return;this.repair(e);this.uncertainty(e);this.attend(e);this.inferIntent(e)}
  repair(e){let p=this.state.pending;if(!p)return;if(e.detail?.confirmed){p.accepts=(p.accepts||0)+1;return}if(e.detail?.key===p.key&&e.detail?.invoked)return;let age=now()-p.at;if(age>9000&&p.accepts===0){p.rejects=(p.rejects||0)+1;this.out('repair','I may have misunderstood what that movement meant.',{key:p.key,rejects:p.rejects});this.state.pending=null;this.persist(this.state)}}
  uncertainty(e){let c=e.confidence??1;if(c>=.7)return;if(now()-(this.state.lastClarify||0)<7000)return;this.state.lastClarify=now();let ask=e.kind==='face'?'Hold that expression for a second.':e.kind==='composed'?'Do that once more. I am not sure I understood it.':'Do that again. I want another look.';this.out('clarify',ask,{confidence:c,source:e.kind})}

  attend(e){let score=(e.confidence??.5)+(e.detail?.novel?.3:0)+(e.detail?.remembered?.25:0)+(e.detail?.learned?.35:0);let last=this.state.lastEvent;if(last&&last.text===e.text&&now()-last.at<3000)score-=.5;this.state.lastEvent={text:e.text,at:now()};if(score>.95){this.state.attention={target:e.text,score:clamp(score/1.5),at:now()};this.out('attention','That got my attention.',{target:e.text,score})}}

  inferIntent(e){let h=this.state.history.slice(-12),novel=h.filter(x=>x.detail?.novel).length,clarify=h.filter(x=>x.type==='clarify').length;let intent=novel>=2?'teaching':clarify>=2?'showing':'exploring';if(intent!==this.state.intent){this.state.intent=intent;this.out('intent',intent==='teaching'?'I think you are trying to teach me something.':intent==='showing'?'I think you want me to notice something specific.':'You seem to be exploring what responds.',{intent,scope:'this interaction only'})}}

  propose(key,effect){this.state.pending={key,effect,at:now(),accepts:0,rejects:0};this.persist(this.state)}
 }
 window.RoomSocialBrain={RoomSocialBrain};
})();