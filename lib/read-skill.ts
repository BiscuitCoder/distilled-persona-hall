import fs from 'fs/promises'
import path from 'path'
import { personagesConfig } from '@/personages.config'

export async function readSkillContent(slug: string): Promise<string> {
  const persona = personagesConfig.find((p) => p.slug === slug)
  if (!persona) throw new Error(`Persona not found: ${slug}`)

  const skillPath = path.join(process.cwd(), 'personage', persona.dir, 'SKILL.md')
  try {
    return await fs.readFile(skillPath, 'utf-8')
  } catch (e) {
    console.error(`[read-skill] Failed to read ${skillPath}:`, e)
    throw new Error(`Skill file missing for: ${slug}`)
  }
}
