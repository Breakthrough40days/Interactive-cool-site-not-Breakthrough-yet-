// Modern local perception layer: MediaPipe Tasks Vision 1.0.1.
// Uses model-native face blendshapes and gesture classification instead of
// hand-written landmark thresholds wherever a trained signal exists.
const VISION='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm';
const WASM='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const FACE='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const GESTURE='https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

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

export async function createPerception({onObservation,onHands,onFace,onStatus}={}){
 let face,gesture,lastVideoTime=-1,lastFace='',lastGesture='',faceFrames=0,gestureFrames=0,lastFaceAt=0,lastGestureAt=0,ready=false;
 const emit=(kind,text,confidence,detail={})=>onObservation?.({kind,text,confidence,detail,at:performance.now()});
 try{
  const mp=await import(/* @vite-ignore */VISION);
  const vision=await mp.FilesetResolver.forVisionTasks(WASM);
  const opts={runningMode:'VIDEO',numFaces:1,minFaceDetectionConfidence:.55,minFacePresenceConfidence:.55,minTrackingConfidence:.55,outputFaceBlendshapes:true,outputFacialTransformationMatrixes:true};
  try{face=await mp.FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:FACE,delegate:'GPU'},...opts})}
  catch{face=await mp.FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:FACE,delegate:'CPU'},...opts})}
  const gopts={runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.55,minHandPresenceConfidence:.55,minTrackingConfidence:.55};
  try{gesture=await mp.GestureRecognizer.createFromOptions(vision,{baseOptions:{modelAssetPath:GESTURE,delegate:'GPU'},...gopts})}
  catch{gesture=await mp.GestureRecognizer.createFromOptions(vision,{baseOptions:{modelAssetPath:GESTURE,delegate:'CPU'},...gopts})}
  ready=true;onStatus?.('MODEL PERCEPTION READY');
 }catch(err){onStatus?.('MODEL PERCEPTION UNAVAILABLE');return {ready:false,process:()=>{},close:()=>{},error:err}}

 const process=(video,now=performance.now())=>{
  if(!ready||!video||video.readyState<2||video.currentTime===lastVideoTime)return;
  lastVideoTime=video.currentTime;
  try{
   const fr=face.detectForVideo(video,now),cats=fr.faceBlendshapes?.[0]?.categories||[],map=Object.fromEntries(cats.map(x=>[x.categoryName,x.score]));
   if(cats.length){
    const [name,score]=topFace(map);onFace?.({name,score,blendshapes:map,landmarks:fr.faceLandmarks?.[0],matrix:fr.facialTransformationMatrixes?.[0]});
    const threshold=name==='blink'?.72:name==='smile'?.52:.58;
    if(score>threshold){faceFrames=name===lastFace?faceFrames+1:1;lastFace=name}else{faceFrames=Math.max(0,faceFrames-1);if(faceFrames===0)lastFace=''}
    if(faceFrames===4&&now-lastFaceAt>3500){lastFaceAt=now;emit('face',name==='smile'?'You smiled.':name==='blink'?'You blinked.':`I saw your ${name}.`,score,{blendshape:name})}
   }
   const gr=gesture.recognizeForVideo(video,now);onHands?.(gr);
   const best=(gr.gestures||[]).map(x=>x?.[0]).filter(x=>x&&x.categoryName!=='None').sort((a,b)=>b.score-a.score)[0];
   if(best&&best.score>.62){gestureFrames=best.categoryName===lastGesture?gestureFrames+1:1;lastGesture=best.categoryName}else{gestureFrames=Math.max(0,gestureFrames-1);if(!gestureFrames)lastGesture=''}
   if(best&&gestureFrames===3&&now-lastGestureAt>3000){lastGestureAt=now;emit('gesture',gestureText[best.categoryName]||`I recognized ${best.categoryName.replaceAll('_',' ').toLowerCase()}.`,best.score,{gesture:best.categoryName})}
  }catch{}
 };
 return {ready:true,process,close:()=>{try{face?.close()}catch{}try{gesture?.close()}catch{}}};
}