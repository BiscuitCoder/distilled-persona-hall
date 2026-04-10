/**
 * 增量解析 SSE：处理跨 chunk 拆行的 `data: ...`。
 */
export function appendSSEChunk(
  buffer: string,
  chunk: string
): { buffer: string; payloads: string[] } {
  const combined = buffer + chunk
  const lines = combined.split('\n')
  const rest = lines.pop() ?? ''
  const payloads: string[] = []
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      payloads.push(line.slice(6).trim())
    }
  }
  return { buffer: rest, payloads }
}

export async function consumeSSEStream(
  res: Response,
  onText: (t: string) => void
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!res.body) {
    return { ok: false, error: '无响应体' }
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let sseBuffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const { buffer, payloads } = appendSSEChunk(
      sseBuffer,
      decoder.decode(value, { stream: true })
    )
    sseBuffer = buffer
    for (const data of payloads) {
      if (data === '[DONE]') return { ok: true }
      try {
        const parsed = JSON.parse(data) as { text?: string; error?: string }
        if (parsed.error) {
          return { ok: false, error: parsed.error }
        }
        if (parsed.text) {
          onText(parsed.text)
        }
      } catch {
        // ignore malformed JSON lines
      }
    }
  }
  return { ok: true }
}
