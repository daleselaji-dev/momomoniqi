import type { ImageStats, StyleId, ToneId } from '../types'

/**
 * 气质原型库：「这是谁」解析的匹配目标。
 * 每个原型给出打分函数（输入图像统计特征）、昵称词库、气质标签、推荐语气与风格。
 * 加新原型只需追加一条 —— 解析逻辑零改动。
 */
export interface ArchetypeDef {
  id: string
  label: string
  /** 气质标签池（进档案卡 / 认证卡） */
  vibeTags: string[]
  tone: ToneId
  styleId: StyleId
  /** 昵称后缀词库：与主色词组合生成候选名 */
  namePool: string[]
  /** 一句话解析结论模板 */
  blurb: string
  /** 匹配打分：分高者当选 */
  score: (s: ImageStats) => number
}

export const ARCHETYPES: ArchetypeDef[] = [
  {
    id: 'gaoleng',
    label: '高冷系',
    vibeTags: ['高冷', '生人勿近', '破功预定'],
    tone: 'gong',
    styleId: 'ink',
    namePool: ['阁主', '座上宾', '大人'],
    blurb: '画面冷调低亮，一看就是端着的——这种最经不起摸头杀。',
    score: (s) =>
      (1 - s.luma) * 0.9 + (1 - s.saturation) * 0.8 + (s.warmth < 0.35 ? 0.6 : 0) + (1 - s.colorfulness) * 0.3,
  },
  {
    id: 'bazong',
    label: '霸总系',
    vibeTags: ['霸总', '低音炮', '壕无人性'],
    tone: 'gong',
    styleId: 'cyberpink',
    namePool: ['总裁', '董事', '老板'],
    blurb: '对比拉满、气场外溢，标准霸总打光——rua 一下股价涨停。',
    score: (s) =>
      s.contrast * 1.2 + (1 - s.luma) * 0.5 + (s.saturation > 0.25 && s.saturation < 0.6 ? 0.5 : 0) + s.edgeDensity * 0.3,
  },
  {
    id: 'ruanmeng',
    label: '软萌系',
    vibeTags: ['软萌', '奶fufu', '一戳就脸红'],
    tone: 'momo',
    styleId: 'sticker',
    namePool: ['团子', '糕糕', '崽崽'],
    blurb: '高亮暖调、绒度超标，检测到大量可爱因子——建议直接吸。',
    score: (s) => s.luma * 1.0 + s.warmth * 0.9 + s.saturation * 0.4 + (1 - s.contrast) * 0.4,
  },
  {
    id: 'nianren',
    label: '粘人系',
    vibeTags: ['粘人', '贴贴狂魔', '分离焦虑'],
    tone: 'momo',
    styleId: 'pixel',
    namePool: ['小尾巴', '年糕', '贴贴怪'],
    blurb: '暖色浓度超标、构图往里凑——这不贴贴留着过年吗。',
    score: (s) => s.warmth * 1.1 + s.saturation * 0.7 + (s.luma > 0.3 && s.luma < 0.75 ? 0.5 : 0),
  },
  {
    id: 'yuanqi',
    label: '元气系',
    vibeTags: ['元气', '撒欢', '电量无限'],
    tone: 'momo',
    styleId: 'gameboy',
    namePool: ['汽水', '闪电', '小马达'],
    blurb: '满屏高饱和大色块，能量密度爆表——快丢个球让它撒欢。',
    score: (s) => s.colorfulness * 1.3 + s.saturation * 0.8 + s.luma * 0.3,
  },
  {
    id: 'shenmi',
    label: '神秘系',
    vibeTags: ['神秘', '夜行性', '据说会发光'],
    tone: 'gong',
    styleId: 'tama',
    namePool: ['夜巡', '影子', '占星师'],
    blurb: '暗部藏细节、色相偏冷紫——夜行性生物，顺毛需持证上岗。',
    score: (s) =>
      (1 - s.luma) * 1.0 + s.edgeDensity * 0.6 + (s.domHue >= 200 && s.domHue <= 320 ? 0.7 : 0) + s.saturation * 0.2,
  },
]

/** 按主色相 + 亮度取一个「色彩前缀词」，与原型词库组合成候选名 */
export function colorWordOf(s: ImageStats): string {
  if (s.luma < 0.22) return '墨'
  if (s.luma > 0.82 && s.saturation < 0.18) return '雪'
  if (s.saturation < 0.14) return '灰'
  const h = s.domHue
  if (h < 20 || h >= 340) return '绯'
  if (h < 45) return '橘'
  if (h < 70) return '金'
  if (h < 160) return '青'
  if (h < 200) return '薄荷'
  if (h < 260) return '黛'
  if (h < 300) return '紫'
  return '桃'
}
