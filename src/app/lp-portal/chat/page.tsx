'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  IconMessage,
  IconSend,
  IconSearch,
  IconBuilding,
  IconPaperclip,
  IconDots,
  IconChecks,
  IconCircleCheck,
  IconClock,
  IconX,
  IconDownload,
  IconPlus,
  IconUser,
  IconTrash,
} from '@tabler/icons-react'
import { getStructures } from '@/lib/structures-storage'
import {
  getInvestorByEmail,
  getCurrentInvestorEmail,
} from '@/lib/lp-portal-helpers'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken, getCurrentUser } from '@/lib/auth-storage'
import { toast } from 'sonner'

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: 'text' | 'file' | 'system'
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  attachments?: Array<{
    id: string
    messageId: string
    filePath: string
    fileName: string
    fileSize: number
    mimeType: string
  }>
}

interface Conversation {
  id: string
  name: string
  type: 'direct' | 'structure'
  participantId?: string
  participantName?: string
  participantRole?: number
  structureType?: string
  onboardingStatus?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

interface AdminStaffUser {
  id: string
  firstName: string
  lastName: string
  email: string
  profileImage?: string
  role: number
  roleName: string
}

export default function LPChatPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [adminStaffUsers, setAdminStaffUsers] = useState<AdminStaffUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUser = getCurrentUser()

  useEffect(() => {
    loadConversations()
    loadAdminStaffUsers()
  }, [])

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    const token = getAuthToken()
    if (!token) return

    try {
      // Fetch conversations from API
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getConversations), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const apiConversations: Conversation[] = result.data.map((conv: any) => {
            // For direct conversations, get the OTHER participant's name (not current user)
            let conversationName = conv.name || conv.title || 'Conversation'

            if (conv.type === 'direct') {
              // First try to get from participants array (most reliable)
              if (conv.participants && conv.participants.length > 0) {
                const otherParticipant = conv.participants.find((p: any) => {
                  const participantId = p.userId || p.id || p.user_id
                  return participantId !== currentUser?.id
                })

                if (otherParticipant) {
                  // Try to get the user's name from various possible fields
                  const participant = otherParticipant.user || otherParticipant
                  conversationName = participant.firstName && participant.lastName
                    ? `${participant.firstName} ${participant.lastName}`.trim()
                    : participant.name || participant.username || conversationName
                }
              }
              // If participants array didn't work, try participantName field
              // But only if we haven't already found a name from participants
              else if (conv.participantName && conversationName === (conv.name || conv.title || 'Conversation')) {
                conversationName = conv.participantName
              }
            }

            return {
              id: conv.id,
              name: conversationName,
              type: conv.type || 'direct',
              participantId: conv.participantId,
              participantName: conv.participantName,
              participantRole: conv.participantRole,
              lastMessage: conv.lastMessage,
              lastMessageTime: conv.lastMessageTime || conv.updatedAt,
              unreadCount: conv.unreadCount || 0,
            }
          })

          setConversations(apiConversations)

          // Auto-select first conversation
          if (apiConversations.length > 0 && !selectedConversation) {
            setSelectedConversation(apiConversations[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }

    // Also load structure-based conversations from localStorage (fallback)
    const email = getCurrentInvestorEmail()
    const investor = getInvestorByEmail(email)

    if (investor) {
      const allStructures = getStructures()
      const structureConversations: Conversation[] = investor.fundOwnerships.map(ownership => {
        const structure = allStructures.find(s => s.id === ownership.fundId)
        if (!structure) return null

        return {
          id: structure.id,
          name: ownership.fundName,
          type: 'structure' as const,
          structureType: structure.type,
          onboardingStatus: ownership.onboardingStatus || investor.status,
          lastMessage: 'Start a conversation...',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        }
      }).filter((s): s is Conversation => s !== null)

      // Merge structure conversations with API conversations (avoid duplicates)
      const existingIds = new Set(conversations.map(c => c.id))
      const newStructureConvs = structureConversations.filter(sc => !existingIds.has(sc.id))

      if (newStructureConvs.length > 0) {
        setConversations(prev => [...prev, ...newStructureConvs])
      }

      // Auto-select first conversation if none selected
      if (!selectedConversation && structureConversations.length > 0) {
        setSelectedConversation(structureConversations[0].id)
      }
    }
  }

  const loadAdminStaffUsers = async () => {
    const token = getAuthToken()
    if (!token) return

    setLoadingUsers(true)

    try {
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getAvailableUsers), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setAdminStaffUsers(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading admin/staff users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const createConversation = async (user: AdminStaffUser) => {
    const token = getAuthToken()
    if (!token) {
      toast.error('Authentication required')
      return
    }

    const participantName = `${user.firstName} ${user.lastName}`.trim()

    try {
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.createConversation), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantIds: [user.id],
          type: 'direct',
          name: participantName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const result = await response.json()

      if (result.success && result.data) {
        const newConversation: Conversation = {
          id: result.data.id,
          name: participantName,
          type: 'direct',
          participantId: user.id,
          participantName,
          participantRole: user.role,
          lastMessage: '',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        }

        setConversations(prev => [newConversation, ...prev])
        setSelectedConversation(newConversation.id)
        setShowNewChatDialog(false)
        toast.success(`Conversation with ${participantName} created`)
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error)
      toast.error(error.message || 'Failed to create conversation')
    }
  }

  const loadMessages = async (conversationId: string) => {
    setLoading(true)
    const token = getAuthToken()

    if (!token) {
      toast.error('Authentication required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.getMessages(conversationId)) + '?limit=100',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        if (response.status === 403) {
          // Not a participant - show empty state
          setMessages([])
          setLoading(false)
          return
        }
        throw new Error('Failed to load messages')
      }

      const result = await response.json()

      if (result.success && result.data) {
        // Messages should be ordered oldest to newest (chronological)
        setMessages(result.data)

        // Mark unread messages as read
        result.data.forEach((msg: Message) => {
          if (msg.senderId !== currentUser?.id) {
            markAsRead(msg.id)
          }
        })
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      // Don't show error toast - just use empty state
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() && !selectedFile) return
    if (!selectedConversation) return

    setSending(true)
    const token = getAuthToken()

    if (!token) {
      toast.error('Authentication required')
      setSending(false)
      return
    }

    try {
      let response

      if (selectedFile) {
        // Send file message
        const formData = new FormData()
        formData.append('file', selectedFile)
        if (messageInput.trim()) {
          formData.append('content', messageInput.trim())
        }

        response = await fetch(
          getApiUrl(API_CONFIG.endpoints.sendFileMessage(selectedConversation)),
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          }
        )
      } else {
        // Send text message
        response = await fetch(
          getApiUrl(API_CONFIG.endpoints.sendMessage(selectedConversation)),
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: messageInput.trim(),
              type: 'text',
            }),
          }
        )
      }

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setMessages([...messages, result.data])
        setMessageInput('')
        setSelectedFile(null)
        scrollToBottom()
      } else {
        throw new Error(result.message || 'Failed to send message')
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    const token = getAuthToken()
    if (!token) return

    try {
      await fetch(
        getApiUrl(API_CONFIG.endpoints.markMessageAsRead(messageId)),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    const token = getAuthToken()
    if (!token) return

    try {
      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.deleteMessage(messageId)),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete message')
      }

      const result = await response.json()

      if (result.success) {
        setMessages(messages.filter(msg => msg.id !== messageId))
        toast.success('Message deleted')
      }
    } catch (error: any) {
      console.error('Error deleting message:', error)
      toast.error(error.message || 'Failed to delete message')
    }
  }

  const deleteConversation = async (conversationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // Prevent conversation selection when clicking delete
    }

    // Confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    const token = getAuthToken()
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      const response = await fetch(
        getApiUrl(API_CONFIG.endpoints.deleteConversation(conversationId)),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = 'Failed to delete conversation'

        try {
          const responseText = await response.text()
          console.log('Raw error response:', responseText)

          if (responseText) {
            const errorData = JSON.parse(responseText)
            console.error('Parsed error response:', errorData)

            // Try multiple fields to get the error message
            if (errorData.message) {
              errorMessage = errorData.message
            } else if (errorData.error) {
              errorMessage = errorData.error
            } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
              // Extract message from errors array
              errorMessage = errorData.errors[0].message || errorMessage
            }
          }
        } catch (parseError) {
          // If response is not JSON, use status text
          console.error('Failed to parse error response:', parseError)
          errorMessage = `${errorMessage} (${response.status}: ${response.statusText})`
        }

        console.log('Showing error toast:', errorMessage)
        toast.error(errorMessage)
        return
      }

      const result = await response.json()

      if (result.success) {
        // Remove conversation from list
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))

        // If deleted conversation was selected, clear selection
        if (selectedConversation === conversationId) {
          setSelectedConversation(null)
          setMessages([])
        }

        toast.success('Conversation deleted successfully')
      } else {
        // API returned success: false
        toast.error(result.error || result.message || 'Failed to delete conversation')
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error)
      // Network error or other exception
      toast.error(error.message || 'Network error: Unable to delete conversation')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
      toast.success('File selected. Click send to upload.')
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getRoleBadgeColor = (role: number) => {
    switch (role) {
      case 1: return 'bg-red-500 text-white'
      case 2: return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getRoleName = (role: number) => {
    switch (role) {
      case 1: return 'Admin'
      case 2: return 'Staff'
      case 3: return 'Investor'
      default: return 'User'
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (conv.structureType?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                         (conv.participantName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    return matchesSearch
  })

  const currentConversation = conversations.find(conv => conv.id === selectedConversation)
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const formatFullTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="flex-1 flex h-[calc(100vh-var(--header-height))] overflow-hidden">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 border-r flex flex-col bg-muted/20">
        {/* Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Messages</h2>
              <p className="text-xs text-muted-foreground">
                {conversations.length} conversations
              </p>
            </div>
            <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <IconPlus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                  <DialogDescription>
                    Select an admin or staff member to start chatting with
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : adminStaffUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <IconUser className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No admin or staff members available</p>
                    </div>
                  ) : (
                    adminStaffUsers.map((user) => {
                      const fullName = `${user.firstName} ${user.lastName}`.trim()
                      const initials = user.firstName && user.lastName
                        ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
                        : user.firstName?.substring(0, 2).toUpperCase() || 'U'

                      return (
                        <button
                          key={user.id}
                          onClick={() => createConversation(user)}
                          className="w-full p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              {user.profileImage ? (
                                <img src={user.profileImage} alt={fullName} className="w-full h-full object-cover" />
                              ) : (
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {initials}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{fullName}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {getRoleName(user.role)}
                            </Badge>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <IconBuilding className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No conversations found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "New" to start chatting
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`relative group w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${
                    selectedConversation === conversation.id
                      ? 'bg-primary/10 border-l-4 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={conversation.type === 'structure' ? 'bg-primary/20 text-primary' : 'bg-purple-500 text-white'}>
                          {conversation.type === 'structure' ? (
                            <IconBuilding className="w-5 h-5" />
                          ) : (
                            conversation.name.substring(0, 2).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{conversation.name}</p>
                        <button
                          onClick={(e) => deleteConversation(conversation.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                          title="Delete conversation"
                        >
                          <IconTrash className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-muted-foreground">
                          {conversation.type === 'structure' ? conversation.structureType : getRoleName(conversation.participantRole || 0)}
                        </p>
                        {conversation.onboardingStatus && conversation.onboardingStatus !== 'Active' && (
                          <Badge variant="outline" className="h-4 text-[10px] px-1.5">
                            {conversation.onboardingStatus}
                          </Badge>
                        )}
                      </div>
                      {(conversation.unreadCount || 0) > 0 && (
                        <Badge className="mt-2 h-5 px-2" variant="default">
                          {conversation.unreadCount} new
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <IconMessage className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
            <p className="text-muted-foreground max-w-md">
              Choose a conversation from the left or start a new chat with admin/staff
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={currentConversation?.type === 'structure' ? 'bg-primary/20 text-primary' : 'bg-purple-500 text-white'}>
                        {currentConversation?.type === 'structure' ? (
                          <IconBuilding className="w-5 h-5" />
                        ) : (
                          currentConversation?.name.substring(0, 2).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentConversation?.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {currentConversation?.type === 'structure'
                          ? currentConversation.structureType
                          : getRoleName(currentConversation?.participantRole || 0)
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <IconMessage className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Date Separator */}
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground font-medium">Messages</span>
                    <Separator className="flex-1" />
                  </div>

                  {messages.map((msg) => {
                    const isOwnMessage = msg.senderId === currentUser?.id

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-3 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isOwnMessage && (
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className="bg-purple-500 text-white text-xs">
                                {currentConversation?.type === 'structure' ? 'FM' : currentConversation?.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={isOwnMessage ? 'text-right' : 'text-left'}>
                            <div
                              className={`p-3 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-background border'
                              }`}
                            >
                              {msg.type === 'file' && msg.attachments && msg.attachments.length > 0 ? (
                                <div className="space-y-2">
                                  {msg.attachments.map((attachment) => (
                                    <a
                                      key={attachment.id}
                                      href={attachment.filePath}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 p-2 rounded border ${
                                        isOwnMessage
                                          ? 'border-primary-foreground/20 hover:bg-primary-foreground/10'
                                          : 'hover:bg-muted'
                                      }`}
                                    >
                                      <IconPaperclip className="w-4 h-4" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                                        <p className="text-xs opacity-70">{formatFileSize(attachment.fileSize)}</p>
                                      </div>
                                      <IconDownload className="w-4 h-4" />
                                    </a>
                                  ))}
                                  {msg.content && msg.content !== 'Sent a file' && (
                                    <p className="text-sm mt-2">{msg.content}</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm">{msg.content}</p>
                              )}
                            </div>
                            <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <span>{formatFullTime(msg.createdAt)}</span>
                              {isOwnMessage && (
                                <button
                                  onClick={() => deleteMessage(msg.id)}
                                  className="hover:text-destructive"
                                  title="Delete message"
                                >
                                  <IconX className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          {isOwnMessage && (
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                You
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              {selectedFile && (
                <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconPaperclip className="w-4 h-4" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeSelectedFile}
                  >
                    <IconX className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-end gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconPaperclip className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <Textarea
                    placeholder={`Message ${currentConversation?.name}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="min-h-[60px] resize-none"
                    rows={2}
                    disabled={sending}
                  />
                </div>
                <Button
                  className="shrink-0 h-[60px]"
                  onClick={sendMessage}
                  disabled={sending || (!messageInput.trim() && !selectedFile)}
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <IconSend className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <IconClock className="w-3 h-3" />
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
