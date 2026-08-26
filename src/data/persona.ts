import type { VoiceStyleId } from '../types'

/**
 * 入嬷登记词库：自动解析的全部内容素材（名号 / 体质 / 标签 / 反差 / 口头禅 / 声线）。
 * 内容与逻辑分离——运营侧改这里即可上新人设，不用碰 utils/analyze.ts。
 */

/** 体质谱系：文件名 / 图像特征命中关键词 → 对应体质与专属素材池 */
export interface LineageDef {
  id: string
  label: string
  /** 文件名小写包含任一关键词即命中 */
  keywords: string[]
  namePrefixes: string[]
  tags: string[]
  contrasts: string[]
  catchphrases: string[]
}

export const LINEAGES: LineageDef[] = [
  {
    id: 'palace',
    label: '宫廷系',
    keywords: ['嬷', '娘娘', '宫', '公公', '太后', '皇', '妃', 'momo'],
    namePrefixes: ['御前', '掌事', '凤仪', '慈宁', '御膳', '织造'],
    tags: ['规矩比天大', '发簪能扎人', '眼神能验货', '训话十级学者'],
    contrasts: [
      '白天训遍六宫，夜里抱着小被子听夸夸。',
      '嘴上是祖宗规矩，兜里全是桂花糖。',
      '一个眼神能定人生死，一句夸夸能定她生死。',
    ],
    catchphrases: ['成何体统！……再摸一下。', '规矩不能废，糖不能停。', '本嬷没笑，是面部抽筋。'],
  },
  {
    id: 'office',
    label: '职场系',
    keywords: ['boss', '老板', '总', '经理', 'hr', '主管', 'leader', '领导'],
    namePrefixes: ['加班', '汇报', '对齐', 'KPI', '复盘', '晨会'],
    tags: ['已读乱回大师', 'PPT 纹身', '拉通对齐狂魔', '画饼一级厨师'],
    contrasts: [
      '会上说降本增效，会后偷偷给全组点奶茶。',
      '周报写得杀气腾腾，工位摆满毛绒玩具。',
      '嘴上说这周很关键，其实已经订好了周五的火锅。',
    ],
    catchphrases: ['这个需求嬷一下就好。', '先对齐颗粒度，再对齐摸头力度。', '你先摸，晚点拉会同步。'],
  },
  {
    id: 'beast',
    label: '兽形系',
    keywords: ['cat', 'dog', '猫', '狗', '喵', '汪', 'pet', '仓鼠', '兔'],
    namePrefixes: ['毛绒', '踩奶', '拆家', '炸毛', '干饭', '掉毛'],
    tags: ['液态生物', '拆迁办主任', '干饭第一名', '装睡专业户'],
    contrasts: [
      '对外高冷限量抚摸，对你自动翻肚皮。',
      '白天是冷酷猎手，晚上是充电暖水袋。',
      '嘴上哈气威胁，尾巴已经诚实地竖起来了。',
    ],
    catchphrases: ['喵不是这个意思。', '先干饭，再营业。', '摸可以，别停。'],
  },
  {
    id: 'master',
    label: '师门系',
    keywords: ['老师', '教授', '师', 'teacher', '班主任', '导师', '教练'],
    namePrefixes: ['戒尺', '晚自习', '划重点', '点名', '拖堂', '批卷'],
    tags: ['粉笔投掷冠军', '后门透视眼', '重点全靠缘分', '拖堂三分钟教徒'],
    contrasts: [
      '课上说这题不讲了，课后偷偷给你补到天黑。',
      '嘴上说下次考不好试试看，抽屉里备着全班的奖状。',
      '训完话转身就在小本本上记：今天的崽有进步。',
    ],
    catchphrases: ['都给嬷坐直了！', '这道摸头题，送分的。', '下课！……你留一下，多摸两下。'],
  },
  {
    id: 'void',
    label: '玄学系',
    keywords: [],
    namePrefixes: ['雪顶', '铁面', '静音', '糖霜', '罗盘', '拂尘'],
    tags: ['威严结界持有者', '嘴硬心软认证', '反差萌本体', '被宠绝缘体（已失效）'],
    contrasts: [
      '表面万年冰川，实际一摸就化。',
      '气场两米八，摸头之后剩八厘米。',
      '看起来会拒绝，其实已经偷偷排好队。',
    ],
    catchphrases: ['放肆！……继续。', '本嬷不吃这套（吃的）。', '哼，勉为其难让你宠一下。'],
  },
]

/** 名号本体池（前缀来自体质，本体全局共用） */
export const NAME_CORES = ['嬷嬷', '大人', '掌事', '殿下', '督主', '阁老', '座主', '教主']

/** 名号编号后缀（拓麻式出厂编号味） */
export const NAME_SUFFIXES = ['壹号机', '贰号机', '柒号机', '玖号机', '限定款', '初号体', '典藏版', '量产型']

/** 通用补充标签（体质标签之外随机补齐） */
export const COMMON_TAGS = [
  '摸头绝缘体（谎言）',
  '威严认证过期',
  '被夸会宕机',
  '嘴硬中枢发达',
  '哄睡易感体质',
  '暴击体质持有者',
  '彩虹屁过敏（假装）',
  '糖分驱动型',
]

/* ---------- 声线 ---------- */

export interface VoiceStyleDef {
  id: VoiceStyleId
  label: string
  /** 基频 Hz */
  base: number
  /** 波形 */
  wave: OscillatorType
  /** 每音节时长（秒） */
  syllable: number
  /** 音高随机游走幅度（相对基频） */
  wander: number
}

/** 五档档案声线：嬷语开麦用它现场合成怪声（自研音色，零采样） */
export const VOICE_STYLES: VoiceStyleDef[] = [
  { id: 'court', label: '威严低音炮', base: 150, wave: 'square', syllable: 0.11, wander: 0.18 },
  { id: 'fizzy', label: '碳酸气泡音', base: 460, wave: 'triangle', syllable: 0.07, wander: 0.4 },
  { id: 'gravel', label: '砂纸烟嗓', base: 210, wave: 'sawtooth', syllable: 0.1, wander: 0.24 },
  { id: 'silky', label: '丝绸电台音', base: 300, wave: 'sine', syllable: 0.12, wander: 0.14 },
  { id: 'sprite', label: '像素精灵音', base: 620, wave: 'square', syllable: 0.06, wander: 0.5 },
]

export function getVoiceStyle(id: VoiceStyleId): VoiceStyleDef {
  return VOICE_STYLES.find((v) => v.id === id) ?? VOICE_STYLES[0]
}

/* ---------- 嬷语字幕素材 ---------- */

/** 嬷语音节池（拼出无意义怪话） */
export const MOMO_SYLLABLES = ['嘟', '噜', '咕', '哔', '呣', '叽', '啵', '咔', '呜', '哞', '嗒', '啾']

/** 嬷语「翻译」池：字幕气泡里的官方翻译 */
export const MOMO_TRANSLATIONS = [
  '今天也要被宠亿遍。',
  '朕准你继续摸。',
  '这一段翻译不出来，反正是害羞了。',
  '警告：糖分不足，请立即投喂。',
  '本嬷心情尚可，卡可以出了。',
  '刚才那下摸得很专业，记功一次。',
  '别停，本嬷还没听够彩虹屁。',
  '嬷语十级内容，人类不配知道。',
]

/* ---------- 直戳互动文案 ---------- */

export type PokeZone = 'crown' | 'face' | 'robe'

export const POKE_ZONE_LABELS: Record<PokeZone, string> = {
  crown: '顶戴区',
  face: '面门区',
  robe: '衣摆区',
}

export const POKE_QUIPS: Record<PokeZone, string[]> = {
  crown: [
    '顶戴被戳歪三度，威严掉线三秒。',
    '发髻警报：有人在薅嬷嬷的天线。',
    '头顶信号增强，接收到一条夸夸。',
  ],
  face: [
    '面门被戳，职业假笑当场卡帧。',
    '脸颊弹性测试通过，回弹 0.3 秒。',
    '嬷嬷腮帮子里藏的糖差点被戳出来。',
  ],
  robe: [
    '衣摆被戳出褶子，嬷嬷假装是新款式。',
    '下摆传来戳戳，嬷嬷决定当没发生。',
    '戳到了嬷嬷的私房糖口袋，装傻中。',
  ],
}

/** 连击里程碑（连续快戳达到次数时触发） */
export const COMBO_MILESTONES: Array<{ count: number; text: string }> = [
  { count: 5, text: '五连戳！嬷嬷的威严出现蜂窝状裂纹。' },
  { count: 10, text: '十连戳！！嬷嬷已进入贤者半瘫模式。' },
  { count: 20, text: '二十连戳！！！史官请求加班记录本场面。' },
]

/** 长按捏住的文案 */
export const HOLD_QUIPS = [
  '被捏住了。嬷嬷表示这是本宫允许的。',
  '长按锁定！嬷嬷挣扎了 0 秒就放弃了。',
  '捏住不放……嬷嬷的脸正在缓慢发面。',
]
