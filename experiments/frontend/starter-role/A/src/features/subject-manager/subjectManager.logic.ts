import { SUBJECT_MAX, isNameTooLong } from '../common/common.logic'
import type { Subject } from '../common/common.types'

export const countArchived = (all: Subject[], subjects: Subject[]) => all.length - subjects.length

export const canAdd = (name: string, standard: string | null, subjects: Subject[]) =>
  name && !isNameTooLong(name) && standard && subjects.length < SUBJECT_MAX && !subjects.some((s) => s.name === name)
