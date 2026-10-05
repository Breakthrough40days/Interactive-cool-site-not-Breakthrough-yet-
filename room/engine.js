export class RoomState {
  constructor(initial={}){this.state={encounter:'see',quality:{fps:60,tier:2},...initial};this.listeners=new Set()}
  patch(next){Object.assign(this.state,next);for(const fn of this.listeners)fn(this.state,next);return this.state}
  on(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
}
export const roomQuality=fps=>({fps:Math.round(fps),tier:fps<32?0:fps<48?1:2});
export const safeEvent=(type,data={})=>({type,at:performance.now(),...data});
