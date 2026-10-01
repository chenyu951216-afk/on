import{verifyAdminSession}from"./db";
export function isAdminRequest(req){return verifyAdminSession(req.cookies.get("fieldops_session")?.value||"")}
export const cookieName="fieldops_session";
export const cookieBase={httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/"};
