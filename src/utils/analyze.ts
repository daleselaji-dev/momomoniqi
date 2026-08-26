import {
  COMMON_TAGS,
  LINEAGES,
  NAME_CORES,
  NAME_SUFFIXES,
  VOICE_STYLES,
  type LineageDef,
} from '../data/persona'
import type { CharacterProfile, VoiceStyleId } from '../types'

/**
 * 自动解析：本地启发式「推断这是谁」并生成角色档案。
 *
 * 依据三路信号：
 * 1. 图像哈希 → 稳定种子（同图同档案，换一卦 = 种子偏移，玄学仪式感）
 * 2. 主体色彩统计 → 主色谱 / 高冷指数 / 活泼指数 / 声线倾向
 * 3. 文件名关键词 → 体质谱系（宫廷 / 职场 / 兽形 / 师门，未命中走玄学系）
 *
 * ⚠️ 预留接口：接入真实 AI 后端时，把 analyzeCharacter 的返回替换为
 * 服务端识别结果即可（CharacterProfile 字段形态已按此设计）。
 */

const SAMPLE = 24

/** mulberry32：种子化伪随机（档案的确定性来源） */
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)]
}

function pickN<T>(rng: () => number, list: T[], n: number): T[] {
  const pool = [...list]
  const out: T[] = []
  while (out.length < n && pool.length > 0) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  }
  return out
}

function fnv1a(str: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

interface ImageStats {
  hash: number
  luma: number
  sat: number
  warm: number
  palette: string[]
}

/** 缩采样后统计主体像素：哈希 / 亮度 / 饱和 / 暖色占比 / 主色谱 */
function statsOf(subject: HTMLCanvasElement | HTMLImageElement): ImageStats {
  const c = document.createElement('canvas')
  c.width = SAMPLE
  c.height = SAMPLE
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { hash: 1, luma: 0.5, sat: 0.4, warm: 0.5, palette: ['#c4455f'] }
  ctx.drawImage(subject, 0, 0, SAMPLE, SAMPLE)
  const d = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data

  let hash = 0x811c9dc5
  let lumaSum = 0
  let satSum = 0
  let warmCount = 0
  let n = 0
  const bins = new Map<number, { n: number; r: number; g: number; b: number }>()

  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]
    hash ^= (d[i] >> 3) ^ ((d[i + 1] >> 3) << 5) ^ ((d[i + 2] >> 3) << 10) ^ (i & 255)
    hash = Math.imul(hash, 0x01000193) >>> 0
    if (a < 128) continue
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    lumaSum += (0.299 * r + 0.587 * g + 0.114 * b) / 255
    satSum += max === 0 ? 0 : (max - min) / max
    if (r > b + 16) warmCount++
    n++
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5)
    const bin = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    bin.n++
    bin.r += r
    bin.g += g
    bin.b += b
    bins.set(key, bin)
  }
  if (n === 0) n = 1

  const palette = [...bins.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
    .map((bin) => {
      const toHex = (v: number) => Math.round(v / bin.n).toString(16).padStart(2, '0')
      return `#${toHex(bin.r)}${toHex(bin.g)}${toHex(bin.b)}`
    })

  return {
    hash: hash >>> 0,
    luma: lumaSum / n,
    sat: satSum / n,
    warm: warmCount / n,
    palette: palette.length > 0 ? palette : ['#c4455f'],
  }
}

/** 文件名关键词 → 体质谱系；未命中则按种子落进玄学系 / 随机体质 */
function inferLineage(fileName: string, rng: () => number): LineageDef {
  const lower = fileName.toLowerCase()
  for (const lineage of LINEAGES) {
    if (lineage.keywords.some((k) => k && lower.includes(k))) return lineage
  }
  /* 未命中：六成走玄学系（万物皆可嬷），四成随机开盲盒 */
  if (rng() < 0.6) return LINEAGES[LINEAGES.length - 1]
  return pick(rng, LINEAGES)
}

function inferVoice(aloof: number, lively: number, rng: () => number): VoiceStyleId {
  const pool: VoiceStyleId[] =
    aloof >= 62 ? ['court', 'gravel', 'silky'] : lively >= 62 ? ['fizzy', 'sprite', 'silky'] : ['silky', 'court', 'fizzy', 'gravel', 'sprite']
  return pick(rng, pool)
}

const clamp100 = (v: number) => Math.max(0, Math.min(100, Math.round(v)))

/**
 * 解析主体画布 + 文件名 → 角色档案。
 * @param rerollOffset 「换一卦」次数：种子偏移，重推整套人设
 */
export function analyzeCharacter(
  subject: HTMLCanvasElement | HTMLImageElement,
  fileName: string,
  rerollOffset = 0,
): CharacterProfile {
  const stats = statsOf(subject)
  const seed = (stats.hash ^ fnv1a(fileName)) + rerollOffset * 0x9e3779b9
  const rng = makeRng(seed)

  const lineage = inferLineage(fileName, rng)

  const aloof = clamp100(58 * (1 - stats.sat) + 34 * (1 - stats.luma) + (stats.warm < 0.35 ? 14 : 0) + (rng() - 0.5) * 12)
  const lively = clamp100(52 * stats.sat + 26 * stats.luma + (stats.warm >= 0.5 ? 16 : 0) + (rng() - 0.5) * 12)

  const voice = inferVoice(aloof, lively, rng)
  const voiceLabel = VOICE_STYLES.find((v) => v.id === voice)?.label ?? '威严低音炮'

  const name = `${pick(rng, lineage.namePrefixes)}${pick(rng, NAME_CORES)}·${pick(rng, NAME_SUFFIXES)}`
  const tags = [...pickN(rng, lineage.tags, 2), pick(rng, COMMON_TAGS)]

  return {
    seed: seed >>> 0,
    dossierNo: `MM-${String((seed >>> 0) % 10000).padStart(4, '0')}`,
    name,
    lineage: lineage.label,
    tags,
    contrast: pick(rng, lineage.contrasts),
    catchphrase: pick(rng, lineage.catchphrases),
    voice,
    voiceLabel,
    palette: stats.palette,
    aloof,
    lively,
  }
}
