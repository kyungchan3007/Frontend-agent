import { MESSAGES, SUBJECT_MAX } from '../common/common.logic'
import type { Subject } from '../common/common.types'

export function findSubmitError(name: string, subjects: Subject[]): string | null {
  if (subjects.some((s) => s.name === name)) return MESSAGES.same
  if (subjects.length >= SUBJECT_MAX) return MESSAGES.limit
  return null
}

export const createErrorMessage = (code: string | undefined) => (code === 'SUBJECT_LIMIT' ? MESSAGES.limit : MESSAGES.same)

export const timerPath = (status: number, data: { sessionId: string; id: string }) =>
  `/timer/${status === 409 ? data.sessionId : data.id}`
