import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsModal } from '@/components/settings-modal'
import { RoundtableView } from '@/components/roundtable-view'

export default function RoundtablePage() {
  return (
    <div className="flex flex-col h-dvh min-h-0">
      <header className="border-b flex items-center px-4 h-14 gap-3 shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="font-semibold flex-1">圆桌讨论</span>
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
