import type { Achievement, ActionDef } from '../types'

export const ACTIONS: ActionDef[] = [
  {
    id: 'pat',
    label: '摸摸头',
    emoji: '🫳',
    particles: ['💗', '✨', '💮'],
    quips: [
      '本嬷嬷纵横宫斗四十年，今日竟栽在一记摸头上。',
      '头顶已包浆，请勿连续盘。',
      '嬷嬷表面冷漠，发髻已经开始冒粉色泡泡。',
      '摸头一次，折寿……不，增寿三年，嬷嬷说的。',
      '检测到摸头：威严 -20，可爱 +999。',
    ],
  },
  {
    id: 'rua',
    label: 'rua 一下',
    emoji: '🤏',
    particles: ['💢', '💫', '🌀'],
    quips: [
      '放肆！……再 rua 三下。',
      '脸都 rua 变形了，本宫的威严何在（并没有阻止）。',
      'rua 到起飞，嬷嬷已进入贤者模式。',
      '警告：该嬷嬷弹性超标，rua 上瘾概不负责。',
      '嬷嬷的脸：初号弹力实验体。',
    ],
  },
  {
    id: 'boop',
    label: '拍拍',
    emoji: '🖐️',
    particles: ['⭐', '💥', '🎵'],
    quips: [
      '拍一拍你的嬷嬷，她假装什么都没发生。',
      '嬷嬷被拍出了 0.5 秒的走神，罚你再拍一次。',
      '啪。嬷嬷的职业假笑裂开了一条缝。',
      '拍拍认证：此嬷手感上乘，回弹迅速。',
      '嬷嬷内心 OS：谁在敲朕的龙骨。',
    ],
  },
  {
    id: 'feed',
    label: '喂食',
    emoji: '🍡',
    particles: ['🍬', '🍡', '😋'],
    quips: [
      '嬷嬷嘴上说着不要，糖已经没了。',
      '投喂成功！嬷嬷严肃值 -10，围度 +1。',
      '这口糖的甜度，超过了嬷嬷过去六十年的总和。',
      '再喂就要打嗝了……你倒是喂啊。',
      '干饭不积极，嬷嬷有问题。本嬷没有问题。',
    ],
  },
]

export const CRIT_QUIPS = [
  '嬷力暴走！！功德 +66，嬷嬷原地转圈冒烟。',
  '触发隐藏剧情：嬷嬷笑出了声，史官连夜记载。',
  '嬷力临界！方圆十里的严肃角色集体破功。',
]

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'lv1', threshold: 50, title: '见习小嬷嬷', desc: '你已摸出新手气运' },
  { id: 'lv2', threshold: 150, title: '持证上岗嬷', desc: '嬷务局连夜为你补办证书' },
  { id: 'lv3', threshold: 300, title: '皇家御用嬷', desc: '宫里传话：手法很正' },
  { id: 'lv4', threshold: 600, title: '嬷界扛把子', desc: '各路嬷嬷排队等你 rua' },
  { id: 'lv5', threshold: 1000, title: '宇宙第一嬷', desc: '嬷力辐射已越过大气层' },
]

/** 根据嬷力值取当前段位名 */
export function levelName(power: number): string {
  let name = '路人嬷'
  for (const a of ACHIEVEMENTS) {
    if (power >= a.threshold) name = a.title
  }
  return name
}

export function nextThreshold(power: number): number | null {
  for (const a of ACHIEVEMENTS) {
    if (power < a.threshold) return a.threshold
  }
  return null
}

export function randomOf<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}
