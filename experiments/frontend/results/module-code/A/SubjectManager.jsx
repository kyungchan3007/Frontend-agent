import { useEffect, useState } from 'react';
import { navigate } from './App.jsx';
import { Button, Chip, ColorPicker, Pressable, SubjectDot, TextField, Toast } from './ui/index.js';

const STANDARDS = ['국어', '수학', '영어', '한국사', '사회탐구', '과학탐구', '제2외국어', '기타'];
const NAME_MAX = 12;
const SUBJECT_MAX = 20;
const NET_ERR = '인터넷 연결을 확인해 주세요';
const ERRORS = {
  SUBJECT_NAME_TAKEN: '같은 이름의 과목이 이미 있어요. 다른 이름을 써 주세요',
  SUBJECT_LIMIT: `과목은 ${SUBJECT_MAX}개까지 만들 수 있어요. 안 쓰는 과목은 보관해 주세요`,
  SUBJECT_NAME_TOO_LONG: `이름은 ${NAME_MAX}자까지 쓸 수 있어요. 조금 줄여 주세요`,
};

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

export default function SubjectManager() {
  const [all, setAll] = useState(null);
  const [name, setName] = useState('');
  const [standard, setStandard] = useState(null);
  const [color, setColor] = useState('blue');
  const [serverErr, setServerErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let alive = true;
    api('GET', '/api/v2/subjects')
      .then((d) => alive && setAll(d.subjects || []))
      .catch(() => alive && (setAll([]), setToast(NET_ERR)));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const list = (all || [])
    .filter((s) => !s.archived)
    .sort((a, b) => (b.lastUsedAt || '').localeCompare(a.lastUsedAt || ''));
  const archived = (all || []).filter((s) => s.archived).length;

  const trimmed = name.trim();
  const code = name.length > NAME_MAX ? 'SUBJECT_NAME_TOO_LONG' : serverErr;
  const error = code ? ERRORS[code] : undefined;
  const canAdd = !!trimmed && !!standard && !error && !busy;

  async function add() {
    if (!canAdd) return;
    setBusy(true);
    try {
      const s = await api('POST', '/api/v2/subjects', { name: trimmed, standardSubject: standard, color });
      setAll((prev) => [s, ...(prev || [])]);
      setName('');
      setStandard(null);
      setColor('blue');
      setServerErr(null);
    } catch (e) {
      const c = e?.data?.code ?? e?.data?.error?.code;
      if (ERRORS[c]) setServerErr(c);
      else setToast(NET_ERR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex h-[calc(100%-47px)] flex-col px-6">
      {toast && <Toast>{toast}</Toast>}
      <header className="relative flex h-12 items-center justify-center">
        <Pressable aria-label="뒤로" onClick={() => navigate('/')} className="absolute left-0 text-[22px]">
          ‹
        </Pressable>
        <h1 className="text-[17px] font-bold">과목 관리</h1>
      </header>
      <ul className="mt-2 flex flex-col gap-2">
        {list.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3">
            <SubjectDot color={s.color} />
            <span className="min-w-0 flex-1 truncate text-[16px] font-bold text-primary">{s.name}</span>
            <span className="rounded-full bg-canvas px-2 text-[12px] font-bold text-secondary">
              {s.standardSubject}
            </span>
          </li>
        ))}
      </ul>
      <section className="mt-4 rounded-lg border border-brand bg-surface p-4">
        <h2 className="mb-3 text-[16px] font-bold">새 과목</h2>
        <TextField
          id="subject-name"
          aria-label="과목 이름"
          value={name}
          placeholder="과목 이름"
          error={error}
          onChange={(v) => {
            setName(v);
            if (serverErr !== 'SUBJECT_LIMIT') setServerErr(null);
          }}
        />
        <p className="mt-4 mb-2 text-[13px] text-secondary">표준 과목 (과목별 랭킹 기준)</p>
        <div className="flex flex-wrap gap-2">
          {STANDARDS.map((s) => (
            <Chip key={s} selected={standard === s} onClick={() => setStandard(s)}>
              {s}
            </Chip>
          ))}
        </div>
        <p className="mt-4 mb-2 text-[13px] text-secondary">색</p>
        <ColorPicker value={color} onChange={setColor} />
      </section>
      {archived > 0 && <p className="mt-4 text-[13px] text-secondary">보관한 과목 {archived}개 ›</p>}
      <Button className="mt-auto mb-6 w-full" disabled={!canAdd} onClick={add}>
        과목 추가하기
      </Button>
    </div>
  );
}
