import { useEffect, useState } from 'react'
import { navigate } from '../../App'
import { useSubjects } from '../common/useCommon'
import { fetchPlans, postPlan } from './planSheet.api'
import { hasOverlap, isInvalidRange } from './planSheet.logic'
import type { Plan } from './planSheet.types'

export function usePlanSheet() {
  const { subjects, loading } = useSubjects()
  const [plans, setPlans] = useState<Plan[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const [listing, setListing] = useState(false)
  const [start, setStart] = useState('19:00')
  const [end, setEnd] = useState('21:00')
  const [repeat, setRepeat] = useState('weekdays')
  const [notify, setNotify] = useState(true)

  useEffect(() => {
    fetchPlans().then(({ data }) => setPlans(data.plans))
  }, [])

  const pickedId = picked ?? subjects[0]?.id ?? null
  const current = subjects.find((s) => s.id === pickedId)
  const overlap = hasOverlap(plans, start, end)
  const invalid = isInvalidRange(start, end)

  const save = async () => {
    const { status } = await postPlan({ subjectId: pickedId, start, end, repeat, notify })
    if (status === 201) navigate('/')
  }

  const choose = (id: string) => {
    setPicked(id)
    setListing(false)
  }

  return {
    subjects, loading, listing, setListing, start, setStart, end, setEnd, repeat, setRepeat,
    notify, setNotify, current, overlap, invalid, save, choose,
  }
}
