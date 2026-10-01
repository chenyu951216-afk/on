"use client";
import{useEffect,useState}from"react";

const empty={
  siteName:"FieldOps Studio",ownerEmail:"",notionStoreUrl:"",notionCreatorUrl:"",
  notionWebhookSecret:"",openaiApiKey:"",discordWebhookUrl:"",
  hasOpenaiApiKey:false,hasNotionWebhookSecret:false,hasDiscordWebhookUrl:false,
  timezone:"Asia/Taipei",currency:"TWD",notes:"",
  aiEnabled:"false",aiModel:"gpt-5.6-luna",aiMonthlyBudgetUsd:"5",
  aiCustomerSupport:"true",aiSalesAnalysis:"true",aiFeedbackAnalysis:"true",aiAnomalyTriage:"true"
};

export default function AdminPage(){
  const[auth,setAuth]=useState({loading:true,initialized:false,authenticated:false});
  const[password,setPassword]=useState("");
  const[authError,setAuthError]=useState("");
  const[form,setForm]=useState(empty);
  const[saved,setSaved]=useState(false);
  const[testResult,setTestResult]=useState("");

  useEffect(()=>{checkAuth()},[]);

  async function checkAuth(){
    const r=await fetch("/api/auth/status",{cache:"no-store"});
    const d=await r.json();
    setAuth({loading:false,...d});
    if(d.authenticated)await loadSettings();
  }

  async function loadSettings(){
    const r=await fetch("/api/settings",{cache:"no-store"});
    if(r.status===401){setAuth(x=>({...x,authenticated:false}));return}
    const d=await r.json();
    setForm({...empty,...d});
  }

  async function submitAuth(mode){
    setAuthError("");
    const r=await fetch(mode==="setup"?"/api/auth/setup":"/api/auth/login",{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})
    });
    const d=await r.json();
    if(!r.ok){setAuthError(d.error||"操作失敗");return}
    setPassword("");
    await checkAuth();
  }

  async function logout(){
    await fetch("/api/auth/logout",{method:"POST"});
    setForm(empty);
    await checkAuth();
  }

  function set(k,v){setForm(x=>({...x,[k]:v}))}

  async function save(){
    setSaved(false);
    const r=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    if(r.status===401){setAuth(x=>({...x,authenticated:false}));return false}
    const d=await r.json();
    if(r.ok){
      setSaved(true);
      setForm(x=>({...x,openaiApiKey:"",notionWebhookSecret:"",discordWebhookUrl:"",
        hasOpenaiApiKey:d.hasOpenaiApiKey,hasNotionWebhookSecret:d.hasNotionWebhookSecret,hasDiscordWebhookUrl:d.hasDiscordWebhookUrl
      }));
      return true;
    }
    return false;
  }

  async function testAI(){
    setTestResult("測試中…");
    const ok=await save();
    if(!ok){setTestResult("✕ 儲存失敗");return}
    const r=await fetch("/api/ai/test",{method:"POST"});
    const d=await r.json();
    setTestResult(r.ok?"✓ "+d.message:"✕ "+(d.error||"測試失敗"));
  }

  if(auth.loading){
    return <main className="authShell"><div className="authCard"><h1>FieldOps Studio</h1><p className="note">正在檢查管理員狀態…</p></div></main>;
  }

  if(!auth.authenticated){
    const first=!auth.initialized;
    return <main className="authShell">
      <div className="authCard">
        <div className="brand"><img src="/fieldops-logo.svg" className="siteLogo" alt=""/><div><h1>FieldOps Studio</h1><div className="sub">Private Admin</div></div></div>
        <div className="authDivider"/>
        <h2>{first?"第一次設定管理後台":"管理員登入"}</h2>
        <p className="note">{first?"建立至少 10 個字元的管理員密碼。密碼只儲存安全雜湊，不會以明文保存。":"這裡不是顧客頁面。輸入管理員密碼才能進入控制台。"}</p>
        <label>{first?"建立管理員密碼":"管理員密碼"}</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")submitAuth(first?"setup":"login")}}
          placeholder={first?"至少 10 個字元":"輸入密碼"} autoFocus/>
        {authError&&<div className="authError">{authError}</div>}
        <button onClick={()=>submitAuth(first?"setup":"login")}>{first?"建立並進入後台":"登入"}</button>
        <a className="backLink" href="/">← 回 FieldOps Studio 官網</a>
      </div>
    </main>;
  }

  return <main className="container adminOnly">
    <div className="topbar">
      <div className="brand"><img src="/fieldops-logo.svg" className="siteLogo" alt=""/><div><h1>FieldOps Studio Hub</h1><div className="sub">私人管理後台 · 顧客不會看到這一頁</div></div></div>
      <div className="topActions"><a className="badge" href="/">查看公開官網</a><button className="smallButton" onClick={logout}>登出</button></div>
    </div>

    <div className="nav"><a className="active" href="#dashboard">總覽</a><a href="#settings">設定</a><a href="#automation">AI 自動化</a></div>

    <section id="dashboard" className="grid">
      <div className="card kpi"><div className="label">本月收入</div><div className="value">NT$0</div></div>
      <div className="card kpi"><div className="label">本月訂單</div><div className="value">0</div></div>
      <div className="card kpi"><div className="label">待處理事項</div><div className="value">0</div></div>
      <div className="card kpi"><div className="label">AI 自動化</div><div className="value">{form.aiEnabled==="true"?"ON":"OFF"}</div></div>

      <div className="card span6">
        <h2>目前產品</h2>
        <div className="row"><div><strong>Contractor Operations OS</strong><div className="note">主產品 · 建置中</div></div><span className="badge">US$79–99</span></div>
        <div className="row"><div><strong>Notion Marketplace</strong><div className="note">Creator / 販售資格申請流程</div></div><span className="badge">進行中</span></div>
      </div>

      <div className="card span6">
        <h2>自動化狀態</h2>
        <div className="row"><span>Notion Marketplace Webhook</span><span className="badge">{form.hasNotionWebhookSecret?"已設定":"尚未設定"}</span></div>
        <div className="row"><span>OpenAI</span><span className="badge">{form.aiEnabled==="true"?"已開啟":"已關閉"}</span></div>
        <div className="row"><span>Discord 通知</span><span className="badge">{form.hasDiscordWebhookUrl?"已設定":"尚未設定"}</span></div>
      </div>

      <div className="card span12" id="settings">
        <h2>一般設定</h2>
        <p className="note">這些資料都從網頁管理。敏感欄位會加密保存；留空再儲存不會清除已存在的值。</p>
        <div className="form">
          <div className="field"><label>品牌名稱</label><input value={form.siteName} onChange={e=>set("siteName",e.target.value)}/></div>
          <div className="field"><label>管理 Email</label><input value={form.ownerEmail} onChange={e=>set("ownerEmail",e.target.value)}/></div>
          <div className="field full"><label>Notion Marketplace / 商品網址</label><input value={form.notionStoreUrl} onChange={e=>set("notionStoreUrl",e.target.value)} placeholder="正式上架後再填"/></div>
          <div className="field full"><label>Notion Creator Profile 網址</label><input value={form.notionCreatorUrl} onChange={e=>set("notionCreatorUrl",e.target.value)} placeholder="有公開 Creator URL 後再填"/></div>
          <div className="field"><label>時區</label><input value={form.timezone} onChange={e=>set("timezone",e.target.value)}/></div>
          <div className="field"><label>主要幣別</label><input value={form.currency} onChange={e=>set("currency",e.target.value)}/></div>
          <div className="field full"><label>Notion Webhook Secret {form.hasNotionWebhookSecret?"（已設定）":""}</label><input type="password" value={form.notionWebhookSecret} onChange={e=>set("notionWebhookSecret",e.target.value)} placeholder={form.hasNotionWebhookSecret?"•••••••• 留空保留原值":"之後串接 Marketplace 時再填"}/></div>
          <div className="field full"><label>Discord Webhook URL {form.hasDiscordWebhookUrl?"（已設定）":""}</label><input type="password" value={form.discordWebhookUrl} onChange={e=>set("discordWebhookUrl",e.target.value)} placeholder={form.hasDiscordWebhookUrl?"•••••••• 留空保留原值":"選用"}/></div>
          <div className="field full"><label>備註</label><textarea value={form.notes} onChange={e=>set("notes",e.target.value)}/></div>
        </div>
      </div>

      <div className="card span12" id="automation">
        <h2>OpenAI / GPT 自動化（選用）</h2>
        <p className="note">總開關關閉時，不會呼叫 OpenAI API，也不會產生模型用量。</p>
        <div className="form">
          <div className="field"><label>AI 總開關</label><select value={form.aiEnabled} onChange={e=>set("aiEnabled",e.target.value)}><option value="false">關閉（零 API 用量）</option><option value="true">開啟</option></select></div>
          <div className="field"><label>模型</label><select value={form.aiModel} onChange={e=>set("aiModel",e.target.value)} disabled={form.aiEnabled!=="true"}><option value="gpt-5.6-luna">GPT-5.6 Luna（低成本）</option><option value="gpt-5.6-terra">GPT-5.6 Terra（平衡）</option><option value="gpt-5.6-sol">GPT-5.6 Sol（高能力）</option></select></div>
          <div className="field"><label>每月 AI 預算警戒值（USD）</label><input type="number" min="0" step="1" value={form.aiMonthlyBudgetUsd} onChange={e=>set("aiMonthlyBudgetUsd",e.target.value)} disabled={form.aiEnabled!=="true"}/></div>
          <div className="field"><label>客服自動化</label><select value={form.aiCustomerSupport} onChange={e=>set("aiCustomerSupport",e.target.value)} disabled={form.aiEnabled!=="true"}><option value="true">開</option><option value="false">關</option></select></div>
          <div className="field"><label>銷售分析</label><select value={form.aiSalesAnalysis} onChange={e=>set("aiSalesAnalysis",e.target.value)} disabled={form.aiEnabled!=="true"}><option value="true">開</option><option value="false">關</option></select></div>
          <div className="field"><label>買家回饋整理</label><select value={form.aiFeedbackAnalysis} onChange={e=>set("aiFeedbackAnalysis",e.target.value)} disabled={form.aiEnabled!=="true"}><option value="true">開</option><option value="false">關</option></select></div>
          <div className="field"><label>異常事件判斷</label><select value={form.aiAnomalyTriage} onChange={e=>set("aiAnomalyTriage",e.target.value)} disabled={form.aiEnabled!=="true"}><option value="true">開</option><option value="false">關</option></select></div>
          <div className="field full"><label>OpenAI API Key {form.hasOpenaiApiKey?"（已設定）":""}</label><input type="password" value={form.openaiApiKey} onChange={e=>set("openaiApiKey",e.target.value)} placeholder={form.hasOpenaiApiKey?"•••••••• 留空保留原值":"啟用 AI 後再填"} disabled={form.aiEnabled!=="true"}/></div>
          <div className="field full actions"><button onClick={save}>{saved?"已儲存":"儲存全部設定"}</button><button className="smallButton" onClick={testAI} disabled={form.aiEnabled!=="true"}>測試 OpenAI 連線</button>{testResult&&<span className="note">{testResult}</span>}</div>
        </div>
      </div>
    </section>
  </main>;
}