import {
  PROMPTS,
  SYSTEM_PROMPT,
  isValidPromptKey,
  renderPrompt,
  type PromptKey,
} from './_prompts'

export interface AIRequestBody {
  promptKey: string
  vars: Record<string, string>
}

export interface AISuccessResponse {
  ok: true
  promptKey: PromptKey
  data: unknown
  usage?: { input_tokens: number; output_tokens: number }
}

export interface AIErrorResponse {
  ok: false
  error: string
  detail?: string
}

const MODEL = 'claude-haiku-4-5'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

function extractJson(text: string): unknown {
  // strip markdown code fences if any
  const cleaned = text.replace(/```json\s*|\s*```/g, '')
  // find first { ... last }
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error('Anthropic response did not contain JSON')
  }
  return JSON.parse(cleaned.slice(start, end + 1))
}

export async function callAnthropic(
  body: AIRequestBody,
  apiKey: string,
): Promise<AISuccessResponse | AIErrorResponse> {
  if (!apiKey) {
    return { ok: false, error: 'server_misconfigured', detail: 'ANTHROPIC_API_KEY missing' }
  }
  if (!isValidPromptKey(body.promptKey)) {
    return {
      ok: false,
      error: 'invalid_prompt_key',
      detail: `allowed: ${Object.keys(PROMPTS).join(', ')}`,
    }
  }
  if (typeof body.vars !== 'object' || body.vars === null) {
    return { ok: false, error: 'invalid_vars', detail: 'vars must be an object' }
  }

  const userPrompt = renderPrompt(body.promptKey, body.vars)

  let response: Response
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
  } catch (e) {
    return { ok: false, error: 'network_error', detail: (e as Error).message }
  }

  if (!response.ok) {
    let detail = ''
    try {
      detail = await response.text()
    } catch {
      detail = response.statusText
    }
    return { ok: false, error: `anthropic_${response.status}`, detail: detail.slice(0, 400) }
  }

  let json: any
  try {
    json = await response.json()
  } catch (e) {
    return { ok: false, error: 'invalid_anthropic_response', detail: (e as Error).message }
  }

  const text: string = json?.content?.[0]?.text ?? ''
  if (!text) {
    return { ok: false, error: 'empty_anthropic_response' }
  }

  let parsed: unknown
  try {
    parsed = extractJson(text)
  } catch (e) {
    return {
      ok: false,
      error: 'json_parse_failed',
      detail: `${(e as Error).message}; raw: ${text.slice(0, 300)}`,
    }
  }

  return {
    ok: true,
    promptKey: body.promptKey,
    data: parsed,
    usage: json.usage
      ? { input_tokens: json.usage.input_tokens, output_tokens: json.usage.output_tokens }
      : undefined,
  }
}
