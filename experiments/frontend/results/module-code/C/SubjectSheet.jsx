import { useEffect, useState } from 'react';
import { navigate } from './App.jsx';
import { ERR, NAME_MAX, OFFLINE_MSG, STANDARD, SUBJECT_MAX, api } from './shared/subjects.js';
import { BottomSheet, Button, Chip, ColorPicker, OfflineBanner, Pressable, SubjectDot, TextField, Toast } from './ui/index.js';

const COLORS = ['blue', 'cyan', 'amber', 'violet', 'green', 'rose', 'slate'];

const fmt = (sec) => `${Math.floor(sec / 3600)}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}`;

export default function SubjectSheet() {
  const [subjects, setSubjects] = useState(null);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [std, setStd] = useState('기타');
  const [color, setColor] = useState('blue');
  const [serverErr, setServerErr] = useState(null);
  const [toast, setToast] = useState(null);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  const [busy, setBusy] = useState(false);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (offline) flash(OFFLINE_MSG);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api('GET', '/subjects')
      .then((r) => {
        const list = (r.data.subjects ?? []).filter((s) => !s.archived);
        list.sort((a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? ''));
        setSubjects(list);
        if (list[0]) setSelected(list[0].id);
      })
      .catch(() => {
        setSubjects([]);
        flash(OFFLINE_MSG);
      });
    api('GET', '/sessions/current').catch(() => {});
  }, []);

  const start = async (subjectId) => {
    if (offline) return flash(OFFLINE_MSG);
    setBusy(true);
    try {
      const r = await api('POST', '/sessions', { subjectId });
      if (r.ok) navigate(`/timer/${r.data.id}`);
      else if (r.data.code === 'SESSION_ALREADY_RUNNING') navigate(`/timer/${r.data.sessionId}`);
      else flash(OFFLINE_MSG);
    } catch {
      flash(OFFLINE_MSG);
    } finally {
      setBusy(false);
    }
  };

  const create = async (body) => {
    const r = await api('POST', '/subjects', body);
    return r;
  };

  const startFromStandard = async (s) => {
    if (offline) return flash(OFFLINE_MSG);
    setBusy(true);
    try {
      const used = new Set((subjects ?? []).map((x) => x.color));
      const c = COLORS.find((k) => !used.has(k)) ?? COLORS[0];
      const r = await create({ name: s, standardSubject: s, color: c });
      if (r.ok) await start(r.data.id);
      else flash(OFFLINE_MSG);
    } catch {
      flash(OFFLINE_MSG);
    } finally {
      setBusy(false);
    }
  };

  const count = subjects?.length ?? 0;
  const limitHit = count >= SUBJECT_MAX;
  const trimmed = name.trim();
  const error = name.length > NAME_MAX ? ERR.long : serverErr ?? (limitHit ? ERR.limit : null);
  const canAdd = trimmed.length > 0 && !error && !busy;

  const submit = async () => {
    if (offline) return flash(OFFLINE_MSG);
    setBusy(true);
    try {
      const r = await create({ name: trimmed, standardSubject: std, color });
      if (r.ok) {
        setSubjects((p) => [r.data, ...(p ?? [])]);
        setSelected(r.data.id);
        setAdding(false);
        setName('');
      } else if (r.data.code === 'SUBJECT_NAME_TAKEN') setServerErr(ERR.taken);
      else if (r.data.code === 'SUBJECT_LIMIT') setServerErr(ERR.limit);
      else if (r.data.code === 'SUBJECT_NAME_TOO_LONG') setServerErr(ERR.long);
      else flash(OFFLINE_MSG);
    } catch {
      flash(OFFLINE_MSG);
    } finally {
      setBusy(false);
    }
  };

  const chosen = subjects?.find((s) => s.id === selected);

  return (
    <>
      {offline && (
        <div className="absolute top-0 right-0 left-0 z-20">
          <OfflineBanner>인터넷 연결이 없어요 · 측정은 연결되면 이어져요</OfflineBanner>
        </div>
      )}
      {toast && (
        <div className="absolute inset-x-0 top-12 z-20">
          <Toast>{toast}</Toast>
        </div>
      )}
      {subjects && adding && (
        <BottomSheet title="새 과목 추가">
          <label htmlFor="subject-name" className="mb-2 block text-[14px] text-secondary">
            과목 이름
          </label>
          <TextField
            id="subject-name"
            value={name}
            onChange={(v) => {
              setName(v);
              setServerErr(null);
            }}
            error={error}
            trailing={<span className="text-[13px] text-secondary">{name.length}/{NAME_MAX}</span>}
          />
          <p className="mt-4 mb-2 text-[14px] font-bold text-secondary">표준 과목</p>
          <div className="flex flex-wrap gap-2">
            {STANDARD.map((s) => (
              <Chip key={s} selected={std === s} onClick={() => setStd(s)}>
                {s}
              </Chip>
            ))}
          </div>
          <p className="mt-4 mb-2 text-[14px] font-bold text-secondary">색</p>
          <ColorPicker value={color} onChange={setColor} />
          <Button className="mt-5 w-full" disabled={!canAdd} onClick={submit}>
            추가하기
          </Button>
        </BottomSheet>
      )}
      {subjects && !adding && (
        <BottomSheet title="무엇을 공부할까요?">
          <Pressable onClick={() => navigate('/subjects')} className="-mt-3 mb-4 block text-[14px] text-secondary">
            과목 관리 ›
          </Pressable>
          {count === 0 ? (
            <div className="mb-4">
              <p className="text-[16px] font-bold text-primary">아직 과목이 없어요</p>
              <p className="mt-1 mb-3 text-[14px] text-secondary">표준 과목을 누르면 바로 측정을 시작해요</p>
              <div className="flex flex-wrap gap-2">
                {STANDARD.map((s) => (
                  <Chip key={s} onClick={() => startFromStandard(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
          ) : (
            <ul className="mb-3 flex max-h-[360px] flex-col gap-2 overflow-y-auto">
              {subjects.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={selected === s.id}
                    onClick={() => setSelected(s.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left ${
                      selected === s.id ? 'border-brand bg-brand-soft' : 'border-transparent bg-surface'
                    }`}
                  >
                    <SubjectDot color={s.color} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-bold text-primary">{s.name}</span>
                      <span className="block text-[12px] text-secondary">표준 과목 · {s.standardSubject}</span>
                    </span>
                    <span className="text-[13px] font-bold text-secondary">오늘 {fmt(s.todaySeconds)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mb-4 flex h-11 w-full items-center justify-center rounded-lg border border-dashed border-line text-[15px] font-bold text-secondary"
          >
            + 새 과목 추가
          </button>
          {chosen && (
            <Button className="w-full" disabled={busy} onClick={() => start(chosen.id)}>
              {chosen.name} 측정 시작
            </Button>
          )}
        </BottomSheet>
      )}
    </>
  );
}
