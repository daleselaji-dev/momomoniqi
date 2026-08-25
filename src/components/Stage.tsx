import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ACTIONS } from '../data/quips'
import { blitPixelArt } from '../utils/pixelate'
import type { ActionDef, ActionId, Quip } from '../types'

interface Props {
  sprite: HTMLCanvasElement
  quip: Quip | null
  onAction: (action: ActionDef) => void
  /** 工作流「一键演出」的外部触发信号：seq 变化即连打对应动作 */
  autoFire?: { action: ActionDef; seq: number } | null
  /** 角色载入信号：变化时播放 spawn 传送动效 */
  spawnTick?: number
  /** 亲密度 0~100：决定角色反应强度（表情 / 粒子量 / 特效档位） */
  bond: number
}

interface Particle {
  key: string
  variant: 'emoji' | 'bit' | 'paw' | 'heart'
  emoji?: string
  color?: string
  style: CSSProperties
}

const CONFETTI_COLORS = ['#ff4d8d', '#b8f04a', '#ff9edb', '#7df6ff', '#ffd166']
const HEART_EMOJIS = ['💗', '💞', '🩷', '💖']

let particleSeq = 0

/**
 * 互动舞台：像素角色 + 动作按钮 + 动画/粒子/彩屑/震屏/闪光反馈 + 文案气泡。
 * 反应强度按亲密度分三档（冷淡 → 破防中 → 彻底沦陷）：
 * 表情气泡换脸、粒子量翻倍、满屏心心 / 摸头光晕 / 猫爪印等叠加特效逐档解锁。
 */
export function Stage({ sprite, quip, onAction, autoFire, spawnTick, bond }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [anim, setAnim] = useState<{ id: ActionId; tick: number } | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [face, setFace] = useState<{ key: number; emoji: string } | null>(null)
  const [halo, setHalo] = useState<number | null>(null)
  const [glowing, setGlowing] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [spawning, setSpawning] = useState(false)
  const fireRef = useRef<(action: ActionDef) => void>(() => {})

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

  /** 工作流自动连打：seq 变化即执行完整 fire 管线（动画/粒子/音效/数值） */
  useEffect(() => {
    if (autoFire) fireRef.current(autoFire.action)
  }, [autoFire])

  /** 角色载入：spawn 传送动效（缩放弹入 + 扫描线掠过） */
  useEffect(() => {
    if (!spawnTick) return
    setSpawning(true)
    const t = window.setTimeout(() => setSpawning(false), 780)
    return () => window.clearTimeout(t)
  }, [spawnTick])

  /** 表情气泡 / 光晕 / 边缘光的自清理 */
  useEffect(() => {
    if (!face) return
    const t = window.setTimeout(() => setFace(null), 1200)
    return () => window.clearTimeout(t)
  }, [face])
  useEffect(() => {
    if (halo === null) return
    const t = window.setTimeout(() => setHalo(null), 950)
    return () => window.clearTimeout(t)
  }, [halo])
  useEffect(() => {
    if (!glowing) return
    const t = window.setTimeout(() => setGlowing(false), 900)
    return () => window.clearTimeout(t)
  }, [glowing])

  function fire(action: ActionDef) {
    /* 反应强度：亲密度 <35 冷淡档，35~69 破防档，≥70 沦陷档 */
    const intensity = bond >= 70 ? 2 : bond >= 35 ? 1 : 0
    setAnim((prev) => ({ id: action.id, tick: (prev?.tick ?? 0) + 1 }))

    if (action.faces) setFace({ key: ++particleSeq, emoji: action.faces[intensity] })
    const fx = action.fx ?? []
    if (fx.includes('halo')) setHalo((h) => (h ?? 0) + 1)
    if (intensity === 2) setGlowing(true)

    const emojiCount = 5 + intensity * 3
    const emojiBits: Particle[] = Array.from({ length: emojiCount }, (_, i) => ({
      key: `p${particleSeq++}`,
      variant: 'emoji',
      emoji: action.particles[i % action.particles.length],
      style: {
        left: `${18 + Math.random() * 64}%`,
        animationDelay: `${Math.random() * 0.25}s`,
        fontSize: `${16 + Math.random() * 18}px`,
        ['--drift' as string]: `${(Math.random() - 0.5) * 90}px`,
      },
    }))
    const confettiBits: Particle[] = Array.from({ length: 4 + intensity * 2 }, () => ({
      key: `p${particleSeq++}`,
      variant: 'bit',
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      style: {
        left: `${14 + Math.random() * 72}%`,
        animationDelay: `${Math.random() * 0.2}s`,
        ['--drift' as string]: `${(Math.random() - 0.5) * 130}px`,
      },
    }))
    /* 猫爪印：随机盖章，强度越高爪印越多 */
    const pawBits: Particle[] = fx.includes('paws')
      ? Array.from({ length: 3 + intensity * 2 }, () => ({
          key: `p${particleSeq++}`,
          variant: 'paw' as const,
          emoji: '🐾',
          style: {
            left: `${10 + Math.random() * 76}%`,
            top: `${12 + Math.random() * 66}%`,
            animationDelay: `${Math.random() * 0.4}s`,
            fontSize: `${20 + Math.random() * 16}px`,
            transform: `rotate(${(Math.random() - 0.5) * 60}deg)`,
          },
        }))
      : []
    /* 满屏心心：破防档起解锁，沦陷档加量 */
    const heartBits: Particle[] =
      fx.includes('hearts') && intensity >= 1
        ? Array.from({ length: intensity * 4 }, () => ({
            key: `p${particleSeq++}`,
            variant: 'heart' as const,
            emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
            style: {
              left: `${8 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              fontSize: `${22 + Math.random() * 22}px`,
              ['--drift' as string]: `${(Math.random() - 0.5) * 60}px`,
            },
          }))
        : []

    const burst = [...emojiBits, ...confettiBits, ...pawBits, ...heartBits]
    setParticles((prev) => [...prev.slice(-26), ...burst])
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !burst.includes(p)))
    }, 1700)
    onAction(action)
  }
  fireRef.current = fire

  return (
    <div className="panel stage-panel">
      <h3 className="panel-title">04 · 开嬷现场</h3>

      <div className={`stage${shaking ? ' shaking' : ''}`}>
        {quip && (
          <div key={`q${quip.id}`} className={`quip-bubble${quip.crit ? ' crit' : ''}`}>
            {quip.text}
          </div>
        )}

        <div
          key={`c${anim?.tick ?? 0}`}
          className={`stage-char${anim ? ` anim-${anim.id}` : ''}${spawning ? ' spawning' : ''}`}
        >
          <canvas ref={canvasRef} width={480} height={480} className="stage-canvas" />
          {anim && <span className={`fx fx-${anim.id}`}>{ACTIONS.find((a) => a.id === anim.id)?.emoji}</span>}
          {halo !== null && <span key={`h${halo}`} className="fx-halo" aria-hidden="true" />}
        </div>

        {face && (
          <span key={`f${face.key}`} className="stage-face" aria-hidden="true">
            {face.emoji}
          </span>
        )}

        {spawning && <div className="spawn-sweep" aria-hidden="true" />}

        <div className="particle-layer" aria-hidden="true">
          {particles.map((p) => {
            if (p.variant === 'bit') {
              return <span key={p.key} className="particle pixel-bit" style={{ ...p.style, background: p.color }} />
            }
            if (p.variant === 'paw') {
              return (
                <span key={p.key} className="paw-stamp" style={p.style}>
                  {p.emoji}
                </span>
              )
            }
            if (p.variant === 'heart') {
              return (
                <span key={p.key} className="particle heart-big" style={p.style}>
                  {p.emoji}
                </span>
              )
            }
            return (
              <span key={p.key} className="particle" style={p.style}>
                {p.emoji}
              </span>
            )
          })}
        </div>

        <div className={`stage-glow${glowing ? ' on' : ''}`} aria-hidden="true" />
        <div className={`stage-flash${flashing ? ' on' : ''}`} aria-hidden="true" />
      </div>

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
