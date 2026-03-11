"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/UserContext"

export function LanguageToggle() {
  const { userData, updateUserData } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <span className="h-4 w-4" />
      </Button>
    )
  }

  const isSpanish = userData.languagePreference === "spanish"

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-xs font-semibold"
      onClick={() =>
        updateUserData({
          languagePreference: isSpanish ? "english" : "spanish",
        })
      }
    >
      {isSpanish ? "ES" : "EN"}
      <span className="sr-only">
        {isSpanish ? "Switch to English" : "Cambiar a Español"}
      </span>
    </Button>
  )
}
