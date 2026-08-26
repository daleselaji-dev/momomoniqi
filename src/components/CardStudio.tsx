import { useMemo, useState } from 'react'
import { buildCardShareText, CARD_TEMPLATES, downloadCard, renderCard, type CardInput } from '../utils/shareCard'
import { playFlip } from '../utils/sound'
import type { CardTemplateId } from '../types'

interface Props {
  input: CardInput
  template: CardTemplateId
  onTemplate: (id: CardTemplateId) => void
  onClose: () => void
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

/** 出卡工作室：三套模板实时预览（3D 倾斜 + 翻面）→ 下载 PNG / 复制文案 */
export function CardStudio({ input, template, onTemplate, onClose }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 })

  /** 模板 / 素材变化即重渲；toDataURL 后交给 <img> 展示 */
  const preview = useMemo(() => renderCard(template, input).toDataURL('image/png'), [template, input])
  const def = CARD_TEMPLATES.find((t) => t.id === template) ?? CARD_TEMPLATES[0]

  function handleFlip() {
    setFlipped((f) => !f)
    playFlip()
  }

  function handleDownload() {
    downloadCard(renderCard(template, input), `momo-${template}-${input.power}.png`)
  }

  async function handleCopy() {
    const ok = await copyText(buildCardShareText(template, input))
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="出卡工作室">
      <div className="modal studio-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">🎴 出卡工作室</h3>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="studio-tabs" role="tablist" aria-label="卡模板">
          {CARD_TEMPLATES.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === template}
              className={`studio-tab${t.id === template ? ' active' : ''}`}
              onClick={() => {
                onTemplate(t.id)
                setFlipped(false)
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
        <p className="studio-hint">{def.hint} · 点卡片可翻到背面</p>

        <div
          className="card3d"
          onPointerMove={(e) => {
            if (e.pointerType !== 'mouse') return
            const rect = e.currentTarget.getBoundingClientRect()
            const nx = (e.clientX - rect.left) / rect.width - 0.5
            const ny = (e.clientY - rect.top) / rect.height - 0.5
            setTilt({ rx: -ny * 10, ry: nx * 12 })
          }}
          onPointerLeave={() => setTilt({ rx: 0, ry: 0 })}
        >
          <button
            className={`card3d-inner${flipped ? ' flipped' : ''}`}
            style={
              flipped
                ? undefined
                : { transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }
            }
            onClick={handleFlip}
            aria-label={flipped ? '翻回正面' : '翻到背面'}
          >
            <img src={preview} alt={`${def.name}预览`} className="card3d-face front" />
            <div className="card3d-face back" aria-hidden="true">
              <span className="card-back-brand">▚ MOMOMONIQI ▞</span>
              <span className="card-back-grid" />
              <span className="card-back-no">{input.profile.dossierNo}</span>
              <span className="card-back-slogan">把严肃角色宠成全网嬷嬷</span>
            </div>
          </button>
        </div>

        <div className="studio-actions">
          <button className="btn-primary" onClick={handleDownload}>
            ⬇ 下载 {def.name} PNG
          </button>
          <button className="btn-ghost" onClick={handleCopy}>
            {copied ? '✓ 已复制，快去发' : '⧉ 复制传播文案'}
          </button>
        </div>
        <p className="publish-note">900×1200 竖版 PNG，适配小红书 / 抖音图文 · 全程本地渲染，图片不出浏览器。</p>
      </div>
    </div>
  )
}
