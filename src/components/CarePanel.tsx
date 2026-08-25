import { moodOf } from '../data/care'
import type { CareStats } from '../types'

/** 养育状态面板：精力 / 亲密度像素条 + 心情提示（拓麻歌子式轻养成） */
export function CarePanel({ care }: { care: CareStats }) {
  const mood = moodOf(care)
  return (
    <div className="care-panel">
      <div className="care-head">
        <span className="care-label">养育状态</span>
        <span className="care-mood">
          <span className="care-mood-emoji">{mood.emoji}</span>
          {mood.label}
        </span>
      </div>
      <CareBar name="精力" value={care.energy} tone="green" icon="🔋" />
      <CareBar name="亲密度" value={care.bond} tone="pink" icon="💗" />
    </div>
  )
}

function CareBar({ name, value, tone, icon }: { name: string; value: number; tone: 'green' | 'pink'; icon: string }) {
  return (
    <div className="care-row">
      <span className="care-row-name">
        {icon} {name}
      </span>
      <div className="care-bar">
        <div className={`care-fill ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="care-row-val">{value}</span>
    </div>
  )
}
