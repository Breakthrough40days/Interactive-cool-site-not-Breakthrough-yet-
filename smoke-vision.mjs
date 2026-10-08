import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
const server=spawn(process.platform==='win32'?'npx.cmd':'npx',['vite','--host','127.0.0.1','--port','4184','--strictPort'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
 await wait(2400);
 browser=await chromium.launch({headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 const page=await browser.newPage({viewport:{width:1440,height:900},permissions:['camera','microphone']});
 const failures=[];page.on('pageerror',e=>failures.push(e.message));
 await page.goto('http://127.0.0.1:4184/#room',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#roomVideo');
 await page.click('#roomStart');
 await page.waitForFunction(()=>document.querySelector('#roomTracking')?.parentElement===document.body,{timeout:45000}).catch(()=>{});
 const geometry=await page.evaluate(()=>{
  const video=document.querySelector('#roomVideo'),canvas=document.querySelector('#roomTracking');
  const vr=video.getBoundingClientRect(),cr=canvas.getBoundingClientRect();
  return {videoTransform:getComputedStyle(video).transform,canvasTransform:getComputedStyle(canvas).transform,canvasPosition:getComputedStyle(canvas).position,video:vr.toJSON(),canvas:cr.toJSON()};
 });
 if(geometry.videoTransform!==geometry.canvasTransform)throw new Error('Camera and landmark canvas mirror transforms differ: '+JSON.stringify(geometry));
 if(Math.abs(geometry.video.left-geometry.canvas.left)>2||Math.abs(geometry.video.top-geometry.canvas.top)>2||Math.abs(geometry.video.width-geometry.canvas.width)>2||Math.abs(geometry.video.height-geometry.canvas.height)>2)throw new Error('Landmark overlay is not on top of camera: '+JSON.stringify(geometry));
 const loaded=await page.evaluate(async()=>{
  const states=[];const result=await window.RoomPerception.createPerception({onStatus:x=>states.push(x)});
  const answer={ready:result.ready,capabilities:result.capabilities||{},states};result.close();return answer;
 });
 console.log('Vision model initialization:',JSON.stringify(loaded));
 if(!loaded.ready||!loaded.capabilities?.face||!loaded.capabilities?.hands)throw new Error('Face or hand vision failed to load: '+JSON.stringify(loaded));
 if(failures.length)throw new Error('Browser errors: '+failures.join('; '));
 console.log('PASS: mirrored video/canvas transforms match; face and hand models initialize.');
}finally{await browser?.close();server.kill('SIGTERM')}
