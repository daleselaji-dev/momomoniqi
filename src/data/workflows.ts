import type { ActionId, ToneId } from '../types'

/**
 * 内置爆款工作流模板：一键装载「语气 + 动作脚本」，
 * 让新用户 10 秒拿到有传播力的连招画面。蹭热点只需追加模板。
 */
export interface WorkflowTemplate {
  id: string
  name: string
  desc: string
  tone: ToneId
  script: ActionId[]
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tpl-chongni',
    name: '宠溺连击',
    desc: '摸头三连接夸夸，威严当场清零',
    tone: 'momo',
    script: ['pat', 'pat', 'pat', 'praise', 'rua'],
  },
  {
    id: 'tpl-gongke',
    name: '攻壳粉碎机',
    desc: '拍拍试探 → rua 脸 → 夸到低音炮破音',
    tone: 'gong',
    script: ['boop', 'rua', 'rua', 'praise', 'praise', 'play'],
  },
  {
    id: 'tpl-hongshui',
    name: '深夜哄睡直播',
    desc: '喂饱 → 拍嗝 → 月亮下线，弹幕刷晚安',
    tone: 'momo',
    script: ['feed', 'feed', 'boop', 'sleep', 'sleep'],
  },
]

/** 二创同款时按语气推荐一套脚本 */
export function templateForTone(tone: ToneId): WorkflowTemplate {
  return WORKFLOW_TEMPLATES.find((t) => t.tone === tone) ?? WORKFLOW_TEMPLATES[0]
}
