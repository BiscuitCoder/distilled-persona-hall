'use client'

import { requestOpenSettings } from '@/lib/open-settings'

export function ApiKeyConfigHint({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="rounded-md border border-amber-500/35 bg-amber-500/8 px-3 py-2.5 text-[0.8125rem] leading-relaxed text-foreground">
      <p className="text-muted-foreground">
        这次失败很可能与{' '}
        <button
          type="button"
          onClick={() => requestOpenSettings()}
          className="font-medium text-red-500 cursor-pointer underline underline-offset-2 decoration-primary/70 hover:text-primary"
        >
          API Key、Base URL 或模型
        </button>{' '}
        有关，点击打开设置检查；若已改配置，可重试发送。
      </p>
    </div>
  )
}
