// Higher-order interaction intelligence for the Impossible Room.
(function(){
 const now=()=>performance.now(),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 class RoomSocialBrain{
  constructor({memory={},emit=()=>{},persist=()=>{}}={}){this.emit=emit;this.persist=persist;this.state={beliefs:{},pending:null,history:[],...memory};}
  out(type,text,detail={}){let e={type,text,detail,at:now()};this.state.history.push(e);this.state.history=this.state.history.slice(-80);this.emit(e);return e}
  ingest(e){if(!e)return;this.repair(e)}
  repair(e){let p=this.state.pending;if(!p)return;if(e.detail?.confirmed){p.accepts=(p.accepts||0)+1;return}if(e.detail?.key===p.key&&e.detail?.invoked)return;let age=now()-p.at;if(age>9000&&p.accepts===0){p.rejects=(p.rejects||0)+1;this.out('repair','I may have misunderstood what that movement meant.',{key:p.key,rejects:p.rejects});this.state.pending=null;this.persist(this.state)}}
  propose(key,effect){this.state.pending={key,effect,at:now(),accepts:0,rejects:0};this.persist(this.state)}
 }
 window.RoomSocialBrain={RoomSocialBrain};
})();