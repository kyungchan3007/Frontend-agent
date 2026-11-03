import { useState } from 'react';
import { navigate } from './App.jsx';
import { Button, Chip, ColorPicker, Pressable, SubjectDot, TextField } from './ui/index.js';
import {
  useSubjects,
  createSubject,
  isNameTooLong,
  MESSAGES,
  STANDARD_SUBJECTS,
  SUBJECT_MAX,
} from './shared';

export default function SubjectManager() {
  const { subjects, all, setSubjects } = useSubjects();
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('');
  const [color, setColor] = useState('blue');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim();
  const tooLong = isNameTooLong(name);
  const archivedCount = all.filter((s) => s.archived).length;
  const full = all.length >= SUBJECT_MAX;
  const shownError = tooLong ? MESSAGES.tooLong : error || (full ? MESSAGES.limit : '');
  const canAdd = !!trimmed && !!standard && !tooLong && !busy && !full;

  const add = async () => {
    if (!canAdd) return;
    setBusy(true);
    setError('');
    try {
      const { status, data } = await createSubject({ name: trimmed, standardSubject: standard, color });
      if (status === 201) {
        setSubjects((prev) => [...prev, data]);
        setName('');
        setStandard('');
        setColor('blue');
      } else if (data?.code === 'SUBJECT_NAME_TAKEN') setError(MESSAGES.same);
      else if (data?.code === 'SUBJECT_LIMIT') setError(MESSAGES.limit);
      else if (data?.code === 'SUBJECT_NAME_TOO_LONG') setError(MESSAGES.tooLong);
    } catch {
      setError(MESSAGES.offline);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[797px] flex-col px-6 pb-8">
      <div className="flex h-12 items-center justify-between">
        <Pressable aria-label="뒤로" onClick={() => navigate('/')}>‹</Pressable>
        <h1 className="text-[16px] font-bold">과목 관리</h1>
        <span className="text-[14px] text-secondary">편집</span>
      </div>

      <ul className="mt-2 flex flex-col gap-2">
        {subjects.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-xl bg-surface px-4 py-4">
            <span aria-hidden="true">≡</span>
            <SubjectDot color={s.color} />
            <span className="flex-1 text-[16px]">{s.name}</span>
            <span className="rounded-full bg-page px-2 text-[12px] font-bold text-secondary">
              {s.standardSubject}
            </span>
          </li>
        ))}
      </ul>

      <section className="mt-4 rounded-xl border border-primary p-4">
        <h2 className="text-[16px] font-bold">새 과목</h2>
        <div className="mt-3">
          <TextField
            value={name}
            onChange={setName}
            placeholder="과목 이름"
            aria-label="과목 이름"
            error={shownError}
          />
        </div>
        <p className="mt-3 text-[12px] text-secondary">표준 과목 (과목별 랭킹 기준)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STANDARD_SUBJECTS.map((s) => (
            <Chip key={s} selected={standard === s} onClick={() => setStandard(s)}>
              {s}
            </Chip>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-secondary">색</p>
        <div className="mt-2">
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </section>

      <p className="mt-4 text-[13px] text-secondary">보관한 과목 {archivedCount}개 ›</p>

      <div className="mt-auto">
        <Button disabled={!canAdd} onClick={add} className="w-full">
          과목 추가하기
        </Button>
      </div>
    </div>
  );
}
