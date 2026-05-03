# 01 — PRD（產品需求文件）

> Status: Draft v0.1 · Phase 1 only
> 依據 7 個 ADR 已全部選 A

---

## 1. Product Vision

**一句話**：讓中小企業主和顧問用一條 AI 引導的鏈完成「健診 → 能力提升 → 戰略落地」，而不是學完一堆零散工具就忘了。

**為什麼存在**：
- kuoyo 過去 2 年累積 6 個課程工具，每一個都各自有人在用，但**學員上完一堂課回家就斷線**，工具之間資料不通、隔週就忘。
- 中台讓「填過的問卷、做過的評分、寫過的品牌金字塔」都留在學員的個人空間，下一個模組自動拿前面的成果當輸入。
- 顧問可以同時帶多期學員，後台一目了然每個人卡在哪。

**北極星指標（Phase 1 結束時要達成）**：
- 第一批 10 位學員每人至少完成 2 個模組，且第二個模組的 AI 輸出證明吃到了第一個模組的 context（例如：銷售大師的 AI 建議引用了影響力密碼問卷裡指出的弱點）。

---

## 2. Target Users（誰用）

### 主要使用者

| 角色 | 描述 | 主要需求 |
|---|---|---|
| **學員（Student）** | 上 kuoyo 課程的中小企業主、顧問、業務主管，30-55 歲 | 一站式做完所有課程練習、報告留得住、隨時回頭翻 |
| **顧問（Coach）** | kuoyo 自己 + 未來其他講師 / 助教 | 開帳號、設權限、看每位學員進度、批改 |
| **超管（Workspace Admin）** | kuoyo（tenant owner） | 開課程班、設定模組、總覽全 workspace |

### 預留角色（Phase 2/3）

| 角色 | 預留欄位 | 啟用時機 |
|---|---|---|
| **公開讀者（Public Reader）** | `entitlements.tier = "public"` | Phase 2 知識網站上線 |
| **付費會員（EC Member）** | `subscriptions.status = "active"` | Phase 3 EC 上線 |

---

## 3. Personas（典型用戶 3 種）

### P1 — 「我想轉型，但不知從哪開始」的中小企業老闆

- 45 歲，傳產二代、家族企業營業額 5 億
- 上完 kuoyo 課程想做「組織健診」找出弱點
- **流程**：登入 → 填影響力密碼問卷 → 看 5 力雷達 → 系統建議「先做營運力提升」→ 進入能力評分模組

### P2 — 「我想搞懂自己品牌」的新創創辦人

- 35 歲，DTC 品牌創辦人，年營收 3000 萬
- 已經做品牌但說不清自己是誰
- **流程**：登入 → 填問卷（系統建議品牌力為弱項）→ 進入品牌大師（Brand OS）做金字塔 + Soul → 結果回傳到中台 → 進入戰略模組讓 AI 用品牌定位反推 5 年策略

### P3 — kuoyo 自己（Coach）

- 我（你）— 在後台
- **流程**：開課程班 → 批次邀請 20 位學員 → 設定本期開放哪些模組 → 看 dashboard 每位學員進度 → 個別給回饋

---

## 4. Core User Journey（學員主旅程）

```
[註冊/登入]
    ↓ workspace 邀請或課程碼
[個人空間 Home]
    ↓ "建立第一間公司"
[公司 Workspace]
    │  (一個學員可有多間公司：自己的 + 客戶的)
    ↓
[模組選擇器]
    ├─ 影響力密碼診斷 (入口，必做)  ─→ 5 力雷達 + 12 挑戰排名
    │       ↓ 系統建議：「你的營運力最弱，先做這個」
    │
    ├─ 營運力（能力評分）           ─→ 員工評分 + 九宮格
    ├─ 銷售力（人脈管理）           ─→ 聯絡人 / 公司 / 關係
    ├─ 銷售力（銷售大師）           ─→ Pipeline + 拜訪 + 抽成
    ├─ 品牌力（Brand OS）           ─→ 跳轉到 consumer-insight-map（SSO）
    └─ 360 戰略                    ─→ 5 年戰略畫布
              ↓
[跨模組整合視圖]
    一頁式 dashboard，所有模組產出在這裡彙整
              ↓
[匯出 / 分享]
    PDF 整合報告（Phase 1.5）
```

**關鍵設計原則**：
- 每個模組進入前，shell 會把該學員「公司」下所有已產出的 module_data 餵給該模組的 AI prompt 當 context
- 模組結束後，產出寫回 `module_data` 表 + 觸發跨模組「stale」提示（學自 Brand OS）

---

## 5. 各模組 Phase 1 範圍

> 每個模組只列「Phase 1 必做」，nice-to-have 寫在 `05-risks-tradeoffs.md`。

### 5.1 影響力密碼（入口問卷）

**Phase 1 必做**：
- 60 題題庫（5 力 × 12 題）已存在於原 schema
- 學員端答題 UI（單頁分頁、進度條）
- 提交後算分、產出 5 力雷達圖
- 12 個成長挑戰加權排名
- 創辦人 vs 核心團隊認知差距分析（如果同公司多人填）

**Phase 1 不做**：PDF 14 頁報告、外部分享連結、提醒機制、Benchmark 比較

### 5.2 ML_能力評分（營運力）

**Phase 1 必做**：
- 通用化：拿掉「苗林」專屬欄位（job_title 限制、特定部門 seed）
- 學員可自建組織結構（部門 / 員工）
- 自評 + 他評流程
- 共識會議分數合併
- 九宮格分布圖

**Phase 1 不做**：三階審核（部門主管/副總/總經理）、語音評論上傳、IDP 個人發展計劃、稽核日誌

### 5.3 PS_人脈管理（銷售力 a）

**Phase 1 必做**（從 Python 重寫成 React + Supabase）：
- 聯絡人 CRUD（姓名、電話、Email、職稱）
- 公司 CRUD + 聯絡人關聯
- 標籤系統
- 多重身分（一人多公司角色）
- 全文搜尋

**Phase 1 不做**：CSV 批次匯入、名片 OCR、人脈關係圖視覺化、編輯歷史 audit log

### 5.4 MX_銷售大師（銷售力 b — 從零通用版）

**Phase 1 必做**：
- 客戶（client）CRUD — 串到 PS 人脈的 companies
- Pipeline stage 自定義（顧問可設定本期使用哪些 stage）
- 拜訪紀錄（visit log）— 日期、客戶、進展、下一步
- 簡單抽成計算（成交額 × 抽成率）
- 個人 dashboard：本月新案、推進中、成交、流失

**Phase 1 不做**：地圖 / 路線優化、行事曆整合、成就系統、AI 建議下一步、離線模式、批量匯入

### 5.5 MX_品牌大師（Brand OS）

**Phase 1 必做**：
- **不動 production**
- 中台提供 SSO 跳轉（學員從中台點品牌大師 → 自動登入 Brand OS）
- Brand OS 的 brand_pyramid / brand_soul_results / empathy_results 透過 edge function 同步到中台 `module_data`（單向：Brand OS → 中台，方便戰略模組讀取）

**Phase 1 不做**：Brand OS schema 整併、UI 移植、雙向同步

### 5.6 360 戰略建議（Strategos）

**Phase 1 必做**：
- 整套 7 模組（願景 / 護城河 / 環境 / 戰略-戰術-戰技 / 一頁戰略書 / 行動 / KPI）
- AI 蘇格拉底式追問
- 一鍵起草（lite 4 模組 + full 7 模組）
- **新增**：跨模組 context — Strategos 的 AI prompt 會吃到該公司在影響力密碼 / 能力評分 / 品牌大師的產出

**Phase 1 不做**：版本歷史、季檢視、進階 AI 4 工具（情境 / pitch / town hall / 隱性假設）、共識度分析

---

## 6. 權限矩陣（Permission Matrix）

> Phase 1 只做四個 role；entitlement 系統建表但留空。

| 動作 | Workspace Admin | Coach | Student | （未來 Public Reader）|
|---|---|---|---|---|
| 開課程班（cohort） | ✅ | ❌ | ❌ | ❌ |
| 邀請學員 | ✅ | ✅（同 cohort） | ❌ | ❌ |
| 設定學員模組權限 | ✅ | ✅（同 cohort） | ❌ | ❌ |
| 看自己學員的所有產出 | ✅ | ✅（同 cohort） | ❌ | ❌ |
| 看跨 cohort 學員產出 | ✅ | ❌ | ❌ | ❌ |
| 建自己公司 | ✅ | ✅ | ✅ | ❌ |
| 在自己公司用模組 | ✅ | ✅ | ✅（限被授權的模組） | ❌ |
| 看 / 編輯別人的公司 | ✅ | ✅（同 cohort 的學員） | ❌ | ❌ |
| 看公開內容（Phase 2） | ✅ | ✅ | ✅ | ✅ |
| 付費購買單模組（Phase 3） | n/a | n/a | ✅ | ✅ |

**模組權限粒度**（每個 student × module 一筆）：

```
student_module_access:
  student_id, module_type, is_enabled, granted_by, granted_at, expires_at?
```

預設新學員：所有模組都 enabled = false，coach 開課時批次開啟需要的模組。

---

## 7. Phase 1 成功標準

第 W8 結束時要能說「成功」必須符合：

- [ ] kuoyo 自己的 workspace 跑滿一輪：建 1 個 cohort、邀 5 位真實學員、跑完問卷 + 至少 2 個能力模組 + 1 次戰略
- [ ] 跨模組 context 證明：戰略 AI 在「環境分析」步驟自動引用了該學員影響力密碼裡標出的弱點（可截圖 demo）
- [ ] 顧問 dashboard 可看到 5 位學員當前進度
- [ ] RLS 通過：開兩個學員帳號互看不到對方資料
- [ ] 上線在生產 URL（dotdotwiki.vercel.app 或自有 domain）
- [ ] 第一批學員給出 NPS：至少 1 個 9-10 分推薦

---

## 8. Out of Scope（Phase 1 明確不做）

- ❌ EC、Stripe、付費（→ Phase 3）
- ❌ 公開知識網站、SEO（→ Phase 2）
- ❌ Brand OS 整併進中台（→ 留 SSO 跳轉，可能永遠不併）
- ❌ 影響力密碼 PDF 報告（→ Phase 1.5）
- ❌ 名片 OCR / CSV 匯入（→ Phase 1.5）
- ❌ 模組版本歷史（→ 永遠最新版）
- ❌ Mobile App / PWA（→ 響應式網頁先頂著）
- ❌ 外部 API / Webhook（→ Phase 2）
- ❌ 多語系（→ 先 zh-TW，Brand OS 已有 EN/中可獨立）
- ❌ 通知系統（→ 用 email magic link 即可，站內通知留 Phase 2）
