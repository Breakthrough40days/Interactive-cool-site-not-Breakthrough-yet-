import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const server=spawn(process.platform==='win32'?'npx.cmd':'npx',['vite','preview','--host','127.0.0.1','--port','4173'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); await wait(1800);
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-webgpu','--enable-features=Vulkan,UseSkiaRenderer']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});if(!(await page.evaluate(()=>typeof window.SelfieSegmentation==='function'&&typeof window.Hands==='function')))throw new Error('MediaPipe globals failed to load');
for(const id of ['home','trails','voice','move','future','mirror','body']){
  await page.evaluate(id=>location.hash=id,id);await wait(300);
  const active=await page.locator('#'+id).evaluate(el=>el.classList.contains('active'));if(!active)throw new Error(id+' did not activate');
}
await page.evaluate(()=>location.hash='future');await page.fill('#futureAction','smoke test');await page.click('#buildBtn');await wait(100);
const day=await page.locator('#dayLabel').textContent();if(!/DAY 01/.test(day))throw new Error('Future did not persist a real-day mark');
await page.click('#shareLab');if(!(await page.locator('#passPanel').evaluate(el=>el.classList.contains('open'))))throw new Error('Pass panel failed');await page.click('#closePass');
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(e.message));await mobile.goto('http://127.0.0.1:4173/#home',{waitUntil:'networkidle'});await mobile.click('#menu');if(!(await mobile.locator('#nav').evaluate(el=>el.classList.contains('open'))))throw new Error('Mobile menu failed');for(const id of ['body','trails','voice','move','future','mirror']){await mobile.evaluate(id=>location.hash=id,id);await wait(180);if(!(await mobile.locator('#'+id).evaluate(el=>el.classList.contains('active'))))throw new Error('Mobile '+id+' failed')}if(mobileErrors.length)throw new Error('Mobile runtime errors: '+mobileErrors.join(' | '));await mobile.close();
const gpu=await page.evaluate(async()=>{if(!navigator.gpu)return 'unavailable';try{let m=await import('/gpu-matter.js');let c=document.createElement('canvas');c.style.cssText='width:320px;height:200px';document.body.appendChild(c);let g=await m.createGPUMatter(c,{count:256});g.setMode('storm');g.setHands([{x:120,y:100,size:70,closed:false,pinching:true,pinchX:130,pinchY:95,cup:.6,vx:2,vy:1}]);g.burst(.8,150,100);await new Promise(r=>setTimeout(r,180));g.destroy();c.remove();return 'ok'}catch(e){return 'error:'+e.message}});if(gpu.startsWith('error:'))throw new Error('WebGPU runtime: '+gpu);if(errors.length)throw new Error('Runtime errors: '+errors.join(' | '));
await browser.close();server.kill();console.log('Runtime smoke test passed');
