import type { ComponentType } from 'react'

type Props = { [key: string]: any }
type UI = ComponentType<Props>

export const Button: UI
export const Pressable: UI
export const Chip: UI
export const TextField: UI
export const TextInput: UI
export const FieldError: UI
export const Toggle: UI
export const SubjectDot: UI
export const ColorPicker: UI
export const BottomSheet: UI
export const SheetTitle: UI
export const Toast: UI
export const OfflineBanner: UI

export const buttonStyles: Record<'primary' | 'secondary' | 'ghost' | 'danger', string>
export const buttonSizes: Record<'L' | 'M' | 'S', string>
export const chipStyles: Record<'on' | 'off', string>
export const fieldStyles: Record<'normal' | 'invalid', string>
export const subjectColors: Record<string, string>
