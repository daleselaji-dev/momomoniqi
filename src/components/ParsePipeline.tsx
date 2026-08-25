import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeImage } from '../utils/analyzeImage'
import { removeBackground } from '../utils/removeBackground'
import { pixelate } from '../utils/pixelate'
import { getPreset } from '../data/presets'
import { getTone } from '../data/quips'
import { playCutout, playScan } from '../utils/sound'
import type { CharacterProfile, CutoutResult } from '../types'

export interface PipelineOutput {
  /** 处理后的角色源图（抠图产物或原图） */
  source: HTMLCanvasElement | HTMLImageElement
  /** 解析档案（含用户确认后的昵称） */
  profile: CharacterProfile
}

interface Props {
  img: HTMLImageElement
  onComplete: (out: PipelineOutput) => void
  onClose: () => void
}

/** 流水线阶段：0 上传完成 → 1 主体解析 → 2 抠背景 → 3 像素角色化 → 4 就绪 */
const STEPS = [
  { label: '上传', hint: '素材已就位' },
  { label: '解析', hint: '这是谁？' },
  { label: '抠图', hint: '去底成立绘' },
  { label: '像素角色', hint: '自动风格化' },
]

const STAGE_STATUS = [
  '▒ 素材注入中…',
  '▒ 扫描画面特征，比对气质原型库…',
  '▒ 正在剥离背景，提取主体立绘…',
  '▒ 像素引擎渲染角色中…',
  '✓ 解析完毕，随时开嬷',
]

/** 把源图中心正方形绘制到目标画布（预览用） */
function drawCentered(ctx: CanvasRenderingContext2D, source: HTMLImageElement | HTMLCanvasElement, size: number) {
  const sw = 'naturalWidth' in source ? source.naturalWidth : source.width
  const sh = 'naturalHeight' in source ? source.naturalHeight : source.height
  const crop = Math.min(sw, sh)
  ctx.clearRect(0, 0, size, size)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(source, (sw - crop) / 2, (sh - crop) / 2, crop, crop, 0, 0, size, size)
}

/**
 * 角色解析流水线弹窗：上传 → 主体解析（这是谁）→ 抠背景 → 自动像素角色化。
 * 全程浏览器本地计算；解析结果（昵称候选 / 气质标签 / 推荐语气风格）可一键确认或改名。
 */
export function ParsePipeline({ img, onComplete, onClose }: Props) {
  const [stage, setStage] = useState(1)
  const [profile, setProfile] = useState<CharacterProfile | null>(null)
  const [cutout, setCutout] = useState<CutoutResult | null>(null)
  const [name, setName] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timersRef = useRef<number[]>([])

  /* 阶段推进：解析 1.4s → 抠图 1.2s → 像素化 0.8s → 就绪 */
  useEffect(() => {
    playScan()
    const prof = analyzeImage(img)
    const t1 = window.setTimeout(() => {
      setProfile(prof)
      setName(prof.name)
      setStage(2)
      const cut = removeBackground(img)
      const t2 = window.setTimeout(() => {
        setCutout(cut)
        playCutout()
        const t3 = window.setTimeout(() => {
          setStage(3)
          const t4 = window.setTimeout(() => setStage(4), 800)
          timersRef.current.push(t4)
        }, 1200)
        timersRef.current.push(t3)
      }, 300)
      timersRef.current.push(t2)
    }, 1400)
    timersRef.current.push(t1)
    return () => timersRef.current.forEach((t) => window.clearTimeout(t))
  }, [img])

  /** 像素角色预览：抠图产物 × 推荐风格 */
  const sprite = useMemo(() => {
    if (!cutout || !profile) return null
    return pixelate(cutout.canvas, 48, getPreset(profile.styleId))
  }, [cutout, profile])

  /* 预览画布：按阶段绘制原图 / 抠图（透明底）/ 像素角色 */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (stage >= 3 && sprite) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(sprite, 0, 0, canvas.width, canvas.height)
    } else if (stage >= 2 && cutout) {
      drawCentered(ctx, cutout.canvas, canvas.width)
    } else {
      drawCentered(ctx, img, canvas.width)
    }
  }, [stage, img, cutout, sprite])

  function confirm(useOriginal: boolean) {
    if (!profile) return
    const finalName = name.trim() || profile.name
    onComplete({
      source: useOriginal || !cutout ? img : cutout.canvas,
      profile: { ...profile, name: finalName },
    })
  }

  const showTransparency = stage >= 2 && stage < 3 && cutout?.method === 'keyed'

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="角色解析流水线">
      <div className="modal pp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">⌁ 角色解析流水线</h3>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        {/* 步骤条：上传 → 解析 → 抠图 → 像素角色 */}
        <ol className="pp-steps" aria-label="解析流水线步骤">
          {STEPS.map((s, i) => {
            const done = stage > i
            const current = stage === i
            return (
              <li key={s.label} className={`pp-step${done ? ' done' : ''}${current ? ' current' : ''}`}>
                <span className="pp-step-dot">{done ? '✓' : i + 1}</span>
                <span className="pp-step-label">{s.label}</span>
                <span className="pp-step-hint">{s.hint}</span>
              </li>
            )
          })}
        </ol>

        <div className="pp-body">
          {/* 预览区：扫描线 / 透明底揭示 / 像素定格 */}
          <div className={`pp-preview${showTransparency ? ' alpha-grid' : ''}`}>
            <canvas
              ref={canvasRef}
              width={480}
              height={480}
              className={`pp-canvas${stage >= 3 ? ' pixelated' : ''}${stage === 3 ? ' popping' : ''}`}
            />
            {stage === 1 && <div className="pp-scanline" aria-hidden="true" />}
            {stage === 1 && <div className="pp-grid-overlay" aria-hidden="true" />}
            {stage === 2 && cutout && <div className="pp-reveal" aria-hidden="true" />}
            <span className="pp-status" role="status">
              {STAGE_STATUS[stage]}
            </span>
          </div>

          {/* 档案卡：「这是谁」解析结果，可一键确认 / 改名 */}
          <div className="pp-profile">
            {!profile ? (
              <div className="pp-profile-loading">
                <span className="pp-blink">▮▮▮</span> 正在推断这是谁…
              </div>
            ) : (
              <>
                <div className="pp-arch-row">
                  <span className={`pp-arch-badge ${profile.tone}`}>{profile.archetypeLabel}</span>
                  <span className="pp-arch-tone">
                    推荐语气「{getTone(profile.tone).name}」 · 推荐风格「{getPreset(profile.styleId).name}」
                  </span>
                </div>
                <p className="pp-blurb">{profile.blurb}</p>
                <div className="pp-tags">
                  {profile.vibeTags.map((t) => (
                    <span key={t} className="pp-tag">
                      #{t}
                    </span>
                  ))}
                </div>
                <label className="field pp-name-field">
                  <span className="field-label">给 TA 起个名（可改）</span>
                  <input
                    className="field-input"
                    value={name}
                    maxLength={12}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={profile.name}
                  />
                </label>
                <div className="pp-candidates">
                  {profile.nameCandidates.map((n) => (
                    <button
                      key={n}
                      className={`pp-candidate${name === n ? ' active' : ''}`}
                      onClick={() => setName(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {cutout && (
                  <p className={`pp-cut-note ${cutout.method}`}>
                    {cutout.method === 'keyed'
                      ? `✂ 背景已抠除 ${(cutout.removedRatio * 100).toFixed(0)}%，透明底立绘就绪`
                      : '⚠ 背景较复杂，已优雅降级：中心裁切 + 柔边键控'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="pp-actions">
          <button className="btn-primary pp-go" onClick={() => confirm(false)} disabled={stage < 4}>
            {stage < 4 ? '▒ 流水线运转中…' : '⚡ 确认，开嬷！'}
          </button>
          <button className="btn-ghost btn-small" onClick={() => confirm(true)} disabled={stage < 4}>
            用原图（不抠图）
          </button>
        </div>
        <p className="pp-note">解析 / 抠图全程在你的浏览器本地完成，图片不出浏览器。</p>
      </div>
    </div>
  )
}
