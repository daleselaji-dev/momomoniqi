import { useEffect, useRef, useState } from 'react'
import { moderateFields } from '../utils/moderation'
import { playReject } from '../utils/sound'
import { Disclaimer } from './Disclaimer'
import type { ModerationHit, PublishInput } from '../types'

interface Props {
  thumb: string
  power: number
  level: string
  styleName: string
  /** 当前语气包名（嬷向 / 攻向），随作品一起上架 */
  toneName: string
  onPublish: (input: PublishInput) => void
  onClose: () => void
}

type Status = { kind: 'idle' } | { kind: 'checking' } | { kind: 'passed' } | { kind: 'rejected'; hits: ModerationHit[] }

/**
 * 发布到社区弹窗：填写 → 提交审核（强制）→ 通过后才可发布。
 * 任何字段被修改都会作废已有审核结果，必须重新过审。
 */
export function PublishModal({ thumb, power, level, styleName, toneName, onPublish, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [blurb, setBlurb] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const canSubmit = title.trim().length > 0 && author.trim().length > 0 && status.kind === 'idle'

  function edit(setter: (v: string) => void) {
    return (v: string) => {
      setter(v)
      setStatus({ kind: 'idle' })
    }
  }

  function handleReview() {
    if (!canSubmit) return
    setStatus({ kind: 'checking' })
    /* 小延迟营造「过闸机」仪式感，同时留出扩展为异步服务端审核的接口形态 */
    timerRef.current = window.setTimeout(() => {
      const result = moderateFields([
        { label: '标题', value: title },
        { label: '昵称', value: author },
        { label: '简介', value: blurb },
      ])
      if (result.ok) {
        setStatus({ kind: 'passed' })
      } else {
        setStatus({ kind: 'rejected', hits: result.hits })
        playReject()
      }
    }, 450)
  }

  function handlePublish() {
    if (status.kind !== 'passed') return
    onPublish({ title: title.trim(), author: author.trim(), blurb: blurb.trim() })
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="发布到社区">
      <div className="modal publish-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">⚑ 发布到社区展台</h3>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="publish-preview">
          <img src={thumb} alt="作品预览" className="publish-thumb" />
          <div className="publish-meta">
            <span className="publish-meta-line">风格 · {styleName} / 语气 · {toneName}</span>
            <span className="publish-meta-line strong">嬷力值 {power}</span>
            <span className="publish-meta-line">段位 「{level}」</span>
          </div>
        </div>

        <label className="field">
          <span className="field-label">作品标题 *</span>
          <input
            className="field-input"
            value={title}
            maxLength={24}
            placeholder="例：御膳房主厨嬷"
            onChange={(e) => edit(setTitle)(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">作者昵称 *</span>
          <input
            className="field-input"
            value={author}
            maxLength={16}
            placeholder="例：小翠子"
            onChange={(e) => edit(setAuthor)(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">一句话简介</span>
          <input
            className="field-input"
            value={blurb}
            maxLength={60}
            placeholder="给你的嬷嬷写一句人设（选填）"
            onChange={(e) => edit(setBlurb)(e.target.value)}
          />
        </label>

        {status.kind === 'rejected' && (
          <div className="review-result rejected" role="alert">
            <strong>✕ 审核未通过，无法发布</strong>
            <ul>
              {status.hits.map((h, i) => (
                <li key={i}>
                  「{h.field}」命中 <em>{h.categoryLabel}</em>（{h.maskedWord}），请修改后重新提交审核
                </li>
              ))}
            </ul>
          </div>
        )}
        {status.kind === 'passed' && (
          <div className="review-result passed" role="status">
            ✓ 审核通过，可以发布了
          </div>
        )}

        <div className="publish-actions">
          <button className="btn-ghost" onClick={handleReview} disabled={!canSubmit}>
            {status.kind === 'checking' ? '▒ 审核中…' : status.kind === 'passed' ? '✓ 已过审' : '⊙ 提交审核'}
          </button>
          <button className="btn-primary" onClick={handlePublish} disabled={status.kind !== 'passed'}>
            ⚑ 发布上架
          </button>
        </div>
        <p className="publish-note">发布前必须通过内容审核（客户端启发式过滤；正式上线将接入服务端审核 + 人工复审）。</p>

        <Disclaimer />
      </div>
    </div>
  )
}
