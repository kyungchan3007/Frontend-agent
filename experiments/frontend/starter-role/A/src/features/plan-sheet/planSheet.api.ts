import { apiGet, apiPost } from '../common/common.api'

export const fetchPlans = () => apiGet('/plans')

export const postPlan = (body: {
  subjectId: string | null
  start: string
  end: string
  repeat: string
  notify: boolean
}) => apiPost('/plans', body)
