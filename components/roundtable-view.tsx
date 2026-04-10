'use client'

import { useState, useRef, useEffect } from 'react'
import { MemorialPersonageAvatar } from '@/components/memorial-personage-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/use-settings'
import { ApiKeyConfigHint } from '@/components/api-key-config-hint'
import { ChatMessageBubble } from '@/components/chat-message-bubble'
import { MarkdownMessage } from '@/components/markdown-message'
import { consumeSSEStream } from '@/lib/read-sse'
import { isLikelyApiCredentialsError } from '@/lib/api-credentials-error'
import { personagesConfig } from '@/personages.config'
import type { PersonageConfig, RoundtableEntry } from '@/types'

const MAX_ROUNDS = 5
const USER_SPEAKER = '我'

export function RoundtableView() {
  const [selected, setSelected] = useState<PersonageConfig[]>([])
  const [topic, setTopic] = useState('')
  const [history, setHistory] = useState<RoundtableEntry[]>([])
  const [streaming, setStreaming] = useState(false)
  const [round, setRound] = useState(0)
  const [started, setStarted] = useState(false)
  const [userNote, setUserNote] = useState('')
  const [showApiConfigHint, setShowApiConfigHint] = useState(false)
  const { settings, loaded } = useSettings()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streaming])

  const togglePersona = (p: PersonageConfig) => {
    setSelected((prev) =>
      prev.find((x) => x.slug === p.slug) ? prev.filter((x) => x.slug !== p.slug) : [...prev, p]
    )
  }

  const appendUserOpinion = async () => {
    const t = userNote.trim()
    if (!t || streaming) return
    const newHistory = [...history, { speaker: USER_SPEAKER, content: t }]
    setHistory(newHistory)
    setUserNote('')

    if (round >= MAX_ROUNDS) return
    setRound((r) => r + 1)
    await runRound(newHistory)
  }

  const runRound = async (currentHistory: RoundtableEntry[]) => {
    setStreaming(true)
    let roundHistory = [...currentHistory]

    for (const persona of selected) {
      const streamEntry: RoundtableEntry = { speaker: persona.name, content: '' }
      roundHistory = [...roundHistory, streamEntry]
      setHistory([...roundHistory])

      const res = await fetch('/api/roundtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: persona.slug,
          topic,
          history: roundHistory.slice(0, -1),
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
            /* keep */
          }
        }
        setShowApiConfigHint(isLikelyApiCredentialsError(errMsg, res.status))
        roundHistory[roundHistory.length - 1].content = `错误：${errMsg}`
        setHistory([...roundHistory])
        setStreaming(false)
        return
      }

      let accumulated = ''
      const lastIdx = roundHistory.length - 1
      const result = await consumeSSEStream(res, (text) => {
        accumulated += text
        roundHistory[lastIdx] = { ...roundHistory[lastIdx], content: accumulated }
        setHistory([...roundHistory])
      })

      if (!result.ok) {
        setShowApiConfigHint(isLikelyApiCredentialsError(result.error))
        roundHistory[lastIdx] = {
          ...roundHistory[lastIdx],
          content: `错误：${result.error}`,
        }
        setHistory([...roundHistory])
        setStreaming(false)
        return
      }
    }

    setShowApiConfigHint(false)
    setHistory(roundHistory)
    setStreaming(false)
  }

  const handleStart = async () => {
    if (selected.length < 2 || !topic.trim() || !loaded) return
    setShowApiConfigHint(false)
    setStarted(true)
    setHistory([])
    setRound(1)
    await runRound([])
  }

  const handleNextRound = async () => {
    if (round >= MAX_ROUNDS) return
    setRound((r) => r + 1)
    await runRound(history)
  }

  const clearChatLog = () => {
    setHistory([])
    setRound(0)
    setUserNote('')
    setShowApiConfigHint(false)
  }

  if (!started) {
    return (
      <div className="container mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6">
        <div className="space-y-3">
          <h2 className="text-[1.25rem] font-semibold leading-[1.2] tracking-normal">
            选择参与讨论的人物（至少 2 位）
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {personagesConfig.map((p) => {
              const active = !!selected.find((x) => x.slug === p.slug)
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => togglePersona(p)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? 'border-primary bg-primary/12 shadow-[0_0_0_1px_rgba(201,100,66,0.35)]'
                      : 'border-border bg-card hover:bg-accent'
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted mb-2">
                    <MemorialPersonageAvatar
                      src={p.avatar}
                      alt={p.name}
                      born={p.born}
                      died={p.died}
                      className="h-full w-full rounded-full"
                      imageClassName="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{p.description}</div>
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-[1.25rem] font-semibold leading-[1.2] tracking-normal">
            讨论话题
          </h2>
          <Input
            placeholder="例如：创业公司该不该先追求盈利"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleStart()
            }}
          />
        </div>
        <Button
          className="w-full"
          disabled={selected.length < 2 || !topic.trim() || !loaded}
          onClick={() => void handleStart()}
        >
          {loaded ? '开始讨论' : '加载中…'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-background/80 px-4 py-2.5 text-[0.94rem] text-muted-foreground backdrop-blur-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate max-w-[min(100%,28rem)]">话题：{topic}</span>
          <span aria-hidden>·</span>
          <span>{round > 0 ? `第 ${round} 轮` : '尚未开始'}</span>
          {round >= MAX_ROUNDS && (
            <Badge variant="outline" className="text-xs font-normal">
              讨论已较长，建议开启新话题以获得更好效果
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          disabled={streaming || (history.length === 0 && round === 0)}
          onClick={clearChatLog}
        >
          清空聊天记录
        </Button>
      </div>
      <ScrollArea className="flex-1 min-h-0 px-4">
        <div className="py-4 space-y-4 max-w-3xl mx-auto">
          {history.map((entry, i) => {
            const isUser = entry.speaker === USER_SPEAKER
            const entryPersona = !isUser
              ? selected.find((p) => p.name === entry.speaker)
              : undefined
            return (
              <ChatMessageBubble
                key={`${entry.speaker}-${i}`}
                name={entry.speaker}
                isUser={isUser}
                avatar={
                  !isUser && entryPersona ? (
                    <MemorialPersonageAvatar
                      src={entryPersona.avatar}
                      alt={entryPersona.name}
                      born={entryPersona.born}
                      died={entryPersona.died}
                      className="h-full w-full rounded-full"
                      imageClassName="object-cover"
                      sizes="36px"
                    />
                  ) : undefined
                }
              >
                {entry.content ? (
                  <MarkdownMessage
                    content={entry.content}
                    variant={isUser ? 'user' : 'assistant'}
                  />
                ) : streaming && i === history.length - 1 ? (
                  <span className="text-sm">▍</span>
                ) : null}
              </ChatMessageBubble>
            )
          })}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={streaming || round >= MAX_ROUNDS}
              onClick={() => void handleNextRound()}
            >
              {streaming ? '讨论中…' : '你们再聊一轮'}
            </Button>
            {round >= MAX_ROUNDS && !streaming && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                已达轮次上限，可先清空聊天记录再聊
              </p>
            )}
          </div>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="mx-auto w-full max-w-3xl shrink-0 space-y-3 bg-background/95 p-4 backdrop-blur-sm">
        <ApiKeyConfigHint show={showApiConfigHint} />
        <div className="flex gap-2 items-center">
          <Input
            placeholder="一轮结束后，可补充你的观点（可选）"
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            disabled={streaming}
            className="min-w-0 flex-1 h-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void appendUserOpinion()
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="h-9 shrink-0 px-4"
            disabled={streaming || !userNote.trim()}
            onClick={() => void appendUserOpinion()}
          >
            发表观点
          </Button>
        </div>
      </div>
    </div>
  )
}
