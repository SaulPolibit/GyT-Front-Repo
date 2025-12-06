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

export default function LPChatPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [investorStructures, setInvestorStructures] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUser = getCurrentUser()

  useEffect(() => {
    const email = getCurrentInvestorEmail()
    const investor = getInvestorByEmail(email)

    if (investor) {
      // Get ALL structures the investor is invited to, regardless of onboarding status
      const allStructures = getStructures()
      const investorStructuresList = investor.fundOwnerships.map(ownership => {
        const structure = allStructures.find(s => s.id === ownership.fundId)
        if (!structure) return null

        return {
          id: structure.id,
          name: ownership.fundName,
          type: structure.type,
          ownershipPercent: ownership.ownershipPercent,
          commitment: ownership.commitment,
          onboardingStatus: ownership.onboardingStatus || investor.status,
        }
      }).filter((s): s is any => s !== null)

      setInvestorStructures(investorStructuresList)

      // Auto-select first structure if available
      if (investorStructuresList.length > 0) {
        setSelectedStructure(investorStructuresList[0].id)
      }
    }
  }, [])

  // Load messages when structure is selected
  useEffect(() => {
    if (selectedStructure) {
      loadMessages(selectedStructure)
    }
  }, [selectedStructure])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        setMessages(result.data.reverse()) // Reverse to show oldest first

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
    if (!selectedStructure) return

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
          getApiUrl(API_CONFIG.endpoints.sendFileMessage(selectedStructure)),
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
          getApiUrl(API_CONFIG.endpoints.sendMessage(selectedStructure)),
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

  // Create chat conversations from investor's structures
  const chatConversations = investorStructures.map(structure => ({
    id: structure.id,
    name: structure.name,
    type: structure.type,
    managerName: 'Fund Manager',
    onboardingStatus: structure.onboardingStatus,
    unreadCount: 0, // Will be calculated from actual messages
    lastMessage: 'Start a conversation...',
    lastMessageTime: new Date().toISOString(),
    status: 'online',
  }))

  const filteredConversations = chatConversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.type.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const currentConversation = chatConversations.find(conv => conv.id === selectedStructure)
  const totalUnread = chatConversations.reduce((sum, conv) => sum + conv.unreadCount, 0)

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
                {investorStructures.length} conversations
              </p>
            </div>
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
                Complete onboarding to start chatting with fund managers
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedStructure(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedStructure === conversation.id
                      ? 'bg-primary/10 border-l-4 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          <IconBuilding className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{conversation.name}</p>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-muted-foreground">
                          {conversation.type}
                        </p>
                        {conversation.onboardingStatus !== 'Active' && (
                          <Badge variant="outline" className="h-4 text-[10px] px-1.5">
                            {conversation.onboardingStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {!selectedStructure ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <IconMessage className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
            <p className="text-muted-foreground max-w-md">
              Choose a fund from the left to start viewing and sending messages to the fund manager
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
                      <AvatarFallback className="bg-primary/20 text-primary">
                        <IconBuilding className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentConversation?.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{currentConversation?.type}</span>
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
                                FM
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
                    placeholder="Type your message to the fund manager..."
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
