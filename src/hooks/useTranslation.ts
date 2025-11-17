import { useUser } from '@/contexts/UserContext'
import { translations } from '@/translations'

export function useTranslation() {
  const { userData } = useUser()
  const t = translations[userData.languagePreference]

  return { t, language: userData.languagePreference }
}
