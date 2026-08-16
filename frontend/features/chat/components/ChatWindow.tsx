'use client'

import { useMemo } from 'react'
import PublicFooter from '@/shared/layout/PublicFooter'
import { useChat } from '../hooks/useChat'
import MessageInput from './MessageInput'
import MessageList, { type Message } from './MessageList'

export default function ChatWindow() {
  const { messages, activeConversationId, sendingMessage, sendMessage } = useChat()
  const normalizedMessages = useMemo<Message[]>(
    () =>
      messages.map((message) => ({
        id: message.id,
        content: message.content,
        role: message.role === 'user' ? 'user' : 'assistant',
        timestamp: message.created_at ? new Date(message.created_at) : undefined,
        status: message.status,
      })),
    [messages]
  )

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col">
      <MessageList messages={normalizedMessages} conversationKey={activeConversationId} />

      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
        <MessageInput onSend={sendMessage} disabled={sendingMessage} />
        <PublicFooter />
      </div>
    </section>
  )
}
