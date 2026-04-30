import { ArrowRight } from 'lucide-react'
import type { AIDirection } from '@/lib/ai'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  direction: AIDirection
  index: number
  onApply?: (d: AIDirection) => void
  applyLabel?: string
  compact?: boolean
}

export function AIDirectionCard({ direction, index, onApply, applyLabel = '用這個', compact }: Props) {
  return (
    <article
      className={cn(
        'flex flex-col rounded-md border border-line-light bg-paper-card hover:border-accent-gold/60 transition-colors',
        compact ? 'p-3 gap-2' : 'p-4 gap-3',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="font-mono text-xs text-accent-gold shrink-0 pt-0.5">
          {String.fromCharCode(65 + index)}
        </div>
        <h4 className="font-serif font-bold text-ink-primary leading-tight text-sm">
          {direction.label}
        </h4>
      </div>

      <p className={cn('text-ink-secondary leading-relaxed', compact ? 'text-xs' : 'text-sm')}>
        {direction.summary}
      </p>

      {direction.next_step && (
        <div className="flex items-start gap-1.5 text-xs text-ink-secondary border-t border-line-light pt-2 mt-auto">
          <ArrowRight className="size-3 shrink-0 mt-0.5 text-brand" />
          <span>{direction.next_step}</span>
        </div>
      )}

      {direction.framework_link && (
        <div className="text-[10px] font-mono text-ink-muted">
          ↳ {direction.framework_link}
        </div>
      )}

      {onApply && (
        <Button size="sm" variant="outline" onClick={() => onApply(direction)} className="w-full">
          {applyLabel}
        </Button>
      )}
    </article>
  )
}
