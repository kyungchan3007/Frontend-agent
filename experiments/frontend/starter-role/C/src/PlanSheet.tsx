import { useEffect, useState } from 'react';
import { navigate } from './App';
import type { ComponentType } from 'react';
import * as ui from './ui/index.js';

const { BottomSheet, Button, Chip, Pressable, SubjectDot, TextField, Toggle } = ui as unknown as Record<string, ComponentType<any>>;

type Subject = {
  id: string;
  name: string;
  color: string;
  standardSubject: string;
  todaySeconds?: number;
  lastUsedAt?: string | null;
  archived?: boolean;
};
type Plan = { start: string; end: string };
type ApiResult = { status: number; data: any };

const API_BASE = '/api';

async function request(path: string, options?: RequestInit): Promise<ApiResult> {
  const res = await fetch(API_BASE + path, options);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

const apiGet = (path: string) => request(path);

const apiPost = (path: string, body: unknown) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

function activeSubjects(list: Subject[] | null | undefined): Subject[] {
  const time = (s: Subject) => (s.lastUsedAt ? Date.parse(s.lastUsedAt) : 0);
  return (list || []).filter((s) => !s.archived).sort((a, b) => time(b) - time(a));
}

function useSubjects() {
  const [all, setAll] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    apiGet('/subjects')
      .then(({ data }) => alive && setAll(data?.subjects ?? []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  return { subjects: activeSubjects(all), setSubjects: setAll, all, loading };
}

const REPEAT: [string, string][] = [['none', '안 함'], ['daily', '매일'], ['weekdays', '평일'], ['custom', '요일 선택']];

export default function PlanSheet() {
  const { subjects, loading } = useSubjects();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [listing, setListing] = useState(false);
  const [start, setStart] = useState('19:00');
  const [end, setEnd] = useState('21:00');
  const [repeat, setRepeat] = useState('weekdays');
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    apiGet('/plans').then(({ data }) => setPlans(data.plans));
  }, []);

  if (loading) return null;
  const pickedId = picked ?? subjects[0]?.id ?? null;
  const current = subjects.find((s) => s.id === pickedId);
  const overlap = plans.some((p) => start < p.end && p.start < end);

  const save = async () => {
    const { status } = await apiPost('/plans', { subjectId: pickedId, start, end, repeat, notify });
    if (status === 201) navigate('/');
  };

  if (listing) {
    return (
      <BottomSheet title="과목 선택">
        <ul className="flex flex-col gap-2">
          {subjects.map((s) => (
            <li key={s.id}>
              <Pressable onClick={() => { setPicked(s.id); setListing(false); }} className="flex h-[48px] w-full items-center rounded-lg bg-canvas px-4">
                <SubjectDot color={s.color} className="mr-3" />
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
      <Pressable onClick={() => setListing(true)} className="flex h-[44px] w-full items-center justify-between">
        <span className="text-[14px] font-medium text-primary">과목</span>
        <span className="flex items-center text-[14px] text-secondary">
          {current && <SubjectDot color={current.color} className="mr-2" />}
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
        {REPEAT.map(([k, label]) => <Chip key={k} selected={repeat === k} onClick={() => setRepeat(k)}>{label}</Chip>)}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[14px] font-medium text-primary">시작 10분 전 알림</span>
        <Toggle aria-label="시작 10분 전 알림" checked={notify} onChange={setNotify} />
      </div>
      <p className="mt-2 text-[12px] text-caution-strong">⏱ 시작 30분이 지나도 측정하지 않으면 경고 딱지가 쌓여요</p>
      <Button className="mt-4 w-full" disabled={end <= start} onClick={save}>저장하기</Button>
    </BottomSheet>
  );
}
