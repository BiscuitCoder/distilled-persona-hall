import { NextResponse } from 'next/server'
import { readSkillContent } from '@/lib/read-skill'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const skill = await readSkillContent(slug)
    return NextResponse.json({ skill })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    const isNotFound = message.includes('not found') || message.includes('missing')
    console.error(`[api/personages/${slug}]`, message)
    return NextResponse.json(
      { error: isNotFound ? 'Persona not found' : 'Internal server error' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}
