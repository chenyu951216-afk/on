import{NextResponse}from"next/server";
import{addAlert,getSettings}from"../../../../lib/db";
import{isAdminRequest}from"../../../../lib/auth";

export async function POST(req){
  if(!isAdminRequest(req))return NextResponse.json({error:"unauthorized"},{status:401});
  const s=getSettings();
  if(!s.discordWebhookUrl)return NextResponse.json({error:"尚未設定 Discord Webhook URL"},{status:400});
  const message="FieldOps Studio 測試通知：異常通知連線正常。";
  try{
    const r=await fetch(s.discordWebhookUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:message})});
    if(!r.ok)return NextResponse.json({error:"Discord 回應 "+r.status},{status:400});
    addAlert({severity:"info",type:"test",title:"通知測試成功",message});
    return NextResponse.json({ok:true,message:"Discord 通知已送出"});
  }catch(e){return NextResponse.json({error:e.message||"通知失敗"},{status:500})}
}
