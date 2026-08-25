import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ACTIONS } from '../data/quips'
import { blitPixelArt } from '../utils/pixelate'
import type { ActionDef, ActionId, Quip } from '../types'

interface Props {
  sprite: HTMLCanvasElement
  quip: Quip | null
  onAction: (action: ActionDef) => void
}

interface Particle {
  key: string
  emoji: string
  style: CSSProperties
}

let particleSeq = 0

/** 互动舞台：像素角色 + 动作按钮 + 动画/粒子反馈 + 文案气泡 */
export function Stage({ sprite, quip, onAction }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [anim, setAnim] = useState<{ id: ActionId; tick: number } | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (canvasRef.current) blitPixelArt(sprite, canvasRef.current)
  }, [sprite])

  function fire(action: ActionDef) {
    setAnim((prev) => ({ id: action.id, tick: (prev?.tick ?? 0) + 1 }))
    const burst: Particle[] = Array.from({ length: 7 }, (_, i) => ({
      key: `p${particleSeq++}`,
      emoji: action.particles[i % action.particles.length],
      style: {
        left: `${18 + Math.random() * 64}%`,
        animationDelay: `${Math.random() * 0.25}s`,
        fontSize: `${16 + Math.random() * 18}px`,
        ['--drift' as string]: `${(Math.random() - 0.5) * 90}px`,
      },
    }))
    setParticles((prev) => [...prev.slice(-14), ...burst])
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !burst.includes(p)))
    }, 1400)
    onAction(action)
  }

  return (
    <div className="panel stage-panel">
      <h3 className="panel-title">03 · 开嬷现场</h3>

      <div className="stage">
        {quip && (
          <div key={`q${quip.id}`} className={`quip-bubble${quip.crit ? ' crit' : ''}`}>
            {quip.text}
          </div>
        )}

        <div key={`c${anim?.tick ?? 0}`} className={`stage-char${anim ? ` anim-${anim.id}` : ''}`}>
          <canvas ref={canvasRef} width={480} height={480} className="stage-canvas" />
          {anim && <span className={`fx fx-${anim.id}`}>{ACTIONS.find((a) => a.id === anim.id)?.emoji}</span>}
        </div>

        <div className="particle-layer" aria-hidden="true">
          {particles.map((p) => (
            <span key={p.key} className="particle" style={p.style}>
              {p.emoji}
            </span>
          ))}
        </div>
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
