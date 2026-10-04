export async function createGPUMatter(canvas,{count=100000}={}){
 if(!navigator.gpu)throw new Error('WebGPU unavailable');
 const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});if(!adapter)throw new Error('No GPU adapter');
 const device=await adapter.requestDevice(),ctx=canvas.getContext('webgpu'),format=navigator.gpu.getPreferredCanvasFormat();
 const d=Math.min(devicePixelRatio||1,1.5);function resize(){let r=canvas.getBoundingClientRect();canvas.width=Math.max(1,r.width*d);canvas.height=Math.max(1,r.height*d);ctx.configure({device,format,alphaMode:'premultiplied'})}resize();
 const stride=8,bytes=count*stride*4,data=new Float32Array(count*stride);
 for(let i=0;i<count;i++){let k=i*stride;data[k]=Math.random()*2-1;data[k+1]=Math.random()*2.2;data[k+2]=(Math.random()-.5)*.002;data[k+3]=-Math.random()*.006;data[k+4]=Math.random();data[k+5]=Math.random();data[k+6]=Math.random();data[k+7]=1}
 const particles=device.createBuffer({size:bytes,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});device.queue.writeBuffer(particles,0,data);
 const uniform=device.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
 const shader=device.createShaderModule({code:`
 struct P{pos:vec2f,vel:vec2f,misc:vec4f}; struct U{dt:f32,aspect:f32,mode:f32,handCount:f32,h0:vec4f,h1:vec4f,v0:vec4f,v1:vec4f,impulse:f32,pad:vec3f};
 @group(0) @binding(0) var<storage,read_write> p:array<P>; @group(0) @binding(1) var<uniform> u:U;
 @compute @workgroup_size(256) fn step(@builtin(global_invocation_id) id:vec3u){let i=id.x;if(i>=${count}u){return;}var q=p[i];q.vel.y-=select(.00005,.000012,u.mode==1.);for(var j=0u;j<2u;j++){if(f32(j)>=u.handCount){break;}let h=select(u.h0,u.h1,j==1u);let d=q.pos-h.xy;let L=max(length(d),.001);if(L<h.z){let force=(1.-L/h.z)*.0028;q.vel+=normalize(d)*force;let hv=select(u.v0,u.v1,j==1u);q.vel+=hv.xy*.00025;if(h.w>0.5&&L<h.z*.72){q.vel*=.86;q.pos=mix(q.pos,h.xy+d*.2,.11);}}}if(u.handCount>1.5){let mid=(u.h0.xy+u.h1.xy)*.5;let span=distance(u.h0.xy,u.h1.xy);let d=q.pos-mid;let L=max(length(d),.001);if(span<.48&&L<.42){q.vel-=normalize(d)*(.48-span)*.0003;}}if(u.impulse>.01){let d=q.pos-u.h0.xy;let L=max(length(d),.001);if(L<.8){q.vel+=normalize(d)*u.impulse*.006*(1.-L/.8);}}q.pos+=q.vel;if(q.pos.y< -1.15||abs(q.pos.x)>1.3){q.pos=vec2f(fract(sin(f32(i)*12.9898)*43758.5453)*2.-1.,1.12);q.vel=vec2f(0.,-.0015-fract(sin(f32(i)*4.13)*911.1)*.004);}q.vel*=.999;p[i]=q;}
 struct O{@builtin(position) pos:vec4f,@location(0) life:f32}; @vertex fn vs(@builtin(vertex_index) vi:u32)->O{let q=p[vi];var o:O;o.pos=vec4f(q.pos.x,q.pos.y,0.,1.);o.pos.x/=u.aspect;o.life=q.misc.x;return o;}
 @fragment fn fs(i:O)->@location(0) vec4f{return vec4f(.89,.74+.15*i.life,.43+.35*i.life,.72);}
 `});
 const bgl=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE|GPUShaderStage.VERTEX,buffer:{type:'storage'}},{binding:1,visibility:GPUShaderStage.COMPUTE|GPUShaderStage.VERTEX,buffer:{type:'uniform'}}]});
 const layout=device.createPipelineLayout({bindGroupLayouts:[bgl]});
 const compute=await device.createComputePipelineAsync({layout,compute:{module:shader,entryPoint:'step'}});
 const render=await device.createRenderPipelineAsync({layout,vertex:{module:shader,entryPoint:'vs'},fragment:{module:shader,entryPoint:'fs',targets:[{format,blend:{color:{srcFactor:'src-alpha',dstFactor:'one',operation:'add'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha',operation:'add'}}}]},primitive:{topology:'point-list'}});
 const bg=device.createBindGroup({layout:bgl,entries:[{binding:0,resource:{buffer:particles}},{binding:1,resource:{buffer:uniform}}]});
 let alive=true,last=performance.now(),state={mode:0,hands:[]},impulse=0,previous=[];
 function frame(now){if(!alive)return;let r=canvas.getBoundingClientRect();if(canvas.width!==Math.floor(r.width*d)||canvas.height!==Math.floor(r.height*d))resize();let dt=Math.min(.033,(now-last)/1000);last=now,aspect=r.width/r.height;
  let a=new Float32Array(24);a[0]=dt;a[1]=aspect;a[2]=state.mode;a[3]=Math.min(2,state.hands.length);state.hands.slice(0,2).forEach((h,i)=>{let k=4+i*4;a[k]=(h.x/r.width)*2-1;a[k+1]=1-(h.y/r.height)*2;a[k+2]=Math.max(.06,h.size/r.height*1.35);a[k+3]=h.closed?1:0;let v=12+i*4;a[v]=(h.vx||0)/r.width;a[v+1]=-(h.vy||0)/r.height});a[20]=impulse;impulse*=.82;device.queue.writeBuffer(uniform,0,a);
  let enc=device.createCommandEncoder(),cp=enc.beginComputePass();cp.setPipeline(compute);cp.setBindGroup(0,bg);cp.dispatchWorkgroups(Math.ceil(count/256));cp.end();
  let rp=enc.beginRenderPass({colorAttachments:[{view:ctx.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'store'}]});rp.setPipeline(render);rp.setBindGroup(0,bg);rp.draw(count);rp.end();device.queue.submit([enc.finish()]);requestAnimationFrame(frame)}
 requestAnimationFrame(frame);return{setHands(h){previous=state.hands;state.hands=h||[];if(previous.length===2&&state.hands.length===2){let old=Math.hypot(previous[0].x-previous[1].x,previous[0].y-previous[1].y),now=Math.hypot(state.hands[0].x-state.hands[1].x,state.hands[0].y-state.hands[1].y);if(old<150&&now>old+35)impulse=Math.min(.9,(now-old)/100)}},setMode:m=>state.mode=m==='light'?1:m==='storm'?2:0,burst:(p=.65)=>impulse=Math.max(impulse,p),destroy:()=>{alive=false;particles.destroy();uniform.destroy()}}
}