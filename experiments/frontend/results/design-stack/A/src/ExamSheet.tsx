import { useState } from 'react';
import { navigate } from './App';
import { createExam } from './api/exams';
import { NAME_MAX, STANDARD_SUBJECTS, isNameTooLong } from './shared';
import { BottomSheet, Button, Chip, TextField } from './ui/index.js';

export default function ExamSheet() {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState(STANDARD_SUBJECTS[0]);
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  const tooLong = isNameTooLong(name);
  const canSave = name.trim() !== '' && date !== '' && !tooLong;

  const save = async () => {
    setSaving(true);
    try {
      const { status } = await createExam({ name: name.trim(), standardSubject: subject, date });
      if (status === 201) navigate('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet title="시험 일정 추가">
      <TextField
        aria-label="시험 이름"
        placeholder="시험 이름"
        value={name}
        onChange={setName}
        error={tooLong ? `이름은 ${NAME_MAX}자까지 쓸 수 있어요. 조금 줄여 주세요` : undefined}
        trailing={tooLong && <span aria-hidden="true" className="text-[12px] text-secondary">{name.length}/{NAME_MAX}</span>}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {STANDARD_SUBJECTS.map((s) => <Chip key={s} selected={subject === s} onClick={() => setSubject(s)}>{s}</Chip>)}
      </div>
      <div className="mt-4">
        <TextField type="date" aria-label="날짜" value={date} onChange={setDate} />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="flex-1"><Button variant="ghost" fullWidth onClick={() => navigate('/')}>취소</Button></div>
        <div className="flex-1"><Button fullWidth loading={saving} disabled={!canSave} onClick={save}>저장하기</Button></div>
      </div>
    </BottomSheet>
  );
}
