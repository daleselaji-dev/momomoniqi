import type { StylePreset } from '../types'

/** 2x2 Bayer 抖动矩阵，取值 -0.5 ~ 0.375（归一化偏移） */
const BAYER = [
  [-0.5, 0.25],
  [0.375, -0.125],
]

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * 核心像素化管线：
 * 1. 取源图中心正方形区域，缩采样到 resolution × resolution 的小画布（马赛克格）
 * 2. 若预设带调色板，则按「亮度 → 色阶」映射并叠加 Bayer 抖动，得到风格化色块
 * 返回小尺寸画布，由展示层以 image-rendering: pixelated 放大绘制
 */
export function pixelate(
  source: HTMLImageElement | HTMLCanvasElement,
  resolution: number,
  preset: StylePreset,
): HTMLCanvasElement {
  const sw = 'naturalWidth' in source ? source.naturalWidth : source.width
  const sh = 'naturalHeight' in source ? source.naturalHeight : source.height
  const crop = Math.min(sw, sh)
  const sx = (sw - crop) / 2
  const sy = (sh - crop) / 2

  const out = document.createElement('canvas')
  out.width = resolution
  out.height = resolution
  const ctx = out.getContext('2d', { willReadFrequently: true })
  if (!ctx) return out
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(source, sx, sy, crop, crop, 0, 0, resolution, resolution)

  const ramp = preset.ramp
  if (!ramp) return out

  const rgbRamp = ramp.map(hexToRgb)
  const steps = rgbRamp.length
  const img = ctx.getImageData(0, 0, resolution, resolution)
  const d = img.data
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const i = (y * resolution + x) * 4
      if (d[i + 3] < 128) {
        d[i + 3] = 0
        continue
      }
      const luma = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
      const jitter = BAYER[y % 2][x % 2] * preset.dither * (1 / steps)
      const idx = Math.max(0, Math.min(steps - 1, Math.floor((luma + jitter) * steps)))
      const [r, g, b] = rgbRamp[idx]
      d[i] = r
      d[i + 1] = g
      d[i + 2] = b
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return out
}

/** 把小像素画布放大绘制到目标画布（保持硬边缘） */
export function blitPixelArt(sprite: HTMLCanvasElement, target: HTMLCanvasElement): void {
  const ctx = target.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, target.width, target.height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(sprite, 0, 0, target.width, target.height)
}

/** 生成用于 localStorage 的小尺寸缩略图 dataURL */
export function toThumbnail(source: HTMLImageElement | HTMLCanvasElement, size = 96): string {
  const sw = 'naturalWidth' in source ? source.naturalWidth : source.width
  const sh = 'naturalHeight' in source ? source.naturalHeight : source.height
  const crop = Math.min(sw, sh)
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  if (ctx) {
    ctx.drawImage(source, (sw - crop) / 2, (sh - crop) / 2, crop, crop, 0, 0, size, size)
  }
  return c.toDataURL('image/jpeg', 0.82)
}
