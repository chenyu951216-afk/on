import{NextResponse}from"next/server";import{hasAdminPassword,verifyAdminSession}from"../../../../lib/db";
export async function GET(req){const initialized=hasAdminPassword();const authenticated=initialized&&verifyAdminSession(req.cookies.get("fieldops_session")?.value||"");return NextResponse.json({initialized,authenticated})}
