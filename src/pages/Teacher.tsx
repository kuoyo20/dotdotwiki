import { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw, Users } from 'lucide-react'
import {
  fetchAllStudentProgress,
  isSupabaseEnabled,
  type StudentProgressRow,
} from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const MOCK_ROWS: StudentProgressRow[] = [
  {
    pin: '01',
    display_name: '小明',
    m1_filled: 7,
    m1_total: 9,
    m2_filled: 5,
    m2_total: 5,
    m3_filled: 2,
    m3_total: 3,
    m4_filled: 10,
    m4_total: 12,
    last_saved: new Date().toISOString(),
  },
  {
    pin: '02',
    display_name: '小華',
    m1_filled: 5,
    m1_total: 9,
    m2_filled: 4,
    m2_total: 5,
    m3_filled: 1,
    m3_total: 3,
    m4_filled: 6,
    m4_total: 12,
    last_saved: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    pin: '03',
    display_name: '小美',
    m1_filled: 2,
    m1_total: 9,
    m2_filled: 1,
    m2_total: 5,
    m3_filled: 0,
    m3_total: 3,
    m4_filled: 0,
    m4_total: 12,
    last_saved: new Date(Date.now() - 30 * 60_000).toISOString(),
  },
]

export function Teacher() {
  const enabled = isSupabaseEnabled()
  const [rows, setRows] = useState<StudentProgressRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMock = !enabled

  const load = async () => {
    if (!enabled) {
      setRows(MOCK_ROWS)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllStudentProgress()
      setRows(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    if (!enabled) return
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  const totalRows = rows.length
  const allDoneCount = rows.filter(
    (r) =>
      r.m1_filled >= r.m1_total &&
      r.m2_filled >= r.m2_total &&
      r.m4_filled >= r.m4_total,
  ).length
  const stuckCount = rows.filter(
    (r) => r.m1_filled + r.m2_filled + r.m4_filled === 0,
  ).length

  return (
    <div className="px-10 py-10 max-w-6xl">
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="size-5 text-brand" />
            <h1 className="font-serif text-3xl font-bold text-ink-primary">老師端 · 班級進度</h1>
            {isMock && (
              <Badge variant="warn" className="text-[10px]">
                MOCK 資料
              </Badge>
            )}
          </div>
          <p className="text-sm text-ink-secondary">
            {isMock
              ? '尚未連上 Supabase — 顯示示範資料。請參照 README §Phase 6 啟用真實同步。'
              : `${totalRows} 位學員 · ${allDoneCount} 全部完成 · ${stuckCount} 還沒開始 · 30 秒自動刷新`}
          </p>
        </div>
        {!isMock && (
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            重新整理
          </Button>
        )}
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-accent-red/30 bg-accent-red/5 p-3 text-sm flex items-start gap-2">
          <AlertCircle className="size-4 text-accent-red shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-accent-red">Supabase 連線失敗</div>
            <div className="text-xs text-ink-secondary font-mono">{error}</div>
          </div>
        </div>
      )}

      {isMock && (
        <div className="mb-6 rounded-md border border-accent-gold/40 bg-accent-gold/5 p-4">
          <div className="font-serif font-bold text-sm text-ink-primary mb-2">
            🛠️ 啟用真實老師端的步驟
          </div>
          <ol className="list-decimal list-inside text-sm text-ink-secondary space-y-1">
            <li>建立 Supabase 專案(或用既有的 Brand OS 專案)</li>
            <li>跑 <code className="text-xs bg-paper-card px-1 rounded">migrations/0001_initial.sql</code></li>
            <li>
              在 <code className="text-xs bg-paper-card px-1 rounded">.env</code> 加:
              <pre className="text-xs bg-paper-card border border-line-light rounded p-2 mt-1 overflow-x-auto">{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...`}</pre>
            </li>
            <li>重啟 dev server,本頁就會顯示真實學員進度</li>
          </ol>
        </div>
      )}

      <div className="rounded-lg border border-line-light bg-paper-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-light/40 border-b border-line-light">
              <th className="text-left px-3 py-2 font-mono text-xs text-brand">PIN</th>
              <th className="text-left px-3 py-2 font-mono text-xs text-brand">姓名</th>
              <th className="text-center px-2 py-2 font-mono text-xs text-brand">M1 人脈</th>
              <th className="text-center px-2 py-2 font-mono text-xs text-brand">M2 M.V.P</th>
              <th className="text-center px-2 py-2 font-mono text-xs text-brand">M3 同理心</th>
              <th className="text-center px-2 py-2 font-mono text-xs text-brand">M4 旅程</th>
              <th className="text-right px-3 py-2 font-mono text-xs text-brand">最後儲存</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-ink-muted text-sm">
                  {loading ? '載入中…' : '尚無學員資料'}
                </td>
              </tr>
            ) : (
              rows.map((r) => <Row key={r.pin} row={r} />)
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-muted font-mono">
        Sales Strategist · v0.6 teacher dashboard · {new Date().toISOString().slice(0, 10)}
      </p>
    </div>
  )
}

function Row({ row }: { row: StudentProgressRow }) {
  const lastSaved = row.last_saved
    ? formatRelativeTime(new Date(row.last_saved))
    : '—'
  return (
    <tr className="border-b border-line-light hover:bg-brand-light/20">
      <td className="px-3 py-2 font-mono text-xs text-ink-muted">{row.pin}</td>
      <td className="px-3 py-2 text-ink-primary font-medium">
        {row.display_name || <span className="text-ink-muted italic">未填</span>}
      </td>
      <ProgressCell filled={row.m1_filled} total={row.m1_total} />
      <ProgressCell filled={row.m2_filled} total={row.m2_total} />
      <ProgressCell filled={row.m3_filled} total={row.m3_total} />
      <ProgressCell filled={row.m4_filled} total={row.m4_total} />
      <td className="px-3 py-2 text-right text-xs text-ink-muted font-mono">{lastSaved}</td>
    </tr>
  )
}

function ProgressCell({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
  const tone =
    pct === 0 ? 'bg-line-light' : pct < 50 ? 'bg-accent-gold' : pct < 100 ? 'bg-brand' : 'bg-accent-green'
  return (
    <td className="px-2 py-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-line-light rounded-full overflow-hidden">
          <div className={cn('h-full transition-all', tone)} style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-[10px] text-ink-muted tabular-nums w-10 text-right">
          {filled}/{total}
        </span>
      </div>
    </td>
  )
}

function formatRelativeTime(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return `${sec} 秒前`
  if (sec < 3600) return `${Math.floor(sec / 60)} 分前`
  if (sec < 86400) return `${Math.floor(sec / 3600)} 小時前`
  return d.toISOString().slice(0, 10)
}
