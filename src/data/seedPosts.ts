import { getPreset } from './presets'
import { drawCharacter, getCharacter } from './characters'
import { getDefaultSource } from '../utils/defaultMomo'
import { pixelate } from '../utils/pixelate'
import type { CommunityPost, StyleId, ToneId } from '../types'

interface SeedDef {
  id: string
  title: string
  author: string
  blurb: string
  /** 原创角色库 id；缺省用内置像素嬷嬷 */
  characterId?: string
  /** 展示用角色名（解析流水线产出示例） */
  charName?: string
  styleId: StyleId
  tone: ToneId
  resolution: number
  power: number
  level: string
  likes: number
  cheers: number
}

/** 内置种子同人作品：嬷向 / 攻向都有，首次访问社区就有内容可刷、可二创 */
const SEED_DEFS: SeedDef[] = [
  {
    id: 'seed-tama',
    title: '拓麻纪念版·电子嬷一号机',
    author: '像素考古队',
    blurb: '按 1997 年液晶蛋的规格复刻，喂食三次会打嗝。',
    styleId: 'tama',
    tone: 'momo',
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
    characterId: 'sugar-momo',
    styleId: 'gameboy',
    tone: 'momo',
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
    characterId: 'cyber-mimo',
    styleId: 'cyberpink',
    tone: 'momo',
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
    characterId: 'iron-gugu',
    styleId: 'manga',
    tone: 'momo',
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
    tone: 'momo',
    resolution: 32,
    power: 156,
    level: '持证上岗嬷',
    likes: 142,
    cheers: 57,
  },
  {
    id: 'seed-ceo',
    title: '全城限定·龙傲天总裁被rua实录',
    author: '攻控研究所',
    blurb: '低音炮说闹够了，手腕根本没松——攻壳粉碎机模板一键复刻。',
    characterId: 'ceo-gong',
    styleId: 'cyberpink',
    tone: 'gong',
    resolution: 48,
    power: 999,
    level: '嬷界扛把子',
    likes: 412,
    cheers: 208,
  },
  {
    id: 'seed-sword',
    title: '白切黑剑客·耳根红温警告',
    author: '仗剑摸头人',
    blurb: '一比特网点也挡不住他破功，第 3 步夸夸必出暴击。',
    characterId: 'sword-gong',
    styleId: 'manga',
    tone: 'gong',
    resolution: 48,
    power: 666,
    level: '嬷界扛把子',
    likes: 289,
    cheers: 145,
  },
  {
    id: 'seed-captain',
    title: '星际舰长丢球实测：提前三秒到位',
    author: '曲率通勤族',
    blurb: '掌机绿屏里玩接球，制服禁欲系当场变大型犬。',
    characterId: 'captain-gong',
    styleId: 'gameboy',
    tone: 'gong',
    resolution: 40,
    power: 384,
    level: '皇家御用嬷',
    likes: 173,
    cheers: 66,
  },
  {
    id: 'seed-petpet',
    title: '小猫摸头杀连击实录：第 3 下她自己凑过来了',
    author: '摸头杀研究所',
    blurb: '「小猫摸头杀连击」模板一键复刻：摸头杀×3 → 顺毛 → 贴贴，铁面姑姑喉咙里的呼噜声已传出宫墙。',
    characterId: 'iron-gugu',
    charName: '铁面姑姑',
    styleId: 'sticker',
    tone: 'momo',
    resolution: 40,
    power: 777,
    level: '嬷界扛把子',
    likes: 486,
    cheers: 231,
  },
  {
    id: 'seed-suckcat',
    title: '吸攻实测：前调禁欲后调奶味',
    author: '贴贴永动机',
    blurb: '上传图自动解析出「墨阁主」，抠背景成透明立绘——吸猫贴贴循环跑完，白切黑当场融化成大型猫科。',
    characterId: 'sword-gong',
    charName: '墨阁主',
    styleId: 'cyberpink',
    tone: 'gong',
    resolution: 48,
    power: 892,
    level: '嬷界扛把子',
    likes: 358,
    cheers: 190,
  },
]

/** 用原创角色 / 内置像素嬷嬷 + 风格预设现场渲染种子作品缩略图 */
export function buildSeedPosts(): CommunityPost[] {
  const base = Date.now() - 1000 * 60 * 60 * 24
  return SEED_DEFS.map((def, i) => {
    const character = def.characterId ? getCharacter(def.characterId) : undefined
    const source = character ? drawCharacter(character, 16) : getDefaultSource()
    const sprite = pixelate(source, def.resolution, getPreset(def.styleId))
    return {
      id: def.id,
      title: def.title,
      author: def.author,
      blurb: def.blurb,
      thumb: sprite.toDataURL(),
      styleName: getPreset(def.styleId).name,
      styleId: def.styleId,
      tone: def.tone,
      charName: def.charName,
      power: def.power,
      level: def.level,
      likes: def.likes,
      cheers: def.cheers,
      likedByMe: false,
      mine: false,
      seed: true,
      ts: base - i * 1000 * 60 * 37,
    }
  })
}
