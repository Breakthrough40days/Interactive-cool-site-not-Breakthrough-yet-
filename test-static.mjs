import fs from 'node:fs';
const app=fs.readFileSync('app.js','utf8'),html=fs.readFileSync('index.html','utf8'),gpu=fs.readFileSync('gpu-matter.js','utf8');
const fail=m=>{throw new Error(m)};
if(!app.startsWith("const $=s=>document.querySelector(s),all=s=>"))fail('selector helpers broken');
if(app.includes("$('.view').forEach"))fail('route incorrectly uses single-element selector for view collection');
if(!app.includes("all('.view').forEach"))fail('route view collection missing');
for(const id of ['room','home','body','trails','voice','move','future','mirror'])if(!html.includes('id="'+id+'"'))fail('missing route '+id);
for(const id of ['roomStart','bodyStart','micBtn','motionBtn','buildBtn','mirrorStart','shareLab','passPanel'])if(!html.includes('id="'+id+'"')||!app.includes("'#"+id+"'"))fail('unwired control '+id);
if(!html.includes('@mediapipe/hands/hands.js')||!html.includes('@mediapipe/selfie_segmentation/selfie_segmentation.js'))fail('vision libraries missing');
if(!gpu.includes('device.lost')||!gpu.includes('cancelAnimationFrame(raf)'))fail('GPU lifecycle guard missing');
if(!app.includes('CLAP SHOCKWAVE')||!app.includes('PALM WIND'))fail('BODY gesture physics missing');
if(!app.includes('bt-artifact-seed')||!app.includes('totals:{'))fail('artifact lineage missing');
if(!app.includes("impossible-room-v1")||!app.includes("THE ROOM REMEMBERS YOU"))fail('Room memory missing');
if(!app.includes("memory.learned.push('THROW')")||!app.includes("memory.learned.push('PINCH')"))fail('Room learned gestures missing');
if(!app.includes("CUSTOM:")||!app.includes("SOMETHING LEARNED YOU")||!app.includes("pred.push"))fail('Room adaptive intelligence missing');
if(!app.includes("YOU CAUGHT IT")||!app.includes("past.push")||!app.includes("YOU THREW SOMETHING THAT ISN’T THERE"))fail('Room impossible object or temporal selves missing');
if(!app.includes("YOUR VOICE MADE SOMETHING")||!app.includes("VOICEBORN")||!app.includes("temper.fear")||!app.includes("temper.trust"))fail('Room voice species or behavioral memory missing');
if(!html.includes('id="roomPass"')||!html.includes('id="roomMemory"'))fail('Room lineage UI missing');
console.log('Static invariants OK');

if(!html.includes('roomMind')||!app.includes('runHypothesis')||!app.includes('Correction accepted')||!app.includes('CONFIDENCE '))fail('Room reasoning feedback loop missing');

if(!app.includes("mind.rule==='resist'")||!app.includes("mind.rule==='patience'")||!app.includes("event('hypothesis'")||!app.includes("events:mind.events.slice(-30)"))fail('Room hypotheses do not control physics or persist evidence');

if(!app.includes('scoreTest')||!app.includes("event('test_result'")||!app.includes("key:'dominant'")||!app.includes("mind.rule==='opposite'"))fail('Room evidence scoring or adaptive spatial test missing');

if(!html.includes('roomSay')||!html.includes('roomReveal')||!html.includes('roomSurprise'))fail('Room conversation/reveal/prediction UI missing');
if(!app.includes("fetch('/api/room-mind'")||!app.includes('compileExperiment')||!app.includes('roomProfile')||!app.includes('makeArtifact'))fail('Room AI contract/compiler/profile/artifact missing');

if(!html.includes('roomForeground')||!html.includes('bodyForeground')||!app.includes("globalCompositeOperation='source-in'"))fail('foreground depth compositing missing');
if(!html.includes('roomReplay')||!app.includes('mind.timeline')||!app.includes('choreograph'))fail('timeline replay or five-minute choreography missing');
if(!app.includes('mind.contradictions')||!app.includes('const decay=')||!app.includes("orb.material='inherited'"))fail('contradiction decay or inherited object missing');
if(!app.includes('orb.stretch')||!app.includes('YOU TORE SOMETHING'))fail('two-hand deformable object missing');
if(!app.includes('mind.discover')||!app.includes('rulesSeen'))fail('discovery engine missing');

if(!app.includes('adaptDifficulty')||!app.includes('fingerprint'))fail('adaptive difficulty or behavioral fingerprint missing');

if(!gpu.includes('Float32Array(32)')||!gpu.includes('imp:vec4f')||gpu.includes('a[24]=impulse'))fail('WebGPU uniform packing regression');
if(!app.includes('safeJSON')||!app.includes('storeJSON')||!app.includes('document.hidden'))fail('runtime resilience guards missing');
if(!app.includes('handFrames')||!app.includes('failedGrabs')||!app.includes('edgeVisits'))fail('embodied telemetry missing');
if(!app.includes('AbortController')||!app.includes('6500'))fail('Room AI timeout missing');

if(!app.includes("markDiscovery")||!app.includes("mind.best")||!app.includes("kind:'rule-break'"))fail('discovery/surprise/highlight engine missing');
if(!app.includes("shadowDelay")||!app.includes("shadowMode")||!app.includes("creature-trust"))fail('autonomous shadow or creature relationship missing');
if(!app.includes("mind.quality.fps")||!app.includes("mind.quality.tier"))fail('adaptive performance controller missing');
if(app.includes("safeJSON('impossible-room-v1')if")||app.includes("||nullif("))fail('Room statement-boundary syntax regression');

if(!app.includes("hypothesisCandidates")||!app.includes("event('alternatives'"))fail('competing hypothesis engine missing');
if(!app.includes("priorLast")||!app.includes("capability_failure"))fail('cross-visit decay or permission recovery missing');
if(!app.includes("orb.spin")||!app.includes("orb.weight")||!app.includes("orb.sticky")||!app.includes("orb.angle"))fail('advanced object material physics missing');
if(!app.includes("setAttribute('data-phase'")||!app.includes("OPENING THE ROOM"))fail('experience-stage focus/startup feedback missing');

if(!html.includes('@supabase/supabase-js@2')||!html.includes('roomLive')||!app.includes("client.channel('impossible-room:'")||!app.includes("event:'throw'"))fail('cross-device live physics missing');
if(!html.includes('roomEvidence')||!html.includes('roomForgetTheory')||!app.includes('forget_theory'))fail('evidence or granular memory controls missing');
if(!app.includes("mind.intent")||!app.includes("inferIntent")||!app.includes("repeatCount"))fail('visitor intent/repetition detection missing');
if(!app.includes("orb.hidden=true")||!app.includes("INVISIBLE OBJECT"))fail('invisible-object encounter missing');
