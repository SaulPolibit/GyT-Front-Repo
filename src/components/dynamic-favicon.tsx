"use client"

import { useEffect } from "react"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"

export function DynamicFavicon() {
  useEffect(() => {
    // Create our managed favicon links with fallback
    const iconLink = document.createElement("link")
    iconLink.rel = "icon"
    iconLink.href = "/favicon.ico"

    const appleLink = document.createElement("link")
    appleLink.rel = "apple-touch-icon"
    appleLink.href = "/favicon.ico"

    // Remove any pre-existing favicon links, then add ours
    document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    ).forEach(el => el.remove())

    document.head.appendChild(iconLink)
    document.head.appendChild(appleLink)

    // Fetch firm logo and update in-place if available
    async function fetchLogo() {
      try {
        const url = getApiUrl(API_CONFIG.endpoints.getFirmLogo)
        const response = await fetch(url)
        if (!response.ok) return
        const result = await response.json()
        if (result?.success && result?.data?.firmLogo) {
          iconLink.href = result.data.firmLogo
          appleLink.href = result.data.firmLogo
        }
      } catch {
        // Keep /favicon.ico fallback
      }
    }
    fetchLogo()

    return () => {
      iconLink.remove()
      appleLink.remove()
    }
  }, [])

  return null
}
