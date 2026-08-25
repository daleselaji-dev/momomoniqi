import type { Achievement, ActionDef, ActionId, ToneDef, ToneId } from '../types'

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
  {
    id: 'sleep',
    label: '哄睡',
    emoji: '🌙',
    particles: ['💤', '🌙', '⭐'],
    quips: [
      '嬷嬷嘴硬说不困，鼾声已传三条街。',
      '哄睡成功。宫里传闻：嬷嬷抱着小被子打呼。',
      '本嬷只是闭目养神……zzZ……养神……zzzZZ。',
      '梦话记录：再rua……朕就……不生气了……',
      '精力充电中，请勿拔线，谢谢配合。',
    ],
  },
  {
    id: 'praise',
    label: '夸夸',
    emoji: '📣',
    particles: ['🌟', '👏', '💖'],
    quips: [
      '被夸后的嬷嬷原地转了三圈，假装是在巡视。',
      '彩虹屁命中要害，嬷嬷耳根红温 +100℃。',
      '嬷嬷：休得胡言！（默默记进小本本）',
      '夸夸生效：威严外壳出现蜂窝状酥脆裂纹。',
      '史官记载：这一天，嬷嬷被夸破功，笑纹存档。',
    ],
  },
  {
    id: 'play',
    label: '丢球',
    emoji: '🎾',
    particles: ['🎾', '⚡', '😆'],
    quips: [
      '嬷嬷提裙狂奔接球，仪态碎了一地也顾不上捡。',
      '接球成功率 100%，嬷嬷表示这叫宫廷礼仪必修课。',
      '球还没落地，嬷嬷已就位——这不合理，但很可爱。',
      '玩球半刻钟，嬷嬷体力条见底，嘴角弧度封顶。',
      '警告：该嬷嬷已进入撒欢模式，拉都拉不住。',
    ],
  },
]

export const CRIT_QUIPS = [
  '嬷力暴走！！功德 +66，嬷嬷原地转圈冒烟。',
  '触发隐藏剧情：嬷嬷笑出了声，史官连夜记载。',
  '嬷力临界！方圆十里的严肃角色集体破功。',
]

/* ---------- 语气包：嬷向（默认，即 ACTIONS 自带文案）/ 攻向 ---------- */

export const TONES: ToneDef[] = [
  { id: 'momo', name: '嬷向', short: '嬷', tagline: '威严外壳，宠一下就破功' },
  { id: 'gong', name: '攻向', short: '攻', tagline: '低音炮高冷壳，反差裂开' },
]

export function getTone(id: ToneId): ToneDef {
  return TONES.find((t) => t.id === id) ?? TONES[0]
}

/** 攻向文案池：同一批动作换一套「高冷崩坏」语气，蹭攻系二创热点只改这里 */
const GONG_QUIPS: Record<ActionId, string[]> = {
  pat: [
    '摸头？本总裁的发型价值一个亿……再摸一次。',
    '这只手，允许它在头顶停留三秒。三秒之后——续费。',
    '低音炮警告：再摸，就把你写进遗嘱第一顺位。',
    '攻气外泄 0.3 秒，形象管理部连夜加班。',
    '他垂眸轻笑：胆子不小。（耳朵红了）',
  ],
  rua: [
    'rua 谁呢？……没说停。',
    '脸被 rua 变形的瞬间，股价涨停了。',
    '他握住你的手腕，声音低哑：闹够了？（并没有松开）',
    '警告：该攻表面冷酷，脸部回弹参数已泄露。',
    'rua 完记得负责，本座只对你弹性开放。',
  ],
  boop: [
    '拍本座肩膀的人，全公司只有你还活着，且升职了。',
    '啪。西装第二颗纽扣应声而落，他说：拿去。',
    '被拍了一下，反手把整层楼包给你。',
    '他挑眉：胆敢偷袭？……手感不错，再来。',
    '拍拍认证：该攻外壳坚硬，内里酥麻。',
  ],
  feed: [
    '本座不吃甜……（三秒后碗空了）',
    '投喂成功：冷面攻嘴角上扬 0.5°，监控已存档。',
    '他接过糖，面无表情地说难吃，然后收进了西装内袋。',
    '喂食记录：拒绝 0 次，真香 100 次。',
    '低音炮：再喂一颗，就把糖厂买给你。',
  ],
  sleep: [
    '他说通宵是常态……三分钟后靠在你肩上睡熟了。',
    '哄睡成功：攻的防御塔全数下线，呼吸绵长。',
    '梦话监听：唔……别走……（手指勾住你袖口）',
    '全网最冷的男人，睡颜软得一塌糊涂。',
    '本座只是闭目养神……（已进入贤者睡眠第四阶段）',
  ],
  praise: [
    '夸他一句，他淡定转身，撞上了玻璃门。',
    '彩虹屁命中：低音炮当场破音，重录了三次。',
    '他说无聊……（把你的夸夸录音设成了闹钟）',
    '被夸后的攻在天台吹了十分钟风才把嘴角压下去。',
    '夸夸生效：攻壳出现裂缝，内芯是草莓味的。',
  ],
  play: [
    '丢球？幼稚。（提前三秒到达落点）',
    '他单手接球转身扣篮，西装下摆划出完美弧线。',
    '玩球十分钟，攻的领带歪了，眼睛亮得像小狗。',
    '接球成功率 100%，本座称之为商业敏锐度训练。',
    '警告：该攻已进入放风模式，理智余额不足。',
  ],
}

const GONG_CRIT_QUIPS = [
  '攻力暴走！！低音炮共振碎了三块玻璃，功德 +66。',
  '触发隐藏剧情：冷面攻当众笑出声，热搜第一实时锁定。',
  '反差临界！全城高冷人设集体崩塌，监控已流出。',
]

/** 按语气取动作文案池 */
export function quipsFor(actionId: ActionId, tone: ToneId): string[] {
  if (tone === 'gong') return GONG_QUIPS[actionId]
  return ACTIONS.find((a) => a.id === actionId)?.quips ?? []
}

/** 按语气取暴击文案池 */
export function critQuipsFor(tone: ToneId): string[] {
  return tone === 'gong' ? GONG_CRIT_QUIPS : CRIT_QUIPS
}

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
