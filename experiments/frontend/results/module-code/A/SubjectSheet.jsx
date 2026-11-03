import { useEffect, useState } from 'react';
import { navigate } from './App.jsx';
import {
  BottomSheet,
  Button,
  Chip,
  ColorPicker,
  OfflineBanner,
  Pressable,
  SubjectDot,
  TextField,
  Toast,
} from './ui/index.js';

const STANDARDS = ['국어', '수학', '영어', '한국사', '사회탐구', '과학탐구', '제2외국어', '기타'];
const COLORS = ['blue', 'cyan', 'amber', 'violet', 'green', 'rose', 'slate'];
const NAME_MAX = 12;
const SUBJECT_MAX = 20;
const OFFLINE_TOAST = '인터넷 연결을 확인해 주세요';

const ERR_LONG = `이름은 ${NAME_MAX}자까지 쓸 수 있어요. 조금 줄여 주세요`;
const ERR_TAKEN = '같은 이름의 과목이 이미 있어요. 다른 이름을 써 주세요';
const ERR_LIMIT = `과목은 ${SUBJECT_MAX}개까지 만들 수 있어요. 안 쓰는 과목은 보관해 주세요`;

function fmt(sec) {
  const m = Math.floor((sec || 0) / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw Object.assign(new Error('api'), { status: res.status, data });
  return data;
}

const errCode = (e) => e?.data?.code ?? e?.data?.error?.code;

export default function SubjectSheet() {
  const [subjects, setSubjects] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('수학');
  const [color, setColor] = useState('blue');
  const [serverErr, setServerErr] = useState(null); // 'taken' | 'limit'
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState(navigator.onLine ? null : OFFLINE_TOAST);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => {
      setOnline(false);
      setToast(OFFLINE_TOAST);
    };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    api('GET', '/api/v2/subjects')
      .then((d) => {
        if (!alive) return;
        const list = (d.subjects || [])
          .filter((s) => !s.archived)
          .sort((a, b) => (b.lastUsedAt || '').localeCompare(a.lastUsedAt || ''));
        setSubjects(list);
        setSelectedId(list[0]?.id ?? null);
      })
      .catch(() => alive && (setSubjects([]), setToast(OFFLINE_TOAST)));
    api('GET', '/api/v2/sessions/current').catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const list = subjects || [];
  const selected = list.find((s) => s.id === selectedId);
  const nextColor = () => COLORS.find((c) => !list.some((s) => s.color === c)) || COLORS[0];

  async function startWith(subjectId) {
    if (!navigator.onLine) return setToast(OFFLINE_TOAST);
    setBusy(true);
    try {
      const s = await api('POST', '/api/v2/sessions', { subjectId });
      navigate(`/timer/${s.id}`);
    } catch (e) {
      if (e.status === 409 && errCode(e) === 'SESSION_ALREADY_RUNNING') {
        navigate(`/timer/${e.data.sessionId ?? e.data.error?.sessionId}`);
      } else setToast(OFFLINE_TOAST);
    } finally {
      setBusy(false);
    }
  }

  async function startStandard(std) {
    if (!navigator.onLine) return setToast(OFFLINE_TOAST);
    setBusy(true);
    try {
      const s = await api('POST', '/api/v2/subjects', { name: std, standardSubject: std, color: nextColor() });
      setBusy(false);
      await startWith(s.id);
    } catch {
      setBusy(false);
      setToast(OFFLINE_TOAST);
    }
  }

  async function add() {
    if (!navigator.onLine) return setToast(OFFLINE_TOAST);
    setBusy(true);
    try {
      const s = await api('POST', '/api/v2/subjects', { name: name.trim(), standardSubject: standard, color });
      setSubjects([s, ...list]);
      setSelectedId(s.id);
      setAdding(false);
      setName('');
    } catch (e) {
      const c = errCode(e);
      if (c === 'SUBJECT_NAME_TAKEN') setServerErr('taken');
      else if (c === 'SUBJECT_LIMIT') setServerErr('limit');
      else if (c === 'SUBJECT_NAME_TOO_LONG') setServerErr('long');
      else setToast(OFFLINE_TOAST);
    } finally {
      setBusy(false);
    }
  }

  const trimmed = name.trim();
  const tooLong = name.length > NAME_MAX || serverErr === 'long';
  const error = tooLong ? ERR_LONG : serverErr === 'taken' ? ERR_TAKEN : serverErr === 'limit' ? ERR_LIMIT : undefined;

  const banner = !online && <OfflineBanner>인터넷 연결이 없어요 · 측정은 연결되면 이어져요</OfflineBanner>;
  const toastEl = toast && <Toast>{toast}</Toast>;

  if (adding) {
    return (
      <>
        {banner}
        <BottomSheet title="새 과목 추가">
          <label htmlFor="subject-name" className="mb-2 block text-[14px] text-secondary">
            과목 이름
          </label>
          <TextField
            id="subject-name"
            value={name}
            onChange={(v) => {
              setName(v);
              if (serverErr !== 'limit') setServerErr(null);
            }}
            error={error}
            trailing={
              name.length > 0 && (
                <span className="ml-2 text-[13px] text-secondary">
                  {name.length}/{NAME_MAX}
                </span>
              )
            }
          />
          <p className="mt-4 mb-2 text-[14px] font-bold text-secondary">표준 과목</p>
          <div className="flex flex-wrap gap-2">
            {STANDARDS.map((s) => (
              <Chip key={s} selected={standard === s} onClick={() => setStandard(s)}>
                {s}
              </Chip>
            ))}
          </div>
          <p className="mt-4 mb-2 text-[14px] text-secondary">색</p>
          <ColorPicker value={color} onChange={setColor} />
          <Button className="mt-5 w-full" disabled={!trimmed || !!error || busy} onClick={add}>
            추가하기
          </Button>
        </BottomSheet>
        {toastEl}
      </>
    );
  }

  return (
    <>
      {banner}
      <BottomSheet title="무엇을 공부할까요?">
        <Pressable onClick={() => navigate('/subjects')} className="-mt-3 mb-4 text-[13px] text-secondary">
          과목 관리 ›
        </Pressable>
        {subjects && list.length === 0 ? (
          <div className="mb-4">
            <p className="text-[16px] font-bold text-primary">아직 과목이 없어요</p>
            <p className="mt-1 mb-3 text-[13px] text-secondary">표준 과목을 누르면 바로 측정을 시작해요</p>
            <div className="flex flex-wrap gap-2">
              {STANDARDS.map((s) => (
                <Chip key={s} onClick={() => !busy && startStandard(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
        ) : (
          <ul className="mb-3 flex max-h-[300px] flex-col gap-2 overflow-y-auto">
            {list.map((s) => {
              const on = s.id === selectedId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSelectedId(s.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${
                      on ? 'border border-brand bg-brand-soft' : 'border border-transparent bg-canvas'
                    }`}
                  >
                    <SubjectDot color={s.color} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-bold text-primary">{s.name}</span>
                      <span className="block text-[12px] text-secondary">표준 과목 · {s.standardSubject}</span>
                    </span>
                    <span className={`text-[13px] font-bold ${on ? 'text-brand' : 'text-secondary'}`}>
                      오늘 {fmt(s.todaySeconds)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mb-3 h-11 w-full rounded-lg border border-dashed border-line text-[15px] font-bold text-secondary"
        >
          + 새 과목 추가
        </button>
        {list.length > 0 && (
          <Button className="w-full" disabled={!selected || busy} onClick={() => startWith(selected.id)}>
            {selected ? `${selected.name} 측정 시작` : '측정 시작'}
          </Button>
        )}
      </BottomSheet>
      {toastEl}
    </>
  );
}
