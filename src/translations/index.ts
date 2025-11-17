import { en } from './en'
import { es } from './es'

export const translations = {
  english: en,
  spanish: es,
}

export type Language = keyof typeof translations
