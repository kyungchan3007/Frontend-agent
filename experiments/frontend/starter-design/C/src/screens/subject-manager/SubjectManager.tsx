import { useState } from 'react';
import { navigate } from '../../App';
import { createSubject } from '../../api/subjects';
import { STANDARD_SUBJECTS as STANDARD, SUBJECT_MAX, isNameTooLong, useSubjects } from '../../shared';
import { Button, Chip, ColorPicker, Pressable, SubjectDot, TextField } from '../../ui/index.js';

export default function SubjectManager() {
  const { subjects, setSubjects: setAll, all, loading } = useSubjects();
  const [name, setName] = useState('');
  const [standard, setStandard] = useState<string | null>(null);
  const [color, setColor] = useState('blue');

  if (loading) return null;
  const archived = all.length - subjects.length;
  const can = name && !isNameTooLong(name) && standard && subjects.length < SUBJECT_MAX && !subjects.some((s) => s.name === name);

  const submit = async () => {
    const { status, data } = await createSubject({ name, standardSubject: standard!, color });
    if (status !== 201) return;
    setAll([data, ...all]);
    setName('');
    setStandard(null);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-canvas px-6 pt-[60px] pb-[34px]">
      <div className="flex items-center justify-between">
        <Pressable aria-label="뒤로" onClick={() => navigate('/')} className="text-[20px] font-bold text-primary">‹</Pressable>
        <h1 className="text-[17px] font-bold text-primary">과목 관리</h1>
        <span className="w-5" />
      </div>
      <ul className="mt-4 flex max-h-[220px] flex-col gap-2 overflow-auto">
        {subjects.map((s) => (
          <li key={s.id} className="flex h-[48px] items-center rounded-lg bg-surface px-4">
            <SubjectDot color={s.color} className="mr-3" />
            <span className="flex-1 text-[15px] font-medium text-primary">{s.name}</span>
            <span className="rounded-full bg-canvas px-2 py-1 text-[12px] font-bold text-secondary">{s.standardSubject}</span>
          </li>
        ))}
      </ul>
      <section className="mt-4 rounded-lg border border-brand bg-surface p-4">
        <h2 className="text-[15px] font-bold text-primary">새 과목</h2>
        <div className="mt-2"><TextField aria-label="과목 이름" value={name} onChange={setName} /></div>
        <p className="mt-3 text-[12px] font-bold text-secondary">표준 과목 (과목별 랭킹 기준)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STANDARD.map((s) => <Chip key={s} selected={standard === s} onClick={() => setStandard(s)}>{s}</Chip>)}
        </div>
        <p className="mt-3 text-[12px] font-bold text-secondary">색</p>
        <div className="mt-2"><ColorPicker value={color} onChange={setColor} /></div>
      </section>
      {archived > 0 && <p className="mt-3 text-[13px] text-secondary">보관한 과목 {archived}개 ›</p>}
      <Button className="mt-auto w-full" disabled={!can} onClick={submit}>과목 추가하기</Button>
    </div>
  );
}
