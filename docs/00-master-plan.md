# 課程顧問中台 SaaS — Master Plan

> Status: **Draft v0.1 · 等待 7 個 ADR 拍板**
> Author: kuoyo + Claude
> Date: 2026-05-03

---

## 1. Restated Requirements（你要的東西，我重述一次）

**核心**：把過去獨立做的 6 個課程工具整合成一個統一的付費中台 SaaS，學員從問卷診斷開始，沿著「報告 → 分模組能力提升 → 跨模組策略」一條鏈走完。

**功能要求**：
- ✅ 學員 self-signup + 顧問後台給權限（每個學員可看哪些模組）
- ✅ 模組間資料互通互加值（前一模組產出餵後一模組 AI prompt）
- ✅ 顧問可開無限期帳號、課程式批次開帳號、分群管理

**未來保留（規劃納入，Phase 1 不蓋）**：
- 知識網站（公開、SEO、引流）
- EC 商店（單模組買、會員訂閱）
- 整個 SaaS 可賣掉（multi-tenant、品牌可換）

**禁區（明確不做）**：
- Phase 1 不做 EC、不做 Stripe、不做公開頁
- 不重做 Brand OS（KOI 學員仍在 production，不能斷）
- 苗林內部工具（OKR / talent-core）不在範圍

---

## 2. Module Map（中台會接的 6 個模組）

| # | 模組 | 角色 | 現有 codebase | 整併動作 |
|---|---|---|---|---|
| 1 | MX_影響力密碼 | **入口**：5 力雷達 + 12 挑戰排名 + PDF 報告 | `~/.claude/worktrees/practical-mendel-02b72a/`（Next.js, 建置中） | 待 ADR-06 決定 |
| 2 | ML_能力評分系統 | 營運力：360 雙向評分 + 九宮格 | `~/Documents/GitHub/miaolin-evaluation/`（已 production） | Schema 移植到中台 + 通用化（拿掉苗林專屬欄位） |
| 3 | PS_人脈管理 | 銷售力：聯絡人 / 公司 / 關係網 | `~/forfunfun/`（Python/Flask, SQLite） | 待 ADR-02 決定（重寫 vs SSO） |
| 4 | MX_銷售大師 | 銷售力：業務 pipeline + 拜訪 + 抽成（**通用版需從零設計**） | 無（bettermilk-attack 是鮮乳坊客製，僅參考） | 從零設計 |
| 5 | MX_品牌大師（Brand OS） | 品牌力：金字塔 + Soul + 同理心地圖 | `~/consumer-insight-map/`（已 production, KOI 在用） | **不動 production**，新中台讀取它的資料；未來再考慮整併 |
| 6 | 360 戰略建議（Strategos） | 跨模組：5 年戰略 + 一頁戰略書 | `~/strategos/`（已 production） | Schema 移植到中台（保留 `module_data` 通用表 pattern） |

**模組依賴關係圖**：

```
                    ┌─→ 營運力 (#2) ─┐
問卷診斷 (#1)  ─→  ├─→ 銷售力 (#3+#4) ┼─→ 360戰略 (#6)
   ↓ 報告           ├─→ 品牌力 (#5) ─┘     ↑
   └─────────────  └─→（產品力，學員自理）   └─ 任何時點皆可進入
```

---

## 3. 🔴 需要你拍板的 7 個 ADR（最重要）

> 規則：每個 ADR 我給 2-3 個選項 + 我的推薦 + 一句理由。你回「ADR-01: A」這種就好，不用解釋。

---

### ADR-01：技術棧統一策略

問題：目前有 5 個 React/Vite + 1 個 Next.js + 1 個 Python。要統一到哪個？

| 選項 | 優點 | 代價 |
|---|---|---|
| **A. 全部 Vite + React + TS**（5/6 已是這個） | 最少重寫，Brand OS / Strategos / ML_能力評分都能直接搬 | Next.js 影響力密碼要重寫前端（後端 Supabase 不變）；無 SSR → SEO Phase 2 要另外處理 |
| B. 全部 Next.js | SEO / 公開頁原生支援，未來知識網站直接做 | 5 個 React/Vite 專案要重寫成 Next.js，等於砍掉重練 |
| C. 混合（中台 shell 用 Next.js，模組保留 Vite + iframe / micro-frontend） | 不重寫 | 工程複雜度爆炸，跨模組資料流被 iframe 隔開 |

**我推薦 A**。理由：保留 Brand OS / Strategos / 能力評分大部分程式，影響力密碼還在建置可以調整方向。SEO 留到 Phase 2 用獨立的 SSG 站做。

---

### ADR-02：forfunfun（PS_人脈）整合策略

問題：它是 Python/Flask + SQLite，整個技術棧異類。

| 選項 | 優點 | 代價 |
|---|---|---|
| **A. 重寫成 React + Supabase** | 中台統一棧，資料模型可對齊其他模組 | 2-3 週工程 |
| B. 保留 Python，做 SSO + iframe 嵌入 | 不重寫 | 資料流不通、UX 割裂、未來 EC 賣不出去這個模組 |
| C. 暫不整合，Phase 1 先放著 | 省工 | 中台少一個模組，銷售力只剩 #4 |

**我推薦 A**。理由：你想要「資料互相加值」，forfunfun 的「公司 / 聯絡人」實體是 #4 銷售大師的基礎，不通就斷鏈。

---

### ADR-03：Tenant 模型（Multi-tenant 怎麼長）

問題：未來要可賣給其他顧問用。Tenant 切多細？

| 選項 | 範例 |
|---|---|
| A. **顧問 = tenant**（我推薦） | 我是 tenant 1，未來其他顧問是 tenant 2、3。每個顧問下面有自己的學員。 |
| B. 學員所屬公司 = tenant | 太細，每個學員一個公司 → 上萬 tenant，過度工程 |
| C. 不分 tenant，全部共用 | 賣不掉，無法 SaaS 化 |

**我推薦 A**：每張表加 `workspace_id`（顧問層），顧問下面有 `cohorts`（課程班）和 `students`（學員）。學員填的「公司資料」是欄位，不是 tenant。

---

### ADR-04：中台 shell（新站還是擴充某一個現成站？）

問題：6 個模組要進來的「殼站」從哪來？

| 選項 | 優點 | 代價 |
|---|---|---|
| **A. 新建 dotdotwiki**（這個 repo） | 乾淨，可從零設計 multi-tenant + entitlement，不背歷史包袱 | 要寫 shell（auth / dashboard / module registry / nav）約 1-1.5 週 |
| B. 擴充 Brand OS（consumer-insight-map） | 已有 auth + admin + RLS pattern，省 1 週 | KOI 學員在用，動到根結構風險高 |
| C. 擴充 Strategos | Schema 最乾淨（cohorts/students/module_data 已是中台 pattern） | 但 UI 是專為「戰略」設計的學術風，不適合當總入口 |

**我推薦 A**。理由：dotdotwiki 是空的、命名也對（wiki = 知識庫，符合未來知識網站方向）；可以借 Strategos 的資料模型 pattern + 借 Brand OS 的 auth/RLS pattern，不用從零想。

---

### ADR-05：核心實體命名統一（影響整個 schema）

問題：6 個模組對「研究主體」叫法都不同：
- 影響力密碼：`clients`（顧問的客戶公司）
- 能力評分：`employees`（員工）
- bettermilk：`bm_clients`（業務客戶）
- Brand OS：`brands`（學員的品牌）
- Strategos：`students` 直接持有 canvas，沒有獨立主體

要統一成什麼？

| 選項 | 涵義 |
|---|---|
| **A. `companies`（學員研究的公司主體）+ `students`（人）** | 公司是主角，學員可在多個公司之間切換 |
| B. `entities`（萬用） | 太抽象 |
| C. 各模組保留各的命名 | 不統一，無法跨模組查 |

**我推薦 A**。理由：你的學員多半是中小企業主或顧問，研究主體就是「他自己的公司」或「他客戶的公司」。`companies` + 每個模組產出掛在 `company_id` 上是最直觀的。Brand OS 的 `brands` 改名 → `companies`（migration 寫好就行）。

---

### ADR-06：MX_影響力密碼 — 繼續它的 Next.js 還是改成 Vite 進中台？

問題：它還在 Phase 1 建置中（worktree 裡），如果統一到 Vite (ADR-01)，現在就要改方向。

| 選項 | 優點 | 代價 |
|---|---|---|
| **A. 把它的 schema 拉進中台，前端在 dotdotwiki shell 裡用 Vite 重寫**（推薦） | 統一棧、減少未來合併痛苦 | 影響力密碼前端歸零（但它本來才剛開始） |
| B. 影響力密碼維持 Next.js 獨立站，shell 用 SSO 串它 | 它可以平行開發 | 兩套前端、兩套部署、長期維護惡夢 |

**我推薦 A**。理由：它都還沒寫多少前端，越早併越省。Schema (12 tables) 是價值，可以直接搬。

---

### ADR-07：部署 / Hosting

問題：6 個模組目前散在 4 個 Vercel 專案 + 4 個 Supabase 專案。新中台怎麼部？

| 選項 | 內容 |
|---|---|
| **A. 一個新 Supabase（Tokyo）+ 一個新 Vercel（dotdotwiki）**（推薦） | 全新乾淨，schema 從 ADR-05 設計開始 |
| B. 沿用 Brand OS 的 Supabase 擴充 | Brand OS 在 production，schema 動刀風險 |
| C. 沿用 Strategos 的 Supabase 擴充 | 同上，且 Strategos 已有 7 模組 schema 比較複雜 |

**我推薦 A**。理由：乾淨。原 4 個專案保留不動，等 Phase 1 中台跑起來，再做資料遷移。

---

## 4. Unified Data Model（草稿，等 ADR 拍板才細化）

**共用實體骨幹**（只列 Phase 1 需要的）：

```
workspaces            (顧問 tenant)
  └─ cohorts          (課程班 / 期別)
       └─ students    (學員 ≈ auth.users 的延伸 profile)
            └─ companies  (學員研究的公司主體)
                 └─ module_data  (各模組產出，通用 JSONB)
                      模組類型：assessment / capability_eval / contact_network / sales_pipeline / brand / strategy

users                 (auth.users，全平台共用)
roles                 (workspace_admin / coach / student / public_reader)
entitlements          (誰能看哪些模組 — 預留 EC 用)
products              (預留 EC 用，Phase 1 空表)
subscriptions         (預留 EC 用，Phase 1 空表)
content_items         (學員產出的 visibility flag — 預留知識網站用)
```

**關鍵設計**：所有模組產出走 `module_data` 表（學自 Strategos）+ JSONB content + `module_type` 欄位。新增模組 = 新增一個 `module_type`，不用建新 table。

> 細節（每張表欄位 / 每個模組對應的 JSONB schema）等 ADR 拍板後寫進 `02-data-model.md`。

---

## 5. Phase 1 工作分解（6-8 週草案）

| 週 | 主題 | 可交付（學員可摸到的東西） |
|---|---|---|
| **W0**（這週）| 規劃定稿 | 7 ADR 拍板、5 份文件完工 |
| **W1** | 中台骨幹：auth + workspace + dashboard shell + nav | 顧問可登入、可看到空 dashboard |
| **W2** | 學員管理 + 權限矩陣 + 模組註冊機制 | 顧問可開學員帳號、批次開、設模組權限；學員可登入看自己有的模組（空殼） |
| **W3** | 模組 1：影響力密碼問卷（前端 Vite + 移植 schema） | 學員可填問卷、看自己的 5 力報告 |
| **W4** | 模組 2：能力評分（前端移植 + 通用化） | 學員可在自己公司開評分週期 |
| **W5** | 模組 3：人脈管理（重寫成 React + Supabase） | 學員可建聯絡人 / 公司 / 關係 |
| **W6** | 模組 4：銷售大師（從零設計通用版） | 學員可建業務 pipeline、自定 stage |
| **W7** | 模組 5：策略（Strategos 移植 + 接入跨模組 context） | 學員可開戰略 canvas，AI 拿前面所有模組產出當 context |
| **W8** | 跨模組資料流 + 顧問後台總覽 + Beta 上線 | 顧問可看全學員進度，第一批學員實測 |

**MX_品牌大師（Brand OS）暫不動**：保留在獨立 production，學員透過中台 SSO 跳轉過去用。Phase 2 再考慮搬。

---

## 6. 風險清單

| # | 風險 | 嚴重度 | 緩解 |
|---|---|---|---|
| R1 | 8 週做 6 模組整合會重蹈 Brand OS 死線壓力，又砍功能 | 🔴 高 | Phase 1 範圍嚴守「能用」即可；任何「nice to have」進 Phase 1.5 |
| R2 | 影響力密碼 schema 還沒最終敲定，移植可能被迫重做 | 🟡 中 | W0 先確認其 schema 已穩定，否則延後到 W4 |
| R3 | forfunfun 重寫低估，Python 邏輯（OCR 名片掃描、CSV 匯入）移植麻煩 | 🟡 中 | W5 先做核心 CRUD，OCR / 匯入留 Phase 1.5 |
| R4 | Brand OS 不動但要從中台「看資料」，跨 Supabase 讀取要設計清楚 | 🟡 中 | W2 確認方案：service role + edge function vs 資料定期同步到中台 |
| R5 | 通用版銷售大師 1 週做不完（從零設計 + 通用化抽象） | 🔴 高 | W6 抓最 MVP（pipeline + stage + 客戶 + 簡單 commission），其他延後 |
| R6 | Multi-tenant RLS policy 寫錯 → 學員看到別人資料 | 🔴 高 | 用 Brand OS 已驗證的 RLS pattern + 每個 migration 跑 `get_advisors` |
| R7 | 「未來保留條款」（entitlement / content visibility）寫了但 Phase 1 沒驗證，Phase 2 上 EC 才發現要重做 | 🟡 中 | W2 寫一個假的「Pro 學員 vs Free 學員」測試 entitlement gate |

---

## 7. 取捨清單（我建議 Phase 1 砍掉的）

- ❌ EC、Stripe、付費（Phase 3）
- ❌ 公開知識網站、SEO（Phase 2）
- ❌ Brand OS 整併進中台（W8 後評估，可能永遠不併，保持 SSO 跳轉）
- ❌ 影響力密碼的 PDF 報告（Phase 1.5 — 學員先用網頁版，PDF 另做）
- ❌ 名片 OCR、CSV 匯入（Phase 1.5）
- ❌ 模組版本歷史（學自 Brand OS 教訓 — 永遠最新版，需要時補）

---

## 8. ✅ 我需要你做什麼

請逐項回覆 7 個 ADR 的選擇（A / B / C），格式像：

```
ADR-01: A
ADR-02: A
ADR-03: A
ADR-04: A
ADR-05: A
ADR-06: A
ADR-07: A
```

如果都同意我的推薦，回 **「全部 A，繼續」** 即可。

如果有要改的，標出來：
```
ADR-02: B  原因：forfunfun 的 OCR 我不想重寫
ADR-04: B  原因：想沿用 Brand OS
其餘照推薦
```

ADR 拍板後我會：
1. 寫 `01-PRD.md`（含學員旅程細節 + 權限矩陣）
2. 寫 `02-data-model.md`（每張表欄位 + 每模組 module_data JSONB schema）
3. 寫 `03-architecture.md`（系統圖 + 部署 + API 設計）
4. 寫 `04-phase1-detailed.md`（每週工作項細到任務級）
5. 寫 `05-risks-tradeoffs.md`（取捨理由 + 觸發後 plan B）

**不會寫一行 code。**
