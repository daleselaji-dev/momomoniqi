import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { ACTIONS } from '../data/quips'
import { blitPixelArt } from '../utils/pixelate'
import { PipelineOverlay } from './PipelineOverlay'
import type { PokeZone } from '../data/persona'
import type { ActionDef, ActionId, PlacedSticker, Quip, StickerDef } from '../types'

interface Props {
  sprite: HTMLCanvasElement
  quip: Quip | null
  onAction: (action: ActionDef) => void
  /** 贴纸装扮 */
  stickers: PlacedSticker[]
  placing: StickerDef | null
  onPlaceSticker: (x: number, y: number) => void
  onRemoveSticker: (key: string) => void
  /** 直戳互动：分区 + 连击 */
  onPoke: (zone: PokeZone, combo: number) => void
  /** 长按捏住 */
  onHold: () => void
  /** 入嬷登记流水线动画（null = 未运行） */
  pipelineStep: number | null
  onSkipPipeline: () => void
}

interface Particle {
  key: string
  emoji?: string
  color?: string
  style: CSSProperties
}

type AnimId = ActionId | 'poke' | 'hold'

const CONFETTI_COLORS = ['#ff4d8d', '#b8f04a', '#ff9edb', '#7df6ff', '#ffd166']
const POKE_GLYPHS: Record<PokeZone, string[]> = {
  crown: ['👑', '✨'],
  face: ['💢', '😳'],
  robe: ['🌀', '🍬'],
}
/** 角色占舞台中央 74%（与 CSS .stage-char 对齐） */
const CHAR_MIN = 0.13
const CHAR_MAX = 0.87
const HOLD_MS = 550

let particleSeq = 0

/**
 * 互动舞台：像素角色 + 动作按钮 + 直戳分区/连击/长按 + 贴纸层 +
 * 伪 3D 视差倾斜 + 动画/粒子/彩屑/震屏/闪光 + 入嬷登记流水线覆盖层
 */
export function Stage({
  sprite,
  quip,
  onAction,
  stickers,
  placing,
  onPlaceSticker,
  onRemoveSticker,
  onPoke,
  onHold,
  pipelineStep,
  onSkipPipeline,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [anim, setAnim] = useState<{ id: AnimId; tick: number } | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [shaking, setShaking] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 })
  const [comboShow, setComboShow] = useState(0)

  const comboRef = useRef({ count: 0, last: 0 })
  const comboHideRef = useRef<number | null>(null)
  const holdTimerRef = useRef<number | null>(null)
  const holdFiredRef = useRef(false)
  const downPosRef = useRef<{ x: number; y: number } | null>(null)

  /** anim.tick 变化会通过 key 重挂载画布（重启 CSS 动画），必须跟着重绘 */
  useEffect(() => {
    if (canvasRef.current) blitPixelArt(sprite, canvasRef.current)
  }, [sprite, anim])

  /** 暴击时震屏 + 白闪 */
  useEffect(() => {
    if (!quip?.crit) return
    setShaking(true)
    setFlashing(true)
    const t1 = window.setTimeout(() => setShaking(false), 450)
    const t2 = window.setTimeout(() => setFlashing(false), 380)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [quip])

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current)
      if (comboHideRef.current !== null) window.clearTimeout(comboHideRef.current)
    }
  }, [])

  function bump(id: AnimId) {
    setAnim((prev) => ({ id, tick: (prev?.tick ?? 0) + 1 }))
  }

  function burst(glyphs: string[], emojiCount: number, confettiCount: number, origin?: { x: number; y: number }) {
    const emojiBits: Particle[] = Array.from({ length: emojiCount }, (_, i) => ({
      key: `p${particleSeq++}`,
      emoji: glyphs[i % glyphs.length],
      style: {
        left: origin ? `${origin.x * 100}%` : `${18 + Math.random() * 64}%`,
        bottom: origin ? `${(1 - origin.y) * 100}%` : undefined,
        animationDelay: `${Math.random() * 0.25}s`,
        fontSize: `${16 + Math.random() * 18}px`,
        ['--drift' as string]: `${(Math.random() - 0.5) * 90}px`,
      },
    }))
    const confettiBits: Particle[] = Array.from({ length: confettiCount }, () => ({
      key: `p${particleSeq++}`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      style: {
        left: `${14 + Math.random() * 72}%`,
        animationDelay: `${Math.random() * 0.2}s`,
        ['--drift' as string]: `${(Math.random() - 0.5) * 130}px`,
      },
    }))
    const bits = [...emojiBits, ...confettiBits]
    setParticles((prev) => [...prev.slice(-20), ...bits])
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !bits.includes(p)))
    }, 1400)
  }

  function fire(action: ActionDef) {
    bump(action.id)
    burst(action.particles, 7, 6)
    onAction(action)
  }

  /* ---------- 直戳 / 长按 / 贴纸放置 ---------- */

  function normPos(e: ReactPointerEvent<HTMLDivElement>): { x: number; y: number } {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    }
  }

  function zoneOf(pos: { x: number; y: number }): PokeZone | null {
    if (pos.x < CHAR_MIN || pos.x > CHAR_MAX || pos.y < CHAR_MIN || pos.y > CHAR_MAX) return null
    const cy = (pos.y - CHAR_MIN) / (CHAR_MAX - CHAR_MIN)
    if (cy < 0.36) return 'crown'
    if (cy < 0.7) return 'face'
    return 'robe'
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (pipelineStep !== null || placing) return
    const pos = normPos(e)
    downPosRef.current = pos
    holdFiredRef.current = false
    if (zoneOf(pos) === null) return
    holdTimerRef.current = window.setTimeout(() => {
      holdFiredRef.current = true
      bump('hold')
      burst(['🤏', '💦'], 3, 2, pos)
      onHold()
    }, HOLD_MS)
  }

  function cancelHoldTimer() {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    cancelHoldTimer()
    if (pipelineStep !== null) return
    const pos = normPos(e)

    if (placing) {
      onPlaceSticker(pos.x, pos.y)
      return
    }
    if (holdFiredRef.current) {
      holdFiredRef.current = false
      return
    }

    const zone = zoneOf(pos)
    if (!zone) return
    const now = Date.now()
    const c = comboRef.current
    c.count = now - c.last < 900 ? c.count + 1 : 1
    c.last = now
    setComboShow(c.count)
    if (comboHideRef.current !== null) window.clearTimeout(comboHideRef.current)
    comboHideRef.current = window.setTimeout(() => setComboShow(0), 1200)

    bump('poke')
    burst(POKE_GLYPHS[zone], c.count >= 5 ? 5 : 2, c.count >= 5 ? 4 : 1, pos)
    onPoke(zone, c.count)
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    /* 移动取消长按（拖拽不算捏） */
    if (downPosRef.current && holdTimerRef.current !== null) {
      const pos = normPos(e)
      if (Math.abs(pos.x - downPosRef.current.x) + Math.abs(pos.y - downPosRef.current.y) > 0.05) {
        cancelHoldTimer()
      }
    }
    /* 伪 3D：鼠标视差倾斜（触屏不启用） */
    if (e.pointerType === 'mouse') {
      const pos = normPos(e)
      setTilt({ rx: -(pos.y - 0.5) * 9, ry: (pos.x - 0.5) * 11 })
    }
  }

  return (
    <div className="panel stage-panel">
      <h3 className="panel-title">05 · 开嬷现场</h3>

      <div className="stage-scene">
        <div
          className={`stage stage-3d${shaking ? ' shaking' : ''}${placing ? ' placing' : ''}`}
          style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => {
            cancelHoldTimer()
            setTilt({ rx: 0, ry: 0 })
          }}
        >
          {quip && (
            <div key={`q${quip.id}`} className={`quip-bubble${quip.crit ? ' crit' : ''}`}>
              {quip.text}
            </div>
          )}

          {comboShow >= 2 && (
            <span key={`combo${comboShow}`} className="combo-badge" aria-live="polite">
              连戳 ×{comboShow}
            </span>
          )}

          <div key={`c${anim?.tick ?? 0}`} className={`stage-char${anim ? ` anim-${anim.id}` : ''}`}>
            <canvas ref={canvasRef} width={480} height={480} className="stage-canvas" />
            {anim && <span className={`fx fx-${anim.id}`}>{ACTIONS.find((a) => a.id === anim.id)?.emoji}</span>}
          </div>

          <div className="sticker-layer">
            {stickers.map((s) => (
              <button
                key={s.key}
                className="placed-sticker"
                title="点击摘下这张贴纸"
                style={{
                  left: `${s.x * 100}%`,
                  top: `${s.y * 100}%`,
                  fontSize: `${2.1 * s.scale}rem`,
                  transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
                }}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveSticker(s.key)
                }}
              >
                {s.glyph}
              </button>
            ))}
          </div>

          <div className="particle-layer" aria-hidden="true">
            {particles.map((p) =>
              p.emoji ? (
                <span key={p.key} className="particle" style={p.style}>
                  {p.emoji}
                </span>
              ) : (
                <span key={p.key} className="particle pixel-bit" style={{ ...p.style, background: p.color }} />
              ),
            )}
          </div>

          <div className={`stage-flash${flashing ? ' on' : ''}`} aria-hidden="true" />

          {placing && <p className="placing-hint">🖐 点任意位置贴上「{placing.label}」</p>}

          {pipelineStep !== null && <PipelineOverlay step={pipelineStep} onSkip={onSkipPipeline} />}
        </div>
      </div>

      <p className="stage-tip">💡 直接戳角色也有反应：分区不同文案不同，连戳有连击，长按会被捏住。</p>

      <div className="action-row">
        {ACTIONS.map((a) => (
          <button key={a.id} className="action-btn" onClick={() => fire(a)}>
            <span className="action-emoji">{a.emoji}</span>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
