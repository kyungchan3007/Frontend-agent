import { useEffect, useState } from 'react';
import { navigate } from './App';
import { createPlan, getPlans } from './api/plans';
import { useSubjects } from './shared';
import type { Plan } from './types';
import { BottomSheet, Button, Chip, ChipDot, Pressable, SubjectDot, TextField, Toggle } from './ui/index.js';

const REPEAT = [['none', '안 함'], ['daily', '매일'], ['weekdays', '평일'], ['custom', '요일 선택']];

export default function PlanSheet() {
  const { subjects, loading } = useSubjects();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [listing, setListing] = useState(false);
  const [start, setStart] = useState('19:00');
  const [end, setEnd] = useState('21:00');
  const [repeat, setRepeat] = useState('weekdays');
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPlans().then(({ data }) => setPlans(data.plans));
  }, []);

  if (loading) return null;
  const pickedId = picked ?? subjects[0]?.id ?? null;
  const current = subjects.find((s) => s.id === pickedId);
  const overlap = plans.some((p) => start < p.end && p.start < end);

  const save = async () => {
    setSaving(true);
    try {
      const { status } = await createPlan({ subjectId: pickedId!, start, end, repeat, notify });
      if (status === 201) navigate('/');
    } finally {
      setSaving(false);
    }
  };

  if (listing) {
    return (
      <BottomSheet title="과목 선택">
        <ul className="flex flex-col gap-2">
          {subjects.map((s) => (
            <li key={s.id}>
              <Pressable variant="row" onClick={() => { setPicked(s.id); setListing(false); }}>
                <span className="mr-3 flex"><SubjectDot color={s.color} /></span>
                <span className="text-[15px] font-bold text-primary">{s.name}</span>
              </Pressable>
            </li>
          ))}
        </ul>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet title="계획 추가">
      <Pressable variant="field" onClick={() => setListing(true)}>
        <span className="text-[14px] font-medium text-primary">과목</span>
        <span className="flex items-center text-[14px] text-secondary">
          {current && <span className="mr-2 flex"><SubjectDot color={current.color} /></span>}
          {current?.name} ›
        </span>
      </Pressable>
      <div className="mt-2 flex items-center gap-2">
        <TextField type="time" aria-label="시작" value={start} onChange={setStart} />
        <span className="text-[14px] text-secondary">→</span>
        <TextField type="time" aria-label="종료" value={end} onChange={setEnd} />
      </div>
      {overlap && <p className="mt-2 text-[13px] text-caution-strong">겹치는 계획이 있어요</p>}
      <p className="mt-4 text-[12px] font-bold text-secondary">반복</p>
      <div className="mt-2 flex gap-2">
        {REPEAT.map(([k, label]) => <Chip key={k} selected={repeat === k} onClick={() => setRepeat(k)}>{label}{repeat === k && <ChipDot />}</Chip>)}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[14px] font-medium text-primary">시작 10분 전 알림</span>
        <Toggle aria-label="시작 10분 전 알림" checked={notify} onChange={setNotify} />
      </div>
      <p className="mt-2 text-[12px] text-caution-strong">⏱ 시작 30분이 지나도 측정하지 않으면 경고 딱지가 쌓여요</p>
      <div className="mt-4 flex gap-2">
        <div className="flex-1"><Button variant="ghost" fullWidth onClick={() => navigate('/')}>취소</Button></div>
        <div className="flex-1"><Button fullWidth loading={saving} disabled={end <= start} onClick={save}>저장하기</Button></div>
      </div>
    </BottomSheet>
  );
}
