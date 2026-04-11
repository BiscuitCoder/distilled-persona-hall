import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsModal } from '@/components/settings-modal'
import { ChatWindow } from '@/components/chat-window'
import { MemorialPersonageAvatar } from '@/components/memorial-personage-avatar'
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
    <div className="animate-in fade-in duration-500 flex flex-col h-dvh min-h-0">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 h-14">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <MemorialPersonageAvatar
            src={persona.avatar}
            alt={persona.name}
            born={persona.born}
            died={persona.died}
            className="h-9 w-9 shrink-0 rounded-full"
            sizes="36px"
          />
          <span className="truncate text-base font-semibold tracking-normal">
            {persona.name}
          </span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/roundtable">圆桌</Link>
        </Button>
        <SettingsModal />
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatWindow persona={persona} />
      </div>
    </div>
  )
}
