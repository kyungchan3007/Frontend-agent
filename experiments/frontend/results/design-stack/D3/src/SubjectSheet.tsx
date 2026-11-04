import { useEffect, useState } from 'react';
import { navigate } from './App';
import { createSubject, getSubjects } from './api/subjects';
import { getCurrentSession, startSession as postSession } from './api/sessions';
import { NAME_MAX, STANDARD_SUBJECTS as STANDARD, SUBJECT_MAX, activeSubjects, isNameTooLong } from './shared';
import type { Subject } from './types';
import { BottomSheet, Button, Chip, ColorPicker, OfflineBanner, Pressable, SubjectDot, TextField, Toast } from './ui/index.js';

const MESSAGES = {
  tooLong: `이름은 ${NAME_MAX}자까지 쓸 수 있어요. 조금 줄여 주세요`,
  same: '같은 이름의 과목이 이미 있어요. 다른 이름을 써 주세요',
  limit: `과목은 ${SUBJECT_MAX}개까지 만들 수 있어요. 안 쓰는 과목은 보관해 주세요`,
  offline: '인터넷 연결을 확인해 주세요',
};

function formatToday(seconds?: number) {
  const m = Math.floor((seconds || 0) / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

export default function SubjectSheet() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [session, setSession] = useState<unknown>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [form, setForm] = useState(false);
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('수학');
  const [color, setColor] = useState('blue');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const [adding, setAdding] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);

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

  useEffect(() => {
    getSubjects().then(({ data }) => {
      const list = activeSubjects(data.subjects);
      setSubjects(list);
      setPicked(list[0]?.id ?? null);
    });
    getCurrentSession().then(({ data }) => setSession(data.session));
  }, []);

  const notify = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const startSession = async (subjectId: string | null) => {
    const { status, data } = await postSession(subjectId);
    navigate(`/timer/${status === 409 ? data.sessionId : data.id}`);
  };

  const start = () => {
    if (!online) return notify();
    startSession(picked);
  };

  const pickChip = async (std: string) => {
    if (!online) return notify();
    const { data } = await createSubject({ name: std, standardSubject: std, color: 'blue' });
    startSession(data.id);
  };

  const tooLong = isNameTooLong(name);
  const message = tooLong ? MESSAGES.tooLong : error;

  const submit = async () => {
    if (!subjects) return;
    if (subjects.some((s) => s.name === name)) return setError(MESSAGES.same);
    if (subjects.length >= SUBJECT_MAX) return setError(MESSAGES.limit);
    setAdding(true);
    let res;
    try {
      res = await createSubject({ name, standardSubject: standard, color });
    } finally {
      setAdding(false);
    }
    const { status, data } = res;
    if (status === 409) return setError(data.code === 'SUBJECT_LIMIT' ? MESSAGES.limit : MESSAGES.same);
    setSubjects([data, ...subjects]);
    setPicked(data.id);
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
                onChange={(v: string) => { setName(v); setError(null); }}
                trailing={tooLong && <span className="text-[12px] text-secondary">{name.length}/{NAME_MAX}</span>}
              />
            </div>
            <p className="mt-4 text-[12px] font-bold text-secondary">표준 과목</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STANDARD.map((s) => <Chip key={s} selected={standard === s} onClick={() => setStandard(s)}>{s}</Chip>)}
            </div>
            <p className="mt-4 text-[12px] font-bold text-secondary">색</p>
            <div className="mt-2"><ColorPicker value={color} onChange={setColor} /></div>
            <div className="mt-5"><Button fullWidth loading={adding} disabled={!name || Boolean(message)} onClick={submit}>추가하기</Button></div>
          </div>
        ) : (
          <div>
            <Pressable onClick={() => navigate('/subjects')}><span className="text-[12px] text-secondary">과목 관리 ›</span></Pressable>
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
                      variant="option"
                      selected={s.id === picked}
                      aria-pressed={s.id === picked}
                      onClick={() => setPicked(s.id)}
                    >
                      <span className="mr-3 flex"><SubjectDot color={s.color} /></span>
                      <span className="flex-1">
                        <span className="block text-[15px] font-bold text-primary">{s.name}</span>
                        <span className="block text-[11px] font-medium text-secondary">표준 과목 · {s.standardSubject}</span>
                      </span>
                      <span className={`text-[12px] font-bold ${s.id === picked ? 'text-brand' : 'text-secondary'}`}>오늘 {formatToday(s.todaySeconds)}</span>
                    </Pressable>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3"><Button variant="ghost" size="M" fullWidth onClick={() => setForm(true)}>＋ 새 과목 추가</Button></div>
            {subjects.length > 0 && (
              <div className="mt-3">
                <Button fullWidth onClick={start}>
                  {session ? '이 과목으로 바꾸기' : (
                    <span className="flex flex-col items-center">
                      <span>{current?.name} 측정 시작</span>
                      <span aria-hidden="true" className="text-[11px] font-normal">목표 2:00</span>
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
      {!online && (
        <div className="absolute inset-x-0 top-[47px]"><OfflineBanner>인터넷 연결이 없어요 · 측정은 연결되면 이어져요</OfflineBanner></div>
      )}
      {toast && <div className="absolute inset-x-0 top-[110px]"><Toast>{MESSAGES.offline}</Toast></div>}
    </>
  );
}
