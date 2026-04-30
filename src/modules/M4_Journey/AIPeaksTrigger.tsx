import { useCallback, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { ai, type DirectionsResponse } from '@/lib/ai'
import { useAI } from '@/lib/useAI'
import { useStore } from '@/store/useStore'
import { STAGES } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { AIDirectionCard } from '@/components/AIDirectionCard'
import { AISuggestionsDialog } from './AISuggestionsDialog'

const PEAK_LABEL_TO_KEY: Record<string, 'first_impression_60s' | 'nps_peak' | 'peak_end'> = {
  '60 秒第一印象': 'first_impression_60s',
  創造高峰: 'nps_peak',
  峰終留念: 'peak_end',
}

export function AIPeaksTrigger() {
  const setEmotionPeak = useStore((s) => s.setEmotionPeak)
  const stages = useStore((s) => s.m4_journey.stages)
  const peaks = useStore((s) => s.m4_journey.emotion_peaks)

  const [open, setOpen] = useState(false)

  const stagesSummary = STAGES.map((s) => {
    const stage = stages[s.id]
    if (!stage.questions && !stage.expected_output) return ''
    return `[${s.label}] 問:${stage.questions || '—'} / 預期:${stage.expected_output || '—'}`
  })
    .filter(Boolean)
    .join('\n')

  const fetcher = useCallback(
    () =>
      ai.peaks({
        m2_mvp_summary: '',
        m3_industry: '',
        m4_stages_summary: stagesSummary || '(學員尚未填寫旅程內容)',
      }),
    [stagesSummary],
  )
  const { status, data, error, run, reset } = useAI<DirectionsResponse>(fetcher)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const applyAll = () => {
    if (!data) return
    for (const d of data.directions) {
      const key = PEAK_LABEL_TO_KEY[d.label]
      if (key) {
        setEmotionPeak(key, `${d.summary}\n→ ${d.next_step}`)
      }
    }
    setOpen(false)
  }

  return (
    <>
      <Button variant="gold" onClick={() => setOpen(true)} className="gap-2">
        <Sparkles className="size-4" />
        三個情緒高峰設計
      </Button>

      <AISuggestionsDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="情緒高峰設計建議"
        description="依峰終定律 + N.P.S 框架,3 個高峰點(60 秒第一印象 / 創造高峰 / 峰終留念)。"
        status={status}
        error={error}
        onRun={run}
        skeletonCount={3}
      >
        {data && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.directions.map((d, i) => (
                <AIDirectionCard key={i} direction={d} index={i} compact />
              ))}
            </div>

            {Object.values(peaks).some(Boolean) && (
              <div className="text-xs text-accent-red border-l-2 border-accent-red pl-2">
                ⚠️ 套用會覆蓋你已有的 3 個高峰文字。
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-line-light">
              <span className="text-xs text-ink-muted">不滿意?重新生成。</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={run}>
                  重新生成
                </Button>
                <Button size="sm" variant="default" onClick={applyAll}>
                  套用 3 個高峰
                </Button>
              </div>
            </div>
          </div>
        )}
      </AISuggestionsDialog>
    </>
  )
}
