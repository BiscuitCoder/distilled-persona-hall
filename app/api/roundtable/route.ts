import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { readSkillContent } from '@/lib/read-skill'
import { resolveOpenAIConfig } from '@/lib/openai-config'
import type { RoundtableEntry } from '@/types'

export async function POST(req: NextRequest) {
  let body: {
    slug?: string
    personaName?: string
    topic?: string
    history?: RoundtableEntry[]
    apiKey?: string
    baseURL?: string
    model?: string
  }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: '无效的请求体' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { slug, topic, history = [] } = body
  const { apiKey, baseURL, model } = resolveOpenAIConfig(body)

  if (!apiKey) {
    return new Response(JSON.stringify({ error: '请先在设置中配置 API Key，或在服务端设置 OPENAI_API_KEY' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!slug || typeof topic !== 'string' || !topic.trim()) {
    return new Response(JSON.stringify({ error: '缺少 slug 或话题' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let skillContent: string
  try {
    skillContent = await readSkillContent(slug)
  } catch (e) {
    const msg = e instanceof Error ? e.message : '读取人格失败'
    return new Response(JSON.stringify({ error: msg }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const discussionBlock =
    history.length > 0
      ? `\n\n前面的讨论：\n${history.map((h) => `${h.speaker}说：${h.content}`).join('\n')}`
      : ''

  const systemPrompt =
    history.length === 0
      ? `${skillContent}\n\n现在有人提出了一个话题：${topic}\n请用你的风格和思维方式发表看法。`
      : `${skillContent}\n\n话题是：${topic}${discussionBlock}\n\n请对他们的观点做出回应，并表达你自己的看法。`

  const client = new OpenAI({ apiKey, baseURL })

  let stream
  try {
    stream = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: systemPrompt }],
      stream: true,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : '模型请求失败'
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        const message = err instanceof Error ? err.message : '流式输出失败'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        )
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } finally {
        controller.close()
      }
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
