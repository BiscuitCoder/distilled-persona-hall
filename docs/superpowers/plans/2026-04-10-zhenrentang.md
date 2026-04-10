# 蒸人堂 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建"蒸人堂"——一个 AI 名人人格对话平台，支持单人对话和多人圆桌链式讨论，用户自带 API Key。

**Architecture:** Next.js App Router + API Routes 中转 AI 调用（解决 CORS、支持 SSE 流式输出）。人物数据以 Markdown 文件存于 `personage/` 目录，通过根目录 `personages.config.ts` 集中管理元数据（标签、封面、名称等）。前端通过 Settings 浮层配置 API Key 存入 localStorage，请求时附带到 API Routes，服务端用 openai 包转发给兼容 OpenAI 格式的任意 provider。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, shadcn/ui (Radix UI), TailwindCSS 4, openai npm包

---

## 文件清单

### 新建
| 文件 | 职责 |
|------|------|
| `personages.config.ts` | 人物元数据中央配置（标签、封面、目录名） |
| `types/index.ts` | 共享类型定义 |
| `lib/read-skill.ts` | 服务端读取 SKILL.md 的工具函数 |
| `hooks/use-settings.ts` | localStorage 读写 API 配置的 hook |
| `app/api/personages/route.ts` | 返回人物列表 |
| `app/api/personages/[slug]/route.ts` | 返回指定人物 SKILL.md 内容 |
| `app/api/chat/route.ts` | 单人对话 SSE 流 |
| `app/api/roundtable/route.ts` | 圆桌单人发言 SSE 流 |
| `components/settings-modal.tsx` | API Key 配置浮层 |
| `components/persona-card.tsx` | 人物卡片 |
| `components/tag-filter.tsx` | 标签筛选器 |
| `components/chat-window.tsx` | 单人对话窗口 |
| `components/roundtable-view.tsx` | 圆桌讨论视图 |
| `app/chat/[slug]/page.tsx` | 单人对话页 |
| `app/roundtable/page.tsx` | 圆桌讨论页 |

### 修改
| 文件 | 变更 |
|------|------|
| `app/page.tsx` | 替换为人物大厅（卡片网格 + 标签筛选） |
| `app/layout.tsx` | 更新标题、删除无关 sections 导入 |
| `package.json` | 添加 `openai` 依赖 |

---

## Task 1: 安装依赖 + 类型定义 + 中央配置

**Files:**
- Modify: `package.json`
- Create: `types/index.ts`
- Create: `personages.config.ts`

- [ ] **Step 1: 安装 openai 包**

```bash
cd /Users/yuyuyu/other/zhenrentang
pnpm add openai
```

Expected: `openai` 出现在 `node_modules/`，`package.json` dependencies 中有 `"openai": "^4.x.x"`

- [ ] **Step 2: 创建共享类型**

创建 `types/index.ts`：

```ts
export interface PersonageConfig {
  slug: string
  dir: string
  name: string
  description: string
  avatar: string
  tags: string[]
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface RoundtableEntry {
  speaker: string
  content: string
}

export interface ApiSettings {
  apiKey: string
  baseURL: string
  model: string
}
```

- [ ] **Step 3: 创建人物中央配置**

创建 `personages.config.ts`（根据 `personage/` 下已有的三个文件夹）：

```ts
import type { PersonageConfig } from '@/types'

export const personagesConfig: PersonageConfig[] = [
  {
    slug: 'paul-graham',
    dir: 'paul-graham-skill',
    name: 'Paul Graham',
    description: 'YC 创始人，创业与写作思想家',
    avatar: '/avatars/paul-graham.jpg',
    tags: ['创业', '写作', '投资人', '美国', '科技'],
  },
  {
    slug: 'steve-jobs',
    dir: 'steve-jobs-skill',
    name: 'Steve Jobs',
    description: '苹果创始人，产品与设计哲学家',
    avatar: '/avatars/steve-jobs.jpg',
    tags: ['产品', '设计', '科技', '美国'],
  },
  {
    slug: 'trump',
    dir: 'trump-skill',
    name: 'Donald Trump',
    description: '美国前总统，谈判与品牌大师',
    avatar: '/avatars/trump.jpg',
    tags: ['政治', '美国', '商业', '谈判'],
  },
]
```

- [ ] **Step 4: 验证类型正确**

```bash
cd /Users/yuyuyu/other/zhenrentang
pnpm tsc --noEmit
```

Expected: 无报错（或仅原有的 ignore 错误）

- [ ] **Step 5: Commit**

```bash
git init && git add personages.config.ts types/index.ts package.json pnpm-lock.yaml
git commit -m "feat: add openai dep, types, and personages config"
```

---

## Task 2: 服务端读文件工具 + API Routes（人物数据）

**Files:**
- Create: `lib/read-skill.ts`
- Create: `app/api/personages/route.ts`
- Create: `app/api/personages/[slug]/route.ts`

- [ ] **Step 1: 创建服务端读文件工具**

创建 `lib/read-skill.ts`：

```ts
import fs from 'fs/promises'
import path from 'path'
import { personagesConfig } from '@/personages.config'

export async function readSkillContent(slug: string): Promise<string> {
  const persona = personagesConfig.find((p) => p.slug === slug)
  if (!persona) throw new Error(`Persona not found: ${slug}`)

  const skillPath = path.join(process.cwd(), 'personage', persona.dir, 'SKILL.md')
  return fs.readFile(skillPath, 'utf-8')
}
```

- [ ] **Step 2: 创建人物列表 API**

创建 `app/api/personages/route.ts`：

```ts
import { NextResponse } from 'next/server'
import { personagesConfig } from '@/personages.config'

export async function GET() {
  return NextResponse.json(personagesConfig)
}
```

- [ ] **Step 3: 创建单人物 API**

创建 `app/api/personages/[slug]/route.ts`：

```ts
import { NextResponse } from 'next/server'
import { readSkillContent } from '@/lib/read-skill'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const skill = await readSkillContent(slug)
    return NextResponse.json({ skill })
  } catch {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
  }
}
```

- [ ] **Step 4: 启动开发服务器验证**

```bash
cd /Users/yuyuyu/other/zhenrentang
pnpm dev
```

浏览器访问 `http://localhost:3000/api/personages`
Expected: 返回 JSON 数组，包含 paul-graham / steve-jobs / trump 三条记录

访问 `http://localhost:3000/api/personages/paul-graham`
Expected: 返回 `{ skill: "---\nname: paul-graham..." }`（SKILL.md 内容）

访问 `http://localhost:3000/api/personages/nonexistent`
Expected: 返回 `{ error: "Persona not found" }`，状态码 404

- [ ] **Step 5: Commit**

```bash
git add lib/read-skill.ts app/api/personages/
git commit -m "feat: add personage data API routes"
```

---

## Task 3: Settings Hook + Settings Modal 组件

**Files:**
- Create: `hooks/use-settings.ts`
- Create: `components/settings-modal.tsx`

- [ ] **Step 1: 创建 useSettings hook**

创建 `hooks/use-settings.ts`：

```ts
'use client'

import { useState, useEffect } from 'react'
import type { ApiSettings } from '@/types'

const STORAGE_KEY = 'zhenrentang-settings'

const DEFAULT_SETTINGS: ApiSettings = {
  apiKey: '',
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4o',
}

export function useSettings() {
  const [settings, setSettings] = useState<ApiSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch {
        // ignore malformed storage
      }
    }
    setLoaded(true)
  }, [])

  const updateSettings = (next: ApiSettings) => {
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return { settings, updateSettings, loaded }
}
```

- [ ] **Step 2: 创建 SettingsModal 组件**

创建 `components/settings-modal.tsx`：

```tsx
'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSettings } from '@/hooks/use-settings'

const PROVIDERS = [
  { label: 'OpenAI', baseURL: 'https://api.openai.com/v1' },
  { label: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1' },
  { label: '火山引擎', baseURL: 'https://ark.cn-beijing.volces.com/api/v3' },
]

export function SettingsModal() {
  const { settings, updateSettings } = useSettings()
  const [draft, setDraft] = useState(settings)
  const [open, setOpen] = useState(false)

  const handleOpen = (v: boolean) => {
    if (v) setDraft(settings)
    setOpen(v)
  }

  const handleSave = () => {
    updateSettings(draft)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="设置">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API 配置</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              API Key 仅保存在你的浏览器本地，不会上传至任何服务器。
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="baseURL">Base URL</Label>
            <Input
              id="baseURL"
              placeholder="https://api.openai.com/v1"
              value={draft.baseURL}
              onChange={(e) => setDraft({ ...draft, baseURL: e.target.value })}
            />
            <div className="flex gap-2 flex-wrap">
              {PROVIDERS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDraft({ ...draft, baseURL: p.baseURL })}
                  className="text-xs px-2 py-0.5 rounded border hover:bg-accent transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              placeholder="gpt-4o"
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={handleSave} className="w-full">
          保存
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: 验证组件渲染**

在 `app/page.tsx` 顶部临时导入 SettingsModal 并渲染：

```tsx
import { SettingsModal } from '@/components/settings-modal'
// 在 return 里加 <SettingsModal />
```

访问 `http://localhost:3000`，点击齿轮图标，确认：
- 弹窗正常打开
- 填入 API Key 后点保存，刷新页面，Settings 里还有值（localStorage 持久化）
- "API Key 仅保存在你的浏览器本地..." 提示文案显示正确

验证完成后移除临时导入。

- [ ] **Step 4: Commit**

```bash
git add hooks/use-settings.ts components/settings-modal.tsx
git commit -m "feat: add settings hook and modal with localStorage"
```

---

## Task 4: 人物大厅首页（PersonaCard + TagFilter + 首页）

**Files:**
- Create: `components/persona-card.tsx`
- Create: `components/tag-filter.tsx`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: 创建 PersonaCard**

创建 `components/persona-card.tsx`：

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { PersonageConfig } from '@/types'

interface PersonaCardProps {
  persona: PersonageConfig
}

export function PersonaCard({ persona }: PersonaCardProps) {
  return (
    <Link href={`/chat/${persona.slug}`}>
      <Card className="group cursor-pointer hover:shadow-md transition-shadow h-full">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={persona.avatar}
              alt={persona.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => {}}
            />
          </div>
          <div>
            <h3 className="font-semibold text-base leading-tight">{persona.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {persona.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-1 mt-auto">
            {persona.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 2: 创建 TagFilter**

创建 `components/tag-filter.tsx`：

```tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TagFilterProps {
  allTags: string[]
  selected: string[]
  onChange: (tags: string[]) => void
}

export function TagFilter({ allTags, selected, onChange }: TagFilterProps) {
  const toggle = (tag: string) => {
    onChange(
      selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={selected.length === 0 ? 'default' : 'outline'}
        className="cursor-pointer select-none"
        onClick={() => onChange([])}
      >
        全部
      </Badge>
      {allTags.map((tag) => (
        <Badge
          key={tag}
          variant={selected.includes(tag) ? 'default' : 'outline'}
          className={cn('cursor-pointer select-none')}
          onClick={() => toggle(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: 改写首页**

替换 `app/page.tsx`：

```tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PersonaCard } from '@/components/persona-card'
import { TagFilter } from '@/components/tag-filter'
import { SettingsModal } from '@/components/settings-modal'
import { Button } from '@/components/ui/button'
import { personagesConfig } from '@/personages.config'

export default function Home() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = useMemo(
    () => Array.from(new Set(personagesConfig.flatMap((p) => p.tags))).sort(),
    []
  )

  const filtered = useMemo(
    () =>
      selectedTags.length === 0
        ? personagesConfig
        : personagesConfig.filter((p) => selectedTags.some((t) => p.tags.includes(t))),
    [selectedTags]
  )

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 z-10 bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg">蒸人堂</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/roundtable">圆桌讨论</Link>
            </Button>
            <SettingsModal />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <TagFilter allTags={allTags} selected={selectedTags} onChange={setSelectedTags} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((persona) => (
            <PersonaCard key={persona.slug} persona={persona} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-20">
            没有匹配的人物，换个标签试试
          </p>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: 更新 layout.tsx 标题**

修改 `app/layout.tsx`，更新 metadata：

```tsx
export const metadata: Metadata = {
  title: '蒸人堂 — AI 名人人格对话',
  description: '与各路名人、虚构角色直接对话，或让他们围坐圆桌展开讨论',
}
```

同时删除原有无用的 Section 导入（HeroSection 等已不再使用）。

- [ ] **Step 5: 验证首页**

访问 `http://localhost:3000`：
- 3 个人物卡片显示
- 点击标签可以筛选（标签高亮，无匹配时显示空状态）
- 点击卡片跳转到 `/chat/paul-graham`（此时 404 正常，下一个 Task 会实现）
- 头部"圆桌讨论"按钮和设置齿轮存在

- [ ] **Step 6: Commit**

```bash
git add components/persona-card.tsx components/tag-filter.tsx app/page.tsx app/layout.tsx
git commit -m "feat: persona gallery home page with tag filter"
```

---

## Task 5: 单人对话（API Route + ChatWindow + 对话页）

**Files:**
- Create: `app/api/chat/route.ts`
- Create: `components/chat-window.tsx`
- Create: `app/chat/[slug]/page.tsx`

- [ ] **Step 1: 创建 /api/chat 流式路由**

创建 `app/api/chat/route.ts`：

```ts
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { readSkillContent } from '@/lib/read-skill'
import type { Message } from '@/types'

export async function POST(req: NextRequest) {
  const { slug, messages, apiKey, baseURL, model } = await req.json() as {
    slug: string
    messages: Message[]
    apiKey: string
    baseURL: string
    model: string
  }

  if (!apiKey) {
    return new Response(JSON.stringify({ error: '请先在设置中配置 API Key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const skillContent = await readSkillContent(slug)

  const client = new OpenAI({ apiKey, baseURL })

  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: skillContent },
      ...messages,
    ],
    stream: true,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

- [ ] **Step 2: 创建 ChatWindow 组件**

创建 `components/chat-window.tsx`：

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/use-settings'
import type { Message } from '@/types'

interface ChatWindowProps {
  slug: string
  personaName: string
}

export function ChatWindow({ slug, personaName }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const { settings } = useSettings()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return

    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setStreaming(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages([...next, assistantMsg])

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
        const err = await res.json()
        setMessages([...next, { role: 'assistant', content: `错误：${err.error}` }])
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const { text } = JSON.parse(data)
              accumulated += text
              setMessages([...next, { role: 'assistant', content: accumulated }])
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {messages.length === 0 && (
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
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.content || (streaming && i === messages.length - 1 ? '▌' : '')}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-4 flex gap-2">
        <Input
          placeholder={`对 ${personaName} 说点什么…`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={streaming}
        />
        <Button size="icon" onClick={send} disabled={streaming || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 创建单人对话页**

创建 `app/chat/[slug]/page.tsx`：

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsModal } from '@/components/settings-modal'
import { ChatWindow } from '@/components/chat-window'
import { personagesConfig } from '@/personages.config'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const persona = personagesConfig.find((p) => p.slug === slug)
  if (!persona) notFound()

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b flex items-center px-4 h-14 gap-3 shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="font-semibold flex-1">{persona.name}</span>
        <SettingsModal />
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatWindow slug={persona.slug} personaName={persona.name} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 验证单人对话**

1. 确认 Settings 中已填入有效 API Key
2. 访问 `http://localhost:3000/chat/paul-graham`
3. 发送一条消息："你好，介绍一下你自己"
4. 确认文字流式出现（逐字打印效果）
5. 继续发送第二条，确认上下文连续（PG 能引用上一条内容）
6. 测试错误情况：清空 API Key，发消息，确认显示"请先在设置中配置 API Key"

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/ components/chat-window.tsx app/chat/
git commit -m "feat: single persona chat with SSE streaming"
```

---

## Task 6: 圆桌讨论（API Route + RoundtableView + 圆桌页）

**Files:**
- Create: `app/api/roundtable/route.ts`
- Create: `components/roundtable-view.tsx`
- Create: `app/roundtable/page.tsx`

- [ ] **Step 1: 创建 /api/roundtable 流式路由**

创建 `app/api/roundtable/route.ts`：

```ts
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { readSkillContent } from '@/lib/read-skill'
import type { RoundtableEntry } from '@/types'

export async function POST(req: NextRequest) {
  const { slug, personaName, topic, history, apiKey, baseURL, model } =
    await req.json() as {
      slug: string
      personaName: string
      topic: string
      history: RoundtableEntry[]
      apiKey: string
      baseURL: string
      model: string
    }

  if (!apiKey) {
    return new Response(JSON.stringify({ error: '请先在设置中配置 API Key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const skillContent = await readSkillContent(slug)

  const systemPrompt =
    history.length === 0
      ? `${skillContent}\n\n现在有人提出了一个话题：${topic}\n请用你的风格和思维方式发表看法，200字以内。`
      : `${skillContent}\n\n话题是：${topic}\n\n前面的讨论：\n${history
          .map((h) => `${h.speaker}说：${h.content}`)
          .join('\n')}\n\n请对他们的观点做出回应，并表达你自己的看法，200字以内。`

  const client = new OpenAI({ apiKey, baseURL })

  const stream = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: systemPrompt }],
    stream: true,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

- [ ] **Step 2: 创建 RoundtableView 组件**

创建 `components/roundtable-view.tsx`：

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettings } from '@/hooks/use-settings'
import { personagesConfig } from '@/personages.config'
import type { PersonageConfig, RoundtableEntry } from '@/types'

const MAX_ROUNDS = 5

export function RoundtableView() {
  const [selected, setSelected] = useState<PersonageConfig[]>([])
  const [topic, setTopic] = useState('')
  const [history, setHistory] = useState<RoundtableEntry[]>([])
  const [streaming, setStreaming] = useState(false)
  const [round, setRound] = useState(0)
  const [started, setStarted] = useState(false)
  const { settings } = useSettings()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const togglePersona = (p: PersonageConfig) => {
    setSelected((prev) =>
      prev.find((x) => x.slug === p.slug) ? prev.filter((x) => x.slug !== p.slug) : [...prev, p]
    )
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
          personaName: persona.name,
          topic,
          history: roundHistory.slice(0, -1), // exclude current empty entry
          apiKey: settings.apiKey,
          baseURL: settings.baseURL,
          model: settings.model,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        roundHistory[roundHistory.length - 1].content = `错误：${err.error}`
        setHistory([...roundHistory])
        setStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const { text } = JSON.parse(data)
              accumulated += text
              roundHistory[roundHistory.length - 1].content = accumulated
              setHistory([...roundHistory])
            } catch {
              // ignore
            }
          }
        }
      }
    }

    setHistory(roundHistory)
    setStreaming(false)
  }

  const handleStart = async () => {
    if (selected.length < 2 || !topic.trim()) return
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

  if (!started) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl space-y-8">
        <div className="space-y-2">
          <h2 className="font-semibold">选择参与讨论的人物（至少 2 位）</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {personagesConfig.map((p) => (
              <button
                key={p.slug}
                onClick={() => togglePersona(p)}
                className={`border rounded-lg p-3 text-left transition-colors ${
                  selected.find((x) => x.slug === p.slug)
                    ? 'border-primary bg-primary/10'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="font-medium text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.description}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">讨论话题</h2>
          <Input
            placeholder="例如：九阴真经的练习方法"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
        </div>
        <Button
          className="w-full"
          disabled={selected.length < 2 || !topic.trim()}
          onClick={handleStart}
        >
          开始讨论
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground shrink-0">
        <span>话题：{topic}</span>
        <span>·</span>
        <span>第 {round} 轮</span>
        {round >= MAX_ROUNDS && (
          <Badge variant="outline" className="text-xs">讨论已较长，建议开启新话题</Badge>
        )}
      </div>
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {history.map((entry, i) => (
            <div key={i} className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">{entry.speaker}</div>
              <div className="bg-muted rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap">
                {entry.content || '▌'}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-4 flex gap-2 shrink-0">
        <Button
          variant="outline"
          onClick={() => { setStarted(false); setHistory([]); setRound(0) }}
          disabled={streaming}
        >
          重新开始
        </Button>
        <Button
          className="flex-1"
          disabled={streaming || round >= MAX_ROUNDS}
          onClick={handleNextRound}
        >
          {streaming ? '讨论中…' : '继续下一轮'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 创建圆桌页**

创建 `app/roundtable/page.tsx`：

```tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsModal } from '@/components/settings-modal'
import { RoundtableView } from '@/components/roundtable-view'

export default function RoundtablePage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b flex items-center px-4 h-14 gap-3 shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="font-semibold flex-1">圆桌讨论</span>
        <SettingsModal />
      </header>
      <div className="flex-1 overflow-hidden">
        <RoundtableView />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 验证圆桌讨论**

1. 访问 `http://localhost:3000/roundtable`
2. 选择 Paul Graham + Steve Jobs，输入话题"创业公司该不该追求盈利"
3. 点"开始讨论"，确认：
   - PG 先发言，流式打字
   - PG 发言完毕后，Steve Jobs 自动开始
   - Steve Jobs 的内容引用了 PG 的观点
4. 点"继续下一轮"，第二轮继续，两人都对第一轮内容做回应
5. 点到第 5 轮后，确认"继续下一轮"按钮禁用、出现提示 Badge
6. 测试"重新开始"，回到人物选择界面

- [ ] **Step 5: Commit**

```bash
git add app/api/roundtable/ components/roundtable-view.tsx app/roundtable/
git commit -m "feat: roundtable discussion with sequential streaming"
```

---

## Task 7: 收尾——头像占位 + 无头像降级处理

**Files:**
- Modify: `components/persona-card.tsx`
- Create: `public/avatars/.gitkeep`

- [ ] **Step 1: 在 public/avatars/ 放占位文件**

```bash
mkdir -p /Users/yuyuyu/other/zhenrentang/public/avatars
touch /Users/yuyuyu/other/zhenrentang/public/avatars/.gitkeep
```

- [ ] **Step 2: PersonaCard 无头像时显示文字头像**

修改 `components/persona-card.tsx`，在 `Image` 组件外层添加降级显示逻辑：

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { PersonageConfig } from '@/types'

interface PersonaCardProps {
  persona: PersonageConfig
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <Link href={`/chat/${persona.slug}`}>
      <Card className="group cursor-pointer hover:shadow-md transition-shadow h-full">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {!imgError ? (
              <Image
                src={persona.avatar}
                alt={persona.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-3xl font-bold text-muted-foreground select-none">
                {persona.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-base leading-tight">{persona.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {persona.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-1 mt-auto">
            {persona.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 3: 验证降级显示**

访问 `http://localhost:3000`，确认：
- 没有头像文件的人物卡片显示名字首字母作为头像
- 有头像文件时正常显示图片

- [ ] **Step 4: 最终 Commit**

```bash
git add public/avatars/ components/persona-card.tsx
git commit -m "feat: avatar fallback to initial letter"
```

---

## 自审结果

| 设计要求 | 覆盖任务 |
|----------|----------|
| personages.config.ts 中央配置 | Task 1 |
| 人物大厅 + 标签筛选 | Task 4 |
| 单人对话 + SSE 流式 | Task 5 |
| 圆桌链式讨论 + 全量历史 | Task 6 |
| 超 5 轮提示 | Task 6 RoundtableView |
| Settings + localStorage + 隐私提示 | Task 3 |
| OpenAI 兼容格式（baseURL 切换） | Task 5/6 API Routes |
| 头像降级 | Task 7 |
| Vercel 部署兼容（output:export 注释保留） | next.config.mjs 无需改动 |
