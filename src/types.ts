export type StyleId = 'pixel' | 'gameboy' | 'cyberpink' | 'ink' | 'tama' | 'sticker' | 'manga'

export interface StylePreset {
  id: StyleId
  name: string
  tagline: string
  /** 亮度渐变调色板（暗 → 亮）；null 表示保留原色只做像素化 */
  ramp: string[] | null
  /** 抖动强度 0~1，用于让色阶过渡带颗粒感 */
  dither: number
  /** 面板小色卡（CSS 渐变） */
  swatch: string
}

export type ActionId = 'pat' | 'rua' | 'boop' | 'feed' | 'sleep' | 'praise' | 'play'

export interface ActionDef {
  id: ActionId
  label: string
  emoji: string
  /** 互动瞬间飘散的粒子表情 */
  particles: string[]
  quips: string[]
}

export interface Quip {
  id: number
  text: string
  crit: boolean
}

export interface Achievement {
  id: string
  threshold: number
  title: string
  desc: string
}

export interface RecentTemplate {
  id: string
  dataUrl: string
  ts: number
}

/* ---------- 养育状态（拓麻歌子式轻量面板） ---------- */

export interface CareStats {
  /** 精力 0~100：喂食/哄睡回复，玩耍消耗 */
  energy: number
  /** 亲密度 0~100：互动越多越亲 */
  bond: number
}

/** 每个动作对养育数值的影响（增量，可为负） */
export type CareEffect = Partial<CareStats>

/* ---------- 社区（本地模拟 feed） ---------- */

export interface CommunityPost {
  id: string
  title: string
  author: string
  blurb: string
  /** 像素缩略图 dataURL */
  thumb: string
  styleName: string
  power: number
  level: string
  likes: number
  cheers: number
  likedByMe: boolean
  /** 当前浏览器发布的作品 */
  mine: boolean
  /** 内置种子示例作品 */
  seed: boolean
  ts: number
}

export interface PublishInput {
  title: string
  author: string
  blurb: string
}

/* ---------- 审核 ---------- */

export type ModerationCategoryId = 'politics' | 'figure' | 'insult' | 'sexual' | 'illegal'

export interface ModerationHit {
  /** 命中的输入字段名（如「标题」） */
  field: string
  category: ModerationCategoryId
  categoryLabel: string
  /** 打码后的命中词（只回显首字，其余 *） */
  maskedWord: string
}

export type ModerationResult = { ok: true } | { ok: false; hits: ModerationHit[] }
