import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const server=spawn(process.platform==='win32'?'npx.cmd':'npx',['vite','preview','--host','127.0.0.1','--port','4173'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); await wait(1800);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
for(const id of ['home','trails','voice','move','future','mirror','body']){
  await page.evaluate(id=>location.hash=id,id);await wait(300);
  const active=await page.locator('#'+id).evaluate(el=>el.classList.contains('active'));if(!active)throw new Error(id+' did not activate');
}
await page.evaluate(()=>location.hash='future');await page.fill('#futureAction','smoke test');await page.click('#buildBtn');await wait(100);
const day=await page.locator('#dayLabel').textContent();if(!/DAY 01/.test(day))throw new Error('Future did not persist a real-day mark');
await page.click('#shareLab');if(!(await page.locator('#passPanel').evaluate(el=>el.classList.contains('open'))))throw new Error('Pass panel failed');
if(errors.length)throw new Error('Runtime errors: '+errors.join(' | '));
await browser.close();server.kill();console.log('Runtime smoke test passed');
