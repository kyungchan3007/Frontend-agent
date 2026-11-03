export type Subject = {
  id: string
  name: string
  standardSubject: string
  color: string
  archived?: boolean
  lastUsedAt?: string | null
  todaySeconds?: number
}

export type Plan = {
  id?: string
  subjectId: string
  start: string
  end: string
  repeat: string
  notify: boolean
}

export type ApiResult<T = any> = { status: number; data: T }
