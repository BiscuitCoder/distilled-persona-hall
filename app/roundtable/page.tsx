import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsModal } from '@/components/settings-modal'
import { RoundtableView } from '@/components/roundtable-view'

export default function RoundtablePage() {
  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-dvh min-h-0">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 h-14">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="flex-1 text-base font-semibold tracking-normal">圆桌讨论</span>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">大厅</Link>
        </Button>
        <SettingsModal />
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">
        <RoundtableView />
      </div>
    </div>
  )
}
