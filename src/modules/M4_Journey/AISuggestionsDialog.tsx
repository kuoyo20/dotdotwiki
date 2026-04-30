import { useEffect, type ReactNode } from 'react'
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { AIStatus } from '@/lib/useAI'
import type { AIError } from '@/lib/ai'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  status: AIStatus
  error: AIError | null
  onRun: () => void
  skeletonCount?: number
  children: ReactNode
}

export function AISuggestionsDialog({
  open,
  onOpenChange,
  title,
  description,
  status,
  error,
  onRun,
  skeletonCount = 3,
  children,
}: Props) {
  useEffect(() => {
    if (open && status === 'idle') {
      onRun()
    }
  }, [open, status, onRun])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent-gold" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {status === 'loading' && (
          <div className="space-y-3 py-2">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                className="rounded-md border border-line-light bg-paper p-3 animate-pulse"
              >
                <div className="h-3 w-1/3 bg-line-light rounded mb-2" />
                <div className="h-2 w-full bg-line-light rounded mb-1" />
                <div className="h-2 w-4/5 bg-line-light rounded" />
              </div>
            ))}
            <div className="text-xs text-ink-muted text-center font-mono">Haiku 4.5 思考中…</div>
          </div>
        )}

        {status === 'error' && error && (
          <div className="rounded-md border border-accent-red/30 bg-accent-red/5 p-4">
            <div className="flex items-start gap-2 text-accent-red mb-3">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">AI 呼叫失敗</div>
                <div className="text-xs mt-0.5 font-mono break-all">{error.message}</div>
                {error.detail && (
                  <details className="text-xs text-ink-secondary mt-2">
                    <summary className="cursor-pointer hover:text-ink-primary">技術細節</summary>
                    <div className="mt-1 break-all">{error.detail}</div>
                  </details>
                )}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={onRun} className="gap-1.5">
              <RefreshCw className="size-3" />
              重試
            </Button>
          </div>
        )}

        {status === 'success' && children}
      </DialogContent>
    </Dialog>
  )
}

interface TriggerProps {
  label: string
  onClick: () => void
  className?: string
}

export function AITrigger({ label, onClick, className }: TriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-accent-gold hover:bg-accent-gold/10 transition-colors font-medium ' +
        (className ?? '')
      }
    >
      <Sparkles className="size-3" />
      {label}
    </button>
  )
}
