'use client'

import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { OPEN_SETTINGS_EVENT } from '@/lib/open-settings'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSettings } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'

interface Provider {
  label: string
  baseURL: string
  models: string[]
  keyPlaceholder?: string
  keyHint?: string
}

const PROVIDERS: Provider[] = [
  {
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o4-mini', 'o3'],
    keyPlaceholder: 'sk-...',
  },
  {
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    keyPlaceholder: 'sk-...',
  },
  {
    label: '火山引擎（豆包）',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-1-5-pro-32k', 'doubao-pro-32k', 'doubao-lite-32k'],
    keyPlaceholder: '填写推理接入点 ID 或 API Key',
  },
  {
    label: '智谱 GLM',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4', 'glm-4-flash', 'glm-4-air', 'glm-z1-flash'],
    keyPlaceholder: '智谱 API Key',
  },
  {
    label: '月之暗面（Kimi）',
    baseURL: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    keyPlaceholder: 'sk-...',
  },
  {
    label: '通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'],
    keyPlaceholder: '阿里云 DashScope API Key',
  },
  {
    label: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama3-8b-8192', 'mixtral-8x7b-32768'],
    keyPlaceholder: 'gsk_...',
  },
  {
    label: '自定义',
    baseURL: '',
    models: [],
  },
]

const CUSTOM_PROVIDER = PROVIDERS[PROVIDERS.length - 1]

function detectProvider(baseURL: string): Provider {
  if (!baseURL) return CUSTOM_PROVIDER
  return PROVIDERS.find((p) => p.baseURL && baseURL.startsWith(p.baseURL)) ?? CUSTOM_PROVIDER
}

export function SettingsModal() {
  const { settings, updateSettings } = useSettings()
  const { toast } = useToast()
  const [draft, setDraft] = useState(settings)
  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState<Provider>(() => detectProvider(settings.baseURL))

  const handleOpen = (v: boolean) => {
    if (v) {
      setDraft(settings)
      setProvider(detectProvider(settings.baseURL))
    }
    setOpen(v)
  }

  const handleProviderChange = (label: string) => {
    const p = PROVIDERS.find((x) => x.label === label) ?? CUSTOM_PROVIDER
    setProvider(p)
    setDraft((prev) => ({
      ...prev,
      baseURL: p.baseURL,
      model: p.models[0] ?? prev.model,
    }))
  }

  const handleSave = () => {
    updateSettings(draft)
    setOpen(false)
    toast({ title: '配置已保存' })
  }

  const isCustom = provider.label === '自定义'

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpen)
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="设置" className='cursor-pointer'>
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API 配置</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* 服务商 */}
          <div className="space-y-2">
            <Label>服务商</Label>
            <Select value={provider.label} onValueChange={handleProviderChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择服务商" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.label} value={p.label}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 自定义时显示 Base URL */}
          {isCustom && (
            <div className="space-y-2">
              <Label htmlFor="baseURL">Base URL</Label>
              <Input
                id="baseURL"
                placeholder="https://api.openai.com/v1"
                value={draft.baseURL}
                onChange={(e) => setDraft({ ...draft, baseURL: e.target.value })}
              />
            </div>
          )}

          {/* 模型 */}
          <div className="space-y-2">
            <Label htmlFor="model">模型</Label>
            {provider.models.length > 0 ? (
              <Select
                value={draft.model}
                onValueChange={(v) => setDraft({ ...draft, model: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {provider.models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="model"
                placeholder="模型名称，如 gpt-4o"
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              />
            )}
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder={provider.keyPlaceholder ?? 'API Key'}
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              仅保存在本机浏览器。也可留空，改用 .env.local 中的 OPENAI_API_KEY（服务端使用）。
            </p>
          </div>
        </div>
        <Button onClick={handleSave} className="w-full">
          保存
        </Button>
      </DialogContent>
    </Dialog>
  )
}
