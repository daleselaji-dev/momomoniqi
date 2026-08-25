import type { CutoutResult } from '../types'

/**
 * 抠背景 → 透明底立绘：零第三方依赖的浏览器本地实现。
 * 主路径「边缘泛洪键控」：
 *   1. 中心裁切 + 缩采样到 ≤384² 工作画布
 *   2. 对边框像素做贪心聚类，估出背景主色（最多 4 簇）
 *   3. 从四边向内 BFS 泛洪：与任一背景簇色距小于阈值的像素置透明
 *   4. 保留区边缘做 2 级羽化，避免硬锯齿
 * 若移除占比失衡（背景太复杂 / 主体被吃掉），优雅降级为「中心柔边」：
 * 椭圆径向 alpha 渐隐，保证任何图都能得到可用的"立绘感"结果。
 * 产物直接喂给现有 pixelate()（其对 alpha<128 像素保留透明）。
 */

const WORK_MAX = 384
/** RGB 欧氏色距阈值：泛洪吸收背景的容差 */
const KEY_TOLERANCE = 46
/** 边框聚类合并距离 */
const CLUSTER_DIST = 40
/** 移除占比在此区间外视为抠图失败，走降级 */
const MIN_REMOVED = 0.05
const MAX_REMOVED = 0.9

interface Cluster {
  r: number
  g: number
  b: number
  count: number
}

function dist2(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2
}

/** 贪心聚类边框像素颜色，返回占比足够大的背景簇 */
function clusterBorder(data: Uint8ClampedArray, size: number): Cluster[] {
  const clusters: Cluster[] = []
  const push = (i: number) => {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    for (const c of clusters) {
      if (dist2(r, g, b, c.r / c.count, c.g / c.count, c.b / c.count) < CLUSTER_DIST * CLUSTER_DIST) {
        c.r += r
        c.g += g
        c.b += b
        c.count++
        return
      }
    }
    if (clusters.length < 4) clusters.push({ r, g, b, count: 1 })
  }
  for (let t = 0; t < 2; t++) {
    for (let x = 0; x < size; x++) {
      push((t * size + x) * 4)
      push(((size - 1 - t) * size + x) * 4)
    }
    for (let y = 0; y < size; y++) {
      push((y * size + t) * 4)
      push((y * size + size - 1 - t) * 4)
    }
  }
  const total = clusters.reduce((s, c) => s + c.count, 0)
  return clusters
    .filter((c) => c.count >= total * 0.06)
    .map((c) => ({ r: c.r / c.count, g: c.g / c.count, b: c.b / c.count, count: c.count }))
}

/** 降级路径：椭圆径向柔边（中心保留，边缘渐隐成透明底） */
function applySoftVignette(data: Uint8ClampedArray, size: number): void {
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const rx = size * 0.5
  const ry = size * 0.52
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
      if (d <= 0.74) continue
      const i = (y * size + x) * 4 + 3
      const fade = Math.max(0, Math.min(1, (1 - d) / 0.26))
      data[i] = Math.round(data[i] * fade)
    }
  }
}

export function removeBackground(source: HTMLImageElement | HTMLCanvasElement): CutoutResult {
  const sw = 'naturalWidth' in source ? source.naturalWidth : source.width
  const sh = 'naturalHeight' in source ? source.naturalHeight : source.height
  const crop = Math.min(sw, sh)
  const size = Math.min(WORK_MAX, crop)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { canvas, method: 'fallback', removedRatio: 0 }
  ctx.drawImage(source, (sw - crop) / 2, (sh - crop) / 2, crop, crop, 0, 0, size, size)

  const img = ctx.getImageData(0, 0, size, size)
  const data = img.data
  const clusters = clusterBorder(data, size)

  const fallback = (): CutoutResult => {
    applySoftVignette(data, size)
    ctx.putImageData(img, 0, 0)
    return { canvas, method: 'fallback', removedRatio: 0 }
  }
  if (clusters.length === 0) return fallback()

  const tol2 = KEY_TOLERANCE * KEY_TOLERANCE
  const isBg = (i: number): boolean => {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    for (const c of clusters) {
      if (dist2(r, g, b, c.r, c.g, c.b) < tol2) return true
    }
    return false
  }

  /* 从四边 BFS 泛洪 */
  const removed = new Uint8Array(size * size)
  const queue: number[] = []
  const seed = (i: number) => {
    if (!removed[i] && isBg(i)) {
      removed[i] = 1
      queue.push(i)
    }
  }
  for (let x = 0; x < size; x++) {
    seed(x)
    seed((size - 1) * size + x)
  }
  for (let y = 0; y < size; y++) {
    seed(y * size)
    seed(y * size + size - 1)
  }
  let head = 0
  let removedCount = queue.length
  while (head < queue.length) {
    const i = queue[head++]
    const x = i % size
    const y = (i / size) | 0
    if (x > 0) {
      const j = i - 1
      if (!removed[j] && isBg(j)) {
        removed[j] = 1
        removedCount++
        queue.push(j)
      }
    }
    if (x < size - 1) {
      const j = i + 1
      if (!removed[j] && isBg(j)) {
        removed[j] = 1
        removedCount++
        queue.push(j)
      }
    }
    if (y > 0) {
      const j = i - size
      if (!removed[j] && isBg(j)) {
        removed[j] = 1
        removedCount++
        queue.push(j)
      }
    }
    if (y < size - 1) {
      const j = i + size
      if (!removed[j] && isBg(j)) {
        removed[j] = 1
        removedCount++
        queue.push(j)
      }
    }
  }

  const removedRatio = removedCount / (size * size)
  if (removedRatio < MIN_REMOVED || removedRatio > MAX_REMOVED) return fallback()

  /* 置透明 + 保留区边缘 2 级羽化 */
  for (let i = 0; i < size * size; i++) {
    if (removed[i]) data[i * 4 + 3] = 0
  }
  const edgeNear = (i: number, ring: number): boolean => {
    const x = i % size
    const y = (i / size) | 0
    for (let dy = -ring; dy <= ring; dy++) {
      for (let dx = -ring; dx <= ring; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue
        if (removed[ny * size + nx]) return true
      }
    }
    return false
  }
  for (let i = 0; i < size * size; i++) {
    if (removed[i]) continue
    if (edgeNear(i, 1)) data[i * 4 + 3] = Math.round(data[i * 4 + 3] * 0.45)
    else if (edgeNear(i, 2)) data[i * 4 + 3] = Math.round(data[i * 4 + 3] * 0.78)
  }

  ctx.putImageData(img, 0, 0)
  return { canvas, method: 'keyed', removedRatio }
}
