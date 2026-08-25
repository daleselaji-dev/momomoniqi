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
}

interface Particle {
  key: string
  emoji?: string
  color?: string
  style: CSSProperties
}

const CONFETTI_COLORS = ['#ff4d8d', '#b8f04a', '#ff9edb', '#7df6ff', '#ffd166']

let particleSeq = 0

/** 互动舞台：像素角色 + 动作按钮 + 动画/粒子/彩屑/震屏/闪光反馈 + 文案气泡 */
export function Stage({ sprite, quip, onAction, autoFire, spawnTick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [anim, setAnim] = useState<{ id: ActionId; tick: number } | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
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

  function fire(action: ActionDef) {
    setAnim((prev) => ({ id: action.id, tick: (prev?.tick ?? 0) + 1 }))
    const emojiBits: Particle[] = Array.from({ length: 7 }, (_, i) => ({
      key: `p${particleSeq++}`,
      emoji: action.particles[i % action.particles.length],
      style: {
        left: `${18 + Math.random() * 64}%`,
        animationDelay: `${Math.random() * 0.25}s`,
        fontSize: `${16 + Math.random() * 18}px`,
        ['--drift' as string]: `${(Math.random() - 0.5) * 90}px`,
      },
    }))
    const confettiBits: Particle[] = Array.from({ length: 6 }, () => ({
      key: `p${particleSeq++}`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      style: {
        left: `${14 + Math.random() * 72}%`,
        animationDelay: `${Math.random() * 0.2}s`,
        ['--drift' as string]: `${(Math.random() - 0.5) * 130}px`,
      },
    }))
    const burst = [...emojiBits, ...confettiBits]
    setParticles((prev) => [...prev.slice(-20), ...burst])
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !burst.includes(p)))
    }, 1400)
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
        </div>

        {spawning && <div className="spawn-sweep" aria-hidden="true" />}

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
