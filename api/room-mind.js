import OpenAI from "openai";
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
const allowedRules=["normal","resist","patience","reverse","opposite","novel"];
const instructions=`You are the mind of The Impossible Room, an embodied interactive browser world trying to understand how a visitor explores THIS room. Never diagnose personality, mental health, intelligence, or identity. Separate direct observation from tentative inference. Be concise, curious, occasionally surprising. You may choose one safe physics rule from: normal, resist, patience, reverse, opposite, novel. Return only JSON with message, confidence 0..1, ask boolean, rule, duration 4..20, and optional shock {x:0..1,y:0..1,power:2..16}. Design an experiment that can falsify your hypothesis. If the user corrects you, accept it.`;
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"method"});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"Room AI is not configured"});
 try{
  const body=req.body||{},state=body.state||{},question=String(body.question||"Decide the next useful experiment.").slice(0,500);
  const response=await client.responses.create({model:process.env.OPENAI_ROOM_MODEL||"gpt-6-luna",instructions,input:JSON.stringify({question,state}),text:{format:{type:"json_schema",name:"room_plan",strict:true,schema:{type:"object",additionalProperties:false,properties:{message:{type:"string"},confidence:{type:"number",minimum:0,maximum:1},ask:{type:"boolean"},rule:{type:"string",enum:allowedRules},duration:{type:"number",minimum:4,maximum:20},shock:{anyOf:[{type:"null"},{type:"object",additionalProperties:false,properties:{x:{type:"number",minimum:0,maximum:1},y:{type:"number",minimum:0,maximum:1},power:{type:"number",minimum:2,maximum:16}},required:["x","y","power"]}]}},required:["message","confidence","ask","rule","duration","shock"]}}}});
  const plan=JSON.parse(response.output_text);return res.status(200).json(plan);
 }catch(e){return res.status(500).json({error:"Room mind failed"});}
}
