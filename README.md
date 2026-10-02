# FieldOps Studio Hub

FieldOps Studio 的 Notion 商品、收益與自動化控制台。

## 核心原則
- 所有可配置的業務資料都在網頁填寫。
- 不要求在 Zeabur 後台維護 API Key / Webhook 等業務設定。
- SQLite 持久化；Zeabur 請掛 persistent volume 到 `/app/data`。
- 正式放敏感金鑰前，會補上管理員登入、加密與備份。

## 已完成
- 管理員登入、7 天 session 與敏感設定 AES-256-GCM 加密
- 真實資料驅動的月收入、訂單、退款、客服與異常 KPI
- 訂單、退款、客服案件與營運異常記錄
- Notion webhook 驗證挑戰、HMAC / secret 驗證、事件保存與通用訂單／退款 mapping
- AI 總開關、客服／銷售／異常分析個別開關
- 每月 AI 預算、硬停止模式、可調 token 費率與用量記錄
- Discord 異常通知與通知測試
- Marketplace / Creator Profile、價格、時區與所有業務整合設定皆可在網頁管理
- Dockerfile 與 SQLite persistent volume 架構，可部署 Zeabur

## Webhook
- Endpoint：`/api/webhooks/notion`
- 可用 `X-FieldOps-Secret` 直接驗證，或以 `X-FieldOps-Signature: sha256=<hex>` 傳送 body 的 HMAC-SHA256。
- 支援 `verification_token` challenge。
- Marketplace 是否提供訂單事件取決於平台能力；未提供時可在後台手動記錄，或由後續允許的付款來源串接同一資料層。

## 部署注意
- 將 persistent volume 掛載到 `/app/data`，否則重新部署時 SQLite 與本機加密主金鑰會遺失。
- OpenAI Key、Webhook secret 與 Discord URL 不必設 Zeabur 業務環境變數，登入 `/admin` 後直接填寫。
