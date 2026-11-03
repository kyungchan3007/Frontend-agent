import { useEffect, useState } from 'react';
import { navigate } from './App.jsx';
import { BottomSheet, Button, Pressable, SubjectDot, Toast, Toggle } from './ui/index.js';

const REPEATS = [
  ['none', '안 함'],
  ['daily', '매일'],
  ['weekdays', '평일'],
  ['custom', '요일 선택'],
];

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('api');
  return res.json();
}

const toMin = (t) => {
  const [h, m] = (t || '').split(':').map(Number);
  return h * 60 + m;
};

function label(t) {
  const [h, m] = t.split(':').map(Number);
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${h < 12 ? '오전' : '오후'} ${hh}:${String(m).padStart(2, '0')}`;
}

function duration(start, end) {
  const d = toMin(end) - toMin(start);
  const h = Math.floor(d / 60);
  const m = d % 60;
  return h && m ? `${h}시간 ${m}분` : h ? `${h}시간` : `${m}분`;
}

export default function PlanSheet() {
  const [subjects, setSubjects] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subjectId, setSubjectId] = useState(null);
  const [picking, setPicking] = useState(false);
  const [start, setStart] = useState('19:00');
  const [end, setEnd] = useState('21:00');
  const [repeat, setRepeat] = useState('weekdays');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let alive = true;
    get('/api/v2/subjects')
      .then((d) => {
        if (!alive) return;
        const list = (d.subjects || [])
          .filter((s) => !s.archived)
          .sort((a, b) => (b.lastUsedAt || '').localeCompare(a.lastUsedAt || ''));
        setSubjects(list);
        setSubjectId((cur) => cur ?? list[0]?.id ?? null);
      })
      .catch(() => {});
    get('/api/v2/plans')
      .then((d) => alive && setPlans(d.plans || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const subject = subjects.find((s) => s.id === subjectId);
  const valid = !!start && !!end && toMin(end) > toMin(start);
  const overlap =
    valid && plans.some((p) => toMin(start) < toMin(p.end) && toMin(p.start) < toMin(end));

  async function save() {
    if (!valid || !subjectId || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/v2/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, start, end, repeat, notify }),
      });
      if (!res.ok) throw new Error('api');
      navigate('/');
    } catch {
      setToast('저장하지 못했어요. 다시 시도해 주세요');
      setBusy(false);
    }
  }

  const timeInput = 'h-9 rounded-sm bg-transparent text-[16px] font-bold text-primary';

  return (
    <>
      <BottomSheet title={picking ? '과목 선택' : '계획 추가'}>
        {picking ? (
          <ul className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
            {subjects.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSubjectId(s.id);
                    setPicking(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${
                    s.id === subjectId ? 'border border-brand bg-brand-soft' : 'border border-transparent bg-canvas'
                  }`}
                >
                  <SubjectDot color={s.color} />
                  <span className="text-[16px] font-bold text-primary">{s.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <Pressable onClick={() => setPicking(true)} className="mb-4 flex h-11 w-full items-center justify-between px-3">
              <span className="text-[14px] font-bold text-primary">과목</span>
              <span className="flex items-center gap-1.5 text-[13px] text-secondary">
                {subject && <SubjectDot color={subject.color} />}
                {subject ? `${subject.name} · ${subject.standardSubject}` : '과목 선택'} ›
              </span>
            </Pressable>

            <div className="mb-4 rounded-lg bg-canvas px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-secondary">시간</span>
                <span className="flex items-center gap-2">
                  <input type="time" aria-label="시작" value={start} onChange={(e) => setStart(e.target.value)} className={timeInput} />
                  <span aria-hidden>→</span>
                  <input type="time" aria-label="종료" value={end} onChange={(e) => setEnd(e.target.value)} className={timeInput} />
                </span>
              </div>
              {valid && (
                <p className="mt-1 text-right text-[13px] font-bold text-primary">
                  {label(start)} → {label(end)} ({duration(start, end)})
                </p>
              )}
              {!valid && start && end && (
                <p className="mt-1 text-right text-[13px] text-danger-strong">종료는 시작보다 늦어야 해요</p>
              )}
              {overlap && <p className="mt-1 text-right text-[13px] text-caution-strong">겹치는 계획이 있어요</p>}
            </div>

            <p className="mb-2 text-[14px] text-secondary">반복</p>
            <div className="mb-4 flex gap-2">
              {REPEATS.map(([v, text]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={repeat === v}
                  onClick={() => setRepeat(v)}
                  className={`h-10 flex-1 rounded-full text-[13px] font-bold ${
                    repeat === v ? 'bg-brand text-inverse' : 'bg-canvas text-primary'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[14px] text-primary">시작 10분 전 알림</span>
              <Toggle checked={notify} onChange={setNotify} aria-label="시작 10분 전 알림" />
            </div>
            <p className="mb-4 text-[12px] text-caution-strong">⏱ 시작 30분이 지나도 측정하지 않으면 경고 딱지가 쌓여요</p>

            <Button className="w-full" disabled={!valid || !subjectId || busy} onClick={save}>
              저장하기
            </Button>
          </>
        )}
      </BottomSheet>
      {toast && <Toast>{toast}</Toast>}
    </>
  );
}
