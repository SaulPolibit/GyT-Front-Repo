"use client"

import { useEffect, useRef, useCallback } from 'react'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken } from '@/lib/auth-storage'

// Heartbeat interval in milliseconds (30 seconds)
const HEARTBEAT_INTERVAL = 30 * 1000

// Inactivity threshold (2 minutes)
const INACTIVITY_THRESHOLD = 2 * 60 * 1000

/**
 * Hook to send presence heartbeats to the server
 * - Sends a heartbeat every 30 seconds while the user is active
 * - Tracks user activity (mouse, keyboard, touch events)
 * - Marks user as offline when leaving the page
 */
export function usePresenceHeartbeat() {
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)
  const lastActivityTime = useRef<number>(Date.now())
  const isOnline = useRef<boolean>(false)

  // Send heartbeat to server
  const sendHeartbeat = useCallback(async (status: 'online' | 'away' | 'offline' = 'online') => {
    const token = getAuthToken()
    if (!token) {
      console.log('[Presence] No token, skipping heartbeat')
      return
    }

    try {
      console.log('[Presence] Sending heartbeat:', status)
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.presenceHeartbeat), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      const data = await response.json()
      console.log('[Presence] Heartbeat response:', data)
      isOnline.current = status === 'online'
    } catch (error) {
      console.error('[Presence] Failed to send heartbeat:', error)
    }
  }, [])

  // Mark user as offline
  const markOffline = useCallback(async () => {
    const token = getAuthToken()
    if (!token || !isOnline.current) return

    try {
      // Use sendBeacon for page unload (more reliable)
      const url = getApiUrl(API_CONFIG.endpoints.presenceOffline)
      const data = JSON.stringify({})

      // Try sendBeacon first (works on page unload)
      if (navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' })
        navigator.sendBeacon(url + `?token=${token}`, blob)
      } else {
        // Fallback to fetch
        await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          keepalive: true,
        })
      }
      isOnline.current = false
    } catch (error) {
      console.error('Failed to mark user offline:', error)
    }
  }, [])

  // Update last activity time
  const updateActivity = useCallback(() => {
    lastActivityTime.current = Date.now()
  }, [])

  // Check if user is inactive and update status accordingly
  const checkInactivity = useCallback(() => {
    const timeSinceLastActivity = Date.now() - lastActivityTime.current

    if (timeSinceLastActivity > INACTIVITY_THRESHOLD) {
      // User is inactive, mark as away
      sendHeartbeat('away')
    } else {
      // User is active, mark as online
      sendHeartbeat('online')
    }
  }, [sendHeartbeat])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return

    // Send initial heartbeat
    sendHeartbeat('online')

    // Set up heartbeat interval
    heartbeatInterval.current = setInterval(checkInactivity, HEARTBEAT_INTERVAL)

    // Activity event listeners
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove']
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendHeartbeat('away')
      } else {
        updateActivity()
        sendHeartbeat('online')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Handle page unload
    const handleBeforeUnload = () => {
      markOffline()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)

    // Cleanup
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)

      // Mark offline on cleanup
      markOffline()
    }
  }, [sendHeartbeat, checkInactivity, updateActivity, markOffline])

  return {
    sendHeartbeat,
    markOffline,
  }
}
