'use client'

import PublicFooter from '@/components/layout/PublicFooter'
import { useChat } from '../hooks/useChat'
import MessageInput from './MessageInput'
import MessageList from './MessageList'

export default function ChatWindow() {
  const { messages, sendingMessage, sendMessage } = useChat()

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-custom">
        <MessageList messages={messages} />
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
        <MessageInput onSend={sendMessage} disabled={sendingMessage} />
        <PublicFooter />
      </div>
    </section>
  )
}
