import{NextResponse}from"next/server";
import{getSettings,saveSettings}from"../../../lib/db";
import{isAdminRequest}from"../../../lib/auth";

const allowed=["siteName","ownerEmail","notionStoreUrl","notionCreatorUrl","notionWebhookSecret","openaiApiKey","discordWebhookUrl","timezone","currency","notes","aiEnabled","aiModel","aiMonthlyBudgetUsd","aiCustomerSupport","aiSalesAnalysis","aiFeedbackAnalysis","aiAnomalyTriage"];

export async function GET(req){
  if(!isAdminRequest(req))return NextResponse.json({error:"unauthorized"},{status:401});
  const s=getSettings();
  return NextResponse.json({...s,openaiApiKey:"",notionWebhookSecret:"",discordWebhookUrl:"",hasOpenaiApiKey:Boolean(s.openaiApiKey),hasNotionWebhookSecret:Boolean(s.notionWebhookSecret),hasDiscordWebhookUrl:Boolean(s.discordWebhookUrl)});
}
export async function POST(req){
  if(!isAdminRequest(req))return NextResponse.json({error:"unauthorized"},{status:401});
  const body=await req.json();
  const cleaned={};
  for(const k of allowed){
    if(!(k in body))continue;
    if(["openaiApiKey","notionWebhookSecret","discordWebhookUrl"].includes(k)&&!String(body[k]||"").trim())continue;
    cleaned[k]=body[k];
  }
  saveSettings(cleaned);
  const s=getSettings();
  return NextResponse.json({ok:true,hasOpenaiApiKey:Boolean(s.openaiApiKey),hasNotionWebhookSecret:Boolean(s.notionWebhookSecret),hasDiscordWebhookUrl:Boolean(s.discordWebhookUrl)});
}