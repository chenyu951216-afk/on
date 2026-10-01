import{NextResponse}from"next/server";
import{hasAdminPassword,verifyAdminPassword,createAdminSession}from"../../../../lib/db";
import{cookieName,cookieBase}from"../../../../lib/auth";
export async function POST(req){
  if(!hasAdminPassword())return NextResponse.json({error:"尚未建立管理員密碼"},{status:409});
  const body=await req.json();
  if(!verifyAdminPassword(String(body.password||"")))return NextResponse.json({error:"密碼錯誤"},{status:401});
  const session=createAdminSession();
  const res=NextResponse.json({ok:true});
  res.cookies.set(cookieName,session.token,{...cookieBase,expires:new Date(session.expiresAt)});
  return res;
}