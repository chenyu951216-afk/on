import{NextResponse}from"next/server";
import{isAdminRequest}from"../../../../lib/auth";
import{runAnalysis}from"../../../../lib/ai";

export async function POST(req){
  if(!isAdminRequest(req))return NextResponse.json({error:"unauthorized"},{status:401});
  try{
    const result=await runAnalysis("connection_test","Reply with exactly: FieldOps AI connected","Connection test");
    return NextResponse.json({ok:true,message:"OpenAI 連線正常",usage:result.usage});
  }catch(e){return NextResponse.json({error:e.message||"連線失敗"},{status:400})}
}
