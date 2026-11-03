import { useState } from 'react';
import { navigate } from './App';
import { createExam } from './api/exams';
import { NAME_MAX, STANDARD_SUBJECTS as STANDARD, isNameTooLong } from './shared';
import { BottomSheet, Button, Chip, TextField } from './ui/index.js';

export default function ExamSheet() {
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('수학');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  const tooLong = isNameTooLong(name);
  const message = tooLong ? `이름은 ${NAME_MAX}자까지 쓸 수 있어요. 조금 줄여 주세요` : null;

  const save = async () => {
    setSaving(true);
    try {
      const { status } = await createExam({ name, standardSubject: standard, date });
      if (status === 201) navigate('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet title="시험 일정 추가">
      <TextField
        aria-label="시험 이름"
        value={name}
        error={message}
        onChange={setName}
        trailing={tooLong && <span aria-hidden="true" className="text-[12px] text-secondary">{name.length}/{NAME_MAX}</span>}
      />
      <p className="mt-4 text-[12px] font-bold text-secondary">표준 과목</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {STANDARD.map((s) => <Chip key={s} selected={standard === s} onClick={() => setStandard(s)}>{s}</Chip>)}
      </div>
      <div className="mt-4"><TextField type="date" aria-label="날짜" value={date} onChange={setDate} /></div>
      <div className="mt-4 flex gap-2">
        <div className="flex-1"><Button variant="ghost" fullWidth onClick={() => navigate('/')}>취소</Button></div>
        <div className="flex-1"><Button fullWidth loading={saving} disabled={!name.trim() || Boolean(message) || !date} onClick={save}>저장하기</Button></div>
      </div>
    </BottomSheet>
  );
}
