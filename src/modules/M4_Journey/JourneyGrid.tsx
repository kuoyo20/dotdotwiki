import { STAGES } from '@/lib/types'
import type { StageId } from '@/lib/types'
import { STAGE_BEHAVIORS } from '@/lib/constants'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { AIQuestionsTrigger } from './AIQuestionsTrigger'
import { AIOutputsTrigger } from './AIOutputsTrigger'

const ROW_LABELS: Array<{ key: 'L1' | 'L2' | 'L3' | 'L4'; title: string; sub: string }> = [
  { key: 'L1', title: 'L1 對象', sub: '這階段我面對的是誰' },
  { key: 'L2', title: 'L2 行為', sub: '預填參考行為' },
  { key: 'L3', title: 'L3 引導問題', sub: '⭐ 我要問什麼?' },
  { key: 'L4', title: 'L4 預期產出', sub: '⭐ 我預期對方說什麼?' },
]

export function JourneyGrid() {
  const stages = useStore((s) => s.m4_journey.stages)
  const setField = useStore((s) => s.setM4Field)

  return (
    <div className="rounded-lg border border-line-light bg-paper-card overflow-hidden">
      <div
        className="grid"
        style={{ gridTemplateColumns: '120px repeat(6, minmax(200px, 1fr))' }}
      >
        {/* Header row */}
        <div className="bg-brand-light/40 border-b border-r border-line-light" />
        {STAGES.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'bg-brand-light/40 border-b border-line-light px-3 py-3',
              i < STAGES.length - 1 && 'border-r',
            )}
          >
            <div className="font-mono text-[10px] text-brand uppercase tracking-wider">{s.id}</div>
            <div className="font-serif text-sm font-bold text-ink-primary">{s.label}</div>
          </div>
        ))}

        {ROW_LABELS.map((row) => (
          <RowCells key={row.key} row={row} stages={stages} setField={setField} />
        ))}
      </div>
    </div>
  )
}

interface RowProps {
  row: { key: 'L1' | 'L2' | 'L3' | 'L4'; title: string; sub: string }
  stages: ReturnType<typeof useStore.getState>['m4_journey']['stages']
  setField: ReturnType<typeof useStore.getState>['setM4Field']
}

function RowCells({ row, stages, setField }: RowProps) {
  return (
    <>
      <div className="bg-paper border-b border-r border-line-light px-3 py-3 sticky left-0 z-10">
        <div className="font-serif text-sm font-bold text-ink-primary">{row.title}</div>
        <div className="text-[11px] text-ink-muted mt-0.5 leading-tight">{row.sub}</div>
      </div>
      {STAGES.map((s, i) => {
        const isLast = i === STAGES.length - 1
        const cellClass = cn('border-b border-line-light p-2', !isLast && 'border-r')

        if (row.key === 'L1') {
          return (
            <div key={s.id} className={cellClass}>
              <textarea
                rows={2}
                value={stages[s.id].target}
                onChange={(e) => setField(s.id, 'target', e.target.value)}
                placeholder="這階段對象..."
                className="w-full text-sm bg-transparent border border-line-light rounded p-2 resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-ink-muted/60"
              />
            </div>
          )
        }
        if (row.key === 'L2') {
          return (
            <div key={s.id} className={cn(cellClass, 'bg-brand-light/20')}>
              <ul className="space-y-1 text-xs text-ink-secondary leading-relaxed">
                {STAGE_BEHAVIORS[s.id as StageId].map((b) => (
                  <li key={b} className="flex gap-1.5">
                    <span className="text-brand/60">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        }
        if (row.key === 'L3') {
          return (
            <div key={s.id} className={cellClass}>
              <textarea
                rows={4}
                value={stages[s.id].questions}
                onChange={(e) => setField(s.id, 'questions', e.target.value)}
                placeholder="這階段我要問..."
                className="w-full text-sm bg-transparent border border-line-light rounded p-2 resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-ink-muted/60"
              />
              <div className="mt-1 flex justify-end">
                <AIQuestionsTrigger stageId={s.id} />
              </div>
            </div>
          )
        }
        // L4
        return (
          <div key={s.id} className={cellClass}>
            <textarea
              rows={3}
              value={stages[s.id].expected_output}
              onChange={(e) => setField(s.id, 'expected_output', e.target.value)}
              placeholder="預期對方產出..."
              className="w-full text-sm bg-transparent border border-line-light rounded p-2 resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-ink-muted/60"
            />
            <div className="mt-1 flex justify-end">
              <AIOutputsTrigger stageId={s.id} />
            </div>
          </div>
        )
      })}
    </>
  )
}
