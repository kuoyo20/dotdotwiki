# 03 — System Architecture（系統架構）

> Status: Draft v0.1 · Phase 1
> 依據 ADR-01 (Vite+React+TS) / ADR-04 (新建 360bizthinker) / ADR-07 (新 Supabase Tokyo)

---

## 1. High-Level System Diagram

```
                         ┌─────────────────────────────────────┐
                         │         360bizthinker (Vercel)         │
                         │   Vite + React 18 + TS + Tailwind   │
                         │                                     │
                         │   shell（auth / nav / dashboard）   │
                         │   ├─ /assessment    (影響力密碼)    │
                         │   ├─ /capability    (能力評分)      │
                         │   ├─ /network       (人脈)          │
                         │   ├─ /sales         (銷售大師)      │
                         │   ├─ /brand → SSO 跳出至 Brand OS   │
                         │   └─ /strategy      (戰略)          │
                         └────────────────┬────────────────────┘
                                          │  Supabase JS SDK
                                          ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │                      Supabase 中台 (Tokyo)                       │
   │                                                                   │
   │  Auth（email magic link + Google OAuth）                          │
   │                                                                   │
   │  Postgres + RLS                                                  │
   │  ├─ workspaces / cohorts / students / companies                  │
   │  ├─ module_data（all modules' payload）                          │
   │  ├─ student_module_access                                         │
   │  └─ entitlements / products / subscriptions（Phase 3 預留）      │
   │                                                                   │
   │  Edge Functions (Deno)                                           │
   │  ├─ generate-{assessment-report, capability-..., strategy-...}    │
   │  ├─ sync-brand-os（拉 Brand OS 資料）                             │
   │  ├─ invite-students（批次開帳號）                                 │
   │  └─ context-builder（跨模組 context 組合器）                     │
   │                                                                   │
   │  Storage（學員上傳檔案、頭像）                                   │
   └──────────────────────────────────────────────────────────────────┘
                                  │
                  ┌───────────────┼──────────────────┐
                  ▼                                  ▼
       ┌─────────────────┐               ┌──────────────────────┐
       │  Anthropic API  │               │   Brand OS Supabase  │
       │  Claude Haiku   │               │  (rsoeybrftefubupwb) │
       │  + Sonnet       │               │   讀取金字塔 / Soul  │
       └─────────────────┘               │   /同理心地圖         │
                                          └──────────────────────┘
```

---

## 2. Tech Stack（依 ADR 拍板版）

| 層 | 選擇 | 為什麼 |
|---|---|---|
| Frontend | **Vite + React 18 + TypeScript** | ADR-01 — 5/6 模組已是這個 |
| Styling | **Tailwind + shadcn/ui** | Brand OS 已驗證 |
| Routing | **React Router v6** | Brand OS / Strategos 都用 |
| State | **TanStack Query**（server state）+ **Zustand**（local state） | Strategos 已用 |
| Backend | **Supabase**（Auth + Postgres + Edge Functions + Storage） | ADR-07 |
| AI | **Anthropic SDK**（Claude Haiku 4.5 / Sonnet 4.6） + **Gemini**（保留品牌頭像用） | Brand OS 已驗證；參考 [common skills](claude-api) |
| PDF（Phase 1.5） | `@react-pdf/renderer` | Strategos 已用 |
| Hosting | **Vercel**（前端）+ Supabase | 同 Brand OS / Strategos pattern |
| Domain | 360bizthinker.vercel.app（Phase 1）→ 自有 domain（Phase 2 上線時） | 預留 |

---

## 3. Frontend 架構

### 3.1 路由結構

```
/                        Landing（顧問 / 學員兩態）
/login                   Auth（email magic link + Google OAuth）
/onboarding              首登 setup（建第一間公司）
/home                    學員 dashboard（橫向卡片：模組進度）
/companies/:id           公司詳情頁
/companies/:id/:module   進入特定模組（assessment/capability/...）

/admin                   Workspace Admin / Coach 區（受 RLS 保護）
  /admin/cohorts         課程班管理
  /admin/cohorts/:id     單個 cohort（學員列表 + 模組權限）
  /admin/students        所有學員列表
  /admin/students/:id    學員詳情（看其所有公司、所有模組產出）

/_dev                    Phase 1 內部測試頁（不放 nav）
```

### 3.2 目錄結構

```
src/
├── app/
│   ├── App.tsx                  # router + providers
│   ├── routes.tsx               # 集中式路由
│   └── providers/               # AuthProvider / QueryProvider / ThemeProvider
├── lib/
│   ├── supabase.ts              # client
│   ├── auth.ts                  # session helpers
│   ├── ai.ts                    # Anthropic 包裝（呼叫 edge function）
│   └── module-context.ts        # 跨模組 context builder（呼叫 context-builder edge fn）
├── modules/                     # 模組獨立資料夾
│   ├── assessment/
│   │   ├── pages/               # 模組路由元件
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.ts               # CRUD wrappers
│   │   └── types.ts             # payload schema TS 型別
│   ├── capability/
│   ├── network/
│   ├── sales/
│   ├── brand/                   # 只有 SSO 跳轉 + 同步顯示
│   └── strategy/
├── components/                  # 跨模組共用 UI（Card / DataTable / EmptyState ...）
├── pages/                       # 非模組頁（home / admin / login）
└── integrations/
    └── supabase/
        └── types.ts             # 自動產生
```

**為什麼 modules/ 自己一層**：
- 每個模組是準獨立的，介面跟邏輯不會被其他模組污染
- 未來 Phase 3 EC 賣單模組時，`modules/sales/` 直接打包賣
- 新增第 7 個模組 = 新建一個 `modules/` 子資料夾，shell 不動

---

## 4. Backend 架構

### 4.1 Supabase 角色

- **Auth**：email magic link（學員）+ Google OAuth（顧問）
- **Postgres**：core data（schema 見 `02-data-model.md`）
- **Edge Functions**：所有 AI / 跨模組邏輯 / 批次操作
- **Storage**：學員上傳的圖片、PDF、音檔（從 Phase 1.5 啟用）

### 4.2 Edge Functions 清單（Phase 1）

| Function | 用途 | verify_jwt | 預期延遲 |
|---|---|---|---|
| `invite-students` | Coach 批次邀請學員（建 auth user + workspace_member + cohort_student） | true | <2s |
| `course-login` | 學員用 invite_code 自助登入（學自 Brand OS） | true（service role 內用）| <1s |
| `generate-assessment-report` | 影響力密碼答完計分 + AI 產 12 挑戰排名 | false（公開）| ~10s |
| `generate-capability-summary` | 能力評分九宮格 + AI 摘要 | false | ~15s |
| `generate-strategy-draft` | 戰略一鍵起草（lite/full） | false | ~30s |
| `context-builder` | 給定 company_id + 目標 module，組出跨模組 context 字串 | false | <500ms |
| `sync-brand-os` | 從 Brand OS Supabase 拉資料寫進 module_data | true（cron 觸發） | <5s |
| `manage-cohort` | Admin CRUD cohort | true | <500ms |

### 4.3 共用 helper

```
supabase/functions/_shared/
├── anthropic.ts        # callClaudeWithTool (從 Brand OS 移植)
├── supabase-client.ts  # service role + anon helper
├── auth-check.ts       # JWT 解碼 + workspace member 驗證
└── module-data.ts      # CRUD wrappers + audit log
```

---

## 5. 跨模組 Context 流程（核心價值）

這是「為什麼要做中台」的關鍵 — 模組產出互相加值。

### 5.1 流程

```
學員進入 /companies/:id/strategy
    ↓
Frontend 呼叫 context-builder edge function
    payload: { company_id, target_module: 'strategy' }
    ↓
context-builder 查詢 company_id 下所有 completed module_data
    ↓
按 module_type 拼接成結構化 context 字串：
    "## 影響力密碼結果
       5 力分數：...
       排名前 3 弱點：...
     ## 品牌定位（來自 Brand OS）
       願景：...
       核心價值：...
     ..."
    ↓
回傳給 frontend
    ↓
Frontend 呼叫 generate-strategy-draft，把 context 塞進 system prompt
    ↓
AI 產出 → 寫進 module_data.ai_input.cross_module_context_snapshot
    ↓
寫進 module_data_links（記錄這次戰略引用了哪幾筆 module_data）
```

### 5.2 為什麼要 snapshot

- 跨模組 context 寫進 `ai_input` 是 **凍結的**（snapshot at generation time）
- 學員之後改了影響力密碼答案，戰略不會自動跟著動 — UI 顯示「⚠️ 你的問卷有更新，要重新生成戰略嗎？」
- 學自 Brand OS 的 STALE flag 設計

---

## 6. Brand OS Bridge（不動 production，做單向同步）

### 6.1 為什麼用單向同步而非雙向

- Brand OS 仍在 KOI production，schema 改動風險高
- 單向：Brand OS → 中台，每小時 cron 拉一次
- 中台只**讀取**，不寫回 Brand OS
- 學員在中台點品牌大師 → SSO 跳轉到 Brand OS（在那邊完成編輯）→ 下次 cron 同步回中台

### 6.2 SSO 跳轉

中台與 Brand OS 用同一個 Supabase Auth？**不**。它們是不同 Supabase 專案。

方案：在 Brand OS 增加一個 edge function `accept-token`，接受中台簽發的短期 token：
1. 中台知道學員 email + Brand OS course_id
2. 中台 server 簽一個 1 分鐘 JWT（含 email）
3. 中台 frontend redirect 到 `https://consumer-insight-map.vercel.app/sso?token=...`
4. Brand OS frontend 拿 token → 呼叫 accept-token edge function（驗 token + 中台公鑰）→ 取得 Brand OS Supabase session
5. Brand OS 正常登入

> Phase 1 簡化版：不做 SSO，學員手動再登一次 Brand OS。SSO 是 W7 nice-to-have，預估 0.5 天。

### 6.3 同步邏輯

```
sync-brand-os edge function (cron 每小時)
  for each (workspace, brand-os-mapping):
    fetch all brands updated since last_synced_at
    for each brand:
      upsert module_data:
        company_id = lookup_or_create_company(brand.name, brand.industry)
        module_type = 'brand_os'
        payload = {
          synced_pyramid: brand_pyramid row,
          synced_soul: brand_soul_results row,
          synced_empathy: empathy_results row,
          external_url: ...
        }
    update last_synced_at
```

---

## 7. Auth Flow

### 7.1 顧問（Workspace Admin / Coach）

```
1. /login → 點「顧問登入」
2. Google OAuth（限 kuoyo20@gmail.com / kuoyo@miaolin.com.tw / kuoyo@miraclex.com.tw 等 admin email）
3. callback → 檢查 workspace_members 中是否有對應 user_id
4. 沒有 → 第一次登入自動建 workspace + admin role
5. 進入 /admin
```

### 7.2 學員（Student）

```
1. 收到顧問寄的邀請 email（含 magic link 或 invite_code）
方案 A magic link：
  2a. 點連結 → Supabase 自動登入 → /onboarding
方案 B invite_code（學自 Brand OS）：
  2b. /login → 輸入 email + invite_code + password
  3b. course-login edge function 驗證 → 自動建 auth.user + workspace_member + cohort_student
  4b. 取得 session → 跳 /onboarding
3. 第一次登入：建第一間 company
4. 進入 /home
```

### 7.3 RLS 進站時自動套

每個 query 自動帶 `auth.uid()`，policies 會判斷：
- 學員只看自己的 companies / module_data
- Coach 看同 workspace 所有 companies / module_data
- Admin 看 workspace 全部

---

## 8. 部署與環境

### 8.1 環境

- **Production**：360bizthinker.vercel.app（main 分支自動部署）
- **Preview**：每個 feature branch（Vercel 自動）
- **Local**：localhost:5173（Vite dev）

### 8.2 環境變數

```
VITE_SUPABASE_URL                  # 中台 Supabase
VITE_SUPABASE_PUBLISHABLE_KEY      # anon key
SUPABASE_SERVICE_ROLE_KEY          # edge functions 用
ANTHROPIC_API_KEY                  # edge functions 用
GEMINI_API_KEY                     # 預留（品牌頭像用）

# Brand OS bridge
BRAND_OS_SUPABASE_URL              # rsoeybrftefubupwbdvn
BRAND_OS_SUPABASE_SERVICE_ROLE     # for sync-brand-os
```

### 8.3 Branch + Deploy 紀律（學自 Brand OS）

- **絕不 push main 不開 branch**
- 每個 feature 開 `feat/xxx` branch → Vercel preview → 測過再 merge
- Schema migration 用 `supabase migration new` 命名（不要 raw SQL）
- DDL 後跑 `get_advisors`（檢查 RLS / search_path）

---

## 9. AI 整合 Pattern

### 9.1 Edge function pattern

```typescript
// supabase/functions/generate-strategy-draft/index.ts
import { callClaudeWithTool } from "../_shared/anthropic.ts";
import { buildContext } from "../_shared/context-builder.ts";

serve(async (req) => {
  const { company_id, mode } = await req.json();

  const context = await buildContext(company_id, "strategy");

  const result = await callClaudeWithTool({
    model: mode === "lite" ? "claude-haiku-4-5" : "claude-sonnet-4-6",
    system: STRATEGY_SYSTEM_PROMPT + "\n\n## 學員的公司現況\n" + context,
    user: "...",
    toolName: "draft_strategy",
    toolSchema: STRATEGY_SCHEMA,
  });

  // 寫入 module_data
  await supabase.from("module_data").upsert({
    company_id,
    module_type: "strategy",
    payload: result,
    ai_input: { context_snapshot: context, mode },
    ai_output: result,
    status: "draft",
  });

  // 寫 module_data_links
  await recordCrossModuleLinks(...);

  return new Response(JSON.stringify(result), { headers: corsHeaders });
});
```

### 9.2 Model 選擇

| 用途 | Model | 為什麼 |
|---|---|---|
| 一般快速生成（影響力密碼計分總結、能力摘要） | Claude Haiku 4.5 | 快、便宜 |
| 深度推理（戰略全 7 模組起草、跨模組整合） | Claude Sonnet 4.6 | 推理品質夠 |
| Coach 蘇格拉底追問（Strategos 模式） | Claude Sonnet 4.6 | 對話品質 |
| 圖像（品牌頭像，Phase 1.5+） | Gemini 2.5 flash image | Brand OS 已驗證（free tier 會 throttle） |

---

## 10. Future-Proofing Hooks（為 Phase 2/3 留的勾子）

### 10.1 API-first

每個 module 的 CRUD 都透過 edge function 或 RLS-protected query。
Phase 2 知識網站要讀資料時 → 開 read-only edge function 即可，不用改前端。

### 10.2 Entitlement Check

每個模組進入點檢查 `student_module_access` 是否 enabled：

```typescript
// modules/_shared/check-access.ts
export async function checkModuleAccess(studentId, workspaceId, moduleType) {
  const { data } = await supabase
    .from('student_module_access')
    .select('is_enabled, expires_at')
    .eq('student_id', studentId)
    .eq('workspace_id', workspaceId)
    .eq('module_type', moduleType)
    .single();

  if (!data?.is_enabled) return { allowed: false, reason: 'not_enrolled' };
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { allowed: false, reason: 'expired' };
  }
  return { allowed: true };
}
```

Phase 3 EC 接 Stripe webhook → 寫入 `student_module_access` source='purchase'，自動開通。

### 10.3 Content Visibility

`module_data.payload` 不直接公開。Phase 2 增加 `content_items` 表，Coach 把學員作品策展成公開內容（可去識別化）。

### 10.4 Multi-tenant DNS（Phase 3+）

`workspace.slug` → 未來支援子網域：`{slug}.360bizthinker.com`。
DB 已有 slug 欄位，前端只需加 middleware 解析子網域。

---

## 11. Observability & Ops

- **錯誤追蹤**：Sentry（Phase 1.5 加，先用 console.error）
- **AI 用量監控**：每次 edge function 呼叫記錄 token 數到 `ai_usage` 表（Phase 1 簡單版）
- **效能**：Vercel Analytics（內建免費）
- **DB 進階建議**：每次 migration 後跑 Supabase advisors

---

## 12. 開放問題

- [ ] 自有 domain 何時申請？建議 Phase 1 上線前抓 `360bizthinker.com` 或類似
- [ ] 顧問之間能否互看？Phase 1 設定每個 workspace 互相隔離
- [ ] AI 成本控制？Phase 1 月花預估 $30-100 USD（10 人 × 6 模組 × 平均 5 次生成）。建議裝月度預算警報
