import type { ActionId, CareEffect, CareStats } from '../types'

export const INITIAL_CARE: CareStats = { energy: 80, bond: 12 }

/** 各动作对养育数值的影响（拓麻歌子式：玩耍耗精力涨亲密，喂食哄睡回精力） */
export const CARE_EFFECTS: Record<ActionId, CareEffect> = {
  pat: { bond: 3, energy: -1 },
  rua: { bond: 4, energy: -4 },
  boop: { bond: 2, energy: -3 },
  feed: { energy: 12, bond: 1 },
  sleep: { energy: 18, bond: 2 },
  praise: { bond: 6, energy: -1 },
  play: { bond: 8, energy: -12 },
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

export function applyCare(stats: CareStats, effect: CareEffect): CareStats {
  return {
    energy: clamp(stats.energy + (effect.energy ?? 0)),
    bond: clamp(stats.bond + (effect.bond ?? 0)),
  }
}

export interface Mood {
  emoji: string
  label: string
}

/** 根据精力 / 亲密度推导当前心情（展示于养育面板） */
export function moodOf({ energy, bond }: CareStats): Mood {
  if (energy < 20) return { emoji: '🥱', label: '嬷嬷电量告急，快喂食或哄睡回蓝' }
  if (bond >= 90) return { emoji: '🥰', label: '亲密度爆表，嬷嬷已把你写进族谱' }
  if (bond >= 60) return { emoji: '😊', label: '嬷嬷看你的眼神已经藏不住笑' }
  if (energy >= 90) return { emoji: '⚡', label: '精力过剩，快丢个球让嬷嬷撒欢' }
  if (bond >= 30) return { emoji: '🙂', label: '关系回暖中，多互动涨亲密' }
  return { emoji: '😐', label: '嬷嬷持保留态度，建议先摸头破冰' }
}
