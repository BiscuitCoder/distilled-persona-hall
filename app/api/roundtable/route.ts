import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { readSkillContent } from '@/lib/read-skill'
import { resolveOpenAIConfig } from '@/lib/openai-config'
import type { RoundtableEntry } from '@/types'

const USER_SPEAKER = '我'

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

  const { slug, personaName, topic, history = [] } = body
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

  // 构建 system 提示：人格定义 + 讨论场景说明
  const otherSpeakers = [...new Set(
    history
      .map((h) => h.speaker)
      .filter((s) => s !== personaName && s !== USER_SPEAKER)
  )]
  const participantsDesc = otherSpeakers.length > 0
    ? `其他参与者：${otherSpeakers.join('、')}。`
    : ''
  const systemMsg = `${skillContent}

你正在参与一场多人圆桌讨论，话题是：「${topic}」。${participantsDesc}
请始终保持你的角色身份、语言风格和思维方式发言。`

  // 将历史记录转为 messages 数组：自己的发言 → assistant，他人发言 → user（带名字前缀）
  type ChatMessage = { role: 'user' | 'assistant'; content: string }
  const chatMessages: ChatMessage[] = history.map((h) => {
    if (h.speaker === personaName) {
      return { role: 'assistant', content: h.content }
    }
    const prefix = h.speaker === USER_SPEAKER ? '[观众]' : `[${h.speaker}]`
    return { role: 'user', content: `${prefix}：${h.content}` }
  })

  // 最后追加指令，要求针对最近发言者的具体观点回应
  const recentOthers = history
    .filter((h) => h.speaker !== personaName && h.speaker !== USER_SPEAKER)
    .slice(-3)
    .map((h) => h.speaker)
  const uniqueRecent = [...new Set(recentOthers)]

  let finalInstruction: string
  if (history.length === 0) {
    finalInstruction = `请就「${topic}」这一话题，用你独特的风格发表你的初步看法。`
  } else if (uniqueRecent.length > 0) {
    finalInstruction = `请继续这场讨论。你必须点名回应 ${uniqueRecent.join('、')} 刚才的具体论点——明确说出你赞同或反对哪个观点，以及你自己的理由。避免泛泛而谈，要有针对性地交锋。`
  } else {
    finalInstruction = `请继续发言，针对讨论中的具体观点表明你的立场。`
  }

  chatMessages.push({ role: 'user', content: finalInstruction })

  const client = new OpenAI({ apiKey, baseURL })

  let stream
  try {
    stream = await client.chat.completions.create({
      model,
      messages: [{ role: 'system', content: systemMsg }, ...chatMessages],
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
