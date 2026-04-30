// Frontend AI client. Sends { promptKey, vars } to /api/ai (proxy).
// Never sends raw prompts — server holds the templates.

export type PromptKey = 'm4_questions' | 'm4_outputs' | 'm4_peaks'

export interface AIDirection {
  label: string
  summary: string
  next_step: string
  framework_link: string
}

export interface QuestionsResponse {
  questions: string[]
}

export interface DirectionsResponse {
  directions: AIDirection[]
}

interface ApiSuccess<T> {
  ok: true
  promptKey: PromptKey
  data: T
  usage?: { input_tokens: number; output_tokens: number }
}

interface ApiError {
  ok: false
  error: string
  detail?: string
}

export class AIError extends Error {
  detail?: string
  status: number
  constructor(error: string, detail: string | undefined, status: number) {
    super(error)
    this.name = 'AIError'
    this.detail = detail
    this.status = status
  }
}

async function callApi<T>(
  promptKey: PromptKey,
  vars: Record<string, string>,
): Promise<ApiSuccess<T>> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ promptKey, vars }),
  })

  let json: ApiSuccess<T> | ApiError
  try {
    json = (await res.json()) as ApiSuccess<T> | ApiError
  } catch (e) {
    throw new AIError('invalid_server_response', (e as Error).message, res.status)
  }

  if (!json.ok) {
    throw new AIError(json.error, json.detail, res.status)
  }
  return json
}

export const ai = {
  questions: (vars: Record<string, string>) =>
    callApi<QuestionsResponse>('m4_questions', vars),
  outputs: (vars: Record<string, string>) =>
    callApi<DirectionsResponse>('m4_outputs', vars),
  peaks: (vars: Record<string, string>) => callApi<DirectionsResponse>('m4_peaks', vars),
}
