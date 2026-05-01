// Supabase client (feature-flagged). v0.6 上線版才會啟用。
// 環境變數沒設時 isSupabaseEnabled() 回傳 false,前端走純 localStorage 路徑。
//
// 啟用步驟(Phase 6 deployment):
// 1. 建立 Supabase 專案,跑 migrations/0001_initial.sql
// 2. .env 加 VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
// 3. (可選)在 Vercel 設同樣的兩個 env vars
// 4. 重啟 dev server,Teacher dashboard 即可看真實學員進度

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export function isSupabaseEnabled(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export interface StudentProgressRow {
  pin: string
  display_name: string
  m1_filled: number
  m1_total: number
  m2_filled: number
  m2_total: number
  m3_filled: number
  m3_total: number
  m4_filled: number
  m4_total: number
  last_saved: string | null
}

interface SupabaseRestResponse {
  ok: boolean
  status: number
  statusText: string
  body: unknown
}

async function request(path: string, init?: RequestInit): Promise<SupabaseRestResponse> {
  if (!isSupabaseEnabled()) {
    throw new Error('Supabase not configured')
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      ...(init?.headers ?? {}),
    },
  })
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    /* empty */
  }
  return { ok: res.ok, status: res.status, statusText: res.statusText, body }
}

export async function fetchAllStudentProgress(): Promise<StudentProgressRow[]> {
  const r = await request('student_progress?select=*&order=pin.asc')
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${r.statusText}`)
  return (r.body as StudentProgressRow[]) ?? []
}

export async function upsertStudentProgress(row: StudentProgressRow): Promise<void> {
  const r = await request('student_progress?on_conflict=pin', {
    method: 'POST',
    headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row),
  })
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${r.statusText}`)
}
