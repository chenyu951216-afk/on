import{NextResponse}from"next/server";
import{hasAdminPassword,verifyAdminSession}from"../../../../lib/db";

export const dynamic="force-dynamic";
export const revalidate=0;

export async function GET(req){
  const initialized=hasAdminPassword();
  const authenticated=initialized&&verifyAdminSession(req.cookies.get("fieldops_session")?.value||"");
  return NextResponse.json(
    {initialized,authenticated},
    {headers:{"Cache-Control":"no-store, no-cache, must-revalidate, proxy-revalidate","Pragma":"no-cache","Expires":"0"}}
  );
}