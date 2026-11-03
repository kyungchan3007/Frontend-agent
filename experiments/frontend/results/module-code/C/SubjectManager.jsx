import { useEffect, useState } from 'react';
import { navigate } from './App.jsx';
import { Button, ColorPicker, Chip, Pressable, SubjectDot, TextField, Toast } from './ui/index.js';
import { ERR, NAME_MAX, OFFLINE_MSG, STANDARD, SUBJECT_MAX, api, errorFor } from './shared/subjects.js';

export default function SubjectManager() {
  const [subjects, setSubjects] = useState(null);
  const [archivedCount, setArchivedCount] = useState(0);
  const [name, setName] = useState('');
  const [std, setStd] = useState(null);
  const [color, setColor] = useState('blue');
  const [serverErr, setServerErr] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api('GET', '/subjects')
      .then((r) => {
        const all = r.data.subjects ?? [];
        const list = all.filter((s) => !s.archived);
        list.sort((a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? ''));
        setSubjects(list);
        setArchivedCount(all.length - list.length);
      })
      .catch(() => {
        setSubjects([]);
        flash(OFFLINE_MSG);
      });
  }, []);

  const count = subjects?.length ?? 0;
  const trimmed = name.trim();
  const error = name.length > NAME_MAX ? ERR.long : serverErr ?? (count >= SUBJECT_MAX ? ERR.limit : null);
  const canAdd = subjects !== null && trimmed.length > 0 && std !== null && !error && !busy;

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api('POST', '/subjects', { name: trimmed, standardSubject: std, color });
      if (r.ok) {
        setSubjects((p) => [r.data, ...(p ?? [])]);
        setName('');
        setStd(null);
        setColor('blue');
      } else {
        const msg = errorFor(r.data.code);
        if (msg) setServerErr(msg);
        else flash(OFFLINE_MSG);
      }
    } catch {
      flash(OFFLINE_MSG);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex h-[797px] flex-col px-6">
      {toast && (
        <div className="absolute inset-x-0 top-0 z-20">
          <Toast>{toast}</Toast>
        </div>
      )}
      <header className="relative flex h-11 items-center justify-center">
        <Pressable aria-label="뒤로" onClick={() => navigate('/')} className="absolute left-0 text-[20px]">
          ‹
        </Pressable>
        <h1 className="text-[17px] font-bold">과목 관리</h1>
      </header>
      <ul className="mt-2 flex flex-col gap-2">
        {(subjects ?? []).map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3">
            <SubjectDot color={s.color} />
            <span className="min-w-0 flex-1 truncate text-[16px] font-bold">{s.name}</span>
            <span className="rounded-full bg-brand-soft px-2 text-[12px] text-secondary">{s.standardSubject}</span>
          </li>
        ))}
      </ul>
      <section className="mt-4 rounded-lg border border-brand p-4">
        <h2 className="mb-3 text-[16px] font-bold">새 과목</h2>
        <TextField
          aria-label="과목 이름"
          value={name}
          onChange={(v) => {
            setName(v);
            setServerErr(null);
          }}
          error={error}
          trailing={<span className="text-[13px] text-secondary">{name.length}/{NAME_MAX}</span>}
        />
        <p className="mt-4 mb-2 text-[13px] text-secondary">표준 과목 (과목별 랭킹 기준)</p>
        <div className="flex flex-wrap gap-2">
          {STANDARD.map((s) => (
            <Chip key={s} selected={std === s} onClick={() => setStd(s)}>
              {s}
            </Chip>
          ))}
        </div>
        <p className="mt-4 mb-2 text-[13px] font-bold">색</p>
        <ColorPicker value={color} onChange={setColor} />
      </section>
      <p className="mt-4 text-[14px] text-secondary">보관한 과목 {archivedCount}개 ›</p>
      <div className="mt-auto pb-6">
        <Button className="w-full" disabled={!canAdd} onClick={submit}>
          과목 추가하기
        </Button>
      </div>
    </div>
  );
}
