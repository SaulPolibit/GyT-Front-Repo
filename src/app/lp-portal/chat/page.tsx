'use client'

import { useState, useEffect } from 'react'
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
} from '@tabler/icons-react'
import { getStructures } from '@/lib/structures-storage'
import {
  getInvestorByEmail,
  getCurrentInvestorEmail,
  getInvestorStructures,
} from '@/lib/lp-portal-helpers'

// Generate mock messages for any structure
const generateMockMessages = (structureId: string, structureName: string) => [
  {
    id: `${structureId}-1`,
    structureId,
    sender: 'You',
    senderType: 'investor' as const,
    message: 'Hi, I just reviewed the Q4 quarterly report. Thank you for the comprehensive update!',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: true
  },
  {
    id: `${structureId}-2`,
    structureId,
    sender: 'Gabriela Mena',
    senderType: 'manager' as const,
    message: `You're welcome! I'm glad you found it helpful. Please don't hesitate to reach out if you have any questions about the portfolio.`,
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    read: true
  },
  {
    id: `${structureId}-3`,
    structureId,
    sender: 'You',
    senderType: 'investor' as const,
    message: 'I do have a question about the K-1 tax forms. When can we expect those for 2024?',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: true
  },
  {
    id: `${structureId}-4`,
    structureId,
    sender: 'Gabriela Mena',
    senderType: 'manager' as const,
    message: 'K-1 forms will be distributed by March 15th. You\'ll receive an email notification when they\'re ready in the Documents section.',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    read: true
  },
  {
    id: `${structureId}-5`,
    structureId,
    sender: 'You',
    senderType: 'investor' as const,
    message: 'Perfect, thank you! Also, I noticed the NAV increased this quarter. That\'s great news!',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    read: false
  },
]

export default function LPChatPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [investorStructures, setInvestorStructures] = useState<any[]>([])

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

  // Create chat conversations from investor's structures
  const chatConversations = investorStructures.map(structure => ({
    id: structure.id,
    name: structure.name,
    type: structure.type,
    managerName: 'Gabriela Mena', // Mock manager name
    onboardingStatus: structure.onboardingStatus,
    unreadCount: Math.floor(Math.random() * 3), // Mock unread count
    lastMessage: structure.onboardingStatus === 'Active'
      ? 'K-1 forms will be distributed by March 15th.'
      : 'Welcome! Feel free to ask any questions about the onboarding process.',
    lastMessageTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    status: Math.random() > 0.5 ? 'online' : 'offline'
  }))

  const filteredConversations = chatConversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.type.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const currentConversation = chatConversations.find(conv => conv.id === selectedStructure)
  const currentMessages = selectedStructure && currentConversation
    ? generateMockMessages(selectedStructure, currentConversation.name)
    : []

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
                {totalUnread} unread conversations
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <IconDots className="w-4 h-4" />
            </Button>
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
                      {conversation.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{conversation.name}</p>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                          {formatMessageTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-muted-foreground">
                          {conversation.type} • {conversation.managerName}
                        </p>
                        {conversation.onboardingStatus !== 'Active' && (
                          <Badge variant="outline" className="h-4 text-[10px] px-1.5">
                            {conversation.onboardingStatus}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="mt-2 h-5 px-2" variant="default">
                          {conversation.unreadCount} new
                        </Badge>
                      )}
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
                    {currentConversation?.status === 'online' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentConversation?.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{currentConversation?.type}</span>
                      <span>•</span>
                      <span>Manager: {currentConversation?.managerName}</span>
                      {currentConversation?.status === 'online' && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            Online
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <IconDots className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              {/* Date Separator */}
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground font-medium">Today</span>
                <Separator className="flex-1" />
              </div>

              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'investor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[70%] ${msg.senderType === 'investor' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.senderType === 'manager' && (
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-purple-500 text-white text-xs">
                          GM
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={msg.senderType === 'investor' ? 'text-right' : 'text-left'}>
                      <div
                        className={`p-3 rounded-lg ${
                          msg.senderType === 'investor'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${msg.senderType === 'investor' ? 'justify-end' : 'justify-start'}`}>
                        <span>{formatFullTime(msg.timestamp)}</span>
                        {msg.senderType === 'investor' && (
                          <>
                            {msg.read ? (
                              <IconCircleCheck className="w-3 h-3 text-primary" />
                            ) : (
                              <IconChecks className="w-3 h-3" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {msg.senderType === 'investor' && (
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          You
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator (optional) */}
              {currentConversation?.status === 'online' && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[70%]">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-purple-500 text-white text-xs">
                        GM
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-background border p-3 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-end gap-3">
                <Button variant="ghost" size="sm" className="shrink-0">
                  <IconPaperclip className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message to the fund manager..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="min-h-[60px] resize-none"
                    rows={2}
                  />
                </div>
                <Button className="shrink-0 h-[60px]">
                  <IconSend className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <IconClock className="w-3 h-3" />
                <span>Messages are sent to the fund manager in real-time</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
