interface ShareCardInput {
  sprite: HTMLCanvasElement
  power: number
  level: string
  quip: string
  styleName: string
}

const W = 900
const H = 1200

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth) {
      lines.push(line)
      line = ch
    } else {
      line += ch
    }
  }
  if (line) lines.push(line)
  return lines
}

/** 生成 900×1200 分享卡片画布（深色 CRT 风：扫描线 + 像素角色 + 嬷力值 + 文案） */
export function renderShareCard(input: ShareCardInput): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  if (!ctx) return c

  // 底色与顶部霓虹光晕
  ctx.fillStyle = '#0e0c16'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W / 2, 180, 40, W / 2, 180, 620)
  glow.addColorStop(0, 'rgba(255,77,141,0.28)')
  glow.addColorStop(1, 'rgba(255,77,141,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // 扫描线纹理
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2)

  // 边框
  ctx.strokeStyle = '#ff4d8d'
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, W - 48, H - 48)
  ctx.strokeStyle = 'rgba(184,240,74,0.5)'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, W - 80, H - 80)

  const zh = '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif'

  // 品牌区
  ctx.textAlign = 'center'
  ctx.fillStyle = '#b8f04a'
  ctx.font = '600 26px ui-monospace, monospace'
  ctx.fillText('▚ MOMOMONIQI · 嬷嬷认证卡 ▞', W / 2, 108)
  ctx.fillStyle = '#ff4d8d'
  ctx.font = `900 84px ${zh}`
  ctx.fillText('嬷嬷模拟器', W / 2 + 5, 205)
  ctx.fillStyle = '#f5eee0'
  ctx.fillText('嬷嬷模拟器', W / 2, 200)

  // 像素角色（硬边缘放大）
  const size = 480
  const x = (W - size) / 2
  const y = 270
  ctx.fillStyle = '#161226'
  ctx.fillRect(x - 20, y - 20, size + 40, size + 40)
  ctx.strokeStyle = '#2c2440'
  ctx.lineWidth = 4
  ctx.strokeRect(x - 20, y - 20, size + 40, size + 40)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(input.sprite, x, y, size, size)

  // 风格标签
  ctx.fillStyle = '#b8f04a'
  ctx.font = `700 30px ${zh}`
  ctx.fillText(`风格 · ${input.styleName}`, W / 2, y + size + 66)

  // 嬷力值
  ctx.fillStyle = '#f5eee0'
  ctx.font = `900 58px ${zh}`
  ctx.fillText(`嬷力值 ${input.power}`, W / 2, y + size + 140)
  ctx.fillStyle = '#ff9edb'
  ctx.font = `700 34px ${zh}`
  ctx.fillText(`段位 「${input.level}」`, W / 2, y + size + 192)

  // 无厘头文案
  ctx.fillStyle = '#c9c2d8'
  ctx.font = `500 30px ${zh}`
  const lines = wrapText(ctx, `“${input.quip}”`, W - 200)
  lines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, W / 2, y + size + 258 + i * 44)
  })

  // 页脚
  ctx.fillStyle = 'rgba(245,238,224,0.55)'
  ctx.font = '500 24px ui-monospace, monospace'
  ctx.fillText('momomoniqi · 把严肃角色宠成全网嬷嬷', W / 2, H - 70)

  return c
}

/** 触发浏览器下载 PNG */
export function downloadCard(canvas: HTMLCanvasElement, filename = 'momo-card.png'): void {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }, 'image/png')
}

export function buildShareText(power: number, level: string, quip: string): string {
  return `我在【嬷嬷模拟器】里把角色宠出了 ${power} 点嬷力值，当前段位「${level}」。${quip} #嬷嬷模拟器 #momomoniqi`
}
