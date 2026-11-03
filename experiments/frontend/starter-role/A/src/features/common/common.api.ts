import type { ApiResult, NewSubjectBody } from './common.types'

export const API_BASE = '/api'

async function request(path: string, options?: RequestInit): Promise<ApiResult> {
  const res = await fetch(API_BASE + path, options)
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { status: res.status, data }
}

export const apiGet = (path: string) => request(path)

export const apiPost = (path: string, body: unknown) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const fetchSubjects = () => apiGet('/subjects')

export const createSubject = (body: NewSubjectBody) => apiPost('/subjects', body)
