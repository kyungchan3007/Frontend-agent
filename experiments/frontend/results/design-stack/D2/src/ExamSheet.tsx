import { useState } from 'react';
import { navigate } from './App';
import { createExam } from './api/exams';
import { NAME_MAX, STANDARD_SUBJECTS as STANDARD, isNameTooLong } from './shared';
import { BottomSheet, Button, Chip, TextField } from './ui/index.js';

export default function ExamSheet() {
  const [name, setName] = useState('');
  const [standard, setStandard] = useState(STANDARD[0]);
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
      <label htmlFor="exam-name" className="block text-[13px] font-medium text-secondary">시험 이름</label>
      <div className="mt-2">
        <TextField id="exam-name" value={name} error={message} onChange={setName} />
      </div>
      <p className="mt-4 text-[12px] font-bold text-secondary">표준 과목</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {STANDARD.map((s) => <Chip key={s} selected={standard === s} onClick={() => setStandard(s)}>{s}</Chip>)}
      </div>
      <p className="mt-4 text-[12px] font-bold text-secondary">날짜</p>
      <div className="mt-2"><TextField type="date" aria-label="날짜" value={date} onChange={setDate} /></div>
      <div className="mt-4 flex gap-2">
        <div className="flex-1"><Button variant="ghost" fullWidth onClick={() => navigate('/')}>취소</Button></div>
        <div className="flex-1"><Button fullWidth loading={saving} disabled={!name.trim() || tooLong || !date} onClick={save}>저장하기</Button></div>
      </div>
    </BottomSheet>
  );
}
