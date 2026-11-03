import { apiGet, apiPost } from '../common/common.api'

export const fetchCurrentSession = () => apiGet('/sessions/current')

export const postSession = (subjectId: string | null) => apiPost('/sessions', { subjectId })
