import { useEffect, useState } from 'react'
import { getSubjects } from './api/subjects'
import type { Subject } from './types'

export const NAME_MAX = 15
export const SUBJECT_MAX = 20

export const STANDARD_SUBJECTS = ['국어', '수학', '영어', '한국사', '사회탐구', '과학탐구', '제2외국어', '기타']

export const isNameTooLong = (name: unknown) => [...String(name ?? '').trim()].length > NAME_MAX

export function activeSubjects(list: Subject[] | null | undefined) {
  const time = (s: Subject) => (s.lastUsedAt ? Date.parse(s.lastUsedAt) : 0)
  return (list || []).filter((s) => !s.archived).sort((a, b) => time(b) - time(a))
}

export function useSubjects() {
  const [all, setAll] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    getSubjects()
      .then(({ data }) => alive && setAll(data?.subjects ?? []))
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])
  return { subjects: activeSubjects(all), setSubjects: setAll, all, loading }
}
