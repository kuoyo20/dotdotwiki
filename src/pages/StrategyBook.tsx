import { useState } from 'react'
import { Download, ArrowLeft, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { STAGES } from '@/lib/types'
import { EMOTION_PEAK_STAGES, INDUSTRY_TEMPLATES } from '@/lib/constants'
import { exportStrategyBookPDF } from '@/lib/pdf'

const PDF_ELEMENT_ID = 'strategy-book-pdf'

export function StrategyBook() {
  const m1 = useStore((s) => s.m1_network)
  const m2 = useStore((s) => s.m2_mvp)
  const m3 = useStore((s) => s.m3_empathy)
  const m4 = useStore((s) => s.m4_journey)
  const userName = useStore((s) => s.meta.userName)
  const setUserName = (n: string) =>
    useStore.setState((state) => ({ meta: { ...state.meta, userName: n } }))

  const [exporting, setExporting] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const filledRoles = m3.roles.filter((r) => {
    const e = m3.empathy_maps[r.id]
    return e && (e.pain.trim() || e.gain.trim())
  })

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportStrategyBookPDF(PDF_ELEMENT_ID, userName)
    } catch (e) {
      alert('PDF 匯出失敗:' + (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="px-10 py-10 max-w-[1400px]">
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-ink-secondary hover:text-brand text-sm flex items-center gap-1">
            <ArrowLeft className="size-4" />
            回總覽
          </Link>
          <span className="text-ink-muted">·</span>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="學員姓名(會印在策略書上)"
            className="text-sm border border-line-medium rounded px-3 py-1.5 focus:outline-none focus:border-brand"
          />
        </div>
        <Button onClick={handleExport} disabled={exporting} variant="gold" className="gap-2">
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {exporting ? '產生 PDF 中...' : '下載 PDF (A3 橫式)'}
        </Button>
      </div>

      {/* Printable strategy book */}
      <article
        id={PDF_ELEMENT_ID}
        className="bg-paper-card border border-line-light rounded-lg p-10 shadow-sm space-y-8"
      >
        <header className="border-b-2 border-brand pb-4">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <h1 className="font-serif text-4xl font-bold text-ink-primary">銷售策略書</h1>
              <p className="text-ink-secondary mt-1 text-sm">
                {userName || '(未填學員姓名)'} ·{' '}
                {INDUSTRY_TEMPLATES[m3.industry_template]?.label || '未選產業'} · {today}
              </p>
            </div>
            <div className="font-mono text-xs text-ink-muted">Sales Strategist · Yo Workshop</div>
          </div>
        </header>

        {/* 我是誰 */}
        <section>
          <SectionHeader number="①" title="我是誰" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
            <Card title="人脈三歷重點 (M1)">
              <SubBlock label="經歷主軸">
                {summarizeNetworkAxis([
                  ['下游', m1.career_downstream],
                  ['上游', m1.career_upstream],
                  ['類產業', m1.career_adjacent],
                ])}
              </SubBlock>
              <SubBlock label="學歷主軸">
                {summarizeNetworkAxis([
                  ['學涯', m1.edu_school],
                  ['社團', m1.edu_club],
                  ['進修', m1.edu_training],
                ])}
              </SubBlock>
              <SubBlock label="閱歷關鍵人物">
                <ul className="list-disc list-inside space-y-0.5">
                  {parseList(m1.most_contacted_5).slice(0, 3).map((name, i) => (
                    <li key={`mc-${i}`} className="text-xs">
                      最常聯繫:{name}
                    </li>
                  ))}
                  {parseList(m1.go_to_help_5).slice(0, 2).map((name, i) => (
                    <li key={`gh-${i}`} className="text-xs">
                      求助:{name}
                    </li>
                  ))}
                </ul>
              </SubBlock>
            </Card>

            <Card title="M.V.P 一句話定位 (M2)">
              {m2.positioning_statement.trim() ? (
                <blockquote className="text-base font-serif font-bold text-ink-primary leading-relaxed border-l-4 border-accent-gold pl-3 py-1">
                  {m2.positioning_statement}
                </blockquote>
              ) : (
                <p className="text-sm text-ink-muted italic">尚未生成定位句 — 請回 M2 用 AI 生成。</p>
              )}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <SubBlock label="M 市場">{truncate(m2.market_target, 40)}</SubBlock>
                <SubBlock label="V 感性">{truncate(m2.vision_emotion, 40)}</SubBlock>
                <SubBlock label="P 理性">{truncate(m2.product_rational, 40)}</SubBlock>
              </div>
            </Card>
          </div>
        </section>

        {/* 我要打誰 */}
        <section>
          <SectionHeader number="②" title="我要打誰" />
          <div className="mt-3 space-y-3">
            {filledRoles.length === 0 ? (
              <p className="text-sm text-ink-muted italic">M3 尚未填寫任何角色 — 請回 M3 補。</p>
            ) : (
              <>
                <Card title={`組織關鍵角色 (M3) · ${filledRoles.length} 個角色`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {filledRoles.map((r) => {
                      const e = m3.empathy_maps[r.id]
                      return (
                        <div
                          key={r.id}
                          className="rounded border border-line-light bg-paper p-2"
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <span className="font-serif font-bold text-sm">{r.label}</span>
                            {r.is_keyman && (
                              <span className="text-[9px] font-mono bg-accent-gold text-white px-1 rounded">
                                KEYMAN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-accent-red mb-1">
                            <strong>痛:</strong>
                            {truncate(e.pain, 50) || '—'}
                          </div>
                          <div className="text-[11px] text-accent-green">
                            <strong>爽:</strong>
                            {truncate(e.gain, 50) || '—'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {(m3.analysis.conflicts || m3.analysis.attack_path) && (
                  <Card title="AI 衝突分析 + 攻擊路徑">
                    {m3.analysis.conflicts && (
                      <p className="text-xs text-ink-primary mb-2">
                        <strong className="text-accent-red">衝突:</strong> {m3.analysis.conflicts}
                      </p>
                    )}
                    {m3.analysis.excited_resistant && (
                      <p className="text-xs text-ink-primary mb-2">
                        <strong className="text-accent-gold">興奮 / 抗拒:</strong>{' '}
                        {m3.analysis.excited_resistant}
                      </p>
                    )}
                    {m3.analysis.attack_path && (
                      <p className="text-xs text-ink-primary">
                        <strong className="text-accent-green">攻擊路徑:</strong>{' '}
                        {m3.analysis.attack_path}
                      </p>
                    )}
                  </Card>
                )}
              </>
            )}
          </div>
        </section>

        {/* 我怎麼打 */}
        <section>
          <SectionHeader number="③" title="我怎麼打" />
          <div className="mt-3 space-y-3">
            <Card title="6 階段旅程攻擊計劃 (M4)">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-brand-light/40">
                      {STAGES.map((s) => (
                        <th
                          key={s.id}
                          className="border border-line-light px-2 py-1.5 text-left font-mono text-[10px]"
                        >
                          {s.id} {s.shortLabel}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {STAGES.map((s) => {
                        const stage = m4.stages[s.id]
                        return (
                          <td
                            key={s.id}
                            className="border border-line-light px-2 py-1.5 align-top"
                            style={{ width: `${100 / STAGES.length}%` }}
                          >
                            <div className="text-[10px] font-bold text-brand mb-0.5">問</div>
                            <div className="mb-1.5 leading-snug">
                              {truncate(stage.questions, 60) || '—'}
                            </div>
                            <div className="text-[10px] font-bold text-accent-gold mb-0.5">產出</div>
                            <div className="leading-snug">
                              {truncate(stage.expected_output, 60) || '—'}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="3 個情緒高峰設計">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {(['p1', 'p2', 'p3'] as const).map((k) => {
                  const meta = EMOTION_PEAK_STAGES[k]
                  const stateKey =
                    k === 'p1' ? 'first_impression_60s' : k === 'p2' ? 'nps_peak' : 'peak_end'
                  const v = m4.emotion_peaks[stateKey]
                  return (
                    <div key={k} className="rounded border border-accent-gold/40 bg-accent-gold/5 p-2">
                      <div className="font-serif font-bold text-accent-gold mb-1">
                        ⭐ {meta.label}
                      </div>
                      <div className="leading-relaxed whitespace-pre-wrap">{v.trim() || '—'}</div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </section>

        <footer className="border-t border-line-light pt-3 text-center text-[10px] font-mono text-ink-muted">
          印製日期:{today} · Sales Strategist · Yo Workshop · v0.5
        </footer>
      </article>
    </div>
  )
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-serif text-3xl font-bold text-brand">{number}</span>
      <h2 className="font-serif text-2xl font-bold text-ink-primary">【{title}】</h2>
      <div className="flex-1 border-b border-line-medium ml-2 mb-1" />
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line-light bg-paper p-3">
      <h3 className="font-serif font-bold text-sm text-ink-primary mb-2 pb-1 border-b border-line-light">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SubBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className="text-xs text-ink-primary leading-relaxed">{children}</div>
    </div>
  )
}

function truncate(s: string, n: number): string {
  const trimmed = s.trim()
  if (!trimmed) return ''
  return trimmed.length > n ? trimmed.slice(0, n) + '…' : trimmed
}

function parseList(s: string): string[] {
  return s
    .split(/[\n,、，]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function summarizeNetworkAxis(entries: Array<[string, { existing: string; opportunity: string }]>) {
  const filled = entries.filter(([, c]) => c.existing.trim() || c.opportunity.trim())
  if (filled.length === 0) {
    return <span className="italic text-ink-muted">尚未填寫</span>
  }
  return (
    <ul className="list-none space-y-0.5">
      {filled.map(([sub, c]) => (
        <li key={sub} className="leading-relaxed">
          <strong className="text-brand">{sub}:</strong>{' '}
          {truncate([c.existing, c.opportunity].filter(Boolean).join(' / '), 60)}
        </li>
      ))}
    </ul>
  )
}
