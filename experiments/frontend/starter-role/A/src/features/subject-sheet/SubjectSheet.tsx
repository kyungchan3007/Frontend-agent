import { navigate } from '../../App'
import { MESSAGES, NAME_MAX, STANDARD_SUBJECTS as STANDARD, formatToday } from '../common/common.logic'
import { BottomSheet, Button, Chip, ColorPicker, OfflineBanner, Pressable, SubjectDot, TextField, Toast } from '../../ui/index.js'
import { useSubjectSheet } from './useSubjectSheet'

export default function SubjectSheet() {
  const {
    subjects, session, picked, setPicked, form, setForm, name, changeName, standard, setStandard,
    color, setColor, toast, online, tooLong, message, start, pickChip, submit, current,
  } = useSubjectSheet()

  if (!subjects) return null

  return (
    <>
      <BottomSheet title={form ? '새 과목 추가' : '무엇을 공부할까요?'}>
        {form ? (
          <div>
            <label htmlFor="subject-name" className="block text-[13px] font-medium text-secondary">과목 이름</label>
            <div className="mt-2">
              <TextField
                id="subject-name"
                value={name}
                error={message}
                onChange={changeName}
                trailing={tooLong && <span className="text-[12px] text-secondary">{name.length}/{NAME_MAX}</span>}
              />
            </div>
            <p className="mt-4 text-[12px] font-bold text-secondary">표준 과목</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STANDARD.map((s) => <Chip key={s} selected={standard === s} onClick={() => setStandard(s)}>{s}</Chip>)}
            </div>
            <p className="mt-4 text-[12px] font-bold text-secondary">색</p>
            <div className="mt-2"><ColorPicker value={color} onChange={setColor} /></div>
            <Button className="mt-5 w-full" disabled={!name || Boolean(message)} onClick={submit}>추가하기</Button>
          </div>
        ) : (
          <div>
            <Pressable onClick={() => navigate('/subjects')} className="text-[12px] text-secondary">과목 관리 ›</Pressable>
            {subjects.length === 0 ? (
              <div className="mt-4">
                <p className="text-[15px] font-bold text-primary">아직 과목이 없어요</p>
                <p className="mt-1 text-[12px] text-secondary">표준 과목을 누르면 바로 측정을 시작해요</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {STANDARD.map((s) => <Chip key={s} onClick={() => pickChip(s)}>{s}</Chip>)}
                </div>
              </div>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {subjects.map((s) => (
                  <li key={s.id}>
                    <Pressable
                      aria-pressed={s.id === picked}
                      onClick={() => setPicked(s.id)}
                      className={`flex h-[63px] w-full items-center rounded-lg border-2 px-4 ${
                        s.id === picked ? 'border-brand bg-brand-soft' : 'border-transparent bg-canvas'
                      }`}
                    >
                      <SubjectDot color={s.color} className="mr-3" />
                      <span className="flex-1">
                        <span className="block text-[15px] font-bold text-primary">{s.name}</span>
                        <span className="block text-[11px] font-medium text-secondary">표준 과목 · {s.standardSubject}</span>
                      </span>
                      <span className={`text-[12px] font-bold ${s.id === picked ? 'text-brand' : 'text-secondary'}`}>오늘 {formatToday(s.todaySeconds)}</span>
                    </Pressable>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="ghost" size="M" className="mt-3 w-full" onClick={() => setForm(true)}>＋ 새 과목 추가</Button>
            {subjects.length > 0 && (
              <Button className="mt-3 w-full" onClick={start}>
                {session ? '이 과목으로 바꾸기' : `${current?.name} 측정 시작`}
              </Button>
            )}
          </div>
        )}
      </BottomSheet>
      {!online && (
        <div className="absolute inset-x-0 top-[47px]"><OfflineBanner>인터넷 연결이 없어요 · 측정은 연결되면 이어져요</OfflineBanner></div>
      )}
      {toast && <div className="absolute inset-x-0 top-[110px]"><Toast>{MESSAGES.offline}</Toast></div>}
    </>
  )
}
