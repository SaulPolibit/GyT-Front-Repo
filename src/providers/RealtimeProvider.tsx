'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { getCurrentUser } from '@/lib/auth-storage'
import { toast } from 'sonner'

interface RealtimeNotification {
  id: string
  user_id: string
  notification_type: string
  title: string
  message: string
  read_at: string | null
  created_at: string
}

interface RealtimeMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: string
  created_at: string
}

interface RealtimeContextType {
  unreadMessagesCount: number
  unreadNotificationsCount: number
  lastMessage: RealtimeMessage | null
  lastNotification: RealtimeNotification | null
  incrementUnreadMessages: () => void
  decrementUnreadMessages: (count?: number) => void
  incrementUnreadNotifications: () => void
  decrementUnreadNotifications: (count?: number) => void
  resetUnreadMessages: () => void
  resetUnreadNotifications: () => void
  setUnreadMessagesCount: (count: number) => void
  setUnreadNotificationsCount: (count: number) => void
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

// Safe hook that doesn't throw if used outside provider
export function useRealtimeSafe() {
  return useContext(RealtimeContext)
}

interface RealtimeProviderProps {
  children: React.ReactNode
  initialUnreadMessages?: number
  initialUnreadNotifications?: number
}

export function RealtimeProvider({
  children,
  initialUnreadMessages = 0,
  initialUnreadNotifications = 0,
}: RealtimeProviderProps) {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(initialUnreadMessages)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(initialUnreadNotifications)
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null)
  const [lastNotification, setLastNotification] = useState<RealtimeNotification | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (user?.id) {
      setUserId(user.id)
    }
  }, [])

  const handleNewMessage = useCallback((message: RealtimeMessage) => {
    setUnreadMessagesCount((prev) => prev + 1)
    setLastMessage(message)

    toast.info('New message received', {
      description: message.content?.substring(0, 50) + (message.content?.length > 50 ? '...' : ''),
    })

    // Play notification sound
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    } catch {
      // Audio not supported or file not found
    }
  }, [])

  const handleNewNotification = useCallback((notification: RealtimeNotification) => {
    setUnreadNotificationsCount((prev) => prev + 1)
    setLastNotification(notification)

    toast.info(notification.title || 'New notification', {
      description: notification.message?.substring(0, 100),
    })
  }, [])

  const handleNotificationRead = useCallback(() => {
    setUnreadNotificationsCount((prev) => Math.max(0, prev - 1))
  }, [])

  useRealtimeMessages({
    userId,
    onNewMessage: handleNewMessage,
  })

  useRealtimeNotifications({
    userId,
    onNewNotification: handleNewNotification,
    onNotificationRead: handleNotificationRead,
  })

  const value: RealtimeContextType = {
    unreadMessagesCount,
    unreadNotificationsCount,
    lastMessage,
    lastNotification,
    incrementUnreadMessages: () => setUnreadMessagesCount((prev) => prev + 1),
    decrementUnreadMessages: (count = 1) => setUnreadMessagesCount((prev) => Math.max(0, prev - count)),
    incrementUnreadNotifications: () => setUnreadNotificationsCount((prev) => prev + 1),
    decrementUnreadNotifications: (count = 1) => setUnreadNotificationsCount((prev) => Math.max(0, prev - count)),
    resetUnreadMessages: () => setUnreadMessagesCount(0),
    resetUnreadNotifications: () => setUnreadNotificationsCount(0),
    setUnreadMessagesCount,
    setUnreadNotificationsCount,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}
