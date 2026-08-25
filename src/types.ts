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

export type ActionId =
  | 'pat'
  | 'rua'
  | 'boop'
  | 'feed'
  | 'sleep'
  | 'praise'
  | 'play'
  /* 摸摸 meme 系（摸头杀 / rua脸 / 吸猫 / 贴贴 / 爪巴拍拍 / 顺毛） */
  | 'petpet'
  | 'ruaface'
  | 'suckcat'
  | 'tietie'
  | 'pawpat'
  | 'smoothfur'

/** 舞台叠加特效：摸头光晕 / 猫爪印 / 满屏心心 */
export type StageFx = 'halo' | 'paws' | 'hearts'

export interface ActionDef {
  id: ActionId
  label: string
  emoji: string
  /** 互动瞬间飘散的粒子表情 */
  particles: string[]
  quips: string[]
  /** 触发的舞台叠加特效（可多个） */
  fx?: StageFx[]
  /** 角色表情气泡：按亲密度分级 [冷淡, 破防中, 彻底沦陷] */
  faces?: [string, string, string]
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

/* ---------- 角色解析流水线（浏览器本地，零联网） ---------- */

/** 图像统计特征：解析全部来自缩采样后的像素启发式，不出浏览器 */
export interface ImageStats {
  /** 平均亮度 0~1 */
  luma: number
  /** 亮度对比（标准差）0~1 */
  contrast: number
  /** 平均饱和度 0~1 */
  saturation: number
  /** 主色相 0~360 */
  domHue: number
  /** 彩度丰富度 0~1 */
  colorfulness: number
  /** 边缘密度 0~1（构图繁简） */
  edgeDensity: number
  /** 暖色占比 0~1 */
  warmth: number
}

/** 「这是谁」解析产出的角色档案建议 */
export interface CharacterProfile {
  archetypeId: string
  /** 气质原型名（高冷系 / 软萌系 / 霸总系…） */
  archetypeLabel: string
  /** 当前确认的昵称（用户可改） */
  name: string
  /** 昵称候选（一键换名） */
  nameCandidates: string[]
  /** 气质标签（进认证卡 / 社区） */
  vibeTags: string[]
  /** 推荐语气 */
  tone: ToneId
  /** 推荐风格 */
  styleId: StyleId
  /** 一句话解析结论 */
  blurb: string
  stats: ImageStats
}

/** 抠背景结果：keyed = 边缘泛洪抠图成功；fallback = 中心柔边降级 */
export interface CutoutResult {
  canvas: HTMLCanvasElement
  method: 'keyed' | 'fallback'
  /** 被判定为背景移除的像素占比 0~1 */
  removedRatio: number
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
  /** 解析/选定的角色名（旧数据可能缺失） */
  charName?: string
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
