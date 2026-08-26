import { useCallback, useState } from 'react'
import type { WorkflowRecipe, WorkflowTemplate } from '../types'

const KEY = 'momo.flows.v1'
const MAX = 12

/**
 * 配方工作流：把「抠图 → 风格 → 贴纸装扮 → 出卡模板」整套配置
 * 存成可复用模板（localStorage），一键再跑 / 发布到社区供人套用。
 */

function load(): WorkflowTemplate[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as WorkflowTemplate[]
    return Array.isArray(list) ? list.slice(0, MAX) : []
  } catch {
    return []
  }
}

function save(flows: WorkflowTemplate[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(flows))
  } catch {
    /* 配额满：仅保留内存态 */
  }
}

export function useWorkflows() {
  const [flows, setFlows] = useState<WorkflowTemplate[]>(load)

  const saveFlow = useCallback((name: string, recipe: WorkflowRecipe): WorkflowTemplate => {
    const flow: WorkflowTemplate = {
      id: `f${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
      name,
      recipe,
      ts: Date.now(),
    }
    setFlows((prev) => {
      const next = [flow, ...prev].slice(0, MAX)
      save(next)
      return next
    })
    return flow
  }, [])

  const removeFlow = useCallback((id: string) => {
    setFlows((prev) => {
      const next = prev.filter((f) => f.id !== id)
      save(next)
      return next
    })
  }, [])

  return { flows, saveFlow, removeFlow }
}
