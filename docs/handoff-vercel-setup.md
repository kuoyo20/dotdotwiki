# Cowork 簡報：把 360bizthinker 連上 Vercel

> 任務交辦人：kuoyo
> 預計時間：5-10 分鐘
> 難度：⭐⭐（會操作 GitHub + Vercel 即可）

---

## 任務目標

把 GitHub 上的 `kuoyo20/360bizthinker` repo 連結到 Vercel，每次 push 自動部署，第一個版本網址會是 `https://360bizthinker.vercel.app`（或 Vercel 自動分配的類似名）。

---

## 前置條件

- [ ] 你有 `kuoyo20@gmail.com` 帳號，可登入 [vercel.com](https://vercel.com)（kuoyo's projects team）
- [ ] 你能讀取 [github.com/kuoyo20/360bizthinker](https://github.com/kuoyo20/360bizthinker)
- [ ] Vercel ↔ GitHub 已授權（如果沒有，第一次 import 會跳出授權視窗，按下去就好）

---

## Step-by-step

### 1. 開新專案

1. 到 [vercel.com/new](https://vercel.com/new)
2. 確認左上角 team 是 **kuoyo's projects**（不是個人帳號）
3. 在 "Import Git Repository" 區找 `kuoyo20/360bizthinker`
   - 找不到？點 "Adjust GitHub App Permissions" → 開放 `360bizthinker` repo 給 Vercel → 回來重整
4. 點 **Import**

### 2. 設定建置（保留預設即可，但確認以下）

| 欄位 | 值 |
|---|---|
| Framework Preset | **Vite**（自動偵測） |
| Build Command | `npm run build`（預設） |
| Output Directory | `dist`（預設） |
| Install Command | `npm install`（預設） |

### 3. 設定環境變數（**最重要的一步**）

點開 **Environment Variables** 區塊，貼以下兩筆（**Production / Preview / Development 三個都勾**）：

```
變數名稱：VITE_SUPABASE_URL
變數值：https://awwffyfxepwszstjxxdf.supabase.co
```

```
變數名稱：VITE_SUPABASE_PUBLISHABLE_KEY
變數值：sb_publishable_hx1QlTBz6vkiojYcq_cnIQ_OII5rJQf
```

> 備註：這兩個是公開可分享的 key（前端用），不是 service role secret。安心貼。

### 4. 部署

1. 按 **Deploy** 按鈕
2. 等 1-3 分鐘建置 → 顯示 🎉 完成
3. 點 **Visit** 看一下，應該會看到一個黑底白字的 Landing 頁，標題寫「**一條鏈走完 健診 → 能力 → 戰略**」

### 5. 確認自動部署

1. 回到 Vercel 專案 dashboard
2. 點 **Settings → Git**
3. 確認 "Production Branch" 是 `main`
4. 看 "Connected Git Repository" 是 `kuoyo20/360bizthinker`
5. 完成 ✅

---

## 驗證清單（做完請回報 kuoyo）

- [ ] Production URL 可開啟，顯示 360bizthinker Landing 頁
- [ ] URL 是什麼？（複製網址回報）
- [ ] Vercel 專案 ID（在 Settings → General 最下面有）
- [ ] 環境變數 2 個都有設、3 個環境都勾選

---

## 常見問題

**Q：Vercel 找不到 360bizthinker repo**
A：點 "Adjust GitHub App Permissions" → 在 GitHub 授權頁勾 `360bizthinker` → 回 Vercel 重整。

**Q：建置失敗 "command not found: vite"**
A：檢查 Install Command 是 `npm install`（不是 `npm ci` 或別的）。

**Q：Production URL 開出來顯示 401 或 protected**
A：到 Settings → Deployment Protection → 確認沒開 "Vercel Authentication"（這是付費功能會擋未登入訪客）。

**Q：環境變數不確定要不要勾 Preview / Development**
A：三個都勾。Preview 是給 PR 預覽用、Development 是 `vercel dev` 本地用，現在不影響但之後會。

---

## 完成後 kuoyo 接手什麼

- 收到 production URL → 截圖 / 開給我看
- 我會繼續 W1（auth + workspace bootstrap + dashboard shell，預計 1 週）
- 之後每次 git push 你都不用管，Vercel 自動部署
