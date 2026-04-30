import { useCallback, useState } from 'react'
import { AIError } from './ai'

export type AIStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseAIResult<T> {
  status: AIStatus
  data: T | null
  error: AIError | null
  run: () => Promise<void>
  reset: () => void
}

export function useAI<T>(fetcher: () => Promise<{ data: T }>): UseAIResult<T> {
  const [status, setStatus] = useState<AIStatus>('idle')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<AIError | null>(null)

  const run = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const result = await fetcher()
      setData(result.data)
      setStatus('success')
    } catch (e) {
      const err =
        e instanceof AIError
          ? e
          : new AIError('client_unknown', (e as Error)?.message, 0)
      setError(err)
      setStatus('error')
    }
  }, [fetcher])

  const reset = useCallback(() => {
    setStatus('idle')
    setData(null)
    setError(null)
  }, [])

  return { status, data, error, run, reset }
}
