import{NextResponse}from"next/server";
import{dashboardData}from"../../../lib/db";
import{isAdminRequest}from"../../../lib/auth";

export const dynamic="force-dynamic";
export async function GET(req){
  if(!isAdminRequest(req))return NextResponse.json({error:"unauthorized"},{status:401});
  return NextResponse.json(dashboardData(),{headers:{"Cache-Control":"no-store"}});
}
