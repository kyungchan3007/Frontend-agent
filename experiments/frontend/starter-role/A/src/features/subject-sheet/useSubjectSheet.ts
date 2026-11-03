import { useEffect, useState } from 'react'
import { navigate } from '../../App'
import { createSubject, fetchSubjects } from '../common/common.api'
import { MESSAGES, activeSubjects, isNameTooLong } from '../common/common.logic'
import type { Subject } from '../common/common.types'
import { useOnline } from '../common/useCommon'
import { fetchCurrentSession, postSession } from './subjectSheet.api'
import { createErrorMessage, findSubmitError, timerPath } from './subjectSheet.logic'
import type { CurrentSession } from './subjectSheet.types'

export function useSubjectSheet() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null)
  const [session, setSession] = useState<CurrentSession | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [form, setForm] = useState(false)
  const [name, setName] = useState('')
  const [standard, setStandard] = useState('수학')
  const [color, setColor] = useState('blue')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState(false)
  const online = useOnline()

  useEffect(() => {
    fetchSubjects().then(({ data }) => {
      const list = activeSubjects(data.subjects)
      setSubjects(list)
      setPicked(list[0]?.id ?? null)
    })
    fetchCurrentSession().then(({ data }) => setSession(data.session))
  }, [])

  const notify = () => {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  const startSession = async (subjectId: string | null) => {
    const { status, data } = await postSession(subjectId)
    navigate(timerPath(status, data))
  }

  const start = () => {
    if (!online) return notify()
    startSession(picked)
  }

  const pickChip = async (std: string) => {
    if (!online) return notify()
    const { data } = await createSubject({ name: std, standardSubject: std, color: 'blue' })
    startSession(data.id)
  }

  const tooLong = isNameTooLong(name)
  const message = tooLong ? MESSAGES.tooLong : error

  const changeName = (v: string) => {
    setName(v)
    setError(null)
  }

  const submit = async () => {
    if (!subjects) return
    const found = findSubmitError(name, subjects)
    if (found) return setError(found)
    const { status, data } = await createSubject({ name, standardSubject: standard, color })
    if (status === 409) return setError(createErrorMessage(data.code))
    setSubjects([data, ...subjects])
    setPicked(data.id)
    setForm(false)
    setName('')
  }

  const current = subjects?.find((s) => s.id === picked)

  return {
    subjects, session, picked, setPicked, form, setForm, name, changeName, standard, setStandard,
    color, setColor, toast, online, tooLong, message, start, pickChip, submit, current,
  }
}
