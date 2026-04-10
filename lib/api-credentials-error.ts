/**
 * 根据接口返回的 HTTP 状态或错误文案，判断是否可能与 API Key / Base URL / 鉴权有关。
 * 用于在对话失败时展示「去设置」提示，避免对普通业务错误误报。
 */
export function isLikelyApiCredentialsError(message: string, httpStatus?: number): boolean {
  if (httpStatus === 401 || httpStatus === 403) return true

  const m = message.toLowerCase()
  const needles = [
    'api key',
    'apikey',
    'incorrect api',
    'invalid api',
    'invalid authentication',
    'unauthorized',
    'authentication',
    'invalid x-api-key',
    '配置 api key',
    'openai_api_key',
    '提供的密钥',
    '密钥无效',
    '未授权',
    '鉴权',
    '身份验证',
  ]
  if (needles.some((n) => m.includes(n))) return true

  // 英文常见状态码出现在正文里
  if (/\b401\b/.test(m) || /\b403\b/.test(m)) return true

  return false
}
