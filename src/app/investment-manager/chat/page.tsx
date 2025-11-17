'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  IconMessage,
  IconSend,
  IconSearch,
  IconBuilding,
  IconUsers,
  IconPaperclip,
  IconDots,
  IconChevronRight,
  IconChecks,
  IconCircleCheck,
  IconClock,
  IconFilter
} from '@tabler/icons-react'
import { getStructures } from '@/lib/structures-storage'
import { getInvestors } from '@/lib/investors-storage'

const mockInvestors = [
  {
    id: '1',
    name: 'John Smith',
    structureId: '1',
    structureName: 'Vanguard Real Estate Fund I',
    unreadCount: 2,
    lastMessage: 'Thank you for the Q4 report. When can we expect the K-1?',
    lastMessageTime: '2024-12-22T10:30:00',
    status: 'online'
  },
  {
    id: '2',
    name: 'Maria Garcia',
    structureId: '1',
    structureName: 'Vanguard Real Estate Fund I',
    unreadCount: 0,
    lastMessage: 'Received the distribution notice. Thanks!',
    lastMessageTime: '2024-12-21T14:20:00',
    status: 'offline'
  },
  {
    id: '3',
    name: 'Pacific Capital Partners',
    structureId: '1',
    structureName: 'Vanguard Real Estate Fund I',
    unreadCount: 1,
    lastMessage: 'Can we schedule a call to discuss the portfolio performance?',
    lastMessageTime: '2024-12-22T09:15:00',
    status: 'online'
  },
  {
    id: '4',
    name: 'Golden Gate Ventures',
    structureId: '2',
    structureName: 'Tech Growth SPV',
    unreadCount: 0,
    lastMessage: 'Looking forward to the exit update.',
    lastMessageTime: '2024-12-20T16:45:00',
    status: 'offline'
  },
  {
    id: '5',
    name: 'Laura Chen',
    structureId: '3',
    structureName: 'Mexico Debt Trust',
    unreadCount: 3,
    lastMessage: 'I have questions about the interest payment schedule.',
    lastMessageTime: '2024-12-22T11:00:00',
    status: 'online'
  },
]

// Generate mock messages for any investor
const generateMockMessages = (investorId: string, investorName: string) => [
  {
    id: `${investorId}-1`,
    investorId,
    sender: investorName,
    senderType: 'investor' as const,
    message: 'Hi, I just received the Q4 quarterly report. Thank you for the detailed update!',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: true
  },
  {
    id: `${investorId}-2`,
    investorId,
    sender: 'Gabriela Mena',
    senderType: 'manager' as const,
    message: `You're welcome, ${investorName.split(' ')[0]}! I'm glad you found it helpful. Please let me know if you have any questions.`,
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    read: true
  },
  {
    id: `${investorId}-3`,
    investorId,
    sender: investorName,
    senderType: 'investor' as const,
    message: 'Yes, I do have a question. When can we expect the K-1 tax forms for 2024?',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false
  },
  {
    id: `${investorId}-4`,
    investorId,
    sender: investorName,
    senderType: 'investor' as const,
    message: 'Also, I noticed the NAV increased this quarter. That\'s great news!',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    read: false
  },
]

export default function ChatPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStructure, setSelectedStructure] = useState<string>('all')
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [structures, setStructures] = useState<any[]>([])
  const [investors, setInvestors] = useState<any[]>([])

  useEffect(() => {
    const loadedStructures = getStructures()
    const loadedInvestors = getInvestors()
    setStructures(loadedStructures)
    setInvestors(loadedInvestors)

    // Auto-select first investor if available
    if (loadedInvestors.length > 0) {
      setSelectedInvestor(loadedInvestors[0].id)
    }
  }, [])

  // Map real investors to chat display format
  const chatInvestors = investors.map(inv => {
    const structure = structures.find(s => s.id === inv.fundOwnership?.fundId)
    return {
      id: inv.id,
      name: inv.name,
      structureId: inv.fundOwnership?.fundId || '',
      structureName: structure?.name || 'No Structure',
      unreadCount: Math.floor(Math.random() * 3), // Mock unread count
      lastMessage: 'Thank you for the recent update.',
      lastMessageTime: new Date().toISOString(),
      status: Math.random() > 0.5 ? 'online' : 'offline'
    }
  })

  const filteredInvestors = chatInvestors.filter(investor => {
    const matchesSearch = investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         investor.structureName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStructure = selectedStructure === 'all' || investor.structureId === selectedStructure

    return matchesSearch && matchesStructure
  })

  const currentInvestor = chatInvestors.find(inv => inv.id === selectedInvestor)
  const currentInvestorData = investors.find(inv => inv.id === selectedInvestor)
  const currentMessages = selectedInvestor && currentInvestorData
    ? generateMockMessages(selectedInvestor, currentInvestorData.name)
    : []

  const totalUnread = chatInvestors.reduce((sum, inv) => sum + inv.unreadCount, 0)

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
          <div className="relative mb-3">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Structure Filter */}
          <Select value={selectedStructure} onValueChange={setSelectedStructure}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Structures" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Structures</SelectItem>
              {structures.map(structure => (
                <SelectItem key={structure.id} value={structure.id}>
                  {structure.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredInvestors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <IconUsers className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No conversations found</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredInvestors.map((investor) => (
                <button
                  key={investor.id}
                  onClick={() => setSelectedInvestor(investor.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedInvestor === investor.id
                      ? 'bg-primary/10 border-l-4 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {investor.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {investor.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{investor.name}</p>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                          {formatMessageTime(investor.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <IconBuilding className="w-3 h-3" />
                        {investor.structureName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {investor.lastMessage}
                      </p>
                      {investor.unreadCount > 0 && (
                        <Badge className="mt-2 h-5 px-2" variant="default">
                          {investor.unreadCount} new
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
        {!selectedInvestor ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <IconMessage className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
            <p className="text-muted-foreground max-w-md">
              Choose an investor from the left to start viewing and sending messages
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
                        {currentInvestor?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {currentInvestor?.status === 'online' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentInvestor?.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IconBuilding className="w-3 h-3" />
                      <span>{currentInvestor?.structureName}</span>
                      {currentInvestor?.status === 'online' && (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedInvestor && router.push(`/investment-manager/investors/${selectedInvestor}`)}
                  >
                    View Profile
                  </Button>
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
                  className={`flex ${msg.senderType === 'manager' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[70%] ${msg.senderType === 'manager' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.senderType === 'investor' && (
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {msg.sender.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={msg.senderType === 'manager' ? 'text-right' : 'text-left'}>
                      <div
                        className={`p-3 rounded-lg ${
                          msg.senderType === 'manager'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${msg.senderType === 'manager' ? 'justify-end' : 'justify-start'}`}>
                        <span>{formatFullTime(msg.timestamp)}</span>
                        {msg.senderType === 'manager' && (
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
                    {msg.senderType === 'manager' && (
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-purple-500 text-white text-xs">
                          GM
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[70%]">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {currentInvestor?.name.charAt(0)}
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
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-end gap-3">
                <Button variant="ghost" size="sm" className="shrink-0">
                  <IconPaperclip className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message..."
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
                <span>Messages are sent in real-time to investor portal</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
