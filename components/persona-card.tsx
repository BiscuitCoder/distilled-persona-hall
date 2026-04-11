import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MemorialPersonageAvatar } from '@/components/memorial-personage-avatar'
import type { PersonageConfig } from '@/types'

interface PersonaCardProps {
  persona: PersonageConfig
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const chatHref = `/chat/${persona.slug}`

  return (
    <Card className="animate-in fade-in duration-500 group h-full overflow-hidden p-3 transition-shadow hover:shadow-[var(--shadow-whisper)] md:p-4">
      <CardContent className="flex flex-col gap-2 p-0 md:gap-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
          <MemorialPersonageAvatar
            src={persona.avatar}
            alt={persona.name}
            born={persona.born}
            died={persona.died}
            className="h-full w-full rounded-lg"
            imageClassName="transition-transform duration-300 group-hover:scale-[1.07] object-center"
            sizes="(max-width: 639px) 50vw, (max-width: 767px) 33vw, 25vw"
          />
        </div>

        {/* PC：悬停整张卡片（含头像）时，下方区域显示遮罩 + 按钮 */}
        <div className="relative flex min-h-[6.5rem] flex-col gap-2 md:min-h-[7.5rem] md:gap-3">
          <div className="flex flex-col gap-2 transition-opacity duration-200 md:gap-3 md:group-hover:opacity-0">
            <div>
              <h3 className="text-sm font-semibold leading-tight tracking-normal md:text-base">
                {persona.name}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-[0.75rem] leading-[1.45] text-muted-foreground md:mt-1 md:text-[0.8125rem] md:leading-[1.5]">
                {persona.description}
              </p>
            </div>
            <div className="mt-auto flex flex-wrap gap-1">
              {persona.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="px-1.5 py-0 text-[0.65rem] md:px-2 md:py-0.5 md:text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-10 hidden flex-col items-center justify-center rounded-md bg-background/90 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 md:flex md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100"
          >
            <Button
              asChild
              size="lg"
              className="h-11 min-w-[10rem] px-6 text-sm font-semibold shadow-md md:h-12 md:min-w-[11rem] md:px-8 md:text-base"
            >
              <Link href={chatHref}>与 Ta 交流</Link>
            </Button>
          </div>
        </div>

        {/* 移动端：无 hover，单独入口 */}
        <Button
          asChild
          size="lg"
          className="h-10 w-full text-sm font-semibold md:hidden"
        >
          <Link href={chatHref}>与 Ta 交流</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
