import { useEffect, useState } from 'react';
import { navigate } from './App.jsx';
import { BottomSheet, Button, Chip, ColorPicker, OfflineBanner, Pressable, SubjectDot, TextField, Toast } from './ui/index.js';
import {
  apiGet,
  apiPost,
  createSubject,
  formatToday,
  isNameTooLong,
  MESSAGES,
  NAME_MAX,
  STANDARD_SUBJECTS,
  SUBJECT_MAX,
  useOnline,
  useSubjects,
} from './shared';

const COLORS = ['blue', 'cyan', 'amber', 'violet', 'green', 'rose', 'slate'];

export default function SubjectSheet() {
  const online = useOnline();
  const { subjects, all, setSubjects } = useSubjects();
  const [session, setSession] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('list');
  const [toast, setToast] = useState(online ? null : MESSAGES.offline);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [standard, setStandard] = useState(STANDARD_SUBJECTS[0]);
  const [color, setColor] = useState('blue');
  const [serverError, setServerError] = useState(null); // { code, name }

  useEffect(() => {
    apiGet('/sessions/current')
      .then(({ data }) => setSession(data?.session ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!online) setToast(MESSAGES.offline);
  }, [online]);

  const selected =
    subjects.find((s) => s.id === selectedId) ??
    subjects.find((s) => s.id === session?.subjectId) ??
    subjects[0] ??
    null;

  const unusedColor = () => COLORS.find((c) => !all.some((s) => s.color === c)) ?? COLORS[0];

  async function start(subjectId) {
    if (!online) return setToast(MESSAGES.offline);
    setBusy(true);
    try {
      const { status, data } = await apiPost('/sessions', { subjectId });
      if (status === 201) navigate(`/timer/${data.id}`);
      else if (status === 409 && data?.code === 'SESSION_ALREADY_RUNNING') navigate(`/timer/${data.sessionId}`);
    } catch {
      setToast(MESSAGES.offline);
    }
    setBusy(false);
  }

  async function startWithStandard(label) {
    if (!online) return setToast(MESSAGES.offline);
    setBusy(true);
    try {
      const { status, data } = await createSubject({ name: label, standardSubject: label, color: unusedColor() });
      if (status === 201) {
        setSubjects([...all, data]);
        setBusy(false);
        return start(data.id);
      }
    } catch {
      setToast(MESSAGES.offline);
    }
    setBusy(false);
  }

  const count = [...name.trim()].length;
  const tooLong = isNameTooLong(name);
  const atLimit = all.filter((s) => !s.archived).length >= SUBJECT_MAX;
  const sameError = serverError?.code === 'SUBJECT_NAME_TAKEN' && serverError.name === name;
  const limitError = serverError?.code === 'SUBJECT_LIMIT' || (serverError && atLimit && serverError.code === 'SUBJECT_LIMIT');
  const error = tooLong ? MESSAGES.tooLong : sameError ? MESSAGES.same : limitError ? MESSAGES.limit : undefined;
  const canAdd = !!name.trim() && !error && !busy;

  async function add() {
    if (!online) return setToast(MESSAGES.offline);
    if (atLimit) return setServerError({ code: 'SUBJECT_LIMIT', name });
    setBusy(true);
    try {
      const { status, data } = await createSubject({ name: name.trim(), standardSubject: standard, color });
      if (status === 201) {
        setSubjects([...all, data]);
        setSelectedId(data.id);
        setName('');
        setServerError(null);
        setMode('list');
      } else if (status === 409 && data?.code === 'SUBJECT_NAME_TAKEN') setServerError({ code: data.code, name });
      else if (status === 409 && data?.code === 'SUBJECT_LIMIT') setServerError({ code: data.code, name });
      else if (status === 422) setServerError({ code: 'SUBJECT_NAME_TOO_LONG', name });
    } catch {
      setToast(MESSAGES.offline);
    }
    setBusy(false);
  }

  const addButton = (
    <button
      type="button"
      onClick={() => {
        setColor(unusedColor());
        setMode('form');
      }}
      className="mt-3 flex h-11 w-full items-center justify-center rounded-md border border-dashed border-line text-[15px] font-bold text-secondary"
    >
      + 새 과목 추가
    </button>
  );

  return (
    <>
      <div className="absolute inset-0 leading-[1.4] tracking-[-0.01em]">
        {!online && (
          <div className="absolute inset-x-0 top-0 z-10">
            <OfflineBanner>인터넷 연결이 없어요 · 측정은 연결되면 이어져요</OfflineBanner>
          </div>
        )}
        <BottomSheet title={mode === 'form' ? '새 과목 추가' : '무엇을 공부할까요?'}>
          {mode === 'list' ? (
            <>
              <Pressable onClick={() => navigate('/subjects')} className="-mt-3 mb-3 text-[13px] text-secondary">
                과목 관리 ›
              </Pressable>
              {subjects.length === 0 ? (
                <div>
                  <p className="text-[15px] font-bold text-primary">아직 과목이 없어요</p>
                  <p className="mt-1 text-[13px] text-secondary">표준 과목을 누르면 바로 측정을 시작해요</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STANDARD_SUBJECTS.map((s) => (
                      <Chip key={s} onClick={() => startWithStandard(s)}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : (
                <ul className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
                  {subjects.map((s) => {
                    const on = selected?.id === s.id;
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
                          <span className={`text-[13px] font-bold ${on ? 'text-brand-strong' : 'text-secondary'}`}>
                            오늘 {formatToday(s.todaySeconds)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {addButton}
              {selected && (
                <Button className="mt-3 w-full" disabled={busy} onClick={() => start(selected.id)}>
                  {session && session.subjectId !== selected.id
                    ? '이 과목으로 바꾸기'
                    : `${selected.name} 측정 시작`}
                </Button>
              )}
            </>
          ) : (
            <div>
              <label htmlFor="subject-name" className="mb-2 block text-[13px] text-secondary">
                과목 이름
              </label>
              <TextField
                id="subject-name"
                value={name}
                onChange={setName}
                error={error}
                aria-label="과목 이름"
                trailing={
                  <span className="ml-2 text-[13px] text-secondary">
                    {count}/{NAME_MAX}
                  </span>
                }
              />
              <p className="mt-4 mb-2 text-[13px] font-bold text-secondary">표준 과목</p>
              <div className="flex flex-wrap gap-2">
                {STANDARD_SUBJECTS.map((s) => (
                  <Chip key={s} selected={standard === s} onClick={() => setStandard(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
              <p className="mt-4 mb-2 text-[13px] font-bold text-secondary">색</p>
              <ColorPicker value={color} onChange={setColor} />
              <Button className="mt-4 w-full" disabled={!canAdd} onClick={add}>
                추가하기
              </Button>
            </div>
          )}
        </BottomSheet>
        {toast && <Toast>{toast}</Toast>}
      </div>
    </>
  );
}
