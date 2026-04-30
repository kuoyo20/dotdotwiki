// Vercel-style serverless handler. Used by:
//  - Vercel runtime in production (default export)
//  - Vite dev server middleware (re-imported in vite.config.ts)
import { callAnthropic, type AIRequestBody } from './_anthropic'

interface MinimalReq {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
}

interface MinimalRes {
  status: (code: number) => MinimalRes
  json: (body: unknown) => void
  setHeader?: (name: string, value: string) => void
}

export default async function handler(req: MinimalReq, res: MinimalRes) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
  const body = (req.body ?? {}) as AIRequestBody
  const result = await callAnthropic(body, apiKey)
  const status = result.ok ? 200 : result.error.startsWith('anthropic_') ? 502 : 400
  return res.status(status).json(result)
}
