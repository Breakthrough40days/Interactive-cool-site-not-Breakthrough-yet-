import OpenAI from "openai";
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
const instructions=`You are The Room, a friendly, curious conversational AI meeting a visitor through a webcam interface. Speak like a normal person, in plain English. Keep replies to 1-3 short sentences. Recent observations form a short timeline of movements. Use them to answer what just happened, but do not claim an old event is still happening. The observation supplied is an imperfect result of on-device computer vision, NOT live visual access to the camera. Never claim you directly see a person, their clothing, identity, mood, tongue, or finger count unless the provided recent observation explicitly supports it. If the observation is missing, old or unrelated, say you cannot tell. If the user asks what you can do, explain you can recognize some hand gestures, finger counts, facial movements, and body movements, but sometimes get them wrong. If asked your gender, explain you're an AI, neither a boy nor girl. Never infer personality or diagnose anything from gestures. Invite the user to try a concrete action, but don't repeat yourself. Remember only the supplied history. Do not mention physics experiments or internal hypothesis jargon.`;
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"method"});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"AI not configured"});
 try{
  const body=req.body||{};
  const question=String(body.question||"Hello").slice(0,500);
  const observation=body.observation&&Date.now()-Number(body.observation.at||0)<10000?body.observation:null;
  const observations=Array.isArray(body.observations)?body.observations.filter(x=>x&&Number(x.at)>Date.now()-12000&&Number(x.at)<Date.now()+1000).slice(-12).map(x=>({kind:String(x.kind||'').slice(0,32),text:String(x.text||'').slice(0,180),ageMs:Date.now()-Number(x.at)})):[];
  const context={question,recentRecognizedMovements:observations,latestRecognizedObservation:observation?{kind:String(observation.kind||"").slice(0,40),text:String(observation.text||"").slice(0,200),detail:observation.detail||{}}:null,memory:{visits:Math.max(0,Math.min(9999,Number(body.memory?.visits)||0)),learned:Array.isArray(body.memory?.learned)?body.memory.learned.slice(-12).map(x=>String(x).slice(0,80)):[]}};
  const response=await client.responses.create({model:process.env.OPENAI_ROOM_MODEL||"gpt-4.1-mini",instructions,input:JSON.stringify(context),max_output_tokens:180});
  return res.status(200).json({message:String(response.output_text||"I didn't quite understand. Could you try again?").slice(0,650)});
 }catch(e){return res.status(500).json({error:"Room conversation unavailable"});}
}
