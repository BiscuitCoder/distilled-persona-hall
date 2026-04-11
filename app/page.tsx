'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PersonaCard } from '@/components/persona-card'
import { PersonaCardSkeleton } from '@/components/persona-card-skeleton'
import { TagFilter } from '@/components/tag-filter'
import { SettingsModal } from '@/components/settings-modal'
import { Button } from '@/components/ui/button'
import { usePersonages } from '@/hooks/use-personages'
import { githubRepoUrl } from '@/lib/site'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUpRight, Github } from 'lucide-react'

const SKELETON_COUNT = 8

const NUWA_SKILL_REPO = 'https://github.com/alchaincyf/nuwa-skill'

export default function Home() {
  const { list, error, loading } = usePersonages()
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = useMemo(
    () => (list ? Array.from(new Set(list.flatMap((p) => p.tags))).sort() : []),
    [list]
  )

  const filtered = useMemo(() => {
    if (!list) return []
    if (selectedTags.length === 0) return list
    return list.filter((p) => selectedTags.some((t) => p.tags.includes(t)))
  }, [list, selectedTags])

  return (
    <div className="animate-in fade-in duration-500 min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
        <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="shrink-0 flex items-center gap-2.5 text-xl font-semibold tracking-normal text-foreground"
          >
            <Image
              src="/logo.png"
              alt=""
              width={500}
              height={685}
              className="h-8 w-auto object-contain"
              sizes="32px"
              priority
            />
            <span>蒸人堂</span>
          </Link>
          <div className="flex items-center gap-6">
            <Button size="sm" asChild>
              <Link href="/roundtable">圆桌讨论</Link>
            </Button>
            <Button variant="ghost" size="icon-sm" asChild>
              <a
                href={githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub 仓库"
              >
                <Github className="size-[1.125rem]" />
                <span className="sr-only">GitHub 仓库</span>
              </a>
            </Button>
            <SettingsModal />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-[1200px] px-4 sm:px-6 py-10 sm:py-14 flex-1">
        <div className="mb-10 space-y-3">
          <h2 className="md:text-[1.6rem] font-semibold leading-[1.2] tracking-normal">
            赛博“蒸”人，群贤毕至 ~
          </h2>
          <p className="text-[0.8125rem] leading-[1.65] text-muted-foreground sm:text-[0.875rem] sm:leading-[1.7]">
            本项目通过{' '}
            <a
              href={NUWA_SKILL_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary underline decoration-primary/45 underline-offset-[3px] transition-colors hover:text-primary/85 hover:decoration-primary/70"
            >
              女娲 skill
              <ArrowUpRight
                className="size-[0.875em] shrink-0 translate-y-[0.04em] stroke-[2.25]"
                aria-hidden
              />
            </a>
            {' '}
            蒸馏并呈现这些人物，你可与 Ta 单独对话，或多人组成圆桌讨论。或许在赛博世界里，你我都得到了永生 ~
          </p>
        </div>

        {error && (
          <div
            className="rounded-lg border border-destructive/35 bg-destructive/8 px-4 py-3 text-[0.94rem] leading-[1.72] text-destructive mb-6"
            role="alert"
          >
            无法加载人物列表：{error}。请刷新页面重试。
          </div>
        )}

        {!error && (
          <>
            <div className="mb-6">
              {loading ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-16 rounded-full" />
                  ))}
                </div>
              ) : (
                <TagFilter allTags={allTags} selected={selectedTags} onChange={setSelectedTags} />
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
              {loading
                ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <PersonaCardSkeleton key={i} />
                  ))
                : filtered.map((persona) => <PersonaCard key={persona.slug} persona={persona} />)}
            </div>

            {!loading && filtered.length === 0 && (
              <p className="text-center text-muted-foreground text-[0.94rem] leading-[1.6] py-20">
                没有匹配的人物，换个标签试试
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
