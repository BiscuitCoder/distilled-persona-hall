/**
 * 合并请求体与 .env：用户 Settings 优先，未填时用 OPENAI_* 环境变量。
 */
export function resolveOpenAIConfig(input: {
  apiKey?: string
  baseURL?: string
  model?: string
}) {
  const apiKey = (input.apiKey?.trim() || process.env.OPENAI_API_KEY || '').trim()
  const baseURL = (
    input.baseURL?.trim() ||
    process.env.OPENAI_BASE_URL ||
    'https://api.openai.com/v1'
  ).replace(/\/$/, '')
  const model = (input.model?.trim() || process.env.OPENAI_MODEL || 'gpt-4o').trim()
  return { apiKey, baseURL, model }
}
