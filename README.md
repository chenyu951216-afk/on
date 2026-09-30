# FieldOps Studio Hub

FieldOps Studio 的 Notion 商品、收益與自動化控制台。

## 核心原則
- 所有可配置的業務資料都在網頁填寫。
- 不要求在 Zeabur 後台維護 API Key / Webhook 等業務設定。
- SQLite 持久化；Zeabur 請掛 persistent volume 到 `/app/data`。
- 正式放敏感金鑰前，會補上管理員登入、加密與備份。

## 已完成
- 中文管理首頁
- Marketplace / Creator Profile 連結設定
- Notion Webhook 接收端點
- OpenAI API Key / Discord Webhook 網頁設定
- Dockerfile，可部署 Zeabur

## 下一階段
- 管理員登入與 session
- 敏感欄位加密
- 真實訂單 / 退款 mapping
- 月營收 dashboard
- GPT 自動摘要、客服分類
- Discord 異常通知
