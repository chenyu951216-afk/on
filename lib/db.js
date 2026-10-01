import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const dir=process.env.DATA_DIR||path.join(process.cwd(),"data");
if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});

const keyPath=path.join(dir,".fieldops-master-key");
if(!fs.existsSync(keyPath)){
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
