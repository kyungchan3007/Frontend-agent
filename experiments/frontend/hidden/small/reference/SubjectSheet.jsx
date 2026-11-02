import { useEffect, useState } from 'react';
import { navigate } from './App.jsx';

const COLORS = ['blue', 'cyan', 'amber', 'violet', 'green', 'rose', 'slate'];
const DOT = {
  blue: 'bg-subject-blue', cyan: 'bg-subject-cyan', amber: 'bg-subject-amber', violet: 'bg-subject-violet',
  green: 'bg-subject-green', rose: 'bg-subject-rose', slate: 'bg-subject-slate',
};
const STANDARD = ['국어', '수학', '영어', '한국사', '사회탐구', '과학탐구', '제2외국어', '기타'];
const NAME_MAX = 15;
const SUBJECT_MAX = 20;
const TOO_LONG = '이름은 15자까지 쓸 수 있어요. 조금 줄여 주세요';
const SAME = '같은 이름의 과목이 이미 있어요. 다른 이름을 써 주세요';
const LIMIT = '과목은 20개까지 만들 수 있어요. 안 쓰는 과목은 보관해 주세요';
const OFFLINE = '인터넷 연결을 확인해 주세요';

const clock = (s) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
const post = (url, body) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

function Chip({ label, selected, onClick, large }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-[14px] font-bold ${large ? 'h-[32px] text-[13px]' : 'h-[26px] text-[12px]'} ${
        selected ? 'border-brand-strong bg-brand-strong text-inverse' : 'border-line bg-surface text-secondary'
      }`}
    >
      {label}
    </button>
  );
}

export default function SubjectSheet() {
  const [subjects, setSubjects] = useState(null);
  const [session, setSession] = useState(null);
  const [picked, setPicked] = useState(null);
  const [form, setForm] = useState(false);
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('수학');
  const [color, setColor] = useState('blue');
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(false);
  const online = useOnline();

  useEffect(() => {
    fetch('/api/subjects').then((r) => r.json()).then((d) => {
      const list = d.subjects.filter((s) => !s.archived)
        .sort((a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? ''));
      setSubjects(list);
      setPicked(list[0]?.id ?? null);
    });
    fetch('/api/sessions/current').then((r) => r.json()).then((d) => setSession(d.session));
  }, []);

  const notify = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const startSession = async (subjectId) => {
    const r = await post('/api/sessions', { subjectId });
    const d = await r.json();
    navigate(`/timer/${r.status === 409 ? d.sessionId : d.id}`);
  };

  const start = () => {
    if (!online) return notify();
    startSession(picked);
  };

  const pickChip = async (std) => {
    if (!online) return notify();
    const r = await post('/api/subjects', { name: std, standardSubject: std, color: 'blue' });
    const s = await r.json();
    startSession(s.id);
  };

  const tooLong = name.length > NAME_MAX;
  const message = tooLong ? TOO_LONG : error;

  const submit = async () => {
    if (subjects.some((s) => s.name === name)) return setError(SAME);
    if (subjects.length >= SUBJECT_MAX) return setError(LIMIT);
    const r = await post('/api/subjects', { name, standardSubject: standard, color });
    if (r.status === 409) {
      const d = await r.json();
      return setError(d.code === 'SUBJECT_LIMIT' ? LIMIT : SAME);
    }
    const s = await r.json();
    setSubjects([s, ...subjects]);
    setPicked(s.id);
    setForm(false);
    setName('');
  };

  if (!subjects) return null;
  const current = subjects.find((s) => s.id === picked);

  return (
    <div className="absolute inset-0 bg-dim">
      {!online && (
        <div className="absolute inset-x-0 top-[47px] bg-surface px-6 py-[10px] text-[13px] font-medium text-danger-strong">
          인터넷 연결이 없어요 · 측정은 연결되면 이어져요
        </div>
      )}
      {toast && (
        <div className="absolute inset-x-6 top-[110px] rounded-md bg-primary px-4 py-3 text-[13px] font-bold text-inverse">{OFFLINE}</div>
      )}
      <div className="absolute inset-x-0 bottom-0 rounded-t-[22px] bg-surface px-6 pb-[34px] pt-3">
        <div className="mx-auto mb-3 h-[4px] w-[40px] rounded-full bg-line" />
        {form ? (
          <div>
            <h2 className="text-[17px] font-bold text-primary">새 과목 추가</h2>
            <label htmlFor="subject-name" className="mt-4 block text-[13px] font-medium text-secondary">과목 이름</label>
            <div className={`mt-2 flex h-[48px] items-center rounded-md border-2 px-4 ${message ? 'border-danger' : 'border-line'}`}>
              <input
                id="subject-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                className="min-w-0 flex-1 text-[15px] font-bold text-primary outline-none"
              />
              {name.length > 0 && tooLong && <span className="text-[12px] text-secondary">{name.length}/{NAME_MAX}</span>}
            </div>
            {message && <p className="mt-2 text-[12px] text-danger-strong">{message}</p>}
            <p className="mt-4 text-[12px] font-bold text-secondary">표준 과목</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STANDARD.map((s) => <Chip key={s} label={s} selected={standard === s} onClick={() => setStandard(s)} />)}
            </div>
            <p className="mt-4 text-[12px] font-bold text-secondary">색</p>
            <div className="mt-2 flex gap-5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className={`h-[24px] w-[24px] rounded-full ${DOT[c]} ${color === c ? 'ring-2 ring-brand ring-offset-2' : ''}`}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={!name || Boolean(message)}
              onClick={submit}
              className="mt-5 h-[52px] w-full rounded-lg bg-brand-strong text-[15px] font-bold text-inverse disabled:opacity-40"
            >
              추가하기
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-[17px] font-bold text-primary">무엇을 공부할까요?</h2>
            <button type="button" onClick={() => navigate('/subjects')} className="mt-1 text-[12px] text-secondary">과목 관리 ›</button>
            {subjects.length === 0 ? (
              <div className="mt-4">
                <p className="text-[15px] font-bold text-primary">아직 과목이 없어요</p>
                <p className="mt-1 text-[12px] text-secondary">표준 과목을 누르면 바로 측정을 시작해요</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {STANDARD.map((s) => <Chip key={s} large label={s} onClick={() => pickChip(s)} />)}
                </div>
              </div>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {subjects.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-pressed={s.id === picked}
                      onClick={() => setPicked(s.id)}
                      className={`flex h-[63px] w-full items-center rounded-lg border-2 px-4 text-left ${
                        s.id === picked ? 'border-brand bg-brand-soft' : 'border-transparent bg-canvas'
                      }`}
                    >
                      <span className={`mr-3 h-[12px] w-[12px] rounded-full ${DOT[s.color]}`} />
                      <span className="flex-1">
                        <span className="block text-[15px] font-bold text-primary">{s.name}</span>
                        <span className="block text-[11px] font-medium text-secondary">표준 과목 · {s.standardSubject}</span>
                      </span>
                      <span className={`text-[12px] font-bold ${s.id === picked ? 'text-brand' : 'text-secondary'}`}>오늘 {clock(s.todaySeconds)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setForm(true)}
              className="mt-3 h-[46px] w-full rounded-lg border border-dashed border-line text-[14px] font-bold text-secondary"
            >
              ＋ 새 과목 추가
            </button>
            {subjects.length > 0 && (
              <button type="button" onClick={start} className="mt-3 h-[52px] w-full rounded-lg bg-brand-strong text-[15px] font-bold text-inverse">
                {session ? '이 과목으로 바꾸기' : `${current?.name} 측정 시작`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
