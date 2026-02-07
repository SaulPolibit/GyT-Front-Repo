"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Component to handle Supabase authentication redirects
 * Checks URL hash for password recovery tokens and redirects to reset-password page
 */
export function AuthRedirectHandler() {
  const router = useRouter()

  useEffect(() => {
    // Check if we have a hash fragment with access_token
    const hash = window.location.hash

    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get("access_token")
      const type = params.get("type")

      // If we have an access_token in the hash (from Supabase password recovery)
      // and we're not already on the reset-password page, redirect there
      if (accessToken && window.location.pathname !== "/reset-password") {
        console.log("[Auth Redirect] Detected password recovery token, redirecting to /reset-password")
        // Preserve the hash fragment by setting it in the new URL
        router.push(`/reset-password${hash}`)
      }
    }
  }, [router])

  return null // This component doesn't render anything
}
