import { apiPost } from './subjects'

export const createExam = (body: { name: string; standardSubject: string; date: string }) => apiPost('/exams', body)
