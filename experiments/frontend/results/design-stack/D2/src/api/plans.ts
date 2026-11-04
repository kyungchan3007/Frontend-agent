import { apiGet, apiPost } from './subjects'
import type { Plan } from '../types'

export const getPlans = () => apiGet('/plans')

export const createPlan = (plan: Plan) => apiPost('/plans', plan)
