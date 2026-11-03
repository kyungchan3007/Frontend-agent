import { useState } from 'react'
import { useSubjects } from '../common/useCommon'
import { createSubject } from './subjectManager.api'
import { canAdd, countArchived } from './subjectManager.logic'

export function useSubjectManager() {
  const { subjects, setSubjects: setAll, all, loading } = useSubjects()
  const [name, setName] = useState('')
  const [standard, setStandard] = useState<string | null>(null)
  const [color, setColor] = useState('blue')

  const archived = countArchived(all, subjects)
  const can = canAdd(name, standard, subjects)

  const submit = async () => {
    if (!standard) return
    const { status, data } = await createSubject({ name, standardSubject: standard, color })
    if (status !== 201) return
    setAll([data, ...all])
    setName('')
    setStandard(null)
  }

  return { subjects, loading, name, setName, standard, setStandard, color, setColor, archived, can, submit }
}
