import { useEffect, useState } from 'react';
import SubjectSheet from './SubjectSheet.jsx';

export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function Home() {
  return (
    <div className="relative h-[844px] w-[390px] overflow-hidden bg-canvas text-primary">
      <div className="flex h-[47px] items-end px-7 text-[15px] font-bold">9:41</div>
      <h1 className="px-6 pt-2 text-[22px] font-bold">홈</h1>
      <SubjectSheet />
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  if (path.startsWith('/timer/')) return <h1>측정 중 {path.split('/')[2]}</h1>;
  if (path === '/subjects') return <h1>과목 관리</h1>;
  return <Home />;
}
