# Cowork 簡報：撤銷 + 替換 Anthropic API Key（兩個 Vercel 專案都要）

> 任務交辦人：kuoyo
> 預計時間：5-8 分鐘
> 難度：⭐⭐（要動 3 個 dashboard：Anthropic / Vercel × 2）

---

## 為什麼要做（背景）

kuoyo 在 5/5 13:32 那則對話裡**直接把 Anthropic API key 全文貼進 Claude Code 聊天**，那把 key 已經寫進 session jsonl 檔（外洩）。按 Strategos HANDOFF.md 慣例，被外洩的 key **一律 roll**，不冒險。

外洩的 key prefix（用來確認是哪一把）：

```
sk-ant-api03-lqmfmi9pTg4p...iwtqAAA
```

（完整 key 不貼，避免再多一份洩漏。在 Anthropic console 用 prefix 比對即可。）

---

## 任務目標

1. 在 Anthropic console **撤銷**那把舊 key
2. 產一把**新 key**
3. 更新到 **2 個 Vercel 專案**的環境變數（`360bizthinker` + `strategos`）
4. 兩個專案都 **redeploy** 觸發新 key 生效
5. 驗證 AI 功能（Coach / Draft）還能正常運作

---

## 前置條件

- [ ] 你能登入 [console.anthropic.com](https://console.anthropic.com)（用 kuoyo 的帳號）
- [ ] 你能登入 [vercel.com](https://vercel.com)（kuoyo20@gmail.com / kuoyos-projects team）
- [ ] 看得到兩個 Vercel 專案：`360bizthinker` + `strategos`

---

## Step-by-step

### Phase 1：在 Anthropic 撤銷舊 key + 產新 key

#### 1.1 開 API Keys 頁

點：https://console.anthropic.com/settings/keys

#### 1.2 找出洩漏那把 key

清單裡找一把 key 名稱可能是 `default` 或 `Strategos` 或類似，**prefix 開頭是 `sk-ant-api03-lqmfmi9p...`**（最後幾碼 `iwtqAAA`）。

> 如果有多把 key prefix 相近不確定，**全部 roll**比較安全（每把分別 revoke + 重新加一把都更新到 Vercel）。

#### 1.3 撤銷

點那把 key 旁邊的 `...` → **Revoke**（或 Delete）→ 確認。

#### 1.4 產新 key

頁面右上 **Create Key** →
- Name：`360bizthinker-strategos-2026-05` （好辨識）
- Workspace：留 default 即可
- Permissions：`All`
- **Create** → 跳出新 key（`sk-ant-api03-...`）

⚠️ **這把新 key 只會顯示一次**。馬上複製到剪貼簿，等下立刻貼進 Vercel。

---

### Phase 2：更新 Vercel `360bizthinker` env vars

#### 2.1 開 env 設定頁

點：https://vercel.com/kuoyos-projects/360bizthinker/settings/environment-variables

#### 2.2 找 `ANTHROPIC_API_KEY`

清單裡找這個 key（應該已存在，三個環境 Production / Preview / Development 各一份）。

#### 2.3 替換值

每個環境（Production / Preview / Development）都要：
- 點該 row 旁的 `...` → **Edit**
- Value 欄位清掉舊值，貼上**新 key**
- **Save**

> 也可以直接 **Remove** 整把舊的，重新 **Add New** 一把（同名 `ANTHROPIC_API_KEY`），Environments 全勾，貼新 key。

---

### Phase 3：更新 Vercel `strategos` env vars

#### 3.1 開 env 設定頁

點：https://vercel.com/kuoyos-projects/strategos/settings/environment-variables

#### 3.2 同 Phase 2.2-2.3

把 `ANTHROPIC_API_KEY` 同樣替換成新 key（三個環境都改）。

> ⚠️ 別漏：strategos 是獨立專案，跟 360bizthinker 共用同一把 Anthropic key 但 env 是各自設定的。漏改 → strategos AI Coach 會 401。

---

### Phase 4：兩個專案都 redeploy

env vars 改完，要 redeploy 才會吃到新值。**舊 deploy 仍在跑舊 key**，所以一定要 redeploy。

#### 4.1 360bizthinker redeploy

點：https://vercel.com/kuoyos-projects/360bizthinker/deployments

最新一筆 production deploy（state: Ready）→ 右側 `...` → **Redeploy**
- 視窗跳出 → **Use existing Build Cache** 不勾（保險起見強制重 build）
- **Redeploy** → 等 1-2 分鐘 build 完。

#### 4.2 strategos redeploy

點：https://vercel.com/kuoyos-projects/strategos/deployments

同 4.1 流程。

---

## 驗證（你做完請測這 5 步）

### 5.1 360bizthinker AI 功能還活著

1. 開無痕視窗 → https://360bizthinker.vercel.app/login
2. 用 `kuoyo20@gmail.com` 登入（OTP 流程，6 碼登入）
3. 進到 `/admin` → 隨便選一家公司 → 點「影響力密碼」(assessment 模組)
4. 跑完 60 題 → 看 AI 觀察報告有沒有正常產出（不能是 401 / API key invalid）

### 5.2 strategos AI Coach 還活著

1. 開無痕視窗 → https://strategos-azure-five.vercel.app
2. 用任一個 cohort 邀請碼（例如 `D8C453`）登入
3. 進到 M1 願景 → 填一兩格 → 點「請教練看一下」
4. AI Coach 應該回 1-2 段蘇格拉底式追問（不能是錯誤訊息）

---

## 完成後請回報

- [ ] 舊 key 在 Anthropic console **revoked** ✅
- [ ] 新 key prefix 前 8 碼（給 kuoyo 對照用，不要貼全文！）：`sk-ant-api03-XXXX....`
- [ ] 360bizthinker env 已更新 ✅
- [ ] strategos env 已更新 ✅
- [ ] 兩專案都 redeploy 成功 ✅
- [ ] 360bizthinker assessment AI 報告正常 ✅
- [ ] strategos AI Coach 回應正常 ✅

---

## 出狀況怎麼辦

| 症狀 | 原因 | 解 |
|---|---|---|
| AI 回 `401 Unauthorized` 或 `invalid x-api-key` | env var 沒改成功 / 沒 redeploy | 回去 Vercel env 確認新 key 是 `sk-ant-api03-` 開頭，再 redeploy |
| AI 回 `429 rate limit` | 不是 key 問題，是用量超限 | 不用動 key，跟 kuoyo 講就好 |
| Vercel deploy 失敗 | env 跟 build 沒關係，可能本來就有 build error | 看 Vercel build log，把錯訊貼給 kuoyo |
| 找不到 strategos 專案 | 你登入的是錯的 team | 切到 `kuoyos-projects` team |
| 不確定哪把舊 key 是洩漏那把 | prefix 比對不出來 | 全部 revoke + 重發新的，全部 env 都換 |

---

## ⚠️ 安全紀律

- 新 key **不要**貼進任何聊天紀錄 / commit / Slack 訊息
- 只貼進 Anthropic console + Vercel env（兩個地方而已）
- 完成後**清剪貼簿**（Cmd+C 隨便複製其他文字蓋掉）
- 如果這份 doc 你完成後要 commit 進 repo，**不要把新 key 寫進 commit message 或 doc 內容**
