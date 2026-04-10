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
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              若填写：仅保存在本机浏览器。也可留空，改用项目根目录 .env / .env.local 中的
              OPENAI_API_KEY（由服务端使用，不会写入 localStorage）。
            </p>
          </div>
          <div className="space-y-2">
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
                  className="rounded-md border border-border bg-card px-2.5 py-1 text-[0.75rem] tracking-wide transition-colors hover:bg-accent"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
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
