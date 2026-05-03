# 04 — Phase 1 Detailed Plan（每週工作分解，任務級）

> Status: Draft v0.1
> 8 週 + W0 規劃週 = 9 週總計
> 每週週末必須有可 demo 的東西（學自 Brand OS 教訓：不要憋兩週沒產出）

---

## 全期里程碑

| 週 | 主題 | 對外可說的成果 | 風險等級 |
|---|---|---|---|
| W0 | 規劃定稿 | 5 份文件 + ADR 拍板 | 🟢 低 |
| W1 | 中台骨幹 | 顧問可登入空 dashboard | 🟢 低 |
| W2 | 學員管理 + 權限 | 顧問可開帳號、學員登入看模組殼 | 🟡 中 |
| W3 | 模組 1：影響力密碼 | 學員填問卷、看 5 力雷達 | 🟡 中 |
| W4 | 模組 2：能力評分 | 學員可開評分週期 | 🔴 高 |
| W5 | 模組 3：人脈管理 | 學員可建聯絡人 | 🟡 中 |
| W6 | 模組 4：銷售大師 | 學員可建 pipeline | 🔴 高 |
| W7 | 模組 5：戰略 + Brand OS bridge | 戰略吃跨模組 context | 🔴 高 |
| W8 | 整合 + 顧問後台 + Beta | 第一批 5 學員實測 | 🟡 中 |

---

## W0 — 規劃週（這週）

**目標**：把所有規劃文件、Supabase 專案、空 repo 都備好，下週直接寫 code。

### 任務

- [ ] **T0.1** 5 份文件完工（00-master / 01-PRD / 02-data-model / 03-architecture / 04-phase1 / 05-risks）— 已進行中
- [ ] **T0.2** 7 個 ADR 拍板 ✅
- [ ] **T0.3** 建新 Supabase 專案（Tokyo region）
  - 命名：`360bizthinker` 或 `course-platform`
  - 取得 project_ref + service role key
  - 寫入 `.env.local`
- [ ] **T0.4** 寫 `migrations/0001_init.sql`（workspaces / cohorts / students / companies / module_data + RLS）
- [ ] **T0.5** 360bizthinker repo 初始化
  - `npm create vite@latest -- --template react-ts`
  - 裝 Tailwind / shadcn / supabase-js / TanStack Query / Zustand / react-router
  - 設定 `.env.local` + Vercel 部署
- [ ] **T0.6** 第一個 commit + 推 main + 確認 Vercel 自動部署成功（顯示 Vite default page）
- [x] **T0.7** Domain 決策：Phase 1 用 `360bizthinker.vercel.app`，W7-W8 上線前考慮抓 `360bizthinker.com`

**交付**：
- 5 份文件
- 空 Vite 專案部署在 360bizthinker.vercel.app
- Supabase 專案有 6 張 core tables + RLS
- README.md 寫清楚怎麼接手

**測試**：clone repo → `npm install` → `npm run dev` 能跑起來。

---

## W1 — 中台骨幹

**目標**：顧問可以登入並看到（空的）dashboard。

### 任務

- [ ] **T1.1** Auth 設定
  - Google OAuth（顧問用，限 admin email）
  - Magic link（學員用）
  - 寫 `RequireAuth` HOC + `useSession` hook
- [ ] **T1.2** Workspace bootstrap
  - 第一次顧問登入 → 自動建 workspace + admin member
  - 寫 edge function `bootstrap-workspace`
- [ ] **T1.3** Layout shell
  - Sidebar（學員模式 / 顧問模式自動切換）
  - Top nav（用戶頭像 + workspace 切換 dropdown）
  - 路由 placeholder：`/home`、`/admin`、`/companies/:id`
- [ ] **T1.4** Dashboard 空殼
  - 顧問版：cohort 列表（空）+ 「+ 開新 cohort」按鈕
  - 學員版：「歡迎，請先建立第一間公司」CTA
- [ ] **T1.5** 部署 + smoke test：登入 → 看到 dashboard

**交付**：可登入空殼網站，顧問與學員看到不同首頁。

**Demo**：錄一段 30 秒影片給自己看。

**風險**：Auth flow 卡死（Google OAuth 設定坑多）。**Mitigation**：先做 magic link 兜底，OAuth 卡 1 小時就先擱置。

---

## W2 — 學員管理 + 權限

**目標**：顧問可以開課程班、邀學員、設模組權限；學員可登入看到（空的）模組卡片。

### 任務

- [ ] **T2.1** Cohort CRUD
  - `/admin/cohorts` 列表頁
  - 建/編/刪 cohort（含 invite_code 自動生成）
- [ ] **T2.2** Student invite
  - 顧問填學員 email 列表 + 選 cohort + 選預設模組
  - 呼叫 `invite-students` edge function（建 auth.user + workspace_member + cohort_student + student_module_access × N）
  - 寄 magic link 給學員
- [ ] **T2.3** 學員 onboarding
  - 第一次登入 → 強制建第一間 company
  - `/companies/new` 表單（name / industry / size_band）
- [ ] **T2.4** 學員 home
  - 列出 student 自己的 companies
  - 點公司進 `/companies/:id` → 顯示模組卡片（已開通/未開通）
  - 模組卡片狀態：未開始 / 進行中 / 已完成
- [ ] **T2.5** 顧問端：學員列表 + 模組權限調整
  - `/admin/students` 列表
  - `/admin/students/:id` 詳情（看其所有 companies + 模組產出狀態）
  - 模組權限切換 toggle

**交付**：
- 顧問可開 cohort、邀 5 個假學員、調權限
- 學員可登入看到模組卡片（點進去是空殼，留 "Coming W3"）

**測試**：
- 開兩個瀏覽器 incognito，學員 A 看不到學員 B 的公司（RLS 驗證）
- 用 Supabase MCP 跑 `get_advisors` 沒 critical 警告

---

## W3 — 模組 1：影響力密碼問卷

**目標**：學員可填完 60 題問卷、看到 5 力雷達 + 12 挑戰排名。

### 任務

- [ ] **T3.1** Schema
  - `assessment_questions` reference table（題庫，60 題）
  - `assessment_challenges` reference table（12 挑戰）
  - module_data payload 用 `assessment` schema（見 02-data-model §6.1）
- [ ] **T3.2** Seed 題庫（從 影響力密碼 worktree 的 seed.sql 移植）
- [ ] **T3.3** 答題 UI
  - 分 5 個 section（策略 / 品牌 / 營運 / 銷售 / 管理）
  - 每題 1-5 分 + optional 留言
  - 進度條 + 自動存草稿（localStorage）
- [ ] **T3.4** 提交 + 計分
  - edge function `generate-assessment-report`
    - 算 5 力分數（per section avg）
    - 算 12 挑戰加權排名
    - AI 產 3 段觀察文字（Claude Haiku，<5s）
  - 寫入 module_data
- [ ] **T3.5** 結果頁
  - 雷達圖（recharts）
  - 12 挑戰排名表
  - AI 觀察文字
  - 「重新作答」按鈕
- [ ] **T3.6** 整合到 home：完成後狀態變「已完成」

**交付**：學員可從建公司 → 填問卷 → 看到雷達 + 排名，全程約 10-15 分鐘。

**Demo**：自己填一份試試看。

**風險**：
- 影響力密碼 worktree 的 schema 還沒最終敲定 → 我們用我們的版本（02-data-model §6.1），不依賴其 schema
- 60 題輸入 UX 卡頓 → 用 react-hook-form + 分頁（每頁 12 題）

---

## W4 — 模組 2：能力評分（最複雜的搬移）

**目標**：學員可建組織結構、開評分週期、看九宮格。

### 任務

- [ ] **T4.1** Payload schema 確定（02-data-model §6.2）
- [ ] **T4.2** 通用化 ML_能力評分
  - 拿掉「苗林」專屬：去掉特定部門 seed、去掉 job_title 限制
  - 變成「學員自己建組織樹」
- [ ] **T4.3** 組織管理 UI
  - 部門 / 子部門樹狀
  - 員工 CRUD（姓名、職級、所屬部門）
- [ ] **T4.4** 評分週期
  - 開週期（半年制 / 季制 / 自訂）
  - 三階段：自評 → 他評 → 共識
  - 學員端：自己幫員工打分（學員是 boss 視角，員工不需要登入）
  - **簡化**：Phase 1 先只做「老闆視角」打所有人，不做雙向評分（學自 ML 教訓）
- [ ] **T4.5** 九宮格
  - X 軸：專業能力 + 領導能力 平均
  - Y 軸：核心職能 平均
  - 點擊員工跳到詳情
- [ ] **T4.6** AI 摘要（optional）
  - edge function `generate-capability-summary`
  - 給組織健診觀察 + 高低差距點

**交付**：學員可建 10 人組織、打分、看九宮格分布。

**風險**：
- 🔴 通用化 ML_能力評分系統工程量比預估大 → **Mitigation**：W4 就只做最簡版（老闆視角 + 九宮格），雙向評分留 Phase 1.5
- 🔴 ML 原系統有 12 表複雜結構，硬搬會 over-engineering → **Mitigation**：直接重設計 payload schema，不搬原 schema

---

## W5 — 模組 3：人脈管理

**目標**：從 Python 重寫成 React + Supabase。學員可建聯絡人、公司、標籤。

### 任務

- [ ] **T5.1** Payload schema（02-data-model §6.3）
- [ ] **T5.2** 聯絡人 CRUD
  - 姓名、Email、電話、職稱、公司
  - 標籤（多選，自動完成）
  - 多重身分（一人多公司角色）
- [ ] **T5.3** 公司 CRUD（注意：這是聯絡人的「外部公司」，不同於核心 `companies` 表）
- [ ] **T5.4** 全文搜尋
  - 用 Supabase 的 PostgreSQL fts
  - 搜聯絡人 / 公司 / 標籤
- [ ] **T5.5** 列表頁 + 卡片頁

**Phase 1 不做**：CSV 匯入、名片 OCR、關係圖視覺化、編輯歷史 audit

**交付**：學員可建 50 個聯絡人、5 家公司、用標籤篩選。

**風險**：
- forfunfun Python 邏輯不直接搬，需重寫 → **Mitigation**：實際工程比想像簡單（CRUD 為主），1 週夠用
- 若 OCR / CSV 匯入是學員必備需求，會壓縮 W6 → **Mitigation**：嚴守 Phase 1 範圍

---

## W6 — 模組 4：銷售大師（從零通用版）

**目標**：學員可建業務 pipeline、自定 stage、記錄拜訪、算抽成。

### 任務

- [ ] **T6.1** Payload schema（02-data-model §6.4）
- [ ] **T6.2** Pipeline stage 設定
  - 預設 5 個 stage（新名單 / 接觸中 / 提案中 / 成交 / 流失）
  - 學員可自定（加減 stage、改顏色）
- [ ] **T6.3** Client（業務客戶）CRUD
  - 注意：與聯絡人模組的「公司」概念連通（可從聯絡人中選擇）
  - Stage 標籤、預估金額、實際金額、抽成率
- [ ] **T6.4** Visit log
  - 客戶 + 日期 + 進展摘要 + 下一步
  - 列表 / 行事曆兩種視圖（行事曆延後）
- [ ] **T6.5** Dashboard
  - 本月新案、推進中、成交、流失（4 個數字）
  - 抽成計算（簡單版：成交金額總和 × 抽成率）

**Phase 1 不做**：地圖 / 路線、行事曆整合、AI 建議下一步、成就系統、離線模式

**交付**：學員可開 10 個案子、走 stage、記 5 次拜訪、看抽成。

**風險**：
- 🔴 從零通用化設計 1 週做不完 → **Mitigation**：超過 80% 完成度即可結案，剩餘進 W8 buffer
- 🔴 「自定 stage」UX 複雜 → **Mitigation**：先用預設 5 個 stage，自定功能延到 Phase 1.5

---

## W7 — 模組 5：戰略 + Brand OS bridge

**目標**：戰略模組 AI 吃跨模組 context，學員首次體驗「整合的價值」。

### 任務

- [ ] **T7.1** Payload schema（02-data-model §6.6）
- [ ] **T7.2** Strategos 移植
  - 把 strategos repo 的 7 模組（願景 / 護城河 / 環境 / 戰略-戰術-戰技 / 一頁戰略書 / 行動 / KPI）UI 整套搬進 `modules/strategy/`
  - 重接 Supabase（從 strategos 那個專案的 schema 改寫成 module_data 結構）
- [ ] **T7.3** Context Builder edge function
  - 輸入 company_id + target_module='strategy'
  - 拼接該公司所有 module_data 為結構化字串
  - 回傳給 frontend
- [ ] **T7.4** AI 整合
  - `generate-strategy-draft` edge function
  - 把 context 塞進 system prompt
  - 蘇格拉底追問模式（Strategos 既有 pattern）
- [ ] **T7.5** Cross-module link 寫入
  - 寫 module_data_links（誰引用誰）
  - UI 顯示「本戰略引用了你的影響力密碼結果（2026-XX 版）」
- [ ] **T7.6** Brand OS bridge（簡化版）
  - 寫 `sync-brand-os` edge function
  - 學員手動點「同步 Brand OS 資料」按鈕（不做 cron，太工程）
  - 拉一次寫入 module_data (brand_os)
  - SSO 跳轉延後到 Phase 1.5

**交付**：
- 學員填完 W3+W4+W5（或部分），進戰略模組
- AI 起草的戰略**自動引用**前面模組的弱點 → 截圖 demo

**風險**：
- 🔴 Strategos 整套搬 1 週做不完 → **Mitigation**：先搬「願景 + 環境 + 一頁戰略書」3 個關鍵模組，其他延 Phase 1.5
- 🔴 Brand OS bridge 比預期複雜 → **Mitigation**：先做手動同步按鈕，cron 延後

---

## W8 — 整合 + 顧問後台 + Beta 上線

**目標**：W1-W7 的功能整合測試，顧問後台補齊，邀請第一批學員實測。

### 任務

- [ ] **T8.1** 顧問後台補齊
  - 學員進度總覽 dashboard（哪個學員卡哪個模組）
  - 每個模組產出可預覽（不是編輯）
  - 學員「課程結束」按鈕（鎖定資料）
- [ ] **T8.2** 整合 bug fix
  - 從 W1-W7 累積的 issue 清單一個個處理
  - 至少跑兩遍 end-to-end 流程（自己當學員 + 找一個朋友當學員）
- [ ] **T8.3** 跨模組 stale flag
  - module_data updated_at > 後續模組 updated_at → 顯示「上游有更新」
- [ ] **T8.4** UI polish
  - 空狀態（empty state）每個都要友善
  - Loading state 統一
  - 錯誤訊息不能露 stack trace
- [ ] **T8.5** Onboarding tour（optional）
  - 第一次登入跑 Pendo / Driver.js 的 tour
  - 介紹 5 個關鍵模組
- [ ] **T8.6** Beta 邀請
  - **第一批 = MX (MiracleX) 內部上過課的學生**（kuoyo 自己選 5 位）
  - 開 cohort（命名建議「MX 第一期 Beta」）
  - 寄邀請信、安排一場 1 小時 onboarding 視訊
- [ ] **T8.7** 收 NPS + 改進清單
  - Google form 4 題：易用性 / 價值感 / 推薦意願 / 最想要的下一個功能
  - 整理進 Phase 1.5 todo

**交付**：
- 5 位學員上線使用
- NPS 表單收齊
- Phase 1.5 / Phase 2 backlog 寫好

---

## Buffer 規則（學自 Brand OS）

每週的最後一天（週日）是 buffer：

- 沒進度落後 → 做 nice-to-have
- 進度落後 1 天內 → 用 buffer 補
- 進度落後 1 天以上 → **必須砍範圍**，不能延期吃到下週

每週五晚跑「retro」：
- 這週砍了什麼
- 下週要砍什麼
- 紀錄在 `RETRO.md`

---

## Risk-Adjusted 預估

如果照表跑：8 週能上線 5 模組 + 戰略整合。
如果遇到 2 個 🔴 風險爆雷：8 週上線 4 模組（最先砍：銷售大師通用版 → 用 bettermilk-attack 客製版頂著）。
**Worst case 必須保住的**：問卷 + 任 1 個能力模組 + 戰略 + 顧問後台 = MVP。

---

## W0 立即下一步

1. 你看完 5 份文件給回饋（修哪幾段）
2. 我建 Supabase 專案（給我綠燈即可）
3. 我寫 `0001_init.sql`
4. 我建 360bizthinker 空 Vite 專案
5. 推上 main，Vercel 部署，確認 default page 顯示
6. W1 開始

**最快今晚 / 最慢明天可以走完 W0 的 T0.3-T0.6**。
