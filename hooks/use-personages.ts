'use client'

import { useState, useEffect } from 'react'
import type { PersonageConfig } from '@/types'

export function usePersonages() {
  const [list, setList] = useState<PersonageConfig[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/personages')
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || '加载失败')
        return res.json() as Promise<PersonageConfig[]>
      })
      .then((data) => {
        if (!cancelled) setList(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loading = list === null && error === null
  return { list, error, loading }
}
