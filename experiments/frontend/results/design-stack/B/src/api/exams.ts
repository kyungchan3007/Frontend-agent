import { apiPost } from './subjects'

export const createExam = (exam: { name: string; standardSubject: string; date: string }) => apiPost('/exams', exam)
