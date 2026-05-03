# dotdotwiki

> 課程顧問中台 SaaS — 從問卷診斷到 360 戰略落地，一站式 AI 工作流。

**Status**: Phase 1, W0 規劃完成，準備 W1 開工。

---

## 這是什麼

把過去 6 個獨立工具（影響力密碼 / 能力評分 / 人脈管理 / 銷售大師 / 品牌大師 / 360 戰略）整合成單一中台，學員從問卷診斷開始走完一條鏈。

## 規劃文件

從這裡開始讀：

1. [00-master-plan.md](docs/00-master-plan.md) — Master plan + 7 個 ADR（已全部選 A）
2. [01-PRD.md](docs/01-PRD.md) — 產品願景、學員旅程、權限矩陣
3. [02-data-model.md](docs/02-data-model.md) — 完整 schema + JSONB payload + RLS pattern
4. [03-architecture.md](docs/03-architecture.md) — 系統圖、跨模組 context flow、Brand OS bridge
5. [04-phase1-detailed.md](docs/04-phase1-detailed.md) — W0-W8 任務級分解
6. [05-risks-tradeoffs.md](docs/05-risks-tradeoffs.md) — 風險 + plan B + Phase 2/3 路線圖

## Tech Stack

- Vite + React 18 + TypeScript
- Tailwind 3 + shadcn/ui
- React Router v6 + TanStack Query + Zustand
- Supabase（Auth + Postgres + RLS + Edge Functions）
- Anthropic Claude（Haiku 4.5 / Sonnet 4.6）
- Vercel hosting

## 本機開發

```bash
cp .env.example .env.local         # 填入 Supabase URL + key
npm install
npm run dev                         # http://localhost:5173
```

## Schema migrations

`supabase/migrations/` 有 3 個檔案：

```
20260503000001_helpers.sql          # set_updated_at trigger function
20260503000002_core_tables.sql      # 15 張 Phase 1 + 預留表
20260503000003_rls_policies.sql     # is_workspace_member helper + RLS
```

要 push 到 Supabase 專案：

```bash
supabase login
supabase link --project-ref <YOUR_REF>
supabase db push
```

## Phase 1 進度

- [x] W0 — 規劃 + scaffolding
- [ ] W1 — 中台骨幹（auth + workspace + dashboard shell）
- [ ] W2 — 學員管理 + 權限矩陣
- [ ] W3 — 模組 1：影響力密碼問卷
- [ ] W4 — 模組 2：能力評分
- [ ] W5 — 模組 3：人脈管理
- [ ] W6 — 模組 4：銷售大師（通用版從零）
- [ ] W7 — 模組 5：戰略 + Brand OS bridge
- [ ] W8 — 整合 + 顧問後台 + Beta 上線（MX 學員 5 位）
