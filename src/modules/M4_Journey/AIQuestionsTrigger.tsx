import { useCallback, useState } from 'react'
import { ai, type QuestionsResponse } from '@/lib/ai'
import { useAI } from '@/lib/useAI'
import { useStore } from '@/store/useStore'
import { STAGES, type StageId } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { AISuggestionsDialog, AITrigger } from './AISuggestionsDialog'

interface Props {
  stageId: StageId
}

export function AIQuestionsTrigger({ stageId }: Props) {
  const stage = STAGES.find((s) => s.id === stageId)!
  const setField = useStore((s) => s.setM4Field)
  const currentValue = useStore((s) => s.m4_journey.stages[stageId].questions)

  const [open, setOpen] = useState(false)
  const fetcher = useCallback(
    () =>
      ai.questions({
        stage_label: stage.label,
        m2_market: '',
        m2_vision: '',
        m2_product: '',
        m3_industry: '',
        m3_keyman: '',
      }),
    [stage.label],
  )
  const { status, data, error, run, reset } = useAI<QuestionsResponse>(fetcher)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const insertAll = () => {
    if (!data) return
    const formatted = data.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')
    const next = currentValue.trim() ? currentValue.trim() + '\n' + formatted : formatted
    setField(stageId, 'questions', next)
    setOpen(false)
  }

  const insertOne = (q: string) => {
    const formatted = `· ${q}`
    const next = currentValue.trim() ? currentValue.trim() + '\n' + formatted : formatted
    setField(stageId, 'questions', next)
  }

  return (
    <>
      <AITrigger label="五個引導問題" onClick={() => setOpen(true)} />
      <AISuggestionsDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={`${stage.label} · 五個引導問題建議`}
        description="開放式問題,挖痛點 + 推進階段。可全部插入,或挑單個插入。"
        status={status}
        error={error}
        onRun={run}
        skeletonCount={5}
      >
        {data && (
          <div className="space-y-3">
            <ol className="space-y-2">
              {data.questions.map((q, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-md border border-line-light bg-paper-card p-3"
                >
                  <span className="font-mono text-sm text-accent-gold shrink-0">{i + 1}</span>
                  <p className="flex-1 text-sm text-ink-primary leading-relaxed">{q}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => insertOne(q)}
                    className="text-xs shrink-0 h-7"
                  >
                    插入這條
                  </Button>
                </li>
              ))}
            </ol>
            <div className="flex items-center justify-between pt-2 border-t border-line-light">
              <span className="text-xs text-ink-muted">不滿意?點重新生成。</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={run}>
                  重新生成
                </Button>
                <Button size="sm" variant="default" onClick={insertAll}>
                  全部插入到 L3 欄位
                </Button>
              </div>
            </div>
          </div>
        )}
      </AISuggestionsDialog>
    </>
  )
}
