import { useEffect, useState } from 'react';
import { navigate } from './App.jsx';
import { OFFLINE_MSG, api } from './shared/subjects.js';
import { BottomSheet, Button, Chip, Pressable, SubjectDot, Toast, Toggle } from './ui/index.js';

const REPEATS = [
  ['none', '안 함'],
  ['daily', '매일'],
  ['weekdays', '평일'],
  ['custom', '요일 선택'],
];

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

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

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api('GET', '/subjects')
      .then((r) => {
        const list = (r.data.subjects ?? []).filter((s) => !s.archived);
        list.sort((a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? ''));
        setSubjects(list);
        setSubjectId((cur) => cur ?? list[0]?.id ?? null);
      })
      .catch(() => flash(OFFLINE_MSG));
    api('GET', '/plans')
      .then((r) => setPlans(r.data.plans ?? []))
      .catch(() => flash(OFFLINE_MSG));
  }, []);

  const subject = subjects.find((s) => s.id === subjectId);
  const valid = !!start && !!end && toMin(end) > toMin(start);
  const overlap =
    valid && plans.some((p) => toMin(p.start) < toMin(end) && toMin(start) < toMin(p.end));

  const save = async () => {
    if (!valid || !subjectId || busy) return;
    setBusy(true);
    try {
      const r = await api('POST', '/plans', { subjectId, start, end, repeat, notify });
      if (r.ok) navigate('/');
      else flash(OFFLINE_MSG);
    } catch {
      flash(OFFLINE_MSG);
    } finally {
      setBusy(false);
    }
  };

  const timeCls = 'rounded-md bg-transparent text-[16px] font-bold text-primary';

  return (
    <>
      {toast && (
        <div className="absolute inset-x-0 top-12 z-20">
          <Toast>{toast}</Toast>
        </div>
      )}
      {picking ? (
        <BottomSheet title="무엇을 공부할까요?">
          <ul className="mb-3 flex max-h-[360px] flex-col gap-2 overflow-y-auto">
            {subjects.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={subjectId === s.id}
                  onClick={() => {
                    setSubjectId(s.id);
                    setPicking(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left ${
                    subjectId === s.id ? 'border-brand bg-brand-soft' : 'border-transparent bg-surface'
                  }`}
                >
                  <SubjectDot color={s.color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-bold text-primary">{s.name}</span>
                    <span className="block text-[12px] text-secondary">표준 과목 · {s.standardSubject}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </BottomSheet>
      ) : (
        <BottomSheet title="계획 추가">
          <Pressable onClick={() => setPicking(true)} className="mb-4 flex w-full items-center justify-between px-2 py-2">
            <span className="text-[15px] font-bold text-primary">과목</span>
            <span className="flex items-center gap-1 text-[14px] text-secondary">
              {subject && <SubjectDot color={subject.color} />}
              {subject ? `${subject.name} · ${subject.standardSubject}` : '과목 선택'} ›
            </span>
          </Pressable>

          <div className="mb-1 flex items-center justify-between rounded-lg bg-canvas px-4 py-3">
            <span className="text-[14px] text-secondary">시간</span>
            <span className="flex items-center gap-1">
              <input type="time" aria-label="시작" value={start} onChange={(e) => setStart(e.target.value)} className={timeCls} />
              <span aria-hidden="true">→</span>
              <input type="time" aria-label="종료" value={end} onChange={(e) => setEnd(e.target.value)} className={timeCls} />
              {valid && <span className="text-[14px] font-bold text-primary">({duration(start, end)})</span>}
            </span>
          </div>
          {overlap && <p className="mb-1 text-[13px] text-caution-strong">겹치는 계획이 있어요</p>}
          {!valid && <p className="mb-1 text-[13px] text-danger-strong">종료는 시작보다 늦어야 해요</p>}

          <p className="mt-3 mb-2 text-[14px] text-secondary">반복</p>
          <div className="mb-4 flex gap-2">
            {REPEATS.map(([v, label]) => (
              <Chip key={v} selected={repeat === v} onClick={() => setRepeat(v)} className="h-10 flex-1 justify-center">
                {label}
              </Chip>
            ))}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <span className="text-[15px] text-primary">시작 10분 전 알림</span>
            <Toggle checked={notify} onChange={setNotify} aria-label="시작 10분 전 알림" />
          </div>
          <p className="mb-4 text-[12px] text-caution-strong">⏱ 시작 30분이 지나도 측정하지 않으면 경고 딱지가 쌓여요</p>

          <Button className="w-full" disabled={!valid || !subjectId || busy} onClick={save}>
            저장하기
          </Button>
        </BottomSheet>
      )}
    </>
  );
}
