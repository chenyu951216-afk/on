import{currentMonthAiSpend,getSettings,recordAiUsage}from"./db";

export async function runAnalysis(feature,instructions,input){
  const s=getSettings();
  if(s.aiEnabled!=="true")throw new Error("AI 總開關目前關閉");
  if(!s.openaiApiKey)throw new Error("尚未設定 OpenAI API Key");
  const budget=Math.max(0,Number(s.aiMonthlyBudgetUsd)||0);
  const spent=currentMonthAiSpend();
  if((s.aiBudgetMode||"hard_stop")==="hard_stop"&&budget>0&&spent>=budget)throw new Error(`本月 AI 預算已達上限（US$${spent.toFixed(2)} / US$${budget.toFixed(2)}）`);
  const model=s.aiModel||"gpt-5.6-luna";
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+s.openaiApiKey},body:JSON.stringify({model,instructions,input,max_output_tokens:700})});
  const d=await r.json();
  if(!r.ok)throw new Error(d?.error?.message||"OpenAI API 連線失敗");
  const inputTokens=Number(d?.usage?.input_tokens)||0,outputTokens=Number(d?.usage?.output_tokens)||0;
  const inRate=Math.max(0,Number(s.aiInputCostPerMillion)||0),outRate=Math.max(0,Number(s.aiOutputCostPerMillion)||0);
  const cost=inputTokens/1e6*inRate+outputTokens/1e6*outRate;
  recordAiUsage({feature,model,input_tokens:inputTokens,output_tokens:outputTokens,estimated_cost_usd:cost});
  return{output:d.output_text||d.output?.flatMap(x=>x.content||[]).map(x=>x.text||"").join("\n")||"分析完成",usage:{inputTokens,outputTokens,estimatedCostUsd:cost}};
}
