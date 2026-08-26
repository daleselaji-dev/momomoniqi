import type { CardTemplateId, CareStats, CharacterProfile, PlacedSticker } from '../types'

/**
 * 出卡工作室：三套 900×1200 竖版卡模板（Canvas 绘制，全本地）。
 * - badge   嬷嬷认证卡：CRT 深色晒分卡（一期经典款）
 * - duel    反差对比卡：开嬷前威严存档 vs 开嬷后被宠化，反差即笑点
 * - dossier 嬷嬷档案卡：自动解析产出的角色户口页，OC 同人味
 * 三张卡都会把舞台贴纸装扮一并叠印。
 */

export interface CardInput {
  sprite: HTMLCanvasElement
  /** 原始素材（对比卡「开嬷前」用） */
  source: HTMLImageElement | HTMLCanvasElement
  profile: CharacterProfile
  care: CareStats
  power: number
  level: string
  quip: string
  styleName: string
  stickers: PlacedSticker[]
}

export interface CardTemplateDef {
  id: CardTemplateId
  name: string
  hint: string
}

export const CARD_TEMPLATES: CardTemplateDef[] = [
  { id: 'badge', name: '嬷嬷认证卡', hint: '经典晒分款：嬷力值 + 段位 + 语录' },
  { id: 'duel', name: '反差对比卡', hint: '开嬷前 vs 开嬷后，反差越大越好发' },
  { id: 'dossier', name: '嬷嬷档案卡', hint: '自动解析的户口页：名号 / 标签 / 指数' },
]

const W = 900
const H = 1200
const ZH = '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif'
const MONO = 'ui-monospace, monospace'

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

function baseCanvas(): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  return { c, ctx: c.getContext('2d') }
}

function scanlines(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2)
}

/**
 * 把舞台贴纸叠印到卡上的角色框内。
 * 舞台坐标（0~1，角色占中央 74%）→ 角色框（boxX/boxY/boxSize）。
 */
function drawStickers(
  ctx: CanvasRenderingContext2D,
  stickers: PlacedSticker[],
  boxX: number,
  boxY: number,
  boxSize: number,
): void {
  for (const s of stickers) {
    const px = boxX + ((s.x - 0.13) / 0.74) * boxSize
    const py = boxY + ((s.y - 0.13) / 0.74) * boxSize
    const cx = Math.max(boxX - boxSize * 0.06, Math.min(boxX + boxSize * 1.06, px))
    const cy = Math.max(boxY - boxSize * 0.06, Math.min(boxY + boxSize * 1.06, py))
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((s.rot * Math.PI) / 180)
    ctx.font = `${Math.round(boxSize * 0.14 * s.scale)}px ${ZH}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(s.glyph, 0, 0)
    ctx.restore()
  }
}

/** 取源图中心正方形并压暗去饱和（对比卡「开嬷前」质感） */
function drawSeriousSource(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLCanvasElement,
  x: number,
  y: number,
  size: number,
): void {
  const sw = 'naturalWidth' in source ? source.naturalWidth : source.width
  const sh = 'naturalHeight' in source ? source.naturalHeight : source.height
  const crop = Math.min(sw, sh)
  const tmp = document.createElement('canvas')
  tmp.width = size
  tmp.height = size
  const tctx = tmp.getContext('2d', { willReadFrequently: true })
  if (!tctx) return
  tctx.drawImage(source, (sw - crop) / 2, (sh - crop) / 2, crop, crop, 0, 0, size, size)
  const img = tctx.getImageData(0, 0, size, size)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    /* 85% 去饱和 + 轻微压暗，营造「威严存档」的旧照感 */
    d[i] = d[i] * 0.15 + luma * 0.85 * 0.92
    d[i + 1] = d[i + 1] * 0.15 + luma * 0.85 * 0.92
    d[i + 2] = d[i + 2] * 0.15 + luma * 0.85 * 0.96
  }
  tctx.putImageData(img, 0, 0)
  ctx.drawImage(tmp, x, y)
}

/* ================= 模板 1：嬷嬷认证卡（经典款 + 贴纸叠印） ================= */

export function renderBadgeCard(input: CardInput): HTMLCanvasElement {
  const { c, ctx } = baseCanvas()
  if (!ctx) return c

  ctx.fillStyle = '#0e0c16'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W / 2, 180, 40, W / 2, 180, 620)
  glow.addColorStop(0, 'rgba(255,77,141,0.28)')
  glow.addColorStop(1, 'rgba(255,77,141,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  scanlines(ctx)

  ctx.strokeStyle = '#ff4d8d'
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, W - 48, H - 48)
  ctx.strokeStyle = 'rgba(184,240,74,0.5)'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, W - 80, H - 80)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#b8f04a'
  ctx.font = `600 26px ${MONO}`
  ctx.fillText('▚ MOMOMONIQI · 嬷嬷认证卡 ▞', W / 2, 108)
  ctx.fillStyle = '#ff4d8d'
  ctx.font = `900 84px ${ZH}`
  ctx.fillText('嬷嬷模拟器', W / 2 + 5, 205)
  ctx.fillStyle = '#f5eee0'
  ctx.fillText('嬷嬷模拟器', W / 2, 200)

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
  drawStickers(ctx, input.stickers, x, y, size)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#b8f04a'
  ctx.font = `700 30px ${ZH}`
  ctx.fillText(`风格 · ${input.styleName}`, W / 2, y + size + 66)

  ctx.fillStyle = '#f5eee0'
  ctx.font = `900 58px ${ZH}`
  ctx.fillText(`嬷力值 ${input.power}`, W / 2, y + size + 140)
  ctx.fillStyle = '#ff9edb'
  ctx.font = `700 34px ${ZH}`
  ctx.fillText(`段位 「${input.level}」`, W / 2, y + size + 192)

  ctx.fillStyle = '#c9c2d8'
  ctx.font = `500 30px ${ZH}`
  const lines = wrapText(ctx, `“${input.quip}”`, W - 200)
  lines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, W / 2, y + size + 258 + i * 44)
  })

  ctx.fillStyle = 'rgba(245,238,224,0.55)'
  ctx.font = `500 24px ${MONO}`
  ctx.fillText('momomoniqi · 把严肃角色宠成全网嬷嬷', W / 2, H - 70)

  return c
}

/* ================= 模板 2：反差对比卡（开嬷前 vs 开嬷后） ================= */

export function renderDuelCard(input: CardInput): HTMLCanvasElement {
  const { c, ctx } = baseCanvas()
  if (!ctx) return c

  ctx.fillStyle = '#0e0c16'
  ctx.fillRect(0, 0, W, H)
  scanlines(ctx)
  ctx.strokeStyle = '#2c2440'
  ctx.lineWidth = 4
  ctx.strokeRect(22, 22, W - 44, H - 44)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#b8f04a'
  ctx.font = `600 26px ${MONO}`
  ctx.fillText('▚ MOMOMONIQI · 反差对比卡 ▞', W / 2, 82)

  const size = 340
  const x = (W - size) / 2

  /* —— 开嬷前 —— */
  ctx.fillStyle = '#9b93ad'
  ctx.font = `800 34px ${ZH}`
  ctx.fillText('开嬷前 · 威严存档', W / 2, 144)
  const yA = 170
  ctx.fillStyle = '#12101c'
  ctx.fillRect(x - 16, yA - 16, size + 32, size + 32)
  ctx.strokeStyle = '#5a5470'
  ctx.lineWidth = 4
  ctx.strokeRect(x - 16, yA - 16, size + 32, size + 32)
  drawSeriousSource(ctx, input.source, x, yA, size)
  ctx.fillStyle = 'rgba(155,147,173,0.9)'
  ctx.font = `600 22px ${MONO}`
  ctx.textAlign = 'left'
  ctx.fillText('SERIOUS.PNG', x - 10, yA + size + 42)

  /* —— 一键开嬷分割带 —— */
  const yMid = yA + size + 58
  ctx.save()
  ctx.translate(W / 2, yMid + 26)
  ctx.rotate(-0.028)
  ctx.fillStyle = '#ff4d8d'
  ctx.fillRect(-W / 2 - 20, -26, W + 40, 52)
  ctx.fillStyle = '#16101c'
  ctx.font = `900 30px ${ZH}`
  ctx.textAlign = 'center'
  ctx.fillText('⚡ 一 键 开 嬷 ⚡', 0, 11)
  ctx.restore()

  /* —— 开嬷后 —— */
  const yB = yMid + 88
  ctx.fillStyle = '#ff9edb'
  ctx.font = `800 34px ${ZH}`
  ctx.textAlign = 'center'
  ctx.fillText('开嬷后 · 已被宠化', W / 2, yB - 12)
  ctx.fillStyle = '#161226'
  ctx.fillRect(x - 16, yB + 4, size + 32, size + 32)
  ctx.strokeStyle = '#ff4d8d'
  ctx.lineWidth = 4
  ctx.strokeRect(x - 16, yB + 4, size + 32, size + 32)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(input.sprite, x, yB + 20, size, size)
  ctx.imageSmoothingEnabled = true
  drawStickers(ctx, input.stickers, x, yB + 20, size)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#f5eee0'
  ctx.font = `900 40px ${ZH}`
  ctx.fillText(`嬷力值 ${input.power} · 「${input.level}」`, W / 2, yB + size + 88)

  ctx.fillStyle = '#c9c2d8'
  ctx.font = `500 26px ${ZH}`
  const lines = wrapText(ctx, `“${input.quip}”`, W - 180)
  lines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, W / 2, yB + size + 130 + i * 38)
  })

  return c
}

/* ================= 模板 3：嬷嬷档案卡（角色户口页） ================= */

function statBar(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: number,
  x: number,
  y: number,
  w: number,
  color: string,
): void {
  ctx.textAlign = 'left'
  ctx.fillStyle = '#9b93ad'
  ctx.font = `700 24px ${ZH}`
  ctx.fillText(label, x, y)
  ctx.fillStyle = '#100d1d'
  ctx.fillRect(x, y + 14, w, 20)
  ctx.strokeStyle = '#2c2440'
  ctx.lineWidth = 3
  ctx.strokeRect(x, y + 14, w, 20)
  ctx.fillStyle = color
  ctx.fillRect(x + 3, y + 17, Math.max(4, (w - 6) * Math.min(1, value / 100)), 14)
  ctx.fillStyle = '#f5eee0'
  ctx.font = `700 22px ${MONO}`
  ctx.textAlign = 'right'
  ctx.fillText(String(value), x + w + 56, y + 32)
}

export function renderDossierCard(input: CardInput): HTMLCanvasElement {
  const { c, ctx } = baseCanvas()
  if (!ctx) return c
  const p = input.profile

  ctx.fillStyle = '#0e0c16'
  ctx.fillRect(0, 0, W, H)
  /* 档案纸网格 */
  ctx.strokeStyle = 'rgba(184,240,74,0.05)'
  ctx.lineWidth = 1
  for (let gx = 0; gx < W; gx += 30) {
    ctx.beginPath()
    ctx.moveTo(gx, 0)
    ctx.lineTo(gx, H)
    ctx.stroke()
  }
  scanlines(ctx)
  ctx.strokeStyle = '#b8f04a'
  ctx.lineWidth = 5
  ctx.strokeRect(24, 24, W - 48, H - 48)
  ctx.strokeStyle = 'rgba(255,77,141,0.45)'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, W - 80, H - 80)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#b8f04a'
  ctx.font = `600 25px ${MONO}`
  ctx.fillText('▚ 嬷嬷户口调查科 · 认证档案', 72, 106)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ff9edb'
  ctx.fillText(`NO.${p.dossierNo}`, W - 72, 106)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#f5eee0'
  ctx.font = `900 56px ${ZH}`
  ctx.fillText(p.name, 72, 186)

  /* 体质 / 声线徽章 */
  const chips = [`体质 ${p.lineage}`, `声线 ${p.voiceLabel}`, `风格 ${input.styleName}`]
  let chipX = 72
  ctx.font = `700 24px ${ZH}`
  for (const chip of chips) {
    const cw = ctx.measureText(chip).width + 32
    ctx.fillStyle = 'rgba(255,77,141,0.14)'
    ctx.fillRect(chipX, 212, cw, 44)
    ctx.strokeStyle = '#ff4d8d'
    ctx.lineWidth = 2
    ctx.strokeRect(chipX, 212, cw, 44)
    ctx.fillStyle = '#ff9edb'
    ctx.fillText(chip, chipX + 16, 243)
    chipX += cw + 14
  }

  /* 玉照框 + 贴纸 */
  const size = 380
  const px = 72
  const py = 300
  ctx.fillStyle = '#161226'
  ctx.fillRect(px - 14, py - 14, size + 28, size + 28)
  ctx.strokeStyle = '#2c2440'
  ctx.lineWidth = 4
  ctx.strokeRect(px - 14, py - 14, size + 28, size + 28)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(input.sprite, px, py, size, size)
  ctx.imageSmoothingEnabled = true
  drawStickers(ctx, input.stickers, px, py, size)
  ctx.fillStyle = '#9b93ad'
  ctx.font = `600 22px ${MONO}`
  ctx.textAlign = 'left'
  ctx.fillText('本嬷玉照 · 已宠化处理', px, py + size + 46)

  /* 右列：嬷力值 + 四维指数 */
  const rx = px + size + 60
  const rw = W - rx - 130
  ctx.fillStyle = '#9b93ad'
  ctx.font = `600 24px ${MONO}`
  ctx.fillText('MOMO POWER', rx, py + 16)
  ctx.fillStyle = '#ff4d8d'
  ctx.font = `900 72px ${ZH}`
  ctx.fillText(String(input.power), rx, py + 88)
  ctx.fillStyle = '#ff9edb'
  ctx.font = `700 28px ${ZH}`
  ctx.fillText(`「${input.level}」`, rx, py + 130)

  statBar(ctx, '高冷指数', p.aloof, rx, py + 180, rw, '#7df6ff')
  statBar(ctx, '活泼指数', p.lively, rx, py + 252, rw, '#ffd166')
  statBar(ctx, '精力', input.care.energy, rx, py + 324, rw, '#b8f04a')
  statBar(ctx, '亲密度', input.care.bond, rx, py + 396, rw, '#ff4d8d')

  /* 主色谱 */
  ctx.textAlign = 'left'
  ctx.fillStyle = '#9b93ad'
  ctx.font = `700 24px ${ZH}`
  ctx.fillText('主色谱', px, 770)
  p.palette.slice(0, 4).forEach((hex, i) => {
    ctx.fillStyle = hex
    ctx.fillRect(px + 100 + i * 58, 746, 44, 32)
    ctx.strokeStyle = '#2c2440'
    ctx.lineWidth = 2
    ctx.strokeRect(px + 100 + i * 58, 746, 44, 32)
  })

  /* 人设标签 */
  let tagX = px
  const tagY = 812
  ctx.font = `700 25px ${ZH}`
  for (const tag of p.tags) {
    const tw = ctx.measureText(tag).width + 34
    ctx.fillStyle = 'rgba(184,240,74,0.1)'
    ctx.fillRect(tagX, tagY, tw, 46)
    ctx.strokeStyle = 'rgba(184,240,74,0.7)'
    ctx.lineWidth = 2
    ctx.strokeRect(tagX, tagY, tw, 46)
    ctx.fillStyle = '#b8f04a'
    ctx.fillText(`# ${tag}`, tagX + 17, tagY + 32)
    tagX += tw + 14
    if (tagX > W - 240) break
  }

  /* 反差设定 */
  ctx.fillStyle = '#ff4d8d'
  ctx.fillRect(px, 900, 8, 92)
  ctx.fillStyle = '#f5eee0'
  ctx.font = `600 29px ${ZH}`
  const contrastLines = wrapText(ctx, `反差设定：${p.contrast}`, W - 260)
  contrastLines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, px + 28, 934 + i * 44)
  })

  /* 口头禅 */
  ctx.fillStyle = '#c9c2d8'
  ctx.font = `500 27px ${ZH}`
  const catchLines = wrapText(ctx, `口头禅：“${p.catchphrase}”`, W - 260)
  catchLines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, px, 1036 + i * 40)
  })

  /* 认证章 */
  ctx.save()
  ctx.translate(W - 168, 1010)
  ctx.rotate(-0.24)
  ctx.strokeStyle = 'rgba(255,77,141,0.85)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(0, 0, 74, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, 62, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,77,141,0.9)'
  ctx.font = `900 30px ${ZH}`
  ctx.textAlign = 'center'
  ctx.fillText('已宠化', 0, -2)
  ctx.font = `700 18px ${MONO}`
  ctx.fillText('MOMO CERTIFIED', 0, 26)
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(245,238,224,0.55)'
  ctx.font = `500 22px ${MONO}`
  ctx.fillText('momomoniqi · 嬷嬷模拟器 · 档案由本地启发式解析生成', W / 2, H - 56)

  return c
}

/* ================= 分发 / 下载 / 文案 ================= */

export function renderCard(id: CardTemplateId, input: CardInput): HTMLCanvasElement {
  switch (id) {
    case 'duel':
      return renderDuelCard(input)
    case 'dossier':
      return renderDossierCard(input)
    default:
      return renderBadgeCard(input)
  }
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

/** 按卡模板生成传播文案 */
export function buildCardShareText(id: CardTemplateId, input: CardInput): string {
  switch (id) {
    case 'duel':
      return `开嬷前威严存档，开嬷后当场破功——反差对比卡已出，嬷力值 ${input.power}。#嬷嬷模拟器 #反差对比卡 #momomoniqi`
    case 'dossier':
      return `给「${input.profile.name}」办了张嬷嬷档案卡：体质 ${input.profile.lineage}，高冷 ${input.profile.aloof} / 活泼 ${input.profile.lively}，口头禅“${input.profile.catchphrase}” #嬷嬷模拟器 #嬷嬷档案卡 #momomoniqi`
    default:
      return buildShareText(input.power, input.level, input.quip)
  }
}
