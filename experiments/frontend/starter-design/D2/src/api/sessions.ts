import { apiGet, apiPost } from './subjects'

export const getCurrentSession = () => apiGet('/sessions/current')

export const startSession = (subjectId: string | null) => apiPost('/sessions', { subjectId })
