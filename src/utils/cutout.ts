/**
 * 幕后抠图：纯 Canvas 启发式背景去除（零依赖、全程本地）。
 *
 * 思路：头像 / 截图 / 立绘类素材的背景通常从画面边缘开始连通——
 * 1. 缩采样到工作尺寸（≤384px），采样边缘一圈像素做背景色聚类（量化直方图取前 3 簇）
 * 2. 从四边泛洪：颜色落在任一背景簇容差内的连通像素判定为背景，置为透明
 * 3. 去噪蚀刻孤立残点 → 取主体包围盒 → 居中放进正方形画布，得到「透明底立绘」
 *
 * ⚠️ 预留接口：接入真实 AI 分割后端时，把 cutoutSubject 替换为服务端返回的
 * 透明底图即可，下游 pixelate / 出卡 / 解析全部不用改。
 */

const WORK_SIZE = 384

export interface CutoutResult {
  /** 透明底、主体居中的正方形画布（可直接喂给 pixelate） */
  canvas: HTMLCanvasElement
  /** 主体像素占比 0~1 */
  coverage: number
  /** 是否真的抠掉了背景（失败 / 无背景时为 false，返回原图中心裁切） */
  removed: boolean
}

function centerSquare(source: HTMLImageElement | HTMLCanvasElement, size: number): HTMLCanvasElement {
  const sw = 'naturalWidth' in source ? source.naturalWidth : source.width
  const sh = 'naturalHeight' in source ? source.naturalHeight : source.height
  const crop = Math.min(sw, sh)
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  if (ctx) ctx.drawImage(source, (sw - crop) / 2, (sh - crop) / 2, crop, crop, 0, 0, size, size)
  return c
}

interface Cluster {
  r: number
  g: number
  b: number
}

/** 边缘一圈像素 → 量化直方图 → 前 3 大簇作为背景色候选 */
function estimateBackground(data: Uint8ClampedArray, w: number, h: number): Cluster[] {
  const bins = new Map<number, { n: number; r: number; g: number; b: number }>()
  const push = (i: number) => {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const bin = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    bin.n++
    bin.r += r
    bin.g += g
    bin.b += b
    bins.set(key, bin)
  }
  for (let x = 0; x < w; x++) {
    push((0 * w + x) * 4)
    push((1 * w + x) * 4)
    push(((h - 1) * w + x) * 4)
    push(((h - 2) * w + x) * 4)
  }
  for (let y = 0; y < h; y++) {
    push((y * w + 0) * 4)
    push((y * w + 1) * 4)
    push((y * w + w - 1) * 4)
    push((y * w + w - 2) * 4)
  }
  return [...bins.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)
    .map((bin) => ({ r: bin.r / bin.n, g: bin.g / bin.n, b: bin.b / bin.n }))
}

/**
 * 主体抠图入口。
 * @param tolerance 0~100，越大判定为背景的颜色范围越宽
 */
export function cutoutSubject(
  source: HTMLImageElement | HTMLCanvasElement,
  tolerance: number,
): CutoutResult {
  const work = centerSquare(source, WORK_SIZE)
  const ctx = work.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { canvas: work, coverage: 1, removed: false }

  const w = work.width
  const h = work.height
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  const clusters = estimateBackground(d, w, h)
  if (clusters.length === 0) return { canvas: work, coverage: 1, removed: false }

  /* 容差滑杆映射到 RGB 欧氏距离阈值 */
  const threshold = 24 + tolerance * 1.35
  const thresholdSq = threshold * threshold

  const isBgColor = (i: number): boolean => {
    /* 本就透明的像素（png 透明底）直接算背景 */
    if (d[i + 3] < 10) return true
    for (const c of clusters) {
      const dr = d[i] - c.r
      const dg = d[i + 1] - c.g
      const db = d[i + 2] - c.b
      if (dr * dr + dg * dg + db * db <= thresholdSq) return true
    }
    return false
  }

  /* 从四边泛洪：只有与边缘连通的背景色区域会被移除，主体内部同色安全 */
  const visited = new Uint8Array(w * h)
  const queue: number[] = []
  const seed = (x: number, y: number) => {
    const p = y * w + x
    if (!visited[p] && isBgColor(p * 4)) {
      visited[p] = 1
      queue.push(p)
    }
  }
  for (let x = 0; x < w; x++) {
    seed(x, 0)
    seed(x, h - 1)
  }
  for (let y = 0; y < h; y++) {
    seed(0, y)
    seed(w - 1, y)
  }
  while (queue.length > 0) {
    const p = queue.pop() as number
    const x = p % w
    const y = (p / w) | 0
    if (x > 0) seed(x - 1, y)
    if (x < w - 1) seed(x + 1, y)
    if (y > 0) seed(x, y - 1)
    if (y < h - 1) seed(x, y + 1)
  }

  let bgCount = 0
  for (let p = 0; p < w * h; p++) {
    if (visited[p]) {
      d[p * 4 + 3] = 0
      bgCount++
    }
  }

  /* 蚀刻孤立残点：周围 8 邻居有 ≥6 个透明的残余像素一并清掉 */
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x
      if (visited[p]) continue
      let holes = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          if (d[((y + dy) * w + x + dx) * 4 + 3] === 0) holes++
        }
      }
      if (holes >= 6) {
        d[p * 4 + 3] = 0
        bgCount++
      }
    }
  }

  const coverage = 1 - bgCount / (w * h)
  /* 抠过头（主体几乎没了）或根本没抠到：退回原图中心裁切 */
  if (coverage < 0.04 || coverage > 0.985) {
    return { canvas: centerSquare(source, WORK_SIZE), coverage: 1, removed: false }
  }

  ctx.putImageData(img, 0, 0)

  /* 主体包围盒 → 加呼吸边距 → 居中放进正方形，得到立绘构图 */
  let minX = w
  let minY = h
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  const bw = maxX - minX + 1
  const bh = maxY - minY + 1
  const side = Math.ceil(Math.max(bw, bh) * 1.12)
  const out = document.createElement('canvas')
  out.width = side
  out.height = side
  const outCtx = out.getContext('2d')
  if (outCtx) {
    outCtx.drawImage(work, minX, minY, bw, bh, (side - bw) / 2, (side - bh) / 2, bw, bh)
  }
  return { canvas: out, coverage, removed: true }
}
