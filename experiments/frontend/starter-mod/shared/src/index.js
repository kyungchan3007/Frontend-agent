import { useEffect, useState } from 'react'

export const API_BASE = '/api'
export const NAME_MAX = 15
export const SUBJECT_MAX = 20

export const MESSAGES = {
  tooLong: `이름은 ${NAME_MAX}자까지 쓸 수 있어요. 조금 줄여 주세요`,
  same: '같은 이름의 과목이 이미 있어요. 다른 이름을 써 주세요',
  limit: `과목은 ${SUBJECT_MAX}개까지 만들 수 있어요. 안 쓰는 과목은 보관해 주세요`,
  offline: '인터넷 연결을 확인해 주세요',
}

export const STANDARD_SUBJECTS = ['국어', '수학', '영어', '한국사', '사회탐구', '과학탐구', '제2외국어', '기타']

async function request(path, options) {
  const res = await fetch(API_BASE + path, options)
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { status: res.status, data }
}

export const apiGet = (path) => request(path)

export const apiPost = (path, body) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const isNameTooLong = (name) => [...String(name ?? '').trim()].length > NAME_MAX

export function activeSubjects(list) {
  const time = (s) => (s.lastUsedAt ? Date.parse(s.lastUsedAt) : 0)
  return (list || []).filter((s) => !s.archived).sort((a, b) => time(b) - time(a))
}

export function formatToday(seconds) {
  const m = Math.floor((seconds || 0) / 60)
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}

export function useSubjects() {
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    apiGet('/subjects')
      .then(({ data }) => alive && setAll(data?.subjects ?? []))
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])
  return { subjects: activeSubjects(all), setSubjects: setAll, all, loading }
}

export const createSubject = (body) => apiPost('/subjects', body)

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
