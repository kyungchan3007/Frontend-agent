import type { ApiResult } from '../types'

export const API_BASE = '/api'

export async function request(path: string, options?: RequestInit): Promise<ApiResult> {
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

export const getSubjects = () => apiGet('/subjects')

export const archiveSubject = (id: string | number) => apiPost(`/subjects/${id}/archive`, {})

export const createSubject =(body: { name: string; standardSubject: string; color: string }) =>
  apiPost('/subjects', body)
