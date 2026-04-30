// Server-side prompt registry. Frontend only sends promptKey + vars,
// never raw prompts — prevents prompt injection misuse.

export const SYSTEM_PROMPT = `你是 Yo 的銷售策略助手,協助學員應用《品牌銷售工作坊》的框架。

工作坊核心框架:
- 需求矩陣 / 八張牌
- 同理心地圖
- M.V.P(Market / Vision / Product)
- 客戶經營旅程 6 階段
- N.P.S 客戶峰值旅程(峰終定律)
- Q.C 人無我有(量化 + 名人)
- 人脈三歷

回答原則:
1. 永遠回傳「三個方向」(或題目要求的數量)而非單一答案,讓學員自己選
2. 每個方向呼應到工作坊的某個框架
3. 用詞直接、不浮誇,不使用以下禁用詞:賦能、共創、生態系、閉環、賽道、乾貨、落地、賦予、打造
4. 簡體中文 / 英文都不使用,只用繁體中文
5. 回傳格式為 JSON,結構固定 — 不要包在 markdown code block 裡,直接吐 JSON
6. 如果學員尚未填寫某些上下文(顯示為「尚未填寫」),請用通用銷售情境給建議,不要捏造學員的產品或客戶細節`

export type PromptKey = 'm4_questions' | 'm4_outputs' | 'm4_peaks'

interface PromptDef {
  template: string
  requiredVars: readonly string[]
  expectedShape: string
}

export const PROMPTS: Record<PromptKey, PromptDef> = {
  m4_questions: {
    requiredVars: [
      'stage_label',
      'm2_market',
      'm2_vision',
      'm2_product',
      'm3_industry',
      'm3_keyman',
    ],
    expectedShape: '{ "questions": ["...", "...", "...", "...", "..."] }',
    template: `階段:{{stage_label}}

學員的事業背景:
- 目標市場:{{m2_market}}
- 感性溝通:{{m2_vision}}
- 理性差異:{{m2_product}}

目標客戶:
- 產業類型:{{m3_industry}}
- KEY MAN:{{m3_keyman}}

請給 5 個這個階段適合問的引導問題,每個問題必須:
- 開放式(不能用是/否回答)
- 能挖出對方的需求或痛點
- 推進到下一個銷售階段
- 在 25 字以內

回傳 JSON,結構嚴格如下,不要任何其他文字:
{ "questions": ["...", "...", "...", "...", "..."] }`,
  },

  m4_outputs: {
    requiredVars: ['stage_label', 'questions'],
    expectedShape:
      '{ "directions": [{ "label": "...", "summary": "...", "next_step": "...", "framework_link": "..." }, ...] }',
    template: `階段:{{stage_label}}

學員填的引導問題:
{{questions}}

請給 3 個方向,告訴學員:
「如果我這樣問,我預期對方會說出什麼樣的答案,才算推進成功?」

每個方向必須:
- label:<10 字的方向名
- summary:<50 字描述,具體說明對方應該講出哪些訊息(可被觀察 / 驗證)
- next_step:<30 字,告訴學員拿到這些訊息後下一步可以做什麼
- framework_link:對應到工作坊的哪個框架(例:同理心地圖 / M.V.P / Q.C / N.P.S)

範例:
- 開發階段問「你們現在用哪家供應商?」
- 預期產出 label:競品情報、summary:得知競品名稱 + 合作年限 + 不滿意點(3 個)、next_step:用 Q.C 量化我們的優勢

回傳 JSON,結構嚴格如下,不要任何其他文字:
{ "directions": [{ "label": "...", "summary": "...", "next_step": "...", "framework_link": "..." }, { ... }, { ... }] }`,
  },

  m4_peaks: {
    requiredVars: ['m2_mvp_summary', 'm3_industry', 'm4_stages_summary'],
    expectedShape:
      '{ "directions": [{ "label": "60 秒第一印象", ... }, { "label": "創造高峰", ... }, { "label": "峰終留念", ... }] }',
    template: `學員的事業:{{m2_mvp_summary}}
目標客戶:{{m3_industry}}
旅程設計摘要:
{{m4_stages_summary}}

請根據峰終定律與 N.P.S 框架,給 3 個情緒高峰設計建議,順序固定為:
1. 60 秒第一印象怎麼設計?(對應 S2 拜訪;例:海底撈遞髮圈、製造記憶點)
2. 創造高峰怎麼設計?(對應 S4 提案;例:解決對方一個沒講出來的痛點)
3. 峰終留念怎麼設計?(對應 S6 成交;例:離場前的一個小驚喜)

每個建議呼應學員的事業特性。

每個 direction 物件結構:
- label:必須是上面 3 個固定字串之一(60 秒第一印象 / 創造高峰 / 峰終留念)
- summary:<60 字,描述這個高峰要創造什麼情緒
- next_step:<40 字,具體可執行的動作
- framework_link:對應的工作坊框架(N.P.S / 峰終定律 / 6S 感官)

回傳 JSON,結構嚴格如下,不要任何其他文字:
{ "directions": [
  { "label": "60 秒第一印象", "summary": "...", "next_step": "...", "framework_link": "..." },
  { "label": "創造高峰", "summary": "...", "next_step": "...", "framework_link": "..." },
  { "label": "峰終留念", "summary": "...", "next_step": "...", "framework_link": "..." }
]}`,
  },
}

export function renderPrompt(key: PromptKey, vars: Record<string, string>): string {
  const def = PROMPTS[key]
  if (!def) throw new Error(`Unknown promptKey: ${key}`)

  let rendered = def.template
  for (const v of def.requiredVars) {
    const value = (vars[v] ?? '').trim() || '尚未填寫'
    rendered = rendered.replaceAll(`{{${v}}}`, value)
  }
  return rendered
}

export function isValidPromptKey(k: unknown): k is PromptKey {
  return typeof k === 'string' && k in PROMPTS
}
