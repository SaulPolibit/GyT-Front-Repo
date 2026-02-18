"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { X, Bell, BellOff, Check, CheckCheck, Clock, AlertCircle, FileText, DollarSign, TrendingUp, Shield, MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useNotifications, useUnreadNotificationCount } from "@/lib/swr-hooks"
import { getAuthToken } from "@/lib/auth-storage"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { formatDistanceToNow } from "date-fns"

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

// Notification type icons
const notificationIcons: Record<string, React.ElementType> = {
  capital_call_notice: DollarSign,
  distribution_notice: TrendingUp,
  quarterly_report: FileText,
  k1_tax_form: FileText,
  document_upload: FileText,
  general_announcement: Bell,
  urgent_capital_call: AlertCircle,
  payment_confirmation: Check,
  security_alert: Shield,
  investor_activity: MessageSquare,
  system_update: Bell,
  mfa_enabled: Shield,
  mfa_disabled: Shield,
  profile_updated: Bell,
  stripe_onboarding: DollarSign,
  stripe_payout: DollarSign,
  approval_required: AlertCircle,
  approval_completed: Check,
  new_investment: TrendingUp,
  investment_update: TrendingUp,
}

// Notification priority colors
const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const router = useRouter()
  const panelRef = React.useRef<HTMLDivElement>(null)

  // Use SWR hooks for notifications
  const { notifications, isLoading, mutate } = useNotifications()
  const { count: unreadCount, mutate: mutateCount } = useUnreadNotificationCount()

  // Close panel when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      // Delay adding listener to prevent immediate close
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside)
      }, 100)
      return () => {
        clearTimeout(timer)
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isOpen, onClose])

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  // Mark notification as read and navigate
  const handleNotificationClick = async (notification: any) => {
    try {
      const token = getAuthToken()
      if (!token) return

      // Mark as read if not already
      if (!notification.readAt) {
        await fetch(
          getApiUrl(API_CONFIG.endpoints.markNotificationAsRead(notification.id)),
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        // Refresh notifications
        mutate()
        mutateCount()
      }

      // Navigate to action URL if available
      if (notification.actionUrl) {
        onClose()
        router.push(notification.actionUrl)
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      await fetch(
        getApiUrl(API_CONFIG.endpoints.markAllNotificationsAsRead),
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      // Refresh notifications
      mutate()
      mutateCount()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    const Icon = notificationIcons[type] || Bell
    return Icon
  }

  // Format notification time
  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return ""
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[480px] md:w-[50%] max-w-2xl bg-background border-l shadow-xl z-50",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all as read
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-65px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <BellOff className="h-12 w-12 mb-3" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: any) => {
                const Icon = getNotificationIcon(notification.notificationType)
                const isUnread = !notification.readAt

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                      isUnread && "bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                          priorityColors[notification.priority] || priorityColors.normal
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              isUnread && "font-semibold"
                            )}
                          >
                            {notification.title}
                          </p>
                          {isUnread && (
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.priority !== "normal" && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs capitalize",
                                notification.priority === "urgent" && "border-red-500 text-red-600",
                                notification.priority === "high" && "border-orange-500 text-orange-600"
                              )}
                            >
                              {notification.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
