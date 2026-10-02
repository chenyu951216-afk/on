import{NextResponse}from"next/server";
import{dashboardData,getSettings}from"../../../../lib/db";
import{isAdminRequest}from"../../../../lib/auth";
import{runAnalysis}from"../../../../lib/ai";

export async function POST(req){
  if(!isAdminRequest(req))return NextResponse.json({error:"unauthorized"},{status:401});
  const{kind}=await req.json();
  const s=getSettings(),data=dashboardData();
  const enabled=kind==="support"?s.aiCustomerSupport:kind==="sales"?s.aiSalesAnalysis:s.aiAnomalyTriage;
  if(enabled!=="true")return NextResponse.json({error:"此 AI 功能目前關閉"},{status:400});
  const source=kind==="support"?data.supportCases:kind==="sales"?{metrics:data.metrics,orders:data.orders,refunds:data.refunds}:{metrics:data.metrics,alerts:data.alerts,events:data.events};
  const instructions=kind==="support"?"你是小型數位產品商家的客服營運分析員。以繁體中文整理待辦、重複問題與需要人工處理的例外，不要承諾退款或代替人做決策。":kind==="sales"?"你是數位產品銷售分析員。以繁體中文根據提供的真實數據做精簡分析，指出趨勢、退款率與可觀察的異常；資料不足時明確說明。":"你是營運異常分類器。以繁體中文列出真正需要人工注意的事件，忽略無行動價值的雜訊。";
  try{return NextResponse.json({ok:true,...await runAnalysis(kind,instructions,JSON.stringify(source).slice(0,30000))})}catch(e){return NextResponse.json({error:e.message||"分析失敗"},{status:400})}
}
