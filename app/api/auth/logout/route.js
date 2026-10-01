import{NextResponse}from"next/server";
import{revokeAdminSession}from"../../../../lib/db";
import{cookieName,cookieBase}from"../../../../lib/auth";
export async function POST(req){
  revokeAdminSession(req.cookies.get(cookieName)?.value||"");
  const res=NextResponse.json({ok:true});
  res.cookies.set(cookieName,"",{...cookieBase,maxAge:0});
  return res;
}