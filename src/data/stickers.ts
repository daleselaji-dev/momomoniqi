import type { StickerDef } from '../types'

/** 贴纸装扮素材库：点选贴上舞台、随出卡带走（Y2K 装扮热点的嬷嬷版） */
export const STICKERS: StickerDef[] = [
  { id: 'crown', glyph: '👑', label: '御赐凤冠' },
  { id: 'bow', glyph: '🎀', label: '破功蝴蝶结' },
  { id: 'glasses', glyph: '👓', label: '验货老花镜' },
  { id: 'tea', glyph: '🍵', label: '压惊热茶' },
  { id: 'vein', glyph: '💢', label: '假装生气' },
  { id: 'blossom', glyph: '💮', label: '盖章小白花' },
  { id: 'star', glyph: '⭐', label: '嬷力星星' },
  { id: 'shades', glyph: '🕶', label: '拒绝营业墨镜' },
  { id: 'beads', glyph: '📿', label: '静心佛珠' },
  { id: 'heart', glyph: '💝', label: '偷藏的心意' },
  { id: 'fire', glyph: '🔥', label: '战力过剩' },
  { id: 'zzz', glyph: '💤', label: '装睡外挂' },
]

export function getSticker(id: string): StickerDef | undefined {
  return STICKERS.find((s) => s.id === id)
}
