import { useState } from 'react'
import { ACTIONS, TONES } from '../data/quips'
import { WORKFLOW_TEMPLATES } from '../data/workflows'
import type { ActionId, ToneId, WorkflowSnapshot } from '../types'

export interface StepFlags {
  character: boolean
  style: boolean
  script: boolean
  output: boolean
}

interface Props {
  characterName: string
  styleName: string
  stepFlags: StepFlags
  tone: ToneId
  onTone: (t: ToneId) => void
  script: ActionId[]
  onScript: (s: ActionId[]) => void
  /** 正在演出的脚本步骤下标；null = 未在演出 */
  performing: number | null
  onRun: () => void
  onApplyTemplate: (tone: ToneId, script: ActionId[]) => void
  saved: WorkflowSnapshot[]
  onSave: (name: string) => void
  onLoad: (w: WorkflowSnapshot) => void
  onRemove: (id: string) => void
}

const MAX_SCRIPT = 12

const STEP_DEFS: { key: keyof StepFlags; label: string; hint: string }[] = [
  { key: 'character', label: '选角色', hint: '上传或选原创角色' },
  { key: 'style', label: '定风格', hint: '7 种像素滤镜' },
  { key: 'script', label: '编脚本', hint: '排一串动作连招' },
  { key: 'output', label: '出片', hint: '认证卡 / 发布' },
]

/**
 * 工作流导演台：步骤条 + 语气包 + 动作脚本编排 + 一键演出 + 模板 / 快照复用。
 * 把「素材 → 风格 → 互动 → 出片」流水线产品化成可保存、可复演的工作流。
 */
export function WorkflowPanel({
  characterName,
  styleName,
  stepFlags,
  tone,
  onTone,
  script,
  onScript,
  performing,
  onRun,
  onApplyTemplate,
  saved,
  onSave,
  onLoad,
  onRemove,
}: Props) {
  const [name, setName] = useState('')
  const busy = performing !== null
  const currentStep = STEP_DEFS.findIndex((s) => !stepFlags[s.key])

  function addAction(id: ActionId) {
    if (busy || script.length >= MAX_SCRIPT) return
    onScript([...script, id])
  }

  function removeAt(idx: number) {
    if (busy) return
    onScript(script.filter((_, i) => i !== idx))
  }

  function handleSave() {
    const trimmed = name.trim()
    onSave(trimmed || `${characterName} · ${styleName} · ${script.length}步`)
    setName('')
  }

  return (
    <div className="panel workflow-panel">
      <h3 className="panel-title">05 · 工作流导演台</h3>

      {/* 步骤条：完成态自动点亮，当前步呼吸提示 */}
      <ol className="wf-steps" aria-label="创作工作流步骤">
        {STEP_DEFS.map((s, i) => {
          const done = stepFlags[s.key]
          const current = i === currentStep
          return (
            <li key={s.key} className={`wf-step${done ? ' done' : ''}${current ? ' current' : ''}`}>
              <span className="wf-step-dot">{done ? '✓' : i + 1}</span>
              <span className="wf-step-label">{s.label}</span>
              <span className="wf-step-hint">{s.hint}</span>
            </li>
          )
        })}
      </ol>

      {/* 语气包切换：嬷向 / 攻向 */}
      <div className="wf-block">
        <span className="wf-block-label">语气包</span>
        <div className="wf-tones" role="tablist" aria-label="语气包">
          {TONES.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tone === t.id}
              className={`wf-tone${tone === t.id ? ' active' : ''} ${t.id}`}
              onClick={() => onTone(t.id)}
              disabled={busy}
            >
              <strong>{t.name}</strong>
              <em>{t.tagline}</em>
            </button>
          ))}
        </div>
      </div>

      {/* 动作脚本编排 */}
      <div className="wf-block">
        <span className="wf-block-label">
          动作脚本 <i>{script.length}/{MAX_SCRIPT}</i>
        </span>
        <div className="wf-palette">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              className="wf-add"
              onClick={() => addAction(a.id)}
              disabled={busy || script.length >= MAX_SCRIPT}
              title={`把「${a.label}」加入脚本`}
            >
              {a.emoji} {a.label}
            </button>
          ))}
        </div>

        {script.length === 0 ? (
          <p className="wf-empty">点上面的动作排一套连招，或直接套用下方爆款模板</p>
        ) : (
          <div className="wf-script" aria-label="已编排的动作脚本">
            {script.map((id, idx) => {
              const a = ACTIONS.find((x) => x.id === id)
              return (
                <button
                  key={`${id}-${idx}`}
                  className={`wf-chip${performing === idx ? ' playing' : ''}`}
                  onClick={() => removeAt(idx)}
                  disabled={busy}
                  title="点击移除该步"
                >
                  <span className="wf-chip-idx">{idx + 1}</span>
                  {a?.emoji}
                </button>
              )
            })}
            {!busy && (
              <button className="wf-clear" onClick={() => onScript([])}>
                清空
              </button>
            )}
          </div>
        )}

        <button className="btn-accent wf-run" onClick={onRun} disabled={busy || script.length === 0}>
          {busy ? `▶ 演出中 · 第 ${(performing ?? 0) + 1}/${script.length} 步` : '▶ 一键演出（自动连打脚本）'}
        </button>
        {busy && (
          <div className="wf-progress" aria-hidden="true">
            <div
              className="wf-progress-fill"
              style={{ width: `${(((performing ?? 0) + 1) / Math.max(1, script.length)) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* 爆款模板 */}
      <div className="wf-block">
        <span className="wf-block-label">爆款模板</span>
        <div className="wf-templates">
          {WORKFLOW_TEMPLATES.map((t) => (
            <button
              key={t.id}
              className="wf-template"
              onClick={() => onApplyTemplate(t.tone, t.script)}
              disabled={busy}
            >
              <strong>{t.name}</strong>
              <em>{t.desc}</em>
              <span className="wf-template-meta">
                {t.tone === 'gong' ? '攻向' : '嬷向'} · {t.script.length} 步
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 保存 / 复用工作流 */}
      <div className="wf-block">
        <span className="wf-block-label">我的工作流</span>
        <div className="wf-save-row">
          <input
            className="field-input wf-save-input"
            value={name}
            maxLength={20}
            placeholder={`${characterName} · ${styleName} · ${script.length}步`}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
          <button className="btn-ghost btn-small" onClick={handleSave} disabled={busy || script.length === 0}>
            ⭳ 保存
          </button>
        </div>
        {saved.length === 0 ? (
          <p className="wf-empty">还没有保存过工作流。排好脚本点「保存」，下次一键复演。</p>
        ) : (
          <div className="wf-saved-list">
            {saved.map((w) => (
              <div key={w.id} className="wf-saved">
                <button className="wf-saved-load" onClick={() => onLoad(w)} disabled={busy}>
                  <strong>{w.name}</strong>
                  <em>
                    {w.tone === 'gong' ? '攻向' : '嬷向'} · {w.script.length} 步 ·{' '}
                    {w.characterId ? '原创角色' : '当前角色'}
                  </em>
                </button>
                <button
                  className="wf-saved-del"
                  onClick={() => onRemove(w.id)}
                  aria-label={`删除工作流 ${w.name}`}
                  disabled={busy}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
