import { getPreset } from './presets'
import { getDefaultSource } from '../utils/defaultMomo'
import { pixelate } from '../utils/pixelate'
import type { CommunityPost, PostKind, StyleId, WorkflowRecipe } from '../types'

interface SeedDef {
  id: string
  kind?: PostKind
  title: string
  author: string
  blurb: string
  styleId: StyleId
  resolution: number
  power: number
  level: string
  likes: number
  cheers: number
  recipe?: WorkflowRecipe
}

/** 内置种子同人作品：首次访问社区就有内容可刷 */
const SEED_DEFS: SeedDef[] = [
  {
    id: 'seed-tama',
    title: '拓麻纪念版·电子嬷一号机',
    author: '像素考古队',
    blurb: '按 1997 年液晶蛋的规格复刻，喂食三次会打嗝。',
    styleId: 'tama',
    resolution: 24,
    power: 888,
    level: '嬷界扛把子',
    likes: 214,
    cheers: 96,
  },
  {
    id: 'seed-gameboy',
    title: '御膳房主厨嬷',
    author: '小翠子',
    blurb: '绿屏四色，掌勺四十年，一勺定嬷心。',
    styleId: 'gameboy',
    resolution: 40,
    power: 520,
    level: '皇家御用嬷',
    likes: 168,
    cheers: 42,
  },
  {
    id: 'seed-cyber',
    title: '赛博夜巡嬷 2077',
    author: 'NEON_MOMO',
    blurb: '霓虹雨里巡宫，义体手也要摸头。',
    styleId: 'cyberpink',
    resolution: 64,
    power: 1024,
    level: '宇宙第一嬷',
    likes: 305,
    cheers: 133,
  },
  {
    id: 'seed-manga',
    title: '热血漫分镜·嬷之觉醒',
    author: '周四更新的鸽',
    blurb: '第 42 话：她摘下发簪，说这一 rua 由我来接。',
    styleId: 'manga',
    resolution: 48,
    power: 300,
    level: '皇家御用嬷',
    likes: 97,
    cheers: 28,
  },
  {
    id: 'seed-sticker',
    title: '手账贴纸嬷·春日限定',
    author: '软糖罐子',
    blurb: '粉彩配色，撕下来贴在作业本上就能回血。',
    styleId: 'sticker',
    resolution: 32,
    power: 156,
    level: '持证上岗嬷',
    likes: 142,
    cheers: 57,
  },
  {
    id: 'seed-flow-crt',
    kind: 'flow',
    title: '配方 | 赛博夜巡工作流',
    author: 'NEON_MOMO',
    blurb: '抠图开到 55，赛博粉 + 64 格，出反差对比卡最炸。',
    styleId: 'cyberpink',
    resolution: 64,
    power: 0,
    level: '路人嬷',
    likes: 188,
    cheers: 71,
    recipe: {
      cutout: true,
      tolerance: 55,
      styleId: 'cyberpink',
      resolution: 64,
      stickerIds: ['shades', 'fire'],
      cardTemplate: 'duel',
    },
  },
  {
    id: 'seed-flow-tama',
    kind: 'flow',
    title: '配方 | 液晶蛋档案流',
    author: '像素考古队',
    blurb: '拓麻液晶 24 格粗颗粒，配档案卡，一秒回 1997。',
    styleId: 'tama',
    resolution: 24,
    power: 0,
    level: '路人嬷',
    likes: 96,
    cheers: 40,
    recipe: {
      cutout: true,
      tolerance: 40,
      styleId: 'tama',
      resolution: 24,
      stickerIds: ['crown', 'zzz'],
      cardTemplate: 'dossier',
    },
  },
]

/** 用内置像素嬷嬷 + 不同风格预设现场渲染种子作品缩略图 */
export function buildSeedPosts(): CommunityPost[] {
  const base = Date.now() - 1000 * 60 * 60 * 24
  return SEED_DEFS.map((def, i) => {
    const sprite = pixelate(getDefaultSource(), def.resolution, getPreset(def.styleId))
    return {
      id: def.id,
      kind: def.kind ?? 'art',
      title: def.title,
      author: def.author,
      blurb: def.blurb,
      thumb: sprite.toDataURL(),
      styleName: getPreset(def.styleId).name,
      power: def.power,
      level: def.level,
      likes: def.likes,
      cheers: def.cheers,
      likedByMe: false,
      mine: false,
      seed: true,
      ts: base - i * 1000 * 60 * 37,
      recipe: def.recipe,
    }
  })
}
