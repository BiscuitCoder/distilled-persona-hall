'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/use-settings'
import { consumeSSEStream } from '@/lib/read-sse'
import type { Message } from '@/types'

interface ChatWindowProps {
  slug: string
  personaName: string
}

export function ChatWindow({ slug, personaName }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
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
          slug,
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
        setMessages([...next, { role: 'assistant', content: `错误：${errMsg}` }])
        return
      }

      let accumulated = ''
      const result = await consumeSSEStream(res, (t) => {
        accumulated += t
        setMessages([...next, { role: 'assistant', content: accumulated }])
      })

      if (!result.ok) {
        setMessages([...next, { role: 'assistant', content: `错误：${result.error}` }])
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
              开始和 {personaName} 对话吧
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.content ||
                  (streaming && i === messages.length - 1 && msg.role === 'assistant'
                    ? '▍'
                    : '')}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-4 flex gap-2 shrink-0 max-w-3xl w-full mx-auto">
        <Textarea
          placeholder={loaded ? `对 ${personaName} 说点什么…` : '…'}
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
  )
}
