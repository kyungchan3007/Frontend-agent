import { useEffect, useState } from 'react';
import { navigate } from './App.jsx';
import { BottomSheet, Button, Chip, OfflineBanner, Pressable, SubjectDot, Toast, Toggle } from './ui/index.js';
import { apiGet, apiPost, formatToday, MESSAGES, useOnline, useSubjects } from './shared';

const REPEATS = [
  ['none', '안 함'],
  ['daily', '매일'],
  ['weekdays', '평일'],
  ['custom', '요일 선택'],
];

const toMin = (t) => {
  const [h, m] = String(t || '').split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
};

function label(t) {
  const m = toMin(t);
  if (Number.isNaN(m)) return '';
  const h = Math.floor(m / 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m % 60).padStart(2, '0')}`;
}

function summary(start, end) {
  const s = toMin(start);
  const e = toMin(end);
  if (Number.isNaN(s) || Number.isNaN(e)) return '';
  const ampm = Math.floor(s / 60) < 12 ? '오전' : '오후';
  let text = `${ampm} ${label(start)} → ${label(end)}`;
  if (e > s) {
    const d = e - s;
    const h = Math.floor(d / 60);
    const m = d % 60;
    text += ` (${h ? `${h}시간` : ''}${h && m ? ' ' : ''}${m ? `${m}분` : ''})`;
  }
  return text;
}

export default function PlanSheet() {
  const online = useOnline();
  const { subjects } = useSubjects();
  const [plans, setPlans] = useState([]);
  const [subjectId, setSubjectId] = useState(null);
  const [picking, setPicking] = useState(false);
  const [start, setStart] = useState('19:00');
  const [end, setEnd] = useState('21:00');
  const [repeat, setRepeat] = useState('weekdays');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(online ? null : MESSAGES.offline);

  useEffect(() => {
    apiGet('/plans')
      .then(({ data }) => setPlans(data?.plans ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!online) setToast(MESSAGES.offline);
  }, [online]);

  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0] ?? null;

  const s = toMin(start);
  const e = toMin(end);
  const invalid = Number.isNaN(s) || Number.isNaN(e) || e <= s;
  const overlap = !invalid && plans.some((p) => toMin(p.start) < e && s < toMin(p.end));
  const canSave = !invalid && !!subject && !busy;

  async function save() {
    if (!canSave) return;
    if (!online) return setToast(MESSAGES.offline);
    setBusy(true);
    try {
      const { status } = await apiPost('/plans', { subjectId: subject.id, start, end, repeat, notify });
      if (status === 201) {
        navigate('/');
        return;
      }
    } catch {
      setToast(MESSAGES.offline);
    }
    setBusy(false);
  }

  const timeInput = 'w-[84px] bg-transparent text-[16px] font-bold text-primary';

  return (
    <div className="absolute inset-0 leading-[1.4] tracking-[-0.01em]">
      {!online && (
        <div className="absolute inset-x-0 top-0 z-10">
          <OfflineBanner>인터넷 연결이 없어요</OfflineBanner>
        </div>
      )}
      {toast && online && <Toast>{toast}</Toast>}
      <BottomSheet title={picking ? '과목 선택' : '계획 추가'}>
        {picking ? (
          <ul className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
            {subjects.map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  aria-pressed={subject?.id === x.id}
                  onClick={() => {
                    setSubjectId(x.id);
                    setPicking(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${
                    subject?.id === x.id ? 'border border-brand bg-brand-soft' : 'border border-transparent bg-canvas'
                  }`}
                >
                  <SubjectDot color={x.color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-bold text-primary">{x.name}</span>
                    <span className="block text-[12px] text-secondary">표준 과목 · {x.standardSubject}</span>
                  </span>
                  <span className="text-[13px] font-bold text-secondary">오늘 {formatToday(x.todaySeconds)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <Pressable onClick={() => setPicking(true)} className="flex w-full items-center justify-between px-2 py-3">
              <span className="text-[14px] font-bold text-primary">과목</span>
              <span className="flex items-center gap-1 text-[13px] text-secondary">
                {subject && <SubjectDot color={subject.color} />}
                {subject ? `${subject.name} · ${subject.standardSubject}` : '과목 선택'} ›
              </span>
            </Pressable>

            <div className="mt-3 rounded-lg bg-canvas px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-secondary">시간</span>
                <span className="text-[16px] font-bold text-primary">{summary(start, end)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input type="time" step={600} aria-label="시작" value={start} onChange={(ev) => setStart(ev.target.value)} className={timeInput} />
                <span className="text-secondary">→</span>
                <input type="time" step={600} aria-label="종료" value={end} onChange={(ev) => setEnd(ev.target.value)} className={timeInput} />
              </div>
              {overlap && <p className="mt-2 text-[13px] text-caution-strong">겹치는 계획이 있어요</p>}
              {!invalid ? null : (
                <p className="mt-2 text-[13px] text-danger-strong">종료는 시작보다 늦어야 해요</p>
              )}
            </div>

            <p className="mt-4 mb-2 text-[13px] text-secondary">반복</p>
            <div className="flex flex-wrap gap-2">
              {REPEATS.map(([v, t]) => (
                <Chip key={v} selected={repeat === v} onClick={() => setRepeat(v)}>
                  {t}
                </Chip>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[14px] font-bold text-primary">시작 10분 전 알림</span>
              <Toggle checked={notify} onChange={setNotify} aria-label="시작 10분 전 알림" />
            </div>

            <p className="mt-3 text-[12px] text-caution-strong">⏱ 시작 30분이 지나도 측정하지 않으면 경고 딱지가 쌓여요</p>

            <Button className="mt-4 w-full" disabled={!canSave} onClick={save}>
              저장하기
            </Button>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
