"use client"

import { useEffect } from "react"
import { useUser } from "@/contexts/UserContext"

export function HtmlLangUpdater() {
  const { userData } = useUser()

  useEffect(() => {
    document.documentElement.lang =
      userData.languagePreference === "spanish" ? "es" : "en"
  }, [userData.languagePreference])

  return null
}
