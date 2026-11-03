import { useEffect, useState } from 'react'
import { fetchSubjects } from './common.api'
import { activeSubjects } from './common.logic'
import type { Subject } from './common.types'

export function useSubjects() {
  const [all, setAll] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    fetchSubjects()
      .then(({ data }) => alive && setAll(data?.subjects ?? []))
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])
  return { subjects: activeSubjects(all), setSubjects: setAll, all, loading }
}

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
