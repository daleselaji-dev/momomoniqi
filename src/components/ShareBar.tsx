import { useState } from 'react'
import { buildShareText, downloadCard, renderShareCard } from '../utils/shareCard'

interface Props {
  sprite: HTMLCanvasElement
  power: number
  level: string
  quipText: string
  styleName: string
  /** 语气话题标签（如「攻向二创」），拼进传播文案 */
  toneTag: string
  /** 角色名（解析档案 / 原创角色 / 默认嬷嬷），写进认证卡 */
  charName: string
  /** 气质标签（解析档案产出），写进认证卡 */
  charTags: string[]
  onPublish: () => void
  /** 出片动作（下载卡 / 复制文案）发生时回调：点亮工作流「出片」步骤 */
  onProduced: () => void
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 非安全上下文回退方案
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

/** 分享栏：发布到社区（先过审）/ Canvas 生成认证卡下载 PNG / 复制传播文案 */
export function ShareBar({
  sprite,
  power,
  level,
  quipText,
  styleName,
  toneTag,
  charName,
  charTags,
  onPublish,
  onProduced,
}: Props) {
  const [copied, setCopied] = useState(false)

  function handleDownload() {
    const card = renderShareCard({ sprite, power, level, quip: quipText, styleName, charName, charTags })
    downloadCard(card, `momo-card-${power}.png`)
    onProduced()
  }

  async function handleCopy() {
    const ok = await copyText(buildShareText(power, level, quipText, toneTag, charName))
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
      onProduced()
    }
  }

  return (
    <div className="share-bar">
      <button className="btn-accent" onClick={onPublish}>
        ⚑ 发布到社区（先过审）
      </button>
      <button className="btn-primary" onClick={handleDownload}>
        ⬇ 生成嬷嬷认证卡 PNG
      </button>
      <button className="btn-ghost" onClick={handleCopy}>
        {copied ? '✓ 已复制，快去发' : '⧉ 复制传播文案'}
      </button>
    </div>
  )
}
