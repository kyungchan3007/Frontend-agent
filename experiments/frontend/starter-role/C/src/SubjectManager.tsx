import { useEffect, useState } from 'react';
import { navigate } from './App';
import type { ComponentType } from 'react';
import * as ui from './ui/index.js';

const { Button, Chip, ColorPicker, Pressable, SubjectDot, TextField } = ui as unknown as Record<string, ComponentType<any>>;

type Subject = {
  id: string;
  name: string;
  color: string;
  standardSubject: string;
  todaySeconds?: number;
  lastUsedAt?: string | null;
  archived?: boolean;
};
type ApiResult = { status: number; data: any };

const API_BASE = '/api';
const NAME_MAX = 15;
const SUBJECT_MAX = 20;
const STANDARD = ['국어', '수학', '영어', '한국사', '사회탐구', '과학탐구', '제2외국어', '기타'];

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

const createSubject = (body: { name: string; standardSubject: string; color: string }) => apiPost('/subjects', body);

const isNameTooLong = (name: string | null | undefined) => [...String(name ?? '').trim()].length > NAME_MAX;

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

export default function SubjectManager() {
  const { subjects, setSubjects: setAll, all, loading } = useSubjects();
  const [name, setName] = useState('');
  const [standard, setStandard] = useState<string | null>(null);
  const [color, setColor] = useState('blue');

  if (loading) return null;
  const archived = all.length - subjects.length;
  const can = name && !isNameTooLong(name) && standard && subjects.length < SUBJECT_MAX && !subjects.some((s) => s.name === name);

  const submit = async () => {
    if (!standard) return;
    const { status, data } = await createSubject({ name, standardSubject: standard, color });
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
