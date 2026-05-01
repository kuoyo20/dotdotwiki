import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Overview } from '@/pages/Overview'
import { NotFound } from '@/pages/NotFound'
import { StrategyBook } from '@/pages/StrategyBook'
import { Teacher } from '@/pages/Teacher'
import { M1Network } from '@/modules/M1_Network'
import { M2MVP } from '@/modules/M2_MVP'
import { M3Empathy } from '@/modules/M3_Empathy'
import { M4Journey } from '@/modules/M4_Journey'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="/m1" element={<M1Network />} />
          <Route path="/m2" element={<M2MVP />} />
          <Route path="/m3" element={<M3Empathy />} />
          <Route path="/m4" element={<M4Journey />} />
          <Route path="/strategy-book" element={<StrategyBook />} />
          <Route path="/teacher" element={<Teacher />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
