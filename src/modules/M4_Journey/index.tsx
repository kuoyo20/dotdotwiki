import { JourneyGrid } from './JourneyGrid'
import { EmotionCurve } from './EmotionCurve'
import { AIPeaksTrigger } from './AIPeaksTrigger'
import { useStore } from '@/store/useStore'
import { Badge } from '@/components/ui/badge'
import { EMOTION_PEAK_STAGES } from '@/lib/constants'

export function M4Journey() {
  const m4Progress = useStore((s) => s.getM4Completion())
  const peaks = useStore((s) => s.m4_journey.emotion_peaks)
  const setEmotionPeak = useStore((s) => s.setEmotionPeak)

  return (
    <div className="px-10 py-10 min-w-[1280px]">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-xs text-ink-muted">④</span>
          <h1 className="font-serif text-3xl font-bold text-ink-primary">6×5 客戶旅程地圖</h1>
          <Badge variant="secondary" className="ml-2">
            {m4Progress.filled}/{m4Progress.total} 已填
          </Badge>
        </div>
        <p className="text-ink-secondary max-w-3xl">
          在客戶經營旅程的 6 個階段,規劃你各要問什麼引導問題、預期對方產出什麼答案,並設計 3 個情緒高峰點。
          填空格自動儲存,重新整理也不會掉。每個 L3/L4 格子右下有 AI 助攻。
        </p>
      </header>

      <JourneyGrid />

      <section className="mt-12">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <div>
            <h2 className="font-serif text-xl font-bold text-ink-primary">情緒曲線</h2>
            <p className="text-sm text-ink-secondary">
              依峰終定律與 N.P.S 框架,3 個高峰點分別落在拜訪 / 提案 / 成交階段。
            </p>
          </div>
          <AIPeaksTrigger />
        </div>

        <EmotionCurve />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['p1', 'p2', 'p3'] as const).map((k) => {
            const meta = EMOTION_PEAK_STAGES[k]
            const stateKey =
              k === 'p1' ? 'first_impression_60s' : k === 'p2' ? 'nps_peak' : 'peak_end'
            return (
              <div key={k} className="rounded-md border border-line-light bg-paper-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-accent-gold text-sm">⭐</span>
                  <h3 className="font-serif font-bold text-ink-primary text-sm">{meta.label}</h3>
                  <span className="ml-auto font-mono text-[10px] text-ink-muted">
                    {meta.stage}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={peaks[stateKey]}
                  onChange={(e) => setEmotionPeak(stateKey, e.target.value)}
                  placeholder={`${meta.sublabel}怎麼設計?`}
                  className="w-full text-sm bg-transparent border border-line-light rounded p-2 resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-ink-muted/60"
                />
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
