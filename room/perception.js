// Modern local perception layer: MediaPipe Tasks Vision 1.0.1.
// Uses model-native face blendshapes and gesture classification instead of
// hand-written landmark thresholds wherever a trained signal exists.
const VISION='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm';
const WASM='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const FACE='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const GESTURE='https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';
const POSE='https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

const avg=(m,...names)=>names.reduce((s,n)=>s+(m[n]||0),0)/names.length;
const topFace=(m)=>{
 const candidates=[
  ['smile',avg(m,'mouthSmileLeft','mouthSmileRight')],
  ['brows raised',Math.max(m.browInnerUp||0,avg(m,'browOuterUpLeft','browOuterUpRight'))],
  ['eyes widened',avg(m,'eyeWideLeft','eyeWideRight')],
  ['eyes squinted',avg(m,'eyeSquintLeft','eyeSquintRight')],
  ['blink',avg(m,'eyeBlinkLeft','eyeBlinkRight')],
  ['mouth opened',m.jawOpen||0],
  ['lips puckered',m.mouthPucker||0],
  ['frown',avg(m,'mouthFrownLeft','mouthFrownRight')],
  ['cheeks puffed',m.cheekPuff||0],
  ['nose scrunched',avg(m,'noseSneerLeft','noseSneerRight')]
 ];
 return candidates.sort((a,b)=>b[1]-a[1])[0];
};
const gestureText={Closed_Fist:'You made a fist.',Open_Palm:'You opened your palm.',Pointing_Up:'You pointed upward.',Thumb_Down:'You gave a thumbs down.',Thumb_Up:'You gave a thumbs up.',Victory:'You made a victory sign.',ILoveYou:'You made the I-love-you hand sign.'};

async function createPerception({onObservation,onHands,onFace,onPose,onStatus,knownMotifs=[]}={}){
 let face,gesture,pose,lastVideoTime=-1,lastFace='',lastGesture='',faceFrames=0,gestureFrames=0,lastFaceAt=0,lastGestureAt=0,ready=false,faceSamples=[],faceBase=null,lastPoseRun=0;const stable=new Map();
 const composer=window.RoomEventComposer?new window.RoomEventComposer.EventComposer({emit:x=>onObservation?.(x),knownMotifs}):null;const emit=(kind,text,confidence,detail={})=>{if(confidence<.68)return;onObservation?.({kind,text,confidence,detail,at:performance.now()})};const held=(key,on,need=3)=>{let n=stable.get(key)||0;n=on?Math.min(need+2,n+1):Math.max(0,n-2);stable.set(key,n);return n===need};
 try{
  const mp=await import(/* @vite-ignore */VISION);
  const vision=await mp.FilesetResolver.forVisionTasks(WASM);
  const opts={runningMode:'VIDEO',numFaces:1,minFaceDetectionConfidence:.55,minFacePresenceConfidence:.55,minTrackingConfidence:.55,outputFaceBlendshapes:true,outputFacialTransformationMatrixes:true};
  try{face=await mp.FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:FACE,delegate:'GPU'},...opts})}catch{try{face=await mp.FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:FACE,delegate:'CPU'},...opts})}catch(err){face=null;onStatus?.('FACE MODEL FAILED: '+err.message)}}
  const gopts={runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.55,minHandPresenceConfidence:.55,minTrackingConfidence:.55};
  try{gesture=await mp.GestureRecognizer.createFromOptions(vision,{baseOptions:{modelAssetPath:GESTURE,delegate:'GPU'},...gopts})}
  catch{try{gesture=await mp.GestureRecognizer.createFromOptions(vision,{baseOptions:{modelAssetPath:GESTURE,delegate:'CPU'},...gopts})}catch(err){gesture=null;onStatus?.('HAND MODEL FAILED: '+err.message)}}
  try{pose=await mp.PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:POSE,delegate:'GPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.55,minPosePresenceConfidence:.55,minTrackingConfidence:.55})}catch{try{pose=await mp.PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:POSE,delegate:'CPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.55,minPosePresenceConfidence:.55,minTrackingConfidence:.55})}catch{pose=null}}ready=!!(face||gesture||pose);onStatus?.('TRACKING: '+[face?'face':'',gesture?'hands':'',pose?'body':''].filter(Boolean).join(', '));
 }catch(err){onStatus?.('MODEL PERCEPTION UNAVAILABLE');return {ready:false,process:()=>{},close:()=>{},error:err}}

 const heartScore=(hands)=>{
  if(!hands||hands.length<2)return 0;
  const p=(h,i)=>h[i],d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const a=hands[0],b=hands[1],sa=d(p(a,5),p(a,17)),sb=d(p(b,5),p(b,17)),s=Math.max(.025,(sa+sb)/2);
  const index=d(p(a,8),p(b,8))/s,thumb=d(p(a,4),p(b,4))/s,palms=d(p(a,9),p(b,9))/s;
  const indexBent=(d(p(a,8),p(a,6))+d(p(b,8),p(b,6)))/(2*s);
  const symmetry=1-Math.min(1,Math.abs(p(a,9).y-p(b,9).y)/(s*1.2));
  const proximity=Math.max(0,1-index/1.0)*.36+Math.max(0,1-thumb/1.05)*.36+Math.max(0,1-palms/3.2)*.12+symmetry*.16;
  return Math.max(0,Math.min(1,proximity+(indexBent>.45?.08:0)));
 };
 let heartFrames=0,lastHeartAt=0;let lastFingerLabel='',fingerFrames=0,lastFingerAt=0;
 let poseState={armCount:0,lean:'',shoulder:0,centerX:0,centerY:0,lastMove:0};
 const process=(video,now=performance.now())=>{
  if(!ready||!video||video.readyState<2||video.currentTime===lastVideoTime)return;
  lastVideoTime=video.currentTime;
  try{
   const fr=face?face.detectForVideo(video,now):{faceBlendshapes:[],faceLandmarks:[]},cats=fr.faceBlendshapes?.[0]?.categories||[],map=Object.fromEntries(cats.map(x=>[x.categoryName,x.score]));
   if(fr.faceLandmarks?.[0])onFace?.({landmarks:fr.faceLandmarks[0],blendshapes:map});else onFace?.({landmarks:null,blendshapes:{}});
   if(cats.length){
    const [name,score]=topFace(map);const facePacket={name,score,blendshapes:map,landmarks:fr.faceLandmarks?.[0],matrix:fr.facialTransformationMatrixes?.[0]};onFace?.(facePacket);composer?.push('face',{features:map,landmarks:facePacket.landmarks,matrix:facePacket.matrix},now);
    if(!faceBase){faceSamples.push(map);if(faceSamples.length>=36){faceBase={};for(const k of Object.keys(map)){const vals=faceSamples.map(x=>x[k]||0).sort((a,b)=>a-b),trim=vals.slice(5,-5);faceBase[k]=trim.reduce((s,x)=>s+x,0)/Math.max(1,trim.length)}}}
    if(faceBase){
    const delta=n=>(map[n]||0)-(faceBase[n]||0),davg=(...n)=>n.reduce((s,k)=>s+delta(k),0)/n.length;
    const events=[['smile',davg('mouthSmileLeft','mouthSmileRight')>.20,'You smiled.',.82],['brows',Math.max(delta('browInnerUp'),davg('browOuterUpLeft','browOuterUpRight'))>.20,'You raised your eyebrows.',.8],['wide',davg('eyeWideLeft','eyeWideRight')>.23,'You widened your eyes.',.78],['squint',davg('eyeSquintLeft','eyeSquintRight')>.25,'You squinted.',.78],['jaw',delta('jawOpen')>.26,'You opened your mouth.',.82],['pucker',delta('mouthPucker')>.28,'You puckered your lips.',.8],['frown',davg('mouthFrownLeft','mouthFrownRight')>.24,'You frowned.',.76],['puff',delta('cheekPuff')>.28,'You puffed your cheeks.',.78]];
    for(const [key,on,text,conf] of events)if(held('face-'+key,on,4)&&now-lastFaceAt>2200){lastFaceAt=now;emit('face',text,conf,{blendshape:key})}
    if(held('face-blink',avg(map,'eyeBlinkLeft','eyeBlinkRight')>.72,2)&&now-lastFaceAt>1800){lastFaceAt=now;emit('face','You blinked.',.9,{blendshape:'blink'})}
    let lm=fr.faceLandmarks?.[0];if(lm){let left=lm[234],right=lm[454],nose=lm[1],eyesY=(lm[33].y+lm[263].y)/2,chin=lm[152],fw=Math.max(.01,Math.abs(right.x-left.x)),fh=Math.max(.01,Math.abs(chin.y-eyesY)),yaw=((nose.x-(left.x+right.x)/2)/fw),pitch=(nose.y-eyesY)/fh;if(held('head-left',yaw<-.10,4))emit('face','You turned your head.',.76,{blendshape:'head-turn'});if(held('head-right',yaw>.10,4))emit('face','You turned your head.',.76,{blendshape:'head-turn'});if(held('head-down',pitch>.44,4))emit('face','You tilted your head down.',.72,{blendshape:'head-down'})}
    }
   }
   if(pose&&now-lastPoseRun>90){
    lastPoseRun=now;
    const pr=pose.detectForVideo(video,now);
    const p=pr.landmarks?.[0];
    onPose?.({landmarks:p||null});if(p){
     composer?.push('pose',{landmarks:p},now);
     const shoulders=(p[11].y+p[12].y)/2;
     const wrists=[p[15],p[16]];
     const arms=wrists.filter(w=>w.visibility>.5&&w.y<shoulders-.06).length;
     if(arms===2&&poseState.armCount!==2)emit('pose','You raised both arms.',.8,{pose:'both-arms-up'});
     else if(arms===1&&poseState.armCount===0)emit('pose','You raised an arm.',.75,{pose:'one-arm-up'});
     poseState.armCount=arms;

     const midShoulder=(p[11].x+p[12].x)/2;
     const midHip=(p[23].x+p[24].x)/2;
     const lean=midShoulder-midHip;
     const dir=lean>.055?'right':lean<-.055?'left':'';
     if(dir&&dir!==poseState.lean)emit('pose',`You leaned ${dir}.`,.72,{pose:'lean-'+dir});
     poseState.lean=dir;

     const sw=Math.abs(p[11].x-p[12].x);
     const cx=(p[11].x+p[12].x+p[23].x+p[24].x)/4;
     const cy=(p[11].y+p[12].y+p[23].y+p[24].y)/4;
     if(poseState.shoulder){
      const ratio=sw/poseState.shoulder;
      if(held('closer',ratio>1.13,3))emit('pose','You moved closer.',.76,{pose:'closer'});
      if(held('farther',ratio<.88,3))emit('pose','You moved farther away.',.76,{pose:'farther'});
      const dx=cx-poseState.centerX,dy=cy-poseState.centerY;
      if(Math.hypot(dx,dy)>.055&&now-poseState.lastMove>3000){
       poseState.lastMove=now;
       const movement=Math.abs(dx)>Math.abs(dy)
        ?(dx>0?'You moved to the right.':'You moved to the left.')
        :(dy>0?'You moved down.':'You moved up.');
       emit('pose',movement,.72,{pose:'body-move'});
      }
     }
     poseState.shoulder=poseState.shoulder?poseState.shoulder*.92+sw*.08:sw;
     poseState.centerX=cx;
     poseState.centerY=cy;
    }
   }
   const gr=gesture?gesture.recognizeForVideo(video,now):{landmarks:[],gestures:[]};onHands?.(gr);composer?.push('hands',{landmarks:gr.landmarks,gestures:gr.gestures},now);
   // Count extended fingers using joint geometry, with stability and conservative confidence.
   const fingerCounts=(gr.landmarks||[]).map(h=>{
    if(!h||h.length<21)return null;
    const d=(i,j)=>Math.hypot(h[i].x-h[j].x,h[i].y-h[j].y);
    const scale=Math.max(.01,d(5,17));
    let count=0,ambiguous=0;
    for(const [tip,pip,mcp] of [[8,6,5],[12,10,9],[16,14,13],[20,18,17]]){
      const straight=d(tip,mcp)/Math.max(.001,d(pip,mcp));
      if(straight>1.55)count++;else if(straight>1.35)ambiguous++;
    }
    const thumbRatio=d(4,17)/Math.max(.001,d(3,17));
    if(thumbRatio>1.25&&d(4,5)>scale*.68)count++;
    else if(thumbRatio>1.15)ambiguous++;
    return ambiguous?null:count;
   });
   if(fingerCounts.length===1&&fingerCounts[0]!==null){
    const label=String(fingerCounts[0]);fingerFrames=label===lastFingerLabel?fingerFrames+1:1;lastFingerLabel=label;
    if(fingerFrames===7&&now-lastFingerAt>4500){lastFingerAt=now;emit('fingers',fingerCounts[0]===0?'I can see a closed fist.':`I can see ${fingerCounts[0]} finger${fingerCounts[0]===1?'':'s'}.`,.76,{count:fingerCounts[0]})}
   }else{fingerFrames=0;lastFingerLabel=''}
   const hs=heartScore(gr.landmarks);heartFrames=hs>.60?heartFrames+1:Math.max(0,heartFrames-2);
   if(heartFrames===4&&now-lastHeartAt>7000){lastHeartAt=now;emit('gesture','You made a heart with your hands.',hs,{gesture:'Heart'})}
   const best=(gr.gestures||[]).map(x=>x?.[0]).filter(x=>x&&x.categoryName!=='None').sort((a,b)=>b.score-a.score)[0];
   if(best&&best.score>.70){gestureFrames=best.categoryName===lastGesture?gestureFrames+1:1;lastGesture=best.categoryName}else{gestureFrames=Math.max(0,gestureFrames-1);if(!gestureFrames)lastGesture=''}
   if(best&&gestureFrames===3&&now-lastGestureAt>3800){lastGestureAt=now;emit('gesture',gestureText[best.categoryName]||`I recognized ${best.categoryName.replaceAll('_',' ').toLowerCase()}.`,best.score,{gesture:best.categoryName})}
  }catch(err){onStatus?.('PERCEPTION FRAME ERROR · '+String(err?.message||err).slice(0,120))}
 };
 const summary=()=>composer?.summary?.()||{};const close=()=>{try{if(face)face.close();}catch(err){}try{if(gesture)gesture.close();}catch(err){}try{if(pose)pose.close();}catch(err){}};
 return {ready:true,process,close,summary};
}
window.RoomPerception={createPerception};
