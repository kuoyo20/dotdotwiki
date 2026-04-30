import { useCallback, useState } from 'react'
import { ai, type AIDirection, type DirectionsResponse } from '@/lib/ai'
import { useAI } from '@/lib/useAI'
import { useStore } from '@/store/useStore'
import { STAGES, type StageId } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { AIDirectionCard } from '@/components/AIDirectionCard'
import { AISuggestionsDialog, AITrigger } from './AISuggestionsDialog'

interface Props {
  stageId: StageId
}

export function AIOutputsTrigger({ stageId }: Props) {
  const stage = STAGES.find((s) => s.id === stageId)!
  const setField = useStore((s) => s.setM4Field)
  const questions = useStore((s) => s.m4_journey.stages[stageId].questions)
  const currentValue = useStore((s) => s.m4_journey.stages[stageId].expected_output)

  const [open, setOpen] = useState(false)
  const fetcher = useCallback(
    () =>
      ai.outputs({
        stage_label: stage.label,
        questions: questions || '(學員尚未填引導問題)',
      }),
    [stage.label, questions],
  )
  const { status, data, error, run, reset } = useAI<DirectionsResponse>(fetcher)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const apply = (d: AIDirection) => {
    const formatted = `【${d.label}】${d.summary}\n→ 下一步:${d.next_step}`
    const next = currentValue.trim() ? currentValue.trim() + '\n\n' + formatted : formatted
    setField(stageId, 'expected_output', next)
    setOpen(false)
  }

  return (
    <>
      <AITrigger label="預期產出" onClick={() => setOpen(true)} />
      <AISuggestionsDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={`${stage.label} · 三個預期產出方向`}
        description="如果我這樣問,我預期對方會說出什麼?選一個寫進 L4 欄位。"
        status={status}
        error={error}
        onRun={run}
        skeletonCount={3}
      >
        {data && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.directions.map((d, i) => (
                <AIDirectionCard
                  key={i}
                  direction={d}
                  index={i}
                  onApply={apply}
                  applyLabel="寫進 L4"
                />
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-line-light">
              <span className="text-xs text-ink-muted">三方向都不對?重新生成。</span>
              <Button size="sm" variant="outline" onClick={run}>
                重新生成
              </Button>
            </div>
          </div>
        )}
      </AISuggestionsDialog>
    </>
  )
}
