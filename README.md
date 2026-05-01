# 銷售軍師 · Sales Strategist

Workshop 同步操作版 + 課後延伸練習 · v0.1

## Quick Start

```bash
npm install
npm run dev   # http://localhost:5173
```

## Stack

React 18 + Vite + TypeScript + Tailwind v3 + shadcn/ui + Zustand + React Router v6

## Phases

- ✅ **v0.1** — 骨架 + M4 旅程地圖(33c3d56)
- ✅ **v0.2** — Anthropic AI 助攻 + 後端 proxy(5c7a541)
- ✅ **v0.3** — M3 多角色同理心地圖 + 衝突分析 AI(b3fcd14)
- ✅ **v0.4** — M1 人脈三歷 + M2 M.V.P(ccfe848)
- ✅ **v0.5** — 一頁策略書 + html2pdf A3 橫式匯出(0e9cc35)
- 🛠️ **v0.6** — Supabase + 老師端儀表板(scaffold ready,需手動啟用)

## Phase 6 啟用步驟(可選 — 預設走純 localStorage)

1. **建立 Supabase 專案**(或用既有的)
2. 在 SQL Editor 跑 `migrations/0001_initial.sql`
3. 在 `.env` 加:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJh...
   ```
4. 重啟 dev server,訪問 `/teacher` 看真實學員進度
5. (Vercel 部署時)同樣的兩個 env vars 加到 Vercel project 設定

> 沒設環境變數時,`/teacher` 會顯示 mock 資料 + 啟用步驟提示,
> 學員端模組(M1-M4)仍走純 localStorage,完全 functional。

## AI 端點(後端 proxy `/api/ai`)

| promptKey | 用途 | 模型 |
|---|---|---|
| `m1_network` | 三個人脈開發方向 | Haiku 4.5 |
| `m2_vision` | 三個感性溝通方向 | Haiku 4.5 |
| `m2_product` | 三個理性差異方向 | Haiku 4.5 |
| `m2_positioning` | 定位句 3 版本 | Haiku 4.5 |
| `m3_pain_points` | 角色三個痛點建議 | Haiku 4.5 |
| `m3_conflict_analysis` | 跨角色衝突 + 攻擊路徑 | Haiku 4.5 |
| `m4_questions` | 五個引導問題建議 | Haiku 4.5 |
| `m4_outputs` | 三個預期產出方向 | Haiku 4.5 |
| `m4_peaks` | 三個情緒高峰設計 | Haiku 4.5 |

完整規格見 `~/Desktop/銷售軍師_開發說明書_v1.0.md`。
