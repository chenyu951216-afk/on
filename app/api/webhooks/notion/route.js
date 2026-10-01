import{NextResponse}from"next/server";
import{addEvent,getSettings}from"../../../../lib/db";

export async function POST(req){
  const settings=getSettings();
  if(!settings.notionWebhookSecret){
    return NextResponse.json({ok:false,error:"webhook_not_configured"},{status:503});
  }
  const incoming=req.headers.get("x-fieldops-secret")||"";
  if(incoming!==settings.notionWebhookSecret){
    return NextResponse.json({ok:false,error:"unauthorized"},{status:401});
  }
  const raw=await req.text();
  let payload;
  try{payload=JSON.parse(raw)}catch{payload={raw}}
  addEvent("notion_webhook",payload);
  return NextResponse.json({ok:true});
}