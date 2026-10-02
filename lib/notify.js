import{addAlert,getSettings}from"./db";

export async function operationalAlert({severity="medium",type="system",title,message=""}){
  addAlert({severity,type,title,message});
  const s=getSettings();
  if(s.notificationsEnabled!=="true"||!s.discordWebhookUrl)return{sent:false};
  try{
    const r=await fetch(s.discordWebhookUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:`[FieldOps ${severity.toUpperCase()}] ${title}${message?`\n${message}`:""}`})});
    return{sent:r.ok};
  }catch{return{sent:false}}
}
