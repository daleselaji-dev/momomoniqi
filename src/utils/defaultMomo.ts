/**
 * 内置像素嬷嬷：20×20 手绘像素画。
 * 未上传图片时作为默认角色 & 首屏主视觉锚点，上传后被用户角色替换。
 */
const GRID = [
  '....................',
  '........hhh.........',
  '.......hHPHh........',
  '.......hHHHh........',
  '.....hhHHHHHhh......',
  '....hHHHHHHHHHh.....',
  '...hHHHHHHHHHHHh....',
  '...hHHSSSSSSSHHh....',
  '...hHSSSSSSSSSHh....',
  '...hHSEESSSEESHh....',
  '...hHSEESSSEESHh....',
  '...hHSSSssSSSSHh....',
  '...hHBSSMMSSSBHh....',
  '....hSSSSSSSSSh.....',
  '.....sSSSSSSSs......',
  '.......RRWWRR.......',
  '.....RRRRWWRRRR.....',
  '....RRRRRWWRRRRR....',
  '....RRrRRWWRRrRR....',
  '....rrrrrrrrrrrr....',
]

const COLORS: Record<string, string> = {
  h: '#4a3f4e',
  H: '#b9aec4',
  P: '#ff4d8d',
  S: '#ffd9b8',
  s: '#eab890',
  E: '#33222e',
  B: '#ff9e9e',
  M: '#b3486a',
  R: '#c4455f',
  r: '#8e2f47',
  W: '#fff3e0',
}

export const MOMO_GRID_SIZE = GRID.length

/** 按给定缩放倍数把像素嬷嬷画成画布（透明背景） */
export function drawMomoSprite(scale = 1): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = MOMO_GRID_SIZE * scale
  c.height = MOMO_GRID_SIZE * scale
  const ctx = c.getContext('2d')
  if (!ctx) return c
  for (let y = 0; y < MOMO_GRID_SIZE; y++) {
    const row = GRID[y].padEnd(MOMO_GRID_SIZE, '.')
    for (let x = 0; x < MOMO_GRID_SIZE; x++) {
      const color = COLORS[row[x]]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(x * scale, y * scale, scale, scale)
    }
  }
  return c
}

let cachedSource: HTMLCanvasElement | null = null

/** 作为像素化管线源图的高清版默认嬷嬷（320×320） */
export function getDefaultSource(): HTMLCanvasElement {
  if (!cachedSource) cachedSource = drawMomoSprite(16)
  return cachedSource
}
