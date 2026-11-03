import type { Plan, RepeatOption } from './planSheet.types'

export const REPEAT: RepeatOption[] = [['none', '안 함'], ['daily', '매일'], ['weekdays', '평일'], ['custom', '요일 선택']]

export const hasOverlap = (plans: Plan[], start: string, end: string) => plans.some((p) => start < p.end && p.start < end)

export const isInvalidRange = (start: string, end: string) => end <= start
