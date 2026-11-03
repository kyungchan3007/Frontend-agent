import { useState } from 'react';
import { navigate } from './App';
import { createExam } from './api/exams';
import { NAME_MAX, STANDARD_SUBJECTS as STANDARD, isNameTooLong } from './shared';
import { BottomSheet, Button, Chip, FieldError, SheetTitle, TextField, TextInput, buttonStyles, buttonSizes, chipStyles, fieldStyles } from './ui/index.js';

const TOO_LONG = `이름은 ${NAME_MAX}자까지 쓸 수 있어요. 조금 줄여 주세요`;

export default function ExamSheet() {
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('수학');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  const tooLong = isNameTooLong(name);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { status } = await createExam({ name, standardSubject: standard, date });
      if (status === 201) navigate('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet>
      <SheetTitle>시험 일정 추가</SheetTitle>
      <label htmlFor="exam-name" className="block text-[13px] font-medium text-secondary">시험 이름</label>
      <div className="mt-2">
        <TextField className={tooLong ? fieldStyles.invalid : fieldStyles.normal}>
          <TextInput
            id="exam-name"
            value={name}
            aria-invalid={tooLong ? true : undefined}
            aria-describedby={tooLong ? 'exam-name-error' : undefined}
            onChange={setName}
          />
          {tooLong && <span aria-hidden="true" className="text-[12px] text-secondary">{name.length}/{NAME_MAX}</span>}
        </TextField>
        {tooLong && <FieldError id="exam-name-error">{TOO_LONG}</FieldError>}
      </div>
      <p className="mt-4 text-[12px] font-bold text-secondary">표준 과목</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {STANDARD.map((s) => <Chip key={s} aria-pressed={standard === s} className={standard === s ? chipStyles.on : chipStyles.off} onClick={() => setStandard(s)}>{s}{standard === s && <span aria-hidden="true" className="ml-1 inline-block h-2 w-2 rounded-full bg-current" />}</Chip>)}
      </div>
      <label htmlFor="exam-date" className="mt-4 block text-[13px] font-medium text-secondary">날짜</label>
      <div className="mt-2">
        <TextField className={fieldStyles.normal}>
          <TextInput id="exam-date" type="date" value={date} onChange={setDate} />
        </TextField>
      </div>
      <div className="mt-4 flex gap-2">
        <Button className={`${buttonStyles.ghost} ${buttonSizes.L} flex-1`} onClick={() => navigate('/')}>취소</Button>
        <Button className={`${buttonStyles.primary} ${buttonSizes.L} flex-1`} disabled={!name.trim() || tooLong || !date || saving} onClick={save}>{saving && <span aria-hidden="true" className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />}저장하기</Button>
      </div>
    </BottomSheet>
  );
}
