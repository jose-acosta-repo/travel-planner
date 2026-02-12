'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Sparkles } from 'lucide-react'

interface Message {
  id: string
  user: {
    name: string
    avatar?: string
    initials: string
  }
  message: string
  timestamp: string
  isCurrentUser?: boolean
  isAI?: boolean
}

interface DiscussionPanelProps {
  tripId: string
}

export function DiscussionPanel({ tripId }: DiscussionPanelProps) {
  const { data: session } = useSession()
  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages from API
  useEffect(() => {
    async function loadMessages() {
      try {
        const response = await fetch(`/api/trips/${tripId}/messages`)
        if (response.ok) {
          const data = await response.json()
          const currentUserName = session?.user?.name || 'You'

          const mappedMessages = (data.messages || []).map((msg: any) => ({
            id: msg.id,
            user: {
              name: msg.user_name === currentUserName ? 'You' : msg.user_name,
              initials: msg.user_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
            },
            message: msg.message,
            timestamp: formatTimestamp(msg.created_at),
            isCurrentUser: msg.user_name === currentUserName,
            isAI: msg.is_ai || false,
          }))
          setMessages(mappedMessages)
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [tripId, session])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) {
      return 'Just now'
    } else if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const handleSendMessage = async () => {
    if (messageInput.trim() && !sending) {
      setSending(true)
      try {
        const response = await fetch(`/api/trips/${tripId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageInput.trim(),
          }),
        })

        if (response.ok) {
          setMessageInput('')
          // Reload messages to show the new one
          const messagesResponse = await fetch(`/api/trips/${tripId}/messages`)
          if (messagesResponse.ok) {
            const data = await messagesResponse.json()
            const currentUserName = session?.user?.name || 'You'

            const mappedMessages = (data.messages || []).map((msg: any) => ({
              id: msg.id,
              user: {
                name: msg.user_name === currentUserName ? 'You' : msg.user_name,
                initials: msg.user_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
              },
              message: msg.message,
              timestamp: formatTimestamp(msg.created_at),
              isCurrentUser: msg.user_name === currentUserName,
              isAI: msg.is_ai || false,
            }))
            setMessages(mappedMessages)
          }
        }
      } catch (error) {
        console.error('Error sending message:', error)
      } finally {
        setSending(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>Discussion</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-6 pt-0">
        {/* Messages Area */}
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-gray-500 dark:text-gray-400">No messages yet.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Start the conversation!
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                msg.isAI ? (
                  <div
                    key={msg.id}
                    className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase">
                        AI Suggestion
                      </span>
                    </div>
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {msg.message}
                    </p>
                  </div>
                ) : (
                  <div
                    key={msg.id}
                    className={msg.isCurrentUser ? 'text-sm text-right' : 'text-sm'}
                  >
                    {msg.isCurrentUser ? (
                      <>
                        <div className="flex items-start justify-end gap-2 mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {msg.timestamp}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {msg.user.name}
                          </span>
                        </div>
                        <div className="inline-block bg-blue-600 text-white rounded-lg px-4 py-2">
                          {msg.message}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-2 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {msg.user.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{msg.message}</p>
                      </>
                    )}
                  </div>
                )
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !messageInput.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
