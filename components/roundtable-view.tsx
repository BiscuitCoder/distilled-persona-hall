'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/use-settings'
import { consumeSSEStream } from '@/lib/read-sse'
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

  const appendUserOpinion = () => {
    const t = userNote.trim()
    if (!t || streaming) return
    setHistory((h) => [...h, { speaker: USER_SPEAKER, content: t }])
    setUserNote('')
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
        roundHistory[lastIdx] = {
          ...roundHistory[lastIdx],
          content: `错误：${result.error}`,
        }
        setHistory([...roundHistory])
        setStreaming(false)
        return
      }
    }

    setHistory(roundHistory)
    setStreaming(false)
  }

  const handleStart = async () => {
    if (selected.length < 2 || !topic.trim() || !loaded) return
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

  const reset = () => {
    setStarted(false)
    setHistory([])
    setRound(0)
    setUserNote('')
  }

  if (!started) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl space-y-8">
        <div className="space-y-2">
          <h2 className="font-semibold">选择参与讨论的人物（至少 2 位）</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {personagesConfig.map((p) => {
              const active = !!selected.find((x) => x.slug === p.slug)
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => togglePersona(p)}
                  className={`border rounded-lg p-3 text-left transition-colors ${
                    active ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted mb-2">
                    <Image
                      src={p.avatar}
                      alt={p.name}
                      fill
                      className="object-cover"
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
        <div className="space-y-2">
          <h2 className="font-semibold">讨论话题</h2>
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
      <div className="border-b px-4 py-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground shrink-0">
        <span className="truncate max-w-[min(100%,28rem)]">话题：{topic}</span>
        <span aria-hidden>·</span>
        <span>第 {round} 轮</span>
        {round >= MAX_ROUNDS && (
          <Badge variant="outline" className="text-xs font-normal">
            讨论已较长，建议开启新话题以获得更好效果
          </Badge>
        )}
      </div>
      <ScrollArea className="flex-1 min-h-0 px-4">
        <div className="py-4 space-y-4 max-w-3xl mx-auto">
          {history.map((entry, i) => {
            const isUser = entry.speaker === USER_SPEAKER
            return (
              <div
                key={`${entry.speaker}-${i}`}
                className={`space-y-1 ${isUser ? 'flex flex-col items-end' : ''}`}
              >
                <div
                  className={`text-xs font-medium ${isUser ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {entry.speaker}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap max-w-[min(100%,42rem)] ${
                    isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {entry.content ||
                    (streaming && i === history.length - 1 ? '▍' : '')}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-4 space-y-3 shrink-0 max-w-3xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row gap-2">
          <Textarea
            placeholder="一轮结束后，可补充你的观点（可选）"
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            rows={2}
            disabled={streaming}
            className="min-h-[44px] resize-none flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            className="sm:self-end shrink-0"
            disabled={streaming || !userNote.trim()}
            onClick={appendUserOpinion}
          >
            发表观点
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={reset} disabled={streaming}>
            重新开始
          </Button>
          <Button
            className="flex-1 min-w-[8rem]"
            disabled={streaming || round >= MAX_ROUNDS}
            onClick={() => void handleNextRound()}
          >
            {streaming ? '讨论中…' : '继续下一轮'}
          </Button>
        </div>
      </div>
    </div>
  )
}
