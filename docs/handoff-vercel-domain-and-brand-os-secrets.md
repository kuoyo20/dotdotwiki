# Cowork 簡報：補上 Vercel 新網址 + Brand OS 同步金鑰

> 任務交辦人：kuoyo
> 預計時間：5-8 分鐘
> 難度：⭐⭐
> 兩個任務都在網頁介面點按鈕，沒有寫 code

---

## 任務 1：把 360bizthinker.vercel.app 補成 production domain

### 為什麼

Vercel 專案改名後，預設網址不會自動跟著變。現在線上服務還是走舊的
`dotdotwiki.vercel.app`，要手動加新的別名。

### 步驟

1. 登入 [vercel.com](https://vercel.com)（用 kuoyo20@gmail.com 帳號 / kuoyo's projects team）
2. 開啟這個連結：
   https://vercel.com/kuoyos-projects/360bizthinker/settings/domains
3. 在 **Add Domain** 輸入框打：`360bizthinker.vercel.app`
4. 按 **Add**
5. 等 Vercel 顯示 ✅（通常 5 秒內）

### 驗證

回報 kuoyo：開 https://360bizthinker.vercel.app/ 應該看到黑底 Landing 頁
（標題「一條鏈走完 健診 → 能力 → 戰略」），不是 404。

---

## 任務 2：把 Brand OS service role 加到 Edge Function Secrets

### 為什麼

中台要同步學員在 Brand OS 做的金字塔 / Soul / 同理心地圖，
需要跨 Supabase 專案讀取。沒這把 key，「從 Brand OS 同步」按鈕會回 503。

### 步驟（依序做，不要跳）

#### Step 1：到 Brand OS Supabase 拿 service role key

1. 開 https://supabase.com/dashboard/project/rsoeybrftefubupwbdvn/settings/api
2. 捲到 **Project API keys** 區塊
3. 找到 **`service_role`**（**不是 `anon`**）
4. 點眼睛 👁 圖示顯示 key（一長串 `eyJhbGc...` 開頭，約 200+ 字元）
5. 點複製按鈕 → 暫時放剪貼簿
6. ⚠️ **不要貼到任何聊天訊息、不要存檔、不要傳 LINE/Slack**

> 這把 key 等於 Brand OS 資料庫的上帝權限，只能貼到下一步那個 Supabase 表單，**用完關掉視窗**就沒了。

#### Step 2：加到 360bizthinker Supabase Edge Function Secrets

1. 開 https://supabase.com/dashboard/project/awwffyfxepwszstjxxdf/settings/functions
2. 找 **Edge Function Secrets** 區塊（在頁面靠中下）
3. 點 **Add new secret** 加第 1 個：
   - **Name**：`BRAND_OS_SUPABASE_URL`
   - **Value**：`https://rsoeybrftefubupwbdvn.supabase.co`
   - 按 Save
4. 再點 **Add new secret** 加第 2 個：
   - **Name**：`BRAND_OS_SUPABASE_SERVICE_ROLE_KEY`
   - **Value**：剛剛從 Brand OS 複製的那串 `eyJhbGc...`
   - 按 Save
5. 確認列表裡有 2 個新 secret（值會顯示為 `••••••`）

### 驗證

回報 kuoyo 兩個 secret 都已加好。kuoyo 端會跑驗證指令確認同步功能恢復。

---

## 完成後請回報這 3 件事

- [ ] 任務 1 完成：https://360bizthinker.vercel.app/ 可以開啟，**截圖**
- [ ] 任務 2 完成：Edge Function Secrets 列表有 2 個新項目
- [ ] 確認 service role key **沒有**被貼到任何其他地方（聊天 / 檔案 / 截圖等）

---

## 安全注意事項（重要！）

- 任務 2 的 service role key 是「上帝級」金鑰
- 只允許貼到 Step 2 那個 Supabase Secret 表單，**沒有任何例外**
- 如果不小心貼到別的地方（截圖、聊天、檔案），請馬上回報 kuoyo，
  到 [Brand OS settings](https://supabase.com/dashboard/project/rsoeybrftefubupwbdvn/settings/api)
  按 **Reset service_role key** rotate 掉
