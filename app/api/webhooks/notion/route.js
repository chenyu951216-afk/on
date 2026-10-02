import{NextResponse}from"next/server";
import crypto from"crypto";
import{addAlert,addEvent,addOrder,addRefund,getSettings}from"../../../../lib/db";
import{operationalAlert}from"../../../../lib/notify";

function authorized(req,raw,secret){
  const direct=req.headers.get("x-fieldops-secret")||"";
  if(direct&&direct===secret)return true;
  const signature=(req.headers.get("x-fieldops-signature")||req.headers.get("x-notion-signature")||"").replace(/^sha256=/,"");
  if(!signature)return false;
  const expected=crypto.createHmac("sha256",secret).update(raw).digest("hex");
  const a=Buffer.from(signature),b=Buffer.from(expected);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}

export async function POST(req){
  const settings=getSettings();
  if(!settings.notionWebhookSecret){
    return NextResponse.json({ok:false,error:"webhook_not_configured"},{status:503});
  }
  const raw=await req.text();
  let payload;
  try{payload=JSON.parse(raw)}catch{payload={raw}}
  if(payload?.verification_token){
    addEvent("notion_verification",{received:true});
    return NextResponse.json({verification_token:payload.verification_token});
  }
  if(!authorized(req,raw,settings.notionWebhookSecret))return NextResponse.json({ok:false,error:"unauthorized"},{status:401});
  addEvent("notion_webhook",payload);
  const eventType=payload.type||payload.event||payload.action||"";
  const data=payload.data||payload.object||payload;
  try{
    if(["order.paid","order.completed","purchase.completed"].includes(eventType))addOrder({external_id:data.id||data.order_id,source:"notion_webhook",buyer_name:data.buyer_name||data.customer?.name,buyer_email:data.buyer_email||data.customer?.email,product:data.product_name,amount_cents:data.amount_cents??Math.round(Number(data.amount||0)*100),currency:data.currency||"USD",status:eventType==="order.completed"?"completed":"paid",purchased_at:data.created_at||data.purchased_at});
    if(["refund.created","order.refunded"].includes(eventType))addRefund({external_id:data.id||data.refund_id,order_id:data.order_id,amount_cents:data.amount_cents??Math.round(Number(data.amount||0)*100),reason:data.reason,refunded_at:data.created_at||data.refunded_at});
    if(eventType.includes("failed")||eventType.includes("dispute"))await operationalAlert({severity:"high",type:"webhook",title:"Marketplace 異常事件",message:eventType});
  }catch(e){addAlert({severity:"medium",type:"webhook_mapping",title:"Webhook 資料需要人工檢查",message:e.message||eventType});}
  return NextResponse.json({ok:true,eventType});
}
