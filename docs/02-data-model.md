# 02 — Data Model（資料模型草稿）

> Status: Draft v0.1 · Phase 1 schema
> Supabase project: 待建（Tokyo region, ADR-07 = A）

---

## 1. ERD 概覽

```
auth.users (Supabase 內建)
   │
   ▼
workspaces ──────────► workspace_members ◄──── students
    │                       (role: admin/coach/student)
    │
    ├──► cohorts ──────► cohort_students ◄──── students
    │      │
    │      └──► cohort_module_config (本期開放哪些模組)
    │
    ├──► companies ──────► company_members (學員可在多公司之間切換)
    │      │
    │      └──► module_data (module_type discriminator + JSONB)
    │              │
    │              └──► module_data_links (跨模組引用，例如戰略引用品牌)
    │
    ├──► student_module_access (誰能用哪個模組，Phase 3 EC 用)
    │
    └─── (Phase 2/3 預留)
         entitlements / products / subscriptions / content_items
```

---

## 2. Domain 1：Identity & Tenancy（身分與租戶）

### `workspaces`
顧問層 = tenant。kuoyo 是 workspace 1，未來其他顧問是 2、3...

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,        -- URL 用，如 'kuoyo'
  name TEXT NOT NULL,                -- 顯示用
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  brand_config JSONB DEFAULT '{}',   -- 顧問可換 logo / 主色 / 文案
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `students`
auth.users 的延伸 profile。一個 user 可在多個 workspace 當 student（透過 workspace_members）。

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `workspace_members`
誰在哪個 workspace、什麼角色。

```sql
CREATE TABLE workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'student')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);
```

---

## 3. Domain 2：Course（課程班）

### `cohorts`
課程班 / 期別。學員以 cohort 為單位被批次邀請。

```sql
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                -- 如「2026 KOI 第三期」
  invite_code TEXT UNIQUE NOT NULL,  -- 6 碼字母（學自 Strategos）
  invite_password TEXT,              -- optional，課程密碼（學自 Brand OS）
  starts_at DATE,
  ends_at DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `cohort_students`
誰在哪個 cohort。

```sql
CREATE TABLE cohort_students (
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cohort_id, student_id)
);
```

### `cohort_module_config`
本期 cohort 開放哪些模組。

```sql
CREATE TABLE cohort_module_config (
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  PRIMARY KEY (cohort_id, module_type)
);
```

`module_type` enum 值（Phase 1）：
- `assessment` — 影響力密碼
- `capability_eval` — 能力評分
- `contact_network` — 人脈管理
- `sales_pipeline` — 銷售大師
- `brand_os` — 品牌大師（外部，僅紀錄 SSO 入口）
- `strategy` — 戰略

---

## 4. Domain 3：Subject（研究主體）

### `companies`
學員研究的公司。**用 `company_type` 欄位區分「自家 vs 客戶」**（不拆兩張表，避免 schema 重複；UI 層用 type 過濾即可）。

一個學員可有：
- 多間 `own` 公司（自己經營的事業，通常 1-2 間）
- 多間 `client` 公司（如果學員是顧問，他服務的客戶，可有 N 間）
- `client` 公司可選擇 `client_of_company_id` 綁回某間 own 公司，標示「這是我這間公司服務的客戶」

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  owner_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_type TEXT NOT NULL DEFAULT 'own' CHECK (company_type IN ('own', 'client')),
  client_of_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
                                     -- 僅 company_type='client' 時可選填，
                                     -- 指向學員自己的某間 own 公司
  name TEXT NOT NULL,
  industry TEXT,
  size_band TEXT,                    -- 'micro' / 'small' / 'mid' / 'large'
  founded_year INT,
  website TEXT,
  description TEXT,
  meta JSONB DEFAULT '{}',           -- 任意擴充欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT client_of_only_for_clients CHECK (
    company_type = 'client' OR client_of_company_id IS NULL
  )
);

CREATE INDEX idx_companies_owner_type ON companies(owner_student_id, company_type);
CREATE INDEX idx_companies_client_of ON companies(client_of_company_id) WHERE client_of_company_id IS NOT NULL;
```

**UI 影響**：
- `/home` 頁面分兩區：「我的公司」（own）+「我服務的客戶」（client）
- 模組進入點 `/companies/:id/:module` 不變，邏輯一視同仁
- `module_data.company_id` 可指向任一類型的公司

### `company_members`（Phase 1.5 — 多人協作預留）
一間公司可多個學員協作（例如 CEO + 副總都在系統裡填同一家）。Phase 1 先建表，UI 不做。

```sql
CREATE TABLE company_members (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (company_id, student_id)
);
```

---

## 5. Domain 4：Module Data（核心通用表）

### `module_data`
**所有模組產出都進這張表**。Strategos 的 pattern，學起來。

```sql
CREATE TABLE module_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  module_type TEXT NOT NULL,
  payload JSONB NOT NULL,            -- 模組特定 schema (見 §6)
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  ai_input JSONB,                    -- 原始學員輸入 + 跨模組 context snapshot
  ai_output JSONB,                   -- AI 完整回覆（debug 用）
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, module_type)   -- 一間公司一個模組一筆（最新版）
);

CREATE INDEX idx_module_data_company_module ON module_data(company_id, module_type);
CREATE INDEX idx_module_data_student ON module_data(student_id);
```

### `module_data_links`
跨模組引用追蹤（戰略引用了品牌的哪一版？）

```sql
CREATE TABLE module_data_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_module_data_id UUID NOT NULL REFERENCES module_data(id),
  target_module_data_id UUID NOT NULL REFERENCES module_data(id),
  link_type TEXT NOT NULL,           -- 'context_input' / 'derived_from'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. 各模組的 `payload` JSONB Schema

### 6.1 `assessment`（影響力密碼）

```json
{
  "responses": [
    {"question_id": "STR_01", "score": 4, "comment": "..."},
    ...
  ],
  "scores": {
    "strategy": 3.4, "brand": 4.1, "operations": 2.8,
    "sales": 3.7, "management": 3.9
  },
  "challenges_ranked": [
    {"id": "CH_03", "weight": 0.82, "title": "供應鏈不穩定"},
    ...
  ],
  "team_members_responses": [...]   // optional
}
```

### 6.2 `capability_eval`（能力評分）

```json
{
  "org_units": [{"id": "biz", "name": "業務部", "parent_id": null}, ...],
  "employees": [{"id": "e1", "name": "...", "team_id": "...", "level": "M2"}, ...],
  "current_cycle": {
    "id": "c1", "name": "2026 H1", "starts_at": "...", "ends_at": "...",
    "stage": "self_eval" | "peer_eval" | "consensus" | "completed"
  },
  "evaluations": [...],
  "nine_box_results": [...]
}
```

### 6.3 `contact_network`（人脈管理）

```json
{
  "contacts": [{"id": "p1", "name": "...", "tags": [...], "roles": [...]}, ...],
  "external_companies": [{"id": "c1", "name": "...", "industry": "..."}, ...],
  "relationships": [{"from": "p1", "to": "p2", "type": "introduced_by"}, ...]
}
```

> 注意：這裡的 `external_companies` 跟核心 `companies` 表**不同**。核心 `companies` 是學員的研究主體（自家或客戶公司）；這裡是「我的人脈名單上有哪些公司」。

### 6.4 `sales_pipeline`（銷售大師）

```json
{
  "stages": [
    {"id": "new_lead", "label": "新名單", "order": 0, "color": "#94a3b8"},
    ...
  ],
  "clients": [{"id": "c1", "name": "...", "stage": "negotiation", "value": 50000}, ...],
  "visits": [{"client_id": "c1", "date": "...", "summary": "...", "next_step": "..."}, ...],
  "commission_rate": 0.05,
  "settings": {"currency": "TWD", "fiscal_year_start_month": 1}
}
```

### 6.5 `brand_os`（品牌大師外部紀錄）

```json
{
  "external_url": "https://consumer-insight-map.vercel.app/brands/{brand_id}",
  "synced_pyramid": { /* mirror from Brand OS */ },
  "synced_soul": { /* mirror */ },
  "synced_empathy": { /* mirror */ },
  "last_synced_at": "2026-..."
}
```

### 6.6 `strategy`（戰略）

```json
{
  "vision": "...",
  "moat": "...",
  "environment": { "pestel": {...}, "porter5": {...} },
  "strategy_tactics": [...],
  "one_pager": "...",
  "actions": [...],
  "kpis": [...],
  "cross_module_context_used": ["assessment-uuid", "brand_os-uuid"]
}
```

---

## 7. Domain 5：Permissions（權限）

### `student_module_access`
學員 × 模組的開通狀態。Phase 3 EC 啟用時，購買 → 寫入這張表。

```sql
CREATE TABLE student_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  module_type TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('cohort', 'manual', 'purchase')),
  source_ref UUID,                   -- cohort_id / coach_user_id / order_id
  is_enabled BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE (student_id, workspace_id, module_type)
);
```

---

## 8. Domain 6：Future Reserved（Phase 2/3 預留，Phase 1 建表空著）

### `entitlements`（誰擁有什麼層級）

```sql
CREATE TABLE entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  workspace_id UUID REFERENCES workspaces(id),
  tier TEXT NOT NULL CHECK (tier IN ('public', 'free', 'student', 'pro', 'admin')),
  source TEXT NOT NULL,              -- 'cohort' / 'subscription' / 'one_time'
  source_ref UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

### `products` / `subscriptions`（EC 預留）

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  price_cents INT NOT NULL,
  currency TEXT DEFAULT 'TWD',
  product_type TEXT,                 -- 'module_access' / 'subscription' / 'course'
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  stripe_subscription_id TEXT,
  status TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
);
```

### `content_items`（公開內容預留）

```sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  source_module_data_id UUID REFERENCES module_data(id),
  title TEXT NOT NULL,
  slug TEXT,
  body JSONB,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'workspace', 'public')),
  published_at TIMESTAMPTZ,
  seo_meta JSONB DEFAULT '{}'
);
```

---

## 9. RLS Policy Pattern（每張表都套）

學自 Brand OS：每張用戶資料表都有 4 條政策 + admin override。

```sql
-- Helper function
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID, required_role TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND (required_role IS NULL OR role = required_role OR role = 'admin')
  );
END;
$$;

-- Pattern (例子：companies 表)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON companies FOR SELECT
  USING (
    owner_student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR is_workspace_member(workspace_id, 'coach')
  );

CREATE POLICY "own_insert" ON companies FOR INSERT
  WITH CHECK (
    owner_student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND is_workspace_member(workspace_id)
  );

CREATE POLICY "own_update" ON companies FOR UPDATE
  USING (owner_student_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
  WITH CHECK (owner_student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "coach_full_access" ON companies FOR ALL
  USING (is_workspace_member(workspace_id, 'coach'));
```

每張新表都套這個模板，必跑 `mcp__supabase__get_advisors` 檢查 search_path 警告。

---

## 10. Migration Sources（從哪搬資料）

| 中台目標 | 來源 | 動作 |
|---|---|---|
| `module_data (assessment)` | 影響力密碼 schema (`responses`, `answers`, `challenges`) | 重寫 — 此模組才剛開始，schema 直接重新設計 |
| `module_data (capability_eval)` | ML_能力評分 (`org_units`, `employees`, `evaluations`...) | 通用化 + 攤平成 JSONB 寫入 payload |
| `module_data (contact_network)` | forfunfun (Python/SQLite) | 重寫 — 既然 forfunfun 是 Python，schema 順便重設計 |
| `module_data (sales_pipeline)` | 無 | 全新設計 |
| `module_data (brand_os)` | consumer-insight-map (Supabase rsoeybrftefubupwbdvn) | 邊緣同步 — edge function 從 Brand OS 拉資料寫入 |
| `module_data (strategy)` | strategos (Supabase uvkjcbxgdmeengfpukjb) | 整套搬 — schema 蠻接近 module_data 結構，重寫 frontend |

---

## 11. 索引與效能注意

- 所有 FK 加 index
- `module_data` 由 `(company_id, module_type)` 是最常 query → 已加 index
- JSONB payload 大欄位 query 用 `->>` 而非 PostgREST filter（避免 full scan）
- `workspace_id` 是 RLS 主要 filter → 每張表加 index

---

## 12. 開放問題（已答）

- [x] **companies 拆自家 vs 客戶** → 用 `company_type` 欄位區分（不拆兩張表）
- [x] **Brand OS 同步** → Phase 1 手動按鈕（學員自己點同步）
- [ ] 學員可同時屬於多個 workspace 嗎（被多個顧問教）？目前設計支援，UX 上要設計切換器。 — 預設可，Phase 1 不做切換器 UI
- [ ] `cohort_module_config` vs `student_module_access` 重複？刻意分開 — cohort 設預設值，student 是個別 override。預設可，待 W2 實作時驗證。
