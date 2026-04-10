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
