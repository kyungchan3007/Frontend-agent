import type { Subject } from './common.types'

export const NAME_MAX = 15
export const SUBJECT_MAX = 20

export const MESSAGES = {
  tooLong: `이름은 ${NAME_MAX}자까지 쓸 수 있어요. 조금 줄여 주세요`,
  same: '같은 이름의 과목이 이미 있어요. 다른 이름을 써 주세요',
  limit: `과목은 ${SUBJECT_MAX}개까지 만들 수 있어요. 안 쓰는 과목은 보관해 주세요`,
  offline: '인터넷 연결을 확인해 주세요',
}

export const STANDARD_SUBJECTS = ['국어', '수학', '영어', '한국사', '사회탐구', '과학탐구', '제2외국어', '기타']

export const isNameTooLong = (name: unknown): boolean => [...String(name ?? '').trim()].length > NAME_MAX

export function activeSubjects(list: Subject[] | null | undefined): Subject[] {
  const time = (s: Subject) => (s.lastUsedAt ? Date.parse(s.lastUsedAt) : 0)
  return (list || []).filter((s) => !s.archived).sort((a, b) => time(b) - time(a))
}

export function formatToday(seconds?: number): string {
  const m = Math.floor((seconds || 0) / 60)
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}
