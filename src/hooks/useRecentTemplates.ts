import { useCallback, useState } from 'react'
import type { RecentTemplate } from '../types'

const KEY = 'momo.recent.v1'
const MAX = 3

function load(): RecentTemplate[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as RecentTemplate[]
    return Array.isArray(list) ? list.slice(0, MAX) : []
  } catch {
    return []
  }
}

/** 最近上传的角色模板（缩略图存 localStorage，容量超限时静默放弃） */
export function useRecentTemplates() {
  const [templates, setTemplates] = useState<RecentTemplate[]>(load)

  const addTemplate = useCallback((dataUrl: string) => {
    setTemplates((prev) => {
      const next: RecentTemplate[] = [
        { id: `t${Date.now()}`, dataUrl, ts: Date.now() },
        ...prev.filter((t) => t.dataUrl !== dataUrl),
      ].slice(0, MAX)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* 配额满：仅保留内存态 */
      }
      return next
    })
  }, [])

  return { templates, addTemplate }
}
