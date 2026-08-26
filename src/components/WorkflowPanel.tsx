import { useState } from 'react'
import { getPreset } from '../data/presets'
import { CARD_TEMPLATES } from '../utils/shareCard'
import type { WorkflowRecipe, WorkflowTemplate } from '../types'

interface Props {
  flows: WorkflowTemplate[]
  currentRecipe: WorkflowRecipe
  /** 保存当前配置为可复用配方 */
  onSave: (name: string) => void
  /** 一键套用配方（重跑整条流水线） */
  onApply: (recipe: WorkflowRecipe) => void
  onRemove: (id: string) => void
  /** 把当前配方发布成社区玩法帖 */
  onShareCurrent: () => void
}

export function recipeSummary(recipe: WorkflowRecipe): string {
  const style = getPreset(recipe.styleId).name
  const card = CARD_TEMPLATES.find((t) => t.id === recipe.cardTemplate)?.name ?? '认证卡'
  const cut = recipe.cutout ? `抠图${recipe.tolerance}` : '不抠图'
  const sticker = recipe.stickerIds.length > 0 ? ` · 贴纸×${recipe.stickerIds.length}` : ''
  return `${cut} → ${style}·${recipe.resolution}格${sticker} → ${card}`
}

/** 配方工作流面板：保存 / 一键再跑 / 发布玩法帖（本地 localStorage） */
export function WorkflowPanel({ flows, currentRecipe, onSave, onApply, onRemove, onShareCurrent }: Props) {
  const [name, setName] = useState('')
  const suggested = `${getPreset(currentRecipe.styleId).name} · ${currentRecipe.resolution}格流`

  function handleSave() {
    onSave(name.trim() || suggested)
    setName('')
  }

  return (
    <div className="panel flow-panel">
      <h3 className="panel-title">04 · 配方工作流</h3>

      <p className="flow-current">
        当前配方：<em>{recipeSummary(currentRecipe)}</em>
      </p>

      <div className="flow-save-row">
        <input
          className="field-input flow-name-input"
          value={name}
          maxLength={16}
          placeholder={suggested}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn-ghost btn-small" onClick={handleSave}>
          💾 存配方
        </button>
      </div>
      <button className="btn-accent btn-small flow-share-btn" onClick={onShareCurrent}>
        🧪 把当前配方发布成玩法帖
      </button>

      {flows.length > 0 && (
        <ul className="flow-list">
          {flows.map((flow) => (
            <li key={flow.id} className="flow-item">
              <div className="flow-item-info">
                <strong className="flow-item-name">{flow.name}</strong>
                <span className="flow-item-recipe">{recipeSummary(flow.recipe)}</span>
              </div>
              <div className="flow-item-actions">
                <button className="btn-ghost btn-small" onClick={() => onApply(flow.recipe)}>
                  ⚡ 再跑
                </button>
                <button
                  className="btn-ghost btn-small flow-del"
                  onClick={() => onRemove(flow.id)}
                  aria-label={`删除配方 ${flow.name}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {flows.length === 0 && <p className="flow-empty">还没有存过配方——调好一套流程就存下来，随时一键再跑。</p>}
    </div>
  )
}
