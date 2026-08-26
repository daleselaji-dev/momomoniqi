import { STICKERS } from '../data/stickers'
import type { PlacedSticker, StickerDef } from '../types'

interface Props {
  placed: PlacedSticker[]
  placing: StickerDef | null
  onPick: (sticker: StickerDef | null) => void
  onUndo: () => void
  onClear: () => void
}

/** 贴纸装扮面板：点选贴纸 → 点舞台任意位置贴上；出卡时一并叠印 */
export function StickerPanel({ placed, placing, onPick, onUndo, onClear }: Props) {
  return (
    <div className="panel sticker-panel">
      <div className="sticker-head">
        <h3 className="panel-title">06 · 贴纸装扮</h3>
        <span className="sticker-count">{placed.length} / 12 已上身</span>
      </div>

      <div className="sticker-grid">
        {STICKERS.map((s) => (
          <button
            key={s.id}
            className={`sticker-btn${placing?.id === s.id ? ' picking' : ''}`}
            title={s.label}
            onClick={() => onPick(placing?.id === s.id ? null : s)}
          >
            <span className="sticker-glyph">{s.glyph}</span>
            <span className="sticker-label">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="sticker-toolbar">
        {placing ? (
          <span className="sticker-hint on">▲ 已拿起「{placing.label}」，点舞台任意位置贴上</span>
        ) : (
          <span className="sticker-hint">选一张贴纸拿在手上，装扮会跟着出卡</span>
        )}
        <div className="sticker-tools">
          <button className="btn-ghost btn-small" onClick={onUndo} disabled={placed.length === 0}>
            ↩ 撤销
          </button>
          <button className="btn-ghost btn-small" onClick={onClear} disabled={placed.length === 0}>
            ✕ 清空
          </button>
        </div>
      </div>
    </div>
  )
}
