export type StyleId = 'pixel' | 'gameboy' | 'cyberpink' | 'ink'

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

export type ActionId = 'pat' | 'rua' | 'boop' | 'feed'

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
