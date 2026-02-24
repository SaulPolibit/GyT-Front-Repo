'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: string
  created_at: string
}

interface UseRealtimeMessagesOptions {
  userId: string | null
  conversationId?: string | null
  onNewMessage?: (message: RealtimeMessage) => void
  onMessageUpdated?: (message: RealtimeMessage) => void
  onMessageDeleted?: (message: RealtimeMessage) => void
}

export function useRealtimeMessages({
  userId,
  conversationId,
  onNewMessage,
  onMessageUpdated,
  onMessageDeleted,
}: UseRealtimeMessagesOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onNewMessageRef = useRef(onNewMessage)
  const userIdRef = useRef(userId)

  // Keep refs updated
  onNewMessageRef.current = onNewMessage
  userIdRef.current = userId

  useEffect(() => {
    if (!userId) return

    // Use a consistent channel name for broadcast
    const channelName = 'messages:broadcast'

    console.log(`[Realtime] Subscribing to broadcast channel: ${channelName}`)
    console.log(`[Realtime] Current userId: ${userId}`)

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false }, // Don't receive own broadcasts
        },
      })
      // Listen for broadcast events
      .on(
        'broadcast',
        { event: 'new_message' },
        (payload) => {
          console.log('[Realtime] *** BROADCAST RECEIVED ***')
          console.log('[Realtime] Full payload:', JSON.stringify(payload, null, 2))
          const newMessage = payload.payload as RealtimeMessage

          if (!newMessage) {
            console.error('[Realtime] No payload.payload in broadcast!')
            return
          }

          console.log('[Realtime] Message sender_id:', newMessage.sender_id)
          console.log('[Realtime] Current userId:', userIdRef.current)

          // Filter out own messages
          if (newMessage.sender_id !== userIdRef.current) {
            console.log('[Realtime] New message from OTHER user:', newMessage.id)
            onNewMessageRef.current?.(newMessage)
          } else {
            console.log('[Realtime] Ignoring own message')
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] Broadcast subscription status:', status)
        if (err) {
          console.error('[Realtime] Broadcast subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✓ Successfully subscribed to broadcast channel!')
        }
      })

    channelRef.current = channel

    return () => {
      console.log('[Realtime] Unsubscribing from broadcast channel')
      supabase.removeChannel(channel)
    }
  }, [userId]) // Only depend on userId, use refs for callbacks

  return channelRef.current
}
