import type { ModerationCategoryId, ModerationHit, ModerationResult } from '../types'

/**
 * 客户端启发式内容审核（发布前强制）。
 *
 * ⚠️ 局限性声明：这是纯前端的黑名单过滤，仅作为 MVP 的第一道闸门，
 * 可被绕过、覆盖面有限。正式上线必须接入服务端文本/图像审核 API + 人工复审，
 * 详见 docs/PRODUCT_PLAN.md「审核机制」章节。
 */

interface CategoryDef {
  id: ModerationCategoryId
  label: string
  /** 黑名单词（运营可持续追加；比对前会做归一化） */
  words: string[]
}

/** 可配置黑名单：按类别维护，命中任意一个即拒绝 */
const CATEGORIES: CategoryDef[] = [
  {
    id: 'politics',
    label: '政治敏感',
    words: ['政治敏感', '颠覆国家', '暴恐', '恐怖袭击', '反动标语', '分裂国家', '邪教'],
  },
  {
    id: 'figure',
    label: '真实公众人物 / 敏感称呼',
    words: ['总书记', '国家主席', '国务院总理', '国家领导人', '中央领导', '国家元首'],
  },
  {
    id: 'insult',
    label: '侮辱谩骂',
    words: ['傻逼', '智障', '废物', '贱人', '去死', '畜生', '狗东西', 'nmsl'],
  },
  {
    id: 'sexual',
    label: '低俗色情',
    words: ['色情', '裸照', '约炮', '卖淫', '嫖娼', 'porn'],
  },
  {
    id: 'illegal',
    label: '违法违规',
    words: ['赌博', '毒品', '枪支买卖', '诈骗', '代开发票', '洗钱', '传销'],
  },
]

/**
 * 归一化：小写、全角转半角、去空白/常见标点/零宽字符，
 * 防止「傻 逼」「傻·逼」这类插入符号的简单绕过。
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[\s\u200b-\u200f\ufeff.,·、。，_\-*#@!?~^+=/\\|(){}[\]<>'"：:;；]+/g, '')
}

function maskWord(word: string): string {
  if (word.length <= 1) return '*'
  return word[0] + '*'.repeat(word.length - 1)
}

/**
 * 审核一组具名文本字段（标题 / 昵称 / 简介 / 自定义文案……）。
 * 返回通过，或带命中类别的拒绝结果（敏感词打码回显，不展示全词）。
 */
export function moderateFields(fields: Array<{ label: string; value: string }>): ModerationResult {
  const hits: ModerationHit[] = []
  for (const field of fields) {
    const normalized = normalize(field.value)
    if (!normalized) continue
    for (const category of CATEGORIES) {
      for (const word of category.words) {
        if (normalized.includes(normalize(word))) {
          hits.push({
            field: field.label,
            category: category.id,
            categoryLabel: category.label,
            maskedWord: maskWord(word),
          })
          break // 同一字段同一类别只报一次
        }
      }
    }
  }
  return hits.length === 0 ? { ok: true } : { ok: false, hits }
}
