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

export type ActionId = 'pat' | 'rua' | 'boop' | 'feed' | 'sleep' | 'praise' | 'play' | 'speak'

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

/* ---------- 入嬷登记流水线：抠图 / 自动解析 / 角色档案 ---------- */

/** 幕后抠图配置（Canvas 启发式背景去除，纯本地） */
export interface CutoutOptions {
  enabled: boolean
  /** 背景容差 0~100：越大抠得越狠 */
  tolerance: number
}

/** 档案声线（决定嬷语开麦的合成音色） */
export type VoiceStyleId = 'court' | 'fizzy' | 'gravel' | 'silky' | 'sprite'

/**
 * 角色档案：由本地启发式解析生成（哈希种子 + 色彩统计 + 文件名关键词）。
 * ⚠️ 预留接口：接入真实 AI 后端时，用服务端返回结构替换本地推断即可，字段形态不变。
 */
export interface CharacterProfile {
  /** 稳定种子：同一张图每次解析结果一致（换一卦会 +1） */
  seed: number
  /** 档案编号，如 MM-0421 */
  dossierNo: string
  /** 名号建议 */
  name: string
  /** 推断体质（宫廷系 / 职场系 / 兽形系……） */
  lineage: string
  /** 人设标签 */
  tags: string[]
  /** 反差设定一句话 */
  contrast: string
  /** 口头禅 */
  catchphrase: string
  /** 声线 */
  voice: VoiceStyleId
  voiceLabel: string
  /** 主色谱（解析出的主导色 hex） */
  palette: string[]
  /** 高冷指数 0~100（亮度/饱和推断） */
  aloof: number
  /** 活泼指数 0~100 */
  lively: number
}

/* ---------- 贴纸装扮 ---------- */

export interface StickerDef {
  id: string
  glyph: string
  label: string
}

/** 舞台上已放置的贴纸（坐标为舞台归一化 0~1） */
export interface PlacedSticker {
  key: string
  stickerId: string
  glyph: string
  x: number
  y: number
  /** 相对尺寸 0.5~1.5 */
  scale: number
  /** 旋转角度 deg */
  rot: number
}

/* ---------- 配方工作流 ---------- */

export type CardTemplateId = 'badge' | 'duel' | 'dossier'

/** 可复现的一整套工作流配置（抠图 → 风格 → 装扮 → 出卡模板） */
export interface WorkflowRecipe {
  cutout: boolean
  tolerance: number
  styleId: StyleId
  resolution: number
  stickerIds: string[]
  cardTemplate: CardTemplateId
}

export interface WorkflowTemplate {
  id: string
  name: string
  recipe: WorkflowRecipe
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

/** 帖子类型：art = 嬷嬷作品；flow = 玩法配方（可一键套用的工作流） */
export type PostKind = 'art' | 'flow'

export interface CommunityPost {
  id: string
  kind: PostKind
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
  /** 玩法配方帖附带的可套用配方 */
  recipe?: WorkflowRecipe
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
