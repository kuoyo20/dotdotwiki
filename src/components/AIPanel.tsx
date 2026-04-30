import { AlertCircle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AIError } from '@/lib/ai'
import type { AIStatus } from '@/lib/useAI'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  status: AIStatus
  error: AIError | null
  onRetry: () => void
  onClose: () => void
  skeletonCount?: number
  children: ReactNode
  className?: string
}

export function AIPanel({
  status,
  error,
  onRetry,
  onClose,
  skeletonCount = 3,
  children,
  className,
}: Props) {
  if (status === 'idle') return null

  return (
    <div
      className={cn(
        'mt-3 rounded-md border border-accent-gold/40 bg-accent-gold/5 p-3',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-accent-gold">⚡ AI 助攻</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="text-xs h-7 px-2 text-ink-muted hover:text-ink-primary"
        >
          收起
        </Button>
      </div>

      {status === 'loading' && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${skeletonCount}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className="rounded-md border border-line-light bg-paper-card p-3 animate-pulse"
            >
              <div className="h-3 w-1/2 bg-line-light rounded mb-2" />
              <div className="h-2 w-full bg-line-light rounded mb-1" />
              <div className="h-2 w-4/5 bg-line-light rounded mb-1" />
              <div className="h-2 w-3/5 bg-line-light rounded" />
            </div>
          ))}
        </div>
      )}

      {status === 'error' && error && (
        <div className="rounded-md border border-accent-red/30 bg-accent-red/5 p-3 text-sm">
          <div className="flex items-start gap-2 text-accent-red mb-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium">AI 呼叫失敗</div>
              <div className="text-xs mt-0.5 font-mono break-all">{error.message}</div>
              {error.detail && (
                <div className="text-xs text-ink-secondary mt-1 break-all">{error.detail}</div>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-1.5">
            <RefreshCw className="size-3" />
            重試
          </Button>
        </div>
      )}

      {status === 'success' && children}
    </div>
  )
}
