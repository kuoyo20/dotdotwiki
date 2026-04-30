import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { callAnthropic, type AIRequestBody } from './api/_anthropic'

// loadEnv lets process.env shadow the .env file. Some shells (Claude Code,
// CI runners) export ANTHROPIC_API_KEY="" to defend against accidental
// leakage — that empty string then wins over our local .env. Read .env
// directly so the file is always authoritative for dev.
function readEnvFile(envDir: string, key: string): string {
  const p = path.join(envDir, '.env')
  if (!fs.existsSync(p)) return ''
  const content = fs.readFileSync(p, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    if (trimmed.slice(0, eq).trim() !== key) continue
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    return value
  }
  return ''
}

function aiDevApi(apiKey: string): Plugin {
  return {
    name: 'sales-strategist:dev-api',
    configureServer(server) {
      const handler: Connect.NextHandleFunction = async (req, res, next) => {
        if (!req.url?.startsWith('/api/ai')) return next()
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }))
          return
        }

        try {
          let raw = ''
          for await (const chunk of req) raw += chunk
          const body = (raw ? JSON.parse(raw) : {}) as AIRequestBody
          const result = await callAnthropic(body, apiKey)
          const status = result.ok ? 200 : result.error.startsWith('anthropic_') ? 502 : 400
          res.statusCode = status
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (e) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(
            JSON.stringify({ ok: false, error: 'dev_middleware_crashed', detail: (e as Error).message }),
          )
        }
      }
      server.middlewares.use(handler)
    },
  }
}

export default defineConfig(({ mode }) => {
  const cwd = process.cwd()
  const env = loadEnv(mode, cwd, '')
  // Prefer .env file value over process.env to defeat empty-string shadowing.
  const apiKey = readEnvFile(cwd, 'ANTHROPIC_API_KEY') || env.ANTHROPIC_API_KEY || ''

  return {
    plugins: [react(), aiDevApi(apiKey)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      open: false,
    },
  }
})
