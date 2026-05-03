# 05 — Risks & Tradeoffs（風險與取捨）

> Status: Draft v0.1
> 每個風險寫：trigger（什麼訊號代表它發生了）+ Plan B（爆雷怎麼辦）

---

## 1. 紅色風險（會炸專案的）

### R1 — 8 週做完 6 模組的範圍壓力

**Trigger 訊號**：
- W4 結束時還沒完成能力評分核心流程
- 連續兩週週五 retro 顯示「砍範圍」
- 某個模組的 todo 清單比上週還長

**Plan B（必須砍範圍）**：
1. **第一輪砍**：模組功能砍到 60%（核心流程通即可，UX polish 留 Phase 1.5）
2. **第二輪砍**：銷售大師用 bettermilk-attack 客製版頂著（不做通用化）
3. **第三輪砍**：人脈管理延 Phase 1.5（學員先用其他工具，顧問批改時跨開）
4. **保底 MVP**：問卷 + 1 個能力模組 + 戰略 + 顧問後台

**Owner**：每週五 retro 由 kuoyo + Claude 共同決定砍哪個。

---

### R2 — 通用版銷售大師從零設計超時

**Trigger 訊號**：
- W6 過半還在設計 stage 自定 UX
- bettermilk-attack 的客製邏輯抽不乾淨

**Plan B**：
1. Phase 1 直接 fork bettermilk-attack 進 modules/sales/，留鮮乳坊預設 stage
2. 顧問可在 Coach 端 hardcode 改 stage（不做學員自定）
3. 通用化延 Phase 1.5

**Owner**：W6 週三 mid-checkpoint 決定。

---

### R3 — Multi-tenant RLS 寫錯，學員看到別人資料

**Trigger 訊號**：
- 任何時候有人回報「我看到不是我的資料」
- `get_advisors` 跑出 critical RLS 警告
- E2E 測試（兩個瀏覽器）發現資料洩漏

**Plan B**：
1. **立即**：把該表 RLS 改成 SELECT 全 deny，stop the bleed
2. 重寫 policy（用 02-data-model §9 的 pattern）
3. 寫 e2e regression test 防止再犯
4. 通知所有受影響學員

**預防**：
- 每張新表寫完必跑 `get_advisors`
- 每個 PR 必須附「兩個瀏覽器互看」的截圖證明
- 用 Brand OS 已驗證的 helper function `is_workspace_member()`

**Owner**：每個 schema migration 由 kuoyo 親自驗。

---

## 2. 黃色風險（會慢但不致命）

### R4 — Brand OS bridge 同步邏輯複雜

**Trigger 訊號**：
- W7 發現 Brand OS 的 schema 跟我預期不一致（記憶過期）
- 學員的 brand 對應到中台 company 對不上（同一個 brand name 在兩邊不同 ID）

**Plan B**：
1. Phase 1 不做自動 sync，學員手動點「同步」按鈕
2. UI 顯示「最後同步時間」
3. 同步失敗時降級顯示 "Brand OS 連結"，跳轉過去看
4. SSO 完全延後 Phase 1.5

**預防**：W6 結束前先 spike 一個 sync 函式，確認 Brand OS schema 沒變。

---

### R5 — 影響力密碼 worktree 那邊還在動

**Trigger 訊號**：
- 影響力密碼 schema 大改（你或別人推進其原始開發）
- 我們的 W3 移植版本 vs 原版兩邊不同步

**Plan B**：
- 影響力密碼 worktree 那邊**停工**（明確告知不再開發 standalone 版）
- 中台版才是 canonical 版
- 60 題題庫從 worktree 的 seed.sql 移植一次後不再 sync

**Owner**：W0 結束前 kuoyo 確認暫停 worktree 那邊的開發。

---

### R6 — AI 月度成本失控

**Trigger 訊號**：
- 月底 Anthropic dashboard 顯示 > $200 USD
- 某個 edge function 被學員亂試 1000 次

**Plan B**：
1. 加 rate limit：每個 student × 模組 × 天 最多 5 次 AI 生成
2. Sonnet → Haiku 降級（戰略起草改 Haiku）
3. 加 token budget 警報：每個 edge function 啟動時檢查當月用量

**預防**：W2 就建 `ai_usage` 表記每次呼叫，W6 時加 dashboard。

---

### R7 — 「未來保留條款」沒驗證

**Trigger 訊號**：
- Phase 2/3 開發時發現 entitlement / content / billing 邏輯要改
- Multi-tenant 跨 workspace 邏輯有 bug 但 Phase 1 沒人發現

**Plan B**：
- Phase 1 W2 就要用 entitlement gate 跑通一個假的「Pro vs Free」測試
- W2 寫 e2e test：開兩個 workspace（kuoyo + 假顧問 X），互相看不到對方資料
- W8 找 1 個技術朋友做 architecture review

---

## 3. 取捨決策清單（已砍的 + 為什麼）

### Phase 1 砍掉

| 砍掉的東西 | 為什麼 | 何時補 |
|---|---|---|
| EC、Stripe、付費 | 會吃掉 2 週工程，且 Phase 1 重點是驗證學員留得住 | Phase 3 |
| 公開知識網站 / SEO | 沒有內容前做網站是浪費 | Phase 2 |
| Brand OS 整併進中台 | KOI production 動不得，併進來 risk-reward 不划算 | 可能永遠不併 |
| PDF 報告（影響力密碼 14 頁版）| jsPDF 排版細節吃 1 週工 | Phase 1.5 |
| 名片 OCR、CSV 匯入 | 學員量小時手 key 即可 | Phase 1.5 |
| 模組版本歷史 | Brand OS 已驗證：永遠最新版可活 | 真有需求才補 |
| 銷售大師地圖 / 路線優化 | 過度工程 | 可能永遠不做 |
| 戰略進階 4 工具（情境 / pitch / town hall / 隱性假設） | Strategos Phase 11 的東西，Phase 1 不需要 | Phase 1.5 |
| 多語系（en）| KOI 那邊已有，中台 Phase 1 只做 zh-TW | Phase 2 |
| Mobile App / PWA | 響應式網頁夠用 | Phase 3 看需求 |
| 站內通知 | Email magic link 即可 | Phase 2 |
| 雙向員工評分（能力評分用） | UX 複雜，學員側只需 boss 視角 | Phase 1.5 |
| Cohort 凍結機制（OKR pattern） | 課程結束鎖定資料的需求 | Phase 1.5 |

### Phase 1 保留但「最簡版」

| 保留 | 簡化方式 |
|---|---|
| 跨模組 context | 字串拼接，不做 embedding / RAG |
| 顧問後台 | 列表 + 詳情，不做圖表 dashboard |
| 銷售大師 | 預設 5 stage，學員不能自定（顧問可改） |
| Brand OS bridge | 手動同步按鈕，不做 cron |
| 評分週期 | 老闆視角單向打分，不做雙向 + 共識 |
| Onboarding | 一個 modal 介紹 + 強制建第一間公司，不做 product tour |

---

## 4. Phase 2 / Phase 3 預覽（路線圖）

### Phase 2 — 知識網站（W9-W12）

**目標**：把學員產出（去識別）變成公開內容、SEO 引流。

主要工作：
- 增加 `content_items` 表的 UI 編輯介面
- 顧問可選某學員作品策展（去識別）→ 變公開頁
- 公開頁 SEO（用 Astro / Next.js 獨立 SSG 站？或 Vite + react-snap？）
- 部落格、案例研究、課程介紹頁
- Google Analytics + Search Console

技術選型：未定 — 可能 Astro（純 SSG）或 Next.js（SSR）。**Phase 2 開始前重新做架構決策**。

### Phase 3 — EC + 會員（W13-W18）

**目標**：付費購買單模組或會員訂閱。

主要工作：
- Stripe / 綠界整合（payment、webhook）
- `products` / `subscriptions` 表 UI
- Pricing page
- 付款後自動寫入 `student_module_access` source='purchase'
- 會員等級設計（Free / Pro / Premium）
- 退費 / 升降級邏輯
- 發票 / 收據

關鍵假設：Phase 1+2 跑完有真實學員 / 流量證明可變現，才動 Phase 3。

### Phase 4 — Sellable SaaS（W19+）

**目標**：可賣給其他顧問。

主要工作：
- Multi-tenant 強化（顧問 A 之間完全隔離 verify）
- White label（顧問可換 logo / 主色 / 文案）
- 子網域（`{slug}.dotdotwiki.com`）
- 自助開 workspace 流程
- SLA / 客服文件

---

## 5. Decision Log（重大決策紀錄）

| 日期 | 決策 | 為什麼 | 替代方案 |
|---|---|---|---|
| 2026-05-03 | ADR-01: 全部 Vite + React | 5/6 已是 | 全 Next.js 太貴 |
| 2026-05-03 | ADR-02: forfunfun 重寫 | 不重寫斷鏈 | SSO 嵌入 |
| 2026-05-03 | ADR-03: 顧問 = tenant | 未來可賣 | 不分 tenant |
| 2026-05-03 | ADR-04: 新建 dotdotwiki | 乾淨 | fork Brand OS |
| 2026-05-03 | ADR-05: companies + students | 直觀 | entities |
| 2026-05-03 | ADR-06: 影響力密碼改 Vite | 越早併越省 | 維持 Next.js |
| 2026-05-03 | ADR-07: 全新 Supabase Tokyo | 乾淨起點 | 沿用 Brand OS / Strategos |

未來新增的決策追加在這。

---

## 6. Open Questions（規劃中還沒答的）

> 這些不影響 W1 開工，但 W2-W8 期間要陸續答。

- [x] **Domain**：Phase 1 用 dotdotwiki.vercel.app；W7-W8 上線前抓 dotdotwiki.com
- [ ] 顧問 onboarding：未來其他顧問怎麼上來？Phase 1 只 kuoyo 自己用，schema 已支援。
- [ ] 學員邀請信文案：誰寫？（你寫 / 我幫你草）
- [x] **第一批 Beta 學員**：MX (MiracleX) 內部上過課的學生 5 位（kuoyo W8 前選定名字）
- [ ] AI Token 預算：每月多少上限？（建議 $100 USD 月警報）
- [ ] Backup 策略：Supabase 自動備份 OK 嗎？要不要每週手動 dump？
- [ ] 法務：個資 / 隱私政策需要嗎？Phase 1 只你自己用可能不需要，Phase 2 公開要。
- [ ] 顧問批改要不要計時 / 算費？（Phase 1.5 議題）

---

## 7. Reference Materials（參考資料）

### 學自 Brand OS（consumer-insight-map）的 pattern

- ✅ `is_admin()` SECURITY DEFINER pattern
- ✅ Course-based magic link login
- ✅ AI edge function locale 參數化
- ✅ STALE flag 跨模組
- ✅ Branch + Vercel preview 紀律
- ✅ shadcn + Tailwind UI

### 學自 Strategos 的 pattern

- ✅ `module_data` 通用表 + JSONB payload
- ✅ Cohort + invite_code 邀請碼模式
- ✅ 蘇格拉底式 AI prompt（Coach mode）
- ✅ rounded-none + 黑白學術 + accent 紅 設計（戰略模組沿用）

### 學自 ML_能力評分 的教訓

- ❌ 12 表 over-engineered → 中台用 module_data + JSONB
- ❌ 苗林專屬欄位太多 → 通用化
- ❌ 三階審核流程太複雜 → 簡化單向

### 學自 OKR 的教訓

- 三階層 + 凍結機制是好設計，但 Phase 1 不做（KISS）

---

## 8. Phase 1 失敗判定條件（什麼算「Phase 1 失敗」）

W8 結束時，**任一條符合 = Phase 1 失敗**：

- [ ] 沒有任何 1 個真實學員在使用
- [ ] 跨模組 context 沒做出來（戰略 AI 沒吃到前面模組的產出）
- [ ] RLS 有 critical bug 從沒修
- [ ] 顧問後台 dashboard 看不到學員進度
- [ ] 上線網站 uptime < 95%

失敗的話：W9-W10 暫停新功能，全部精力修上述。
