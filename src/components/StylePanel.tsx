import { STYLE_PRESETS } from '../data/presets'
import type { StyleId } from '../types'

interface Props {
  styleId: StyleId
  onStyle: (id: StyleId) => void
  resolution: number
  onResolution: (n: number) => void
}

/** 风格面板：像素颗粒度滑杆 + 四种风格预设 */
export function StylePanel({ styleId, onStyle, resolution, onResolution }: Props) {
  return (
    <div className="panel">
      <h3 className="panel-title">03 · 调风格</h3>

      <label className="slider-row">
        <span className="slider-label">
          像素强度 <em>{resolution} 格</em>
        </span>
        <input
          type="range"
          min={16}
          max={96}
          step={8}
          /* 滑杆向右 = 强度更高 = 格子更少 */
          value={112 - resolution}
          onChange={(e) => onResolution(112 - Number(e.target.value))}
        />
      </label>

      <div className="preset-grid">
        {STYLE_PRESETS.map((p) => (
          <button
            key={p.id}
            className={`preset-btn${p.id === styleId ? ' active' : ''}`}
            onClick={() => onStyle(p.id)}
          >
            <span className="preset-swatch" style={{ background: p.swatch }} />
            <span className="preset-name">{p.name}</span>
            <span className="preset-tag">{p.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
