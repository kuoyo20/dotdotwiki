import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar, type ProgressMap } from './Sidebar'
import { ResetDialog } from './ResetDialog'
import { useStore } from '@/store/useStore'

export function Layout() {
  const navigate = useNavigate()
  const m1Progress = useStore((s) => s.getM1Completion())
  const m2Progress = useStore((s) => s.getM2Completion())
  const m3Progress = useStore((s) => s.getM3Completion())
  const m4Progress = useStore((s) => s.getM4Completion())
  const reset = useStore((s) => s.reset)
  const [resetOpen, setResetOpen] = useState(false)

  const progress: ProgressMap = {
    m1: m1Progress,
    m2: m2Progress,
    m3: m3Progress,
    m4: m4Progress,
  }

  const handleExport = () => {
    navigate('/strategy-book')
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar
        progress={progress}
        onExport={handleExport}
        onReset={() => setResetOpen(true)}
      />
      <main className="flex-1 min-w-0 overflow-x-auto">
        <Outlet />
      </main>
      <ResetDialog open={resetOpen} onOpenChange={setResetOpen} onConfirm={reset} />
    </div>
  )
}
