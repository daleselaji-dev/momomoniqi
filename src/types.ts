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

/* ---------- 语气包（嬷向 / 攻向二创） ---------- */

export type ToneId = 'momo' | 'gong'

export interface ToneDef {
  id: ToneId
  name: string
  /** 单字徽标（嬷 / 攻） */
  short: string
  tagline: string
}

/* ---------- 原创角色库（免版权预设） ---------- */

export interface CharacterDef {
  id: string
  name: string
  /** 性格标签（展示在卡片上） */
  vibe: string
  /** 一句话人设 */
  intro: string
  /** 推荐语气：载入角色时自动切换 */
  tone: ToneId
  /** 像素画网格（每行一串调色板字母，'.' 为透明） */
  grid: string[]
  colors: Record<string, string>
}

/* ---------- 工作流（可保存 / 复用的创作流水线） ---------- */

export interface WorkflowSnapshot {
  id: string
  name: string
  /** 原创角色 id；null 表示保存时用的是上传图/默认嬷嬷（图不落盘，载入时保留当前角色） */
  characterId: string | null
  styleId: StyleId
  resolution: number
  tone: ToneId
  /** 动作脚本：一键演出按序连打 */
  script: ActionId[]
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
  /** 风格 id：供「二创同款」还原风格（旧数据可能缺失，按 styleName 回退） */
  styleId?: StyleId
  /** 语气标签（嬷向 / 攻向），旧数据可能缺失 */
  tone?: ToneId
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
