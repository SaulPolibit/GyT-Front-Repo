'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeNotification {
  id: string
  user_id: string
  notification_type: string
  title: string
  message: string
  read_at: string | null
  created_at: string
}

interface UseRealtimeNotificationsOptions {
  userId: string | null
  onNewNotification?: (notification: RealtimeNotification) => void
  onNotificationRead?: (notification: RealtimeNotification) => void
}

export function useRealtimeNotifications({
  userId,
  onNewNotification,
  onNotificationRead,
}: UseRealtimeNotificationsOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!userId) {
      console.log('[Realtime] No userId provided, skipping notification subscription')
      return
    }

    const channelName = `notifications:user:${userId}`

    console.log(`[Realtime] Subscribing to ${channelName}`)
    console.log('[Realtime] Supabase client:', supabase ? 'EXISTS' : 'MISSING')

    const channel = supabase
      .channel(channelName)
      // Listen for broadcast events (sent from API when notification is created)
      .on(
        'broadcast',
        { event: 'new_notification' },
        (payload) => {
          console.log('[Realtime] Broadcast notification received:', payload)
          const newNotification = payload.payload as RealtimeNotification
          console.log('[Realtime] New notification:', newNotification.id, newNotification.title)
          onNewNotification?.(newNotification)
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] Notifications subscription status:', status)
        if (err) {
          console.error('[Realtime] Notifications subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to notifications!')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error - check RLS policies and Realtime settings')
        } else if (status === 'TIMED_OUT') {
          console.error('[Realtime] Subscription timed out')
        }
      })

    channelRef.current = channel

    return () => {
      console.log('[Realtime] Unsubscribing from notifications channel')
      supabase.removeChannel(channel)
    }
  }, [userId, onNewNotification, onNotificationRead])

  return channelRef.current
}
