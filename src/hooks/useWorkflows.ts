import { useCallback, useState } from 'react'
import type { WorkflowSnapshot } from '../types'

const KEY = 'momo.workflows.v1'
const MAX = 6

function load(): WorkflowSnapshot[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as WorkflowSnapshot[]
    return Array.isArray(list) ? list.slice(0, MAX) : []
  } catch {
    return []
  }
}

function persist(list: WorkflowSnapshot[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* 配额满：仅保留内存态 */
  }
}

/** 已保存的工作流快照（角色 + 风格 + 语气 + 动作脚本），localStorage 持久化 */
export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowSnapshot[]>(load)

  const saveWorkflow = useCallback((input: Omit<WorkflowSnapshot, 'id' | 'ts'>) => {
    setWorkflows((prev) => {
      const snap: WorkflowSnapshot = {
        ...input,
        id: `w${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
        ts: Date.now(),
      }
      const next = [snap, ...prev].slice(0, MAX)
      persist(next)
      return next
    })
  }, [])

  const removeWorkflow = useCallback((id: string) => {
    setWorkflows((prev) => {
      const next = prev.filter((w) => w.id !== id)
      persist(next)
      return next
    })
  }, [])

  return { workflows, saveWorkflow, removeWorkflow }
}
