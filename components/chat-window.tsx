'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/use-settings'
import { ApiKeyConfigHint } from '@/components/api-key-config-hint'
import { ChatMessageBubble } from '@/components/chat-message-bubble'
import { MemorialPersonageAvatar } from '@/components/memorial-personage-avatar'
import { MarkdownMessage } from '@/components/markdown-message'
import { consumeSSEStream } from '@/lib/read-sse'
import { isLikelyApiCredentialsError } from '@/lib/api-credentials-error'
import type { Message, PersonageConfig } from '@/types'

interface ChatWindowProps {
  persona: PersonageConfig
}

export function ChatWindow({ persona }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [showApiConfigHint, setShowApiConfigHint] = useState(false)
  const { settings, loaded } = useSettings()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming || !loaded) return

    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setStreaming(true)

    setMessages([...next, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: persona.slug,
          messages: next,
          apiKey: settings.apiKey,
          baseURL: settings.baseURL,
          model: settings.model,
        }),
      })

      if (!res.ok) {
        let errMsg = res.statusText
        try {
          const j = (await res.json()) as { error?: string }
          if (j.error) errMsg = j.error
        } catch {
          try {
            errMsg = await res.text()
          } catch {
            /* keep statusText */
          }
        }
        setShowApiConfigHint(isLikelyApiCredentialsError(errMsg, res.status))
        setMessages([...next, { role: 'assistant', content: `错误：${errMsg}` }])
        return
      }

      let accumulated = ''
      const result = await consumeSSEStream(res, (t) => {
        accumulated += t
        setMessages([...next, { role: 'assistant', content: accumulated }])
      })

      if (!result.ok) {
        setShowApiConfigHint(isLikelyApiCredentialsError(result.error))
        setMessages([...next, { role: 'assistant', content: `错误：${result.error}` }])
      } else {
        setShowApiConfigHint(false)
      }
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1 min-h-0 px-4">
        <div className="py-4 space-y-4 max-w-3xl mx-auto">
          {!loaded && (
            <p className="text-center text-muted-foreground text-sm py-8">加载设置中…</p>
          )}
          {loaded && messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              开始和 {persona.name} 对话吧
            </p>
          )}
          {messages.map((msg, i) => (
            <ChatMessageBubble
              key={i}
              name={msg.role === 'user' ? '我' : persona.name}
              isUser={msg.role === 'user'}
              avatar={
                msg.role === 'assistant' ? (
                  <MemorialPersonageAvatar
                    src={persona.avatar}
                    alt={persona.name}
                    born={persona.born}
                    died={persona.died}
                    className="h-full w-full rounded-full"
                    imageClassName="object-cover"
                    sizes="36px"
                  />
                ) : undefined
              }
            >
              {msg.content ? (
                <MarkdownMessage
                  content={msg.content}
                  variant={msg.role === 'user' ? 'user' : 'assistant'}
                />
              ) : streaming && i === messages.length - 1 && msg.role === 'assistant' ? (
                <span className="text-sm">▍</span>
              ) : null}
            </ChatMessageBubble>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="mx-auto flex w-full max-w-3xl shrink-0 flex-col gap-2 bg-background/95 p-4 pt-3 backdrop-blur-sm">
        <ApiKeyConfigHint show={showApiConfigHint} />
        <div className="flex gap-2">
        <Textarea
          placeholder={loaded ? `对 ${persona.name} 说点什么…` : '…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          disabled={streaming || !loaded}
          rows={2}
          className="min-h-[44px] resize-none"
        />
        <Button
          size="icon"
          className="shrink-0 h-11 w-11"
          onClick={() => void send()}
          disabled={streaming || !loaded || !input.trim()}
          aria-label="发送"
        >
          <Send className="h-4 w-4" />
        </Button>
        </div>
      </div>
    </div>
  )
}
