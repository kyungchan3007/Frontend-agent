import { BottomSheet, Button, Chip, Pressable, SubjectDot, TextField, Toggle } from '../../ui/index.js'
import { REPEAT } from './planSheet.logic'
import { usePlanSheet } from './usePlanSheet'

export default function PlanSheet() {
  const {
    subjects, loading, listing, setListing, start, setStart, end, setEnd, repeat, setRepeat,
    notify, setNotify, current, overlap, invalid, save, choose,
  } = usePlanSheet()

  if (loading) return null

  if (listing) {
    return (
      <BottomSheet title="과목 선택">
        <ul className="flex flex-col gap-2">
          {subjects.map((s) => (
            <li key={s.id}>
              <Pressable onClick={() => choose(s.id)} className="flex h-[48px] w-full items-center rounded-lg bg-canvas px-4">
                <SubjectDot color={s.color} className="mr-3" />
                <span className="text-[15px] font-bold text-primary">{s.name}</span>
              </Pressable>
            </li>
          ))}
        </ul>
      </BottomSheet>
    )
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
      <Button className="mt-4 w-full" disabled={invalid} onClick={save}>저장하기</Button>
    </BottomSheet>
  )
}
