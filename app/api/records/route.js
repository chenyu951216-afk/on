import{NextResponse}from"next/server";
import{addAlert,addOrder,addRefund,addSupportCase,dashboardData,getSettings,resolveAlert}from"../../../lib/db";
import{isAdminRequest}from"../../../lib/auth";
import{operationalAlert}from"../../../lib/notify";

export async function POST(req){
  if(!isAdminRequest(req))return NextResponse.json({error:"unauthorized"},{status:401});
  const body=await req.json();
  try{
    if(body.kind==="order")return NextResponse.json({ok:true,id:addOrder(body)});
    if(body.kind==="refund"){
      const id=addRefund(body),d=dashboardData(),s=getSettings();
      const refundRate=d.metrics.grossCents?d.metrics.refundCents/d.metrics.grossCents*100:0;
      if(refundRate>=Number(s.refundAlertPercent||10))await operationalAlert({severity:"high",type:"refund_rate",title:"退款率超過警戒值",message:`本月退款率 ${refundRate.toFixed(1)}%，警戒值 ${Number(s.refundAlertPercent||10).toFixed(1)}%。`});
      return NextResponse.json({ok:true,id});
    }
    if(body.kind==="support"){
      const id=addSupportCase(body);
      if(body.priority==="urgent")await operationalAlert({severity:"high",type:"support",title:"緊急客服案件",message:body.subject||"未命名案件"});
      return NextResponse.json({ok:true,id});
    }
    if(body.kind==="alert")return NextResponse.json({ok:true,id:addAlert(body)});
    if(body.kind==="resolve_alert"){resolveAlert(body.id);return NextResponse.json({ok:true});}
    return NextResponse.json({error:"unsupported_kind"},{status:400});
  }catch(e){return NextResponse.json({error:e.message||"儲存失敗"},{status:400})}
}
