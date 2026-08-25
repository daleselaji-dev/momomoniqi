import { levelName, nextThreshold } from '../data/quips'

/** 嬷力值仪表：数值 + 段位 + 距下一段位进度条 */
export function MomoMeter({ power }: { power: number }) {
  const level = levelName(power)
  const next = nextThreshold(power)
  const pct = next ? Math.min(100, Math.round((power / next) * 100)) : 100

  return (
    <div className="meter">
      <div className="meter-head">
        <span className="meter-label">嬷力值</span>
        <span key={power} className="meter-value">
          {power}
        </span>
        <span className="meter-level">「{level}」</span>
      </div>
      <div className="meter-bar">
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="meter-hint">{next ? `距下一段位还差 ${next - power} 点` : '已登顶，嬷力辐射全宇宙'}</p>
    </div>
  )
}
