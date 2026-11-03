import { useEffect, useState } from 'react';
import { navigate } from './App.jsx';
import { BottomSheet, Button, Chip, ColorPicker, OfflineBanner, Pressable, SubjectDot, TextField, Toast } from './ui/index.js';

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
    <>
      <BottomSheet title={form ? '새 과목 추가' : '무엇을 공부할까요?'}>
        {form ? (
          <div>
            <label htmlFor="subject-name" className="block text-[13px] font-medium text-secondary">과목 이름</label>
            <div className="mt-2">
              <TextField
                id="subject-name"
                value={name}
                error={message}
                onChange={(v) => { setName(v); setError(null); }}
                trailing={tooLong && <span className="text-[12px] text-secondary">{name.length}/{NAME_MAX}</span>}
              />
            </div>
            <p className="mt-4 text-[12px] font-bold text-secondary">표준 과목</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STANDARD.map((s) => <Chip key={s} selected={standard === s} onClick={() => setStandard(s)}>{s}</Chip>)}
            </div>
            <p className="mt-4 text-[12px] font-bold text-secondary">색</p>
            <div className="mt-2"><ColorPicker value={color} onChange={setColor} /></div>
            <Button className="mt-5 w-full" disabled={!name || Boolean(message)} onClick={submit}>추가하기</Button>
          </div>
        ) : (
          <div>
            <Pressable onClick={() => navigate('/subjects')} className="text-[12px] text-secondary">과목 관리 ›</Pressable>
            {subjects.length === 0 ? (
              <div className="mt-4">
                <p className="text-[15px] font-bold text-primary">아직 과목이 없어요</p>
                <p className="mt-1 text-[12px] text-secondary">표준 과목을 누르면 바로 측정을 시작해요</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {STANDARD.map((s) => <Chip key={s} onClick={() => pickChip(s)}>{s}</Chip>)}
                </div>
              </div>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {subjects.map((s) => (
                  <li key={s.id}>
                    <Pressable
                      aria-pressed={s.id === picked}
                      onClick={() => setPicked(s.id)}
                      className={`flex h-[63px] w-full items-center rounded-lg border-2 px-4 ${
                        s.id === picked ? 'border-brand bg-brand-soft' : 'border-transparent bg-canvas'
                      }`}
                    >
                      <SubjectDot color={s.color} className="mr-3" />
                      <span className="flex-1">
                        <span className="block text-[15px] font-bold text-primary">{s.name}</span>
                        <span className="block text-[11px] font-medium text-secondary">표준 과목 · {s.standardSubject}</span>
                      </span>
                      <span className={`text-[12px] font-bold ${s.id === picked ? 'text-brand' : 'text-secondary'}`}>오늘 {clock(s.todaySeconds)}</span>
                    </Pressable>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="ghost" size="M" className="mt-3 w-full" onClick={() => setForm(true)}>＋ 새 과목 추가</Button>
            {subjects.length > 0 && (
              <Button className="mt-3 w-full" onClick={start}>
                {session ? '이 과목으로 바꾸기' : `${current?.name} 측정 시작`}
              </Button>
            )}
          </div>
        )}
      </BottomSheet>
      {!online && (
        <div className="absolute inset-x-0 top-[47px]"><OfflineBanner>인터넷 연결이 없어요 · 측정은 연결되면 이어져요</OfflineBanner></div>
      )}
      {toast && <div className="absolute inset-x-0 top-[110px]"><Toast>{OFFLINE}</Toast></div>}
    </>
  );
}
