import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsModal } from '@/components/settings-modal'
import { ChatWindow } from '@/components/chat-window'
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
    <div className="flex flex-col h-dvh min-h-0">
      <header className="border-b flex items-center px-4 h-14 gap-3 shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="font-semibold flex-1 truncate">{persona.name}</span>
        <Button variant="outline" size="sm" asChild>
          <Link href="/roundtable">圆桌</Link>
        </Button>
        <SettingsModal />
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatWindow slug={persona.slug} personaName={persona.name} />
      </div>
    </div>
  )
}
