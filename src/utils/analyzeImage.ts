import { ARCHETYPES, colorWordOf } from '../data/archetypes'
import type { CharacterProfile, ImageStats } from '../types'

/**
 * 「这是谁」主体解析：纯浏览器本地启发式，零联网零模型。
 * 1. 中心裁切 + 缩采样到 32×32，统计亮度 / 对比 / 饱和度 / 主色相 / 彩度 / 边缘密度 / 暖色占比
 * 2. 与内置气质原型库（archetypes.ts）逐一打分，取最高分原型
 * 3. 组合「色彩前缀词 × 原型词库」生成昵称候选，产出可确认 / 可改名的角色档案
 */

const SAMPLE = 32

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
  else if (max === gn) h = ((bn - rn) / d + 2) * 60
  else h = ((rn - gn) / d + 4) * 60
  return [h, s, l]
}

/** 统计图像特征（全部归一化到 0~1，色相为 0~360） */
export function computeStats(source: HTMLImageElement | HTMLCanvasElement): ImageStats {
  const sw = 'naturalWidth' in source ? source.naturalWidth : source.width
  const sh = 'naturalHeight' in source ? source.naturalHeight : source.height
  const crop = Math.min(sw, sh)
  const c = document.createElement('canvas')
  c.width = SAMPLE
  c.height = SAMPLE
  const ctx = c.getContext('2d', { willReadFrequently: true })
  const zero: ImageStats = { luma: 0.5, contrast: 0.3, saturation: 0.3, domHue: 0, colorfulness: 0.3, edgeDensity: 0.3, warmth: 0.5 }
  if (!ctx) return zero
  ctx.drawImage(source, (sw - crop) / 2, (sh - crop) / 2, crop, crop, 0, 0, SAMPLE, SAMPLE)
  const data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data

  const n = SAMPLE * SAMPLE
  const lumas = new Float32Array(n)
  let lumaSum = 0
  let satSum = 0
  let warmCount = 0
  /** 色相直方图（12 桶，按饱和度加权，滤掉近灰像素） */
  const hueBins = new Float32Array(12)
  const hueSeen = new Set<number>()

  for (let i = 0; i < n; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    lumas[i] = luma
    lumaSum += luma
    const [h, s] = rgbToHsl(r, g, b)
    satSum += s
    if (s > 0.12) {
      const bin = Math.min(11, Math.floor(h / 30))
      hueBins[bin] += s
      hueSeen.add(bin)
      if (h < 70 || h >= 320) warmCount++
    }
  }

  const luma = lumaSum / n
  let varSum = 0
  for (let i = 0; i < n; i++) varSum += (lumas[i] - luma) ** 2
  const contrast = Math.min(1, Math.sqrt(varSum / n) * 3.2)

  let edgeSum = 0
  for (let y = 0; y < SAMPLE - 1; y++) {
    for (let x = 0; x < SAMPLE - 1; x++) {
      const i = y * SAMPLE + x
      edgeSum += Math.abs(lumas[i] - lumas[i + 1]) + Math.abs(lumas[i] - lumas[i + SAMPLE])
    }
  }
  const edgeDensity = Math.min(1, edgeSum / ((SAMPLE - 1) * (SAMPLE - 1) * 2) * 6)

  let bestBin = 0
  for (let b = 1; b < 12; b++) if (hueBins[b] > hueBins[bestBin]) bestBin = b
  const domHue = bestBin * 30 + 15

  return {
    luma,
    contrast,
    saturation: satSum / n,
    domHue,
    colorfulness: Math.min(1, hueSeen.size / 8),
    edgeDensity,
    warmth: warmCount / n,
  }
}

/** 主体解析入口：返回角色档案建议（含昵称候选 / 气质标签 / 推荐语气与风格） */
export function analyzeImage(source: HTMLImageElement | HTMLCanvasElement): CharacterProfile {
  const stats = computeStats(source)
  let best = ARCHETYPES[0]
  let bestScore = -Infinity
  for (const a of ARCHETYPES) {
    const s = a.score(stats)
    if (s > bestScore) {
      bestScore = s
      best = a
    }
  }
  const prefix = colorWordOf(stats)
  const nameCandidates = best.namePool.map((suffix) => `${prefix}${suffix}`)
  return {
    archetypeId: best.id,
    archetypeLabel: best.label,
    name: nameCandidates[0],
    nameCandidates,
    vibeTags: best.vibeTags,
    tone: best.tone,
    styleId: best.styleId,
    blurb: best.blurb,
    stats,
  }
}
