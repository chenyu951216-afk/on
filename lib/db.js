import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const dir=process.env.DATA_DIR||path.join(process.cwd(),"data");
if(!fs.existsSync(/*turbopackIgnore: true*/ dir))fs.mkdirSync(/*turbopackIgnore: true*/ dir,{recursive:true});

const keyPath=path.join(dir,".fieldops-master-key");
if(!fs.existsSync(/*turbopackIgnore: true*/ keyPath)){
  fs.writeFileSync(keyPath,crypto.randomBytes(32),{mode:0o600});
}
const masterKey=fs.readFileSync(keyPath);
const sensitiveKeys=new Set(["openaiApiKey","notionWebhookSecret","discordWebhookUrl"]);

function encrypt(value){
  if(!value||String(value).startsWith("enc:v1:"))return String(value||"");
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv("aes-256-gcm",masterKey,iv);
  const encrypted=Buffer.concat([cipher.update(String(value),"utf8"),cipher.final()]);
  const tag=cipher.getAuthTag();
  return "enc:v1:"+Buffer.concat([iv,tag,encrypted]).toString("base64");
}
function decrypt(value){
  const text=String(value||"");
  if(!text.startsWith("enc:v1:"))return text;
  try{
    const buf=Buffer.from(text.slice(7),"base64");
    const iv=buf.subarray(0,12),tag=buf.subarray(12,28),data=buf.subarray(28);
    const decipher=crypto.createDecipheriv("aes-256-gcm",masterKey,iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data),decipher.final()]).toString("utf8");
  }catch{return "";}
}

const db=new Database(path.join(dir,"fieldops.db"));
db.exec(`
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT,type TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS admin_auth(id INTEGER PRIMARY KEY CHECK(id=1),password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS admin_sessions(token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS orders(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE,
  source TEXT NOT NULL DEFAULT 'manual',
  buyer_name TEXT NOT NULL DEFAULT '',
  buyer_email TEXT NOT NULL DEFAULT '',
  product TEXT NOT NULL DEFAULT 'Contractor Operations OS',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'paid',
  purchased_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS refunds(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  external_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  refunded_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(order_id) REFERENCES orders(id)
);
CREATE TABLE IF NOT EXISTS support_cases(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'manual',
  subject TEXT NOT NULL,
  customer_email TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS alerts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  severity TEXT NOT NULL DEFAULT 'info',
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS ai_usage(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

export function getSettings(){
  const rows=db.prepare("SELECT key,value FROM settings").all();
  return Object.fromEntries(rows.map(r=>[r.key,sensitiveKeys.has(r.key)?decrypt(r.value):r.value]));
}
export function saveSettings(values){
  const stmt=db.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
  const tx=db.transaction(entries=>{for(const[k,v]of entries)stmt.run(k,sensitiveKeys.has(k)?encrypt(v):String(v??""))});
  tx(Object.entries(values));
}
export function addEvent(type,payload){db.prepare("INSERT INTO events(type,payload) VALUES(?,?)").run(type,JSON.stringify(payload))}
export function recentEvents(limit=30){return db.prepare("SELECT id,type,payload,created_at FROM events ORDER BY id DESC LIMIT ?").all(Math.min(Number(limit)||30,100)).map(r=>({...r,payload:safeJson(r.payload)}))}
function safeJson(value){try{return JSON.parse(value)}catch{return value}}

export function addOrder(value){
  const info=db.prepare(`INSERT INTO orders(external_id,source,buyer_name,buyer_email,product,amount_cents,currency,status,purchased_at)
    VALUES(@external_id,@source,@buyer_name,@buyer_email,@product,@amount_cents,@currency,@status,@purchased_at)
    ON CONFLICT(external_id) DO UPDATE SET source=excluded.source,buyer_name=excluded.buyer_name,buyer_email=excluded.buyer_email,product=excluded.product,amount_cents=excluded.amount_cents,currency=excluded.currency,status=excluded.status,purchased_at=excluded.purchased_at`).run({
      external_id:value.external_id||null,source:value.source||"manual",buyer_name:value.buyer_name||"",buyer_email:value.buyer_email||"",
      product:value.product||"Contractor Operations OS",amount_cents:Math.max(0,Number(value.amount_cents)||0),currency:String(value.currency||"USD").toUpperCase(),
      status:value.status||"paid",purchased_at:value.purchased_at||new Date().toISOString()
    });
  return info.lastInsertRowid;
}
export function addRefund(value){
  return db.prepare(`INSERT INTO refunds(order_id,external_id,amount_cents,reason,refunded_at) VALUES(@order_id,@external_id,@amount_cents,@reason,@refunded_at)
    ON CONFLICT(external_id) DO UPDATE SET order_id=excluded.order_id,amount_cents=excluded.amount_cents,reason=excluded.reason,refunded_at=excluded.refunded_at`).run({
      order_id:value.order_id||null,external_id:value.external_id||null,amount_cents:Math.max(0,Number(value.amount_cents)||0),reason:value.reason||"",refunded_at:value.refunded_at||new Date().toISOString()
    }).lastInsertRowid;
}
export function addSupportCase(value){return db.prepare("INSERT INTO support_cases(source,subject,customer_email,category,priority,status,summary) VALUES(?,?,?,?,?,?,?)").run(value.source||"manual",value.subject||"未命名案件",value.customer_email||"",value.category||"general",value.priority||"normal",value.status||"open",value.summary||"").lastInsertRowid}
export function addAlert(value){return db.prepare("INSERT INTO alerts(severity,type,title,message) VALUES(?,?,?,?)").run(value.severity||"info",value.type||"system",value.title||"通知",value.message||"").lastInsertRowid}
export function resolveAlert(id){db.prepare("UPDATE alerts SET status='resolved',resolved_at=datetime('now') WHERE id=?").run(Number(id))}
export function recordAiUsage(value){db.prepare("INSERT INTO ai_usage(feature,model,input_tokens,output_tokens,estimated_cost_usd) VALUES(?,?,?,?,?)").run(value.feature,value.model,Number(value.input_tokens)||0,Number(value.output_tokens)||0,Number(value.estimated_cost_usd)||0)}
export function currentMonthAiSpend(){return Number(db.prepare("SELECT COALESCE(SUM(estimated_cost_usd),0) total FROM ai_usage WHERE created_at>=datetime('now','start of month')").get().total)||0}
export function dashboardData(){
  const monthStart="datetime('now','start of month')";
  const gross=Number(db.prepare(`SELECT COALESCE(SUM(amount_cents),0) total FROM orders WHERE status IN ('paid','completed') AND purchased_at>=${monthStart}`).get().total)||0;
  const refunded=Number(db.prepare(`SELECT COALESCE(SUM(amount_cents),0) total FROM refunds WHERE refunded_at>=${monthStart}`).get().total)||0;
  const orderCount=Number(db.prepare(`SELECT COUNT(*) total FROM orders WHERE purchased_at>=${monthStart}`).get().total)||0;
  const openCases=Number(db.prepare("SELECT COUNT(*) total FROM support_cases WHERE status='open'").get().total)||0;
  const openAlerts=Number(db.prepare("SELECT COUNT(*) total FROM alerts WHERE status='open'").get().total)||0;
  return {
    metrics:{grossCents:gross,refundCents:refunded,netCents:gross-refunded,orderCount,openCases,openAlerts,aiSpendUsd:currentMonthAiSpend()},
    orders:db.prepare("SELECT * FROM orders ORDER BY purchased_at DESC,id DESC LIMIT 50").all(),
    refunds:db.prepare("SELECT r.*,o.external_id order_external_id FROM refunds r LEFT JOIN orders o ON o.id=r.order_id ORDER BY r.refunded_at DESC,r.id DESC LIMIT 50").all(),
    supportCases:db.prepare("SELECT * FROM support_cases ORDER BY id DESC LIMIT 50").all(),
    alerts:db.prepare("SELECT * FROM alerts ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END,id DESC LIMIT 50").all(),
    aiUsage:db.prepare("SELECT * FROM ai_usage ORDER BY id DESC LIMIT 50").all(),
    events:recentEvents(30)
  };
}

export function hasAdminPassword(){return Boolean(db.prepare("SELECT 1 FROM admin_auth WHERE id=1").get())}
export function setAdminPassword(password){
  if(hasAdminPassword())throw new Error("admin_already_initialized");
  const salt=crypto.randomBytes(16);
  const hash=crypto.scryptSync(password,salt,64);
  db.prepare("INSERT INTO admin_auth(id,password_hash,password_salt) VALUES(1,?,?)").run(hash.toString("hex"),salt.toString("hex"));
}
export function verifyAdminPassword(password){
  const row=db.prepare("SELECT password_hash,password_salt FROM admin_auth WHERE id=1").get();
  if(!row)return false;
  const expected=Buffer.from(row.password_hash,"hex");
  const actual=crypto.scryptSync(password,Buffer.from(row.password_salt,"hex"),64);
  return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual);
}
function tokenHash(token){return crypto.createHash("sha256").update(token).digest("hex")}
export function createAdminSession(){
  const token=crypto.randomBytes(32).toString("base64url");
  const expiresAt=Date.now()+7*24*60*60*1000;
  db.prepare("DELETE FROM admin_sessions WHERE expires_at<?").run(Date.now());
  db.prepare("INSERT INTO admin_sessions(token_hash,expires_at) VALUES(?,?)").run(tokenHash(token),expiresAt);
  return{token,expiresAt};
}
export function verifyAdminSession(token){
  if(!token)return false;
  const row=db.prepare("SELECT expires_at FROM admin_sessions WHERE token_hash=?").get(tokenHash(token));
  if(!row)return false;
  if(row.expires_at<Date.now()){db.prepare("DELETE FROM admin_sessions WHERE token_hash=?").run(tokenHash(token));return false}
  return true;
}
export function revokeAdminSession(token){if(token)db.prepare("DELETE FROM admin_sessions WHERE token_hash=?").run(tokenHash(token))}
