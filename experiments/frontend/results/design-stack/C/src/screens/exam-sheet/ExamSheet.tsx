import { useState } from 'react';
import { navigate } from '../../App';
import { createExam } from '../../api/exams';
import { NAME_MAX, STANDARD_SUBJECTS as STANDARD, isNameTooLong } from '../../shared';
import { BottomSheet, Button, Chip, Spinner, TextField } from '../../ui/index.js';

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
      <label htmlFor="exam-name" className="block text-[13px] font-medium text-secondary">시험 이름</label>
      <div className="mt-2">
        <TextField
          id="exam-name"
          value={name}
          error={message}
          onChange={setName}
          trailing={tooLong && <span aria-hidden="true" className="text-[12px] text-secondary">{name.length}/{NAME_MAX}</span>}
        />
      </div>
      <p className="mt-4 text-[12px] font-bold text-secondary">표준 과목</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {STANDARD.map((s) => <Chip key={s} selected={standard === s} onClick={() => setStandard(s)}>{s}{standard === s && <span aria-hidden="true" className="ml-1.5 h-2 w-2 rounded-full bg-current" />}</Chip>)}
      </div>
      <div className="mt-4">
        <TextField type="date" aria-label="날짜" value={date} onChange={setDate} />
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => navigate('/')}>취소</Button>
        <Button className="flex-1" disabled={!name.trim() || !date || Boolean(message) || saving} onClick={save}>
          {saving && <Spinner />}저장하기
        </Button>
      </div>
    </BottomSheet>
  );
}
