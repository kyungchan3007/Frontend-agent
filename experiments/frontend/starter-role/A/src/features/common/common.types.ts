export interface Subject {
  id: string
  name: string
  color: string
  standardSubject: string
  archived?: boolean
  lastUsedAt?: string | null
  todaySeconds?: number
}

export interface ApiResult {
  status: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

export interface NewSubjectBody {
  name: string
  standardSubject: string
  color: string
}
