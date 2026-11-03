import { useEffect, useState, type ReactNode } from 'react'
import SubjectSheet from './features/subject-sheet/SubjectSheet'
import SubjectManager from './features/subject-manager/SubjectManager'
import PlanSheet from './features/plan-sheet/PlanSheet'

export function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Shell({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="relative h-[844px] w-[390px] overflow-hidden">
      <div className="flex h-[47px] items-end px-7 text-[15px] font-bold">9:41</div>
      {title && <h1 className="px-6 pt-2 text-[22px] font-bold">{title}</h1>}
      {children}
    </div>
  )
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  if (path.startsWith('/timer/')) return <h1>측정 중 {path.split('/')[2]}</h1>
  if (path === '/subjects') return <Shell><SubjectManager /></Shell>
  if (path === '/plan') return <Shell title="플래너"><PlanSheet /></Shell>
  return <Shell title="홈"><SubjectSheet /></Shell>
}
